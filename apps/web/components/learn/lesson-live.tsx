"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";

import { useEffect, useMemo, useState } from "react";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";

type LessonRow = {
  id: string;
  title_ar: string;
  title_en: string;
  content: unknown;
  xp_reward: number;
  coin_reward: number;
  units: { title_ar: string; title_en: string } | null;
};

type ContentShape = {
  duration_minutes?: number;
  summary_ar?: string;
  summary_en?: string;
  worked_ar?: string;
  worked_en?: string;
  prerequisite_lesson_id?: string;
};

export function LessonLive({ id }: { id: string }) {
 const t=useTranslation(),locale=useLocale();
  const supabase = useMemo(() => createClient(), []);
  const account = useVerifiedAccount();
  const [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const [lesson, setLesson] = useState<LessonRow | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
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
    void (async () => {
      try {
        const lesson = await supabase
          .from("lessons")
          .select(
            "id,title_ar,title_en,content,xp_reward,coin_reward,units(title_ar,title_en)",
          )
          .eq("id", id)
          .maybeSingle();
        if (!alive) return;
        if (lesson.error) throw lesson.error;
        if (!lesson.data) {
          setMissing(true);
          return;
        }
        const count = await supabase
          .from("questions")
          .select("id", { count: "exact", head: true })
          .eq("lesson_id", id)
          .is("variant_of", null)
          .in("publication_status", ["published_demo", "published"]);
        if (!alive) return;
        if (count.error || count.count === null)
          throw count.error ?? Error("Unknown question count");
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
        setQuestionCount(count.count);
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

  return (
    <>
      <header className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>
            {t("\u062f\u0631\u0633","Lesson")}
          </div>
          <h1 style={{ margin: "6px 0 0" }}>{(locale==="en"?lesson.title_en:lesson.title_ar)}</h1>
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
          {(locale==="en"?lesson.units?.title_en:lesson.units?.title_ar) ?? t("\u062f\u0631\u0633 Noata","Noata lesson")}
        </div>
        <h2 style={{ fontSize: "clamp(28px,4vw,42px)", margin: "9px 0" }}>
          {(locale==="en"?lesson.title_en:lesson.title_ar)}
        </h2>
        <p>{(locale==="en"?content.summary_en:content.summary_ar) ?? t("الدرس جاهز للتعلم والتطبيق.","Ready to learn and apply this lesson.")}</p>
        <div className="hero-actions">
          <a className="btn btn-primary" href={"/missions?lesson=" + lesson.id}>{t("ابدأ Mission","Start mission")}</a>
          <a
            className="btn btn-secondary"
            href={
              "/ai?prompt=" +
              encodeURIComponent(
                t("اشرحلي درس ","Explain a lesson ") +
                  (locale==="en"?lesson.title_en:lesson.title_ar) +
                  t(" خطوة بخطوة: "," Step by step: ") +
                  ((locale==="en"?content.summary_en:content.summary_ar) ?? ""),
              )
            }
          >{t("اسأل Noata AI","Ask Noata AI")}</a>
        </div>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-head">
            <h2>{t("الفكرة الأساسية","The main idea")}</h2>
            <span className="pill">{t("\u0627\u0644\u0641\u0643\u0631\u0629 \u0623\u0648\u0644\u064b\u0627","Concept first")}</span>
          </div>
          <p style={{ fontSize: 17, lineHeight: 2, margin: 0 }}>
            {(locale==="en"?content.summary_en:content.summary_ar) ?? t("محتوى الدرس قيد الإعداد.","Lesson content is being prepared.")}
          </p>
          {(locale==="en"?content.worked_en:content.worked_ar) && (
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
                {(locale==="en"?content.worked_en:content.worked_ar)}
              </p>
            </>
          )}
        </article>

        <aside>
          <section className="panel">
            <div className="panel-head">
              <h2>{t("بعد الشرح","After the explanation")}</h2>
              <span className="pill">{questionCount} stages</span>
            </div>
            <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>{t("Noata هينقلك من سؤال مباشر إلى تطبيق ثم نقل الفهم لسياق أصعب. كل إجابة هتساعدك تعرف نقط قوّتك وإيه اللي محتاج مراجعة.","Move from a direct question to practice and then a more challenging situation. Each answer helps you see your strengths and what needs review.")}</p>
            <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
              <span className="pill">
                +{lesson.xp_reward} XP on first completion
              </span>
              <span className="pill">
                +{lesson.coin_reward} Coins on first completion
              </span>
            </div>
          </section>
          <section className="ai-preview">
            <b>Noata AI</b>
            <p>{t("لو في نقطة مش واضحة، افتح Noata AI واشرحها بطريقتك قبل ما تبدأ الـ Mission.","If something is unclear, ask Noata AI before starting the mission.")}</p>
            <a
              href={
                "/ai?prompt=" +
                encodeURIComponent(
                  t("اشرحلي درس ","Explain a lesson ") +
                    (locale==="en"?lesson.title_en:lesson.title_ar) +
                    t(" خطوة بخطوة: "," Step by step: ") +
                    ((locale==="en"?content.summary_en:content.summary_ar) ?? ""),
                )
              }
            >{t("افتح AI →","Open Noata AI")}</a>
          </section>
        </aside>
      </section>
    </>
  );
}
