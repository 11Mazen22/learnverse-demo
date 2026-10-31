import assert from "node:assert/strict";
import test from "node:test";
import { scheduleFlashcard } from "./scheduler.ts";

const NOW = Date.parse("2026-10-29T12:00:00.000Z");
const NEW_CARD = { intervalDays: 0, easeFactor: 2.5, repetitions: 0, lapses: 0 };

test("again schedules a short relearning step without claiming mastery", () => {
  const result = scheduleFlashcard(NEW_CARD, 0, NOW);
  assert.equal(result.intervalDays, 0);
  assert.equal(result.repetitions, 0);
  assert.equal(result.lapses, 1);
  assert.equal(result.state, "learning");
  assert.equal(result.dueAt, "2026-10-29T12:10:00.000Z");
});

test("good follows the documented first and second review intervals", () => {
  const first = scheduleFlashcard(NEW_CARD, 2, NOW);
  assert.equal(first.intervalDays, 1);
  assert.equal(first.state, "review");
  const second = scheduleFlashcard(
    { ...NEW_CARD, intervalDays: first.intervalDays, repetitions: first.repetitions },
    2,
    NOW,
  );
  assert.equal(second.intervalDays, 6);
});

test("easy lengthens the interval while keeping bounded ease", () => {
  const result = scheduleFlashcard(
    { intervalDays: 10, easeFactor: 2.95, repetitions: 4, lapses: 0 },
    3,
    NOW,
  );
  assert.equal(result.easeFactor, 3);
  assert.equal(result.intervalDays, 38);
  assert.equal(result.repetitions, 5);
});

test("hard never produces a zero-day interval", () => {
  const result = scheduleFlashcard(NEW_CARD, 1, NOW);
  assert.equal(result.intervalDays, 2);
  assert.equal(result.state, "learning");
});
