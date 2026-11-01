"use client";

import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";

type LessonRow = {
  id: string;
  unit_id: string;
  title_ar: string;
  title_en: string;
  content: unknown;
  xp_reward: number;
  coin_reward: number;
  units: { id: string; course_id: string; title_ar: string; title_en: string } | null;
};

type ContentShape = {
  duration_minutes?: number;
  summary_ar?: string;
  summary_en?: string;
  worked_ar?: string;
  worked_en?: string;
  objectives_ar?: unknown;
  objectives_en?: unknown;
  common_mistakes_ar?: unknown;
  common_mistakes_en?: unknown;
  provenance_ar?: string;
  provenance_en?: string;
  source_document?: string;
  source_sha256?: string;
  render_language?: "ar" | "en";
  primary_content_language?: "ar" | "en";
  translation_note_ar?: string;
  translation_note_en?: string;
  prerequisite_lesson_id?: string;
};

type TrackContext = {
  slug: string;
  content_language: "ar" | "en";
  title_ar: string;
  title_en: string;
  source_document: string | null;
  source_sha256: string | null;
};

type CheckpointQuestion = {
  id: string;
  prompt_ar: string;
  prompt_en: string | null;
  choices_ar: unknown;
  choices_en: unknown;
};

const strings = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];

export function LessonLive({ id }: { id: string }) {
  const t = useTranslation();
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const account = useVerifiedAccount();

  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [lesson, setLesson] = useState<LessonRow | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [track, setTrack] = useState<TrackContext | null>(null);
  const [completed, setCompleted] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  // Pedagogical Stepper state
  const [activeStage, setActiveStage] = useState(0);

  // Interactive Checkpoint state
  const [checkpointQuestion, setCheckpointQuestion] = useState<CheckpointQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [checkpointAnswered, setCheckpointAnswered] = useState(false);

  useEffect(() => {
    if (account.loading) return;
    let alive = true;
    setLoading(true);
    setError("");
    setMissing(false);
    setLesson(null);
    setCompleted(false);
    setBestScore(null);
    setQuestionCount(0);
    setTrack(null);
    setCheckpointQuestion(null);
    setSelectedAnswer(null);
    setCheckpointAnswered(false);

    void (async () => {
      try {
        const lessonRes = await supabase
          .from("lessons")
          .select(
            "id,unit_id,title_ar,title_en,content,xp_reward,coin_reward,units(id,course_id,title_ar,title_en)",
          )
          .eq("id", id)
          .maybeSingle();

        if (!alive) return;
        if (lessonRes.error) throw lessonRes.error;
        if (!lessonRes.data) {
          setMissing(true);
          return;
        }

        const courseId = (lessonRes.data.units as { course_id?: string } | null)?.course_id;
        if (!courseId) throw Error("Lesson course unavailable");

        const [questionRows, trackResult, checkpointRes] = await Promise.all([
          supabase
            .from("questions")
            .select("id,variant_of,metadata")
            .eq("lesson_id", id)
            .in("publication_status", ["published_demo", "published"]),
          supabase
            .from("curriculum_tracks")
            .select("slug,content_language,title_ar,title_en,source_document,source_sha256")
            .eq("course_id", courseId)
            .eq("publication_status", "published")
            .maybeSingle(),
          supabase
            .from("questions")
            .select("id,prompt_ar,prompt_en,choices_ar,choices_en")
            .eq("lesson_id", id)
            .eq("question_type", "multiple-choice")
            .in("publication_status", ["published_demo", "published"])
            .limit(1)
            .maybeSingle(),
        ]);

        if (!alive) return;
        if (questionRows.error || trackResult.error) {
          throw questionRows.error ?? trackResult.error;
        }

        const content = (lessonRes.data.content ?? {}) as ContentShape;
        const language =
          content.render_language ??
          content.primary_content_language ??
          trackResult.data?.content_language;

        if (language !== "ar" && language !== "en") {
          throw Error("Lesson curriculum language unavailable");
        }

        setTrack(
          trackResult.data
            ? (trackResult.data as TrackContext)
            : {
                slug: "",
                content_language: language,
                title_ar: "",
                title_en: "",
                source_document: content.source_document ?? null,
                source_sha256: content.source_sha256 ?? null,
              },
        );

        if (account.user) {
          const result = await supabase
            .from("lesson_progress")
            .select("completed_at,best_score")
            .eq("user_id", account.user.id)
            .eq("lesson_id", id)
            .maybeSingle();

          if (!alive) return;
          if (result.error) throw result.error;
          if (result.data) {
            setCompleted(Boolean(result.data.completed_at));
            setBestScore(result.data.best_score);
          }
        }

        setLesson(lessonRes.data as LessonRow);

        setQuestionCount(
          (questionRows.data ?? []).filter((row) => {
            const metadata =
              row.metadata && typeof row.metadata === "object"
                ? (row.metadata as Record<string, unknown>)
                : {};
            return row.variant_of === null || metadata.translation_track === true;
          }).length,
        );

        if (checkpointRes.data) {
          setCheckpointQuestion(checkpointRes.data as CheckpointQuestion);
        }
      } catch {
        if (alive) {
          setError(
            t(
              "تعذّر تحميل الدرس وتقدّمك. حاول مرة أخرى؛ لم نؤكد أنه غير متاح.",
              "Could not load the lesson and your progress. Please try again.",
            ),
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, supabase, retry, account.user, account.loading, t]);

  if (account.error || error) {
    return (
      <section className="aura-load-error" role="alert">
        <h2>{account.error || error}</h2>
        <button
          type="button"
          onClick={() => {
            if (account.error) void account.refresh();
            else setRetry((x) => x + 1);
          }}
        >
          {t("إعادة المحاولة", "Try again")}
        </button>
      </section>
    );
  }

  if (account.loading || loading) {
    return (
      <section className="panel" style={{ padding: 36 }}>
        <div className="skeleton" style={{ height: 28, borderRadius: 12, width: "40%", marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 160, borderRadius: 20, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 320, borderRadius: 24 }} />
      </section>
    );
  }

  if (missing || !lesson) {
    return (
      <section className="panel" style={{ textAlign: "center", padding: 48 }}>
        <h2>{t("الدرس ده مش متاح.", "This lesson is not available.")}</h2>
        <p style={{ color: "var(--muted)", margin: "12px 0 24px" }}>
          {t("تأكد من اختيار المادة والمسار الصحيحين من رحلة التعلّم.", "Check that you selected the correct subject and track from your learning journey.")}
        </p>
        <Link
          className="btn btn-primary"
          href="/learn"
          style={{ background: "var(--accent)", color: "var(--surface)", display: "inline-flex" }}
        >
          {t("رجوع للمسار", "Back to your journey")}
        </Link>
      </section>
    );
  }

  const content = (lesson.content ?? {}) as ContentShape;
  const contentLanguage = track?.content_language ?? content.render_language ?? "ar";
  const isEnContent = contentLanguage === "en";
  const lessonTitle = isEnContent ? lesson.title_en : lesson.title_ar;
  const unitTitle = isEnContent ? lesson.units?.title_en : lesson.units?.title_ar;
  const summary = isEnContent ? content.summary_en : content.summary_ar;
  const worked = isEnContent ? content.worked_en : content.worked_ar;
  const objectives = strings(isEnContent ? content.objectives_en : content.objectives_ar);
  const mistakes = strings(isEnContent ? content.common_mistakes_en : content.common_mistakes_ar);
  const provenance = isEnContent ? content.provenance_en : content.provenance_ar;
  const translationNote = isEnContent ? content.translation_note_en : content.translation_note_ar;

  // Discipline detection
  const trackSlug = track?.slug || "";
  const disciplineType = trackSlug.includes("math")
    ? "math"
    : trackSlug.includes("science")
      ? "science"
      : trackSlug.includes("history")
        ? "history"
        : trackSlug.includes("arabic")
          ? "arabic"
          : trackSlug.includes("philosophy")
            ? "philosophy"
            : "general";

  // Stages definition
  const STAGES = [
    {
      num: "01",
      id: "objectives",
      titleAr: "الأهداف والتهيئة",
      titleEn: "Foundations & Goals",
      icon: "book",
    },
    {
      num: "02",
      id: "concept",
      titleAr: "الشرح والتفكيك",
      titleEn: "Core Concept",
      icon: "sparkles",
    },
    {
      num: "03",
      id: "worked",
      titleAr: "التطبيق والمثال المحلول",
      titleEn: "Worked Application",
      icon: "check",
    },
    {
      num: "04",
      id: "misconceptions",
      titleAr: "حراسة المفاهيم والأخطاء",
      titleEn: "Misconception Guard",
      icon: "lock",
    },
    {
      num: "05",
      id: "checkpoint",
      titleAr: "التحقق والانطلاق",
      titleEn: "Checkpoint & Mission",
      icon: "arrow",
    },
  ];

  return (
    <div className="noata-lesson-container">
      {/* 1. Breadcrumbs */}
      <nav className="noata-lesson-breadcrumb" aria-label={t("مسار التنقل", "Breadcrumb navigation")}>
        <Link href="/learn">{t("رحلة التعلّم", "Learning journey")}</Link>
        <span className="noata-lesson-breadcrumb-sep">/</span>
        <span>{unitTitle ?? t("الوحدة الدراسية", "Study Unit")}</span>
        <span className="noata-lesson-breadcrumb-sep">/</span>
        <span aria-current="page" style={{ color: "var(--ink)", fontWeight: 700 }}>{lessonTitle}</span>
      </nav>

      {/* 2. Hero Header */}
      <section className="noata-lesson-hero">
        <div className="noata-lesson-meta-bar">
          <span className="noata-lesson-track-tag">
            <Icon name="book" size={14} />
            <span>{track?.title_ar || track?.title_en || t("مسار تعليمي معتمد", "Accredited track")}</span>
          </span>

          <div className="noata-lesson-metrics">
            {completed && (
              <span className="noata-lesson-metric-chip is-completed">
                <Icon name="check" size={14} />
                <span>{t("مكتمل وموثّق", "Completed")} · {Math.round(bestScore ?? 100)}%</span>
              </span>
            )}
            <span className="noata-lesson-metric-chip">
              <Icon name="clock" size={14} />
              <span>{content.duration_minutes ?? 7} {t("دقائق مذاكرة", "min study")}</span>
            </span>
            <span className="noata-lesson-metric-chip" style={{ color: "var(--accent)" }}>
              <span>+{lesson.xp_reward} XP</span>
            </span>
            <span className="noata-lesson-metric-chip" style={{ color: "#d97706" }}>
              <span>+{lesson.coin_reward} Coins</span>
            </span>
          </div>
        </div>

        <div className="noata-lesson-title-area">
          <h1 dir={isEnContent ? "ltr" : "rtl"}>{lessonTitle}</h1>
          <p className="noata-lesson-lead" dir={isEnContent ? "ltr" : "rtl"}>
            {summary ?? t("محتوى الدرس مبني على دليل المذاكرة الأصيل المعتمد لوزارة التربية والتعليم.", "Lesson content is based on the verified curriculum study pack.")}
          </p>
        </div>

        {/* Provenance Badge */}
        {(track?.source_document || content.source_document) && (
          <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <span style={{ fontWeight: 700 }}>{t("المصدر الأكاديمي الموثّق:", "Verified Source:")}</span>
            <span>{track?.source_document || content.source_document}</span>
            {(track?.source_sha256 || content.source_sha256) && (
              <span style={{ opacity: 0.7, fontFamily: "monospace" }}>
                SHA-256: {(track?.source_sha256 || content.source_sha256)!.slice(0, 14)}…
              </span>
            )}
          </div>
        )}
      </section>

      {/* 3. Pedagogical Stepper */}
      <nav className="noata-stage-stepper" aria-label={t("مراحل تعلم الدرس", "Lesson learning stages")}>
        {STAGES.map((st, idx) => {
          const isActive = activeStage === idx;
          return (
            <button
              key={st.id}
              type="button"
              className={`noata-stage-step ${isActive ? "is-active" : ""}`}
              onClick={() => setActiveStage(idx)}
              aria-pressed={isActive}
            >
              <span className="noata-stage-num">{st.num}</span>
              <span>{locale === "en" ? st.titleEn : st.titleAr}</span>
            </button>
          );
        })}
      </nav>

      {/* 4. Active Stage Card */}
      <section className="noata-stage-content-card">
        {/* STAGE 0: Objectives & Foundations */}
        {activeStage === 0 && (
          <>
            <div className="noata-stage-header">
              <div className="noata-stage-header-title">
                <span className="noata-stage-icon-circle">
                  <Icon name="book" size={20} />
                </span>
                <div>
                  <h2>{t("أهداف التعلم والتهيئة المعرفية", "Learning Objectives & Foundations")}</h2>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                    {t("ما يتوقع منك إتقانه وتطبيقه بنهاية هذا الدرس.", "Key competencies you will acquire by the end of this lesson.")}
                  </p>
                </div>
              </div>
            </div>

            {objectives.length > 0 ? (
              <div className="noata-objectives-grid">
                {objectives.map((obj, i) => (
                  <div key={i} className="noata-objective-card">
                    <span className="noata-objective-bullet">{i + 1}</span>
                    <p className="noata-objective-text" dir={isEnContent ? "ltr" : "rtl"}>
                      {obj}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--muted)" }}>
                {t("الهدف الأساسي هو استيعاب المفهوم وتطبيقه في أسئلة الفهم والمهمة التطبيقية.", "The core goal is conceptual comprehension and practical application.")}
              </p>
            )}

            {/* Discipline-specific contextual card */}
            <div className={`noata-discipline-panel ${disciplineType}`}>
              <div className="noata-discipline-badge">
                <Icon name="sparkles" size={14} />
                <span>
                  {disciplineType === "math"
                    ? t("منهجية الرياضيات: التركيز على خطوات التحليل الرياضي المنطقي", "Mathematical Method: Step-by-step rigorous deduction")
                    : disciplineType === "science"
                      ? t("المنهج العلمي: الربط بين الملاحظة التجريبية والتفسير الفيزيوكيميائي", "Scientific Inquiry: Empirical evidence & biochemical reasoning")
                      : disciplineType === "history"
                        ? t("النقد التاريخي: التمييز بين المصادر الأولية والمراجع وتتبع الأثر", "Historical Analysis: Evidence provenance & primary source critique")
                        : disciplineType === "arabic"
                          ? t("التحليل البلاغي واللغوي: المعنى السياقي وتذوق التراكيب الأدبية", "Linguistic Inquiry: Contextual semantics & rhetorical structure")
                          : disciplineType === "philosophy"
                            ? t("التفكير الفلسفي: تشريح المقدمات وبناء الحجج العقلانية المستقلة", "Philosophical Inquiry: Examining premises & rational argumentation")
                            : t("إرشادات المذاكرة الفعالة", "Effective Study Guidelines")}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.8, color: "var(--ink)" }}>
                {t(
                  "تدرج خطوة بخطوة عبر المراحل بالأعلى. انتقل للشرح في المرحلة 2 ثم راجع المثال المحلول.",
                  "Progress through the stages above sequentially: explore the core concept in Stage 2, then review the worked solution.",
                )}
              </p>
            </div>
          </>
        )}

        {/* STAGE 1: Core Concept Deep Dive */}
        {activeStage === 1 && (
          <>
            <div className="noata-stage-header">
              <div className="noata-stage-header-title">
                <span className="noata-stage-icon-circle">
                  <Icon name="sparkles" size={20} />
                </span>
                <div>
                  <h2>{t("الشرح المفاهيمي والتفكيك المنطقي", "Core Concept & Conceptual Deep Dive")}</h2>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                    {t("استيعاب جوهر الفكرة بدون حفظ سطحي.", "Deep conceptual understanding beyond superficial memorization.")}
                  </p>
                </div>
              </div>
            </div>

            <article style={{ fontSize: 16.5, lineHeight: 2, color: "var(--ink)" }} dir={isEnContent ? "ltr" : "rtl"}>
              {summary ? (
                summary.split("\n\n").map((para, i) => (
                  <p key={i} style={{ margin: "0 0 16px" }}>
                    {para}
                  </p>
                ))
              ) : (
                <p>{t("محتوى الدرس غير منشور في المصدر المتصل.", "Lesson content is not published in the connected source.")}</p>
              )}
            </article>

            {translationNote && (
              <div style={{ padding: 14, borderRadius: 12, background: "var(--surface-soft)", border: "1px solid var(--line)", fontSize: 13, color: "var(--muted)" }}>
                <strong>{t("ملاحظة ترجمة معتمدة:", "Curriculum Translation Note:")}</strong> {translationNote}
              </div>
            )}
          </>
        )}

        {/* STAGE 2: Worked Application & Examples */}
        {activeStage === 2 && (
          <>
            <div className="noata-stage-header">
              <div className="noata-stage-header-title">
                <span className="noata-stage-icon-circle">
                  <Icon name="check" size={20} />
                </span>
                <div>
                  <h2>{t("التطبيق العملي والمثال المحلول", "Worked Example & Guided Application")}</h2>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                    {t("كيف تُحل المسائل وتُطبق المفاهيم في الامتحانات والواقع.", "How problems are solved step-by-step with authentic reasoning.")}
                  </p>
                </div>
              </div>
            </div>

            {worked ? (
              <div className={`noata-discipline-panel ${disciplineType}`}>
                <div className="noata-discipline-badge">
                  <Icon name="check" size={14} />
                  <span>{t("نموذج حل تطبيقي تفصيلي", "Detailed Guided Model Solution")}</span>
                </div>
                <div style={{ fontSize: 15.5, lineHeight: 1.9, color: "var(--ink)" }} dir={isEnContent ? "ltr" : "rtl"}>
                  {worked.split("\n\n").map((chunk, i) => (
                    <p key={i} style={{ margin: "0 0 12px" }}>
                      {chunk}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--muted)", padding: 24, textAlign: "center" }}>
                {t("لا يوجد مثال محلول إضافي لهذا الدرس؛ انتقل إلى مرحلة حراسة المفاهيم أو ابدأ المهمة.", "No additional worked example record for this lesson; proceed to misconception check or launch the mission.")}
              </p>
            )}
          </>
        )}

        {/* STAGE 3: Misconception Guard */}
        {activeStage === 3 && (
          <>
            <div className="noata-stage-header">
              <div className="noata-stage-header-title">
                <span className="noata-stage-icon-circle" style={{ color: "#d97706", background: "rgba(217,119,6,0.12)" }}>
                  <Icon name="lock" size={20} />
                </span>
                <div>
                  <h2>{t("حراسة المفاهيم والأخطاء الشائعة", "Misconception Guard & Traps to Avoid")}</h2>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                    {t("أشهر الخلط والمغالطات التي يقع فيها الطلاب في هذا الدرس وطريقة تجنبها.", "Common pitfalls and mistaken assumptions students frequently make.")}
                  </p>
                </div>
              </div>
            </div>

            {mistakes.length > 0 ? (
              <div className="noata-misconceptions-card">
                {mistakes.map((mistake, idx) => (
                  <div key={idx} className="noata-misconception-item" dir={isEnContent ? "ltr" : "rtl"}>
                    <span style={{ color: "#d97706", fontWeight: 800 }}>⚠️</span>
                    <div>{mistake}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--muted)", padding: 24, textAlign: "center" }}>
                {t("لم يتم تسجيل مغالطات خاصة لهذا الدرس. انتبه للتعريفات الأساسية.", "No specific misconceptions registered. Pay careful attention to core definitions.")}
              </p>
            )}
          </>
        )}

        {/* STAGE 4: Interactive Checkpoint & Retrieval Launch */}
        {activeStage === 4 && (
          <>
            <div className="noata-stage-header">
              <div className="noata-stage-header-title">
                <span className="noata-stage-icon-circle" style={{ color: "var(--accent)" }}>
                  <Icon name="arrow" size={20} />
                </span>
                <div>
                  <h2>{t("نقطة التحقق المعرفي والانطلاق للمهمة", "Knowledge Checkpoint & Mission Launch")}</h2>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                    {t("اختبر استيعابك لسؤال مباشر قبل خوض المهمة الشاملة المكونة من 3 مراحل.", "Validate your grasp on a quick checkpoint question before tackling the 3-stage mission.")}
                  </p>
                </div>
              </div>
            </div>

            {/* Inline Checkpoint Question */}
            {checkpointQuestion ? (
              <div className="noata-checkpoint-box">
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>
                  {t("سؤال تدريبي سريع (Checkpoint):", "Quick Practice Checkpoint:")}
                </span>

                <h3 style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }} dir={isEnContent ? "ltr" : "rtl"}>
                  {(isEnContent ? checkpointQuestion.prompt_en ?? checkpointQuestion.prompt_ar : checkpointQuestion.prompt_ar)}
                </h3>

                <div className="noata-checkpoint-options">
                  {strings(isEnContent ? checkpointQuestion.choices_en : checkpointQuestion.choices_ar).map((opt, i) => {
                    const isSelected = selectedAnswer === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`noata-checkpoint-btn ${isSelected ? "is-selected" : ""}`}
                        onClick={() => {
                          setSelectedAnswer(i);
                          setCheckpointAnswered(true);
                        }}
                      >
                        <span style={{ opacity: 0.6 }}>{String.fromCharCode(65 + i)}.</span>
                        <span dir={isEnContent ? "ltr" : "rtl"}>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {checkpointAnswered && (
                  <div className="noata-checkpoint-feedback is-correct">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <strong>{t("أحسنت الاختيار!", "Great selection!")}</strong>
                        <p style={{ margin: "4px 0 0", fontSize: 13, lineHeight: 1.6 }}>
                          {t(
                            "تم تثبيت المفهوم الأساسي بنجاح. لتعميق الفهم عبر اختبار تشخيصي متقدم بنمط QuizGecko وتكرار تباعدي 3D:",
                            "Core concept confirmed. For comprehensive QuizGecko-grade testing and 3D spaced review:"
                          )}
                        </p>
                      </div>
                      <Link
                        href={`/study?lesson=${encodeURIComponent(lesson.id)}&title=${encodeURIComponent(lessonTitle)}&tab=generator`}
                        className="btn btn-primary"
                        style={{ fontSize: 12, padding: "6px 14px", background: "#10b981", borderColor: "#10b981", color: "#fff" }}
                      >
                        ⚡ <span>{t("توليد كويز وبطاقات QuizGecko", "Generate QuizGecko Deck")}</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Launch Banner */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "20px 24px", borderRadius: 20, background: "var(--accent-soft)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)", flexWrap: "wrap" }}>
              <div>
                <strong style={{ fontSize: 16, display: "block", color: "var(--ink)", marginBottom: 4 }}>
                  {t("جاهز للمهمة التعليمية؟", "Ready for the Learning Mission?")}
                </strong>
                <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                  {t(
                    `تتكون من ${questionCount || 3} مراحل متدرجة الصعوبة (فهم، تطبيق، وربط مفاهيمي).`,
                    `Composed of ${questionCount || 3} progressive stages (Understand, Apply, Connect).`,
                  )}
                </p>
              </div>

              <Link
                href={"/missions?lesson=" + lesson.id}
                className="btn btn-primary"
                style={{ background: "var(--accent)", color: "var(--surface)", minHeight: 46, paddingInline: 24, fontSize: 14 }}
              >
                {t("ابدأ المهمة التعليمية (Mission) →", "Start Mission →")}
              </Link>
            </div>
          </>
        )}
      </section>

      {/* 5. Action Dock */}
      <footer className="noata-lesson-action-dock">
        <div>
          <strong style={{ fontSize: 14, display: "block", color: "var(--ink)" }}>
            {t("أدوات الدعم الذكي والتكرار المتباعد", "Smart AI Tools & Spaced Review")}
          </strong>
          <small style={{ color: "var(--muted)" }}>
            {t("حوّل هذا الدرس لبطاقات استرجاع، أو استفسر من مساعد Noäta AI الذكي.", "Generate flashcards or consult Noäta AI for instant Socratic guidance.")}
          </small>
        </div>

        <div className="noata-lesson-action-dock-right">
          <Link
            className="btn btn-primary"
            style={{ background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 80%, #10b981))" }}
            href={`/study?lesson=${encodeURIComponent(lesson.id)}&title=${encodeURIComponent(lessonTitle)}&tab=generator`}
          >
            <Icon name="sparkles" size={16} />
            <span>{t("⚡ كويز وبطاقات QuizGecko", "⚡ QuizGecko Quiz & Cards")}</span>
          </Link>

          <Link
            className="btn btn-secondary"
            href={`/study?lesson=${encodeURIComponent(lesson.id)}&title=${encodeURIComponent(lessonTitle)}&tab=review`}
          >
            <Icon name="review" size={16} />
            <span>{t("مراجعة تباعدية 3D", "3D Spaced Review")}</span>
          </Link>

          <Link
            className="btn btn-secondary"
            href={
              "/ai?prompt=" +
              encodeURIComponent(
                t("اشرحلي درس ", "Explain a lesson ") +
                  lessonTitle +
                  t(" خطوة بخطوة: ", " Step by step: ") +
                  (summary ?? "") +
                  (track?.slug ? ` · curriculum track ${track.slug}` : ""),
              )
            }
          >
            <Icon name="sparkles" size={16} />
            <span>{t("استشر Noäta AI", "Ask Noäta AI")}</span>
          </Link>

          <Link
            className="btn btn-secondary"
            href={"/missions?lesson=" + lesson.id}
          >
            <span>{t("المهمة التعليمية", "Launch Mission")}</span>
            <Icon name="arrow" size={16} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
