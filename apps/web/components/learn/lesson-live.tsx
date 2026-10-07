"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LessonRow = {
  id: string;
  title_ar: string;
  title_en: string;
  content: unknown;
  xp_reward: number;
  coin_reward: number;
  units: { title_ar: string } | null;
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
  const supabase = useMemo(() => createClient(), []);
  const [lesson, setLesson] = useState<LessonRow | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select(
          "id,title_ar,title_en,content,xp_reward,coin_reward,units(title_ar)",
        )
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        setMissing(true);
        setLoading(false);
        return;
      }
      setLesson(data as LessonRow);

      const [
        { count },
        {
          data: { user },
        },
      ] = await Promise.all([
        supabase
          .from("questions")
          .select("id", { count: "exact", head: true })
          .eq("lesson_id", id)
          .is("variant_of", null)
          .in("publication_status", ["published_demo", "published"]),
        supabase.auth.getUser(),
      ]);
      setQuestionCount(count ?? 0);

      if (user) {
        const { data: progress } = await supabase
          .from("lesson_progress")
          .select("completed_at,best_score")
          .eq("user_id", user.id)
          .eq("lesson_id", id)
          .maybeSingle();
        if (progress) {
          setCompleted(Boolean(progress.completed_at));
          setBestScore(Number(progress.best_score));
        }
      }
      setLoading(false);
    })();
  }, [id, supabase]);

  if (loading)
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
        <h2>الدرس ده مش متاح.</h2>
        <a
          className="btn"
          href="/learn"
          style={{ background: "var(--accent)", color: "var(--surface)" }}
        >
          رجوع للمسار
        </a>
      </section>
    );

  const content = (lesson.content ?? {}) as ContentShape;

  return (
    <>
      <header className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>
            LESSON
          </div>
          <h1 style={{ margin: "6px 0 0" }}>{lesson.title_ar}</h1>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {completed && (
            <span className="pill">
              Completed · {Math.round(bestScore ?? 0)}%
            </span>
          )}
          <span className="pill">{content.duration_minutes ?? 7} min</span>
        </div>
      </header>

      <section className="hero" style={{ padding: 30 }}>
        <div className="eyebrow">
          {lesson.units?.title_ar ?? "NOATA LESSON"}
        </div>
        <h2 style={{ fontSize: "clamp(28px,4vw,42px)", margin: "9px 0" }}>
          {lesson.title_ar}
        </h2>
        <p>{content.summary_ar ?? "الدرس جاهز للتعلم والتطبيق."}</p>
        <div className="hero-actions">
          <a className="btn btn-primary" href={"/missions?lesson=" + lesson.id}>
            ابدأ Mission
          </a>
          <a
            className="btn btn-secondary"
            href={
              "/ai?prompt=" +
              encodeURIComponent(
                "اشرحلي درس " +
                  lesson.title_ar +
                  " خطوة بخطوة: " +
                  (content.summary_ar ?? ""),
              )
            }
          >
            اسأل Noata AI
          </a>
        </div>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="panel-head">
            <h2>الفكرة الأساسية</h2>
            <span className="pill">Concept first</span>
          </div>
          <p style={{ fontSize: 17, lineHeight: 2, margin: 0 }}>
            {content.summary_ar ?? "محتوى الدرس قيد الإعداد."}
          </p>
          {content.worked_ar && (
            <>
              <div
                style={{
                  height: 1,
                  background: "var(--line)",
                  margin: "22px 0",
                }}
              />
              <div className="panel-head">
                <h2>مثال محلول</h2>
                <span className="pill">Worked example</span>
              </div>
              <p style={{ fontSize: 16, lineHeight: 2, margin: 0 }}>
                {content.worked_ar}
              </p>
            </>
          )}
        </article>

        <aside>
          <section className="panel">
            <div className="panel-head">
              <h2>بعد الشرح</h2>
              <span className="pill">{questionCount} stages</span>
            </div>
            <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>
              Noata هينقلك من سؤال مباشر إلى تطبيق ثم نقل الفهم لسياق أصعب. كل
              إجابة هتساعدك تعرف نقط قوّتك وإيه اللي محتاج مراجعة.
            </p>
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
            <p>
              لو في نقطة مش واضحة، افتح Noata AI واشرحها بطريقتك قبل ما تبدأ الـ
              Mission.
            </p>
            <a
              href={
                "/ai?prompt=" +
                encodeURIComponent(
                  "اشرحلي درس " +
                    lesson.title_ar +
                    " خطوة بخطوة: " +
                    (content.summary_ar ?? ""),
                )
              }
            >
              افتح AI →
            </a>
          </section>
        </aside>
      </section>
    </>
  );
}
