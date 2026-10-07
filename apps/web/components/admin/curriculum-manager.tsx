"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

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
    const [{ data: c }, { data: u }, { data: l }, { data: s }] =
      await Promise.all([
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
      ]);
    const cr = (c ?? []) as Course[];
    const ur = (u ?? []) as Unit[];
    setCourses(cr);
    setUnits(ur);
    setLessons((l ?? []) as Lesson[]);
    setSkills((s ?? []) as Skill[]);
    if (!unitCourse && cr[0]) setUnitCourse(cr[0].id);
    if (!skillCourse && cr[0]) setSkillCourse(cr[0].id);
    if (!lessonUnit && ur[0]) setLessonUnit(ur[0].id);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createCourse(e: FormEvent) {
    e.preventDefault();
    if (!courseAr.trim() || !courseEn.trim()) return;
    setBusy(true);
    setStatus("");
    const { error } = await supabase.from("courses").insert({
      slug: slugify(courseEn),
      title_ar: courseAr.trim(),
      title_en: courseEn.trim(),
      description_ar: courseDescAr.trim(),
      description_en: courseDescEn.trim(),
      active: true,
      metadata: { source: "admin-studio" },
    });
    setStatus(error ? error.message : "Course created ✓");
    if (!error) {
      setCourseAr("");
      setCourseEn("");
      setCourseDescAr("");
      setCourseDescEn("");
    }
    await load();
    setBusy(false);
  }

  async function createUnit(e: FormEvent) {
    e.preventDefault();
    if (!unitCourse || !unitAr.trim() || !unitEn.trim()) return;
    setBusy(true);
    setStatus("");
    const { error } = await supabase.from("units").insert({
      course_id: unitCourse,
      position: Number(unitPos),
      title_ar: unitAr.trim(),
      title_en: unitEn.trim(),
      description_ar: unitDescAr.trim(),
      description_en: unitDescEn.trim(),
      boss_enabled: true,
      metadata: { source: "admin-studio" },
    });
    setStatus(error ? error.message : "Unit created ✓");
    if (!error) {
      setUnitAr("");
      setUnitEn("");
      setUnitDescAr("");
      setUnitDescEn("");
      setUnitPos(String(Number(unitPos) + 1));
    }
    await load();
    setBusy(false);
  }

  async function createLesson(e: FormEvent) {
    e.preventDefault();
    if (!lessonUnit || !lessonAr.trim() || !lessonEn.trim()) return;
    setBusy(true);
    setStatus("");
    const { error } = await supabase.from("lessons").insert({
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
    });
    setStatus(error ? error.message : "Lesson created ✓");
    if (!error) {
      setLessonAr("");
      setLessonEn("");
      setSummaryAr("");
      setSummaryEn("");
      setWorkedAr("");
      setWorkedEn("");
      setLessonPos(String(Number(lessonPos) + 1));
    }
    await load();
    setBusy(false);
  }

  async function createSkill(e: FormEvent) {
    e.preventDefault();
    if (!skillCourse || !skillAr.trim() || !skillEn.trim()) return;
    setBusy(true);
    setStatus("");
    const { error } = await supabase.from("skills").insert({
      course_id: skillCourse,
      slug: slugify(skillEn),
      title_ar: skillAr.trim(),
      title_en: skillEn.trim(),
    });
    setStatus(error ? error.message : "Skill created ✓");
    if (!error) {
      setSkillAr("");
      setSkillEn("");
    }
    await load();
    setBusy(false);
  }

  async function toggleCourse(course: Course) {
    setBusy(true);
    const { error } = await supabase
      .from("courses")
      .update({ active: !course.active })
      .eq("id", course.id);
    setStatus(
      error
        ? error.message
        : course.active
          ? "Course archived ✓"
          : "Course activated ✓",
    );
    await load();
    setBusy(false);
  }

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
            <h2>Course</h2>
            <span className="pill">Top level</span>
          </div>
          <div style={{ display: "grid", gap: 9 }}>
            <input
              className="search"
              style={{ width: "100%" }}
              value={courseAr}
              onChange={(e) => setCourseAr(e.target.value)}
              placeholder="اسم المادة / المسار"
            />
            <input
              className="search"
              style={{ width: "100%" }}
              value={courseEn}
              onChange={(e) => setCourseEn(e.target.value)}
              placeholder="Course title in English"
            />
            <textarea
              className="search"
              style={{ width: "100%", minHeight: 70, paddingTop: 10 }}
              value={courseDescAr}
              onChange={(e) => setCourseDescAr(e.target.value)}
              placeholder="الوصف بالعربية"
            />
            <textarea
              className="search"
              style={{ width: "100%", minHeight: 70, paddingTop: 10 }}
              value={courseDescEn}
              onChange={(e) => setCourseDescEn(e.target.value)}
              placeholder="English description"
            />
            <button
              disabled={busy}
              className="btn"
              style={{ background: "var(--accent)", color: "var(--surface)" }}
            >
              Create course
            </button>
          </div>
        </form>

        <form className="panel" onSubmit={createUnit}>
          <div className="panel-head">
            <h2>Unit</h2>
            <span className="pill">Course structure</span>
          </div>
          <div style={{ display: "grid", gap: 9 }}>
            <select
              className="model-select"
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
              placeholder="Position"
            />
            <input
              className="search"
              style={{ width: "100%" }}
              value={unitAr}
              onChange={(e) => setUnitAr(e.target.value)}
              placeholder="اسم الوحدة"
            />
            <input
              className="search"
              style={{ width: "100%" }}
              value={unitEn}
              onChange={(e) => setUnitEn(e.target.value)}
              placeholder="Unit title"
            />
            <textarea
              className="search"
              style={{ width: "100%", minHeight: 60, paddingTop: 10 }}
              value={unitDescAr}
              onChange={(e) => setUnitDescAr(e.target.value)}
              placeholder="الوصف"
            />
            <textarea
              className="search"
              style={{ width: "100%", minHeight: 60, paddingTop: 10 }}
              value={unitDescEn}
              onChange={(e) => setUnitDescEn(e.target.value)}
              placeholder="Description"
            />
            <button
              disabled={busy || !courses.length}
              className="btn"
              style={{ background: "var(--accent)", color: "var(--surface)" }}
            >
              Create unit
            </button>
          </div>
        </form>

        <form className="panel" onSubmit={createSkill}>
          <div className="panel-head">
            <h2>Skill</h2>
            <span className="pill">Mastery target</span>
          </div>
          <div style={{ display: "grid", gap: 9 }}>
            <select
              className="model-select"
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
            />
            <input
              className="search"
              style={{ width: "100%" }}
              value={skillEn}
              onChange={(e) => setSkillEn(e.target.value)}
              placeholder="Skill title"
            />
            <button
              disabled={busy || !courses.length}
              className="btn"
              style={{ background: "var(--accent)", color: "var(--surface)" }}
            >
              Create skill
            </button>
          </div>
        </form>
      </section>

      <form className="panel" onSubmit={createLesson} style={{ marginTop: 18 }}>
        <div className="panel-head">
          <h2>Lesson</h2>
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
            placeholder="Position"
          />
          <input
            className="search"
            style={{ width: "100%" }}
            value={lessonAr}
            onChange={(e) => setLessonAr(e.target.value)}
            placeholder="عنوان الدرس"
          />
          <input
            className="search"
            style={{ width: "100%" }}
            value={lessonEn}
            onChange={(e) => setLessonEn(e.target.value)}
            placeholder="Lesson title"
          />
          <textarea
            className="search"
            style={{ width: "100%", minHeight: 85, paddingTop: 10 }}
            value={summaryAr}
            onChange={(e) => setSummaryAr(e.target.value)}
            placeholder="شرح الفكرة بالعربية"
          />
          <textarea
            className="search"
            style={{ width: "100%", minHeight: 85, paddingTop: 10 }}
            value={summaryEn}
            onChange={(e) => setSummaryEn(e.target.value)}
            placeholder="English summary"
          />
          <textarea
            className="search"
            style={{ width: "100%", minHeight: 85, paddingTop: 10 }}
            value={workedAr}
            onChange={(e) => setWorkedAr(e.target.value)}
            placeholder="مثال محلول"
          />
          <textarea
            className="search"
            style={{ width: "100%", minHeight: 85, paddingTop: 10 }}
            value={workedEn}
            onChange={(e) => setWorkedEn(e.target.value)}
            placeholder="Worked example"
          />
          <input
            className="search"
            style={{ width: "100%" }}
            type="number"
            min={0}
            value={xpReward}
            onChange={(e) => setXpReward(e.target.value)}
            placeholder="XP reward"
          />
          <input
            className="search"
            style={{ width: "100%" }}
            type="number"
            min={0}
            value={coinReward}
            onChange={(e) => setCoinReward(e.target.value)}
            placeholder="Coin reward"
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
          Create lesson
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
                {course.active ? "Archive" : "Activate"}
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
                        lessons
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
              skills
            </small>
          </article>
        ))}
      </section>
    </>
  );
}
