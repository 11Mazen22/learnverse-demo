import assert from "node:assert/strict";
import test from "node:test";
import { computeNextAction } from "./next-action.ts";

const NOW = Date.UTC(2026, 10, 14, 12, 0, 0);

test("computeNextAction prioritizes urgent or overdue class assignments over flashcards and lessons", () => {
  const action = computeNextAction({
    signedIn: true,
    evidenceReady: true,
    progressReady: true,
    dueAssignments: [
      { id: "a-late", title: "Lab Safety Report", due_at: new Date(NOW - 3 * 3600_000).toISOString() },
      { id: "a-future", title: "Later Essay", due_at: new Date(NOW + 72 * 3600_000).toISOString() },
    ],
    dueFlashcards: 14,
    dueSkills: 5,
    nextLesson: { id: "l-1", title_ar: "درس ١", title_en: "Lesson 1" },
    activeTrack: null,
    nowMs: NOW,
  });

  assert.equal(action.kind, "assignment-urgent");
  assert.equal(action.urgency, "critical");
  assert.equal(action.href, "/assignments?focus=a-late");
});

test("computeNextAction chooses due flashcards when backlog outweighs or matches due skills", () => {
  const action = computeNextAction({
    signedIn: true,
    evidenceReady: true,
    progressReady: true,
    dueAssignments: [{ id: "a-1", title: "Next Week Quiz", due_at: new Date(NOW + 96 * 3600_000).toISOString() }],
    dueFlashcards: 6,
    dueSkills: 2,
    nextLesson: { id: "l-1", title_ar: "درس ١", title_en: "Lesson 1" },
    activeTrack: null,
    nowMs: NOW,
  });

  assert.equal(action.kind, "review-due");
  assert.equal(action.href, "/study?mode=due");
});

test("computeNextAction routes to /review when curriculum skills outweigh flashcards", () => {
  const action = computeNextAction({
    signedIn: true,
    evidenceReady: true,
    progressReady: true,
    dueAssignments: [],
    dueFlashcards: 1,
    dueSkills: 4,
    nextLesson: { id: "l-1", title_ar: "درس ١", title_en: "Lesson 1" },
    activeTrack: null,
    nowMs: NOW,
  });

  assert.equal(action.kind, "review-due");
  assert.equal(action.href, "/review");
});

test("computeNextAction falls back to first incomplete lesson and truthful guest onboarding", () => {
  const lessonAction = computeNextAction({
    signedIn: true,
    evidenceReady: true,
    progressReady: true,
    dueAssignments: [],
    dueFlashcards: 0,
    dueSkills: 0,
    nextLesson: { id: "l-9", title_ar: "الخصائص الحرارية", title_en: "Thermal Properties" },
    activeTrack: {
      slug: "integrated-science-en",
      titleAr: "العلوم",
      titleEn: "Science",
      contentLanguage: "en",
      done: 3,
      total: 10,
    },
    nowMs: NOW,
  });
  assert.equal(lessonAction.kind, "next-lesson");
  assert.equal(lessonAction.href, "/lesson/l-9");
  assert.equal(lessonAction.titleAr, "Thermal Properties");

  const guestAction = computeNextAction({
    signedIn: false,
    evidenceReady: false,
    progressReady: false,
    dueAssignments: [{ id: "a-ignore", title: "Ignored", due_at: new Date(NOW).toISOString() }],
    dueFlashcards: 9,
    dueSkills: 9,
    nextLesson: null,
    activeTrack: null,
    nowMs: NOW,
  });
  assert.equal(guestAction.kind, "guest-onboarding");
  assert.equal(guestAction.href, "/learn");
});
