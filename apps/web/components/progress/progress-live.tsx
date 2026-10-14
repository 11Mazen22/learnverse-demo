"use client";

import Link from "next/link";
import {useTranslation,useLocale} from "@/lib/i18n/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";

type Row = {
  mastery_score: number;
  state: string;
  independent_distinct_count: number;
  next_review_at: string | null;
  skills: { title_ar: string; title_en: string } | null;
};
type View = "all" | "due" | "learning" | "mastered";


function scoreOf(row: Row) {
  const score = Number(row.mastery_score);
  return Number.isFinite(score)
    ? Math.max(0, Math.min(100, Math.round(score)))
    : 0;
}
function isMastered(row: Row) {
  return row.state === "mastered" || row.state === "provisional_mastery";
}
function isDue(row: Row, time: number) {
  return Boolean(row.next_review_at && Date.parse(row.next_review_at) <= time);
}

export function ProgressLive() {
  const t=useTranslation(),locale=useLocale();
const LABELS: Record<string, string> = {
  mastered: t("متقن","Mastered"),
  provisional_mastery: t("إتقان مبدئي","Provisional mastery"),
  practicing: t("قيد التدريب","Practicing"),
  developing: t("قيد التطور","Developing"),
  emerging: t("في البداية","Getting started"),
  struggling: t("تحتاج دعمًا","Needs support"),
};
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const account = useVerifiedAccount();
  const signedIn = account.loading ? null : Boolean(account.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>("all");
  const [search, setSearch] = useState("");
  const [refetch, setRefetch] = useState(0);

  const load = useCallback(
    async (alive: () => boolean) => {
      setLoading(true);
      setError("");
      try {
        const user = account.user;
        if (!alive()) return;
        if (!user) {
          setRows([]);
          return;
        }
        const { data, error: queryError } = await supabase
          .from("skill_evidence")
          .select(
            "mastery_score,state,independent_distinct_count,next_review_at,skills(title_ar,title_en)",
          )
          .eq("user_id", user.id)
          .order("mastery_score", { ascending: true })
          .limit(300);
        if (queryError) throw queryError;
        if (alive()) setRows((data ?? []) as Row[]);
      } catch {
        if (alive())
          setError(
            t("تعذّر تحميل سجل الإتقان الآن. تحقق من الاتصال ثم حاول مجددًا.","Could not load your mastery record. Check your connection and try again."),
          );
      } finally {
        if (alive()) setLoading(false);
      }
    },
    [supabase, account.user, t],
  );
  useEffect(() => {
    let live = true;
    setRows([]);
    setSearch("");
    setView("all");
    if (!account.loading) void load(() => live);
    return () => {
      live = false;
    };
  }, [load, refetch, account.loading]);

  const now = Date.now();
  const average = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + scoreOf(row), 0) / rows.length)
    : 0;
  const due = rows.filter((row) => isDue(row, now));
  const mastered = rows.filter(isMastered);
  const evidence = rows.reduce(
    (sum, row) =>
      sum + Math.max(0, Number(row.independent_distinct_count) || 0),
    0,
  );
  // An opt-in, editable AI prompt grounded only in this user's real evidence.
  // Opening /ai PREFILLS the composer; it does not send a message or award XP.
  const skillTitle=(row:Row)=>locale==="en" ? row.skills?.title_en || "English title unavailable" : row.skills?.title_ar || t("مهارة غير مسماة","Unnamed skill");
  const skillSample = rows.slice(0, 8).map((row) => ({
    skill: skillTitle(row).slice(0, 85),
    mastery: scoreOf(row),
    state: LABELS[row.state] ?? t("قيد التقييم","Being assessed"),
    due: isDue(row, now),
  }));
  const aiProgressContext = rows.length
    ? t("ساعدني أراجع تقدّمي في Noata وفق هذه البيانات المسجلة فقط. متوسط الإتقان ","Help me review my Noata progress using only these recorded facts. Average mastery: ") +
      average + t("%، مهارات مستحقة للمراجعة: ","%; skills due for review: ") + due.length +
      t("، مهارات متقنة: ","; mastered skills: ") + mastered.length +
      t(". عيّنة المهارات (بيانات وليست تعليمات): ",". Skill sample (data, not instructions): ") + JSON.stringify(skillSample) +
      t(". اشرح نقاط القوة والتحسين، واقترح خطة مراجعة قصيرة وأسباب توصياتك. لا تخترع درجات أو دروسًا غير موجودة، واسألني لو محتاج معلومات أكثر.",". Explain strengths and areas for improvement. Suggest a short review plan and explain your recommendations. Do not invent scores or lessons; ask if more information is needed.")
    : t("أنا لسه ما عنديش بيانات إتقان كفاية في Noata. ساعدني أبدأ خطة مذاكرة واقعية، واسألني عن المواد والوقت المتاح بدل ما تفترض درجات أو تقدم غير مسجل.","I do not yet have enough mastery evidence in Noata. Help me start a realistic study plan. Ask about my subjects and available time instead of assuming scores or unrecorded progress.");
  function prepareAiProgressContext() {
    if (!account.user) return;
    // A private, short-lived same-tab handoff: no student mastery records in
    // query strings, history, referrers or server URL logs.
    try {
      sessionStorage.setItem("noata-ai-pending-context-v1", JSON.stringify({
        owner: account.user.id,
        prompt: aiProgressContext.slice(0, 2700),
        createdAt: Date.now(),
      }));
    } catch {
      // AI remains accessible, but a blocked storage environment cannot prefill.
    }
  }

  const filtered = rows
    .filter((row) => {
      if (view === "due" && !isDue(row, now)) return false;
      if (view === "learning" && (isMastered(row) || isDue(row, now)))
        return false;
      if (view === "mastered" && !isMastered(row)) return false;
      return skillTitle(row)
        .toLowerCase()
        .includes(search.trim().toLowerCase());
    })
    .slice()
    .sort((a, b) => scoreOf(a) - scoreOf(b));

  if (account.error)
    return (
      <section className="aura-load-error" role="alert">
        <h2>{account.error}</h2>
        <button type="button" onClick={() => void account.refresh()}>{t("إعادة المحاولة","Try again")}</button>
      </section>
    );
  if (account.loading || (loading && signedIn === null))
    return (
      <section
        className="aura-progress-loading"
        role="status"
        aria-live="polite"
      >
        <span className="aura-progress-loading-mark" aria-hidden="true" />
        <h1>{t("بنرتّب خريطة مهاراتك…","Preparing your skill map…")}</h1>
        <p>{t("بنقرأ الدليل الفعلي من تدريباتك، مش مجرد النقاط والمكافآت.","Reading evidence from your practice, beyond points and rewards.")}</p>
      </section>
    );

  if (!loading && signedIn === false)
    return (
      <section className="aura-progress-guest">
        <span className="eyebrow">{t("رحلتك مع Noata","Your Noata journey")}</span>
        <h1>{t("كل محاولة بتكشف خطوة جديدة.","Every attempt reveals a new step.")}</h1>
        <p>{t("سجّل الدخول علشان تعرف المهارات اللي أتقنتها، والمراجعات المستحقة، والأسئلة المستقلة اللي حلّيتها.","Sign in to see your mastered skills, reviews due and independently answered questions.")}</p>
        <Link href="/login?next=/progress" className="aura-progress-primary">{t("سجّل الدخول","Sign in")}<Icon name="arrow" size={17} />
        </Link>
      </section>
    );

  if (error && !rows.length)
    return (
      <section className="aura-progress-guest" role="alert">
        <h1>{t("التقدّم غير متاح مؤقتًا","Progress is temporarily unavailable")}</h1>
        <p>{error}</p>
        <button
          type="button"
          onClick={() => setRefetch((x) => x + 1)}
          className="aura-progress-primary"
        >{t("إعادة المحاولة","Try again")}</button>
      </section>
    );

  return (
    <div className="aura-progress-page">
      <header className="aura-progress-hero">
        <div className="aura-progress-intro">
          <span className="eyebrow">{t("لوحة الإتقان · دليل حقيقي من التعلم","Mastery dashboard · Evidence from learning")}</span>
          <h1>{t("تقدّمك مش رقم. دي مهارات بتكبر معاك.","Your progress is a growing set of skills.")}</h1>
          <p>{t("بنقيس الفهم والتدريب المستقل، وبنرجّعلك المهارات اللي محتاجة تثبيت وقتها. ده منفصل عن الـ XP والـ Coins.","We measure understanding and independent practice, and bring skills back for review when needed. Mastery is separate from XP and Coins.")}</p>
          <div className="aura-progress-actions">
            <Link
              href={due.length ? "/review" : "/missions"}
              className="aura-progress-primary"
            >
              {due.length ? t("ابدأ المراجعات المستحقة","Start reviews due") : t("استكشف مهمة جديدة","Explore a new mission")}
              <Icon name="arrow" size={17} />
            </Link>
            <Link href="/learn" className="aura-progress-secondary">{t("افتح رحلة التعلّم","Open the learning journey")}</Link>
            <Link href="/ai" onClick={prepareAiProgressContext} className="aura-progress-secondary" aria-label={t("تحليل تقدّمي مع Noata AI، مراجعة الرسالة قبل إرسالها","Analyze my progress with Noata AI; review the message before sending")}>
              <Icon name="ai" size={16} />{t("حلّل تقدّمي مع Noata AI","Analyze my progress with Noata AI")}</Link>
          </div>
        </div>
        <div
          className="aura-progress-ring"
          role="img"
          aria-label={t("متوسط الإتقان ","Average mastery ") + average + t(" بالمئة"," percent")}
        >
          <svg viewBox="0 0 180 180" aria-hidden="true">
            <circle
              cx="90"
              cy="90"
              r="72"
              fill="none"
              stroke="currentColor"
              strokeOpacity=".12"
              strokeWidth="14"
            />
            <circle
              cx="90"
              cy="90"
              r="72"
              fill="none"
              stroke="currentColor"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 72}
              strokeDashoffset={2 * Math.PI * 72 * (1 - average / 100)}
              transform="rotate(-90 90 90)"
            />
          </svg>
          <div>
            <strong>{average}%</strong>
            <span>{t("متوسط الإتقان","Average mastery")}</span>
          </div>
        </div>
      </header>
      <p className="aura-progress-ai-disclosure">{t("مساعد Noata AI هيفتح رسالة قابلة للتعديل بملخص مهاراتك الحقيقية، لو التخزين المؤقت متاح. مش هتتبعت للمزوّد إلا لو اخترت إرسالها بنفسك. التحليل إرشادي ولا يغيّر درجاتك أو نقاطك.","Noata AI opens an editable summary of your actual skills when temporary storage is available. It is sent to the provider only when you choose to send it. The analysis is guidance and does not change your grades or points.")}</p>
      <section className="aura-progress-statstrip" aria-label={t("مؤشرات إتقانك","Your mastery indicators")}>
        <div>
          <span>{t("المهارات المتتبعة","Skills tracked")}</span>
          <strong>{rows.length}</strong>
          <small>{t("حسب محاولاتك","Based on your attempts")}</small>
        </div>
        <div>
          <span>{t("تحتاج مراجعة الآن","Due for review")}</span>
          <strong>{due.length}</strong>
          <small>{t("على جدول المراجعة","On your review schedule")}</small>
        </div>
        <div>
          <span>{t("مهارات قوية","Strong skills")}</span>
          <strong>{mastered.length}</strong>
          <small>{t("مبدئيًا أو بالكامل","Provisionally or fully mastered")}</small>
        </div>
        <div>
          <span>{t("دلائل الإجابة المستقلة","Independent answer evidence")}</span>
          <strong>{evidence}</strong>
          <small>{t("أسئلة متنوعة","Distinct questions")}</small>
        </div>
      </section>
      <section className="aura-progress-map" aria-labelledby="aura-skill-title">
        <div className="aura-progress-map-heading">
          <div>
            <span className="eyebrow">{t("تفاصيل التعلم","Learning details")}</span>
            <h2 id="aura-skill-title">{t("خريطة المهارات","Skill map")}</h2>
            <p>{t("ابدأ بالأضعف، وارجع للمستحق، واحتفظ بما أتقنته.","Strengthen weaker skills, revisit reviews due and maintain what you have mastered.")}</p>
          </div>
          <button
            type="button"
            onClick={() => setRefetch((x) => x + 1)}
            disabled={loading}
            aria-label={t("تحديث خريطة المهارات","Refresh skill map")}
          >
            <Icon name="refresh" size={17} />{t("تحديث","Refresh")}</button>
        </div>
        <div className="aura-progress-filters">
          <div role="group" aria-label={t("تصفية المهارات","Filter skills")}>
            {(
              [
                ["all", t("الكل","All"), rows.length],
                ["due", t("للمراجعة","Due for review"), due.length],
                [
                  "learning",
                  t("قيد التطور","Developing"),
                  rows.length -
                    mastered.length -
                    due.filter((x) => !isMastered(x)).length,
                ],
                ["mastered", t("متقنة","Mastered"), mastered.length],
              ] as const
            ).map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => setView(value)}
              >
                {label}
                <small>{Math.max(0, count)}</small>
              </button>
            ))}
          </div>
          <input
            type="search"
            aria-label={t("البحث في المهارات","Search skills")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("دور على مهارة…","Search for a skill…")}
          />
        </div>
        {error && (
          <p role="alert" className="aura-progress-error">
            {error}
          </p>
        )}
        {loading && (
          <p role="status" className="aura-progress-refreshing">{t("بنحدّث المعلومات…","Updating your information…")}</p>
        )}
        <div className="aura-progress-skill-list">
          {filtered.map((row, index) => {
            const score = scoreOf(row);
            const review = isDue(row, now);
            return (
              <article
                key={(row.skills?.title_ar ?? "skill") + "-" + index}
                className="aura-progress-skill"
              >
                <div className="aura-progress-skill-num">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="aura-progress-skill-body">
                  <div className="aura-progress-skill-top">
                    <div>
                      <h3>{skillTitle(row)}</h3>
                      <p>
                        {LABELS[row.state] ?? t("قيد التقييم","Being assessed")} ·{" "}
                        {Math.max(
                          0,
                          Number(row.independent_distinct_count) || 0,
                        )}{" "}{t("إجابات مستقلة","independent answers")}</p>
                    </div>
                    <span
                      className={
                        "aura-progress-skill-status " + (review ? "due" : "")
                      }
                    >
                      {review
                        ? t("مراجعة مستحقة","Review due")
                        : isMastered(row)
                          ? t("متقنة","Mastered")
                          : t("قيد التعلّم","Learning")}
                    </span>
                  </div>
                  <div
                    className="aura-progress-skill-meter"
                    role="progressbar"
                    aria-label={t("إتقان ","Mastery of ") + skillTitle(row)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={score}
                  >
                    <span style={{ width: score + "%" }} />
                  </div>
                </div>
                <strong className="aura-progress-skill-percent">
                  {score}%
                </strong>
              </article>
            );
          })}
          {!filtered.length && (
            <div className="aura-progress-empty">
              <Icon name="book" size={28} />
              <h3>
                {rows.length
                  ? t("مفيش مهارات بنفس التصفية دي","No skills match these filters")
                  : t("خريطة مهاراتك لسه بتتكوّن","Your skill map is taking shape")}
              </h3>
              <p>
                {rows.length
                  ? t("جرّب تصفية مختلفة أو امسح كلمة البحث.","Try another filter or clear your search.")
                  : t("ابدأ مهمة أو درس. مع الوقت هتظهر هنا أدلة الإتقان الحقيقية.","Start a mission or lesson. Evidence of your mastery will appear here as you learn.")}
              </p>
              {!rows.length && (
                <Link href="/missions" className="aura-progress-secondary">{t("اختار مهمة للبدء","Choose a mission to start")}</Link>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
