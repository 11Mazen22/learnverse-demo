import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeComplexNumber,
  analyzeQuadraticEquation,
  ARABIC_IRAB_SENTENCES,
  classifyAqueousPh,
  computeAquaticSolutionState,
  computePowerOfI,
  computeWaterPhysicalState,
  ENGLISH_TRANSFORM_CASES,
  evaluateEnglishCase,
  evaluateSourceReliabilityRubric,
  evaluateSyllogismScenario,
  resolveSubjectLabForLesson,
  SOURCE_RUBRIC_MAX_WEIGHTS,
  SUBJECT_LAB_SPECS,
} from "./subject-labs.ts";

test("computePowerOfI cycles cleanly every 4 integers including zero and multiples", () => {
  assert.equal(computePowerOfI(0).notation, "1");
  assert.equal(computePowerOfI(1).notation, "i");
  assert.equal(computePowerOfI(2).notation, "-1");
  assert.equal(computePowerOfI(3).notation, "-i");
  assert.equal(computePowerOfI(4).notation, "1");
  assert.equal(computePowerOfI(14).remainder, 2);
  assert.equal(computePowerOfI(14).notation, "-1");
  assert.equal(computePowerOfI(15).remainder, 3);
  assert.equal(computePowerOfI(15).notation, "-i");
  assert.equal(computePowerOfI(-1).remainder, 3);
  assert.equal(computePowerOfI(-1).notation, "-i");
});

test("analyzeComplexNumber yields conjugate reflection and real modulus squared", () => {
  const res = analyzeComplexNumber(3, -4);
  assert.equal(res.conjugateA, 3);
  assert.equal(res.conjugateB, 4);
  assert.equal(res.modulusSq, 25);
  assert.equal(res.modulus, 5);
  assert.equal(res.classification, "complex");
  assert.equal(analyzeComplexNumber(0, 5).classification, "pure-imaginary");
  assert.equal(analyzeComplexNumber(7, 0).classification, "pure-real");
});

test("analyzeQuadraticEquation classifies distinct, repeated, complex, and guards a = 0 degenerate linear", () => {
  const twoReal = analyzeQuadraticEquation(1, -2, -3);
  assert.equal(twoReal.isDegenerateLinear, false);
  if (!twoReal.isDegenerateLinear) {
    assert.equal(twoReal.discriminant, 16);
    assert.equal(twoReal.rootCount, 2);
    assert.deepEqual(twoReal.realRoots, [-1, 3]);
    assert.equal(twoReal.sumRoots, 2);
    assert.equal(twoReal.productRoots, -3);
  }

  const tangent = analyzeQuadraticEquation(1, -4, 4);
  if (!tangent.isDegenerateLinear) {
    assert.equal(tangent.discriminant, 0);
    assert.equal(tangent.rootCount, 1);
    assert.deepEqual(tangent.realRoots, [2]);
  }

  const complex = analyzeQuadraticEquation(1, 2, 3);
  if (!complex.isDegenerateLinear) {
    assert.ok(complex.discriminant < 0);
    assert.equal(complex.rootCount, 0);
    assert.equal(complex.rootKind, "complex-conjugate");
    assert.equal(complex.complexRoots?.realPart, -1);
  }

  const degenerate = analyzeQuadraticEquation(0, 2, -6);
  assert.equal(degenerate.isDegenerateLinear, true);
  if (degenerate.isDegenerateLinear) {
    assert.equal(degenerate.linearRoot, 3);
  }
});

test("computeWaterPhysicalState reproduces ice buoyancy and ~4C density peak", () => {
  const ice = computeWaterPhysicalState(-4);
  const at4 = computeWaterPhysicalState(4);
  const at25 = computeWaterPhysicalState(25);

  assert.equal(ice.regime, "ice-lattice");
  assert.equal(ice.floatsIn4CLiquid, true);
  assert.ok(ice.densityGCm3 < 0.93);

  assert.equal(at4.regime, "maximum-density");
  assert.ok(at4.densityGCm3 > 0.9999);
  assert.ok(at4.densityGCm3 > at25.densityGCm3);
  assert.ok(at4.densityGCm3 > ice.densityGCm3);

  assert.equal(classifyAqueousPh(3).category, "acidic");
  assert.equal(classifyAqueousPh(7).category, "neutral");
  assert.equal(classifyAqueousPh(11).category, "basic");
});

test("computeAquaticSolutionState flags osmosis direction and ~10% trophic approximation", () => {
  const marine = computeAquaticSolutionState(35, 9, 24, 10);
  assert.equal(marine.osmoticDirection, "efflux-shrink");
  assert.equal(marine.trophicIsApproximation, true);
  assert.equal(marine.trophicLevels[0].energyUnits, 1000);
  assert.equal(marine.trophicLevels[1].energyUnits, 100);
  assert.equal(marine.trophicLevels[2].energyUnits, 10);

  const freshwater = computeAquaticSolutionState(0, 9, 10, 10);
  assert.equal(freshwater.osmoticDirection, "influx-swell");
  assert.equal(freshwater.dissolvedO2Index, "high");
});

test("every registered pilot lab includes complete pedagogical specs and wrong-answer feedback", () => {
  for (const spec of Object.values(SUBJECT_LAB_SPECS)) {
    assert.ok(spec.learningObjective.ar.length > 10 && spec.learningObjective.en.length > 10);
    assert.ok(spec.fallbackBlocks.ar.length > 0 && spec.fallbackBlocks.en.length > 0);
    assert.ok(spec.prediction.choices.length >= 3);
    for (const choice of spec.prediction.choices) {
      const explain = spec.prediction.explainByChoice[choice.id];
      assert.ok(explain && explain.ar.length > 10 && explain.en.length > 10, `Missing feedback for ${spec.id}:${choice.id}`);
    }
  }
});

test("resolveSubjectLabForLesson maps all 6 curriculum subjects accurately", () => {
  assert.equal(resolveSubjectLabForLesson({ lessonIdOrSlug: "math-complex-intro" })?.spec.id, "math-complex-argand");
  assert.equal(resolveSubjectLabForLesson({ lessonIdOrSlug: "math-nature-of-roots" })?.initialMode, "discriminant");
  assert.equal(resolveSubjectLabForLesson({ lessonIdOrSlug: "math-roots-coefficients" })?.initialMode, "vieta");
  assert.equal(resolveSubjectLabForLesson({ lessonIdOrSlug: "sci-water-chemistry" })?.spec.id, "sci-water-polarity-density");
  assert.equal(resolveSubjectLabForLesson({ lessonIdOrSlug: "sci-solutions-biology" })?.spec.id, "sci-aquatic-solution-osmosis");
  assert.equal(resolveSubjectLabForLesson({ lessonIdOrSlug: "arabic-samawal-poetry" })?.initialMode, "poetry");
  assert.equal(resolveSubjectLabForLesson({ lessonIdOrSlug: "arabic-nominatives" })?.spec.id, "arabic-irab-poetry");
  assert.equal(resolveSubjectLabForLesson({ lessonIdOrSlug: "hist-sources-civilization", subjectKey: "history" })?.spec.id, "history-source-timeline");
  assert.equal(resolveSubjectLabForLesson({ lessonIdOrSlug: "hist-civilization-history", subjectKey: "history" })?.initialMode, "timeline");
  assert.equal(resolveSubjectLabForLesson({ lessonIdOrSlug: "phil-syllogism-forms", subjectKey: "philosophy" })?.spec.id, "philosophy-logic-fallacy");
  assert.equal(resolveSubjectLabForLesson({ lessonIdOrSlug: "english-narrative-tenses", subjectKey: "english" })?.spec.id, "english-transform-collocation");
});

test("Arabic, History, Philosophy, and English domain models uphold pedagogical fidelity", () => {
  // Arabic dual I'rab sentence + kana/inna contrast
  assert.ok(ARABIC_IRAB_SENTENCES.length >= 3);
  const dual = ARABIC_IRAB_SENTENCES.find((s) => s.id === "dual-nominal");
  assert.equal(dual?.tokens[0]?.markerId, "alif");

  // History transparent scoring rubric sums exact 20+20+15+15+15+15 = 100 weights
  const maxSum = Object.values(SOURCE_RUBRIC_MAX_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.equal(maxSum, 100);
  const full = evaluateSourceReliabilityRubric(SOURCE_RUBRIC_MAX_WEIGHTS);
  assert.equal(full.totalScore, 100);
  assert.equal(full.band, "high");
  assert.equal(full.needsCrossCheckWarning, false);

  const biasedPrimary = evaluateSourceReliabilityRubric({
    authenticity: 20,
    eyewitnessProximity: 20,
    biasControl: 4,
    contextualClarity: 12,
    corroboration: 5,
    preservation: 14,
  });
  assert.equal(biasedPrimary.needsCrossCheckWarning, true);

  // Philosophy distinguishes Formal Validity vs Premise Factual Truth
  const validUnsound = evaluateSyllogismScenario("valid-unsound-gold");
  assert.equal(validUnsound.isFormallyValid, true);
  assert.equal(validUnsound.premisesFactuallyTrue, false);
  assert.equal(validUnsound.soundness, "valid-but-unsound");

  // English cases provide specific explanations for distractors
  const prohibited = ENGLISH_TRANSFORM_CASES.find((c) => c.id === "modal-prohibition");
  assert.ok(prohibited);
  assert.equal(evaluateEnglishCase("modal-prohibition", "mustn't").ok, true);
  assert.equal(evaluateEnglishCase("modal-prohibition", "don't have to").ok, false);
});
