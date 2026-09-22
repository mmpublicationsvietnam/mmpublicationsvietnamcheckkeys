// =====================================================================
// config.js - CẤU HÌNH KẾT NỐI SUPABASE
// Dán đúng SUPABASE_URL và SUPABASE_ANON_KEY của project bạn vào đây.
// Lấy 2 giá trị này tại: Supabase Dashboard > Project Settings > API
// LƯU Ý: "anon key" là key công khai, an toàn để đặt trong code frontend
// (bảo mật thật sự nằm ở RLS Policy đã cấu hình trong schema.sql).
// =====================================================================
const SUPABASE_URL = "https://fjznnrzbhymzdhrfinbz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqem5ucnpiaHltemRocmZpbmJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MTIxMDAsImV4cCI6MjEwNDA4ODEwMH0.R_PPSk3sCQ4lteW6CugKxU0GdqwDRPjfyRMfFCJFVrM";

// Khởi tạo client Supabase, dùng chung cho index.html và admin.html
// (thư viện supabase-js được nạp qua thẻ <script> CDN trong mỗi trang HTML)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Danh sách 7 Level cố định theo bộ giáo trình.
// "code" dùng để lưu trong DB (không dấu, không ký tự đặc biệt để an toàn).
// "label" dùng để hiển thị cho người dùng.
const LEVELS = [
  { code: "A1_1", label: "A1.1", subtitle: "Beginners" },
  { code: "A1_2", label: "A1.2", subtitle: "Elementary" },
  { code: "A2", label: "A2", subtitle: "Pre-Intermediate" },
  { code: "B1", label: "B1", subtitle: "Intermediate" },
  { code: "B1_PLUS", label: "B1+", subtitle: "Upper Intermediate" },
  { code: "B2", label: "B2", subtitle: "Upper-Intermediate+" },
  { code: "C1C2", label: "C1/C2", subtitle: "Advanced" },
];

const TOTAL_MODULES = 10;
