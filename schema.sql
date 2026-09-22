-- =====================================================================
-- SCHEMA CHO WEBSITE CHECK KEY - "THE WORLD OF GRAMMAR AND VOCABULARY"
-- Chạy toàn bộ file này trong Supabase Dashboard > SQL Editor
-- (An toàn khi chạy lại nhiều lần nhờ IF NOT EXISTS / OR REPLACE)
-- =====================================================================

-- Bật extension tạo UUID / random nếu chưa có
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. BẢNG profiles
--    Lưu thông tin mở rộng của user (Supabase Auth chỉ lưu email/password
--    trong auth.users, ta cần bảng riêng để lưu is_admin, tên hiển thị...)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Trigger: mỗi khi có user mới đăng ký (auth.users), tự tạo 1 dòng profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. BẢNG user_devices
--    Mỗi tài khoản tối đa 2 thiết bị (device_id do trình duyệt tự sinh,
--    lưu trong localStorage phía client).
-- ---------------------------------------------------------------------
-- LƯU Ý: user_id bên dưới trỏ tới public.profiles(id) (chứ không phải thẳng
-- auth.users) để Supabase/PostgREST có thể "join" lấy email hiển thị cho Admin.
-- profiles.id vốn đã là khóa ngoại 1-1 với auth.users(id) nên vẫn đảm bảo toàn vẹn.
create table if not exists public.user_devices (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  device_id       text not null,
  device_label    text,
  created_at      timestamptz not null default now(),
  last_login_at   timestamptz not null default now(),
  unique (user_id, device_id)
);

-- ---------------------------------------------------------------------
-- 3. BẢNG keys
--    Mỗi dòng là 1 mã code dùng để mở khóa 1 Level.
-- ---------------------------------------------------------------------
create table if not exists public.keys (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  level_code    text not null,          -- ví dụ: A1.1, A1.2, A2, B1, B1_PLUS, B2, C1C2
  is_used       boolean not null default false,
  user_id       uuid references public.profiles(id) on delete set null,
  activated_at  timestamptz,
  created_at    timestamptz not null default now(),
  created_by    uuid references public.profiles(id),
  batch_note    text
);

create index if not exists idx_keys_level_code on public.keys(level_code);
create index if not exists idx_keys_user_id on public.keys(user_id);

-- ---------------------------------------------------------------------
-- 4. BẢNG user_unlocked_levels
--    Ghi nhận Level nào đã được 1 user kích hoạt và từ lúc nào
--    (dùng activated_at để tính lịch mở khóa Module theo tuần).
-- ---------------------------------------------------------------------
create table if not exists public.user_unlocked_levels (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  level_code     text not null,
  activated_at   timestamptz not null default now(),
  unique (user_id, level_code)
);

-- ---------------------------------------------------------------------
-- 5. BẢNG module_content
--    Nội dung đáp án của từng Module (1-10) trong từng Level.
--    Admin nhập nội dung qua Supabase Table Editor hoặc trang admin.
--    "content" có thể chứa HTML đơn giản (bảng, in đậm...) để hiển thị.
-- ---------------------------------------------------------------------
create table if not exists public.module_content (
  id             uuid primary key default gen_random_uuid(),
  level_code     text not null,
  module_number  int  not null check (module_number between 1 and 10),
  title          text not null default '',
  content        text not null default '',
  updated_at     timestamptz not null default now(),
  unique (level_code, module_number)
);

-- =====================================================================
-- HÀM TÍNH SỐ MODULE ĐÃ MỞ (dùng chung cho RLS lẫn cho client hiển thị)
-- Quy tắc: Ngày kích hoạt mở Module 1-2 ngay lập tức.
--          Cứ mỗi 7 ngày (168 giờ) trôi qua thì mở thêm 2 Module.
--          Tối đa 10 Module.
-- =====================================================================
create or replace function public.get_unlocked_module_count(
  p_activated_at timestamptz
)
returns int
language sql
immutable
as $$
  select least(
    10,
    (floor(extract(epoch from (now() - p_activated_at)) / (7 * 86400))::int + 1) * 2
  );
$$;

-- Bản overload tiện dùng: truyền user_id + level_code, tự tra activated_at
create or replace function public.get_unlocked_module_count_for(
  p_user_id uuid,
  p_level_code text
)
returns int
language sql
stable
as $$
  select public.get_unlocked_module_count(uul.activated_at)
  from public.user_unlocked_levels uul
  where uul.user_id = p_user_id and uul.level_code = p_level_code;
$$;

-- =====================================================================
-- HÀM KIỂM TRA QUYỀN ADMIN (security definer để tránh đệ quy RLS)
-- =====================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- =====================================================================
-- RPC 1: register_device
-- Gọi ngay sau khi đăng nhập thành công để kiểm tra & đăng ký thiết bị.
-- Trả lỗi 'DEVICE_LIMIT_REACHED' nếu tài khoản đã có 2 thiết bị khác.
-- =====================================================================
create or replace function public.register_device(
  p_device_id text,
  p_device_label text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if p_device_id is null or length(trim(p_device_id)) = 0 then
    raise exception 'INVALID_DEVICE_ID';
  end if;

  -- Nếu thiết bị này đã được đăng ký trước đó -> chỉ cập nhật last_login_at
  update public.user_devices
     set last_login_at = now()
   where user_id = auth.uid() and device_id = p_device_id;

  if found then
    return;
  end if;

  -- Đếm số thiết bị hiện có của user
  select count(*) into v_count
  from public.user_devices
  where user_id = auth.uid();

  if v_count >= 2 then
    raise exception 'DEVICE_LIMIT_REACHED';
  end if;

  insert into public.user_devices (user_id, device_id, device_label)
  values (auth.uid(), p_device_id, p_device_label);
end;
$$;

-- =====================================================================
-- RPC 2: redeem_key
-- Nhập mã code để kích hoạt 1 Level. Dùng "for update" để khóa dòng,
-- tránh trường hợp 2 người dùng cùng lúc nhập trùng 1 code (race condition).
-- =====================================================================
create or replace function public.redeem_key(
  p_code text
)
returns text  -- trả về level_code đã kích hoạt
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key record;
begin
  select * into v_key
  from public.keys
  where code = upper(trim(p_code))
  for update;

  if not found then
    raise exception 'CODE_NOT_FOUND';
  end if;

  if v_key.is_used then
    raise exception 'CODE_ALREADY_USED';
  end if;

  update public.keys
     set is_used = true,
         user_id = auth.uid(),
         activated_at = now()
   where id = v_key.id;

  insert into public.user_unlocked_levels (user_id, level_code, activated_at)
  values (auth.uid(), v_key.level_code, now())
  on conflict (user_id, level_code) do nothing;

  return v_key.level_code;
end;
$$;

-- =====================================================================
-- RPC 3: admin_generate_keys
-- Chỉ admin (is_admin = true) mới gọi được. Sinh ra p_quantity mã code
-- ngẫu nhiên cho 1 level_code, trả về danh sách code vừa tạo.
-- =====================================================================
create or replace function public.admin_generate_keys(
  p_level_code text,
  p_quantity int,
  p_note text default null
)
returns setof text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_prefix text;
  i int;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN_NOT_ADMIN';
  end if;

  if p_quantity is null or p_quantity <= 0 or p_quantity > 5000 then
    raise exception 'INVALID_QUANTITY';
  end if;

  v_prefix := upper(regexp_replace(p_level_code, '[^A-Za-z0-9]', '', 'g'));

  for i in 1..p_quantity loop
    loop
      v_code := v_prefix || '-' ||
                upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4)) || '-' ||
                upper(substr(md5(random()::text || clock_timestamp()::text), 5, 4));
      exit when not exists (select 1 from public.keys where code = v_code);
    end loop;

    insert into public.keys (code, level_code, created_by, batch_note)
    values (v_code, p_level_code, auth.uid(), p_note);

    return next v_code;
  end loop;
  return;
end;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.user_devices enable row level security;
alter table public.keys enable row level security;
alter table public.user_unlocked_levels enable row level security;
alter table public.module_content enable row level security;

-- ---- profiles ----
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

-- ---- user_devices ----
drop policy if exists "devices_select_own_or_admin" on public.user_devices;
create policy "devices_select_own_or_admin"
  on public.user_devices for select
  using (user_id = auth.uid() or public.is_admin());
-- Không cho insert/update/delete trực tiếp từ client; mọi thao tác phải
-- đi qua RPC register_device (security definer) để đảm bảo giới hạn 2 thiết bị.

-- ---- keys ----
drop policy if exists "keys_select_own_or_admin" on public.keys;
create policy "keys_select_own_or_admin"
  on public.keys for select
  using (user_id = auth.uid() or public.is_admin());
-- Không có policy insert cho user thường -> chỉ admin_generate_keys (security
-- definer, chạy với quyền chủ sở hữu hàm) mới ghi được vào bảng này.
-- Cho phép admin insert trực tiếp (ví dụ import CSV thủ công) nếu cần:
drop policy if exists "keys_insert_admin" on public.keys;
create policy "keys_insert_admin"
  on public.keys for insert
  with check (public.is_admin());

-- ---- user_unlocked_levels ----
drop policy if exists "unlocked_select_own_or_admin" on public.user_unlocked_levels;
create policy "unlocked_select_own_or_admin"
  on public.user_unlocked_levels for select
  using (user_id = auth.uid() or public.is_admin());
-- Không cho insert trực tiếp; chỉ qua RPC redeem_key.

-- ---- module_content ----
-- User chỉ được xem nội dung của Module mà: (1) Level đã kích hoạt VÀ
-- (2) module_number nằm trong số Module đã tới lịch mở khóa.
drop policy if exists "module_content_select_unlocked" on public.module_content;
create policy "module_content_select_unlocked"
  on public.module_content for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.user_unlocked_levels uul
      where uul.user_id = auth.uid()
        and uul.level_code = module_content.level_code
        and module_content.module_number <=
            public.get_unlocked_module_count(uul.activated_at)
    )
  );

drop policy if exists "module_content_admin_write" on public.module_content;
create policy "module_content_admin_write"
  on public.module_content for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- GHI CHÚ QUAN TRỌNG:
-- 1. Để tạo tài khoản admin đầu tiên: đăng ký 1 tài khoản bình thường qua
--    trang web, sau đó vào Supabase > Table Editor > profiles, tìm dòng
--    có email của bạn, sửa cột is_admin thành true.
-- 2. Bảng module_content cần được nhập nội dung đáp án (title/content)
--    cho đủ 7 level x 10 module trước khi học viên có thể xem được gì.
-- =====================================================================
