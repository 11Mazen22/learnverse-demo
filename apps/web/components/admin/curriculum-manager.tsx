"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";

import { useUnsavedWork } from "@/lib/use-unsaved-work";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { boundedRead } from "@/lib/supabase/use-verified-account";
import { useConfirmedMutation } from "@/lib/supabase/use-confirmed-mutation";
import { createClient } from "@/lib/supabase/client";

type Course = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  active: boolean;
};
type Unit = {
  id: string;
  course_id: string;
  position: number;
  title_ar: string;
  title_en: string;
};
type Lesson = {
  id: string;
  unit_id: string;
  position: number;
  slug: string;
  title_ar: string;
  title_en: string;
};
type Skill = {
  id: string;
  course_id: string;
  slug: string;
  title_ar: string;
  title_en: string;
};

export function CurriculumManager() {
 const t=useTranslation(),locale=useLocale();
  const supabase = useMemo(() => createClient(), []);
  const [courses, setCourses] = useState<Course[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const { account, busy, status, setStatus, run } = useConfirmedMutation();
  const [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState("");

  const [courseAr, setCourseAr] = useState("");
  const [courseEn, setCourseEn] = useState("");
  const [courseDescAr, setCourseDescAr] = useState("");
  const [courseDescEn, setCourseDescEn] = useState("");

  const [unitCourse, setUnitCourse] = useState("");
  const [unitPos, setUnitPos] = useState("1");
  const [unitAr, setUnitAr] = useState("");
  const [unitEn, setUnitEn] = useState("");
  const [unitDescAr, setUnitDescAr] = useState("");
  const [unitDescEn, setUnitDescEn] = useState("");

  const [lessonUnit, setLessonUnit] = useState("");
  const [lessonPos, setLessonPos] = useState("1");
  const [lessonAr, setLessonAr] = useState("");
  const [lessonEn, setLessonEn] = useState("");
  const [summaryAr, setSummaryAr] = useState("");
  const [summaryEn, setSummaryEn] = useState("");
  const [workedAr, setWorkedAr] = useState("");
  const [workedEn, setWorkedEn] = useState("");
  const [xpReward, setXpReward] = useState("15");
  const [coinReward, setCoinReward] = useState("25");

  const [skillCourse, setSkillCourse] = useState("");
  const [skillAr, setSkillAr] = useState("");
  const [skillEn, setSkillEn] = useState("");

  useUnsavedWork(
    Boolean(
      account.user &&
        (courseAr ||
          courseEn ||
          courseDescAr ||
          courseDescEn ||
          unitAr ||
          unitEn ||
          unitDescAr ||
          unitDescEn ||
          lessonAr ||
          lessonEn ||
          summaryAr ||
          summaryEn ||
          workedAr ||
          workedEn ||
          skillAr ||
          skillEn),
    ),
  );
  function slugify(value: string) {
    const ascii = value
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return ascii || "noata-" + Date.now().toString(36);
  }

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
            .from("courses")
            .select("id,slug,title_ar,title_en,active")
            .order("created_at"),
          supabase
            .from("units")
            .select("id,course_id,position,title_ar,title_en")
            .order("position"),
          supabase
            .from("lessons")
            .select("id,unit_id,position,slug,title_ar,title_en")
            .order("position"),
          supabase
            .from("skills")
            .select("id,course_id,slug,title_ar,title_en")
            .order("title_ar"),
        ]),
      );
      if (token !== account.revision.current) return false;
      const failed = results.find((r) => r.error);
      if (failed) throw failed.error;
      const [c, u, l, s] = results,
        cr = (c.data ?? []) as Course[],
        ur = (u.data ?? []) as Unit[];
      setCourses(cr);
      setUnits(ur);
      setLessons((l.data ?? []) as Lesson[]);
      setSkills((s.data ?? []) as Skill[]);
      if (!unitCourse && cr[0]) setUnitCourse(cr[0].id);
      if (!skillCourse && cr[0]) setSkillCourse(cr[0].id);
      if (!lessonUnit && ur[0]) setLessonUnit(ur[0].id);
      return true;
    } catch {
      if (token === account.revision.current)
        setLoadError(
          t("تعذّر تحميل بيانات المنهج. حاول مرة أخرى عند عودة الاتصال.","Could not load the curriculum. Try again when your connection returns."),
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
      (refreshed ? "" : t(" — تعذّر تحديث المنهج؛ راجعه قبل تكرار العملية."," — Could not refresh the curriculum. Check it before repeating the action."))
    );
  }

  async function createCourse(e: FormEvent) {
    e.preventDefault();
    if (!courseAr.trim() || !courseEn.trim()) return;
    await run(async (check) => {
      const { error } = await supabase
        .from("courses")
        .insert({
          slug: slugify(courseEn),
          title_ar: courseAr.trim(),
          title_en: courseEn.trim(),
          description_ar: courseDescAr.trim(),
          description_en: courseDescEn.trim(),
          active: true,
          metadata: { source: "admin-studio" },
        })
        .select("id")
        .single();
      check();
      if (error) throw error;
      const success = t("تم إنشاء المسار ✓","Learning path created ✓");
      if (!error) {
        setCourseAr("");
        setCourseEn("");
        setCourseDescAr("");
        setCourseDescEn("");
      }
      return refreshMessage(check, success);
    });
  }

  async function createUnit(e: FormEvent) {
    e.preventDefault();
    if (!unitCourse || !unitAr.trim() || !unitEn.trim()) return;
    if (!Number.isInteger(Number(unitPos)) || Number(unitPos) < 1) {
      setStatus(t("ترتيب المحتوى يجب أن يكون عددًا صحيحًا موجبًا.","Content position must be a positive whole number."));
      return;
    }
    await run(async (check) => {
      const { error } = await supabase
        .from("units")
        .insert({
          course_id: unitCourse,
          position: Number(unitPos),
          title_ar: unitAr.trim(),
          title_en: unitEn.trim(),
          description_ar: unitDescAr.trim(),
          description_en: unitDescEn.trim(),
          boss_enabled: true,
          metadata: { source: "admin-studio" },
        })
        .select("id")
        .single();
      check();
      if (error) throw error;
      const success = t("تم إنشاء الوحدة ✓","Unit created ✓");
      if (!error) {
        setUnitAr("");
        setUnitEn("");
        setUnitDescAr("");
        setUnitDescEn("");
        setUnitPos(String(Number(unitPos) + 1));
      }
      return refreshMessage(check, success);
    });
  }

  async function createLesson(e: FormEvent) {
    e.preventDefault();
    if (!lessonUnit || !lessonAr.trim() || !lessonEn.trim()) return;
    if (!Number.isInteger(Number(lessonPos)) || Number(lessonPos) < 1) {
      setStatus(t("ترتيب المحتوى يجب أن يكون عددًا صحيحًا موجبًا.","Content position must be a positive whole number."));
      return;
    }
    if (
      ![xpReward, coinReward].every(
        (v) =>
          v.trim() &&
          Number.isInteger(Number(v)) &&
          Number(v) >= 0 &&
          Number(v) <= 1000,
      )
    ) {
      setStatus(t("قيمة المكافآت يجب أن تكون عددًا صحيحًا بين ٠ و١٠٠٠.","Rewards must be whole numbers from 0 to 1,000."));
      return;
    }
    await run(async (check) => {
      const { error } = await supabase
        .from("lessons")
        .insert({
          unit_id: lessonUnit,
          position: Number(lessonPos),
          slug: slugify(lessonEn),
          title_ar: lessonAr.trim(),
          title_en: lessonEn.trim(),
          content: {
            summary_ar: summaryAr.trim(),
            summary_en: summaryEn.trim(),
            worked_ar: workedAr.trim(),
            worked_en: workedEn.trim(),
            duration_minutes: 7,
            source: "admin-studio",
          },
          xp_reward: Number(xpReward),
          coin_reward: Number(coinReward),
        })
        .select("id")
        .single();
      check();
      if (error) throw error;
      const success = t("تم إنشاء الدرس ✓","Lesson created ✓");
      if (!error) {
        setLessonAr("");
        setLessonEn("");
        setSummaryAr("");
        setSummaryEn("");
        setWorkedAr("");
        setWorkedEn("");
        setLessonPos(String(Number(lessonPos) + 1));
      }
      return refreshMessage(check, success);
    });
  }

  async function createSkill(e: FormEvent) {
    e.preventDefault();
    if (!skillCourse || !skillAr.trim() || !skillEn.trim()) return;
    await run(async (check) => {
      const { error } = await supabase
        .from("skills")
        .insert({
          course_id: skillCourse,
          slug: slugify(skillEn),
          title_ar: skillAr.trim(),
          title_en: skillEn.trim(),
        })
        .select("id")
        .single();
      check();
      if (error) throw error;
      const success = t("تم إنشاء المهارة ✓","Skill created ✓");
      if (!error) {
        setSkillAr("");
        setSkillEn("");
      }
      return refreshMessage(check, success);
    });
  }

  async function toggleCourse(course: Course) {
    await run(async (check) => {
      const { error } = await supabase
        .from("courses")
        .update({ active: !course.active })
        .eq("id", course.id)
        .select("id")
        .single();
      check();
      if (error) throw error;
      const success = course.active ? t("تم إيقاف المسار ✓","Learning path paused ✓") : t("تم تفعيل المسار ✓","Learning path activated ✓");
      return refreshMessage(check, success);
    });
  }

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
        <h2>{t("بنجهّز محرر المنهج…","Loading the curriculum editor…")}</h2>
      </section>
    );
  return (
    <>
      {status && (
        <div
          className="panel"
          style={{
            marginTop: 14,
            padding: 14,
            color: status.includes("✓") ? "var(--success)" : "var(--muted)",
          }}
        >
          {status}
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))",
          gap: 16,
          marginTop: 18,
        }}
      >
        <form className="panel" onSubmit={createCourse}>
          <div className="panel-head">
            <h2>{t("المسار","Learning path")}</h2>
            <span className="pill">{t("نقطة بداية المنهج","Curriculum starting point")}</span>
          </div>
          <div style={{ display: "grid", gap: 9 }}>
            <input
              className="search"
              style={{ width: "100%" }}
              value={courseAr}
              onChange={(e) => setCourseAr(e.target.value)}
              placeholder={t("اسم المادة / المسار","Subject or learning path name")}
              aria-label={t("اسم المادة / المسار","Subject or learning path name")}
            />
            <input
              className="search"
              style={{ width: "100%" }}
              value={courseEn}
              onChange={(e) => setCourseEn(e.target.value)}
              placeholder={t("عنوان المسار بالإنجليزية","Learning path title in English")}
              aria-label={t("عنوان المسار بالإنجليزية","Learning path title in English")}
            />
            <textarea
              className="search"
              style={{ width: "100%", minHeight: 70, paddingTop: 10 }}
              value={courseDescAr}
              onChange={(e) => setCourseDescAr(e.target.value)}
              placeholder={t("الوصف بالعربية","Description in Arabic")}
              aria-label={t("الوصف بالعربية","Description in Arabic")}
            />
            <textarea
              className="search"
              style={{ width: "100%", minHeight: 70, paddingTop: 10 }}
              value={courseDescEn}
              onChange={(e) => setCourseDescEn(e.target.value)}
              placeholder={t("الوصف بالإنجليزية","Description in English")}
              aria-label={t("الوصف بالإنجليزية","Description in English")}
            />
            <button
              disabled={busy}
              className="btn"
              style={{ background: "var(--accent)", color: "var(--surface)" }}
            >{t("إنشاء المسار","Create learning path")}</button>
          </div>
        </form>

        <form className="panel" onSubmit={createUnit}>
          <div className="panel-head">
            <h2>{t("الوحدة","Unit")}</h2>
            <span className="pill">{t("بنية المسار","Path structure")}</span>
          </div>
          <div style={{ display: "grid", gap: 9 }}>
            <select
              className="model-select"
              aria-label={t("مسار الوحدة","Unit’s learning path")}
              value={unitCourse}
              onChange={(e) => setUnitCourse(e.target.value)}
            >
              {courses.map((c) => (
                <option value={c.id} key={c.id}>
                  {locale==="en"?c.title_en:c.title_ar}
                </option>
              ))}
            </select>
            <input
              className="search"
              style={{ width: "100%" }}
              type="number"
              min={1}
              value={unitPos}
              onChange={(e) => setUnitPos(e.target.value)}
              placeholder={t("الترتيب","Position")}
              aria-label={t("الترتيب","Position")}
            />
            <input
              className="search"
              style={{ width: "100%" }}
              value={unitAr}
              onChange={(e) => setUnitAr(e.target.value)}
              placeholder={t("اسم الوحدة","Unit name")}
              aria-label={t("اسم الوحدة","Unit name")}
            />
            <input
              className="search"
              style={{ width: "100%" }}
              value={unitEn}
              onChange={(e) => setUnitEn(e.target.value)}
              placeholder={t("عنوان الوحدة بالإنجليزية","Unit title in English")}
              aria-label={t("عنوان الوحدة بالإنجليزية","Unit title in English")}
            />
            <textarea
              className="search"
              style={{ width: "100%", minHeight: 60, paddingTop: 10 }}
              value={unitDescAr}
              onChange={(e) => setUnitDescAr(e.target.value)}
              placeholder={t("الوصف","Description")}
              aria-label={t("الوصف","Description")}
            />
            <textarea
              className="search"
              style={{ width: "100%", minHeight: 60, paddingTop: 10 }}
              value={unitDescEn}
              onChange={(e) => setUnitDescEn(e.target.value)}
              placeholder={t("الوصف بالإنجليزية","Description in English")}
              aria-label={t("الوصف بالإنجليزية","Description in English")}
            />
            <button
              disabled={busy || !courses.length}
              className="btn"
              style={{ background: "var(--accent)", color: "var(--surface)" }}
            >{t("إنشاء الوحدة","Create unit")}</button>
          </div>
        </form>

        <form className="panel" onSubmit={createSkill}>
          <div className="panel-head">
            <h2>{t("المهارة","Skill")}</h2>
            <span className="pill">{t("هدف الإتقان","Mastery goal")}</span>
          </div>
          <div style={{ display: "grid", gap: 9 }}>
            <select
              className="model-select"
              aria-label={t("مسار المهارة","Skill’s learning path")}
              value={skillCourse}
              onChange={(e) => setSkillCourse(e.target.value)}
            >
              {courses.map((c) => (
                <option value={c.id} key={c.id}>
                  {locale==="en"?c.title_en:c.title_ar}
                </option>
              ))}
            </select>
            <input
              className="search"
              style={{ width: "100%" }}
              value={skillAr}
              onChange={(e) => setSkillAr(e.target.value)}
              placeholder={t("اسم المهارة","Skill name")}
              aria-label={t("اسم المهارة","Skill name")}
            />
            <input
              className="search"
              style={{ width: "100%" }}
              value={skillEn}
              onChange={(e) => setSkillEn(e.target.value)}
              placeholder={t("المهارة بالإنجليزية","Skill in English")}
              aria-label={t("المهارة بالإنجليزية","Skill in English")}
            />
            <button
              disabled={busy || !courses.length}
              className="btn"
              style={{ background: "var(--accent)", color: "var(--surface)" }}
            >{t("إنشاء مهارة","Create skill")}</button>
          </div>
        </form>
      </section>

      <form className="panel" onSubmit={createLesson} style={{ marginTop: 18 }}>
        <div className="panel-head">
          <h2>{t("الدرس","Lesson")}</h2>
          <span className="pill">Concept → example → mission</span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 10,
          }}
        >
          <select
            className="model-select"
            aria-label={t("وحدة الدرس","Lesson’s unit")}
            value={lessonUnit}
            onChange={(e) => setLessonUnit(e.target.value)}
          >
            {units.map((u) => (
              <option value={u.id} key={u.id}>
                {locale==="en"?u.title_en:u.title_ar}
              </option>
            ))}
          </select>
          <input
            className="search"
            style={{ width: "100%" }}
            type="number"
            min={1}
            value={lessonPos}
            onChange={(e) => setLessonPos(e.target.value)}
            placeholder={t("الترتيب","Position")}
            aria-label={t("الترتيب","Position")}
          />
          <input
            className="search"
            style={{ width: "100%" }}
            value={lessonAr}
            onChange={(e) => setLessonAr(e.target.value)}
            placeholder={t("عنوان الدرس","Lesson title")}
            aria-label={t("عنوان الدرس","Lesson title")}
          />
          <input
            className="search"
            style={{ width: "100%" }}
            value={lessonEn}
            onChange={(e) => setLessonEn(e.target.value)}
            placeholder={t("عنوان الدرس بالإنجليزية","Lesson title in English")}
            aria-label={t("عنوان الدرس بالإنجليزية","Lesson title in English")}
          />
          <textarea
            className="search"
            style={{ width: "100%", minHeight: 85, paddingTop: 10 }}
            value={summaryAr}
            onChange={(e) => setSummaryAr(e.target.value)}
            placeholder={t("شرح الفكرة بالعربية","Explanation in Arabic")}
            aria-label={t("شرح الفكرة بالعربية","Explanation in Arabic")}
          />
          <textarea
            className="search"
            style={{ width: "100%", minHeight: 85, paddingTop: 10 }}
            value={summaryEn}
            onChange={(e) => setSummaryEn(e.target.value)}
            placeholder={t("الشرح بالإنجليزية","Explanation in English")}
            aria-label={t("الشرح بالإنجليزية","Explanation in English")}
          />
          <textarea
            className="search"
            style={{ width: "100%", minHeight: 85, paddingTop: 10 }}
            value={workedAr}
            onChange={(e) => setWorkedAr(e.target.value)}
            placeholder={t("مثال محلول","Worked example")}
            aria-label={t("مثال محلول","Worked example")}
          />
          <textarea
            className="search"
            style={{ width: "100%", minHeight: 85, paddingTop: 10 }}
            value={workedEn}
            onChange={(e) => setWorkedEn(e.target.value)}
            placeholder={t("المثال المحلول بالإنجليزية","Worked example in English")}
            aria-label={t("المثال المحلول بالإنجليزية","Worked example in English")}
          />
          <input
            className="search"
            style={{ width: "100%" }}
            type="number"
            min={0}
            value={xpReward}
            onChange={(e) => setXpReward(e.target.value)}
            placeholder={t("نقاط الخبرة","Experience points")}
            aria-label={t("نقاط الخبرة","Experience points")}
          />
          <input
            className="search"
            style={{ width: "100%" }}
            type="number"
            min={0}
            value={coinReward}
            onChange={(e) => setCoinReward(e.target.value)}
            placeholder={t("العملات","Coins")}
            aria-label={t("العملات","Coins")}
          />
        </div>
        <button
          disabled={busy || !units.length}
          className="btn"
          style={{
            background: "var(--accent)",
            color: "var(--surface)",
            marginTop: 12,
          }}
        >{t("إنشاء درس","Create lesson")}</button>
      </form>

      <section style={{ display: "grid", gap: 14, marginTop: 18 }}>
        {courses.map((course) => (
          <article className="panel" key={course.id}>
            <div className="panel-head">
              <div>
                <h2>{locale==="en"?course.title_en:course.title_ar}</h2>
                <p style={{ margin: "4px 0", color: "var(--muted)" }}>
                  {locale==="en"?course.title_ar:course.title_en} · {course.slug}
                </p>
              </div>
              <button
                className="btn"
                disabled={busy}
                onClick={() => void toggleCourse(course)}
                style={{
                  background: course.active ? "#fff3e8" : "#e9f7f0",
                  color: course.active ? "#a65c16" : "var(--success)",
                }}
              >
                {course.active ? t("إيقاف","Pause") : t("تفعيل","Activate")}
              </button>
            </div>
            <div className="quest-list">
              {units
                .filter((u) => u.course_id === course.id)
                .map((unit) => (
                  <div key={unit.id}>
                    <div className="quest">
                      <div className="quest-icon">{unit.position}</div>
                      <div>
                        <h3>{locale==="en"?unit.title_en:unit.title_ar}</h3>
                        <p>{locale==="en"?unit.title_ar:unit.title_en}</p>
                      </div>
                      <span className="pill">
                        {lessons.filter((l) => l.unit_id === unit.id).length}{" "}{t("دروس","lessons")}</span>
                    </div>
                    <div
                      style={{
                        marginInlineStart: 62,
                        display: "grid",
                        gap: 7,
                        marginTop: 7,
                      }}
                    >
                      {lessons
                        .filter((l) => l.unit_id === unit.id)
                        .map((l) => (
                          <div
                            key={l.id}
                            style={{
                              padding: "9px 12px",
                              border: "1px solid var(--line)",
                              borderRadius: 12,
                              fontSize: 12,
                            }}
                          >
                            {l.position}. {locale==="en"?l.title_en:l.title_ar}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
            <small
              style={{ display: "block", marginTop: 12, color: "var(--muted)" }}
            >
              {skills.filter((s) => s.course_id === course.id).length}{t("mastery المهارات","Skills")}</small>
          </article>
        ))}
      </section>
    </>
  );
}
