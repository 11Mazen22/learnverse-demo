"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type BossQuestion = {
  id: string;
  unit_id: string | null;
  position: number | null;
  question_type: string;
  prompt_ar: string;
  choices_ar: unknown;
};
type Grade = { correct?: boolean; explanation_ar?: string };
type BossResult = {
  score?: number;
  passed?: boolean;
  first_reward?: boolean;
  xp_reward?: number;
  coin_reward?: number;
  reward_box_id?: string | null;
};
type BoxResult = {
  reward?: { coins?: number; xp?: number; tier?: string };
  duplicate?: boolean;
};

const opts = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);

export function BossLive() {
  const supabase = useMemo(() => createClient(), []);
  const [unit, setUnit] = useState<{ id: string; title_ar: string } | null>(
    null,
  );
  const [questions, setQuestions] = useState<BossQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [bossResult, setBossResult] = useState<BossResult | null>(null);
  const [box, setBox] = useState<BoxResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
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
      const { data: units } = await supabase
        .from("units")
        .select("id,title_ar,metadata")
        .eq("boss_enabled", true)
        .order("position");
      const selected = units?.find(
        (row) =>
          !(
            row.metadata &&
            typeof row.metadata === "object" &&
            "locked" in row.metadata &&
            (row.metadata as { locked?: boolean }).locked
          ),
      );
      if (!selected) return;
      setUnit({ id: selected.id, title_ar: selected.title_ar });
      const { data: q } = await supabase
        .from("questions")
        .select("id,unit_id,position,question_type,prompt_ar,choices_ar")
        .eq("unit_id", selected.id)
        .is("variant_of", null)
        .in("publication_status", ["published_demo", "published"])
        .order("position")
        .limit(3);
      setQuestions((q ?? []) as BossQuestion[]);
    })();
  }, [supabase]);

  const current = questions[idx];

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

  async function advance() {
    if (!current || !grade) return;
    if (!grade.correct) {
      const { data: variant } = await supabase
        .from("questions")
        .select("id,unit_id,position,question_type,prompt_ar,choices_ar")
        .eq("variant_of", current.id)
        .in("publication_status", ["published_demo", "published"])
        .limit(1)
        .maybeSingle();
      if (variant) {
        setQuestions((list) =>
          list.map((q, i) => (i === idx ? (variant as BossQuestion) : q)),
        );
        setAnswer("");
        setGrade(null);
        return;
      }
    }
    if (idx < questions.length - 1) {
      setIdx((x) => x + 1);
      setAnswer("");
      setGrade(null);
      return;
    }

    if (!unit) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("complete_unit_boss", {
      p_unit_id: unit.id,
      p_question_ids: questions.map((q) => q.id),
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    setBossResult((data ?? {}) as BossResult);
    setBusy(false);
  }

  async function openBox() {
    if (!bossResult?.reward_box_id) return;
    setBusy(true);
    setError("");
    const { data, error } = await supabase.rpc("claim_reward_box", {
      p_box_id: bossResult.reward_box_id,
    });
    if (error) setError(error.message);
    else setBox((data ?? {}) as BoxResult);
    setBusy(false);
  }

  if (signedIn === false)
    return (
      <section className="panel" style={{ textAlign: "center", padding: 32 }}>
        <h2>Unit Boss محتاج حساب.</h2>
        <a
          className="btn"
          href="/login"
          style={{ background: "var(--accent)", color: "var(--surface)" }}
        >
          دخول
        </a>
      </section>
    );

  if (bossResult)
    return (
      <section className="hero" style={{ textAlign: "center", padding: 46 }}>
        <div className="eyebrow">UNIT BOSS RESULT</div>
        <h1>
          {bossResult.passed ? "Boss defeated 🔥" : "لسه الـ Boss واقف 👀"}
        </h1>
        <p>
          نتيجتك {bossResult.score ?? 0}/3.{" "}
          {bossResult.passed
            ? "أثبتّ فهمك وقدرتك على تطبيق اللي اتعلمته."
            : "راجع المهارات الضعيفة وارجع بمحاولة أقوى."}
        </p>
        {bossResult.passed && (
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              marginTop: 16,
            }}
          >
            <span className="pill">+{bossResult.xp_reward ?? 0} XP</span>
            <span className="pill">+{bossResult.coin_reward ?? 0} Coins</span>
          </div>
        )}
        {bossResult.passed && bossResult.reward_box_id && !box && (
          <button
            onClick={() => void openBox()}
            disabled={busy}
            className="btn btn-primary"
            style={{ marginTop: 22 }}
          >
            🎁 افتح Mystery Box
          </button>
        )}
        {box && (
          <div
            style={{
              margin: "22px auto 0",
              maxWidth: 360,
              padding: 18,
              borderRadius: 20,
              background: "rgba(255,255,255,.12)",
            }}
          >
            <b>{box.reward?.tier?.toUpperCase()} BOX</b>
            <p>
              +{box.reward?.coins ?? 0} Coins · +{box.reward?.xp ?? 0} XP
            </p>
          </div>
        )}
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <a className="btn btn-secondary" href="/review">
            Review
          </a>
          <a className="btn btn-secondary" href="/progress">
            Progress
          </a>
        </div>
      </section>
    );

  return (
    <>
      <header className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>
            UNIT BOSS
          </div>
          <h1 style={{ margin: "6px 0 0" }}>{unit?.title_ar ?? "Loading…"}</h1>
        </div>
        <span className="pill">{questions.length ? idx + 1 : 0}/3</span>
      </header>
      <section className="hero" style={{ padding: 28, marginBottom: 18 }}>
        <div className="eyebrow">الخطوة الأخيرة في الوحدة</div>
        <h2 style={{ margin: "8px 0", fontSize: 30 }}>هنا، فهمك هو قوّتك.</h2>
        <p>
          تحدّي من ثلاث مراحل: فهم الفكرة، تطبيقها، واستخدامها في موقف جديد. خُد
          وقتك، وورّينا اللي اتعلمته.
        </p>
      </section>
      <section className="panel" style={{ padding: 28 }}>
        {!current ? (
          <p>Loading Boss…</p>
        ) : (
          <form onSubmit={submit}>
            <h2 style={{ lineHeight: 1.6 }}>{current.prompt_ar}</h2>
            {current.question_type === "multiple-choice" ? (
              <div style={{ display: "grid", gap: 10 }}>
                {opts(current.choices_ar).map((x, i) => (
                  <button
                    key={x}
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
                    {String.fromCharCode(65 + i)}. {x}
                  </button>
                ))}
              </div>
            ) : (
              <input
                className="search"
                style={{ width: "100%" }}
                disabled={Boolean(grade)}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                inputMode="decimal"
                placeholder="الإجابة…"
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
                <b>{grade.correct ? "Perfect" : "Not yet"}</b>
                <p>{grade.explanation_ar}</p>
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
                  disabled={!answer || busy}
                  className="btn"
                  style={{
                    background: "var(--accent)",
                    color: "var(--surface)",
                  }}
                >
                  تحقق
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void advance()}
                  className="btn"
                  style={{
                    background: "var(--accent)",
                    color: "var(--surface)",
                  }}
                >
                  {grade.correct
                    ? idx === questions.length - 1
                      ? "Finish Boss"
                      : "التالي"
                    : "Parallel recovery"}
                </button>
              )}
            </div>
          </form>
        )}
      </section>
    </>
  );
}
