"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";

import { useEffect, useMemo, useState } from "react";
import { boundedRead } from "@/lib/supabase/use-verified-account";
import { useConfirmedMutation } from "@/lib/supabase/use-confirmed-mutation";
import { createClient } from "@/lib/supabase/client";

type SubjectRow = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  position: number;
  active: boolean;
};
type TrackRow = {
  id: string;
  slug: string;
  subject_id: string;
  content_language: "ar" | "en";
  title_ar: string;
  title_en: string;
  publication_status: "draft" | "pending_source" | "published" | "retired";
  course_id: string | null;
  subjects: { slug: string; title_ar: string; title_en: string } | null;
};

const STATUSES = ["published", "pending_source", "draft", "retired"] as const;

type TrackLabels = {
  arabic: string;
  english: string;
  save: string;
  publication: string;
  noPath: string;
};

/** One track row: editable titles and a publication state, saved through RLS-protected writes. */
function TrackEditor({
  track,
  busy,
  onStatus,
  onTitles,
  labels,
}: {
  track: TrackRow;
  busy: boolean;
  onStatus: (value: TrackRow["publication_status"]) => void;
  onTitles: (titleAr: string, titleEn: string) => void;
  labels: TrackLabels;
}) {  const [titleAr, setTitleAr] = useState(track.title_ar);
  const [titleEn, setTitleEn] = useState(track.title_en);
  useEffect(() => {
    setTitleAr(track.title_ar);
    setTitleEn(track.title_en);
  }, [track.title_ar, track.title_en]);
  const dirty = titleAr !== track.title_ar || titleEn !== track.title_en;
  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        padding: 10,
        borderRadius: 12,
        background: "var(--surface-soft)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <strong style={{ fontSize: 13 }}>{titleAr || titleEn}</strong>
        <span className="pill" style={{ fontSize: 11 }}>
          {track.content_language === "en" ? "EN" : "AR"}
        </span>
        <span style={{ color: "var(--muted)", fontSize: 11 }}>{track.slug}</span>
        {!track.course_id && (
          <span className="pill" style={{ fontSize: 11 }}>
            {labels.noPath}
          </span>
        )}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <input
          className="search"
          style={{ width: "100%" }}
          value={titleAr}
          onChange={(event) => setTitleAr(event.target.value)}
          aria-label={labels.arabic}
          placeholder={labels.arabic}
        />
        <input
          className="search"
          style={{ width: "100%" }}
          value={titleEn}
          onChange={(event) => setTitleEn(event.target.value)}
          aria-label={labels.english}
          placeholder={labels.english}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 12, color: "var(--muted)", display: "inline-flex", gap: 8 }}>
            {labels.publication}
            <select
              className="search"
              style={{ width: "auto" }}
              value={track.publication_status}
              disabled={busy}
              onChange={(event) =>
                onStatus(event.target.value as TrackRow["publication_status"])
              }
            >
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn"
            disabled={busy || !dirty}
            onClick={() => onTitles(titleAr.trim() || track.title_ar, titleEn.trim() || track.title_en)}
          >
            {labels.save}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Subject and track administration.
 *
 * The catalog is the one place where the product decides which subjects exist and
 * which language tracks they expose. Administrators manage the metadata and the
 * publication state of every track; permissions are enforced by the database
 * policies, not by this screen.
 */
export function CurriculumCatalogAdmin() {
  const t = useTranslation(),
    locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const { account, busy, status, setStatus, run } = useConfirmedMutation();
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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
            .from("subjects")
            .select("id,slug,title_ar,title_en,position,active")
            .order("position"),
          supabase
            .from("curriculum_tracks")
            .select(
              "id,slug,subject_id,content_language,title_ar,title_en,publication_status,course_id,subjects(slug,title_ar,title_en)",
            )
            .order("slug"),
        ]),
      );
      if (token !== account.revision.current) return false;
      const failed = results.find((result) => result.error);
      if (failed) throw failed.error;
      setSubjects((results[0].data ?? []) as SubjectRow[]);
      setTracks((results[1].data ?? []) as TrackRow[]);
      return true;
    } catch {
      if (token === account.revision.current)
        setLoadError(
          t(
            "تعذّر تحميل المواد والمسارات. حاول مرة أخرى عند عودة الاتصال.",
            "Could not load subjects and tracks. Try again when your connection returns.",
          ),
        );
      return false;
    } finally {
      if (token === account.revision.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (!account.loading) void load();
  }, [account.user, account.loading]);

  async function updateTrack(track: TrackRow, patch: Partial<TrackRow>) {
    await run(async (check) => {
      const { error } = await supabase
        .from("curriculum_tracks")
        .update({
          title_ar: patch.title_ar ?? track.title_ar,
          title_en: patch.title_en ?? track.title_en,
          publication_status: patch.publication_status ?? track.publication_status,
        })
        .eq("id", track.id);
      check();
      if (error) throw error;
      await load();
      return t("تم تحديث المسار ✓", "Track updated ✓");
    });
  }

  async function updateSubject(subject: SubjectRow, patch: Partial<SubjectRow>) {
    await run(async (check) => {
      const { error } = await supabase
        .from("subjects")
        .update({
          title_ar: patch.title_ar ?? subject.title_ar,
          title_en: patch.title_en ?? subject.title_en,
          active: patch.active ?? subject.active,
        })
        .eq("id", subject.id);
      check();
      if (error) throw error;
      await load();
      return t("تم تحديث المادة ✓", "Subject updated ✓");
    });
  }

  if (loading)
    return (
      <section className="aura-loading-state" role="status">
        {t("بنحمّل المواد والمسارات…", "Loading subjects and tracks…")}
      </section>
    );
  if (loadError)
    return (
      <section className="aura-load-error" role="alert">
        <strong>{loadError}</strong>
        <button type="button" onClick={() => void load()}>
          {t("إعادة المحاولة", "Try again")}
        </button>
      </section>
    );

  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <div className="panel-head">
        <h2>{t("المواد والمسارات", "Subjects and tracks")}</h2>
        <span className="pill">
          {subjects.length} {t("مادة", "subjects")} · {tracks.length} {t("مسار", "tracks")}
        </span>
      </div>
      <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: 12.5 }}>
        {t(
          "كل مسار يملك لغته ومسار 학습 ودروسه وأسئلته وتقدّمه. Sciences و Mathematics لهما مساران: عربي وإنجليزي.",
          "Every track owns its language, learning path, lessons, questions and progress. Integrated Science and Mathematics each have an Arabic and an English track.",
        )}
      </p>
      {status && (
        <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 12 }} role="status">
          {status}
        </p>
      )}
      <div style={{ display: "grid", gap: 14 }}>
        {subjects.map((subject) => {
          const subjectTracks = tracks.filter((track) => track.subject_id === subject.id);
          return (
            <article
              key={subject.id}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 16,
                padding: 14,
                display: "grid",
                gap: 10,
              }}
            >
              <div className="panel-head" style={{ margin: 0 }}>
                <h3 style={{ margin: 0, fontSize: "1rem" }}>
                  {locale === "en" ? subject.title_en : subject.title_ar}
                  <span style={{ color: "var(--muted)", fontWeight: 500, fontSize: 12 }}>
                    {" · "}
                    {subject.slug}
                  </span>
                </h3>
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => void updateSubject(subject, { active: !subject.active })}
                >
                  {subject.active
                    ? t("إخفاء المادة", "Hide subject")
                    : t("إظهار المادة", "Show subject")}
                </button>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {subjectTracks.map((track) => (
                  <TrackEditor
                    key={track.id}
                    track={track}
                    busy={busy}
                    onStatus={(value) =>
                      void updateTrack(track, { publication_status: value })
                    }
                    onTitles={(titleAr, titleEn) =>
                      void updateTrack(track, { title_ar: titleAr, title_en: titleEn })
                    }
                    labels={{
                      arabic: t("الاسم بالعربية", "Title in Arabic"),
                      english: t("الاسم بالإنجليزية", "Title in English"),
                      save: t("حفظ الاسم", "Save title"),
                      publication: t("حالة النشر", "Publication"),
                      noPath: t("بدون مسار تعلم", "No learning path"),
                    }}
                  />
                ))}
                {!subjectTracks.length && (
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>
                    {t("لا توجد مسارات لهذه المادة بعد.", "This subject has no tracks yet.")}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
