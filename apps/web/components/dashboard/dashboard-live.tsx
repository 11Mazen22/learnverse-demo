"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";
import { NoataLogo } from "@/components/ui/noata-logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { dashboardVisibility, type DashboardAvailability } from "@/lib/dashboard/visibility";
import { localizedTimestamp } from "@/lib/dashboard/relative-time";
import { computeNextAction, type DueAssignmentSummary } from "@/lib/dashboard/next-action";
import { buildConsistencyHeatmap, type StudyActivityEvent } from "@/lib/dashboard/activity";
import {
  DEFAULT_DASHBOARD_PREFERENCES,
  parseDashboardPreferences,
  scopedDashboardPreferencesKey,
  serializeDashboardPreferences,
  type DashboardPreferences,
  type DashboardWidgetId,
} from "@/lib/dashboard/preferences";
import { localized, useLocale } from "@/lib/i18n/locale";
import {
  SUBJECT_CATALOG,
  type ContentLanguage,
  type SubjectKey,
} from "@/lib/curriculum/catalog";
import { StreakMilestoneRoad } from "@/components/ui/achievement-celebration";
import { CustomizeDashboardDrawer } from "./customize-drawer";

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

type StudyTaskItem = {
  id: string;
  title: string;
  status: "open" | "completed" | "dismissed";
  priority: "low" | "normal" | "high";
  due_at: string | null;
  completed_at: string | null;
  task_type: string;
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
    skills?: {
      id: string;
      title_ar: string;
      title_en: string;
      slug: string;
      course_id: string;
    } | null;
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
  dueFlashcards: number;
  dueAssignments: DueAssignmentSummary[];
  studyTasks: StudyTaskItem[];
  activityEvents: StudyActivityEvent[];
  preferences: DashboardPreferences;
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
  dueFlashcards: 0,
  dueAssignments: [],
  studyTasks: [],
  activityEvents: [],
  preferences: DEFAULT_DASHBOARD_PREFERENCES,
};

const SUBJECT_CREST_ICONS: Record<string, string> = {
  "integrated-science": "microscope",
  mathematics: "compass",
  history: "landmark",
  "arabic-language": "feather",
  english: "globe",
  "philosophy-logic": "lightbulb",
};

const SUBJECT_ACCENT_VAR: Record<string, string> = {
  cyan: "var(--accent)",
  indigo: "var(--chart-2, var(--accent))",
  amber: "var(--warning)",
  teal: "var(--success)",
  rose: "var(--danger)",
  violet: "var(--chart-3, var(--accent))",
};

export function DashboardLive() {
  const locale = useLocale();
  const t = useCallback((ar: string, en: string) => localized(locale, ar, en), [locale]);
  const account = useVerifiedAccount();
  const { push: pushToast } = useToast();
  const [snapshot, setState] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [pendingTaskIds, setPendingTaskIds] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_DASHBOARD_PREFERENCES);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (account.loading) return;
    try {
      const raw = localStorage.getItem(scopedDashboardPreferencesKey(account.user?.id ?? null));
      if (raw) setPreferences(parseDashboardPreferences(JSON.parse(raw)));
      else setPreferences(DEFAULT_DASHBOARD_PREFERENCES);
    } catch {
      setPreferences(DEFAULT_DASHBOARD_PREFERENCES);
    }
  }, [account.loading, account.user?.id]);

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

  useEffect(() => {
    if (account.loading) return;
    let alive = true;
    const revision = account.revision.current;
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
        if (lessonsResult.error || tracksResult.error) {
          throw lessonsResult.error ?? tracksResult.error;
        }
        const allLessons = lessonsResult.data ?? [];
        const rawTracks = tracksResult.data ?? [];

        const trackCourses = new Set(
          rawTracks.map((row) => row.course_id).filter((id): id is string => Boolean(id)),
        );
        const unitCourse = new Map<string, string>();

        if (trackCourses.size) {
          const units = await supabase
            .from("units")
            .select("id,course_id")
            .in("course_id", [...trackCourses]);
          for (const unit of units.data ?? []) {
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

        let localPrefs = DEFAULT_DASHBOARD_PREFERENCES;
        try {
          const rawLocal = localStorage.getItem(scopedDashboardPreferencesKey(user?.id ?? null));
          if (rawLocal) localPrefs = parseDashboardPreferences(JSON.parse(rawLocal));
        } catch {
          /* Ignore storage errors */
        }

        const next: State = {
          ...initial,
          ownerId: user?.id ?? null,
          revision,
          catalogReady: true,
          signedIn: Boolean(user),
          lessons: allLessons.length,
          tracks: trackProgressList,
          curriculumReady: rawTracks.length > 0,
          preferences: localPrefs,
        };

        if (user) {
          const windowCutoffIso = new Date(Date.now() - 15 * 86_400_000).toISOString();
          const nowIso = new Date().toISOString();

          const [
            p,
            m,
            progress,
            n,
            enrollment,
            tasks,
            dueCardsRes,
            reviewsRes,
            attemptsRes,
            assignmentsRes,
            submissionsRes,
            settingsRes,
          ] = await Promise.all([
            supabase
              .from("profiles")
              .select("display_name,xp,coins,streak_days")
              .eq("id", user.id)
              .maybeSingle(),
            supabase
              .from("skill_evidence")
              .select(
                "skill_id,mastery_score,state,next_review_at,skills(id,title_ar,title_en,slug,course_id)",
              )
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
              .select("id,title,status,priority,due_at,completed_at,task_type")
              .eq("user_id", user.id)
              .in("status", ["open", "completed"])
              .order("due_at", { ascending: true, nullsFirst: false })
              .limit(12),
            supabase
              .from("flashcards")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("suspended", false)
              .lte("due_at", nowIso),
            supabase
              .from("flashcard_reviews")
              .select("created_at")
              .eq("user_id", user.id)
              .gte("created_at", windowCutoffIso)
              .limit(200),
            supabase
              .from("attempts")
              .select("created_at")
              .eq("user_id", user.id)
              .gte("created_at", windowCutoffIso)
              .limit(200),
            supabase
              .from("assignments")
              .select("id,title,due_at,published_at")
              .not("published_at", "is", null)
              .order("due_at", { ascending: true, nullsFirst: false })
              .limit(10),
            supabase
              .from("assignment_submissions")
              .select("assignment_id,submitted_at")
              .eq("student_id", user.id)
              .not("submitted_at", "is", null),
            supabase
              .from("user_settings")
              .select("dashboard_preferences")
              .eq("user_id", user.id)
              .maybeSingle(),
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

          if (!settingsRes.error && settingsRes.data?.dashboard_preferences) {
            const parsedServerPrefs = parseDashboardPreferences(settingsRes.data.dashboard_preferences);
            next.preferences = parsedServerPrefs;
            if (alive && revision === account.revision.current) {
              setPreferences(parsedServerPrefs);
            }
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
                titleEn: row.skills?.title_en || t("مفهوم قيد المراجعة", "Concept in review"),
                score: row.mastery_score,
                state: row.state,
                contentLanguage:
                  next.tracks.find((track) => track.courseId === row.skills?.course_id)
                    ?.contentLanguage ?? "ar",
              }));
          }

          const doneSet = new Set(
            (progress.data ?? [])
              .filter((x) => x.completed_at)
              .map((x) => x.lesson_id),
          );

          for (const tr of next.tracks) {
            const trackLessonIds = new Set<string>();
            for (const [unitId, courseId] of unitCourse) {
              if (courseId !== tr.courseId) continue;
              for (const id of lessonsByUnit.get(unitId) ?? []) trackLessonIds.add(id);
            }
            tr.done = [...trackLessonIds].filter((id) => doneSet.has(id)).length;
          }

          next.completedLessons = allLessons.filter((l) => doneSet.has(l.id)).length;

          const enrolledTrackId = enrollment.data?.[0]?.track_id;
          const foundEnrolled = next.tracks.find((tr) => tr.id === enrolledTrackId);
          const activeTrack = foundEnrolled || next.tracks[0] || null;

          if (activeTrack) {
            next.activeTrackSlug = activeTrack.slug;
            next.activeSubject = (activeTrack.subjectSlug as SubjectKey) || "integrated-science";

            const activeUnits = new Set<string>();
            for (const [unitId, courseId] of unitCourse) {
              if (courseId === activeTrack.courseId) activeUnits.add(unitId);
            }
            const activeTrackLessons = allLessons.filter(
              (l) => l.unit_id && activeUnits.has(l.unit_id),
            );
            const foundNext = activeTrackLessons.find((l) => !doneSet.has(l.id));
            if (foundNext) next.nextLesson = foundNext;
          }

          if (next.notificationsReady) next.unread = n.count ?? 0;
          if (!dueCardsRes.error && typeof dueCardsRes.count === "number") {
            next.dueFlashcards = dueCardsRes.count;
          }

          if (!assignmentsRes.error && assignmentsRes.data) {
            const submittedIds = new Set(
              (submissionsRes.data ?? []).map((row) => row.assignment_id),
            );
            next.dueAssignments = assignmentsRes.data
              .filter((a) => !submittedIds.has(a.id))
              .map((a) => ({ id: a.id, title: a.title, due_at: a.due_at }));
          }

          if (!tasks.error && tasks.data) {
            next.studyTasks = tasks.data.map((row) => ({
              id: row.id,
              title: row.title,
              status: row.status as StudyTaskItem["status"],
              priority: row.priority as StudyTaskItem["priority"],
              due_at: row.due_at,
              completed_at: row.completed_at,
              task_type: row.task_type,
            }));
          }

          // Collect study activity timestamps strictly from server records for 14-day heatmap
          const events: StudyActivityEvent[] = [];
          for (const row of progress.data ?? []) {
            if (row.completed_at) events.push({ timestamp: row.completed_at, kind: "lesson" });
          }
          for (const row of reviewsRes.data ?? []) {
            if (row.created_at) events.push({ timestamp: row.created_at, kind: "flashcard" });
          }
          for (const row of attemptsRes.data ?? []) {
            if (row.created_at) events.push({ timestamp: row.created_at, kind: "attempt" });
          }
          for (const task of next.studyTasks) {
            if (task.completed_at) events.push({ timestamp: task.completed_at, kind: "task" });
          }
          next.activityEvents = events;
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
  }, [supabase, retry, account.user, account.loading, account.revision, t]);

  // Instant curriculum track switcher persisted to curriculum_enrollments
  const handleSelectTrack = useCallback(
    (trackSlug: string) => {
      const tr = snapshot.tracks.find((item) => item.slug === trackSlug);
      if (!tr) return;
      const apply = () =>
        setState((prev) => ({
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
          if (writeError) {
            pushToast({
              title: t("تعذّر حفظ اختيار المسار.", "Could not save track selection."),
              tone: "danger",
            });
          } else {
            apply();
          }
        });
    },
    [account.user, pushToast, snapshot.tracks, supabase, t],
  );

  // Optimistic inline completion toggle for personal study tasks
  const handleToggleStudyTask = useCallback(
    async (task: StudyTaskItem) => {
      if (!account.user) return;
      const completing = task.status !== "completed";
      const nowIso = new Date().toISOString();
      const nextStatus: StudyTaskItem["status"] = completing ? "completed" : "open";
      const nextCompletedAt = completing ? nowIso : null;

      setPendingTaskIds((curr) => [...curr, task.id]);
      const prevTasks = snapshot.studyTasks;

      setState((prev) => ({
        ...prev,
        studyTasks: prev.studyTasks.map((item) =>
          item.id === task.id
            ? { ...item, status: nextStatus, completed_at: nextCompletedAt }
            : item,
        ),
        activityEvents: completing
          ? [...prev.activityEvents, { timestamp: nowIso, kind: "task" }]
          : prev.activityEvents,
      }));

      const { error: updateError } = await supabase
        .from("study_tasks")
        .update({ status: nextStatus, completed_at: nextCompletedAt })
        .eq("id", task.id)
        .eq("user_id", account.user.id);

      setPendingTaskIds((curr) => curr.filter((id) => id !== task.id));

      if (updateError) {
        setState((prev) => ({ ...prev, studyTasks: prevTasks }));
        pushToast({
          title: t("تعذّر تحديث حالة المهمة، أُعيدت كما كانت.", "Could not update task; reverted."),
          tone: "danger",
        });
      } else {
        pushToast({
          title: completing
            ? t("أُنجزت المهمة وسُجّلت في يومك.", "Task marked complete.")
            : t("أُعيدت المهمة إلى قائمة الانتظار.", "Task reopened."),
          tone: "success",
        });
      }
    },
    [account.user, pushToast, snapshot.studyTasks, supabase, t],
  );

  // Save dashboard layout & weekly goals (user_settings.dashboard_preferences when signed in)
  const handleSavePreferences = useCallback(
    async (nextPrefs: DashboardPreferences) => {
      const normalized = parseDashboardPreferences(nextPrefs);
      const prevPrefs = preferences;
      setSavingPrefs(true);
      setPreferences(normalized);
      setState((prev) => ({ ...prev, preferences: normalized }));

      try {
        try {
          localStorage.setItem(
            scopedDashboardPreferencesKey(account.user?.id ?? null),
            JSON.stringify(serializeDashboardPreferences(normalized)),
          );
        } catch {
          /* Optional storage */
        }

        if (account.user) {
          const { error: saveErr } = await supabase.from("user_settings").upsert(
            {
              user_id: account.user.id,
              dashboard_preferences: serializeDashboardPreferences(normalized) as Record<
                string,
                never
              >,
            },
            { onConflict: "user_id" },
          );
          if (saveErr) throw saveErr;
        }

        pushToast({
          title: t("تم حفظ تخطيط لوحة التحكم وأهدافك الأسبوعية.", "Dashboard layout & goals saved."),
          tone: "success",
        });
        setCustomizerOpen(false);
      } catch {
        setPreferences(prevPrefs);
        setState((prev) => ({ ...prev, preferences: prevPrefs }));
        pushToast({
          title: t("تعذّر حفظ التفضيلات في الخادم، أُعيد التخطيط السابق.", "Could not save preferences; reverted."),
          tone: "danger",
        });
      } finally {
        setSavingPrefs(false);
      }
    },
    [account.user, preferences, pushToast, supabase, t],
  );

  // Derived metrics (strictly server-backed, XP never conflated with Mastery)
  const level = Math.floor(state.xp / 100) + 1;
  const levelProgress = state.xp % 100;
  const mastery = state.masteryRows.length
    ? Math.round(
        state.masteryRows.reduce((s, r) => s + Number(r.mastery_score), 0) /
          state.masteryRows.length,
      )
    : 0;
  const dueSkillsCount = state.masteryRows.filter(
    (r) => r.next_review_at && new Date(r.next_review_at) <= new Date(),
  ).length;
  const totalDueRecall = dueSkillsCount + state.dueFlashcards;

  const currentActiveTrack = state.tracks.find((tr) => tr.slug === state.activeTrackSlug);
  const activeTrackPercent =
    currentActiveTrack && currentActiveTrack.total
      ? Math.round((currentActiveTrack.done / currentActiveTrack.total) * 100)
      : 0;

  const activeSubjectMeta =
    SUBJECT_CATALOG.find((s) => s.slug === state.activeSubject) || SUBJECT_CATALOG[0];
  const searchLocale = locale === "en" ? "en" : "ar";

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

  const recommended = useMemo(
    () =>
      computeNextAction({
        signedIn: state.signedIn,
        evidenceReady: visibility.evidence,
        progressReady: visibility.progress,
        dueAssignments: state.dueAssignments,
        dueFlashcards: state.dueFlashcards,
        dueSkills: dueSkillsCount,
        nextLesson: state.nextLesson,
        activeTrack: currentActiveTrack
          ? {
              slug: currentActiveTrack.slug,
              titleAr: currentActiveTrack.titleAr,
              titleEn: currentActiveTrack.titleEn,
              contentLanguage: currentActiveTrack.contentLanguage,
              done: currentActiveTrack.done,
              total: currentActiveTrack.total,
            }
          : null,
      }),
    [
      state.signedIn,
      visibility.evidence,
      visibility.progress,
      state.dueAssignments,
      state.dueFlashcards,
      dueSkillsCount,
      state.nextLesson,
      currentActiveTrack,
    ],
  );

  const consistency = useMemo(
    () =>
      buildConsistencyHeatmap(state.activityEvents, {
        windowDays: 14,
        locale: searchLocale,
      }),
    [state.activityEvents, searchLocale],
  );

  const weeklyCardsPct = Math.min(
    100,
    Math.round(
      (consistency.weeklyProgress.flashcards / Math.max(1, preferences.goals.weeklyCardsTarget)) *
        100,
    ),
  );
  const weeklyLessonsPct = Math.min(
    100,
    Math.round(
      (consistency.weeklyProgress.lessons / Math.max(1, preferences.goals.weeklyLessonsTarget)) *
        100,
    ),
  );

  const openStudyTasks = state.studyTasks.filter((task) => task.status === "open");
  const recentDoneTasks = state.studyTasks.filter((task) => task.status === "completed").slice(0, 2);

  // Configurable widgets keyed cleanly so users can reorder or hide them via Customizer Drawer
  const widgetMap: Record<DashboardWidgetId, ReactNode> = {
    metrics: (
      <section
        key="metrics"
        className="db-metrics-grid"
        data-tour="learning-evidence"
        aria-label={t("مؤشرات الأداء والإتقان", "Performance Metrics")}
        aria-busy={visibility.waiting}
      >
        {/* 1. XP Progression (strictly distinct from Mastery) */}
        <article className="db-metric-card">
          <div className="db-metric-top">
            <span>{t("المستوى ونقاط التقدّم (XP)", "Progression Level & XP")}</span>
            <div className="db-metric-icon">
              <Icon name="star" size={18} />
            </div>
          </div>
          <p className="db-metric-value">
            {visibility.waiting ? (
              <span className="skeleton db-skeleton-val" aria-hidden="true" />
            ) : visibility.profile ? (
              t(`المستوى ${level}`, `Level ${level}`)
            ) : (
              "—"
            )}
          </p>
          <div className="db-card-progress">
            <div className="db-card-progress-bar">
              <div
                className="db-card-progress-fill"
                style={{ width: `${visibility.profile ? levelProgress : 0}%`, background: "var(--accent)" }}
              />
            </div>
          </div>
          <span className="db-metric-sub">
            {visibility.profile
              ? `${state.xp.toLocaleString()} XP · ${t(
                  `متبقٍ ${100 - levelProgress} XP للمستوى التالي`,
                  `${100 - levelProgress} XP to Level ${level + 1}`,
                )}`
              : t("نقاط النشاط تُمنح عند الإجابات الموثّقة فقط.", "Earned only on verified attempts.")}
          </span>
        </article>

        {/* 2. Scheduled Review & Flashcard Backlog */}
        <article className="db-metric-card" data-tone={totalDueRecall > 0 ? "warning" : "success"}>
          <div className="db-metric-top">
            <span>{t("المراجعات والبطاقات المستحقة", "Due Recall & Flashcards")}</span>
            <div className="db-metric-icon">
              <Icon name={totalDueRecall > 0 ? "clock" : "sparkles"} size={18} />
            </div>
          </div>
          <p className="db-metric-value">
            {visibility.waiting ? (
              <span className="skeleton db-skeleton-val" aria-hidden="true" />
            ) : visibility.evidence ? (
              totalDueRecall > 0 ? (
                <bdi dir="ltr">{totalDueRecall}</bdi>
              ) : (
                t("منضبط تمامًا", "All clear")
              )
            ) : (
              "—"
            )}
          </p>
          <span className="db-metric-sub">
            {!visibility.evidence
              ? t("يظهر جدول المراجعة المتباعدة بعد التحقق من الحساب.", "Appears once account evidence loads.")
              : totalDueRecall > 0
                ? t(
                    `${state.dueFlashcards} بطاقة استوديو + ${dueSkillsCount} مهارة منهج`,
                    `${state.dueFlashcards} deck card(s) + ${dueSkillsCount} curriculum skill(s)`,
                  )
                : t("لا توجد بطاقات أو مهارات متأخرة الآن.", "No cards or skills overdue now.")}
          </span>
          {totalDueRecall > 0 && (
            <Link
              href={state.dueFlashcards >= dueSkillsCount ? "/study?mode=due" : "/review"}
              className="db-section-link"
            >
              {t("بدء الاسترجاع ←", "Start recall →")}
            </Link>
          )}
        </article>

        {/* 3. Verified Skill Mastery % */}
        <article className="db-metric-card">
          <div className="db-metric-top">
            <span>{t("معدل إتقان المهارات", "Verified Skill Mastery")}</span>
            <div className="db-metric-icon">
              <Icon name="target" size={18} />
            </div>
          </div>
          <p className="db-metric-value">
            {visibility.waiting ? (
              <span className="skeleton db-skeleton-val" aria-hidden="true" />
            ) : visibility.evidence && state.masteryRows.length ? (
              <bdi dir="ltr">{mastery}%</bdi>
            ) : (
              "—"
            )}
          </p>
          <span className="db-metric-sub">
            {state.masteryRows.length > 0
              ? t(
                  `مقاس عبر ${state.masteryRows.length} مهارة بالتصحيح الخادمي`,
                  `Measured across ${state.masteryRows.length} skills by server rubric`,
                )
              : t("منفصل تمامًا عن نقاط الخبرة والبطاقات التمرينية.", "Measured independently from XP or flashcards.")}
          </span>
        </article>

        {/* 4. Curriculum Lessons */}
        <article className="db-metric-card">
          <div className="db-metric-top">
            <span>{t("الدروس المنجزة", "Lessons Completed")}</span>
            <div className="db-metric-icon">
              <Icon name="book" size={18} />
            </div>
          </div>
          <p className="db-metric-value">
            {visibility.waiting ? (
              <span className="skeleton db-skeleton-val" aria-hidden="true" />
            ) : visibility.progress ? (
              <bdi dir="ltr">
                {state.completedLessons} / {state.lessons}
              </bdi>
            ) : (
              "—"
            )}
          </p>
          <span className="db-metric-sub">
            {visibility.progress
              ? t("عبر جميع مسارات الصف الأول الثانوي المنشورة.", "Across published First Secondary tracks.")
              : t("سجّل دخولك لتتبّع دروسك المكتملة.", "Sign in to track completed lessons.")}
          </span>
        </article>
      </section>
    ),

    consistency: (
      <section
        key="consistency"
        className="db-panel nk-consistency-panel"
        aria-label={t("سجل الانتظام وأهداف الأسبوع", "Study Consistency & Weekly Goals")}
      >
        <div className="db-panel-head">
          <h4>
            <Icon name="calendar" size={18} />
            <span>{t("سجل الانتظام (آخر ١٤ يومًا) وأهداف الأسبوع", "14-Day Study Consistency & Weekly Goals")}</span>
          </h4>
          <Badge tone={consistency.activeDaysInWindow > 0 ? "success" : "neutral"}>
            <bdi dir="ltr">{consistency.activeDaysInWindow}/14</bdi>{" "}
            {t("يوم نشط", "active days")}
          </Badge>
        </div>

        <div className="nk-consistency-grid">
          <div className="nk-heatmap-wrap">
            <div className="nk-heatmap-cells" role="list" aria-label={t("أيام المذاكرة المسجلة", "Recorded study days")}>
              {consistency.days.map((day) => (
                <div
                  key={day.dateKey}
                  role="listitem"
                  className={`nk-heat-cell intensity-${day.intensity}`}
                  title={`${day.dateKey}: ${day.count} ${t("نشاط", "events")}`}
                  aria-label={`${day.dateKey}: ${day.count}`}
                >
                  <span className="nk-heat-count">{day.count > 0 ? day.count : "·"}</span>
                  <span className="nk-heat-day">{day.labelShort}</span>
                </div>
              ))}
            </div>
            <p className="nk-heatmap-caption">
              {consistency.totalEventsInWindow > 0
                ? t(
                    `إجمالي ${consistency.totalEventsInWindow} نشاط تعلّم ومراجعة موثّق خلال آخر أسبوعين.`,
                    `${consistency.totalEventsInWindow} verified learning & review events recorded in the past 14 days.`,
                  )
                : t(
                    "لم تُسجّل جلسات بعد في هذه النافذة. أنهِ درسًا أو راجع بطاقة ليبدأ السجل بالاكتمال.",
                    "No recorded sessions in this window yet. Complete a lesson or review a deck to start building consistency.",
                  )}
            </p>
          </div>

          <div className="nk-goals-bars">
            <div className="nk-goal-meter">
              <div className="nk-goal-meta">
                <span>{t("هدف البطاقات الأسبوعي", "Weekly Flashcard Goal")}</span>
                <strong>
                  <bdi dir="ltr">
                    {consistency.weeklyProgress.flashcards} / {preferences.goals.weeklyCardsTarget}
                  </bdi>
                </strong>
              </div>
              <div className="db-card-progress-bar">
                <div className="db-card-progress-fill" style={{ width: `${weeklyCardsPct}%`, background: "var(--accent)" }} />
              </div>
            </div>

            <div className="nk-goal-meter">
              <div className="nk-goal-meta">
                <span>{t("هدف الدروس الأسبوعي", "Weekly Lesson Goal")}</span>
                <strong>
                  <bdi dir="ltr">
                    {consistency.weeklyProgress.lessons} / {preferences.goals.weeklyLessonsTarget}
                  </bdi>
                </strong>
              </div>
              <div className="db-card-progress-bar">
                <div className="db-card-progress-fill" style={{ width: `${weeklyLessonsPct}%`, background: "var(--success)" }} />
              </div>
            </div>

            <div className="nk-goal-foot">
              <span>
                {t(
                  `هدف التركيز اليومي: ${preferences.goals.dailyMinutesTarget} دقيقة`,
                  `Daily focus goal: ${preferences.goals.dailyMinutesTarget} min`,
                )}
              </span>
              <button
                type="button"
                className="db-section-link nk-inline-link-btn"
                onClick={() => setCustomizerOpen(true)}
              >
                {t("تعديل الأهداف", "Edit goals")}
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <StreakMilestoneRoad
            streakDays={state.streak}
            locale={locale}
            userId={state.ownerId}
            compact
            rewardsHref="/rewards"
            studyHref="/missions"
          />
        </div>
      </section>
    ),

    next_steps: (
      <section key="next_steps" className="db-panel" data-tour="study-plan">
        <div className="db-panel-head">
          <h4>
            <Icon name="clipboard" size={18} />
            <span>{t("خطتك اليومية والواجبات", "Daily Study Tasks & Assignments")}</span>
          </h4>
          <Link href="/study" className="db-section-link">
            {t("إدارة المهام في الاستوديو ←", "Open Study Planner →")}
          </Link>
        </div>

        <div className="db-targets-list">
          {state.dueAssignments.slice(0, 2).map((assignment) => (
            <Link
              key={assignment.id}
              className="db-target-item nk-assignment-row"
              href={`/assignments?focus=${encodeURIComponent(assignment.id)}`}
            >
              <div className="db-target-badge">
                <Icon name="clipboard" size={15} />
              </div>
              <div className="db-target-copy">
                <strong>{assignment.title}</strong>
                <small>
                  {assignment.due_at
                    ? `${t("واجب معلم · الموعد: ", "Class Assignment · Due: ")}${localizedTimestamp(
                        assignment.due_at,
                        searchLocale,
                      )}`
                    : t("واجب مدرسي منشور من معلمك", "Published class assignment")}
                </small>
              </div>
              <Badge tone="warning">{t("واجب", "Due")}</Badge>
            </Link>
          ))}

          {openStudyTasks.slice(0, 4).map((task) => {
            const busy = pendingTaskIds.includes(task.id);
            return (
              <div key={task.id} className="db-target-item">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={false}
                  aria-label={t(`إتمام مهمة: ${task.title}`, `Mark task complete: ${task.title}`)}
                  disabled={busy}
                  className="db-target-check-btn"
                  onClick={() => void handleToggleStudyTask(task)}
                >
                  {busy ? "…" : ""}
                </button>
                <div className="db-target-copy">
                  <strong>{task.title}</strong>
                  <small>
                    {task.due_at
                      ? `${t("مهمة شخصية · الموعد: ", "Personal task · Due: ")}${localizedTimestamp(
                          task.due_at,
                          searchLocale,
                        )}`
                      : t("مهمة مذاكرة محفوظة بحسابك", "Personal study task")}
                  </small>
                </div>
                <Link href="/study" className="db-target-time">
                  {t("فتح", "Open")}
                </Link>
              </div>
            );
          })}

          {recentDoneTasks.map((task) => {
            const busy = pendingTaskIds.includes(task.id);
            return (
              <div key={task.id} className="db-target-item is-done">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={true}
                  aria-label={t(`إعادة فتح: ${task.title}`, `Reopen task: ${task.title}`)}
                  disabled={busy}
                  className="db-target-check-btn is-checked"
                  onClick={() => void handleToggleStudyTask(task)}
                >
                  <Icon name="check" size={13} />
                </button>
                <div className="db-target-copy">
                  <strong>{task.title}</strong>
                  <small>{t("مكتملة اليوم", "Completed")}</small>
                </div>
              </div>
            );
          })}

          {state.dueAssignments.length === 0 && openStudyTasks.length === 0 && recentDoneTasks.length === 0 && (
            <div className="db-targets-fallback">
              <Link
                className="db-target-item"
                href={state.nextLesson ? `/lesson/${encodeURIComponent(state.nextLesson.id)}` : "/learn"}
              >
                <div className="db-target-badge">1</div>
                <div className="db-target-copy">
                  <strong>
                    {state.nextLesson
                      ? currentActiveTrack?.contentLanguage === "en"
                        ? state.nextLesson.title_en
                        : state.nextLesson.title_ar
                      : t("ابدأ أول درس في المنهج", "Start your first published lesson")}
                  </strong>
                  <small>
                    {t(
                      "خطوة منظمة من مسارك الدراسي النشط",
                      "Structured next step from your active track",
                    )}
                  </small>
                </div>
                <span className="db-target-time">→</span>
              </Link>

              <Link className="db-target-item" href="/study">
                <div className="db-target-badge">2</div>
                <div className="db-target-copy">
                  <strong>{t("أضف مهمة مذاكرة أو حزمة بطاقات", "Add a study task or flashcard deck")}</strong>
                  <small>
                    {t(
                      "نظم وقتك بين الدروس والمراجعة الذكية في الاستوديو.",
                      "Organize personal study tasks and active-recall decks.",
                    )}
                  </small>
                </div>
                <span className="db-target-time">→</span>
              </Link>
            </div>
          )}
        </div>
      </section>
    ),

    weak_radar: (
      <section key="weak_radar" className="db-panel">
        <div className="db-panel-head">
          <h4>
            <Icon name="microscope" size={18} />
            <span>{t("رادار المفاهيم الشائكة والمراجعة", "Concept Clarification Radar")}</span>
          </h4>
          <Link
            href={state.activeTrackSlug ? `/review?track=${encodeURIComponent(state.activeTrackSlug)}` : "/review"}
            className="db-section-link"
          >
            {t("مركز المراجعة ←", "Review Hub →")}
          </Link>
        </div>

        {state.weakSkills.length > 0 ? (
          <div className="db-weak-list">
            {state.weakSkills.map((sk) => {
              const skTitle = sk.contentLanguage === "en" ? sk.titleEn : sk.titleAr;
              const aiPrompt =
                sk.contentLanguage === "en"
                  ? `Explain "${skTitle}" step by step with solved exam examples.`
                  : `اشرح لي المفهوم «${skTitle}» بالتفصيل مع أمثلة امتحانية محلولة.`;
              return (
                <div key={sk.id} className="db-weak-item">
                  <div className="db-weak-copy">
                    <strong dir={sk.contentLanguage === "en" ? "ltr" : "rtl"}>{skTitle}</strong>
                    <small>
                      {t(
                        `إتقان حالي: ${sk.score}% · يحتاج تدريبًا مركزًا`,
                        `Mastery: ${sk.score}% · Needs focused drill`,
                      )}
                    </small>
                  </div>
                  <div className="db-weak-actions">
                    <Link
                      href={`/review?mode=topic${state.activeTrackSlug ? `&track=${encodeURIComponent(state.activeTrackSlug)}` : ""}`}
                      className="db-weak-drill"
                    >
                      {t("تدريب", "Drill")}
                    </Link>
                    <Link
                      href={`/ai?prompt=${encodeURIComponent(aiPrompt)}${state.activeTrackSlug ? `&subject=${encodeURIComponent(state.activeTrackSlug)}` : ""}`}
                      className="db-weak-action"
                    >
                      {t("شرح مع AI", "Ask AI")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : state.masteryRows.length > 0 ? (
          <div className="db-weak-empty" data-tone="success">
            <span className="nk-radar-icon">
              <Icon name="award" size={30} />
            </span>
            <strong>{t("أداء رائع! لا توجد مغالطات معلقة", "Outstanding! No pending misconceptions")}</strong>
            <p>
              {t(
                "كل المهارات التي اختبرتها حتى الآن مستقرة ومتقنة.",
                "All curriculum skills tested so far are well consolidated.",
              )}
            </p>
          </div>
        ) : (
          <div className="db-weak-empty">
            <span className="nk-radar-icon">
              <Icon name="target" size={30} />
            </span>
            <strong>{t("لا توجد أدلة مهارة كافية بعد", "No skill evidence yet")}</strong>
            <p>
              {t(
                "أجب عن أسئلة الدروس المنشورة لتظهر نقاط القوة والمفاهيم التي تستحق مراجعة.",
                "Complete published lesson questions to surface strengths and skills needing review.",
              )}
            </p>
          </div>
        )}
      </section>
    ),

    curriculum: (
      <section key="curriculum" className="db-section" data-tour="curriculum-tracks">
        <div className="db-section-heading">
          <h3>
            <Icon name="book" size={20} />
            <span>{t("المواد الدراسية ومسارات المحتوى المتاحة", "Core Subjects & Available Tracks")}</span>
          </h3>
          <Link href="/learn" className="db-section-link">
            {t("استعراض كافة الوحدات والدروس ←", "Browse all units & lessons →")}
          </Link>
        </div>

        <div className="db-curriculum-grid">
          {SUBJECT_CATALOG.map((subj) => {
            const subjTracks = state.tracks.filter((tr) => tr.subjectSlug === subj.slug);
            const activeTr = subjTracks.find((tr) => tr.slug === state.activeTrackSlug) || subjTracks[0];
            const percent =
              activeTr && activeTr.total ? Math.round((activeTr.done / activeTr.total) * 100) : 0;

            return (
              <div key={subj.key} className="db-curriculum-card">
                <div className="db-card-head">
                  <span className="db-subject-crest">
                    <Icon name={SUBJECT_CREST_ICONS[subj.key] || "book"} size={18} />
                  </span>

                  {subj.dualLanguage && subjTracks.length > 1 ? (
                    <div
                      className="db-track-toggle"
                      role="group"
                      aria-label={t("اختر لغة المسار", "Select track language")}
                    >
                      {subjTracks.map((tr) => {
                        const isEn = tr.contentLanguage === "en";
                        const isSelected = activeTr?.slug === tr.slug;
                        return (
                          <button
                            key={tr.slug}
                            type="button"
                            className={`db-track-toggle-btn ${isSelected ? "is-active" : ""}`}
                            aria-pressed={isSelected}
                            onClick={() => handleSelectTrack(tr.slug)}
                          >
                            {isEn ? "English" : "عربي"}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <Badge tone="neutral">
                      {activeTr?.contentLanguage === "en" ? "English" : "العربية"}
                    </Badge>
                  )}
                </div>

                <h4>
                  {locale === "en" ? subj.titleEn : subj.titleAr}
                  {subj.dualLanguage && activeTr?.contentLanguage === "en" && (
                    <span className="db-card-lang-sub">
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
                            ? (
                                <span>
                                  أنجزت <bdi dir="ltr">{activeTr.done}</bdi> من{" "}
                                  <bdi dir="ltr">{activeTr.total}</bdi> درس
                                </span>
                              )
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
                        background: SUBJECT_ACCENT_VAR[subj.accent] || "var(--accent)",
                      }}
                    />
                  </div>
                </div>

                <Link
                  href={`/learn?track=${activeTr?.slug || subj.slug}`}
                  className="db-section-link db-card-open-link"
                >
                  {t("فتح المادة ←", "Open Subject →")}
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    ),

    quick_launcher: (
      <section key="quick_launcher" className="db-section" data-tour="learning-tools">
        <div className="db-section-heading">
          <h3>
            <Icon name="zap" size={20} />
            <span>{t("قاذفة الأدوات والأنشطة الذكية", "Quick Action Command Launcher")}</span>
          </h3>
        </div>

        <div className="db-launcher-grid">
          <Link
            href={state.activeTrackSlug ? `/ai?subject=${encodeURIComponent(state.activeTrackSlug)}` : "/ai"}
            className="db-launcher-card"
          >
            <div className="db-launcher-icon" data-tone="accent">
              <Icon name="bot" size={22} />
            </div>
            <div className="db-launcher-info">
              <strong>{t("مساعد Noäta AI الذكي", "Noäta AI Study Companion")}</strong>
              <small>{t("توجيه تلقائي ذكي لمواد أولى ثانوي + بطاقات فورية", "Smart Auto routing for Sec. 1 Term 1 + instant study help")}</small>
            </div>
          </Link>

          <Link
            href={state.activeTrackSlug ? `/study?track=${encodeURIComponent(state.activeTrackSlug)}` : "/study"}
            className="db-launcher-card"
          >
            <div className="db-launcher-icon" data-tone="success">
              <Icon name="layers" size={22} />
            </div>
            <div className="db-launcher-info">
              <strong>{t("استوديو المذاكرة وبطاقات 3D", "Smart Study Studio & 3D Cards")}</strong>
              <small>{t("مكتبة منهج أولى ثانوي، بطاقات SM-2، واختبارات", "Sec. 1 curriculum decks, SM-2 recall & strict quizzes")}</small>
            </div>
          </Link>

          <Link
            href={state.activeTrackSlug ? `/review?track=${encodeURIComponent(state.activeTrackSlug)}` : "/review"}
            className="db-launcher-card"
          >
            <div className="db-launcher-icon" data-tone="warning">
              <Icon name="clock" size={22} />
            </div>
            <div className="db-launcher-info">
              <strong>{t("المراجعة المتباعدة والموضوعية", "Spaced & Subject Review")}</strong>
              <small>{t("مستحقات التكرار المتباعد ومراجعات ٥–١٥ سؤال حسب المادة", "Due FSRS recall & targeted 5–15 Q subject drills")}</small>
            </div>
          </Link>

          <Link
            href={state.activeTrackSlug ? `/boss?track=${encodeURIComponent(state.activeTrackSlug)}` : "/boss"}
            className="db-launcher-card"
          >
            <div className="db-launcher-icon" data-tone="danger">
              <Icon name="swords" size={22} />
            </div>
            <div className="db-launcher-info">
              <strong>{t("تحديات الوحدات الشاملة", "Unit Mastery Challenges")}</strong>
              <small>{t("ساحة تقييم شاملة من ٦–٨ أسئلة لكل وحدة ونظام دروع", "Full 6–8 Q unit arenas with readiness & shields")}</small>
            </div>
          </Link>
        </div>
      </section>
    ),
  };

  // Pair adjacent compact panels cleanly (`next_steps` + `weak_radar`) if rendered in sequence
  const visibleOrder = preferences.widgetOrder.filter(
    (id) => !preferences.hiddenWidgets.includes(id),
  );

  const urgencyBadgeTone =
    recommended.urgency === "critical"
      ? "danger"
      : recommended.urgency === "due"
        ? "warning"
        : recommended.urgency === "steady"
          ? "accent"
          : "neutral";

  return (
    <div
      className="db-cockpit"
      data-tour-page="dashboard"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {/* Error / Retry Banner */}
      {signedIn && (account.error || error) && (
        <div className="error-banner" role="alert">
          <span>{account.error || error}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setLoading(true);
              setRetry((r) => r + 1);
            }}
          >
            {t("إعادة المحاولة", "Try again")}
          </Button>
        </div>
      )}

      {/* 1. Unified Intelligent Home Hero & Embedded Next Recommended Action */}
      <section
        className="hero dashboard-hero nk-home-hero"
        data-tour="dashboard-welcome"
        aria-label={t("مساحة التعلّم الذكية", "Intelligent Learning Cockpit")}
      >
        <div className="nk-home-hero-main">
          <div className="nk-home-meta-row">
            <div className="nk-home-brand-chip">
              <NoataLogo size={34} />
              <span className="db-badge-term">
                <span className="db-pulse" />
                <span>
                  {t(
                    "الفصل الدراسي الأول 2026–2027 · الأول الثانوي",
                    "Term 1 · 2026–2027 · First Secondary",
                  )}
                </span>
              </span>
            </div>

            <div className="nk-home-utility-pills">
              <div
                className="db-streak-pill"
                title={t("سلسلة أيام التعلم المتواصلة", "Continuous daily study streak")}
              >
                <span className="db-flame">
                  <Icon name="flame" size={16} />
                </span>
                <span>
                  {visibility.waiting ? (
                    <span className="skeleton db-skeleton-inline" aria-hidden="true" />
                  ) : visibility.profile ? (
                    <bdi dir="ltr">{state.streak}</bdi>
                  ) : (
                    "—"
                  )}{" "}
                  {t("أيام استمرارية", "Day Streak")}
                </span>
              </div>

              <Button
                variant="subtle"
                size="sm"
                iconStart="sliders"
                className="nk-customize-trigger"
                onClick={() => setCustomizerOpen(true)}
              >
                {t("تخصيص اللوحة", "Customize")}
              </Button>
            </div>
          </div>

          <p className="nk-home-greeting">
            {signedIn && state.displayName ? `${greeting}${t("،", ",")} ${state.displayName}` : greeting}
          </p>

          <h1 className="nk-home-title">
            {t(
              "مرحباً بك في مساحة تعلّمك الذكية",
              "Welcome to Your Intelligent Learning Cockpit",
            )}
          </h1>

          <p className="nk-home-subtitle">
            {t(
              "تجمع مساحتك خطوتك ذات الأولوية، أدلة المهارات، جدول مراجعات SM-2، ومسارات المنهج — بأرقام موثّقة فقط دون تقدير وهمي.",
              "Your workspace unifies priority next actions, verified skill evidence, SM-2 recall queues, and curriculum tracks — grounded strictly in real records.",
            )}
          </p>

          <div className="nk-home-hero-actions">
            <Link href={recommended.href} className="btn btn-primary">
              <span>{t(recommended.ctaAr, recommended.ctaEn)}</span>
              <Icon name="arrow" size={16} />
            </Link>
            <Link
              href={`/study?tab=generator${state.activeTrackSlug ? `&track=${encodeURIComponent(state.activeTrackSlug)}` : ""}`}
              className="btn btn-secondary"
            >
              <Icon name="sparkles" size={16} />
              <span>{t("استوديو البطاقات الذكي", "Smart Study Studio")}</span>
            </Link>
            <Link
              href={state.activeTrackSlug ? `/ai?subject=${encodeURIComponent(state.activeTrackSlug)}` : "/ai"}
              className="btn btn-secondary"
            >
              <Icon name="ai" size={16} />
              <span>{t("سؤال Noäta AI", "Ask Noäta AI")}</span>
            </Link>
          </div>
        </div>

        {/* Embedded Deterministic Next Action Card */}
        <div
          className="nk-home-next-card"
          data-tour="next-action"
          data-urgency={recommended.urgency}
          aria-label={t("خطوتك التالية المقترحة", "Your Priority Next Action")}
        >
          <div className="nk-next-card-top">
            <Badge tone={urgencyBadgeTone} icon={recommended.icon}>
              {t(recommended.badgeAr, recommended.badgeEn)}
            </Badge>
            <Badge tone="neutral">
              {locale === "en" ? activeSubjectMeta.shortTitleEn : activeSubjectMeta.shortTitleAr}
              {currentActiveTrack ? ` (${currentActiveTrack.contentLanguage.toUpperCase()})` : ""}
            </Badge>
          </div>

          <h2 className="nk-next-card-title">
            {t(recommended.titleAr, recommended.titleEn)}
          </h2>
          <p className="nk-next-card-desc">
            {t(recommended.descriptionAr, recommended.descriptionEn)}
          </p>

          {currentActiveTrack && (
            <div className="nk-next-track-progress">
              <div className="nk-next-track-meta">
                <span>
                  {locale === "en" ? currentActiveTrack.titleEn : currentActiveTrack.titleAr}
                </span>
                <strong>
                  <bdi dir="ltr">{activeTrackPercent}%</bdi>
                </strong>
              </div>
              <div className="db-card-progress-bar">
                <div
                  className="db-card-progress-fill"
                  style={{ width: `${activeTrackPercent}%`, background: "var(--accent)" }}
                />
              </div>
            </div>
          )}

          <div className="nk-next-card-foot">
            <Link href={recommended.href} className="nk-next-card-cta">
              <span>{t(recommended.ctaAr, recommended.ctaEn)}</span>
              <Icon name="arrow" size={15} />
            </Link>
            <Link href="/learn" className="db-section-link">
              {t("تغيير المسار", "Switch track")}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Configurable Dashboard Sections */}
      {visibleOrder.length > 0 ? (
        <div className="nk-dashboard-widgets">
          {visibleOrder.map((widgetId, idx) => {
            if (widgetId === "next_steps" && visibleOrder[idx + 1] === "weak_radar") {
              return (
                <div key="pair-steps-radar" className="db-two-col">
                  {widgetMap.next_steps}
                  {widgetMap.weak_radar}
                </div>
              );
            }
            if (widgetId === "weak_radar" && visibleOrder[idx - 1] === "next_steps") {
              return null;
            }
            return widgetMap[widgetId];
          })}
        </div>
      ) : (
        <EmptyState
          icon="layout"
          title={t("كل أقسام لوحة التحكم مخفية حاليًا", "All dashboard sections are currently hidden")}
          description={t(
            "يمكنك إعادة إظهار أي بطاقة أو تخصيص ترتيبها وأهدافك الأسبوعية من لوحة التخصيص.",
            "Show any widget section or configure weekly study goals from the customizer.",
          )}
          actions={
            <Button variant="primary" iconStart="sliders" onClick={() => setCustomizerOpen(true)}>
              {t("فتح تخصيص اللوحة", "Open customizer")}
            </Button>
          }
        />
      )}

      <CustomizeDashboardDrawer
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        preferences={preferences}
        saving={savingPrefs}
        signedIn={signedIn}
        onSave={handleSavePreferences}
      />
    </div>
  );
}
