import test from "node:test";
import assert from "node:assert/strict";
import {
  AYAH_FORMS,
  LESSON_FORMS,
  NOTIFICATION_FORMS,
  formatArabicCount,
  formatCount,
  formatEnglishCount,
} from "./plural.ts";

test("Arabic ayah counts use the correct CLDR plural form", () => {
  assert.equal(formatArabicCount(0, AYAH_FORMS), "لا آيات");
  assert.equal(formatArabicCount(1, AYAH_FORMS), "آية واحدة");
  assert.equal(formatArabicCount(2, AYAH_FORMS), "آيتان");
  assert.equal(formatArabicCount(4, AYAH_FORMS), "٤ آيات");
  assert.equal(formatArabicCount(11, AYAH_FORMS), "١١ آية");
  assert.equal(formatArabicCount(100, AYAH_FORMS), "١٠٠ آية");
});

test("Arabic notification and lesson counts keep grammatical agreement", () => {
  assert.equal(formatArabicCount(1, NOTIFICATION_FORMS), "إشعار واحد");
  assert.equal(formatArabicCount(2, NOTIFICATION_FORMS), "إشعاران");
  assert.equal(formatArabicCount(7, NOTIFICATION_FORMS), "٧ إشعارات");
  // 100 selects CLDR "other" (many covers 11–99), so the noun stays singular.
  assert.equal(formatArabicCount(100, NOTIFICATION_FORMS), "١٠٠ إشعار");
  assert.equal(formatArabicCount(11, NOTIFICATION_FORMS), "١١ إشعارًا");
  assert.equal(formatArabicCount(3, LESSON_FORMS), "٣ دروس");
  assert.equal(formatArabicCount(25, LESSON_FORMS), "٢٥ درسًا");
});

test("English counts stay singular for one and plural otherwise", () => {
  assert.equal(formatEnglishCount(1, "verse"), "1 verse");
  assert.equal(formatEnglishCount(9, "verse"), "9 verses");
  assert.equal(formatEnglishCount(0, "notification"), "0 notifications");
});

test("locale-aware count switches language without changing the number", () => {
  assert.equal(formatCount("en", 3, AYAH_FORMS, { singular: "verse" }), "3 verses");
  assert.equal(formatCount("ar", 3, AYAH_FORMS, { singular: "verse" }), "٣ آيات");
});
