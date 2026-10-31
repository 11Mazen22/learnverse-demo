export type SupportCategory =
  | "curriculum"
  | "tracks"
  | "lessons"
  | "ai"
  | "account"
  | "bug"
  | "general";

export interface SupportTicketSubmission {
  name: string;
  email: string;
  subject: string;
  category: SupportCategory;
  message: string;
  diagnosticInfo?: Record<string, unknown>;
}

export interface SupportTicketRecord {
  id: string;
  ticket_code: string;
  user_id: string | null;
  name: string;
  email: string;
  subject: string;
  category: SupportCategory;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  email_delivery_status: "sent" | "queued_no_provider" | "failed" | "pending";
  email_destination: string;
  provider_response?: Record<string, unknown>;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportEmailDeliveryResult {
  delivered: boolean;
  status: "sent" | "queued_no_provider" | "failed";
  destination: string;
  messageId?: string;
  missingEnv?: string[];
  note: string;
}

export const SUPPORT_CATEGORIES: {
  key: SupportCategory;
  ar: string;
  en: string;
  descAr: string;
  descEn: string;
}[] = [
  {
    key: "curriculum",
    ar: "المنهج والمحتوى الدراسي",
    en: "Curriculum & Content",
    descAr: "استفسارات أو ملاحظات حول المواد الستة والدروس المقررة.",
    descEn: "Questions or notes on the 6 core subjects and lessons.",
  },
  {
    key: "tracks",
    ar: "المسارات اللغوية (عربي / إنجليزي)",
    en: "Language Tracks (AR / EN)",
    descAr: "مسارات العلوم المتكاملة والرياضيات واختيار لغة المنهج.",
    descEn: "Independent Science and Math tracks & language selection.",
  },
  {
    key: "lessons",
    ar: "الدروس والأسئلة والاختبارات",
    en: "Lessons, Quizzes & Grading",
    descAr: "ملاحظات حول التدريبات والتقييم الحتمي وشروحات الإجابات.",
    descEn: "Feedback on practice drills, quizzes and reasoned corrections.",
  },
  {
    key: "ai",
    ar: "مساعد Noäta AI والدراسة الذكية",
    en: "Noäta AI Companion",
    descAr: "أنماط الشرح والاختبار وتوليد البطاقات وتلخيص الملاحظات.",
    descEn: "Explanation modes, quizzes, flashcards and study workflows.",
  },
  {
    key: "account",
    ar: "الحساب والبيانات والتقدم",
    en: "Account, Progress & Sync",
    descAr: "حفظ التقدم، استعادة الحساب، وتسجيل الدخول وتفضيلات العرض.",
    descEn: "Saved progress, account recovery, login and preferences.",
  },
  {
    key: "bug",
    ar: "مشكلة تقنية أو خطأ بالواجهة",
    en: "Technical Issue / Bug Report",
    descAr: "أي خطأ في العرض، التنسيق، التجاوب، أو وظائف التفاعل.",
    descEn: "Visual defects, responsiveness, layout, or broken controls.",
  },
  {
    key: "general",
    ar: "استفسار أو اقتراح عام",
    en: "General Inquiry or Feedback",
    descAr: "أي أفكار لتطوير المنصة أو استفسارات عامة.",
    descEn: "Suggestions, partnership or general feedback.",
  },
];
