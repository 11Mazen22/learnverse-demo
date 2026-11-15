export type MistakeClusterDimension = "all" | "skill" | "misconception" | "format";

export type MisconceptionPatternId =
  | "complex-cycle-powers"
  | "formula-substitution"
  | "arabic-syntax-nawasikh"
  | "english-tense-modal"
  | "logic-source-rubric"
  | "conceptual-definition";

export interface MistakeClusterSourceItem {
  id: string;
  source_type: string;
  deck_id?: string | null;
  card_id?: string | null;
  lesson_id?: string | null;
  topic?: string | null;
  prompt: string;
  user_answer?: string | null;
  expected_answer: string;
  explanation?: string | null;
  mistake_count: number;
  resolved_at?: string | null;
}

export interface MistakeClusterSummary {
  key: string;
  dimension: Exclude<MistakeClusterDimension, "all">;
  labelAr: string;
  labelEn: string;
  hintAr: string;
  hintEn: string;
  totalCount: number;
  unresolvedCount: number;
  repeatWeight: number;
  mistakeIds: string[];
}

export interface MistakeClusterReport {
  skills: MistakeClusterSummary[];
  misconceptions: MistakeClusterSummary[];
  formats: MistakeClusterSummary[];
}

export interface SynthesizedMistakeDrillCard {
  id: string;
  deck_id: string;
  card_type: "basic";
  front: string;
  back: string;
  hint: string;
  explanation: string;
  due_at: string;
  interval_days: number;
  ease_factor: number;
  reps: number;
  lapses: number;
  suspended: boolean;
  tags: string[];
}

const PATTERN_DEFINITIONS: Record<
  MisconceptionPatternId,
  {
    labelAr: string;
    labelEn: string;
    hintAr: string;
    hintEn: string;
    keywords: readonly string[];
  }
> = {
  "complex-cycle-powers": {
    labelAr: "قوى i والعمليات المركبة",
    labelEn: "Powers of i & Complex Arithmetic",
    hintAr: "قسّم الأس على $4$ ثم استبدل $i^2 = -1$ واضرب في المرافق بدل الفصل العشوائي.",
    hintEn: "Reduce exponents mod $4$, apply $i^2 = -1$ carefully, and rationalize with conjugates.",
    keywords: ["i^", "i²", "تخيلي", "مركب", "مرافق", "complex", "imaginary", "conjugate", "discriminant", "المميز"],
  },
  "formula-substitution": {
    labelAr: "القوانين والتعويض والوحدات",
    labelEn: "Formulas, Substitution & Units",
    hintAr: "ثبّت وحدات القياس واكتب القانون الأصلي قبل التعويض المباشر بالأرقام.",
    hintEn: "Write the symbolic law and verify consistent units before substituting values.",
    keywords: ["q=", "mc", "كثافة", "density", "ph", "ضغط", "حرارة", "osmosis", "أسموزي", "104.5", "salinity", "ملوحة", "°c"],
  },
  "arabic-syntax-nawasikh": {
    labelAr: "النواسخ وعلامات الإعراب",
    labelEn: "Arabic Syntax, Kan/Inna & I'rab",
    hintAr: "تذكّر: كان ترفع المبتدأ وتنصب الخبر، وإنّ تنصب المبتدأ وترفع الخبر، والمثنى يُرفع بالألف.",
    hintEn: "Track nominative/accusative case changes accurately across Kana/Inna and dual endings.",
    keywords: ["كان", "إنّ", "إن", "مرفوع", "منصوب", "خبر", "فاعل", "نائب فاعل", "مثنى", "إعراب", "بحر", "قافية"],
  },
  "english-tense-modal": {
    labelAr: "الأزمنة والأفعال الناقصة",
    labelEn: "English Tenses & Modal Contrast",
    hintAr: "فرّق بين الحدث المستمر المتقاطع والمنع الصارم (mustn't) مقابل عدم الضرورة (don't have to).",
    hintEn: "Contrast interrupted background progressive from completed simple actions and strict vs optional modals.",
    keywords: ["past", "continuous", "while", "when", "mustn", "have to", "conditional", "used to", "english", "collocation"],
  },
  "logic-source-rubric": {
    labelAr: "الصحة الصورية وتقييم المصادر",
    labelEn: "Formal Validity & Source Rubric",
    hintAr: "افصل لزوم النتيجة عن صدق المقدمات واقعيًا، ولا تكتفِ بوسم المصدر أوليًا دون فحص التحيز.",
    hintEn: "Separate deductive validity from premise truth, and check bias/corroboration on primary sources.",
    keywords: ["قياس", "صوري", "مقدمة", "أولي", "ثانوي", "نقش", "بردية", "تحيز", "validity", "soundness", "primary source", "bias"],
  },
  "conceptual-definition": {
    labelAr: "التعاريف والمفاهيم المحورية",
    labelEn: "Core Concept Recall & Framing",
    hintAr: "قارن الإجابة الخاطئة بالشرط المميّز للمفهوم قبل تثبيت البطاقة.",
    hintEn: "Anchor on the distinguishing rule rather than surface phrasing similarity.",
    keywords: [],
  },
};

function cleanText(raw: string | null | undefined): string {
  return (raw ?? "").trim();
}

export function normalizeMistakeSkillTopic(item: Pick<MistakeClusterSourceItem, "topic" | "lesson_id">): string {
  const topic = cleanText(item.topic);
  if (topic) return topic;
  const lesson = cleanText(item.lesson_id);
  if (lesson) return lesson.replace(/[-_]+/g, " ");
  return "general-review";
}

export function classifyMisconceptionPattern(
  item: Pick<MistakeClusterSourceItem, "topic" | "prompt" | "user_answer" | "expected_answer" | "explanation">,
): MisconceptionPatternId {
  const haystack = [
    item.topic,
    item.prompt,
    item.user_answer,
    item.expected_answer,
    item.explanation,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const id of Object.keys(PATTERN_DEFINITIONS) as MisconceptionPatternId[]) {
    if (id === "conceptual-definition") continue;
    if (PATTERN_DEFINITIONS[id].keywords.some((kw) => haystack.includes(kw))) {
      return id;
    }
  }
  return "conceptual-definition";
}

function formatClusterMeta(sourceType: string): { labelAr: string; labelEn: string; hintAr: string; hintEn: string } {
  const clean = sourceType.trim().toLowerCase();
  if (clean === "quiz") {
    return {
      labelAr: "أخطاء الاختبارات التفاعلية",
      labelEn: "Quiz Distractor Mistakes",
      hintAr: "أسئلة اختيار من متعدد — راجع التبرير العلمي لكل مشتّت.",
      hintEn: "Timed/MCQ questions — review why your chosen distractor differed.",
    };
  }
  if (clean === "flashcard") {
    return {
      labelAr: "أخطاء استرجاع البطاقات",
      labelEn: "Flashcard Recall Misses",
      hintAr: "فجوات تذكّر حر أو كتابي من جلسات SM-2 والمطابقة.",
      hintEn: "Active recall gaps captured during SM-2 flips or speed matching.",
    };
  }
  if (clean === "lesson") {
    return {
      labelAr: "نقاط التحقق داخل الدروس",
      labelEn: "In-Lesson Checkpoints",
      hintAr: "أخطاء ظهرت أثناء التطبيق المرحلي داخل الدروس.",
      hintEn: "Concept checks missed inside structured lesson stages.",
    };
  }
  return {
    labelAr: clean || "صيغة تدريب عامة",
    labelEn: clean || "General Study Format",
    hintAr: "مراجعة شاملة لعناصر التدريب المسجّلة.",
    hintEn: "Captured items across general practice exercises.",
  };
}

function sortClusters(clusters: MistakeClusterSummary[]): MistakeClusterSummary[] {
  return clusters.sort((a, b) => {
    if (b.unresolvedCount !== a.unresolvedCount) return b.unresolvedCount - a.unresolvedCount;
    if (b.repeatWeight !== a.repeatWeight) return b.repeatWeight - a.repeatWeight;
    return a.key.localeCompare(b.key);
  });
}

/**
 * Groups learner mistake logs by Skill/Concept, Misconception Pattern, and Source Format
 * so the Study Studio surfaces actionable repair clusters instead of an unstructured flat list.
 */
export function buildMistakeClusters(mistakes: readonly MistakeClusterSourceItem[]): MistakeClusterReport {
  const skillBuckets = new Map<string, MistakeClusterSummary>();
  const misconceptionBuckets = new Map<string, MistakeClusterSummary>();
  const formatBuckets = new Map<string, MistakeClusterSummary>();

  for (const item of mistakes) {
    const unresolved = !item.resolved_at;
    const count = Math.max(1, Number(item.mistake_count) || 1);

    const skillName = normalizeMistakeSkillTopic(item);
    const skillKey = skillName.toLowerCase();
    const existingSkill = skillBuckets.get(skillKey);
    if (existingSkill) {
      existingSkill.totalCount += 1;
      if (unresolved) existingSkill.unresolvedCount += 1;
      existingSkill.repeatWeight += count;
      existingSkill.mistakeIds.push(item.id);
    } else {
      skillBuckets.set(skillKey, {
        key: skillName,
        dimension: "skill",
        labelAr: skillName === "general-review" ? "مراجعة عامة" : skillName,
        labelEn: skillName === "general-review" ? "General Review" : skillName,
        hintAr: "تجميع الأخطاء المرتبطة بنفس المفهوم أو الدرس.",
        hintEn: "Mistakes grouped under the same curriculum skill or topic.",
        totalCount: 1,
        unresolvedCount: unresolved ? 1 : 0,
        repeatWeight: count,
        mistakeIds: [item.id],
      });
    }

    const patternId = classifyMisconceptionPattern(item);
    const patternMeta = PATTERN_DEFINITIONS[patternId];
    const existingPattern = misconceptionBuckets.get(patternId);
    if (existingPattern) {
      existingPattern.totalCount += 1;
      if (unresolved) existingPattern.unresolvedCount += 1;
      existingPattern.repeatWeight += count;
      existingPattern.mistakeIds.push(item.id);
    } else {
      misconceptionBuckets.set(patternId, {
        key: patternId,
        dimension: "misconception",
        labelAr: patternMeta.labelAr,
        labelEn: patternMeta.labelEn,
        hintAr: patternMeta.hintAr,
        hintEn: patternMeta.hintEn,
        totalCount: 1,
        unresolvedCount: unresolved ? 1 : 0,
        repeatWeight: count,
        mistakeIds: [item.id],
      });
    }

    const fmtKey = (item.source_type || "quiz").trim().toLowerCase();
    const fmtMeta = formatClusterMeta(fmtKey);
    const existingFmt = formatBuckets.get(fmtKey);
    if (existingFmt) {
      existingFmt.totalCount += 1;
      if (unresolved) existingFmt.unresolvedCount += 1;
      existingFmt.repeatWeight += count;
      existingFmt.mistakeIds.push(item.id);
    } else {
      formatBuckets.set(fmtKey, {
        key: fmtKey,
        dimension: "format",
        labelAr: fmtMeta.labelAr,
        labelEn: fmtMeta.labelEn,
        hintAr: fmtMeta.hintAr,
        hintEn: fmtMeta.hintEn,
        totalCount: 1,
        unresolvedCount: unresolved ? 1 : 0,
        repeatWeight: count,
        mistakeIds: [item.id],
      });
    }
  }

  return {
    skills: sortClusters([...skillBuckets.values()]),
    misconceptions: sortClusters([...misconceptionBuckets.values()]),
    formats: sortClusters([...formatBuckets.values()]),
  };
}

/**
 * Filters a set of mistakes to the selected cluster dimension + key (preferring unresolved errors,
 * with fallback to resolved items if a cluster has no remaining open errors).
 */
export function filterMistakesByCluster<T extends MistakeClusterSourceItem>(
  mistakes: readonly T[],
  dimension: MistakeClusterDimension,
  clusterKey: string | null,
): T[] {
  if (dimension === "all" || !clusterKey) return [...mistakes];

  return mistakes.filter((item) => {
    if (dimension === "skill") {
      return normalizeMistakeSkillTopic(item).toLowerCase() === clusterKey.toLowerCase();
    }
    if (dimension === "misconception") {
      return classifyMisconceptionPattern(item) === clusterKey;
    }
    return (item.source_type || "quiz").trim().toLowerCase() === clusterKey.toLowerCase();
  });
}

/**
 * Builds deterministic focused drill flashcards for a mistake cluster without duplicating front prompts.
 */
export function buildClusterDrillCards(
  mistakes: readonly MistakeClusterSourceItem[],
  dimension: MistakeClusterDimension = "all",
  clusterKey: string | null = null,
): SynthesizedMistakeDrillCard[] {
  const scoped = filterMistakesByCluster(mistakes, dimension, clusterKey);
  const openFirst = scoped.some((m) => !m.resolved_at)
    ? scoped.filter((m) => !m.resolved_at)
    : scoped;

  const sorted = [...openFirst].sort((a, b) => (b.mistake_count || 1) - (a.mistake_count || 1));
  const seenFronts = new Set<string>();
  const nowIso = new Date().toISOString();
  const cards: SynthesizedMistakeDrillCard[] = [];

  for (const m of sorted) {
    const cleanFront = m.prompt.trim();
    if (!cleanFront) continue;
    const dedupeKey = cleanFront.toLowerCase();
    if (seenFronts.has(dedupeKey)) continue;
    seenFronts.add(dedupeKey);

    const patternId = classifyMisconceptionPattern(m);
    cards.push({
      id: `mistake-cluster-${m.id}`,
      deck_id: m.deck_id ?? "mistake-drill",
      card_type: "basic",
      front: cleanFront,
      back: m.expected_answer.trim(),
      hint: m.user_answer ? `${PATTERN_DEFINITIONS[patternId].hintEn} (${m.user_answer})` : PATTERN_DEFINITIONS[patternId].hintEn,
      explanation: cleanText(m.explanation),
      due_at: nowIso,
      interval_days: 0,
      ease_factor: 2.5,
      reps: 0,
      lapses: Math.max(1, m.mistake_count || 1),
      suspended: false,
      tags: ["mistake-repair", patternId, ...(m.topic ? [m.topic] : [])],
    });
  }

  return cards;
}
