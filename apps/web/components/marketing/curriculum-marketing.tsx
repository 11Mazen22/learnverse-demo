"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketingShell, Reveal } from "./marketing-shell";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { SUBJECT_CATALOG, TRACK_CATALOG, contentLanguageLabel } from "@/lib/curriculum/catalog";

const SUBJECT_DETAILS = [
  {
    key: "integrated-science",
    ar: "العلوم المتكاملة",
    en: "Integrated Science",
    icon: "🧪",
    color: "#22d3ee",
    tracksCount: 2,
    lessonsCount: 5,
    questionsCount: 23,
    overviewAr: "تجمع المادة بين الكيمياء والفيزياء وعلم الأحياء لفهم الغلاف المائي، والخواص الفيزيائية والكيميائية للماء، والمحاليل المائية، ودور الماء الحيوي في استدامة الحياة.",
    overviewEn: "Integrates chemistry, physics and biology to understand the hydrosphere, water's physical and chemical properties, aqueous solutions, and ecological balance.",
    units: [
      { ar: "الغلاف المائي والبيئة المائية", en: "Hydrosphere & Aquatic Ecology", lessons: 2 },
      { ar: "الخواص الفيزيائية والكيميائية للماء", en: "Physical & Chemical Water Properties", lessons: 2 },
      { ar: "المحاليل المائية والتوازن الحيوي", en: "Aqueous Solutions & Biological Homeostasis", lessons: 1 },
    ],
    tracks: [
      { slug: "integrated-science-ar", lang: "ar", labelAr: "المسار العربي", labelEn: "Arabic Track" },
      { slug: "integrated-science-en", lang: "en", labelAr: "المسار الإنجليزي", labelEn: "English Track" },
    ],
  },
  {
    key: "mathematics",
    ar: "الرياضيات",
    en: "Mathematics",
    icon: "📐",
    color: "#818cf8",
    tracksCount: 2,
    lessonsCount: 5,
    questionsCount: 23,
    overviewAr: "تغطي الوحدة الأولى في الجبر والعلاقات والدوال: مقدمة الأعداد المركبة، وتحديد نوع جذري المعادلة التربيعية باستخدام المميز، وإشارة الدوال، والمتباينات التربيعية.",
    overviewEn: "Covers algebra, complex numbers introduction, quadratic discriminant analysis, function sign analysis, and quadratic inequalities in one variable.",
    units: [
      { ar: "الأعداد المركبة والعمليات الجبرية", en: "Complex Numbers & Algebraic Operations", lessons: 2 },
      { ar: "المميز وبحث نوع جذري المعادلة", en: "Discriminant & Nature of Quadratic Roots", lessons: 1 },
      { ar: "إشارة الدوال والمتباينات التربيعية", en: "Sign of Functions & Quadratic Inequalities", lessons: 2 },
    ],
    tracks: [
      { slug: "mathematics-ar", lang: "ar", labelAr: "المسار العربي", labelEn: "Arabic Track" },
      { slug: "mathematics-en", lang: "en", labelAr: "المسار الإنجليزي", labelEn: "English Track" },
    ],
  },
  {
    key: "history",
    ar: "تاريخ مصر والعالم القديم",
    en: "History of Egypt & Ancient World",
    icon: "🏛️",
    color: "#fbbf24",
    tracksCount: 1,
    lessonsCount: 5,
    questionsCount: 22,
    overviewAr: "دراسة تحليلية لمفهوم الحضارة والتاريخ، ومصادر دراسة الحضارات (الأولية والثانوية)، وعوامل قيام حضارات العالم القديم وانتقال مراكزها بين الشرق والغرب.",
    overviewEn: "Analytical study of civilisational theory, primary and secondary historical evidence, factors behind ancient civilisations, and transcontinental cultural exchange.",
    units: [
      { ar: "الحضارة والتاريخ", en: "Civilization and History", lessons: 1 },
      { ar: "مصادر دراسة الحضارات", en: "Sources for Studying Civilizations", lessons: 1 },
      { ar: "عوامل قيام الحضارات", en: "Factors Behind the Rise of Civilizations", lessons: 1 },
      { ar: "ملامح من تاريخ مصر القديمة", en: "Features of Ancient Egyptian History", lessons: 1 },
      { ar: "الحياة الاقتصادية في مصر القديمة", en: "The Economy of Ancient Egypt", lessons: 1 },
    ],
    tracks: [
      { slug: "history-ar", lang: "ar", labelAr: "مسار المحتوى العربي", labelEn: "Arabic-content Track" },
    ],
  },
  {
    key: "arabic-language",
    ar: "اللغة العربية وقصة عنترة",
    en: "Arabic Language & Antara Epic",
    icon: "📖",
    color: "#f472b6",
    tracksCount: 1,
    lessonsCount: 11,
    questionsCount: 36,
    overviewAr: "سجلات دليل المذاكرة لأول خمسة نصوص قرائية وأدبية، وأول خمسة دروس من القواعد الأساسية للنحو والصرف، ثم ملخص دراسي لقصة عنترة. النصوص الأصلية تُراجع من كتاب المدرسة.",
    overviewEn: "Study-guide records for the first five reading/literature texts, five foundational grammar and morphology lessons, and a study summary of Antara. Original set texts remain in the school book.",
    units: [
      { ar: "النصوص والقراءة والأدب", en: "Reading and Literature", lessons: 5 },
      { ar: "قواعد النحو والصرف", en: "Grammar and Morphology", lessons: 5 },
      { ar: "ملخص قصة عنترة بن شداد", en: "Antara Study Summary", lessons: 1 },
    ],
    tracks: [
      { slug: "arabic-language-ar", lang: "ar", labelAr: "المسار العربي الشامل", labelEn: "Comprehensive Arabic Track" },
    ],
  },
  {
    key: "english",
    ar: "اللغة الإنجليزية (Term 1)",
    en: "English Language (Term 1)",
    icon: "🌐",
    color: "#2dd4bf",
    tracksCount: 1,
    lessonsCount: 5,
    questionsCount: 23,
    overviewAr: "خمس وحدات في دليل المصدر: تراث مصر، والمساعدة المجتمعية، والحقيقة والشائعات، وحماية البيئة، واستخدام التكنولوجيا في المدارس، مع قواعد وكتابة مرتبطة بكل وحدة.",
    overviewEn: "Five source-guide units: Egypt's heritage, community care, truth and misinformation, environmental action, and technology at school, with linked grammar and writing practice.",
    units: [
      { ar: "Unit 1: EGYPT'S HERITAGE", en: "Unit 1: EGYPT'S HERITAGE", lessons: 1 },
      { ar: "Unit 2: HANDS HELP, HEARTS CARE", en: "Unit 2: HANDS HELP, HEARTS CARE", lessons: 1 },
      { ar: "Unit 3: TRUTH VS. LIES", en: "Unit 3: TRUTH VS. LIES", lessons: 1 },
      { ar: "Unit 4: SAVE AND SHINE", en: "Unit 4: SAVE AND SHINE", lessons: 1 },
      { ar: "Unit 5: USING TECHNOLOGY AT SCHOOLS", en: "Unit 5: USING TECHNOLOGY AT SCHOOLS", lessons: 1 },
    ],
    tracks: [
      { slug: "english-en", lang: "en", labelAr: "مسار المحتوى الإنجليزي", labelEn: "English-content Track" },
    ],
  },
  {
    key: "philosophy-logic",
    ar: "الفلسفة والتفكير المنطقي",
    en: "Philosophy & Logical Reasoning",
    icon: "💡",
    color: "#c084fc",
    tracksCount: 1,
    lessonsCount: 5,
    questionsCount: 22,
    overviewAr: "أربعة دروس رسمية في دليل المصدر عن التفكير الإنساني والموقف الفلسفي والحدود والقضايا والاستدلال، ثم مراجعة خامسة إضافية موصوفة بوضوح بأنها ليست درسًا رسميًا.",
    overviewEn: "Four official lessons in the source guide on human thought, the philosophical stance, terms and propositions, and inference, followed by an additional review explicitly marked as not an official lesson.",
    units: [
      { ar: "التفكير الإنساني", en: "Human Thinking", lessons: 1 },
      { ar: "الفلسفة وطبيعة الموقف الفلسفي", en: "Philosophy and the Philosophical Stance", lessons: 1 },
      { ar: "مبادئ المنطق — الحدود والقضايا", en: "Logic — Terms and Propositions", lessons: 1 },
      { ar: "الاستدلال", en: "Inference", lessons: 1 },
      { ar: "مراجعة إضافية — ليست درسًا رسميًا", en: "Additional Review — Not an Official Lesson", lessons: 1 },
    ],
    tracks: [
      { slug: "philosophy-logic-ar", lang: "ar", labelAr: "مسار التفكير الفلسفي", labelEn: "Philosophical Reasoning Track" },
    ],
  },
];

export function CurriculumMarketing() {
  const t = useTranslation();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [activeSubjectKey, setActiveSubjectKey] = useState<string>("integrated-science");

  const currentSubject = SUBJECT_DETAILS.find((s) => s.key === activeSubjectKey) || SUBJECT_DETAILS[0];

  const totalLessons = SUBJECT_DETAILS.reduce((acc, s) => acc + s.lessonsCount * s.tracksCount, 0);
  const totalQuestions = SUBJECT_DETAILS.reduce((acc, s) => acc + s.questionsCount * s.tracksCount, 0);

  return (
    <MarketingShell tone="dark">
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 max-w-[1440px] mx-auto w-full relative">
        <Reveal>
          <div className="max-w-4xl mx-auto text-center mb-16">
            <span className="p-eyebrow">
              {t("كتالوج المواد والمسارات — أولى ثانوي", "Subject & Track Catalog · Grade 10")}
            </span>
            <h1 className="p-h1 mx-auto text-center">
              <span className="p-h1-lead">
                {t("ست عائلات مواد.", "Six Subject Families.")}
              </span>
              <span className="p-h1-next">
                {t("وثمانية مسارات تعليمية مستقلة.", "Eight Independent Learning Tracks.")}
              </span>
            </h1>
            <p className="text-base md:text-lg text-[#cbd5e1] leading-relaxed max-w-3xl mx-auto mb-10">
              {t(
                "يعرّف كتالوج نقطة ست مواد وثمانية مسارات مستقلة، مع محتوى مرشح من دليل المذاكرة المصدر. تظهر الدروس فقط عند نشرها في قاعدة المحتوى المتصلة، ولا ندّعي أن الدليل كتاب رسمي أو تغطية معتمدة.",
                "Noata defines six subjects and eight isolated tracks, with candidate content mapped from the source study guide. Lessons appear only when published in the connected content database; the guide is not represented as an official textbook or accredited coverage.",
              )}
            </p>

            {/* Metrics Counter */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { n: "6", ar: "عائلات مواد", en: "Subject Families" },
                { n: "8", ar: "مسارات لغوية مستقلة", en: "Independent Tracks" },
                { n: String(totalLessons), ar: "سجل درس مرشح في الهجرة", en: "Candidate Lesson Records" },
                { n: String(totalQuestions), ar: "سجل سؤال مرشح", en: "Candidate Question Records" },
              ].map((m) => (
                <div key={m.en} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center">
                  <strong className="block text-3xl font-black text-white mb-1 font-mono">{m.n}</strong>
                  <span className="text-xs text-[#94a3b8]">{locale === "en" ? m.en : m.ar}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Section 1: Interactive Subject Deep Dive */}
        <Reveal>
          <div className="mb-20">
            <div className="text-center mb-8">
              <h2 className="p-h2 mb-3">
                {t("استكشف تفاصيل كل مادة ووحداتها", "Explore Each Subject & Its Units")}
              </h2>
              <p className="text-sm text-[#94a3b8]">
                {t("اضغط على أي مادة للاطلاع على وحداتها ومساراتها اللغوية وأهداف التعلم:", "Select a subject to inspect its syllabus breakdown and language tracks:")}
              </p>
            </div>

            {/* Subject Selector Tabs */}
            <div className="flex flex-wrap justify-center gap-2.5 mb-8" role="tablist">
              {SUBJECT_DETAILS.map((sub) => {
                const isActive = sub.key === activeSubjectKey;
                return (
                  <button
                    key={sub.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveSubjectKey(sub.key)}
                    className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? "bg-white/[0.12] text-white shadow-xl"
                        : "bg-white/[0.03] text-[#cbd5e1] border-white/[0.08] hover:bg-white/[0.06]"
                    }`}
                    style={{
                      borderColor: isActive ? sub.color : undefined,
                      boxShadow: isActive ? `0 0 20px ${sub.color}35` : undefined,
                    }}
                  >
                    <span>{sub.icon}</span>
                    <span>{locale === "en" ? sub.en : sub.ar}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Subject Showcase Card */}
            <div className="p-glass rounded-3xl p-6 sm:p-10 border border-white/[0.12] shadow-2xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 mb-6 border-b border-white/[0.08] gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{currentSubject.icon}</span>
                    <h3 className="text-2xl font-bold text-white">
                      {locale === "en" ? currentSubject.en : currentSubject.ar}
                    </h3>
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: `${currentSubject.color}20`,
                        color: currentSubject.color,
                        border: `1px solid ${currentSubject.color}40`,
                      }}
                    >
                      {currentSubject.tracksCount > 1
                        ? (locale === "en" ? "2 Independent Tracks (AR / EN)" : "مساران مستقلان: عربي / إنجليزي")
                        : (locale === "en" ? "Single content track" : "مسار محتوى واحد")}
                    </span>
                  </div>
                  <p className="text-sm text-[#cbd5e1] max-w-3xl leading-relaxed">
                    {locale === "en" ? currentSubject.overviewEn : currentSubject.overviewAr}
                  </p>
                </div>

                {/* Direct Track Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  {currentSubject.tracks.map((tr) => (
                    <Link
                      key={tr.slug}
                      href={`/signup?track=${tr.slug}`}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-[#030712] transition-all hover:brightness-110 active:brightness-95 shadow-lg flex items-center gap-2 whitespace-nowrap"
                      style={{ backgroundColor: currentSubject.color }}
                    >
                      <span>{t("ابدأ", "Start")} {locale === "en" ? tr.labelEn : tr.labelAr}</span>
                      <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Units Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentSubject.units.map((u, uIdx) => (
                  <div
                    key={u.en}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1 block">
                        {t("موضوع مصدر", "Source topic")} 0{uIdx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-white mb-2">
                        {locale === "en" ? u.en : u.ar}
                      </h4>
                    </div>
                    <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-[#94a3b8]">
                      <span>{u.lessons} {t("دروس تفصيلية", "structured lessons")}</span>
                       <span className="text-emerald-400 font-semibold">{t("مرتبطة بدليل المصدر", "Source-mapped")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Section 2: Comprehensive Track Comparison Table */}
        <Reveal>
          <div className="mb-20">
            <div className="text-center mb-8">
              <span className="p-eyebrow">{t("جدول المسارات الكامل", "Master Track Catalog")}</span>
              <h2 className="p-h2 mb-3">
                 {t("دليل المسارات وسجلات الهجرة المرشحة", "Tracks & Candidate Migration Records")}
              </h2>
              <p className="text-sm text-[#94a3b8] max-w-2xl mx-auto">
                {t(
                  "المحتوى مبني على دليل مذاكرة أصلي معروف المصدر للترم الأول 2026–2027. التقدم في أي مسار منفصل تمامًا عن الآخر.",
                   "Candidate modules are mapped to the repository study guide with recorded provenance. Availability still depends on publication in the connected database, and progress remains isolated per track.",
                )}
              </p>
            </div>

            <div className="mp-table rounded-3xl overflow-hidden border border-white/[0.1] shadow-2xl">
              <table className="w-full text-start">
                <thead>
                  <tr className="border-b border-white/[0.1] bg-white/[0.04]">
                    <th className="p-4 text-xs font-bold text-[#94a3b8] uppercase tracking-wider">{t("المادة", "Subject")}</th>
                    <th className="p-4 text-xs font-bold text-[#94a3b8] uppercase tracking-wider">{t("المسار", "Track")}</th>
                    <th className="p-4 text-xs font-bold text-[#94a3b8] uppercase tracking-wider">{t("لغة المحتوى", "Content Language")}</th>
                    <th className="p-4 text-xs font-bold text-[#94a3b8] uppercase tracking-wider text-center">{t("الدروس", "Lessons")}</th>
                    <th className="p-4 text-xs font-bold text-[#94a3b8] uppercase tracking-wider text-center">{t("الأسئلة", "Questions")}</th>
                    <th className="p-4 text-xs font-bold text-[#94a3b8] uppercase tracking-wider text-center">{t("التسجيل", "Action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-xs sm:text-sm">
                  {TRACK_CATALOG.map((track) => {
                    const subject = SUBJECT_CATALOG.find((s) => s.key === track.subject);
                    const subjectTitle = subject
                      ? locale === "en" ? subject.titleEn : subject.titleAr
                      : track.subject;
                    const matchedDetail = SUBJECT_DETAILS.find((s) => s.key === track.subject);
                    const questionsCount = matchedDetail?.questionsCount || 23;
                    const lessonsCount = matchedDetail?.lessonsCount || 5;

                    return (
                      <tr key={track.slug} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-bold text-white flex items-center gap-2">
                          <span>{matchedDetail?.icon}</span>
                          <span>{subjectTitle}</span>
                        </td>
                        <td className="p-4">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: track.contentLanguage === "en" ? "rgba(34,211,238,0.15)" : "rgba(129,140,248,0.15)",
                              color: track.contentLanguage === "en" ? "#22d3ee" : "#818cf8",
                              border: `1px solid ${track.contentLanguage === "en" ? "rgba(34,211,238,0.3)" : "rgba(129,140,248,0.3)"}`,
                            }}
                          >
                            {locale === "en" ? track.titleEn : track.titleAr}
                          </span>
                        </td>
                        <td className="p-4 text-[#cbd5e1]">
                          {contentLanguageLabel(track.contentLanguage, locale)}
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-white">
                          {lessonsCount}
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-white">
                          {questionsCount}
                        </td>
                        <td className="p-4 text-center">
                          <Link
                            href={`/signup?track=${track.slug}`}
                            className="inline-block px-3.5 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 font-semibold text-xs transition-colors"
                          >
                            {t("ابدأ مجانًا", "Start Free")}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* Section 3: Academic Honesty & Provenance Box */}
        <Reveal>
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/40 to-slate-900/40 border border-indigo-500/30 text-xs sm:text-sm text-[#cbd5e1] leading-relaxed mb-16 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <strong className="text-white text-base block font-bold">
                {t("ملاحظة الأمانة العلمية وشفافية المصدر", "Academic Provenance & Honesty Assurance")}
              </strong>
              <p>
                {t(
                   "المحتوى المرشح مبني على دليل مذاكرة أصلي محفوظ ببصمة SHA-256، وليس نسخة من الكتاب المدرسي ولا اعتمادًا رسميًا. يحتفظ كل سجل ببيانات المصدر، ويظهر المحتوى المفقود كغير متاح.",
                   "Candidate content uses an original study guide recorded with a SHA-256 hash. It is neither a textbook copy nor official accreditation. Records retain provenance, and missing content remains explicitly unavailable.",
                )}
              </p>
            </div>
            <Link
              href="/about"
              className="px-5 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white font-semibold text-xs whitespace-nowrap self-start sm:self-auto"
            >
              {t("فلسفة نقطة ورسالتنا", "About Our Philosophy")}
            </Link>
          </div>
        </Reveal>

        {/* Final CTA */}
        <Reveal>
          <div className="text-center max-w-2xl mx-auto py-10">
            <h2 className="p-h2 mb-4">
              {t("جاهز لاختيار مسارك وبدء الدرس الأول؟", "Ready to Choose Your Track & Begin?")}
            </h2>
            <p className="text-sm text-[#94a3b8] mb-8">
              {t(
                "أنشئ حسابك المجاني في دقيقة واحدة، واختر مادتك المفضلة، وابدأ رحلة التعلم المنظم.",
                "Create your free account in one minute, select your subject, and begin structured mastery.",
              )}
            </p>
            <Link
              href="/signup"
              className="p-cta-primary text-base px-8 py-3.5 font-bold shadow-xl shadow-indigo-500/30"
            >
              <span>{t("ابدأ التعلم الآن مجانًا", "Start Learning Free Now")}</span>
              <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
            </Link>
          </div>
        </Reveal>
      </section>
    </MarketingShell>
  );
}
