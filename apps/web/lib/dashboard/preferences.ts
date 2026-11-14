export type DashboardWidgetId =
  | "metrics"
  | "consistency"
  | "next_steps"
  | "weak_radar"
  | "curriculum"
  | "quick_launcher";

export type DashboardGoals = {
  weeklyCardsTarget: number;
  weeklyLessonsTarget: number;
  dailyMinutesTarget: number;
};

export type DashboardPreferences = {
  version: 1;
  hiddenWidgets: DashboardWidgetId[];
  widgetOrder: DashboardWidgetId[];
  goals: DashboardGoals;
};

export const ALL_DASHBOARD_WIDGET_IDS: readonly DashboardWidgetId[] = [
  "metrics",
  "consistency",
  "next_steps",
  "weak_radar",
  "curriculum",
  "quick_launcher",
] as const;

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  version: 1,
  hiddenWidgets: [],
  widgetOrder: [...ALL_DASHBOARD_WIDGET_IDS],
  goals: {
    weeklyCardsTarget: 40,
    weeklyLessonsTarget: 4,
    dailyMinutesTarget: 30,
  },
};

const VALID_WIDGET_SET = new Set<string>(ALL_DASHBOARD_WIDGET_IDS);

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.round(num)));
}

/**
 * Parse untrusted JSONB or localStorage payloads into validated DashboardPreferences.
 * Ensures widgetOrder always contains every known widget exactly once without duplicates.
 */
export function parseDashboardPreferences(raw: unknown): DashboardPreferences {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ...DEFAULT_DASHBOARD_PREFERENCES,
      hiddenWidgets: [],
      widgetOrder: [...ALL_DASHBOARD_WIDGET_IDS],
      goals: { ...DEFAULT_DASHBOARD_PREFERENCES.goals },
    };
  }

  const record = raw as Record<string, unknown>;
  const hiddenSet = new Set<DashboardWidgetId>();
  if (Array.isArray(record.hiddenWidgets)) {
    for (const id of record.hiddenWidgets) {
      if (typeof id === "string" && VALID_WIDGET_SET.has(id)) {
        hiddenSet.add(id as DashboardWidgetId);
      }
    }
  }

  const ordered: DashboardWidgetId[] = [];
  const seen = new Set<DashboardWidgetId>();
  if (Array.isArray(record.widgetOrder)) {
    for (const id of record.widgetOrder) {
      if (
        typeof id === "string" &&
        VALID_WIDGET_SET.has(id) &&
        !seen.has(id as DashboardWidgetId)
      ) {
        const validId = id as DashboardWidgetId;
        ordered.push(validId);
        seen.add(validId);
      }
    }
  }
  for (const id of ALL_DASHBOARD_WIDGET_IDS) {
    if (!seen.has(id)) ordered.push(id);
  }

  const rawGoals =
    record.goals && typeof record.goals === "object" && !Array.isArray(record.goals)
      ? (record.goals as Record<string, unknown>)
      : {};

  return {
    version: 1,
    hiddenWidgets: [...hiddenSet],
    widgetOrder: ordered,
    goals: {
      weeklyCardsTarget: clampInt(
        rawGoals.weeklyCardsTarget,
        5,
        500,
        DEFAULT_DASHBOARD_PREFERENCES.goals.weeklyCardsTarget,
      ),
      weeklyLessonsTarget: clampInt(
        rawGoals.weeklyLessonsTarget,
        1,
        50,
        DEFAULT_DASHBOARD_PREFERENCES.goals.weeklyLessonsTarget,
      ),
      dailyMinutesTarget: clampInt(
        rawGoals.dailyMinutesTarget,
        10,
        240,
        DEFAULT_DASHBOARD_PREFERENCES.goals.dailyMinutesTarget,
      ),
    },
  };
}

export function serializeDashboardPreferences(
  prefs: DashboardPreferences,
): Record<string, unknown> {
  const normalized = parseDashboardPreferences(prefs);
  return {
    version: 1,
    hiddenWidgets: normalized.hiddenWidgets,
    widgetOrder: normalized.widgetOrder,
    goals: { ...normalized.goals },
  };
}

export function toggleWidgetVisibility(
  prefs: DashboardPreferences,
  widgetId: DashboardWidgetId,
): DashboardPreferences {
  const isHidden = prefs.hiddenWidgets.includes(widgetId);
  return {
    ...prefs,
    hiddenWidgets: isHidden
      ? prefs.hiddenWidgets.filter((id) => id !== widgetId)
      : [...prefs.hiddenWidgets, widgetId],
  };
}

export function moveWidgetOrder(
  prefs: DashboardPreferences,
  widgetId: DashboardWidgetId,
  direction: "up" | "down",
): DashboardPreferences {
  const idx = prefs.widgetOrder.indexOf(widgetId);
  if (idx < 0) return prefs;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= prefs.widgetOrder.length) return prefs;
  const nextOrder = [...prefs.widgetOrder];
  const [moved] = nextOrder.splice(idx, 1);
  nextOrder.splice(swapIdx, 0, moved);
  return { ...prefs, widgetOrder: nextOrder };
}

export function scopedDashboardPreferencesKey(userId: string | null): string {
  return `noata:dashboard-prefs:${userId || "guest"}`;
}
