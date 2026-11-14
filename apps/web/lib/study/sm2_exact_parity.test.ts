import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { previewIntervalsForCard, scheduleFlashcard, type RecallRating } from "./scheduler.ts";

const NOW = Date.parse("2026-11-14T12:00:00.000Z");

test("TS scheduler constants and branches match M2 PL/pgSQL private.review_flashcard verbatim", async () => {
  const sql = await readFile(
    new URL("../../../../supabase/migrations/20261114000100_study_ecosystem_v2.sql", import.meta.url),
    "utf8",
  );

  // Confirm SQL constants inside private.review_flashcard match TS math
  assert.ok(sql.includes("greatest(1.30, v_ease - 0.20)"));
  assert.ok(sql.includes("interval '10 minutes'"));
  assert.ok(sql.includes("greatest(1, ceil(greatest(v_card.interval_days, 1) * 1.20)::int)"));
  assert.ok(sql.includes("greatest(1.30, v_ease - 0.15)"));
  assert.ok(sql.includes("when v_repetitions = 0 then 1"));
  assert.ok(sql.includes("when v_repetitions = 1 then 6"));
  assert.ok(sql.includes("least(3650, greatest(1, round(v_card.interval_days * v_ease)::int))"));
  assert.ok(sql.includes("when v_repetitions = 0 then 4"));
  assert.ok(sql.includes("when v_repetitions = 1 then 8"));
  assert.ok(sql.includes("least(3650, greatest(1, round(v_card.interval_days * v_ease * 1.30)::int))"));
  assert.ok(sql.includes("least(3.00, v_ease + 0.15)"));
});

test("multi-step SM-2 trajectories match server PL/pgSQL formulas across bounds", () => {
  const initial = { intervalDays: 0, easeFactor: 2.5, repetitions: 0, lapses: 0 };

  // Good on rep 0 -> 1d, rep 1 -> 6d, rep 2 -> round(6 * 2.5) = 15d
  const r1 = scheduleFlashcard(initial, 2, NOW);
  assert.deepEqual(
    { intervalDays: r1.intervalDays, easeFactor: r1.easeFactor, repetitions: r1.repetitions, lapses: r1.lapses, state: r1.state },
    { intervalDays: 1, easeFactor: 2.5, repetitions: 1, lapses: 0, state: "review" },
  );

  const r2 = scheduleFlashcard(r1, 2, NOW);
  assert.equal(r2.intervalDays, 6);
  assert.equal(r2.repetitions, 2);

  const r3 = scheduleFlashcard(r2, 2, NOW);
  assert.equal(r3.intervalDays, 15);
  assert.equal(r3.repetitions, 3);

  // Easy from rep 0 -> 4d, rep 1 -> 8d, plus +0.15 ease each step
  const e1 = scheduleFlashcard(initial, 3, NOW);
  assert.equal(e1.intervalDays, 4);
  assert.equal(e1.easeFactor, 2.65);

  const e2 = scheduleFlashcard(e1, 3, NOW);
  assert.equal(e2.intervalDays, 8);
  assert.equal(e2.easeFactor, 2.8);

  // Again resets repetitions to 0, increments lapses, sets interval to 0 and +10min dueAt
  const lapsed = scheduleFlashcard(r3, 0, NOW);
  assert.equal(lapsed.intervalDays, 0);
  assert.equal(lapsed.repetitions, 0);
  assert.equal(lapsed.lapses, 1);
  assert.equal(lapsed.easeFactor, 2.3);
  assert.equal(lapsed.state, "learning");
  assert.equal(lapsed.dueAt, "2026-11-14T12:10:00.000Z");

  // Clamping: lower ease floor 1.30, upper ease cap 3.00, upper interval cap 3650d
  let low = { intervalDays: 2, easeFactor: 1.35, repetitions: 2, lapses: 2 };
  for (let i = 0; i < 4; i++) low = scheduleFlashcard(low, 0, NOW);
  assert.equal(low.easeFactor, 1.3);

  const highCap = scheduleFlashcard({ intervalDays: 2000, easeFactor: 2.9, repetitions: 10, lapses: 0 }, 3, NOW);
  assert.equal(highCap.easeFactor, 3);
  assert.equal(highCap.intervalDays, 3650);
});

test("previewIntervalsForCard derives card-accurate bilingual labels dynamically", () => {
  const mature = previewIntervalsForCard(
    { intervalDays: 10, easeFactor: 2.5, repetitions: 3, lapses: 0 },
    "en",
    NOW,
  );
  assert.deepEqual(
    mature.map((p: { rating: RecallRating; label: string }) => [p.rating, p.label]),
    [
      [0, "< 10 mins"],
      [1, "12 days"],
      [2, "25 days"],
      [3, "33 days"],
    ],
  );

  const arabicFresh = previewIntervalsForCard(
    { intervalDays: 0, easeFactor: 2.5, repetitions: 0, lapses: 0 },
    "ar",
    NOW,
  );
  assert.equal(arabicFresh[0].label, "أقل من 10 دقائق");
  assert.equal(arabicFresh[2].label, "يوم واحد");
  assert.equal(arabicFresh[3].label, "4 أيام");
});
