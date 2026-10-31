"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MarketingShell, Reveal } from "./marketing-shell";
import { useLocale, useTranslation } from "@/lib/i18n/locale";

interface FaqItem {
  id: string;
  category: "curriculum" | "methodology" | "ai" | "account";
  qAr: string;
  qEn: string;
  aAr: string;
  aEn: string;
}

const FAQ_LIST: FaqItem[] = [
  // Category: Curriculum
  {
    id: "provenance",
    category: "curriculum",
    qAr: "هل المحتوى مطابق للكتاب المدرسي؟ ومن أين جاءت الدروس؟",
    qEn: "Does the content match the school textbook, and what is its provenance?",
    aAr: "المحتوى مبني على دليل مذاكرة أصلي ومفصل لكل مادة يفكك القواعد والمفاهيم ويشرحها خطوة بخطوة، وليس نسخة منسوخة حرفيًا من الكتب المدرسية. ونبين مصدر كل درس بوضوح داخل المنصة، وننصح دائمًا بالاستعانة بالكتاب المدرسي معه كمرجع أساسي.",
    aEn: "Lessons are mapped to the repository's original, SHA-256-recorded study pack. It is not an official textbook or a verbatim copy. Every available lesson displays that caveat, and learners should use the school textbook alongside it.",
  },
  {
    id: "tracks",
    category: "curriculum",
    qAr: "ما الفرق بين المسار العربي والمسار الإنجليزي في العلوم والرياضيات؟",
    qEn: "What is the difference between Arabic and English tracks in Science & Math?",
    aAr: "العلوم المتكاملة والرياضيات تقدم كلٌّ منهما في مسارين مستقلين تمامًا (عربي وإنجليزي). الدروس والأسئلة ودرجات التقدم لكل مسار منفصلة عن الآخر؛ فالتقدم في أحدهما لا ينتقل للآخر. وتغيير لغة الواجهة لا يغير مسارك الدراسي المختار في حسابك.",
    aEn: "Integrated Science and Mathematics are each delivered in two strictly independent tracks: Arabic-medium and English-medium. Lessons, question banks, and learner progress are kept isolated with zero cross-bleeding. Changing your UI language never alters your selected curriculum track.",
  },
  {
    id: "subjects",
    category: "curriculum",
    qAr: "ما هي المواد المشمولة حاليًا في المنصة؟",
    qEn: "Which subjects are currently included on the platform?",
    aAr: "يعرض كتالوج نقطة ست عائلات مواد وثمانية مسارات عند نشرها في قاعدة المحتوى: مساران مستقلان للعلوم، ومساران للرياضيات، ومسار لكل من التاريخ والعربية والإنجليزية والفلسفة والمنطق. المحتوى الحالي دليل مذاكرة أصلي موثّق المصدر وليس كتابًا رسميًا، وأي مادة غير منشورة تظهر بوضوح كغير متاحة.",
    aEn: "Noäta's catalog defines six subject families and eight tracks when published in the connected content database: separate Arabic/English Science and Mathematics tracks, plus History, Arabic, English, and Philosophy & Logic. Current material is a source-recorded original study guide, not an official textbook; unavailable records are shown as unavailable.",
  },

  // Category: Methodology & Spaced Repetition
  {
    id: "sm2",
    category: "methodology",
    qAr: "كيف يعمل التكرار المتباعد (SM-2) وجدولة المراجعة في نقطة؟",
    qEn: "How does spaced repetition (SM-2) and review scheduling work?",
    aAr: "توجد آليتان منفصلتان: مراجعة المهارات تُجدول من نتائج المحاولات المسجلة، وبطاقات الاسترجاع تستخدم خوارزمية مستوحاة من SM-2 وفق تقييمك (مرة أخرى/صعب/جيد/سهل). الفواصل تقديرية وليست دليلًا على الإتقان، ولا تمنح مكافآت.",
    aEn: "Two systems remain distinct: skill review dates come from recorded assessment attempts, while saved flashcards use an SM-2-inspired schedule based on Again/Hard/Good/Easy ratings. Intervals are estimates, not mastery proof, and grant no rewards.",
  },
  {
    id: "deterministic-feedback",
    category: "methodology",
    qAr: "كيف يختلف تصحيح التدريبات في نقطة عن مجرد وضع علامة صح أو خطأ؟",
    qEn: "How does Noäta's drill feedback differ from simple right or wrong marks?",
    aAr: "تُصحح الأسئلة الموضوعية على الخادم بمفتاح إجابة منشور للمسؤولين فقط، ثم يظهر تفسير السؤال المخزّن بعد الإجابة. لا ندّعي تشخيص سبب شخصي للخطأ ما لم تسجله الأدلة فعلًا.",
    aEn: "Objective questions are graded server-side against staff-only answer keys, then the stored question explanation is revealed. Noata does not claim a personal misconception diagnosis unless the evidence actually supports one.",
  },
  {
    id: "study-flow",
    category: "methodology",
    qAr: "ما هو الترتيب النموذجي لدراسة الدرس على نقطة؟",
    qEn: "What is the recommended study sequence on Noäta?",
    aAr: "تبدأ بقراءة التوثيق الأكاديمي للمصدر، ثم استيعاب الشرح المتدرج مع الأمثلة المحلولة، ثم مناقشة المفاهيم الشائكة مع Noäta AI، ثم حل التدريب الفوري، وأخيرًا تثبيت المفاهيم في جدول المراجعة المتباعدة.",
    aEn: "You begin with authentic source documentation, digest stepped breakdowns with worked examples, discuss nuanced points with Noäta AI, complete active drills, and lock in concepts with scheduled spaced review.",
  },

  // Category: AI Companion
  {
    id: "ai-accuracy",
    category: "ai",
    qAr: "هل إجابات المساعد الذكي Noäta AI مضمونة؟ وماذا لو ارتكب خطأ؟",
    qEn: "Are Noäta AI companion answers guaranteed, and what if an error occurs?",
    aAr: "المساعد أداة تعليمية تعمل بأنماط دراسية واضحة ومقيدة بالمنهج، لكن النماذج اللغوية قد تخطئ أحيانًا. لذلك تعرض مخرجاته كمسودة للمراجعة، وتوجد آلية فورية للإبلاغ عن أي ملحوظة بنقرة واحدة، كما يمكن التواصل مباشرة مع فريق الدعم الأكاديمي لمراجعتها وتصحيحها.",
    aEn: "The AI companion works in disciplined study modes grounded in the syllabus, but language models can make mistakes. All AI outputs are treated as reviewable drafts, and learners can report any note with one click or reach our academic team directly for review.",
  },
  {
    id: "ai-modes",
    category: "ai",
    qAr: "ما هي الأنماط الدراسية الأربعة لمساعد Noäta AI؟",
    qEn: "What are the four study modes of Noäta AI?",
    aAr: "١) اشرح لي: تفكيك تدريجي مع توضيح حدود المصدر. ٢) اختبرني: مسودة أسئلة لا تغيّر الدرجات. ٣) بطاقات: مسودة تُراجع ثم تُفعّل في مركز المذاكرة. ٤) لخص: تنظيم المحتوى المتاح من دون اختراع أسئلة امتحان.",
    aEn: "1) Explain: Step-by-step help with source limits. 2) Quiz Me: Practice drafts that do not alter grades. 3) Flashcards: Draft decks you review and activate. 4) Summarize: Organize available material without inventing exam themes.",
  },
  {
    id: "ai-progress",
    category: "ai",
    qAr: "هل يتعلّم المساعد من تقدّمي ومساري الدراسي الحقيقي؟",
    qEn: "Does the AI tutor learn from my actual progress and track?",
    aAr: "عندما تكون سجلات الحساب وكتالوج المسارات متاحين، يحمّل الخادم لقطة محدودة من المسار المختار والتقدم وأدلة المهارة. عند غيابها يصرّح بعدم وجود دليل ولا يخترع تقدمًا أو درسًا متاحًا.",
    aEn: "When account records and the track catalog are available, the server loads a bounded snapshot of the selected track, progress, and skill evidence. If they are absent, it states the limitation rather than inventing progress or an available lesson.",
  },

  // Category: Account & Support
  {
    id: "fees",
    category: "account",
    qAr: "هل أحتاج لدفع رسوم أو إدخال بطاقة بنكية للبدء؟",
    qEn: "Do I need to pay fees or enter a credit card to start?",
    aAr: "لا؛ التسجيل في نقطة وبدء دراسة المنهج متاح مجانًا بدون أي بطاقة بنكية أو التزامات مسبقة. يمكنك البدء في دراسة الدروس وحل التدريبات مباشرة بمجرد إنشاء الحساب.",
    aEn: "No; registering and starting curriculum study on Noäta is completely free with no payment cards or prior commitments required. You can start studying lessons and solving quizzes right after signing up.",
  },
  {
    id: "support-contact",
    category: "account",
    qAr: "كيف يمكنني التواصل مع فريق الدعم الفني ومركز المساعدة؟",
    qEn: "How do I reach the technical support team and Help Center?",
    aAr: "يمكنك إرسال تذكرة من صفحة المساعدة. لا تظهر رسالة نجاح إلا بعد تأكيد حفظها، وتحصل التذكرة المحفوظة على كود مرجعي. إرسال البريد يعتمد على مزود البريد المهيأ، ولا نعد بمدة رد غير موثقة.",
    aEn: "Submit a ticket from Help. Success appears only after persistence is confirmed, and each saved ticket receives a reference code. Email delivery depends on the configured provider; no unverified response-time promise is made.",
  },
  {
    id: "accessibility",
    category: "account",
    qAr: "هل تدعم المنصة الهواتف المحمولة وقارئات الشاشة وتقليل الحركة؟",
    qEn: "Does Noäta support mobile devices, screen readers, and reduced motion?",
    aAr: "تستهدف المنصة WCAG 2.2 AA وتوفّر تنقلًا بلوحة المفاتيح وتصميمًا متجاوبًا وخيار تقليل الحركة في المسارات المختبرة. الفحص الآلي لا يُعد شهادة، وما زالت اختبارات قارئات الشاشة والأجهزة الحقيقية بوابة إصدار معلنة.",
    aEn: "Noata targets WCAG 2.2 AA with keyboard navigation, responsive layouts, and reduced motion in tested paths. Automated checks are not certification; real-device and screen-reader testing remains an explicit release gate.",
  },
];

export function FaqMarketing() {
  const t = useTranslation();
  const locale = useLocale();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    { key: "all", ar: "جميع الأسئلة", en: "All Questions", count: FAQ_LIST.length },
    { key: "curriculum", ar: "المنهج والمسارات", en: "Curriculum & Tracks", count: FAQ_LIST.filter((i) => i.category === "curriculum").length },
    { key: "methodology", ar: "طريقة التعلم وSM-2", en: "Methodology & SM-2", count: FAQ_LIST.filter((i) => i.category === "methodology").length },
    { key: "ai", ar: "مساعد Noäta AI", en: "Noäta AI Companion", count: FAQ_LIST.filter((i) => i.category === "ai").length },
    { key: "account", ar: "الحساب والدعم", en: "Account & Support", count: FAQ_LIST.filter((i) => i.category === "account").length },
  ];

  const filteredFaqs = useMemo(() => {
    let list = selectedCategory === "all"
      ? FAQ_LIST
      : FAQ_LIST.filter((item) => item.category === selectedCategory);

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const textToSearch = `${item.qAr} ${item.qEn} ${item.aAr} ${item.aEn}`.toLowerCase();
        return textToSearch.includes(q);
      });
    }

    return list;
  }, [selectedCategory, searchQuery]);

  return (
    <MarketingShell tone="dark">
      {/* Hero Section */}
      <section className="mp-section" data-size="loose">
        <Reveal>
          <div className="mp-head mp-head-center">
            <span className="mp-eyebrow">{t("الأسئلة الشائعة وإجاباتها", "Frequently Asked Questions")}</span>
            <h2>{t("إجابات واضحة وصريحة عن كل ما يخص نقطة", "Clear, Transparent Answers About Everything Noäta")}</h2>
            <p className="mp-lede">
              {t(
                "جمعنا هنا أهم الأسئلة التي يطرحها الطلاب والمعلمون وأولياء الأمور حول المنهج، والمسارات اللغوية، والتكرار المتباعد، وأمان البيانات.",
                "Here are the most common questions asked by students, teachers, and parents regarding our curriculum, language tracks, spaced repetition, and data privacy.",
              )}
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-xl mx-auto my-6 px-4">
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 start-4 flex items-center text-[#94a3b8] text-base pointer-events-none">
                🔍
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("ابحث في الأسئلة الشائعة...", "Search questions & topics...")}
                className="w-full py-3.5 ps-12 pe-4 rounded-2xl bg-white/[0.04] border border-white/[0.12] text-white placeholder-[#64748b] text-sm focus:outline-none focus:border-indigo-400 focus:bg-white/[0.06] transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 end-4 flex items-center text-xs text-[#94a3b8] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto mb-8" role="tablist">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border flex items-center gap-2 ${
                    isActive
                      ? "bg-indigo-600/30 text-white border-indigo-400 shadow-lg shadow-indigo-500/20"
                      : "bg-white/[0.03] text-[#94a3b8] border-white/[0.08] hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <span>{locale === "en" ? cat.en : cat.ar}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      isActive ? "bg-white/20 text-white" : "bg-white/[0.06] text-[#64748b]"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Accordion FAQ Container */}
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] max-w-2xl mx-auto">
              <span className="text-3xl mb-2 block">🔍</span>
              <p className="text-[#94a3b8] text-sm font-medium mb-3">
                {t("لم نجد أسئلة تطابق بحثك حاليًا", "No questions matched your search query")}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4"
              >
                {t("إعادة ضبط البحث وعرض كل الأسئلة", "Reset search and show all questions")}
              </button>
            </div>
          ) : (
            <div className="mp-faq max-w-3xl mx-auto">
              {filteredFaqs.map((item) => (
                <details className="mp-faq-item group" key={item.id}>
                  <summary>
                    <span className="flex-1">{locale === "en" ? item.qEn : item.qAr}</span>
                  </summary>
                  <p>{locale === "en" ? item.aEn : item.aAr}</p>
                </details>
              ))}
            </div>
          )}
        </Reveal>
      </section>

      {/* Direct Support & Help Desk Banner */}
      <section className="mp-section" id="help">
        <Reveal>
          <div className="p-8 md:p-10 rounded-3xl bg-white/[0.03] border border-white/[0.1] max-w-4xl mx-auto text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
            <span className="text-xs uppercase tracking-wider text-cyan-300 font-bold mb-3 inline-block">
              {t("مركز المساعدة والدعم المباشر", "Direct Help Desk & Support")}
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {t("هل لديك سؤال لم تجد إجابته هنا؟", "Have a Question Not Answered Here?")}
            </h3>
            <p className="text-sm text-[#cbd5e1] max-w-2xl mx-auto mb-6 leading-relaxed">
              {t(
                "يمكنك إرسال تذكرة استفسار مباشرة. نؤكد حفظها ونوضح حالة إشعار البريد، من دون وعد بمدة رد غير موثقة:",
                "Our support team is ready to assist you. Submit an inquiry ticket and our team will get back to you via our verified email within 24 working hours:",
              )}
            </p>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.12] font-mono text-sm text-cyan-300 mb-6 shadow-sm">
              <span>✉️</span>
              <span>mazenshazly011@gmail.com</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link className="mp-btn mp-btn-primary" href="/help">
                {t("زيارة مركز المساعدة والأدلة", "Visit Help Center & Guides")}
              </Link>
              <Link className="mp-btn mp-btn-ghost" href="/help#contact">
                {t("تواصل مع فريق الدعم", "Contact Support Team")}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* High-Impact Final CTA Band */}
      <section className="mp-section" data-size="tight">
        <Reveal>
          <div className="mp-band">
            <h2>{t("ابدأ دراستك الآن من أول درس مجانًا", "Start Studying Now with the First Lesson Free")}</h2>
            <p style={{ marginBlock: "var(--mp-space-2) var(--mp-space-4)" }}>
              {t(
                "افتح المنهج الدراسي، واختر المسار الذي يناسبك، وابدأ رحلة الإتقان الحقيقي دون أي بطاقة دفع.",
                "Explore the curriculum, pick your preferred track, and embark on genuine mastery with zero payment cards.",
              )}
            </p>
            <div className="mp-cta-row">
              <Link className="mp-btn mp-btn-primary" href="/signup">
                {t("ابدأ التعلم الآن مجانًا", "Start learning free now")}
              </Link>
              <Link className="mp-btn mp-btn-ghost" href="/curriculum">
                {t("تصفح تفاصيل المنهج", "Browse Curriculum Details")}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </MarketingShell>
  );
}
