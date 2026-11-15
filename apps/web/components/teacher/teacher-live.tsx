"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";

import { useUnsavedWork } from "@/lib/use-unsaved-work";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { boundedRead } from "@/lib/supabase/use-verified-account";
import { useConfirmedMutation } from "@/lib/supabase/use-confirmed-mutation";
import { createClient } from "@/lib/supabase/client";
import { filterStaffSearch, paginateStaffItems, summarizeStudentProgress } from "@/lib/dashboard/staff-search";
import { downloadCsv } from "@/lib/dashboard/csv-export";
import { absoluteTimeLabel, localizedTimestamp } from "@/lib/dashboard/relative-time";
import { DataTable, type DataColumn } from "@/components/ui/table";
import { Drawer } from "@/components/ui/drawer";
import { StudyRichText } from "@/components/study/study-rich-text";
import { TeacherOperationsPanel } from "./teacher-operations-panel";

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
type Question = { id: string; prompt_ar: string; prompt_en: string };
type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_at: string | null;
  score: number | null;
};
type Profile = { id: string; display_name: string };
type ClassMembership = { class_id: string; student_id: string };
type LessonProgress = {
  user_id: string;
  lesson_id: string;
  completed_at: string | null;
  best_score: number;
  updated_at: string;
};

export function TeacherLive() {
 const t=useTranslation(),locale=useLocale();
  const supabase = useMemo(() => createClient(), []);
  const { account, busy, status, setStatus, run } = useConfirmedMutation();
  const userId = account.user?.id ?? "";
  const [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState("");
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [memberships, setMemberships] = useState<ClassMembership[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgress[]>([]);
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
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [assignmentPage, setAssignmentPage] = useState(0);
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [gradingFilter, setGradingFilter] = useState<"all" | "pending" | "graded">("pending");
  const [gradingPage, setGradingPage] = useState(0);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentClassFilter, setStudentClassFilter] = useState("all");
  const [studentPage, setStudentPage] = useState(0);
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ClassMembership | null>(null);
  const [rubricNotes, setRubricNotes] = useState("");
  const [maxPoints, setMaxPoints] = useState("100");
  const [latePolicy, setLatePolicy] = useState<"accept" | "deduct" | "strict">("accept");

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
            .select("id,prompt_ar,prompt_en")
            .in("publication_status", ["published_demo", "published"])
            .eq("review_status", "approved")
            .order("created_at"),
          supabase
            .from("assignment_submissions")
            .select("id,assignment_id,student_id,submitted_at,score")
            .order("submitted_at", { ascending: false }),
          supabase.from("profiles").select("id,display_name"),
          supabase.from("class_memberships").select("class_id,student_id").order("joined_at", { ascending: false }),
          supabase.from("lesson_progress").select("user_id,lesson_id,completed_at,best_score,updated_at").order("updated_at", { ascending: false }),
        ]),
      );
      if (token !== account.revision.current) return false;
      const failed = results.find((r) => r.error);
      if (failed) throw failed.error;
      const [c, a, q, s, p, membershipsResult, progressResult] = results;
      const classRows = (c.data ?? []) as ClassRow[];
      setClasses(classRows);
      if (!classId && classRows[0]) setClassId(classRows[0].id);
      setAssignments((a.data ?? []) as Assignment[]);
      setQuestions((q.data ?? []) as Question[]);
      setSubmissions((s.data ?? []) as Submission[]);
      setMemberships((membershipsResult.data ?? []) as ClassMembership[]);
      setLessonProgress((progressResult.data ?? []) as LessonProgress[]);
      setProfiles(
        new Map(
          ((p.data ?? []) as Profile[]).map((x) => [
            x.id,
            x.display_name || t("طالب","Student"),
          ]),
        ),
      );
      return true;
    } catch {
      if (token === account.revision.current)
        setLoadError(
          t("تعذّر تحميل بيانات الصفوف والواجبات. الأرقام غير متاحة حتى يعود الاتصال.","Could not load classes and assignments. Reconnect to view confirmed counts."),
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
      (refreshed ? "" : t(" — تعذّر تحديث القائمة؛ حدّثها قبل إنشاء نسخة أخرى."," — Could not refresh the list. Check it before creating another copy."))
    );
  }
  async function createAssignment(e: FormEvent) {
    e.preventDefault();
    if (!userId || !classId || !title.trim() || !selectedQuestions.length)
      return;
    if (due && !Number.isFinite(new Date(due).getTime())) {
      setStatus(t("موعد التسليم غير صالح.","Invalid due date."));
      return;
    }
    await run(async (check) => {
      const hasRubricMetadata = Boolean(
        rubricNotes.trim() || maxPoints !== "100" || latePolicy !== "accept",
      );
      const baseAssignment = {
        class_id: classId,
        created_by: userId,
        title: title.trim(),
        instructions: instructions.trim(),
        due_at: due ? new Date(due).toISOString() : null,
        published_at: null,
      };
      let created = await supabase
        .from("assignments")
        .insert({
          ...baseAssignment,
          metadata: hasRubricMetadata
            ? {
                rubric: rubricNotes.trim(),
                max_points: Math.max(1, Number(maxPoints) || 100),
                late_policy: latePolicy,
              }
            : undefined,
        })
        .select("id")
        .single();
      if (created.error && created.error.code === "42703") {
        created = await supabase
          .from("assignments")
          .insert(baseAssignment)
          .select("id")
          .single();
      }
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
            ? t("تعذّر حفظ أسئلة الواجب وتنظيف المسودة. راجع قائمة الواجبات قبل إنشاء واجب جديد.","Could not save assignment questions or clean up the draft. Check the assignment list before creating another.")
            : t("تعذّر حفظ أسئلة الواجب. أُزيلت المسودة غير المكتملة؛ حاول مرة أخرى.","Could not save assignment questions. The incomplete draft was removed; please try again."),
        );
      }
      let message = t("تم حفظ الواجب كمسودة ✓","Assignment draft saved ✓");
      if (publishNow) {
        const published = await supabase
          .from("assignments")
          .update({ published_at: new Date().toISOString() })
          .eq("id", id)
          .select("id")
          .single();
        check();
        message = published.error
          ? t("تم حفظ الواجب كمسودة؛ لم يتأكد نشره. راجع القائمة قبل إعادة النشر.","Draft saved, but publication could not be confirmed. Check the list before publishing again.")
          : t("تم نشر الواجب ✓","Assignment published ✓");
      }
      setTitle("");
      setInstructions("");
      setDue("");
      setSelectedQuestions([]);
      setRubricNotes("");
      setMaxPoints("100");
      setLatePolicy("accept");
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
      return refreshMessage(check, t("تم نشر الواجب ✓","Assignment published ✓"));
    });
  }
  async function gradeSubmission(row: Submission) {
    if (!row.submitted_at) {
      setStatus(
        t(
          "لا يمكن تقييم واجب لم يُسلَّم بعد. سيظهر للتقييم بعد تسليم الطالب.",
          "You cannot grade an assignment that has not been submitted yet.",
        ),
      );
      return;
    }
    const raw = grades[row.id] ?? (row.score == null ? "" : String(row.score)),
      score = Number(raw);
    if (!raw.trim() || !Number.isFinite(score) || score < 0 || score > 100) {
      setStatus(t("اكتب درجة بين ٠ و١٠٠.","Enter a grade from 0 to 100."));
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
      return refreshMessage(check, t("تم حفظ التقييم ✓","Grade saved ✓"));
    });
  }

  const membershipCount = new Set(submissions.map((x) => x.student_id)).size;
  const searchLocale = locale === "en" ? "en" : "ar";
  const visibleAssignments = filterStaffSearch(
    assignments, assignmentSearch, searchLocale,
    (assignment) => [
      assignment.title,
      assignment.instructions,
      classes.find((item) => item.id === assignment.class_id)?.name ?? "",
    ],
  ).filter((assignment) => {
    if (assignmentStatusFilter === "draft") return !assignment.published_at;
    if (assignmentStatusFilter === "published") return Boolean(assignment.published_at);
    return true;
  });
  const visibleSubmissions = filterStaffSearch(
    submissions, submissionSearch, searchLocale,
    (submission) => [
      profiles.get(submission.student_id) ?? t("طالب", "Student"),
      assignments.find((item) => item.id === submission.assignment_id)?.title ?? "",
    ],
  ).filter((submission) => {
    if (gradingFilter === "pending")
      return Boolean(submission.submitted_at) && submission.score == null;
    if (gradingFilter === "graded") return submission.score != null;
    return true;
  });
  const assignmentPageData = paginateStaffItems(visibleAssignments, assignmentPage, 20);
  const gradingPageData = paginateStaffItems(visibleSubmissions, gradingPage, 20);
  const progressByStudent = useMemo(() => {
    const grouped = new Map<string, LessonProgress[]>();
    for (const row of lessonProgress) {
      const current = grouped.get(row.user_id) ?? [];
      current.push(row);
      grouped.set(row.user_id, current);
    }
    return grouped;
  }, [lessonProgress]);
  const visibleRoster = filterStaffSearch(
    memberships.filter((member) =>
      profiles.has(member.student_id) &&
      classes.some((classRow) => classRow.id === member.class_id) &&
      (studentClassFilter === "all" || member.class_id === studentClassFilter)
    ),
    studentSearch,
    searchLocale,
    (member) => {
      const classRow = classes.find((row) => row.id === member.class_id);
      return [
        profiles.get(member.student_id) ?? "",
        classRow?.name ?? "",
        classRow?.grade_label ?? "",
        classRow?.academic_year ?? "",
      ];
    },
  ).sort((left, right) => {
    const leftName = profiles.get(left.student_id) ?? "";
    const rightName = profiles.get(right.student_id) ?? "";
    const nameOrder = leftName.localeCompare(rightName, searchLocale);
    if (nameOrder !== 0) return nameOrder;
    const leftClass = classes.find((row) => row.id === left.class_id)?.name ?? "";
    const rightClass = classes.find((row) => row.id === right.class_id)?.name ?? "";
    return leftClass.localeCompare(rightClass, searchLocale);
  });
  const interventionStudentIds = new Set<string>();
  for (const member of visibleRoster) {
    const summary = summarizeStudentProgress(progressByStudent.get(member.student_id) ?? []);
    if (summary.trackedLessons === 0 || (summary.averageBestScore !== null && summary.averageBestScore < 60)) {
      interventionStudentIds.add(member.student_id);
    }
  }
  const effectiveRoster = atRiskOnly
    ? visibleRoster.filter((member) => interventionStudentIds.has(member.student_id))
    : visibleRoster;
  const studentPageData = paginateStaffItems(effectiveRoster, studentPage, 20);
  const studentColumns: readonly DataColumn<ClassMembership>[] = [
    {
      key: "student",
      header: t("الطالب", "Student"),
      isRowHeader: true,
      cell: (member) => {
        const classRow = classes.find((row) => row.id === member.class_id);
        return (
          <div>
            <strong>{profiles.get(member.student_id) ?? t("طالب", "Student")}</strong>
            <div>
              <small style={{ color: "var(--muted)" }}>
                {classRow ? `${classRow.name} · ${classRow.grade_label}` : "—"}
              </small>
            </div>
          </div>
        );
      },
    },
    {
      key: "lessons",
      header: t("الدروس", "Lessons"),
      cell: (member) => {
        const summary = summarizeStudentProgress(progressByStudent.get(member.student_id) ?? []);
        return `${summary.completedLessons} / ${summary.trackedLessons}`;
      },
    },
    {
      key: "score",
      header: t("المتوسط والحالة", "Score & Status"),
      cell: (member) => {
        const summary = summarizeStudentProgress(progressByStudent.get(member.student_id) ?? []);
        const needsHelp = interventionStudentIds.has(member.student_id);
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <span>
              {summary.averageBestScore === null
                ? t("بلا درجات", "No scores")
                : `${summary.averageBestScore}%`}
            </span>
            <span className="noata-staff-badge" data-tone={needsHelp ? "warning" : "success"}>
              {needsHelp ? t("يحتاج متابعة", "Needs support") : t("منتظم", "On track")}
            </span>
          </div>
        );
      },
    },
    {
      key: "updated",
      header: t("آخر نشاط", "Last activity"),
      cell: (member) => {
        const summary = summarizeStudentProgress(progressByStudent.get(member.student_id) ?? []);
        return summary.lastUpdated
          ? localizedTimestamp(summary.lastUpdated, searchLocale)
          : t("لا يوجد نشاط مسجل", "No recorded activity");
      },
    },
    {
      key: "inspect",
      header: t("التفاصيل", "Inspect"),
      cell: (member) => (
        <button
          type="button"
          className="btn"
          onClick={() => setSelectedMember(member)}
        >
          {t("معاينة", "Inspect")}
        </button>
      ),
    },
  ];

  if (account.error || loadError)
    return (
      <section className="noata-staff-studio noata-teacher-studio aura-load-error" role="alert">
        <h2>{account.error || loadError}</h2>
        <button
          type="button"
          onClick={() => {
            if (account.error) void account.refresh();
            else void load();
          }}
        >{t("إعادة المحاولة","Try again")}</button>
      </section>
    );
  if (account.loading || loading)
    return (
      <section className="noata-staff-studio noata-teacher-studio aura-loading-state" role="status">
        <span />
        <h2>{t("بنجهّز مساحة المعلّم…","Loading your teacher workspace…")}</h2>
      </section>
    );
  return (
    <div className="noata-staff-studio noata-teacher-studio" data-tour-page="teacher">
      <header className="topbar" data-tour="teacher-welcome" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>{t("صفوفك وخطوات طلابك","Your classes and student progress")}</div>
          <h1 style={{ margin: "6px 0 0" }}>{t("كل طالب له خطوة جاية.","Every learner has a next step.")}</h1>
        </div>
        <span className="pill">{t("مساحة المعلّم","Teacher workspace")}</span>
      </header>

      {status && (
        <p role="status" className="aura-staff-status">
          {status}
        </p>
      )}
      <section className="grid-4" data-tour="teacher-attention">
        <article className="metric-card">
          <span>{t("الصفوف","Classes")}</span>
          <strong>{classes.length}</strong>
          <small>{t("المتاحة لك","Available to you")}</small>
        </article>
        <article className="metric-card">
          <span>{t("طلاب سلّموا واجبات","Students with submissions")}</span>
          <strong>{membershipCount}</strong>
          <small>{t("حسب التسليمات الظاهرة","Based on visible submissions")}</small>
        </article>
        <article className="metric-card">
          <span>{t("الواجبات","Assignments")}</span>
          <strong>{assignments.length}</strong>
          <small>
            {assignments.filter((x) => x.published_at).length} {t("منشور","Published")}</small>
        </article>
        <article className="metric-card">
          <span>{t("التسليمات","Submissions")}</span>
          <strong>{submissions.length}</strong>
          <small>
            {submissions.filter((x) => x.submitted_at && x.score == null).length} {t("بانتظار التقييم","Awaiting feedback")}</small>
        </article>
      </section>

      <nav className="filter-bar" data-tour="teacher-sections" aria-label={t("أقسام مساحة المعلم","Teacher workspace sections")}>
        {[
          ["overview", t("نظرة عامة","Overview")],
          ["students", t("الطلاب وتقدمهم","Students & progress")],
          ["attendance", t("الحضور والإعلانات","Attendance & notices")],
          ["create", t("واجب جديد","New assignment")],
          ["assignments", t("الواجبات","Assignments")],
          ["grading", t("التصحيح","Grading")],
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
        <a
          href="/study?tab=generator"
          className="filter-chip"
          style={{ marginInlineStart: "auto", display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
        >
          <span>⚡ {t("مولّد الاختبارات والبطاقات الذكي", "Smart Assessment & Flashcard Studio")}</span>
        </a>
      </nav>
      {(view === "overview" || view === "create") && (
        <section className="content-grid">
          <form
            className="panel"
            data-tour="teacher-assignment-builder"
            data-tour-critical={title || instructions || due || selectedQuestions.length ? "true" : undefined}
            onSubmit={createAssignment}
          >
            <div className="panel-head">
              <h2>{t("إنشاء واجب","Create assignment")}</h2>
              <span className="pill">{t("أسئلة معتمدة فقط","Approved questions only")}</span>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <label>
                <small>{t("الصفّ","Class")}</small>
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
                <small>{t("العنوان","Title")}</small>
                <input
                  className="search"
                  style={{ width: "100%", marginTop: 6 }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("عنوان الواجب","Assignment title")}
                />
              </label>
              <label>
                <small>{t("التعليمات","Instructions")}</small>
                <textarea
                  className="search"
                  style={{ width: "100%", minHeight: 90, paddingTop: 12 }}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={t("اكتب تعليمات الواجب…","Enter assignment instructions…")}
                />
              </label>
              <label>
                <small>{t("موعد التسليم","Due date")}</small>
                <input
                  className="search"
                  style={{ width: "100%", marginTop: 6 }}
                  type="datetime-local"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                />
              </label>
              <div>
                <small>{t("الأسئلة · اختر سؤالًا واحدًا على الأقل","Questions · Select at least one")}</small>
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
                        minHeight: 44,
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
                      <span style={{ fontSize: 13, lineHeight: 1.6, minWidth: 0, flex: 1 }}>
                        <StudyRichText content={locale === "en" ? q.prompt_en : q.prompt_ar} inline />
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="panel-subgrid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
                <label>
                  <small>{t("الدرجة العظمى (اختياري)", "Max points (optional)")}</small>
                  <input
                    className="search"
                    type="number"
                    min={1}
                    max={1000}
                    style={{ width: "100%", marginTop: 6 }}
                    value={maxPoints}
                    onChange={(e) => setMaxPoints(e.target.value)}
                  />
                </label>
                <label>
                  <small>{t("سياسة التسليم المتأخر", "Late submission policy")}</small>
                  <select
                    className="model-select"
                    style={{ width: "100%", marginTop: 6 }}
                    value={latePolicy}
                    onChange={(e) => setLatePolicy(e.target.value as "accept" | "deduct" | "strict")}
                  >
                    <option value="accept">{t("مقبول مع ملاحظة", "Accept with note")}</option>
                    <option value="deduct">{t("خصم نسبة تأخير", "Grace with penalty")}</option>
                    <option value="strict">{t("إغلاق عند الموعد", "Lock at deadline")}</option>
                  </select>
                </label>
              </div>
              <label>
                <small>{t("معايير التقييم / سلم الدرجات (اختياري)", "Grading rubric criteria (optional)")}</small>
                <input
                  className="search"
                  style={{ width: "100%", marginTop: 6 }}
                  value={rubricNotes}
                  onChange={(e) => setRubricNotes(e.target.value)}
                  placeholder={t("مثال: ٥٠٪ دقة الخطوات، ٣٠٪ المفهوم، ٢٠٪ التحقق", "e.g., 50% method accuracy, 30% reasoning, 20% verification")}
                />
              </label>
              <label
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  <b>{t("النشر الآن","Publish now")}</b>
                  <small style={{ display: "block", color: "var(--muted)" }}>{t("يُرسل إشعار النشر إلى طلاب الصفّ بعد تأكيد النشر.","Students are notified after publication is confirmed.")}</small>
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
                style={{ minHeight: 44, background: "var(--accent)", color: "var(--on-accent, #ffffff)" }}
              >{t("إنشاء واجب","Create assignment")}</button>
              {status && (
                <small
                  role="status"
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

          <aside className="panel" data-tour="teacher-classes">
            <div className="panel-head">
              <h2>{t("صفوفك","Your classes")}</h2>
              <span className="pill">{classes.length}</span>
            </div>
            <div className="quest-list">
              {classes.map((c) => (
                <div className="quest" key={c.id}>
                  <div className="quest-icon" aria-hidden="true">◫</div>
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
              <p style={{ color: "var(--muted)" }}>{t("لم تُخصص صفوف لهذا الحساب بعد.","No classes have been assigned to this account yet.")}</p>
            )}
          </aside>
        </section>
      )}

      {(view === "overview" || view === "assignments") && (
        <section className="panel" data-tour="teacher-assignments" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <h2>{t("الواجبات","Assignments")}</h2>
            <span className="pill">{visibleAssignments.length} / {assignments.length} {t("واجب","assignments")}</span>
          </div>
          <nav className="filter-bar" aria-label={t("تصفية الواجبات", "Assignment filters")} style={{ marginBottom: 14 }}>
            {([
              ["all", t("كل الواجبات", "All assignments")],
              ["draft", t("المسودات", "Drafts")],
              ["published", t("المنشورة", "Published")],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="filter-chip"
                aria-pressed={assignmentStatusFilter === value}
                onClick={() => {
                  setAssignmentStatusFilter(value);
                  setAssignmentPage(0);
                }}
              >{label}</button>
            ))}
          </nav>
          <div className="noata-staff-list-tools">
            <label className="noata-staff-search">
              <span>{t("البحث في الواجبات","Search assignments")}</span>
              <input
                className="search"
                type="search"
                value={assignmentSearch}
                onChange={(event) => {
                  setAssignmentSearch(event.target.value);
                  setAssignmentPage(0);
                }}
                placeholder={t("اسم الواجب أو الصف","Assignment or class name")}
                aria-label={t("البحث في الواجبات","Search assignments")}
              />
            </label>
            <button
              type="button"
              className="btn"
              disabled={!visibleAssignments.length}
              onClick={() => {
                const started = downloadCsv(
                  "noata-assignments.csv",
                  [t("الصف","Class"), t("العنوان","Title"), t("التعليمات","Instructions"), t("موعد التسليم","Due date"), t("الحالة","Status")],
                  visibleAssignments.map((assignment) => [
                    classes.find((item) => item.id === assignment.class_id)?.name ?? "",
                    assignment.title, assignment.instructions, assignment.due_at ?? "",
                    assignment.published_at ? t("منشور","Published") : t("مسودة","Draft"),
                  ]),
                );
                if (started) {
                  void Promise.resolve(
                    supabase.rpc("log_staff_export", {
                      p_entity_type: "teacher_assignments",
                      p_row_count: visibleAssignments.length,
                    }),
                  ).catch(() => {});
                } else {
                  setStatus(t("تعذّر بدء تنزيل الملف.", "Could not start the file download."));
                }
              }}
            >{t("تصدير CSV", "Export CSV")}</button>
          </div>
          <div className="quest-list">
            {assignmentPageData.items.map((a) => (
              <div className="quest" key={a.id}>
                <div className="quest-icon" aria-hidden="true">{a.published_at ? "✓" : "D"}</div>
                <div>
                  <h3>{a.title}</h3>
                  <p>
                    {classes.find((c) => c.id === a.class_id)?.name ?? t("الصفّ","Class")}{" "}
                    ·{" "}
                    {a.due_at
                      ? t("الموعد: ","Due: ") + localizedTimestamp(a.due_at, searchLocale)
                      : t("بدون موعد محدد","No due date")}
                  </p>
                </div>
                {!a.published_at ? (
                  <button
                    className="btn"
                    disabled={busy}
                    onClick={() => void publish(a.id)}
                    style={{
                      minHeight: 44,
                      background: "var(--accent)",
                      color: "var(--on-accent, #ffffff)",
                    }}
                  >{t("نشر","Publish")}</button>
                ) : (
                  <span className="pill">{t("منشور","Published")}</span>
                )}
              </div>
            ))}
            {!visibleAssignments.length && (
              <div className="noata-staff-empty">{assignmentSearch.trim() || assignmentStatusFilter !== "all"
                ? t("لا توجد واجبات تطابق البحث والتصفية الحالية.","No assignments match the current search and filter.")
                : t("لا توجد واجبات بعد.","No assignments yet.")}</div>
            )}
            {visibleAssignments.length > 0 && (
              <nav className="noata-staff-pagination" aria-label={t("صفحات الواجبات", "Assignment pages")}>
                <span>{t("النتائج", "Results")} {assignmentPageData.start}–{assignmentPageData.end} {t("من", "of")} {assignmentPageData.total}</span>
                <div>
                  <button type="button" className="btn" disabled={assignmentPageData.page === 0} onClick={() => setAssignmentPage(assignmentPageData.page - 1)}>{t("السابق", "Previous")}</button>
                  <span aria-live="polite">{assignmentPageData.page + 1} / {assignmentPageData.pageCount}</span>
                  <button type="button" className="btn" disabled={assignmentPageData.page + 1 >= assignmentPageData.pageCount} onClick={() => setAssignmentPage(assignmentPageData.page + 1)}>{t("التالي", "Next")}</button>
                </div>
              </nav>
            )}
          </div>
        </section>
      )}


      {view === "attendance" && (
        <TeacherOperationsPanel
          classes={classes}
          memberships={memberships}
          profiles={profiles}
          teacherId={account.user?.id}
        />
      )}

      {view === "students" && (
        <section className="panel" data-tour="teacher-students">
          <div className="panel-head">
            <h2>{t("قائمة الطلاب وتقدمهم","Student roster and progress")}</h2>
            <span className="pill">{visibleRoster.length} {t("سجل طالب/صف","student-class records")}</span>
          </div>
          {interventionStudentIds.size > 0 && (
            <div className="noata-intervention-banner" role="region" aria-label={t("تنبيهات التدخل الأكاديمي", "Academic intervention alerts")}>
              <div>
                <strong>
                  {t(
                    `يحتاج ${interventionStudentIds.size} طلاب إلى متابعة أكاديمية (متوسط أقل من ٦٠٪ أو بلا دروس مسجلة)`,
                    `${interventionStudentIds.size} student(s) need academic follow-up (average below 60% or 0 tracked lessons)`,
                  )}
                </strong>
              </div>
              <button
                type="button"
                className="btn"
                aria-pressed={atRiskOnly}
                onClick={() => {
                  setAtRiskOnly((current) => !current);
                  setStudentPage(0);
                }}
              >
                {atRiskOnly
                  ? t("عرض كل الطلاب", "Show all students")
                  : t("تصفية المحتاجين للمتابعة", "Filter needing support")}
              </button>
            </div>
          )}
          <div className="noata-staff-list-tools">
            <label className="noata-staff-search">
              <span>{t("البحث عن طالب أو صف","Search students or classes")}</span>
              <input
                className="search"
                type="search"
                value={studentSearch}
                onChange={(event) => {
                  setStudentSearch(event.target.value);
                  setStudentPage(0);
                }}
                placeholder={t("اسم الطالب أو الصف أو المرحلة","Student, class or grade")}
                aria-label={t("البحث عن طالب أو صف","Search students or classes")}
              />
            </label>
            <label className="noata-staff-search">
              <span>{t("تصفية حسب الصف","Filter by class")}</span>
              <select
                className="model-select"
                value={studentClassFilter}
                onChange={(event) => {
                  setStudentClassFilter(event.target.value);
                  setStudentPage(0);
                }}
                aria-label={t("تصفية حسب الصف","Filter by class")}
              >
                <option value="all">{t("كل صفوفي","All assigned classes")}</option>
                {classes.map((classRow) => (
                  <option key={classRow.id} value={classRow.id}>
                    {classRow.name} · {classRow.grade_label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn"
              disabled={!visibleRoster.length}
              onClick={() => {
                const started = downloadCsv(
                  "noata-student-progress.csv",
                  [
                    t("اسم الطالب","Student"),
                    t("الصف","Class"),
                    t("المرحلة","Grade"),
                    t("الدروس المسجلة","Tracked lessons"),
                    t("الدروس المكتملة","Completed lessons"),
                    t("متوسط أفضل الدرجات","Average best score"),
                    t("آخر تحديث","Last updated"),
                  ],
                  visibleRoster.map((member) => {
                    const classRow = classes.find((row) => row.id === member.class_id);
                    const summary = summarizeStudentProgress(progressByStudent.get(member.student_id) ?? []);
                    return [
                      profiles.get(member.student_id) ?? "",
                      classRow?.name ?? "",
                      classRow?.grade_label ?? "",
                      summary.trackedLessons,
                      summary.completedLessons,
                      summary.averageBestScore ?? "",
                      summary.lastUpdated ?? "",
                    ];
                  }),
                );
                if (started) {
                  void Promise.resolve(
                    supabase.rpc("log_staff_export", {
                      p_entity_type: "teacher_student_progress",
                      p_row_count: visibleRoster.length,
                      p_details: {
                        class_id: studentClassFilter === "all" ? null : studentClassFilter,
                      },
                    }),
                  ).catch(() => {});
                } else {
                  setStatus(t("تعذّر بدء تنزيل الملف.", "Could not start the file download."));
                }
              }}
            >{t("تصدير تقدم الطلاب CSV","Export student progress CSV")}</button>
          </div>
          <DataTable
            caption={t("قائمة الطلاب وتقدمهم", "Student roster and progress")}
            columns={studentColumns}
            rows={studentPageData.items}
            getRowKey={(member) => `${member.class_id}:${member.student_id}`}
            empty={
              <div className="noata-staff-empty">
                {studentSearch.trim() || studentClassFilter !== "all" || atRiskOnly
                  ? t("لا يوجد طلاب مطابقون للبحث أو التصفية الحالية.", "No students match the current search or filter.")
                  : t("لا توجد سجلات طلاب متاحة ضمن صفوفك حتى الآن.", "No student roster records are available in your assigned classes yet.")}
              </div>
            }
          />
          {effectiveRoster.length > 0 && (
            <nav className="noata-staff-pagination" aria-label={t("صفحات الطلاب","Student pages")}>
              <span>{t("النتائج","Results")} {studentPageData.start}–{studentPageData.end} {t("من","of")} {studentPageData.total}</span>
              <div>
                <button type="button" className="btn" disabled={studentPageData.page === 0} onClick={() => setStudentPage(studentPageData.page - 1)}>{t("السابق","Previous")}</button>
                <span aria-live="polite">{studentPageData.page + 1} / {studentPageData.pageCount}</span>
                <button type="button" className="btn" disabled={studentPageData.page + 1 >= studentPageData.pageCount} onClick={() => setStudentPage(studentPageData.page + 1)}>{t("التالي","Next")}</button>
              </div>
            </nav>
          )}
          <Drawer
            open={Boolean(selectedMember)}
            onClose={() => setSelectedMember(null)}
            title={
              selectedMember
                ? `${profiles.get(selectedMember.student_id) ?? t("طالب", "Student")} · ${
                    classes.find((c) => c.id === selectedMember.class_id)?.name ?? ""
                  }`
                : t("ملف الطالب", "Student profile")
            }
          >
            {selectedMember && (() => {
              const rows = progressByStudent.get(selectedMember.student_id) ?? [];
              const summary = summarizeStudentProgress(rows);
              const studentSubmissions = submissions.filter((s) => s.student_id === selectedMember.student_id);
              return (
                <div style={{ display: "grid", gap: 16 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <span className="pill">{t("الدروس المكتملة", "Completed")}: {summary.completedLessons}/{summary.trackedLessons}</span>
                    <span className="pill">
                      {t("المتوسط", "Average")}: {summary.averageBestScore === null ? "—" : `${summary.averageBestScore}%`}
                    </span>
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>{t("التسليمات المرتبطة", "Assignment submissions")}</h3>
                    {studentSubmissions.length === 0 ? (
                      <p style={{ color: "var(--muted)", margin: 0 }}>{t("لا توجد تسليمات مسجلة لهذا الطالب.", "No recorded assignment submissions for this student.")}</p>
                    ) : (
                      <ul style={{ margin: 0, paddingInlineStart: 18, display: "grid", gap: 6 }}>
                        {studentSubmissions.slice(0, 8).map((sub) => {
                          const assignTitle = assignments.find((a) => a.id === sub.assignment_id)?.title ?? sub.assignment_id;
                          return (
                            <li key={sub.id}>
                              <strong>{assignTitle}</strong>{" "}
                              <small style={{ color: "var(--muted)" }}>
                                {sub.score == null ? t("بانتظار التصحيح", "Pending score") : `${sub.score}%`}
                              </small>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>{t("سجل إتقان الدروس", "Tracked lesson activity")}</h3>
                    {rows.length === 0 ? (
                      <p style={{ color: "var(--muted)", margin: 0 }}>{t("لا توجد دروس مسجلة حتى الآن.", "No tracked lessons yet.")}</p>
                    ) : (
                      <ul style={{ margin: 0, paddingInlineStart: 18, display: "grid", gap: 6 }}>
                        {rows.slice(0, 10).map((row) => (
                          <li key={row.lesson_id}>
                            <span>{row.lesson_id}</span>{" — "}
                            <strong>{row.best_score}%</strong>{" "}
                            <small style={{ color: "var(--muted)" }}>
                              {row.completed_at ? t("مكتمل", "Completed") : t("قيد الدراسة", "In progress")}
                            </small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })()}
          </Drawer>
        </section>
      )}

      {(view === "overview" || view === "grading") && (
        <section className="panel" data-tour="teacher-grading" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <h2>{t("التسليمات والتقييم","Submissions and grading")}</h2>
            <span className="pill">
              {submissions.filter((x) => x.submitted_at && x.score == null).length} {t("بانتظار التقييم","Awaiting feedback")}</span>
          </div>
          <nav className="filter-bar" aria-label={t("تصفية التسليمات", "Submission filters")} style={{ marginBottom: 14 }}>
            {([
              ["pending", t("بانتظار التقييم", "Needs grading")],
              ["graded", t("تم تقييمها", "Graded")],
              ["all", t("كل التسليمات", "All submissions")],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="filter-chip"
                aria-pressed={gradingFilter === value}
                onClick={() => {
                  setGradingFilter(value);
                  setGradingPage(0);
                }}
              >{label}</button>
            ))}
          </nav>
          <div className="noata-staff-list-tools">
            <label className="noata-staff-search">
              <span>{t("البحث في التسليمات","Search submissions")}</span>
              <input
                className="search"
                type="search"
                value={submissionSearch}
                onChange={(event) => {
                  setSubmissionSearch(event.target.value);
                  setGradingPage(0);
                }}
                placeholder={t("اسم الطالب أو الواجب","Student or assignment")}
                aria-label={t("البحث في التسليمات","Search submissions")}
              />
            </label>
            <button
              type="button"
              className="btn"
              disabled={!visibleSubmissions.length}
              onClick={() => {
                const started = downloadCsv(
                  "noata-submissions.csv",
                  [t("الطالب","Student"), t("الواجب","Assignment"), t("وقت التسليم","Submitted at"), t("الدرجة","Score")],
                  visibleSubmissions.map((submission) => [
                    profiles.get(submission.student_id) ?? t("طالب","Student"),
                    assignments.find((item) => item.id === submission.assignment_id)?.title ?? "",
                    submission.submitted_at ?? "",
                    submission.score ?? "",
                  ]),
                );
                if (started) {
                  void Promise.resolve(
                    supabase.rpc("log_staff_export", {
                      p_entity_type: "teacher_submissions",
                      p_row_count: visibleSubmissions.length,
                    }),
                  ).catch(() => {});
                } else {
                  setStatus(t("تعذّر بدء تنزيل الملف.", "Could not start the file download."));
                }
              }}
            >{t("تصدير CSV", "Export CSV")}</button>
          </div>
          <div className="quest-list">
            {gradingPageData.items.map((s) => {
              const assignment = assignments.find(
                (a) => a.id === s.assignment_id,
              );
              return (
                <div className="quest" key={s.id}>
                  <div className="quest-icon" aria-hidden="true">
                    {s.score == null ? "…" : Math.round(s.score)}
                  </div>
                  <div>
                    <h3>{profiles.get(s.student_id) ?? t("طالب","Student")}</h3>
                    <p>
                      {assignment?.title ?? t("واجب","Assignment")} ·{" "}
                      {s.submitted_at
                        ? <time dateTime={s.submitted_at} title={absoluteTimeLabel(s.submitted_at, searchLocale)}>{localizedTimestamp(s.submitted_at, searchLocale)}</time>
                        : t("لم يُسلّم بعد","Not submitted")}
                    </p>
                  </div>
                  <div
                    style={{ display: "flex", gap: 7, alignItems: "center" }}
                  >
                    <input
                      aria-label={
                        t("تقييم واجب الطالب ","Grade student assignment ") +
                        (profiles.get(s.student_id) ?? t("طالب","Student"))
                      }
                      value={
                        grades[s.id] ?? (s.score == null ? "" : String(s.score))
                      }
                      disabled={busy || !s.submitted_at}
                      title={
                        s.submitted_at
                          ? undefined
                          : t(
                              "لا يمكن التقييم قبل تسليم الطالب.",
                              "Grading is unavailable before the student submits.",
                            )
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
                      disabled={busy || !s.submitted_at}
                      onClick={() => void gradeSubmission(s)}
                      style={{
                        background: "var(--accent)",
                        color: "var(--on-accent, #ffffff)",
                        minHeight: 44,
                        padding: "0 12px",
                      }}
                    >{t("حفظ","Save")}</button>
                  </div>
                </div>
              );
            })}
            {!visibleSubmissions.length && (
              <div className="noata-staff-empty">{submissionSearch.trim() || gradingFilter !== "all"
                ? t("لا توجد تسليمات تطابق البحث والتصفية الحالية.","No submissions match the current search and filter.")
                : t("لا توجد تسليمات بعد.","No submissions yet.")}</div>
            )}
            {visibleSubmissions.length > 0 && (
              <nav className="noata-staff-pagination" aria-label={t("صفحات التسليمات", "Submission pages")}>
                <span>{t("النتائج", "Results")} {gradingPageData.start}–{gradingPageData.end} {t("من", "of")} {gradingPageData.total}</span>
                <div>
                  <button type="button" className="btn" disabled={gradingPageData.page === 0} onClick={() => setGradingPage(gradingPageData.page - 1)}>{t("السابق", "Previous")}</button>
                  <span aria-live="polite">{gradingPageData.page + 1} / {gradingPageData.pageCount}</span>
                  <button type="button" className="btn" disabled={gradingPageData.page + 1 >= gradingPageData.pageCount} onClick={() => setGradingPage(gradingPageData.page + 1)}>{t("التالي", "Next")}</button>
                </div>
              </nav>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
