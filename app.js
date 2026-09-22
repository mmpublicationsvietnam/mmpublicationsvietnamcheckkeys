// =====================================================================
// app.js - LOGIC CHÍNH CỦA TRANG NGƯỜI DÙNG
// Phụ thuộc: config.js (đã tạo supabaseClient, LEVELS, TOTAL_MODULES)
// =====================================================================

// ---------- STATE DÙNG CHUNG TRONG PHIÊN LÀM VIỆC ----------
let currentUser = null;              // { id, email }
let unlockedLevelsMap = {};          // { level_code: activated_at (Date) }
let currentLevelCode = null;         // level đang xem trong màn hình module

// =====================================================================
// TIỆN ÍCH CHUNG
// =====================================================================

// Hiện thông báo nhỏ ở góc dưới màn hình trong 2.5 giây
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add("hidden"), 2500);
}

// Lấy hoặc tạo device_id riêng cho trình duyệt này, lưu vĩnh viễn trong localStorage
function getOrCreateDeviceId() {
  const KEY = "twg_device_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
    localStorage.setItem(KEY, id);
  }
  return id;
}

// Tính số Module đã được mở khóa dựa trên thời điểm kích hoạt (activated_at).
// Công thức phải khớp 100% với hàm SQL get_unlocked_module_count trong schema.sql:
//   - Ngày kích hoạt: mở ngay 2 Module.
//   - Sau mỗi 7 ngày (168 giờ) trọn vẹn: mở thêm 2 Module.
//   - Tối đa 10 Module.
function computeUnlockedCount(activatedAtDate) {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksPassed = Math.floor((Date.now() - activatedAtDate.getTime()) / msPerWeek);
  const count = (weeksPassed + 1) * 2;
  return Math.min(10, count);
}

// Tính ngày mà 1 Module cụ thể (1-10) sẽ được mở khóa, dựa trên activated_at.
// Module lẻ/chẵn đi theo cặp: (1,2) mở ở tuần 1, (3,4) ở tuần 2, v.v.
function computeUnlockDateForModule(activatedAtDate, moduleNumber) {
  const weekIndex = Math.ceil(moduleNumber / 2); // 1..5
  const offsetDays = (weekIndex - 1) * 7;
  const d = new Date(activatedAtDate.getTime());
  d.setDate(d.getDate() + offsetDays);
  return d;
}

function formatDateVN(date) {
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// =====================================================================
// XÁC THỰC: ĐĂNG KÝ / ĐĂNG NHẬP / ĐĂNG XUẤT / KHỞI TẠO PHIÊN
// =====================================================================

function bindAuthTabs() {
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const formLogin = document.getElementById("form-login");
  const formRegister = document.getElementById("form-register");

  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("bg-[var(--ink)]", "text-white");
    tabLogin.classList.remove("bg-white");
    tabRegister.classList.remove("bg-[var(--ink)]", "text-white");
    tabRegister.classList.add("bg-white");
    formLogin.classList.remove("hidden");
    formRegister.classList.add("hidden");
  });

  tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("bg-[var(--ink)]", "text-white");
    tabRegister.classList.remove("bg-white");
    tabLogin.classList.remove("bg-[var(--ink)]", "text-white");
    tabLogin.classList.add("bg-white");
    formRegister.classList.remove("hidden");
    formLogin.classList.add("hidden");
  });
}

// Xử lý đăng ký tài khoản mới
async function handleRegister() {
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const errorEl = document.getElementById("register-error");
  const successEl = document.getElementById("register-success");
  errorEl.textContent = "";
  successEl.textContent = "";

  if (!email || password.length < 6) {
    errorEl.textContent = "Vui lòng nhập email hợp lệ và mật khẩu tối thiểu 6 ký tự.";
    return;
  }

  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    errorEl.textContent = "Đăng ký thất bại: " + error.message;
    return;
  }
  successEl.textContent = "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận (nếu được bật), sau đó đăng nhập.";
}

// Xử lý đăng nhập, sau đó kiểm tra & đăng ký giới hạn thiết bị
async function handleLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    errorEl.textContent = "Đăng nhập thất bại: " + error.message;
    return;
  }

  const deviceOk = await ensureDeviceAllowed();
  if (!deviceOk) {
    // ensureDeviceAllowed đã tự đăng xuất và báo lỗi nếu vượt giới hạn thiết bị
    return;
  }

  await enterApp(data.user);
}

// Gọi RPC register_device; nếu vượt quá 2 thiết bị thì đăng xuất và báo lỗi
async function ensureDeviceAllowed() {
  const deviceId = getOrCreateDeviceId();
  const label = navigator.userAgent.slice(0, 60);

  const { error } = await supabaseClient.rpc("register_device", {
    p_device_id: deviceId,
    p_device_label: label,
  });

  if (error) {
    if (error.message && error.message.includes("DEVICE_LIMIT_REACHED")) {
      await supabaseClient.auth.signOut();
      document.getElementById("login-error").textContent =
        "Tài khoản này đã đăng nhập trên 2 thiết bị khác. Vui lòng liên hệ quản trị viên để gỡ bớt thiết bị cũ.";
    } else {
      await supabaseClient.auth.signOut();
      document.getElementById("login-error").textContent = "Không thể xác thực thiết bị: " + error.message;
    }
    return false;
  }
  return true;
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  unlockedLevelsMap = {};
  document.getElementById("user-box").classList.add("hidden");
  document.getElementById("user-box").classList.remove("flex");
  document.getElementById("dashboard-screen").classList.add("hidden");
  document.getElementById("modules-screen").classList.add("hidden");
  document.getElementById("auth-screen").classList.remove("hidden");
}

// Chạy khi trang vừa tải: nếu đã có phiên đăng nhập hợp lệ thì vào thẳng dashboard
async function initSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session && data.session.user) {
    const deviceOk = await ensureDeviceAllowed();
    if (deviceOk) {
      await enterApp(data.session.user);
      return;
    }
  }
  document.getElementById("auth-screen").classList.remove("hidden");
}

// Sau khi xác thực + thiết bị hợp lệ: hiện dashboard, ẩn màn hình đăng nhập
async function enterApp(user) {
  currentUser = { id: user.id, email: user.email };
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("user-box").classList.remove("hidden");
  document.getElementById("user-box").classList.add("flex");
  document.getElementById("user-email").textContent = currentUser.email;
  await loadDashboard();
}

// =====================================================================
// DASHBOARD: DANH SÁCH 7 LEVEL
// =====================================================================

async function loadDashboard() {
  document.getElementById("modules-screen").classList.add("hidden");
  document.getElementById("dashboard-screen").classList.remove("hidden");

  const { data, error } = await supabaseClient
    .from("user_unlocked_levels")
    .select("level_code, activated_at")
    .eq("user_id", currentUser.id);

  if (error) {
    showToast("Lỗi tải dữ liệu: " + error.message);
    return;
  }

  unlockedLevelsMap = {};
  (data || []).forEach((row) => {
    unlockedLevelsMap[row.level_code] = new Date(row.activated_at);
  });

  renderLevelGrid();
}

function renderLevelGrid() {
  const grid = document.getElementById("level-grid");
  grid.innerHTML = "";

  LEVELS.forEach((lvl) => {
    const activatedAt = unlockedLevelsMap[lvl.code];
    const isUnlocked = !!activatedAt;
    const card = document.createElement("div");
    card.className = "level-card rounded-xl p-4 cursor-pointer" + (isUnlocked ? "" : " locked");

    if (isUnlocked) {
      const unlockedCount = computeUnlockedCount(activatedAt);
      const percent = Math.round((unlockedCount / TOTAL_MODULES) * 100);
      card.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <p class="font-display text-lg font-bold">${lvl.label} <span class="text-xs font-normal text-[#6B7280]">(${lvl.subtitle})</span></p>
          <span class="text-xs px-2 py-0.5 rounded-full bg-[var(--gold-soft)] text-[var(--gold)] font-medium">Đã kích hoạt</span>
        </div>
        <div class="progress-track h-2 rounded-full overflow-hidden mb-2">
          <div class="progress-fill h-full" style="width:${percent}%"></div>
        </div>
        <p class="text-xs text-[#6B7280]">Đang mở đến Module ${unlockedCount}/${TOTAL_MODULES} &middot; ${percent}% hoàn thành</p>
      `;
      card.addEventListener("click", () => showModulesScreen(lvl.code));
    } else {
      card.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <p class="font-display text-lg font-bold text-[#6B7280]">${lvl.label} <span class="text-xs font-normal">(${lvl.subtitle})</span></p>
          <span class="text-xs px-2 py-0.5 rounded-full bg-[#EEF0F4] text-[var(--lock)] font-medium">🔒 Chưa kích hoạt</span>
        </div>
        <p class="text-xs text-[#8890A0]">Nhấn để nhập mã kích hoạt Level này</p>
      `;
      card.addEventListener("click", () => openKeyModal(lvl.code));
    }

    grid.appendChild(card);
  });
}

// =====================================================================
// POPUP NHẬP MÃ KÍCH HOẠT
// =====================================================================

let keyModalLevelCode = null;

function openKeyModal(levelCode) {
  keyModalLevelCode = levelCode;
  const lvl = LEVELS.find((l) => l.code === levelCode);
  document.getElementById("key-modal-level").textContent = lvl ? lvl.label : levelCode;
  document.getElementById("key-input").value = "";
  document.getElementById("key-error").textContent = "";
  document.getElementById("key-modal").classList.remove("hidden");
  document.getElementById("key-modal").classList.add("flex");
}

function closeKeyModal() {
  document.getElementById("key-modal").classList.add("hidden");
  document.getElementById("key-modal").classList.remove("flex");
}

async function submitKey() {
  const code = document.getElementById("key-input").value.trim();
  const errorEl = document.getElementById("key-error");
  errorEl.textContent = "";

  if (!code) {
    errorEl.textContent = "Vui lòng nhập mã code.";
    return;
  }

  const { data, error } = await supabaseClient.rpc("redeem_key", { p_code: code });

  if (error) {
    if (error.message.includes("CODE_NOT_FOUND")) {
      errorEl.textContent = "Mã code không tồn tại. Vui lòng kiểm tra lại.";
    } else if (error.message.includes("CODE_ALREADY_USED")) {
      errorEl.textContent = "Mã code này đã được sử dụng trước đó.";
    } else {
      errorEl.textContent = "Có lỗi xảy ra: " + error.message;
    }
    return;
  }

  closeKeyModal();
  showToast(`Kích hoạt thành công Level ${data}!`);
  await loadDashboard();
}

// =====================================================================
// MÀN HÌNH DANH SÁCH 10 MODULE CỦA 1 LEVEL
// =====================================================================

function showModulesScreen(levelCode) {
  currentLevelCode = levelCode;
  const activatedAt = unlockedLevelsMap[levelCode];
  const lvl = LEVELS.find((l) => l.code === levelCode);

  document.getElementById("dashboard-screen").classList.add("hidden");
  document.getElementById("modules-screen").classList.remove("hidden");
  document.getElementById("modules-title").textContent = `${lvl.label} - ${lvl.subtitle}`;
  document.getElementById("modules-subtitle").textContent =
    `Kích hoạt ngày ${formatDateVN(activatedAt)}. Module mới tự động mở mỗi 7 ngày.`;

  const unlockedCount = computeUnlockedCount(activatedAt);
  const percent = Math.round((unlockedCount / TOTAL_MODULES) * 100);
  document.getElementById("modules-percent").textContent = percent + "%";
  document.getElementById("modules-progress-fill").style.width = percent + "%";

  const list = document.getElementById("module-list");
  list.innerHTML = "";

  for (let m = 1; m <= TOTAL_MODULES; m++) {
    const isUnlocked = m <= unlockedCount;
    const row = document.createElement("div");
    row.className = "module-row rounded-lg px-4 py-3 flex items-center justify-between border border-[#E2E6EF] " +
      (isUnlocked ? "unlocked" : "locked");

    if (isUnlocked) {
      row.innerHTML = `
        <div>
          <p class="font-medium text-sm">Module ${m}</p>
          <p class="text-xs text-[var(--green)]">Đã mở khóa</p>
        </div>
        <button class="btn-gold text-xs font-medium px-3 py-1.5 rounded-md" data-module="${m}">Xem đáp án</button>
      `;
      row.querySelector("button").addEventListener("click", () => openModuleViewer(levelCode, m));
    } else {
      const unlockDate = computeUnlockDateForModule(activatedAt, m);
      row.innerHTML = `
        <div>
          <p class="font-medium text-sm">Module ${m}</p>
          <p class="text-xs">🔒 Sẽ tự động mở khóa vào ${formatDateVN(unlockDate)}</p>
        </div>
      `;
    }
    list.appendChild(row);
  }
}

// =====================================================================
// MODAL XEM ĐÁP ÁN (kèm watermark động)
// =====================================================================

async function openModuleViewer(levelCode, moduleNumber) {
  const { data, error } = await supabaseClient
    .from("module_content")
    .select("title, content")
    .eq("level_code", levelCode)
    .eq("module_number", moduleNumber)
    .maybeSingle();

  if (error) {
    showToast("Lỗi tải nội dung: " + error.message);
    return;
  }

  const lvl = LEVELS.find((l) => l.code === levelCode);
  document.getElementById("viewer-title").textContent =
    data ? `${lvl.label} - Module ${moduleNumber}: ${data.title || ""}` : `${lvl.label} - Module ${moduleNumber}`;

  const contentEl = document.getElementById("viewer-content");
  if (data && data.content) {
    contentEl.innerHTML = data.content; // Nội dung do Admin nhập, được tin tưởng (không phải input người dùng)
  } else {
    contentEl.innerHTML = `<p class="text-[#8890A0]">Nội dung đang được cập nhật, vui lòng quay lại sau.</p>`;
  }

  renderWatermark();

  document.getElementById("viewer-modal").classList.remove("hidden");
  document.getElementById("viewer-modal").classList.add("flex");
}

// Phủ nhiều dòng watermark chứa email người dùng để răn đe việc chụp/quay màn hình
function renderWatermark() {
  const layer = document.getElementById("watermark-layer");
  layer.innerHTML = "";
  const text = `Bản quyền NXB MM - ${currentUser.email}`;
  for (let i = 0; i < 24; i++) {
    const span = document.createElement("span");
    span.textContent = text;
    layer.appendChild(span);
  }
}

function closeViewerModal() {
  document.getElementById("viewer-modal").classList.add("hidden");
  document.getElementById("viewer-modal").classList.remove("flex");
}

// =====================================================================
// GẮN SỰ KIỆN & KHỞI CHẠY
// =====================================================================

function bindEvents() {
  bindAuthTabs();
  document.getElementById("btn-login").addEventListener("click", handleLogin);
  document.getElementById("btn-register").addEventListener("click", handleRegister);
  document.getElementById("btn-logout").addEventListener("click", handleLogout);
  document.getElementById("btn-back-dashboard").addEventListener("click", loadDashboard);
  document.getElementById("btn-cancel-key").addEventListener("click", closeKeyModal);
  document.getElementById("btn-submit-key").addEventListener("click", submitKey);
  document.getElementById("btn-close-viewer").addEventListener("click", closeViewerModal);
}

bindEvents();
initSession();
