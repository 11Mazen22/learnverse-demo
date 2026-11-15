import assert from "node:assert/strict";
import test from "node:test";
import {
  clampSidebarWidth,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from "./sidebar-config.ts";
import {
  extractShellPreferencesFromDashboard,
  LEGACY_SIDEBAR_COLLAPSED_KEY,
  mergeDashboardIntoExistingPreferences,
  mergeShellIntoDashboardPreferences,
  parseShellPreferences,
  purgeForeignOrSignedOutShellPreferences,
  readScopedShellPreferences,
  scopedShellPrefsKey,
  writeScopedShellPreferences,
} from "./sidebar-preferences.ts";

function createMemoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
  };
}

test("clampSidebarWidth enforces 248..420 bounds and 288 default", () => {
  assert.equal(clampSidebarWidth(undefined), SIDEBAR_DEFAULT_WIDTH);
  assert.equal(clampSidebarWidth(Number.NaN), SIDEBAR_DEFAULT_WIDTH);
  assert.equal(clampSidebarWidth(120), SIDEBAR_MIN_WIDTH);
  assert.equal(clampSidebarWidth(999), SIDEBAR_MAX_WIDTH);
  assert.equal(clampSidebarWidth(335.6), 336);
});

test("parseShellPreferences normalizes corrupt storage payloads safely", () => {
  const parsed = parseShellPreferences({
    widthPx: 600,
    collapsed: "yes",
    openGroups: {
      learning: false,
      "bad key!": true,
      tools: "nope",
      progress: true,
    },
  });
  assert.equal(parsed.widthPx, SIDEBAR_MAX_WIDTH);
  assert.equal(parsed.collapsed, false);
  assert.deepEqual(parsed.openGroups, { learning: false, progress: true });
});

test("dashboard_preferences merging preserves dashboard widgets and sidebar shell slice bidirectionally", () => {
  const initialDashboard = {
    version: 1,
    hiddenWidgets: ["weak_radar"],
    widgetOrder: ["curriculum", "metrics", "consistency", "next_steps", "weak_radar", "quick_launcher"],
    goals: { weeklyCardsTarget: 90, weeklyLessonsTarget: 6, dailyMinutesTarget: 40 },
  };

  const withShell = mergeShellIntoDashboardPreferences(initialDashboard, {
    version: 1,
    widthPx: 344,
    collapsed: true,
    openGroups: { progress: true },
  });

  const extracted = extractShellPreferencesFromDashboard(withShell);
  assert.deepEqual(extracted, {
    version: 1,
    widthPx: 344,
    collapsed: true,
    openGroups: { progress: true },
  });

  // Saving dashboard widgets again must preserve the `.shell` object!
  const afterDashboardEdit = mergeDashboardIntoExistingPreferences(withShell, {
    version: 1,
    hiddenWidgets: [],
    widgetOrder: initialDashboard.widgetOrder,
    goals: { weeklyCardsTarget: 120, weeklyLessonsTarget: 8, dailyMinutesTarget: 45 },
  });

  assert.deepEqual(extractShellPreferencesFromDashboard(afterDashboardEdit), {
    version: 1,
    widthPx: 344,
    collapsed: true,
    openGroups: { progress: true },
  });
  assert.deepEqual(
    (afterDashboardEdit.goals as Record<string, number>).weeklyCardsTarget,
    120,
  );
});

test("scoped shell storage and account switch / sign-out cleanup isolate students", () => {
  const storage = createMemoryStorage({
    [LEGACY_SIDEBAR_COLLAPSED_KEY]: "1",
    [scopedShellPrefsKey("student-a")]: JSON.stringify({ widthPx: 380, collapsed: true }),
    [scopedShellPrefsKey("guest")]: JSON.stringify({ widthPx: 260, collapsed: false }),
  });

  writeScopedShellPreferences(storage, "student-b", {
    version: 1,
    widthPx: 312,
    collapsed: false,
    openGroups: { tools: false },
  });

  // Switch to student-b: legacy key + student-a + guest cleaned up; student-b intact
  const removedOnSwitch = purgeForeignOrSignedOutShellPreferences(storage, "student-b");
  assert.equal(removedOnSwitch, 3);
  assert.equal(storage.getItem(LEGACY_SIDEBAR_COLLAPSED_KEY), null);
  assert.equal(readScopedShellPreferences(storage, "student-a"), null);
  assert.equal(readScopedShellPreferences(storage, "student-b")?.widthPx, 312);

  // Sign out: student-b must be purged so next visitor does not inherit width or collapse
  const removedOnSignOut = purgeForeignOrSignedOutShellPreferences(storage, null);
  assert.equal(removedOnSignOut, 1);
  assert.equal(readScopedShellPreferences(storage, "student-b"), null);
});
