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
  const [error,setError]=useState("");
  const [reload,setReload]=useState(0);

  useEffect(() => {
    let active=true;const controller=new AbortController();setLoading(true);setError("");
    void(async()=>{
      try{
        const courses=await supabase.from("courses").select("id,title_ar").eq("active",true).order("created_at").limit(1).abortSignal(controller.signal);
        if(courses.error)throw Error("تعذّر تحميل المسار. بياناتك محفوظة؛ جرّب مرة أخرى.");
        const courseRow=courses.data?.[0];if(!courseRow){if(active){setUnits([]);setLessons([]);}return;}
        const [unitResult,auth]=await Promise.all([
          supabase.from("units").select("id,position,title_ar,title_en,description_ar,metadata").eq("course_id",courseRow.id).order("position").abortSignal(controller.signal),
          supabase.auth.getUser(),
        ]);
        if(unitResult.error)throw Error("تعذّر تحميل وحدات المسار.");
        const unitRows=unitResult.data??[];
        const lessonResult=unitRows.length?await supabase.from("lessons").select("id,unit_id,position,title_ar,title_en,content").in("unit_id",unitRows.map(u=>u.id)).order("position").abortSignal(controller.signal):{data:[],error:null};
        if(lessonResult.error)throw Error("تعذّر تحميل الدروس.");
        let progressRows:Progress[]=[];
        if(auth.data.user){const result=await supabase.from("lesson_progress").select("lesson_id,completed_at,best_score").eq("user_id",auth.data.user.id).abortSignal(controller.signal);if(result.error)throw Error("تعذّر تحميل تقدّمك؛ حاول مرة أخرى.");progressRows=result.data??[];}
        if(active){setCourse(courseRow.title_ar);setUnits(unitRows as Unit[]);setLessons((lessonResult.data??[]) as Lesson[]);setProgress(progressRows);}
      }catch(error){if(active)setError(error instanceof Error?error.message:"تعذّر الاتصال بالمسار.");}
      finally{if(active)setLoading(false);}
    })();return()=>{active=false;controller.abort();};
  },[supabase,reload]);

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
            كل فكرة، خطوة في رحلتك
          </div>
          <h1 style={{ margin: "6px 0 0" }}>رحلة التعلّم</h1>
        </div>
        <span className="pill">{course}</span>
      </header>
      {error&&<div className="aura-load-error" role="alert"><strong>{error}</strong><button type="button" onClick={()=>setReload(n=>n+1)}>إعادة المحاولة</button></div>}
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
        <div className="progress" role="progressbar" aria-label="تقدّم المسار" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
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
      {!loading && !error && !lessons.some(visible) && (
        <div className="panel empty-state">
          <h2>{lessons.length?"مفيش دروس مطابقة لبحثك.":"الدروس لم تُنشر بعد."}</h2>
          <p>{lessons.length?"جرّب كلمة تانية أو غيّر التصفية.":"تظهر المواد هنا بعد مراجعتها ونشرها."}</p>
        </div>
      )}
      <section style={{ display: "grid", gap: 16, marginTop: 18 }}>
        {units.map((unit) => {
          const unitLessons = lessons.filter(
            (l) => l.unit_id === unit.id && visible(l),
          );
          const allUnitLessons=lessons.filter(l=>l.unit_id===unit.id);
          const done = allUnitLessons.filter((l) => completed.has(l.id)).length;
          const unitProgress = allUnitLessons.length
            ? Math.round((done / allUnitLessons.length) * 100)
            : 0;
          const isLocked = locked(unit.metadata);
          if (!unitLessons.length && (query || filter !== "all")) return null;
          return (
            <article
              className="panel aura-curriculum-unit"
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
