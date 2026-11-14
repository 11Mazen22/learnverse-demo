export type RecallRating = 0 | 1 | 2 | 3;

export type ScheduleInput = {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
};

export type ScheduleResult = {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
  state: "learning" | "review";
  dueAt: string;
};

export type IntervalPreview = {
  rating: RecallRating;
  intervalDays: number;
  nextState: "learning" | "review";
  label: string;
  title: string;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

/**
 * Pure counterpart to `private.review_flashcard`.
 *
 * Keeps math bit-for-bit identical to the PostgreSQL RPC (which remains
 * authoritative at runtime). Never awards XP, Coins, or Skill Mastery.
 */
export function scheduleFlashcard(
  input: ScheduleInput,
  rating: RecallRating,
  now = Date.now(),
): ScheduleResult {
  const currentInterval = clamp(Math.round(input.intervalDays || 0), 0, 3650);
  let easeFactor = clamp(Number(input.easeFactor) || 2.5, 1.3, 3);
  let repetitions = Math.max(0, Math.round(input.repetitions || 0));
  let lapses = Math.max(0, Math.round(input.lapses || 0));
  let intervalDays = 0;
  let dueAt = now;
  let state: ScheduleResult["state"] = "learning";

  if (rating === 0) {
    easeFactor = clamp(easeFactor - 0.2, 1.3, 3);
    repetitions = 0;
    lapses += 1;
    dueAt += 10 * 60 * 1000;
  } else if (rating === 1) {
    intervalDays = Math.max(1, Math.ceil(Math.max(currentInterval, 1) * 1.2));
    easeFactor = clamp(easeFactor - 0.15, 1.3, 3);
    repetitions += 1;
    dueAt += intervalDays * 86_400_000;
  } else {
    state = "review";
    if (rating === 2) {
      intervalDays =
        repetitions === 0
          ? 1
          : repetitions === 1
            ? 6
            : clamp(Math.round(currentInterval * easeFactor), 1, 3650);
    } else {
      intervalDays =
        repetitions === 0
          ? 4
          : repetitions === 1
            ? 8
            : clamp(Math.round(currentInterval * easeFactor * 1.3), 1, 3650);
      easeFactor = clamp(easeFactor + 0.15, 1.3, 3);
    }
    repetitions += 1;
    dueAt += intervalDays * 86_400_000;
  }

  return {
    intervalDays,
    easeFactor: Number(easeFactor.toFixed(2)),
    repetitions,
    lapses,
    state,
    dueAt: new Date(dueAt).toISOString(),
  };
}

/**
 * Formats estimated server scheduling intervals directly from the card's
 * current state so rating buttons reflect genuine per-card intervals.
 */
export function formatIntervalLabel(intervalDays: number, locale: "ar" | "en"): string {
  if (intervalDays <= 0) {
    return locale === "en" ? "< 10 mins" : "أقل من 10 دقائق";
  }
  if (intervalDays === 1) {
    return locale === "en" ? "1 day" : "يوم واحد";
  }
  if (locale === "en") {
    return `${intervalDays} days`;
  }
  if (intervalDays === 2) return "يومان";
  if (intervalDays <= 10) return `${intervalDays} أيام`;
  return `${intervalDays} يومًا`;
}

export function previewIntervalsForCard(
  input: ScheduleInput,
  locale: "ar" | "en",
  now = Date.now(),
): IntervalPreview[] {
  const ratings: Array<{ rating: RecallRating; titleAr: string; titleEn: string }> = [
    { rating: 0, titleAr: "مرة أخرى", titleEn: "Again" },
    { rating: 1, titleAr: "صعب", titleEn: "Hard" },
    { rating: 2, titleAr: "جيد", titleEn: "Good" },
    { rating: 3, titleAr: "سهل", titleEn: "Easy" },
  ];
  return ratings.map(({ rating, titleAr, titleEn }) => {
    const projected = scheduleFlashcard(input, rating, now);
    return {
      rating,
      intervalDays: projected.intervalDays,
      nextState: projected.state,
      title: locale === "en" ? titleEn : titleAr,
      label: formatIntervalLabel(projected.intervalDays, locale),
    };
  });
}
