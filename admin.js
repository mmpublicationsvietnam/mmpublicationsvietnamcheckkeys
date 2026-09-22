// =====================================================================
// admin.js - LOGIC TRANG QUẢN TRỊ
// Phụ thuộc: config.js (supabaseClient, LEVELS, TOTAL_MODULES)
// =====================================================================

let lastGeneratedRows = []; // [{code, level_code}] của lần tạo Key gần nhất

// =====================================================================
// ĐĂNG NHẬP ADMIN
// =====================================================================

async function adminLogin() {
  const email = document.getElementById("admin-email-input").value.trim();
  const password = document.getElementById("admin-password-input").value;
  const errorEl = document.getElementById("admin-login-error");
  errorEl.textContent = "";

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    errorEl.textContent = "Đăng nhập thất bại: " + error.message;
    return;
  }

  // Kiểm tra quyền admin qua hàm RPC check_is_admin (whitelist email trên Supabase)
  const { data: isAdmin, error: adminCheckError } = await supabaseClient.rpc("check_is_admin");

  if (adminCheckError || isAdmin !== true) {
    errorEl.textContent = "Tài khoản này không có quyền quản trị.";
    await supabaseClient.auth.signOut();
    return;
  }

  document.getElementById("admin-login-screen").classList.add("hidden");
  document.getElementById("admin-panel").classList.remove("hidden");
  document.getElementById("admin-user-box").classList.remove("hidden");
  document.getElementById("admin-user-box").classList.add("flex");
  document.getElementById("admin-email").textContent = data.user.email;

  populateLevelSelects();
}

async function adminLogout() {
  await supabaseClient.auth.signOut();
  document.getElementById("admin-panel").classList.add("hidden");
  document.getElementById("admin-user-box").classList.add("hidden");
  document.getElementById("admin-login-screen").classList.remove("hidden");
}

async function initAdminSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session && data.session.user) {
    const { data: isAdmin, error: adminCheckError } = await supabaseClient.rpc("check_is_admin");
    if (!adminCheckError && isAdmin === true) {
      document.getElementById("admin-login-screen").classList.add("hidden");
      document.getElementById("admin-panel").classList.remove("hidden");
      document.getElementById("admin-user-box").classList.remove("hidden");
      document.getElementById("admin-user-box").classList.add("flex");
      document.getElementById("admin-email").textContent = data.session.user.email;
      populateLevelSelects();
      return;
    }
  }
  document.getElementById("admin-login-screen").classList.remove("hidden");
}

// =====================================================================
// ĐIỀN SẴN CÁC Ô CHỌN LEVEL / MODULE
// =====================================================================

function populateLevelSelects() {
  const genSelect = document.getElementById("gen-level");
  const filterSelect = document.getElementById("filter-level");
  const contentSelect = document.getElementById("content-level");
  const moduleSelect = document.getElementById("content-module");

  LEVELS.forEach((lvl) => {
    genSelect.appendChild(new Option(`${lvl.label} (${lvl.subtitle})`, lvl.code));
    filterSelect.appendChild(new Option(`${lvl.label} (${lvl.subtitle})`, lvl.code));
    contentSelect.appendChild(new Option(`${lvl.label} (${lvl.subtitle})`, lvl.code));
  });

  for (let m = 1; m <= TOTAL_MODULES; m++) {
    moduleSelect.appendChild(new Option(`Module ${m}`, m));
  }

  loadContentEditorFields(); // tải nội dung sẵn có (nếu có) cho lựa chọn mặc định
}

// =====================================================================
// TAB 1: TẠO KEY HÀNG LOẠT
// =====================================================================

async function generateKeys() {
  const levelCode = document.getElementById("gen-level").value;
  const quantity = parseInt(document.getElementById("gen-quantity").value, 10);
  const note = document.getElementById("gen-note").value.trim() || null;
  const statusEl = document.getElementById("generate-status");
  statusEl.textContent = "Đang tạo...";

  const { data, error } = await supabaseClient.rpc("admin_generate_keys", {
    p_level_code: levelCode,
    p_quantity: quantity,
    p_note: note,
  });

  if (error) {
    statusEl.textContent = "Lỗi: " + error.message;
    return;
  }

  // data trả về là mảng các chuỗi code (setof text)
  lastGeneratedRows = data.map((code) => ({ code, level_code: levelCode }));
  statusEl.textContent = `Đã tạo thành công ${lastGeneratedRows.length} mã.`;

  document.getElementById("generate-count").textContent = lastGeneratedRows.length;
  const tbody = document.getElementById("generate-table-body");
  tbody.innerHTML = lastGeneratedRows
    .map((r) => `<tr><td>${r.code}</td><td>${r.level_code}</td></tr>`)
    .join("");
  document.getElementById("generate-result").classList.remove("hidden");
}

function exportGeneratedCsv() {
  exportRowsToCsv(lastGeneratedRows.map((r) => ({ code: r.code, level_code: r.level_code })), "keys_moi_tao.csv");
}

// =====================================================================
// TAB 2: DANH SÁCH KEY + LỌC + XUẤT CSV
// =====================================================================

let lastListedRows = [];

async function loadKeyList() {
  const levelFilter = document.getElementById("filter-level").value;
  const statusFilter = document.getElementById("filter-status").value;

  let query = supabaseClient
    .from("keys")
    .select("code, level_code, is_used, activated_at, user_id, profiles:user_id(email)")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (levelFilter) query = query.eq("level_code", levelFilter);
  if (statusFilter === "used") query = query.eq("is_used", true);
  if (statusFilter === "unused") query = query.eq("is_used", false);

  const { data, error } = await query;
  if (error) {
    showAdminToast("Lỗi tải danh sách: " + error.message);
    return;
  }

  lastListedRows = data || [];
  const tbody = document.getElementById("list-table-body");
  tbody.innerHTML = lastListedRows
    .map((row) => {
      const email = row.profiles ? row.profiles.email : "";
      const activated = row.activated_at ? new Date(row.activated_at).toLocaleDateString("vi-VN") : "";
      return `<tr>
        <td>${row.code}</td>
        <td>${row.level_code}</td>
        <td>${row.is_used ? "Đã dùng" : "Chưa dùng"}</td>
        <td>${email}</td>
        <td>${activated}</td>
      </tr>`;
    })
    .join("");
}

function exportListCsv() {
  const rows = lastListedRows.map((row) => ({
    code: row.code,
    level_code: row.level_code,
    status: row.is_used ? "used" : "unused",
    email: row.profiles ? row.profiles.email : "",
    activated_at: row.activated_at || "",
  }));
  exportRowsToCsv(rows, "danh_sach_key.csv");
}

// Hàm dùng chung: chuyển 1 mảng object thành file CSV và tự động tải xuống
function exportRowsToCsv(rows, filename) {
  if (!rows || rows.length === 0) {
    showAdminToast("Không có dữ liệu để xuất.");
    return;
  }
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
  ];
  const csvContent = csvLines.join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" }); // \uFEFF: BOM để Excel hiển thị đúng tiếng Việt
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// =====================================================================
// TAB 3: NHẬP / SỬA NỘI DUNG MODULE
// =====================================================================

async function loadContentEditorFields() {
  const levelCode = document.getElementById("content-level").value;
  const moduleNumber = parseInt(document.getElementById("content-module").value, 10);
  if (!levelCode || !moduleNumber) return;

  const { data } = await supabaseClient
    .from("module_content")
    .select("title, content")
    .eq("level_code", levelCode)
    .eq("module_number", moduleNumber)
    .maybeSingle();

  document.getElementById("content-title").value = data ? data.title || "" : "";
  document.getElementById("content-body").value = data ? data.content || "" : "";
}

async function saveModuleContent() {
  const levelCode = document.getElementById("content-level").value;
  const moduleNumber = parseInt(document.getElementById("content-module").value, 10);
  const title = document.getElementById("content-title").value.trim();
  const content = document.getElementById("content-body").value;
  const statusEl = document.getElementById("content-status");
  statusEl.textContent = "Đang lưu...";

  const { error } = await supabaseClient
    .from("module_content")
    .upsert(
      { level_code: levelCode, module_number: moduleNumber, title, content, updated_at: new Date().toISOString() },
      { onConflict: "level_code,module_number" }
    );

  if (error) {
    statusEl.textContent = "Lỗi khi lưu: " + error.message;
    return;
  }
  statusEl.textContent = "Đã lưu thành công.";
}

// =====================================================================
// ĐIỀU HƯỚNG TAB + TOAST NHỎ (dùng alert đơn giản cho admin)
// =====================================================================

function showAdminToast(msg) {
  alert(msg);
}

function bindTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.remove("hidden");
    });
  });
}

// =====================================================================
// GẮN SỰ KIỆN & KHỞI CHẠY
// =====================================================================

function bindAdminEvents() {
  bindTabs();
  document.getElementById("btn-admin-login").addEventListener("click", adminLogin);
  document.getElementById("btn-admin-logout").addEventListener("click", adminLogout);
  document.getElementById("btn-generate").addEventListener("click", generateKeys);
  document.getElementById("btn-export-generated").addEventListener("click", exportGeneratedCsv);
  document.getElementById("btn-filter-load").addEventListener("click", loadKeyList);
  document.getElementById("btn-export-list").addEventListener("click", exportListCsv);
  document.getElementById("btn-save-content").addEventListener("click", saveModuleContent);
  document.getElementById("content-level").addEventListener("change", loadContentEditorFields);
  document.getElementById("content-module").addEventListener("change", loadContentEditorFields);
}

bindAdminEvents();
initAdminSession();
