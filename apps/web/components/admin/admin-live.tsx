"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";

import { useUnsavedWork } from "@/lib/use-unsaved-work";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { OperationsLive } from "./operations-live";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { boundedRead } from "@/lib/supabase/use-verified-account";
import { useConfirmedMutation } from "@/lib/supabase/use-confirmed-mutation";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import { CurriculumManager } from "@/components/admin/curriculum-manager";

type Question = {
  id: string;
  prompt_ar: string; prompt_en: string;
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
type Lesson = { id: string; title_ar: string; title_en: string };
type Skill = { id: string; title_ar: string; title_en: string };
type Membership = { class_id: string; student_id: string };
type TeacherAccess = { class_id: string; teacher_id: string };

export function AdminLive() {
 const t=useTranslation(),locale=useLocale();
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
  const [contentSearch, setContentSearch] = useState("");
  const [classSearch, setClassSearch] = useState("");

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
              "id,prompt_ar,prompt_en,review_status,publication_status,question_type",
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
          supabase.from("lessons").select("id,title_ar,title_en").order("position"),
          supabase.from("skills").select("id,title_ar,title_en").order("title_ar"),
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
          t("تعذّر تحميل بيانات الإدارة. لن نعرض أرقامًا أو قوائم فارغة بوصفها نتائج مؤكدة.","Could not load administration data. Refresh to see confirmed results."),
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
      (refreshed ? "" : t(" — تعذّر تحديث القائمة؛ راجعها قبل تكرار العملية."," — Could not refresh the list. Check it before repeating the action."))
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
      return refreshMessage(check, t("تم تحديث حالة المحتوى ✓","Content status updated ✓"));
    });
  }

  function actionFor(q: Question) {
    if (q.review_status === "draft")
      return { label: t("إرسال للمراجعة","Submit for review"), action: "submit_review" };
    if (q.review_status === "in_review")
      return { label: t("اعتماد","Approve"), action: "approve" };
    if (q.review_status === "approved" && q.publication_status === "draft")
      return { label: t("نشر","Publish"), action: "publish" };
    if (
      q.publication_status === "published" ||
      q.publication_status === "published_demo"
    )
      return { label: t("إيقاف النشر","Unpublish"), action: "retire" };
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
          t("أدخل ترتيب الإجابة الصحيحة بدءًا من صفر، وخيارين على الأقل، مع عدد خيارات متساوٍ بالعربية والإنجليزية.","Enter the correct option index starting at 0. Provide at least two options with equal counts in Arabic and English."),
        );
        return;
      }
      answerSpec = { type: "multiple-choice", correctAnswer: String(idx) };
    } else {
      const numeric = Number(answer);
      if (!answer.trim() || !Number.isFinite(numeric)) {
        setStatus(t("الإجابة الرقمية غير صالحة.","Invalid numeric answer."));
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
      const success = t("تم حفظ المسودة والإجابة الصحيحة في الخادم ✓","Draft and answer key saved ✓");
      return refreshMessage(check, success);
    });
  }

  async function changeRole(profile: Profile, role: Profile["role"]) {
    if (profile.role === role) return;
    const roleLabel =
      role === "admin" ? t("مسؤول","Admin") : role === "teacher" ? t("معلّم","Teacher") : t("طالب","Student");
    if (
      !(await confirmAction({
        title: t("تغيير صلاحيات الحساب؟","Change account permissions?"),
        description:
          t("سيتم تغيير صلاحيات ","Change permissions for ") +
          (profile.display_name || t("هذا الحساب","this account")) +
          t(" إلى «"," to “") +
          roleLabel +
          t("». يمكنك التراجع لاحقًا من نفس الصفحة.","”. You can reverse this from the same page."),
        confirmLabel: t("تأكيد التغيير","Confirm change"),
        cancelLabel: t("إلغاء","Cancel"),
      }))
    )
      return;
    await run(async (check) => {
      const { error } = await supabase.rpc("set_user_role", {
        p_user_id: profile.id,
        p_role: role,
      });
      check();
      if (error) throw error;
      const success = t("تم تحديث الصلاحيات ✓","Permissions updated ✓");
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
      const success = t("تم إنشاء الصفّ ✓","Class created ✓");
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
        errorMessage = t("الإدارة لديها وصول لجميع الصفوف.","Admins already have access to all classes.");
      }
      check();
      if (errorMessage) throw Error(t("تعذّر منح الوصول إلى الصفّ.","Could not grant class access."));
      const success = t("تم منح الوصول إلى الصفّ ✓","Class access granted ✓");
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
      const success = t("تمت إزالة عضوية الطالب ✓","Student membership removed ✓");
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
      const success = t("تمت إزالة وصول المعلّم ✓","Teacher access removed ✓");
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
  const filterLocale = locale === "en" ? "en" : "ar";
  const contentNeedle = contentSearch.trim().toLocaleLowerCase(filterLocale);
  const visibleQuestions = questions.filter((question) => {
    const haystack = `${question.prompt_ar} ${question.prompt_en} ${question.review_status} ${question.publication_status} ${question.question_type}`;
    return !contentNeedle || haystack.toLocaleLowerCase(filterLocale).includes(contentNeedle);
  });
  const classNeedle = classSearch.trim().toLocaleLowerCase(filterLocale);
  const visibleClasses = classes.filter((classRow) => {
    const haystack = `${classRow.name} ${classRow.grade_label} ${classRow.academic_year} ${classRow.slug}`;
    return !classNeedle || haystack.toLocaleLowerCase(filterLocale).includes(classNeedle);
  });

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
        >{t("إعادة المحاولة","Try again")}</button>
      </section>
    );
  if (account.loading || loading)
    return (
      <section className="aura-loading-state" role="status">
        <span />
        <h2>{t("بنجهّز مساحة إدارة Noata…","Loading Noata administration…")}</h2>
      </section>
    );
  return (
    <div className="noata-staff-studio noata-admin-studio">
      <header className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>{t("إدارة المحتوى والمجتمع","Manage content and community")}</div>
          <h1 style={{ margin: "6px 0 0" }}>{t("مركز إدارة Noata","Noata administration")}</h1>
        </div>
        <span className="pill">{t("إدارة المحتوى والمجتمع","Manage content and community")}</span>
      </header>

      <section className="grid-4">
        <article className="metric-card">
          <span>{t("المسودات","Drafts")}</span>
          <strong>{counts.draft}</strong>
          <small>{t("محتوى خاص","Private content")}</small>
        </article>
        <article className="metric-card">
          <span>{t("قيد المراجعة","Under review")}</span>
          <strong>{counts.review}</strong>
          <small>{t("بانتظار الاعتماد","Awaiting approval")}</small>
        </article>
        <article className="metric-card">
          <span>{t("منشور","Published")}</span>
          <strong>{counts.published}</strong>
          <small>{t("متاح للطلاب","Available to students")}</small>
        </article>
        <article className="metric-card">
          <span>{t("الحسابات","Accounts")}</span>
          <strong>{counts.users}</strong>
          <small>{classes.length}{t("صفوف","classes")}</small>
        </article>
      </section>

      <div className="noata-admin-tabs" style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
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
                content: t("المحتوى","Content"),
                curriculum: t("المناهج","Curriculum"),
                users: t("الحسابات","Accounts"),
                classes: t("الصفوف","Classes"),
                operations: t("تشغيل المنصة","Platform operations"),
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
                <h2>{t("إنشاء مسودة سؤال","Create question draft")}</h2>
                <span className="pill">{t("الإجابة الصحيحة محفوظة في الخادم","Answer keys are stored on the server")}</span>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <label>
                  <small>{t("الدرس","Lesson")}</small>
                  <select
                    className="model-select"
                    style={{ width: "100%", marginTop: 5 }}
                    value={lessonId}
                    onChange={(e) => setLessonId(e.target.value)}
                  >
                    {lessons.map((x) => (
                      <option value={x.id} key={x.id}>
                        {locale==="en"?x.title_en:x.title_ar}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <small>{t("المهارة","Skill")}</small>
                  <select
                    className="model-select"
                    style={{ width: "100%", marginTop: 5 }}
                    value={skillId}
                    onChange={(e) => setSkillId(e.target.value)}
                  >
                    {skills.map((x) => (
                      <option value={x.id} key={x.id}>
                        {locale==="en"?x.title_en:x.title_ar}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <small>{t("النوع","Type")}</small>
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
                    <option value="multiple-choice">{t("اختيار من متعدد","Multiple choice")}</option>
                    <option value="numeric">{t("إجابة رقمية","Numeric answer")}</option>
                  </select>
                </label>
                <textarea
                  className="search"
                  style={{ width: "100%", minHeight: 74, paddingTop: 12 }}
                  value={promptAr}
                  onChange={(e) => setPromptAr(e.target.value)}
                  placeholder={t("السؤال بالعربية","Question in Arabic")}
                  aria-label={t("السؤال بالعربية","Question in Arabic")}
                />
                <textarea
                  className="search"
                  style={{ width: "100%", minHeight: 74, paddingTop: 12 }}
                  value={promptEn}
                  onChange={(e) => setPromptEn(e.target.value)}
                  placeholder={t("السؤال بالإنجليزية","Question in English")}
                  aria-label={t("السؤال بالإنجليزية","Question in English")}
                />
                {questionType === "multiple-choice" && (
                  <>
                    <textarea
                      className="search"
                      style={{ width: "100%", minHeight: 90, paddingTop: 12 }}
                      value={choicesAr}
                      onChange={(e) => setChoicesAr(e.target.value)}
                      placeholder={t("الخيارات العربية · خيار في كل سطر","Arabic options · One per line")}
                      aria-label={t("الخيارات العربية","Arabic options")}
                    />
                    <textarea
                      className="search"
                      style={{ width: "100%", minHeight: 90, paddingTop: 12 }}
                      value={choicesEn}
                      onChange={(e) => setChoicesEn(e.target.value)}
                      placeholder={t("الخيارات الإنجليزية · خيار في كل سطر","English options · One per line")}
                      aria-label={t("الخيارات الإنجليزية","English options")}
                    />
                  </>
                )}
                <input
                  className="search"
                  style={{ width: "100%" }}
                  aria-label={t("الإجابة الصحيحة","Correct answer")}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={
                    questionType === "multiple-choice"
                      ? t("رقم الخيار الصحيح: 0، 1، 2…","Correct option index: 0, 1, 2…")
                      : t("الإجابة الرقمية الصحيحة","Correct numeric answer")
                  }
                />
                <textarea
                  className="search"
                  style={{ width: "100%", minHeight: 70, paddingTop: 12 }}
                  value={explanationAr}
                  onChange={(e) => setExplanationAr(e.target.value)}
                  placeholder={t("الشرح بعد التصحيح","Feedback explanation")}
                  aria-label={t("الشرح بعد التصحيح","Feedback explanation")}
                />
                <textarea
                  className="search"
                  style={{ width: "100%", minHeight: 70, paddingTop: 12 }}
                  value={explanationEn}
                  onChange={(e) => setExplanationEn(e.target.value)}
                  placeholder={t("الشرح بالإنجليزية","Explanation in English")}
                  aria-label={t("الشرح بالإنجليزية","Explanation in English")}
                />
                <button
                  disabled={busy}
                  className="btn"
                  style={{
                    background: "var(--accent)",
                    color: "var(--surface)",
                  }}
                >{t("إنشاء المسودة","Create draft")}</button>
              </div>
            </form>

            <aside className="panel">
              <div className="panel-head">
                <h2>{t("قواعد مراجعة المحتوى","Content review rules")}</h2>
                <span className="pill">{t("ضوابط على الخادم","Server authorization")}</span>
              </div>
              <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>{t("يبدأ المحتوى بمسودة، ثم المراجعة والاعتماد والنشر. مفاتيح الإجابات محفوظة على الخادم. النشر وإيقافه يتطلبان صلاحية الإدارة، وتُسجّل تغييرات الحالة في سجل النشاط.","Content moves through draft, review, approval, and publication. Answer keys stay on the server. Publishing requires admin access and status changes are recorded.")}</p>
            </aside>
          </section>

          <section className="panel" style={{ marginTop: 18 }}>
            <div className="panel-head">
              <h2>{t("قائمة المحتوى","Content list")}</h2>
              <span className="pill">{visibleQuestions.length} / {questions.length} {locale==="en"?(questions.length===1?"question":"questions"):"\u0633\u0624\u0627\u0644"}</span>
            </div>
            <div className="noata-staff-list-tools">
              <label className="noata-staff-search">
                <span>{t("البحث في المحتوى","Search content")}</span>
                <input
                  className="search"
                  type="search"
                  value={contentSearch}
                  onChange={(event) => setContentSearch(event.target.value)}
                  placeholder={t("نص السؤال أو حالة المحتوى","Question text or content status")}
                  aria-label={t("البحث في المحتوى","Search content")}
                />
              </label>
            </div>
            <div className="quest-list">
              {visibleQuestions.slice(0, 30).map((q, i) => {
                const action = actionFor(q);
                return (
                  <div className="quest" key={q.id}>
                    <div className="quest-icon">{i + 1}</div>
                    <div>
                      <h3>{locale==="en"?q.prompt_en:q.prompt_ar}</h3>
                      <p>
                        {(
                          {
                            draft: t("مسودة","Draft"),
                            in_review: t("قيد المراجعة","Under review"),
                            approved: t("معتمد","Approved"),
                            rejected: t("مرفوض","Rejected"),
                          } as Record<string, string>
                        )[q.review_status] ?? t("حالة غير معروفة","Unknown status")}{" "}
                        ·{" "}
                        {(
                          {
                            draft: t("\u0645\u0633\u0648\u062f\u0629","Draft"),
                            published_demo: t("\u0645\u0646\u0634\u0648\u0631 \u062a\u0648\u0636\u064a\u062d\u064a","Published demo"),
                            unpublished: t("غير منشور","Unpublished"),
                            published: t("منشور","Published"),
                            retired: t("متوقف","Paused"),
                          } as Record<string, string>
                        )[q.publication_status] ?? t("حالة غير معروفة","Unknown status")}{" "}
                        ·{" "}
                        {q.question_type === "multiple-choice"
                          ? t("اختيار متعدد","Multiple choice")
                          : t("إجابة رقمية","Numeric answer")}
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
                        >{t("إعادة للمراجعة","Return for review")}</button>
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
              {!visibleQuestions.length && (
                <div className="noata-staff-empty">{contentSearch.trim()
                  ? t("لا توجد نتائج مطابقة للبحث.","No content matches your search.")
                  : t("لا يوجد محتوى لعرضه بعد.","There is no content to display yet.")}</div>
              )}
              {visibleQuestions.length > 30 && (
                <p className="noata-staff-list-note">{t("نعرض أول ٣٠ نتيجة. أضف كلمات للبحث لتضييق القائمة.","Showing the first 30 results. Search to narrow the list.")}</p>
              )}
            </div>
          </section>
        </>
      )}

      {tab === "curriculum" && <CurriculumManager />}
      {tab === "operations" && <OperationsLive />}

      {tab === "users" && (
        <section className="panel" style={{ marginTop: 18 }}>
          <div className="panel-head">
            <h2>{t("الحسابات والصلاحيات","Accounts and permissions")}</h2>
            <span className="pill">{t("صلاحيات الحساب","Account permissions")}</span>
          </div>
          <input
            className="search"
            placeholder={t("ابحث بالاسم أو الدور…","Search by name or role…")}
            aria-label={t("ابحث بالاسم أو الدور…","Search by name or role…")}
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
                    aria-label={t("دور حساب ","Account role ") + (p.display_name || t("المستخدم","User"))}
                    value={p.role}
                    disabled={busy}
                    onChange={(e) =>
                      void changeRole(p, e.target.value as Profile["role"])
                    }
                  >
                    <option value="student">{t("طالب","Student")}</option>
                    <option value="teacher">{t("معلّم","Teacher")}</option>
                    <option value="admin">{t("إدارة","Admin")}</option>
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
                <h2>{t("إنشاء الصفّ","Create class")}</h2>
                <span className="pill">{t("للإدارة فقط","Admins only")}</span>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <input
                  className="search"
                  style={{ width: "100%" }}
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder={t("اسم الصفّ","Class name")}
                  aria-label={t("اسم الصفّ","Class name")}
                />
                <input
                  className="search"
                  style={{ width: "100%" }}
                  value={gradeLabel}
                  onChange={(e) => setGradeLabel(e.target.value)}
                  placeholder={t("المرحلة الدراسية","Grade level")}
                  aria-label={t("المرحلة الدراسية","Grade level")}
                />
                <input
                  className="search"
                  style={{ width: "100%" }}
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder={t("العام الدراسي","Academic year")}
                  aria-label={t("العام الدراسي","Academic year")}
                />
                <button
                  disabled={busy}
                  className="btn"
                  style={{
                    background: "var(--accent)",
                    color: "var(--surface)",
                  }}
                >{t("إنشاء الصفّ","Create class")}</button>
              </div>
            </form>

            <aside className="panel">
              <div className="panel-head">
                <h2>{t("منح الوصول إلى الصفّ","Grant class access")}</h2>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <select
                  className="model-select"
                  aria-label={t("اختر الصفّ لمنح الوصول","Select a class")}
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
                  aria-label={t("اختر الحساب لمنح الوصول","Select an account")}
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
                >{t("منح الوصول","Grant access")}</button>
              </div>
            </aside>
          </section>

          <div className="noata-staff-list-tools" style={{ marginTop: 18 }}>
            <label className="noata-staff-search">
              <span>{t("البحث في الصفوف","Search classes")}</span>
              <input
                className="search"
                type="search"
                value={classSearch}
                onChange={(event) => setClassSearch(event.target.value)}
                placeholder={t("اسم الصف أو المرحلة أو السنة","Class, grade or academic year")}
                aria-label={t("البحث في الصفوف","Search classes")}
              />
            </label>
          </div>
          <section style={{ display: "grid", gap: 14, marginTop: 0 }}>
            {visibleClasses.map((c) => {
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
                      {students.length}{t("طالب ·","Student ·")}{teachers.length}{t("معلّم","Teacher")}</span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                      gap: 10,
                    }}
                  >
                    <div>
                      <b>{t("الطلاب","Students")}</b>
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
                          >{t("إزالة الوصول","Remove access")}</button>
                        </div>
                      ))}
                    </div>
                    <div>
                      <b>{t("المعلّمون","Teachers")}</b>
                      {teachers.map((teacher) => (
                        <div
                          key={teacher.teacher_id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 8,
                            padding: "8px 0",
                            borderBottom: "1px solid var(--line)",
                          }}
                        >
                          <span>
                            {profiles.find((p) => p.id === teacher.teacher_id)
                              ?.display_name || "Teacher"}
                          </span>
                          <button
                            onClick={() =>
                              void removeTeacher(c.id, teacher.teacher_id)
                            }
                            style={{
                              border: 0,
                              background: "transparent",
                              color: "var(--danger)",
                            }}
                          >{t("إزالة الوصول","Remove access")}</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
            {!visibleClasses.length && (
              <div className="noata-staff-empty">{classSearch.trim()
                ? t("لا توجد صفوف مطابقة للبحث.","No classes match your search.")
                : t("لم تُنشأ صفوف بعد.","No classes have been created yet.")}</div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
