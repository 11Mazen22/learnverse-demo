"use client";
import Link from "next/link";
import { MarketingShell, Reveal } from "./marketing-shell";
import { useLocale, useTranslation } from "@/lib/i18n/locale";

const HOW_STEPS = [
  { ar: "١. اختر مادتك", en: "1. Pick your subject", dAr: "ست مواد الترم الأول في مسار واحد، ووحدات مرتبة تبدأ من التأسيس.", dEn: "All six Term 1 subjects in one path, with ordered units starting from foundations." },
  { ar: "٢. اقرأ الدرس", en: "2. Read the lesson", dAr: "أهداف واضحة، شرح مقسّم، مثال محلول، وأخطاء شائعة تحذرّك منها قبل السؤال.", dEn: "Clear objectives, chunked explanation, a worked example, and the common mistakes to avoid before you're asked." },
  { ar: "٣. أجب عن الأسئلة", en: "3. Answer the questions", dAr: "اختيار من متعدد وأسئلة رقمية يحكم عليها الخادم بعدالة، مع تفسير لكل خيار.", dEn: "Multiple-choice and numeric questions graded server-side, with an explanation for every option." },
  { ar: "٤. افهم خطأك", en: "4. Understand your error", dAr: "التصحيح يسمّي المفهوم الذي أخطأت فيه ويشير إلى ما تراجعه.", dEn: "Corrections name the exact concept you missed and point to what to revisit." },
  { ar: "٥. تحدَّ الوحدة", en: "5. Take the unit challenge", dAr: "ثلاثة أسئلة تجمع الوحدة كلها وتكافئ الإتقان لا الحظ.", dEn: "Three questions spanning the whole unit that reward mastery, not luck." },
  { ar: "٦. راجع في موعده", en: "6. Review on schedule", dAr: "قائمة المراجعة تعيد الأصعب أبكر والراسخ أبعد، وتظل متاحة دائمًا للتدريب الحر.", dEn: "The review queue brings the hard back sooner and the solid later — and stays open for free practice." },
];

const CAPABILITIES = [
  { icon: "◈", ar: "رحلة التعلّم", en: "Learning journey", dAr: "وحدات ودروس مرتبة بتقدم محفوظ وبحث وتصفية، والانتقال إلى درسك الأخير بنقرة.", dEn: "Ordered units and lessons with saved progress, search and filters, and one-click resume of your latest lesson." },
  { icon: "◎", ar: "المراجعة الذكية", en: "Smart review", dAr: "حالة إتقان لكل مهارة (جديد/يحتاج دعمًا/متقن) وموعد مراجعة يتحدث مع كل محاولة.", dEn: "A mastery state per skill (new / needs support / mastered) and a next-review date updated with every attempt." },
  { icon: "✦", ar: "Noata AI", en: "Noata AI", dAr: "تسعة أنماط دراسية جاهزة: اشرح لي، اختبر فهمي، بطاقات، لخّص، جدول مذاكرة، حسّن كتابتي، وغيرها — بمستوى وتفصيل تختارهما.", dEn: "Nine ready study modes — explain, quiz me, flashcards, summarise, study plan, improve my writing and more — with your chosen level and depth." },
  { icon: "❖", ar: "المهام والتحديات", en: "Missions & challenges", dAr: "مهام يومية قصيرة وتحدي وحدات ومكافآت — احتفال صادق بالتقدم دون مقارنات محرجة.", dEn: "Short daily missions, unit challenges and rewards — an honest celebration of progress without embarrassing comparisons." },
  { icon: "◈", ar: "المصحف الموثّق", en: "Verified Quran", dAr: "نص موثّق وتلاوة ووضع قراءة مركّز مع مراعاة كاملة للتجويد البصري.", dEn: "Verified text, recitation and a focused reading mode with full visual respect for the mushaf." },
  { icon: "◇", ar: "فصول ومعلمين", en: "Classes & teachers", dAr: "المعلم يوزع واجبات على فصله ويتابع أداء طلابه، والطالب يرى واجباته في مكان واحد.", dEn: "Teachers set assignments for their classes and follow performance; students see all assignments in one place." },
];

const SUBJECT_ROWS = [
  { ar: "الفلسفة والمنطق", en: "Philosophy & Logic", lessons: 5, noteAr: "أربعة دروس رسمية + مراجعة إضافية موسومة بوضوح", noteEn: "Four official lessons + one clearly-labelled extra review" },
  { ar: "العلوم المتكاملة", en: "Integrated Science", lessons: 5, noteAr: "الماء: الغلاف المائي والخصائص والمحاليل والأهمية الحيوية", noteEn: "Water: hydrosphere, properties, solutions, biological importance" },
  { ar: "الرياضيات", en: "Mathematics", lessons: 5, noteAr: "الأعداد المركبة والمعادلة التربيعية والمتباينات", noteEn: "Complex numbers, the quadratic equation, inequalities" },
  { ar: "اللغة العربية", en: "Arabic", lessons: 11, noteAr: "٥ قراءات و٥ دروس نحو وملخص قصة عنترة", noteEn: "5 readings, 5 grammar lessons, the Antara story summary" },
  { ar: "اللغة الإنجليزية", en: "English", lessons: 5, noteAr: "الوحدات الأولى الخمس بمفرداتها وقواعدها وكتابتها", noteEn: "The first five units with vocabulary, grammar and writing" },
  { ar: "التاريخ", en: "History", lessons: 5, noteAr: "الحضارة والمصادر وملامح مصر القديمة واقتصادها", noteEn: "Civilization, sources, ancient Egypt's features and economy" },
];

export function FeaturesMarketing() {
  const t = useTranslation(), locale = useLocale();
  return (
    <MarketingShell>
      <section className="mk-section" id="how">
        <Reveal>
          <span className="mk-eyebrow">{t("كيف تعمل نقطة", "How Noata works")}</span>
          <h1 className="mk-h2" style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)" }}>
            {t("ست خطوات من أول درس إلى الإتقان", "Six steps from first lesson to mastery")}
          </h1>
          <div className="mk-steps" style={{ marginTop: 30 }}>
            {HOW_STEPS.map((step) => (
              <article className="mk-step" key={step.en}>
                <h3>{locale === "en" ? step.en : step.ar}</h3>
                <p>{locale === "en" ? step.dEn : step.dAr}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mk-section">
        <Reveal>
          <h2 className="mk-h2">{t("ماذا ستجد داخل المنصة؟", "What's inside the platform?")}</h2>
          <p className="mk-sub">
            {t(
              "كل ميزة أدناه موجودة فعليًا وتعمل — لا قائمة أمنيات.",
              "Every capability below exists and works today — this is not a wish list.",
            )}
          </p>
          <div className="mk-cards">
            {CAPABILITIES.map((capability) => (
              <article className="mk-card" key={capability.en}>
                <span className="mk-card-icon" aria-hidden="true">{capability.icon}</span>
                <h3>{locale === "en" ? capability.en : capability.ar}</h3>
                <p>{locale === "en" ? capability.dEn : capability.dAr}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mk-section" id="curriculum">
        <Reveal>
          <h2 className="mk-h2">{t("منهج الصف الأول الثانوي — الترم الأول", "The First Secondary Term 1 curriculum")}</h2>
          <p className="mk-sub">
            {t(
              "جدول المواد الست كما هو منشور في المسار، مع عدد الدروس في كل مادة.",
              "The six subjects as published in the learning path, with each subject's lesson count.",
            )}
          </p>
          <div className="noata-comparison-scroll" style={{ marginBlockStart: 24 }} tabIndex={0}>
            <table>
              <caption>{t("مواد الترم الأول 2026–2027 وعدد دروسها", "Term 1 (2026–2027) subjects and lesson counts")}</caption>
              <thead>
                <tr>
                  <th scope="col">{t("المادة", "Subject")}</th>
                  <th scope="col">{t("الدروس", "Lessons")}</th>
                  <th scope="col">{t("النطاق", "Scope")}</th>
                </tr>
              </thead>
              <tbody>
                {SUBJECT_ROWS.map((row) => (
                  <tr key={row.en}>
                    <th scope="row">{locale === "en" ? row.en : row.ar}</th>
                    <td>{row.lessons}</td>
                    <td>{locale === "en" ? row.noteEn : row.noteAr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mk-note">
            {t(
              "المحتوى مبني على دليل مذاكرة أصلي ومفصّل ليس نسخة حرفية من الكتب المدرسية؛ راجع الكتاب المدرسي معه — وهذا مذكور داخل كل مادة حفاظًا على الأمانة.",
              "The content is built from an original detailed study guide, not a verbatim textbook copy; use it alongside the school book — stated inside every subject for honesty.",
            )}
          </p>
        </Reveal>
      </section>

      <section className="mk-band">
        <div className="mk-band-inner">
          <div>
            <h2 className="mk-h2">{t("جرّب أول درس الآن", "Try the first lesson now")}</h2>
            <p className="mk-sub">{t("حسابك يفتح المسار كاملًا.", "Your account opens the full path.")}</p>
          </div>
          <Link className="mk-button" href="/signup">{t("ابدأ التعلم مجانًا", "Start learning free")}</Link>
        </div>
      </section>
    </MarketingShell>
  );
}
