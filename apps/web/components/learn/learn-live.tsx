"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Unit = {
  id: string;
  position: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  metadata: unknown;
};
type Lesson = {
  id: string;
  unit_id: string;
  position: number;
  title_ar: string;
  title_en: string;
  content: unknown;
};
type Progress = {
  lesson_id: string;
  completed_at: string | null;
  best_score: number;
};

function locked(metadata: unknown) {
  return Boolean(
    metadata &&
    typeof metadata === "object" &&
    "locked" in metadata &&
    (metadata as { locked?: boolean }).locked,
  );
}

export function LearnLive() {
  const supabase = useMemo(() => createClient(), []);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [course, setCourse] = useState("Noata");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    void (async () => {
      const { data: courseRows } = await supabase
        .from("courses")
        .select("id,title_ar")
        .eq("active", true)
        .order("created_at")
        .limit(1);
      const courseRow = courseRows?.[0];
      if (!courseRow) {
        setLoading(false);
        return;
      }
      setCourse(courseRow.title_ar);

      const [
        { data: unitRows },
        { data: lessonRows },
        {
          data: { user },
        },
      ] = await Promise.all([
        supabase
          .from("units")
          .select("id,position,title_ar,title_en,description_ar,metadata")
          .eq("course_id", courseRow.id)
          .order("position"),
        supabase
          .from("lessons")
          .select("id,unit_id,position,title_ar,title_en,content")
          .order("position"),
        supabase.auth.getUser(),
      ]);
      setUnits((unitRows ?? []) as Unit[]);
      setLessons((lessonRows ?? []) as Lesson[]);

      if (user) {
        const { data } = await supabase
          .from("lesson_progress")
          .select("lesson_id,completed_at,best_score")
          .eq("user_id", user.id);
        setProgress((data ?? []) as Progress[]);
      }
      setLoading(false);
    })();
  }, [supabase]);

  const completed = new Set(
    progress.filter((x) => x.completed_at).map((x) => x.lesson_id),
  );
  const percent = lessons.length
    ? Math.round(
        (lessons.filter((l) => completed.has(l.id)).length / lessons.length) *
          100,
      )
    : 0;
  const visible = (lesson: Lesson) =>
    (lesson.title_ar + " " + lesson.title_en)
      .toLowerCase()
      .includes(query.toLowerCase()) &&
    (filter === "all" ||
      (filter === "complete"
        ? completed.has(lesson.id)
        : !completed.has(lesson.id)));

  return (
    <>
      <header className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>
            CURRICULUM MAP
          </div>
          <h1 style={{ margin: "6px 0 0" }}>رحلة التعلّم</h1>
        </div>
        <span className="pill">{course}</span>
      </header>
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>تقدّم المسار</h2>
            <p style={{ margin: "5px 0 0", color: "var(--muted)" }}>
              التقدم مبني على إكمال الدروس والإتقان، مش مجرد فتح الصفحات.
            </p>
          </div>
          <b>{loading ? "—" : percent + "%"}</b>
        </div>
        <div className="progress">
          <i style={{ width: percent + "%" }} />
        </div>
      </section>
      <div className="filter-bar">
        <input
          className="search"
          aria-label="ابحث عن درس"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="عن إيه حابب تتعلم؟"
        />
        {[
          ["all", "كل الدروس"],
          ["new", "لسه قدّامك"],
          ["complete", "مكتمل"],
        ].map(([value, label]) => (
          <button
            key={value}
            className="filter-chip"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {!loading && !lessons.some(visible) && (
        <div className="panel empty-state">
          <h2>مفيش دروس مطابقة لبحثك.</h2>
          <p>جرّب كلمة تانية أو غيّر التصفية.</p>
        </div>
      )}
      <section style={{ display: "grid", gap: 16, marginTop: 18 }}>
        {units.map((unit) => {
          const unitLessons = lessons.filter(
            (l) => l.unit_id === unit.id && visible(l),
          );
          const done = unitLessons.filter((l) => completed.has(l.id)).length;
          const unitProgress = unitLessons.length
            ? Math.round((done / unitLessons.length) * 100)
            : 0;
          const isLocked = locked(unit.metadata);
          if (!unitLessons.length && (query || filter !== "all")) return null;
          return (
            <article
              className="panel"
              key={unit.id}
              style={{ opacity: isLocked ? 0.58 : 1 }}
            >
              <div className="panel-head">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="quest-icon">
                    {String(unit.position).padStart(2, "0")}
                  </div>
                  <div>
                    <h2 style={{ margin: 0 }}>{unit.title_ar}</h2>
                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "var(--muted)",
                        fontSize: 12,
                      }}
                    >
                      {unit.description_ar}
                    </p>
                  </div>
                </div>
                <span className="pill">
                  {isLocked ? "قريبًا" : unitProgress + "%"}
                </span>
              </div>
              <div className="quest-list">
                {unitLessons.map((lesson) => {
                  const row = progress.find((x) => x.lesson_id === lesson.id);
                  return (
                    <div className="quest" key={lesson.id}>
                      <div className="quest-icon">
                        {completed.has(lesson.id) ? "✓" : lesson.position}
                      </div>
                      <div>
                        <h3>{lesson.title_ar}</h3>
                        <p>
                          {row?.completed_at
                            ? "مكتمل · أفضل نتيجة " +
                              Math.round(Number(row.best_score)) +
                              "%"
                            : "جاهز للتعلّم"}
                        </p>
                      </div>
                      <a
                        aria-disabled={isLocked}
                        tabIndex={isLocked ? -1 : undefined}
                        onClick={(e) => {
                          if (isLocked) e.preventDefault();
                        }}
                        className="btn"
                        style={{
                          background: isLocked
                            ? "var(--surface-soft)"
                            : "var(--accent)",
                          color: isLocked ? "var(--muted)" : "#fff",
                        }}
                        href={isLocked ? "#" : "/lesson/" + lesson.id}
                      >
                        {completed.has(lesson.id) ? "راجع" : "ابدأ"}
                      </a>
                    </div>
                  );
                })}
                {!unitLessons.length && (
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    المحتوى تحت المراجعة.
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
