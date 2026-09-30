// =====================================================================
// app.js - LOGIC CHÍNH CỦA TRANG NGƯỜI DÙNG
// Phụ thuộc: config.js (đã tạo supabaseClient, LEVELS, TOTAL_MODULES)
// =====================================================================

// ---------- STATE DÙNG CHUNG TRONG PHIÊN LÀM VIỆC ----------
let currentUser = null;              // { id, email }
let unlockedLevelsMap = {};          // { level_code: activated_at (Date) }
let currentLevelCode = null;         // level đang xem trong màn hình module
// ---------- CẤU HÌNH KHUNG CHƯƠNG TRÌNH DÙNG CHUNG ----------
const LEVEL_CONFIGS = {
  "A1_1": {
    hasHello: true,
    totalUnits: 24,
    revisions: [
      { id: "rev_1_5", label: "Revision: Units 1-5" },
      { id: "rev_6_9", label: "Revision: Units 6-9" },
      { id: "rev_10_12", label: "Revision: Units 10-12" },
      { id: "rev_13_14", label: "Revision: Units 13-14" },
      { id: "rev_15_18", label: "Revision: Units 15-18" },
      { id: "rev_19_21", label: "Revision: Units 19-21" },
      { id: "rev_22_24", label: "Revision: Units 22-24" },
      { id: "rev_final", label: "Revision: Units 1-24 (Final)" }
    ],
    exams: []
  },
  "A1_2": {
    hasHello: true,
    totalUnits: 28,
    revisions: [
      { id: "rev_1_4", label: "Revision: Units 1-4" },
      { id: "rev_5_8", label: "Revision: Units 5-8" },
      { id: "rev_9_12", label: "Revision: Units 9-12" },
      { id: "rev_13_16", label: "Revision: Units 13-16" },
      { id: "rev_17_20", label: "Revision: Units 17-20" },
      { id: "rev_21_24", label: "Revision: Units 21-24" },
      { id: "rev_25_26", label: "Revision: Units 25-26" },
      { id: "rev_27_28", label: "Revision: Units 27-28" },
      { id: "rev_final", label: "Revision: Units 1-28 (Final)" }
    ],
    exams: []
  },
  "A2": {
    hasHello: false,
    totalUnits: 26,
    revisions: [
      { id: "rev_1_3", label: "Revision: Units 1-3" },
      { id: "rev_4_5", label: "Revision: Units 4-5" },
      { id: "rev_6_7", label: "Revision: Units 6-7" },
      { id: "rev_8_9", label: "Revision: Units 8-9" },
      { id: "rev_10_11", label: "Revision: Units 10-11" },
      { id: "rev_12_13", label: "Revision: Units 12-13" },
      { id: "rev_14_15", label: "Revision: Units 14-15" },
      { id: "rev_16_17", label: "Revision: Units 16-17" },
      { id: "rev_18_19", label: "Revision: Units 18-19" },
      { id: "rev_20_21", label: "Revision: Units 20-21" },
      { id: "rev_22_23", label: "Revision: Units 22-23" },
      { id: "rev_24_26", label: "Revision: Units 24-26" },
      { id: "rev_final", label: "Revision: Units 1-26 (Final)" }
    ],
    exams: [
      { id: "exam_1", label: "📝 Exam Practice 1: Units 1-7" },
      { id: "exam_2", label: "📝 Exam Practice 2: Units 8-13" },
      { id: "exam_3", label: "📝 Exam Practice 3: Units 14-19" },
      { id: "exam_4", label: "📝 Exam Practice 4: Units 20-26" }
    ]
  },
  "B1": {
    hasHello: false,
    totalUnits: 21,
    revisions: [
      { id: "rev_1_2", label: "Revision: Units 1-2" },
      { id: "rev_3_4", label: "Revision: Units 3-4" },
      { id: "rev_5_6", label: "Revision: Units 5-6" },
      { id: "rev_7_8", label: "Revision: Units 7-8" },
      { id: "rev_9_10", label: "Revision: Units 9-10" },
      { id: "rev_11_12", label: "Revision: Units 11-12" },
      { id: "rev_13_15", label: "Revision: Units 13-15" },
      { id: "rev_16_17", label: "Revision: Units 16-17" },
      { id: "rev_18_19", label: "Revision: Units 18-19" },
      { id: "rev_20_21", label: "Revision: Units 20-21" },
      { id: "rev_final", label: "Revision: Units 1-21 (Final)" }
    ],
    exams: [
      { id: "exam_1", label: "📝 Exam Practice 1: Units 1-4" },
      { id: "exam_2", label: "📝 Exam Practice 2: Units 5-8" },
      { id: "exam_3", label: "📝 Exam Practice 3: Units 9-12" },
      { id: "exam_4", label: "📝 Exam Practice 4: Units 13-17" },
      { id: "exam_5", label: "📝 Exam Practice 5: Units 18-21" }
    ]
  },
  "B1_PLUS": {
    hasHello: false,
    totalUnits: 21,
    perUnitRevision: true,
    exams: [
      { id: "exam_1", label: "📝 Exam Practice 1: Units 1-3" },
      { id: "exam_2", label: "📝 Exam Practice 2: Units 4-6" },
      { id: "exam_3", label: "📝 Exam Practice 3: Units 7-9" },
      { id: "exam_4", label: "📝 Exam Practice 4: Units 10-12" },
      { id: "exam_5", label: "📝 Exam Practice 5: Units 13-15" },
      { id: "exam_6", label: "📝 Exam Practice 6: Units 16-18" },
      { id: "exam_7", label: "📝 Exam Practice 7: Units 19-21" }
    ]
  }
};
LEVEL_CONFIGS["B2"] = LEVEL_CONFIGS["B1_PLUS"];
LEVEL_CONFIGS["C1C2"] = LEVEL_CONFIGS["B1_PLUS"];

// Hàm sinh danh sách đầy đủ các bài theo đúng thứ tự hiển thị của từng Level
function getLevelItemList(levelCode) {
  const config = LEVEL_CONFIGS[levelCode];
  if (!config) return [];

  const items = [];

  // 1. Thêm Module Hello nếu có
  if (config.hasHello) {
    items.push({ id: "0", title: "Module Hello", type: "unit" });
  }

  // 2. Thêm các Unit (Module 1, Module 2,...)
  for (let u = 1; u <= config.totalUnits; u++) {
    items.push({ id: String(u), title: `Module ${u}`, type: "unit" });
    if (config.perUnitRevision) {
      items.push({ id: `rev_unit_${u}`, title: `Revision: Unit ${u}`, type: "revision" });
    }
  }

  // 3. Thêm các bài Revision nhóm
  if (config.revisions) {
    config.revisions.forEach(r => items.push({ id: r.id, title: r.label, type: "revision" }));
  }

  // 4. Thêm các bài Exam Practice
  if (config.exams) {
    config.exams.forEach(e => items.push({ id: e.id, title: e.label, type: "exam" }));
  }

  return items;
}
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

// Tính số mục (items) đã mở khóa dựa theo chỉ số số lượng tổng
function computeUnlockedCount(activatedAtDate, totalItemsCount = 28) {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksPassed = Math.floor((Date.now() - activatedAtDate.getTime()) / msPerWeek);
  const count = (weeksPassed + 1) * 2; // Tự động mở 2 mục mỗi tuần
  return Math.min(totalItemsCount, count);
}

// Tính ngày mở khóa dựa theo THỨ TỰ (itemIndex: 0, 1, 2...) thay vì ép kiểu số moduleNumber
function computeUnlockDateForModule(activatedAtDate, itemIndex) {
  const weekIndex = Math.floor(itemIndex / 2) + 1; // index 0,1 -> tuần 1 | 2,3 -> tuần 2
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
      const items = getLevelItemList(lvl.code);
      const unlockedCount = computeUnlockedCount(activatedAt, items.length);
      const percent = items.length > 0 ? Math.round((unlockedCount / items.length) * 100) : 0;

      card.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <p class="font-display text-lg font-bold">${lvl.label} <span class="text-xs font-normal text-[#6B7280]">(${lvl.subtitle})</span></p>
          <span class="text-xs px-2 py-0.5 rounded-full bg-[var(--gold-soft)] text-[var(--gold)] font-medium">Đã kích hoạt</span>
        </div>
        <div class="progress-track h-2 rounded-full overflow-hidden mb-2">
          <div class="progress-fill h-full" style="width:${percent}%"></div>
        </div>
        <p class="text-xs text-[#6B7280]">Đang mở đến ${unlockedCount}/${items.length} bài &middot; ${percent}% hoàn thành</p>
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
// MÀN HÌNH DANH SÁCH MODULE CỦA 1 LEVEL
// =====================================================================

function showModulesScreen(levelCode) {
  currentLevelCode = levelCode;
  const activatedAt = unlockedLevelsMap[levelCode];
  const lvl = LEVELS.find((l) => l.code === levelCode);

  document.getElementById("dashboard-screen").classList.add("hidden");
  document.getElementById("modules-screen").classList.remove("hidden");
  document.getElementById("modules-title").textContent = `${lvl.label} - ${lvl.subtitle}`;
  document.getElementById("modules-subtitle").textContent = 
    `Kích hoạt ngày ${formatDateVN(activatedAt)}. Bài mới tự động mở mỗi 7 ngày.`;

  // Lấy danh sách item động theo LEVEL_CONFIGS
  const items = getLevelItemList(levelCode);
  const unlockedCount = computeUnlockedCount(activatedAt, items.length);
  const percent = items.length > 0 ? Math.round((unlockedCount / items.length) * 100) : 0;

  document.getElementById("modules-percent").textContent = percent + "%";
  document.getElementById("modules-progress-fill").style.width = percent + "%";

  const list = document.getElementById("module-list");
  list.innerHTML = "";

  // Duyệt qua từng item để render đúng thứ tự
  items.forEach((item, index) => {
    const isUnlocked = index < unlockedCount;
    const row = document.createElement("div");

    // Tùy chỉnh màu sắc cho bài Exam / Revision / Unit
    let bgStyle = "border border-[#E2E6EF]";
    if (item.type === "exam") {
      bgStyle = "border border-amber-300 bg-amber-50/40";
    } else if (item.type === "revision") {
      bgStyle = "border border-blue-200 bg-blue-50/30";
    }

    row.className = `module-row rounded-lg px-4 py-3 flex items-center justify-between ${bgStyle} ${isUnlocked ? "unlocked" : "locked"}`;

    if (isUnlocked) {
      row.innerHTML = `
        <div>
          <p class="font-medium text-sm ${item.type === 'exam' ? 'text-amber-900 font-semibold' : ''}">${item.title}</p>
          <p class="text-xs text-[var(--green)]">Đã mở khóa</p>
        </div>
        <button class="btn-gold text-xs font-medium px-3 py-1.5 rounded-md">Xem đáp án</button>
      `;
      row.querySelector("button").addEventListener("click", () => openModuleViewer(levelCode, item.id, item.title));
    } else {
      const unlockDate = computeUnlockDateForModule(activatedAt, index);
      row.innerHTML = `
        <div>
          <p class="font-medium text-sm ${item.type === 'exam' ? 'text-amber-900 font-semibold' : ''}">${item.title}</p>
          <p class="text-xs text-[#8890A0]">🔒 Tự động mở khóa vào ${formatDateVN(unlockDate)}</p>
        </div>
      `;
    }
    list.appendChild(row);
  });
}

async function openModuleViewer(levelCode, moduleNumber, displayTitle = "") {
  const { data, error } = await supabaseClient
    .from("module_content")
    .select("title, content")
    .eq("level_code", levelCode)
    .eq("module_number", String(moduleNumber)) // Ép kiểu về String để nhận mã chữ/số
    .maybeSingle();

  if (error) {
    showToast("Lỗi tải nội dung: " + error.message);
    return;
  }

  const lvl = LEVELS.find((l) => l.code === levelCode);
  const titleText = displayTitle || `Module ${moduleNumber}`;
  
  document.getElementById("viewer-title").textContent =
    data && data.title ? `${lvl.label} - ${titleText}: ${data.title}` : `${lvl.label} - ${titleText}`;

  const contentEl = document.getElementById("viewer-content");
  if (data && data.content) {
    contentEl.innerHTML = data.content;
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
