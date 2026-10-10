"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ModuleWelcome } from "@/components/ui/module-welcome";
import { useConfirmedMutation } from "@/lib/supabase/use-confirmed-mutation";
import { createOperationKeys } from "@/lib/ai/operation-keys";
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
  const { account, busy, status, run } = useConfirmedMutation();
  const operationKeys = useRef(createOperationKeys());
  const signedIn = account.loading ? null : Boolean(account.user);
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
    setIdx(0);
    setEvidence([]);
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const user = account.user;
        if (!user) {
          return;
        }
        const { data: ev, error: readError } = await supabase
          .from("skill_evidence")
          .select(
            "skill_id,mastery_score,state,next_review_at,skills(title_ar,title_en)",
          )
          .eq("user_id", user.id)
          .order("next_review_at", { ascending: true });
        if (!active) return;
        if (readError) throw readError;
        const rows = (ev ?? []) as Evidence[];
        setEvidence(rows);
        const skillIds = rows
          .filter((x) => !x.next_review_at || new Date(x.next_review_at).getTime() <= Date.now())
          .map((x) => x.skill_id);
        if (!skillIds.length) return;
        const { data: q, error: questionError } = await supabase
          .from("questions")
          .select("id,skill_id,question_type,prompt_ar,choices_ar,metadata")
          .in("skill_id", skillIds)
          .is("variant_of", null)
          .in("publication_status", ["published_demo", "published"])
          .order("position");
        if (!active) return;
        if (questionError) throw questionError;
        const pool = (q ?? []) as ReviewQuestion[];
        const picked: ReviewQuestion[] = [];
        for (const skillId of skillIds) {
          const used = pool.find((x) => x.skill_id === skillId);
          if (used) picked.push(used);
        }
        setQuestions(picked);
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

  const current = questions[idx];
  const skill = evidence.find((x) => x.skill_id === current?.skill_id);
  const due = evidence.filter(
    (x) => !x.next_review_at || new Date(x.next_review_at) <= new Date(),
  ).length;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!current || !answer.trim() || busy) return;
    await run(async (check) => {
      setError("");
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
      setGrade(data as Grade);
    }, "");
  }

  async function next() {
    if (!current || !grade) return;
    await run(async (check) => {
      if (grade && !grade.correct) {
        const { data: variant, error: variantError } = await supabase
          .from("questions")
          .select("id,skill_id,question_type,prompt_ar,choices_ar,metadata")
          .eq("variant_of", current.id)
          .in("publication_status", ["published_demo", "published"])
          .limit(1)
          .maybeSingle();
        check();
        if (variantError) throw variantError;
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
  if (signedIn === false)
    return (
      <ModuleWelcome
        title="فهمك يستحق أن يدوم."
        description="راجع المهارات في وقتها المناسب، واختبر ما تتذكره؛ مواعيد المراجعة مرتبطة بأدائك الفعلي."
        icon="review"
        route="/review"
        eyebrow="المراجعة المتباعدة"
        steps={[
          "استرجع الفكرة من ذاكرتك",
          "اعرف ما يحتاج إلى تثبيت",
          "تابع موعد المراجعة التالية",
        ]}
      />
    );

  if (idx >= questions.length && questions.length > 0)
    return (
      <section className="hero" style={{ textAlign: "center", padding: 44 }}>
        <div className="eyebrow">اكتملت مراجعة اليوم</div>
        <h1>كده المراجعة خلصت ✨</h1>
        <p>المواعيد الجديدة اتحدثت من أدائك، مش من مؤقت ثابت.</p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <a className="btn btn-primary" href="/progress">
            تابع مستوى إتقانك
          </a>
          <a className="btn btn-secondary" href="/learn">
            كمّل تعلم
          </a>
        </div>
      </section>
    );

  return (
    <>
      <header className="noata-section-head">
        <div>
          <p className="noata-eyebrow">مساحتك للمراجعة الذكية</p>
          <h1>المراجعة المتباعدة</h1>
          <p>راجع اللي اتعلمته في الوقت المناسب. المواعيد بتتبني على إجاباتك الحقيقية، مش مؤقت عشوائي.</p>
        </div>
        <span className="pill">{due.toLocaleString("ar-EG")} مراجعات مستحقة</span>
      </header>

      {!questions.length ? (
        <section className="noata-empty" role="status">
          <span className="noata-empty-icon" aria-hidden="true">✦</span>
          <h2>{due ? "فيه مراجعات مستحقة، لكن الأسئلة مش جاهزة لسه" : "تمام! مفيش مراجعات مستحقة دلوقتي"}</h2>
          <p>{due ? "مهاراتك محفوظة. الأسئلة المرتبطة بها غير منشورة في Staging بعد؛ هنظهرها هنا لما تتاح." : "كمّل مهامك ودروسك، وهنجهّز مراجعات بموعد حقيقي حسب تقدمك."}</p>
          <div className="hero-actions"><a href="/missions" className="btn btn-primary">ابدأ مهمة تعليمية</a><a href="/learn" className="btn btn-secondary">استكشف الدروس</a></div>
        </section>
      ) : (
        <section className="panel" style={{ padding: 28 }}>
          <div className="panel-head">
            <div>
              <span className="pill">{skill?.skills?.title_ar ?? "مهارة قيد المراجعة"}</span>
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
                    disabled={Boolean(grade) || busy}
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
                    {(i + 1).toLocaleString("ar-EG")}. {option}
                  </button>
                ))}
              </div>
            ) : (
              <input
                className="search"
                style={{ width: "100%" }}
                value={answer}
                disabled={Boolean(grade) || busy}
                onChange={(e) => setAnswer(e.target.value)}
                inputMode={
                  current.question_type === "numeric" ? "decimal" : "text"
                }
                aria-label="إجابتك على السؤال"
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
                    درجة الإتقان {Math.round(Number(grade.mastery_score)).toLocaleString("ar-EG")}٪ ·{" "}
                    {grade.mastery_state}
                  </small>
                )}
              </div>
            )}
            {(error || status) && (
              <p role="alert" style={{ color: "var(--danger)" }}>
                {error || status}
              </p>
            )}
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
