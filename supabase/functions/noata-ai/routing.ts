export type ResponseLanguage = "ar" | "en";

export type AutoDifficulty = "foundational" | "standard" | "advanced";

export type SubjectHint =
  | "integrated-science"
  | "mathematics"
  | "arabic-language"
  | "english"
  | "history"
  | "philosophy-logic"
  | "islamic"
  | "general";

export type PedagogicalMode =
  | "vision"
  | "islamic"
  | "interactive"
  | "deep_proof"
  | "step_by_step"
  | "concept_explain"
  | "quick_reply";

export type AutoRouteResult = {
  model: string;
  reason: string;
  difficulty: AutoDifficulty;
  subjectHint: SubjectHint;
  pedagogicalMode: PedagogicalMode;
};

const ISLAMIC_PATTERN =
  /\b(quran|hadith|islam|fatwa|salah|ramadan|tafsir)\b|(?:قرآن|قران|إسلام|اسلام|فتوى|تفسير آية|تفسير سورة|حديث نبوي|صحة الحديث|رمضان)/i;

const SUBJECT_MATCHERS: ReadonlyArray<readonly [SubjectHint, RegExp]> = [
  ["islamic", ISLAMIC_PATTERN],
  [
    "mathematics",
    /\b(discriminant|quadratic|vieta|imaginary|complex number|polynomial|inequality|radian|trigonometry|matrix|determinant|equation|algebra|geometry|roots?)\b|(?:مميز المعادلة|مميز|تربيعي|جذر|تخيلي|مركب|معادلة|متباينة|جبر|مثلثات|هندسة|دالة|فيتا|معامل|س²|س\^2)/i,
  ],
  [
    "integrated-science",
    /\b(hydrosphere|ph\b|osmosis|specific heat|density anomaly|water density|max density|water cycle|polarity|hydrogen bond|aqueous|salinity|dissolved oxygen|enzyme|photosynthesis|respiration|cells?|atoms?|acids?|bases?|physics|chemistry|biology)\b|4\s*°?\s*c\b|(?:العلوم المتكاملة|علوم متكاملة|غلاف مائي|الغلاف المائي|الأس الهيدروجيني|اس هيدروجيني|أسموزية|اسموزية|حرارة نوعية|كثافة الماء|شذوذ الكثافة|ملوحة|أكسجين ذائب|رابطة هيدروجينية|قطبية الماء|محلول مائي|فيزياء|كيمياء|أحياء|انزيم|إنزيم|خلية)/i,
  ],
  [
    "philosophy-logic",
    /\b(philosophy|philosophical|logic|syllogism|proposition|premise|conclusion|critical thinking|creative thinking|scientific thinking|inference|fallacy|ethics|square of opposition)\b|(?:فلسفة|فلسفي|منطق|قياس منطقي|قضية منطقية|قضايا منطقية|قضايا كلية|قضايا جزئية|كلية موجبة|كلية سالبة|جزئية موجبة|جزئية سالبة|مربع أرسطو|حد منطقي|حدود منطقية|تفكير ناقد|تفكير إبداعي|تفكير علمي|استدلال|مغالطة|أخلاق|موقف فلسفي|أساليب التفكير)/i,
  ],
  [
    "arabic-language",
    /\b(nahw|balagha|adab|hatim|antara|pre-islamic|poetry|nominal sentence|verbal sentence|tashbih|metaphor)\b|(?:لغة عربية|عربي|نحو|بلاغة|أدب|قراءة|نصوص|حاتم الطائي|عنترة|مبتدأ|خبر|فاعل|مفعول|فعل ماض|فعل مضارع|معرب|مبني|تشبيه|استعارة|كناية|جملة اسمية|جملة فعلية|اعرب|أعرب)/i,
  ],
  [
    "english",
    /\b(grammar|past simple|past continuous|modals?|conditionals?|gerunds?|infinitives?|quantifiers?|vocabulary|tense|passive voice|unit [1-5])\b|(?:إنجليزي|انجليزي|انجلش|قواعد الإنجليزية|ماضي بسيط|ماضي مستمر|شرطية|أفعال ناقصة)/i,
  ],
  [
    "history",
    /\b(civilization|ancient egypt|pharaoh|ostraca|primary source|secondary source|historical era|herodotus|will durant|old kingdom|middle kingdom|new kingdom)\b|(?:تاريخ|حضارة|مصادر أولية|مصادر ثانوية|أوستراكا|اوستراكا|استراكا|عصور تاريخية|فرعوني|فرعون|النيل|ديورانت|هيرودوت|دولة قديمة|دولة وسطى|دولة حديثة|حجر رشيد|حجر باليرمو|صلاية نعرمر|معابد)/i,
  ],
];

const DEEP_REASONING_PATTERN =
  /\b(prove|proof|derive|debug|algorithm|synthesize|evaluate|critique|multi[- ]step|olympiad)\b|\b(complex|advanced)\b.*\b(math|equation|problem|reasoning|analysis|code)\b|(?:برهن|اثبت|أثبت|اشتق|حلل بعمق|مسألة صعبة|تفكير عميق|خوارزمية|قارن واستنتج|استنتج العلاقة|تطبيقات مركبة|أولمبياد|مسألة مركبة|بخطوات متعددة مع التحقق)/i;

const STEP_BY_STEP_PATTERN =
  /\b(solve|calculate|derive|equation|prove|factor|step[- ]by[- ]step)\b|(?:احسب|معادلة|حلل|مسألة|أوجد|اوجد|برهن|اثبت|أثبت|خطوة بخطوة)|(^|\s)حل(?=\s|$)/i;

const GREETING_AR_PATTERN =
  /^(?:أهلا|اهلا|مرحبا|مرحبًا|أهلاً|السلام عليكم|شكرا|شكرًا|تمام)[!،.\s]*$/;

/** Detect the dominant script language of the user's leading prompt. */
export function requestLanguage(text: string, fallback: ResponseLanguage = "ar"): ResponseLanguage {
  // The leading request is authoritative; attached excerpts may use another language.
  const leading = text.trim().split(/\n/)[0].slice(0, 500);
  const ar = (leading.match(/[\u0621-\u064a]/g) ?? []).length;
  const en = (leading.match(/[a-z]/gi) ?? []).length;
  return ar || en ? (ar > en ? "ar" : "en") : fallback;
}

/** Detect which Sec. 1 Term 1 subject or domain the prompt targets. */
export function detectSubjectHint(text: string): SubjectHint {
  const q = text.trim();
  for (const [subject, pattern] of SUBJECT_MATCHERS) {
    if (pattern.test(q)) return subject;
  }
  return "general";
}

/** Classify question cognitive difficulty from cues, compound structure, and problem depth. */
export function assessDifficulty(text: string, hasImage = false): AutoDifficulty {
  const q = text.trim();
  if (DEEP_REASONING_PATTERN.test(q)) return "advanced";

  const clauseCount = q.split(/[?\u061f\n]/).filter((part) => part.trim().length > 0).length;
  const hasFormulaCue = /=|\^|²|Δ|\d+\s*[+\-*/]\s*\d+/.test(q);
  if (q.length > 220 && (clauseCount >= 3 || (clauseCount >= 2 && hasFormulaCue))) {
    return "advanced";
  }

  if (
    hasImage ||
    (!GREETING_AR_PATTERN.test(q) &&
      (q.length >= 45 ||
        STEP_BY_STEP_PATTERN.test(q) ||
        /\b(why|compare|explain|analyze|quiz|flashcards?|interactive|timeline|summarize|difference)\b|(?:لماذا|ليه|علل|بم تفسر|ما النتائج|اشرح|قارن|تفاعلي|بطاقات|اختبار)/i.test(
          q,
        )))
  ) {
    return "standard";
  }

  return "foundational";
}

/** Route any request in Smart Auto mode by image presence, subject, pedagogical mode, and difficulty. */
export function resolveAutoRoute(text: string, hasImage = false): AutoRouteResult {
  const q = text.trim().toLowerCase();
  const subjectHint = detectSubjectHint(q);
  const difficulty = assessDifficulty(text, hasImage);

  if (hasImage) {
    return {
      model: "Fanar-Oryx-IVU-2",
      reason: "vision",
      difficulty,
      subjectHint,
      pedagogicalMode: "vision",
    };
  }

  if (ISLAMIC_PATTERN.test(q)) {
    return {
      model: "Fanar-Sadiq",
      reason: "islamic",
      difficulty,
      subjectHint: "islamic",
      pedagogicalMode: "islamic",
    };
  }

  // Native component requests need reliable schema following, not a reasoning transcript.
  if (
    /\b(interactive|flashcards?|quiz|timeline|discriminant|quadratic)\b|\u062a\u0641\u0627\u0639\u0644\u064a|\u0628\u0637\u0627\u0642\u0627\u062a \u0645\u0631\u0627\u062c\u0639\u0629|\u062e\u0637 \u0632\u0645\u0646\u064a|\u0645\u0645\u064a\u0632 \u0627\u0644\u0645\u0639\u0627\u062f\u0644\u0629/i.test(
      q,
    )
  ) {
    return {
      model: "Fanar",
      reason: "structured_learning",
      difficulty,
      subjectHint,
      pedagogicalMode: "interactive",
    };
  }

  // Length and requests for more detail do not imply complex reasoning.
  if (difficulty === "advanced") {
    return {
      model: "Fanar-C-2-27B",
      reason: "deep",
      difficulty,
      subjectHint,
      pedagogicalMode: "deep_proof",
    };
  }

  // Requested depth and source verification need instruction-following structure.
  if (
    /\b(long|detailed|comprehensive|in.depth|essay|report|talk\s+along|research|verify|citations?|search)\b|بالتفصيل|شرح طويل|مطوّل|شامل|ابحث|تحقق من/i.test(
      q,
    )
  ) {
    return {
      model: "Fanar-C-1-8.7B",
      reason: "structured_depth",
      difficulty,
      subjectHint,
      pedagogicalMode: "concept_explain",
    };
  }

  if (
    /\b(why|solve|calculate|equation|geometry|physics|logic|compare|explain|analyze|code)\b/i.test(q) ||
    /(لماذا|ليه|احسب|معادلة|هندسة|فيزياء|منطق|اشرح|قارن|حلّل|حلل|برمجة|علل|بم تفسر|ما النتائج|استخرج|فلسفة|نحو|أسموزية|كثافة)/.test(
      q,
    ) ||
    /(^|\s)حل(?=\s|$)/.test(q)
  ) {
    return {
      model: "Fanar-C-1-8.7B",
      reason: "reasoning",
      difficulty,
      subjectHint,
      pedagogicalMode: STEP_BY_STEP_PATTERN.test(q) ? "step_by_step" : "concept_explain",
    };
  }

  // Staging tests found S-1 returning Arabic for English greetings. Keep English
  // requests on the general bilingual route rather than selecting by length alone.
  if (requestLanguage(q) === "en") {
    return {
      model: "Fanar",
      reason: "english",
      difficulty,
      subjectHint,
      pedagogicalMode: /^(?:hi|hello|hey|thanks|ok)[!.,\s]*$/i.test(q) ? "quick_reply" : "concept_explain",
    };
  }

  if (GREETING_AR_PATTERN.test(q)) {
    return {
      model: "Fanar-S-1-7B",
      reason: "greeting",
      difficulty: "foundational",
      subjectHint: "general",
      pedagogicalMode: "quick_reply",
    };
  }

  return {
    model: "Fanar",
    reason: "general",
    difficulty,
    subjectHint,
    pedagogicalMode: "concept_explain",
  };
}
