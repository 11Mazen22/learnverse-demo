"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslation } from "@/lib/i18n/locale";

export interface KnowledgeStage {
  id: string;
  step: number;
  ar: string;
  en: string;
  tagAr: string;
  tagEn: string;
  color: string;
}

export interface SubjectDemo {
  key: string;
  ar: string;
  en: string;
  icon: string;
  color: string;
  topicAr: string;
  topicEn: string;
  unitAr: string;
  unitEn: string;
  sourceTextAr: string;
  sourceTextEn: string;
  lessonSummaryAr: string;
  lessonSummaryEn: string;
  aiPromptAr: string;
  aiPromptEn: string;
  aiReplyAr: string;
  aiReplyEn: string;
  practiceQuestionAr: string;
  practiceQuestionEn: string;
  practiceOptionsAr: string[];
  practiceOptionsEn: string[];
  correctOptionIndex: number;
  practiceExplanationAr: string;
  practiceExplanationEn: string;
  reviewScheduleAr: string;
  reviewScheduleEn: string;
}

const STAGES: KnowledgeStage[] = [
  {
    id: "source",
    step: 1,
    ar: "المصدر الموثوق",
    en: "Verified Source",
    tagAr: "أصيل وموثق",
    tagEn: "Ground Truth",
    color: "#22d3ee",
  },
  {
    id: "lesson",
    step: 2,
    ar: "الشرح المتدرّج",
    en: "Stepped Lesson",
    tagAr: "مفاهيم وأمثلة",
    tagEn: "Guided Concepts",
    color: "#818cf8",
  },
  {
    id: "ai",
    step: 3,
    ar: "جلسة Noäta AI",
    en: "Noäta AI Dialogue",
    tagAr: "حوار سقراطي ذكي",
    tagEn: "Socratic Inquiry",
    color: "#c084fc",
  },
  {
    id: "practice",
    step: 4,
    ar: "التطبيق الذكي",
    en: "Active Practice",
    tagAr: "تقييم فوري وتصحيح",
    tagEn: "Instant Mastery",
    color: "#f472b6",
  },
  {
    id: "review",
    step: 5,
    ar: "المراجعة المجدولة",
    en: "Spaced Retention",
    tagAr: "تكرار متباعد SM-2",
    tagEn: "Scheduled Recall",
    color: "#34d399",
  },
];

const SUBJECT_DEMOS: SubjectDemo[] = [
  {
    key: "integrated-science",
    ar: "العلوم المتكاملة",
    en: "Integrated Science",
    icon: "🧪",
    color: "#22d3ee",
    unitAr: "الوحدة الأولى: الغلاف المائي والبيئة المائية",
    unitEn: "Unit 1: The Hydrosphere & Aquatic Ecology",
    topicAr: "الخواص الفيزيائية والكيميائية للماء والروابط الهيدروجينية",
    topicEn: "Physical & Chemical Properties of Water & Hydrogen Bonding",
    sourceTextAr: "منهج مصر للصف الأول الثانوي — الترم الأول 2026–2027، دليل مذاكرة متكامل يربط الكيمياء بالفيزياء وعلم الأحياء.",
    sourceTextEn: "Egypt First Secondary Term 1 (2026–2027) syllabus, authentic study guide integrating chemistry, physics and biology.",
    lessonSummaryAr: "زاوية جزيء الماء (104.5°) وكهربية الأكسجين العالية تخلقان قطبية فريدة وروابط هيدروجينية ترفع درجة الغليان إلى 100°C وتفسر شذوذ الكثافة عند التجمد.",
    lessonSummaryEn: "The 104.5° bond angle and high oxygen electronegativity create dipole polarity and intermolecular hydrogen bonds, elevating boiling point to 100°C.",
    aiPromptAr: "ليه كثافة الجليد أقل من كثافة الماء السائل؟ وازاي ده بيحمي الكائنات البحرية؟",
    aiPromptEn: "Why is ice less dense than liquid water, and how does that protect marine organisms?",
    aiReplyAr: "عندما تنخفض الحرارة دون 4°C، تتباعد جزيئات الماء لتشكل شبكة بلورية سداسية مفتوحة بها فراغات هوائية، مما يقلل الكثافة فيطفو الجليد ويشكل طبقة عازلة تحمي الأحياء البحرية.",
    aiReplyEn: "Below 4°C, hydrogen bonds form an open hexagonal crystal lattice with air pockets, lowering density so ice floats and creates an insulating surface layer.",
    practiceQuestionAr: "أي الخواص التالية مسؤولة بشكل رئيسي عن صعود الماء في الأوعية الخشبية للنبات؟",
    practiceQuestionEn: "Which of the following properties is primarily responsible for capillary ascent in plant xylem vessels?",
    practiceOptionsAr: ["قوى التماسك والتلاصق الناتجة عن الروابط الهيدروجينية", "الانخفاض المفاجئ في درجات الحرارة", "التحلل الإلكتروليتي الذاتي"],
    practiceOptionsEn: ["Cohesive and adhesive forces from hydrogen bonds", "Sudden temperature drop", "Self-electrolytic dissociation"],
    correctOptionIndex: 0,
    practiceExplanationAr: "الصواب هو قوى التماسك (بين جزيئات الماء) والتلاصق (مع جدران الأوعية) الناتجة عن قطبية الماء وظاهرة التوتر السطحي.",
    practiceExplanationEn: "Correct: Cohesion (between water molecules) and adhesion (with xylem walls) driven by dipole polarity and surface tension.",
    reviewScheduleAr: "تكرار متباعد SM-2: المراجعة الأولى بعد يوم واحد، والمراجعة الثانية بعد ٤ أيام، ثم ١٢ يومًا للتثبيت الدائم.",
    reviewScheduleEn: "SM-2 Schedule: First review in 24h, second review in 4 days, then 12 days for permanent memory consolidation.",
  },
  {
    key: "mathematics",
    ar: "الرياضيات",
    en: "Mathematics",
    icon: "📐",
    color: "#818cf8",
    unitAr: "الوحدة الأولى: الجبر والعلاقات والدوال",
    unitEn: "Unit 1: Algebra & Quadratic Relations",
    topicAr: "الأعداد المركبة وتحديد نوع جذري المعادلة التربيعية بالمميز",
    topicEn: "Complex Numbers & Discriminant Analysis of Quadratic Roots",
    sourceTextAr: "منهج مصر الترم الأول 2026–2027، يتضمن مسارين مستقلين بالكامل: مسار باللغة العربية ومسار باللغة الإنجليزية.",
    sourceTextEn: "Egypt Term 1 (2026–2027) curriculum, featuring 2 completely isolated language tracks (Arabic & English).",
    lessonSummaryAr: "المميز (Δ = b² - 4ac) يحدد طبيعة الجذور: إذا كان موجبًا فالجذران حقيقيان مختلفان، وإذا كان صفرًا فهما حقيقيان متساويان، وإذا كان سالبًا فالجذران مركبان مترافقان.",
    lessonSummaryEn: "The discriminant (Δ = b² - 4ac) reveals roots: Δ > 0 gives two distinct real roots, Δ = 0 gives equal real roots, and Δ < 0 gives conjugate complex roots.",
    aiPromptAr: "إزاي أحل المعادلة س² + 4 = 0 في مجموعة الأعداد المركبة؟",
    aiPromptEn: "How do I solve the equation x² + 4 = 0 over the set of complex numbers?",
    aiReplyAr: "ننقل 4 للطرف الآخر: س² = -4، وبأخذ الجذر التربيعي: س = ± √(-4) = ± √(4 × -1) = ± 2ت (أو ± 2i بالإنجليزية). إذن مجموعة الحل هي {2ت, -2ت}.",
    aiReplyEn: "Subtract 4: x² = -4, then take square roots: x = ±√(-4) = ±√(4 × -1) = ±2i. Thus the solution set is {2i, -2i}.",
    practiceQuestionAr: "إذا كان مميز المعادلة التربيعية يساوي -16، فما نوع جذري المعادلة؟",
    practiceQuestionEn: "If the discriminant of a quadratic equation equals -16, what is the nature of its roots?",
    practiceOptionsAr: ["جذران مركبان مترافقان غير حقيقيين", "جذران حقيقيان نسبيان متساويان", "جذر واحد حقيقي موجب فقط"],
    practiceOptionsEn: ["Two non-real complex conjugate roots", "Two equal rational real roots", "A single positive real root only"],
    correctOptionIndex: 0,
    practiceExplanationAr: "بما أن المميز سالب (Δ < 0)، فإن المعادلة لا تملك حلولاً حقيقية وتملك جذرين مركبين مترافقين.",
    practiceExplanationEn: "Since the discriminant is negative (Δ < 0), the equation has no real solutions and yields two complex conjugate roots.",
    reviewScheduleAr: "تكرار متباعد: قاعدة المميز تُراجع بعد ٤٨ ساعة، ثم أسبوع، ومسائل الربط الجبري تُجدول قبل الاختبار الشهري.",
    reviewScheduleEn: "Spaced review: Discriminant rules revisit in 48h, then 1 week, with synthesis drills scheduled prior to monthly exams.",
  },
  {
    key: "history",
    ar: "تاريخ مصر والعالم",
    en: "History",
    icon: "🏛️",
    color: "#fbbf24",
    unitAr: "الوحدة الأولى: مدخل لدراسة حضارة مصر والعالم القديم",
    unitEn: "Unit 1: Foundations of Egypt & the Ancient World",
    topicAr: "مفهوم الحضارة والتاريخ وعوامل قيام الحضارات وانتقال مراكزها",
    topicEn: "Civilisation, History & Transcontinental Exchange",
    sourceTextAr: "مبني على التوثيق التاريخي لدليل مذاكرة أولى ثانوي، مع الحفاظ على تسلسل العصور ومصادر الآثار والنقوش.",
    sourceTextEn: "Grounded in verified historical study packs, covering chronological eras, epigraphy and archaeological provenance.",
    lessonSummaryAr: "الحضارة ثمرة أي مجهود يقوم به الإنسان نتيجة تفاعله مع البيئة، والتاريخ علم يدرس النشاط البشري في كافة الأزمنة لاستخلاص العبر وتجنب التعصب.",
    lessonSummaryEn: "Civilisation is the fruit of human exertion interacting with the environment; history studies human actions across time to derive wisdom and eliminate bias.",
    aiPromptAr: "ليه بنعتبر الحضارة تيارًا متصلًا ينتقل بين الشرق والغرب ولا تخص أمة بمفردها؟",
    aiPromptEn: "Why is civilisation viewed as an unbroken current that flows between East and West rather than belonging to one nation?",
    aiReplyAr: "لأن الحضارات تتبادل الأخذ والعطاء والتأثير والتأثر؛ بدأت في الشرق القديم (مصر والعراق وفارس)، ثم انتقلت للغرب (اليونان والرومان)، ثم عادت للشرق في الحضارة الإسلامية، ثم استقرت في الغرب الحديث.",
    aiReplyEn: "Civilisations engage in continuous reciprocal exchange; originating in the ancient East (Egypt, Mesopotamia, Persia), passing to Greece and Rome, returning in Islamic civilisation, and progressing to the modern West.",
    practiceQuestionAr: "أي المصادر الأولية التالية يُعد المصدر الرئيسي لدراسة التاريخ المصري القديم بدون مبالغات شعرية؟",
    practiceQuestionEn: "Which primary source is the most reliable for studying ancient Egyptian history without poetic hyperbole?",
    practiceOptionsAr: ["النقوش والبرديات والآثار المعاصرة للحدث", "كتابات الشعراء والأساطير المتداولة", "روايات الرحالة المتأخرين بعد قرون"],
    practiceOptionsEn: ["Inscriptions, papyri and contemporary monuments", "Poetic folklore and oral legends", "Accounts by travellers centuries later"],
    correctOptionIndex: 0,
    practiceExplanationAr: "المصادر الأولية المعاصرة للحدث كالنقوش والآثار تتميز بالدقة والموضوعية العالية وتخلو من التحريف الأدبي.",
    practiceExplanationEn: "Contemporary primary records such as inscriptions and artifacts provide rigorous objectivity free from literary embellishment.",
    reviewScheduleAr: "تكرار متباعد: مراجعة خريطة انتقال الحضارات بعد ٣ أيام، وتاريخ العصور بعد ١٠ أيام.",
    reviewScheduleEn: "Spaced review: Civilisational timeline maps scheduled in 3 days, chronological eras in 10 days.",
  },
  {
    key: "arabic-language",
    ar: "اللغة العربية",
    en: "Arabic Language",
    icon: "📖",
    color: "#f472b6",
    unitAr: "الوحدة الأولى: الأدب والنصوص وقصة عنترة بن شداد",
    unitEn: "Unit 1: Classical Literature & The Antara Epic",
    topicAr: "الأدب في العصر الجاهلي، المعلقات، وبناء القصيدة العربية",
    topicEn: "Pre-Islamic Literature, the Mu'allaqat & Arabic Poetic Form",
    sourceTextAr: "يشمل ١١ درسًا مفصلًا في القراءة والبلاغة والنحو وتاريخ الأدب ومراجعات تحليلية لقصة عنترة بن شداد.",
    sourceTextEn: "Comprises 11 exhaustive lessons across reading, rhetoric, syntax, literary history and Antara novel analyses.",
    lessonSummaryAr: "المعلقات قصائد طوال من عيون الشعر الجاهلي تميزت بصدق التعبير وجزالة الألفاظ ووحدة الوزن والقافية، وتبدأ غالبًا بالوقوف على الأطلال وذكر الديار.",
    lessonSummaryEn: "The Mu'allaqat represent zenith pre-Islamic poetry characterized by rich diction, monorhyme metre, and evocative opening laments over ruined encampments.",
    aiPromptAr: "وضح القيمة البلاغية للاستعارة المكنية في قول الشاعر وكيف نميزها عن التصريحية؟",
    aiPromptEn: "Explain the rhetorical value of the implicit metaphor (isti'arah makniyyah) versus explicit metaphor.",
    aiReplyAr: "الاستعارة المكنية يُحذف فيها المشبّه به مع الإبقاء على صفة من صفاته ترمز إليه (مثل: عضّنا الدهر بنابه)، وقيمتها التشخيص والتجسيم وإبراز المعنى الحسي للأفكار المجردة.",
    aiReplyEn: "In implicit metaphor the vehicle is omitted while preserving one of its evocative attributes, imparting personification and palpable vivacity to abstract sentiments.",
    practiceQuestionAr: "ما الملمح الفني الأبرز الذي تميز به بناء القصيدة في العصر الجاهلي؟",
    practiceQuestionEn: "What is the most prominent structural hallmark of pre-Islamic Arabic poetry?",
    practiceOptionsAr: ["البدء بالبكاء على الأطلال والغزل ثم وصف الرحلة وصولًا للغرض الرئيسي", "التركيز على فكرة علمية واحدة دون مقدمات", "غياب الوزن والقافية والاعتماد على السرد النثري"],
    practiceOptionsEn: ["Opening with nostalgic laments over ruins, journey descriptions, then the primary motif", "Strict topical focus on scientific ideas", "Absence of metre and relying on prose storytelling"],
    correctOptionIndex: 0,
    practiceExplanationAr: "القصيدة الجاهلية التزمت بتقليد فني راسخ يبدأ بالأطلال والنسيب ثم وصف الناقة ورحلة الصحراء وصولًا للمقصد الأساسي كالمدح أو الفخر.",
    practiceExplanationEn: "Classical odes adhered to structural conventions commencing with elegiac ruination, desert traversing, and culminating in the core theme.",
    reviewScheduleAr: "تكرار متباعد: القواعد البلاغية ومحسنات البديع تُعاد ببطاقات مراجعة على فترات ٥ أيام و١٥ يومًا.",
    reviewScheduleEn: "Spaced review: Rhetorical devices and syntactical rules reviewed via flashcards at 5-day and 15-day intervals.",
  },
  {
    key: "english",
    ar: "اللغة الإنجليزية",
    en: "English Language",
    icon: "🌐",
    color: "#2dd4bf",
    unitAr: "Unit 1: Getting Away & Ecotourism",
    unitEn: "Unit 1: Getting Away & Ecotourism",
    topicAr: "Past Simple vs Past Continuous & Environmental Vocabulary",
    topicEn: "Past Simple vs Past Continuous & Environmental Vocabulary",
    sourceTextAr: "منهج اللغة الإنجليزية للصف الأول الثانوي الترم الأول، يغطي ٥ وحدات شاملة للمفردات والقواعد واستيعاب المقروء.",
    sourceTextEn: "Grade 10 English syllabus covering 5 rich thematic units with grammar mechanics and contextual comprehension.",
    lessonSummaryAr: "الماضي المستمر (was/were + v-ing) يعبر عن حدث كان مستمرًا في نقطة محددة من الماضي عندما قطعه حدث آخر في الماضي البسيط (past simple).",
    lessonSummaryEn: "Past continuous (was/were + v-ing) illustrates an ongoing background activity interrupted by a completed action in the past simple.",
    aiPromptAr: "What is the difference between ecotourism and traditional mass tourism?",
    aiPromptEn: "What is the difference between ecotourism and traditional mass tourism?",
    aiReplyAr: "Ecotourism focuses on visiting natural destinations responsibly to conserve the environment and improve the well-being of local communities, whereas mass tourism often exerts pressure on fragile ecosystems.",
    aiReplyEn: "Ecotourism focuses on visiting natural destinations responsibly to conserve the environment and improve the well-being of local communities, whereas mass tourism often exerts pressure on fragile ecosystems.",
    practiceQuestionAr: "While I was studying for my biology exam, the power suddenly ______.",
    practiceQuestionEn: "While I was studying for my biology exam, the power suddenly ______.",
    practiceOptionsAr: ["went out", "was going out", "has gone out"],
    practiceOptionsEn: ["went out", "was going out", "has gone out"],
    correctOptionIndex: 0,
    practiceExplanationAr: "The interruption action takes the past simple ('went out'), while the prolonged background action uses past continuous ('was studying').",
    practiceExplanationEn: "The interruption action takes the past simple ('went out'), while the prolonged background action uses past continuous ('was studying').",
    reviewScheduleAr: "تكرار متباعد: قوائم المفردات البيئية تُجدول على نظام البطاقات الذكية كل ٤٨ ساعة.",
    reviewScheduleEn: "Spaced repetition: Environmental lexicon decks scheduled every 48h to prevent forgetting.",
  },
  {
    key: "philosophy-logic",
    ar: "الفلسفة والمنطق",
    en: "Philosophy & Logic",
    icon: "💡",
    color: "#c084fc",
    unitAr: "الوحدة الأولى: مبادئ التفكير الفلسفي والمنطقي",
    unitEn: "Unit 1: Fundamentals of Philosophical Inquiry",
    topicAr: "مفهوم التفكير وأساليبه ونشأة الفلسفة وأهميتها للفرد والمجتمع",
    topicEn: "Modes of Thinking, Philosophical Genesis & Societal Significance",
    sourceTextAr: "دليل مذاكرة أصلي ينمي التفكير النقدي والتحليلي والتفريق بين الأسلوب الخرافي والديني والعلمي والفلسفي.",
    sourceTextEn: "Rigorous study pack fostering critical epistemology and distinguishing mythological, religious, scientific and philosophical paradigms.",
    lessonSummaryAr: "التفكير الفلسفي يتسم بالدهشة وإثارة التساؤل والشك المنهجي والاستقلال الفكري، ولا يقبل فكرة دون فحص أدلتها العقلية.",
    lessonSummaryEn: "Philosophical thought is defined by epistemic wonder, systematic doubt, intellectual autonomy, and verifying arguments through rational scrutiny.",
    aiPromptAr: "ما الفرق الجوهري بين الأسلوب العلمي والأسلوب الفلسفي في تفسير الظواهر؟",
    aiPromptEn: "What is the essential distinction between scientific and philosophical inquiry?",
    aiReplyAr: "الأسلوب العلمي يبحث في العلل القريبة المباشرة للظاهرة عن طريق الملاحظة والتجربة، بينما الأسلوب الفلسفي يتجاوز ذلك للبحث في العلل البعيدة الكلية والمبادئ الأولى للوجود.",
    aiReplyEn: "Scientific reasoning investigates proximate, empirical causes via experiment, whereas philosophical reasoning seeks ultimate first principles and universal metaphysical causality.",
    practiceQuestionAr: "أي أساليب التفكير التالية يعتمد على ربط الظواهر بعوامل غيبية ساذجة دون دليل منطقي؟",
    practiceQuestionEn: "Which mode of thought attributes natural phenomena to naive supernatural superstitions without rational proof?",
    practiceOptionsAr: ["الأسلوب الخرافي البدائي", "الأسلوب الفلسفي التأملي", "الأسلوب العلمي التجريبي"],
    practiceOptionsEn: ["Primitive superstitious thinking", "Reflective philosophical inquiry", "Empirical scientific reasoning"],
    correctOptionIndex: 0,
    practiceExplanationAr: "الأسلوب الخرافي يعتمد على أسباب غير منطقية وساذجة لتفسير الأحداث كالتمائم والتنجيم، على عكس الأسلوبين العلمي والفلسفي.",
    practiceExplanationEn: "Superstitious modes rely on irrational, unexamined assumptions rather than grounded empirical or philosophical evidence.",
    reviewScheduleAr: "تكرار متباعد: مراجعة أنواع المغالطات الصورية وغير الصورية ببطاقات تفاعلية كل أسبوع.",
    reviewScheduleEn: "Spaced review: Formal and informal fallacy flashcards scheduled weekly.",
  },
];

export function KnowledgeMap() {
  const t = useTranslation();
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [activeSubject, setActiveSubject] = useState<SubjectDemo>(SUBJECT_DEMOS[0]);
  const [selectedStage, setSelectedStage] = useState<KnowledgeStage>(STAGES[1]); // Default to Lesson stage
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);

  // Expansive coordinates across 1000px width canvas
  // 5 nodes spaced gracefully: 100, 300, 500, 700, 900 on a unified baseline
  const desktopNodes = STAGES.map((stage, idx) => {
    const x = isRtl ? 900 - idx * 200 : 100 + idx * 200;
    const y = 75;
    return { ...stage, x, y };
  });

  const railStartX = isRtl ? 900 : 100;
  const railEndX = isRtl ? 100 : 900;
  const railPathD = `M ${railStartX} 75 L ${railEndX} 75`;

  return (
    <div className="km-wrap w-full">
      {/* Subject Selector Interactive Bar */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="font-bold text-white text-base md:text-lg">
              {t("مثال توضيحي لدورة التعلّم — ليس بيانات حساب", "Illustrative Learning Loop — Not Account Data")}
            </h3>
          </div>
          <span className="text-xs text-indigo-300 font-semibold bg-indigo-950/60 border border-indigo-500/30 px-3 py-1 rounded-full">
            {t("محتوى توضيحي من دليل المصدر", "Illustrative source-guide content")}
          </span>
        </div>

        {/* 6 Subject Switcher Pills */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t("المواد الدراسية", "Curriculum Subjects")}>
          {SUBJECT_DEMOS.map((sub) => {
            const isActive = activeSubject.key === sub.key;
            return (
              <button
                key={sub.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveSubject(sub);
                  setSelectedQuizOption(null);
                }}
                className={`km-subject-tab text-xs md:text-sm font-semibold px-3.5 py-2 rounded-xl border flex items-center gap-2 transition-all ${
                  isActive
                    ? "bg-white/[0.12] text-white shadow-lg"
                    : "bg-white/[0.03] text-[#cbd5e1] border-white/[0.08]"
                }`}
                style={{
                  borderColor: isActive ? sub.color : undefined,
                  boxShadow: isActive ? `0 0 16px ${sub.color}35` : undefined,
                }}
              >
                <span>{sub.icon}</span>
                <span>{locale === "en" ? sub.en : sub.ar}</span>
              </button>
            );
          })}
        </div>

        {/* Active Subject Context Badge */}
        <div className="mt-3 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#94a3b8]">
            <span className="font-bold text-white">{locale === "en" ? activeSubject.unitEn : activeSubject.unitAr}</span>
            <span>·</span>
            <span className="text-cyan-300">{locale === "en" ? activeSubject.topicEn : activeSubject.topicAr}</span>
          </div>
          <span className="text-[11px] text-[#cbd5e1]">
            {isRtl ? "اضغط على أي من المراحل الخمس بالأسفل لتجربتها مباشرة" : "Click any of the 5 stages below to interact"}
          </span>
        </div>
      </div>

      {/* Grand Desktop SVG Pipeline View */}
      <div className="km-desktop-view relative my-4 overflow-visible">
        <svg
          className="km-canvas"
          viewBox="0 0 1000 185"
          role="img"
          aria-label={t(
            "خريطة المعرفة التفاعلية للمنهج: المصدر، الدرس، حوار Noäta AI، التطبيق، والمراجعة المجدولة",
            "Interactive Knowledge Pipeline: Source, Lesson, Noäta AI, Practice, Review",
          )}
        >
          <defs>
            <linearGradient id="kmLineGrad" x1={isRtl ? "100%" : "0%"} y1="0%" x2={isRtl ? "0%" : "100%"} y2="0%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.85" />
              <stop offset="25%" stopColor="#818cf8" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#c084fc" stopOpacity="0.9" />
              <stop offset="75%" stopColor="#f472b6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Deep underlying ambient glow path */}
          <line
            x1={railStartX}
            y1="75"
            x2={railEndX}
            y2="75"
            stroke="url(#kmLineGrad)"
            strokeWidth="10"
            strokeOpacity="0.18"
            strokeLinecap="round"
            pointerEvents="none"
          />

          {/* Solid track baseline */}
          <line
            x1={railStartX}
            y1="75"
            x2={railEndX}
            y2="75"
            stroke="url(#kmLineGrad)"
            strokeWidth="3.5"
            strokeOpacity="0.75"
            strokeLinecap="round"
            pointerEvents="none"
          />

          {/* Directional Chevrons between stages */}
          {[0, 1, 2, 3].map((idx) => {
            const midX = isRtl ? 900 - idx * 200 - 100 : 100 + idx * 200 + 100;
            return (
              <text
                key={idx}
                x={midX}
                y="79"
                fill="rgba(255, 255, 255, 0.4)"
                fontSize="14"
                fontWeight="bold"
                textAnchor="middle"
                pointerEvents="none"
                style={{ userSelect: "none" }}
              >
                {isRtl ? "‹" : "›"}
              </text>
            );
          })}

          {/* Interactive Nodes */}
          {desktopNodes.map((node) => {
            const isSelected = selectedStage.id === node.id;
            return (
              <g
                key={node.id}
                className="km-node-btn"
                onClick={() => {
                  setSelectedStage(node);
                  setSelectedQuizOption(null);
                }}
                tabIndex={0}
                role="button"
                aria-label={`${locale === "en" ? node.en : node.ar}: ${locale === "en" ? node.tagEn : node.tagAr}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedStage(node);
                    setSelectedQuizOption(null);
                  }
                }}
              >
                {/* Stable Static Hit Area Target */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="42"
                  fill="transparent"
                  pointerEvents="all"
                  style={{ cursor: "pointer" }}
                />

                {/* Outer Focus Aura Ring on Selection (Zero jitter, static) */}
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="36"
                    fill="none"
                    stroke={node.color}
                    strokeWidth="1.5"
                    strokeOpacity="0.5"
                    strokeDasharray="4 4"
                    pointerEvents="none"
                  />
                )}

                {/* Outer Glass Ring - 100% Fixed Radius, Crisp Static Highlight */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="28"
                  fill={isSelected ? "rgba(10, 18, 36, 0.96)" : "rgba(10, 18, 36, 0.85)"}
                  stroke={isSelected ? node.color : "rgba(255, 255, 255, 0.25)"}
                  strokeWidth={isSelected ? "3" : "1.8"}
                  pointerEvents="none"
                />

                {/* Inner Glowing Core */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? "12" : "10"}
                  fill={node.color}
                  fillOpacity={isSelected ? 1 : 0.85}
                  pointerEvents="none"
                />

                {/* Step Number inside Core */}
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fill="#030712"
                  fontSize="11"
                  fontWeight="900"
                  pointerEvents="none"
                  style={{ userSelect: "none" }}
                >
                  {node.step}
                </text>

                {/* Main Label - Placed below node with generous 29px gap */}
                <text
                  x={node.x}
                  y={132}
                  textAnchor="middle"
                  fill={isSelected ? "#ffffff" : "#cbd5e1"}
                  fontSize="14"
                  fontWeight={isSelected ? "800" : "600"}
                  pointerEvents="none"
                  style={{ userSelect: "none" }}
                >
                  {locale === "en" ? node.en : node.ar}
                </text>

                {/* Subtitle Badge - Placed below main label with 23px gap */}
                <text
                  x={node.x}
                  y={155}
                  textAnchor="middle"
                  fill={isSelected ? node.color : "#94a3b8"}
                  fontSize="11"
                  fontWeight="600"
                  pointerEvents="none"
                  style={{ userSelect: "none" }}
                >
                  {locale === "en" ? node.tagEn : node.tagAr}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Mobile Stepped Timeline (< 768px) */}
      <div className="km-mobile-timeline">
        {STAGES.map((stage) => {
          const isSelected = selectedStage.id === stage.id;
          return (
            <div
              key={stage.id}
              onClick={() => {
                setSelectedStage(stage);
                setSelectedQuizOption(null);
              }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-white/[0.1] border-cyan-400/80 shadow-lg"
                  : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs"
                  style={{
                    backgroundColor: `${stage.color}25`,
                    color: stage.color,
                    border: `1px solid ${stage.color}60`,
                  }}
                >
                  {stage.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-white">{locale === "en" ? stage.en : stage.ar}</strong>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${stage.color}20`,
                        color: stage.color,
                      }}
                    >
                      {locale === "en" ? stage.tagEn : stage.tagAr}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Five Stage Navigation Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-5">
        {STAGES.map((s) => {
          const isSelected = selectedStage.id === s.id;
          return (
            <div
              key={s.id}
              onClick={() => {
                setSelectedStage(s);
                setSelectedQuizOption(null);
              }}
              data-selected={isSelected}
              className={`km-node-card text-center p-3.5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? "bg-white/[0.08] shadow-lg"
                  : "bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.05]"
              }`}
              style={{
                borderColor: isSelected ? s.color : undefined,
                boxShadow: isSelected ? `0 0 20px ${s.color}30` : undefined,
              }}
            >
              {isSelected && (
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: s.color }}
                />
              )}
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-[#cbd5e1] whitespace-nowrap">
                  {locale === "en" ? s.en : s.ar}
                </span>
              </div>
              <div className="text-xs font-semibold text-white mb-2 whitespace-nowrap">
                {locale === "en" ? s.tagEn : s.tagAr}
              </div>
              <div
                className="km-status-badge text-[10px] px-2.5 py-1 justify-center whitespace-nowrap"
                style={{
                  backgroundColor: `${s.color}15`,
                  color: s.color,
                  border: `1px solid ${s.color}35`,
                }}
              >
                {s.step === 1
                  ? t("ربط توضيحي بالمصدر", "Illustrative Source Mapping")
                  : s.step === 2
                  ? t("شرح متسلسل", "Step Breakdown")
                  : s.step === 3
                  ? t("حوار سقراطي", "Socratic Tutor")
                  : s.step === 4
                  ? t("تدريب وتصحيح", "Deterministic Check")
                  : t("مثال فواصل تقديرية", "Estimated Interval Example")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Stage Inspector & Interactive Playground */}
      <div className="mt-5 p-5 md:p-6 rounded-2xl bg-gradient-to-br from-[#0c1322] via-[#0f1c34] to-[#070d18] border border-white/[0.12] shadow-2xl relative overflow-hidden">
        {/* Stage Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-white/[0.08] gap-3">
          <div className="flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-[#030712]"
              style={{ backgroundColor: selectedStage.color }}
            >
              {selectedStage.step}
            </span>
            <div>
              <h4 className="font-bold text-white text-base md:text-lg flex items-center gap-2">
                <span>{locale === "en" ? selectedStage.en : selectedStage.ar}</span>
                <span className="text-xs text-[#94a3b8] font-normal">
                  — {activeSubject.icon} {locale === "en" ? activeSubject.en : activeSubject.ar}
                </span>
              </h4>
              <p className="text-xs text-[#94a3b8]">
                {locale === "en" ? selectedStage.tagEn : selectedStage.tagAr}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/signup?subject=${activeSubject.key}`}
              className="min-h-[46px] px-6 py-2.5 rounded-xl font-bold text-sm text-[#030712] transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-xl hover:brightness-110 active:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ backgroundColor: selectedStage.color, outlineColor: selectedStage.color }}
            >
               <span>{t("تحقق من توفر المسار", "Check track availability")}</span>
              <span aria-hidden="true" className="text-base font-black">{isRtl ? "←" : "→"}</span>
            </Link>
          </div>
        </div>

        {/* Dynamic Stage Content Panel */}
        <div className="space-y-4">
          {/* STAGE 1: SOURCE */}
          {selectedStage.id === "source" && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-cyan-400/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-300">
                    {t("المصدر الأكاديمي والتوثيق", "Academic Provenance")}
                  </span>
                   <span className="text-[11px] font-mono text-[#94a3b8]">Illustrative topic: {activeSubject.key}-g10-t1</span>
                </div>
                <p className="text-sm text-[#e2e8f0] leading-relaxed">
                  {locale === "en" ? activeSubject.sourceTextEn : activeSubject.sourceTextAr}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                   <strong className="text-white block mb-1">{t("موضوع توضيحي:", "Illustrative theme:")}</strong>
                  <span className="text-[#94a3b8]">
                    {locale === "en" ? activeSubject.unitEn : activeSubject.unitAr}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                   <strong className="text-white block mb-1">{t("مثال مفهوم:", "Example concept:")}</strong>
                  <span className="text-[#94a3b8]">
                    {locale === "en" ? activeSubject.topicEn : activeSubject.topicAr}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 2: LESSON */}
          {selectedStage.id === "lesson" && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-400/30">
                <span className="text-xs font-bold text-indigo-300 block mb-2">
                  {t("المفهوم الأساسي في الدرس", "Core Lesson Concept")}
                </span>
                <p className="text-sm text-[#f1f5f9] leading-relaxed">
                  {locale === "en" ? activeSubject.lessonSummaryEn : activeSubject.lessonSummaryAr}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 text-sm">💡</span>
                  <span className="text-[#cbd5e1]">
                    {t(
                      "كل درس ينتهي بتدريب فوري لقياس الفهم ولا يكتفي بتقديم نص طويل للقراءة السلبية.",
                      "Every lesson concludes with an active check rather than a passive wall of text.",
                    )}
                  </span>
                </div>
                <Link
                  href="/features#how"
                  className="text-xs text-indigo-300 hover:underline flex-shrink-0 font-medium"
                >
                  {t("كيف تُبنى الدروس؟", "Lesson methodology")}
                </Link>
              </div>
            </div>
          )}

          {/* STAGE 3: AI DIALOGUE */}
          {selectedStage.id === "ai" && (
            <div className="space-y-3 font-sans">
              {/* User Question */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs">
                <div className="flex items-center justify-between mb-1 text-[11px] text-[#94a3b8]">
                  <span className="font-bold text-white">{t("أنت (طالب أولى ثانوي)", "You (Grade 10 Learner)")}</span>
                  <span>{locale === "en" ? activeSubject.en : activeSubject.ar}</span>
                </div>
                <p className="text-[#f1f5f9] text-sm">
                  {locale === "en" ? activeSubject.aiPromptEn : activeSubject.aiPromptAr}
                </p>
              </div>

              {/* Noäta AI Response */}
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-[#f1f5f9] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-purple-300 font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>Noäta AI Tutor · Study Session</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
                     Illustrative draft · verify source
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[#f8fafc]">
                  {locale === "en" ? activeSubject.aiReplyEn : activeSubject.aiReplyAr}
                </p>
              </div>
            </div>
          )}

          {/* STAGE 4: PRACTICE */}
          {selectedStage.id === "practice" && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <span className="text-xs font-bold text-pink-400 block mb-2">
                  {t("تدريب اختبر فهمك الآن — اضغط على الإجابة:", "Interactive Practice Challenge — Select an option:")}
                </span>
                <p className="text-sm font-semibold text-white mb-3">
                  {locale === "en" ? activeSubject.practiceQuestionEn : activeSubject.practiceQuestionAr}
                </p>

                <div className="space-y-2">
                  {(locale === "en" ? activeSubject.practiceOptionsEn : activeSubject.practiceOptionsAr).map((opt, oIdx) => {
                    const isSelected = selectedQuizOption === oIdx;
                    const isCorrect = oIdx === activeSubject.correctOptionIndex;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedQuizOption(oIdx)}
                        className={`w-full text-start p-3 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? isCorrect
                              ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                              : "bg-rose-500/20 border-rose-400 text-rose-200"
                            : "bg-white/[0.02] border-white/[0.06] text-[#cbd5e1] hover:bg-white/[0.05]"
                        }`}
                      >
                        <span className="font-bold mr-2 ml-2">{String.fromCharCode(65 + oIdx)}.</span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Instant Feedback Panel */}
                {selectedQuizOption !== null && (
                  <div
                    className={`mt-3 p-3.5 rounded-xl border text-xs leading-relaxed ${
                      selectedQuizOption === activeSubject.correctOptionIndex
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-100"
                        : "bg-amber-950/40 border-amber-500/40 text-amber-100"
                    }`}
                  >
                    <strong className="block mb-1">
                      {selectedQuizOption === activeSubject.correctOptionIndex
                        ? t("✓ إجابة صحيحة وتحليل موفق!", "✓ Correct answer with reasoned analysis!")
                         : t("تفسير الإجابة في المثال:", "Sample answer explanation:")}
                    </strong>
                    <p>{locale === "en" ? activeSubject.practiceExplanationEn : activeSubject.practiceExplanationAr}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STAGE 5: REVIEW */}
          {selectedStage.id === "review" && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                <span className="text-xs font-bold text-emerald-300 block mb-2">
                   {t("مثال فواصل بطاقة مستوحاة من SM-2", "SM-2-Inspired Card Interval Example")}
                </span>
                <p className="text-sm text-[#f1f5f9] leading-relaxed mb-3">
                   {t("هذا مثال ثابت لشرح القاعدة، وليس جدول متعلم أو إثبات إتقان. الموعد الفعلي يحسبه الخادم بعد تقييم البطاقة.", "This fixed example explains the rule; it is not learner data or mastery proof. The server calculates actual dates after a card rating.")}
                </p>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                     <span className="block text-[10px] text-[#94a3b8]">{t("مرة أخرى", "Again")}</span>
                     <strong className="text-emerald-400 text-sm">١٠ دقائق</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                     <span className="block text-[10px] text-[#94a3b8]">{t("جيد", "Good")}</span>
                     <strong className="text-emerald-400 text-sm">يوم</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                     <span className="block text-[10px] text-[#94a3b8]">{t("سهل", "Easy")}</span>
                     <strong className="text-emerald-400 text-sm">٤ أيام</strong>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#94a3b8] text-center">
                {t(
                   "تقييم البطاقة يغيّر موعدها التقديري فقط؛ لا يمنح درجة أو مكافأة ولا يثبت الإتقان.",
                   "A card rating changes only its estimated due date; it grants no grade or reward and does not prove mastery.",
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
