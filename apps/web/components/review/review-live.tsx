"use client";
import {masteryLabel,questionTypeLabel} from "@/lib/i18n/content-labels";
import {useLocale,useTranslation} from "@/lib/i18n/locale";

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
   prompt_en: string | null;
   choices_en: unknown;
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
  explanation_ar?: string; explanation_en?:string;
  mastery_score?: number | null;
  mastery_state?: string | null;
  next_review_at?: string | null;
};

function options(v: unknown) {
  return Array.isArray(v) ? v.map(String) : [];
}

export function ReviewLive() {
 const t=useTranslation(),locale=useLocale();
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
          .select("id,skill_id,question_type,prompt_ar,prompt_en,choices_ar,choices_en,metadata")
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
        if (active) setError(t("تعذّر تحميل بيانات هذه المساحة. حاول مرة أخرى.","Could not load this page. Please try again."));
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
          .select("id,skill_id,question_type,prompt_ar,prompt_en,choices_ar,choices_en,metadata")
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
        <button type="button" onClick={() => void account.refresh()}>{t("إعادة المحاولة","Try again")}</button>
      </section>
    );
  if (account.loading || loading)
    return (
      <section className="aura-loading-state" role="status">
        <span />
        <h2>{t("بنجهّز مساحتك…","Preparing your space…")}</h2>
        <p>{t("لحظات ونرتّب خطوتك التالية.","Finding your next step.")}</p>
      </section>
    );
  if (error && !questions.length)
    return (
      <section className="aura-load-error" role="alert">
        <strong>{error}</strong>
        <button type="button" onClick={() => setReload((n) => n + 1)}>{t("إعادة المحاولة","Try again")}</button>
      </section>
    );
  if (signedIn === false)
    return (
      <ModuleWelcome
        title={t("فهمك يستحق أن يدوم.","Make your understanding last.")}
        description={t("راجع المهارات في وقتها المناسب، واختبر ما تتذكره؛ مواعيد المراجعة مرتبطة بأدائك الفعلي.","Review skills at the right time and check what you remember. Review dates follow your actual performance.")}
        icon="review"
        route="/review"
        eyebrow={t("المراجعة المتباعدة","Spaced review")}
        steps={[
          t("استرجع الفكرة من ذاكرتك","Recall the idea"),
          t("اعرف ما يحتاج إلى تثبيت","Find what needs practice"),
          t("تابع موعد المراجعة التالية","See your next review date"),
        ]}
      />
    );

  if (idx >= questions.length && questions.length > 0)
    return (
      <section className="hero" style={{ textAlign: "center", padding: 44 }}>
        <div className="eyebrow">{t("اكتملت مراجعة اليوم","Today’s review is complete")}</div>
        <h1>{t("كده المراجعة خلصت ✨","Review complete ✨")}</h1>
        <p>{t("المواعيد الجديدة اتحدثت من أدائك، مش من مؤقت ثابت.","Your next review dates have been updated based on your performance.")}</p>
        <div className="hero-actions" style={{ justifyContent: "center" }}>
          <a className="btn btn-primary" href="/progress">{t("تابع مستوى إتقانك","View your mastery")}</a>
          <a className="btn btn-secondary" href="/learn">{t("كمّل تعلم","Keep learning")}</a>
        </div>
      </section>
    );

  return (
    <>
      <header className="noata-section-head">
        <div>
          <p className="noata-eyebrow">{t("مساحتك للمراجعة الذكية","Your space for focused review")}</p>
          <h1>{t("المراجعة المتباعدة","Spaced review")}</h1>
          <p>{t("راجع اللي اتعلمته في الوقت المناسب. المواعيد بتتبني على إجاباتك الحقيقية، مش مؤقت عشوائي.","Review what you learned at the right time. Dates follow your actual answers.")}</p>
        </div>
        <span className="pill">{due.toLocaleString(locale==="en"?"en":"ar-EG")}{t("مراجعات مستحقة","Reviews due")}</span>
      </header>

      {!questions.length ? (
        <section className="noata-empty" role="status">
          <span className="noata-empty-icon" aria-hidden="true">✦</span>
          <h2>{due ? t("فيه مراجعات مستحقة، لكن الأسئلة مش جاهزة لسه","Reviews are due, but their questions are not available yet") : t("تمام! مفيش مراجعات مستحقة دلوقتي","You’re up to date. No reviews are due.")}</h2>
          <p>{due ? t("مهاراتك محفوظة. الأسئلة المرتبطة بها غير منشورة في Staging بعد؛ هنظهرها هنا لما تتاح.","Your skills are saved. Their questions will appear here when published.") : t("كمّل مهامك ودروسك، وهنجهّز مراجعات بموعد حقيقي حسب تقدمك.","Continue your missions and lessons. Reviews will be scheduled as your skills develop.")}</p>
          <div className="hero-actions"><a href="/missions" className="btn btn-primary">{t("ابدأ مهمة تعليمية","Start a learning mission")}</a><a href="/learn" className="btn btn-secondary">{t("استكشف الدروس","Explore lessons")}</a></div>
        </section>
      ) : (
        <section className="panel" style={{ padding: 28 }}>
          <div className="panel-head">
            <div>
              <span className="pill">{(locale==="en"?skill?.skills?.title_en:skill?.skills?.title_ar) ?? t("مهارة قيد المراجعة","Skill under review")}</span>
              <h2 style={{ marginTop: 12 }}>{(locale==="en" ? current?.prompt_en ?? "English question unavailable." : current?.prompt_ar)}</h2>
            </div>
            <b>
              {idx + 1}/{questions.length}
            </b>
          </div>
          <form onSubmit={submit}>
            {current?.question_type === "multiple-choice" ? (
              <div style={{ display: "grid", gap: 10 }}>
                {options((locale==="en" ? current.choices_en : current.choices_ar)).map((option, i) => (
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
                    {(i + 1).toLocaleString(locale==="en"?"en":"ar-EG")}. {option}
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
                aria-label={t("إجابتك على السؤال","Your answer")}
                placeholder={t("اكتب إجابتك…","Enter your answer…")}
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
                <b>{grade.correct ? t("صح 👏","Correct 👏") : t("لسه محتاجة محاولة تانية","Try again")}</b>
                <p>{(locale==="en" ? grade.explanation_en ?? "" : grade.explanation_ar)}</p>
                {grade.mastery_score != null && (
                  <small>{t("درجة الإتقان","Mastery")}{Math.round(Number(grade.mastery_score)).toLocaleString(locale==="en"?"en":"ar-EG")}{t("٪ ·","% ·")}{" "}
                    {masteryLabel(grade.mastery_state,locale)}
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
                  {busy ? t("جارٍ التحقق…","Checking…") : t("تحقق","Check answer")}
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
                  {grade.correct ? t("التالي","Next") : t("سؤال موازي","Similar question")}
                </button>
              )}
            </div>
          </form>
        </section>
      )}
    </>
  );
}
