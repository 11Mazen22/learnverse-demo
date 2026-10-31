"use client";

import Link from "next/link";
import { MarketingShell, Reveal } from "./marketing-shell";
import { KnowledgeMap } from "./knowledge-map";
import { useLocale, useTranslation } from "@/lib/i18n/locale";

/* The six core subject families with accurate track data and counts */
const SUBJECTS = [
  {
    key: "integrated-science",
    ar: "العلوم المتكاملة",
    en: "Integrated Science",
    n: 5,
    tracks: 2,
    tracksLabelAr: "مساران: عربي / إنجليزي",
    tracksLabelEn: "2 Tracks: Arabic / English",
    descAr: "الغلاف المائي، الخواص الفيزيائية والكيميائية للماء، المحاليل، والأهمية الحيوية.",
    descEn: "Hydrosphere, physical & chemical water properties, solutions, and biological importance.",
    color: "#22d3ee",
    bg: "rgba(34,211,238,0.08)",
    border: "rgba(34,211,238,0.25)",
  },
  {
    key: "mathematics",
    ar: "الرياضيات",
    en: "Mathematics",
    n: 5,
    tracks: 2,
    tracksLabelAr: "مساران: عربي / إنجليزي",
    tracksLabelEn: "2 Tracks: Arabic / English",
    descAr: "الأعداد المركبة، بحث نوع جذري المعادلة، إشارة الدوال والمتباينات التربيعية.",
    descEn: "Complex numbers, quadratic roots analysis, signs of functions & inequalities.",
    color: "#818cf8",
    bg: "rgba(129,140,248,0.08)",
    border: "rgba(129,140,248,0.25)",
  },
  {
    key: "history",
    ar: "تاريخ مصر والعالم",
    en: "History",
    n: 5,
    tracks: 1,
    tracksLabelAr: "مسار محتوى عربي",
    tracksLabelEn: "Standard Track",
    descAr: "مفهوم الحضارة والتاريخ، انتقال المراكز الحضارية، وتطور العالم القديم.",
    descEn: "Civilisation and history concepts, civilisational centres, and ancient world development.",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.25)",
  },
  {
    key: "arabic-language",
    ar: "اللغة العربية",
    en: "Arabic Language",
    n: 11,
    tracks: 1,
    tracksLabelAr: "مسار شامل ومفصل",
    tracksLabelEn: "Comprehensive Track",
    descAr: "النصوص القرائية والأدبية، النحو والصرف، وملخص دراسي لقصة عنترة بن شداد.",
    descEn: "Reading & literature texts, syntax & morphology, and the story of Antara.",
    color: "#f472b6",
    bg: "rgba(244,114,182,0.08)",
    border: "rgba(244,114,182,0.25)",
  },
  {
    key: "english",
    ar: "اللغة الإنجليزية",
    en: "English Language",
    n: 5,
    tracks: 1,
    tracksLabelAr: "مسار لغة إنجليزية",
    tracksLabelEn: "English Curriculum",
    descAr: "خمس وحدات تركز على التراث، العمل التطوعي، التكنولوجيا، واستيعاب المفردات.",
    descEn: "Heritage, community help, tech in schools, reading comprehension & grammar.",
    color: "#2dd4bf",
    bg: "rgba(45,212,191,0.08)",
    border: "rgba(45,212,191,0.25)",
  },
  {
    key: "philosophy-logic",
    ar: "الفلسفة والمنطق",
    en: "Philosophy & Logic",
    n: 5,
    tracks: 1,
    tracksLabelAr: "مسار التفكير الفلسفي",
    tracksLabelEn: "Reasoning Track",
    descAr: "طبيعة الموقف الفلسفي، التفكير المنطقي، المغالطات الصورية وغير الصورية.",
    descEn: "The philosophical attitude, logical reasoning, and formal/informal fallacies.",
    color: "#c084fc",
    bg: "rgba(192,132,252,0.08)",
    border: "rgba(192,132,252,0.25)",
  },
];

/* How it works steps */
const STEPS = [
  {
    num: "01",
    ar: "ابدأ من محتوى موثوق",
    en: "Start from trusted content",
    dAr: "كتالوج من ست مواد مبني على دليل مذاكرة أصلي محفوظ ببصمة مصدر، وليس كتابًا رسميًا؛ تظهر السجلات عند نشرها في البيئة المتصلة.",
    dEn: "A six-subject catalog mapped to a source-hashed original study guide, not an official textbook; records appear when published in the connected environment.",
    badge: "المصدر الموثوق",
    badgeEn: "Trusted Source",
  },
  {
    num: "02",
    ar: "افهم خطوة بخطوة",
    en: "Understand step by step",
    dAr: "دروس تفكك المفاهيم الصعبة إلى أهداف واضحة مع أمثلة محلولة وتوضيح للأخطاء الشائعة بالعربية والإنجليزية.",
    dEn: "Bite-sized lessons with clear objectives, worked examples, and common mistakes in Arabic and English.",
    badge: "شرح متدرّج",
    badgeEn: "Stepped Learning",
  },
  {
    num: "03",
    ar: "طبّق واسترجع بذكاء",
    en: "Practise and active recall",
    dAr: "أسئلة متنوعة وتحديات وحدات فورية مع تقييم حتمي وتصحيح يشرح سبب الصواب والخطأ لا مجرد علامة.",
    dEn: "Varied questions and unit challenges with deterministic scoring and explanations of why.",
    badge: "تدريب فوري",
    badgeEn: "Active Practice",
  },
  {
    num: "04",
    ar: "راجع في وقته المناسب",
    en: "Review on an optimal schedule",
    dAr: "مواعيد المهارات تأتي من المحاولات، وبطاقاتك المحفوظة تستخدم فواصل مستوحاة من SM-2؛ وهي تقديرات لا تثبت الإتقان.",
    dEn: "Skill dates come from attempts; saved flashcards use SM-2-inspired intervals. These estimates do not prove mastery.",
    badge: "تثبيت الذاكرة",
    badgeEn: "Spaced Retention",
  },
];

/* Core AI Capabilities */
const AI_CAPABILITIES = [
  {
    icon: "✦",
    titleAr: "اشرح لي خطوة بخطوة",
    titleEn: "Step-by-step Explanations",
    descAr: "عند توفر المصدر والمسار، يستخدم المساعد السياق المتصل ويفصل بين ما وجده في المصدر والشرح الإضافي.",
    descEn: "When source and track context are available, the companion uses them and separates source-backed material from supplemental explanation.",
  },
  {
    icon: "◎",
    titleAr: "اختبر فهمي فورًا",
    titleEn: "Instant Quiz Generation",
    descAr: "ينشئ مسودات تدريب قابلة للمراجعة؛ ولا تصبح تقييمًا أو درجة أو مكافأة تلقائيًا.",
    descEn: "Creates reviewable practice drafts; they do not automatically become assessments, grades, or rewards.",
  },
  {
    icon: "◈",
    titleAr: "بطاقات استرجاع نشط",
    titleEn: "Active Recall Flashcards",
    descAr: "تحويل المفاهيم والمصطلحات الصعبة إلى بطاقات مراجعة ذكية تُحفظ في حسابك للمراجعة الدورية.",
    descEn: "Convert difficult terms and theorems into smart flashcards linked to spaced repetition decks.",
  },
  {
    icon: "❖",
    titleAr: "تلخيص وتنظيم الملاحظات",
    titleEn: "Summary & Revision Guides",
    descAr: "ينظم المحتوى المتاح في ملخصات ومسودات مراجعة من دون اختراع أسئلة امتحان أو مواعيد.",
    descEn: "Organizes available content into summaries and revision drafts without inventing exam questions or dates.",
  },
];

/* Features Preview */
const FEATURES = [
  {
    icon: "◈",
    ar: "مسارات منشورة وتقدم محفوظ",
    en: "Published Paths & Saved Progress",
    dAr: "عند نشر الوحدات في قاعدة المحتوى، يُحفظ تقدم حسابك دون استبدال السجلات المفقودة بدروس وهمية.",
    dEn: "When units are published in the content database, account progress is saved without replacing missing records with fake lessons.",
  },
  {
    icon: "◎",
    ar: "مسارات لغوية مستقلة",
    en: "Independent Language Tracks",
    dAr: "العلوم والرياضيات لكلٍّ منهما مساران منفصلان تمامًا؛ التقدم في العربي لا يختلط بالإنجليزي.",
    dEn: "Science and Mathematics each provide dedicated Arabic & English tracks with zero progress cross-bleeding.",
  },
  {
    icon: "✦",
    ar: "تكرار متباعد ذكي (SM-2)",
    en: "Smart Spaced Repetition",
    dAr: "جدولة استرجاع تعتمد على أدائك الحقيقي: الأصعب يعود أبكر، والراسخ يبعد لتثبيت الحفظ.",
    dEn: "Recall scheduling driven by your accuracy: harder items return sooner, solid ones later.",
  },
  {
    icon: "❖",
    ar: "تحفيز وتحديات هادئة",
    en: "Calm Focused Motivation",
    dAr: "مهام قصيرة وتحديات وحدات ومكافآت تحتفل بتقدمك الحقيقي دون تشتيت أو ضغط مصطنع.",
    dEn: "Short missions and unit challenges that celebrate genuine mastery without distracting gamification.",
  },
  {
    icon: "◈",
    ar: "قارئ قرآن من مصدر محدد",
    en: "Verified Quran Reader",
    dAr: "قراءة بنص عثماني من المصدر المعلن وتلاوة عند توفر التسجيل؛ لا نعرض معاني أو تفسيرًا غير موثّق.",
    dEn: "Uthmani text from the identified source and recitation when available; no unverified word meanings or tafsir are presented.",
  },
  {
    icon: "◇",
    ar: "واجهة ثنائية اللغة RTL / LTR",
    en: "Bilingual Polish RTL / LTR",
    dAr: "دعم أصيل للغة العربية والإنجليزية واتجاهات النصوص والخطوط المصممة للقراءة الطويلة.",
    dEn: "Native Arabic RTL and English LTR layouts with bespoke typography built for sustained study.",
  },
];

/* FAQ Preview */
const FAQ_PREVIEW = [
  {
    qAr: "كيف تختلف مسارات العلوم والرياضيات باللغتين؟",
    qEn: "How do the Arabic and English tracks differ for Science and Mathematics?",
    aAr: "العلوم المتكاملة والرياضيات تقدم كلٌّ منهما في مسارين مستقلين: مسار باللغة العربية ومسار باللغة الإنجليزية. الدروس والأسئلة والتقدم في الحساب منفصلة تمامًا، وتغيير لغة الواجهة لا يغير مسارك الدراسي المختار.",
    aEn: "Integrated Science and Mathematics are each delivered in two independent tracks: Arabic-medium and English-medium. Lessons, question banks and learner progress are kept entirely isolated; changing your UI language never alters your selected curriculum track.",
  },
  {
    qAr: "هل المحتوى مطابق للكتاب المدرسي حرفيًا؟",
    qEn: "Is the content a verbatim copy of the official school textbook?",
    aAr: "المحتوى مبني على دليل مذاكرة أصلي ومفصّل يشرح الأفكار والقوانين بوضوح وأمانة، وليس نسخة منسوخة حرفيًا من الكتب المدرسية؛ ننصح دائمًا بمراجعة الكتاب المدرسي معه، ونبين مصدر كل درس بوضوح.",
    aEn: "Our lessons are built from an original detailed study guide that explains principles, equations and concepts clearly, rather than copying textbooks verbatim. We always recommend reading it alongside official textbooks and preserve lesson provenance.",
  },
  {
    qAr: "كيف يعمل التكرار المتباعد في المراجعة؟",
    qEn: "How does spaced repetition work in the review decks?",
    aAr: "مراجعة المهارات تُجدول من المحاولات، وبطاقات الاسترجاع المحفوظة تستخدم تقييم مرة أخرى/صعب/جيد/سهل في خوارزمية مستوحاة من SM-2. الفواصل تقديرية ولا تعني الإتقان.",
    aEn: "Skill review is scheduled from attempts; saved flashcards use Again/Hard/Good/Easy ratings in an SM-2-inspired algorithm. Intervals are estimates and do not mean mastery.",
  },
  {
    qAr: "هل إجابات المساعد الذكي مضمونة؟ وماذا لو حدث خطأ؟",
    qEn: "Are AI companion answers guaranteed, and what if an error occurs?",
    aAr: "المساعد الذكي أداة مساعدة تعمل وفق أنماط دراسية محددة ومقيدة بالمنهج، لكنه ليس بديلاً عن التأكد. في حال وجود أي ملحوظة، يمكنك استخدام زر التغذية الراجعة أو التواصل المباشر مع الدعم الفني.",
    aEn: "The AI companion works in clearly constrained study modes grounded in curriculum sources, but is not infallible. Users can flag answers, view reasoned justifications, or reach support directly through our Help Center.",
  },
];

export function HomeMarketing() {
  const t = useTranslation();
  const locale = useLocale();
  const isRtl = locale === "ar";

  return (
    <MarketingShell tone="dark">
      <div className="p-home-wrap">
        {/* HERO SECTION — Wide Canvas, Full-Bleed Creative Experience */}
        <section className="p-hero-atmosphere" aria-label={t("الرئيسية", "Home")}>
          <div className="orb orb-1" aria-hidden="true" />
          <div className="orb orb-2" aria-hidden="true" />
          <div className="orb orb-3" aria-hidden="true" />

          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 md:px-12 relative z-10">
            {/* Top Headline Canvas */}
            <div className="max-w-4xl mx-auto text-center mb-12">
              <span className="p-eyebrow">
                {t("منظومة التعلّم الذكية الأولى لطلاب مصر 2026–2027", "The Intelligent Learning Ecosystem for Egypt 2026–2027")}
              </span>

              <h1 className="p-h1 mx-auto text-center">
                <span className="p-h1-lead">
                  {t("افهمه بعمق. طبّقه باحتراف. احفظه للأبد.", "Understand it deeply. Practise it. Remember it forever.")}
                </span>
                <span className="p-h1-next">
                  {t("وافهم خطوتك التالية في كل مادة.", "And master your next step in every subject.")}
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-[#cbd5e1] leading-relaxed mb-8 max-w-3xl mx-auto">
                {t(
                  "نقطة منصة تعلّم تجمع منهج الصف الأول الثانوي — الترم الأول 2026–2027 في ست مواد دراسية مع مسارات لغوية مستقلة للعلوم والرياضيات، ومراجعة مجدولة بالتكرار المتباعد، ومساعد ذكي Noäta AI يشرح ويختبر ويراجع معك خطوة بخطوة.",
                  "Noäta is an intelligent learning ecosystem uniting the First Secondary Term 1 (2026–2027) curriculum across six subjects with dedicated language tracks, spaced repetition, and an AI study companion that explains, quizzes and reviews with you step by step.",
                )}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3.5 mb-8">
                <Link
                  className="p-cta-primary text-base px-8 py-3.5 font-bold shadow-xl shadow-indigo-500/25"
                  href="/signup"
                >
                  <span>{t("ابدأ التعلم الآن مجانًا", "Start learning free now")}</span>
                  <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
                </Link>
                <Link
                  className="p-cta-secondary text-base px-6 py-3.5 font-semibold"
                  href="/features"
                >
                  {t("استكشف المزايا والمنهج", "Explore features & curriculum")}
                </Link>
              </div>

              {/* Verified Metadata Badges */}
              <div
                className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#cbd5e1]"
                aria-label={t("نطاق كتالوج المواد", "Subject catalog scope")}
              >
                {[
                  t("🇪🇬 منهج مصر 2026–2027", "🇪🇬 Egypt 2026–2027"),
                  t("الصف الأول الثانوي", "First Secondary"),
                  t("الترم الأول", "Term 1"),
                  t("٦ عائلات مواد", "6 Subject Families"),
                  t("٨ مسارات لغوية مستقلة", "8 Independent Tracks"),
                  t("تكرار متباعد SM-2", "SM-2 Spaced Recall"),
                ].map((badge) => (
                  <span
                    key={badge}
                    className="px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] font-medium"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Signature Full-Width Interactive Knowledge Map */}
            <Reveal>
              <div className="p-glass shadow-2xl relative overflow-hidden border border-white/[0.12] p-5 sm:p-8 rounded-3xl">
                <KnowledgeMap />
              </div>
            </Reveal>
          </div>
        </section>

        <div className="p-section-divider" />

        {/* SECTION A: THE CORE PHILOSOPHY & PROMISE */}
        <section className="p-section">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="p-eyebrow">{t("فلسفة نقطة التعليمية", "The Noäta Learning Philosophy")}</span>
              <h2 className="p-h2 mb-4">
                {t("من مجرد القراءة إلى الإتقان الدائم", "From Passive Reading to Lasting Mastery")}
              </h2>
              <p className="text-[#94a3b8] text-base md:text-lg leading-relaxed">
                {t(
                  "لا يكتمل التعلّم بقراءة ملخص أو مشاهدة فيديو؛ يحتاج الطالب لفهم البنية، وتطبيقها فوريًا، وتلقي تفسير لأخطائه، ثم مراجعتها بجدولة ذكية قبل أن تُنسى.",
                  "Learning is never completed by merely skimming notes or watching videos. Learners need to deconstruct concepts, practise immediately, receive reasoned corrections, and review on a scheduled interval before forgetting sets in.",
                )}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((step) => (
                <article
                  key={step.num}
                  className="p-glass relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                      {locale === "en" ? step.badgeEn : step.badge}
                    </span>
                    <span className="text-3xl font-black text-white/10">{step.num}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {locale === "en" ? step.en : step.ar}
                  </h3>
                  <p className="text-sm text-[#94a3b8] leading-relaxed flex-1">
                    {locale === "en" ? step.dEn : step.dAr}
                  </p>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        <div className="p-section-divider" />

        {/* SECTION B: SIX CORE SUBJECTS & DUAL TRACKS */}
        <section className="p-section" id="curriculum">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="p-eyebrow">{t("المنهج الدراسي المتكامل", "The Six Subject Families")}</span>
              <h2 className="p-h2 mb-4">
                {t("ست مواد دراسية، بمسارات لغوية مستقلة", "Six Subjects, Independent Language Tracks")}
              </h2>
              <p className="text-[#94a3b8] text-base leading-relaxed">
                {t(
                  "العلوم المتكاملة والرياضيات تتوفران بمسارين منفصلين تمامًا (عربي وإنجليزي). الدروس والأسئلة وتقدمك في الحساب مستقلة ولن تختلط أبدًا.",
                  "Integrated Science and Mathematics each offer two distinctly selectable tracks. Lessons, question banks and progress stay strictly isolated without cross-bleeding.",
                )}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SUBJECTS.map((subject) => (
                <div
                  key={subject.key}
                  className="p-glass rounded-2xl p-6 transition-all hover:scale-[1.02] border"
                  style={{
                    backgroundColor: subject.bg,
                    borderColor: subject.border,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${subject.color}20`,
                        color: subject.color,
                        border: `1px solid ${subject.color}40`,
                      }}
                    >
                      {locale === "en" ? subject.tracksLabelEn : subject.tracksLabelAr}
                    </span>
                    <span className="text-xs font-semibold text-[#94a3b8]">
                      {subject.n} {t("دروس كاملة", "lessons")}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">
                    {locale === "en" ? subject.en : subject.ar}
                  </h3>

                  <p className="text-xs md:text-sm text-[#cbd5e1] leading-relaxed mb-6">
                    {locale === "en" ? subject.descEn : subject.descAr}
                  </p>

                  <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                    <Link
                      href={`/signup?subject=${subject.key}`}
                      className="text-xs font-bold text-white hover:underline flex items-center gap-1"
                      style={{ color: subject.color }}
                    >
                      <span>{t("ابدأ دراسة هذا المسار مجانًا", "Start this track free")}</span>
                      <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
                    </Link>
                    <span className="text-[11px] text-[#94a3b8]">
                      {subject.tracks > 1 ? (locale === "en" ? "AR + EN" : "عربي + إنجليزي") : (locale === "en" ? "Single track" : "مسار موحد")}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center max-w-2xl mx-auto">
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                {t(
                  "ملاحظة أمانة علمية: المحتوى مبني على دليل مذاكرة أصلي ومفصل لكل مادة مع حفظ مصدره وربطه بمنهج الترم الأول 2026–2027، ونوصي دائمًا بالاستعانة بالكتاب المدرسي معه.",
                  "Academic Honesty Note: All lessons are built from an authentic detailed study pack for each subject with preserved provenance, designed to accompany official textbooks.",
                )}
              </p>
            </div>
          </Reveal>
        </section>

        <div className="p-section-divider" />

        {/* SECTION C: NOATA AI WORKSPACE & STUDY COMPANION */}
        <section className="p-section" id="ai">
          <Reveal>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="p-eyebrow">{t("المساعد الدراسي المتخصص", "The Intelligent Study Companion")}</span>
                <h2 className="p-h2 mb-4">
                  {t("ذكاء اصطناعي يفهم أين أنت وماذا تحتاج", "AI Grounded in Your Specific Curriculum")}
                </h2>
                <p className="text-[#94a3b8] text-base leading-relaxed mb-8">
                  {t(
                    "ليس مجرد روبوت محادثة عائم؛ مساعد Noäta AI يعرف مادتك الدراسية، ومسارك المختار، والدرس الذي تدرسه حاليًا. يمكنك أن تطلب منه شرح فكرة، أو اختبار فهمك، أو إنشاء بطاقات مراجعة، أو تحليل خطأ ارتكبته في تدريب.",
                    "Not an ungrounded chatbot: Noäta AI is aware of your current subject, chosen track, and active lesson. Ask it to explain difficult concepts, quiz your retention, generate review flashcards, or deconstruct why you missed a practice question.",
                  )}
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  {AI_CAPABILITIES.map((cap) => (
                    <div
                      key={cap.titleEn}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]"
                    >
                      <div className="text-xl mb-2 text-indigo-400">{cap.icon}</div>
                      <h4 className="font-bold text-sm text-white mb-1">
                        {locale === "en" ? cap.titleEn : cap.titleAr}
                      </h4>
                      <p className="text-xs text-[#94a3b8] leading-relaxed">
                        {locale === "en" ? cap.descEn : cap.descAr}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <Link href="/signup?feature=ai" className="p-cta-primary text-sm font-bold">
                    <span>{t("جرّب مساعد Noäta AI مجانًا", "Start with Noäta AI free")}</span>
                    <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
                  </Link>
                  <Link href="/features#ai" className="p-cta-secondary text-sm font-semibold">
                    {t("تفاصيل القدرات الذكية", "AI Capabilities Matrix")}
                  </Link>
                </div>
              </div>

              {/* AI Interactive Demo Simulation Card */}
              <div className="p-glass p-6 rounded-2xl border border-indigo-500/30 shadow-2xl relative">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white">Noäta AI · Study Session</span>
                  </div>
                  <span className="text-[11px] text-[#818cf8] font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    Integrated Science (AR)
                  </span>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#e2e8f0]">
                    <span className="block text-[10px] text-[#94a3b8] mb-1">{t("أنت", "You")}</span>
                    {t("ليه الماء مذيب قطبي قوي؟ وازاي بتأثر الروابط الهيدروجينية على درجة غليانه؟", "Why is water a strong polar solvent, and how do hydrogen bonds affect its boiling point?")}
                  </div>

                  <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[#f1f5f9] space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-indigo-300 font-semibold">
                      <span>Noäta AI Tutor</span>
                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/20">Source: Lesson 1 · Water Properties</span>
                    </div>
                    <p className="leading-relaxed">
                      {t(
                        "١. القطبية: زاوية جزيء الماء (104.5°) وفرق السالبية الكهربية بين الأكسجين والهيدروجين يخلقان شحنات جزئية تسمح بجذب الأيونات وفصلها.",
                        "1. Polarity: The 104.5° bond angle and electronegativity difference create partial charges that pull ions apart in solution.",
                      )}
                    </p>
                    <p className="leading-relaxed">
                      {t(
                        "٢. درجة الغليان: تماسك الروابط الهيدروجينية بين الجزيئات يتطلب طاقة حرارية عالية لكسرها، مما يرفع درجة الغليان إلى 100°C.",
                        "2. Boiling Point: Cohesion from intermolecular hydrogen bonds requires high thermal energy to break, elevating boiling point to 100°C.",
                      )}
                    </p>
                    <div className="pt-2 flex flex-wrap gap-2 text-[10px]">
                      <button type="button" className="px-2 py-1 rounded bg-white/[0.08] hover:bg-white/[0.15] text-white">
                        {t("✦ أنشئ بطاقة مراجعة", "✦ Create Flashcard")}
                      </button>
                      <button type="button" className="px-2 py-1 rounded bg-white/[0.08] hover:bg-white/[0.15] text-white">
                        {t("◎ اختبرني في هذا المفهوم", "◎ Quiz Me on This")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <div className="p-section-divider" />

        {/* SECTION D: FEATURES ECOSYSTEM */}
        <section className="p-section">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="p-eyebrow">{t("منظومة أدوات متكاملة", "Built for Long-term Learning")}</span>
              <h2 className="p-h2 mb-4">
                {t("أدوات صُممت لتتكامل معًا", "Tools Engineered to Work Together")}
              </h2>
              <p className="text-[#94a3b8] text-base leading-relaxed">
                {t(
                  "كل جزء في نقطة يخدم المرحلة التالية؛ ما تدرسه يتحول إلى تدريب، وما تخطئ فيه يعود في المراجعة المجدولة.",
                  "Every tool connects to the next stage of the learning loop: lessons lead to drills, drills feed spaced review decks, and review builds lasting mastery.",
                )}
              </p>
            </div>

            <div className="p-features-grid">
              {FEATURES.map((feature) => (
                <article key={feature.en} className="p-glass">
                  <div className="text-2xl mb-3 text-indigo-400">{feature.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {locale === "en" ? feature.en : feature.ar}
                  </h3>
                  <p className="text-sm text-[#94a3b8] leading-relaxed">
                    {locale === "en" ? feature.dEn : feature.dAr}
                  </p>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        <div className="p-section-divider" />

        {/* SECTION E: FAQ PREVIEW */}
        <section className="p-section" id="faq-preview">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="p-eyebrow">{t("وضوح وشفافية", "Clarity & Trust")}</span>
              <h2 className="p-h2 mb-3">
                {t("أسئلة شائعة وإجابات صريحة", "Frequently Asked Questions")}
              </h2>
              <p className="text-[#94a3b8] text-sm md:text-base">
                {t(
                  "إجابات واضحة عن المنهج، والمسارات المستقلة، والتكرار المتباعد، وسياسة الدعم.",
                  "Clear answers about curriculum tracks, spaced repetition algorithms, and student support.",
                )}
              </p>
            </div>

            <div className="p-faq max-w-3xl mx-auto">
              {FAQ_PREVIEW.map((item) => (
                <details key={item.qEn} className="group">
                  <summary className="text-sm md:text-base flex items-center justify-between">
                    <span>{locale === "en" ? item.qEn : item.qAr}</span>
                    <span className="text-indigo-400 transition-transform group-open:rotate-180">▾</span>
                  </summary>
                  <p className="text-xs md:text-sm text-[#cbd5e1] leading-relaxed mt-2.5 pt-2 border-t border-white/[0.05]">
                    {locale === "en" ? item.aEn : item.aAr}
                  </p>
                </details>
              ))}
            </div>

            <div className="text-center mt-8 flex items-center justify-center gap-4">
              <Link className="p-cta-secondary text-sm font-semibold" href="/faq">
                {t("عرض كل الأسئلة الشائعة", "Browse all FAQs")}
              </Link>
              <Link className="p-cta-secondary text-sm font-semibold" href="/help">
                {t("زيارة مركز المساعدة", "Visit Help Center")}
              </Link>
            </div>
          </Reveal>
        </section>

        {/* SECTION F: HIGH-IMPACT FINAL CTA */}
        <section className="py-20 px-6 md:px-10" aria-label="Call to action">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#0f172a] p-10 md:p-16 text-center shadow-2xl border border-indigo-500/30 max-w-5xl mx-auto">
              <div
                className="absolute top-0 left-0 w-80 h-80 bg-indigo-500 opacity-20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500 opacity-20 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none"
                aria-hidden="true"
              />

              <div className="relative z-10 max-w-2xl mx-auto">
                <span className="text-xs uppercase tracking-widest text-indigo-300 font-bold mb-3 inline-block">
                  {t("ابدأ اليوم خطوتك القادمة", "Take your next learning step today")}
                </span>
                <h2 className="p-h2 mb-4 text-white">
                  {t("جاهز للانتقال من الحفظ العشوائي إلى الإتقان الحقيقي؟", "Ready for Structured, Purposeful Learning?")}
                </h2>
                <p className="text-[#cbd5e1] text-sm md:text-base mb-8 leading-relaxed">
                  {t(
                    "أنشئ حسابك المجاني، واختر مسارك الدراسي، وابدأ رحلتك من أول درس مع مراجعة مجدولة تحفظ وقتك وجهدك.",
                    "Create your free account, select your curriculum track, and embark on structured lessons with scheduled recall that protects your study time.",
                  )}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link
                    className="p-cta-primary text-base px-8 py-3.5 font-bold shadow-xl shadow-indigo-500/30"
                    href="/signup"
                  >
                    <span>{t("ابدأ التعلم الآن مجانًا", "Start learning free now")}</span>
                    <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
                  </Link>
                  <Link
                    className="p-cta-secondary text-base px-6 py-3.5 font-semibold"
                    href="/curriculum"
                  >
                    {t("تصفح تفاصيل المنهج", "Browse curriculum details")}
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </MarketingShell>
  );
}
