// =====================================================================
// config.js - CẤU HÌNH KẾT NỐI SUPABASE & SYLLABUS TẤT CẢ TỪNG LEVEL
// =====================================================================
const SUPABASE_URL = "https://fjznnrzbhymzdhrfinbz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqem5ucnpiaHltemRocmZpbmJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MTIxMDAsImV4cCI6MjEwNDA4ODEwMH0.R_PPSk3sCQ4lteW6CugKxU0GdqwDRPjfyRMfFCJFVrM";

// Khởi tạo client Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Danh sách 7 Level chuẩn gốc của dự án
const LEVELS = [
  { code: "A1_1", label: "A1.1", subtitle: "Beginners" },
  { code: "A1_2", label: "A1.2", subtitle: "Elementary" },
  { code: "A2", label: "A2", subtitle: "Pre-Intermediate" },
  { code: "B1", label: "B1", subtitle: "Intermediate" },
  { code: "B1_PLUS", label: "B1+", subtitle: "Upper Intermediate" },
  { code: "B2", label: "B2", subtitle: "Upper-Intermediate+" },
  { code: "C1C2", label: "C1/C2", subtitle: "Advanced" }
];

// Cấu hình Syllabus chuẩn theo từng Level
const LEVEL_CONFIGS = {
  // --- LEVEL A1.1 (BEGINNERS) ---
  "A1_1": {
    hasHello: true,
    totalUnits: 24,
    revisions: [
      { afterUnit: 5, id: "rev_1_5", title: "Revision: Units 1-5" },
      { afterUnit: 9, id: "rev_6_9", title: "Revision: Units 6-9" },
      { afterUnit: 12, id: "rev_10_12", title: "Revision: Units 10-12" },
      { afterUnit: 14, id: "rev_13_14", title: "Revision: Units 13-14" },
      { afterUnit: 18, id: "rev_15_18", title: "Revision: Units 15-18" },
      { afterUnit: 21, id: "rev_19_21", title: "Revision: Units 19-21" },
      { afterUnit: 24, id: "rev_22_24", title: "Revision: Units 22-24" },
      { afterUnit: 24, id: "rev_1_24", title: "Revision: Units 1-24" }
    ],
    exams: []
  },

  // --- LEVEL A1.2 (ELEMENTARY) ---
  "A1_2": {
    hasHello: true,
    totalUnits: 28,
    revisions: [
      { afterUnit: 4, id: "rev_1_4", title: "Revision: Units 1-4" },
      { afterUnit: 8, id: "rev_5_8", title: "Revision: Units 5-8" },
      { afterUnit: 12, id: "rev_9_12", title: "Revision: Units 9-12" },
      { afterUnit: 16, id: "rev_13_16", title: "Revision: Units 13-16" },
      { afterUnit: 20, id: "rev_17_20", title: "Revision: Units 17-20" },
      { afterUnit: 24, id: "rev_21_24", title: "Revision: Units 21-24" },
      { afterUnit: 26, id: "rev_25_26", title: "Revision: Units 25-26" },
      { afterUnit: 28, id: "rev_27_28", title: "Revision: Units 27-28" },
      { afterUnit: 28, id: "rev_1_28", title: "Revision: Units 1-28" }
    ],
    exams: []
  },

  // --- LEVEL A2 (PRE-INTERMEDIATE) ---
  "A2": {
    hasHello: true,
    totalUnits: 28,
    revisions: [
      { afterUnit: 6, id: "rev_1_6", title: "Revision: Units 1-6" },
      { afterUnit: 10, id: "rev_7_10", title: "Revision: Units 7-10" },
      { afterUnit: 14, id: "rev_11_14", title: "Revision: Units 11-14" },
      { afterUnit: 17, id: "rev_15_17", title: "Revision: Units 15-17" },
      { afterUnit: 21, id: "rev_18_21", title: "Revision: Units 18-21" },
      { afterUnit: 25, id: "rev_22_25", title: "Revision: Units 22-25" },
      { afterUnit: 28, id: "rev_26_28", title: "Revision: Units 26-28" },
      { afterUnit: 28, id: "rev_1_28", title: "Revision: Units 1-28" }
    ],
    exams: []
  },

  // --- LEVEL B1 (INTERMEDIATE) ---
  "B1": {
    hasHello: false,
    totalUnits: 26,
    revisions: [
      { afterUnit: 3, id: "rev_1_3", title: "Revision: Units 1-3" },
      { afterUnit: 5, id: "rev_4_5", title: "Revision: Units 4-5" },
      { afterUnit: 7, id: "rev_6_7", title: "Revision: Units 6-7" },
      { afterUnit: 9, id: "rev_8_9", title: "Revision: Units 8-9" },
      { afterUnit: 11, id: "rev_10_11", title: "Revision: Units 10-11" },
      { afterUnit: 13, id: "rev_12_13", title: "Revision: Units 12-13" },
      { afterUnit: 15, id: "rev_14_15", title: "Revision: Units 14-15" },
      { afterUnit: 17, id: "rev_16_17", title: "Revision: Units 16-17" },
      { afterUnit: 19, id: "rev_18_19", title: "Revision: Units 18-19" },
      { afterUnit: 21, id: "rev_20_21", title: "Revision: Units 20-21" },
      { afterUnit: 23, id: "rev_22_23", title: "Revision: Units 22-23" },
      { afterUnit: 26, id: "rev_24_26", title: "Revision: Units 24-26" },
      { afterUnit: 26, id: "rev_1_26", title: "Revision: Units 1-26" }
    ],
    exams: [
      { afterUnit: 7, id: "exam_1", title: "Exam Practice 1: Units 1-7" },
      { afterUnit: 13, id: "exam_2", title: "Exam Practice 2: Units 8-13" },
      { afterUnit: 19, id: "exam_3", title: "Exam Practice 3: Units 14-19" },
      { afterUnit: 26, id: "exam_4", title: "Exam Practice 4: Units 20-26" }
    ]
  },

  // --- LEVEL B1_PLUS (UPPER INTERMEDIATE) ---
  "B1_PLUS": {
    hasHello: false,
    totalUnits: 22,
    revisions: [
      { afterUnit: 2, id: "rev_1_2", title: "Revision: Units 1-2" },
      { afterUnit: 4, id: "rev_3_4", title: "Revision: Units 3-4" },
      { afterUnit: 7, id: "rev_5_7", title: "Revision: Units 5-7" },
      { afterUnit: 9, id: "rev_8_9", title: "Revision: Units 8-9" },
      { afterUnit: 11, id: "rev_10_11", title: "Revision: Units 10-11" },
      { afterUnit: 14, id: "rev_12_14", title: "Revision: Units 12-14" },
      { afterUnit: 16, id: "rev_15_16", title: "Revision: Units 15-16" },
      { afterUnit: 18, id: "rev_17_18", title: "Revision: Units 17-18" },
      { afterUnit: 20, id: "rev_19_20", title: "Revision: Units 19-20" },
      { afterUnit: 22, id: "rev_21_22", title: "Revision: Units 21-22" },
      { afterUnit: 22, id: "rev_1_22", title: "Revision: Units 1-22" }
    ],
    exams: [
      { afterUnit: 4, id: "exam_1", title: "Exam Practice 1: Units 1-4" },
      { afterUnit: 9, id: "exam_2", title: "Exam Practice 2: Units 5-9" },
      { afterUnit: 14, id: "exam_3", title: "Exam Practice 3: Units 10-14" },
      { afterUnit: 18, id: "exam_4", title: "Exam Practice 4: Units 15-18" },
      { afterUnit: 22, id: "exam_5", title: "Exam Practice 5: Units 19-22" }
    ]
  },

  // --- LEVEL B2 (UPPER-INTERMEDIATE+) ---
  "B2": {
    hasHello: false,
    totalUnits: 21,
    revisions: [
      { afterUnit: 2, id: "rev_1_2", title: "Revision: Units 1-2" },
      { afterUnit: 4, id: "rev_3_4", title: "Revision: Units 3-4" },
      { afterUnit: 6, id: "rev_5_6", title: "Revision: Units 5-6" },
      { afterUnit: 8, id: "rev_7_8", title: "Revision: Units 7-8" },
      { afterUnit: 10, id: "rev_9_10", title: "Revision: Units 9-10" },
      { afterUnit: 12, id: "rev_11_12", title: "Revision: Units 11-12" },
      { afterUnit: 15, id: "rev_13_15", title: "Revision: Units 13-15" },
      { afterUnit: 17, id: "rev_16_17", title: "Revision: Units 16-17" },
      { afterUnit: 19, id: "rev_18_19", title: "Revision: Units 18-19" },
      { afterUnit: 21, id: "rev_20_21", title: "Revision: Units 20-21" },
      { afterUnit: 21, id: "rev_1_21", title: "Revision: Units 1-21" }
    ],
    exams: [
      { afterUnit: 4, id: "exam_1", title: "Exam Practice 1: Units 1-4" },
      { afterUnit: 8, id: "exam_2", title: "Exam Practice 2: Units 5-8" },
      { afterUnit: 12, id: "exam_3", title: "Exam Practice 3: Units 9-12" },
      { afterUnit: 17, id: "exam_4", title: "Exam Practice 4: Units 13-17" },
      { afterUnit: 21, id: "exam_5", title: "Exam Practice 5: Units 18-21" }
    ]
  },

  // --- LEVEL C1C2 (ADVANCED) ---
  "C1C2": {
    hasHello: false,
    totalUnits: 21,
    revisions: [
      { afterUnit: 1, id: "rev_1", title: "Revision: Unit 1 Grammar" },
      { afterUnit: 2, id: "rev_2", title: "Revision: Unit 2 Grammar" },
      { afterUnit: 3, id: "rev_3", title: "Revision: Unit 3 Vocabulary" },
      { afterUnit: 4, id: "rev_4", title: "Revision: Unit 4 Grammar" },
      { afterUnit: 5, id: "rev_5", title: "Revision: Unit 5 Grammar" },
      { afterUnit: 6, id: "rev_6", title: "Revision: Unit 6 Vocabulary" },
      { afterUnit: 7, id: "rev_7", title: "Revision: Unit 7 Grammar" },
      { afterUnit: 8, id: "rev_8", title: "Revision: Unit 8 Grammar" },
      { afterUnit: 9, id: "rev_9", title: "Revision: Unit 9 Vocabulary" },
      { afterUnit: 10, id: "rev_10", title: "Revision: Unit 10 Grammar" },
      { afterUnit: 11, id: "rev_11", title: "Revision: Unit 11 Grammar" },
      { afterUnit: 12, id: "rev_12", title: "Revision: Unit 12 Vocabulary" },
      { afterUnit: 13, id: "rev_13", title: "Revision: Unit 13 Grammar" },
      { afterUnit: 14, id: "rev_14", title: "Revision: Unit 14 Grammar" },
      { afterUnit: 15, id: "rev_15", title: "Revision: Unit 15 Vocabulary" },
      { afterUnit: 16, id: "rev_16", title: "Revision: Unit 16 Grammar" },
      { afterUnit: 17, id: "rev_17", title: "Revision: Unit 17 Grammar" },
      { afterUnit: 18, id: "rev_18", title: "Revision: Unit 18 Vocabulary" },
      { afterUnit: 19, id: "rev_19", title: "Revision: Unit 19 Grammar" },
      { afterUnit: 20, id: "rev_20", title: "Revision: Unit 20 Grammar" },
      { afterUnit: 21, id: "rev_21", title: "Revision: Unit 21 Vocabulary" }
    ],
    exams: [
      { afterUnit: 3, id: "exam_1", title: "Exam Practice 1: Units 1-3" },
      { afterUnit: 6, id: "exam_2", title: "Exam Practice 2: Units 4-6" },
      { afterUnit: 9, id: "exam_3", title: "Exam Practice 3: Units 7-9" },
      { afterUnit: 12, id: "exam_4", title: "Exam Practice 4: Units 10-12" },
      { afterUnit: 15, id: "exam_5", title: "Exam Practice 5: Units 13-15" },
      { afterUnit: 18, id: "exam_6", title: "Exam Practice 6: Units 16-18" },
      { afterUnit: 21, id: "exam_7", title: "Exam Practice 7: Units 19-21" }
    ]
  }
};

// Hàm tạo danh sách item bài học động chính xác cho từng Level
function getLevelItemList(levelCode) {
  const config = LEVEL_CONFIGS[levelCode] || { hasHello: false, totalUnits: 20, revisions: [], exams: [] };
  const items = [];

  // 1. Thêm bài Hello nếu có
  if (config.hasHello) {
    items.push({ id: "0", title: "Module Hello", type: "hello" });
  }

  // 2. Chèn từng Unit và các bài Revision / Exam đúng vị trí ngay sau Unit đó
  for (let u = 1; u <= config.totalUnits; u++) {
    items.push({ id: String(u), title: `Module ${u}`, type: "unit" });

    // Lọc và chèn bài Revision sau Unit này
    const revs = config.revisions.filter(r => r.afterUnit === u);
    revs.forEach(rev => {
      items.push({
        id: rev.id,
        title: rev.title,
        type: "revision"
      });
    });

    // Lọc và chèn bài Exam Practice sau Unit này
    const exms = config.exams.filter(e => e.afterUnit === u);
    exms.forEach(exm => {
      items.push({
        id: exm.id,
        title: exm.title,
        type: "exam"
      });
    });
  }

  return items;
}
