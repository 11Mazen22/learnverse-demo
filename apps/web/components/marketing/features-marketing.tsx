"use client";

import Link from "next/link";
import { MarketingShell, Reveal } from "./marketing-shell";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { SUBJECT_CATALOG, TRACK_CATALOG, contentLanguageLabel } from "@/lib/curriculum/catalog";

const TRACK_ROWS = [
  { subject: "integrated-science", lessons: 5, questions: 23 },
  { subject: "mathematics", lessons: 5, questions: 23 },
  { subject: "history", lessons: 5, questions: 22 },
  { subject: "arabic-language", lessons: 11, questions: 36 },
  { subject: "english", lessons: 5, questions: 23 },
  { subject: "philosophy-logic", lessons: 5, questions: 22 },
];

const CAPABILITIES = [
  {
    icon: "◈",
    ar: "مسارات لغوية مستقلّة تمامًا",
    en: "Independent Language Tracks",
    dAr: "العلوم المتكاملة والرياضيات تتوفر كلٌّ منهما بمسارين منفصلين (عربي وإنجليزي). الدروس والأسئلة ودرجات التقدم لكل مسار منفصلة ولن تختلط أبدًا.",
    dEn: "Integrated Science and Mathematics each offer two distinctly isolated tracks (Arabic and English). Lessons, drills and progress stay strictly isolated.",
    emphasis: true,
  },
  {
    icon: "◎",
    ar: "تعلّم نشط واسترجاع فوري",
    en: "Active Recall & Quizzes",
    dAr: "أسئلة تدريبية مباشرة بعد كل فكرة، وتحديات للوحدات، ونظام تصحيح حتمي يشرح سبب الصواب ويفكك المغالطات التي أدت للخطأ.",
    dEn: "Immediate practice drills after every concept, unit challenges, and deterministic scoring that explains the reasoning behind correct and wrong answers.",
    emphasis: false,
  },
  {
    icon: "◇",
    ar: "مراجعة مجدولة بالتكرار المتباعد",
    en: "Scheduled Spaced Retention (SM-2)",
    dAr: "مراجعة المهارات تعتمد على المحاولات، وبطاقاتك المحفوظة تستخدم فواصل مستوحاة من SM-2. هذه المواعيد تقديرية ولا تضمن الحفظ أو الإتقان.",
    dEn: "Skill review uses recorded attempts; saved flashcards use SM-2-inspired intervals. Dates are estimates and do not guarantee retention or mastery.",
    emphasis: false,
  },
  {
    icon: "✦",
    ar: "مساعد Noäta AI الموجه للمنهج",
    en: "Grounded AI Study Companion",
    dAr: "اشرح لي، اختبرني، أنشئ بطاقات، ولخص — وعند توفر السجلات يستخدم المساعد المسار والتقدم المتحققين، ويصرّح بغياب المصدر بدل اختراعه.",
    dEn: "Explain, quiz me, flashcards, summarize — when records are available, the companion uses verified track and progress context and discloses missing sources instead of inventing them.",
    emphasis: true,
  },
  {
    icon: "❖",
    ar: "قارئ قرآن من مصدر محدد",
    en: "Verified Quran Reader",
    dAr: "نص عثماني من المصدر المعلن وتلاوة عند توفر التسجيل؛ لا تُعرض معاني أو تفاسير غير موثّقة داخل القارئ.",
    dEn: "Uthmani text from the identified source and recitation when available; no unverified meanings or tafsir are shown in the reader.",
    emphasis: false,
  },
  {
    icon: "◈",
    ar: "واجهة ثنائية اللغة وتصميم شاشات عريضة",
    en: "Bilingual Polish & Wide Layouts",
    dAr: "دعم كامل للغتين العربية والإنجليزية، واتجاه كامل RTL وLTR، وتصميم مريح للعين يتسع للشاشات الكبيرة دون مساحات فارغة.",
    dEn: "Complete Arabic and English interface with full RTL/LTR typography, optimized for wide screens with balanced, expansive layouts.",
    emphasis: false,
  },
];

const AI_MODES = [
  {
    mode: "01",
    icon: "✦",
    titleAr: "نمط الشرح التفاعلي",
    titleEn: "Step-by-step Explanation",
    descAr: "يفكك المفهوم إلى خطوات، ويستخدم سياق الدرس المتصل عند توفره مع توضيح حدود المصدر.",
    descEn: "Breaks a concept into steps and uses connected lesson context when available while stating source limits.",
  },
  {
    mode: "02",
    icon: "◎",
    titleAr: "نمط الاختبار والتدريب",
    titleEn: "Instant Quiz Generation",
    descAr: "ينشئ تدريبًا تفاعليًا كمسودة؛ لا يصبح درجة أو إتقانًا أو مكافأة من دون مسار تقييم الخادم.",
    descEn: "Creates interactive practice as a draft; it does not become a grade, mastery event, or reward without the server assessment workflow.",
  },
  {
    mode: "03",
    icon: "◇",
    titleAr: "بطاقات استرجاع نشط",
    titleEn: "Active Recall Flashcards",
    descAr: "يحول المصطلحات والقوانين الصعبة إلى بطاقات مراجعة رقمية تُجدول على نظام التكرار المتباعد.",
    descEn: "Transforms challenging formulas and definitions into flashcards tied to your spaced recall deck.",
  },
  {
    mode: "04",
    icon: "❖",
    titleAr: "تلخيص الوحدات المركزة",
    titleEn: "High-Yield Summaries",
    descAr: "ينظم المحتوى المتاح في نقاط مراجعة من دون اختراع أسئلة امتحان أو ادعاء اكتمال مصدر مفقود.",
    descEn: "Organizes available content into review points without inventing exam questions or claiming a missing source is complete.",
  },
];

const FAQ = [
  {
    categoryAr: "المسارات اللغوية",
    categoryEn: "Language Tracks",
    qAr: "ما الفرق بين المسار العربي والمسار الإنجليزي في العلوم والرياضيات؟",
    qEn: "What is the difference between the Arabic and English tracks in Science and Mathematics?",
    aAr: "كل مسار دروس وأسئلة ومهارات وتقدّم مستقل تمامًا، تمامًا كأنهما مقرران منفصلان. النسخة الإنجليزية ترجمة صريحة لنفس المصدر العربي، وليست كتابًا رسميًا بالإنجليزية، وتُعرض هذه الملاحظة داخل المحتوى نفسه.",
    aEn: "Each track has entirely independent lessons, questions, skills and progress — as if they were separate courses. The English edition is an explicit rendering of the same Arabic source, not an official English textbook, and that note appears inside the content itself.",
  },
  {
    categoryAr: "أمانة المرجع",
    categoryEn: "Syllabus Source",
    qAr: "هل المحتوى مطابق للكتاب المدرسي؟ ومن أين جاءت الدروس؟",
    qEn: "Does the content match the school textbook, and where do lessons come from?",
    aAr: "المحتوى مبني على دليل مذاكرة أصلي ومفصّل يشرح الأفكار والقواعد خطوة بخطوة، وليس نسخة حرفية من الكتب المدرسية. ننصح دائمًا بالاستعانة بالكتاب المدرسي معه، ونبين مرجعية كل درس بوضوح داخل المنصة.",
    aEn: "The content is built from an authentic, comprehensive study pack explaining ideas step by step — not a verbatim textbook copy. We always advise using it alongside the school textbook, with clear citations preserved.",
  },
  {
    categoryAr: "مساعد Noäta AI",
    categoryEn: "AI Companion",
    qAr: "هل يتعلّم المساعد الذكي من تقدّمي ومساري الدراسي الحقيقي؟",
    qEn: "Does the AI companion learn from my actual progress and track?",
    aAr: "عندما تتوفر جداول المسارات وسجلات الحساب، يحمّل الخادم سياقًا محدودًا من المسار والتقدم وأدلة المهارة. عند غيابها يصرّح بعدم وجود دليل ولا يخترع تقدمًا.",
    aEn: "When track tables and account records are available, the server loads bounded track, progress, and skill context. If unavailable, it states that no evidence exists rather than inventing progress.",
  },
  {
    categoryAr: "إدارة الحساب",
    categoryEn: "Account & Tracks",
    qAr: "هل يمكنني تغيير المسار الدراسي لاحقًا؟",
    qEn: "Can I switch learning tracks later?",
    aAr: "نعم، يمكنك التبديل بين المسارات بحرية في أي وقت من إعدادات حسابك. ولكن تجدر الإشارة إلى أن تقدم كل مسار مستقل تمامًا عن الآخر؛ فالدرجات والدروس المنجزة في مسار لا تنتقل للمسار الآخر لضمان دقة قياس الإتقان.",
    aEn: "Yes, you can freely switch tracks at any time in settings. However, progress in each track remains completely isolated; scores and finished lessons do not carry over across tracks to ensure genuine mastery.",
  },
  {
    categoryAr: "واجهة الاستخدام",
    categoryEn: "UI & Languages",
    qAr: "بأي لغة تعمل المنصة وهل تغيير اللغة يغير دراستي؟",
    qEn: "Which languages are supported and does changing language alter my study?",
    aAr: "المنصة ثنائية اللغة بالكامل (عربي وإنجليزي). زر تغيير اللغة في الشريط العلوي يغيّر فقط لغة الواجهة وعناصر التحكم، دون أن يغير أو يؤثر على مسارك الدراسي المختار في حسابك.",
    aEn: "The platform is fully bilingual (Arabic and English). The language toggle in the header switches interface labels and controls only, without altering your selected curriculum track.",
  },
];

export function FeaturesMarketing() {
  const t = useTranslation();
  const locale = useLocale();
  const isRtl = locale === "ar";

  const rows = TRACK_ROWS.flatMap((row) =>
    TRACK_CATALOG.filter((track) => track.subject === row.subject).map((track) => ({
      ...row,
      track,
    })),
  );

  const totalLessons = TRACK_ROWS.reduce(
    (sum, row) => sum + row.lessons * (row.subject === "integrated-science" || row.subject === "mathematics" ? 2 : 1),
    0,
  );
  const totalQuestions = TRACK_ROWS.reduce(
    (sum, row) => sum + row.questions * (row.subject === "integrated-science" || row.subject === "mathematics" ? 2 : 1),
    0,
  );

  return (
    <MarketingShell tone="dark">
      {/* Hero Section */}
      <section className="mp-section" data-size="loose">
        <Reveal>
          <div className="mp-head mp-head-center">
            <span className="mp-eyebrow">{t("المزايا والقدرات الشاملة", "Features & Curriculum")}</span>
            <h2>{t("منهج حقيقي، ومسارات مستقلّة، وذكاء يعرف أين أنت", "A Real Curriculum, Independent Tracks & AI That Knows Where You Are")}</h2>
            <p className="mp-lede">
              {t(
                "نقطة تجمع المنهج المدرسي، والتدريب الفوري، والمراجعة المجدولة بالتكرار المتباعد، والمساعد الذكي في نظام واحد متكامل؛ اختر مادتك ومسارك، افهم الدرس، طبّق، ثم راجع في الوقت المثالي.",
                "Noäta unites the school curriculum, active drill scoring, scheduled spaced review, and an intelligent companion into one cohesive system: choose your track, understand the lesson, practise, and retain.",
              )}
            </p>
          </div>

          <div className="mp-metrics" style={{ marginBlockStart: "var(--mp-space-5)" }}>
            {[
              { n: "6", ar: "عائلات مواد", en: "Subject Families" },
              { n: "8", ar: "مسارات لغوية مستقلّة", en: "Independent Tracks" },
              { n: String(totalLessons), ar: "درسًا مفصلاً في المنهج", en: "Published Lessons" },
              { n: String(totalQuestions), ar: "سؤالًا تدريبيًا مع التعليل", en: "Drills with Reasoning" },
            ].map((metric) => (
              <div className="mp-metric" key={metric.ar}>
                <b>{metric.n}</b>
                <span>{locale === "en" ? metric.en : metric.ar}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Section 1: Core Platform Capabilities */}
      <section className="mp-section">
        <Reveal>
          <div className="mp-head mp-head-center">
            <span className="mp-eyebrow">{t("القدرات الأساسية", "Core Pillars")}</span>
            <h2>{t("أدوات صُممت لتتكامل وتخدم تفوقك", "Tools Engineered to Work Together")}</h2>
            <p className="mp-lede">
              {t(
                "كل ميزة في نقطة مبنية لخدمة خطوتك القادمة؛ ما تدرسه يتحول إلى تدريب، وما تخطئ فيه يُجدول للمراجعة، ومساعد Noäta AI حاضر في كل مرحلة.",
                "Every feature in Noäta powers your next learning milestone: lessons feed practice, errors trigger spaced recall, and Noäta AI guides you at each step.",
              )}
            </p>
          </div>

          <div className="mp-cards">
            {CAPABILITIES.map((capability) => (
              <article
                className="mp-card"
                key={capability.en}
                data-emphasis={capability.emphasis ? "true" : "false"}
              >
                <span className="mp-card-icon" aria-hidden="true">{capability.icon}</span>
                <h3>{locale === "en" ? capability.en : capability.ar}</h3>
                <p>{locale === "en" ? capability.dEn : capability.dAr}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Section 2: AI Study Modes & Interactive Simulator */}
      <section className="mp-section" id="ai">
        <Reveal>
          <div className="mp-head mp-head-center">
            <span className="mp-eyebrow">{t("المساعد الدراسي الذكي", "Intelligent Study Companion")}</span>
            <h2>{t("أربعة أنماط دراسية لمساعد Noäta AI", "Four Purpose-Built Study Modes")}</h2>
            <p className="mp-lede">
              {t(
                "المساعد في نقطة ليس روبوت دردشة عام، بل معلم شخصي يتقيد بمنهجك ويساعدك في أربعة مجالات محددة:",
                "Not a generic chatbot: Noäta AI is a personal study tutor constrained to your active syllabus in four key domains:",
              )}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto w-full mb-12">
            {AI_MODES.map((m) => (
              <div key={m.mode} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-indigo-500/40 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-xs font-mono font-bold text-indigo-400">{m.mode}</span>
                </div>
                <h3 className="font-bold text-white text-base mb-2">
                  {locale === "en" ? m.titleEn : m.titleAr}
                </h3>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  {locale === "en" ? m.descEn : m.descAr}
                </p>
              </div>
            ))}
          </div>

          {/* Interactive AI Simulation Card */}
          <div className="p-glass p-6 sm:p-8 rounded-3xl border border-indigo-500/30 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white">Noäta AI · Study Session</span>
              </div>
              <span className="text-[11px] text-[#818cf8] font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Mathematics (AR) · Quadratic Roots
              </span>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[#e2e8f0]">
                <span className="block text-[10px] text-[#94a3b8] mb-1">{t("أنت", "You")}</span>
                {t(
                  "ازاي أعرف نوع جذري المعادلة التربيعية باستخدام المميز (b² - 4ac)؟",
                  "How do I determine the nature of quadratic roots using the discriminant (b² - 4ac)?",
                )}
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[#f1f5f9] space-y-2">
                <div className="flex items-center justify-between text-[10px] text-indigo-300 font-semibold">
                  <span>Noäta AI Tutor</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20">Source: Lesson 3 · Nature of Quadratic Roots</span>
                </div>
                <p className="leading-relaxed">
                  {t(
                    "المميز Δ = b² - 4ac يحدد نوع الجذور من خلال ثلاث حالات دقيقة:",
                    "The discriminant Δ = b² - 4ac reveals the nature of roots through three clear cases:",
                  )}
                </p>
                <ul className="space-y-1.5 list-disc list-inside text-[#cbd5e1]">
                  <li>{t("إذا كان المميز > 0: الجذران حقيقيان مختلفان.", "If Δ > 0: Two distinct real roots.")}</li>
                  <li>{t("إذا كان المميز = 0: الجذران حقيقيان متساويان.", "If Δ = 0: Two equal real roots.")}</li>
                  <li>{t("إذا كان المميز < 0: الجذران مركبان مترافقان وغير حقيقيين.", "If Δ < 0: Two non-real complex conjugate roots.")}</li>
                </ul>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
                  <Link href="/signup?track=mathematics-ar" className="px-3 py-1.5 rounded-lg bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-600/50 transition-colors font-medium">
                    {t("◎ طبّق على مسار الرياضيات", "◎ Practice on Math Track")}
                  </Link>
                  <Link href="/how" className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white hover:bg-white/[0.12] transition-colors">
                    {t("كيف تعمل دورة الإتقان؟", "How does the mastery loop work?")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Section 3: Master Curriculum Tracks Table */}
      <section className="mp-section" id="curriculum">
        <Reveal>
          <div className="mp-head mp-head-center">
            <span className="mp-eyebrow">{t("خريطة المنهج والمسارات", "Curriculum Matrix")}</span>
            <h2>{t("ست عائلات مواد — وثمانية مسارات مستقلة", "Six Subject Families — Eight Independent Tracks")}</h2>
            <p className="mp-lede">
              {t(
                 "عند نشر المسار في قاعدة المحتوى، يملك دروسه وأسئلته وتقدمه المستقل. الأرقام أدناه سجلات مرشحة في الهجرة وليست إثبات تفعيل البيئة:",
                 "When published in the content database, each track owns isolated lessons, questions, and progress. Counts below are candidate migration records, not proof that an environment is active:",
              )}
            </p>
          </div>

          <div className="mp-table max-w-5xl mx-auto">
            <table>
              <caption>
                {t(
                  "المحتوى من الصف الأول الثانوي — الترم الأول 2026–2027، مبني على دليل مذاكرة أصلي معروف المصدر، مع مسارات لغوية مستقلة.",
                   "Candidate First Secondary Term 1 records mapped to the source-hashed study guide. This is not an official textbook or deployment-status claim.",
                )}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t("المادة", "Subject")}</th>
                  <th scope="col">{t("المسار", "Track")}</th>
                  <th scope="col">{t("لغة المحتوى", "Content language")}</th>
                  <th scope="col">{t("الدروس", "Lessons")}</th>
                  <th scope="col">{t("الأسئلة", "Questions")}</th>
                  <th scope="col">{t("ابدأ التعلم", "Action")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const subject = SUBJECT_CATALOG.find((item) => item.key === row.subject);
                  const subjectTitle = subject
                    ? locale === "en"
                      ? subject.titleEn
                      : subject.titleAr
                    : row.track.subject;
                  return (
                    <tr key={row.track.slug}>
                      <td className="mp-subject font-bold text-white">{subjectTitle}</td>
                      <td>
                        <span className="mp-track-badge" data-lang={row.track.contentLanguage}>
                          {contentLanguageLabel(row.track.contentLanguage, locale)}
                        </span>
                      </td>
                      <td>{contentLanguageLabel(row.track.contentLanguage, locale)}</td>
                      <td className="mp-num">{row.lessons}</td>
                      <td className="mp-num">{row.questions}</td>
                      <td>
                        <Link
                          href={`/signup?track=${row.track.slug}`}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition-colors inline-block whitespace-nowrap"
                        >
                          {t("ابدأ مجانًا", "Start free")}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/curriculum"
              className="mp-btn mp-btn-ghost"
            >
              <span>{t("استكشف تفاصيل المنهج والوحدات", "Explore Curriculum & Units")}</span>
              <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Section 4: Quick Methodology Preview */}
      <section className="mp-section" id="how">
        <Reveal>
          <div className="mp-head mp-head-center">
            <span className="mp-eyebrow">{t("دورة التعلم والإتقان", "Mastery Loop")}</span>
            <h2>{t("أربع مراحل من الفهم إلى المراجعة", "Four Stages from Comprehension to Review")}</h2>
            <p className="mp-lede">
              {t(
                 "تدفق تعلّم يربط المصدر والشرح والتدريب والمراجعة من دون ضمان نتيجة أو اختراع موعد امتحان:",
                 "A learning flow connecting source, explanation, practice, and review without guaranteeing outcomes or inventing exam dates:",
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto w-full">
            {[
              {
                step: "01",
                ar: "المصدر الموثوق والتوثيق الأكاديمي",
                en: "Verified Source & Provenance",
                dAr: "سجلات مرشحة مرتبطة بدليل المذاكرة الأصلي وبصمته، مع تنبيه أنه ليس كتابًا رسميًا.",
                dEn: "Candidate records linked to the original study guide and its hash, with an explicit not-an-official-textbook caveat.",
              },
              {
                step: "02",
                ar: "الشرح المتدرّج وتفكيك المفاهيم",
                en: "Bite-Sized Stepped Explanations",
                dAr: "دروس تفكك المفاهيم الصعبة لأهداف محددة مع أمثلة محلولة وتوضيح للأخطاء الشائعة.",
                dEn: "Clear objectives, stepped breakdowns, worked solutions, and proactive misconception warnings.",
              },
              {
                step: "03",
                ar: "التدريب الذكي والتصحيح المعلل",
                en: "Active Recall & Reasoned Feedback",
                dAr: "أسئلة متنوعة وتحديات فورية مع تصحيح حتمي يوضح سبب الصواب ويفكك المغالطات المفاهيمية.",
                dEn: "Instant practice drills with deterministic explanations detailing why an answer works.",
              },
              {
                step: "04",
                ar: "المراجعة المجدولة بالتكرار المتباعد",
                en: "Scheduled Spaced Recall (SM-2)",
                dAr: "خوارزمية ذكية تجدول المهارات الضعيفة للعودة مبكرًا وتؤجل الراسخ لتثبيته في الذاكرة طويلة المدى.",
                dEn: "Smart recall scheduling that brings weak skills back on time until they become second nature.",
              },
            ].map((s) => (
              <article
                className="p-glass p-5 rounded-2xl border border-white/[0.08] relative overflow-hidden flex flex-col justify-between hover:border-indigo-500/40 transition-all hover:-translate-y-1"
                key={s.step}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-indigo-400 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/25">
                    {s.step}
                  </span>
                  <span className="text-indigo-400/40 text-lg">◈</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2 leading-snug">
                  {locale === "en" ? s.en : s.ar}
                </h3>
                <p className="text-xs text-[#94a3b8] leading-relaxed flex-1">
                  {locale === "en" ? s.dEn : s.dAr}
                </p>
              </article>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/how"
              className="mp-btn mp-btn-ghost"
            >
              <span>{t("عرض محاكاة دورة الإتقان وخوارزمية SM-2", "Explore Mastery Loop & SM-2 Simulation")}</span>
              <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Section 5: Common Questions */}
      <section className="mp-section" id="faq">
        <Reveal>
          <div className="mp-head mp-head-center text-center mx-auto flex flex-col items-center justify-center max-w-2xl mb-10">
            <span className="mp-eyebrow text-xs uppercase tracking-widest text-indigo-400 font-bold mb-2">
              {t("أسئلة شائعة وإجابات صريحة", "Frequently Asked Questions")}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white text-center tracking-tight mb-3">
              {t("أسئلة يطرحها الطلاب وأولياء الأمور", "Questions Students and Parents Ask")}
            </h2>
            <p className="text-sm sm:text-base text-[#94a3b8] text-center max-w-xl mx-auto leading-relaxed">
              {t(
                "إجابات واضحة وشفافة حول المنهج، والمسارات المستقلة، وطريقة عمل المساعد الذكي وأمان البيانات.",
                "Clear and transparent answers about our curriculum, independent tracks, AI tutor, and data privacy.",
              )}
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3.5">
            {FAQ.map((item) => (
              <details
                key={item.qEn}
                className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] hover:border-indigo-500/35 hover:bg-white/[0.045] transition-all overflow-hidden open:border-indigo-500/50 open:bg-indigo-950/20 open:shadow-xl open:shadow-indigo-500/10"
              >
                <summary className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none list-none text-start">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/15 border border-indigo-500/25 px-2.5 py-0.5 rounded-full flex-shrink-0">
                      {locale === "en" ? item.categoryEn : item.categoryAr}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-200 transition-colors">
                      {locale === "en" ? item.qEn : item.qAr}
                    </h3>
                  </div>
                  <span className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.1] group-hover:border-indigo-400 flex items-center justify-center text-indigo-300 font-bold text-sm transition-transform duration-200 group-open:rotate-45 flex-shrink-0">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#cbd5e1] leading-relaxed border-t border-white/[0.05] mt-1">
                  <p>{locale === "en" ? item.aEn : item.aAr}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/faq"
              className="mp-btn mp-btn-ghost inline-flex items-center gap-2"
            >
              <span>{t("عرض كل الأسئلة الشائعة وتفاصيل الدعم", "Browse All FAQs & Support")}</span>
              <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* High-Impact Final CTA Band */}
      <section className="mp-section" data-size="tight">
        <Reveal>
          <div className="mp-band">
            <h2>{t("ابدأ من أول درس الآن مجانًا", "Start with the First Lesson Free Today")}</h2>
            <p style={{ marginBlock: "var(--mp-space-2) var(--mp-space-4)" }}>
              {t(
                "لا نطلب منك بطاقة بنكية ولا التزامًا مسبقًا؛ افتح المنهج، واختر مسارك، وتعلّم أول درس.",
                "No payment card and no commitment required. Open the curriculum, pick your track, and study your first lesson.",
              )}
            </p>
            <div className="mp-cta-row">
              <Link className="mp-btn mp-btn-primary" href="/signup">
                {t("ابدأ التعلم الآن مجانًا", "Start learning free now")}
              </Link>
              <Link className="mp-btn mp-btn-ghost" href="/curriculum">
                {t("استكشف تفاصيل المنهج", "Explore Curriculum Details")}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </MarketingShell>
  );
}
