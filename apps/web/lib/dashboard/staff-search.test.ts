import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filterStaffSearch,
  matchesStaffSearch,
  normalizeStaffSearchText,
  paginateStaffItems,
  summarizeStudentProgress,
} from "./staff-search.ts";

test("blank or whitespace-only search returns every record", () => {
  const rows = [{ title: "Algebra" }, { title: "Biology" }];
  assert.deepEqual(filterStaffSearch(rows, "", "en", (row) => [row.title]), rows);
  assert.deepEqual(filterStaffSearch(rows, "   ", "en", (row) => [row.title]), rows);
});

test("English search ignores case and surrounding whitespace", () => {
  assert.equal(matchesStaffSearch("  ASSIGNMENT  ", ["Math Assignment", "Class 3"], "en"), true);
  assert.equal(matchesStaffSearch("history", ["Math Assignment", "Class 3"], "en"), false);
});

test("Arabic search matches Arabic content across the supplied fields", () => {
  assert.equal(matchesStaffSearch("الجهاز التنفسي", ["درس العلوم", "الجهاز التنفسي"], "ar"), true);
  assert.equal(matchesStaffSearch("الحسابات", ["المحتوى", "منشور"], "ar"), false);
});

test("search can match across a row's joined fields without changing source values", () => {
  const rows = [
    { student: "Mona Ali", assignment: "Respiratory System" },
    { student: "Omar", assignment: "Algebra" },
  ];
  const result = filterStaffSearch(rows, "mona ali respiratory", "en", (row) => [row.student, row.assignment]);
  assert.deepEqual(result, [rows[0]]);
  assert.equal(rows[0].student, "Mona Ali");
});

test("search terms can appear in any order and all must match", () => {
  const rows = [
    { student: "Mona Ali", assignment: "Respiratory System" },
    { student: "Mona Ali", assignment: "Algebra" },
    { student: "Omar", assignment: "Respiratory System" },
  ];
  assert.deepEqual(
    filterStaffSearch(rows, "respiratory mona", "en", (row) => [row.student, row.assignment]),
    [rows[0]],
  );
  assert.deepEqual(
    filterStaffSearch(rows, "respiratory omar", "en", (row) => [row.student, row.assignment]),
    [rows[2]],
  );
});

test("Arabic search folds diacritics, hamza forms, ta marbuta, tatweel and digits", () => {
  assert.equal(normalizeStaffSearchText("الْجِهَازُ التَّنَفُسِيُّ"), "الجهاز التنفسي");
  assert.equal(normalizeStaffSearchText("أحمد"), normalizeStaffSearchText("احمد"));
  assert.equal(normalizeStaffSearchText("مدرسة"), normalizeStaffSearchText("مدرسه"));
  assert.equal(normalizeStaffSearchText("مـــدرس"), normalizeStaffSearchText("مدرس"));
  assert.equal(normalizeStaffSearchText("الدرس ١٢٣"), "الدرس 123");
  assert.equal(normalizeStaffSearchText("الدرس ۱۲۳"), "الدرس 123");
  assert.equal(matchesStaffSearch("الجهاز", ["الْجِهَازُ التَّنَفُسِيُّ"], "ar"), true);
  assert.equal(matchesStaffSearch("احمد", ["أَحْمَد"], "ar"), true);
});

test("search ignores zero-width bidi controls and Latin accents", () => {
  assert.equal(normalizeStaffSearchText("\u200Fمدرسة\u200E"), normalizeStaffSearchText("مدرسه"));
  assert.equal(matchesStaffSearch("cafe", ["Café Noata"], "en"), true);
  assert.equal(matchesStaffSearch("café", ["Cafe Noata"], "en"), true);
});

test("locale selection is explicit and non-English locales use the Arabic search locale", () => {
  assert.equal(matchesStaffSearch("LESSON", ["Lesson One"], "en"), true);
  assert.equal(matchesStaffSearch("درس", ["الدرس الأول"], "ar"), true);
});

test("pagination returns the first page and exact result bounds", () => {
  const result = paginateStaffItems([1, 2, 3, 4, 5], 0, 2);
  assert.deepEqual(result.items, [1, 2]);
  assert.equal(result.page, 0);
  assert.equal(result.pageCount, 3);
  assert.equal(result.total, 5);
  assert.equal(result.start, 1);
  assert.equal(result.end, 2);
});

test("pagination clamps stale and invalid page indexes", () => {
  const result = paginateStaffItems([1, 2, 3], 99, 2);
  assert.deepEqual(result.items, [3]);
  assert.equal(result.page, 1);
  assert.equal(result.start, 3);
  assert.equal(result.end, 3);
  assert.equal(paginateStaffItems([1, 2], -4, 1).page, 0);
  assert.equal(paginateStaffItems([1, 2], Number.NaN, 1).page, 0);
});

test("pagination handles empty lists and safe page sizes", () => {
  const empty = paginateStaffItems([], 5, 0);
  assert.deepEqual(empty.items, []);
  assert.equal(empty.pageCount, 1);
  assert.equal(empty.page, 0);
  assert.equal(empty.start, 0);
  assert.equal(empty.end, 0);
  const result = paginateStaffItems([1, 2, 3], 0, Number.NaN);
  assert.equal(result.pageCount, 1);
  assert.deepEqual(result.items, [1, 2, 3]);
});

test("student progress summary uses only recorded lesson rows and the latest timestamp", () => {
  const summary = summarizeStudentProgress([
    { completed_at: "2026-10-18T09:00:00Z", best_score: 80, updated_at: "2026-10-18T09:00:00Z" },
    { completed_at: null, best_score: 60, updated_at: "2026-10-19T10:00:00Z" },
    { completed_at: "2026-10-17T12:00:00Z", best_score: 100, updated_at: "2026-10-17T12:00:00Z" },
  ]);
  assert.equal(summary.trackedLessons, 3);
  assert.equal(summary.completedLessons, 2);
  assert.equal(summary.averageBestScore, 80);
  assert.equal(summary.lastUpdated, "2026-10-19T10:00:00Z");
});

test("student progress summary does not invent averages or activity when no rows exist", () => {
  assert.deepEqual(summarizeStudentProgress([]), {
    trackedLessons: 0, completedLessons: 0, averageBestScore: null, lastUpdated: null,
  });
});
