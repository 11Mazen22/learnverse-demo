"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";

import { useUnsavedWork } from "@/lib/use-unsaved-work";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ModuleWelcome } from "@/components/ui/module-welcome";
import {
  boundedRead,
  useVerifiedAccount,
} from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";

type Assignment = {
  id: string;
  title: string;
  instructions: string;
  due_at: string | null;
  published_at: string | null;
  classes: { name: string } | null;
};
type Submission = {
  assignment_id: string;
  submitted_at: string | null;
  score: number | null;
  metadata: unknown;
};
type Item = {
  assignment_id: string;
  position: number;
  question_id: string;
  questions: {
    id: string;
    question_type: string;
    prompt_ar: string;
   prompt_en: string | null;
   choices_en: unknown;
    choices_ar: unknown;
  } | null;
};
type Grade = { correct?: boolean; explanation_ar?: string; explanation_en?:string };

const choices = (value: unknown) =>
  Array.isArray(value) ? value.map(String) : [];

export function AssignmentsLive() {
 const t=useTranslation(),locale=useLocale();
  const supabase = useMemo(() => createClient(), []);
  const account = useVerifiedAccount();
  const signedIn = Boolean(account.user),
    userId = account.user?.id ?? "";
  const sequence = useRef(0),
    lock = useRef(false),
    attemptKeys = useRef(new Map<string, string>());
  const progress = useRef(
    new Map<
      string,
      {
        fingerprint: string;
        idx: number;
        answer: string;
        grade: Grade | null;
        results: Record<string, boolean>;
      }
    >(),
  );
  const [itemLoading, setItemLoading] = useState(false);
  const [rows, setRows] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!account.user) {
      setLoading(false);
      return;
    }
    const token = account.revision.current;
    setLoading(true);
    setError("");
    try {
      const [assignments, submissions] = await boundedRead(
        Promise.all([
          supabase
            .from("assignments")
            .select("id,title,instructions,due_at,published_at,classes(name)")
            .not("published_at", "is", null)
            .order("due_at", { ascending: true }),
          supabase
            .from("assignment_submissions")
            .select("assignment_id,submitted_at,score,metadata")
            .eq("student_id", account.user.id),
        ]),
      );
      if (token !== account.revision.current) return;
      if (assignments.error || submissions.error)
        throw assignments.error ?? submissions.error;
      setRows((assignments.data ?? []) as Assignment[]);
      setSubmissions((submissions.data ?? []) as Submission[]);
    } catch {
      if (token === account.revision.current)
        setError(
          t("تعذّر تحميل الواجبات وحالة التسليم. أعد المحاولة عند عودة الاتصال.","Could not load assignments and submissions. Try again when your connection returns."),
        );
    } finally {
      if (token === account.revision.current) setLoading(false);
    }
  }
  useEffect(() => {
    ++sequence.current;
    progress.current.clear();
    attemptKeys.current.clear();
    lock.current = false;
    setRows([]);
    setSubmissions([]);
    setSelected(null);
    setItems([]);
    setBusy(false);
    setError("");
    if (!account.loading) void load();
    return () => {
      ++sequence.current;
    };
  }, [account.user, account.loading]);
  function saveProgress() {
    if (selected)
      progress.current.set(selected, {
        fingerprint: items.map((i) => i.question_id).join(","),
        idx,
        answer,
        grade,
        results,
      });
  }
  function closeAssignment() {
    if (lock.current) return;
    saveProgress();
    ++sequence.current;
    setSelected(null);
    setError("");
  }
  async function openAssignment(id: string) {
    if (lock.current) return;
    saveProgress();
    const seq = ++sequence.current,
      token = account.revision.current;
    setSelected(id);
    setItems([]);
    setItemLoading(true);
    setIdx(0);
    setAnswer("");
    setGrade(null);
    setResults({});
    setError("");
    try {
      const result = await boundedRead(
        supabase
          .from("assignment_items")
          .select(
            "assignment_id,position,question_id,questions(id,question_type,prompt_ar,prompt_en,choices_ar,choices_en)",
          )
          .eq("assignment_id", id)
          .order("position"),
      );
      if (seq !== sequence.current || token !== account.revision.current)
        return;
      if (result.error) throw result.error;
      const next = (result.data ?? []) as Item[];
      setItems(next);
      const saved = progress.current.get(id);
      if (
        saved &&
        saved.fingerprint === next.map((i) => i.question_id).join(",")
      ) {
        setIdx(saved.idx);
        setAnswer(saved.answer);
        setGrade(saved.grade);
        setResults(saved.results);
      }
    } catch {
      if (seq === sequence.current && token === account.revision.current)
        setError(
          t("تعذّر تحميل أسئلة هذا الواجب. أعد المحاولة؛ لن نعرض أسئلة واجب آخر.","Could not load this assignment’s questions. Please try again."),
        );
    } finally {
      if (seq === sequence.current && token === account.revision.current)
        setItemLoading(false);
    }
  }

  const current = items[idx]?.questions;
  const selectedAssignment = rows.find((x) => x.id === selected);
  const existing = submissions.find((x) => x.assignment_id === selected);

  useUnsavedWork(
    Boolean(account.user && selected && answer && !existing?.submitted_at),
  );
  async function check(e: FormEvent) {
    e.preventDefault();
    if (!current || !answer.trim() || lock.current) return;
    const token = account.revision.current,
      seq = sequence.current;
    lock.current = true;
    setBusy(true);
    setError("");
    const fingerprint = JSON.stringify([selected, current.id, answer]);
    if (!attemptKeys.current.has(fingerprint))
      attemptKeys.current.set(fingerprint, crypto.randomUUID());
    try {
      const { data, error } = await supabase.rpc("submit_attempt", {
        p_question_id: current.id,
        p_response: { value: answer },
        p_assisted: false,
        p_idempotency_key: attemptKeys.current.get(fingerprint)!,
        p_practice_repeat: false,
      });
      if (seq !== sequence.current || token !== account.revision.current)
        return;
      if (error) throw error;
      const row = data as Grade | null;
      if (typeof row?.correct !== "boolean")
        throw Error("Missing confirmed grade");
      setGrade(row);
      setResults((r) => ({ ...r, [current.id]: row.correct! }));
    } catch {
      if (seq === sequence.current && token === account.revision.current)
        setError(
          t("لم يتأكد حفظ الإجابة. أعد المحاولة بنفس الإجابة للتحقق من العملية دون تكرارها.","Could not confirm your answer was saved. Retry the same answer to check its status."),
        );
    } finally {
      if (seq === sequence.current && token === account.revision.current) {
        lock.current = false;
        setBusy(false);
      }
    }
  }
  async function next() {
    if (lock.current || !grade) return;
    if (idx < items.length - 1) {
      setIdx((x) => x + 1);
      setAnswer("");
      setGrade(null);
      return;
    }
    if (!selected || !userId) return;
    const token = account.revision.current,
      seq = sequence.current;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      // The unique (assignment_id,student_id) constraint makes retries safe.
      // Insert only: a student cannot erase a teacher's grade by upserting.
      const result = await supabase
        .from("assignment_submissions")
        .insert({
          assignment_id: selected,
          student_id: userId,
          submitted_at: new Date().toISOString(),
          metadata: {
            question_count: items.length,
            correct_count: Object.values(results).filter(Boolean).length,
            client_completed: true,
          },
          score: null,
        })
        .select("assignment_id,submitted_at,score,metadata")
        .single();
      if (seq !== sequence.current || token !== account.revision.current)
        return;
      let saved = result.data;
      if (result.error?.code === "23505") {
        const confirmed = await boundedRead(
          supabase
            .from("assignment_submissions")
            .select("assignment_id,submitted_at,score,metadata")
            .eq("assignment_id", selected)
            .eq("student_id", userId)
            .single(),
        );
        if (seq !== sequence.current || token !== account.revision.current)
          return;
        if (confirmed.error) throw confirmed.error;
        saved = confirmed.data;
      } else if (result.error) throw result.error;
      if (!saved?.submitted_at) throw Error("Submission not confirmed");
      setSubmissions((previous) => [
        ...previous.filter((r) => r.assignment_id !== selected),
        saved as Submission,
      ]);
      progress.current.delete(selected);
    } catch {
      if (seq === sequence.current && token === account.revision.current)
        setError(
          t("لم يتأكد تسليم الواجب. أعد المحاولة للتحقق من التسليم الموجود دون تغيير تقييم المدرّس.","Could not confirm the submission. Retry to check its status."),
        );
    } finally {
      if (seq === sequence.current && token === account.revision.current) {
        lock.current = false;
        setBusy(false);
      }
    }
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
        <h2>{t("بنرتّب واجباتك…","Loading your assignments…")}</h2>
      </section>
    );
  if (error && !rows.length)
    return (
      <section className="aura-load-error" role="alert">
        <strong>{error}</strong>
        <button
          type="button"
          onClick={() => {
            setError("");
            void load();
          }}
        >{t("إعادة المحاولة","Try again")}</button>
      </section>
    );
  if (signedIn === false)
    return (
      <ModuleWelcome
        title={t("واجباتك، بكل وضوح.","Your assignments, clearly organized.")}
        description={t("اعرف المطلوب وموعده، أرسل إجاباتك وتابع التقييم؛ تظهر لك الواجبات المسموح بها لحسابك فقط.","See what is due, submit your answers, and follow your feedback.")}
        icon="check"
        route="/assignments"
        eyebrow={t("من صفّك إلى مساحتك","From your class to your space")}
        steps={[
          t("اقرأ التعليمات والموعد","Read instructions and due dates"),
          t("أجب وسلّم عملك","Answer and submit your work"),
          t("راجع تقييم المدرّس","Review your teacher’s feedback"),
        ]}
      />
    );

  if (selected) {
    if (existing?.submitted_at)
      return (
        <section className="panel" style={{ padding: 34, textAlign: "center" }}>
          <div className="quest-icon" style={{ margin: "0 auto" }}>
            ✓
          </div>
          <h1>{t("تم التسليم","Submitted")}</h1>
          <p style={{ color: "var(--muted)" }}>{selectedAssignment?.title}</p>
          <p>
            {existing.score == null
              ? t("في انتظار تقييم المعلم","Awaiting teacher feedback")
              : t("النتيجة: ","Score: ") + existing.score + "%"}
          </p>
          <button
            className="btn"
            disabled={busy}
            onClick={closeAssignment}
            style={{ background: "var(--accent)", color: "var(--surface)" }}
          >{t("رجوع للواجبات","Back to assignments")}</button>
        </section>
      );

    return (
      <>
        <header className="topbar" style={{ marginBottom: 18 }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--accent)" }}>{t("من السؤال إلى التسليم","From questions to submission")}</div>
            <h1 style={{ margin: "6px 0 0" }}>{selectedAssignment?.title}</h1>
          </div>
          <span className="pill">
            {idx + 1}/{items.length || 1}
          </span>
        </header>
        <section className="panel" style={{ padding: 28 }}>
          {!current ? (
            <div role={error ? "alert" : "status"}>
              <p>
                {itemLoading
                  ? t("بنحمّل أسئلة الواجب…","Loading assignment questions…")
                  : error ||
                    t("لا توجد أسئلة متاحة لهذا الواجب. تواصل مع المدرّس.","No questions are available for this assignment. Contact your teacher.")}
              </p>
              {error && (
                <button
                  type="button"
                  onClick={() => void openAssignment(selected)}
                >{t("إعادة المحاولة","Try again")}</button>
              )}
              <button type="button" onClick={closeAssignment}>{t("رجوع للواجبات","Back to assignments")}</button>
            </div>
          ) : (
            <form onSubmit={check}>
              <h2 style={{ lineHeight: 1.6 }}>{(locale==="en" ? current.prompt_en ?? "English question unavailable." : current.prompt_ar)}</h2>
              {current.question_type === "multiple-choice" ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {choices((locale==="en" ? current.choices_en : current.choices_ar)).map((x, i) => (
                    <button
                      type="button"
                      disabled={Boolean(grade) || busy}
                      key={x}
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
                  value={answer}
                  disabled={Boolean(grade) || busy}
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
                  <b>{grade.correct ? t("صح","Correct") : t("راجع الفكرة","Review the idea")}</b>
                  <p>{(locale==="en" ? grade.explanation_en ?? "" : grade.explanation_ar)}</p>
                </div>
              )}
              {error && (
                <p role="alert" style={{ color: "var(--danger)" }}>
                  {error}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  marginTop: 18,
                }}
              >
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={closeAssignment}
                  style={{
                    background: "var(--accent-soft)",
                    color: "var(--accent)",
                  }}
                >{t("خروج","Exit")}</button>
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
                    disabled={busy}
                    onClick={() => void next()}
                    className="btn"
                    style={{
                      background: "var(--accent)",
                      color: "var(--surface)",
                    }}
                  >
                    {idx === items.length - 1 ? t("تسليم الواجب","Submit assignment") : t("التالي","Next")}
                  </button>
                )}
              </div>
            </form>
          )}
        </section>
      </>
    );
  }

  return (
    <>
      <header className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>{t("واجبات صفّك","Class assignments")}</div>
          <h1 style={{ margin: "6px 0 0" }}>{t("واجباتك","Your assignments")}</h1>
        </div>
        <span className="pill">{rows.length}{t("واجب متاح","Available assignment")}</span>
      </header>
      <section className="quest-list">
        {rows.map((row) => {
          const sub = submissions.find((x) => x.assignment_id === row.id);
          const overdue =
            row.due_at &&
            new Date(row.due_at) < new Date() &&
            !sub?.submitted_at;
          return (
            <article className="panel" key={row.id} style={{ padding: 18 }}>
              <div className="panel-head">
                <div>
                  <h2>{row.title}</h2>
                  <p style={{ color: "var(--muted)", margin: "5px 0" }}>
                    {row.classes?.name ?? t("الصفّ","Class")} · {row.instructions}
                  </p>
                </div>
                <span className="pill">
                  {sub?.submitted_at
                    ? sub.score == null
                      ? t("تم التسليم","Submitted")
                      : t("الدرجة: ","Grade: ") + sub.score + "%"
                    : overdue
                      ? t("فات الموعد","Overdue")
                      : t("متاح","Available")}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <small style={{ color: "var(--muted)" }}>
                  {row.due_at
                    ? t("الموعد: ","Due: ") + new Date(row.due_at).toLocaleString(locale==="en"?"en":"ar-EG")
                    : t("بدون موعد محدد","No due date")}
                </small>
                <button
                  className="btn"
                  onClick={() => void openAssignment(row.id)}
                  style={{
                    background: "var(--accent)",
                    color: "var(--surface)",
                  }}
                >
                  {sub?.submitted_at ? t("عرض التسليم","View submission") : t("ابدأ الواجب","Start assignment")}
                </button>
              </div>
            </article>
          );
        })}
        {!rows.length && (
          <section
            className="panel"
            style={{ padding: 30, textAlign: "center", color: "var(--muted)" }}
          >{t("مفيش واجبات منشورة ليك حاليًا.","No assignments are currently published for you.")}</section>
        )}
      </section>
    </>
  );
}
