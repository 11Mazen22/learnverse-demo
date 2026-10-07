"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  const [userId, setUserId] = useState("");
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
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("overview");

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const [{ data: c }, { data: a }, { data: q }, { data: s }, { data: p }] =
      await Promise.all([
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
      ]);

    const classRows = (c ?? []) as ClassRow[];
    setClasses(classRows);
    if (!classId && classRows[0]) setClassId(classRows[0].id);
    setAssignments((a ?? []) as Assignment[]);
    setQuestions((q ?? []) as Question[]);
    setSubmissions((s ?? []) as Submission[]);
    setProfiles(
      new Map(
        ((p ?? []) as Profile[]).map((x) => [
          x.id,
          x.display_name || "Student",
        ]),
      ),
    );
  }

  useEffect(() => {
    void load();
  }, []);

  async function createAssignment(e: FormEvent) {
    e.preventDefault();
    if (!userId || !classId || !title.trim() || !selectedQuestions.length)
      return;
    setBusy(true);
    setStatus("Creating…");
    const { data, error } = await supabase
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

    if (error || !data) {
      setStatus(error?.message ?? "Could not create assignment");
      setBusy(false);
      return;
    }

    const { error: itemError } = await supabase
      .from("assignment_items")
      .insert(
        selectedQuestions.map((question_id, i) => ({
          assignment_id: data.id,
          position: i + 1,
          question_id,
        })),
      );
    if (itemError) {
      await supabase.from("assignments").delete().eq("id", data.id);
      setStatus("تعذّر حفظ أسئلة الواجب. حاول مرة تانية.");
      setBusy(false);
      return;
    }
    if (publishNow) {
      const published = await supabase
        .from("assignments")
        .update({ published_at: new Date().toISOString() })
        .eq("id", data.id);
      if (published.error) {
        setStatus(
          "الواجب محفوظ كمسودة. تعذّر نشره، جرّب النشر من قائمة الواجبات.",
        );
        await load();
        setBusy(false);
        return;
      }
    }

    setTitle("");
    setInstructions("");
    setDue("");
    setSelectedQuestions([]);
    setPublishNow(true);
    setStatus("Assignment created ✓");
    await load();
    setBusy(false);
  }

  async function publish(id: string) {
    setBusy(true);
    setStatus("");
    const { error } = await supabase
      .from("assignments")
      .update({ published_at: new Date().toISOString() })
      .eq("id", id);
    setStatus(error ? error.message : "Published ✓");
    await load();
    setBusy(false);
  }

  async function gradeSubmission(row: Submission) {
    const raw = grades[row.id] ?? (row.score == null ? "" : String(row.score));
    if (!raw.trim()) {
      setStatus("اكتب الدرجة أولاً.");
      return;
    }
    const score = Number(raw);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      setStatus("Score must be between 0 and 100.");
      return;
    }
    setBusy(true);
    setStatus("");
    const { error } = await supabase
      .from("assignment_submissions")
      .update({ score })
      .eq("id", row.id);
    setStatus(error ? error.message : "Grade saved ✓");
    await load();
    setBusy(false);
  }

  const membershipCount = new Set(submissions.map((x) => x.student_id)).size;

  return (
    <>
      <header className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>
            TEACHER WORKSPACE
          </div>
          <h1 style={{ margin: "6px 0 0" }}>كل طالب له خطوة جاية.</h1>
        </div>
        <span className="pill">مساحة المعلّم</span>
      </header>

      <section className="grid-4">
        <article className="metric-card">
          <span>Classes</span>
          <strong>{classes.length}</strong>
          <small>assigned to you</small>
        </article>
        <article className="metric-card">
          <span>Active students</span>
          <strong>{membershipCount}</strong>
          <small>with submissions</small>
        </article>
        <article className="metric-card">
          <span>Assignments</span>
          <strong>{assignments.length}</strong>
          <small>
            {assignments.filter((x) => x.published_at).length} published
          </small>
        </article>
        <article className="metric-card">
          <span>Submissions</span>
          <strong>{submissions.length}</strong>
          <small>
            {submissions.filter((x) => x.score == null).length} awaiting grade
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
              <h2>Create assignment</h2>
              <span className="pill">Reviewed questions only</span>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <label>
                <small>Class</small>
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
                <small>Title</small>
                <input
                  className="search"
                  style={{ width: "100%", marginTop: 6 }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Assignment title"
                />
              </label>
              <label>
                <small>Instructions</small>
                <textarea
                  className="search"
                  style={{ width: "100%", minHeight: 90, paddingTop: 12 }}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Instructions…"
                />
              </label>
              <label>
                <small>Due date</small>
                <input
                  className="search"
                  style={{ width: "100%", marginTop: 6 }}
                  type="datetime-local"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                />
              </label>
              <div>
                <small>Questions · choose at least one</small>
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
                  <b>Publish now</b>
                  <small style={{ display: "block", color: "var(--muted)" }}>
                    Students get a notification immediately.
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
                Create assignment
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
              <h2>Your classes</h2>
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
                No classes have been assigned to this teacher account yet.
              </p>
            )}
          </aside>
        </section>
      )}

      {(view === "overview" || view === "assignments") && (
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <h2>Assignments</h2>
            <span className="pill">Draft + published</span>
          </div>
          <div className="quest-list">
            {assignments.map((a) => (
              <div className="quest" key={a.id}>
                <div className="quest-icon">{a.published_at ? "✓" : "D"}</div>
                <div>
                  <h3>{a.title}</h3>
                  <p>
                    {classes.find((c) => c.id === a.class_id)?.name ?? "Class"}{" "}
                    ·{" "}
                    {a.due_at
                      ? "Due " + new Date(a.due_at).toLocaleString()
                      : "No due date"}
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
                    Publish
                  </button>
                ) : (
                  <span className="pill">Published</span>
                )}
              </div>
            ))}
            {!assignments.length && (
              <div style={{ padding: 18, color: "var(--muted)" }}>
                No assignments yet.
              </div>
            )}
          </div>
        </section>
      )}

      {(view === "overview" || view === "grading") && (
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <h2>Submissions & grading</h2>
            <span className="pill">
              {submissions.filter((x) => x.score == null).length} pending
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
                    <h3>{profiles.get(s.student_id) ?? "Student"}</h3>
                    <p>
                      {assignment?.title ?? "Assignment"} ·{" "}
                      {s.submitted_at
                        ? new Date(s.submitted_at).toLocaleString()
                        : "Not submitted"}
                    </p>
                  </div>
                  <div
                    style={{ display: "flex", gap: 7, alignItems: "center" }}
                  >
                    <input
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
                      Save
                    </button>
                  </div>
                </div>
              );
            })}
            {!submissions.length && (
              <div style={{ padding: 18, color: "var(--muted)" }}>
                No submissions yet.
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
