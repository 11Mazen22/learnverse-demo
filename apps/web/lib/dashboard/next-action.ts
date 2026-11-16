import type { ContentLanguage } from "@/lib/curriculum/catalog";

export type DueAssignmentSummary = {
  id: string;
  title: string;
  due_at: string | null;
};

export type NextLessonSummary = {
  id: string;
  slug?: string | null;
  title_ar: string;
  title_en: string;
};

export type ActiveTrackSummary = {
  slug: string;
  titleAr: string;
  titleEn: string;
  contentLanguage: ContentLanguage;
  done: number;
  total: number;
};

export type NextActionPriority =
  | "assignment-urgent"
  | "review-due"
  | "next-lesson"
  | "explore-curriculum"
  | "guest-onboarding";

export type RecommendedAction = {
  kind: NextActionPriority;
  urgency: "critical" | "due" | "steady" | "explore";
  href: string;
  badgeAr: string;
  badgeEn: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  ctaAr: string;
  ctaEn: string;
  icon: "clipboard" | "clock" | "book" | "compass";
};

export type NextActionInput = {
  signedIn: boolean;
  evidenceReady: boolean;
  progressReady: boolean;
  dueAssignments: readonly DueAssignmentSummary[];
  dueFlashcards: number;
  dueSkills: number;
  nextLesson: NextLessonSummary | null;
  activeTrack: ActiveTrackSummary | null;
  nowMs?: number;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Deterministic student Next Action Engine.
 * Priority:
 *   1. Classroom assignments overdue or due within 24 hours.
 *   2. Scheduled flashcard or skill recall backlog.
 *   3. Next incomplete lesson inside the active curriculum track.
 *   4. Truthful onboarding / curriculum exploration fallback.
 */
export function computeNextAction(input: NextActionInput): RecommendedAction {
  const now = input.nowMs ?? Date.now();

  if (input.signedIn && input.dueAssignments.length > 0) {
    const dated = input.dueAssignments
      .map((item) => ({
        item,
        dueMs: item.due_at ? Date.parse(item.due_at) : Number.NaN,
      }))
      .filter((entry) => Number.isFinite(entry.dueMs))
      .sort((a, b) => a.dueMs - b.dueMs);

    const urgent = dated.find((entry) => entry.dueMs - now <= ONE_DAY_MS);
    if (urgent) {
      const hoursLeft = Math.round((urgent.dueMs - now) / (60 * 60 * 1000));
      const isOverdue = urgent.dueMs < now;
      return {
        kind: "assignment-urgent",
        urgency: "critical",
        href: `/assignments?focus=${encodeURIComponent(urgent.item.id)}`,
        badgeAr: isOverdue ? "واجب متأخر عن الموعد" : `موعد التسليم خلال ${Math.max(1, hoursLeft)} ساعة`,
        badgeEn: isOverdue ? "Overdue class assignment" : `Due in ~${Math.max(1, hoursLeft)}h`,
        titleAr: urgent.item.title,
        titleEn: urgent.item.title,
        descriptionAr: isOverdue
          ? "هذا الواجب المدرسي تجاوز موعد تسليمه؛ أكمله الآن لتوثيق درجتك وتجنب فوات التقييم."
          : "لديك واجب مدرسي قريب الموعد؛ إنهاؤه الآن يمنحك أقصى تركيز قبل انتهاء المهلة.",
        descriptionEn: isOverdue
          ? "This published class assignment is past its deadline. Complete and submit it now to record your work."
          : "You have a class assignment due soon. Finishing it now secures your submission well before the deadline.",
        ctaAr: "فتح الواجب الآن",
        ctaEn: "Open assignment",
        icon: "clipboard",
      };
    }
  }

  const dueFlashcards = input.signedIn ? Math.max(0, input.dueFlashcards) : 0;
  const dueSkills = input.signedIn && input.evidenceReady ? Math.max(0, input.dueSkills) : 0;

  if (dueFlashcards > 0 || dueSkills > 0) {
    const reviewCardsFirst = dueFlashcards >= dueSkills;
    const partsAr: string[] = [];
    const partsEn: string[] = [];
    if (dueFlashcards > 0) {
      partsAr.push(`${dueFlashcards} بطاقة استرجاع`);
      partsEn.push(`${dueFlashcards} flashcard${dueFlashcards === 1 ? "" : "s"}`);
    }
    if (dueSkills > 0) {
      partsAr.push(`${dueSkills} مهارة منهج`);
      partsEn.push(`${dueSkills} curriculum skill${dueSkills === 1 ? "" : "s"}`);
    }

    return {
      kind: "review-due",
      urgency: "due",
      href: reviewCardsFirst ? "/study?mode=due" : "/review",
      badgeAr: "ذروة تثبيت الذاكرة (SM-2)",
      badgeEn: "Peak recall window (SM-2)",
      titleAr: reviewCardsFirst
        ? `مراجعة ${dueFlashcards} بطاقة مستحقة اليوم`
        : `تثبيت ${dueSkills} مفاهيم منهج مستحقة`,
      titleEn: reviewCardsFirst
        ? `Review ${dueFlashcards} due flashcard${dueFlashcards === 1 ? "" : "s"}`
        : `Practice ${dueSkills} due curriculum skill${dueSkills === 1 ? "" : "s"}`,
      descriptionAr: `لديك ${partsAr.join(" و")} حان وقت استرجاعها الآن لتعزيز التذكر طويل المدى.`,
      descriptionEn: `You have ${partsEn.join(" and ")} scheduled for active recall right now to strengthen long-term retention.`,
      ctaAr: reviewCardsFirst ? "ابدأ جلسة البطاقات" : "ابدأ مراجعة المهارات",
      ctaEn: reviewCardsFirst ? "Start due deck" : "Start skill recall",
      icon: "clock",
    };
  }

  if (input.progressReady && input.nextLesson) {
    const trackLabelAr = input.activeTrack?.titleAr || "المسار النشط";
    const trackLabelEn = input.activeTrack?.titleEn || "Active Track";
    const isEnglishTrack = input.activeTrack?.contentLanguage === "en";
    const lessonTitle = isEnglishTrack
      ? input.nextLesson.title_en || input.nextLesson.title_ar
      : input.nextLesson.title_ar;

    return {
      kind: "next-lesson",
      urgency: "steady",
      href: `/lesson/${encodeURIComponent(input.nextLesson.slug || input.nextLesson.id)}`,
      badgeAr: trackLabelAr,
      badgeEn: trackLabelEn,
      titleAr: lessonTitle,
      titleEn: input.nextLesson.title_en || input.nextLesson.title_ar,
      descriptionAr: input.activeTrack
        ? `أنجزت ${input.activeTrack.done} من أصل ${input.activeTrack.total} درسًا في «${trackLabelAr}». تابع هذا الدرس لتثبيت الفهم بالحل الفوري.`
        : "الدرس التالي جاهز في مسارك النشط مع شرح منظم وتدريب تفاعلي فوري.",
      descriptionEn: input.activeTrack
        ? `You have completed ${input.activeTrack.done} of ${input.activeTrack.total} lessons in “${trackLabelEn}”. Continue now to lock in mastery.`
        : "Your next published lesson is ready with structured reading and immediate interactive checks.",
      ctaAr: "متابعة الدرس الآن",
      ctaEn: "Continue lesson",
      icon: "book",
    };
  }

  if (!input.signedIn) {
    return {
      kind: "guest-onboarding",
      urgency: "explore",
      href: "/learn",
      badgeAr: "وضع المعاينة المفتوح",
      badgeEn: "Open preview workspace",
      titleAr: "استكشف المنهج التفاعلي وابدأ خطوتك الأولى",
      titleEn: "Explore the interactive curriculum and start learning",
      descriptionAr:
        "تصفّح دروس المواد الست ومسارات اللغة المتاحة بحرية. عند تسجيل الدخول ستُحفظ خططك ومراجعاتك بدقة تامة.",
      descriptionEn:
        "Browse lessons across all six core subjects and track languages freely. Sign in whenever you are ready to sync verified mastery and spaced recall.",
      ctaAr: "تصفّح المسارات",
      ctaEn: "Browse curriculum",
      icon: "compass",
    };
  }

  return {
    kind: "explore-curriculum",
    urgency: "explore",
    href: "/learn",
    badgeAr: "أحسنت — لا تراكمات متأخرة",
    badgeEn: "All caught up",
    titleAr: "استكشف درسًا جديدًا أو أنشئ حزمة مذاكرة",
    titleEn: "Explore a new lesson or build a study pack",
    descriptionAr:
      "كل مواعيد مراجعاتك منضبطة الآن. يمكنك اختيار مادة من المنهج أو تحويل ملاحظاتك إلى بطاقات 3D واختبار فوري.",
    descriptionEn:
      "Your scheduled reviews are caught up. Pick a subject below or open Smart Study Studio to practice with interactive flashcards.",
    ctaAr: "استكشف المنهج",
    ctaEn: "Explore curriculum",
    icon: "book",
  };
}
