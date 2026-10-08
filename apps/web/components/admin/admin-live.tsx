"use client";

import { useUnsavedWork } from "@/lib/use-unsaved-work";
import { OperationsLive } from "./operations-live";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { boundedRead } from "@/lib/supabase/use-verified-account";
import { useConfirmedMutation } from "@/lib/supabase/use-confirmed-mutation";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import { CurriculumManager } from "@/components/admin/curriculum-manager";

type Question = {
  id: string;
  prompt_ar: string;
  review_status: string;
  publication_status: string;
  question_type: string;
};
type Profile = {
  id: string;
  display_name: string;
  role: "student" | "teacher" | "admin";
  xp: number;
  coins: number;
};
type ClassRow = {
  id: string;
  slug: string;
  name: string;
  grade_label: string;
  academic_year: string;
  active: boolean;
};
type Lesson = { id: string; title_ar: string };
type Skill = { id: string; title_ar: string };
type Membership = { class_id: string; student_id: string };
type TeacherAccess = { class_id: string; teacher_id: string };

export function AdminLive() {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<
    "content" | "curriculum" | "users" | "classes" | "operations"
  >("content");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [teacherAccess, setTeacherAccess] = useState<TeacherAccess[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const { account, busy, status, setStatus, run } = useConfirmedMutation();
  const [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");

  const [promptAr, setPromptAr] = useState("");
  const [promptEn, setPromptEn] = useState("");
  const [questionType, setQuestionType] = useState<
    "multiple-choice" | "numeric"
  >("multiple-choice");
  const [choicesAr, setChoicesAr] = useState("");
  const [choicesEn, setChoicesEn] = useState("");
  const [answer, setAnswer] = useState("");
  const [explanationAr, setExplanationAr] = useState("");
  const [explanationEn, setExplanationEn] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [skillId, setSkillId] = useState("");

  const [className, setClassName] = useState("");
  const [gradeLabel, setGradeLabel] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  useUnsavedWork(
    Boolean(
      account.user &&
        (promptAr ||
          promptEn ||
          choicesAr ||
          choicesEn ||
          answer ||
          explanationAr ||
          explanationEn ||
          className ||
          gradeLabel ||
          academicYear),
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
            .from("questions")
            .select(
              "id,prompt_ar,review_status,publication_status,question_type",
            )
            .order("created_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("id,display_name,role,xp,coins")
            .order("display_name"),
          supabase
            .from("classes")
            .select("id,slug,name,grade_label,academic_year,active")
            .order("name"),
          supabase.from("class_memberships").select("class_id,student_id"),
          supabase.from("teacher_class_access").select("class_id,teacher_id"),
          supabase.from("lessons").select("id,title_ar").order("position"),
          supabase.from("skills").select("id,title_ar").order("title_ar"),
        ]),
      );
      if (token !== account.revision.current) return false;
      const failed = results.find((r) => r.error);
      if (failed) throw failed.error;
      const [q, p, c, m, t, l, s] = results,
        classRows = (c.data ?? []) as ClassRow[],
        profileRows = (p.data ?? []) as Profile[];
      setQuestions((q.data ?? []) as Question[]);
      setProfiles(profileRows);
      setClasses(classRows);
      setMemberships((m.data ?? []) as Membership[]);
      setTeacherAccess((t.data ?? []) as TeacherAccess[]);
      setLessons((l.data ?? []) as Lesson[]);
      setSkills((s.data ?? []) as Skill[]);
      if (!lessonId && l.data?.[0]) setLessonId(l.data[0].id);
      if (!skillId && s.data?.[0]) setSkillId(s.data[0].id);
      if (!selectedClass && classRows[0]) setSelectedClass(classRows[0].id);
      if (!selectedUser && profileRows[0]) setSelectedUser(profileRows[0].id);
      return true;
    } catch {
      if (token === account.revision.current)
        setLoadError(
          "تعذّر تحميل بيانات الإدارة. لن نعرض أرقامًا أو قوائم فارغة بوصفها نتائج مؤكدة.",
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
      (refreshed ? "" : " — تعذّر تحديث القائمة؛ راجعها قبل تكرار العملية.")
    );
  }
  async function transition(id: string, action: string) {
    await run(async (check) => {
      const result = await supabase.rpc("transition_question", {
        p_question_id: id,
        p_action: action,
      });
      check();
      if (result.error) throw result.error;
      return refreshMessage(check, "تم تحديث حالة المحتوى ✓");
    });
  }

  function actionFor(q: Question) {
    if (q.review_status === "draft")
      return { label: "إرسال للمراجعة", action: "submit_review" };
    if (q.review_status === "in_review")
      return { label: "اعتماد", action: "approve" };
    if (q.review_status === "approved" && q.publication_status === "draft")
      return { label: "نشر", action: "publish" };
    if (
      q.publication_status === "published" ||
      q.publication_status === "published_demo"
    )
      return { label: "إيقاف النشر", action: "retire" };
    return null;
  }

  async function createQuestion(e: FormEvent) {
    e.preventDefault();
    if (!promptAr.trim() || !promptEn.trim() || !lessonId || !skillId) return;

    const arChoices = choicesAr
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
    const enChoices = choicesEn
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
    let answerSpec: Record<string, unknown>;

    if (questionType === "multiple-choice") {
      const idx = Number(answer);
      if (
        !Number.isInteger(idx) ||
        idx < 0 ||
        idx >= arChoices.length ||
        arChoices.length < 2 ||
        enChoices.length !== arChoices.length ||
        !answer.trim()
      ) {
        setStatus(
          "أدخل ترتيب الإجابة الصحيحة بدءًا من صفر، وخيارين على الأقل، مع عدد خيارات متساوٍ بالعربية والإنجليزية.",
        );
        return;
      }
      answerSpec = { type: "multiple-choice", correctAnswer: String(idx) };
    } else {
      const numeric = Number(answer);
      if (!answer.trim() || !Number.isFinite(numeric)) {
        setStatus("الإجابة الرقمية غير صالحة.");
        return;
      }
      answerSpec = { type: "numeric", correctAnswer: numeric, tolerance: 0.01 };
    }

    await run(async (check) => {
      const { error } = await supabase.rpc("create_question_draft", {
        p_lesson_id: lessonId,
        p_unit_id: null as unknown as string,
        p_skill_id: skillId,
        p_question_type: questionType,
        p_prompt_ar: promptAr.trim(),
        p_prompt_en: promptEn.trim(),
        p_choices_ar: questionType === "multiple-choice" ? arChoices : [],
        p_choices_en: questionType === "multiple-choice" ? enChoices : [],
        p_answer_spec: answerSpec as Json,
        p_explanation_ar: explanationAr.trim(),
        p_explanation_en: explanationEn.trim(),
        p_difficulty: 1,
        p_metadata: { source: "admin-studio" } as Json,
      });
      check();
      if (error) throw error;

      setPromptAr("");
      setPromptEn("");
      setChoicesAr("");
      setChoicesEn("");
      setAnswer("");
      setExplanationAr("");
      setExplanationEn("");
      const success = "تم حفظ المسودة والإجابة الصحيحة في الخادم ✓";
      return refreshMessage(check, success);
    });
  }

  async function changeRole(profile: Profile, role: Profile["role"]) {
    if (profile.role === role) return;
    if (
      !window.confirm(
        "تأكيد تغيير صلاحيات " +
          (profile.display_name || "الحساب") +
          " إلى " +
          role +
          "؟",
      )
    )
      return;
    await run(async (check) => {
      const { error } = await supabase.rpc("set_user_role", {
        p_user_id: profile.id,
        p_role: role,
      });
      check();
      if (error) throw error;
      const success = "تم تحديث الصلاحيات ✓";
      return refreshMessage(check, success);
    });
  }

  async function createClass(e: FormEvent) {
    e.preventDefault();
    if (!className.trim() || !gradeLabel.trim() || !academicYear.trim()) return;
    await run(async (check) => {
      const slug = "class-" + Date.now().toString(36);
      const { error } = await supabase
        .from("classes")
        .insert({
          slug,
          name: className.trim(),
          grade_label: gradeLabel.trim(),
          academic_year: academicYear.trim(),
          active: true,
        })
        .select("id")
        .single();
      check();
      if (error) throw error;
      const success = "تم إنشاء الصفّ ✓";
      if (!error) {
        setClassName("");
        setGradeLabel("");
        setAcademicYear("");
      }
      return refreshMessage(check, success);
    });
  }

  async function addAccess() {
    const profile = profiles.find((x) => x.id === selectedUser);
    if (!profile || !selectedClass) return;
    await run(async (check) => {
      let errorMessage = "";
      if (profile.role === "student") {
        const { error } = await supabase
          .from("class_memberships")
          .insert({ class_id: selectedClass, student_id: profile.id })
          .select("class_id")
          .single();
        errorMessage = error?.message ?? "";
      } else if (profile.role === "teacher") {
        const { error } = await supabase
          .from("teacher_class_access")
          .insert({ class_id: selectedClass, teacher_id: profile.id })
          .select("class_id")
          .single();
        errorMessage = error?.message ?? "";
      } else {
        errorMessage = "الإدارة لديها وصول لجميع الصفوف.";
      }
      check();
      if (errorMessage) throw Error("تعذّر منح الوصول إلى الصفّ.");
      const success = "تم منح الوصول إلى الصفّ ✓";
      return refreshMessage(check, success);
    });
  }

  async function removeStudent(classId: string, userId: string) {
    await run(async (check) => {
      const { error } = await supabase
        .from("class_memberships")
        .delete()
        .eq("class_id", classId)
        .eq("student_id", userId)
        .select("class_id")
        .single();
      check();
      if (error) throw error;
      const success = "تمت إزالة عضوية الطالب ✓";
      return refreshMessage(check, success);
    });
  }

  async function removeTeacher(classId: string, userId: string) {
    await run(async (check) => {
      const { error } = await supabase
        .from("teacher_class_access")
        .delete()
        .eq("class_id", classId)
        .eq("teacher_id", userId)
        .select("class_id")
        .single();
      check();
      if (error) throw error;
      const success = "تمت إزالة وصول المعلّم ✓";
      return refreshMessage(check, success);
    });
  }

  const counts = {
    draft: questions.filter((x) => x.review_status === "draft").length,
    review: questions.filter((x) => x.review_status === "in_review").length,
    published: questions.filter(
      (x) =>
        x.publication_status === "published" ||
        x.publication_status === "published_demo",
    ).length,
    users: profiles.length,
  };

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
        <h2>بنجهّز مساحة إدارة Noata…</h2>
      </section>
    );
  return (
    <>
      <header className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>
            إدارة المحتوى والمجتمع
          </div>
          <h1 style={{ margin: "6px 0 0" }}>مركز إدارة Noata</h1>
        </div>
        <span className="pill">إدارة المحتوى والمجتمع</span>
      </header>

      <section className="grid-4">
        <article className="metric-card">
          <span>المسودات</span>
          <strong>{counts.draft}</strong>
          <small>محتوى خاص</small>
        </article>
        <article className="metric-card">
          <span>قيد المراجعة</span>
          <strong>{counts.review}</strong>
          <small>بانتظار الاعتماد</small>
        </article>
        <article className="metric-card">
          <span>منشور</span>
          <strong>{counts.published}</strong>
          <small>متاح للطلاب</small>
        </article>
        <article className="metric-card">
          <span>الحسابات</span>
          <strong>{counts.users}</strong>
          <small>{classes.length} صفوف</small>
        </article>
      </section>

      <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
        {(
          ["content", "curriculum", "users", "classes", "operations"] as const
        ).map((x) => (
          <button
            key={x}
            onClick={() => setTab(x)}
            className="btn"
            style={{
              background: tab === x ? "var(--accent)" : "var(--surface)",
              color: tab === x ? "var(--surface)" : "var(--ink)",
              borderColor: "var(--line)",
            }}
          >
            {
              {
                content: "المحتوى",
                curriculum: "المناهج",
                users: "الحسابات",
                classes: "الصفوف",
                operations: "تشغيل المنصة",
              }[x]
            }
          </button>
        ))}
      </div>

      {status && (
        <div
          className="panel"
          role="status"
          style={{
            marginTop: 14,
            padding: 14,
            color: status.includes("✓") ? "var(--success)" : "var(--muted)",
          }}
        >
          {status}
        </div>
      )}

      {tab === "content" && (
        <>
          <section className="content-grid">
            <form className="panel" onSubmit={createQuestion}>
              <div className="panel-head">
                <h2>إنشاء مسودة سؤال</h2>
                <span className="pill">الإجابة الصحيحة محفوظة في الخادم</span>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <label>
                  <small>الدرس</small>
                  <select
                    className="model-select"
                    style={{ width: "100%", marginTop: 5 }}
                    value={lessonId}
                    onChange={(e) => setLessonId(e.target.value)}
                  >
                    {lessons.map((x) => (
                      <option value={x.id} key={x.id}>
                        {x.title_ar}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <small>المهارة</small>
                  <select
                    className="model-select"
                    style={{ width: "100%", marginTop: 5 }}
                    value={skillId}
                    onChange={(e) => setSkillId(e.target.value)}
                  >
                    {skills.map((x) => (
                      <option value={x.id} key={x.id}>
                        {x.title_ar}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <small>النوع</small>
                  <select
                    className="model-select"
                    style={{ width: "100%", marginTop: 5 }}
                    value={questionType}
                    onChange={(e) =>
                      setQuestionType(
                        e.target.value as "multiple-choice" | "numeric",
                      )
                    }
                  >
                    <option value="multiple-choice">اختيار من متعدد</option>
                    <option value="numeric">إجابة رقمية</option>
                  </select>
                </label>
                <textarea
                  className="search"
                  style={{ width: "100%", minHeight: 74, paddingTop: 12 }}
                  value={promptAr}
                  onChange={(e) => setPromptAr(e.target.value)}
                  placeholder="السؤال بالعربية"
                  aria-label="السؤال بالعربية"
                />
                <textarea
                  className="search"
                  style={{ width: "100%", minHeight: 74, paddingTop: 12 }}
                  value={promptEn}
                  onChange={(e) => setPromptEn(e.target.value)}
                  placeholder="السؤال بالإنجليزية"
                  aria-label="السؤال بالإنجليزية"
                />
                {questionType === "multiple-choice" && (
                  <>
                    <textarea
                      className="search"
                      style={{ width: "100%", minHeight: 90, paddingTop: 12 }}
                      value={choicesAr}
                      onChange={(e) => setChoicesAr(e.target.value)}
                      placeholder={"الخيارات العربية · خيار في كل سطر"}
                      aria-label="الخيارات العربية"
                    />
                    <textarea
                      className="search"
                      style={{ width: "100%", minHeight: 90, paddingTop: 12 }}
                      value={choicesEn}
                      onChange={(e) => setChoicesEn(e.target.value)}
                      placeholder={"الخيارات الإنجليزية · خيار في كل سطر"}
                      aria-label="الخيارات الإنجليزية"
                    />
                  </>
                )}
                <input
                  className="search"
                  style={{ width: "100%" }}
                  aria-label="الإجابة الصحيحة"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={
                    questionType === "multiple-choice"
                      ? "رقم الخيار الصحيح: 0، 1، 2…"
                      : "الإجابة الرقمية الصحيحة"
                  }
                />
                <textarea
                  className="search"
                  style={{ width: "100%", minHeight: 70, paddingTop: 12 }}
                  value={explanationAr}
                  onChange={(e) => setExplanationAr(e.target.value)}
                  placeholder="الشرح بعد التصحيح"
                  aria-label="الشرح بعد التصحيح"
                />
                <textarea
                  className="search"
                  style={{ width: "100%", minHeight: 70, paddingTop: 12 }}
                  value={explanationEn}
                  onChange={(e) => setExplanationEn(e.target.value)}
                  placeholder="الشرح بالإنجليزية"
                  aria-label="الشرح بالإنجليزية"
                />
                <button
                  disabled={busy}
                  className="btn"
                  style={{
                    background: "var(--accent)",
                    color: "var(--surface)",
                  }}
                >
                  إنشاء المسودة
                </button>
              </div>
            </form>

            <aside className="panel">
              <div className="panel-head">
                <h2>قواعد مراجعة المحتوى</h2>
                <span className="pill">ضوابط على الخادم</span>
              </div>
              <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>
                يبدأ المحتوى بمسودة، ثم المراجعة والاعتماد والنشر. مفاتيح
                الإجابات محفوظة على الخادم. النشر وإيقافه يتطلبان صلاحية
                الإدارة، وتُسجّل تغييرات الحالة في سجل النشاط.
              </p>
            </aside>
          </section>

          <section className="panel" style={{ marginTop: 18 }}>
            <div className="panel-head">
              <h2>قائمة المحتوى</h2>
              <span className="pill">{questions.length} سؤال</span>
            </div>
            <div className="quest-list">
              {questions.slice(0, 30).map((q, i) => {
                const action = actionFor(q);
                return (
                  <div className="quest" key={q.id}>
                    <div className="quest-icon">{i + 1}</div>
                    <div>
                      <h3>{q.prompt_ar}</h3>
                      <p>
                        {(
                          {
                            draft: "مسودة",
                            in_review: "قيد المراجعة",
                            approved: "معتمد",
                            rejected: "مرفوض",
                          } as Record<string, string>
                        )[q.review_status] ?? "حالة غير معروفة"}{" "}
                        ·{" "}
                        {(
                          {
                            unpublished: "غير منشور",
                            published: "منشور",
                            retired: "متوقف",
                          } as Record<string, string>
                        )[q.publication_status] ?? "حالة غير معروفة"}{" "}
                        ·{" "}
                        {q.question_type === "multiple-choice"
                          ? "اختيار متعدد"
                          : "إجابة رقمية"}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {q.review_status === "in_review" && (
                        <button
                          className="btn"
                          disabled={busy}
                          onClick={() =>
                            void transition(q.id, "return_to_draft")
                          }
                          style={{
                            background: "#fff3e8",
                            color: "#a65c16",
                            minHeight: 38,
                            padding: "0 10px",
                          }}
                        >
                          إعادة للمراجعة
                        </button>
                      )}
                      {action && (
                        <button
                          className="btn"
                          disabled={busy}
                          onClick={() => void transition(q.id, action.action)}
                          style={{
                            background: "var(--accent)",
                            color: "var(--surface)",
                            minHeight: 38,
                            padding: "0 10px",
                          }}
                        >
                          {action.label}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {tab === "curriculum" && <CurriculumManager />}
      {tab === "operations" && <OperationsLive />}

      {tab === "users" && (
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <h2>الحسابات والصلاحيات</h2>
            <span className="pill">صلاحيات الحساب</span>
          </div>
          <input
            className="search"
            placeholder="ابحث بالاسم أو الدور…"
            aria-label="ابحث بالاسم أو الدور…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <div className="quest-list">
            {profiles
              .filter((p) =>
                (p.display_name + " " + p.role)
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((p) => (
                <div className="quest" key={p.id}>
                  <div className="quest-icon">
                    {p.display_name?.slice(0, 1).toUpperCase() || "U"}
                  </div>
                  <div>
                    <h3>{p.display_name || "Unnamed user"}</h3>
                    <p>
                      {p.role} · {p.xp} XP · {p.coins} Coins
                    </p>
                  </div>
                  <select
                    className="model-select"
                    aria-label={"دور حساب " + (p.display_name || "المستخدم")}
                    value={p.role}
                    disabled={busy}
                    onChange={(e) =>
                      void changeRole(p, e.target.value as Profile["role"])
                    }
                  >
                    <option value="student">طالب</option>
                    <option value="teacher">معلّم</option>
                    <option value="admin">إدارة</option>
                  </select>
                </div>
              ))}
          </div>
        </section>
      )}

      {tab === "classes" && (
        <>
          <section className="content-grid">
            <form className="panel" onSubmit={createClass}>
              <div className="panel-head">
                <h2>إنشاء الصفّ</h2>
                <span className="pill">للإدارة فقط</span>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <input
                  className="search"
                  style={{ width: "100%" }}
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="اسم الصفّ"
                  aria-label="اسم الصفّ"
                />
                <input
                  className="search"
                  style={{ width: "100%" }}
                  value={gradeLabel}
                  onChange={(e) => setGradeLabel(e.target.value)}
                  placeholder="المرحلة الدراسية"
                  aria-label="المرحلة الدراسية"
                />
                <input
                  className="search"
                  style={{ width: "100%" }}
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="العام الدراسي"
                  aria-label="العام الدراسي"
                />
                <button
                  disabled={busy}
                  className="btn"
                  style={{
                    background: "var(--accent)",
                    color: "var(--surface)",
                  }}
                >
                  إنشاء الصفّ
                </button>
              </div>
            </form>

            <aside className="panel">
              <div className="panel-head">
                <h2>منح الوصول إلى الصفّ</h2>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <select
                  className="model-select"
                  aria-label="اختر الصفّ لمنح الوصول"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  className="model-select"
                  aria-label="اختر الحساب لمنح الوصول"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name || "Unnamed"} · {p.role}
                    </option>
                  ))}
                </select>
                <button
                  className="btn"
                  disabled={busy || !selectedClass || !selectedUser}
                  onClick={() => void addAccess()}
                  style={{
                    background: "var(--accent)",
                    color: "var(--surface)",
                  }}
                >
                  منح الوصول
                </button>
              </div>
            </aside>
          </section>

          <section style={{ display: "grid", gap: 14, marginTop: 18 }}>
            {classes.map((c) => {
              const students = memberships.filter((x) => x.class_id === c.id);
              const teachers = teacherAccess.filter((x) => x.class_id === c.id);
              return (
                <article className="panel" key={c.id}>
                  <div className="panel-head">
                    <div>
                      <h2>{c.name}</h2>
                      <p style={{ margin: "4px 0", color: "var(--muted)" }}>
                        {c.grade_label} · {c.academic_year}
                      </p>
                    </div>
                    <span className="pill">
                      {students.length} طالب · {teachers.length} معلّم
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                      gap: 10,
                    }}
                  >
                    <div>
                      <b>الطلاب</b>
                      {students.map((m) => (
                        <div
                          key={m.student_id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 8,
                            padding: "8px 0",
                            borderBottom: "1px solid var(--line)",
                          }}
                        >
                          <span>
                            {profiles.find((p) => p.id === m.student_id)
                              ?.display_name || "Student"}
                          </span>
                          <button
                            onClick={() =>
                              void removeStudent(c.id, m.student_id)
                            }
                            style={{
                              border: 0,
                              background: "transparent",
                              color: "var(--danger)",
                            }}
                          >
                            إزالة الوصول
                          </button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <b>المعلّمون</b>
                      {teachers.map((t) => (
                        <div
                          key={t.teacher_id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 8,
                            padding: "8px 0",
                            borderBottom: "1px solid var(--line)",
                          }}
                        >
                          <span>
                            {profiles.find((p) => p.id === t.teacher_id)
                              ?.display_name || "Teacher"}
                          </span>
                          <button
                            onClick={() =>
                              void removeTeacher(c.id, t.teacher_id)
                            }
                            style={{
                              border: 0,
                              background: "transparent",
                              color: "var(--danger)",
                            }}
                          >
                            إزالة الوصول
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </>
  );
}
