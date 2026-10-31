"use client";
import Link from "next/link";
import { MarketingShell, Reveal } from "./marketing-shell";
import { useLocale, useTranslation } from "@/lib/i18n/locale";

const PRINCIPLES = [
  { icon: "◈", ar: "الفهم قبل الحفظ", en: "Understanding before memorising", dAr: "كل درس يبدأ بأهداف وشرح متدرّج ومثال محلول قبل أي سؤال.", dEn: "Every lesson opens with objectives, a stepped explanation and a worked example before any question." },
  { icon: "◎", ar: "الاسترجاع الفعّال", en: "Active recall", dAr: "تجرّب الإجابة بنفسك أولًا، ثم يأتي التصحيح ليشرح السبب ويسمّي المغالطة.", dEn: "You answer first; correction follows with reasons and the named misconception." },
  { icon: "◇", ar: "المراجعة الموزّعة", en: "Spaced review", dAr: "ما تتعلمه يعود إليك في وقته المناسب حتى يثبت، لا في ليلة الامتحان فقط.", dEn: "What you learn returns at the right time until it sticks — not only the night before." },
  { icon: "❖", ar: "شفافية المصدر", en: "Source transparency", dAr: "محتوانا المدرسي مبني على دليل مذاكرة أصلي ونقول ذلك بوضوح داخل المادة نفسها.", dEn: "Our curriculum content is built from an original study guide — and we say so inside the product itself." },
  { icon: "✦", ar: "احترام المتعلم", en: "Respect for the learner", dAr: "لا ضغط ولا خجل: رسائل تشجيع صادقة وبيانات تقدم حقيقية لا أرقام مختلقة.", dEn: "No pressure, no shame: honest encouragement and real progress data — never fabricated numbers." },
  { icon: "◈", ar: "وصول للجميع", en: "Access for everyone", dAr: "لغتان واتجاهان ولوحة مفاتيح وقارئ شاشة وتركيز واضح وتقليل الحركة عند الحاجة.", dEn: "Two languages and directions, keyboard and screen-reader support, visible focus and reduced motion." },
];

export function AboutMarketing() {
  const t = useTranslation(), locale = useLocale();
  return (
    <MarketingShell>
      <section className="mk-section">
        <Reveal>
          <span className="mk-eyebrow">{t("عن نقطة", "About Noäta")}</span>
          <h1 className="mk-h2" style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)" }}>
            {t("لماذا وُجدت نقطة؟", "Why Noäta exists")}
          </h1>
          <div className="mk-prose" style={{ marginBlockStart: 18 }}>
            <p>
              {t(
                "المذاكرة في مصر غالبًا تعني ملخصات مبعثرة وامتحانات قديمة وليلة مراجعة متوترة. المشكلة ليست قلة المجهود — الجهد موجود — بل أن أدوات المراجعة لا تعرف ما تعرفه ولا ما تنساه ولا متى تعود إليه.",
                "Studying in Egypt often means scattered summaries, past papers and one tense revision night. The problem is rarely effort — effort is there — it's that revision tools don't know what you know, what you've forgotten, or when to revisit it.",
              )}
            </p>
            <p>
              {t(
                "نقطة بُنيت لتكون المسار نفسه: منهج كامل مقسّم إلى دروس قصيرة، وسؤال بعد كل فكرة، وتصحيح يشرح سبب الخطأ، وجدولة تعيد الأصعب أبكر والراسخ أبعد. المذاكرة تتحول من «قرأت الدرس» إلى «أستطيع أن أحلّه».",
                "Noäta is built to connect published source-mapped lessons, server-graded practice, and scheduled review. Missing content stays unavailable, and a review date is an estimate rather than proof of mastery. Studying can move from “I read it” toward “I can apply it”.",
              )}
            </p>
            <p>
              <b>{t("فلسفتنا التعليمية", "Our learning philosophy")}:</b>{" "}
              {t(
                "التعلّم الحقيقي يمر بفهمٍ ثم تطبيقٍ ثم استرجاعٍ ثم مراجعة موزّعة — وكل ميزة في نقطة تخدم إحدى هذه المراحل أو تصل بينها.",
                "Real learning moves through understanding, practice, retrieval and spaced review — and every Noäta feature serves one of those stages or connects them.",
              )}
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mk-section">
        <Reveal>
          <h2 className="mk-h2">{t("مبادئ تصنع التجربة", "Principles that shape the product")}</h2>
          <p className="mk-sub">
            {t(
              "هذه ليست شعارات؛ ستجد أثر كل مبدأ في الدرس والسؤال وجدولة المراجعة.",
              "These aren't slogans; you'll find each principle at work in the lesson, the question and the review schedule.",
            )}
          </p>
          <div className="mk-cards">
            {PRINCIPLES.map((principle) => (
              <article className="mk-card" key={principle.en}>
                <span className="mk-card-icon" aria-hidden="true">{principle.icon}</span>
                <h3>{locale === "en" ? principle.en : principle.ar}</h3>
                <p>{locale === "en" ? principle.dEn : principle.dAr}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mk-section">
        <Reveal>
          <h2 className="mk-h2">{t("دور الذكاء الاصطناعي وحدوده", "AI's role — and its limits")}</h2>
          <div className="mk-prose" style={{ marginBlockStart: 16 }}>
            <p>
              {t(
                "المساعد الذكي في نقطة أداة تعليم لا موجة إجابات: يشرح بخطوات، ويختبر قبل أن يكشف، ويقبل التصحيح والتعديل. ونحن نقول بوضوح: النماذج اللغوية قد تخطئ، فاعرض مخرجاتها على كتابك المدرسي ومدرسك، وأبلغنا عن أي خطأ لتصحيحه.",
                "Noäta's AI companion is a teaching tool, not an answer firehose: it explains in steps, quizzes before revealing, and accepts correction and editing. And we say clearly: language models can be wrong — check their output against your school book and teacher, and report errors so we fix them.",
              )}
            </p>
            <p>
              {t(
                "لهذا السبب نفسه نحفظ مصدر المحتوى المدرسي: تعرف أن كل درس جاء من دليل مذاكرة أصلي معروف المصدر، لا من توليد آلي بلا مرجع.",
                "For the same reason we keep curriculum provenance: you know each lesson comes from a known original study guide, not ungrounded generation.",
              )}
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mk-band">
        <div className="mk-band-inner">
          <div>
            <h2 className="mk-h2">{t("جرّب الفلسفة بنفسك", "Try the philosophy yourself")}</h2>
            <p className="mk-sub">{t("درس واحد سيوضح الفرق.", "One lesson will make the difference clear.")}</p>
          </div>
          <Link className="mk-button" href="/signup">{t("ابدأ التعلم مجانًا", "Start learning free")}</Link>
        </div>
      </section>
    </MarketingShell>
  );
}
