"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HELP_ARTICLES, type HelpArticle } from "@/lib/support/knowledge-base";
import { SUPPORT_CATEGORIES, type SupportCategory } from "@/lib/support/types";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";

export function HelpCenterLive({ showFaq = true }: { showFaq?: boolean } = {}) {
  const t = useTranslation();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const account = useVerifiedAccount();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeArticle, setActiveArticle] = useState<HelpArticle | null>(null);

  // Contact Form state
  const [formName, setFormName] = useState(account.user?.user_metadata?.full_name || "");
  const [formEmail, setFormEmail] = useState(account.user?.email || "");
  const [formSubject, setFormSubject] = useState("");
  const [formCategory, setFormCategory] = useState<SupportCategory>("general");
  const [formMessage, setFormMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [submissionResult, setSubmissionResult] = useState<{
    ticketCode: string;
    emailDelivery: {
      delivered: boolean;
      status: string;
      destination: string;
      missingEnv?: string[];
      note: string;
    };
  } | null>(null);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return HELP_ARTICLES.filter((article) => {
      const matchCategory =
        selectedCategory === "all" || article.category === selectedCategory;
      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        article.titleAr.toLowerCase().includes(q) ||
        article.titleEn.toLowerCase().includes(q) ||
        article.summaryAr.toLowerCase().includes(q) ||
        article.summaryEn.toLowerCase().includes(q) ||
        article.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    setSubmissionResult(null);

    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName || (isRtl ? "مستخدم نقطة" : "Noäta Learner"),
          email: formEmail,
          subject: formSubject,
          category: formCategory,
          message: formMessage,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(data.error || (isRtl ? "تعذر إرسال طلب الدعم" : "Failed to submit support ticket"));
      }

      setSubmissionResult({
        ticketCode: data.ticketCode,
        emailDelivery: data.emailDelivery,
      });

      // Reset form fields
      setFormSubject("");
      setFormMessage("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`max-w-6xl mx-auto px-6 ${showFaq ? "py-12 md:py-16" : "py-4 md:py-6"}`}>
      {showFaq && (
        <>
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="p-eyebrow">{t("مركز المساعدة والدعم المباشر", "Help Center & Support")}</span>
        <h1 className="p-h2 mb-4">
          {t("كيف يمكننا مساعدتك اليوم؟", "How Can We Help You Today?")}
        </h1>
        <p className="text-[#94a3b8] text-base md:text-lg leading-relaxed mb-8">
          {t(
            "ابحث في أدلة المنهج، المسارات المستقلة، أنماط المساعد الذكي، والتكرار المتباعد — أو تواصل مباشرة مع فريق الدعم.",
            "Explore guides on curriculum tracks, AI study companion modes, and spaced repetition — or contact our support team directly.",
          )}
        </p>

        {/* Live Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              "ابحث في مقالات المساعدة (مثل: مسارات، رياضيات، تكرار متباعد، مساعد ذكي)...",
              "Search help articles (e.g., tracks, science, spaced repetition, AI companion)...",
            )}
            className="w-full py-4 px-6 rounded-2xl bg-white/[0.05] border border-white/[0.12] focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-[#f1f5f9] placeholder:text-[#64748b] text-sm md:text-base shadow-xl"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 -translate-y-1/2 end-4 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#cbd5e1]"
            >
              {t("مسح", "Clear")}
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        {[
          { key: "all", ar: "كل المقالات", en: "All Articles" },
          { key: "curriculum", ar: "المنهج والمواد", en: "Curriculum" },
          { key: "tracks", ar: "المسارات اللغوية", en: "Language Tracks" },
          { key: "ai", ar: "المساعد الذكي", en: "Noäta AI" },
          { key: "lessons", ar: "المراجعة والتكرار", en: "Spaced Review" },
          { key: "account", ar: "الحساب والخصوصية", en: "Account & Sync" },
          { key: "bug", ar: "استكشاف الأخطاء", en: "Troubleshooting" },
        ].map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              selectedCategory === cat.key
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-white/[0.04] text-[#cbd5e1] border border-white/[0.08] hover:bg-white/[0.08]"
            }`}
          >
            {locale === "en" ? cat.en : cat.ar}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {filteredArticles.map((article) => (
          <article
            key={article.slug}
            onClick={() => setActiveArticle(article)}
            className="p-glass rounded-2xl p-6 cursor-pointer border border-white/[0.08] hover:border-indigo-400/50 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                  {locale === "en" ? article.categoryEn : article.categoryAr}
                </span>
                <span className="text-xs text-[#64748b] group-hover:text-indigo-300 transition-colors">
                  {t("قراءة الدليل", "Read Guide")} →
                </span>
              </div>
              <h3 className="text-base md:text-lg font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors">
                {locale === "en" ? article.titleEn : article.titleAr}
              </h3>
              <p className="text-xs md:text-sm text-[#94a3b8] leading-relaxed mb-4">
                {locale === "en" ? article.summaryEn : article.summaryAr}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/[0.06]">
              {article.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] text-[#64748b]">
                  #{tag}
                </span>
              ))}
            </div>
          </article>
        ))}
        {filteredArticles.length === 0 && (
          <div className="col-span-full text-center py-12 p-glass rounded-2xl">
            <p className="text-[#94a3b8] text-base mb-3">
              {t("لم يتم العثور على مقالات مطابقة لبحثك.", "No articles found matching your query.")}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="text-xs font-bold text-indigo-400 hover:underline"
            >
              {t("إعادة ضبط البحث والتصنيفات", "Reset search filters")}
            </button>
          </div>
        )}
      </div>

      {/* Article Detail Modal / Reader */}
      {activeArticle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setActiveArticle(null)}
        >
          <div
            className="bg-[#0b1120] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveArticle(null)}
              className="absolute top-5 end-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold"
              aria-label={t("إغلاق", "Close")}
            >
              ✕
            </button>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3 inline-block">
              {locale === "en" ? activeArticle.categoryEn : activeArticle.categoryAr}
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
              {locale === "en" ? activeArticle.titleEn : activeArticle.titleAr}
            </h2>
            <div className="prose prose-invert max-w-none text-sm md:text-base text-[#cbd5e1] leading-relaxed whitespace-pre-line mb-6 border-y border-white/[0.08] py-4">
              {locale === "en" ? activeArticle.contentEn : activeArticle.contentAr}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748b]">
                {t("منصة نقطة · دليل المنتج", "Noäta Platform · Product guide")}
              </span>
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
              >
                {t("تم، العودة للمركز", "Done, return to Help Center")}
              </button>
            </div>
          </div>
        </div>
      )}

              </>
      )}

      {/* CONTACT SUPPORT WORKFLOW (Section 12.3 & 12.4) */}
      <section id="contact" className="mt-16 pt-12 border-t border-white/[0.1]">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Info Side */}
          <div className="lg:col-span-2">
            <span className="p-eyebrow">{t("فريق الدعم الفني المباشر", "Direct Human Support")}</span>
            <h2 className="p-h2 mb-4 text-2xl md:text-3xl">
              {t("هل لديك سؤال أو تواجه مشكلة؟", "Have a Question or Found an Issue?")}
            </h2>
            <p className="text-[#94a3b8] text-sm md:text-base leading-relaxed mb-6">
              {t(
                "املأ النموذج التالي. سنؤكد الحفظ أولًا، ثم نحاول إرسال إشعار عبر مزود البريد المهيأ ونوضح حالته بصدق.",
                "Submit your inquiry below. We confirm persistence first, then attempt email delivery through the configured provider and report its status truthfully.",
              )}
            </p>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3 text-xs text-[#cbd5e1]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="font-semibold text-white">{t("وجهة إشعارات الدعم:", "Support Destination:")}</span>
              </div>
              <p className="font-mono text-indigo-300 text-xs bg-indigo-950/50 p-2 rounded-lg border border-indigo-500/20 dir-ltr text-start">
                mazenshazly011@gmail.com
              </p>
              <p className="text-[#94a3b8] text-[11px] leading-relaxed">
                {t(
                  "كل تذكرة تحصل على كود متابعة مرجعي فريد وتُسجل في قاعدة البيانات لضمان تتبعها بدقة.",
                  "Every ticket receives a unique reference tracking code and is safely stored in our support registry.",
                )}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2 text-xs">
              <Link href="/faq" className="text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
                <span>{t("تصفح الأسئلة الشائعة أولاً", "Check Frequently Asked Questions")}</span>
                <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
              </Link>
              <Link href="/curriculum" className="text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
                <span>{t("العودة إلى استكشاف المنهج والمسارات", "Explore Curriculum & Tracks")}</span>
                <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
              </Link>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-3">
            <div className="p-glass rounded-3xl p-6 md:p-8 border border-white/[0.1] shadow-2xl relative">
              <h3 className="text-lg md:text-xl font-bold text-white mb-6">
                {t("إرسال تذكرة دعم فني جديدة", "Submit New Support Ticket")}
              </h3>

              {/* Truthful Success Feedback (Section 12.6) */}
              {submissionResult && (
                <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/40 text-sm animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
                    <span className="text-lg">✓</span>
                    <span>{t("تم استلام تذكرتك بنجاح!", "Ticket Received Successfully!")}</span>
                  </div>
                  <p className="text-xs text-[#e2e8f0] mb-3">
                    {t("كود التذكرة المرجعي:", "Ticket Reference Code:")}{" "}
                    <strong className="font-mono text-indigo-300 text-sm px-2 py-0.5 rounded bg-indigo-500/20">
                      #{submissionResult.ticketCode}
                    </strong>
                  </p>

                  {/* Truthful Email Status */}
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#94a3b8] font-semibold">{t("حالة إشعار البريد:", "Email Notification Status:")}</span>
                      {submissionResult.emailDelivery.delivered ? (
                        <span className="text-emerald-400 font-bold">
                          {t("تم الإرسال إلى", "Sent to")} mazenshazly011@gmail.com
                        </span>
                      ) : (
                        <span className="text-amber-300 font-semibold">
                          {t("مجدول بانتظار مزود البريد", "Queued (Provider Key Pending)")}
                        </span>
                      )}
                    </div>
                    <p className="text-[#94a3b8] text-[11px] leading-relaxed">
                      {submissionResult.emailDelivery.note}
                    </p>
                  </div>
                </div>
              )}

              {formError && (
                <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                      {t("الاسم الكامل", "Full Name")} <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={t("اسمك", "Your name")}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.1] focus:border-indigo-500 focus:outline-none text-sm text-white placeholder:text-[#64748b]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                      {t("البريد الإلكتروني للرد", "Email Address for Reply")} <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full py-2.5 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.1] focus:border-indigo-500 focus:outline-none text-sm text-white placeholder:text-[#64748b]"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                      {t("تصنيف الطلب", "Category")} <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as SupportCategory)}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-[#0c1427] border border-white/[0.1] focus:border-indigo-500 focus:outline-none text-sm text-white"
                    >
                      {SUPPORT_CATEGORIES.map((c) => (
                        <option key={c.key} value={c.key}>
                          {locale === "en" ? c.en : c.ar}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                      {t("موضوع الرسالة", "Subject")} <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      placeholder={t("ملخص قصير للموضوع", "Short summary")}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.1] focus:border-indigo-500 focus:outline-none text-sm text-white placeholder:text-[#64748b]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#cbd5e1]">
                      {t("تفاصيل الاستفسار أو المشكلة", "Message & Details")} <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] text-[#64748b]">
                      {formMessage.length}/4000
                    </span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder={t(
                      "يرجى كتابة التفاصيل بدقة حتى نتمكن من مساعدتك بأسرع ما يمكن...",
                      "Please provide detailed information so we can assist you effectively...",
                    )}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-white/[0.04] border border-white/[0.1] focus:border-indigo-500 focus:outline-none text-sm text-white placeholder:text-[#64748b] resize-y"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>{t("جارٍ إرسال التذكرة...", "Submitting Ticket...")}</span>
                      </>
                    ) : (
                      <>
                        <span>{t("إرسال طلب الدعم الفني", "Submit Support Ticket")}</span>
                        <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
