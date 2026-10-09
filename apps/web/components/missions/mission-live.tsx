"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useConfirmedMutation } from "@/lib/supabase/use-confirmed-mutation";
import { createOperationKeys } from "@/lib/ai/operation-keys";
import { createClient } from "@/lib/supabase/client";

type Question = {
  id: string;
  lesson_id: string | null;
  position: number | null;
  question_type: string;
  prompt_ar: string;
  choices_ar: unknown;
  metadata: unknown;
};
type Grade = {
  correct?: boolean;
  explanation_ar?: string;
  xp_awarded?: number;
  mastery_score?: number | null;
  mastery_state?: string | null;
  duplicate?: boolean;
};

function choices(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

export function MissionLive() {
  const supabase = useMemo(() => createClient(), []);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("المهام");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const { account, busy, status, run } = useConfirmedMutation();
  const operationKeys = useRef(createOperationKeys());
  const signedIn = account.loading ? null : Boolean(account.user);
  const [firstTryWins, setFirstTryWins] = useState(0);
  const [attempted, setAttempted] = useState<Set<string>>(new Set());
  const [complete, setComplete] = useState(false);
  const [reward, setReward] = useState<{
    xp_reward?: number;
    coin_reward?: number;
    verified_lesson_gems?: number | null;
  } | null>(null);
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (account.loading) return;
    let active = true;
    operationKeys.current.clear();
    setQuestions([]);
    setAnswer("");
    setGrade(null);
    setIndex(0);
    setFirstTryWins(0);
    setAttempted(new Set());
    setComplete(false);
    setReward(null);
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const user = account.user;
        if (!user) return;

        const requested = new URLSearchParams(window.location.search).get(
          "lesson",
        );
        let lesson: { id: string; title_ar: string } | null = null;

        if (requested) {
          const { data, error: readError } = await supabase
            .from("lessons")
            .select("id,title_ar")
            .eq("id", requested)
            .maybeSingle();
          if (!active) return;
          if (readError) throw readError;
          lesson = data;
        }
        if (!lesson) {
          const { data, error: readError } = await supabase
            .from("lessons")
            .select("id,title_ar")
            .order("position")
            .limit(1);
          if (!active) return;
          if (readError) throw readError;
          lesson = data?.[0] ?? null;
        }
        if (!lesson) return;

        setLessonId(lesson.id);
        setLessonTitle(lesson.title_ar);
        const { data, error: readError } = await supabase
          .from("questions")
          .select(
            "id,lesson_id,position,question_type,prompt_ar,choices_ar,metadata",
          )
          .eq("lesson_id", lesson.id)
          .is("variant_of", null)
          .in("publication_status", ["published_demo", "published"])
          .order("position")
          .limit(3);
        if (!active) return;
        if (readError) throw readError;
        setQuestions((data ?? []) as Question[]);
      } catch {
        if (active) setError("تعذّر تحميل بيانات هذه المساحة. حاول مرة أخرى.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [supabase, reload, account.user, account.loading]);

  const current = questions[index];
  const opts = current ? choices(current.choices_ar) : [];
  const progress = questions.length
    ? Math.round((index / questions.length) * 100)
    : 0;

  async function gradeCurrent(e: FormEvent) {
    e.preventDefault();
    if (!current || !answer.trim() || busy) return;
    if (!signedIn) {
      window.location.href = "/login";
      return;
    }
    await run(async (check) => {
      setError("");
      const firstAttempt = !attempted.has(current.id);
      const nextAttempted = new Set(attempted);
      nextAttempted.add(current.id);

      const { data, error } = await supabase.rpc("submit_attempt", {
        p_question_id: current.id,
        p_response: { value: answer },
        p_assisted: false,
        p_idempotency_key: operationKeys.current.get(
          JSON.stringify([current.id, answer]),
        ),
        p_practice_repeat: false,
      });

      check();
      if (error) throw error;
      if (typeof (data as Grade | null)?.correct !== "boolean")
        throw Error("Missing grade");
      setAttempted(nextAttempted);
      const result = data as Grade;
      setGrade(result);
      if (result.correct && firstAttempt) setFirstTryWins((x) => x + 1);
    }, "");
  }

  async function continueMission() {
    if (!current || !grade) return;
    await run(async (check) => {
      setError("");

      if (!grade.correct) {
        const { data, error: variantError } = await supabase
          .from("questions")
          .select(
            "id,lesson_id,position,question_type,prompt_ar,choices_ar,metadata",
          )
          .eq("variant_of", current.id)
          .in("publication_status", ["published_demo", "published"])
          .limit(1)
          .maybeSingle();
        check();
        if (variantError) throw variantError;
        if (data) {
          setQuestions((list) =>
            list.map((q, i) => (i === index ? (data as Question) : q)),
          );
          setAnswer("");
          setGrade(null);
          return;
        }
        setAnswer("");
        setGrade(null);
        return;
      }

      if (index < questions.length - 1) {
        setIndex((x) => x + 1);
        setAnswer("");
        setGrade(null);
        return;
      }

      const score = Math.round(
        ((firstTryWins +
          (grade.correct && !attempted.has(current.id) ? 1 : 0)) /
          questions.length) *
          100,
      );
      if (lessonId) {
        const { data, error } = await supabase.rpc("complete_lesson", {
          p_lesson_id: lessonId,
          p_score: score,
        });
        check();
        if (error) throw error;
        if (!data || typeof data !== "object")
          throw Error("Missing completion receipt");
        const receipt = data as { xp_reward?: number; coin_reward?: number };
        const { data: earned, error: gemsError } = await supabase.from("ledger")
          .select("amount").eq("user_id", account.user!.id)
          .eq("currency","GEM").eq("reference_type","lesson").eq("reference_id",lessonId);
        check();
        setReward({
          ...receipt,
          verified_lesson_gems: gemsError ? null :
            (earned ?? []).reduce((total, row) => total + Number(row.amount), 0),
        });
      }
      setComplete(true);
    }, "");
  }

  if (account.error)
    return (
      <section className="aura-load-error" role="alert">
        <h2>{account.error}</h2>
        <button type="button" onClick={() => void account.refresh()}>
          إعادة المحاولة
        </button>
      </section>
    );
  if (account.loading || loading)
    return (
      <section className="aura-loading-state" role="status">
        <span />
        <h2>بنجهّز مساحتك…</h2>
        <p>لحظات ونرتّب خطوتك التالية.</p>
      </section>
    );
  if (error && !questions.length)
    return (
      <section className="aura-load-error" role="alert">
        <strong>{error}</strong>
        <button type="button" onClick={() => setReload((n) => n + 1)}>
          إعادة المحاولة
        </button>
      </section>
    );
  if (complete) {
    return (
      <section className="hero" style={{ textAlign: "center", padding: 44 }}>
        <div className="eyebrow">خطوة اكتملت في رحلتك</div>
        <h1>خلصت المهمة 🔥</h1>
        <p>خطوة جديدة في رحلتك! تقدّمك محفوظ، ومهاراتك بتقوى مع كل محاولة.</p>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 20,
            flexWrap: "wrap",
          }}
        >
          <span className="pill">+{reward?.xp_reward ?? 0} XP</span>
          <span className="pill">+{reward?.coin_reward ?? 0} Coins</span>
          <span className="pill">
            {reward?.verified_lesson_gems == null
              ? "جواهر الدرس: تعذّر التحقق"
              : "💎 الجواهر المستحقة لهذا الدرس: " + reward.verified_lesson_gems}
          </span>
        </div>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <a className="btn btn-primary" href="/progress">
            شوف تقدمك
          </a>
          <a className="btn btn-secondary" href="/learn">
            رجوع للتعلم
          </a>
        </div>
      </section>
    );
  }

  return (
    <>
      <header className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>
            ثلاث مراحل · فهم أعمق
          </div>
          <h1 style={{ margin: "6px 0 0" }}>{lessonTitle}</h1>
        </div>
        <span className="pill">
          {questions.length ? index + 1 : 0} / {questions.length || 3}
        </span>
      </header>

      <ol className="aura-mission-stages" aria-label="مراحل المهمة">
        {["افهم الفكرة", "طبّق المعرفة", "اربط الأفكار"].map((label, stage) => (
          <li
            key={label}
            className={
              stage === index ? "current" : stage < index ? "done" : ""
            }
            aria-current={stage === index ? "step" : undefined}
          >
            <span>{stage + 1}</span>
            <div>
              <strong>{label}</strong>
              <small>
                {stage < index
                  ? "اجتزت المرحلة"
                  : stage === index
                    ? "مرحلتك الحالية"
                    : "الخطوة التالية"}
              </small>
            </div>
          </li>
        ))}
      </ol>
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>ثلاث خطوات لتحدّي نفسك</h2>
            <p style={{ margin: "5px 0 0", color: "var(--muted)" }}>
              افهم الفكرة، طبّقها، وبعدها جرّبها في موقف جديد.
            </p>
          </div>
          <b>{progress}%</b>
        </div>
        <div className="progress">
          <i style={{ width: progress + "%" }} />
        </div>
      </section>

      <section className="panel" style={{ marginTop: 18, padding: 28 }}>
        {!current && <p>المهمة غير متاحة بعد.</p>}
        {current && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
              }}
            >
              <span className="pill">Stage {index + 1}</span>
              <small style={{ color: "var(--muted)" }}>
                {current.question_type}
              </small>
            </div>
            <h2 style={{ fontSize: 25, lineHeight: 1.6, margin: "22px 0" }}>
              {current.prompt_ar}
            </h2>

            <form onSubmit={gradeCurrent}>
              {current.question_type === "multiple-choice" ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {opts.map((option, i) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => !grade && setAnswer(String(i))}
                      style={{
                        textAlign: "start",
                        padding: "15px 16px",
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
                        fontWeight: 700,
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
                  inputMode={
                    current.question_type === "numeric" ? "decimal" : "text"
                  }
                  aria-label="إجابتك على السؤال"
                  value={answer}
                  disabled={Boolean(grade) || busy}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="اكتب الإجابة…"
                />
              )}

              {grade && (
                <div
                  style={{
                    marginTop: 18,
                    padding: 16,
                    borderRadius: 16,
                    background: grade.correct
                      ? "var(--accent-soft)"
                      : "var(--surface-soft)",
                    border:
                      "1px solid " +
                      (grade.correct ? "var(--line)" : "var(--line)"),
                  }}
                >
                  <b>
                    {grade.correct
                      ? "صح 👏"
                      : "قريب منها — خلّينا نحاول بطريقة تانية"}
                  </b>
                  <p style={{ margin: "7px 0 0", lineHeight: 1.7 }}>
                    {grade.explanation_ar || ""}
                  </p>
                  {grade.mastery_score != null && (
                    <small>
                      Mastery: {Math.round(Number(grade.mastery_score))}% ·{" "}
                      {grade.mastery_state}
                    </small>
                  )}
                </div>
              )}
              {(error || status) && (
                <div style={{ marginTop: 12, color: "var(--danger)" }}>
                  {error || status}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 20,
                }}
              >
                {!grade ? (
                  <button
                    disabled={!answer.trim() || busy}
                    className="btn"
                    style={{
                      background: "var(--accent)",
                      color: "var(--surface)",
                    }}
                  >
                    {busy ? "جارٍ التصحيح…" : "تحقق"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void continueMission()}
                    disabled={busy}
                    className="btn"
                    style={{
                      background: "var(--accent)",
                      color: "var(--surface)",
                    }}
                  >
                    {grade.correct
                      ? index === questions.length - 1
                        ? "إنهاء المهمة"
                        : "التالي"
                      : "جرّب سؤال موازي"}
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </section>
    </>
  );
}
