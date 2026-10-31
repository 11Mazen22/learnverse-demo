"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import {
  SUBJECT_CATALOG,
  TRACK_CATALOG,
  contentLanguageLabel,
  defaultTrackForSubject,
  subjectDefinition,
  type ContentLanguage,
} from "@/lib/curriculum/catalog";

type SubjectRow = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  position: number;
  accent: string;
  description_ar: string;
  description_en: string;
};
type TrackRow = {
  id: string;
  slug: string;
  content_language: ContentLanguage;
  title_ar: string;
  title_en: string;
  publication_status: string;
  course_id: string | null;
  subjects: SubjectRow | null;
};
type Unit = {
  id: string;
  course_id: string;
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

/**
 * The curriculum hub.
 *
 * Six subject families, eight selectable tracks. Integrated Science and Mathematics
 * expose an Arabic and an English track; every track owns its own course, lessons and
 * progress, so switching the interface language never switches the curriculum track and
 * progress in one language never counts for the other.
 */
export function LearnLive() {
  const t = useTranslation(),
    locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const account = useVerifiedAccount();
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [catalogReady, setCatalogReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  // Catalog + every published unit, lesson and the learner's own progress. One read
  // per collection keeps the hub fast and lets the subject cards show real numbers.
  useEffect(() => {
    if (account.loading) return;
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void (async () => {
      try {
        let trackRows: TrackRow[] = [];
        let unitRows: Unit[] = [];
        let lessonRows: Lesson[] = [];
        let progressRows: Progress[] = [];
        let enrolledTrackId: string | undefined = undefined;
        let catalogFailure = false;

        try {
          const trackResult = await supabase
            .from("curriculum_tracks")
            .select(
              "id,slug,content_language,title_ar,title_en,publication_status,course_id,subjects(id,slug,title_ar,title_en,position,accent,description_ar,description_en)",
            )
            .eq("publication_status", "published")
            .order("slug")
            .abortSignal(controller.signal);

          if (trackResult.error) throw trackResult.error;
          if (trackResult.data?.length) {
            trackRows = trackResult.data as TrackRow[];
            const courseIds = trackRows
              .map((row) => row.course_id)
              .filter((id): id is string => Boolean(id));

            if (courseIds.length) {
              const uRes = await supabase
                .from("units")
                .select(
                  "id,course_id,position,title_ar,title_en,description_ar,description_en,metadata",
                )
                .in("course_id", courseIds)
                .order("position")
                .abortSignal(controller.signal);
              if (uRes.error) throw uRes.error;
              if (uRes.data) unitRows = uRes.data as Unit[];
            }

            if (unitRows.length) {
              const lRes = await supabase
                .from("lessons")
                .select("id,unit_id,position,title_ar,title_en")
                .in(
                  "unit_id",
                  unitRows.map((u) => u.id),
                )
                .order("position")
                .abortSignal(controller.signal);
              if (lRes.error) throw lRes.error;
              if (lRes.data) lessonRows = lRes.data as Lesson[];
            }
          }

          if (account.user) {
            const [pRes, eRes] = await Promise.all([
              supabase
                .from("lesson_progress")
                .select("lesson_id,completed_at,best_score")
                .eq("user_id", account.user.id)
                .abortSignal(controller.signal),
              supabase
                .from("curriculum_enrollments")
                .select("track_id,updated_at")
                .eq("user_id", account.user.id)
                .order("updated_at", { ascending: false })
                .limit(1)
                .abortSignal(controller.signal),
            ]);
            if (pRes.error || eRes.error) throw pRes.error ?? eRes.error;
            if (pRes.data) progressRows = pRes.data as Progress[];
            if (eRes.data?.length) enrolledTrackId = eRes.data[0]?.track_id as string | undefined;
          }
        } catch {
          catalogFailure = true;
        }
        if (!active) return;
        const effectiveTracks: TrackRow[] =
          trackRows.length > 0
            ? trackRows
            : TRACK_CATALOG.map((tr) => {
                const s = subjectDefinition(tr.subject);
                return {
                  id: tr.slug,
                  slug: tr.slug,
                  content_language: tr.contentLanguage,
                  title_ar: tr.titleAr,
                  title_en: tr.titleEn,
                  publication_status: "pending_source",
                  course_id: null,
                  subjects: s
                    ? {
                        id: s.key,
                        slug: s.slug,
                        title_ar: s.titleAr,
                        title_en: s.titleEn,
                        position: SUBJECT_CATALOG.indexOf(s) + 1,
                        accent: s.accent,
                        description_ar: s.descriptionAr,
                        description_en: s.descriptionEn,
                      }
                    : null,
                };
              });

        const effectiveUnits = unitRows;
        const effectiveLessons = lessonRows;

        setTracks(effectiveTracks);
        setUnits(effectiveUnits);
        setLessons(effectiveLessons);
        setProgress(progressRows);
        setCatalogReady(true);
        if (catalogFailure) {
          setError(
            t(
              "تعذّر التحقق من قاعدة بيانات المنهج. نعرض أسماء المواد فقط، ولا نعرض دروسًا بديلة أو تقدّمًا مفترضًا.",
              "The curriculum database could not be verified. Subject identities remain visible, but no substitute lessons or assumed progress are shown.",
            ),
          );
        }
        const enrolled = enrolledTrackId;
        setSelectedSlug((current) => {
          if (current && effectiveTracks.some((row) => row.slug === current)) return current;
          const parameters = new URLSearchParams(window.location.search);
          const requestedTrack = parameters.get("track");
          if (requestedTrack && effectiveTracks.some((row) => row.slug === requestedTrack)) return requestedTrack;
          const requestedSubject = parameters.get("subject");
          if (requestedSubject) {
            const subjectTrack = effectiveTracks.find((row) => row.subjects?.slug === requestedSubject);
            if (subjectTrack) return subjectTrack.slug;
          }
          if (enrolled) {
            const match = effectiveTracks.find((row) => row.id === enrolled);
            if (match) return match.slug;
          }
          const fallback = defaultTrackForSubject("integrated-science");
          return fallback?.slug ?? effectiveTracks[0]?.slug ?? null;
        });
      } catch (failure) {
        if (active)
          setError(
            failure instanceof Error
              ? failure.message
              : t("تعذّر الاتصال بالمواد الدراسية.", "Could not connect to the curriculum."),
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

  // Keep the learner's track selection durable: it is stored with their own record and
  // is independent from the interface language.
  const selectTrack = useCallback(
    (slug: string) => {
      setSelectedSlug(slug);
      const track = tracks.find((row) => row.slug === slug);
      if (!track || !account.user) return;
      if (track.publication_status !== "published" || !track.course_id) {
        setError(
          t(
            "هذا المسار غير متاح من مصدر المنهج المتصل بعد؛ لم نحفظ اختيارًا غير قابل للدراسة.",
            "This track is not available from the connected curriculum source yet, so the selection was not saved.",
          ),
        );
        return;
      }
      void supabase
        .from("curriculum_enrollments")
        .upsert(
          { user_id: account.user.id, track_id: track.id, status: "active" },
          { onConflict: "user_id,track_id" },
        )
        .then(({ error: writeError }) => {
          if (writeError)
            setError(t("تعذّر تأكيد حفظ المسار. أعد المحاولة.", "Could not confirm the track selection. Please retry."));
        });
    },
    [account.user, supabase, tracks, t],
  );

  const selected = tracks.find((row) => row.slug === selectedSlug) ?? null;
  const completed = useMemo(
    () => new Set(progress.filter((row) => row.completed_at).map((row) => row.lesson_id)),
    [progress],
  );

  const subjects = useMemo(() => {
    const fromDb = tracks
      .map((row) => row.subjects)
      .filter((row): row is SubjectRow => Boolean(row));
    if (fromDb.length) {
      const seen = new Set<string>();
      return fromDb
        .filter((row) => {
          if (seen.has(row.slug)) return false;
          seen.add(row.slug);
          return true;
        })
        .sort((a, b) => a.position - b.position);
    }
    return SUBJECT_CATALOG.map((subject) => ({
      id: subject.key,
      slug: subject.slug,
      title_ar: subject.titleAr,
      title_en: subject.titleEn,
      position: SUBJECT_CATALOG.indexOf(subject) + 1,
      accent: subject.accent,
      description_ar: subject.descriptionAr,
      description_en: subject.descriptionEn,
    }));
  }, [tracks]);

  const trackUnits = useMemo(
    () => units.filter((unit) => selected?.course_id && unit.course_id === selected.course_id),
    [units, selected],
  );
  const trackLessons = useMemo(
    () => lessons.filter((lesson) => trackUnits.some((unit) => unit.id === lesson.unit_id)),
    [lessons, trackUnits],
  );

  const subjectProgress = useCallback(
    (subjectSlug: string) => {
      const subjectTracks = tracks.filter((row) => row.subjects?.slug === subjectSlug);
      const subjectUnits = units.filter((unit) =>
        subjectTracks.some((row) => row.course_id === unit.course_id),
      );
      const subjectLessons = lessons.filter((lesson) =>
        subjectUnits.some((unit) => unit.id === lesson.unit_id),
      );
      const done = subjectLessons.filter((lesson) => completed.has(lesson.id)).length;
      return {
        done,
        total: subjectLessons.length,
        percent: subjectLessons.length ? Math.round((done / subjectLessons.length) * 100) : 0,
      };
    },
    [completed, lessons, tracks, units],
  );

  const percent = trackLessons.length
    ? Math.round(
        (trackLessons.filter((lesson) => completed.has(lesson.id)).length / trackLessons.length) *
          100,
      )
    : 0;
  const visible = (lesson: Lesson) =>
    (lesson.title_ar + " " + lesson.title_en)
      .toLowerCase()
      .includes(query.toLowerCase()) &&
    (filter === "all" ||
      (filter === "complete" ? completed.has(lesson.id) : !completed.has(lesson.id)));

  const trackLabel = (slug: string) => {
    const row = tracks.find((item) => item.slug === slug);
    if (!row) return slug;
    return locale === "en" ? row.title_en : row.title_ar;
  };

  const selectedSubjectTitle = selected
    ? locale === "en"
      ? selected.subjects?.title_en
      : selected.subjects?.title_ar
    : "";

  return (
    <>
      <header className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>
            {t("كل فكرة، خطوة في رحلتك", "Every idea is a step on your journey")}
          </div>
          <h1 style={{ margin: "6px 0 0" }}>{t("رحلة التعلّم", "Learning journey")}</h1>
        </div>
        <span className="pill">
          {selected
            ? locale === "en"
              ? selected.title_en
              : selected.title_ar
            : t("الصف الأول الثانوي — الترم الأول", "First Secondary — Term 1")}
        </span>
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
          >
            {t("إعادة المحاولة", "Try again")}
          </button>
        </div>
      )}

      <section className="aura-subject-hub" aria-label={t("المواد الدراسية", "Subjects")}>
        <div className="aura-subject-hub-head">
          <h2>{t("المواد الدراسية", "Subjects")}</h2>
          <p>
            {t(
              "اختر المادة ثم المسار — لكل مسار دروسه وتقدّمه المستقل، وتغيير لغة الواجهة لا يغيّر مسارك.",
              "Pick a subject, then its track. Every track keeps its own lessons and progress, and switching the interface language never changes your track.",
            )}
          </p>
        </div>
        <div className="aura-subject-grid">
          {subjects.map((subject) => {
            const definition = subjectDefinition(subject.slug);
            const subjectTracks = tracks.filter((row) => row.subjects?.slug === subject.slug);
            const dual = definition?.dualLanguage ?? subjectTracks.length > 1;
            const progressForSubject = subjectProgress(subject.slug);
            const active = subjectTracks.some((row) => row.slug === selectedSlug);
            return (
              <article
                className="aura-subject-card"
                key={subject.id}
                data-accent={subject.accent}
                data-active={active ? "true" : "false"}
              >
                <div className="aura-subject-card-head">
                  <h3>{locale === "en" ? subject.title_en : subject.title_ar}</h3>
                  <span className="aura-subject-percent">
                    {progressForSubject.total
                      ? progressForSubject.percent + "%"
                      : t("لم يبدأ", "Not started")}
                  </span>
                </div>
                <p className="aura-subject-card-desc">
                  {locale === "en" ? subject.description_en : subject.description_ar}
                </p>
                <div className="aura-track-chips" role="group" aria-label={t("المسارات", "Tracks")}>
                  {dual
                    ? subjectTracks.map((row) => (
                        <button
                          key={row.id}
                          type="button"
                          className="aura-track-chip"
                          data-language={row.content_language}
                          aria-pressed={row.slug === selectedSlug}
                          disabled={row.publication_status !== "published" || !row.course_id}
                          onClick={() => selectTrack(row.slug)}
                        >
                          <span className="aura-track-language">
                            {contentLanguageLabel(row.content_language, locale)}
                          </span>
                          <span className="aura-track-name">
                            {locale === "en" ? row.title_en : row.title_ar}
                          </span>
                        </button>
                      ))
                    : subjectTracks.map((row) => (
                        <button
                          key={row.id}
                          type="button"
                          className="aura-track-chip"
                          data-language={row.content_language}
                          aria-pressed={row.slug === selectedSlug}
                          disabled={row.publication_status !== "published" || !row.course_id}
                          onClick={() => selectTrack(row.slug)}
                        >
                          <span className="aura-track-language">
                            {contentLanguageLabel(row.content_language, locale)}
                          </span>
                        </button>
                      ))}
                  {!subjectTracks.length && (
                    <span className="aura-track-chip aura-track-chip-empty" aria-disabled="true">
                      {t("لم يُنشر بعد", "Not published yet")}
                    </span>
                  )}
                </div>
                {progressForSubject.total > 0 && (
                  <div
                    className="progress aura-subject-progress"
                    role="progressbar"
                    aria-label={locale === "en" ? subject.title_en : subject.title_ar}
                    aria-valuenow={progressForSubject.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <i style={{ width: progressForSubject.percent + "%" }} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel" aria-busy={loading || account.loading}>
        <div className="panel-head">
          <div>
            <h2>
              {selected
                ? t("تقدّم المسار", "Learning path progress")
                : t("اختر مسارًا للبدء", "Choose a track to begin")}
            </h2>
            <p style={{ margin: "5px 0 0", color: "var(--muted)" }}>
              {selected ? (
                <>
                  {selectedSubjectTitle} · {trackLabel(selected.slug)} ·{" "}
                  {contentLanguageLabel(selected.content_language, locale)}
                </>
              ) : (
                t(
                  "التقدم مبني على إكمال الدروس والإتقان، مش مجرد فتح الصفحات.",
                  "Progress reflects lesson completion and mastery, rather than page visits.",
                )
              )}
            </p>
          </div>
          <b>{loading || error || account.error || !selected ? "—" : percent + "%"}</b>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-label={t("تقدّم المسار", "Learning path progress")}
          aria-valuenow={loading || error || account.error || !selected ? undefined : percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <i
            style={{
              width: (loading || error || account.error || !selected ? 0 : percent) + "%",
            }}
          />
        </div>
      </section>

      {selected && (
        <div className="filter-bar">
          <input
            className="search"
            aria-label={t("ابحث عن درس", "Search lessons")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("عن إيه حابب تتعلم؟", "What would you like to learn?")}
          />
          {[
            ["all", t("كل الدروس", "All lessons")],
            ["new", t("لسه قدّامك", "To learn")],
            ["complete", t("مكتمل", "Completed")],
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
      )}

      {selected && !loading && !error && !trackLessons.some(visible) && (
        <div className="panel empty-state">
          <h2>
            {trackLessons.length
              ? t("مفيش دروس مطابقة لبحثك.", "No lessons match your search.")
              : t("الدروس لم تُنشر بعد.", "Lessons have not been published yet.")}
          </h2>
          <p>
            {trackLessons.length
              ? t("جرّب كلمة تانية أو غيّر التصفية.", "Try another search or change the filter.")
              : t(
                  "تظهر المواد هنا بعد مراجعتها ونشرها.",
                  "Content appears here after review and publication.",
                )}
          </p>
        </div>
      )}

      {selected && catalogReady && !trackUnits.length && (
        <div className="panel empty-state">
          <h2>{t("لا توجد وحدات في هذا المسار بعد.", "This track has no units yet.")}</h2>
          <p>
            {t(
              "محتوى هذا المسار لم يُنشر في هذه النسخة. اختر مسارًا آخر أو تابع تحديثات المنهج.",
              "This track has not been published in this release. Choose another track or follow the curriculum updates.",
            )}
          </p>
        </div>
      )}

      <section style={{ display: "grid", gap: 16, marginTop: 18 }}>
        {trackUnits.map((unit) => {
          const unitLessons = trackLessons.filter(
            (lesson) => lesson.unit_id === unit.id && visible(lesson),
          );
          const allUnitLessons = trackLessons.filter((lesson) => lesson.unit_id === unit.id);
          const done = allUnitLessons.filter((lesson) => completed.has(lesson.id)).length;
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
              data-track={selected?.slug}
            >
              <div className="panel-head">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="quest-icon">{String(unit.position).padStart(2, "0")}</div>
                  <div>
                    <h2 style={{ margin: 0 }}>
                      {selected?.content_language === "en"
                        ? unit.title_en
                        : unit.title_ar}
                    </h2>
                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "var(--muted)",
                        fontSize: 12,
                      }}
                    >
                      {selected?.content_language === "en"
                        ? unit.description_en
                        : unit.description_ar}
                    </p>
                  </div>
                </div>
                <span className="pill">
                  {isLocked ? t("قريبًا", "Coming soon") : unitProgress + "%"}
                </span>
              </div>
              <div className="quest-list">
                {unitLessons.map((lesson) => {
                  const row = progress.find((item) => item.lesson_id === lesson.id);
                  return (
                    <div className="quest" key={lesson.id}>
                      <div className="quest-icon">
                        {completed.has(lesson.id) ? "✓" : lesson.position}
                      </div>
                      <div>
                        <h3>
                          {selected?.content_language === "en"
                            ? lesson.title_en
                            : lesson.title_ar}
                        </h3>
                        <p>
                          {row?.completed_at
                            ? t("مكتمل · أفضل نتيجة ", "Completed · Best score ") +
                              Math.round(Number(row.best_score)) +
                              "%"
                            : t("جاهز للتعلّم", "Ready to learn")}
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
                          background: isLocked ? "var(--surface-soft)" : "var(--accent)",
                          color: isLocked ? "var(--muted)" : "var(--surface)",
                        }}
                        href={isLocked ? "#" : "/lesson/" + lesson.id}
                      >
                        {completed.has(lesson.id) ? t("راجع", "Review") : t("ابدأ", "Start")}
                      </a>
                    </div>
                  );
                })}
                {!unitLessons.length && (
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>
                    {t("المحتوى تحت المراجعة.", "Content is under review.")}
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
