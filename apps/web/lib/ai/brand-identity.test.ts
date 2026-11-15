import test from "node:test";
import assert from "node:assert/strict";
import { normalizeArabicBrandName } from "../../../../supabase/functions/noata-ai/answer-presentation.ts";

test("normalizeArabicBrandName replaces phonetic Noata hallucination variants with نُقطة", () => {
  assert.equal(normalizeArabicBrandName("اسمي نواتا. كيف يمكنني مساعدتك اليوم؟"), "اسمي نُقطة. كيف يمكنني مساعدتك اليوم؟");
  assert.equal(normalizeArabicBrandName("أهلاً بيك في منصة النواتا ونوتا!"), "أهلاً بيك في منصة نُقطة ونُقطة!");
  assert.equal(normalizeArabicBrandName("اسأل مساعد نوتة الذكي بنواتا ولنوتا وبالنواتا وللنواتا"), "اسأل مساعد نُقطة الذكي بنُقطة ولنُقطة وبنُقطة ولنُقطة");
  assert.equal(normalizeArabicBrandName("أنا نوأتا ونؤاتا"), "أنا نُقطة ونُقطة");
});

test("normalizeArabicBrandName leaves legitimate Arabic words and code blocks untouched", () => {
  assert.equal(normalizeArabicBrandName("نواة الذرة تتكون من بروتونات"), "نواة الذرة تتكون من بروتونات");
  assert.equal(normalizeArabicBrandName("اقرأ النوتة الموسيقية بعناية"), "اقرأ النوتة الموسيقية بعناية");
  assert.equal(
    normalizeArabicBrandName("```txt\nنواتا\n```\nمرحبًا في نواتا"),
    "```txt\nنواتا\n```\nمرحبًا في نُقطة",
  );
});
