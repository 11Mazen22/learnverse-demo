/**
 * The canonical Noata curriculum catalog.
 *
 * Six subject families, eight selectable tracks. Integrated Science and
 * Mathematics each expose an Arabic-medium and an English-medium track; History,
 * Arabic Language, English and Philosophy & Logic stay single, consistent subjects.
 *
 * The database (public.subjects / public.curriculum_tracks) is the source of truth
 * for published content; this module is the single place where the product decides
 * *which* subjects and tracks exist, how they are labelled, and which of them are
 * dual-language. Nothing else in the app should hardcode a subject list.
 */

export type SubjectKey =
  | "integrated-science"
  | "mathematics"
  | "history"
  | "arabic-language"
  | "english"
  | "philosophy-logic";

export type ContentLanguage = "ar" | "en";

export type SubjectDefinition = {
  key: SubjectKey;
  slug: SubjectKey;
  titleAr: string;
  titleEn: string;
  shortTitleAr: string;
  shortTitleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  accent: "cyan" | "indigo" | "amber" | "rose" | "teal" | "violet";
  /** Science and Mathematics teach the same curriculum in two languages. */
  dualLanguage: boolean;
  /** The language the single-language subject is taught in. */
  contentLanguage: ContentLanguage;
};

export type TrackDefinition = {
  slug: string;
  subject: SubjectKey;
  contentLanguage: ContentLanguage;
  titleAr: string;
  titleEn: string;
  /** True when the track renders an English version of an Arabic source. */
  translation: boolean;
};

export const SUBJECT_CATALOG: readonly SubjectDefinition[] = [
  {
    key: "integrated-science",
    slug: "integrated-science",
    titleAr: "العلوم المتكاملة",
    titleEn: "Integrated Science",
    shortTitleAr: "علوم",
    shortTitleEn: "Science",
    descriptionAr:
      "الغلاف المائي على الأرض، الخصائص الكيميائية والفيزيائية للماء، المحاليل المائية، والأهمية الحيوية للماء.",
    descriptionEn:
      "The hydrosphere on Earth, the chemical and physical properties of water, aqueous solutions, and the biological importance of water.",
    accent: "cyan",
    dualLanguage: true,
    contentLanguage: "ar",
  },
  {
    key: "mathematics",
    slug: "mathematics",
    titleAr: "الرياضيات",
    titleEn: "Mathematics",
    shortTitleAr: "رياضيات",
    shortTitleEn: "Mathematics",
    descriptionAr:
      "مدخل إلى الأعداد المركبة، تحديد نوع جذور المعادلة التربيعية، العلاقة بين الجذرين والمعاملات، إشارة الدالة التربيعية، والمتباينات التربيعية.",
    descriptionEn:
      "Introduction to complex numbers, the nature of quadratic roots, relations between roots and coefficients, the sign of a quadratic function, and quadratic inequalities.",
    accent: "indigo",
    dualLanguage: true,
    contentLanguage: "ar",
  },
  {
    key: "history",
    slug: "history",
    titleAr: "تاريخ",
    titleEn: "History",
    shortTitleAr: "تاريخ",
    shortTitleEn: "History",
    descriptionAr:
      "مصر الحضارة والعالم القديم: مفهوم الحضارة والتاريخ، انتقال مراكز الحضارة، وتطور الحضارات.",
    descriptionEn:
      "Egypt, civilisation and the ancient world: the concepts of civilisation and history, the shifting centres of civilisation, and the development of civilisations.",
    accent: "amber",
    dualLanguage: false,
    contentLanguage: "ar",
  },
  {
    key: "arabic-language",
    slug: "arabic-language",
    titleAr: "اللغة العربية",
    titleEn: "Arabic Language",
    shortTitleAr: "لغة عربية",
    shortTitleEn: "Arabic",
    descriptionAr:
      "أول خمسة نصوص قرائية وأدبية، وأول خمسة دروس من قواعد النحو والصرف، ثم ملخص دراسي لأجزاء قصة «أبو الفوارس: عنترة بن شداد» الأربعة.",
    descriptionEn:
      "The first five reading and literature texts, the first five grammar and morphology lessons, then a study summary of the four parts of the story Abu al-Fawaris: Antara ibn Shaddad.",
    accent: "rose",
    dualLanguage: false,
    contentLanguage: "ar",
  },
  {
    key: "english",
    slug: "english",
    titleAr: "اللغة الإنجليزية",
    titleEn: "English",
    shortTitleAr: "إنجليزي",
    shortTitleEn: "English",
    descriptionAr:
      "خمس وحدات: EGYPT’S HERITAGE، HANDS HELP, HEARTS CARE، TRUTH VS. LIES، SAVE AND SHINE، USING TECHNOLOGY AT SCHOOLS.",
    descriptionEn:
      "Five units: EGYPT’S HERITAGE, HANDS HELP, HEARTS CARE, TRUTH VS. LIES, SAVE AND SHINE, USING TECHNOLOGY AT SCHOOLS.",
    accent: "teal",
    dualLanguage: false,
    contentLanguage: "en",
  },
  {
    key: "philosophy-logic",
    slug: "philosophy-logic",
    titleAr: "الفلسفة والمنطق",
    titleEn: "Philosophy & Logic",
    shortTitleAr: "فلسفة",
    shortTitleEn: "Philosophy",
    descriptionAr:
      "التفكير الإنساني وأساليبه، الفلسفة والموقف الفلسفي، مبادئ المنطق، والاستدلال — أربعة دروس رسمية ثم مراجعة إضافية.",
    descriptionEn:
      "Human thinking and its styles, philosophy and the philosophical stance, principles of logic, and inference — four official lessons plus one additional review module.",
    accent: "violet",
    dualLanguage: false,
    contentLanguage: "ar",
  },
];

export const TRACK_CATALOG: readonly TrackDefinition[] = [
  {
    slug: "integrated-science-ar",
    subject: "integrated-science",
    contentLanguage: "ar",
    titleAr: "علوم متكاملة — المسار العربي",
    titleEn: "Integrated Science — Arabic track",
    translation: false,
  },
  {
    slug: "integrated-science-en",
    subject: "integrated-science",
    contentLanguage: "en",
    titleAr: "علوم متكاملة — المسار الإنجليزي",
    titleEn: "Integrated Science — English track",
    translation: true,
  },
  {
    slug: "mathematics-ar",
    subject: "mathematics",
    contentLanguage: "ar",
    titleAr: "الرياضيات — المسار العربي",
    titleEn: "Mathematics — Arabic track",
    translation: false,
  },
  {
    slug: "mathematics-en",
    subject: "mathematics",
    contentLanguage: "en",
    titleAr: "الرياضيات — المسار الإنجليزي",
    titleEn: "Mathematics — English track",
    translation: true,
  },
  {
    slug: "history-ar",
    subject: "history",
    contentLanguage: "ar",
    titleAr: "تاريخ",
    titleEn: "History",
    translation: false,
  },
  {
    slug: "arabic-language-ar",
    subject: "arabic-language",
    contentLanguage: "ar",
    titleAr: "اللغة العربية",
    titleEn: "Arabic Language",
    translation: false,
  },
  {
    slug: "english-en",
    subject: "english",
    contentLanguage: "en",
    titleAr: "اللغة الإنجليزية",
    titleEn: "English",
    translation: false,
  },
  {
    slug: "philosophy-logic-ar",
    subject: "philosophy-logic",
    contentLanguage: "ar",
    titleAr: "الفلسفة والمنطق",
    titleEn: "Philosophy & Logic",
    translation: false,
  },
];

const SUBJECT_INDEX = new Map(SUBJECT_CATALOG.map((subject) => [subject.key, subject]));
const TRACK_INDEX = new Map(TRACK_CATALOG.map((track) => [track.slug, track]));

export function subjectDefinition(key: string): SubjectDefinition | null {
  return SUBJECT_INDEX.get(key as SubjectKey) ?? null;
}

export function trackDefinition(slug: string): TrackDefinition | null {
  return TRACK_INDEX.get(slug) ?? null;
}

export function tracksForSubject(key: string): TrackDefinition[] {
  return TRACK_CATALOG.filter((track) => track.subject === key);
}

/** The track a learner lands on when no explicit selection exists. */
export function defaultTrackForSubject(key: string): TrackDefinition | null {
  const subject = subjectDefinition(key);
  if (!subject) return null;
  const tracks = tracksForSubject(key);
  if (!tracks.length) return null;
  return tracks.find((track) => track.contentLanguage === subject.contentLanguage) ?? tracks[0];
}

export function contentLanguageLabel(language: ContentLanguage, locale: "ar" | "en"): string {
  if (language === "en") {
    return locale === "en" ? "English" : "بالإنجليزية";
  }
  return locale === "en" ? "Arabic" : "بالعربية";
}

export function subjectTitle(key: string, locale: "ar" | "en"): string {
  const subject = subjectDefinition(key);
  if (!subject) return "Noata";
  return locale === "en" ? subject.titleEn : subject.titleAr;
}

export function trackTitle(slug: string, locale: "ar" | "en"): string {
  const track = trackDefinition(slug);
  if (!track) return "Noata";
  return locale === "en" ? track.titleEn : track.titleAr;
}

export type CanonicalUnit = {
  id: string;
  courseId: string;
  position: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  metadata?: Record<string, unknown>;
};

/**
 * @deprecated Historical preview index retained only for migration comparison.
 * It is intentionally incomplete and must never be rendered as published,
 * official, accredited, or substituted when database curriculum reads fail.
 * public.curriculum_tracks -> courses -> units -> lessons is the runtime source.
 */

export type CanonicalLesson = {
  id: string;
  unitId: string;
  position: number;
  slug: string;
  titleAr: string;
  titleEn: string;
  durationMinutes: number;
  xpReward: number;
  coinReward: number;
  summaryAr: string;
  summaryEn: string;
  workedAr?: string;
  workedEn?: string;
};

/** @deprecated Incomplete historical preview only. Never use as a runtime fallback. */
export const CANONICAL_UNITS: readonly CanonicalUnit[] = [
  {
    id: "unit-sci-1",
    courseId: "integrated-science",
    position: 1,
    titleAr: "الوحدة الأولى: الغلاف المائي والبيئة",
    titleEn: "Unit 1: The Hydrosphere & The Environment",
    descriptionAr: "دراسة شاملة للغلاف المائي، خواص الماء الفيزيائية والكيميائية، المحاليل المائية، والأهمية الحيوية للماء.",
    descriptionEn: "Comprehensive study of the hydrosphere, chemical and physical properties of water, aqueous solutions, and biological importance.",
    metadata: { locked: false, subject: "integrated-science" },
  },
  {
    id: "unit-math-1",
    courseId: "mathematics",
    position: 1,
    titleAr: "الوحدة الأولى: الجبر والعلاقات والدوال التربيعية",
    titleEn: "Unit 1: Algebra & Quadratic Relations",
    descriptionAr: "الأعداد المركبة، مميز المعادلة التربيعية، العلاقة بين الجذور والمعاملات، إشارة الدالة، والمتباينات التربيعية.",
    descriptionEn: "Complex numbers, discriminant analysis, root-coefficient relations, sign of quadratic functions, and quadratic inequalities.",
    metadata: { locked: false, subject: "mathematics" },
  },
  {
    id: "unit-hist-1",
    courseId: "history",
    position: 1,
    titleAr: "الوحدة الأولى: مصر الحضارة والعالم القديم",
    titleEn: "Unit 1: Egypt, Civilization & The Ancient World",
    descriptionAr: "الحضارة والتاريخ، مصادر دراسة الحضارات، وعوامل قيام الحضارات الإنسانية في العالم القديم.",
    descriptionEn: "Civilization and history, primary and secondary sources, and foundational factors of ancient civilisations.",
    metadata: { locked: false, subject: "history" },
  },
  {
    id: "unit-arab-1",
    courseId: "arabic-language",
    position: 1,
    titleAr: "الوحدة الأولى: النصوص القرائية والأدبية وقواعد النحو",
    titleEn: "Unit 1: Literature, Reading & Arabic Grammar",
    descriptionAr: "النصوص الأدبية المختارة، أقسام الكلمة والإعراب والبناء، والمرفوعات، مع دراسة قصة عنترة بن شداد.",
    descriptionEn: "Selected literature, grammatical parts of speech, inflection vs. invariance, nominative rules, and Antara's narrative.",
    metadata: { locked: false, subject: "arabic-language" },
  },
  {
    id: "unit-eng-1",
    courseId: "english",
    position: 1,
    titleAr: "الوحدة الأولى: تراث مصر ومهارات اللغة الإنجليزية",
    titleEn: "Unit 1: Egypt's Heritage & Language Skills",
    descriptionAr: "الأزمنة الماضية البسيطة والمستمرة، أفعال النصيحة والإلزام، ومفردات التراث والبيئة والتطوع.",
    descriptionEn: "Past simple and continuous tenses, modals of advice and obligation, living heritage vocabulary, and structured writing.",
    metadata: { locked: false, subject: "english" },
  },
  {
    id: "unit-phil-1",
    courseId: "philosophy-logic",
    position: 1,
    titleAr: "الوحدة الأولى: مبادئ التفكير الفلسفي والمنطقي",
    titleEn: "Unit 1: Principles of Philosophical & Logical Thought",
    descriptionAr: "التفكير الإنساني وأساليبه، الموقف الفلسفي وخصائصه، ومبادئ المنطق الصوري والاستدلال.",
    descriptionEn: "Human thinking styles and critical methods, philosophical stance and enquiry, terms, propositions, and inference.",
    metadata: { locked: false, subject: "philosophy-logic" },
  },
];

/** @deprecated Incomplete historical preview only. Never use as a runtime fallback. */
export const CANONICAL_LESSONS: readonly CanonicalLesson[] = [
  // Integrated Science (Available in both AR and EN tracks)
  {
    id: "sci-hydrosphere",
    unitId: "unit-sci-1",
    position: 1,
    slug: "sci-hydrosphere",
    titleAr: "الغلاف المائي على الأرض ودورة الماء",
    titleEn: "The Hydrosphere on Earth & The Water Cycle",
    durationMinutes: 10,
    xpReward: 15,
    coinReward: 25,
    summaryAr: "أغلفة الأرض الأربعة الكبرى وتفاعلها المستمر، توزيع الماء العذب والمالح، ومراحل دورة الماء من التبخر والنتح حتى التكاثف والهطول والتسرب الجوفي.",
    summaryEn: "Earth's four interconnected spheres (atmosphere, hydrosphere, lithosphere, biosphere), freshwater vs. saltwater distribution, and solar-driven water cycle processes.",
    workedAr: "تتبع جزيء ماء من التبخر من سطح المحيط حتى تكاثفه في سحب وهطوله وجريانه عبر الأنهار.",
    workedEn: "Tracing a water molecule from oceanic evaporation through cloud condensation, precipitation, and fluvial recharge.",
  },
  {
    id: "sci-water-chemistry",
    unitId: "unit-sci-1",
    position: 2,
    slug: "sci-water-chemistry",
    titleAr: "الخصائص الكيميائية للماء والروابط الهيدروجينية",
    titleEn: "Chemical Properties of Water & Hydrogen Bonding",
    durationMinutes: 10,
    xpReward: 15,
    coinReward: 25,
    summaryAr: "التركيب الجزيئي H2O والزاوية 104.5°، قطبية الرابطة وتوزيع الشحنة، شبكة الروابط الهيدروجينية، وإذابة المركبات القطبية والأيونية، ومفهوم الرقم الهيدروجيني pH.",
    summaryEn: "Molecular geometry of H2O (104.5° angle), bond polarity and charge distribution, hydrogen bonding dynamics, solute hydration, and the pH scale.",
    workedAr: "تصنيف محاليل مختلفة إلى حمضية ومتعادلة وقاعدية بحسب قيم pH ومقارنة سلوك إذابة كلوريد الصوديوم.",
    workedEn: "Classifying aqueous solutions across the pH spectrum and analyzing ionic lattice dissociation in NaCl.",
  },
  {
    id: "sci-water-physics",
    unitId: "unit-sci-1",
    position: 3,
    slug: "sci-water-physics",
    titleAr: "الخصائص الفيزيائية للماء: الكثافة والحرارة النوعية",
    titleEn: "Physical Properties of Water: Density & Specific Heat",
    durationMinutes: 10,
    xpReward: 15,
    coinReward: 25,
    summaryAr: "شذوذ كثافة الماء عند 4°C ودوره الحيوي في حماية الحياة البحرية في المناطق المتجمدة، والسعة الحرارية النوعية العالية وتطبيقات معادلة Q = mcΔT.",
    summaryEn: "Density anomaly of liquid water at 4°C preserving aquatic habitats under ice, high specific heat capacity, and thermal energy equations (Q = mcΔT).",
    workedAr: "حساب كمية الحرارة الممتصة لرفع حرارة كتلة محددة من الماء مقارنة بمواد أخرى ذات سعة حرارية أقل.",
    workedEn: "Calculating thermal transfer required to heat a water reservoir compared against low heat-capacity substances.",
  },
  {
    id: "sci-solutions-biology",
    unitId: "unit-sci-1",
    position: 4,
    slug: "sci-solutions-biology",
    titleAr: "المحاليل المائية والأهمية الحيوية للماء",
    titleEn: "Aqueous Solutions & The Biological Importance of Water",
    durationMinutes: 10,
    xpReward: 15,
    coinReward: 25,
    summaryAr: "المذيب والمذاب وتركيز المحاليل، الخاصية الأسموزية عبر الأغشية شبه المنفذة، والماء كوسيط للتفاعلات الحيوية وتنظيم حرارة الأجسام الحية.",
    summaryEn: "Solvent-solute equilibrium, molar concentration, osmotic potential across semi-permeable membranes, and water's metabolic regulatory functions.",
    workedAr: "دراسة حركة الماء عبر غشاء الخلية النباتية في المحاليل متباينة التركيز وتأثير ذلك على الضغط الامتلائي.",
    workedEn: "Investigating water flux across plant cellular membranes under varying osmotic pressures.",
  },
  {
    id: "sci-water-review",
    unitId: "unit-sci-1",
    position: 5,
    slug: "sci-water-review",
    titleAr: "مراجعة تكاملية وتطبيقات بيئية وحياتية",
    titleEn: "Integrative Review, Environmental Applications & Synthesis",
    durationMinutes: 12,
    xpReward: 20,
    coinReward: 35,
    summaryAr: "تكامل المفاهيم الكيميائية والفيزيائية والحيوية للماء، الأمن المائي وإدارة الموارد المائية، وتحليل المشكلات التطبيقية الحديثة.",
    summaryEn: "Cross-disciplinary synthesis of physical, chemical, and biological water principles, conservation strategies, and real-world diagnostics.",
    workedAr: "تحليل عينة مياه بيئية واستنتاج الخصائص المناسبة للاستخدامات الزراعية والصناعية والشرب.",
    workedEn: "Synthesizing test parameters from water quality assays to prescribe municipal treatment protocols.",
  },

  // Mathematics (Available in both AR and EN tracks)
  {
    id: "math-complex-intro",
    unitId: "unit-math-1",
    position: 1,
    slug: "math-complex-intro",
    titleAr: "مدخل إلى الأعداد المركبة والوحدة التخيلية i",
    titleEn: "Introduction to Complex Numbers & Imaginary Unit i",
    durationMinutes: 10,
    xpReward: 15,
    coinReward: 25,
    summaryAr: "تعريف الوحدة التخيلية i بحيث i² = -1، الدورة الرباعية لقوى i، الصورة القياسية a + bi، وتساوي عددين مركبين، والعمليات الحسابية ومرافق العدد المركب.",
    summaryEn: "Definition of imaginary unit i (i² = -1), cyclic powers of i, standard representation z = a + bi, equality conditions, arithmetic operations, and complex conjugation.",
    workedAr: "قسمة عددين مركبين بضرب البسط والمقام في مرافق المقام: تبسيط (1 + i)/(1 - i) = i.",
    workedEn: "Evaluating complex quotients via conjugate multiplication: simplifying (1 + i)/(1 - i) to yield i.",
  },
  {
    id: "math-nature-of-roots",
    unitId: "unit-math-1",
    position: 2,
    slug: "math-nature-of-roots",
    titleAr: "تحديد نوع جذور المعادلة التربيعية باستخدام المميز",
    titleEn: "Determining Nature of Quadratic Roots via Discriminant",
    durationMinutes: 10,
    xpReward: 15,
    coinReward: 25,
    summaryAr: "صيغة المميز Δ = b² - 4ac وعلاقته بنوع الجذور: جذران حقيقيان مختلفان (Δ > 0)، جذران حقيقيان متساويان (Δ = 0)، أو جذران مركبين مترافقين (Δ < 0)، والمدلول البياني.",
    summaryEn: "Discriminant formula Δ = b² - 4ac and root morphology: two real distinct roots (Δ > 0), repeated equal real root (Δ = 0), or conjugate non-real complex roots (Δ < 0).",
    workedAr: "إيجاد قيمة الثابت k التي تجعل جذري المعادلة x² + kx + 9 = 0 متساويين (k = ±6).",
    workedEn: "Determining parameter k ensuring quadratic equation x² + kx + 9 = 0 possesses repeated roots (k = ±6).",
  },
  {
    id: "math-roots-coefficients",
    unitId: "unit-math-1",
    position: 3,
    slug: "math-roots-coefficients",
    titleAr: "العلاقة بين جذري المعادلة التربيعية ومعاملاتها",
    titleEn: "Relations Between Roots & Coefficients (Vieta's Formulas)",
    durationMinutes: 10,
    xpReward: 15,
    coinReward: 25,
    summaryAr: "صيغ فييتا: مجموع الجذرين α + β = -b/a وحاصل ضربهما αβ = c/a، وإعادة تكوين المعادلة التربيعية x² - Sx + P = 0، وحساب العبارات الجبرية المتماثلة.",
    summaryEn: "Vieta's identities: root sum α + β = -b/a, product αβ = c/a, reconstructing quadratics via x² - Sx + P = 0, and evaluating symmetric rational expressions.",
    workedAr: "تكوين معادلة تربيعية بمعلومية مجموع جذريها -2 وحاصل ضربهما -8: x² + 2x - 8 = 0.",
    workedEn: "Constructing quadratic polynomial from root sum -2 and product -8: x² + 2x - 8 = 0.",
  },
  {
    id: "math-sign-of-quadratic",
    unitId: "unit-math-1",
    position: 4,
    slug: "math-sign-of-quadratic",
    titleAr: "إشارة الدالة التربيعية ودراسة فتراتها بيانيًا",
    titleEn: "Sign of Quadratic Function & Graphical Behavior",
    durationMinutes: 10,
    xpReward: 15,
    coinReward: 25,
    summaryAr: "دراسة إشارة الدالة التربيعية f(x) = ax² + bx + c على خط الأعداد استنادًا إلى جذور المعادلة وإشارة المعامل a لتحديد الفترات الموجبة والسالبة والصفرية.",
    summaryEn: "Evaluating sign intervals of quadratic functions f(x) = ax² + bx + c along the real number line, correlating leading coefficient a and root coordinates.",
    workedAr: "تحديد إشارة f(x) = x² - 4x + 3 على ح: موجبة في ح \\ [1, 3]، سالبة في (1, 3)، وتساوي صفرًا عند x ∈ {1, 3}.",
    workedEn: "Mapping signs of f(x) = x² - 4x + 3 across R: positive on R \\ [1, 3], negative on (1, 3), zero at x ∈ {1, 3}.",
  },
  {
    id: "math-quadratic-inequalities",
    unitId: "unit-math-1",
    position: 5,
    slug: "math-quadratic-inequalities",
    titleAr: "حل المتباينات التربيعية في ح",
    titleEn: "Solving Quadratic Inequalities in Real Numbers",
    durationMinutes: 10,
    xpReward: 15,
    coinReward: 25,
    summaryAr: "طرق حل المتباينات من الدرجة الثانية في متغير واحد، وتعيين مجموعة الحل كفترات مغلقة أو مفتوحة أو مكملة على خط الأعداد الحقيقية.",
    summaryEn: "Analytical workflows for solving second-degree single-variable inequalities, denoting solution sets using interval notation in R.",
    workedAr: "حل المتباينة x² - 5x + 6 ≤ 0: إيجاد الجذور x = 2, 3 ثم تحديد الفترة السالبة والصفرية لتكون مجموعة الحل [2, 3].",
    workedEn: "Solving inequality x² - 5x + 6 ≤ 0: identifying roots 2 and 3, yielding closed solution interval [2, 3].",
  },

  // History
  {
    id: "hist-civilization-history",
    unitId: "unit-hist-1",
    position: 1,
    slug: "hist-civilization-history",
    titleAr: "مفهوم الحضارة والتاريخ وتطورهما",
    titleEn: "The Concepts of Civilization & History",
    durationMinutes: 8,
    xpReward: 15,
    coinReward: 25,
    summaryAr: "تعريف الحضارة كنتيجة تفاعل الإنسان مع بيئته، وأهمية دراسة التاريخ في استخلاص العبر وتنمية الشعور بالمسؤولية والابتعاد عن التعصب.",
    summaryEn: "Civilization defined as human-environmental interaction, historical methodology, critical perspective, and cultural empathy.",
    workedAr: "مقارنة انتقال مراكز الحضارة بين الشرق والغرب عبر العصور التاريخية القديمة والوسطى والحديثة.",
    workedEn: "Tracing historic migration of cultural centers between the ancient Near East and Mediterranean civilizations.",
  },

  // Arabic Language
  {
    id: "arab-parts-of-speech",
    unitId: "unit-arab-1",
    position: 1,
    slug: "arab-parts-of-speech",
    titleAr: "أقسام الكلمة والإعراب والبناء والمرفوعات",
    titleEn: "Parts of Speech, Inflection & Nominatives",
    durationMinutes: 9,
    xpReward: 15,
    coinReward: 25,
    summaryAr: "الاسم والفعل والحرف، علامات الإعراب الأصلية والفرعية، التمييز بين المعرب والمبني، وأحكام المبتدأ والخبر والفاعل ونائب الفاعل.",
    summaryEn: "Noun, verb, particle classifications, primary and secondary grammatical markers, mu'rab vs. mabni, and nominative syntax rules.",
    workedAr: "إعراب جمل اسمية وفعلية وتحديد علامات الرفع الأصلية (الضمة) والفرعية (الألف والواو).",
    workedEn: "Syntactic parsing of verbal and nominal sentences with focus on nominative inflectional markers.",
  },

  // English
  {
    id: "eng-past-tenses",
    unitId: "unit-eng-1",
    position: 1,
    slug: "eng-past-tenses",
    titleAr: "الأزمنة الماضية والسرد اللغوي (Past Narrative Tenses)",
    titleEn: "Past Narrative Tenses: Simple & Continuous",
    durationMinutes: 8,
    xpReward: 15,
    coinReward: 25,
    summaryAr: "استخدام الماضي البسيط والماضي المستمر في سرد القصص والأحداث المتقاطعة، مع الروابط الزمنية (while, when, as, during).",
    summaryEn: "Past Simple and Past Continuous for completed versus ongoing narrative background actions, punctuated by conjunctions (while, when, as).",
    workedAr: "تصحيح جمل تحتوي أفعال متقاطعة في الماضي وتطبيق صيغة while + past continuous.",
    workedEn: "Differentiating interrupted versus parallel actions in compound past sentences.",
  },

  // Philosophy & Logic
  {
    id: "phil-human-thinking",
    unitId: "unit-phil-1",
    position: 1,
    slug: "phil-human-thinking",
    titleAr: "التفكير الإنساني: الأساليب والمهارات وعوامل الخطأ",
    titleEn: "Human Thinking: Styles, Skills & Pitfalls",
    durationMinutes: 9,
    xpReward: 15,
    coinReward: 25,
    summaryAr: "مفهوم التفكير وأهميته، أساليب التفكير الخمسة (الخرافي، الديني، الفلسفي، العلمي، الإبداعي)، والتمييز بين التفكير الناقد والإبداعي وعوامل الوقوع في خطأ التفكير.",
    summaryEn: "Cognitive frameworks, five thinking styles (superstitious, religious, philosophical, scientific, creative), critical analysis versus innovation, and fallacies.",
    workedAr: "تحليل موقف حياتي وتحديد أسلوب التفكير المتبع وكيفية تجنب التعصب وتغليب العاطفة على العقل.",
    workedEn: "Diagnosing cognitive biases in everyday decision-making and applying reasoned critical filters.",
  },
];

/** Retrieve canonical units for a track slug or subject key. */
export function getCanonicalUnits(identifier: string): CanonicalUnit[] {
  const track = trackDefinition(identifier);
  const subjectKey = track ? track.subject : identifier;
  return CANONICAL_UNITS.filter((u) => u.courseId === subjectKey);
}

/** Retrieve canonical lessons for a unit id, track slug, or subject key. */
export function getCanonicalLessons(identifier: string): CanonicalLesson[] {
  const byUnit = CANONICAL_LESSONS.filter((l) => l.unitId === identifier);
  if (byUnit.length) return byUnit;

  const units = getCanonicalUnits(identifier);
  const unitIds = new Set(units.map((u) => u.id));
  return CANONICAL_LESSONS.filter((l) => unitIds.has(l.unitId));
}

/** Retrieve canonical lesson by ID or slug. */
export function getCanonicalLesson(idOrSlug: string): CanonicalLesson | null {
  // Direct match or fallback for g10 aliases
  const aliasMap: Record<string, string> = {
    "g10-sci-01": "sci-hydrosphere",
    "g10-sci-02": "sci-water-chemistry",
    "g10-sci-03": "sci-water-physics",
    "g10-sci-04": "sci-solutions-biology",
    "g10-sci-05": "sci-water-review",
    "g10-math-01": "math-complex-intro",
    "g10-math-02": "math-nature-of-roots",
    "g10-math-03": "math-roots-coefficients",
    "g10-math-04": "math-sign-of-quadratic",
    "g10-math-05": "math-quadratic-inequalities",
  };
  const target = aliasMap[idOrSlug] || idOrSlug;
  return CANONICAL_LESSONS.find((l) => l.id === target || l.slug === target) ?? null;
}
