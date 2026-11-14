import assert from "node:assert/strict";
import test from "node:test";
import { matchAnswer } from "./answer-matcher.ts";

test("strict mode requires exact spelling, casing, and Arabic diacritics", () => {
  assert.equal(matchAnswer("Mitochondria", "mitochondria", { mode: "strict" }).status, "incorrect");
  assert.equal(matchAnswer("العِلم", "العلم", { mode: "strict" }).status, "incorrect");
  assert.equal(matchAnswer("العلم", "العلم", { mode: "strict" }).matched, true);
});

test("normalized mode strips Arabic tashkeel and Latin case WITHOUT silently equating ة and ه", () => {
  // Diacritics stripped + tatweel ignored
  const okTashkeel = matchAnswer("اَلْكِتَابُ", "الكتاب", { mode: "normalized" });
  assert.equal(okTashkeel.matched, true);
  assert.equal(okTashkeel.status, "exact");

  // CRITICAL: Arabic ة and ه must remain distinct letters in normalized mode!
  const taVsHa = matchAnswer("مدرسه", "مدرسة", { mode: "normalized" });
  assert.equal(taVsHa.matched, false);
  assert.equal(taVsHa.status, "incorrect");

  // Alef remains strict unless opt-in normalizeAlef is enabled
  assert.equal(matchAnswer("احمد", "أحمد", { mode: "normalized" }).matched, false);
  assert.equal(matchAnswer("احمد", "أحمد", { mode: "normalized", normalizeAlef: true }).matched, true);
});

test("acceptedAnswers accepts valid synonyms cleanly", () => {
  const res = matchAnswer("ATP synthase", "adenosine triphosphate", {
    mode: "normalized",
    acceptedAnswers: ["ATP", "ATP synthase"],
  });
  assert.equal(res.matched, true);
  assert.equal(res.matchedCandidate, "ATP synthase");
});

test("fuzzy mode flags near misses as close with explicit confirmation instead of silent pass", () => {
  const res = matchAnswer("mitocondria", "mitochondria", { mode: "fuzzy" });
  assert.equal(res.matched, false);
  assert.equal(res.status, "close");
  assert.equal(res.requiresConfirmation, true);
  assert.ok(res.similarity >= 0.8);

  const far = matchAnswer("ribosome", "mitochondria", { mode: "fuzzy" });
  assert.equal(far.status, "incorrect");
  assert.equal(far.requiresConfirmation, false);
});
