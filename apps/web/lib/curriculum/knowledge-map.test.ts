import assert from "node:assert/strict";
import test from "node:test";
import {
  extractLessonHook,
  getPreLessonDiagnosticItems,
  hasSummaryDetailBeyondHook,
} from "./knowledge-map.ts";

test("extractLessonHook stops at maxSentences without splitting decimals, e.g., or inside LaTeX math", () => {
  const sample =
    "Water melts cleanly near 0.0°C and bends at 104.5° (e.g. liquid droplets). Notice $x = 1.5 \\text{ and } i^2 = -1.$ This second sentence finishes the hook! Here is a third sentence with deeper explanation.";

  const hook = extractLessonHook(sample, 2);
  assert.equal(
    hook,
    "Water melts cleanly near 0.0°C and bends at 104.5° (e.g. liquid droplets). Notice $x = 1.5 \\text{ and } i^2 = -1.$ This second sentence finishes the hook!",
  );
  assert.equal(hasSummaryDetailBeyondHook(sample, hook), true);
  assert.equal(hasSummaryDetailBeyondHook(hook, hook), false);
});

test("extractLessonHook handles Arabic sentences cleanly", () => {
  const ar =
    "الماء جزيء قطبي بزاوية ١٠٤.٥°. تتكون بين جزيئاته روابط هيدروجينية ترفع درجة غليانه مقارنةً بمركبات مشابهة؟ ثم نشرح في الفقرات التالية الخواص الحرارية والكثافة عند ٤ درجات مئوية.";
  const hook = extractLessonHook(ar, 2);
  assert.ok(hook.endsWith("مشابهة؟"));
  assert.equal(hook.includes("٤ درجات مئوية"), false);
});

test("getPreLessonDiagnosticItems returns 2 optional readiness items for every core subject", () => {
  const subjects = [
    ["math-complex-intro", "mathematics", "en"],
    ["math-nature-of-roots", "mathematics", "ar"],
    ["sci-water-chemistry", "integrated-science", "en"],
    ["arabic-samawal-poetry", "arabic", "ar"],
    ["hist-sources-civilization", "history", "ar"],
    ["phil-syllogism-forms", "philosophy", "ar"],
    ["english-narrative-tenses", "english", "en"],
  ] as const;

  for (const [slug, subj, lang] of subjects) {
    const items = getPreLessonDiagnosticItems(slug, subj, lang);
    assert.equal(items.length, 2, `Expected 2 diagnostic questions for ${subj}`);
    for (const q of items) {
      assert.ok(q.options.some((o) => o.id === q.correctId));
      assert.ok(q.focusIfMissed.length > 3);
    }
  }
});
