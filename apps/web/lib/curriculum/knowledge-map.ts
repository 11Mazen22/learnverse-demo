export type HookExtractionOptions = {
  maxSentences?: number;
  maxFallbackChars?: number;
};

const ABBREVIATIONS = [
  "e.g.",
  "i.e.",
  "etc.",
  "vs.",
  "fig.",
  "no.",
  "dr.",
  "mr.",
  "mrs.",
  "ms.",
  "prof.",
  "st.",
  "أ.د.",
  "د.",
  "م.",
  "ص.",
];

function endsWithAbbreviation(sliceBeforeDot: string): boolean {
  const lower = `${sliceBeforeDot}.`.toLowerCase();
  return ABBREVIATIONS.some((abbr) => lower.endsWith(abbr));
}

/**
 * Extracts a crisp multi-sentence hook from a full curriculum summary
 * without ever splitting inside LaTeX math ($...$ / $$...$$), decimals (104.5°),
 * or common abbreviations (e.g., i.e., Fig.).
 */
export function extractLessonHook(
  summary: string | null | undefined,
  maxSentencesOrOptions: number | HookExtractionOptions = 2,
): string {
  const clean = (summary ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "";

  const options =
    typeof maxSentencesOrOptions === "number"
      ? { maxSentences: maxSentencesOrOptions, maxFallbackChars: 240 }
      : maxSentencesOrOptions;

  const maxSentences = Math.max(1, options.maxSentences ?? 2);
  const maxFallbackChars = Math.max(80, options.maxFallbackChars ?? 240);

  let inInlineMath = false;
  let inDisplayMath = false;
  let parenDepth = 0;
  let sentenceCount = 0;

  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    const next = clean[i + 1];
    const prev = i > 0 ? clean[i - 1] : "";

    // Ignore escaped symbols
    if (prev === "\\") continue;

    if (ch === "$" && next === "$") {
      if (!inInlineMath) {
        inDisplayMath = !inDisplayMath;
      }
      i += 1;
      continue;
    }

    if (ch === "$" && !inDisplayMath) {
      inInlineMath = !inInlineMath;
      continue;
    }

    if (inInlineMath || inDisplayMath) continue;

    if (ch === "(" || ch === "[") {
      parenDepth += 1;
      continue;
    }
    if ((ch === ")" || ch === "]") && parenDepth > 0) {
      parenDepth -= 1;
      continue;
    }
    if (parenDepth > 0) continue;

    const isTerminator = ch === "." || ch === "؟" || ch === "?" || ch === "!";
    if (!isTerminator) continue;

    // Never split decimals like 3.98 or 104.5 or 0.917
    if (ch === "." && /\d/.test(prev) && /\d/.test(next ?? "")) {
      continue;
    }

    // Skip abbreviations like e.g. or i.e.
    if (ch === "." && endsWithAbbreviation(clean.slice(Math.max(0, i - 10), i))) {
      continue;
    }

    // Sentence boundary typically precedes whitespace or end of string (allow optional quote/bracket right after dot)
    const boundaryEnd =
      next === '"' || next === "'" || next === ")" || next === "»" ? i + 1 : i;
    const afterBoundary = clean[boundaryEnd + 1];
    if (afterBoundary !== undefined && !/\s/.test(afterBoundary)) {
      continue;
    }

    sentenceCount += 1;
    if (sentenceCount >= maxSentences) {
      return clean.slice(0, boundaryEnd + 1).trim();
    }
  }

  if (clean.length <= maxFallbackChars) {
    return clean;
  }

  // Fallback cut safely outside math if a single monolithic paragraph has no punctuation breaks
  const candidate = clean.slice(0, maxFallbackChars);
  const lastSpace = candidate.lastIndexOf(" ");
  const safeSlice = lastSpace > 80 ? candidate.slice(0, lastSpace) : candidate;
  const openDollarCount = (safeSlice.match(/(?<!\\)\$/g) ?? []).length;
  if (openDollarCount % 2 !== 0) {
    return clean;
  }
  return `${safeSlice.trim()}…`;
}

/** Checks whether the full summary contains meaningful further text beyond its hero hook. */
export function hasSummaryDetailBeyondHook(
  summary: string | null | undefined,
  hook: string | null | undefined,
): boolean {
  const full = (summary ?? "").replace(/\s+/g, " ").trim();
  const short = (hook ?? "").replace(/\s+/g, " ").trim();
  if (!full) return false;
  return full.length > short.length + 24;
}

export type KnowledgeMapInputUnit = {
  id: string;
  position: number;
  title_ar: string;
  title_en: string;
};

export type KnowledgeMapInputLesson = {
  id: string;
  unit_id: string;
  position: number;
  title_ar: string;
  title_en: string;
};

export type KnowledgeMapLessonNode = {
  id: string;
  unitId: string;
  orderNumber: number;
  titleAr: string;
  titleEn: string;
  completed: boolean;
  prerequisiteLessonId: string | null;
  prerequisiteTitleAr: string | null;
  prerequisiteTitleEn: string | null;
  hasInteractiveLab: boolean;
};

export type KnowledgeMapUnitNode = {
  id: string;
  position: number;
  titleAr: string;
  titleEn: string;
  lessons: KnowledgeMapLessonNode[];
};

export type SubjectKnowledgeMap = {
  subjectKey: string;
  units: KnowledgeMapUnitNode[];
  totalLessons: number;
  completedLessons: number;
  bossMilestoneLabelAr: string;
  bossMilestoneLabelEn: string;
};

/**
 * Builds an explicit dependency chain per track:
 * Unit -> Ordered Lessons (with sequential prerequisites & interactive-lab badges) -> Boss Milestone.
 */
export function buildSubjectKnowledgeMap(params: {
  subjectKey: string;
  units: KnowledgeMapInputUnit[];
  lessons: KnowledgeMapInputLesson[];
  completedLessonIds: ReadonlySet<string>;
  hasInteractiveLabForLesson?: (lesson: KnowledgeMapInputLesson) => boolean;
}): SubjectKnowledgeMap {
  const sortedUnits = [...params.units].sort((a, b) => a.position - b.position);
  let previousLesson: KnowledgeMapInputLesson | null = null;
  let runningOrder = 0;
  let completedLessons = 0;

  const mappedUnits: KnowledgeMapUnitNode[] = sortedUnits.map((unit) => {
    const unitLessons = params.lessons
      .filter((lesson) => lesson.unit_id === unit.id)
      .sort((a, b) => a.position - b.position);

    const nodes: KnowledgeMapLessonNode[] = unitLessons.map((lesson) => {
      runningOrder += 1;
      const done = params.completedLessonIds.has(lesson.id);
      if (done) completedLessons += 1;

      const node: KnowledgeMapLessonNode = {
        id: lesson.id,
        unitId: unit.id,
        orderNumber: runningOrder,
        titleAr: lesson.title_ar,
        titleEn: lesson.title_en,
        completed: done,
        prerequisiteLessonId: previousLesson ? previousLesson.id : null,
        prerequisiteTitleAr: previousLesson ? previousLesson.title_ar : null,
        prerequisiteTitleEn: previousLesson ? previousLesson.title_en : null,
        hasInteractiveLab: params.hasInteractiveLabForLesson
          ? params.hasInteractiveLabForLesson(lesson)
          : true,
      };

      previousLesson = lesson;
      return node;
    });

    return {
      id: unit.id,
      position: unit.position,
      titleAr: unit.title_ar,
      titleEn: unit.title_en,
      lessons: nodes,
    };
  });

  return {
    subjectKey: params.subjectKey,
    units: mappedUnits,
    totalLessons: runningOrder,
    completedLessons,
    bossMilestoneLabelAr: "تحدي إتقان الوحدة (Boss)",
    bossMilestoneLabelEn: "Unit Mastery Boss Challenge",
  };
}

export type PreLessonDiagnosticQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
  correctId: string;
  focusIfMissed: string;
  feedbackCorrect: string;
  feedbackMissed: string;
};

/**
 * Returns 2 concise optional readiness questions per subject/lesson so learners
 * spot prerequisite gaps in Stage 1 before entering Stage 2 explanations & interactive labs.
 */
export function getPreLessonDiagnosticItems(
  lessonIdOrSlug: string,
  subjectKey: string,
  contentLocale: "ar" | "en",
): PreLessonDiagnosticQuestion[] {
  const key = `${subjectKey} ${lessonIdOrSlug}`.toLowerCase();

  if (key.includes("complex") || key.includes("مركب")) {
    return contentLocale === "en"
      ? [
          {
            id: "complex-i2",
            prompt: "Which identity defines the imaginary unit $i$ in the complex number system?",
            options: [
              { id: "a", label: "$i^2 = 1$" },
              { id: "b", label: "$i^2 = -1$" },
              { id: "c", label: "$i = 0$" },
            ],
            correctId: "b",
            focusIfMissed: "Powers of $i$ Cycle",
            feedbackCorrect: "Ready! Keep $i^2 = -1$ central throughout Stage 2.",
            feedbackMissed: "Start Stage 2 with the 4-cycle Powers of $i$ lab before solving equations.",
          },
          {
            id: "complex-im",
            prompt: "For $z = 3 - 5i$, what is the imaginary part $\\operatorname{Im}(z)$?",
            options: [
              { id: "a", label: "$-5$" },
              { id: "b", label: "$-5i$" },
              { id: "c", label: "$3$" },
            ],
            correctId: "a",
            focusIfMissed: "Real & Imaginary Components",
            feedbackCorrect: "Sharp! $\\operatorname{Im}(z)$ is the real coefficient $b$, never $bi$.",
            feedbackMissed: "Watch the sign pitfall in Stage 2: $\\operatorname{Im}(a + bi)$ is the real coefficient $b$, not $bi$.",
          },
        ]
      : [
          {
            id: "complex-i2-ar",
            prompt: "ما القاعدة الأساسية التي تعرّف العدد التخيلي $\\text{ت}$؟",
            options: [
              { id: "a", label: "$\\text{ت}^2 = 1$" },
              { id: "b", label: "$\\text{ت}^2 = -1$" },
              { id: "c", label: "$\\text{ت} = 0$" },
            ],
            correctId: "b",
            focusIfMissed: "مختبر دورة قوى ت",
            feedbackCorrect: "ممتاز! أنت جاهز لاستكشاف دورة القوى الأربع ومستوى أرجاند.",
            feedbackMissed: "ركّز أولًا في المرحلة ٢ على مختبر دورة قوى $\\text{ت}$ لفهم تكرار كل ٤ أسس.",
          },
          {
            id: "complex-im-ar",
            prompt: "في العدد المركب $\\text{ع} = 4 - 3\\text{ت}$، ما معامل الجزء التخيلي؟",
            options: [
              { id: "a", label: "$-3$" },
              { id: "b", label: "$-3\\text{ت}$" },
              { id: "c", label: "$4$" },
            ],
            correctId: "a",
            focusIfMissed: "التمييز بين الجزء الحقيقي ومعامل التخيلي",
            feedbackCorrect: "دقيق! معامل الجزء التخيلي عدد حقيقي دون الرمز $\\text{ت}$.",
            feedbackMissed: "انتبه في بطاقات المرحلة ٢ إلى أن معامل الجزء التخيلي هنا هو $-3$ فقط دون $\\text{ت}$.",
          },
        ];
  }

  if (key.includes("math") || key.includes("quadratic") || key.includes("roots") || key.includes("sign-function") || key.includes("رياضي")) {
    return contentLocale === "en"
      ? [
          {
            id: "quad-a0",
            prompt: "When $ax^2 + bx + c = 0$ has $a = 0$, what does the equation become?",
            options: [
              { id: "a", label: "Still quadratic with two complex roots" },
              { id: "b", label: "Linear equation $bx + c = 0$ (not quadratic)" },
              { id: "c", label: "Always has discriminant $\\Delta > 0$" },
            ],
            correctId: "b",
            focusIfMissed: "Leading Coefficient Guard ($a \\neq 0$)",
            feedbackCorrect: "Spot on! $a \\neq 0$ is mandatory for every quadratic theorem.",
            feedbackMissed: "Test $a = 0$ in Stage 2's Parabola Lab to see how the equation collapses to a line.",
          },
          {
            id: "quad-disc",
            prompt: "Which expression determines whether real roots exist without solving completely?",
            options: [
              { id: "a", label: "$b^2 - 4ac$" },
              { id: "b", label: "$-b / a$" },
              { id: "c", label: "$c / a$" },
            ],
            correctId: "a",
            focusIfMissed: "Discriminant & Vieta Relations",
            feedbackCorrect: "Ready! Explore root behavior as the discriminant crosses zero.",
            feedbackMissed: "Focus on the Discriminant $\\Delta = b^2 - 4ac$ breakdown in Stage 2.",
          },
        ]
      : [
          {
            id: "quad-a0-ar",
            prompt: "في المعادلة $\\text{أ}\\text{س}^2 + \\text{ب}\\text{س} + \\text{جـ} = 0$، ماذا يحدث إذا كانت $\\text{أ} = 0$؟",
            options: [
              { id: "a", label: "تبقى تربيعية ولها جذران مركبان" },
              { id: "b", label: "تنقلب لمعادلة خطية من الدرجة الأولى $\\text{ب}\\text{س} + \\text{جـ} = 0$" },
              { id: "c", label: "يكون مميزها موجبًا دائمًا" },
            ],
            correctId: "b",
            focusIfMissed: "شرط المعامل الرئيسي أ ≠ ٠",
            feedbackCorrect: "دقيق! شرط $\\text{أ} \\neq 0$ أساس كل نظرية في المعادلة التربيعية.",
            feedbackMissed: "جرّب وضع $a = 0$ في مختبر القطع المكافئ بالمرحلة ٢ لترى تحولها لخط مستقيم.",
          },
          {
            id: "quad-disc-ar",
            prompt: "أي مقدار يحدد نوع جذري المعادلة التربيعية دون حلها بالكامل؟",
            options: [
              { id: "a", label: "المميز $\\Delta = \\text{ب}^2 - 4\\text{أ}\\text{جـ}$" },
              { id: "b", label: "حاصل ضرب الجذرين $\\text{جـ} / \\text{أ}$" },
              { id: "c", label: "مجموع الجذرين $-\\text{ب} / \\text{أ}$" },
            ],
            correctId: "a",
            focusIfMissed: "المميز وعلاقات الجذرين",
            feedbackCorrect: "ممتاز! استعد لربط إشارة المميز برسم القطع المكافئ.",
            feedbackMissed: "راجع بطاقة المميز $\\Delta = \\text{ب}^2 - 4\\text{أ}\\text{جـ}$ في المرحلة ٢ لتمييز الحالات الثلاث للجذور.",
          },
        ];
  }

  if (key.includes("integrated-science") || key.includes("water") || key.includes("علوم")) {
    return contentLocale === "en"
      ? [
          {
            id: "sci-bond",
            prompt: "Why does the $\\mathrm{H_2O}$ molecule carry a permanent partial charge separation (polarity)?",
            options: [
              { id: "a", label: "It forms a bent shape ($\\approx 104.5^{\\circ}$) and oxygen is more electronegative" },
              { id: "b", label: "Hydrogen pulls electrons more strongly than oxygen" },
              { id: "c", label: "It is completely linear ($180^{\\circ}$)" },
            ],
            correctId: "a",
            focusIfMissed: "Water Polarity & Hydrogen Bonds",
            feedbackCorrect: "Strong foundation! That bent geometry unlocks hydrogen bonding.",
            feedbackMissed: "Inspect the $\\mathrm{H_2O}$ bond-angle model first in Stage 2.",
          },
          {
            id: "sci-density",
            prompt: "At atmospheric pressure, near which temperature does liquid water reach maximum density?",
            options: [
              { id: "a", label: "$0^{\\circ}\\text{C}$" },
              { id: "b", label: "$4^{\\circ}\\text{C}$" },
              { id: "c", label: "$25^{\\circ}\\text{C}$" },
            ],
            correctId: "b",
            focusIfMissed: "4°C Density Anomaly Curve",
            feedbackCorrect: "Ready! Explore why $0^{\\circ}\\text{C}$ ice floats above $4^{\\circ}\\text{C}$ lake bottom water.",
            feedbackMissed: "Use the temperature slider across $0^{\\circ}\\text{C}$–$4^{\\circ}\\text{C}$ in Stage 2's Density Lab.",
          },
        ]
      : [
          {
            id: "sci-bond-ar",
            prompt: "ما سبب قطبية جزيء الماء $\\mathrm{H_2O}$؟",
            options: [
              { id: "a", label: "الزاوية المنحنية ($\\approx 104.5^{\\circ}$) وكهروسالبية الأكسجين الأعلى" },
              { id: "b", label: "جذب الهيدروجين للإلكترونات أكثر من الأكسجين" },
              { id: "c", label: "كون الجزيء خطيًا مستقيمًا $180^{\\circ}$" },
            ],
            correctId: "a",
            focusIfMissed: "قطبية الماء والروابط الهيدروجينية",
            feedbackCorrect: "أساس متين! هذه الهندسة المنحنية هي سر الروابط الهيدروجينية.",
            feedbackMissed: "ابدأ في المرحلة ٢ بتفحّص زاوية جزيء الماء $\\mathrm{H_2O}$ والشحنات الجزئية.",
          },
          {
            id: "sci-density-ar",
            prompt: "عند أي درجة حرارة تقريبًا يبلغ الماء السائل أقصى كثافة له؟",
            options: [
              { id: "a", label: "$0^{\\circ}\\text{C}$" },
              { id: "b", label: "$4^{\\circ}\\text{C}$" },
              { id: "c", label: "$25^{\\circ}\\text{C}$" },
            ],
            correctId: "b",
            focusIfMissed: "شذوذ كثافة الماء وحماية الأحياء المائية",
            feedbackCorrect: "دقيق! سترى الآن أثر ذلك على طفو الجليد وحياة البحيرات.",
            feedbackMissed: "حرّك شريط الحرارة بين $-5^{\\circ}\\text{C}$ و$25^{\\circ}\\text{C}$ في مختبر الكثافة بالمرحلة ٢.",
          },
        ];
  }

  if (key.includes("arabic") || key.includes("عرب")) {
    return [
      {
        id: "ar-dual",
        prompt: "بماذا يُرفع الاسم المثنى مثل «الطالبانِ» في الجملة الاسمية؟",
        options: [
          { id: "a", label: "بالضمة الظاهرة" },
          { id: "b", label: "بالألف نيابةً عن الضمة" },
          { id: "c", label: "بالواو" },
        ],
        correctId: "b",
        focusIfMissed: "علامات الإعراب الفرعية للمثنى",
        feedbackCorrect: "ممتاز! تفكيك الكلمات في المرحلة ٢ سيرسّخ علامات الإعراب.",
        feedbackMissed: "جرّب الضغط على «المهندسانِ» في مختبر الإعراب بالمرحلة ٢.",
      },
      {
        id: "ar-inna",
        prompt: "ماذا تفعل «إنَّ» عند دخولها على الجملة الاسمية؟",
        options: [
          { id: "a", label: "تنصب المبتدأ وترفع الخبر" },
          { id: "b", label: "ترفع المبتدأ وتنصب الخبر" },
          { id: "c", label: "تجزم الفعلين" },
        ],
        correctId: "a",
        focusIfMissed: "الفرق بين كان وأخواتها وإنَّ وأخواتها",
        feedbackCorrect: "دقيق! إنَّ عكس عمل كان وأخواتها تمامًا.",
        feedbackMissed: "قارن جملة «إنَّ الصدقَ» و«كان الجوُّ» في مختبر النواسخ بالمرحلة ٢.",
      },
    ];
  }

  if (key.includes("history") || key.includes("تاريخ")) {
    return contentLocale === "en"
      ? [
          {
            id: "hist-prim",
            prompt: "Which qualifies as a Primary Historical Source?",
            options: [
              { id: "a", label: "A royal stone inscription carved during that era" },
              { id: "b", label: "A modern documentary filmed in 2024" },
              { id: "c", label: "An introductory university textbook" },
            ],
            correctId: "a",
            focusIfMissed: "Primary vs Secondary Rubric",
            feedbackCorrect: "Ready! Next test how even primary records carry bias.",
            feedbackMissed: "Use the Source Reliability Rubric in Stage 2 to compare original artefacts vs later studies.",
          },
          {
            id: "hist-bias",
            prompt: "If an inscription is physically authentic and contemporary, can historians accept its claims at face value?",
            options: [
              { id: "a", label: "Yes, every primary source is completely objective" },
              { id: "b", label: "No, propaganda bias & cross-checking are still required" },
              { id: "c", label: "Only if carved in granite" },
            ],
            correctId: "b",
            focusIfMissed: "Critical Cross-Checking",
            feedbackCorrect: "Sharp critical thinking! Authenticity != neutrality.",
            feedbackMissed: "Inspect the Royal Victory Stela preset inside Stage 2's Source Rubric.",
          },
        ]
      : [
          {
            id: "hist-prim-ar",
            prompt: "أي مما يلي يُعد مصدرًا أوليًا لدراسة الحضارة؟",
            options: [
              { id: "a", label: "نقش أثري معاصر للحدث التاريخي" },
              { id: "b", label: "كتاب جامعي حديث أُلّف العام الماضي" },
              { id: "c", label: "مقالة تلخيصية على الإنترنت" },
            ],
            correctId: "a",
            focusIfMissed: "التمييز بين المصادر الأولية والثانوية",
            feedbackCorrect: "ممتاز! لننتقل الآن إلى معايير نقد المصدر وفحص تحيّزه.",
            feedbackMissed: "راجع في المرحلة ٢ ميزان تقييم المصادر للتمييز بين الشاهد المعاصر والبحث اللاحق.",
          },
          {
            id: "hist-bias-ar",
            prompt: "إذا ثبتت أصالة النقش التاريخي ماديًا، فهل نقبل كل ادعاءاته حرفيًا؟",
            options: [
              { id: "a", label: "نعم لأن المصدر الأولي محايد دائمًا" },
              { id: "b", label: "لا؛ يجب فحص غرضه وتحيزه ومقارنته بمصادر مستقلة" },
              { id: "c", label: "نقبل كل ما نُقش على الحجر دون تدقيق" },
            ],
            correctId: "b",
            focusIfMissed: "نقد التحيز والمقارنة بمصادر مستقلة",
            feedbackCorrect: "تفكير تاريخي نقدي سليم! الأصالة المادية لا تمنع المبالغة الدعائية.",
            feedbackMissed: "جرّب نموذج «لوحة نصر ملكية» في مختبر التاريخ بالمرحلة ٢.",
          },
        ];
  }

  if (key.includes("philosophy") || key.includes("فلسف")) {
    return contentLocale === "en"
      ? [
          {
            id: "phil-val",
            prompt: "Can a deductive syllogism have a valid logical structure even when one premise is factually false?",
            options: [
              { id: "a", label: "Yes — formal validity checks logical connection, not lab facts" },
              { id: "b", label: "No — false facts always destroy deductive form" },
              { id: "c", label: "Logic automatically tests chemistry in real time" },
            ],
            correctId: "a",
            focusIfMissed: "Formal Validity vs Empirical Soundness",
            feedbackCorrect: "Crucial distinction mastered! Explore live test cases in Stage 2.",
            feedbackMissed: "Run the 'Gold floats on water' case inside Stage 2's Syllogism Lab.",
          },
          {
            id: "phil-style",
            prompt: "Which thinking style searches for ultimate, universal meaning rather than immediate physical causes?",
            options: [
              { id: "a", label: "Philosophical thinking" },
              { id: "b", label: "Mythical thinking" },
              { id: "c", label: "Measurement instrumentation" },
            ],
            correctId: "a",
            focusIfMissed: "Human Thinking Styles",
            feedbackCorrect: "Ready! Contrast all styles clearly in Stage 2.",
            feedbackMissed: "Inspect the Thinking Styles scenarios in Stage 2.",
          },
        ]
      : [
          {
            id: "phil-val-ar",
            prompt: "هل يمكن أن يكون القياس المنطقي صحيحًا في صورته رغم كذب إحدى مقدماته واقعيًا؟",
            options: [
              { id: "a", label: "نعم؛ الصحة الصورية تفحص لزوم النتيجة عن المقدمات لا التجربة الواقعية" },
              { id: "b", label: "لا؛ كذب الواقع يفسد الصورة المنطقية دائمًا" },
              { id: "c", label: "المنطق الصوري يغني عن التجارب المعملية" },
            ],
            correctId: "a",
            focusIfMissed: "الفرق بين الصحة الصورية والصدق الواقعي",
            feedbackCorrect: "تمييز فلسفي ومنطقي رفيع! ستتعمّق فيه في مختبر القياس بالمرحلة ٢.",
            feedbackMissed: "اختبر مثال «كل المعادن تطفو على الماء» في مختبر المنطق بالمرحلة ٢.",
          },
          {
            id: "phil-style-ar",
            prompt: "أي أسلوب تفكير يتأمل العلل البعيدة والمبادئ الكلية بدل الاكتفاء بالعلل المادية القريبة؟",
            options: [
              { id: "a", label: "الأسلوب الفلسفي" },
              { id: "b", label: "الأسلوب الخرافي" },
              { id: "c", label: "القياس المخبري فقط" },
            ],
            correctId: "a",
            focusIfMissed: "التمييز بين أساليب التفكير",
            feedbackCorrect: "ممتاز! تابع مقارنة الأساليب في المرحلة ٢.",
            feedbackMissed: "راجع أمثلة الأساليب في بطاقات ومختبر المرحلة ٢.",
          },
        ];
  }

  // English default readiness
  return [
    {
      id: "en-while",
      prompt: "Which tense describes the longer background action interrupted by a short Past Simple event?",
      options: [
        { id: "a", label: "Past Continuous (was / were + V-ing)" },
        { id: "b", label: "Present Simple" },
        { id: "c", label: "Future Simple" },
      ],
      correctId: "a",
      focusIfMissed: "Background vs Interrupting Past Actions",
      feedbackCorrect: "Spot on! Practice live transforms inside Stage 2.",
      feedbackMissed: "Start Stage 2 with Drill 1 in the English Sentence Transform lab.",
    },
    {
      id: "en-mustnt",
      prompt: "Which phrase expresses strict prohibition ('forbidden') rather than lack of necessity?",
      options: [
        { id: "a", label: "don't have to" },
        { id: "b", label: "mustn't" },
        { id: "c", label: "might not" },
      ],
      correctId: "b",
      focusIfMissed: "Prohibition vs Optionality Modals",
      feedbackCorrect: "Clear distinction! Don't have to = optional; mustn't = forbidden.",
      feedbackMissed: "Inspect the modal prohibition drill in Stage 2 to avoid the common 'don't have to' trap.",
    },
  ];
}
