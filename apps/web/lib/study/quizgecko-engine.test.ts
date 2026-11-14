import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createBundleFromLessonPack,
  generateAlgorithmicBundle,
  exportToAnkiTSV,
  convertMissedQuestionsToCards,
} from "./quizgecko-engine.ts";
import { getLessonStudyPack, getTrackLessonStudyPacks } from "../curriculum/sec1-study-pack.ts";

describe("QuizGecko Engine Tests", () => {
  it("generates structured bundle from Arabic text with no brand corruption", () => {
    const text = `
    التنفس الخلوي هو مسار أيضي حيوي يُنتج جزيئات ATP اللازمة للطاقة في الخلايا الحية.
    تحدث مرحلة التحلل السكري في السيتوبلازم دون الحاجة إلى أكسجين، بينما تحدث حلقة كريبس داخل الميتوكوندريا.
    تعتبر سلسلة نقل الإلكترون المرحلة الأكثر إنتاجية لجزيئات الطاقة ATP في التنفس الهوائي.
    `;
    const bundle = generateAlgorithmicBundle({
      text,
      topic: "التنفس الخلوي",
      locale: "ar",
      questionCount: 4,
      cardCount: 4,
    });

    assert.ok(bundle.questions.length >= 3, "Expected at least 3 questions");
    assert.ok(bundle.cards.length >= 3, "Expected at least 3 flashcards");
    assert.ok(bundle.title.includes("التنفس الخلوي"));

    // Verify brand rule: No "نوتة" or "نوتا"
    const jsonStr = JSON.stringify(bundle);
    assert.equal(jsonStr.includes("نوتة"), false, "Must not contain 'نوتة'");
    assert.equal(jsonStr.includes("نوتا"), false, "Must not contain 'نوتا'");

    // Verify question structure
    const mcq = bundle.questions.find((q) => q.type === "multiple_choice");
    assert.ok(mcq, "Should contain multiple choice question");
    assert.equal(mcq?.options.length, 4, "MCQ must have 4 options");
    assert.ok(mcq?.explanation.length > 5, "Must have comprehensive explanation");
    assert.ok(mcq?.distractorExplanations, "Must have distractor explanations");
  });

  it("generates structured bundle from English topic", () => {
    const bundle = generateAlgorithmicBundle({
      topic: "Newton's Laws of Motion",
      locale: "en",
      difficulty: "hard",
      questionCount: 4,
      cardCount: 4,
    });

    assert.equal(bundle.locale, "en");
    assert.ok(bundle.questions.length >= 3);
    assert.ok(bundle.cards.length >= 3);
    assert.equal(bundle.difficulty, "hard");
  });

  it("exports flashcards to valid Anki TSV format", () => {
    const cards = [
      { id: "1", front: "Term 1", back: "Def 1", hint: "Hint 1", concept: "Bio" },
      { id: "2", front: "Term 2", back: "Def 2", hint: "Hint 2", concept: "Bio" },
    ];
    const tsv = exportToAnkiTSV(cards);
    assert.ok(tsv.includes("#separator:tab"));
    assert.ok(tsv.includes("Term 1\tDef 1\tHint 1\tBio"));
  });

  it("converts missed questions into remedial flashcards", () => {
    const missed = [
      {
        id: "q1",
        type: "multiple_choice" as const,
        question: "What is mitochondria?",
        options: ["Powerhouse", "Nucleus", "Ribosome", "Wall"],
        correctIndex: 0,
        explanation: "Generates ATP through aerobic respiration.",
        hint: "Power",
        concept: "Biology",
        difficulty: "medium" as const,
      },
    ];
    const cards = convertMissedQuestionsToCards(missed);
    assert.equal(cards.length, 1);
    assert.equal(cards[0].front, "What is mitochondria?");
    assert.ok(cards[0].back.includes("Powerhouse"));
    assert.ok(cards[0].back.includes("Generates ATP"));
  });

  it("createBundleFromLessonPack builds curriculum-derived bundles from Sec. 1 packs", () => {
    const arPack = getTrackLessonStudyPacks("arabic-language")[0] ?? getLessonStudyPack("sci-hydrosphere");
    assert.ok(arPack, "Expected Sec. 1 Arabic pack");
    const arBundle = createBundleFromLessonPack(arPack, "hard");
    assert.equal(arBundle.provenance, "curriculum_derived");
    assert.equal(arBundle.locale, "ar");
    assert.equal(arBundle.difficulty, "hard");
    assert.ok(arBundle.summary.trim().length > 10);
    assert.ok(arBundle.keyTakeaways.length >= 2);
    assert.ok(arBundle.questions.length >= 2);
    assert.ok(arBundle.cards.length >= 2);
    for (const q of arBundle.questions) {
      assert.ok(q.options.length >= 2);
      assert.ok(q.distractorExplanations && Object.keys(q.distractorExplanations).length >= 1);
    }

    const enPack = getTrackLessonStudyPacks("english")[0];
    assert.ok(enPack, "Expected Sec. 1 English pack");
    const enBundle = createBundleFromLessonPack(enPack, "medium");
    assert.equal(enBundle.provenance, "curriculum_derived");
    assert.equal(enBundle.locale, "en");
    assert.ok(enBundle.questions.length >= 2);
    assert.ok(enBundle.cards.length >= 2);
  });
});
