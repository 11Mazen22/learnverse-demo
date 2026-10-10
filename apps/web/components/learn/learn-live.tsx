"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";

import { useEffect, useMemo, useState } from "react";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";

type Unit = {
  id: string;
  position: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
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
  const t=useTranslation(),locale=useLocale();
  const supabase = useMemo(() => createClient(), []);
  const account = useVerifiedAccount();
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [course, setCourse] = useState<{title_ar:string;title_en:string}|null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (account.loading) return;
    setProgress([]);
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const courses = await supabase
          .from("courses")
          .select("id,title_ar,title_en")
          .eq("active", true)
          .order("created_at")
          .limit(1)
          .abortSignal(controller.signal);
        if (courses.error)
          throw Error(t("تعذّر تحميل المسار. بياناتك محفوظة؛ جرّب مرة أخرى.","Could not load the learning path. Your data is saved; please try again."));
        const courseRow = courses.data?.[0];
        if (!courseRow) {
          if (active) {
            setUnits([]);
            setLessons([]);
          }
          return;
        }
        const [unitResult, auth] = await Promise.all([
          supabase
            .from("units")
            .select("id,position,title_ar,title_en,description_ar,description_en,metadata")
            .eq("course_id", courseRow.id)
            .order("position")
            .abortSignal(controller.signal),
          Promise.resolve({ data: { user: account.user } }),
        ]);
        if (unitResult.error) throw Error(t("تعذّر تحميل وحدات المسار.","Could not load the units."));
        const unitRows = unitResult.data ?? [];
        const lessonResult = unitRows.length
          ? await supabase
              .from("lessons")
              .select("id,unit_id,position,title_ar,title_en,content")
              .in(
                "unit_id",
                unitRows.map((u) => u.id),
              )
              .order("position")
              .abortSignal(controller.signal)
          : { data: [], error: null };
        if (lessonResult.error) throw Error(t("تعذّر تحميل الدروس.","Could not load the lessons."));
        let progressRows: Progress[] = [];
        if (auth.data.user) {
          const result = await supabase
            .from("lesson_progress")
            .select("lesson_id,completed_at,best_score")
            .eq("user_id", auth.data.user.id)
            .abortSignal(controller.signal);
          if (result.error) throw Error(t("تعذّر تحميل تقدّمك؛ حاول مرة أخرى.","Could not load your progress. Please try again."));
          progressRows = result.data ?? [];
        }
        if (active) {
          setCourse(courseRow);
          setUnits(unitRows as Unit[]);
          setLessons((lessonResult.data ?? []) as Lesson[]);
          setProgress(progressRows);
        }
      } catch (error) {
        if (active)
          setError(
            error instanceof Error ? error.message : t("تعذّر الاتصال بالمسار.","Could not connect to the learning path."),
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [supabase, reload, account.user, account.loading, t]);

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
          <div className="eyebrow" style={{ color: "var(--accent)" }}>{t("كل فكرة، خطوة في رحلتك","Every idea is a step on your journey")}</div>
          <h1 style={{ margin: "6px 0 0" }}>{t("رحلة التعلّم","Learning journey")}</h1>
        </div>
        <span className="pill">{course?(locale==="en"?course.title_en:course.title_ar):"Noata"}</span>
      </header>
      {(error || account.error) && (
        <div className="aura-load-error" role="alert">
          <strong>{error || account.error}</strong>
          <button
            type="button"
            onClick={() => {
              if (account.error) void account.refresh();
              else setReload((n) => n + 1);
            }}
          >{t("إعادة المحاولة","Try again")}</button>
        </div>
      )}
      <section className="panel" aria-busy={loading || account.loading}>
        <div className="panel-head">
          <div>
            <h2>{t("تقدّم المسار","Learning path progress")}</h2>
            <p style={{ margin: "5px 0 0", color: "var(--muted)" }}>{t("التقدم مبني على إكمال الدروس والإتقان، مش مجرد فتح الصفحات.","Progress reflects lesson completion and mastery, rather than page visits.")}</p>
          </div>
          <b>{loading || error || account.error ? "—" : percent + "%"}</b>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-label={t("تقدّم المسار","Learning path progress")}
          aria-valuenow={
            loading || error || account.error ? undefined : percent
          }
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <i
            style={{
              width: (loading || error || account.error ? 0 : percent) + "%",
            }}
          />
        </div>
      </section>
      <div className="filter-bar">
        <input
          className="search"
          aria-label={t("ابحث عن درس","Search lessons")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("عن إيه حابب تتعلم؟","What would you like to learn?")}
        />
        {[
          ["all", t("كل الدروس","All lessons")],
          ["new", t("لسه قدّامك","To learn")],
          ["complete", t("مكتمل","Completed")],
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
          <h2>
            {lessons.length
              ? t("مفيش دروس مطابقة لبحثك.","No lessons match your search.")
              : t("الدروس لم تُنشر بعد.","Lessons have not been published yet.")}
          </h2>
          <p>
            {lessons.length
              ? t("جرّب كلمة تانية أو غيّر التصفية.","Try another search or change the filter.")
              : t("تظهر المواد هنا بعد مراجعتها ونشرها.","Content appears here after review and publication.")}
          </p>
        </div>
      )}
      <section style={{ display: "grid", gap: 16, marginTop: 18 }}>
        {units.map((unit) => {
          const unitLessons = lessons.filter(
            (l) => l.unit_id === unit.id && visible(l),
          );
          const allUnitLessons = lessons.filter((l) => l.unit_id === unit.id);
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
              data-locked={isLocked}
            >
              <div className="panel-head">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="quest-icon">
                    {String(unit.position).padStart(2, "0")}
                  </div>
                  <div>
                    <h2 style={{ margin: 0 }}>{locale==="en"?unit.title_en:unit.title_ar}</h2>
                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "var(--muted)",
                        fontSize: 12,
                      }}
                    >
                      {locale==="en"?unit.description_en:unit.description_ar}
                    </p>
                  </div>
                </div>
                <span className="pill">
                  {isLocked ? t("قريبًا","Coming soon") : unitProgress + "%"}
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
                        <h3>{locale==="en"?lesson.title_en:lesson.title_ar}</h3>
                        <p>
                          {row?.completed_at
                            ? t("مكتمل · أفضل نتيجة ","Completed · Best score ") +
                              Math.round(Number(row.best_score)) +
                              "%"
                            : t("جاهز للتعلّم","Ready to learn")}
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
                          color: isLocked ? "var(--muted)" : "var(--surface)",
                        }}
                        href={isLocked ? "#" : "/lesson/" + lesson.id}
                      >
                        {completed.has(lesson.id) ? t("راجع","Review") : t("ابدأ","Start")}
                      </a>
                    </div>
                  );
                })}
                {!unitLessons.length && (
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>{t("المحتوى تحت المراجعة.","Content is under review.")}</div>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
