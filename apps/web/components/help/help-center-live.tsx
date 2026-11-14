"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HELP_ARTICLES, type HelpArticle } from "@/lib/support/knowledge-base";
import { SUPPORT_CATEGORIES, type SupportCategory } from "@/lib/support/types";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { Badge, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";

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
            <Badge tone="neutral" className="mb-3">
              {t("مركز المساعدة والدعم المباشر", "Help Center & Support")}
            </Badge>
            <h1 className="mb-4 text-3xl md:text-4xl font-extrabold" style={{ color: "var(--ink)" }}>
              {t("كيف يمكننا مساعدتك اليوم؟", "How Can We Help You Today?")}
            </h1>
            <p className="text-base md:text-lg leading-relaxed mb-8" style={{ color: "var(--muted)" }}>
              {t(
                "ابحث في أدلة المنهج، المسارات المستقلة، أنماط المساعد الذكي، والتكرار المتباعد — أو تواصل مباشرة مع فريق الدعم.",
                "Explore guides on curriculum tracks, AI study companion modes, and spaced repetition — or contact our support team directly.",
              )}
            </p>

            {/* Live Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label={t("ابحث في مقالات المساعدة", "Search help articles")}
                placeholder={t(
                  "ابحث في مقالات المساعدة (مثل: مسارات، رياضيات، تكرار متباعد، مساعد ذكي)...",
                  "Search help articles (e.g., tracks, science, spaced repetition, AI companion)...",
                )}
              />
              {searchQuery && (
                <div className="mt-2 flex justify-end">
                  <Button variant="subtle" size="sm" onClick={() => setSearchQuery("")}>
                    {t("مسح", "Clear")}
                  </Button>
                </div>
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
              <Button
                key={cat.key}
                variant={selectedCategory === cat.key ? "primary" : "secondary"}
                size="sm"
                aria-pressed={selectedCategory === cat.key}
                onClick={() => setSelectedCategory(cat.key)}
              >
                {locale === "en" ? cat.en : cat.ar}
              </Button>
            ))}
          </div>

          {/* Articles Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {filteredArticles.map((article) => (
              <article key={article.slug}>
                <Card
                  interactive
                  padding="md"
                  className="h-full flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Badge tone="neutral">
                        {locale === "en" ? article.categoryEn : article.categoryAr}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveArticle(article)}
                      >
                        {t("قراءة الدليل", "Read Guide")} {isRtl ? "←" : "→"}
                      </Button>
                    </div>
                    <h2 className="text-base md:text-lg font-bold mb-2" style={{ color: "var(--ink)" }}>
                      {locale === "en" ? article.titleEn : article.titleAr}
                    </h2>
                    <p className="text-xs md:text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                      {locale === "en" ? article.summaryEn : article.summaryAr}
                    </p>
                  </div>
                  <div
                    className="flex flex-wrap gap-1.5 pt-3"
                    style={{ borderTop: "1px solid var(--line)" }}
                  >
                    {article.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs" style={{ color: "var(--muted)" }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </Card>
              </article>
            ))}
            {filteredArticles.length === 0 && (
              <Card surface="soft" padding="lg" className="col-span-full text-center">
                <p className="text-base mb-4" style={{ color: "var(--muted)" }}>
                  {t("لم يتم العثور على مقالات مطابقة لبحثك.", "No articles found matching your query.")}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                >
                  {t("إعادة ضبط البحث والتصنيفات", "Reset search filters")}
                </Button>
              </Card>
            )}
          </div>

          {/* Article Detail Modal / Reader */}
          {activeArticle && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
              style={{ background: "var(--backdrop-scrim)" }}
              onClick={() => setActiveArticle(null)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="help-article-title"
                className="nk-card nk-card--surface-elevated nk-card--pad-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <Badge tone="neutral">
                    {locale === "en" ? activeArticle.categoryEn : activeArticle.categoryAr}
                  </Badge>
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => setActiveArticle(null)}
                    aria-label={t("إغلاق", "Close")}
                  >
                    ✕
                  </Button>
                </div>
                <h2
                  id="help-article-title"
                  className="text-xl md:text-2xl font-bold mb-4"
                  style={{ color: "var(--ink)" }}
                >
                  {locale === "en" ? activeArticle.titleEn : activeArticle.titleAr}
                </h2>
                <div
                  className="max-w-none text-sm md:text-base leading-relaxed whitespace-pre-line mb-6 py-4"
                  style={{
                    color: "var(--ink)",
                    borderTop: "1px solid var(--line)",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  {locale === "en" ? activeArticle.contentEn : activeArticle.contentAr}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {t("منصة نقطة · دليل المنتج", "Noäta Platform · Product guide")}
                  </span>
                  <Button variant="secondary" size="sm" onClick={() => setActiveArticle(null)}>
                    {t("تم، العودة للمركز", "Done, return to Help Center")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* CONTACT SUPPORT WORKFLOW (Section 12.3 & 12.4) */}
      <section
        id="contact"
        aria-labelledby="help-contact-heading"
        className="mt-12 pt-10"
        style={{ borderTop: "1px solid var(--line)" }}
      >
        <div className="grid lg:grid-cols-5 gap-10">
          {/* Info Side */}
          <div className="lg:col-span-2">
            <Badge tone="neutral" className="mb-3">
              {t("فريق الدعم الفني المباشر", "Direct Human Support")}
            </Badge>
            <h2
              id="help-contact-heading"
              className="mb-4 text-2xl md:text-3xl font-extrabold"
              style={{ color: "var(--ink)" }}
            >
              {t("هل لديك سؤال أو تواجه مشكلة؟", "Have a Question or Found an Issue?")}
            </h2>
            <p className="text-sm md:text-base leading-relaxed mb-6" style={{ color: "var(--muted)" }}>
              {t(
                "املأ النموذج التالي. سنؤكد الحفظ أولًا، ثم نحاول إرسال إشعار عبر مزود البريد المهيأ ونوضح حالته بصدق.",
                "Submit your inquiry below. We confirm persistence first, then attempt email delivery through the configured provider and report its status truthfully.",
              )}
            </p>

            <Card surface="soft" padding="sm" className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{ background: "var(--success)" }}
                  aria-hidden="true"
                />
                <span className="font-semibold" style={{ color: "var(--ink)" }}>
                  {t("وجهة إشعارات الدعم:", "Support Destination:")}
                </span>
              </div>
              <p
                className="font-mono text-xs p-2.5 rounded-lg dir-ltr text-start"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  color: "var(--ink)",
                }}
              >
                mazenshazly011@gmail.com
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                {t(
                  "كل تذكرة تحصل على كود متابعة مرجعي فريد وتُسجل في قاعدة البيانات لضمان تتبعها بدقة.",
                  "Every ticket receives a unique reference tracking code and is safely stored in our support registry.",
                )}
              </p>
            </Card>

            <div className="mt-6 flex flex-wrap gap-2.5 text-xs">
              <Link href="/faq" className="nk-btn nk-btn--secondary nk-btn--sm">
                <span>{t("تصفح الأسئلة الشائعة أولاً", "Check Frequently Asked Questions")}</span>
                <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
              </Link>
              <Link href="/curriculum" className="nk-btn nk-btn--secondary nk-btn--sm">
                <span>{t("العودة إلى استكشاف المنهج والمسارات", "Explore Curriculum & Tracks")}</span>
                <span aria-hidden="true">{isRtl ? "←" : "→"}</span>
              </Link>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-3">
            <Card surface="elevated" padding="lg">
              <h3 className="text-lg md:text-xl font-bold mb-6" style={{ color: "var(--ink)" }}>
                {t("إرسال تذكرة دعم فني جديدة", "Submit New Support Ticket")}
              </h3>

              {/* Truthful Success Feedback (Section 12.6) */}
              {submissionResult && (
                <Card
                  surface="soft"
                  padding="sm"
                  className="mb-6 text-sm"
                  style={{ borderColor: "var(--success)" }}
                >
                  <div className="flex items-center gap-2 font-bold mb-2" style={{ color: "var(--ink)" }}>
                    <Badge tone="success">✓</Badge>
                    <span>{t("تم استلام تذكرتك بنجاح!", "Ticket Received Successfully!")}</span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: "var(--ink)" }}>
                    {t("كود التذكرة المرجعي:", "Ticket Reference Code:")}{" "}
                    <strong
                      className="font-mono text-sm px-2 py-0.5 rounded"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--line)",
                        color: "var(--ink)",
                      }}
                    >
                      #{submissionResult.ticketCode}
                    </strong>
                  </p>

                  {/* Truthful Email Status */}
                  <div
                    className="p-3 rounded-xl text-xs space-y-1.5"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold" style={{ color: "var(--muted)" }}>
                        {t("حالة إشعار البريد:", "Email Notification Status:")}
                      </span>
                      <Badge tone={submissionResult.emailDelivery.delivered ? "success" : "warning"}>
                        {submissionResult.emailDelivery.delivered
                          ? `${t("تم الإرسال إلى", "Sent to")} mazenshazly011@gmail.com`
                          : t("مجدول بانتظار مزود البريد", "Queued (Provider Key Pending)")}
                      </Badge>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                      {submissionResult.emailDelivery.note}
                    </p>
                  </div>
                </Card>
              )}

              {formError && (
                <div
                  role="alert"
                  className="mb-6 p-4 rounded-xl text-xs font-semibold"
                  style={{
                    background: "var(--danger-soft)",
                    border: "1px solid var(--danger)",
                    color: "var(--ink)",
                  }}
                >
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={t("الاسم الكامل", "Full Name")} htmlFor="help-ticket-name" required>
                    {(fieldProps) => (
                      <Input
                        {...fieldProps}
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder={t("اسمك", "Your name")}
                      />
                    )}
                  </Field>

                  <Field
                    label={t("البريد الإلكتروني للرد", "Email Address for Reply")}
                    htmlFor="help-ticket-email"
                    required
                  >
                    {(fieldProps) => (
                      <Input
                        {...fieldProps}
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="name@example.com"
                      />
                    )}
                  </Field>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label={t("تصنيف الطلب", "Category")} htmlFor="help-ticket-category" required>
                    {(fieldProps) => (
                      <Select
                        {...fieldProps}
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as SupportCategory)}
                      >
                        {SUPPORT_CATEGORIES.map((c) => (
                          <option key={c.key} value={c.key}>
                            {locale === "en" ? c.en : c.ar}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>

                  <Field label={t("موضوع الرسالة", "Subject")} htmlFor="help-ticket-subject" required>
                    {(fieldProps) => (
                      <Input
                        {...fieldProps}
                        type="text"
                        value={formSubject}
                        onChange={(e) => setFormSubject(e.target.value)}
                        placeholder={t("ملخص قصير للموضوع", "Short summary")}
                      />
                    )}
                  </Field>
                </div>

                <Field
                  label={t("تفاصيل الاستفسار أو المشكلة", "Message & Details")}
                  htmlFor="help-ticket-message"
                  hint={`${formMessage.length}/4000`}
                  required
                >
                  {(fieldProps) => (
                    <Textarea
                      {...fieldProps}
                      rows={4}
                      maxLength={4000}
                      value={formMessage}
                      onChange={(e) => setFormMessage(e.target.value)}
                      placeholder={t(
                        "يرجى كتابة التفاصيل بدقة حتى نتمكن من مساعدتك بأسرع ما يمكن...",
                        "Please provide detailed information so we can assist you effectively...",
                      )}
                    />
                  )}
                </Field>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={submitting}
                  >
                    <span>
                      {submitting
                        ? t("جارٍ إرسال التذكرة...", "Submitting Ticket...")
                        : t("إرسال طلب الدعم الفني", "Submit Support Ticket")}
                    </span>
                    {!submitting && <span aria-hidden="true">{isRtl ? "←" : "→"}</span>}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
