"use client";
import { useTranslation } from "@/lib/i18n/locale";

import { useEffect, useMemo, useState } from "react";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";

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

const strings = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];

export function LessonLive({ id }: { id: string }) {
 const t=useTranslation();
  const supabase = useMemo(() => createClient(), []);
  const account = useVerifiedAccount();
  const [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const [lesson, setLesson] = useState<LessonRow | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [track, setTrack] = useState<TrackContext | null>(null);
  const [completed, setCompleted] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

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
    void (async () => {
      try {
        const lesson = await supabase
          .from("lessons")
          .select(
            "id,unit_id,title_ar,title_en,content,xp_reward,coin_reward,units(id,course_id,title_ar,title_en)",
          )
          .eq("id", id)
          .maybeSingle();
        if (!alive) return;
        if (lesson.error) throw lesson.error;
        if (!lesson.data) {
          setMissing(true);
          return;
        }
        const courseId = (lesson.data.units as { course_id?: string } | null)?.course_id;
        if (!courseId) throw Error("Lesson course unavailable");
        const [questionRows, trackResult] = await Promise.all([
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
        ]);
        if (!alive) return;
        if (questionRows.error || trackResult.error)
          throw questionRows.error ?? trackResult.error;
        const content = (lesson.data.content ?? {}) as ContentShape;
        const language =
          content.render_language ??
          content.primary_content_language ??
          trackResult.data?.content_language;
        if (language !== "ar" && language !== "en")
          throw Error("Lesson curriculum language unavailable");
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
        setLesson(lesson.data as LessonRow);
        setQuestionCount(
          (questionRows.data ?? []).filter((row) => {
            const metadata =
              row.metadata && typeof row.metadata === "object"
                ? (row.metadata as Record<string, unknown>)
                : {};
            return row.variant_of === null || metadata.translation_track === true;
          }).length,
        );
      } catch {
        if (alive)
          setError(
            t("تعذّر تحميل الدرس وتقدّمك. حاول مرة أخرى؛ لم نؤكد أنه غير متاح.","Could not load the lesson and your progress. Please try again."),
          );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, supabase, retry, account.user, account.loading]);
  if (account.error || error)
    return (
      <section className="aura-load-error" role="alert">
        <h2>{account.error || error}</h2>
        <button
          type="button"
          onClick={() => {
            if (account.error) void account.refresh();
            else setRetry((x) => x + 1);
          }}
        >{t("إعادة المحاولة","Try again")}</button>
      </section>
    );
  if (account.loading || loading)
    return (
      <section className="panel" style={{ padding: 32 }}>
        <div
          className="skeleton"
          style={{ height: 26, borderRadius: 10, width: "45%" }}
        />
        <div
          className="skeleton"
          style={{ height: 140, borderRadius: 18, marginTop: 18 }}
        />
      </section>
    );
  if (missing || !lesson)
    return (
      <section className="panel" style={{ textAlign: "center", padding: 34 }}>
        <h2>{t("الدرس ده مش متاح.","This lesson is not available.")}</h2>
        <a
          className="btn"
          href="/learn"
          style={{ background: "var(--accent)", color: "var(--surface)" }}
        >{t("رجوع للمسار","Back to your journey")}</a>
      </section>
    );

  const content = (lesson.content ?? {}) as ContentShape;
  const contentLanguage = track?.content_language ?? content.render_language ?? "ar";
  const lessonTitle = contentLanguage === "en" ? lesson.title_en : lesson.title_ar;
  const summary = contentLanguage === "en" ? content.summary_en : content.summary_ar;
  const worked = contentLanguage === "en" ? content.worked_en : content.worked_ar;
  const objectives = strings(
    contentLanguage === "en" ? content.objectives_en : content.objectives_ar,
  );
  const mistakes = strings(
    contentLanguage === "en" ? content.common_mistakes_en : content.common_mistakes_ar,
  );
  const provenance =
    contentLanguage === "en" ? content.provenance_en : content.provenance_ar;
  const translationNote =
    contentLanguage === "en" ? content.translation_note_en : content.translation_note_ar;

  return (
    <>
      <header className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>
            {t("\u062f\u0631\u0633","Lesson")}
          </div>
          <h1 style={{ margin: "6px 0 0" }} dir={contentLanguage === "ar" ? "rtl" : "ltr"}>{lessonTitle}</h1>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {completed && (
            <span className="pill">
              {t("\u0645\u0643\u062a\u0645\u0644","Completed")} · {Math.round(bestScore ?? 0)}%
            </span>
          )}
          <span className="pill">{content.duration_minutes ?? 7} {t("\u062f\u0642\u0627\u0626\u0642","min")}</span>
        </div>
      </header>

      <section className="hero" style={{ padding: 30 }}>
        <div className="eyebrow">
          {(contentLanguage==="en"?lesson.units?.title_en:lesson.units?.title_ar) ?? t("\u062f\u0631\u0633 Noäta","Noäta lesson")}
        </div>
        <h2 style={{ fontSize: "clamp(28px,4vw,42px)", margin: "9px 0" }}>
          {lessonTitle}
        </h2>
        <p dir={contentLanguage === "ar" ? "rtl" : "ltr"}>{summary ?? t("محتوى الدرس غير منشور في المصدر المتصل.","Lesson content is not published in the connected source.")}</p>
        <div className="hero-actions">
          <a className="btn btn-primary" href={"/missions?lesson=" + lesson.id}>{t("ابدأ Mission","Start mission")}</a>
          <a
            className="btn btn-secondary"
            href={
              "/ai?prompt=" +
              encodeURIComponent(
                t("اشرحلي درس ","Explain a lesson ") +
                  lessonTitle +
                  t(" خطوة بخطوة: "," Step by step: ") +
                  (summary ?? "") + (track?.slug ? ` · curriculum track ${track.slug}` : ""),
              )
            }
          >{t("اسأل Noäta AI","Ask Noäta AI")}</a>
        </div>
      </section>

      {(objectives.length > 0 || provenance || translationNote) && (
        <section className="panel" style={{ marginBottom: 18 }}>
          <div className="panel-head">
            <h2>{t("قبل أن تبدأ", "Before you begin")}</h2>
            <span className="pill">{track?.slug || t("مسار غير محدد", "Track unavailable")}</span>
          </div>
          {objectives.length > 0 && (
            <>
              <h3>{t("أهداف الدرس", "Lesson objectives")}</h3>
              <ul>
                {objectives.map((objective) => (
                  <li key={objective} dir={contentLanguage === "ar" ? "rtl" : "ltr"}>{objective}</li>
                ))}
              </ul>
            </>
          )}
          {(provenance || translationNote) && (
            <p className="noata-widget-note" dir={contentLanguage === "ar" ? "rtl" : "ltr"}>
              {translationNote || provenance}
            </p>
          )}
          {(track?.source_document || content.source_document) && (
            <small>
              {t("المصدر المتاح: ", "Available source: ")}
              {track?.source_document || content.source_document}
              {(track?.source_sha256 || content.source_sha256)
                ? ` · SHA-256 ${(track?.source_sha256 || content.source_sha256)!.slice(0, 12)}…`
                : ""}
            </small>
          )}
        </section>
      )}

      <section className="content-grid">
        <article className="panel">
          <div className="panel-head">
            <h2>{t("الفكرة الأساسية","The main idea")}</h2>
            <span className="pill">{t("\u0627\u0644\u0641\u0643\u0631\u0629 \u0623\u0648\u0644\u064b\u0627","Concept first")}</span>
          </div>
          <p style={{ fontSize: 17, lineHeight: 2, margin: 0 }}>
            {summary ?? t("محتوى الدرس غير متاح من المصدر المتصل.","Lesson content is unavailable from the connected source.")}
          </p>
          {worked && (
            <>
              <div
                style={{
                  height: 1,
                  background: "var(--line)",
                  margin: "22px 0",
                }}
              />
              <div className="panel-head">
                <h2>{t("مثال محلول","Worked example")}</h2>
                <span className="pill">Worked example</span>
              </div>
              <p style={{ fontSize: 16, lineHeight: 2, margin: 0 }}>
                {worked}
              </p>
            </>
          )}
          {mistakes.length > 0 && (
            <>
              <div style={{ height: 1, background: "var(--line)", margin: "22px 0" }} />
              <h2>{t("تحقق من المفاهيم الشائعة", "Misconception check")}</h2>
              <ul>
                {mistakes.map((mistake) => (
                  <li key={mistake} dir={contentLanguage === "ar" ? "rtl" : "ltr"}>{mistake}</li>
                ))}
              </ul>
            </>
          )}
        </article>

        <aside>
          <section className="panel">
            <div className="panel-head">
              <h2>{t("بعد الشرح","After the explanation")}</h2>
              <span className="pill">{questionCount} stages</span>
            </div>
            <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>{t("Noäta هينقلك من سؤال مباشر إلى تطبيق ثم نقل الفهم لسياق أصعب. كل إجابة هتساعدك تعرف نقط قوّتك وإيه اللي محتاج مراجعة.","Move from a direct question to practice and then a more challenging situation. Each answer helps you see your strengths and what needs review.")}</p>
            <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
              <span className="pill">
                +{lesson.xp_reward} XP on first completion
              </span>
              <span className="pill">
                +{lesson.coin_reward} Coins on first completion
              </span>
            </div>
            <div className="hero-actions" style={{ marginTop: 16 }}>
              <a
                className="btn btn-secondary"
                href={`/study?lesson=${encodeURIComponent(lesson.id)}&title=${encodeURIComponent(lessonTitle)}`}
              >
                {t("أضف مهمة أو بطاقات", "Add a task or cards")}
              </a>
            </div>
          </section>
          <section className="ai-preview">
            <b>Noäta AI</b>
            <p>{t("لو في نقطة مش واضحة، افتح Noäta AI واشرحها بطريقتك قبل ما تبدأ الـ Mission.","If something is unclear, ask Noäta AI before starting the mission.")}</p>
            <a
              href={
                "/ai?prompt=" +
                encodeURIComponent(
                  t("اشرحلي درس ","Explain a lesson ") +
                    lessonTitle +
                    t(" خطوة بخطوة: "," Step by step: ") +
                    (summary ?? "") + (track?.slug ? ` · curriculum track ${track.slug}` : ""),
                )
              }
            >{t("افتح AI →","Open Noäta AI")}</a>
          </section>
        </aside>
      </section>
    </>
  );
}
