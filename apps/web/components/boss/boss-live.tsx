"use client";
import { useLocale, useTranslation } from "@/lib/i18n/locale";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ModuleWelcome } from "@/components/ui/module-welcome";
import { useConfirmedMutation } from "@/lib/supabase/use-confirmed-mutation";
import { createOperationKeys } from "@/lib/ai/operation-keys";
import { createClient } from "@/lib/supabase/client";

type BossQuestion = {
  id: string;
  unit_id: string | null;
  variant_of: string | null;
  position: number | null;
  question_type: string;
  prompt_ar: string;
   prompt_en: string | null;
   choices_en: unknown;
  choices_ar: unknown;
  metadata: unknown;
};
type Grade = { correct?: boolean; explanation_ar?: string; explanation_en?:string };
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
 const t = useTranslation(), locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const [unit, setUnit] = useState<{ id: string; title_ar: string; title_en: string } | null>(
    null,
  );
  const [questions, setQuestions] = useState<BossQuestion[]>([]);
  const [contentLanguage, setContentLanguage] = useState<"ar" | "en">("ar");
  const effectiveLang = contentLanguage === "en" || locale === "en" ? "en" : "ar";
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [bossResult, setBossResult] = useState<BossResult | null>(null);
  const [box, setBox] = useState<BoxResult | null>(null);
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
    setBossResult(null);
    setBox(null);
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const user = account.user;
        if (!user) {
          return;
        }
        const enrollment = await supabase
          .from("curriculum_enrollments")
          .select("track_id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (enrollment.error) throw enrollment.error;
        if (!enrollment.data) return;
        const track = await supabase
          .from("curriculum_tracks")
          .select("course_id,content_language")
          .eq("id", enrollment.data.track_id)
          .eq("publication_status", "published")
          .maybeSingle();
        if (track.error || !track.data?.course_id) throw track.error ?? Error("Track unavailable");
        setContentLanguage(track.data.content_language as "ar" | "en");
        const { data: units, error: readError } = await supabase
          .from("units")
          .select("id,title_ar,title_en,metadata")
          .eq("course_id", track.data.course_id)
          .eq("boss_enabled", true)
          .order("position");
        if (!active) return;
        if (readError) throw readError;
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
        setUnit({ id: selected.id, title_ar: selected.title_ar,title_en:selected.title_en });
        const { data: q, error: questionError } = await supabase
          .from("questions")
          .select("id,unit_id,variant_of,position,question_type,prompt_ar,prompt_en,choices_ar,choices_en,metadata")
          .eq("unit_id", selected.id)
          .in("publication_status", ["published_demo", "published"])
          .order("position")
          .limit(20);
        if (!active) return;
        if (questionError) throw questionError;
        setQuestions(
          ((q ?? []) as BossQuestion[])
            .filter((question) => {
              const metadata = question.metadata && typeof question.metadata === "object"
                ? question.metadata as Record<string, unknown>
                : {};
              return question.variant_of === null || metadata.translation_track === true;
            })
            .slice(0, 3),
        );
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

  async function advance() {
    if (!current || !grade) return;
    await run(async (check) => {
      if (!grade.correct) {
        const { data: variant, error: variantError } = await supabase
          .from("questions")
          .select("id,unit_id,variant_of,position,question_type,prompt_ar,prompt_en,choices_ar,choices_en,metadata")
          .eq("variant_of", current.id)
          .in("publication_status", ["published_demo", "published"])
          .limit(1)
          .maybeSingle();
        check();
        if (variantError) throw variantError;
        if (variant) {
          setQuestions((list) =>
            list.map((q, i) => (i === idx ? (variant as BossQuestion) : q)),
          );
          setAnswer("");
          setGrade(null);
          return;
        }
        setAnswer("");
        setGrade(null);
        return;
      }
      if (idx < questions.length - 1) {
        setIdx((x) => x + 1);
        setAnswer("");
        setGrade(null);
        return;
      }

      if (!unit) return;
      const { data, error } = await supabase.rpc("complete_unit_boss", {
        p_unit_id: unit.id,
        p_question_ids: questions.map((q) => q.id),
      });
      check();
      if (error) throw error;
      if (typeof (data as BossResult | null)?.passed !== "boolean")
        throw Error("Missing confirmed boss result");
      setBossResult(data as BossResult);
    }, "");
  }

  async function openBox() {
    if (!bossResult?.reward_box_id) return;
    const boxId = bossResult.reward_box_id;
    await run(async (check) => {
      setError("");
      const { data, error } = await supabase.rpc("claim_reward_box", {
        p_box_id: boxId,
      });
      check();
      if (error) throw error;
      if (!data) throw Error("Missing reward result");
      setBox(data as BoxResult);
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
        title={t("اجمع كل اللي اتعلمته.","Bring your learning together.")}
        description={t("تحدّي الوحدة يربط المهارات في تجربة واحدة. الإنجاز والمكافآت يُسجّلان من نتائجك، دون تكرار المكافأة.","Combine your skills in one challenge. Your results determine your achievement and rewards.")}
        icon="boss"
        route="/boss"
        eyebrow={t("تحدّي الوحدة","Unit challenge")}
        steps={[t("تأكد من استعدادك","Check your readiness"), t("طبّق مهاراتك معًا","Apply your skills together"), t("احتفل بإنجازك","Celebrate your achievement")]}
      />
    );

  if (bossResult)
    return (
      <section className="hero" style={{ textAlign: "center", padding: 46 }}>
        <div className="eyebrow">{t("نتيجة تحدّي الوحدة","Unit challenge result")}</div>
        <h1>
          {bossResult.passed ? t("اجتزت تحدّي الوحدة!","Unit challenge passed!") : t("فرصة جديدة لفهم أعمق","Another chance to build understanding")}
        </h1>
        <p>{t("نتيجتك ","Your result ")}{bossResult.score ?? 0}/3.{" "}
          {bossResult.passed
            ? t("أثبتّ فهمك وقدرتك على تطبيق اللي اتعلمته.","You showed your understanding and applied what you learned.")
            : t("راجع المهارات الضعيفة وارجع بمحاولة أقوى.","Practice the skills that need work, then try again.")}
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
          >{t("افتح صندوق المكافآت","Open reward box")}</button>
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
          <h1 style={{ margin: "6px 0 0" }}>
             {(effectiveLang === "en" ? unit?.title_en : unit?.title_ar) ?? t("تحدّي الوحدة","Unit challenge")}
          </h1>
        </div>
        <span className="pill">{questions.length ? idx + 1 : 0}/3</span>
      </header>
      <section className="hero" style={{ padding: 28, marginBottom: 18 }}>
        <div className="eyebrow">{t("الخطوة الأخيرة في الوحدة","The unit’s final step")}</div>
        <h2 style={{ margin: "8px 0", fontSize: 30 }}>{t("هنا، فهمك هو قوّتك.","Your understanding is your strength.")}</h2>
        <p>{t("تحدّي من ثلاث مراحل: فهم الفكرة، تطبيقها، واستخدامها في موقف جديد. خُد وقتك، وورّينا اللي اتعلمته.","Three stages: understand the idea, apply it, and use it in a new situation. Take your time and show what you learned.")}</p>
      </section>
      <section className="panel" style={{ padding: 28 }}>
        {!current ? (
          <p>{t("لا يوجد تحدّي منشور لهذه الوحدة بعد.","No challenge has been published for this unit yet.")}</p>
        ) : (
          <form onSubmit={submit}>
             <h2 style={{ lineHeight: 1.6 }} dir={effectiveLang === "ar" ? "rtl" : "ltr"}>{(effectiveLang === "en" ? current.prompt_en ?? "English question unavailable." : current.prompt_ar)}</h2>
            {current.question_type === "multiple-choice" ? (
              <div style={{ display: "grid", gap: 10 }}>
                 {opts((effectiveLang === "en" ? current.choices_en : current.choices_ar)).map((x, i) => (
                  <button
                    key={x}
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
                    {String.fromCharCode(65 + i)}. {x}
                  </button>
                ))}
              </div>
            ) : (
              <input
                className="search"
                style={{ width: "100%" }}
                disabled={Boolean(grade) || busy}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                inputMode={
                  current.question_type === "numeric" ? "decimal" : "text"
                }
                aria-label={t("إجابتك على السؤال","Your answer")}
                placeholder={t("الإجابة…","Your answer…")}
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
                <b>{grade.correct ? t("صح","Correct") : t("حاول مرة أخرى","Try again")}</b>
                 <p>{(effectiveLang === "en" ? grade.explanation_en ?? "" : grade.explanation_ar)}</p>
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
                  disabled={!answer || busy}
                  className="btn"
                  style={{
                    background: "var(--accent)",
                    color: "var(--surface)",
                  }}
                >{t("تحقق","Check answer")}</button>
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
                      : t("التالي","Next")
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
