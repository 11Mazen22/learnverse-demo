export type StudyActivityEventKind = "attempt" | "lesson" | "task" | "flashcard";

export type StudyActivityEvent = {
  timestamp: string;
  kind: StudyActivityEventKind;
};

export type ActivityDayCell = {
  dateKey: string;
  labelShort: string;
  count: number;
  intensity: 0 | 1 | 2 | 3;
  breakdown: Record<StudyActivityEventKind, number>;
};

export type ConsistencySummary = {
  days: ActivityDayCell[];
  activeDaysInWindow: number;
  totalEventsInWindow: number;
  weeklyProgress: {
    lessons: number;
    flashcards: number;
    tasks: number;
    attempts: number;
  };
};

function toUtcDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Build a deterministic 14-day (or 28-day) study consistency calendar and 7-day goal tallies
 * purely from persisted learning & study timestamps.
 */
export function buildConsistencyHeatmap(
  events: readonly StudyActivityEvent[],
  options: {
    windowDays?: 14 | 28;
    now?: Date;
    locale?: "ar" | "en";
  } = {},
): ConsistencySummary {
  const windowDays = options.windowDays ?? 14;
  const now = options.now ?? new Date();
  const locale = options.locale === "en" ? "en" : "ar";

  const endUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayCells: ActivityDayCell[] = [];
  const cellByKey = new Map<string, ActivityDayCell>();

  const formatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "short",
    timeZone: "UTC",
  });

  for (let offset = windowDays - 1; offset >= 0; offset -= 1) {
    const dt = new Date(endUtc.getTime() - offset * 86_400_000);
    const key = toUtcDateKey(dt);
    const cell: ActivityDayCell = {
      dateKey: key,
      labelShort: formatter.format(dt),
      count: 0,
      intensity: 0,
      breakdown: { attempt: 0, lesson: 0, task: 0, flashcard: 0 },
    };
    dayCells.push(cell);
    cellByKey.set(key, cell);
  }

  const weekCutoffMs = endUtc.getTime() - 6 * 86_400_000;
  const endWindowCutoffMs = endUtc.getTime() + 86_400_000;
  const weeklyProgress = { lessons: 0, flashcards: 0, tasks: 0, attempts: 0 };

  for (const event of events) {
    const parsed = Date.parse(event.timestamp);
    if (!Number.isFinite(parsed)) continue;
    const key = toUtcDateKey(new Date(parsed));
    const cell = cellByKey.get(key);
    if (cell) {
      cell.count += 1;
      cell.breakdown[event.kind] += 1;
    }

    if (parsed >= weekCutoffMs && parsed < endWindowCutoffMs) {
      if (event.kind === "lesson") weeklyProgress.lessons += 1;
      else if (event.kind === "flashcard") weeklyProgress.flashcards += 1;
      else if (event.kind === "task") weeklyProgress.tasks += 1;
      else weeklyProgress.attempts += 1;
    }
  }

  let activeDaysInWindow = 0;
  let totalEventsInWindow = 0;

  for (const cell of dayCells) {
    if (cell.count > 0) activeDaysInWindow += 1;
    totalEventsInWindow += cell.count;
    cell.intensity = cell.count === 0 ? 0 : cell.count <= 2 ? 1 : cell.count <= 6 ? 2 : 3;
  }

  return {
    days: dayCells,
    activeDaysInWindow,
    totalEventsInWindow,
    weeklyProgress,
  };
}
