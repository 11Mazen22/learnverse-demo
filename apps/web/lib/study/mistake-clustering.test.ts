import assert from "node:assert/strict";
import test from "node:test";
import {
  buildClusterDrillCards,
  buildMistakeClusters,
  classifyMisconceptionPattern,
  filterMistakesByCluster,
} from "./mistake-clustering.ts";

const SAMPLE_MISTAKES = [
  {
    id: "m1",
    source_type: "quiz",
    deck_id: "d1",
    lesson_id: "math-complex-intro",
    topic: "Powers of i",
    prompt: "Simplify $i^7$.",
    user_answer: "$i$",
    expected_answer: "$-i$",
    explanation: "$7 \\equiv 3 \\pmod 4$, so $i^7 = i^3 = -i$.",
    mistake_count: 3,
    resolved_at: null,
  },
  {
    id: "m2",
    source_type: "flashcard",
    deck_id: "d1",
    lesson_id: "arab-grammar-nominatives",
    topic: "كان وأخواتها",
    prompt: "أعرب كلمة «معتدلًا» في: كان الجوُّ معتدلًا.",
    user_answer: "مبتدأ مرفوع",
    expected_answer: "خبر كان منصوب وعلامة نصبه الفتحة",
    explanation: "كان تدخل على الجملة الاسمية فترفع الاسم وتنصب الخبر.",
    mistake_count: 2,
    resolved_at: null,
  },
  {
    id: "m3",
    source_type: "quiz",
    deck_id: "d1",
    lesson_id: "sci-water-chemistry",
    topic: "Specific Heat Q = mcΔT",
    prompt: "Calculate thermal energy $Q = mc\\Delta T$.",
    user_answer: "2100 J",
    expected_answer: "4180 J",
    explanation: "Remember specific heat capacity of water c = 4.18 J/g°C.",
    mistake_count: 1,
    resolved_at: "2026-11-12T10:00:00Z",
  },
];

test("classifyMisconceptionPattern detects domain-specific mistake clusters accurately", () => {
  assert.equal(classifyMisconceptionPattern(SAMPLE_MISTAKES[0]), "complex-cycle-powers");
  assert.equal(classifyMisconceptionPattern(SAMPLE_MISTAKES[1]), "arabic-syntax-nawasikh");
  assert.equal(classifyMisconceptionPattern(SAMPLE_MISTAKES[2]), "formula-substitution");
});

test("buildMistakeClusters sorts unresolved high-repeat skills & misconceptions first", () => {
  const report = buildMistakeClusters(SAMPLE_MISTAKES);
  assert.equal(report.skills.length, 3);
  assert.equal(report.skills[0].key, "Powers of i");
  assert.equal(report.skills[0].unresolvedCount, 1);
  assert.equal(report.skills[0].repeatWeight, 3);

  assert.equal(report.formats[0].key, "quiz");
  assert.equal(report.formats[0].totalCount, 2);
});

test("filterMistakesByCluster and buildClusterDrillCards generate focused unresolved drill cards", () => {
  const filtered = filterMistakesByCluster(SAMPLE_MISTAKES, "misconception", "arabic-syntax-nawasikh");
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "m2");

  const drillCards = buildClusterDrillCards(SAMPLE_MISTAKES, "all", null);
  // Prefers open unresolved mistakes when unresolved errors exist
  assert.equal(drillCards.length, 2);
  assert.equal(drillCards[0].id, "mistake-cluster-m1");
  assert.ok(drillCards[0].tags.includes("complex-cycle-powers"));
});
