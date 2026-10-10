"use client";

import { useUnsavedWork } from "@/lib/use-unsaved-work";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { boundedRead } from "@/lib/supabase/use-verified-account";
import { useConfirmedMutation } from "@/lib/supabase/use-confirmed-mutation";
import { createClient } from "@/lib/supabase/client";

type ClassRow = {
  id: string;
  name: string;
  grade_label: string;
  academic_year: string;
};
type Assignment = {
  id: string;
  class_id: string;
  title: string;
  instructions: string;
  due_at: string | null;
  published_at: string | null;
  created_at: string;
};
type Question = { id: string; prompt_ar: string };
type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_at: string | null;
  score: number | null;
};
type Profile = { id: string; display_name: string };

export function TeacherLive() {
  const supabase = useMemo(() => createClient(), []);
  const { account, busy, status, setStatus, run } = useConfirmedMutation();
  const userId = account.user?.id ?? "";
  const [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState("");
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [classId, setClassId] = useState("");
  const [due, setDue] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [publishNow, setPublishNow] = useState(true);
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [view, setView] = useState("overview");

  useUnsavedWork(
    Boolean(
      account.user &&
        (title || instructions || due || selectedQuestions.length),
    ),
  );
  async function load() {
    if (!account.user) {
      setLoading(false);
      return false;
    }
    const token = account.revision.current;
    setLoading(true);
    setLoadError("");
    try {
      const results = await boundedRead(
        Promise.all([
          supabase
            .from("classes")
            .select("id,name,grade_label,academic_year")
            .eq("active", true)
            .order("name"),
          supabase
            .from("assignments")
            .select(
              "id,class_id,title,instructions,due_at,published_at,created_at",
            )
            .order("created_at", { ascending: false }),
          supabase
            .from("questions")
            .select("id,prompt_ar")
            .in("publication_status", ["published_demo", "published"])
            .eq("review_status", "approved")
            .order("created_at"),
          supabase
            .from("assignment_submissions")
            .select("id,assignment_id,student_id,submitted_at,score")
            .order("submitted_at", { ascending: false }),
          supabase.from("profiles").select("id,display_name"),
        ]),
      );
      if (token !== account.revision.current) return false;
      const failed = results.find((r) => r.error);
      if (failed) throw failed.error;
      const [c, a, q, s, p] = results;
      const classRows = (c.data ?? []) as ClassRow[];
      setClasses(classRows);
      if (!classId && classRows[0]) setClassId(classRows[0].id);
      setAssignments((a.data ?? []) as Assignment[]);
      setQuestions((q.data ?? []) as Question[]);
      setSubmissions((s.data ?? []) as Submission[]);
      setProfiles(
        new Map(
          ((p.data ?? []) as Profile[]).map((x) => [
            x.id,
            x.display_name || "طالب",
          ]),
        ),
      );
      return true;
    } catch {
      if (token === account.revision.current)
        setLoadError(
          "تعذّر تحميل بيانات الصفوف والواجبات. الأرقام غير متاحة حتى يعود الاتصال.",
        );
      return false;
    } finally {
      if (token === account.revision.current) setLoading(false);
    }
  }
  useEffect(() => {
    if (!account.loading) void load();
  }, [account.user, account.loading]);
  async function refreshMessage(check: () => void, message: string) {
    const refreshed = await load();
    check();
    return (
      message +
      (refreshed ? "" : " — تعذّر تحديث القائمة؛ حدّثها قبل إنشاء نسخة أخرى.")
    );
  }
  async function createAssignment(e: FormEvent) {
    e.preventDefault();
    if (!userId || !classId || !title.trim() || !selectedQuestions.length)
      return;
    if (due && !Number.isFinite(new Date(due).getTime())) {
      setStatus("موعد التسليم غير صالح.");
      return;
    }
    await run(async (check) => {
      const created = await supabase
        .from("assignments")
        .insert({
          class_id: classId,
          created_by: userId,
          title: title.trim(),
          instructions: instructions.trim(),
          due_at: due ? new Date(due).toISOString() : null,
          published_at: null,
        })
        .select("id")
        .single();
      check();
      if (created.error || !created.data)
        throw created.error ?? Error("No saved assignment");
      const id = created.data.id;
      const inserted = await supabase
        .from("assignment_items")
        .insert(
          selectedQuestions.map((question_id, i) => ({
            assignment_id: id,
            position: i + 1,
            question_id,
          })),
        )
        .select("question_id");
      check();
      if (
        inserted.error ||
        inserted.data?.length !== selectedQuestions.length
      ) {
        const removed = await supabase
          .from("assignments")
          .delete()
          .eq("id", id)
          .select("id");
        check();
        await load();
        check();
        throw Error(
          removed.error || removed.data?.length !== 1
            ? "تعذّر حفظ أسئلة الواجب وتنظيف المسودة. راجع قائمة الواجبات قبل إنشاء واجب جديد."
            : "تعذّر حفظ أسئلة الواجب. أُزيلت المسودة غير المكتملة؛ حاول مرة أخرى.",
        );
      }
      let message = "تم حفظ الواجب كمسودة ✓";
      if (publishNow) {
        const published = await supabase
          .from("assignments")
          .update({ published_at: new Date().toISOString() })
          .eq("id", id)
          .select("id")
          .single();
        check();
        message = published.error
          ? "تم حفظ الواجب كمسودة؛ لم يتأكد نشره. راجع القائمة قبل إعادة النشر."
          : "تم نشر الواجب ✓";
      }
      setTitle("");
      setInstructions("");
      setDue("");
      setSelectedQuestions([]);
      setPublishNow(true);
      return refreshMessage(check, message);
    });
  }
  async function publish(id: string) {
    await run(async (check) => {
      const result = await supabase
        .from("assignments")
        .update({ published_at: new Date().toISOString() })
        .eq("id", id)
        .is("published_at", null)
        .select("id")
        .single();
      check();
      if (result.error) throw result.error;
      return refreshMessage(check, "تم نشر الواجب ✓");
    });
  }
  async function gradeSubmission(row: Submission) {
    const raw = grades[row.id] ?? (row.score == null ? "" : String(row.score)),
      score = Number(raw);
    if (!raw.trim() || !Number.isFinite(score) || score < 0 || score > 100) {
      setStatus("اكتب درجة بين ٠ و١٠٠.");
      return;
    }
    await run(async (check) => {
      const result = await supabase
        .from("assignment_submissions")
        .update({ score })
        .eq("id", row.id)
        .select("id,score")
        .single();
      check();
      if (result.error || result.data?.score !== score)
        throw result.error ?? Error("Grade not confirmed");
      return refreshMessage(check, "تم حفظ التقييم ✓");
    });
  }

  const membershipCount = new Set(submissions.map((x) => x.student_id)).size;

  if (account.error || loadError)
    return (
      <section className="aura-load-error" role="alert">
        <h2>{account.error || loadError}</h2>
        <button
          type="button"
          onClick={() => {
            if (account.error) void account.refresh();
            else void load();
          }}
        >
          إعادة المحاولة
        </button>
      </section>
    );
  if (account.loading || loading)
    return (
      <section className="aura-loading-state" role="status">
        <span />
        <h2>بنجهّز مساحة المعلّم…</h2>
      </section>
    );
  return (
    <>
      <header className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>
            صفوفك وخطوات طلابك
          </div>
          <h1 style={{ margin: "6px 0 0" }}>كل طالب له خطوة جاية.</h1>
        </div>
        <span className="pill">مساحة المعلّم</span>
      </header>

      {status && (
        <p role="status" className="aura-staff-status">
          {status}
        </p>
      )}
      <section className="grid-4">
        <article className="metric-card">
          <span>الصفوف</span>
          <strong>{classes.length}</strong>
          <small>المتاحة لك</small>
        </article>
        <article className="metric-card">
          <span>طلاب سلّموا واجبات</span>
          <strong>{membershipCount}</strong>
          <small>حسب التسليمات الظاهرة</small>
        </article>
        <article className="metric-card">
          <span>الواجبات</span>
          <strong>{assignments.length}</strong>
          <small>
            {assignments.filter((x) => x.published_at).length} منشور
          </small>
        </article>
        <article className="metric-card">
          <span>التسليمات</span>
          <strong>{submissions.length}</strong>
          <small>
            {submissions.filter((x) => x.score == null).length} بانتظار التقييم
          </small>
        </article>
      </section>

      <nav className="filter-bar" aria-label="أقسام مساحة المعلم">
        {[
          ["overview", "نظرة عامة"],
          ["create", "واجب جديد"],
          ["assignments", "الواجبات"],
          ["grading", "التصحيح"],
        ].map(([value, label]) => (
          <button
            key={value}
            className="filter-chip"
            aria-pressed={view === value}
            onClick={() => setView(value)}
          >
            {label}
          </button>
        ))}
      </nav>
      {(view === "overview" || view === "create") && (
        <section className="content-grid">
          <form className="panel" onSubmit={createAssignment}>
            <div className="panel-head">
              <h2>إنشاء واجب</h2>
              <span className="pill">أسئلة معتمدة فقط</span>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <label>
                <small>الصفّ</small>
                <select
                  className="model-select"
                  style={{ width: "100%", marginTop: 6 }}
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  {classes.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name} · {c.grade_label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <small>العنوان</small>
                <input
                  className="search"
                  style={{ width: "100%", marginTop: 6 }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="عنوان الواجب"
                />
              </label>
              <label>
                <small>التعليمات</small>
                <textarea
                  className="search"
                  style={{ width: "100%", minHeight: 90, paddingTop: 12 }}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="اكتب تعليمات الواجب…"
                />
              </label>
              <label>
                <small>موعد التسليم</small>
                <input
                  className="search"
                  style={{ width: "100%", marginTop: 6 }}
                  type="datetime-local"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                />
              </label>
              <div>
                <small>الأسئلة · اختر سؤالًا واحدًا على الأقل</small>
                <div
                  style={{
                    display: "grid",
                    gap: 7,
                    maxHeight: 240,
                    overflow: "auto",
                    marginTop: 8,
                  }}
                >
                  {questions.map((q) => (
                    <label
                      key={q.id}
                      style={{
                        display: "flex",
                        gap: 9,
                        alignItems: "flex-start",
                        padding: 10,
                        border: "1px solid var(--line)",
                        borderRadius: 12,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(q.id)}
                        onChange={(e) =>
                          setSelectedQuestions((list) =>
                            e.target.checked
                              ? [...list, q.id]
                              : list.filter((id) => id !== q.id),
                          )
                        }
                      />
                      <span style={{ fontSize: 12, lineHeight: 1.6 }}>
                        {q.prompt_ar}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <label
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  <b>النشر الآن</b>
                  <small style={{ display: "block", color: "var(--muted)" }}>
                    يُرسل إشعار النشر إلى طلاب الصفّ بعد تأكيد النشر.
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={publishNow}
                  onChange={(e) => setPublishNow(e.target.checked)}
                />
              </label>
              <button
                disabled={
                  busy ||
                  !classes.length ||
                  !title.trim() ||
                  !selectedQuestions.length
                }
                className="btn"
                style={{ background: "var(--accent)", color: "var(--surface)" }}
              >
                إنشاء واجب
              </button>
              {status && (
                <small
                  style={{
                    color: status.includes("✓")
                      ? "var(--success)"
                      : "var(--muted)",
                  }}
                >
                  {status}
                </small>
              )}
            </div>
          </form>

          <aside className="panel">
            <div className="panel-head">
              <h2>صفوفك</h2>
              <span className="pill">{classes.length}</span>
            </div>
            <div className="quest-list">
              {classes.map((c) => (
                <div className="quest" key={c.id}>
                  <div className="quest-icon">◫</div>
                  <div>
                    <h3>{c.name}</h3>
                    <p>
                      {c.grade_label} · {c.academic_year}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {!classes.length && (
              <p style={{ color: "var(--muted)" }}>
                لم تُخصص صفوف لهذا الحساب بعد.
              </p>
            )}
          </aside>
        </section>
      )}

      {(view === "overview" || view === "assignments") && (
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <h2>الواجبات</h2>
            <span className="pill">المسودات والمنشور</span>
          </div>
          <div className="quest-list">
            {assignments.map((a) => (
              <div className="quest" key={a.id}>
                <div className="quest-icon">{a.published_at ? "✓" : "D"}</div>
                <div>
                  <h3>{a.title}</h3>
                  <p>
                    {classes.find((c) => c.id === a.class_id)?.name ?? "الصفّ"}{" "}
                    ·{" "}
                    {a.due_at
                      ? "الموعد: " + new Date(a.due_at).toLocaleString("ar-EG")
                      : "بدون موعد محدد"}
                  </p>
                </div>
                {!a.published_at ? (
                  <button
                    className="btn"
                    disabled={busy}
                    onClick={() => void publish(a.id)}
                    style={{
                      background: "var(--accent)",
                      color: "var(--surface)",
                    }}
                  >
                    نشر
                  </button>
                ) : (
                  <span className="pill">منشور</span>
                )}
              </div>
            ))}
            {!assignments.length && (
              <div style={{ padding: 18, color: "var(--muted)" }}>
                لا توجد واجبات بعد.
              </div>
            )}
          </div>
        </section>
      )}

      {(view === "overview" || view === "grading") && (
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <h2>التسليمات والتقييم</h2>
            <span className="pill">
              {submissions.filter((x) => x.score == null).length} بانتظار
              التقييم
            </span>
          </div>
          <div className="quest-list">
            {submissions.map((s) => {
              const assignment = assignments.find(
                (a) => a.id === s.assignment_id,
              );
              return (
                <div className="quest" key={s.id}>
                  <div className="quest-icon">
                    {s.score == null ? "…" : Math.round(s.score)}
                  </div>
                  <div>
                    <h3>{profiles.get(s.student_id) ?? "طالب"}</h3>
                    <p>
                      {assignment?.title ?? "واجب"} ·{" "}
                      {s.submitted_at
                        ? new Date(s.submitted_at).toLocaleString("ar-EG")
                        : "لم يُسلّم بعد"}
                    </p>
                  </div>
                  <div
                    style={{ display: "flex", gap: 7, alignItems: "center" }}
                  >
                    <input
                      aria-label={
                        "تقييم واجب الطالب " +
                        (profiles.get(s.student_id) ?? "طالب")
                      }
                      value={
                        grades[s.id] ?? (s.score == null ? "" : String(s.score))
                      }
                      onChange={(e) =>
                        setGrades((g) => ({ ...g, [s.id]: e.target.value }))
                      }
                      inputMode="decimal"
                      style={{
                        width: 70,
                        height: 40,
                        border: "1px solid var(--line)",
                        borderRadius: 10,
                        padding: "0 9px",
                        background: "var(--surface)",
                        color: "var(--ink)",
                      }}
                      placeholder="0–100"
                    />
                    <button
                      className="btn"
                      disabled={busy}
                      onClick={() => void gradeSubmission(s)}
                      style={{
                        background: "var(--accent)",
                        color: "var(--surface)",
                        minHeight: 40,
                        padding: "0 12px",
                      }}
                    >
                      حفظ
                    </button>
                  </div>
                </div>
              );
            })}
            {!submissions.length && (
              <div style={{ padding: 18, color: "var(--muted)" }}>
                لا توجد تسليمات بعد.
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
