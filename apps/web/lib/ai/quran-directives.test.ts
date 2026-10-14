import test from "node:test";
import assert from "node:assert/strict";
import { splitQuranDirectives, directQuranQuoteRequest } from "./quran-directives.ts";

test("canonical Quran directives preserve surrounding Markdown in Arabic", () => {
  assert.deepEqual(splitQuranDirectives("## الآيات\n\n[[quran:2:1-5]]\n\n**الشرح:** بداية سورة البقرة."), [
    {kind:"text",text:"## الآيات\n\n"},
    {kind:"quran",surah:2,start:1,end:5},
    {kind:"text",text:"\n\n**الشرح:** بداية سورة البقرة."}
  ]);
});
test("invalid references are not represented as verified verses", () => {
  for(const text of ["[[quran:115:1-2]]","[[quran:2:8-7]]","[[quran:2:1-200]]","[[quran:0:1]]"]) {
    assert.deepEqual(splitQuranDirectives(text),[{kind:"text",text}]);
  }
  assert.deepEqual(splitQuranDirectives("Here is [[quran:2:1-2]] in prose"), [{kind:"text",text:"Here is [[quran:2:1-2]] in prose"}]);
});
test("literal examples in fenced code are never replaced", () => {
  const input = "~~~md\n[[quran:2:1-5]]\n~~~";
  assert.deepEqual(splitQuranDirectives(input),[{kind:"text",text:input}]);
});

test("direct Quran quote requests support Arabic digits, words, and English", () => {
  assert.deepEqual(directQuranQuoteRequest("اكتب أول 5 آيات من سورة البقرة"),{surahName:"البقرة",start:1,end:5});
  assert.deepEqual(directQuranQuoteRequest("اعرض اول خمس ايات من سورة الفاتحة"),{surahName:"الفاتحة",start:1,end:5});
  assert.deepEqual(directQuranQuoteRequest("هات أول ٥ آيات من سورة البقرة"),{surahName:"البقرة",start:1,end:5});
  assert.deepEqual(directQuranQuoteRequest("Show the first 5 verses of Surah Al-Baqara"),{surahName:"Al-Baqara",start:1,end:5});
});
test("explanations and oversized requests are not intercepted", () => {
  assert.equal(directQuranQuoteRequest("اشرح أول خمس آيات من سورة البقرة"),null);
  assert.equal(directQuranQuoteRequest("اكتب اول 200 آية من سورة البقرة"),null);
  assert.equal(directQuranQuoteRequest("من هو عيسى في القرآن؟"),null);
});
