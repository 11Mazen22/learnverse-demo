export const STREAK_MILESTONES = [3, 7, 14, 30] as const;

export type StreakMilestoneDays = (typeof STREAK_MILESTONES)[number];

export interface StreakMilestoneDefinition {
  days: StreakMilestoneDays;
  id: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "diamond";
  titleAr: string;
  titleEn: string;
  giftLabelAr: string;
  giftLabelEn: string;
  descAr: string;
  descEn: string;
}

export const STREAK_MILESTONE_DEFINITIONS: readonly StreakMilestoneDefinition[] = [
  {
    days: 3,
    id: "bronze_spark",
    icon: "🔥",
    tier: "bronze",
    titleAr: "شرارة الاستمرارية",
    titleEn: "Consistency Spark",
    giftLabelAr: "صندوق الشرارة البرونزي + شارة 3 أيام",
    giftLabelEn: "Bronze Spark Gift + 3-Day Badge",
    descAr: "أكملت 3 أيام متواصلة من المذاكرة المركّزة بدون انقطاع.",
    descEn: "Completed 3 consecutive days of focused study without breaking momentum.",
  },
  {
    days: 7,
    id: "silver_flame",
    icon: "⚡",
    tier: "silver",
    titleAr: "شعلة الأسبوع الفضي",
    titleEn: "Weekly Silver Flame",
    giftLabelAr: "هدية الأسبوع الفضي + معزّز المراجعة",
    giftLabelEn: "Silver Week Gift + Review Boost",
    descAr: "7 أيام كاملة من الانضباط! ذاكرتك قصيرة المدى تتحول إلى تثبيت حقيقي.",
    descEn: "A full 7-day streak! Your study rhythm is now locking concepts into long-term memory.",
  },
  {
    days: 14,
    id: "gold_crown",
    icon: "👑",
    tier: "gold",
    titleAr: "تاج الأسبوعين الذهبي",
    titleEn: "Two-Week Gold Crown",
    giftLabelAr: "صندوق التاج الذهبي + لقب بطل الانتظام",
    giftLabelEn: "Gold Crown Gift + Consistency Champion",
    descAr: "أسبوعان متتاليان من التقدّم اليومي في مواد الصف الأول الثانوي.",
    descEn: "Two unbroken weeks of daily Sec. 1 progress across your study tracks.",
  },
  {
    days: 30,
    id: "diamond_legend",
    icon: "💎",
    tier: "diamond",
    titleAr: "أسطورة الشهر الماسي",
    titleEn: "30-Day Diamond Legend",
    giftLabelAr: "الصندوق الماسي الأسطوري + تاج الإتقان",
    giftLabelEn: "Diamond Legend Gift + Mastery Crown",
    descAr: "30 يومًا من المذاكرة الذكية المتواصلة — أنت قدوة في التفوق والالتزام!",
    descEn: "30 uninterrupted days of smart study — elite commitment unlocked!",
  },
] as const;

export interface EvaluatedStreakMilestone extends StreakMilestoneDefinition {
  unlocked: boolean;
  isCurrent: boolean;
}

export interface StreakEvaluation {
  streakDays: number;
  currentMilestone: StreakMilestoneDefinition | null;
  nextMilestone: StreakMilestoneDefinition;
  daysToNext: number;
  progressPct: number;
  allCompleted: boolean;
  milestones: EvaluatedStreakMilestone[];
}

export function evaluateStreakMilestones(rawStreakDays: number): StreakEvaluation {
  const streakDays = Number.isFinite(rawStreakDays) ? Math.max(0, Math.floor(rawStreakDays)) : 0;

  let currentMilestone: StreakMilestoneDefinition | null = null;
  for (const def of STREAK_MILESTONE_DEFINITIONS) {
    if (streakDays >= def.days) {
      currentMilestone = def;
    }
  }

  const nextMilestone =
    STREAK_MILESTONE_DEFINITIONS.find((def) => streakDays < def.days) ??
    STREAK_MILESTONE_DEFINITIONS[STREAK_MILESTONE_DEFINITIONS.length - 1];

  const allCompleted = streakDays >= STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  const daysToNext = allCompleted ? 0 : Math.max(0, nextMilestone.days - streakDays);

  const prevTarget = currentMilestone ? currentMilestone.days : 0;
  const span = Math.max(1, nextMilestone.days - prevTarget);
  const progressPct = allCompleted
    ? 100
    : Math.max(0, Math.min(100, Math.round(((streakDays - prevTarget) / span) * 100)));

  const milestones: EvaluatedStreakMilestone[] = STREAK_MILESTONE_DEFINITIONS.map((def) => ({
    ...def,
    unlocked: streakDays >= def.days,
    isCurrent: currentMilestone?.days === def.days,
  }));

  return {
    streakDays,
    currentMilestone,
    nextMilestone,
    daysToNext,
    progressPct,
    allCompleted,
    milestones,
  };
}

export interface LessonAchievementInput {
  scorePct: number;
  xpReward: number;
  coinReward: number;
  verifiedGems: number;
  isPreview?: boolean;
}

export interface LessonAchievementSummary {
  scorePct: number;
  rank: "S+" | "S" | "A" | "B";
  tierColor: "gold" | "emerald" | "indigo";
  xpReward: number;
  coinReward: number;
  verifiedGems: number;
  isPreview: boolean;
  gemBreakdown: {
    base90Gems: number;
    perfect100BonusGems: number;
    totalEligibleGems: number;
  };
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  gemNoteAr: string;
  gemNoteEn: string;
}

export function computeLessonAchievementSummary(
  input: LessonAchievementInput,
): LessonAchievementSummary {
  const scorePct = Number.isFinite(input.scorePct)
    ? Math.max(0, Math.min(100, Math.round(input.scorePct)))
    : 0;
  const xpReward = Math.max(0, Math.round(input.xpReward));
  const coinReward = Math.max(0, Math.round(input.coinReward));
  const verifiedGems = Math.max(0, Math.round(input.verifiedGems));
  const isPreview = Boolean(input.isPreview);

  const base90Gems = scorePct >= 90 ? 5 : 0;
  const perfect100BonusGems = scorePct === 100 ? 3 : 0;
  const totalEligibleGems = base90Gems + perfect100BonusGems;

  let rank: "S+" | "S" | "A" | "B" = "B";
  let tierColor: "gold" | "emerald" | "indigo" = "indigo";
  if (scorePct === 100) {
    rank = "S+";
    tierColor = "gold";
  } else if (scorePct >= 90) {
    rank = "S";
    tierColor = "emerald";
  } else if (scorePct >= 75) {
    rank = "A";
    tierColor = "indigo";
  }

  const titleAr =
    scorePct === 100
      ? "إتقان كامل 100%! إنجاز أسطوري في الدرس"
      : scorePct >= 90
        ? "إنجاز ممتاز! فتحت مكافأة الجواهر والعملات"
        : "أحسنت! أتممت مهمة الدرس بنجاح";

  const titleEn =
    scorePct === 100
      ? "100% Perfect Mastery! Legendary Lesson Clear"
      : scorePct >= 90
        ? "Excellent Mastery! Lesson Gems & Coins Unlocked"
        : "Well Done! Lesson Mission Completed";

  const subtitleAr = isPreview
    ? "وضع معاينة المنهج: يمكنك اختبار نفسك وتتبع نقاطك هنا، وتُسجَّل العملات والجواهر الرسمية عند دخول الدرس الفعلي في المنهج."
    : scorePct >= 90
      ? "تم توثيق إجابتك في سجل المهارات وإضافة مكافآت الخبرة والعملات والجواهر إلى رصيدك."
      : "تم حفظ تقدّمك وإضافة نقاط الخبرة والعملات. حقّق 90%+ في إعادة المهمة لفتح جواهر الإتقان.";

  const subtitleEn = isPreview
    ? "Curriculum preview mode: official XP, coins, and verified lesson gems are credited in live curriculum missions."
    : scorePct >= 90
      ? "Your mastery score was verified on the server and your XP, coins, and lesson gems were credited."
      : "Progress and coins credited. Score 90%+ on a retry to unlock verified mastery gems.";

  const gemNoteAr =
    scorePct === 100
      ? "أهّلك إتقان 100% للحصول على 5 جواهر أساسية (90%+) + 3 جواهر كمال (100%)."
      : scorePct >= 90
        ? "أهّلك تحقيق 90%+ لفتح 5 جواهر إتقان! 100% تضيف +3 جواهر إضافية."
        : "تُمنح 5 جواهر عند تحقيق 90%+، و+3 جواهر إضافية عند تحقيق 100%.";

  const gemNoteEn =
    scorePct === 100
      ? "100% mastery qualifies for 5 base gems (90%+) + 3 perfection bonus gems (100%)."
      : scorePct >= 90
        ? "90%+ unlocks 5 mastery gems! Reach 100% for +3 bonus gems."
        : "Earn 5 gems at 90%+ accuracy and +3 bonus gems at 100%.";

  return {
    scorePct,
    rank,
    tierColor,
    xpReward,
    coinReward,
    verifiedGems,
    isPreview,
    gemBreakdown: {
      base90Gems,
      perfect100BonusGems,
      totalEligibleGems,
    },
    titleAr,
    titleEn,
    subtitleAr,
    subtitleEn,
    gemNoteAr,
    gemNoteEn,
  };
}

export interface ExamAchievementInput {
  passed: boolean;
  scorePct: number;
  correctCount: number;
  totalQuestions: number;
  shieldsLeft: number;
  xpReward: number;
  coinReward: number;
  hasServerBox: boolean;
  boxOpened: boolean;
  boxTier?: string;
  boxCoins?: number;
  boxXp?: number;
}

export interface ExamAchievementSummary {
  passed: boolean;
  scorePct: number;
  rank: "S+" | "S" | "A" | "B";
  giftTier: "gold" | "silver" | "bronze";
  shieldsLeft: number;
  xpReward: number;
  coinReward: number;
  hasServerBox: boolean;
  boxOpened: boolean;
  boxCoins: number;
  boxXp: number;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  giftTitleAr: string;
  giftTitleEn: string;
}

function normalizeGiftTier(
  boxTier: string | undefined,
  scorePct: number,
): "gold" | "silver" | "bronze" {
  const clean = (boxTier || "").trim().toLowerCase();
  if (clean === "gold" || clean === "silver" || clean === "bronze") {
    return clean;
  }
  if (scorePct >= 90) return "gold";
  if (scorePct >= 75) return "silver";
  return "bronze";
}

export function computeExamAchievementSummary(
  input: ExamAchievementInput,
): ExamAchievementSummary {
  const scorePct = Number.isFinite(input.scorePct)
    ? Math.max(0, Math.min(100, Math.round(input.scorePct)))
    : 0;
  const passed = Boolean(input.passed);
  const shieldsLeft = Math.max(0, Math.round(input.shieldsLeft));
  const xpReward = Math.max(0, Math.round(input.xpReward));
  const coinReward = Math.max(0, Math.round(input.coinReward));
  const boxCoins = Math.max(0, Math.round(input.boxCoins ?? 0));
  const boxXp = Math.max(0, Math.round(input.boxXp ?? 0));

  let rank: "S+" | "S" | "A" | "B" = "B";
  if (passed && scorePct >= 95) rank = "S+";
  else if (passed && scorePct >= 85) rank = "S";
  else if (passed) rank = "A";

  const giftTier = normalizeGiftTier(input.boxTier, scorePct);

  const titleAr = passed
    ? scorePct >= 90
      ? "انتصار باهر! اجتزت تحدي الوحدة بامتياز"
      : "مبروك النجاح! اجتزت امتحان الوحدة بنجاح"
    : "انتهت المحاولة — هذه خريطة تعافيك للعودة أقوى";

  const titleEn = passed
    ? scorePct >= 90
      ? "Outstanding Victory! Unit Exam Cleared with Honors"
      : "Congratulations! Unit Exam Passed"
    : "Exam Complete — Diagnostic Recovery Plan Ready";

  const subtitleAr = passed
    ? `حققت ${input.correctCount} من ${input.totalQuestions} (${scorePct}%) مع بقاء ${shieldsLeft} درع حماية.`
    : `أجبت عن ${input.correctCount} من ${input.totalQuestions} (${scorePct}%). راجع الأخطاء بالأسفل ثم أعد المحاولة لفتح الصندوق.`;

  const subtitleEn = passed
    ? `Scored ${input.correctCount} of ${input.totalQuestions} (${scorePct}%) with ${shieldsLeft} shield(s) remaining.`
    : `Scored ${input.correctCount} of ${input.totalQuestions} (${scorePct}%). Review diagnostics below and retry to claim the exam gift.`;

  const giftTitleAr =
    giftTier === "gold"
      ? "صندوق التفوق الذهبي"
      : giftTier === "silver"
        ? "صندوق النجاح الفضي"
        : "صندوق الإنجاز البرونزي";

  const giftTitleEn =
    giftTier === "gold"
      ? "Golden Honors Gift Chest"
      : giftTier === "silver"
        ? "Silver Victory Gift Chest"
        : "Bronze Exam Gift Chest";

  return {
    passed,
    scorePct,
    rank,
    giftTier,
    shieldsLeft,
    xpReward,
    coinReward,
    hasServerBox: Boolean(input.hasServerBox),
    boxOpened: Boolean(input.boxOpened),
    boxCoins,
    boxXp,
    titleAr,
    titleEn,
    subtitleAr,
    subtitleEn,
    giftTitleAr,
    giftTitleEn,
  };
}
