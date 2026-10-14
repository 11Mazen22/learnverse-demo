import test from "node:test";
import assert from "node:assert/strict";
import { createVerseIndex, searchVerses, searchChapters, highlightedParts, searchableText } from "./search.ts";
// Synthetic Arabic sentences test normalization; they are not Quran text.
const rows = [
  { surah: 1, surahName: "Fixture 1", number: 1, text: "إِنَّ هَذَا نَصٌّ تَجْرِيبِيٌّ" },
  { surah: 18, surahName: "Fixture 18", number: 10, text: "نَصٌّ تَجْرِيبِيٌّ، آخَرُ" },
  { surah: 18, surahName: "Fixture 18", number: 11, text: "عبارة أخرى" },
];
const index = createVerseIndex(rows);
test("indexed search handles diacritics, tatweel, bounded alif forms, punctuation and partial phrases", () => {
  for (const query of ["نص تجريبي", "نَصٌّ تَجْرِيبِيٌّ", "نــص تجريبي", "نص، تجريبي", "نص تجريب"]) {
    const found = searchVerses(index, query, 1); assert.equal(found.total, 2); assert.deepEqual(new Set(found.results.map(r => r.text)), new Set(rows.slice(0, 2).map(r => r.text)));
  }
  assert.equal(searchVerses(index, "ان هذا", 1).results[0].text, rows[0].text);
  assert.equal(searchVerses(index, "لا وجود", 1).total, 0);
  assert.notEqual(searchableText("رحمة"), searchableText("رحمه"));
});
test("Arabic, Persian and Latin references resolve deterministically; filters never cross Surahs", () => {
  for (const query of ["18:10", "١٨:١٠", "۱۸/۱۰", "10", "١٠"]) assert.deepEqual(searchVerses(index, query, 18).results, [rows[1]]);
  assert.equal(searchVerses(index, "18:10", 1, 1).total, 0);
  assert.equal(searchVerses(index, "18:12", 1).total, 0);
  assert.equal(searchVerses(index, "نص تجريبي", 1, 18).total, 1);
  assert.deepEqual(searchVerses(index, "نص تجريبي", 1).results, [rows[1], rows[0]], "prefix then chapter/ayah rank is stable");
});
test("grapheme highlights retain every original byte and do not detach Arabic marks", () => {
  for (const query of ["نص تجريبي", "آخَر", "هذا", "18:10", "غير مطابق"]) for (const row of rows) {
    const parts = highlightedParts(row.text, query); assert.equal(parts.map(p => p.text).join(""), row.text);
    for (const part of parts.filter(p => p.matched)) assert.ok(!/^[\u064b-\u065f]/.test(part.text));
  }
  assert.ok(highlightedParts(rows[0].text, "نص تجريبي").some(part => part.matched));
});
test("Surah search ranks exact IDs/names, romanization, prefixes, aliases and bounded spelling mistakes", () => {
  const chapters = [
    { number: 1, name: "سُورَةُ ٱلْفَاتِحَةِ", englishName: "Al-Faatiha", numberOfAyahs: 7 },
    { number: 18, name: "سورة الكهف", englishName: "Al-Kahf", numberOfAyahs: 110 },
    { number: 94, name: "الشرح", englishName: "Ash-Sharh", numberOfAyahs: 8 },
  ];
  for (const query of ["الفاتحة", "فَاتِحَة", "al fatiha", "fatihah", "fatihaa", "١", "۱"]) assert.equal(searchChapters(chapters, query)[0]?.number, 1, query);
  assert.equal(searchChapters(chapters, "الانشراح")[0]?.number, 94);
  assert.equal(searchChapters(chapters, "١٨")[0]?.number, 18);
  assert.deepEqual(searchChapters(chapters, "11"), []);
});
