"use client";
import Link from "next/link";
import { MarketingShell, Reveal } from "./marketing-shell";
import { useLocale, useTranslation } from "@/lib/i18n/locale";

const FAQS = [
  {
    qAr: "ما هي نقطة؟", qEn: "What is Noata?",
    aAr: "منصة تعلّم عربية للمدرسة المصرية: منهج كامل بوحدات ودروس وأسئلة، ومراجعة مجدولة تعتمد على أدائك، ومساعد ذكي بأنماط دراسية، مع مصحف موثّق ونظام مهام ومكافآت.",
    aEn: "An Arabic-first learning platform for the Egyptian school system: a complete curriculum with units, lessons and questions; performance-based scheduled review; an AI companion with study modes; a verified Quran reader; and a missions-and-rewards system.",
  },
  {
    qAr: "لمن نقطة؟", qEn: "Who is Noata for?",
    aAr: "طالب الصف الأول الثانوي الترم الأول أساسًا في هذا الإصدار، ومعه المعلمون الذين يوزعون واجبات على فصولهم ويتابعون الأداء.",
    aEn: "Primarily First Secondary students in Term 1 in this release, along with teachers who assign work to their classes and follow performance.",
  },
  {
    qAr: "هل المحتوى مطابق للكتاب المدرسي؟", qEn: "Does the content match the school textbook?",
    aAr: "المحتوى مبني على دليل مذاكرة أصلي ومفصّل يشرح الأفكار والقواعد ويقدم أمثلة وأسئلة تدريب، وليس نسخة حرفية من الكتب المدرسية. ننصح دائمًا بمراجعة الكتاب المدرسي مع الدروس — خصوصًا النصوص الأدبية والمفردات والأشكال — وهذا مذكور داخل كل مادة.",
    aEn: "The content is built from an original detailed study guide explaining ideas and rules with examples and practice — not a verbatim textbook copy. Always use the school book alongside the lessons — especially for literary texts, vocabulary and figures — as noted inside every subject.",
  },
  {
    qAr: "هل إجابات المساعد الذكي مضمونة؟", qEn: "Are the AI companion's answers guaranteed?",
    aAr: "لا. المساعد يعمل بأنماط واضحة (اشرح، اختبرني، بطاقات…) ويمكن الإبلاغ عن أي خطأ وتصحيحه. النماذج اللغوية قد تخطئ، فاعرض الإجابات المهمة على كتابك ومدرسك.",
    aEn: "No. The companion works in clear modes (explain, quiz me, flashcards…) and errors can be reported and corrected. Language models can be wrong — check important answers against your book and teacher.",
  },
  {
    qAr: "كيف تعمل المراجعة المجدولة؟", qEn: "How does scheduled review work?",
    aAr: "كل محاولة تُسجل كدليل على مهارة معينة؛ المهارات الأضعف يبعد موعدها أقل فتعود إليك أبكر، والمهارات المتقنة تتباعد مواعيدها، ويمكنك دائمًا التدريب الحر خارج الجدول.",
    aEn: "Every attempt is recorded as evidence for a skill; weaker skills get nearer review dates and return sooner, mastered skills spread out — and free practice outside the schedule is always available.",
  },
  {
    qAr: "بأي لغات تعمل المنصة؟", qEn: "Which languages does the platform support?",
    aAr: "العربية والإنجليزية في الواجهة، والدرس والأسئلة والشرح متوفرة باللغتين، مع دعم كامل للكتابة من اليمين لليسار.",
    aEn: "Arabic and English in the interface, with lessons, questions and explanations available in both languages and full right-to-left support.",
  },
  {
    qAr: "ماذا عن خصوصيتي؟", qEn: "What about my privacy?",
    aAr: "محتواك وبياناتك ملك لحسابك ولا يراها غيرك، والوصول إليها محكوم بصلاحيات على مستوى قاعدة البيانات نفسها. راجع صفحة الخصوصية للتفاصيل.",
    aEn: "Your content and data belong to your account and are not visible to others; access is governed by permissions at the database level itself. See the privacy page for details.",
  },
  {
    qAr: "هل يمكنني تجربة المنصة دون حساب؟", qEn: "Can I try the platform without an account?",
    aAr: "يمكنك تصفح الموقع العام ومعرفة كل شيء عن المنهج والمزايا؛ أما الدروس والتقدم والمراجعة فتحتاج حسابًا لأن تقدمك يُحفظ لك وحدك.",
    aEn: "You can browse this site and learn all about the curriculum and features; lessons, progress and review need an account because your progress is saved for you alone.",
  },
  {
    qAr: "هل نقطة مجانية؟", qEn: "Is Noata free?",
    aAr: "إنشاء الحساب واستخدام مسار التعلّم متاحان حاليًا بلا مقابل. إن تغير ذلك مستقبلًا سنعلنه بوضوح قبل أي تغيير.",
    aEn: "Creating an account and using the learning path are currently free of charge. If that ever changes, it will be announced clearly before anything changes.",
  },
  {
    qAr: "واجهت خطأً في محتوى، ماذا أفعل؟", qEn: "I found a content error — what should I do?",
    aAr: "استخدم خيار الإبلاغ في صفحة المساعدة داخل المنصة ووصّل تفاصيل الدرس والسؤال؛ نراجع البلاغات ونصحح المصدر نفسه حتى لا يتكرر الخطأ.",
    aEn: "Use the report option on the in-app help page with the lesson and question details; we review reports and fix the source itself so the error does not recur.",
  },
];

export function FaqMarketing() {
  const t = useTranslation(), locale = useLocale();
  return (
    <MarketingShell>
      <section className="mk-section mk-center">
        <Reveal>
          <span className="mk-eyebrow">{t("أسئلة شائعة", "FAQ")}</span>
          <h1 className="mk-h2" style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)" }}>
            {t("إجابات صريحة قبل أن تسأل", "Straight answers before you ask")}
          </h1>
          <p className="mk-sub">
            {t(
              "نجيب هنا بالقدر الذي تعمله المنصة فعلاً — بلا وعود زائدة.",
              "We answer with what the platform actually does today — no inflated promises.",
            )}
          </p>
        </Reveal>
      </section>
      <section className="mk-section" style={{ paddingTop: 0 }}>
        <Reveal>
          <div className="mk-faq">
            {FAQS.map((item) => (
              <details key={item.qEn}>
                <summary>{locale === "en" ? item.qEn : item.qAr}</summary>
                <p>{locale === "en" ? item.aEn : item.aAr}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </section>
      <section className="mk-band">
        <div className="mk-band-inner">
          <div>
            <h2 className="mk-h2">{t("سؤالك غير موجود؟", "Question not covered?")}</h2>
            <p className="mk-sub">{t("مركز المساعدة داخل المنصة يستقبل استفساراتك وبلاغاتك.", "The in-app help center takes your questions and reports.")}</p>
          </div>
          <Link className="mk-button secondary" href="/help">{t("مركز المساعدة", "Help center")}</Link>
        </div>
      </section>
    </MarketingShell>
  );
}
