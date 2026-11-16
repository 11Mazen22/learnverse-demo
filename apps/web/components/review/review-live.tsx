"use client";

import { masteryLabel, questionTypeLabel } from "@/lib/i18n/content-labels";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { buildStructuredAiHandoffHref } from "@/lib/ai/handoff-contract";
import { ModuleWelcome } from "@/components/ui/module-welcome";
import { Icon } from "@/components/ui/icon";
import { StudyRichText } from "@/components/study/study-rich-text";
import { useConfirmedMutation } from "@/lib/supabase/use-confirmed-mutation";
import { createClient } from "@/lib/supabase/client";
import { ChoiceCardGroup } from "@/components/ui/choice-card-group";
import {
  AttemptIdempotencyController,
  extractDistractorFeedback,
} from "@/lib/curriculum/attempt-guard";
import {
  TRACK_CATALOG,
  inferContentLanguage,
  resolveCurriculumText,
  type ContentLanguage,
} from "@/lib/curriculum/catalog";
import {
  evaluateLocalChoice,
  getSubjectQuestionBank,
} from "@/lib/curriculum/sec1-study-pack";
import {
  getLessonStudyPack,
  getTrackLessonStudyPacks,
} from "@/lib/curriculum/sec1-all-lessons-pack";
import { AchievementCelebration } from "@/components/ui/achievement-celebration";

type DbReviewQuestion = {
  id: string;
  skill_id: string | null;
  lesson_id?: string | null;
  variant_of: string | null;
  question_type: string;
  prompt_ar: string;
  prompt_en: string | null;
  choices_en: unknown;
  choices_ar: unknown;
  metadata: unknown;
};

type ReviewQuestion = {
  id: string;
  source: "db" | "curated";
  skill_id: string | null;
  trackSlug: string;
  trackLabel: string;
  contentLanguage: ContentLanguage;
  question_type: string;
  prompt: string;
  choices: string[];
  correct_index?: number;
  hint?: string;
  explanation?: string;
  difficulty?: string;
  lessonSlug?: string;
  lessonTitle?: string;
  metadata: unknown;
};

type Evidence = {
  skill_id: string;
  mastery_score: number;
  state: string;
  next_review_at: string | null;
  skills: { title_ar: string; title_en: string; course_id: string } | null;
};

type TrackRow = {
  id: string;
  slug: string;
  course_id: string | null;
  content_language: ContentLanguage;
  title_ar: string;
  title_en: string;
};

type Grade = {
  correct?: boolean;
  explanation_ar?: string;
  explanation_en?: string;
  mastery_score?: number | null;
  mastery_state?: string | null;
  next_review_at?: string | null;
};

function options(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

function trackDisplayTitle(
  track: { content_language: ContentLanguage; title_ar: string; title_en: string },
): string {
  return track.content_language === "en" ? track.title_en : track.title_ar;
}

export function ReviewLive() {
  const t = useTranslation();
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const { account, busy, status, run } = useConfirmedMutation();
  const attemptGuard = useRef(new AttemptIdempotencyController());
  const signedIn = account.loading ? null : Boolean(account.user);

  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [courseTracks, setCourseTracks] = useState<Map<string, TrackRow>>(new Map());
  const [dbDueQuestions, setDbDueQuestions] = useState<ReviewQuestion[]>([]);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);

  const [mode, setMode] = useState<"due" | "topic">("due");
  const [selectedTrackSlug, setSelectedTrackSlug] = useState<string>("all");
  const [selectedLessonSlug, setSelectedLessonSlug] = useState<string>("all");
  const [sessionLength, setSessionLength] = useState<5 | 10 | 15>(10);
  const prefsRef = useRef({
    mode: "due" as "due" | "topic",
    track: "all",
    lesson: "all",
    skill: "all",
    len: 10 as 5 | 10 | 15,
  });
  const didReadUrlRef = useRef(false);

  const trackLessonPacks = useMemo(
    () => (selectedTrackSlug === "all" ? [] : getTrackLessonStudyPacks(selectedTrackSlug)),
    [selectedTrackSlug],
  );
  const activeLessonPack = useMemo(
    () => (selectedLessonSlug !== "all" ? getLessonStudyPack(selectedLessonSlug) : null),
    [selectedLessonSlug],
  );

  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [hintVisible, setHintVisible] = useState(false);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [reload, setReload] = useState(0);

  const buildTopicQueue = useCallback(
    async (
      targetTrackSlug: string,
      targetLen: 5 | 10 | 15,
      availableTracks: TrackRow[],
      dueList: ReviewQuestion[],
      targetLessonSlug = "all",
      targetSkillId = "all",
    ) => {
      setLoadingTopic(true);
      try {
        const chosenTracks =
          targetTrackSlug === "all"
            ? availableTracks
            : availableTracks.filter((tr) => tr.slug === targetTrackSlug);

        const targetCourses = chosenTracks
          .map((tr) => tr.course_id)
          .filter((cid): cid is string => Boolean(cid));

        const dbItems: ReviewQuestion[] = [];
        const skillCourseMap = new Map<string, { id: string; course_id: string | null; title_ar: string | null; title_en: string | null }>();
        const fetchedQuestionRows: DbReviewQuestion[] = [];

        if (targetSkillId !== "all") {
          const [skillRowRes, skillQRes] = await Promise.all([
            supabase
              .from("skills")
              .select("id,course_id,title_ar,title_en")
              .eq("id", targetSkillId)
              .maybeSingle(),
            supabase
              .from("questions")
              .select(
                "id,skill_id,lesson_id,variant_of,question_type,prompt_ar,prompt_en,choices_ar,choices_en,metadata",
              )
              .eq("skill_id", targetSkillId)
              .in("publication_status", ["published_demo", "published"])
              .order("position")
              .limit(20),
          ]);
          if (!skillRowRes.error && skillRowRes.data) {
            skillCourseMap.set(skillRowRes.data.id, skillRowRes.data);
          }
          if (!skillQRes.error && skillQRes.data) {
            fetchedQuestionRows.push(...(skillQRes.data as DbReviewQuestion[]));
          }
        }

        if (targetCourses.length > 0) {
          const skillsRes = await supabase
            .from("skills")
            .select("id,course_id,title_ar,title_en")
            .in("course_id", targetCourses);

          if (!skillsRes.error && skillsRes.data?.length) {
            for (const s of skillsRes.data) {
              skillCourseMap.set(s.id, s);
            }
            const skillIds = skillsRes.data.map((s) => s.id);
            const qRes = await supabase
              .from("questions")
              .select(
                "id,skill_id,lesson_id,variant_of,question_type,prompt_ar,prompt_en,choices_ar,choices_en,metadata",
              )
              .in("skill_id", skillIds)
              .in("publication_status", ["published_demo", "published"])
              .order("position")
              .limit(40);

            if (!qRes.error && qRes.data) {
              const seenIds = new Set(fetchedQuestionRows.map((row) => row.id));
              for (const row of qRes.data as DbReviewQuestion[]) {
                if (!seenIds.has(row.id)) {
                  seenIds.add(row.id);
                  fetchedQuestionRows.push(row);
                }
              }
            }
          }
        }

        for (const row of fetchedQuestionRows) {
                const meta =
                  row.metadata && typeof row.metadata === "object"
                    ? (row.metadata as Record<string, unknown>)
                    : {};
                if (row.variant_of !== null && meta.translation_track !== true) continue;
                const skillRow = row.skill_id ? skillCourseMap.get(row.skill_id) : null;
                const tr = skillRow?.course_id
                  ? availableTracks.find((x) => x.course_id === skillRow.course_id)
                  : undefined;
                const lang: ContentLanguage = tr?.content_language
                  ? tr.content_language
                  : inferContentLanguage({
                      promptAr: row.prompt_ar,
                      promptEn: row.prompt_en,
                      metadata: meta,
                    });
                const prompt = resolveCurriculumText(lang, row.prompt_ar, row.prompt_en);
                if (!prompt) continue;
                const arOpts = options(row.choices_ar);
                const enOpts = options(row.choices_en);
                dbItems.push({
                  id: row.id,
                  source: "db",
                  skill_id: row.skill_id,
                  trackSlug: tr?.slug ?? targetTrackSlug,
                  trackLabel: tr
                    ? trackDisplayTitle(tr)
                    : resolveCurriculumText(lang, skillRow?.title_ar, skillRow?.title_en),
                  contentLanguage: lang,
                  question_type: row.question_type,
                  prompt,
                  choices: lang === "en" ? (enOpts.length ? enOpts : arOpts) : arOpts.length ? arOpts : enOpts,
                  hint: resolveCurriculumText(
                    lang,
                    typeof meta.hint_ar === "string" ? meta.hint_ar : null,
                    typeof meta.hint_en === "string" ? meta.hint_en : null,
                  ) || undefined,
                  metadata: row.metadata,
                });
        }

        if (targetSkillId !== "all") {
          dbItems.sort((a, b) => {
            const aMatch = a.skill_id === targetSkillId ? 0 : 1;
            const bMatch = b.skill_id === targetSkillId ? 0 : 1;
            return aMatch - bMatch;
          });
        }

        const seenPrompts = new Set(dbItems.map((i) => i.prompt.trim().toLowerCase()));
        const catalogPool =
          targetTrackSlug === "all"
            ? TRACK_CATALOG
            : TRACK_CATALOG.filter((tr) => tr.slug === targetTrackSlug);

        const lessonCuratedItems: ReviewQuestion[] = [];
        const focusedLessonPack =
          targetLessonSlug !== "all" ? getLessonStudyPack(targetLessonSlug) : null;

        if (focusedLessonPack) {
          const trackSpec = TRACK_CATALOG.find((tr) => tr.slug === focusedLessonPack.trackSlug);
          for (const q of focusedLessonPack.questions) {
            const key = q.prompt.trim().toLowerCase();
            if (seenPrompts.has(key)) continue;
            seenPrompts.add(key);
            lessonCuratedItems.push({
              id: `${focusedLessonPack.lessonSlug}-${q.id}`,
              source: "curated",
              skill_id: null,
              trackSlug: focusedLessonPack.trackSlug,
              trackLabel: trackSpec
                ? trackSpec.contentLanguage === "en"
                  ? trackSpec.titleEn
                  : trackSpec.titleAr
                : focusedLessonPack.title,
              contentLanguage: focusedLessonPack.contentLanguage,
              question_type: "multiple-choice",
              prompt: q.prompt,
              choices: q.choices,
              correct_index: q.correct_index,
              hint: q.hint,
              explanation: q.explanation,
              difficulty: q.difficulty,
              lessonSlug: focusedLessonPack.lessonSlug,
              lessonTitle: focusedLessonPack.title,
              metadata: {
                curated: true,
                difficulty: q.difficulty,
                lessonSlug: focusedLessonPack.lessonSlug,
              },
            });
          }
        }

        const curatedItems: ReviewQuestion[] = [];
        for (const spec of catalogPool) {
          // Include exact Sec. 1 lesson study packs in this track so review draws from real lessons
          const packs = getTrackLessonStudyPacks(spec.slug);
          for (const pack of packs) {
            for (const q of pack.questions) {
              const key = q.prompt.trim().toLowerCase();
              if (seenPrompts.has(key)) continue;
              seenPrompts.add(key);
              curatedItems.push({
                id: `${pack.lessonSlug}-${q.id}`,
                source: "curated",
                skill_id: null,
                trackSlug: spec.slug,
                trackLabel: spec.contentLanguage === "en" ? spec.titleEn : spec.titleAr,
                contentLanguage: spec.contentLanguage,
                question_type: "multiple-choice",
                prompt: q.prompt,
                choices: q.choices,
                correct_index: q.correct_index,
                hint: q.hint,
                explanation: q.explanation,
                difficulty: q.difficulty,
                lessonSlug: pack.lessonSlug,
                lessonTitle: pack.title,
                metadata: { curated: true, difficulty: q.difficulty, lessonSlug: pack.lessonSlug },
              });
            }
          }

          const bank = getSubjectQuestionBank(spec.subject, spec.contentLanguage);
          for (const q of bank) {
            const key = q.prompt.trim().toLowerCase();
            if (seenPrompts.has(key)) continue;
            seenPrompts.add(key);
            curatedItems.push({
              id: `${spec.slug}-${q.id}`,
              source: "curated",
              skill_id: null,
              trackSlug: spec.slug,
              trackLabel: spec.contentLanguage === "en" ? spec.titleEn : spec.titleAr,
              contentLanguage: spec.contentLanguage,
              question_type: "multiple-choice",
              prompt: q.prompt,
              choices: q.choices,
              correct_index: q.correct_index,
              hint: q.hint,
              explanation: q.explanation,
              difficulty: q.difficulty,
              metadata: { curated: true, difficulty: q.difficulty },
            });
          }
        }

        const combined = (
          lessonCuratedItems.length > 0
            ? [...lessonCuratedItems, ...curatedItems, ...dbItems]
            : [...dbItems, ...curatedItems]
        ).slice(0, targetLen);
        setQuestions(combined.length ? combined : dueList.slice(0, targetLen));
        setIdx(0);
        setAnswer("");
        setHintVisible(false);
        setGrade(null);
        setCorrectCount(0);
        setAnsweredIds(new Set());
      } finally {
        setLoadingTopic(false);
      }
    },
    [supabase],
  );

  const loadSession = useCallback(
    async (isAlive: () => boolean) => {
      const user = account.user;
      if (!user) return;
      if (!didReadUrlRef.current) {
        didReadUrlRef.current = true;
        const params = new URLSearchParams(window.location.search);
        const paramTrack = params.get("track")?.trim() || params.get("subject")?.trim();
        const paramLesson = params.get("lesson")?.trim();
        const paramSkill = params.get("skill")?.trim();
        const paramMode = params.get("mode")?.trim();
        const paramLen = Number(params.get("len"));
        if (paramSkill) {
          prefsRef.current.skill = paramSkill;
          if (paramMode !== "due") {
            prefsRef.current.mode = "topic";
            setMode("topic");
          }
        }
        if (paramLesson) {
          const matchedPack = getLessonStudyPack(paramLesson);
          if (matchedPack) {
            prefsRef.current.lesson = matchedPack.lessonSlug;
            setSelectedLessonSlug(matchedPack.lessonSlug);
            prefsRef.current.track = matchedPack.trackSlug;
            setSelectedTrackSlug(matchedPack.trackSlug);
            if (paramMode !== "due") {
              prefsRef.current.mode = "topic";
              setMode("topic");
            }
          }
        }
        if (paramTrack) {
          const matched =
            TRACK_CATALOG.find((tr) => tr.slug === paramTrack || tr.subject === paramTrack) ?? null;
          if (matched) {
            prefsRef.current.track = matched.slug;
            setSelectedTrackSlug(matched.slug);
            if (paramMode !== "due") {
              prefsRef.current.mode = "topic";
              setMode("topic");
            }
          }
        }
        if (paramMode === "topic" || paramMode === "due") {
          prefsRef.current.mode = paramMode;
          setMode(paramMode);
        }
        if (paramLen === 5 || paramLen === 10 || paramLen === 15) {
          prefsRef.current.len = paramLen;
          setSessionLength(paramLen);
        }
      }

      const activePrefs = prefsRef.current;
      const [evRes, tracksRes] = await Promise.all([
        supabase
          .from("skill_evidence")
          .select(
            "skill_id,mastery_score,state,next_review_at,skills(title_ar,title_en,course_id)",
          )
          .eq("user_id", user.id)
          .order("next_review_at", { ascending: true }),
        supabase
          .from("curriculum_tracks")
          .select("id,slug,course_id,content_language,title_ar,title_en")
          .eq("publication_status", "published")
          .order("slug"),
      ]);

      if (!isAlive()) return;
      if (evRes.error) throw evRes.error;

      const trackRows: TrackRow[] =
        !tracksRes.error && tracksRes.data?.length
          ? (tracksRes.data as TrackRow[])
          : TRACK_CATALOG.map((spec) => ({
              id: spec.slug,
              slug: spec.slug,
              course_id: null,
              content_language: spec.contentLanguage,
              title_ar: spec.titleAr,
              title_en: spec.titleEn,
            }));
      setTracks(trackRows);

      const cMap = new Map<string, TrackRow>();
      for (const tr of trackRows) {
        if (tr.course_id) cMap.set(tr.course_id, tr);
      }
      setCourseTracks(cMap);

      const rows = (evRes.data ?? []) as Evidence[];
      setEvidence(rows);

      const dueSkillIds = rows
        .filter((x) => !x.next_review_at || new Date(x.next_review_at).getTime() <= Date.now())
        .map((x) => x.skill_id);

      const pickedDue: ReviewQuestion[] = [];
      if (dueSkillIds.length) {
        const [questionResult, attemptResult] = await Promise.all([
          supabase
            .from("questions")
            .select(
              "id,skill_id,variant_of,question_type,prompt_ar,prompt_en,choices_ar,choices_en,metadata",
            )
            .in("skill_id", dueSkillIds)
            .in("publication_status", ["published_demo", "published"])
            .order("position"),
          supabase
            .from("attempts")
            .select("question_id,created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(100),
        ]);
        if (!isAlive()) return;
        if (questionResult.error || attemptResult.error) {
          throw questionResult.error ?? attemptResult.error;
        }

        const pool = ((questionResult.data ?? []) as DbReviewQuestion[]).filter((question) => {
          const metadata =
            question.metadata && typeof question.metadata === "object"
              ? (question.metadata as Record<string, unknown>)
              : {};
          return question.variant_of === null || metadata.translation_track === true;
        });
        const recency = new Map<string, number>();
        for (const [position, attempt] of (attemptResult.data ?? []).entries()) {
          if (!recency.has(attempt.question_id)) recency.set(attempt.question_id, position);
        }

        for (const skillId of dueSkillIds) {
          const evRow = rows.find((r) => r.skill_id === skillId);
          const tr = evRow?.skills?.course_id ? cMap.get(evRow.skills.course_id) : undefined;
          const candidates = pool
            .filter((question) => question.skill_id === skillId)
            .sort((left, right) => {
              const leftRecent = recency.get(left.id);
              const rightRecent = recency.get(right.id);
              if (leftRecent === undefined && rightRecent !== undefined) return -1;
              if (leftRecent !== undefined && rightRecent === undefined) return 1;
              return (rightRecent ?? 0) - (leftRecent ?? 0);
            })
            .slice(0, 2);

          for (const q of candidates) {
            const meta =
              q.metadata && typeof q.metadata === "object"
                ? (q.metadata as Record<string, unknown>)
                : {};
            const lang = inferContentLanguage({
              trackContentLanguage: tr?.content_language,
              promptAr: q.prompt_ar,
              promptEn: q.prompt_en,
              metadata: meta,
            });
            const prompt = resolveCurriculumText(lang, q.prompt_ar, q.prompt_en);
            if (!prompt) continue;
            const arOpts = options(q.choices_ar);
            const enOpts = options(q.choices_en);
            pickedDue.push({
              id: q.id,
              source: "db",
              skill_id: q.skill_id,
              trackSlug: tr?.slug ?? "",
              trackLabel: tr
                ? trackDisplayTitle(tr)
                : resolveCurriculumText(lang, evRow?.skills?.title_ar, evRow?.skills?.title_en),
              contentLanguage: lang,
              question_type: q.question_type,
              prompt,
              choices: lang === "en" ? (enOpts.length ? enOpts : arOpts) : arOpts.length ? arOpts : enOpts,
              metadata: q.metadata,
            });
          }
        }
      }

      setDbDueQuestions(pickedDue);

      if (activePrefs.mode === "topic" || pickedDue.length === 0) {
        if (pickedDue.length === 0) setMode("topic");
        await buildTopicQueue(
          activePrefs.track,
          activePrefs.len,
          trackRows,
          pickedDue,
          activePrefs.lesson,
          activePrefs.skill,
        );
      } else if (activePrefs.skill !== "all") {
        const skillDue = pickedDue.filter((q) => q.skill_id === activePrefs.skill);
        if (skillDue.length > 0) {
          setQuestions(skillDue.slice(0, activePrefs.len));
        } else {
          setMode("topic");
          await buildTopicQueue(
            activePrefs.track,
            activePrefs.len,
            trackRows,
            pickedDue,
            activePrefs.lesson,
            activePrefs.skill,
          );
        }
      } else {
        const filtered =
          activePrefs.track === "all"
            ? pickedDue
            : pickedDue.filter((q) => q.trackSlug === activePrefs.track);
        setQuestions((filtered.length ? filtered : pickedDue).slice(0, activePrefs.len));
      }
    },
    [account.user, buildTopicQueue, supabase],
  );

  useEffect(() => {
    if (account.loading) return;
    let active = true;
    attemptGuard.current.resetAll();
    setQuestions([]);
    setDbDueQuestions([]);
    setAnswer("");
    setHintVisible(false);
    setGrade(null);
    setIdx(0);
    setCorrectCount(0);
    setAnsweredIds(new Set());
    setEvidence([]);
    setCourseTracks(new Map());
    setLoading(true);
    setError("");

    void (async () => {
      try {
        await loadSession(() => active);
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
  }, [account.loading, reload, loadSession, t]);

  async function applyModeOrFilter(
    nextMode: "due" | "topic",
    nextTrack: string,
    nextLength: 5 | 10 | 15,
    nextLesson?: string,
  ) {
    const resolvedLesson =
      nextLesson !== undefined
        ? nextLesson
        : nextTrack === selectedTrackSlug
          ? selectedLessonSlug
          : "all";
    prefsRef.current = {
      mode: nextMode,
      track: nextTrack,
      lesson: resolvedLesson,
      skill: "all",
      len: nextLength,
    };
    setMode(nextMode);
    setSelectedTrackSlug(nextTrack);
    setSelectedLessonSlug(resolvedLesson);
    setSessionLength(nextLength);
    setIdx(0);
    setAnswer("");
    setHintVisible(false);
    setGrade(null);
    setCorrectCount(0);
    setAnsweredIds(new Set());

    if (nextMode === "due") {
      const filtered =
        nextTrack === "all"
          ? dbDueQuestions
          : dbDueQuestions.filter((q) => q.trackSlug === nextTrack);
      setQuestions(filtered.slice(0, nextLength));
    } else {
      await buildTopicQueue(nextTrack, nextLength, tracks, dbDueQuestions, resolvedLesson);
    }
  }

  const current = questions[idx];
  const skill = evidence.find((x) => x.skill_id === current?.skill_id);
  const contentLanguage: ContentLanguage = current?.contentLanguage
    ? current.contentLanguage
    : skill?.skills?.course_id
      ? courseTracks.get(skill.skills.course_id)?.content_language ?? "ar"
      : "ar";
  const contentDir: "ltr" | "rtl" = contentLanguage === "en" ? "ltr" : "rtl";

  const due = evidence.filter(
    (x) => !x.next_review_at || new Date(x.next_review_at) <= new Date(),
  ).length;

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!current || !answer.trim() || busy || attemptGuard.current.isBusy()) return;

    if (current.source === "curated") {
      const selectedIdx = Number(answer);
      const chosenText =
        current.choices.length > 0 &&
        Number.isInteger(selectedIdx) &&
        current.choices[selectedIdx] !== undefined
          ? current.choices[selectedIdx]
          : answer;
      const evaluated = evaluateLocalChoice({
        selectedChoice: chosenText,
        choices: current.choices,
        correctIndex: current.correct_index,
      });
      const correct = evaluated?.correct === true;
      const note =
        (!correct && evaluated?.correctChoiceText
          ? contentLanguage === "en"
            ? `Correct answer: ${evaluated.correctChoiceText}. `
            : `الإجابة الصحيحة: ${evaluated.correctChoiceText}. `
          : "") + (current.explanation ?? "");

      setGrade({
        correct,
        explanation_ar: note,
        explanation_en: note,
      });
      if (!answeredIds.has(current.id)) {
        const nextSet = new Set(answeredIds);
        nextSet.add(current.id);
        setAnsweredIds(nextSet);
        if (correct) setCorrectCount((c) => c + 1);
      }
      return;
    }

    await attemptGuard.current.runExclusive(async () => {
      await run(async (check) => {
        setError("");
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
        const result = data as Grade;
        setGrade(result);
        if (!answeredIds.has(current.id)) {
          const nextSet = new Set(answeredIds);
          nextSet.add(current.id);
          setAnsweredIds(nextSet);
          if (result.correct) setCorrectCount((c) => c + 1);
        }
      }, "");
    });
  }

  async function next() {
    if (!current || !grade || busy || attemptGuard.current.isBusy()) return;
    await attemptGuard.current.runExclusive(async () => {
      await run(async (check) => {
        if (current.source === "db" && grade && !grade.correct) {
          const { data: variant, error: variantError } = await supabase
            .from("questions")
            .select(
              "id,skill_id,variant_of,question_type,prompt_ar,prompt_en,choices_ar,choices_en,metadata",
            )
            .eq("variant_of", current.id)
            .in("publication_status", ["published_demo", "published"])
            .limit(1)
            .maybeSingle();
          check();
          if (variantError) throw variantError;
          if (variant) {
            const vRow = variant as DbReviewQuestion;
            const lang = current.contentLanguage;
            const arOpts = options(vRow.choices_ar);
            const enOpts = options(vRow.choices_en);
            setQuestions((list) =>
              list.map((q, i) =>
                i === idx
                  ? {
                      ...q,
                      id: vRow.id,
                      prompt: resolveCurriculumText(lang, vRow.prompt_ar, vRow.prompt_en),
                      choices: lang === "en" ? (enOpts.length ? enOpts : arOpts) : arOpts.length ? arOpts : enOpts,
                      metadata: vRow.metadata,
                    }
                  : q,
              ),
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
        setIdx((x) => Math.min(x + 1, questions.length));
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
  if (signedIn === false) {
    return (
      <ModuleWelcome
        title={t("فهمك يستحق أن يدوم.", "Make your understanding last.")}
        description={t(
          "راجع المهارات المستحقة بالتكرار المتباعد أو اختر مادة بعينها للمراجعة المركّزة.",
          "Review due skills with spaced repetition or choose any Sec. 1 track for focused topic drills.",
        )}
        icon="review"
        route="/review"
        eyebrow={t("المراجعة المتباعدة والموضوعية", "Spaced & Targeted Review")}
        steps={[
          t("استرجع الفكرة من ذاكرتك", "Recall the idea"),
          t("اختر مادة محددة أو مستحقات اليوم", "Pick due skills or a subject drill"),
          t("تابع موعد المراجعة التالية", "See your updated mastery"),
        ]}
      />
    );
  }

  if (idx >= questions.length && questions.length > 0) {
    const accuracy = Math.round((correctCount / questions.length) * 100);
    const activeTrackFilter = selectedTrackSlug !== "all" ? selectedTrackSlug : "";
    return (
      <AchievementCelebration
        kind="review"
        locale={locale}
        rankLabel={accuracy >= 90 ? "S+" : accuracy >= 75 ? "A" : "B"}
        badgeText={t("اكتملت جلسة المراجعة المتباعدة", "Spaced Repetition Session Complete")}
        title={
          accuracy >= 85
            ? t("تثبيت ممتاز للذاكرة طويلة المدى!", "Strong Long-Term Memory Lock!")
            : t("أتممت جلسة المراجعة بنجاح!", "Review Session Complete!")
        }
        subtitle={t(
          `أجبت عن ${correctCount} من ${questions.length} أسئلة بدقة ${accuracy}% — تم تحديث مواعيد المراجعة المتباعدة للمفاهيم القادمة.`,
          `Scored ${correctCount} of ${questions.length} (${accuracy}%) — your spaced repetition intervals have been strengthened.`,
        )}
        scorePct={accuracy}
        highlightNote={
          activeLessonPack
            ? t(
                `ركّزت هذه الجلسة على درس «${activeLessonPack.title}». يمكنك الآن مراجعة بطاقاته التفاعلية 3D أو خوض مهمته الرسمية.`,
                `Focused on "${activeLessonPack.title}". Reinforce with 3D Flashcards or launch the official lesson mission.`,
              )
            : t(
                "كل جلسة مراجعة منتظمة تضاعف فترة تذكّر المفهوم وتقلّل النسيان قبل امتحان الوحدة.",
                "Regular spaced recall strengthens long-term retention before your Unit Exam.",
              )
        }
        actions={
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                void applyModeOrFilter("topic", selectedTrackSlug, sessionLength, selectedLessonSlug)
              }
            >
              <span>{t("جلسة مراجعة جديدة", "Start Another Session")}</span>
            </button>
            <Link
              className="btn btn-secondary"
              href={`/study?tab=review${activeTrackFilter ? `&track=${encodeURIComponent(activeTrackFilter)}` : ""}${selectedLessonSlug !== "all" ? `&lesson=${encodeURIComponent(selectedLessonSlug)}` : ""}`}
            >
              {t("البطاقات التفاعلية والاختبارات", "Study Studio & Flashcards")}
            </Link>
            <Link
              className="btn btn-secondary"
              href={`/boss${activeTrackFilter ? `?track=${encodeURIComponent(activeTrackFilter)}` : ""}`}
            >
              {t("تحدّي الوحدة الشامل", "Unit Challenge")}
            </Link>
            <Link className="btn btn-secondary" href="/progress">
              {t("تابع مستوى إتقانك", "View Mastery")}
            </Link>
          </>
        }
      />
    );
  }

  return (
    <>
      <header className="noata-section-head">
        <div>
          <p className="noata-eyebrow">{t("مساحتك للمراجعة الذكية", "Your space for focused review")}</p>
          <h1>{t("المراجعة المتباعدة والموضوعية", "Smart Spaced & Topic Review")}</h1>
          <p>
            {t(
              "بدّل بين مستحقات التكرار المتباعد والمراجعة المركزة حسب المادة مع الحفاظ الكامل على لغة المنهج.",
              "Switch between FSRS due reviews and targeted subject drills while preserving authentic track language.",
            )}
          </p>
        </div>
        <span className="pill">
          {due.toLocaleString(locale === "en" ? "en" : "ar-EG")}{" "}
          {t("مراجعات مستحقة", "Due skills")}
        </span>
      </header>

      {/* Revision Controls Toolbar */}
      <section className="noata-learning-toolbar" aria-label={t("إعدادات جلسة المراجعة", "Review session controls")}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="noata-learning-pills" role="group" aria-label={t("وضع المراجعة", "Review mode")}>
            <button
              type="button"
              className={`noata-learning-pill ${mode === "due" ? "is-active" : ""}`}
              aria-pressed={mode === "due"}
              onClick={() => void applyModeOrFilter("due", selectedTrackSlug, sessionLength)}
            >
              <span>{t(`المستحق بالتكرار المتباعد (${due})`, `Spaced Due Queue (${due})`)}</span>
            </button>
            <button
              type="button"
              className={`noata-learning-pill ${mode === "topic" ? "is-active" : ""}`}
              aria-pressed={mode === "topic"}
              onClick={() => void applyModeOrFilter("topic", selectedTrackSlug, sessionLength)}
            >
              <span>{t("مراجعة مركّزة حسب المادة", "Targeted Subject Drill")}</span>
            </button>
          </div>

          <div className="noata-learning-pills" role="group" aria-label={t("عدد الأسئلة", "Session length")}>
            {([5, 10, 15] as const).map((len) => (
              <button
                key={len}
                type="button"
                className={`noata-learning-pill ${sessionLength === len ? "is-active" : ""}`}
                aria-pressed={sessionLength === len}
                onClick={() => void applyModeOrFilter(mode, selectedTrackSlug, len)}
              >
                <span>{len} {t("أسئلة", "Qs")}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="noata-learning-pills" role="group" aria-label={t("تصفية حسب المادة والمسار", "Filter by track")}>
          <button
            type="button"
            className={`noata-learning-pill ${selectedTrackSlug === "all" ? "is-active" : ""}`}
            aria-pressed={selectedTrackSlug === "all"}
            onClick={() => void applyModeOrFilter(mode, "all", sessionLength, "all")}
          >
            <span>{t("كل المواد والمسارات", "All Tracks")}</span>
          </button>
          {tracks.map((tr) => (
            <button
              key={tr.slug}
              type="button"
              className={`noata-learning-pill ${selectedTrackSlug === tr.slug ? "is-active" : ""}`}
              aria-pressed={selectedTrackSlug === tr.slug}
              onClick={() => void applyModeOrFilter("topic", tr.slug, sessionLength, "all")}
            >
              <span>{trackDisplayTitle(tr)}</span>
            </button>
          ))}
        </div>

        {trackLessonPacks.length > 0 && (
          <div
            className="noata-learning-pills"
            role="group"
            aria-label={t("تصفية حسب الدرس المحدد", "Filter by exact Sec. 1 lesson")}
          >
            <button
              type="button"
              className={`noata-learning-pill ${selectedLessonSlug === "all" ? "is-active" : ""}`}
              aria-pressed={selectedLessonSlug === "all"}
              onClick={() => void applyModeOrFilter("topic", selectedTrackSlug, sessionLength, "all")}
            >
              <span>{t("كل دروس المسار", "All Track Lessons")} ({trackLessonPacks.length})</span>
            </button>
            {trackLessonPacks.map((pack) => (
              <button
                key={pack.lessonSlug}
                type="button"
                className={`noata-learning-pill ${selectedLessonSlug === pack.lessonSlug ? "is-active" : ""}`}
                aria-pressed={selectedLessonSlug === pack.lessonSlug}
                lang={pack.contentLanguage}
                onClick={() =>
                  void applyModeOrFilter("topic", selectedTrackSlug, sessionLength, pack.lessonSlug)
                }
              >
                <span>
                  {pack.position}. {pack.title}
                </span>
              </button>
            ))}
          </div>
        )}

        {loadingTopic && (
          <small style={{ color: "var(--accent)", fontWeight: 700 }}>
            {t("جاري تجهيز أسئلة المادة...", "Loading targeted questions...")}
          </small>
        )}
      </section>

      {(() => {
        const companionPack =
          activeLessonPack ||
          (current?.lessonSlug ? getLessonStudyPack(current.lessonSlug) : null);
        if (!companionPack) return null;
        return (
          <section
            className="noata-review-companion"
            dir={companionPack.contentLanguage === "en" ? "ltr" : "rtl"}
            lang={companionPack.contentLanguage}
            aria-label={t("مرجع سريع للدرس", "Quick lesson recall reference")}
          >
            <div className="noata-review-companion-head">
              <div>
                <span className="eyebrow" style={{ marginBottom: 4 }}>
                  {t("رفيق التثبيت السريع", "Quick Recall Companion")}
                </span>
                <strong style={{ display: "block", fontSize: 15 }}>
                  {companionPack.title}
                </strong>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link
                  className="btn btn-secondary"
                  style={{ fontSize: 12.5 }}
                  href={`/study?track=${encodeURIComponent(companionPack.trackSlug)}&lesson=${encodeURIComponent(companionPack.lessonSlug)}`}
                >
                  {t("بطاقات وخطة الدرس في مركز المذاكرة", "Lesson Deck in Study Studio")}
                </Link>
                <Link
                  className="btn btn-secondary"
                  style={{ fontSize: 12.5 }}
                  href={`/lesson/${encodeURIComponent(companionPack.lessonSlug)}`}
                >
                  {t("افتح شرح الدرس", "Open Lesson")}
                </Link>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.65 }}>
              {companionPack.summary}
            </p>
            {companionPack.formulaOrRule ? (
              <div className="noata-review-formula">
                <StudyRichText content={companionPack.formulaOrRule} />
              </div>
            ) : null}
          </section>
        );
      })()}

      {!questions.length ? (
        <section className="noata-empty" role="status">
          <span className="noata-empty-icon" aria-hidden="true">✦</span>
          <h2>
            {mode === "due"
              ? t("ممتاز! لا توجد مهارات متأخرة في جدول المستحقات الآن", "All caught up on your FSRS due queue")
              : t("لم يتم العثور على أسئلة لهذا الاختيار", "No questions found for this filter")}
          </h2>
          <p>
            {t(
              "يمكنك التبديل فوراً إلى وضع المراجعة المركزة على أي مادة من مواد أولى ثانوي والتدرب على 5 أو 10 أو 15 سؤالاً.",
              "Switch to Targeted Subject Drill to practice 5, 10, or 15 curated Sec. 1 questions across any track.",
            )}
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void applyModeOrFilter("topic", selectedTrackSlug, sessionLength)}
            >
              {t("ابدأ المراجعة المركّزة الآن", "Start Targeted Drill")}
            </button>
            <Link href="/missions" className="btn btn-secondary">
              {t("ابدأ مهمة تعليمية", "Start a learning mission")}
            </Link>
          </div>
        </section>
      ) : (
        <section className="panel" style={{ padding: 28 }} lang={contentLanguage}>
          <div className="panel-head">
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <span className="pill" dir={contentDir}>
                  {current?.trackLabel ||
                    resolveCurriculumText(
                      contentLanguage,
                      skill?.skills?.title_ar,
                      skill?.skills?.title_en,
                      t("مهارة قيد المراجعة", "Skill under review"),
                    )}
                </span>
                {current?.difficulty && (
                  <span className="pill">{current.difficulty}</span>
                )}
                {skill?.next_review_at && (() => {
                  const dueMs = new Date(skill.next_review_at).getTime();
                  if (!Number.isFinite(dueMs)) return null;
                  const overdue = dueMs <= Date.now();
                  return (
                    <span className="pill">
                      {overdue
                        ? t("مستحقة الآن · SM-2", "Due Now · SM-2")
                        : `${t("المراجعة التالية:", "Next SM-2:")} ${new Date(dueMs).toLocaleDateString(locale === "en" ? "en" : "ar-EG", { month: "short", day: "numeric" })}`}
                    </span>
                  );
                })()}
              </div>
              <h2 style={{ margin: "6px 0 0", lineHeight: 1.7 }} dir={contentDir}>
                <StudyRichText content={current?.prompt ?? ""} inline />
              </h2>
            </div>
            <b>
              {idx + 1}/{questions.length}
            </b>
          </div>

          <form onSubmit={(e) => void submit(e)}>
            {current?.question_type === "multiple-choice" ? (
              <ChoiceCardGroup
                legend={t("خيارات المراجعة", "Review choices")}
                options={current.choices}
                value={answer}
                disabled={Boolean(grade) || busy}
                contentDir={contentDir}
                numericLabels
                locale={contentLanguage}
                onChange={(val) => setAnswer(val)}
              />
            ) : (
              <input
                className="search"
                style={{ width: "100%" }}
                value={answer}
                disabled={Boolean(grade) || busy}
                onChange={(e) => setAnswer(e.target.value)}
                inputMode={current?.question_type === "numeric" ? "decimal" : "text"}
                aria-label={t("إجابتك على السؤال", "Your answer")}
                placeholder={t("اكتب إجابتك…", "Enter your answer…")}
              />
            )}

            {current?.hint && (
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: 12, padding: "5px 10px" }}
                  onClick={() => setHintVisible((v) => !v)}
                >
                  {hintVisible ? t("إخفاء التلميح", "Hide Hint") : t("تلميح", "Show Hint")}
                </button>
                {hintVisible && (
                  <div dir={contentDir} style={{ marginTop: 6, fontSize: 13.5, color: "var(--muted)" }}>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <b>
                      {grade.correct
                        ? t("صح 👏", "Correct 👏")
                        : t("لسه محتاجة تثبيت — راجع التفسير:", "Needs reinforcement — see why:")}
                    </b>
                    <p style={{ margin: "4px 0 0", lineHeight: 1.7 }}>
                      <StudyRichText
                        inline
                        content={resolveCurriculumText(
                          contentLanguage,
                          grade.explanation_ar,
                          grade.explanation_en,
                        )}
                      />
                    </p>
                  </div>
                  <Link
                    href={buildStructuredAiHandoffHref({
                      source: "review",
                      action: "concept_clarify",
                      subject: current.trackSlug,
                      lessonId: current.lessonSlug,
                      topic: activeLessonPack?.title ?? (current.lessonTitle || current.trackLabel || undefined),
                    })}
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: "5px 10px" }}
                  >
                    <Icon name="sparkles" size={13} />
                    <span>{t("استفسر من AI", "Ask AI")}</span>
                  </Link>
                </div>

                {!grade.correct &&
                  current.source === "db" &&
                  (() => {
                    const tip = extractDistractorFeedback(
                      current.metadata,
                      answer,
                      contentLanguage,
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
                    {t("درجة الإتقان ", "Mastery ")}
                    {Math.round(Number(grade.mastery_score)).toLocaleString(
                      locale === "en" ? "en" : "ar-EG",
                    )}
                    {t("٪ ·", "% ·")} {masteryLabel(grade.mastery_state, locale)}
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
                  onClick={() => void (grade ? next() : submit())}
                >
                  {t("إعادة المحاولة بنفس الإجابة", "Retry safely")}
                </button>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 18,
              }}
            >
              {!grade ? (
                <button
                  className="btn"
                  disabled={!answer || busy}
                  style={{
                    background: "var(--accent)",
                    color: "var(--on-accent, #ffffff)",
                  }}
                >
                  {busy ? t("جارٍ التحقق…", "Checking…") : t("تحقق", "Check answer")}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn"
                  onClick={() => void next()}
                  style={{
                    background: "var(--accent)",
                    color: "var(--on-accent, #ffffff)",
                  }}
                >
                  {idx < questions.length - 1
                    ? current.source === "db" && !grade.correct
                      ? t("سؤال موازي", "Similar question")
                      : t("التالي", "Next")
                    : t("عرض نتيجة المراجعة", "Finish Review")}
                </button>
              )}
            </div>
          </form>
        </section>
      )}
    </>
  );
}
