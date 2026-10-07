"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ReviewQuestion = {
  id: string;
  skill_id: string | null;
  question_type: string;
  prompt_ar: string;
  choices_ar: unknown;
  metadata: unknown;
};
type Evidence = {
  skill_id: string;
  mastery_score: number;
  state: string;
  next_review_at: string | null;
  skills: { title_ar: string; title_en: string } | null;
};
type Grade = {
  correct?: boolean;
  explanation_ar?: string;
  mastery_score?: number | null;
  mastery_state?: string | null;
  next_review_at?: string | null;
};

function options(v: unknown) {
  return Array.isArray(v) ? v.map(String) : [];
}

export function ReviewLive() {
  const supabase = useMemo(() => createClient(), []);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSignedIn(false);
        return;
      }
      setSignedIn(true);
      const { data: ev } = await supabase
        .from("skill_evidence")
        .select(
          "skill_id,mastery_score,state,next_review_at,skills(title_ar,title_en)",
        )
        .eq("user_id", user.id)
        .order("next_review_at", { ascending: true });
      const rows = (ev ?? []) as Evidence[];
      setEvidence(rows);
      const skillIds = rows.map((x) => x.skill_id);
      if (!skillIds.length) return;
      const { data: q } = await supabase
        .from("questions")
        .select("id,skill_id,question_type,prompt_ar,choices_ar,metadata")
        .in("skill_id", skillIds)
        .is("variant_of", null)
        .in("publication_status", ["published_demo", "published"])
        .order("position");
      const pool = (q ?? []) as ReviewQuestion[];
      const picked: ReviewQuestion[] = [];
      for (const skillId of skillIds) {
        const used = pool.find((x) => x.skill_id === skillId);
        if (used) picked.push(used);
      }
      setQuestions(picked);
    })();
  }, [supabase]);

  const current = questions[idx];
  const skill = evidence.find((x) => x.skill_id === current?.skill_id);
  const due = evidence.filter(
    (x) => !x.next_review_at || new Date(x.next_review_at) <= new Date(),
  ).length;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!current || !answer.trim() || busy) return;
    setBusy(true);
    setError("");
    const { data, error } = await supabase.rpc("submit_attempt", {
      p_question_id: current.id,
      p_response: { value: answer },
      p_assisted: false,
      p_idempotency_key: crypto.randomUUID(),
      p_practice_repeat: false,
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    setGrade((data ?? {}) as Grade);
    setBusy(false);
  }

  async function next() {
    if (!current) return;
    if (grade && !grade.correct) {
      const { data: variant } = await supabase
        .from("questions")
        .select("id,skill_id,question_type,prompt_ar,choices_ar,metadata")
        .eq("variant_of", current.id)
        .in("publication_status", ["published_demo", "published"])
        .limit(1)
        .maybeSingle();
      if (variant) {
        setQuestions((list) =>
          list.map((q, i) => (i === idx ? (variant as ReviewQuestion) : q)),
        );
        setAnswer("");
        setGrade(null);
        return;
      }
    }
    setAnswer("");
    setGrade(null);
    setIdx((x) => Math.min(x + 1, questions.length));
  }

  if (signedIn === false)
    return (
      <section className="panel" style={{ textAlign: "center", padding: 32 }}>
        <h2>المراجعة الذكية مرتبطة بحسابك.</h2>
        <a
          className="btn"
          href="/login"
          style={{ background: "var(--accent)", color: "var(--surface)" }}
        >
          دخول
        </a>
      </section>
    );

  if (idx >= questions.length && questions.length > 0)
    return (
      <section className="hero" style={{ textAlign: "center", padding: 44 }}>
        <div className="eyebrow">REVIEW COMPLETE</div>
        <h1>كده المراجعة خلصت ✨</h1>
        <p>المواعيد الجديدة اتحدثت من أدائك، مش من مؤقت ثابت.</p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <a className="btn btn-primary" href="/progress">
            شوف الـ Mastery
          </a>
          <a className="btn btn-secondary" href="/learn">
            كمّل تعلم
          </a>
        </div>
      </section>
    );

  return (
    <>
      <header className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>
            SPACED REVIEW
          </div>
          <h1 style={{ margin: "6px 0 0" }}>Review Queue</h1>
        </div>
        <span className="pill">{due} due</span>
      </header>

      {!questions.length ? (
        <section className="panel" style={{ padding: 32, textAlign: "center" }}>
          <h2>لسه مفيش مراجعات مبنية على evidence.</h2>
          <p style={{ color: "var(--muted)" }}>
            كمّل Missions الأول، وبعدها Noata هيبني لك مواعيد مراجعة تلقائية.
          </p>
          <a
            className="btn"
            href="/missions"
            style={{ background: "var(--accent)", color: "var(--surface)" }}
          >
            ابدأ Mission
          </a>
        </section>
      ) : (
        <section className="panel" style={{ padding: 28 }}>
          <div className="panel-head">
            <div>
              <span className="pill">{skill?.skills?.title_ar ?? "Skill"}</span>
              <h2 style={{ marginTop: 12 }}>{current?.prompt_ar}</h2>
            </div>
            <b>
              {idx + 1}/{questions.length}
            </b>
          </div>
          <form onSubmit={submit}>
            {current?.question_type === "multiple-choice" ? (
              <div style={{ display: "grid", gap: 10 }}>
                {options(current.choices_ar).map((option, i) => (
                  <button
                    key={option}
                    type="button"
                    disabled={Boolean(grade)}
                    onClick={() => setAnswer(String(i))}
                    style={{
                      textAlign: "start",
                      padding: 14,
                      borderRadius: 14,
                      border:
                        "1px solid " +
                        (answer === String(i)
                          ? "var(--accent)"
                          : "var(--line)"),
                      background:
                        answer === String(i)
                          ? "rgba(47,124,255,.08)"
                          : "var(--surface)",
                      color: "var(--ink)",
                    }}
                  >
                    {String.fromCharCode(65 + i)}. {option}
                  </button>
                ))}
              </div>
            ) : (
              <input
                className="search"
                style={{ width: "100%" }}
                value={answer}
                disabled={Boolean(grade)}
                onChange={(e) => setAnswer(e.target.value)}
                inputMode="decimal"
                placeholder="اكتب إجابتك…"
              />
            )}
            {grade && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: 15,
                  background: grade.correct
                    ? "rgba(24,166,106,.09)"
                    : "rgba(227,87,87,.08)",
                }}
              >
                <b>{grade.correct ? "صح 👏" : "لسه محتاجة محاولة تانية"}</b>
                <p>{grade.explanation_ar}</p>
                {grade.mastery_score != null && (
                  <small>
                    Mastery {Math.round(Number(grade.mastery_score))}% ·{" "}
                    {grade.mastery_state}
                  </small>
                )}
              </div>
            )}
            {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 18,
              }}
            >
              {!grade ? (
                <button
                  className="btn"
                  disabled={!answer || busy}
                  style={{
                    background: "var(--accent)",
                    color: "var(--surface)",
                  }}
                >
                  {busy ? "جارٍ التحقق…" : "تحقق"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn"
                  onClick={() => void next()}
                  style={{
                    background: "var(--accent)",
                    color: "var(--surface)",
                  }}
                >
                  {grade.correct ? "التالي" : "سؤال موازي"}
                </button>
              )}
            </div>
          </form>
        </section>
      )}
    </>
  );
}
