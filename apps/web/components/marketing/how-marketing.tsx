"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketingShell, Reveal } from "./marketing-shell";
import { useLocale, useTranslation } from "@/lib/i18n/locale";

const METHODOLOGY_STEPS = [
  {
    step: "01",
    id: "source",
    color: "#22d3ee",
    titleAr: "المصدر الموثوق والتوثيق الأكاديمي",
    titleEn: "Verified Grounding & Provenance",
    badgeAr: "أمانة المصدر",
    badgeEn: "Provenance Assurance",
    summaryAr: "الدروس المتاحة مبنية على دليل المذاكرة الأصلي المحفوظ في المستودع مع بصمة مصدر؛ وهو ليس كتابًا رسميًا ولا إثباتًا مستقلًا لمطابقة كل توزيع مدرسي.",
    summaryEn: "Available lessons use the repository's original study guide with a recorded source hash. It is not an official textbook or independent proof of every school's term distribution.",
    pointsAr: [
      "حفظ مصدر المحتوى داخل كل مادة ودرس ليعرف الطالب مرجعه الأكاديمي.",
      "تنسيق منظم يشرح المفاهيم مع تنبيه واضح للرجوع إلى الكتاب المدرسي.",
      "حالة النشر والمراجعة ظاهرة؛ ولا يتحول المحتوى المولد إلى منهج رسمي.",
    ],
    pointsEn: [
      "Preserved source citations within every lesson for full transparency.",
      "Structured explanations with an explicit reminder to use the school textbook.",
      "Visible review/publication state; generated content never becomes official silently.",
    ],
    demoHighlightAr: "دليل مذاكرة أصلي موثّق البصمة · ليس كتابًا رسميًا",
    demoHighlightEn: "Source-hashed original study guide · not an official textbook",
  },
  {
    step: "02",
    id: "stepped-lesson",
    color: "#818cf8",
    titleAr: "الشرح المتدرّج وتفكيك المفاهيم",
    titleEn: "Bite-Sized Stepped Explanations",
    badgeAr: "وضوح وتسلسل",
    badgeEn: "Stepped Clarity",
    summaryAr: "تفكيك الأفكار الصعبة إلى أهداف محددة مع أمثلة محلولة ورسوم توضيحية لتثبيت المفهوم قبل الانتقال للتدريب.",
    summaryEn: "Deconstructing complex ideas into bite-sized objectives with worked examples, diagrams, and common mistake callouts.",
    pointsAr: [
      "كل درس يبدأ بهدف واضح محدد وموجز يمكن قياسه.",
      "أمثلة محلولة خطوة بخطوة مع توضيح خطوات الحل المنطقية.",
      "تنبيه على الأخطاء الشائعة التي يقع فيها الطلاب عادة في الامتحانات.",
    ],
    pointsEn: [
      "Every module opens with a measurable, clear objective.",
      "Step-by-step worked solutions illustrating logical sequences.",
      "Proactive warnings highlighting common exam misconceptions.",
    ],
    demoHighlightAr: "شرح متدرج + مثال محلول + تنبيه على الأخطاء الشائعة",
    demoHighlightEn: "Guided Explanation + Worked Example + Misconception Alert",
  },
  {
    step: "03",
    id: "active-practice",
    color: "#f472b6",
    titleAr: "التطبيق الذكي والتصحيح المعلل",
    titleEn: "Active Practice & Deterministic Feedback",
    badgeAr: "تصحيح يوضّح السبب",
    badgeEn: "Reasoned Insight",
    summaryAr: "تدريب فوري بعد كل درس مع تصحيح حتمي يشرح سبب الصواب ويفكك المغالطة التي أدت للخطأ، لا مجرد علامة صح أو خطأ.",
    summaryEn: "Immediate practice questions with deterministic scoring and explanations that dissect why an answer works or why a misconception occurred.",
    pointsAr: [
      "أسئلة تصاعدية الصعوبة تقيس مستويات الفهم والتطبيق والتحليل.",
      "تغذية راجعة فورية تشرح التعليل العلمي الدقيق للإجابة الصحيحة.",
      "تسمية نوع المغالطة المفاهيمية عند الخطأ لمساعدة الطالب على تجاوزها.",
    ],
    pointsEn: [
      "Graded drills assessing comprehension, application, and analysis.",
      "Stored explanations shown after server-confirmed grading.",
      "Review actions based on recorded outcomes without inventing a personal diagnosis.",
    ],
    demoHighlightAr: "تصحيح خادمي + تفسير السؤال المخزّن",
    demoHighlightEn: "Server grading + stored question explanation",
  },
  {
    step: "04",
    id: "spaced-review",
    color: "#34d399",
    titleAr: "المراجعة المجدولة بالتكرار المتباعد (SM-2)",
    titleEn: "Scheduled Spaced Retention (SM-2)",
    badgeAr: "تثبيت الذاكرة",
    badgeEn: "Spaced Retention",
    summaryAr: "مواعيد المهارات تُحسب من المحاولات المسجلة، وبطاقاتك تستخدم فواصل مستوحاة من SM-2. الفواصل تقديرية ولا تضمن الحفظ أو الإتقان.",
    summaryEn: "Skill dates come from recorded attempts; saved flashcards use SM-2-inspired intervals. Intervals are estimates and do not guarantee retention or mastery.",
    pointsAr: [
      "المهارات والأسئلة الرسمية تبقى منفصلة عن تقييم بطاقاتك الشخصية.",
      "مرة أخرى/صعب/جيد/سهل تحدد تقدير الموعد التالي للبطاقة.",
      "تُحفظ مراجعات البطاقات بمفتاح يمنع تكرار العملية.",
    ],
    pointsEn: [
      "Formal skill evidence stays separate from personal card ratings.",
      "Again/Hard/Good/Easy ratings determine the card's next estimate.",
      "Card reviews use idempotency to prevent duplicate scheduling.",
    ],
    demoHighlightAr: "مثال بطاقة جديدة: ١٠ دقائق / يوم / ٤ أيام حسب التقييم",
    demoHighlightEn: "New-card example: 10 min / 1 day / 4 days by rating",
  },
];

export function HowMarketing() {
  const t = useTranslation();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const activeStep = METHODOLOGY_STEPS[activeStepIndex];

  return (
    <MarketingShell tone="dark">
      <section className="py-16 md:py-24 px-6 md:px-12 max-w-[1440px] mx-auto w-full relative">
        <Reveal>
          {/* Header */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <span className="p-eyebrow">
              {t("طريقة التعلم في نقطة — دورة الإتقان الدائم", "How Noäta Works · The Mastery Loop")}
            </span>
            <h1 className="p-h1 mx-auto text-center">
              <span className="p-h1-lead">
                {t("أربع خطوات علمية متكاملة.", "Four Interconnected Scientific Steps.")}
              </span>
              <span className="p-h1-next">
                {t("من الفهم الأولي إلى الحفظ الراسخ للأبد.", "From Initial Concept to Permanent Mastery.")}
              </span>
            </h1>
            <p className="text-base md:text-lg text-[#cbd5e1] leading-relaxed max-w-3xl mx-auto mb-10">
              {t(
                "في نقطة، لا نؤمن بالحفظ العشوائي ليلة الامتحان. صممنا رحلة دراسية متدرجة تحول كل مفهوم إلى معرفة راسخة من خلال أربع مراحل مترابطة تضمن الفهم الحقيقي وتوفر وقت وجهد الطالب.",
                "At Noäta, we reject last-minute cramming and ungrounded memorization. We engineered a stepped learning loop that transforms every curriculum concept into permanent knowledge through four synchronized stages.",
              )}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="p-cta-primary text-base px-8 py-3.5 font-bold shadow-xl shadow-indigo-500/25"
              >
                <span>{t("ابدأ التجربة الآن مجانًا", "Experience It Free Now")}</span>
                <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
              </Link>
              <Link
                href="/curriculum"
                className="p-cta-secondary text-base px-6 py-3.5 font-semibold"
              >
                {t("استكشف المنهج والمواد", "Explore Subjects & Curriculum")}
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Interactive Step Navigator */}
        <Reveal>
          <div className="mb-16">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {METHODOLOGY_STEPS.map((s, idx) => {
                const isActive = activeStepIndex === idx;
                return (
                  <div
                    key={s.step}
                    onClick={() => setActiveStepIndex(idx)}
                    className={`p-glass rounded-2xl p-5 cursor-pointer border transition-all relative overflow-hidden flex flex-col justify-between ${
                      isActive
                        ? "bg-white/[0.08] shadow-2xl scale-[1.02]"
                        : "bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.05]"
                    }`}
                    style={{
                      borderColor: isActive ? s.color : undefined,
                      boxShadow: isActive ? `0 0 25px ${s.color}25` : undefined,
                    }}
                  >
                    {isActive && (
                      <div
                        className="absolute top-0 left-0 right-0 h-1.5"
                        style={{ backgroundColor: s.color }}
                      />
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${s.color}20`,
                            color: s.color,
                          }}
                        >
                          {locale === "en" ? s.badgeEn : s.badgeAr}
                        </span>
                        <span className="text-2xl font-black font-mono text-white/20">{s.step}</span>
                      </div>
                      <h3 className="text-base font-bold text-white mb-2">
                        {locale === "en" ? s.titleEn : s.titleAr}
                      </h3>
                      <p className="text-xs text-[#94a3b8] leading-relaxed line-clamp-2">
                        {locale === "en" ? s.summaryEn : s.summaryAr}
                      </p>
                    </div>
                    <div className="pt-3 mt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px]">
                      <span style={{ color: s.color }} className="font-semibold">
                        {isActive ? (isRtl ? "المرحلة المعروضة" : "Active Stage") : (isRtl ? "اضغط للتفاصيل" : "Click to view")}
                      </span>
                      <span aria-hidden="true" style={{ color: s.color }}>{isRtl ? "←" : "→"}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Stage Deep Dive Canvas */}
            <div className="p-glass rounded-3xl p-6 md:p-10 border border-white/[0.12] shadow-2xl relative overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg text-[#030712]"
                      style={{ backgroundColor: activeStep.color }}
                    >
                      {activeStep.step}
                    </span>
                    <div>
                      <span
                        className="text-xs font-bold uppercase tracking-wider block"
                        style={{ color: activeStep.color }}
                      >
                        {t("المرحلة التعليمية", "Learning Stage")} {activeStep.step}
                      </span>
                      <h3 className="text-2xl font-bold text-white">
                        {locale === "en" ? activeStep.titleEn : activeStep.titleAr}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm md:text-base text-[#cbd5e1] leading-relaxed mb-6">
                    {locale === "en" ? activeStep.summaryEn : activeStep.summaryAr}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {(locale === "en" ? activeStep.pointsEn : activeStep.pointsAr).map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#e2e8f0]">
                        <span style={{ color: activeStep.color }} className="font-black text-base leading-none">✓</span>
                        <span className="leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-[#030712] transition-all hover:brightness-110 active:brightness-95 shadow-xl"
                    style={{ backgroundColor: activeStep.color }}
                  >
                    <span>{t("جرّب هذه المرحلة مجانًا", "Try This Stage Free")}</span>
                    <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
                  </Link>
                </div>

                {/* Simulated Interactive Preview Card */}
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] relative overflow-hidden">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06] text-xs">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeStep.color }} />
                      <span>{t("محاكاة توضيحية للمرحلة", "Interactive Simulation")}</span>
                    </span>
                    <span className="font-mono text-[#94a3b8] text-[11px] bg-white/[0.04] px-2 py-0.5 rounded">
                      {locale === "en" ? activeStep.demoHighlightEn : activeStep.demoHighlightAr}
                    </span>
                  </div>

                  {activeStepIndex === 0 && (
                    <div className="space-y-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-400/30 text-[#e2e8f0]">
                        <span className="block font-bold text-cyan-300 mb-1">العلوم المتكاملة · الترم الأول 2026–2027</span>
                        <p className="text-[11px] text-[#94a3b8]">المصدر: دليل المذاكرة الأصلي ذو البصمة المسجلة · ليس كتابًا رسميًا</p>
                      </div>
                      <p className="text-xs text-[#cbd5e1] leading-relaxed">
                        تُحفظ هوية ملف المصدر وبصمته عندما تتوفر. هذا الملف النصي لا يوفّر أرقام صفحات، لذلك لا نختلق إحالات صفحات.
                      </p>
                    </div>
                  )}

                  {activeStepIndex === 1 && (
                    <div className="space-y-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-400/30 text-[#e2e8f0]">
                        <span className="block font-bold text-indigo-300 mb-1">الهدف: حساب مميز المعادلة التربيعية</span>
                        <p className="font-mono text-xs text-white">Δ = b² - 4ac = (-4)² - 4(1)(5) = 16 - 20 = -4 &lt; 0</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/25 text-amber-200 text-[11px]">
                        ⚠️ تنبيه شائع: لا تخلط بين المميز السالب والمميز الصفري؛ السالب يعني جذرين مركبين مترافقين.
                      </div>
                    </div>
                  )}

                  {activeStepIndex === 2 && (
                    <div className="space-y-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-pink-950/30 border border-pink-400/30 text-[#e2e8f0]">
                        <span className="block font-bold text-pink-300 mb-1">تقييم فوري وتصحيح معلل</span>
                        <p className="text-white">س: ما نوع جذري المعادلة إذا كان المميز يساوي -16؟</p>
                        <p className="text-emerald-300 font-semibold mt-1">✓ الصواب: جذران مركبان مترافقان (لأن Δ &lt; 0).</p>
                      </div>
                      <p className="text-[11px] text-[#94a3b8]">
                        التصحيح يشرح أسباب الخطأ والمغالطة الرياضية فورًا ولا يكتفي بوضع علامة خطأ.
                      </p>
                    </div>
                  )}

                  {activeStepIndex === 3 && (
                    <div className="space-y-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-400/30 text-[#e2e8f0]">
                        <span className="block font-bold text-emerald-300 mb-1">مثال تقديري لبطاقة جديدة</span>
                        <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                          <div className="bg-black/30 p-2 rounded">
                            <span className="text-[10px] text-[#94a3b8] block">مرة أخرى</span>
                            <strong className="text-emerald-400">١٠ دقائق</strong>
                          </div>
                          <div className="bg-black/30 p-2 rounded">
                            <span className="text-[10px] text-[#94a3b8] block">جيد</span>
                            <strong className="text-emerald-400">يوم</strong>
                          </div>
                          <div className="bg-black/30 p-2 rounded">
                            <span className="text-[10px] text-[#94a3b8] block">سهل</span>
                            <strong className="text-emerald-400">٤ أيام</strong>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#94a3b8]">
                        هذا مثال موثق لقاعدة البطاقة الشخصية، وليس نتيجة متعلم أو دليل إتقان.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Final CTA */}
        <Reveal>
          <div className="text-center max-w-2xl mx-auto py-10">
            <h2 className="p-h2 mb-4">
              {t("جرّب منظومة الإتقان بنفسك الآن", "Try the Mastery System Yourself")}
            </h2>
            <p className="text-sm text-[#94a3b8] mb-8">
              {t(
                "درس واحد يكفي لتلمس الفارق بين الحفظ السطحي والفهم الراسخ.",
                "Just one lesson will reveal the difference between surface memorization and lasting comprehension.",
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
