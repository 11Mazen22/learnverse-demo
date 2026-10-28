"use client";
import Link from "next/link";
import { MarketingShell, Reveal } from "./marketing-shell";
import { useLocale, useTranslation } from "@/lib/i18n/locale";

/* Data kept intact from original */
function KnowledgeMap() {
  const t = useTranslation();
  const nodes = [
    { x: 60, y: 150, ar: "المصدر", en: "Source", subAr: "محتوى موثوق", subEn: "trusted content" },
    { x: 250, y: 92, ar: "الدرس", en: "Lesson", subAr: "شرح متدرّج", subEn: "guided explanation" },
    { x: 440, y: 92, ar: "التطبيق", en: "Practice", subAr: "أسئلة وتدريب", subEn: "questions & drills" },
    { x: 630, y: 150, ar: "التغذية الراجعة", en: "Feedback", subAr: "تصحيح يشرح السبب", subEn: "reasoned correction" },
    { x: 800, y: 236, ar: "المراجعة", en: "Review", subAr: "جدولة ذكية", subEn: "scheduled recall" },
  ];
  return (
    <svg className="w-full h-auto" viewBox="0 0 880 300" role="img"
      aria-label={t("خريطة المعرفة في نقطة: من المصدر إلى الدرس فالتطبيق فالتغذية الراجعة فالمراجعة المجدولة", "The Noata knowledge map: from source to lesson, practice, feedback and scheduled review")}>
      <defs>
        <linearGradient id="mapLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#8894e8" stopOpacity="0.2"/><stop offset="100%" stopColor="#c0a8f0" stopOpacity="0.9"/></linearGradient>
      </defs>
      <path className="fill-none stroke-[3] stroke-[url(#mapLine)]" d="M 96 142 C 150 110, 200 96, 246 88" />
      <path className="fill-none stroke-[3] stroke-[url(#mapLine)]" d="M 322 82 C 360 78, 400 80, 436 86" />
      <path className="fill-none stroke-[3] stroke-[url(#mapLine)]" d="M 512 96 C 560 112, 590 128, 626 142" />
      <path className="fill-none stroke-[3] stroke-[url(#mapLine)]" d="M 690 160 C 730 184, 762 210, 792 232" />
      {nodes.map((node) => (
        <g key={node.en}>
          <circle cx={node.x} cy={node.y} r="34" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          <circle cx={node.x} cy={node.y} r="9" fill="#c0b8e6" />
          <text x={node.x} y={node.y + 56} textAnchor="middle" fill="#d8dde8" fontSize="13" fontWeight="600">{node.ar}</text>
          <text x={node.x} y={node.y + 71} textAnchor="middle" fill="#8894e8" fontSize="11">{node.subAr}</text>
        </g>
      ))}
    </svg>
  );
}

const STEPS = [
  { ar: "ابدأ من محتوى موثوق", en: "Start from trusted content", dAr: "منهج الصف الأول الثانوي الترم الأول 2026–2027 في ست مواد، مبني على دليل مذاكرة أصلي مع حفظ مصدره.", dEn: "The First Secondary Term 1 (2026–2027) curriculum across six subjects, built from an original study guide with its provenance kept visible." },
  { ar: "افهم خطوة بخطوة", en: "Understand step by step", dAr: "دروس قصيرة بأهداف واضحة وأمثلة محلولة وأخطاء شائعة، بالعربية والإنجليزية.", dEn: "Short lessons with clear objectives, worked examples and common mistakes — in Arabic and English." },
  { ar: "طبّق واسترجع", en: "Practise and recall", dAr: "أسئلة متنوعة بعد كل درس وتحدٍّ لكل وحدة، مع تصحيح يشرح سبب الخطأ لا مجرد علامة.", dEn: "Varied questions after each lesson and a unit challenge, with corrections that explain why — not just a mark." },
  { ar: "راجع في وقته", en: "Review on time", dAr: "المهارات الضعيفة تعود إليك مجدولة تلقائيًا حتى تثبت، والتقدم يُقاس بالأداء لا بالزيارات.", dEn: "Weak skills come back on a schedule until they stick; progress is measured by performance, not visits." },
];

const FEATURES = [
  { icon: "◈", ar: "مسار تعلّم كامل", en: "A complete learning path", dAr: "ست مواد بترتيب وحدات ودروس وتقدم محفوظ لحسابك، مع استكمال من حيث توقفت.", dEn: "Six subjects as ordered units and lessons with saved progress — resume exactly where you stopped." },
  { icon: "◎", ar: "مراجعة مجدولة", en: "Scheduled review", dAr: "جدولة استرجاع تعتمد على أدائك: الأصعب يعود أبكر، والراسخ يبعد.", dEn: "Recall scheduling driven by your performance: harder items return sooner, solid ones later." },
  { icon: "✦", ar: "مساعد Noata AI", en: "Noata AI companion", dAr: "اشرح لي، اختبرني، بطاقات مراجعة، لخّص، نظّم ملاحظاتي — أنماط دراسية حقيقية بخطوات واضحة.", dEn: "Explain, quiz me, flashcards, summarise, organise notes — real study modes with clear steps." },
  { icon: "❖", ar: "تحدٍّ وتحفيز رزين", en: "Calm motivation", dAr: "مهام قصيرة وتحديات وحدات ومكافآت تحتفل بتقدمك الحقيقي دون ضغط مصطنع.", dEn: "Short missions, unit challenges and rewards that celebrate real progress without artificial pressure." },
  { icon: "◈", ar: "مصحف موثّق", en: "Verified Quran reader", dAr: "قراءة وتلاوة بنص موثّق وتركيز على فهم المعنى من مصدر معتمد.", dEn: "Reading and recitation with verified text and a focus on meaning from a trusted source." },
  { icon: "◇", ar: "عربي وإنجليزي", en: "Arabic & English", dAr: "واجهة ومحتوى بلغتين مع اتجاه كامل يمينًا ويسارًا وخطوط عربية مصممة للقراءة.", dEn: "Bilingual interface and content with full RTL/LTR direction and Arabic typeography built to read." },
];

const SUBJECTS = [
  { ar: "الفلسفة والمنطق", en: "Philosophy & Logic", n: 5 },
  { ar: "العلوم المتكاملة", en: "Integrated Science", n: 5 },
  { ar: "الرياضيات", en: "Mathematics", n: 5 },
  { ar: "اللغة العربية", en: "Arabic", n: 11 },
  { ar: "اللغة الإنجليزية", en: "English", n: 5 },
  { ar: "التاريخ", en: "History", n: 5 },
];

const FAQ_PREVIEW = [
  { qAr: "هل المحتوى مطابق للكتاب المدرسي؟", qEn: "Does the content match the school textbook?", aAr: "المحتوى مبني على دليل مذاكرة أصلي ومفصّل يشرح الأفكار والقواعد، وليس نسخة حرفية من الكتب المدرسية؛ ننصح دائمًا بمراجعة الكتاب المدرسي معه، وهذا مذكور داخل كل مادة.", aEn: "The content is built from an original detailed study guide, not a verbatim textbook copy; we always recommend using it alongside the school book — and say so inside every subject." },
  { qAr: "هل إجابات المساعد الذكي مضمونة؟", qEn: "Are the AI companion's answers guaranteed?", aAr: "لا؛ المساعد يعمل بأنماط دراسية واضحة ويمكن الإبلاغ عن أي خطأ أو تصحيحه، والمحتوى المولَّد يُعرض كمسودة قابلة للمراجعة.", aEn: "No; the companion works in clear study modes, errors can be reported and corrected, and generated material appears as a reviewable draft." },
  { qAr: "بأي لغة المنصة؟", qEn: "Which languages does the platform support?", aAr: "العربية والإنجليزية في الواجهة والمحتوى، مع دعم كامل للاتجاهين.", aEn: "Arabic and English across the interface and content, with full RTL/LTR support." },
];

export function HomeMarketing() {
  const t = useTranslation(), locale = useLocale();
  return (
    <MarketingShell>
      <div className="p-home-wrap">
        {/* HERO */}
        <section className="p-hero-atmosphere" aria-label={t("الرئيسية", "Home")}>
          <div className="orb orb-1" aria-hidden="true" />
          <div className="orb orb-2" aria-hidden="true" />
          <div className="orb orb-3" aria-hidden="true" />

          <div className="max-w-6xl mx-auto px-6 md:px-10 relative z-10">
            <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
              <div>
                <span className="p-eyebrow">{t("أطلق المعرفة الحي", "The living knowledge atlas")}</span>
                <h1 className="p-h1 mb-6">
                  {t("افهمه. طبّقه. احفظه.", "Understand it. Practise it. Remember it.")}
                  <br />
                  <span className="italic font-normal opacity-90">{t("واطّلع على خطوتك التالية.", "And know your next step.")}</span>
                </h1>
                <p className="text-lg md:text-xl text-[#b8bdd4] leading-relaxed mb-8 max-w-lg">
                  {t(
                    "نقطة منصة تعلّم عربية تجمع منهج الصف الأول الثانوي — الترم الأول 2026–2027 في ست مواد، مع مراجعة مجدولة ومساعد ذكي يشرح ويختبر ويراجع معك خطوة بخطوة.",
                    "Noata is an Arabic-first learning platform combining the First Secondary Term 1 (2026–2027) curriculum across six subjects with scheduled review and an AI companion that explains, quizzes and revises with you step by step.",
                  )}
                </p>
                <div className="flex flex-wrap gap-3 mb-10">
                  <Link className="p-cta-primary" href="/signup">{t("ابدأ التعلم مجانًا", "Start learning free")}</Link>
                  <Link className="p-cta-secondary" href="/features#how">{t("كيف تعمل نقطة؟", "How Noata works")}</Link>
                </div>
                <div className="flex flex-wrap gap-2" aria-label={t("نطاق المنهج", "Curriculum scope")}>
                  {[t("مصر", "Egypt"), t("الصف الأول الثانوي", "First Secondary"), t("الترم الأول", "Term 1"), "2026–2027", t("٦ مواد", "6 subjects")].map((b) => (
                    <span key={b} className="p-pill">{b}</span>
                  ))}
                </div>
              </div>

              <Reveal>
                <div className="p-glass">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#f2f0fa]">{t("خريطة المعرفة", "Knowledge map")}</h3>
                    <span className="text-xs text-[#8894e8] uppercase tracking-widest">AI Path</span>
                  </div>
                  <KnowledgeMap />
                  <div className="grid grid-cols-5 gap-3 mt-6">
                    {[
                      { label: t("المصدر", "Source"), val: t("موثوق", "Trusted") },
                      { label: t("الدرس", "Lesson"), val: t("متدرج", "Guided") },
                      { label: t("التطبيق", "Practice"), val: t("تدريب", "Drills") },
                      { label: t("التغذية", "Feedback"), val: t("يشرح", "Explained") },
                      { label: t("المراجعة", "Review"), val: t("مجسمة", "Scheduled") },
                    ].map((s) => (
                      <div key={s.label} className="text-center p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div className="text-[11px] text-[#8894e8] uppercase tracking-wide">{s.label}</div>
                        <div className="text-sm font-medium text-[#e8edf3]">{s.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <div className="p-section-divider" />

        {/* SUBJECTS */}
        <section className="p-section" id="subjects">
          <Reveal>
            <div className="text-center mb-12">
              <span className="p-eyebrow">{t("المنهج المتكامل", "The integrated curriculum")}</span>
              <h2 className="p-h2 mb-4">{t("ست مواد، رحلة واحدة", "Six subjects, one journey")}</h2>
              <p className="text-[#b8bdd4] max-w-2xl mx-auto leading-relaxed">
                {t("كل مادة وحدات ودروس وأسئلة وتحدٍّ وحدة ومراجعة مجدولة — والعدد بجانب كل مادة هو عدد الدروس المتاحة في هذا الإصدار.", "Every subject has units, lessons, questions, a unit challenge and scheduled review — the number beside each subject is its lesson count in this release.")}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {SUBJECTS.map((subject) => (
                <div key={subject.en} className="p-glass text-center group">
                  <div className="text-3xl font-bold text-[#c0b8e6] mb-1 group-hover:scale-105 transition-transform">{subject.n}</div>
                  <div className="text-sm font-medium text-[#e8edf3] mb-1">{locale === "en" ? subject.en : subject.ar}</div>
                  <div className="text-xs text-[#8894e8]">{t("دروس", "lessons")}</div>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-[#8894e8] mt-8 max-w-3xl mx-auto leading-relaxed">
              {t("ملاحظة أمانة: الدروس مبنية على دليل مذاكرة أصلي ومفصّل — وليس نسخة حرفية من الكتب المدرسية — مع الحفاظ على مصدر كل درس وارتباطه بمنهج الترم.", "An honesty note: lessons are built from an original detailed study guide — not a verbatim textbook copy — preserving each lesson's source and its place in the term syllabus.")}
            </p>
          </Reveal>
        </section>

        <div className="p-section-divider" />

        {/* HOW IT WORKS */}
        <section className="p-section" id="how-home">
          <Reveal>
            <div className="text-center mb-12">
              <span className="p-eyebrow">{t("طريقة نقطة", "The Noata way")}</span>
              <h2 className="p-h2 mb-4">{t("من المصدر إلى الإتقان", "From source to mastery")}</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((step, index) => (
                <article key={step.en} className="p-glass relative overflow-hidden">
                  <div className="absolute top-3 right-3 text-6xl font-black text-white/[0.03] leading-none select-none">{index + 1}</div>
                  <h3 className="text-xl font-bold text-[#f2f0fa] mb-3 relative z-10">{locale === "en" ? step.en : step.ar}</h3>
                  <p className="text-[#b8bdd4] leading-relaxed text-sm relative z-10">{locale === "en" ? step.dEn : step.dAr}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        <div className="p-section-divider" />

        {/* FEATURES */}
        <section className="p-section">
          <Reveal>
            <div className="text-center mb-12">
              <span className="p-eyebrow">{t("صُنع للتعلم", "Built for learning")}</span>
              <h2 className="p-h2 mb-4">{t("أدوات تعرف عملها", "Tools that know their job")}</h2>
            </div>
            <div className="p-features-grid">
              {FEATURES.map((feature) => (
                <article key={feature.en} className="p-glass">
                  <div className="text-2xl mb-3">{feature.icon}</div>
                  <h3 className="text-lg font-bold text-[#f2f0fa] mb-2">{locale === "en" ? feature.en : feature.ar}</h3>
                  <p className="text-sm text-[#b8bdd4] leading-relaxed">{locale === "en" ? feature.dEn : feature.dAr}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        <div className="p-section-divider" />

        {/* FAQ */}
        <section className="p-section" id="faq-preview">
          <Reveal>
            <div className="text-center mb-10">
              <h2 className="p-h2 mb-2">{t("أسئلة يطرحها الجميع", "Questions everyone asks")}</h2>
            </div>
            <div className="p-faq max-w-3xl mx-auto">
              {FAQ_PREVIEW.map((item) => (
                <details key={item.qEn}>
                  <summary>{locale === "en" ? item.qEn : item.qAr}</summary>
                  <p className="text-sm text-[#b8bdd4] leading-relaxed mt-2">{locale === "en" ? item.aEn : item.aAr}</p>
                </details>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link className="p-cta-secondary" href="/faq">{t("كل الأسئلة الشائعة", "All FAQs")}</Link>
            </div>
          </Reveal>
        </section>

        {/* FINAL CTA */}
        <section className="py-16 px-6 md:px-10" aria-label="Call to action">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2b2456] via-[#3e2b6e] to-[#2a1a4a] p-10 md:p-14 text-center shadow-2xl">
              <div className="absolute top-0 left-0 w-64 h-64 bg-[#8a7ae0] opacity-20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" aria-hidden="true" />
              <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#c07aee] opacity-20 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" aria-hidden="true" />
              <div className="relative z-10">
                <h2 className="p-h2 mb-3">{t("جاهز تبدأ رحلتك؟", "Ready to start your journey?")}</h2>
                <p className="text-[#ddd6f0] mb-8 max-w-xl mx-auto">{t("أنشئ حسابك وابدأ من أول درس اليوم.", "Create your account and start the first lesson today.")}</p>
                <Link className="p-cta-primary text-lg px-8 py-3" href="/signup">{t("ابدأ التعلم مجانًا", "Start learning free")}</Link>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </MarketingShell>
  );
}
