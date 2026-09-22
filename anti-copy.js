// =====================================================================
// anti-copy.js - CÁC BIỆN PHÁP CHỐNG SAO CHÉP CƠ BẢN
// LƯU Ý QUAN TRỌNG (nói thật với bạn): không có cách nào ở phía trình
// duyệt (client-side) chặn được 100% việc người dùng lấy nội dung ra
// ngoài (họ luôn có thể chụp màn hình, quay video, hoặc dùng DevTools
// nâng cao). Các biện pháp dưới đây chỉ làm TĂNG ĐỘ KHÓ / NGĂN CHẶN
// SỐ ĐÔNG người dùng phổ thông, không thay thế được biện pháp bảo mật
// thật sự (giới hạn thiết bị, watermark định danh, theo dõi tài khoản
// chia sẻ bất thường...).
// =====================================================================

(function initAntiCopy() {
  // 1. Chặn menu chuột phải trên toàn trang
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // 2. Chặn bôi đen / chọn văn bản (kết hợp thêm CSS user-select: none)
  document.addEventListener("selectstart", (e) => e.preventDefault());

  // 3. Chặn tổ hợp phím thường dùng để mở DevTools / xem mã nguồn / lưu trang
  document.addEventListener("keydown", (e) => {
    const key = e.key ? e.key.toUpperCase() : "";
    const isF12 = key === "F12";
    const isDevTools = e.ctrlKey && e.shiftKey && (key === "I" || key === "J" || key === "C");
    const isViewSource = e.ctrlKey && key === "U";
    const isSavePage = e.ctrlKey && key === "S";
    const isPrint = e.ctrlKey && key === "P";

    if (isF12 || isDevTools || isViewSource || isSavePage || isPrint) {
      e.preventDefault();
      return false;
    }
  });

  // 4. Cảnh báo nhẹ nếu phát hiện khung DevTools mở (kỹ thuật đo kích thước
  //    cửa sổ - không hoàn hảo, chỉ mang tính răn đe)
  let devtoolsWarned = false;
  setInterval(() => {
    const threshold = 160;
    const widthGap = window.outerWidth - window.innerWidth > threshold;
    const heightGap = window.outerHeight - window.innerHeight > threshold;
    if ((widthGap || heightGap) && !devtoolsWarned) {
      devtoolsWarned = true;
      console.log(
        "%cNội dung có bản quyền - NXB MM",
        "color:red;font-size:20px;font-weight:bold;"
      );
    }
  }, 1500);
})();
