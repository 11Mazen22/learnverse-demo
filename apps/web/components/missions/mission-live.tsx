"use client";

import { masteryLabel, questionTypeLabel } from "@/lib/i18n/content-labels";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { buildStructuredAiHandoffHref } from "@/lib/ai/handoff-contract";
import { useConfirmedMutation } from "@/lib/supabase/use-confirmed-mutation";
import { createClient } from "@/lib/supabase/client";
import { ChoiceCardGroup } from "@/components/ui/choice-card-group";
import { Icon } from "@/components/ui/icon";
import { StudyRichText } from "@/components/study/study-rich-text";
import {
  AchievementCelebration,
  StreakMilestoneRoad,
  computeLessonAchievementSummary,
} from "@/components/ui/achievement-celebration";
import {
  AttemptIdempotencyController,
  extractDistractorFeedback,
} from "@/lib/curriculum/attempt-guard";
import {
  inferContentLanguage,
  resolveCurriculumText,
  type ContentLanguage,
} from "@/lib/curriculum/catalog";
import {
  evaluateLocalChoice,
  getLessonStudyCompanion,
} from "@/lib/curriculum/sec1-study-pack";

type TrackOption = {
  id: string;
  slug: string;
  course_id: string | null;
  content_language: ContentLanguage;
  title_ar: string;
  title_en: string;
};

type UnitOption = {
  id: string;
  course_id: string | null;
  position: number;
  title_ar: string;
  title_en: string;
};

type LessonOption = {
  id: string;
  slug?: string | null;
  unit_id: string;
  position: number;
  title_ar: string;
  title_en: string;
  units?: { course_id?: string | null } | null;
};

type MissionQuestion = {
  id: string;
  source: "db" | "curated";
  lesson_id: string | null;
  variant_of: string | null;
  position: number | null;
  question_type: string;
  prompt_ar: string;
  prompt_en: string | null;
  choices_ar: unknown;
  choices_en: unknown;
  correct_index?: number;
  explanation?: string;
  hint?: string;
  metadata: unknown;
};

type Grade = {
  correct?: boolean;
  explanation_ar?: string;
  explanation_en?: string;
  xp_awarded?: number;
  mastery_score?: number | null;
  mastery_state?: string | null;
  duplicate?: boolean;
};

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
}

export function MissionLive() {
  const t = useTranslation();
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const { account, busy, status, run } = useConfirmedMutation();
  const attemptGuard = useRef(new AttemptIdempotencyController());
  const signedIn = account.loading ? null : Boolean(account.user);

  const [tracks, setTracks] = useState<TrackOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [lessonSlug, setLessonSlug] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState({ ar: "المهام", en: "Missions" });
  const [activeTrackSlug, setActiveTrackSlug] = useState<string>("");
  const [hasCourseTrack, setHasCourseTrack] = useState(false);
  const [contentLanguage, setContentLanguage] = useState<ContentLanguage>("ar");

  const effectiveLang: ContentLanguage = hasCourseTrack
    ? contentLanguage
    : locale === "en" && !activeTrackSlug
      ? "en"
      : contentLanguage;
  const contentDir: "ltr" | "rtl" = effectiveLang === "en" ? "ltr" : "rtl";

  const [questions, setQuestions] = useState<MissionQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [hintVisible, setHintVisible] = useState(false);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [firstTryWins, setFirstTryWins] = useState(0);
  const [attempted, setAttempted] = useState<Set<string>>(new Set());
  const [complete, setComplete] = useState(false);
  const [finalAccuracy, setFinalAccuracy] = useState(100);
  const [streakDays, setStreakDays] = useState(0);
  const [reward, setReward] = useState<{
    xp_reward?: number;
    coin_reward?: number;
    verified_lesson_gems?: number | null;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [reload, setReload] = useState(0);

  const loadMissionForLesson = useCallback(
    async (
      targetLesson: {
        id: string;
        slug?: string | null;
        unit_id: string;
        position?: number | null;
        title_ar: string;
        title_en: string;
        courseId?: string | null;
      },
      knownTrack: TrackOption | null,
      activeCheck: () => boolean,
    ) => {
      attemptGuard.current.resetAll();
      setQuestions([]);
      setAnswer("");
      setHintVisible(false);
      setGrade(null);
      setIndex(0);
      setFirstTryWins(0);
      setAttempted(new Set());
      setComplete(false);
      setReward(null);
      setError("");
      setLoadingQuestions(true);

      try {
        setLessonId(targetLesson.id);
        setLessonSlug(targetLesson.slug?.trim() || null);
        setLessonTitle({ ar: targetLesson.title_ar, en: targetLesson.title_en });

        let resolvedTrack = knownTrack;
        if (!resolvedTrack && targetLesson.courseId) {
          const trackRes = await supabase
            .from("curriculum_tracks")
            .select("id,slug,course_id,content_language,title_ar,title_en")
            .eq("course_id", targetLesson.courseId)
            .eq("publication_status", "published")
            .maybeSingle();
          if (!activeCheck()) return;
          if (trackRes.data) {
            resolvedTrack = trackRes.data as TrackOption;
          }
        }

        const hasTrack = Boolean(resolvedTrack || targetLesson.courseId);
        setHasCourseTrack(hasTrack);
        setActiveTrackSlug(resolvedTrack?.slug ?? "");

        const { data: qData, error: qError } = await supabase
          .from("questions")
          .select(
            "id,lesson_id,variant_of,position,question_type,prompt_ar,prompt_en,choices_ar,choices_en,metadata",
          )
          .eq("lesson_id", targetLesson.id)
          .in("publication_status", ["published_demo", "published"])
          .order("position")
          .limit(24);
        if (!activeCheck()) return;
        if (qError) throw qError;

        const dbPrimary: MissionQuestion[] = ((qData ?? []) as Omit<MissionQuestion, "source">[])
          .filter((question) => {
            const metadata =
              question.metadata && typeof question.metadata === "object"
                ? (question.metadata as Record<string, unknown>)
                : {};
            return question.variant_of === null || metadata.translation_track === true;
          })
          .map((q) => ({ ...q, source: "db" as const }));

        const firstPrompt = dbPrimary[0];
        const lang: ContentLanguage = resolvedTrack
          ? resolvedTrack.content_language
          : inferContentLanguage({
              promptAr: firstPrompt?.prompt_ar,
              promptEn: firstPrompt?.prompt_en,
              metadata:
                firstPrompt?.metadata && typeof firstPrompt.metadata === "object"
                  ? (firstPrompt.metadata as Record<string, unknown>)
                  : null,
            });
        setContentLanguage(lang);

        let mergedQuestions: MissionQuestion[] = dbPrimary;
        if (hasTrack && dbPrimary.length < 5) {
          const companion = getLessonStudyCompanion({
            lessonIdOrSlug: targetLesson.slug?.trim() || targetLesson.id,
            titleAr: targetLesson.title_ar,
            titleEn: targetLesson.title_en,
            trackSlug: resolvedTrack?.slug || undefined,
            subjectKey: resolvedTrack?.slug
              ? resolvedTrack.slug.replace(/-(ar|en)$/, "")
              : undefined,
            position: targetLesson.position ?? undefined,
            contentLanguage: lang,
          });
          const existingPrompts = new Set(
            dbPrimary.map((q) =>
              resolveCurriculumText(lang, q.prompt_ar, q.prompt_en).trim().toLowerCase(),
            ),
          );
          const curated: MissionQuestion[] = companion.curatedQuestions
            .filter((cq) => !existingPrompts.has(cq.prompt.trim().toLowerCase()))
            .map((cq, idx) => ({
              id: cq.id,
              source: "curated" as const,
              lesson_id: targetLesson.id,
              variant_of: null,
              position: dbPrimary.length + idx + 1,
              question_type: "multiple-choice",
              prompt_ar: cq.prompt,
              prompt_en: cq.prompt,
              choices_ar: cq.choices,
              choices_en: cq.choices,
              correct_index: cq.correct_index,
              explanation: cq.explanation,
              hint: cq.hint,
              metadata: { curated: true, difficulty: cq.difficulty },
            }));
          mergedQuestions = [...dbPrimary, ...curated].slice(0, 6);
        }

        setQuestions(mergedQuestions);
      } catch {
        if (activeCheck()) {
          setError(
            t(
              "تعذّر تحميل أسئلة المهمة. حاول مرة أخرى.",
              "Could not load mission questions. Please try again.",
            ),
          );
        }
      } finally {
        if (activeCheck()) setLoadingQuestions(false);
      }
    },
    [supabase, t],
  );

  useEffect(() => {
    if (account.loading) return;
    let active = true;
    const isAlive = () => active;
    setLoading(true);
    setError("");

    void (async () => {
      try {
        const user = account.user;
        if (!user) return;

        const searchParams = new URLSearchParams(window.location.search);
        const requestedLesson = searchParams.get("lesson");
        const requestedTrack = searchParams.get("track");

        // Load catalog gently so synthetic fixtures without curriculum_tracks still succeed
        let catalogTracks: TrackOption[] = [];
        let catalogUnits: UnitOption[] = [];
        let catalogLessons: LessonOption[] = [];
        let completedSet = new Set<string>();
        let primaryEnrolledTrackId = "";

        if (!requestedLesson || requestedTrack) {
          const [tracksRes, enrollRes, progressRes] = await Promise.all([
            supabase
              .from("curriculum_tracks")
              .select("id,slug,course_id,content_language,title_ar,title_en")
              .eq("publication_status", "published")
              .order("slug"),
            supabase
              .from("curriculum_enrollments")
              .select("track_id,status,updated_at")
              .eq("user_id", user.id)
              .eq("status", "active")
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("lesson_progress")
              .select("lesson_id,completed_at")
              .eq("user_id", user.id),
          ]);
          if (!active) return;

          if (!tracksRes.error && tracksRes.data) {
            catalogTracks = tracksRes.data as TrackOption[];
            setTracks(catalogTracks);
          }
          if (!enrollRes.error && enrollRes.data?.track_id) {
            primaryEnrolledTrackId = enrollRes.data.track_id;
          }
          if (!progressRes.error && progressRes.data) {
            completedSet = new Set(
              progressRes.data.filter((p) => Boolean(p.completed_at)).map((p) => p.lesson_id),
            );
            setCompletedLessonIds(completedSet);
          }

          const courseIds = catalogTracks
            .map((tr) => tr.course_id)
            .filter((cid): cid is string => Boolean(cid));

          if (courseIds.length > 0) {
            const unitsRes = await supabase
              .from("units")
              .select("id,course_id,position,title_ar,title_en")
              .in("course_id", courseIds)
              .order("position");
            if (!active) return;
            if (!unitsRes.error && unitsRes.data) {
              catalogUnits = unitsRes.data as UnitOption[];
              setUnits(catalogUnits);
              const unitIds = catalogUnits.map((u) => u.id);
              if (unitIds.length > 0) {
                const lessonsRes = await supabase
                  .from("lessons")
                  .select("id,slug,unit_id,position,title_ar,title_en")
                  .in("unit_id", unitIds)
                  .order("position");
                if (!active) return;
                if (!lessonsRes.error && lessonsRes.data) {
                  catalogLessons = lessonsRes.data as LessonOption[];
                  setLessons(catalogLessons);
                }
              }
            }
          }
        }

        if (requestedLesson) {
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              requestedLesson,
            );
          const { data: reqLessonData, error: readError } = await supabase
            .from("lessons")
            .select("id,slug,unit_id,position,title_ar,title_en,units(course_id)")
            .eq(isUuid ? "id" : "slug", requestedLesson)
            .maybeSingle();
          if (!active) return;
          if (readError) throw readError;
          if (reqLessonData) {
            const cId =
              (reqLessonData.units as { course_id?: string | null } | null)?.course_id ?? null;
            const matchingTrack =
              catalogTracks.find((tr) => tr.course_id && tr.course_id === cId) ?? null;
            if (matchingTrack) setSelectedTrackId(matchingTrack.id);
            setSelectedUnitId(reqLessonData.unit_id);
            await loadMissionForLesson(
              {
                id: reqLessonData.id,
                slug: reqLessonData.slug,
                unit_id: reqLessonData.unit_id,
                position: reqLessonData.position,
                title_ar: reqLessonData.title_ar,
                title_en: reqLessonData.title_en,
                courseId: cId,
              },
              matchingTrack,
              isAlive,
            );
            return;
          }
        }

        const chosenTrack =
          catalogTracks.find((tr) => tr.slug === requestedTrack) ??
          catalogTracks.find((tr) => tr.id === primaryEnrolledTrackId) ??
          catalogTracks[0] ??
          null;
        if (!chosenTrack) return;

        setSelectedTrackId(chosenTrack.id);
        const trackUnits = catalogUnits.filter((u) => u.course_id === chosenTrack.course_id);
        const trackUnitIds = new Set(trackUnits.map((u) => u.id));
        const trackLessons = catalogLessons.filter((l) => trackUnitIds.has(l.unit_id));
        const nextIncompleteLesson =
          trackLessons.find((l) => !completedSet.has(l.id)) ?? trackLessons[0] ?? null;

        if (nextIncompleteLesson) {
          setSelectedUnitId(nextIncompleteLesson.unit_id);
          await loadMissionForLesson(
            {
              ...nextIncompleteLesson,
              courseId: chosenTrack.course_id,
            },
            chosenTrack,
            isAlive,
          );
        }
      } catch {
        if (active) {
          setError(
            t(
              "تعذّر تحميل بيانات هذه المساحة. حاول مرة أخرى.",
              "Could not load this page. Please try again.",
            ),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [supabase, reload, account.user, account.loading, loadMissionForLesson, t]);

  const currentTrack = tracks.find((tr) => tr.id === selectedTrackId) ?? null;
  const trackUnits = useMemo(
    () =>
      currentTrack
        ? units.filter((u) => u.course_id === currentTrack.course_id)
        : units,
    [currentTrack, units],
  );
  const trackUnitIds = useMemo(() => new Set(trackUnits.map((u) => u.id)), [trackUnits]);
  const unitLessons = useMemo(
    () => lessons.filter((l) => l.unit_id === selectedUnitId),
    [lessons, selectedUnitId],
  );
  const trackLessons = useMemo(
    () => lessons.filter((l) => trackUnitIds.has(l.unit_id)),
    [lessons, trackUnitIds],
  );
  const completedInTrack = trackLessons.filter((l) => completedLessonIds.has(l.id)).length;
  const dailyGoalTarget = Math.max(1, Math.min(3, trackLessons.length || 3));
  const dailyProgressPct = Math.min(
    100,
    Math.round(((completedInTrack % dailyGoalTarget || (complete ? dailyGoalTarget : 0)) / dailyGoalTarget) * 100),
  );

  const current = questions[index];
  const opts = current
    ? strings(
        effectiveLang === "en"
          ? strings(current.choices_en).length
            ? current.choices_en
            : current.choices_ar
          : strings(current.choices_ar).length
            ? current.choices_ar
            : current.choices_en,
      )
    : [];
  const progress = questions.length
    ? Math.round((index / questions.length) * 100)
    : 0;

  async function selectTrack(track: TrackOption) {
    setSelectedTrackId(track.id);
    const nextUnits = units.filter((u) => u.course_id === track.course_id);
    const nextUnitIds = new Set(nextUnits.map((u) => u.id));
    const nextLessons = lessons.filter((l) => nextUnitIds.has(l.unit_id));
    const targetLesson =
      nextLessons.find((l) => !completedLessonIds.has(l.id)) ?? nextLessons[0] ?? null;
    if (targetLesson) {
      setSelectedUnitId(targetLesson.unit_id);
      await loadMissionForLesson(
        { ...targetLesson, courseId: track.course_id },
        track,
        () => true,
      );
    }
  }

  async function selectUnit(unitId: string) {
    setSelectedUnitId(unitId);
    const firstLesson = lessons.find((l) => l.unit_id === unitId);
    if (firstLesson) {
      await loadMissionForLesson(
        { ...firstLesson, courseId: currentTrack?.course_id },
        currentTrack,
        () => true,
      );
    }
  }

  async function selectLessonById(nextLessonId: string) {
    const target = lessons.find((l) => l.id === nextLessonId);
    if (!target) return;
    await loadMissionForLesson(
      { ...target, courseId: currentTrack?.course_id },
      currentTrack,
      () => true,
    );
  }

  async function gradeCurrent(e?: FormEvent) {
    e?.preventDefault();
    if (!current || !answer.trim() || busy || attemptGuard.current.isBusy()) return;
    if (!signedIn) {
      window.location.href = "/login";
      return;
    }

    if (current.source === "curated") {
      const firstAttempt = !attempted.has(current.id);
      const nextAttempted = new Set(attempted);
      nextAttempted.add(current.id);
      setAttempted(nextAttempted);

      const selectedIdx = Number(answer);
      const chosenText =
        opts.length > 0 && Number.isInteger(selectedIdx) && opts[selectedIdx] !== undefined
          ? opts[selectedIdx]
          : answer;
      const evaluated = evaluateLocalChoice({
        selectedChoice: chosenText,
        choices: opts,
        correctIndex: current.correct_index,
      });
      const isCorrect = evaluated?.correct === true;
      const note = current.explanation ?? "";
      setGrade({
        correct: isCorrect,
        explanation_ar: note,
        explanation_en: note,
      });
      if (isCorrect && firstAttempt) setFirstTryWins((x) => x + 1);
      return;
    }

    await attemptGuard.current.runExclusive(async () => {
      await run(async (check) => {
        setError("");
        const firstAttempt = !attempted.has(current.id);
        const nextAttempted = new Set(attempted);
        nextAttempted.add(current.id);

        const { data, error: rpcError } = await supabase.rpc("submit_attempt", {
          p_question_id: current.id,
          p_response: { value: answer },
          p_assisted: hintVisible,
          p_idempotency_key: attemptGuard.current.getAttemptKey(current.id, answer),
          p_practice_repeat: false,
        });

        check();
        if (rpcError) throw rpcError;
        if (typeof (data as Grade | null)?.correct !== "boolean") {
          throw Error("Missing grade");
        }
        attemptGuard.current.clearAttempt(current.id);
        setAttempted(nextAttempted);
        const result = data as Grade;
        setGrade(result);
        if (result.correct && firstAttempt) setFirstTryWins((x) => x + 1);
      }, "");
    });
  }

  async function continueMission() {
    if (!current || !grade || busy || attemptGuard.current.isBusy()) return;
    await attemptGuard.current.runExclusive(async () => {
      await run(async (check) => {
        setError("");

        if (!grade.correct) {
          if (current.source === "db") {
            const { data, error: variantError } = await supabase
              .from("questions")
              .select(
                "id,lesson_id,variant_of,position,question_type,prompt_ar,prompt_en,choices_ar,choices_en,metadata",
              )
              .eq("variant_of", current.id)
              .in("publication_status", ["published_demo", "published"])
              .limit(1)
              .maybeSingle();
            check();
            if (variantError) throw variantError;
            if (data) {
              setQuestions((list) =>
                list.map((q, i) => (i === index ? { ...(data as Omit<MissionQuestion, "source">), source: "db" } : q)),
              );
              setAnswer("");
              setHintVisible(false);
              setGrade(null);
              return;
            }
          }
          setAnswer("");
          setHintVisible(false);
          setGrade(null);
          return;
        }

        if (index < questions.length - 1) {
          setIndex((x) => x + 1);
          setAnswer("");
          setHintVisible(false);
          setGrade(null);
          return;
        }

        const score = Math.round(
          ((firstTryWins + (grade.correct && !attempted.has(current.id) ? 1 : 0)) /
            Math.max(1, questions.length)) *
            100,
        );
        setFinalAccuracy(score);

        if (lessonId && !attemptGuard.current.hasCompleted("complete_lesson", lessonId)) {
          const { data, error: compError } = await supabase.rpc("complete_lesson", {
            p_lesson_id: lessonId,
            p_score: score,
          });
          check();
          if (compError) throw compError;
          if (!data || typeof data !== "object") {
            throw Error("Missing completion receipt");
          }
          attemptGuard.current.markCompleted("complete_lesson", lessonId);
          setCompletedLessonIds((prev) => {
            const next = new Set(prev);
            next.add(lessonId);
            return next;
          });
          const receipt = data as { xp_reward?: number; coin_reward?: number };
          const [{ data: earned, error: gemsError }, { data: profileRow }] = await Promise.all([
            supabase
              .from("ledger")
              .select("amount")
              .eq("user_id", account.user!.id)
              .eq("currency", "GEM")
              .eq("reference_type", "lesson")
              .eq("reference_id", lessonId),
            supabase
              .from("profiles")
              .select("streak_days")
              .eq("id", account.user!.id)
              .maybeSingle(),
          ]);
          check();
          if (profileRow && typeof profileRow.streak_days === "number") {
            setStreakDays(profileRow.streak_days);
          }
          setReward({
            ...receipt,
            verified_lesson_gems: gemsError
              ? null
              : (earned ?? []).reduce((total, row) => total + Number(row.amount), 0),
          });
        }
        setComplete(true);
      }, "");
    });
  }

  if (account.error) {
    return (
      <section className="aura-load-error" role="alert">
        <h2>{account.error}</h2>
        <button type="button" onClick={() => void account.refresh()}>
          {t("إعادة المحاولة", "Try again")}
        </button>
      </section>
    );
  }
  if (account.loading || loading) {
    return (
      <section className="aura-loading-state" role="status">
        <span />
        <h2>{t("بنجهّز مساحتك…", "Preparing your space…")}</h2>
        <p>{t("لحظات ونرتّب خطوتك التالية.", "Finding your next step.")}</p>
      </section>
    );
  }
  if (error && !questions.length) {
    return (
      <section className="aura-load-error" role="alert">
        <strong>{error}</strong>
        <button type="button" onClick={() => setReload((n) => n + 1)}>
          {t("إعادة المحاولة", "Try again")}
        </button>
      </section>
    );
  }

  if (complete) {
    const currentLessonPos = trackLessons.findIndex((l) => l.id === lessonId);
    const nextLesson =
      currentLessonPos >= 0 && currentLessonPos < trackLessons.length - 1
        ? trackLessons[currentLessonPos + 1]
        : null;
    const summary = computeLessonAchievementSummary({
      scorePct: finalAccuracy,
      xpReward: reward?.xp_reward ?? 0,
      coinReward: reward?.coin_reward ?? 0,
      verifiedGems: reward?.verified_lesson_gems ?? 0,
      isPreview: reward == null,
    });

    return (
      <div style={{ display: "grid", gap: 18 }}>
        <AchievementCelebration
          kind="lesson"
          locale={locale}
          rankLabel={summary.rank}
          badgeText={t("إتمام الدرس والمكافآت الموثّقة", "Verified Lesson Mission Complete")}
          title={t(summary.titleAr, summary.titleEn)}
          subtitle={t(
            `أتممت «${lessonTitle.ar}» بنسبة دقة ${finalAccuracy}% — تقدّمك ومهاراتك محفوظة وموثّقة الآن.`,
            `Finished "${lessonTitle.en}" with ${finalAccuracy}% accuracy — your progress and skill mastery are recorded.`,
          )}
          scorePct={finalAccuracy}
          xpReward={summary.xpReward}
          coinReward={summary.coinReward}
          gemReward={summary.verifiedGems}
          highlightNote={
            reward?.verified_lesson_gems == null
              ? t(summary.gemNoteAr, summary.gemNoteEn)
              : t(
                  `تم إضافة ${reward.verified_lesson_gems} جوهرة موثّقة و+${summary.coinReward} عملة و+${summary.xpReward} XP لرصيدك.`,
                  `${reward.verified_lesson_gems} verified gem(s), +${summary.coinReward} coins, and +${summary.xpReward} XP recorded in your ledger.`,
                )
          }
          actions={
            <>
              {nextLesson && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void selectLessonById(nextLesson.id)}
                >
                  <span>{t("ابدأ الدرس التالي", "Next Lesson Mission")}</span>
                </button>
              )}
              <Link
                className="btn btn-secondary"
                href={`/study${activeTrackSlug ? `?track=${encodeURIComponent(activeTrackSlug)}` : ""}`}
              >
                {t("مركز المذاكرة والبطاقات", "Study Center & Decks")}
              </Link>
              <Link
                className="btn btn-secondary"
                href={`/boss${activeTrackSlug ? `?track=${encodeURIComponent(activeTrackSlug)}` : ""}`}
              >
                {t("تحدّي الوحدة الشامل", "Unit Challenge")}
              </Link>
              <Link className="btn btn-secondary" href="/rewards">
                {t("متجر الجوائز والهدايا", "Rewards & Shop")}
              </Link>
              <Link className="btn btn-secondary" href="/learn">
                {t("رجوع للتعلم", "Back to learning")}
              </Link>
            </>
          }
        />

        <StreakMilestoneRoad
          streakDays={streakDays}
          locale={locale}
          userId={account.user?.id}
          compact
          rewardsHref="/rewards"
          studyHref="/missions"
        />
      </div>
    );
  }

  const stageNames = [
    t("افهم الفكرة", "Understand"),
    t("طبّق المعرفة", "Apply"),
    t("حلّل المسألة", "Analyze"),
    t("اربط الأفكار", "Connect"),
    t("تحدّي الإتقان", "Mastery"),
    t("الخلاصة", "Synthesis"),
  ];
  const stageLabels = Array.from({ length: Math.max(questions.length, 3) }, (_, idx) =>
    stageNames[idx] ?? `${t("المرحلة", "Stage")} ${idx + 1}`,
  );
  const currentPrompt = current
    ? resolveCurriculumText(effectiveLang, current.prompt_ar, current.prompt_en)
    : "";

  return (
    <>
      <header className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>
            {t("مهمة إتقان تفاعلية · متعددة المراحل", "Interactive Mastery Mission · Multi-Stage")}
          </div>
          <h1 style={{ margin: "6px 0 0" }} dir={contentDir}>
            {resolveCurriculumText(effectiveLang, lessonTitle.ar, lessonTitle.en)}
          </h1>
        </div>
        <span className="pill">
          {locale === "en" ? (
            `Stage ${questions.length ? index + 1 : 0} of ${questions.length || 3}`
          ) : (
            <>
              المرحلة <bdi dir="ltr">{questions.length ? index + 1 : 0}</bdi> من{" "}
              <bdi dir="ltr">{questions.length || 3}</bdi>
            </>
          )}
        </span>
      </header>

      {/* Daily & Track Goals */}
      {tracks.length > 0 && (
        <section className="noata-goals-grid" aria-label={t("الأهداف الذكية", "Smart learning goals")}>
          <div className="noata-goal-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <strong style={{ fontSize: 13.5, color: "var(--ink)" }}>
                {t("هدف اليوم: إتمام مهام الدروس", "Daily Goal: Lesson Missions")}
              </strong>
              <span className="pill" style={{ fontSize: 11.5 }}>{dailyProgressPct}%</span>
            </div>
            <div className="noata-goal-bar">
              <span style={{ width: `${dailyProgressPct}%` }} />
            </div>
            <small style={{ color: "var(--muted)" }}>
              {t(
                `أنهيت ${completedInTrack} من أصل ${trackLessons.length || 1} درس في هذا المسار`,
                `Completed ${completedInTrack} of ${trackLessons.length || 1} lessons in this track`,
              )}
            </small>
          </div>

          <div className="noata-goal-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <strong style={{ fontSize: 13.5, color: "var(--ink)" }}>
                {t("دقة المحاولة الأولى", "First-Try Accuracy")}
              </strong>
              <span className="pill" style={{ fontSize: 11.5 }}>
                {attempted.size > 0
                  ? `${Math.round((firstTryWins / attempted.size) * 100)}%`
                  : "—"}
              </span>
            </div>
            <div className="noata-goal-bar">
              <span
                style={{
                  width: `${attempted.size > 0 ? Math.round((firstTryWins / attempted.size) * 100) : 0}%`,
                }}
              />
            </div>
            <small style={{ color: "var(--muted)" }}>
              {t(
                `${questions.length || 0} مراحل تدريبية في هذه المهمة`,
                `${questions.length || 0} progressive items in this mission`,
              )}
            </small>
          </div>

          <div className="noata-goal-card">
            <strong style={{ fontSize: 13.5, color: "var(--ink)" }}>
              {t("تحتاج مساعدة في السؤال الحالي؟", "Need guidance on this mission?")}
            </strong>
            <small style={{ color: "var(--muted)" }}>
              {t(
                "اسأل Noäta AI لشرح القاعدة بدون حرق الحل فوراً.",
                "Consult Noäta AI for step-by-step hints aligned to your track.",
              )}
            </small>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
              <Link
                href={buildStructuredAiHandoffHref({
                  source: "mission",
                  action: "concept_clarify",
                  subject: activeTrackSlug,
                  lessonId: lessonSlug || lessonId,
                  topic: resolveCurriculumText(effectiveLang, lessonTitle.ar, lessonTitle.en),
                })}
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: "5px 10px" }}
              >
                <Icon name="sparkles" size={13} />
                <span>{t("استشر Noäta AI", "Ask Noäta AI")}</span>
              </Link>
              {lessonId && (
                <Link
                  href={`/lesson/${encodeURIComponent(lessonId)}`}
                  className="btn btn-secondary"
                  style={{ fontSize: 12, padding: "5px 10px" }}
                >
                  <span>{t("شرح الدرس", "Lesson Guide")}</span>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Track, Unit & Lesson Mission Selector */}
      {tracks.length > 0 && (
        <section className="noata-learning-toolbar" aria-label={t("اختيار المسار والدرس", "Track and lesson selector")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 13.5, color: "var(--ink)" }}>
              {t("اختر المادة والمسار والدرس للمهمة:", "Choose Track, Unit & Lesson:")}
            </strong>
            {loadingQuestions && (
              <small style={{ color: "var(--accent)", fontWeight: 700 }}>
                {t("جاري تحميل أسئلة الدرس...", "Loading mission...")}
              </small>
            )}
          </div>

          <div className="noata-learning-pills" role="group" aria-label={t("المسارات الدراسية", "Curriculum tracks")}>
            {tracks.map((tr) => {
              const selected = tr.id === selectedTrackId;
              return (
                <button
                  key={tr.id}
                  type="button"
                  className={`noata-learning-pill ${selected ? "is-active" : ""}`}
                  aria-pressed={selected}
                  onClick={() => void selectTrack(tr)}
                >
                  <span>{tr.content_language === "en" ? tr.title_en : tr.title_ar}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {trackUnits.length > 0 && (
              <label style={{ display: "grid", gap: 4, fontSize: 12.5, color: "var(--muted)" }}>
                <span>{t("الوحدة الدراسية", "Unit")}</span>
                <select
                  className="input"
                  dir={contentDir}
                  value={selectedUnitId}
                  onChange={(e) => void selectUnit(e.target.value)}
                >
                  {trackUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {resolveCurriculumText(effectiveLang, u.title_ar, u.title_en)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {unitLessons.length > 0 && (
              <label style={{ display: "grid", gap: 4, fontSize: 12.5, color: "var(--muted)" }}>
                <span>{t("الدرس", "Lesson")}</span>
                <select
                  className="input"
                  dir={contentDir}
                  value={lessonId ?? ""}
                  onChange={(e) => void selectLessonById(e.target.value)}
                >
                  {unitLessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {completedLessonIds.has(l.id) ? "✓ " : ""}
                      {resolveCurriculumText(effectiveLang, l.title_ar, l.title_en)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </section>
      )}

      <ol className="aura-mission-stages" aria-label={t("مراحل المهمة", "Mission stages")}>
        {stageLabels.slice(0, 6).map((label, stage) => (
          <li
            key={`${stage}-${label}`}
            className={stage === index ? "current" : stage < index ? "done" : ""}
            aria-current={stage === index ? "step" : undefined}
          >
            <span>{stage + 1}</span>
            <div>
              <strong>{label}</strong>
              <small>
                {stage < index
                  ? t("اجتزت المرحلة", "Stage complete")
                  : stage === index
                    ? t("مرحلتك الحالية", "Current stage")
                    : t("الخطوة التالية", "Next stage")}
              </small>
            </div>
          </li>
        ))}
      </ol>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("مسار التحدي التدريجي", "Progressive Mastery Flow")}</h2>
            <p style={{ margin: "5px 0 0", color: "var(--muted)" }}>
              {t(
                "أجب بدقة لبناء إتقان حقيقي — يزداد التحدي تدريجياً من الفهم للتحليل.",
                "Answer carefully to build genuine mastery — difficulty builds step by step.",
              )}
            </p>
          </div>
          <b>{progress}%</b>
        </div>
        <div className="progress">
          <i style={{ width: progress + "%" }} />
        </div>
      </section>

      <section className="panel" style={{ marginTop: 18, padding: 28 }}>
        {!current && <p>{t("المهمة غير متاحة بعد.", "This mission is not available yet.")}</p>}
        {current && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span className="pill">
                {t("السؤال", "Question")} {index + 1} / {questions.length}
              </span>
              <small style={{ color: "var(--muted)" }}>
                {questionTypeLabel(current.question_type, locale)}
              </small>
            </div>
            <h2 style={{ fontSize: 22, lineHeight: 1.75, margin: "20px 0" }} dir={contentDir}>
              <StudyRichText content={currentPrompt} />
            </h2>

            <form onSubmit={(e) => void gradeCurrent(e)}>
              {current.question_type === "multiple-choice" ? (
                <ChoiceCardGroup
                  legend={t("خيارات السؤال", "Question choices")}
                  options={opts}
                  value={answer}
                  disabled={Boolean(grade) || busy}
                  contentDir={contentDir}
                  onChange={(val) => {
                    if (!grade) setAnswer(val);
                  }}
                />
              ) : (
                <input
                  className="search"
                  style={{ width: "100%" }}
                  inputMode={current.question_type === "numeric" ? "decimal" : "text"}
                  aria-label={t("إجابتك على السؤال", "Your answer")}
                  value={answer}
                  disabled={Boolean(grade) || busy}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={t("اكتب الإجابة…", "Enter your answer…")}
                />
              )}

              {current.hint && (
                <div style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: 12.5, padding: "5px 12px" }}
                    onClick={() => setHintVisible((v) => !v)}
                  >
                    {hintVisible ? t("إخفاء التلميح", "Hide Hint") : t("تلميح ذكي", "Show Hint")}
                  </button>
                  {hintVisible && (
                    <div dir={contentDir} style={{ marginTop: 8, fontSize: 13.5, color: "var(--muted)" }}>
                      <StudyRichText content={current.hint} />
                    </div>
                  )}
                </div>
              )}

              {grade && (
                <div
                  className="noata-grade-feedback"
                  data-correct={grade.correct ? "true" : "false"}
                  dir={contentDir}
                >
                  <b>
                    {grade.correct
                      ? t("صح 👏", "Correct 👏")
                      : t("قريب منها — خلّينا نحاول بطريقة تانية", "Not quite. Let’s try a different approach.")}
                  </b>
                  <div style={{ margin: "4px 0 0", lineHeight: 1.7 }}>
                    <StudyRichText
                      content={resolveCurriculumText(
                        effectiveLang,
                        grade.explanation_ar,
                        grade.explanation_en,
                      )}
                    />
                  </div>
                  {!grade.correct &&
                    (() => {
                      const tip = extractDistractorFeedback(
                        current.metadata,
                        answer,
                        effectiveLang,
                      );
                      return tip ? (
                        <div className="noata-grade-misconception">
                          <strong>{t("تنبيه حول هذا الخيار: ", "Misconception note: ")}</strong>
                          <StudyRichText content={tip} />
                        </div>
                      ) : null;
                    })()}
                  {grade.mastery_score != null && (
                    <small>
                      {t("درجة الإتقان:", "Mastery:")} {Math.round(Number(grade.mastery_score))}% ·{" "}
                      {masteryLabel(grade.mastery_state, locale)}
                    </small>
                  )}
                </div>
              )}
              {(error || status) && (
                <div className="noata-retry-banner" role="alert">
                  <span>{error || status}</span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={busy}
                    onClick={() => void (grade ? continueMission() : gradeCurrent())}
                  >
                    {t("إعادة المحاولة بنفس الإجابة", "Retry safely")}
                  </button>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 20,
                }}
              >
                {!grade ? (
                  <button
                    disabled={!answer.trim() || busy}
                    className="btn"
                    style={{
                      background: "var(--accent)",
                      color: "var(--on-accent, #ffffff)",
                    }}
                  >
                    {busy ? t("جارٍ التصحيح…", "Checking your answer…") : t("تحقق", "Check answer")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void continueMission()}
                    disabled={busy}
                    className="btn"
                    style={{
                      background: "var(--accent)",
                      color: "var(--on-accent, #ffffff)",
                    }}
                  >
                    {grade.correct
                      ? index === questions.length - 1
                        ? t("إنهاء المهمة", "Finish mission")
                        : t("التالي", "Next")
                      : current.source === "db"
                        ? t("جرّب سؤال موازي", "Try a similar question")
                        : t("أعد المحاولة", "Try again")}
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </section>
    </>
  );
}
