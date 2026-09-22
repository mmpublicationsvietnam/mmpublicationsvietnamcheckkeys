# Website Check Key - The World of Grammar and Vocabulary

## Cấu trúc file
```
checkkey/
├── sql/
│   └── schema.sql        <- Chạy 1 lần trong Supabase SQL Editor
├── public/
│   ├── config.js         <- Điền URL + Anon Key của bạn vào đây
│   ├── anti-copy.js
│   ├── index.html         <- Trang cho học viên
│   ├── app.js
│   ├── admin.html         <- Trang cho quản trị viên
│   └── admin.js
└── README.md
```

## BƯỚC 1 - Tạo project Supabase
1. Vào https://supabase.com → tạo project mới (chọn region Singapore cho nhanh với người dùng VN).
2. Vào **Authentication → Providers**, đảm bảo "Email" đang bật.
   - Nếu muốn bỏ bước xác nhận email khi đăng ký (cho gọn), vào **Authentication → Settings** và tắt "Confirm email".
3. Vào **SQL Editor**, dán toàn bộ nội dung file `sql/schema.sql` và bấm **Run**.
   - File này tạo đủ 5 bảng (`profiles`, `user_devices`, `keys`, `user_unlocked_levels`, `module_content`), các hàm RPC, và toàn bộ RLS Policy.

## BƯỚC 2 - Lấy thông tin kết nối
Vào **Project Settings → API**, copy:
- `Project URL` → dán vào biến `SUPABASE_URL` trong `public/config.js`
- `anon public` key → dán vào biến `SUPABASE_ANON_KEY` trong `public/config.js`

## BƯỚC 3 - Tạo tài khoản Admin đầu tiên
1. Mở `index.html`, đăng ký 1 tài khoản bình thường bằng email bạn dùng để quản trị.
2. Vào Supabase → **Table Editor → profiles**, tìm dòng có email đó.
3. Sửa cột `is_admin` thành `true`, lưu lại.
4. Giờ bạn có thể đăng nhập tài khoản này tại `admin.html`.

## BƯỚC 4 - Nhập nội dung đáp án
Vào `admin.html` → tab **"Nội dung Module"** → chọn Level + Module → nhập tiêu đề và nội dung
(có thể dùng HTML cơ bản như `<b>`, `<ul><li>`, `<table>`) → **Lưu nội dung**.
Cần lặp lại cho đủ 7 Level x 10 Module để học viên có đáp án để xem.

## BƯỚC 5 - Tạo và phân phối mã Key
Vào `admin.html` → tab **"Tạo Key"** → chọn Level, nhập số lượng (ví dụ 50 cho A1.1) →
**Tạo Key** → **Xuất CSV** để tải file danh sách mã, in lên thẻ cào hoặc gửi cho đại lý.

## BƯỚC 6 - Đưa website lên mạng (deploy)
Vì đây là web tĩnh (HTML/CSS/JS thuần), bạn có thể deploy miễn phí bằng:
- **Netlify / Vercel / Cloudflare Pages**: kéo thả toàn bộ thư mục `public/` vào là chạy.
- Hoặc bất kỳ hosting tĩnh nào (kể cả GitHub Pages).
Không cần backend server riêng vì mọi logic nghiệp vụ (giới hạn thiết bị, kiểm tra mã,
mở khóa module theo tuần) đều được xử lý an toàn ngay trong Supabase (RPC + RLS).

## Cách vận hành đã cài đặt sẵn trong code
- **Giới hạn 2 thiết bị/tài khoản**: mỗi trình duyệt tự sinh 1 `device_id` ngẫu nhiên
  lưu trong `localStorage`. Mỗi lần đăng nhập, hệ thống gọi hàm `register_device()`
  trong Supabase; nếu tài khoản đã có 2 thiết bị khác, đăng nhập sẽ bị từ chối.
  ⚠️ Lưu ý thật: nếu người dùng xóa `localStorage` hoặc dùng trình duyệt ẩn danh,
  hệ thống sẽ coi đó là thiết bị mới. Đây là giới hạn tự nhiên của giải pháp
  thuần client-side; nếu cần chặt hơn, cân nhắc thêm xác minh qua số điện thoại/OTP.
- **Mở khóa Module theo tuần**: được tính bằng công thức "cứ 7 ngày mở thêm 2 Module",
  và được **enforce ở cả 2 lớp**: (1) giao diện chỉ hiển thị nút xem cho Module đã tới
  hạn, và (2) RLS Policy trên bảng `module_content` sẽ **từ chối trả dữ liệu** nếu
  Module đó chưa tới ngày mở, kể cả khi ai đó cố gọi thẳng API mà bỏ qua giao diện.
- **Chống Leak**: `anti-copy.js` tắt click phải, chặn bôi đen, chặn F12/Ctrl+Shift+I/Ctrl+U,
  và phủ watermark động chứa email người dùng lên vùng xem đáp án. Đây là các biện
  pháp răn đe ở mức trình duyệt — không có giải pháp client-side nào chặn được 100%
  việc chụp màn hình/quay video, nên watermark định danh email là lớp bảo vệ quan
  trọng nhất (giúp truy vết nếu nội dung bị phát tán).

## Các việc bạn có thể cần làm thêm (ngoài phạm vi yêu cầu ban đầu)
- Trang cho phép người dùng tự gỡ bớt thiết bị cũ (hiện tại bảng `user_devices` đã
  có sẵn dữ liệu, chỉ cần thêm 1 màn hình liệt kê + nút xoá + policy delete).
- Quên mật khẩu / đổi mật khẩu (dùng `supabaseClient.auth.resetPasswordForEmail()`).
- Thông báo qua email khi có Module mới mở khóa (dùng Supabase Edge Functions + Cron).
