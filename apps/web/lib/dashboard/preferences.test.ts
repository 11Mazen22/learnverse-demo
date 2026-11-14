import assert from "node:assert/strict";
import test from "node:test";
import {
  ALL_DASHBOARD_WIDGET_IDS,
  DEFAULT_DASHBOARD_PREFERENCES,
  moveWidgetOrder,
  parseDashboardPreferences,
  scopedDashboardPreferencesKey,
  serializeDashboardPreferences,
  toggleWidgetVisibility,
} from "./preferences.ts";

test("parseDashboardPreferences normalizes corrupt or partial payloads safely", () => {
  const parsed = parseDashboardPreferences({
    hiddenWidgets: ["weak_radar", "unknown_widget", "weak_radar"],
    widgetOrder: ["curriculum", "metrics", "bogus"],
    goals: { weeklyCardsTarget: 9999, weeklyLessonsTarget: 0, dailyMinutesTarget: "45" },
  });

  assert.deepEqual(parsed.hiddenWidgets, ["weak_radar"]);
  assert.equal(parsed.widgetOrder[0], "curriculum");
  assert.equal(parsed.widgetOrder[1], "metrics");
  assert.equal(parsed.widgetOrder.length, ALL_DASHBOARD_WIDGET_IDS.length);
  assert.equal(parsed.goals.weeklyCardsTarget, 500);
  assert.equal(parsed.goals.weeklyLessonsTarget, 1);
  assert.equal(parsed.goals.dailyMinutesTarget, 45);
});

test("toggleWidgetVisibility and moveWidgetOrder update preferences immutably", () => {
  const hidden = toggleWidgetVisibility(DEFAULT_DASHBOARD_PREFERENCES, "consistency");
  assert.equal(hidden.hiddenWidgets.includes("consistency"), true);
  assert.equal(toggleWidgetVisibility(hidden, "consistency").hiddenWidgets.includes("consistency"), false);

  const reordered = moveWidgetOrder(DEFAULT_DASHBOARD_PREFERENCES, "consistency", "up");
  assert.equal(reordered.widgetOrder[0], "consistency");
  assert.equal(reordered.widgetOrder[1], "metrics");

  const roundTrip = parseDashboardPreferences(serializeDashboardPreferences(reordered));
  assert.deepEqual(roundTrip, reordered);
  assert.equal(scopedDashboardPreferencesKey(null), "noata:dashboard-prefs:guest");
});
