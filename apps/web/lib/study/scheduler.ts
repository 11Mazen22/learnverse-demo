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

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

/**
 * Pure counterpart to public.review_flashcard.
 *
 * This is intentionally described as SM-2-inspired rather than proof of
 * mastery. The database RPC is authoritative; this helper exists so the rule
 * is documented and testable without trusting client-side scheduling.
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
