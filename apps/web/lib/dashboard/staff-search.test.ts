import { test } from "node:test";
import assert from "node:assert/strict";
import { filterStaffSearch, matchesStaffSearch } from "./staff-search.ts";

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

test("locale selection is explicit and non-English locales use the Arabic search locale", () => {
  assert.equal(matchesStaffSearch("LESSON", ["Lesson One"], "en"), true);
  assert.equal(matchesStaffSearch("درس", ["الدرس الأول"], "ar"), true);
});
