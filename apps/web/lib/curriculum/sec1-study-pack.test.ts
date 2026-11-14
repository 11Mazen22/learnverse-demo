import test from "node:test";
import assert from "node:assert/strict";
import { inferContentLanguage, resolveCurriculumText } from "./catalog.ts";
import {
  evaluateLocalChoice,
  getCanonicalStudyDecks,
  getLessonStudyCompanion,
  getLessonStudyPack,
  getSubjectQuestionBank,
  getTrackLessonStudyPacks,
} from "./sec1-study-pack.ts";

test("resolveCurriculumText and inferContentLanguage enforce strict track language", () => {
  assert.equal(resolveCurriculumText("ar", "الغلاف المائي", "Hydrosphere"), "الغلاف المائي");
  assert.equal(resolveCurriculumText("en", "الغلاف المائي", "Hydrosphere"), "Hydrosphere");
  assert.equal(resolveCurriculumText("ar", "", "", "fallback"), "fallback");

  assert.equal(
    inferContentLanguage({ trackContentLanguage: "ar", promptAr: "سؤال", promptEn: "Question" }),
    "ar",
  );
  assert.equal(
    inferContentLanguage({ trackContentLanguage: "en", promptAr: "سؤال", promptEn: "Question" }),
    "en",
  );
  assert.equal(
    inferContentLanguage({ metadata: { render_language: "en" }, promptAr: "سؤال" }),
    "en",
  );
  assert.equal(
    inferContentLanguage({ promptEn: "English-only prompt" }),
    "en",
  );
});

test("getLessonStudyCompanion provides structured Sec. 1 study data across subjects", () => {
  const sciAr = getLessonStudyCompanion({
    lessonIdOrSlug: "sci-hydrosphere",
    trackSlug: "integrated-science-ar",
    contentLanguage: "ar",
  });
  assert.ok(sciAr.keyConcepts.length >= 2);
  assert.ok(sciAr.workedExamples.length >= 1);
  assert.ok(sciAr.commonMistakes.length >= 1);
  assert.ok(sciAr.curatedQuestions.length >= 2);
  assert.ok(sciAr.flashcards.length >= 2);
  assert.match(sciAr.matchedTopic, /الغلاف المائي/);
  assert.match(sciAr.aiTutorPrompts[0], /اشرح/);

  const mathEn = getLessonStudyCompanion({
    lessonIdOrSlug: "math-nature-of-roots",
    trackSlug: "mathematics-en",
    contentLanguage: "en",
  });
  assert.match(mathEn.matchedTopic, /Roots|Discriminant/i);
  assert.ok(mathEn.curatedQuestions.every((q) => q.choices.length >= 4));
  assert.match(mathEn.aiTutorPrompts[0], /Explain/);
});

test("getSubjectQuestionBank separates Arabic and English editions cleanly", () => {
  const arQuestions = getSubjectQuestionBank("integrated-science-ar", "ar");
  const enQuestions = getSubjectQuestionBank("integrated-science-en", "en");
  assert.ok(arQuestions.length >= 6);
  assert.equal(arQuestions.length, enQuestions.length);
  assert.match(arQuestions[0].prompt, /[\u0600-\u06FF]/);
  assert.doesNotMatch(enQuestions[0].prompt, /^[\u0600-\u06FF]/);
});

test("getCanonicalStudyDecks covers all 8 tracks with localized cards", () => {
  const decks = getCanonicalStudyDecks();
  assert.equal(decks.length, 8);
  for (const deck of decks) {
    assert.ok(deck.cards.length > 0, `${deck.trackSlug} should include study cards`);
  }
  const arabDeck = decks.find((d) => d.trackSlug === "arabic-language-ar");
  assert.ok(arabDeck);
  assert.match(arabDeck.titleAr, /اللغة العربية/);
  const engDeck = decks.find((d) => d.trackSlug === "english-en");
  assert.ok(engDeck);
  assert.equal(engDeck.contentLanguage, "en");
});

test("evaluateLocalChoice grades index-resolved answers and metadata keys accurately", () => {
  const choices = ["71%", "97%", "3%", "50%"];
  const selectedIndex = "1";
  const resolvedChoiceText = choices[Number(selectedIndex)] ?? selectedIndex;

  const right = evaluateLocalChoice({
    selectedChoice: resolvedChoiceText,
    choices,
    correctIndex: 1,
  });
  assert.deepEqual(right, { correct: true, correctChoiceText: "97%" });

  const wrong = evaluateLocalChoice({
    selectedChoice: choices[0],
    choices,
    correctIndex: 1,
  });
  assert.deepEqual(wrong, { correct: false, correctChoiceText: "97%" });

  const byValue = evaluateLocalChoice({
    selectedChoice: "97%",
    choices,
    answerKey: { value: "97%" },
  });
  assert.equal(byValue?.correct, true);

  const byAccepted = evaluateLocalChoice({
    selectedChoice: "osmosis",
    choices: [],
    answerKey: { accepted_answers: ["Osmosis", "الخاصية الأسموزية"] },
  });
  assert.equal(byAccepted?.correct, true);
});

test("getTrackLessonStudyPacks covers every exact Sec. 1 Term 1 lesson across all 8 tracks", () => {
  const expectedCounts: Array<[string, number, "ar" | "en"]> = [
    ["integrated-science-ar", 5, "ar"],
    ["integrated-science-en", 5, "en"],
    ["mathematics-ar", 5, "ar"],
    ["mathematics-en", 5, "en"],
    ["arabic-language", 11, "ar"],
    ["english", 5, "en"],
    ["history", 5, "ar"],
    ["philosophy-logic", 4, "ar"],
  ];

  for (const [trackSlug, officialCount, lang] of expectedCounts) {
    const packs = getTrackLessonStudyPacks(trackSlug);
    const official = packs.filter((p) => !p.isExtraReview);
    assert.equal(official.length, officialCount, `${trackSlug} official lesson count mismatch`);
    for (const pack of packs) {
      assert.equal(pack.contentLanguage, lang, `${pack.lessonSlug} language mismatch`);
      assert.ok(pack.summary.trim().length > 10, `${pack.lessonSlug} missing summary`);
      assert.ok(pack.keyConcepts.length >= 1, `${pack.lessonSlug} missing keyConcepts`);
      assert.ok(pack.workedExamples.length >= 1, `${pack.lessonSlug} missing workedExamples`);
      assert.ok(pack.commonMistakes.length >= 1, `${pack.lessonSlug} missing commonMistakes`);
      assert.ok(pack.questions.length >= 2, `${pack.lessonSlug} missing questions`);
      assert.ok(pack.cards.length >= 2, `${pack.lessonSlug} missing cards`);
      const resolved = getLessonStudyPack(pack.lessonSlug);
      assert.ok(resolved, `getLessonStudyPack failed for ${pack.lessonSlug}`);
      assert.equal(resolved.lessonSlug, pack.lessonSlug);
    }
  }

  const philExtra = getLessonStudyPack("phil-extra-review");
  assert.ok(philExtra);
  assert.equal(philExtra.isExtraReview, true);
  assert.equal(philExtra.contentLanguage, "ar");

  assert.equal(getTrackLessonStudyPacks("arabic-language-ar").length, 11);
  assert.equal(getTrackLessonStudyPacks("english-en").length, 5);
});
