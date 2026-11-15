import type { SubjectDefinition, SubjectKey } from "./catalog";
import type { StructuredStudyBlock } from "./structured-content";

export type BilingualText = { ar: string; en: string };
export type SubjectAccent = SubjectDefinition["accent"];

export type SubjectLabId =
  | "math-complex-argand"
  | "math-quadratic-parabola"
  | "sci-water-polarity-density"
  | "sci-aquatic-solution-osmosis"
  | "arabic-irab-poetry"
  | "history-source-timeline"
  | "philosophy-logic-fallacy"
  | "english-transform-collocation";

export type SubjectLabInitialMode =
  | "powers"
  | "argand"
  | "discriminant"
  | "vieta"
  | "sign"
  | "inequality"
  | "polarity"
  | "density"
  | "osmosis"
  | "trophic"
  | "irab"
  | "poetry"
  | "rubric"
  | "timeline"
  | "syllogism"
  | "fallacy"
  | "transform"
  | "collocation";

export type LabPredictionChoice = {
  id: string;
  label: BilingualText;
};

export type LabPredictionPrompt = {
  id: string;
  prompt: BilingualText;
  choices: LabPredictionChoice[];
  correctId: string;
  explainByChoice: Record<string, BilingualText>;
};

export type SubjectLabSpec = {
  id: SubjectLabId;
  subject: SubjectKey;
  accent: SubjectAccent;
  lessonSlugs: readonly string[];
  defaultMode: SubjectLabInitialMode;
  title: BilingualText;
  learningObjective: BilingualText;
  interactionGuide: BilingualText;
  scientificCaveat?: BilingualText;
  fallbackBlocks: {
    ar: StructuredStudyBlock[];
    en: StructuredStudyBlock[];
  };
  prediction: LabPredictionPrompt;
};

const L = (ar: string, en: string): BilingualText => ({ ar, en });

export type PowerOfIResult = {
  exponent: number;
  quotient: number;
  remainder: 0 | 1 | 2 | 3;
  real: -1 | 0 | 1;
  imag: -1 | 0 | 1;
  notation: "1" | "i" | "-1" | "-i";
  latex: string;
  angleDeg: 0 | 90 | 180 | 270;
};

/** Computes integer power i^n cleanly using exact Euclidean modulo-4 decomposition. */
export function computePowerOfI(exponentInput: number): PowerOfIResult {
  const n = Number.isFinite(exponentInput) ? Math.trunc(exponentInput) : 0;
  const remainder = (((n % 4) + 4) % 4) as 0 | 1 | 2 | 3;
  const quotient = (n - remainder) / 4;

  const lookup: Record<
    0 | 1 | 2 | 3,
    { real: -1 | 0 | 1; imag: -1 | 0 | 1; notation: "1" | "i" | "-1" | "-i"; angleDeg: 0 | 90 | 180 | 270 }
  > = {
    0: { real: 1, imag: 0, notation: "1", angleDeg: 0 },
    1: { real: 0, imag: 1, notation: "i", angleDeg: 90 },
    2: { real: -1, imag: 0, notation: "-1", angleDeg: 180 },
    3: { real: 0, imag: -1, notation: "-i", angleDeg: 270 },
  };

  const entry = lookup[remainder];
  const latex = `i^{${n}} = (i^{4})^{${quotient}} \\cdot i^{${remainder}} = ${entry.notation}`;

  return {
    exponent: n,
    quotient,
    remainder,
    real: entry.real,
    imag: entry.imag,
    notation: entry.notation,
    latex,
    angleDeg: entry.angleDeg,
  };
}

export type ComplexVectorAnalysis = {
  a: number;
  b: number;
  conjugateA: number;
  conjugateB: number;
  modulusSq: number;
  modulus: number;
  classification: "zero" | "pure-real" | "pure-imaginary" | "complex";
  standardLatex: string;
  conjugateProductLatex: string;
};

/** Evaluates z = a + bi, its conjugate z̄ = a - bi, and modulus |z| for Argand visualization. */
export function analyzeComplexNumber(aInput: number, bInput: number): ComplexVectorAnalysis {
  const a = Number.isFinite(aInput) ? Math.round(aInput * 10) / 10 : 0;
  const b = Number.isFinite(bInput) ? Math.round(bInput * 10) / 10 : 0;
  const modulusSq = Math.round((a * a + b * b) * 100) / 100;
  const modulus = Math.round(Math.sqrt(modulusSq) * 100) / 100;

  let classification: ComplexVectorAnalysis["classification"] = "complex";
  if (a === 0 && b === 0) classification = "zero";
  else if (b === 0) classification = "pure-real";
  else if (a === 0) classification = "pure-imaginary";

  const formatComplex = (re: number, im: number) => {
    const sign = im >= 0 ? "+" : "-";
    return `${re} ${sign} ${Math.abs(im)}i`;
  };

  return {
    a,
    b,
    conjugateA: a,
    conjugateB: -b,
    modulusSq,
    modulus,
    classification,
    standardLatex: `z = ${formatComplex(a, b)},\\quad \\overline{z} = ${formatComplex(a, -b)}`,
    conjugateProductLatex: `z \\cdot \\overline{z} = (${a})^2 + (${b})^2 = ${modulusSq}`,
  };
}

export type QuadraticAnalysis =
  | {
      isDegenerateLinear: true;
      a: 0;
      b: number;
      c: number;
      linearRoot: number | null;
      equationLatex: string;
    }
  | {
      isDegenerateLinear: false;
      a: number;
      b: number;
      c: number;
      discriminant: number;
      rootKind: "distinct-real" | "repeated-real" | "complex-conjugate";
      rootCount: 2 | 1 | 0;
      realRoots: number[];
      complexRoots: { realPart: number; imagAbs: number } | null;
      vertexX: number;
      vertexY: number;
      opensUpward: boolean;
      sumRoots: number;
      productRoots: number;
      equationLatex: string;
      discriminantLatex: string;
    };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Analyzes ax² + bx + c = 0 with explicit degenerate handling when a = 0
 * so linear cases never divide by zero or misclassify b² - 4ac as a parabola.
 */
export function analyzeQuadraticEquation(
  aInput: number,
  bInput: number,
  cInput: number,
): QuadraticAnalysis {
  const a = Number.isFinite(aInput) ? round2(aInput) : 1;
  const b = Number.isFinite(bInput) ? round2(bInput) : 0;
  const c = Number.isFinite(cInput) ? round2(cInput) : 0;

  if (Math.abs(a) < 1e-6) {
    const linearRoot = Math.abs(b) >= 1e-6 ? round2(-c / b) : null;
    const eq = `${b}x ${c >= 0 ? "+" : "-"} ${Math.abs(c)} = 0`;
    return {
      isDegenerateLinear: true,
      a: 0,
      b,
      c,
      linearRoot,
      equationLatex: eq,
    };
  }

  const discriminant = round2(b * b - 4 * a * c);
  const vertexX = round2(-b / (2 * a));
  const vertexY = round2(a * vertexX * vertexX + b * vertexX + c);
  const sumRoots = round2(-b / a);
  const productRoots = round2(c / a);

  const bTerm = b >= 0 ? `+ ${b}x` : `- ${Math.abs(b)}x`;
  const cTerm = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
  const equationLatex = `${a}x^2 ${bTerm} ${cTerm} = 0`;
  const discriminantLatex = `\\Delta = (${b})^2 - 4(${a})(${c}) = ${discriminant}`;

  if (discriminant > 1e-6) {
    const sqrtD = Math.sqrt(discriminant);
    const r1 = round2((-b - sqrtD) / (2 * a));
    const r2 = round2((-b + sqrtD) / (2 * a));
    const sorted = [r1, r2].sort((x, y) => x - y);
    return {
      isDegenerateLinear: false,
      a,
      b,
      c,
      discriminant,
      rootKind: "distinct-real",
      rootCount: 2,
      realRoots: sorted,
      complexRoots: null,
      vertexX,
      vertexY,
      opensUpward: a > 0,
      sumRoots,
      productRoots,
      equationLatex,
      discriminantLatex,
    };
  }

  if (Math.abs(discriminant) <= 1e-6) {
    return {
      isDegenerateLinear: false,
      a,
      b,
      c,
      discriminant: 0,
      rootKind: "repeated-real",
      rootCount: 1,
      realRoots: [vertexX],
      complexRoots: null,
      vertexX,
      vertexY,
      opensUpward: a > 0,
      sumRoots,
      productRoots,
      equationLatex,
      discriminantLatex,
    };
  }

  return {
    isDegenerateLinear: false,
    a,
    b,
    c,
    discriminant,
    rootKind: "complex-conjugate",
    rootCount: 0,
    realRoots: [],
    complexRoots: {
      realPart: vertexX,
      imagAbs: round2(Math.sqrt(Math.abs(discriminant)) / (2 * Math.abs(a))),
    },
    vertexX,
    vertexY,
    opensUpward: a > 0,
    sumRoots,
    productRoots,
    equationLatex,
    discriminantLatex,
  };
}

export type WaterPhaseRegime =
  | "ice-lattice"
  | "freezing-boundary"
  | "anomalous-liquid"
  | "maximum-density"
  | "normal-thermal-expansion";

export type WaterPhysicalState = {
  tempC: number;
  tempKelvin: number;
  densityGCm3: number;
  floatsIn4CLiquid: boolean;
  regime: WaterPhaseRegime;
};

/**
 * Scientifically calibrated model of water's density across -5°C..25°C:
 * Ice has open hexagonal lattice (~0.917 g/cm³), liquid water expands abnormally
 * between 4°C and 0°C, and liquid water reaches maximum density near 4°C (~1.0000 g/cm³).
 */
export function computeWaterPhysicalState(tempCInput: number): WaterPhysicalState {
  const tempC = Math.max(-5, Math.min(25, Number.isFinite(tempCInput) ? round2(tempCInput) : 4));
  const tempKelvin = Math.round((tempC + 273.15) * 100) / 100;

  if (tempC < 0) {
    // Ice hexagonal open lattice near atmospheric pressure (~0.9167 g/cm³ at 0°C, slightly denser colder)
    const densityGCm3 = Math.round((0.9168 + Math.abs(tempC) * 0.00014) * 10000) / 10000;
    return {
      tempC,
      tempKelvin,
      densityGCm3,
      floatsIn4CLiquid: true,
      regime: "ice-lattice",
    };
  }

  // Kell / standard smooth empirical parabolic approximation around 3.98°C
  const dt = tempC - 3.98;
  const densityGCm3 =
    Math.round((0.99997 - 0.0000068 * dt * dt) * 100000) / 100000;

  let regime: WaterPhaseRegime = "normal-thermal-expansion";
  if (tempC === 0) regime = "freezing-boundary";
  else if (tempC > 0 && tempC < 3.5) regime = "anomalous-liquid";
  else if (tempC >= 3.5 && tempC <= 4.5) regime = "maximum-density";

  return {
    tempC,
    tempKelvin,
    densityGCm3,
    floatsIn4CLiquid: densityGCm3 < 0.99997,
    regime,
  };
}

export type PhClassification = {
  ph: number;
  category: "acidic" | "neutral" | "basic";
  referenceTempNote: string;
};

/** Classifies aqueous pH against the 25°C reference neutral point (pH = 7). */
export function classifyAqueousPh(phInput: number): PhClassification {
  const ph = Math.max(0, Math.min(14, Number.isFinite(phInput) ? Math.round(phInput * 10) / 10 : 7));
  const category = ph < 6.95 ? "acidic" : ph > 7.05 ? "basic" : "neutral";
  return {
    ph,
    category,
    referenceTempNote: "25°C",
  };
}

export type AquaticSolutionState = {
  externalSalinityPpt: number;
  internalSalinityPpt: number;
  tempC: number;
  osmoticDirection: "efflux-shrink" | "dynamic-equilibrium" | "influx-swell";
  boilingElevationNote: number;
  freezingDepressionNote: number;
  dissolvedO2Index: "high" | "moderate" | "low";
  trophicLevels: {
    level: number;
    energyUnits: number;
  }[];
  trophicTransferPercent: number;
  trophicIsApproximation: true;
};

/**
 * Evaluates cellular osmosis direction, qualitative colligative trends, O2 trend,
 * and an explicitly approximate trophic energy pyramid (default ~10%).
 */
export function computeAquaticSolutionState(
  externalSalinityPptInput: number,
  internalSalinityPptInput: number,
  tempCInput: number,
  trophicTransferPercentInput = 10,
): AquaticSolutionState {
  const externalSalinityPpt = Math.max(0, Math.min(60, Math.round(externalSalinityPptInput)));
  const internalSalinityPpt = Math.max(1, Math.min(35, Math.round(internalSalinityPptInput)));
  const tempC = Math.max(5, Math.min(35, Math.round(tempCInput)));
  const trophicTransferPercent = Math.max(5, Math.min(20, Math.round(trophicTransferPercentInput)));

  const diff = externalSalinityPpt - internalSalinityPpt;
  const osmoticDirection: AquaticSolutionState["osmoticDirection"] =
    Math.abs(diff) <= 1 ? "dynamic-equilibrium" : diff > 0 ? "efflux-shrink" : "influx-swell";

  // Normalized proportional colligative indicators (illustrative at dilute-to-moderate salinity)
  const boilingElevationNote = Math.round(externalSalinityPpt * 0.018 * 100) / 100;
  const freezingDepressionNote = Math.round(externalSalinityPpt * -0.055 * 100) / 100;

  // Higher water temperature + higher salinity lower O2 solubility
  const o2Score = 100 - tempC * 1.9 - externalSalinityPpt * 0.45;
  const dissolvedO2Index: AquaticSolutionState["dissolvedO2Index"] =
    o2Score >= 58 ? "high" : o2Score >= 36 ? "moderate" : "low";

  const ratio = trophicTransferPercent / 100;
  const trophicLevels = [1, 2, 3, 4].map((level) => ({
    level,
    energyUnits: Math.round(1000 * Math.pow(ratio, level - 1) * 10) / 10,
  }));

  return {
    externalSalinityPpt,
    internalSalinityPpt,
    tempC,
    osmoticDirection,
    boilingElevationNote,
    freezingDepressionNote,
    dissolvedO2Index,
    trophicLevels,
    trophicTransferPercent,
    trophicIsApproximation: true,
  };
}

// =========================================================================
// GATE 2B PURE DOMAIN MODELS: ARABIC, HISTORY, PHILOSOPHY, ENGLISH
// =========================================================================

export type ArabicIrabToken = {
  word: string;
  roleId: string;
  roleAr: string;
  markerId: string;
  markerAr: string;
  explanationAr: string;
  explanationEn: string;
};

export type ArabicIrabSentence = {
  id: string;
  textAr: string;
  sentenceTypeAr: string;
  tokens: ArabicIrabToken[];
};

export const ARABIC_IRAB_SENTENCES: ArabicIrabSentence[] = [
  {
    id: "dual-nominal",
    textAr: "المهندسانِ ماهرانِ",
    sentenceTypeAr: "جملة اسمية",
    tokens: [
      {
        word: "المهندسانِ",
        roleId: "mubtada",
        roleAr: "مبتدأ مرفوع",
        markerId: "alif",
        markerAr: "الألف (مثنى)",
        explanationAr: "بدأت به الجملة الاسمية وهو مثنى، والمثنى يُرفع بالألف نيابة عن الضمة.",
        explanationEn: "Nominal sentence subject (mubtada) in dual number — marked nominative with Alif.",
      },
      {
        word: "ماهرانِ",
        roleId: "khabar",
        roleAr: "خبر مرفوع",
        markerId: "alif",
        markerAr: "الألف (مثنى)",
        explanationAr: "أتمّ معنى الجملة مع المبتدأ، وهو مثنى فيُرفع بالألف أيضًا.",
        explanationEn: "Nominal predicate (khabar) in dual number — raised with Alif.",
      },
    ],
  },
  {
    id: "inna-nominal",
    textAr: "إنَّ الصدقَ منجاةٌ",
    sentenceTypeAr: "ناسخ حرفي (إنّ)",
    tokens: [
      {
        word: "إنَّ",
        roleId: "harf-nasikh",
        roleAr: "حرف توكيد ونصب مبني",
        markerId: "mabni",
        markerAr: "مبني على الفتح",
        explanationAr: "حرف ناسخ يدخل على الجملة الاسمية فينصب المبتدأ ويرفع الخبر.",
        explanationEn: "Inna-particle: invariantly built, governs accusative subject + nominative predicate.",
      },
      {
        word: "الصدقَ",
        roleId: "ism-inna",
        roleAr: "اسم إنّ منصوب",
        markerId: "fatha",
        markerAr: "الفتحة الظاهرة",
        explanationAr: "اسم إنّ يأتي منصوبًا وعلامة نصبه هنا الفتحة الظاهرة لأنه مفرد.",
        explanationEn: "Noun of inna: accusative singular marked with visible Fatha.",
      },
      {
        word: "منجاةٌ",
        roleId: "khabar-inna",
        roleAr: "خبر إنّ مرفوع",
        markerId: "damma",
        markerAr: "الضمة الظاهرة",
        explanationAr: "خبر إنّ مرفوع وعلامة رفعه الضمة الظاهرة.",
        explanationEn: "Predicate of inna: nominative singular marked with Damma.",
      },
    ],
  },
  {
    id: "kana-verbal",
    textAr: "كان الجوُّ معتدلًا",
    sentenceTypeAr: "فعل ناسخ (كان)",
    tokens: [
      {
        word: "كان",
        roleId: "fil-nasikh",
        roleAr: "فعل ماضٍ ناسخ مبني",
        markerId: "mabni",
        markerAr: "مبني على الفتح",
        explanationAr: "فعل ناسخ يرفع المبتدأ ويسمى اسمه، وينصب الخبر ويسمى خبره.",
        explanationEn: "Kana-verb: raises its subject and governs an accusative predicate.",
      },
      {
        word: "الجوُّ",
        roleId: "ism-kana",
        roleAr: "اسم كان مرفوع",
        markerId: "damma",
        markerAr: "الضمة الظاهرة",
        explanationAr: "اسم كان مرفوع وعلامة رفعه الضمة الظاهرة (عكس إنّ).",
        explanationEn: "Noun of kana: nominative with visible Damma.",
      },
      {
        word: "معتدلًا",
        roleId: "khabar-kana",
        roleAr: "خبر كان منصوب",
        markerId: "fatha",
        markerAr: "الفتحة الظاهرة",
        explanationAr: "خبر كان منصوب وعلامة نصبه الفتحة الظاهرة.",
        explanationEn: "Predicate of kana: accusative with visible Fatha.",
      },
    ],
  },
  {
    id: "lam-jussive",
    textAr: "لم يُهمِلِ الطالبُ واجبَهُ",
    sentenceTypeAr: "جملة فعلية (مضارع مجزوم)",
    tokens: [
      {
        word: "لم",
        roleId: "harf-jazm",
        roleAr: "حرف نفي وجزم وقلب مبني",
        markerId: "mabni",
        markerAr: "مبني على السكون",
        explanationAr: "أداة جزم تدخل على الفعل المضارع فتجزمه وتنفي حدوثه في الزمن الماضي.",
        explanationEn: "Jussive particle negating the verb in the past and placing the present verb in the jussive mood.",
      },
      {
        word: "يُهمِلِ",
        roleId: "mudari-majzum",
        roleAr: "فعل مضارع مجزوم بلم",
        markerId: "sukun-kasra",
        markerAr: "السكون المُقدّر لالتقاء الساكنين (حُرِّك بالكسر)",
        explanationAr: "مجزوم بلم وعلامة جزمه السكون الظاهر أصلًا، وكُسر منعًا لالتقاء الساكنين قبل «الطالب».",
        explanationEn: "Jussive verb marked by sukun, vocalized with kasra purely to prevent two consecutive consonants before «الطالب».",
      },
      {
        word: "الطالبُ",
        roleId: "fail",
        roleAr: "فاعل مرفوع",
        markerId: "damma",
        markerAr: "الضمة الظاهرة",
        explanationAr: "من قام بالفعل، وحكم الفاعل الرفع دائمًا.",
        explanationEn: "Grammatical subject (doer) of the verb, always nominative.",
      },
      {
        word: "واجبَهُ",
        roleId: "maful-bihi",
        roleAr: "مفعول به منصوب + مضاف إليه",
        markerId: "fatha",
        markerAr: "الفتحة الظاهرة (والهاء في محل جر مضاف إليه)",
        explanationAr: "«واجبَ» مفعول به منصوب بالفتحة، والهاء ضمير متصل مبني في محل جر مضاف إليه.",
        explanationEn: "Direct object marked with Fatha, while the attached pronoun suffix is in genitive possessive position.",
      },
    ],
  },
];

export type SourceRubricInput = {
  authenticity: number; // 0..20
  eyewitnessProximity: number; // 0..20
  biasControl: number; // 0..15
  contextualClarity: number; // 0..15
  corroboration: number; // 0..15
  preservation: number; // 0..15
};

export const SOURCE_RUBRIC_MAX_WEIGHTS: Readonly<SourceRubricInput> = {
  authenticity: 20,
  eyewitnessProximity: 20,
  biasControl: 15,
  contextualClarity: 15,
  corroboration: 15,
  preservation: 15,
};

export type SourceReliabilityEvaluation = {
  totalScore: number;
  maxScore: 100;
  band: "high" | "moderate" | "caution";
  clampedWeights: SourceRubricInput;
  needsCrossCheckWarning: boolean;
};

/**
 * Evaluates historical source reliability transparently using explicit criteria summing to 100.
 * Zero black-box weights; warns explicitly whenever bias control is weak even on authentic artefacts.
 */
export function evaluateSourceReliabilityRubric(
  input: SourceRubricInput,
): SourceReliabilityEvaluation {
  const clamp = (val: number, max: number) =>
    Math.max(0, Math.min(max, Math.round(Number.isFinite(val) ? val : 0)));

  const clampedWeights: SourceRubricInput = {
    authenticity: clamp(input.authenticity, SOURCE_RUBRIC_MAX_WEIGHTS.authenticity),
    eyewitnessProximity: clamp(input.eyewitnessProximity, SOURCE_RUBRIC_MAX_WEIGHTS.eyewitnessProximity),
    biasControl: clamp(input.biasControl, SOURCE_RUBRIC_MAX_WEIGHTS.biasControl),
    contextualClarity: clamp(input.contextualClarity, SOURCE_RUBRIC_MAX_WEIGHTS.contextualClarity),
    corroboration: clamp(input.corroboration, SOURCE_RUBRIC_MAX_WEIGHTS.corroboration),
    preservation: clamp(input.preservation, SOURCE_RUBRIC_MAX_WEIGHTS.preservation),
  };

  const totalScore =
    clampedWeights.authenticity +
    clampedWeights.eyewitnessProximity +
    clampedWeights.biasControl +
    clampedWeights.contextualClarity +
    clampedWeights.corroboration +
    clampedWeights.preservation;

  const band: SourceReliabilityEvaluation["band"] =
    totalScore >= 75 ? "high" : totalScore >= 50 ? "moderate" : "caution";

  return {
    totalScore,
    maxScore: 100,
    band,
    clampedWeights,
    needsCrossCheckWarning: clampedWeights.biasControl < 8 || clampedWeights.corroboration < 7,
  };
}

export type SyllogismScenario = {
  id: string;
  label: BilingualText;
  majorPremise: BilingualText;
  minorPremise: BilingualText;
  conclusion: BilingualText;
  isFormallyValid: boolean;
  premisesFactuallyTrue: boolean;
  soundness: "sound" | "valid-but-unsound" | "invalid";
  explanation: BilingualText;
};

export const SYLLOGISM_SCENARIOS: SyllogismScenario[] = [
  {
    id: "sound-metals",
    label: L("قياس سليم وصادق (Sound)", "Sound Syllogism (Valid + True)"),
    majorPremise: L("كل المعادن تتمدد بالحرارة", "All metals expand when heated"),
    minorPremise: L("الحديد معدن", "Iron is a metal"),
    conclusion: L("إذن: الحديد يتمدد بالحرارة", "Therefore: Iron expands when heated"),
    isFormallyValid: true,
    premisesFactuallyTrue: true,
    soundness: "sound",
    explanation: L(
      "الصورة المنطقية صحيحة (الحد الأوسط «معدن» مستغرق في المقدمة الكبرى)، والمقدمتان صادقتان واقعيًا ← قياس سليم.",
      "Logically valid form (distributed middle term 'metal') AND factually true premises -> Sound argument.",
    ),
  },
  {
    id: "valid-unsound-gold",
    label: L("صحيح صوريًا لكن مقدماته كاذبة", "Formally Valid, Factually False"),
    majorPremise: L("كل المعادن تطفو فوق الماء (مقدمة كاذبة واقعيًا)", "All metals float on water (factually false)"),
    minorPremise: L("الذهب معدن", "Gold is a metal"),
    conclusion: L("إذن: الذهب يطفو فوق الماء (نتيجة لازمة صوريًا وكاذبة واقعيًا)", "Therefore: Gold floats on water (structurally follows!)"),
    isFormallyValid: true,
    premisesFactuallyTrue: false,
    soundness: "valid-but-unsound",
    explanation: L(
      "مهم جدًا: الصورة الاستدلالية هنا صحيحة 100% لأن النتيجة تلزم ضرورة عن المقدمتين، لكن خطأ التجربة جاء من كذب المقدمة الكبرى واقعيًا. المنطق يضبط اتساق الاستدلال لا صحة الحقائق المعملية.",
      "Crucial distinction: Form is 100% formally valid because the conclusion necessarily follows IF the premises held, yet empirically unsound because the major premise is factually false.",
    ),
  },
  {
    id: "invalid-undistributed-middle",
    label: L("فاسد صوريًا (وسط غير مستغرق)", "Formally Invalid (Undistributed Middle)"),
    majorPremise: L("كل الطيور لها أجنحة", "All birds have wings"),
    minorPremise: L("كل الخفافيش لها أجنحة", "All bats have wings"),
    conclusion: L("إذن: كل الخفافيش طيور (استدلال خاطئ!)", "Therefore: All bats are birds (INVALID!)"),
    isFormallyValid: false,
    premisesFactuallyTrue: true,
    soundness: "invalid",
    explanation: L(
      "رغم صدق المقدمتين واقعيًا، فالحد الأوسط «لها أجنحة» غير مستغرق في أي منهما (جاء محمولًا لموجبة مرتين)، فلا تلزم النتيجة صوريًا.",
      "Even though both premises are factually true, the middle term ('have wings') is never universally distributed -> Invalid logical form.",
    ),
  },
  {
    id: "invalid-two-negatives",
    label: L("فاسد صوريًا (لا إنتاج من سالبتين)", "Formally Invalid (Two Negative Premises)"),
    majorPremise: L("لا شيء من المعادن بغاز", "No metals are gases"),
    minorPremise: L("لا شيء من الأكسجين بمعدن", "Nothing of oxygen is a metal"),
    conclusion: L("لا يلزم عنهما إثبات أو نفي يقيني", "Cannot validly deduce either way"),
    isFormallyValid: false,
    premisesFactuallyTrue: true,
    soundness: "invalid",
    explanation: L(
      "من شروط القياس المنتج ألا تتكونا من قضيتين سالبتين؛ لأن السلب يفصل الحد الأصغر والأكبر عن الأوسط فلا يربط بينهما.",
      "Two negative premises sever both minor and major terms from the middle term, preventing valid deductive inference.",
    ),
  },
];

export function evaluateSyllogismScenario(id: string): SyllogismScenario {
  return SYLLOGISM_SCENARIOS.find((s) => s.id === id) ?? SYLLOGISM_SCENARIOS[0];
}

export type EnglishTransformCase = {
  id: string;
  category: "transform" | "collocation";
  promptEn: string;
  contextHintAr: string;
  options: string[];
  correctOption: string;
  diagnoseByOption: Record<string, { ok: boolean; reasonEn: string; reasonAr: string }>;
};

export const ENGLISH_TRANSFORM_CASES: EnglishTransformCase[] = [
  {
    id: "past-while-interrupt",
    category: "transform",
    promptEn: "While we _____ the temple ruins, a sandstorm suddenly started.",
    contextHintAr: "فعل مستمر في الخلفية قاطعه حدث قصير مفاجئ.",
    options: ["explored", "were exploring", "are exploring"],
    correctOption: "were exploring",
    diagnoseByOption: {
      explored: {
        ok: false,
        reasonEn: "'explored' uses Past Simple, missing the ongoing background framing needed after 'While'.",
        reasonAr: "الماضي البسيط هنا لا يوضح استمرارية الفعل عند لحظة التقاطع بعد While.",
      },
      "were exploring": {
        ok: true,
        reasonEn: "Correct! Past Continuous ('were exploring') frames the longer background action.",
        reasonAr: "ممتاز! الماضي المستمر يعبّر عن الحدث الطويل المستمر وقت وقوع العاصفة.",
      },
      "are exploring": {
        ok: false,
        reasonEn: "Present Continuous mismatches the past narrative verb 'started'.",
        reasonAr: "المضارع المستمر لا يناسب السياق الماضي مع الفعل started.",
      },
    },
  },
  {
    id: "second-conditional",
    category: "transform",
    promptEn: "If I _____ the school headteacher, I would expand the science lab.",
    contextHintAr: "تحويل لجملة شرطية خيالية في الحاضر (الحالة الثانية).",
    options: ["am", "were", "will be"],
    correctOption: "were",
    diagnoseByOption: {
      am: {
        ok: false,
        reasonEn: "Notice 'would expand' in the result clause — avoid Present 'am' in Second Conditional.",
        reasonAr: "وجود would expand يدل على الحالة الثانية الافتراضية، وليس الحالة الأولى.",
      },
      were: {
        ok: true,
        reasonEn: "Correct! Hypothetical Second Conditional pairs Past Simple ('were') with 'would + base verb'.",
        reasonAr: "صحيح! الحالة الشرطية الثانية تستخدم الماضي البسيط (were) في فعل الشرط مع would.",
      },
      "will be": {
        ok: false,
        reasonEn: "Never put 'will' inside an English 'if' condition clause.",
        reasonAr: "لا تُوضع will داخل جملة فعل الشرط بعد if إطلاقًا.",
      },
    },
  },
  {
    id: "modal-prohibition",
    category: "transform",
    promptEn: "You _____ enter the chemical store without goggles; safety rules forbid it.",
    contextHintAr: "تحويل المعنى: الفرق الدقيق بين المنع القاطع وعدم الضرورة.",
    options: ["don't have to", "mustn't", "could"],
    correctOption: "mustn't",
    diagnoseByOption: {
      "don't have to": {
        ok: false,
        reasonEn: "'don't have to' means 'optional/unnecessary', which contradicts 'safety rules forbid it'!",
        reasonAr: "don't have to تعني «ليس لزامًا/اختياري» بينما الجملة تعبّر عن حظر ومنع.",
      },
      "mustn't": {
        ok: true,
        reasonEn: "Exact! 'mustn't' encodes strict prohibition.",
        reasonAr: "دقيق! mustn't هي الصيغة الصحيحة للمنع والتحريم القاطع.",
      },
      could: {
        ok: false,
        reasonEn: "'could' expresses polite possibility/permission, not prohibition.",
        reasonAr: "could لا تعبّر عن المنع الإلزامي.",
      },
    },
  },
  {
    id: "uncountable-quantifier",
    category: "collocation",
    promptEn: "The librarian had very _____ information about that rare manuscript.",
    contextHintAr: "تذكّر الأسماء غير المعدودة ومحددات الكفاية.",
    options: ["few", "little", "many"],
    correctOption: "little",
    diagnoseByOption: {
      few: {
        ok: false,
        reasonEn: "'few' is strictly for plural countable nouns; 'information' is uncountable.",
        reasonAr: "few للمعدود الجمع فقط، وكلمة information غير معدودة في الإنجليزية.",
      },
      little: {
        ok: true,
        reasonEn: "Spot on! Uncountable nouns like 'information' & 'advice' pair with 'little / a little / much'.",
        reasonAr: "صحيح! الاسم غير المعدود information يأخذ little للتعبير عن القلة غير الكافية.",
      },
      many: {
        ok: false,
        reasonEn: "'many' requires plural countable nouns, never uncountable 'information'.",
        reasonAr: "many تُستعمل مع الأسماء المعدودة الجمع فقط.",
      },
    },
  },
  {
    id: "gerund-after-avoid",
    category: "collocation",
    promptEn: "To stay focused before exams, students must avoid _____ late on social media.",
    contextHintAr: "أفعال محددة مثل avoid و enjoy و suggest يتبعها المصدر المنتهي بـ ing.",
    options: ["to stay", "staying", "stay"],
    correctOption: "staying",
    diagnoseByOption: {
      "to stay": {
        ok: false,
        reasonEn: "'avoid' never takes a to-infinitive; it governs a gerund (-ing).",
        reasonAr: "الفعل avoid لا يأخذ to + المصدر أبدًا، بل يتبعه صيغة V-ing.",
      },
      staying: {
        ok: true,
        reasonEn: "Exact! 'avoid + V-ing' is the required verb-pattern collocation.",
        reasonAr: "صحيح! يتبع الفعل avoid صيغة الفعل المنتهي بـ ing دائمًا.",
      },
      stay: {
        ok: false,
        reasonEn: "Bare infinitive 'stay' cannot follow 'avoid' directly.",
        reasonAr: "المصدر المجرد بدون -ing غير صحيح بعد avoid.",
      },
    },
  },
  {
    id: "do-research-collocation",
    category: "collocation",
    promptEn: "Our biology team will _____ experiments on dissolved oxygen tomorrow morning.",
    contextHintAr: "تذكّر الفرق بين المتلازمات اللفظية do و make مع الأنشطة العلمية والبحثية.",
    options: ["make", "do", "create"],
    correctOption: "do",
    diagnoseByOption: {
      make: {
        ok: false,
        reasonEn: "English pairs 'do' (or 'conduct / carry out') with 'research' and 'experiments', while 'make' fits 'decisions/mistakes'.",
        reasonAr: "المتلازمة الفصيحة في الإنجليزية هي do/conduct experiments وليس make.",
      },
      do: {
        ok: true,
        reasonEn: "Correct! 'do experiments / do research' is the natural collocation.",
        reasonAr: "ممتاز! الفعل do يتلازم مع experiments و research.",
      },
      create: {
        ok: false,
        reasonEn: "'create experiments' is unnatural here; use 'do', 'conduct', or 'carry out'.",
        reasonAr: "الترجمة الحرفية create غير مألوفة هنا مقارنة بـ do / conduct.",
      },
    },
  },
];

export function evaluateEnglishCase(
  caseId: string,
  chosenOption: string,
): { ok: boolean; reasonEn: string; reasonAr: string } {
  const item = ENGLISH_TRANSFORM_CASES.find((c) => c.id === caseId);
  if (!item) {
    return { ok: false, reasonEn: "Unknown item", reasonAr: "عنصر غير معروف" };
  }
  return (
    item.diagnoseByOption[chosenOption] ?? {
      ok: false,
      reasonEn: "Select an option to inspect the grammar rationale.",
      reasonAr: "اختر إجابة لعرض التحليل النحوي.",
    }
  );
}

export const SUBJECT_LAB_SPECS: Record<SubjectLabId, SubjectLabSpec> = {
  "math-complex-argand": {
    id: "math-complex-argand",
    subject: "mathematics",
    accent: "indigo",
    lessonSlugs: ["math-complex-intro"],
    defaultMode: "powers",
    title: L(
      "مختبر الأعداد المركبة ودورة قوى i ومستوى أرجاند",
      "Complex Cycle & Argand Plane Lab",
    ),
    learningObjective: L(
      "استكشاف الدورة الرباعية لقوى i وربط العدد المركب z = a + bi بمرافقه z̄ = a − bi هندسيًا.",
      "Explore the 4-step cycle of powers of i and visualize z = a + bi alongside its conjugate on the Argand plane.",
    ),
    interactionGuide: L(
      "حرّك شريط الأس n أو بدّل إلى مستوى أرجاند لضبط الجزء الحقيقي a والتخيلي b ثم تحقّق من التوقّع.",
      "Adjust the exponent slider n or switch to Argand mode to move z = a + bi and see z·z̄ update live.",
    ),
    fallbackBlocks: {
      ar: [
        {
          type: "math",
          display: true,
          tex: "i^1 = i,\\quad i^2 = -1,\\quad i^3 = -i,\\quad i^4 = 1",
        },
        {
          type: "callout",
          variant: "rule",
          title: "قاعدة الباقي",
          content: "اقسم الأس n على 4 واستخدم باقي القسمة {0, 1, 2, 3} لتحديد القيمة مباشرة.",
        },
      ],
      en: [
        {
          type: "math",
          display: true,
          tex: "i^1 = i,\\quad i^2 = -1,\\quad i^3 = -i,\\quad i^4 = 1",
        },
        {
          type: "callout",
          variant: "rule",
          title: "Modulo-4 Rule",
          content: "Divide integer exponent n by 4 and evaluate using remainder {0, 1, 2, 3}.",
        },
      ],
    },
    prediction: {
      id: "math-cx-pred-1",
      prompt: L(
        "باستخدام دورة الأربعة، ما ناتج تبسيط المقدار $i^{15}$ قبل التحقق على العجلة؟",
        "Using the 4-cycle rule, predict $i^{15}$ before checking on the compass:",
      ),
      choices: [
        { id: "c-i", label: L("$i$", "$i$") },
        { id: "c-neg1", label: L("$-1$", "$-1$") },
        { id: "c-negi", label: L("$-i$", "$-i$") },
        { id: "c-1", label: L("$1$", "$1$") },
      ],
      correctId: "c-negi",
      explainByChoice: {
        "c-i": L(
          "15 تقبل القسمة على 4 بباقي 3 وليس 1 ($15 = 4 \\times 3 + 3$). إذن $i^{15} = i^3 = -i$.",
          "Dividing 15 by 4 leaves remainder 3, not 1 ($15 = 4 \\times 3 + 3$), so $i^{15} = i^3 = -i$.",
        ),
        "c-neg1": L(
          "$-1$ ينتج عندما يكون باقي القسمة على 4 هو 2 (مثل $i^{14}$). أما 15 فباقيها 3، فتكون $-i$.",
          "$-1$ occurs at remainder 2 (like $i^{14}$). Here $15 \\equiv 3 \\pmod 4$, giving $i^3 = -i$.",
        ),
        "c-negi": L(
          "ممتاز! $15 = 4 \\times 3 + 3$، والباقي 3 يطابق الدوران $270^\\circ$ أي $i^3 = -i$.",
          "Spot on! $15 = 4 \\times 3 + 3$, so remainder 3 rotates $270^\\circ$ to $i^3 = -i$.",
        ),
        "c-1": L(
          "$1$ ينتج فقط عند مضاعفات 4 (مثل $i^{12}$ أو $i^{16}$). للأس 15 الباقي 3 أي $-i$.",
          "$1$ only appears at multiples of 4 (such as $i^{12}$ or $i^{16}$). For 15, remainder is 3 so $i^{15} = -i$.",
        ),
      },
    },
  },
  "math-quadratic-parabola": {
    id: "math-quadratic-parabola",
    subject: "mathematics",
    accent: "indigo",
    lessonSlugs: [
      "math-nature-of-roots",
      "math-roots-coefficients",
      "math-sign-of-quadratic",
      "math-quadratic-inequalities",
    ],
    defaultMode: "discriminant",
    title: L(
      "مختبر القطع المكافئ والمميز وجذور المعادلة التربيعية",
      "Quadratic Parabola, Discriminant & Vieta Lab",
    ),
    learningObjective: L(
      "رؤية العلاقة المباشرة بين المعاملات (a, b, c) والمميز Δ = b² − 4ac وعدد تقاطعات المنحنى مع محور x.",
      "Connect coefficients (a, b, c) and discriminant Δ = b² − 4ac directly to the parabola's x-intercepts and Vieta relations.",
    ),
    interactionGuide: L(
      "عدّل المعاملات a و b و c أو جرّب حالة a = 0 الخطية لترى لماذا نشترط a ≠ 0 في الدرجة الثانية.",
      "Slide a, b, and c (including the a = 0 degenerate case) to inspect roots, discriminant Δ, and vertex symmetry.",
    ),
    scientificCaveat: L(
      "شرط جوهري: صيغ المميز وفييت والقانون العام تفترض a ≠ 0؛ عندما a = 0 تصبح المعادلة خطية.",
      "Mathematical domain check: Δ and Vieta formulas require a ≠ 0; at a = 0 the equation collapses to linear bx + c = 0.",
    ),
    fallbackBlocks: {
      ar: [
        {
          type: "math",
          display: true,
          tex: "\\Delta = b^2 - 4ac,\\qquad S = -\\frac{b}{a},\\qquad P = \\frac{c}{a}\\quad (a \\ne 0)",
        },
        {
          type: "callout",
          variant: "rule",
          title: "ثلاث حالات للمميز",
          content: "Δ > 0 جذران حقيقيان مختلفان؛ Δ = 0 جذر مكرر يمس المحور؛ Δ < 0 جذران مركبان مترافقان.",
        },
      ],
      en: [
        {
          type: "math",
          display: true,
          tex: "\\Delta = b^2 - 4ac,\\qquad S = -\\frac{b}{a},\\qquad P = \\frac{c}{a}\\quad (a \\ne 0)",
        },
        {
          type: "callout",
          variant: "rule",
          title: "Three Discriminant Regimes",
          content: "Δ > 0: 2 real roots; Δ = 0: tangent repeated root; Δ < 0: 2 non-real complex conjugate roots.",
        },
      ],
    },
    prediction: {
      id: "math-quad-pred-1",
      prompt: L(
        "في المعادلة $x^2 + 4x + 5 = 0$، قبل أن تضبط المنحنى، كم مرة يقطع القطع المكافئ محور السينات؟",
        "For $x^2 + 4x + 5 = 0$, before adjusting sliders, how many times does $y = x^2 + 4x + 5$ cross the x-axis?",
      ),
      choices: [
        { id: "two-real", label: L("مرتين (جذران حقيقيان مختلفان)", "Twice (2 distinct real roots)") },
        { id: "one-tangent", label: L("يمس المحور في نقطة واحدة", "Once (tangent repeated root)") },
        { id: "zero-complex", label: L("لا يقطع محور السينات (Δ < 0)", "Zero x-intercepts (Δ < 0, complex roots)") },
      ],
      correctId: "zero-complex",
      explainByChoice: {
        "two-real": L(
          "أعد حساب المميز: $\\Delta = 4^2 - 4(1)(5) = 16 - 20 = -4 < 0$، لذا لا توجد جذور حقيقية ولا تقاطع مع محور x.",
          "Check the discriminant: $\\Delta = 4^2 - 4(1)(5) = 16 - 20 = -4 < 0$, so there are zero real x-intercepts.",
        ),
        "one-tangent": L(
          "المماس يحتاج $\\Delta = 0$ (مثل $x^2 + 4x + 4 = 0$). هنا $+5$ يرفع المنحنى أعلى المحور ليصبح $\\Delta = -4 < 0$.",
          "Tangency requires $\\Delta = 0$ (as in $x^2 + 4x + 4$). Here $+5$ lifts the parabola above the axis ($\\Delta = -4 < 0$).",
        ),
        "zero-complex": L(
          "دقيق! $\\Delta = 16 - 20 = -4 < 0$، والرأس $(-2, 1)$ يقع أعلى محور السينات مع فتح لأعلى.",
          "Exact! $\\Delta = 16 - 20 = -4 < 0$ and the vertex $(-2, 1)$ sits strictly above the x-axis.",
        ),
      },
    },
  },
  "sci-water-polarity-density": {
    id: "sci-water-polarity-density",
    subject: "integrated-science",
    accent: "cyan",
    lessonSlugs: ["sci-water-chemistry", "sci-water-physics", "sci-water-review"],
    defaultMode: "polarity",
    title: L(
      "مختبر قطبية جزيء الماء وشذوذ الكثافة والـ pH",
      "Water Polarity, H-Bond & 4°C Density Anomaly Lab",
    ),
    learningObjective: L(
      "ربط الشكل المنحني $104.5^\\circ$ لـ $\\text{H}_2\\text{O}$ بالروابط الهيدروجينية وشذوذ الكثافة عند $4^\\circ\\text{C}$ ومقياس $\\text{pH}$ عند $25^\\circ\\text{C}$.",
      "Connect $\\text{H}_2\\text{O}$'s $104.5^\\circ$ bent polarity to hydrogen bonding, maximum density near $4^\\circ\\text{C}$, and $\\text{pH}$ classification at $25^\\circ\\text{C}$.",
    ),
    interactionGuide: L(
      "بدّل بين مستكشف القطبية والـ $\\text{pH}$ ومحاكي الكثافة عبر الحرارة ($-5^\\circ\\text{C}$ إلى $25^\\circ\\text{C}$) لملاحظة طفو الجليد وعزله للأحياء المائية.",
      "Switch between the Polarity & $\\text{pH}$ view and Temperature slider ($-5^\\circ\\text{C}$ to $25^\\circ\\text{C}$) to watch ice float and insulate deeper $4^\\circ\\text{C}$ water.",
    ),
    scientificCaveat: L(
      "نقطة التعادل $\\text{pH} = 7$ مرجعية عند $\\approx 25^\\circ\\text{C}$ للماء النقي، وتختلف درجة التأين الذاتي للماء بتغيّر الحرارة.",
      "Note: neutral $\\text{pH} = 7$ applies to pure water at the $\\approx 25^\\circ\\text{C}$ reference temperature.",
    ),
    fallbackBlocks: {
      ar: [
        {
          type: "chemistry",
          display: true,
          equation: "H2O: angle(H-O-H) = 104.5 deg, rho_max = 1.00 g/cm^3 at 4 C",
          tex: "\\text{H}_2\\text{O}: \\angle(\\text{H–O–H}) \\approx 104.5^\\circ, \\quad \\rho_{\\max} \\approx 1.00\\,\\text{g/cm}^3 \\text{ at } 4^\\circ\\text{C}",
        },
        {
          type: "callout",
          variant: "rule",
          title: "تفريق جوهري",
          content: "الرابطة داخل الجزيء تساهمية قطبية (قوية)، أما بين الجزيئات فهي هيدروجينية (أضعف وتفسر طفو الجليد عند التبريد).",
        },
      ],
      en: [
        {
          type: "chemistry",
          display: true,
          equation: "H2O: angle(H-O-H) = 104.5 deg, rho_max = 1.00 g/cm^3 at 4 C",
          tex: "\\text{H}_2\\text{O}: \\angle(\\text{H–O–H}) \\approx 104.5^\\circ, \\quad \\rho_{\\max} \\approx 1.00\\,\\text{g/cm}^3 \\text{ at } 4^\\circ\\text{C}",
        },
        {
          type: "callout",
          variant: "rule",
          title: "Key Bond Distinction",
          content: "Intramolecular O–H bonds are strong polar covalent bonds; intermolecular hydrogen bonds are weaker attractions causing ice expansion.",
        },
      ],
    },
    prediction: {
      id: "sci-water-pred-1",
      prompt: L(
        "عند تبريد عينة ماء عذب في بحيرة شتوية من $4^\\circ\\text{C}$ نحو $0^\\circ\\text{C}$، ماذا يحدث لكثافة الماء؟",
        "As freshwater in a winter lake cools from $4^\\circ\\text{C}$ down toward $0^\\circ\\text{C}$, what happens to its density?",
      ),
      choices: [
        { id: "rises", label: L("تزداد باستمرار حتى قاع البحيرة", "Increases steadily so freezing starts at the lake bottom") },
        { id: "drops", label: L("تقل بسبب تمدد الشبكة الهيدروجينية فيطفو الجليد", "Decreases as open hydrogen-bonded clusters expand, so surface ice floats") },
        { id: "constant", label: L("تبقى ثابتة تمامًا بلا تغير", "Remains strictly constant") },
      ],
      correctId: "drops",
      explainByChoice: {
        rises: L(
          "معظم السوائل تزداد كثافتها بالتبريد، لكن الماء يشذ دون $4^\\circ\\text{C}$؛ تقل كثافته فيصعد الأبَرَد والأقل كثافة للسطح ويطفو الجليد عازلًا الحياة بالأسفل.",
          "Most liquids get denser on cooling, but water expands below $4^\\circ\\text{C}$ so cooler water/ice stays at the surface and insulates aquatic life below.",
        ),
        drops: L(
          "صحيح تمامًا! بين $4^\\circ\\text{C}$ و $0^\\circ\\text{C}$ تقل الكثافة ليطفو الجليد على السطح وتبقى مياه القاع الدافئة نسبيًا قرب $4^\\circ\\text{C}$.",
          "Correct! Between $4^\\circ\\text{C}$ and $0^\\circ\\text{C}$, density drops so surface ice floats while deeper water stays insulated near $4^\\circ\\text{C}$.",
        ),
        constant: L(
          "الكثافة تتغير فعليًا وتصل ذروتها قرب $4^\\circ\\text{C}$ ثم تهبط نحو $0.917\\,\\text{g/cm}^3$ عند التجمد.",
          "Density peaks at ~4°C (~1.00 g/cm³) and drops toward ~0.917 g/cm³ when freezing into open ice crystals.",
        ),
      },
    },
  },
  "sci-aquatic-solution-osmosis": {
    id: "sci-aquatic-solution-osmosis",
    subject: "integrated-science",
    accent: "cyan",
    lessonSlugs: ["sci-hydrosphere", "sci-solutions-biology"],
    defaultMode: "osmosis",
    title: L(
      "مختبر المحاليل المائية والأسموزية وانتقال الطاقة البيئي",
      "Aquatic Osmosis, Colligative Shifts & Biosphere Energy Lab",
    ),
    learningObjective: L(
      "تتبّع اتجاه الأسموزية عبر الأغشية الحية وتأثير الملوحة والحرارة على الخواص التجميعية وذوبان O₂.",
      "Track osmotic solvent flux across membranes and test how salinity and temperature alter colligative properties and dissolved O₂.",
    ),
    interactionGuide: L(
      "اضبط ملوحة الوسط الخارجي ودرجة الحرارة أو جرّب نموذج هرم الطاقة التقريبي (~10%) لفهم توازن الكائنات المائية.",
      "Vary external salinity (ppt) and water temperature, or explore the empirical ~10% trophic energy pyramid.",
    ),
    scientificCaveat: L(
      "تنبيه دقة علمية: قاعدة «10% لانتقال الطاقة بين المستويات الغذائية» هي تقريب متوسط إرشادي (يتراوح عمليًا تقريبًا بين 5% و20%) وليست قانونًا فيزيائيًا ثابتًا.",
      "Accuracy guardrail: the ecological ~10% energy-transfer rule is a useful order-of-magnitude approximation (typically ~5%–20% in nature), not an exact law.",
    ),
    fallbackBlocks: {
      ar: [
        {
          type: "callout",
          variant: "rule",
          title: "قاعدة الأسموزية",
          content: "ينتقل المذيب عبر الغشاء شبه المنفذ من التركيز الأقل للمذاب نحو التركيز الأعلى للمذاب.",
        },
        {
          type: "explanation",
          content: "زيادة الملوحة تخفض الضغط البخاري ونقطة التجمد وترفع نقطة الغليان، بينما يقل ذوبان O₂ بارتفاع الحرارة والملوحة.",
        },
      ],
      en: [
        {
          type: "callout",
          variant: "rule",
          title: "Osmosis Principle",
          content: "Net water flow crosses a semi-permeable membrane from lower solute concentration toward higher solute concentration.",
        },
        {
          type: "explanation",
          content: "Higher solute concentration lowers freezing point and vapour pressure while raising boiling point; warmer saltier water holds less dissolved O₂.",
        },
      ],
    },
    prediction: {
      id: "sci-osm-pred-1",
      prompt: L(
        "إذا وُضعت خلية مائية ملوحتها الداخلية $9\\,\\text{ppt}$ داخل ماء بحر ملوحته $35\\,\\text{ppt}$، ما اتجاه صافي حركة الماء؟",
        "If an aquatic cell (internal solute $9\\,\\text{ppt}$) sits in seawater ($35\\,\\text{ppt}$), which way is net osmotic water flow?",
      ),
      choices: [
        { id: "into-cell", label: L("من الخارج إلى داخل الخلية فتنتفخ", "Into the cell (swells)") },
        { id: "out-of-cell", label: L("من داخل الخلية إلى الخارج فتنكمش", "Out of the cell toward seawater (shrinks)") },
        { id: "no-movement", label: L("تتوقف حركة جزيئات الماء تمامًا", "All water movement freezes at zero") },
      ],
      correctId: "out-of-cell",
      explainByChoice: {
        "into-cell": L(
          "المحلول الخارجي ($35\\,\\text{ppt}$) أعلى تركيزًا بالمذاب من الداخل ($9\\,\\text{ppt}$)، لذا يخرج الماء نحو الوسط الأعلى مذابًا.",
          "External seawater ($35\\,\\text{ppt}$) has higher solute concentration than the cell ($9\\,\\text{ppt}$), drawing net water out.",
        ),
        "out-of-cell": L(
          "أحسنت! ينتقل الماء بالأسموزية من الوسط الأقل تركيزًا بالمذاب (9) نحو الأعلى تركيزًا بالمذاب (35) فينكمش السيتوبلازم.",
          "Right! Net water flows from lower solute ($9\\,\\text{ppt}$) toward higher solute ($35\\,\\text{ppt}$), shrinking the cell.",
        ),
        "no-movement": L(
          "جزيئات الماء تتحرك باستمرار في الاتجاهين، لكن المحصلة الصافية تتجه خارج الخلية نحو التركيز الأعلى للملح.",
          "Molecules still move continuously in both directions, with net flow directed out toward higher external salinity.",
        ),
      },
    },
  },
  "arabic-irab-poetry": {
    id: "arabic-irab-poetry",
    subject: "arabic-language",
    accent: "teal",
    lessonSlugs: [
      "arab-parts-of-speech",
      "arab-grammar-word-types",
      "arab-grammar-noun-types",
      "arab-grammar-verb-types",
      "arab-grammar-inflected",
      "arab-grammar-nominatives",
      "arab-reading-hatim",
      "arab-literature-samawal",
      "arab-literature-wasiya",
      "arab-reading-social-values",
      "arab-literature-kab",
      "arab-story-antara",
    ],
    defaultMode: "irab",
    title: L(
      "ورشة الإعراب التفاعلي وميزان البلاغة والنص",
      "Arabic Syntax Parsing & Classical Rhetoric Workshop",
    ),
    learningObjective: L(
      "تفكيك الجملة الاسمية والفعلية كلمةً بكلمة وتعيين علامات الإعراب الأصلية والفرعية، وتحليل الأبيات والنصوص التراثية.",
      "Parse Arabic sentences word by word (roles & inflection markers) and inspect classical poetry structure & rhetoric.",
    ),
    interactionGuide: L(
      "اضغط على كل كلمة في الجملة لاكتشاف موقعها الإعرابي وعلامتها، أو انتقل إلى محلل النص الشعري لاستخراج البلاغة.",
      "Click each Arabic token to inspect its syntactic role & case marker, or switch to the Verse Analyzer tab.",
    ),
    fallbackBlocks: {
      ar: [
        {
          type: "callout",
          variant: "rule",
          title: "قاعدة النواسخ والمرفوعات",
          content: "كان وأخواتها ترفع الاسم وتنصب الخبر، بينما إنّ وأخواتها تنصب الاسم وترفع الخبر؛ والجر يختص بالأسماء والجزم بالفعل المضارع.",
        },
      ],
      en: [
        {
          type: "callout",
          variant: "rule",
          title: "Core Arabic Grammar Distinction",
          content: "Kana raises its noun and marks predicate accusative; Inna puts its noun in accusative and raises predicate.",
        },
      ],
    },
    prediction: {
      id: "arab-irab-pred-1",
      prompt: L(
        "في جملة «كان المعلمونَ مجتهدينَ»، ما الإعراب الدقيق لكلمة «مجتهدينَ» وعلامته؟",
        "In «كان المعلمونَ مجتهدينَ», how is «مجتهدينَ» parsed?",
      ),
      choices: [
        { id: "ism-kana-waw", label: L("اسم كان مرفوع بالواو", "Noun of Kana (nominative with Waw)") },
        { id: "khabar-kana-ya", label: L("خبر كان منصوب وعلامة نصبه الياء لأنه جمع مذكر سالم", "Predicate of Kana (accusative with Ya, sound plural)") },
        { id: "naat-marfu", label: L("نعت مرفوع بالضمة", "Nominative adjective") },
        { id: "maful-fatha", label: L("مفعول به منصوب بالفتحة", "Direct object with Fatha") },
      ],
      correctId: "khabar-kana-ya",
      explainByChoice: {
        "ism-kana-waw": L("«المعلمون» هي اسم كان المرفوع بالواو، أما «مجتهدين» فأتمّت المعنى فهي خبر كان المنصوب بالياء.", "«المعلمون» is the raised noun of كان; «مجتهدين» is its accusative predicate."),
        "khabar-kana-ya": L("أحسنت! كان ترفع «المعلمون» بالواو وتنصب خبرها «مجتهدين» بالياء لأنه جمع مذكر سالم.", "Exact! كان raises «المعلمون» and marks its sound masculine plural predicate accusative with Ya."),
        "naat-marfu": L("لا تطابق «المعلمون» في الرفع بل منصوبة بالياء لأنها خبر كان.", "Notice the accusative Ya ending matching كان's predicate."),
        "maful-fatha": L("كان فعل ناسخ يرفع اسمه وينصب خبره ولا يأخذ مفعولًا به عاديًا كالأفعال المتعدية.", "كان takes a subject and predicate, not a transitive direct object."),
      },
    },
  },
  "history-source-timeline": {
    id: "history-source-timeline",
    subject: "history",
    accent: "amber",
    lessonSlugs: [
      "hist-civilization-history",
      "hist-sources",
      "hist-civilization-factors",
      "hist-ancient-egypt",
      "hist-economy",
    ],
    defaultMode: "rubric",
    title: L(
      "مختبر نقد المصادر التاريخية والخط الزمني للحضارات",
      "Historical Source Critique Rubric & Civilization Timeline",
    ),
    learningObjective: L(
      "تطبيق معايير التقييم الستة الشفافة على المصادر الأولية والثانوية وفهم تفاعل العوامل الطبيعية والبشرية عبر العصور.",
      "Apply a transparent 6-part 100-point rubric to primary vs. secondary sources and inspect era transitions chronologically.",
    ),
    interactionGuide: L(
      "اختر وثيقة تاريخية أو حرّك أوزان النقد الستة، أو بدّل إلى الخط الزمني لمقارنة العصور وعوامل قيام الحضارة.",
      "Inspect preset historical artefacts or tune the 6 explicit rubric sliders, or switch to the Era Timeline explorer.",
    ),
    scientificCaveat: L(
      "معايير موثوقية المصدر مصمّمة بأوزان تعليمية صريحة (20 + 20 + 15 + 15 + 15 + 15 = 100): كون المصدر «أوليًا» كالنقوش الملكية لا يعفيه من فحص الانحياز والمبالغة ومقارنته بأدلة مستقلة.",
      "Transparent rubric weights (20+20+15+15+15+15 = 100): a Primary Source (e.g., royal monument) can still carry political exaggeration and requires independent corroboration.",
    ),
    fallbackBlocks: {
      ar: [
        {
          type: "primary_source",
          attribution: "معايير النقد الستة — المنهج المعتمد",
          quote:
            "1) الأصالة (20)  2) المعاصرة (20)  3) النزاهة والغرض (15)  4) السياق (15)  5) المقارنة بمصادر مستقلة (15)  6) اكتمال الشواهد (15).",
        },
      ],
      en: [
        {
          type: "primary_source",
          attribution: "6 Historical Critique Weights (Sum = 100)",
          quote:
            "Authenticity (20) + Proximity (20) + Bias control (15) + Context (15) + Corroboration (15) + Preservation (15).",
        },
      ],
    },
    prediction: {
      id: "hist-src-pred-1",
      prompt: L(
        "عُثر على لوحة نصر ملكي معاصرة لحملة فرعونية تُعلن إبادة جيش العدو بالكامل، بينما تشير مراسلات إدارية متزامنة لمعركة متكافئة؛ ما التقييم التاريخي الأدق؟",
        "A contemporary royal victory stele claims total enemy annihilation, while contemporaneous tax/letter records note a stalemate. How should historians classify and weigh the stele?",
      ),
      choices: [
        { id: "secondary-junk", label: L("مصدر ثانوي غير معترف به", "Reject it as a secondary source") },
        { id: "primary-needs-corroboration", label: L("مصدر أولي معاصر لكنه متحيز دعائيًا ويُراجع بمقارنة المصادر الإدارية والأثرية", "Valid primary source showing royal propaganda bias; must be corroborated with other records") },
        { id: "literal-infallible", label: L("صحيح حرفيًا بلا حاجة لمقارنة لأنه نقش حجري قديم", "Literally infallible because it is carved in stone") },
      ],
      correctId: "primary-needs-corroboration",
      explainByChoice: {
        "secondary-junk": L("اللوحة المعاصرة للحدث هي مصدر أولي لا ثانوي، لكن أوليتها تعني قرب الزمن لا عصمة المحتوى من الدعاية.", "Because it dates from the era itself it IS a primary source, yet bias analysis is still vital."),
        "primary-needs-corroboration": L("أحسنت! يفرّق المؤرخ بين قِدم المصدر الأولي وبين غرضه السياسي؛ المقارنة بالمراسلات الإدارية تكشف المبالغة.", "Precisely! Contemporaneous origin guarantees it is primary evidence, while cross-checking controls for royal exaggeration."),
        "literal-infallible": L("النقوش الرسمية كثيرًا ما تبالغ في مجد الحاكم، ولذا يُعد فحص الغرض والمقارنة ضروريين.", "Official monuments routinely glorify rulers; corroboration keeps historical reconstruction accurate."),
      },
    },
  },
  "philosophy-logic-fallacy": {
    id: "philosophy-logic-fallacy",
    subject: "philosophy-logic",
    accent: "rose",
    lessonSlugs: [
      "phil-human-thinking",
      "phil-philosophical-stance",
      "phil-logic-terms-propositions",
      "phil-inference",
      "phil-extra-review",
    ],
    defaultMode: "syllogism",
    title: L(
      "ورشة القياس المنطقي وكاشف المغالطات وأساليب التفكير",
      "Syllogism Validity Workshop & Critical Fallacy Lab",
    ),
    learningObjective: L(
      "التمييز الصارم بين صحة صورة القياس (Formal Validity) وبين صدق مقدماته في الواقع (Premise Truth)، وكشف أخطاء التفكير الشائعة.",
      "Separate formal deductive validity from empirical premise truth in syllogisms, and diagnose everyday thinking pitfalls.",
    ),
    interactionGuide: L(
      "اختبر الحالات الأربع في ورشة القياس (لاحظ حالة «المعادن تطفو» الصحيحة صوريًا الكاذبة واقعيًا!) أو تحقّق من مواقف التفكير.",
      "Step through the 4 canonical syllogisms — especially the valid-yet-factually-false paradox — or diagnose critical thinking cases.",
    ),
    scientificCaveat: L(
      "قيد منطقي حاسم: فاحص القياس يختبر اللزوم الصوري بين المقدمتين والنتيجة (Validity) ولا يُغني عن التحقق المعملي والواقعي من صدق المقدمات (Empirical Truth).",
      "Crucial logical boundary: formal structure guarantees validity IF premises hold; establishing factual premise truth requires empirical investigation.",
    ),
    fallbackBlocks: {
      ar: [
        {
          type: "callout",
          variant: "rule",
          title: "قاعدة الصدق الصوري vs الواقعي",
          content: "قد يكون القياس صحيح الصورة المنطقية رغم كذب مقدمة فيه واقعيًا، ولا يكون سليمًا (Sound) إلا باجتماع صحة الصورة + صدق المقدمات.",
        },
      ],
      en: [
        {
          type: "callout",
          variant: "rule",
          title: "Validity vs. Soundness",
          content: "An argument is Formally Valid if its conclusion follows from premises; it is Sound only when Valid AND all premises are factually true.",
        },
      ],
    },
    prediction: {
      id: "phil-log-pred-1",
      prompt: L(
        "إذا سلّمنا جدلًا أن: «كل الكائنات المائية لها أجنحة؛ والحوت كائن مائي ← إذن الحوت له أجنحة»؛ كيف يُوصف هذا الاستدلال منطقيًا؟",
        "Assume: 'All aquatic creatures have wings; whales are aquatic -> therefore whales have wings.' How is this classified logically?",
      ),
      choices: [
        { id: "valid-unsound", label: L("صحيح صوريًا لكنه غير سليم (لأن المقدمة الكبرى كاذبة واقعيًا)", "Formally Valid structure, but Unsound because the major premise is factually false") },
        { id: "invalid-form", label: L("فاسد صوريًا لعدم ترابط المقدمات", "Formally Invalid syllogism structure") },
        { id: "scientifically-true", label: L("حقيقة بيولوجية مثبتة لأن القياس صحيح", "Biologically true fact since deduction was valid") },
      ],
      correctId: "valid-unsound",
      explainByChoice: {
        "valid-unsound": L("إجابة منطقية دقيقة! النتيجة تلزم صوريًا عن المقدمتين (A -> B، C من A إذن B)، لكن كذب «لها أجنحة» واقعيًا يجعل القياس غير سليم (Unsound).", "Sharp logical insight! Structural form is 100% valid, while false premise content makes the conclusion unsound."),
        "invalid-form": L("الصورة نفسها صحيحة تمامًا (الحد الأوسط «كائن مائي» مستغرق كليًا). الخطأ في الواقع المادي للمقدمة لا في بنية القياس.", "The syllogistic form itself is valid; only the empirical premise fails reality."),
        "scientifically-true": L("القياس الصحيح صوريًا لا يخلق حقيقة بيولوجية إذا بدأت بمقدمة خيالية كاذبة.", "Valid deduction never turns false premises into real-world biological facts."),
      },
    },
  },
  "english-transform-collocation": {
    id: "english-transform-collocation",
    subject: "english",
    accent: "violet",
    lessonSlugs: [
      "eng-past-tenses",
      "eng-heritage",
      "eng-hands-help",
      "eng-truth-lies",
      "eng-save-shine",
      "eng-technology-schools",
    ],
    defaultMode: "transform",
    title: L(
      "استوديو تحويل الجمل الإنجليزية والمتلازمات اللغوية",
      "English Sentence Transformation & Contextual Collocation Lab",
    ),
    learningObjective: L(
      "إتقان التمييز الزمني في السرد (Past Simple vs Continuous)، الشرط الافتراضي، المنع مقابل الاختيارية، والأسماء غير المعدودة.",
      "Master Past narrative framing, Second Conditionals, mustn't vs. don't have to, and uncountable quantifiers with targeted diagnostics.",
    ),
    interactionGuide: L(
      "جرّب الحالات التفاعلية في كل بطاقة وشاهد التشخيص النحوي الدقيق لسبب صحة أو خطأ كل بديل.",
      "Pick a completion option in each contextual card to inspect exact grammar rules and distractor diagnostics.",
    ),
    fallbackBlocks: {
      ar: [
        {
          type: "callout",
          variant: "rule",
          title: "مفاتيح التمييز السريع",
          content: "`mustn't` تفيد المنع الصارم، بينما `don't have to` تعني عدم الضرورة؛ والأسماء غير المعدودة مثل `information` و `advice` تُعامل مع `little / much`.",
        },
      ],
      en: [
        {
          type: "callout",
          variant: "rule",
          title: "Quick English Grammar Contrast",
          content: "`mustn't` = forbidden; `don't have to` = optional; `avoid + V-ing`; and uncountable nouns (`information`, `advice`) pair with `little / much`.",
        },
      ],
    },
    prediction: {
      id: "eng-tx-pred-1",
      prompt: L(
        "أيهما يعبر بدقة عن نصيحة صديق بترك عادة السهر الضارة (التوقف التام عن الفعل)؟",
        "Which option accurately means 'quit a harmful habit permanently' rather than pausing on the way to do something?",
      ),
      choices: [
        { id: "stop-ing", label: L("You should stop staying up past midnight.", "You should stop staying up past midnight.") },
        { id: "stop-to", label: L("You should stop to stay up past midnight.", "You should stop to stay up past midnight.") },
        { id: "avoid-to", label: L("You must avoid to stay up late.", "You must avoid to stay up late.") },
      ],
      correctId: "stop-ing",
      explainByChoice: {
        "stop-ing": L("ممتاز! stop + V-ing يعني الإقلاع عن الفعل تمامًا، أما stop + to V فيعني يتوقف ليفعل ذلك الشيء.", "Correct! 'stop + gerund (-ing)' means quit an action; 'stop + to-infinitive' means pause in order to start it."),
        "stop-to": L("'stop to stay up' تعني يتوقف عن فعلٍ آخر لكي يسهر — عكس المعنى المطلوب تمامًا!", "'stop + to V' means pause one activity in order to stay up — the opposite meaning!"),
        "avoid-to": L("الفعل avoid لا يأخذ to + المصدر أبدًا؛ بل يتبعه دائمًا صيغة (V-ing).", "'avoid' always takes a gerund (-ing), never a to-infinitive."),
      },
    },
  },
};

export function getSubjectLabSpec(id: SubjectLabId): SubjectLabSpec {
  return SUBJECT_LAB_SPECS[id];
}

/**
 * Resolves the canonical Interactive Lab for all 6 core curriculum subjects when available.
 * Matches explicit canonical slugs first, then bilingual lesson title keywords, then subject default.
 */
export function resolveSubjectLabForLesson(input: {
  lessonIdOrSlug?: string | null;
  lessonTitle?: string | null;
  subjectKey?: string | null;
}): { spec: SubjectLabSpec; initialMode: SubjectLabInitialMode } | null {
  const rawSlug = (input.lessonIdOrSlug ?? "").trim().toLowerCase();
  const rawTitle = (input.lessonTitle ?? "").trim().toLowerCase();
  const subject = (input.subjectKey ?? "").trim().toLowerCase();

  // Standalone multi-lesson demo pathways (physics kinematics & respiratory biology) stay isolated
  // from aquatic-chemistry and quadratic-parabola simulators.
  if (rawSlug.startsWith("motion-") || rawSlug.startsWith("respiratory-")) {
    return null;
  }

  // Exact slug mappings across all 6 core curriculum families
  if (rawSlug === "math-complex-intro" || rawSlug === "g10-math-01") {
    return { spec: SUBJECT_LAB_SPECS["math-complex-argand"], initialMode: "powers" };
  }
  if (rawSlug === "math-nature-of-roots" || rawSlug === "g10-math-02") {
    return { spec: SUBJECT_LAB_SPECS["math-quadratic-parabola"], initialMode: "discriminant" };
  }
  if (rawSlug === "math-roots-coefficients" || rawSlug === "g10-math-03") {
    return { spec: SUBJECT_LAB_SPECS["math-quadratic-parabola"], initialMode: "vieta" };
  }
  if (rawSlug === "math-sign-of-quadratic" || rawSlug === "g10-math-04") {
    return { spec: SUBJECT_LAB_SPECS["math-quadratic-parabola"], initialMode: "sign" };
  }
  if (rawSlug === "math-quadratic-inequalities" || rawSlug === "g10-math-05") {
    return { spec: SUBJECT_LAB_SPECS["math-quadratic-parabola"], initialMode: "inequality" };
  }
  if (rawSlug === "sci-water-chemistry" || rawSlug === "g10-sci-02") {
    return { spec: SUBJECT_LAB_SPECS["sci-water-polarity-density"], initialMode: "polarity" };
  }
  if (rawSlug === "sci-water-physics" || rawSlug === "sci-water-review" || rawSlug === "g10-sci-03" || rawSlug === "g10-sci-05") {
    return { spec: SUBJECT_LAB_SPECS["sci-water-polarity-density"], initialMode: "density" };
  }
  if (
    rawSlug === "sci-solutions-biology" ||
    rawSlug === "sci-aqueous-solutions" ||
    rawSlug === "sci-biological-water" ||
    rawSlug === "g10-sci-04"
  ) {
    return { spec: SUBJECT_LAB_SPECS["sci-aquatic-solution-osmosis"], initialMode: "osmosis" };
  }
  if (rawSlug === "sci-hydrosphere" || rawSlug === "g10-sci-01") {
    return { spec: SUBJECT_LAB_SPECS["sci-aquatic-solution-osmosis"], initialMode: "trophic" };
  }

  // Arabic slugs
  if (
    rawSlug.startsWith("arab-literature-") ||
    rawSlug.startsWith("arab-reading-") ||
    rawSlug === "arab-story-antara" ||
    rawSlug.includes("samawal") ||
    rawSlug.includes("poetry")
  ) {
    return { spec: SUBJECT_LAB_SPECS["arabic-irab-poetry"], initialMode: "poetry" };
  }
  if (
    rawSlug.startsWith("arab-parts-") ||
    rawSlug.startsWith("arab-grammar-") ||
    rawSlug.startsWith("arabic-")
  ) {
    return { spec: SUBJECT_LAB_SPECS["arabic-irab-poetry"], initialMode: "irab" };
  }

  // History slugs
  if (rawSlug === "hist-sources") {
    return { spec: SUBJECT_LAB_SPECS["history-source-timeline"], initialMode: "rubric" };
  }
  if (rawSlug.startsWith("hist-")) {
    return { spec: SUBJECT_LAB_SPECS["history-source-timeline"], initialMode: "timeline" };
  }

  // Philosophy slugs
  if (rawSlug === "phil-logic-terms-propositions" || rawSlug === "phil-inference") {
    return { spec: SUBJECT_LAB_SPECS["philosophy-logic-fallacy"], initialMode: "syllogism" };
  }
  if (rawSlug.startsWith("phil-")) {
    return { spec: SUBJECT_LAB_SPECS["philosophy-logic-fallacy"], initialMode: "fallacy" };
  }

  // English slugs
  if (rawSlug === "eng-hands-help" || rawSlug === "eng-save-shine") {
    return { spec: SUBJECT_LAB_SPECS["english-transform-collocation"], initialMode: "collocation" };
  }
  if (rawSlug.startsWith("eng-")) {
    return { spec: SUBJECT_LAB_SPECS["english-transform-collocation"], initialMode: "transform" };
  }

  // Bilingual DB lesson title fallbacks
  if (
    rawTitle.includes("complex") ||
    rawTitle.includes("imaginary") ||
    rawTitle.includes("المركبة") ||
    rawTitle.includes("التخيلي")
  ) {
    return { spec: SUBJECT_LAB_SPECS["math-complex-argand"], initialMode: "powers" };
  }
  if (
    rawTitle.includes("quadratic") ||
    rawTitle.includes("discriminant") ||
    rawTitle.includes("vieta") ||
    rawTitle.includes("roots") ||
    rawTitle.includes("التربيعية") ||
    rawTitle.includes("المميز") ||
    rawTitle.includes("جذور") ||
    rawTitle.includes("المتباينات")
  ) {
    const mode: SubjectLabInitialMode =
      rawTitle.includes("vieta") || rawTitle.includes("معاملاتها")
        ? "vieta"
        : rawTitle.includes("sign") || rawTitle.includes("إشارة")
          ? "sign"
          : rawTitle.includes("inequalit") || rawTitle.includes("المتباين")
            ? "inequality"
            : "discriminant";
    return { spec: SUBJECT_LAB_SPECS["math-quadratic-parabola"], initialMode: mode };
  }
  if (
    rawTitle.includes("polar") ||
    rawTitle.includes("hydrogen") ||
    rawTitle.includes("density") ||
    rawTitle.includes("specific heat") ||
    rawTitle.includes("الكيميائية للماء") ||
    rawTitle.includes("الفيزيائية للماء") ||
    rawTitle.includes("قطبية") ||
    rawTitle.includes("الكثافة")
  ) {
    const mode: SubjectLabInitialMode =
      rawTitle.includes("density") || rawTitle.includes("الكثافة") || rawTitle.includes("فيزيائية")
        ? "density"
        : "polarity";
    return { spec: SUBJECT_LAB_SPECS["sci-water-polarity-density"], initialMode: mode };
  }
  if (
    rawTitle.includes("solution") ||
    rawTitle.includes("osmosis") ||
    rawTitle.includes("hydrosphere") ||
    rawTitle.includes("biolog") ||
    rawTitle.includes("الغلاف المائي") ||
    rawTitle.includes("المحاليل") ||
    rawTitle.includes("أسموز") ||
    rawTitle.includes("الحيوية")
  ) {
    const mode: SubjectLabInitialMode =
      rawTitle.includes("hydrosphere") || rawTitle.includes("الغلاف")
        ? "trophic"
        : "osmosis";
    return { spec: SUBJECT_LAB_SPECS["sci-aquatic-solution-osmosis"], initialMode: mode };
  }
  if (
    rawTitle.includes("إعراب") ||
    rawTitle.includes("نحو") ||
    rawTitle.includes("شعر") ||
    rawTitle.includes("أدب") ||
    rawTitle.includes("سموأل") ||
    rawTitle.includes("عنترة") ||
    rawTitle.includes("nominatives") ||
    rawTitle.includes("inflection")
  ) {
    return {
      spec: SUBJECT_LAB_SPECS["arabic-irab-poetry"],
      initialMode: rawTitle.includes("شعر") || rawTitle.includes("سموأل") || rawTitle.includes("عنترة") ? "poetry" : "irab",
    };
  }
  if (
    rawTitle.includes("مصادر") ||
    rawTitle.includes("حضار") ||
    rawTitle.includes("تاريخ") ||
    rawTitle.includes("civilization") ||
    rawTitle.includes("historical") ||
    rawTitle.includes("sources")
  ) {
    return {
      spec: SUBJECT_LAB_SPECS["history-source-timeline"],
      initialMode: rawTitle.includes("مصادر") || rawTitle.includes("sources") ? "rubric" : "timeline",
    };
  }
  if (
    rawTitle.includes("فلسف") ||
    rawTitle.includes("منطق") ||
    rawTitle.includes("تفكير") ||
    rawTitle.includes("قياس") ||
    rawTitle.includes("syllogis") ||
    rawTitle.includes("thinking") ||
    rawTitle.includes("logic")
  ) {
    return {
      spec: SUBJECT_LAB_SPECS["philosophy-logic-fallacy"],
      initialMode: rawTitle.includes("منطق") || rawTitle.includes("قياس") || rawTitle.includes("logic") ? "syllogism" : "fallacy",
    };
  }
  if (
    rawTitle.includes("past") ||
    rawTitle.includes("tense") ||
    rawTitle.includes("heritage") ||
    rawTitle.includes("truth") ||
    rawTitle.includes("collocat") ||
    rawTitle.includes("السرد اللغوي")
  ) {
    return { spec: SUBJECT_LAB_SPECS["english-transform-collocation"], initialMode: "transform" };
  }

  // Subject fallbacks across ALL 6 core curriculum families
  if (subject.startsWith("mathematics")) {
    return { spec: SUBJECT_LAB_SPECS["math-quadratic-parabola"], initialMode: "discriminant" };
  }
  if (subject.startsWith("integrated-science")) {
    return { spec: SUBJECT_LAB_SPECS["sci-water-polarity-density"], initialMode: "polarity" };
  }
  if (subject.startsWith("arabic")) {
    return { spec: SUBJECT_LAB_SPECS["arabic-irab-poetry"], initialMode: "irab" };
  }
  if (subject.startsWith("history")) {
    return { spec: SUBJECT_LAB_SPECS["history-source-timeline"], initialMode: "rubric" };
  }
  if (subject.startsWith("philosophy")) {
    return { spec: SUBJECT_LAB_SPECS["philosophy-logic-fallacy"], initialMode: "syllogism" };
  }
  if (subject.startsWith("english")) {
    return { spec: SUBJECT_LAB_SPECS["english-transform-collocation"], initialMode: "transform" };
  }

  return null;
}
