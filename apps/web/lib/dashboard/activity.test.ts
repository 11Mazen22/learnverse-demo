import assert from "node:assert/strict";
import test from "node:test";
import { buildConsistencyHeatmap } from "./activity.ts";

test("buildConsistencyHeatmap buckets 14 days cleanly and tallies 7-day weekly progress", () => {
  const now = new Date("2026-11-14T15:00:00Z");
  const events = [
    { timestamp: "2026-11-14T10:00:00Z", kind: "flashcard" as const },
    { timestamp: "2026-11-14T11:00:00Z", kind: "flashcard" as const },
    { timestamp: "2026-11-14T12:00:00Z", kind: "lesson" as const },
    { timestamp: "2026-11-12T08:00:00Z", kind: "task" as const },
    { timestamp: "2026-11-02T09:00:00Z", kind: "attempt" as const },
    { timestamp: "not-a-date", kind: "attempt" as const },
    { timestamp: "2026-09-01T09:00:00Z", kind: "lesson" as const },
  ];

  const summary = buildConsistencyHeatmap(events, { windowDays: 14, now, locale: "en" });
  assert.equal(summary.days.length, 14);
  assert.equal(summary.days[0].dateKey, "2026-11-01");
  assert.equal(summary.days[13].dateKey, "2026-11-14");
  assert.equal(summary.days[13].count, 3);
  assert.equal(summary.days[13].intensity, 2);
  assert.equal(summary.activeDaysInWindow, 3);
  assert.equal(summary.totalEventsInWindow, 5);
  assert.deepEqual(summary.weeklyProgress, {
    lessons: 1,
    flashcards: 2,
    tasks: 1,
    attempts: 0,
  });
});
