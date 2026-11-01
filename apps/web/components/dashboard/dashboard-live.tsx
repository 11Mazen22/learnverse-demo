"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";
import { dashboardVisibility, type DashboardAvailability } from "@/lib/dashboard/visibility";
import { localized, useLocale } from "@/lib/i18n/locale";
import {
  SUBJECT_CATALOG,
  type ContentLanguage,
  type SubjectKey,
} from "@/lib/curriculum/catalog";

type TrackProgress = {
  id: string;
  slug: string;
  subjectSlug: string;
  contentLanguage: ContentLanguage;
  titleAr: string;
  titleEn: string;
  courseId: string | null;
  done: number;
  total: number;
};

type WeakSkill = {
  id: string;
  titleAr: string;
  titleEn: string;
  score: number;
  state: string;
  contentLanguage: ContentLanguage;
};

type State = DashboardAvailability & {
  signedIn: boolean;
  displayName: string;
  xp: number;
  coins: number;
  streak: number;
  masteryRows: {
    skill_id?: string;
    mastery_score: number;
    state: string;
    next_review_at: string | null;
    skills?: { id: string; title_ar: string; title_en: string; slug: string; course_id: string } | null;
  }[];
  weakSkills: WeakSkill[];
  lessons: number;
  completedLessons: number;
  nextLesson: { id: string; title_ar: string; title_en: string; unit_id?: string } | null;
  activeSubject: SubjectKey;
  activeTrackSlug: string;
  tracks: TrackProgress[];
  unread: number;
  curriculumReady: boolean;
  nextTask: { id: string; title: string; due_at: string | null } | null;
};

const initial: State = {
  ownerId: null,
  revision: -1,
  catalogReady: false,
  profileReady: false,
  evidenceReady: false,
  progressReady: false,
  notificationsReady: false,
  signedIn: false,
  displayName: "",
  xp: 0,
  coins: 0,
  streak: 0,
  masteryRows: [],
  weakSkills: [],
  lessons: 0,
  completedLessons: 0,
  nextLesson: null,
  activeSubject: "integrated-science",
  activeTrackSlug: "integrated-science-ar",
  tracks: [],
  unread: 0,
  curriculumReady: false,
  nextTask: null,
};

export function DashboardLive() {
  const locale = useLocale();
  const t = useCallback((ar: string, en: string) => localized(locale, ar, en), [locale]);
  const account = useVerifiedAccount();
  const [snapshot, setState] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const errorRevision = useRef(-1);
  const supabase = useMemo(() => createClient(), []);

  const visibility = dashboardVisibility(
    snapshot,
    {
      userId: account.user?.id ?? null,
      revision: account.revision.current,
      loading: account.loading,
      error: account.error,
    },
    loading,
  );

  const state = visibility.current ? snapshot : initial;
  const signedIn = Boolean(account.user) && !account.loading && !account.error;

  // Load Curriculum, User Profile, Evidence, and Tracks
  useEffect(() => {
    if (account.loading) return;
    let alive = true;
    const revision = account.revision.current;
    errorRevision.current = revision;
    setState(initial);

    void (async () => {
      setLoading(true);
      setError("");
      try {
        const [lessonsResult, tracksResult, auth] = await Promise.all([
          supabase
            .from("lessons")
            .select("id,title_ar,title_en,position,unit_id")
            .order("position"),
          supabase
            .from("curriculum_tracks")
            .select(
              "id,slug,content_language,title_ar,title_en,course_id,subjects(slug,title_ar,title_en,position,accent)",
            )
            .order("slug"),
          Promise.resolve({ data: { user: account.user } }),
        ]);

        const user = auth.data.user;
        if (lessonsResult.error || tracksResult.error)
          throw lessonsResult.error ?? tracksResult.error;
        const allLessons = lessonsResult.data ?? [];
        const rawTracks = tracksResult.data ?? [];

        const trackCourses = new Set(
          rawTracks.map((row) => row.course_id).filter((id): id is string => Boolean(id)),
        );
        const trackUnits = new Set<string>();
        const unitCourse = new Map<string, string>();

        if (trackCourses.size) {
          const units = await supabase
            .from("units")
            .select("id,course_id")
            .in("course_id", [...trackCourses]);
          for (const unit of units.data ?? []) {
            trackUnits.add(unit.id);
            unitCourse.set(unit.id, unit.course_id);
          }
        }

        const lessonsByUnit = new Map<string, string[]>();
        for (const lesson of allLessons) {
          if (!lesson.unit_id) continue;
          const list = lessonsByUnit.get(lesson.unit_id) ?? [];
          list.push(lesson.id);
          lessonsByUnit.set(lesson.unit_id, list);
        }

        const trackProgressList: TrackProgress[] = rawTracks.map((tr) => {
                const subject = tr.subjects as { slug: string } | null;
                const trackLessonIds = new Set<string>();
                for (const [unitId, courseId] of unitCourse) {
                  if (courseId !== tr.course_id) continue;
                  for (const id of lessonsByUnit.get(unitId) ?? []) trackLessonIds.add(id);
                }
                return {
                  id: tr.id,
                  slug: tr.slug,
                  subjectSlug: subject?.slug || "integrated-science",
                  contentLanguage: tr.content_language as ContentLanguage,
                  titleAr: tr.title_ar,
                  titleEn: tr.title_en,
                  courseId: tr.course_id,
                  done: 0,
                  total: trackLessonIds.size,
                };
              });

        const next: State = {
          ...initial,
          ownerId: user?.id ?? null,
          revision,
          catalogReady: true,
          signedIn: Boolean(user),
          lessons: allLessons.length,
          tracks: trackProgressList,
          curriculumReady: rawTracks.length > 0,
        };

        if (user) {
          const [p, m, progress, n, enrollment, tasks] = await Promise.all([
            supabase
              .from("profiles")
              .select("display_name,xp,coins,streak_days")
              .eq("id", user.id)
              .maybeSingle(),
            supabase
              .from("skill_evidence")
              .select("skill_id,mastery_score,state,next_review_at,skills(id,title_ar,title_en,slug,course_id)")
              .eq("user_id", user.id),
            supabase
              .from("lesson_progress")
              .select("lesson_id,completed_at")
              .eq("user_id", user.id),
            supabase
              .from("notifications")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .is("read_at", null),
            supabase
              .from("curriculum_enrollments")
              .select("track_id,updated_at")
              .eq("user_id", user.id)
              .order("updated_at", { ascending: false })
              .limit(1),
            supabase
              .from("study_tasks")
              .select("id,title,due_at")
              .eq("user_id", user.id)
              .eq("status", "open")
              .order("due_at", { ascending: true, nullsFirst: false })
              .limit(1),
          ]);

          next.profileReady = !p.error && p.data !== null;
          next.evidenceReady = !m.error && m.data !== null;
          next.progressReady = !progress.error && progress.data !== null;
          next.notificationsReady = !n.error && n.count !== null;

          if (next.profileReady && p.data) {
            next.displayName = p.data.display_name || "";
            next.xp = Number(p.data.xp || 0);
            next.coins = Number(p.data.coins || 0);
            next.streak = Number(p.data.streak_days || 0);
          }

          if (next.evidenceReady && m.data) {
            next.masteryRows = m.data as State["masteryRows"];
            next.weakSkills = (m.data as State["masteryRows"])
              .filter(
                (row) =>
                  row.mastery_score < 60 ||
                  row.state === "reteach" ||
                  row.state === "mixed" ||
                  row.state === "review",
              )
              .slice(0, 4)
              .map((row) => ({
                id: row.skill_id || row.skills?.id || "skill",
                titleAr: row.skills?.title_ar || t("مفهوم قيد المراجعة", "Concept in review"),
                titleEn: row.skills?.title_en || "Concept in review",
                score: row.mastery_score,
                state: row.state,
                contentLanguage:
                  next.tracks.find((track) => track.courseId === row.skills?.course_id)?.contentLanguage ?? "ar",
              }));
          }

          const doneSet = new Set(
            (progress.data ?? [])
              .filter((x) => x.completed_at)
              .map((x) => x.lesson_id),
          );

          // Update done count per track
          for (const tr of next.tracks) {
            const trackLessonIds = new Set<string>();
            for (const [unitId, courseId] of unitCourse) {
              if (courseId !== tr.courseId) continue;
              for (const id of lessonsByUnit.get(unitId) ?? []) trackLessonIds.add(id);
            }
            tr.done = [...trackLessonIds].filter((id) => doneSet.has(id)).length;
          }

          next.completedLessons = allLessons.filter((l) => doneSet.has(l.id)).length;

          // Determine active track: either from enrollment or default
          const enrolledTrackId = enrollment.data?.[0]?.track_id;
          const foundEnrolled = next.tracks.find((tr) => tr.id === enrolledTrackId);
          const activeTrack = foundEnrolled || next.tracks[0] || null;

          if (activeTrack) {
            next.activeTrackSlug = activeTrack.slug;
            next.activeSubject = (activeTrack.subjectSlug as SubjectKey) || "integrated-science";

            const activeCourseId = activeTrack.courseId;
            const activeUnits = new Set<string>();
            for (const [unitId, courseId] of unitCourse) {
              if (courseId === activeCourseId) activeUnits.add(unitId);
            }
            const activeTrackLessons = allLessons.filter(
              (l) => l.unit_id && activeUnits.has(l.unit_id),
            );
            const foundNext = activeTrackLessons.find((l) => !doneSet.has(l.id));
            if (foundNext) next.nextLesson = foundNext;
          }

          if (next.notificationsReady) next.unread = n.count ?? 0;
          if (!tasks.error && tasks.data?.[0]) next.nextTask = tasks.data[0];
        }

        if (alive && revision === account.revision.current) setState(next);
      } catch (e) {
        if (alive && revision === account.revision.current && account.user) {
          setError(e instanceof Error ? e.message : t("تعذّر الاتصال.", "Could not connect."));
        }
      } finally {
        if (alive && revision === account.revision.current) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [supabase, retry, account.user, account.loading, t]);

  // Handle instant track switching from the dashboard
  const handleSelectTrack = useCallback(
    (trackSlug: string) => {
      const tr = snapshot.tracks.find((item) => item.slug === trackSlug);
      if (!tr) return;
      const apply = () => setState((prev) => ({
        ...prev,
        activeTrackSlug: tr.slug,
        activeSubject: (tr.subjectSlug as SubjectKey) || prev.activeSubject,
      }));
      if (!account.user) {
        apply();
        return;
      }
      void supabase
        .from("curriculum_enrollments")
        .upsert(
          { user_id: account.user.id, track_id: tr.id, status: "active" },
          { onConflict: "user_id,track_id" },
        )
        .then(({ error: writeError }) => {
          if (writeError) setError(t("تعذّر تأكيد حفظ المسار.", "Could not confirm the track selection."));
          else apply();
        });
    },
    [account.user, snapshot.tracks, supabase, t],
  );

  // Derived Metrics
  const level = Math.floor(state.xp / 100) + 1;
  const levelProgress = state.xp % 100;
  const mastery = state.masteryRows.length
    ? Math.round(
        state.masteryRows.reduce((s, r) => s + Number(r.mastery_score), 0) /
          state.masteryRows.length,
      )
    : 0;
  const dueReviews = state.masteryRows.filter(
    (r) => r.next_review_at && new Date(r.next_review_at) <= new Date(),
  ).length;

  const currentActiveTrack = state.tracks.find((tr) => tr.slug === state.activeTrackSlug);
  const activeTrackPercent =
    currentActiveTrack && currentActiveTrack.total
      ? Math.round((currentActiveTrack.done / currentActiveTrack.total) * 100)
      : 0;

  // Active Subject details
  const activeSubjectMeta =
    SUBJECT_CATALOG.find((s) => s.slug === state.activeSubject) || SUBJECT_CATALOG[0];

  // Time-of-day greeting (client-hydrated to prevent SSR timezone mismatch)
  const [greeting, setGreeting] = useState(() => t("أهلاً بك", "Welcome"));
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(
      h < 12
        ? t("صباح الخير", "Good morning")
        : h < 18
          ? t("مساء الخير", "Good afternoon")
          : t("مساء النور", "Good evening"),
    );
  }, [t]);

  return (
    <div className="db-cockpit" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* 1. Dashboard Header & Greeting */}
      <div className="db-header">
        <div className="db-greeting">
          <div className="db-greeting-meta">
            <span className="db-badge-term">
              <span className="db-pulse" />
              <span>{t("الفصل الدراسي الأول 2026–2027 · الصف الأول الثانوي", "Term 1 · 2026–2027 · First Secondary")}</span>
            </span>
          </div>
          <h1>
            {signedIn && state.displayName
              ? `${greeting}، ${state.displayName}`
              : t("مرحباً بك في مساحة تعلّمك الذكية", "Welcome to Your Intelligent Learning Cockpit")}
          </h1>
          <p>
            {t(
              "مساحتك تجمع الدروس المتاحة، أدلة التعلّم المسجلة، والمهام التي حفظتها — من غير افتراض تقدّم غير موجود.",
              "Your workspace brings together available lessons, recorded learning evidence, and saved tasks without assuming progress.",
            )}
          </p>
        </div>

        <div className="db-header-actions">
          <div className="db-streak-pill" title={t("سلسلة أيام التعلم المتواصلة", "Continuous daily study streak")}>
            <span className="db-flame"><Icon name="flame" size={16} /></span>
            <span>{visibility.profile ? state.streak : "—"} {t("أيام استمرارية", "Day Streak")}</span>
          </div>
        </div>
      </div>

      {/* Error or Retry Banner (Only shown if signed-in user encountered actual error) */}
      {signedIn && (account.error || error) && (
        <div className="error-banner" role="alert">
          <span>{account.error || error}</span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setLoading(true);
              setRetry((r) => r + 1);
            }}
          >
            {t("إعادة المحاولة", "Try again")}
          </button>
        </div>
      )}

      {/* 2. Grand Spotlight Hero — "What to focus on now" + "Where I left off" */}
      <section className="db-spotlight" aria-label={t("خطوتك المقترحة الآن", "Your Suggested Focus Now")}>
        <div className="db-spotlight-content">
          <div className="db-spotlight-eyebrow">
            <span className="inline-flex items-center gap-1.5"><Icon name="zap" size={14} /> {t("خطوتك التالية ذات الأولوية القصوى", "High-Priority Learning Focus")}</span>
            <span className="db-spotlight-subject-tag">
              {locale === "en" ? activeSubjectMeta.titleEn : activeSubjectMeta.titleAr}
              {currentActiveTrack ? ` (${currentActiveTrack.contentLanguage.toUpperCase()})` : ""}
            </span>
          </div>

          <h2>
            {state.nextLesson
              ? currentActiveTrack?.contentLanguage === "en"
                ? state.nextLesson.title_en || state.nextLesson.title_ar
                : state.nextLesson.title_ar
              : t("ابدأ رحلتك باختيار أول درس", "Select your first lesson to begin")}
          </h2>

          <p>
            {currentActiveTrack
              ? t(
                  `أنجزت ${currentActiveTrack.done} من أصل ${currentActiveTrack.total} دروس في مسار «${locale === "en" ? currentActiveTrack.titleEn : currentActiveTrack.titleAr}». تابع الآن لتثبيت الفهم بالحل الفوري.`,
                  `Completed ${currentActiveTrack.done} of ${currentActiveTrack.total} lessons in “${currentActiveTrack.titleEn}”. Continue now to reinforce concepts with immediate practice.`,
                )
              : t("اختر مسارًا منشورًا من مصدر المنهج المتصل لبدء التعلّم.", "Choose a track published by the connected curriculum source to begin.")}
          </p>

          <div className="db-spotlight-progress-wrap">
            <div className="db-spotlight-progress-meta">
              <span>{t("تقدّم المسار النشط", "Active Track Progress")}</span>
              <span>{activeTrackPercent}%</span>
            </div>
            <div className="db-spotlight-progress-bar">
              <div className="db-spotlight-progress-fill" style={{ width: `${activeTrackPercent}%` }} />
            </div>
          </div>

          <div className="db-spotlight-actions">
            <Link
              href={state.nextLesson ? `/lesson/${encodeURIComponent(state.nextLesson.id)}` : "/learn"}
              className="db-btn-primary"
            >
              <span>{state.nextLesson ? t("متابعة الدرس الآن", "Continue Lesson Now") : t("استكشف المنهج", "Explore Curriculum")}</span>
              <Icon name="arrow" size={16} />
            </Link>

            <Link href="/study?tab=generator" className="db-btn-secondary">
              <Icon name="sparkles" size={16} />
              <span>{t("⚡ مولّد QuizGecko الذكي", "⚡ QuizGecko Generator")}</span>
            </Link>

            <Link href="/ai" className="db-btn-secondary">
              <Icon name="ai" size={16} />
              <span>{t("مناقشة المفهوم مع Noäta AI", "Discuss with Noäta AI")}</span>
            </Link>
          </div>
        </div>

        <div className="db-spotlight-aside">
          <div className="db-quick-target">
            <div className="db-target-icon"><Icon name="lightbulb" size={20} /></div>
            <div className="db-target-info">
              <h4>{t("خطوة تعلم عملية", "A practical learning step")}</h4>
              <p>
                {t(
                  "بعد قراءة جزء ذي معنى، حاول استرجاع الفكرة من الذاكرة ثم راجع تفسير الخطأ. لا نعرض نسبة تأثير غير موثقة.",
                  "After a meaningful section, retrieve the idea from memory and review any mistake. No unsupported impact percentage is claimed.",
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Metrics Grid — The 4 Grand Learning Pillars */}
      <section className="db-metrics-grid" aria-label={t("مؤشرات الأداء والإتقان", "Performance Metrics")}>
        {/* Metric 1: Level & XP */}
        <article className="db-metric-card">
          <div className="db-metric-top">
            <span>{t("المستوى وخبرة التعلم", "Level & Learning XP")}</span>
            <div className="db-metric-icon"><Icon name="star" size={18} /></div>
          </div>
          <p className="db-metric-value">{visibility.profile ? t(`المستوى ${level}`, `Level ${level}`) : "—"}</p>
          <div className="db-card-progress" style={{ marginTop: 8 }}>
            <div className="db-card-progress-bar">
              <div className="db-card-progress-fill" style={{ width: `${visibility.profile ? levelProgress : 0}%`, background: "#818cf8" }} />
            </div>
          </div>
          <span className="db-metric-sub">
            {visibility.profile ? `${state.xp.toLocaleString()} XP · ${t(`باقي ${100 - levelProgress} XP للمستوى التالي`, `${100 - levelProgress} XP to Level ${level + 1}`)}` : t("لم يتم التحقق من الرصيد", "Balance not verified")}
          </span>
        </article>

        {/* Metric 2: Spaced Repetition Due (SM-2) */}
        <article className="db-metric-card">
          <div className="db-metric-top">
            <span>{t("مراجعة المهارات المجدولة", "Scheduled skill review")}</span>
            <div className="db-metric-icon" style={{ color: dueReviews > 0 ? "#f59e0b" : "#34d399" }}>
              <Icon name={dueReviews > 0 ? "clock" : "sparkles"} size={18} />
            </div>
          </div>
          <p className="db-metric-value" style={{ color: dueReviews > 0 ? "#fde68a" : "#6ee7b7" }}>
            {visibility.evidence ? (dueReviews > 0 ? dueReviews : t("لا شيء مستحق", "Nothing due")) : "—"}
          </p>
          <span className="db-metric-sub">
            {!visibility.evidence
              ? t("لم يتم التحقق من أدلة التعلّم", "Learning evidence not verified")
              : dueReviews > 0
              ? t("مفاهيم مستحقة المراجعة لتجنب النسيان", "Concepts due for recall today")
              : t("لا توجد مهارات حان موعدها الآن", "No skills are due right now")}
          </span>
          {dueReviews > 0 && (
            <Link href="/review" className="db-section-link" style={{ marginTop: 6 }}>
              {t("بدء جلسة الاسترجاع الآن ←", "Start recall drill now →")}
            </Link>
          )}
        </article>

        {/* Metric 3: Skill Mastery Rate */}
        <article className="db-metric-card">
          <div className="db-metric-top">
            <span>{t("معدل إتقان المهارات", "Skill Mastery Rate")}</span>
            <div className="db-metric-icon"><Icon name="target" size={18} /></div>
          </div>
          <p className="db-metric-value">{visibility.evidence && state.masteryRows.length ? mastery + "%" : "—"}</p>
          <span className="db-metric-sub">
            {state.masteryRows.length} {t("مهارات مقاسة بنظام التصحيح الحتمي", "skills measured by deterministic engine")}
          </span>
        </article>

        {/* Metric 4: Lessons Completed */}
        <article className="db-metric-card">
          <div className="db-metric-top">
            <span>{t("الدروس المكتملة", "Lessons Completed")}</span>
            <div className="db-metric-icon"><Icon name="book" size={18} /></div>
          </div>
          <p className="db-metric-value">{visibility.progress ? `${state.completedLessons} / ${state.lessons}` : "—"}</p>
          <span className="db-metric-sub">
            {visibility.progress ? t("عبر الدروس المنشورة في المصدر المتصل", "across lessons in the connected published source") : t("لم يتم التحقق من التقدّم", "Progress not verified")}
          </span>
        </article>
      </section>

      {/* 4. Two-Column Working Grid: Daily Focus & Weak Areas Radar */}
      <section className="db-two-col">
        {/* Col 1: persisted plan and evidence-based actions */}
        <div className="db-panel">
          <div className="db-panel-head">
            <h4>
              <span className="inline-flex items-center text-indigo-400"><Icon name="clipboard" size={18} /></span>
              <span>{t("خطواتك التالية", "Your next steps")}</span>
            </h4>
            <Link href="/study" className="db-section-link">{t("إدارة الخطة ←", "Manage plan →")}</Link>
          </div>

          <div className="db-targets-list">
            <Link className="db-target-item" href={state.nextLesson ? `/lesson/${encodeURIComponent(state.nextLesson.id)}` : "/learn"}>
              <div className="db-target-check">1</div>
              <div className="db-target-copy">
                <strong>{state.nextLesson ? (currentActiveTrack?.contentLanguage === "en" ? state.nextLesson.title_en : state.nextLesson.title_ar) : t("اختر درسًا منشورًا", "Choose a published lesson")}</strong>
                <small>{state.nextLesson ? t("أول درس غير مكتمل في مسارك النشط", "First incomplete lesson in your active track") : t("لا يوجد اقتراح درس مؤكد بعد", "No verified lesson recommendation yet")}</small>
              </div>
              <span className="db-target-time">→</span>
            </Link>

            <Link className="db-target-item" href="/review">
              <div className="db-target-check">2</div>
              <div className="db-target-copy">
                <strong>{dueReviews > 0 ? t(`راجع ${dueReviews} مهارات مستحقة`, `Review ${dueReviews} due skills`) : t("افتح مراجعة المهارات", "Open skill review")}</strong>
                <small>{visibility.evidence ? t("مبني على مواعيد المحاولات المسجلة", "Based on recorded attempt schedules") : t("يظهر العدد بعد التحقق من أدلة حسابك", "The count appears after account evidence is verified")}</small>
              </div>
              <span className="db-target-time">→</span>
            </Link>

            <Link className="db-target-item" href="/study">
              <div className="db-target-check">3</div>
              <div className="db-target-copy">
                <strong>{state.nextTask?.title || t("أنشئ مهمة مذاكرة شخصية", "Create a personal study task")}</strong>
                <small>{state.nextTask?.due_at ? `${t("الموعد: ", "Due: ")}${new Date(state.nextTask.due_at).toLocaleString(locale === "en" ? "en" : "ar-EG")}` : t("مهمة محفوظة بحسابك، منفصلة عن واجبات المعلم", "Saved to your account, separate from teacher assignments")}</small>
              </div>
              <span className="db-target-time">→</span>
            </Link>
          </div>
        </div>

        {/* Col 2: Areas Needing Attention & Weak Concepts Radar */}
        <div className="db-panel">
          <div className="db-panel-head">
            <h4>
              <span className="inline-flex items-center text-cyan-400"><Icon name="microscope" size={18} /></span>
              <span>{t("رادار المفاهيم الشائكة والمراجعة", "Concept Clarification Radar")}</span>
            </h4>
            <Link href="/review" className="db-section-link">
              {t("مركز المراجعة ←", "Review Hub →")}
            </Link>
          </div>

          {state.weakSkills.length > 0 ? (
            <div className="db-weak-list">
              {state.weakSkills.map((sk) => (
                <div key={sk.id} className="db-weak-item">
                  <div className="db-weak-copy">
                    <strong>{sk.contentLanguage === "en" ? sk.titleEn : sk.titleAr}</strong>
                    <small>{t(`إتقان حالي: ${sk.score}% · يحتاج لتدريب`, `Mastery: ${sk.score}% · Needs drill`)}</small>
                  </div>
                  <Link
                    href={`/ai?prompt=${encodeURIComponent(`اشرح لي المفهوم بالتفصيل مع أمثلة محلولة: ${sk.titleAr}`)}`}
                    className="db-weak-action"
                  >
                    {t("شرح مع Noäta AI", "Explain with AI")}
                  </Link>
                </div>
              ))}
            </div>
          ) : state.masteryRows.length > 0 ? (
            <div className="db-weak-empty">
              <span className="inline-flex text-emerald-400"><Icon name="award" size={32} /></span>
              <strong>{t("أداء رائع! لا توجد مغالطات مفاهيمية معلقة", "Outstanding! No pending misconceptions")}</strong>
              <p>{t("كل المهارات التي درستها حتى الآن مستقرة ومتقنة.", "All skills studied so far are well consolidated.")}</p>
            </div>
          ) : (
            <div className="db-weak-empty">
              <span className="inline-flex text-cyan-400"><Icon name="target" size={32} /></span>
              <strong>{t("لا توجد أدلة مهارة كافية بعد", "No skill evidence yet")}</strong>
              <p>{t("أكمل أسئلة منشورة لتظهر نقاط القوة والمفاهيم التي تحتاج مراجعة.", "Complete published questions to reveal strengths and concepts needing review.")}</p>
            </div>
          )}
        </div>
      </section>

      {/* 5. Curriculum Cockpit — 6 Subjects & 8 Tracks */}
      <section className="db-section">
        <div className="db-section-heading">
          <h3>
            <span className="inline-flex items-center text-indigo-400"><Icon name="book" size={20} /></span>
            <span>{t("المواد الدراسية ومسارات المحتوى المتاحة", "Core Subjects & Available Tracks")}</span>
          </h3>
          <Link href="/learn" className="db-section-link">
            {t("استعراض كافة الوحدات والدروس ←", "Browse all units & lessons →")}
          </Link>
        </div>

        <div className="db-curriculum-grid" style={{ marginTop: 14 }}>
          {SUBJECT_CATALOG.map((subj) => {
            const subjTracks = state.tracks.filter((tr) => tr.subjectSlug === subj.slug);
            const activeTr = subjTracks.find((tr) => tr.slug === state.activeTrackSlug) || subjTracks[0];
            const percent = activeTr && activeTr.total ? Math.round((activeTr.done / activeTr.total) * 100) : 0;

            const crestIconMap: Record<string, string> = {
              "integrated-science": "microscope",
              mathematics: "compass",
              history: "landmark",
              "arabic-language": "feather",
              english: "globe",
              "philosophy-logic": "lightbulb",
            };

            return (
              <div key={subj.key} className="db-curriculum-card">
                <div className="db-card-head">
                  <span className="db-subject-crest">
                    <Icon name={crestIconMap[subj.key] || "book"} size={18} />
                  </span>

                  {/* Dual-language track switcher for Science and Mathematics */}
                  {subj.dualLanguage && subjTracks.length > 1 ? (
                    <div className="db-track-toggle" onClick={(e) => e.stopPropagation()} role="group" aria-label={t("اختر لغة المسار", "Select track language")}>
                      {subjTracks.map((tr) => {
                        const isEn = tr.contentLanguage === "en";
                        const isSelected = activeTr?.slug === tr.slug;
                        return (
                          <button
                            key={tr.slug}
                            type="button"
                            className={`db-track-toggle-btn ${isSelected ? "is-active" : ""}`}
                            onClick={() => handleSelectTrack(tr.slug)}
                            title={isEn ? t("مسار المحتوى الإنجليزي", "English-content track") : t("مسار المحتوى العربي", "Arabic-content track")}
                          >
                            <span>{isEn ? "English" : "عربي"}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold text-[#94a3b8] px-2 py-0.5 rounded bg-white/[0.05]">
                      {activeTr?.contentLanguage === "en" ? "English" : "العربية"}
                    </span>
                  )}
                </div>

                <h4>
                  {locale === "en" ? subj.titleEn : subj.titleAr}
                  {subj.dualLanguage && activeTr?.contentLanguage === "en" && (
                    <span className="text-[11px] font-medium text-cyan-400 block mt-0.5">
                      {t("مسار المحتوى الإنجليزي", "English-content track")}
                    </span>
                  )}
                </h4>
                <p>{locale === "en" ? subj.descriptionEn : subj.descriptionAr}</p>

                <div className="db-card-progress">
                  <div className="db-card-progress-meta">
                    <span>
                      {activeTr
                        ? activeTr.done === 0
                          ? t("لم تبدأ بعد", "Not started yet")
                          : locale === "ar"
                            ? <span>أنجزت <bdi dir="ltr">{activeTr.done}</bdi> من <bdi dir="ltr">{activeTr.total}</bdi> درس</span>
                            : `${activeTr.done} of ${activeTr.total} lessons`
                        : t("لم يبدأ", "Not started")}
                    </span>
                    <strong>
                      {activeTr && activeTr.done > 0
                        ? `${percent}%`
                        : activeTr && activeTr.done === 0
                          ? t("جاهز للتعلّم", "Ready")
                          : t("غير متاح", "Unavailable")}
                    </strong>
                  </div>
                  <div className="db-card-progress-bar">
                    <div
                      className="db-card-progress-fill"
                      style={{
                        width: `${percent}%`,
                        background:
                          subj.accent === "cyan"
                            ? "#22d3ee"
                            : subj.accent === "indigo"
                              ? "#818cf8"
                              : subj.accent === "amber"
                                ? "#fbbf24"
                                : subj.accent === "teal"
                                  ? "#2dd4bf"
                                  : subj.accent === "rose"
                                    ? "#fb7185"
                                    : "#c084fc",
                      }}
                    />
                  </div>
                </div>

                <Link
                  href={`/learn?track=${activeTr?.slug || subj.slug}`}
                  className="db-section-link"
                  style={{ marginTop: 10, alignSelf: "flex-end" }}
                >
                  {t("فتح المادة ←", "Open Subject →")}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Quick Action Command Launcher */}
      <section className="db-section" style={{ marginTop: 10 }}>
        <div className="db-section-heading">
          <h3>
            <span className="inline-flex items-center text-amber-400"><Icon name="zap" size={20} /></span>
            <span>{t("قاذفة الأدوات والأنشطة الذكية", "Quick Action Command Launcher")}</span>
          </h3>
        </div>

        <div className="db-launcher-grid" style={{ marginTop: 14 }}>
          <Link href="/ai" className="db-launcher-card">
            <div className="db-launcher-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
              <Icon name="bot" size={22} />
            </div>
            <div className="db-launcher-info">
              <strong>{t("مساعد Noäta AI الذكي", "Noäta AI Study Companion")}</strong>
              <small>{t("حوار سقراطي، اختبار، تلخيص، وإنشاء بطاقات", "Socratic dialogue, quizzes, and summaries")}</small>
            </div>
          </Link>

          <Link href="/review" className="db-launcher-card">
            <div className="db-launcher-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
              <Icon name="clock" size={22} />
            </div>
            <div className="db-launcher-info">
              <strong>{t("المراجعة المتباعدة الذكية", "Spaced Recall Deck")}</strong>
              <small>{t("استرجاع المفاهيم في أوقات ذروة النسيان", "Retrieve concepts at peak retention intervals")}</small>
            </div>
          </Link>

          <Link href="/missions" className="db-launcher-card">
            <div className="db-launcher-icon" style={{ background: "rgba(34, 211, 238, 0.15)", color: "#22d3ee" }}>
              <Icon name="target" size={22} />
            </div>
            <div className="db-launcher-info">
              <strong>{t("المهام والتطبيقات الفورية", "Interactive Missions")}</strong>
              <small>{t("تحديات تطبيقية لاختبار الفهم وتفكيك المغالطات", "Applied challenges testing comprehension")}</small>
            </div>
          </Link>

          <Link href="/boss" className="db-launcher-card">
            <div className="db-launcher-icon" style={{ background: "rgba(236, 72, 153, 0.15)", color: "#f472b6" }}>
              <Icon name="swords" size={22} />
            </div>
            <div className="db-launcher-info">
              <strong>{t("تحدي نهاية الوحدة", "Unit Mastery Challenge")}</strong>
              <small>{t("اجتز التحدي التراكمي الشامل للانتقال للمستوى التالي", "Comprehensive boss challenge to unlock next level")}</small>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
