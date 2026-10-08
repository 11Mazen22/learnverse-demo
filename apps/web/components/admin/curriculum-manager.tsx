"use client";

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
          "تعذّر تحميل بيانات المنهج. حاول مرة أخرى عند عودة الاتصال.",
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
      (refreshed ? "" : " — تعذّر تحديث المنهج؛ راجعه قبل تكرار العملية.")
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
      const success = "تم إنشاء المسار ✓";
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
      setStatus("ترتيب المحتوى يجب أن يكون عددًا صحيحًا موجبًا.");
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
      const success = "تم إنشاء الوحدة ✓";
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
      setStatus("ترتيب المحتوى يجب أن يكون عددًا صحيحًا موجبًا.");
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
      setStatus("قيمة المكافآت يجب أن تكون عددًا صحيحًا بين ٠ و١٠٠٠.");
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
      const success = "تم إنشاء الدرس ✓";
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
      const success = "تم إنشاء المهارة ✓";
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
      const success = course.active ? "تم إيقاف المسار ✓" : "تم تفعيل المسار ✓";
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
        >
          إعادة المحاولة
        </button>
      </section>
    );
  if (account.loading || loading)
    return (
      <section className="aura-loading-state" role="status">
        <span />
        <h2>بنجهّز محرر المنهج…</h2>
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
            <h2>المسار</h2>
            <span className="pill">نقطة بداية المنهج</span>
          </div>
          <div style={{ display: "grid", gap: 9 }}>
            <input
              className="search"
              style={{ width: "100%" }}
              value={courseAr}
              onChange={(e) => setCourseAr(e.target.value)}
              placeholder="اسم المادة / المسار"
              aria-label="اسم المادة / المسار"
            />
            <input
              className="search"
              style={{ width: "100%" }}
              value={courseEn}
              onChange={(e) => setCourseEn(e.target.value)}
              placeholder="عنوان المسار بالإنجليزية"
              aria-label="عنوان المسار بالإنجليزية"
            />
            <textarea
              className="search"
              style={{ width: "100%", minHeight: 70, paddingTop: 10 }}
              value={courseDescAr}
              onChange={(e) => setCourseDescAr(e.target.value)}
              placeholder="الوصف بالعربية"
              aria-label="الوصف بالعربية"
            />
            <textarea
              className="search"
              style={{ width: "100%", minHeight: 70, paddingTop: 10 }}
              value={courseDescEn}
              onChange={(e) => setCourseDescEn(e.target.value)}
              placeholder="الوصف بالإنجليزية"
              aria-label="الوصف بالإنجليزية"
            />
            <button
              disabled={busy}
              className="btn"
              style={{ background: "var(--accent)", color: "var(--surface)" }}
            >
              إنشاء المسار
            </button>
          </div>
        </form>

        <form className="panel" onSubmit={createUnit}>
          <div className="panel-head">
            <h2>الوحدة</h2>
            <span className="pill">بنية المسار</span>
          </div>
          <div style={{ display: "grid", gap: 9 }}>
            <select
              className="model-select"
              aria-label="مسار الوحدة"
              value={unitCourse}
              onChange={(e) => setUnitCourse(e.target.value)}
            >
              {courses.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.title_ar}
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
              placeholder="الترتيب"
              aria-label="الترتيب"
            />
            <input
              className="search"
              style={{ width: "100%" }}
              value={unitAr}
              onChange={(e) => setUnitAr(e.target.value)}
              placeholder="اسم الوحدة"
              aria-label="اسم الوحدة"
            />
            <input
              className="search"
              style={{ width: "100%" }}
              value={unitEn}
              onChange={(e) => setUnitEn(e.target.value)}
              placeholder="عنوان الوحدة بالإنجليزية"
              aria-label="عنوان الوحدة بالإنجليزية"
            />
            <textarea
              className="search"
              style={{ width: "100%", minHeight: 60, paddingTop: 10 }}
              value={unitDescAr}
              onChange={(e) => setUnitDescAr(e.target.value)}
              placeholder="الوصف"
              aria-label="الوصف"
            />
            <textarea
              className="search"
              style={{ width: "100%", minHeight: 60, paddingTop: 10 }}
              value={unitDescEn}
              onChange={(e) => setUnitDescEn(e.target.value)}
              placeholder="الوصف بالإنجليزية"
              aria-label="الوصف بالإنجليزية"
            />
            <button
              disabled={busy || !courses.length}
              className="btn"
              style={{ background: "var(--accent)", color: "var(--surface)" }}
            >
              إنشاء الوحدة
            </button>
          </div>
        </form>

        <form className="panel" onSubmit={createSkill}>
          <div className="panel-head">
            <h2>المهارة</h2>
            <span className="pill">هدف الإتقان</span>
          </div>
          <div style={{ display: "grid", gap: 9 }}>
            <select
              className="model-select"
              aria-label="مسار المهارة"
              value={skillCourse}
              onChange={(e) => setSkillCourse(e.target.value)}
            >
              {courses.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.title_ar}
                </option>
              ))}
            </select>
            <input
              className="search"
              style={{ width: "100%" }}
              value={skillAr}
              onChange={(e) => setSkillAr(e.target.value)}
              placeholder="اسم المهارة"
              aria-label="اسم المهارة"
            />
            <input
              className="search"
              style={{ width: "100%" }}
              value={skillEn}
              onChange={(e) => setSkillEn(e.target.value)}
              placeholder="المهارة بالإنجليزية"
              aria-label="المهارة بالإنجليزية"
            />
            <button
              disabled={busy || !courses.length}
              className="btn"
              style={{ background: "var(--accent)", color: "var(--surface)" }}
            >
              إنشاء مهارة
            </button>
          </div>
        </form>
      </section>

      <form className="panel" onSubmit={createLesson} style={{ marginTop: 18 }}>
        <div className="panel-head">
          <h2>الدرس</h2>
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
            aria-label="وحدة الدرس"
            value={lessonUnit}
            onChange={(e) => setLessonUnit(e.target.value)}
          >
            {units.map((u) => (
              <option value={u.id} key={u.id}>
                {u.title_ar}
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
            placeholder="الترتيب"
            aria-label="الترتيب"
          />
          <input
            className="search"
            style={{ width: "100%" }}
            value={lessonAr}
            onChange={(e) => setLessonAr(e.target.value)}
            placeholder="عنوان الدرس"
            aria-label="عنوان الدرس"
          />
          <input
            className="search"
            style={{ width: "100%" }}
            value={lessonEn}
            onChange={(e) => setLessonEn(e.target.value)}
            placeholder="عنوان الدرس بالإنجليزية"
            aria-label="عنوان الدرس بالإنجليزية"
          />
          <textarea
            className="search"
            style={{ width: "100%", minHeight: 85, paddingTop: 10 }}
            value={summaryAr}
            onChange={(e) => setSummaryAr(e.target.value)}
            placeholder="شرح الفكرة بالعربية"
            aria-label="شرح الفكرة بالعربية"
          />
          <textarea
            className="search"
            style={{ width: "100%", minHeight: 85, paddingTop: 10 }}
            value={summaryEn}
            onChange={(e) => setSummaryEn(e.target.value)}
            placeholder="الشرح بالإنجليزية"
            aria-label="الشرح بالإنجليزية"
          />
          <textarea
            className="search"
            style={{ width: "100%", minHeight: 85, paddingTop: 10 }}
            value={workedAr}
            onChange={(e) => setWorkedAr(e.target.value)}
            placeholder="مثال محلول"
            aria-label="مثال محلول"
          />
          <textarea
            className="search"
            style={{ width: "100%", minHeight: 85, paddingTop: 10 }}
            value={workedEn}
            onChange={(e) => setWorkedEn(e.target.value)}
            placeholder="المثال المحلول بالإنجليزية"
            aria-label="المثال المحلول بالإنجليزية"
          />
          <input
            className="search"
            style={{ width: "100%" }}
            type="number"
            min={0}
            value={xpReward}
            onChange={(e) => setXpReward(e.target.value)}
            placeholder="نقاط الخبرة"
            aria-label="نقاط الخبرة"
          />
          <input
            className="search"
            style={{ width: "100%" }}
            type="number"
            min={0}
            value={coinReward}
            onChange={(e) => setCoinReward(e.target.value)}
            placeholder="العملات"
            aria-label="العملات"
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
        >
          إنشاء درس
        </button>
      </form>

      <section style={{ display: "grid", gap: 14, marginTop: 18 }}>
        {courses.map((course) => (
          <article className="panel" key={course.id}>
            <div className="panel-head">
              <div>
                <h2>{course.title_ar}</h2>
                <p style={{ margin: "4px 0", color: "var(--muted)" }}>
                  {course.title_en} · {course.slug}
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
                {course.active ? "إيقاف" : "تفعيل"}
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
                        <h3>{unit.title_ar}</h3>
                        <p>{unit.title_en}</p>
                      </div>
                      <span className="pill">
                        {lessons.filter((l) => l.unit_id === unit.id).length}{" "}
                        دروس
                      </span>
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
                            {l.position}. {l.title_ar}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
            <small
              style={{ display: "block", marginTop: 12, color: "var(--muted)" }}
            >
              {skills.filter((s) => s.course_id === course.id).length} mastery
              المهارات
            </small>
          </article>
        ))}
      </section>
    </>
  );
}
