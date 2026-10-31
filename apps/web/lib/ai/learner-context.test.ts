import test from "node:test";
import assert from "node:assert/strict";
import { formatLearnerContext } from "../../../../supabase/functions/noata-ai/learner-context.ts";

const NOW = Date.parse("2026-10-28T12:00:00.000Z");

test("empty progress is described honestly without inventing an available lesson", () => {
  const text = formatLearnerContext({}, NOW);
  assert.match(text, /No learning evidence has been recorded yet/);
  assert.match(text, /Reviews due now: 0/);
  assert.doesNotMatch(text, /XP: 0/);
  assert.doesNotMatch(text, /mastery/i);
  assert.match(text, /choose a published track/);
});

test("recorded progress includes completion, strengths, weak skills, and due reviews", () => {
  const text = formatLearnerContext(
    {
      displayName: "Mazen",
      xp: 420,
      streakDays: 6,
      totalLessons: 36,
      courseTitle: "First Secondary · Term 1",
      completedLessons: [
        { title: "التفكير الإنساني", score: 92, completedAt: "2026-10-27T09:00:00.000Z" },
        { title: "The Hydrosphere on Earth", score: 75, completedAt: "2026-10-26T09:00:00.000Z" },
      ],
      skills: [
        { title: "Argument structure", mastery: 88, state: "mastered", dueAt: "2026-11-04T09:00:00.000Z" },
        { title: "Quadratic inequalities", mastery: 31, state: "reteach", dueAt: "2026-10-27T09:00:00.000Z" },
        { title: "Water density", mastery: 64, state: "supported", dueAt: "2026-10-28T08:00:00.000Z" },
      ],
    },
    NOW,
  );
  assert.match(text, /Mazen/);
  assert.match(text, /XP: 420/);
  assert.match(text, /Lessons completed: 2 of 36/);
  assert.match(text, /التفكير الإنساني/);
  assert.match(text, /Strongest recorded skills/);
  assert.match(text, /Argument structure \(88%, mastered\)/);
  assert.match(text, /Skills that need attention/);
  assert.match(text, /Quadratic inequalities \(31%, reteach\)/);
  assert.match(text, /Reviews due now: 2/);
  assert.match(text, /Due review topics/);
});

test("the completed count is independent of the bounded recent-lesson list", () => {
  const text = formatLearnerContext(
    {
      totalLessons: 36,
      completedCount: 20,
      completedLessons: [
        { title: "Lesson 20", score: 80 },
        { title: "Lesson 19", score: 70 },
      ],
    },
    NOW,
  );
  assert.match(text, /Lessons completed: 20 of 36/);
  assert.doesNotMatch(text, /Lessons completed: 2 of 36/);
});

test("the selected curriculum track drives the content language", () => {
  const text = formatLearnerContext(
    {
      tracks: [
        {
          slug: "integrated-science-en",
          subject: "Integrated Science",
          title: "Integrated Science — English track",
          contentLanguage: "en",
          completed: 2,
          total: 5,
          mastery: 58,
        },
        {
          slug: "mathematics-ar",
          subject: "Mathematics",
          title: "Mathematics — Arabic track",
          contentLanguage: "ar",
          completed: 5,
          total: 5,
          mastery: 81,
        },
      ],
    },
    NOW,
  );
  assert.match(text, /Curriculum track in use: Integrated Science — English track/);
  assert.match(text, /content language: English/);
  assert.match(text, /Answer this track's curriculum content in English/);
  assert.match(text, /Track progress: .*2\/5 lessons completed.*average mastery 58%/);
  assert.match(text, /Keep the Arabic and English editions of Integrated Science and Mathematics separate/);
});

test("a track context never leaks an unbounded number of tracks", () => {
  const tracks = Array.from({ length: 12 }, (_, index) => ({
    slug: `track-${index}`,
    subject: `Subject ${index}`,
    title: `Track ${index}`,
    contentLanguage: "ar" as const,
  }));
  const text = formatLearnerContext({ tracks }, NOW);
  assert.match(text, /Track 0/);
  assert.doesNotMatch(text, /Track 11/);
});

test("hostile or oversized labels are flattened and bounded", () => {
  const text = formatLearnerContext(
    {
      displayName: "<script>alert(1)</script>\nMazen".repeat(20),
      skills: [
        { title: "A".repeat(400) + "\n<b>", mastery: 150, state: "mastered".repeat(20) },
      ],
    },
    NOW,
  );
  assert.doesNotMatch(text, /<script>/);
  assert.doesNotMatch(text, /<b>/);
  assert.doesNotMatch(text, /\nMazen/);
  assert.match(text, /100%,/);
  assert.ok(text.length < 4000, "context must stay bounded");
});

test("invalid numbers are omitted instead of rendered as NaN", () => {
  const text = formatLearnerContext(
    { xp: Number.NaN, streakDays: -3, skills: [{ title: "Fractions", mastery: Number.NaN, state: "new" }] },
    NOW,
  );
  assert.doesNotMatch(text, /NaN/);
  assert.doesNotMatch(text, /-3/);
  assert.doesNotMatch(text, /Fractions/);
  assert.match(text, /No learning evidence has been recorded yet/);
});
