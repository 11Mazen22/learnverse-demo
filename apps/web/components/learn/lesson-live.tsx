"use client";

import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";
import { ChoiceCardGroup } from "@/components/ui/choice-card-group";
import { StudyRichText } from "@/components/study/study-rich-text";
import { SubjectLabRouter } from "@/components/learn/labs/subject-lab-router";
import { KnowledgeMapStrip } from "@/components/learn/knowledge-map-strip";
import { LessonProvenanceDialog } from "@/components/learn/lesson-provenance-dialog";
import { buildStructuredAiHandoffHref, type AiHandoffAction } from "@/lib/ai/handoff-contract";
import { PreLessonDiagnostic } from "@/components/learn/pre-lesson-diagnostic";
import {
  extractLessonHook,
  hasSummaryDetailBeyondHook,
  type KnowledgeMapInputLesson,
  type KnowledgeMapInputUnit,
} from "@/lib/curriculum/knowledge-map";
import {
  AchievementCelebration,
  computeLessonAchievementSummary,
} from "@/components/ui/achievement-celebration";
import {
  AttemptIdempotencyController,
  extractDistractorFeedback,
} from "@/lib/curriculum/attempt-guard";
import {
  inferContentLanguage,
  resolveCurriculumText,
  subjectDefinition,
  trackDefinition,
  type ContentLanguage,
} from "@/lib/curriculum/catalog";
import {
  evaluateLocalChoice,
  getLessonStudyCompanion,
} from "@/lib/curriculum/sec1-study-pack";
import {
  ACCOUNT_DRAFT_EPOCH,
  loadScopedStudyDraft,
  saveScopedStudyDraft,
} from "@/lib/study/draft-storage";

type LessonRow = {
  id: string;
  slug?: string | null;
  unit_id: string;
  position?: number | null;
  title_ar: string;
  title_en: string;
  content: unknown;
  xp_reward: number;
  coin_reward: number;
  units: { id: string; course_id?: string | null; title_ar: string; title_en: string } | null;
};

type ContentShape = {
  duration_minutes?: number;
  summary_ar?: string;
  summary_en?: string;
  worked_ar?: string;
  worked_en?: string;
  objectives_ar?: unknown;
  objectives_en?: unknown;
  common_mistakes_ar?: unknown;
  common_mistakes_en?: unknown;
  provenance_ar?: string;
  provenance_en?: string;
  source_document?: string;
  source_sha256?: string;
  render_language?: "ar" | "en";
  primary_content_language?: "ar" | "en";
  translation_note_ar?: string;
  translation_note_en?: string;
  prerequisite_lesson_id?: string;
};

type TrackContext = {
  slug: string;
  content_language: ContentLanguage;
  title_ar: string;
  title_en: string;
  source_document: string | null;
  source_sha256: string | null;
};

type DbQuestionRow = {
  id: string;
  question_type: string;
  variant_of: string | null;
  position: number | null;
  prompt_ar: string;
  prompt_en: string | null;
  choices_ar: unknown;
  choices_en: unknown;
  metadata: unknown;
};

type PracticeItem = {
  id: string;
  source: "db" | "curated";
  question_type: string;
  prompt: string;
  choices: string[];
  correct_index?: number;
  hint?: string;
  explanation?: string;
  difficulty?: string;
  metadata?: unknown;
};

type PracticeAnswerState = {
  selected: string;
  submitted: boolean;
  grading?: boolean;
  correct: boolean | null;
  feedback: string;
  xpAwarded?: number;
  error?: string;
};

const strings = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];

function dedupeStrings(items: string[], limit = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const clean = raw.trim();
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= limit) break;
  }
  return out;
}

function buildAiHref(
  action: AiHandoffAction,
  subjectSlug?: string,
  lessonId?: string,
  topic?: string,
): string {
  return buildStructuredAiHandoffHref({
    source: "lesson",
    action,
    subject: subjectSlug,
    lessonId,
    topic,
  });
}

export function LessonLive({ id }: { id: string }) {
  const t = useTranslation();
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const account = useVerifiedAccount();
  const attemptGuard = useRef(new AttemptIdempotencyController());

  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [lesson, setLesson] = useState<LessonRow | null>(null);
  const [dbQuestions, setDbQuestions] = useState<DbQuestionRow[]>([]);
  const [track, setTrack] = useState<TrackContext | null>(null);
  const [completed, setCompleted] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  // Pedagogical Stepper & Worked-Step Reveal state
  const [activeStage, setActiveStage] = useState(0);
  const [revealedStepsByExample, setRevealedStepsByExample] = useState<Record<number, number>>({});
  const [diagnosticFocus, setDiagnosticFocus] = useState<string | null>(null);
  const [courseUnits, setCourseUnits] = useState<KnowledgeMapInputUnit[]>([]);
  const [courseLessons, setCourseLessons] = useState<KnowledgeMapInputLesson[]>([]);
  const [completedSiblingIds, setCompletedSiblingIds] = useState<Set<string>>(new Set());

  // Interactive Multi-Question Checkpoint state
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const [answerStates, setAnswerStates] = useState<Record<number, PracticeAnswerState>>({});
  const draftReadyForLessonRef = useRef<string | null>(null);

  useEffect(() => {
    if (account.loading) return;
    let alive = true;
    draftReadyForLessonRef.current = null;
    attemptGuard.current.resetAll();
    setLoading(true);
    setError("");
    setMissing(false);
    setLesson(null);
    setCompleted(false);
    setBestScore(null);
    setDbQuestions([]);
    setTrack(null);
    setActiveStage(0);
    setPracticeIndex(0);
    setHintVisible(false);
    setAnswerStates({});
    setRevealedStepsByExample({});
    setDiagnosticFocus(null);
    setCourseUnits([]);
    setCourseLessons([]);
    setCompletedSiblingIds(new Set());

    void (async () => {
      try {
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const lessonRes = await supabase
          .from("lessons")
          .select(
            "id,slug,unit_id,position,title_ar,title_en,content,xp_reward,coin_reward,units(id,course_id,title_ar,title_en)",
          )
          .eq(isUuid ? "id" : "slug", id)
          .maybeSingle();

        if (!alive) return;
        if (lessonRes.error) throw lessonRes.error;
        if (!lessonRes.data) {
          setMissing(true);
          return;
        }

        const canonicalLessonId = lessonRes.data.id;
        const courseId =
          (lessonRes.data.units as { course_id?: string | null } | null)?.course_id ?? null;

        const [questionRows, trackResult] = await Promise.all([
          supabase
            .from("questions")
            .select(
              "id,question_type,variant_of,position,prompt_ar,prompt_en,choices_ar,choices_en,metadata",
            )
            .eq("lesson_id", canonicalLessonId)
            .in("publication_status", ["published_demo", "published"])
            .order("position", { ascending: true }),
          courseId
            ? supabase
                .from("curriculum_tracks")
                .select("slug,content_language,title_ar,title_en,source_document,source_sha256")
                .eq("course_id", courseId)
                .eq("publication_status", "published")
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (!alive) return;
        if (questionRows.error || trackResult.error) {
          throw questionRows.error ?? trackResult.error;
        }

        const content = (lessonRes.data.content ?? {}) as ContentShape;
        const resolvedLanguage = inferContentLanguage({
          trackContentLanguage: (trackResult.data as TrackContext | null)?.content_language,
          promptAr: content.summary_ar,
          promptEn: content.summary_en,
          metadata: content as Record<string, unknown>,
        });

        setTrack(
          trackResult.data
            ? (trackResult.data as TrackContext)
            : {
                slug: "",
                content_language: resolvedLanguage,
                title_ar: "",
                title_en: "",
                source_document: content.source_document ?? null,
                source_sha256: content.source_sha256 ?? null,
              },
        );

        if (account.user) {
          const result = await supabase
            .from("lesson_progress")
            .select("completed_at,best_score")
            .eq("user_id", account.user.id)
            .eq("lesson_id", canonicalLessonId)
            .maybeSingle();

          if (!alive) return;
          if (result.error) throw result.error;
          if (result.data) {
            setCompleted(Boolean(result.data.completed_at));
            setBestScore(result.data.best_score);
          }
        }

        if (courseId) {
          void (async () => {
            try {
              const unitsRes = await supabase
                .from("units")
                .select("id,position,title_ar,title_en")
                .eq("course_id", courseId)
                .order("position");
              if (!alive || unitsRes.error || !unitsRes.data?.length) return;
              const unitRows = unitsRes.data as KnowledgeMapInputUnit[];
              const unitIds = unitRows.map((u) => u.id);
              const lessonsRes = await supabase
                .from("lessons")
                .select("id,unit_id,position,title_ar,title_en")
                .in("unit_id", unitIds)
                .order("position");
              if (!alive || lessonsRes.error || !lessonsRes.data) return;
              setCourseUnits(unitRows);
              setCourseLessons(lessonsRes.data as KnowledgeMapInputLesson[]);

              if (account.user) {
                const siblingProgressRes = await supabase
                  .from("lesson_progress")
                  .select("lesson_id,completed_at")
                  .eq("user_id", account.user.id)
                  .in(
                    "lesson_id",
                    lessonsRes.data.map((l) => l.id),
                  );
                if (alive && !siblingProgressRes.error && siblingProgressRes.data) {
                  setCompletedSiblingIds(
                    new Set(
                      siblingProgressRes.data
                        .filter((r) => Boolean(r.completed_at))
                        .map((r) => r.lesson_id),
                    ),
                  );
                }
              }
            } catch {
              // Soft fail: compact knowledge map falls back cleanly when sibling lookup is unavailable
            }
          })();
        }

        setLesson(lessonRes.data as LessonRow);

        const savedDraft =
          typeof window !== "undefined"
            ? loadScopedStudyDraft<{
                activeStage?: number;
                revealedStepsByExample?: Record<number, number>;
                practiceIndex?: number;
                hintVisible?: boolean;
                answerStates?: Record<number, PracticeAnswerState>;
              }>(
                window.localStorage,
                account.user?.id ?? null,
                ACCOUNT_DRAFT_EPOCH,
                `lesson_${canonicalLessonId}`,
              )
            : null;
        if (savedDraft) {
          if (typeof savedDraft.activeStage === "number" && savedDraft.activeStage >= 0 && savedDraft.activeStage <= 4) {
            setActiveStage(savedDraft.activeStage);
          }
          if (savedDraft.revealedStepsByExample && typeof savedDraft.revealedStepsByExample === "object") {
            setRevealedStepsByExample(savedDraft.revealedStepsByExample);
          }
          if (typeof savedDraft.practiceIndex === "number" && savedDraft.practiceIndex >= 0) {
            setPracticeIndex(savedDraft.practiceIndex);
          }
          if (typeof savedDraft.hintVisible === "boolean") {
            setHintVisible(savedDraft.hintVisible);
          }
          if (savedDraft.answerStates && typeof savedDraft.answerStates === "object") {
            const restored: Record<number, PracticeAnswerState> = {};
            for (const [k, st] of Object.entries(savedDraft.answerStates)) {
              const numKey = Number(k);
              if (Number.isInteger(numKey) && st && typeof st === "object") {
                restored[numKey] = { ...st, grading: false };
              }
            }
            setAnswerStates(restored);
          }
        }
        draftReadyForLessonRef.current = canonicalLessonId;

        setDbQuestions(
          ((questionRows.data ?? []) as DbQuestionRow[]).filter((row) => {
            const metadata =
              row.metadata && typeof row.metadata === "object"
                ? (row.metadata as Record<string, unknown>)
                : {};
            return row.variant_of === null || metadata.translation_track === true;
          }),
        );
      } catch {
        if (alive) {
          setError(
            t(
              "تعذّر تحميل الدرس وتقدّمك. حاول مرة أخرى؛ لم نؤكد أنه غير متاح.",
              "Could not load the lesson and your progress. Please try again.",
            ),
          );
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, supabase, retry, account.user, account.loading, account.revision, t]);

  useEffect(() => {
    if (!lesson?.id || draftReadyForLessonRef.current !== lesson.id) return;
    if (typeof window === "undefined") return;
    const sanitizedAnswers: Record<number, PracticeAnswerState> = {};
    for (const [k, st] of Object.entries(answerStates)) {
      const numKey = Number(k);
      if (Number.isInteger(numKey) && st) {
        sanitizedAnswers[numKey] = { ...st, grading: false };
      }
    }
    saveScopedStudyDraft(
      window.localStorage,
      account.user?.id ?? null,
      ACCOUNT_DRAFT_EPOCH,
      `lesson_${lesson.id}`,
      {
        activeStage,
        revealedStepsByExample,
        practiceIndex,
        hintVisible,
        answerStates: sanitizedAnswers,
      },
    );
  }, [
    account.revision,
    account.user?.id,
    activeStage,
    answerStates,
    hintVisible,
    lesson?.id,
    practiceIndex,
    revealedStepsByExample,
  ]);

  if (account.error || error) {
    return (
      <section className="aura-load-error" role="alert">
        <h2>{account.error || error}</h2>
        <button
          type="button"
          onClick={() => {
            if (account.error) void account.refresh();
            else setRetry((x) => x + 1);
          }}
        >
          {t("إعادة المحاولة", "Try again")}
        </button>
      </section>
    );
  }

  if (account.loading || loading) {
    return (
      <section className="panel" style={{ padding: 36 }}>
        <div className="skeleton" style={{ height: 28, borderRadius: 12, width: "40%", marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 160, borderRadius: 20, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 320, borderRadius: 24 }} />
      </section>
    );
  }

  if (missing || !lesson) {
    return (
      <section className="panel" style={{ textAlign: "center", padding: 48 }}>
        <h2>{t("هذا الدرس غير متاح حاليًا.", "This lesson is not available.")}</h2>
        <p style={{ color: "var(--muted)", margin: "12px 0 24px" }}>
          {t("تأكد من اختيار المادة والمسار الصحيحين من رحلة التعلّم.", "Check that you selected the correct subject and track from your learning journey.")}
        </p>
        <Link
          className="btn btn-primary"
          href="/learn"
          style={{ background: "var(--accent)", color: "var(--on-accent, #ffffff)", display: "inline-flex" }}
        >
          {t("رجوع للمسار", "Back to your journey")}
        </Link>
      </section>
    );
  }

  const courseId = lesson.units?.course_id ?? null;
  const content = (lesson.content ?? {}) as ContentShape;
  const hasRealTrack = Boolean(courseId || track?.slug);
  const contentLanguage: ContentLanguage = track?.slug
    ? track.content_language
    : !courseId &&
        locale === "en" &&
        Boolean(content.summary_en?.trim()) &&
        !content.render_language &&
        !content.primary_content_language
      ? "en"
      : content.render_language ??
        content.primary_content_language ??
        track?.content_language ??
        inferContentLanguage({
          promptAr: content.summary_ar,
          promptEn: content.summary_en,
          metadata: content as Record<string, unknown>,
        });
  const isEnContent = contentLanguage === "en";
  const contentDir: "ltr" | "rtl" = isEnContent ? "ltr" : "rtl";

  const lessonTitle = resolveCurriculumText(contentLanguage, lesson.title_ar, lesson.title_en);
  const unitTitle = resolveCurriculumText(
    contentLanguage,
    lesson.units?.title_ar,
    lesson.units?.title_en,
  );
  const trackTitle = resolveCurriculumText(
    contentLanguage,
    track?.title_ar,
    track?.title_en,
    t("مسار تعليمي معتمد", "Accredited track"),
  );
  const summary = resolveCurriculumText(contentLanguage, content.summary_ar, content.summary_en);
  const lessonHook = extractLessonHook(summary, 2);
  const hasMoreSummary = hasSummaryDetailBeyondHook(summary, lessonHook);
  const worked = resolveCurriculumText(contentLanguage, content.worked_ar, content.worked_en);
  const dbObjectives = strings(isEnContent ? content.objectives_en : content.objectives_ar);
  const dbMistakes = strings(
    isEnContent ? content.common_mistakes_en : content.common_mistakes_ar,
  );
  const translationNote = resolveCurriculumText(
    contentLanguage,
    content.translation_note_ar,
    content.translation_note_en,
  );

  const lessonSlug = lesson.slug?.trim() || lesson.id;

  const companion = getLessonStudyCompanion({
    lessonIdOrSlug: lessonSlug,
    titleAr: lesson.title_ar,
    titleEn: lesson.title_en,
    trackSlug: track?.slug || undefined,
    subjectKey: track?.slug ? track.slug.replace(/-(ar|en)$/, "") : undefined,
    position: lesson.position ?? undefined,
    contentLanguage,
  });

  const objectives = dbObjectives.length
    ? dbObjectives
    : hasRealTrack
      ? companion.keyConcepts.slice(0, 4).map((c) => c.title)
      : [];
  const mistakes = hasRealTrack
    ? dedupeStrings([...dbMistakes, ...companion.commonMistakes], 6)
    : dbMistakes;

  const dbPracticeItems: PracticeItem[] = dbQuestions
    .map((q) => {
      const prompt = resolveCurriculumText(contentLanguage, q.prompt_ar, q.prompt_en);
      const arChoices = strings(q.choices_ar);
      const enChoices = strings(q.choices_en);
      const choicesList = isEnContent
        ? enChoices.length
          ? enChoices
          : arChoices
        : arChoices.length
          ? arChoices
          : enChoices;
      const meta =
        q.metadata && typeof q.metadata === "object"
          ? (q.metadata as Record<string, unknown>)
          : {};
      const hint = resolveCurriculumText(
        contentLanguage,
        typeof meta.hint_ar === "string" ? meta.hint_ar : null,
        typeof meta.hint_en === "string" ? meta.hint_en : null,
      );
      return {
        id: q.id,
        source: "db" as const,
        question_type: q.question_type,
        prompt,
        choices: choicesList,
        hint: hint || undefined,
        metadata: q.metadata,
      };
    })
    .filter((item) => Boolean(item.prompt));

  const seenPrompts = new Set(dbPracticeItems.map((item) => item.prompt.trim().toLowerCase()));
  const curatedSupplements: PracticeItem[] = hasRealTrack
    ? companion.curatedQuestions
        .filter((q) => !seenPrompts.has(q.prompt.trim().toLowerCase()))
        .map((q) => ({
          id: q.id,
          source: "curated" as const,
          question_type: q.question_type,
          prompt: q.prompt,
          choices: q.choices,
          correct_index: q.correct_index,
          hint: q.hint,
          explanation: q.explanation,
          difficulty: q.difficulty,
        }))
    : [];

  const practicePool: PracticeItem[] = [...dbPracticeItems, ...curatedSupplements].slice(0, 5);
  const questionCount = Math.max(dbPracticeItems.length, practicePool.length);
  const safePracticeIndex = practicePool.length
    ? Math.min(practiceIndex, practicePool.length - 1)
    : 0;
  const activeQuestion = practicePool[safePracticeIndex] ?? null;
  const activeAnswerState = answerStates[safePracticeIndex] ?? {
    selected: "",
    submitted: false,
    correct: null,
    feedback: "",
  };

  const completedPracticeCount = practicePool.filter(
    (_, idx) => answerStates[idx]?.submitted,
  ).length;
  const correctPracticeCount = practicePool.filter(
    (_, idx) => answerStates[idx]?.correct === true,
  ).length;

  async function handleCheckPracticeAnswer(idx: number) {
    const item = practicePool[idx];
    const currentState = answerStates[idx];
    if (!item || !currentState?.selected.trim() || currentState.grading) return;

    if (item.source === "curated") {
      const selectedIdx = Number(currentState.selected);
      const selectedChoiceText =
        item.choices.length > 0 &&
        Number.isInteger(selectedIdx) &&
        item.choices[selectedIdx] !== undefined
          ? item.choices[selectedIdx]
          : currentState.selected;
      const evaluated = evaluateLocalChoice({
        selectedChoice: selectedChoiceText,
        choices: item.choices,
        correctIndex: item.correct_index,
      });
      const correct = evaluated ? evaluated.correct : false;
      const fallbackCorrect = evaluated?.correctChoiceText
        ? isEnContent
          ? `Expected answer: ${evaluated.correctChoiceText}. `
          : `الإجابة الصحيحة: ${evaluated.correctChoiceText}. `
        : "";
      setAnswerStates((prev) => ({
        ...prev,
        [idx]: {
          ...currentState,
          submitted: true,
          grading: false,
          correct,
          error: undefined,
          feedback: (correct ? "" : fallbackCorrect) + (item.explanation ?? ""),
        },
      }));
      return;
    }

    if (!account.user) {
      setAnswerStates((prev) => ({
        ...prev,
        [idx]: {
          ...currentState,
          error: t(
            "سجّل الدخول للتحقق الرسمي وحفظ نقاط الخبرة.",
            "Sign in to verify DB questions and earn XP.",
          ),
        },
      }));
      return;
    }

    const revisionToken = account.revision.current;
    await attemptGuard.current.runExclusive(async () => {
      setAnswerStates((prev) => ({
        ...prev,
        [idx]: { ...currentState, grading: true, error: undefined },
      }));

      try {
        const idempotencyKey = attemptGuard.current.getAttemptKey(item.id, currentState.selected);
        const { data, error: rpcError } = await supabase.rpc("submit_attempt", {
          p_question_id: item.id,
          p_response: { value: currentState.selected },
          p_assisted: hintVisible,
          p_idempotency_key: idempotencyKey,
          p_practice_repeat: true,
        });
        if (revisionToken !== account.revision.current) return;
        if (rpcError) throw rpcError;
        attemptGuard.current.clearAttempt(item.id);
        const result = (data ?? {}) as {
          correct?: boolean;
          explanation_ar?: string;
          explanation_en?: string;
          xp_awarded?: number;
        };
        const correct = result.correct === true;
        const distractor = !correct
          ? extractDistractorFeedback(item.metadata, currentState.selected, contentLanguage)
          : "";
        const feedbackText =
          distractor ||
          resolveCurriculumText(
            contentLanguage,
            result.explanation_ar,
            result.explanation_en,
            correct
              ? isEnContent
                ? "Verified! Core concept confirmed."
                : "إجابة موفّقة! أحسنت تطبيق المفهوم."
              : isEnContent
                ? "Review the worked steps and try again."
                : "راجع خطوات المثال المحلول ثم أعد المحاولة.",
          );
        setAnswerStates((prev) => ({
          ...prev,
          [idx]: {
            ...currentState,
            submitted: true,
            grading: false,
            correct,
            xpAwarded: typeof result.xp_awarded === "number" ? result.xp_awarded : undefined,
            feedback: feedbackText,
          },
        }));
      } catch {
        if (revisionToken !== account.revision.current) return;
        setAnswerStates((prev) => ({
          ...prev,
          [idx]: {
            ...currentState,
            grading: false,
            error: t(
              "تعذّر التحقق من الإجابة الآن. حاول مرة أخرى.",
              "Could not verify this answer right now. Please try again.",
            ),
          },
        }));
      }
    });
  }

  // Discipline detection
  const trackSlug = track?.slug || "";
  const disciplineType = trackSlug.includes("math")
    ? "math"
    : trackSlug.includes("science")
      ? "science"
      : trackSlug.includes("history")
        ? "history"
        : trackSlug.includes("arabic")
          ? "arabic"
          : trackSlug.includes("philosophy")
            ? "philosophy"
            : trackSlug.includes("english") || lessonSlug.startsWith("eng-")
              ? "english"
              : "general";

  // Stages definition
  const STAGES = [
    {
      num: "01",
      id: "objectives",
      titleAr: "الأهداف والتهيئة",
      titleEn: "Foundations & Goals",
      icon: "book",
    },
    {
      num: "02",
      id: "concept",
      titleAr: "الشرح والتفكيك",
      titleEn: "Core Concept",
      icon: "sparkles",
    },
    {
      num: "03",
      id: "worked",
      titleAr: "التطبيق والمثال المحلول",
      titleEn: "Worked Application",
      icon: "check",
    },
    {
      num: "04",
      id: "misconceptions",
      titleAr: "حراسة المفاهيم والأخطاء",
      titleEn: "Misconception Guard",
      icon: "lock",
    },
    {
      num: "05",
      id: "checkpoint",
      titleAr: "التحقق والانطلاق",
      titleEn: "Checkpoint & Mission",
      icon: "arrow",
    },
  ];

  const studyHrefBase = `/study?lesson=${encodeURIComponent(lessonSlug)}&title=${encodeURIComponent(lessonTitle)}${trackSlug ? `&track=${encodeURIComponent(trackSlug)}` : ""}`;
  const resolvedSubjectKey =
    trackDefinition(trackSlug)?.subject ??
    (trackSlug ? trackSlug.replace(/-(ar|en)$/, "") : "");
  const subjectMeta = subjectDefinition(resolvedSubjectKey);
  const lessonAccent = subjectMeta?.accent ?? "indigo";
  const subjectTitle = subjectMeta
    ? t(subjectMeta.titleAr, subjectMeta.titleEn)
    : undefined;

  return (
    <div className="noata-lesson-container" data-accent={lessonAccent} data-tour-page="lesson">
      {/* 1. Breadcrumbs */}
      <nav className="noata-lesson-breadcrumb" aria-label={t("مسار التنقل", "Breadcrumb navigation")}>
        <Link href="/learn">{t("رحلة التعلّم", "Learning journey")}</Link>
        <span className="noata-lesson-breadcrumb-sep">/</span>
        <span dir={contentDir}>{unitTitle || t("الوحدة الدراسية", "Study Unit")}</span>
        <span className="noata-lesson-breadcrumb-sep">/</span>
        <span aria-current="page" dir={contentDir} style={{ color: "var(--ink)", fontWeight: 700 }}>
          {lessonTitle}
        </span>
      </nav>

      {/* 2. Hero Header */}
      <section className="noata-lesson-hero" data-tour="lesson-context">
        <div className="noata-lesson-meta-bar">
          <span className="noata-lesson-track-tag" dir={contentDir}>
            <Icon name="book" size={14} />
            <span>{trackTitle}</span>
          </span>

          <div className="noata-lesson-metrics">
            {completed && (
              <span className="noata-lesson-metric-chip is-completed">
                <Icon name="check" size={14} />
                <span>{t("مكتمل وموثّق", "Completed")} · {Math.round(bestScore ?? 100)}%</span>
              </span>
            )}
            <span className="noata-lesson-metric-chip">
              <Icon name="clock" size={14} />
              <span>{content.duration_minutes ?? 7} {t("دقائق مذاكرة", "min study")}</span>
            </span>
            <span className="noata-lesson-metric-chip" style={{ color: "var(--accent)" }}>
              <span>+{lesson.xp_reward} XP</span>
            </span>
            <span className="noata-lesson-metric-chip" style={{ color: "var(--warning)" }}>
              <span>+{lesson.coin_reward} Coins</span>
            </span>
            {content.prerequisite_lesson_id && (
              <Link
                href={`/lesson/${encodeURIComponent(content.prerequisite_lesson_id)}`}
                className="noata-lesson-prereq"
              >
                <Icon name="lock" size={13} />
                <span>{t("متطلب تمهيدي سابق", "Prerequisite lesson")}</span>
              </Link>
            )}
          </div>
        </div>

        <div className="noata-lesson-title-area">
          <h1 dir={contentDir}>{lessonTitle}</h1>
          <div className="noata-lesson-lead" dir={contentDir}>
            <StudyRichText
              content={
                lessonHook ||
                summary ||
                t(
                  "محتوى الدرس مبني على دليل المذاكرة الأصيل المعتمد لوزارة التربية والتعليم.",
                  "Lesson content is based on the verified curriculum study pack.",
                )
              }
              dir={contentDir}
              locale={contentLanguage}
            />
          </div>
        </div>

        {(track?.source_document || content.source_document || track?.source_sha256 || content.source_sha256) && (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <LessonProvenanceDialog
              sourceDocument={track?.source_document || content.source_document}
              sourceSha256={track?.source_sha256 || content.source_sha256}
              trackTitle={trackTitle}
              subjectTitle={subjectTitle}
              uiLocale={locale}
            />
          </div>
        )}
      </section>

      {/* 3. Sticky Pedagogical Outline & Active Stage View */}
      <div className="noata-lesson-layout">
        <aside
          className="noata-lesson-outline"
          data-tour="lesson-stages"
          aria-label={t("مخطط الدرس البيداغوجي", "Pedagogical lesson outline")}
        >
          <div className="noata-lesson-outline-title">
            {t("هيكل الدرس", "Lesson Outline")}
          </div>
          {STAGES.map((st, idx) => {
            const isActive = activeStage === idx;
            return (
              <button
                key={st.id}
                type="button"
                className={`noata-stage-step ${isActive ? "is-active" : ""}`}
                onClick={() => setActiveStage(idx)}
                aria-pressed={isActive}
              >
                <span className="noata-stage-num">{st.num}</span>
                <span>{locale === "en" ? st.titleEn : st.titleAr}</span>
              </button>
            );
          })}
          <div style={{ borderTop: "1px solid var(--line)", marginTop: 6, paddingTop: 10, display: "grid", gap: 6 }}>
            <Link
              className="btn btn-secondary"
              style={{ justifyContent: "center", fontSize: 12.5 }}
              href={`${studyHrefBase}&tab=generator`}
            >
              <Icon name="sparkles" size={14} />
              <span>{t("حزمة المذاكرة الذكية", "Open Study Deck")}</span>
            </Link>
            <Link
              className="btn btn-secondary"
              style={{ justifyContent: "center", fontSize: 12.5 }}
              href={buildAiHref("explain_simply", trackSlug, lessonSlug, lessonTitle)}
            >
              <Icon name="sparkles" size={14} />
              <span>{t("اسأل المعلم الذكي", "Ask AI Tutor")}</span>
            </Link>
            {courseUnits.length > 0 && courseLessons.length > 0 && (
              <details className="noata-kmap-sidebar-details" style={{ marginTop: 4 }}>
                <summary
                  style={{
                    cursor: "pointer",
                    minHeight: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 6,
                    padding: "6px 10px",
                    borderRadius: 10,
                    border: "1px solid var(--line)",
                    background: "var(--surface-soft)",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "var(--ink)",
                  }}
                >
                  <span>{t("خريطة الوحدة", "Unit Map")}</span>
                  <Icon name="chevron-down" size={14} />
                </summary>
                <div style={{ marginTop: 8 }}>
                  <KnowledgeMapStrip
                    compact
                    subjectKey={resolvedSubjectKey}
                    subjectAccent={lessonAccent}
                    units={courseUnits}
                    lessons={courseLessons}
                    completedLessonIds={completedSiblingIds}
                    uiLocale={locale}
                    contentLocale={contentLanguage}
                    activeLessonId={lesson.id}
                    buildLessonHref={(targetId) =>
                      `/lesson/${encodeURIComponent(targetId)}${trackSlug ? `?track=${encodeURIComponent(trackSlug)}` : ""}`
                    }
                  />
                </div>
              </details>
            )}
          </div>
        </aside>

        <section className="noata-stage-content-card" data-tour="lesson-content">
          {/* STAGE 0: Objectives & Foundations */}
          {activeStage === 0 && (
            <>
              <div className="noata-stage-header">
                <div className="noata-stage-header-title">
                  <span className="noata-stage-icon-circle">
                    <Icon name="book" size={20} />
                  </span>
                  <div>
                    <h2>{t("أهداف التعلم والتهيئة المعرفية", "Learning Objectives & Foundations")}</h2>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      {t("ما يتوقع منك إتقانه وتطبيقه بنهاية هذا الدرس.", "Key competencies you will acquire by the end of this lesson.")}
                    </p>
                  </div>
                </div>
              </div>

              {objectives.length > 0 ? (
                <div className="noata-objectives-grid">
                  {objectives.map((obj, i) => (
                    <div key={i} className="noata-objective-card">
                      <span className="noata-objective-bullet">{i + 1}</span>
                      <div className="noata-objective-text" dir={contentDir}>
                        <StudyRichText content={obj} dir={contentDir} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--muted)" }}>
                  {t("الهدف الأساسي هو استيعاب المفهوم وتطبيقه في أسئلة الفهم والمهمة التطبيقية.", "The core goal is conceptual comprehension and practical application.")}
                </p>
              )}

              <div className={`noata-discipline-panel ${disciplineType}`}>
                <div className="noata-discipline-badge">
                  <Icon name="sparkles" size={14} />
                  <span>
                    {disciplineType === "math"
                      ? t("منهجية الرياضيات: التركيز على خطوات التحليل الرياضي المنطقي", "Mathematical Method: Step-by-step rigorous deduction")
                      : disciplineType === "science"
                        ? t("المنهج العلمي: الربط بين الملاحظة التجريبية والتفسير الفيزيوكيميائي", "Scientific Inquiry: Empirical evidence & biochemical reasoning")
                        : disciplineType === "history"
                          ? t("النقد التاريخي: التمييز بين المصادر الأولية والمراجع وتتبع الأثر", "Historical Analysis: Evidence provenance & primary source critique")
                          : disciplineType === "arabic"
                            ? t("التحليل البلاغي واللغوي: المعنى السياقي وتذوق التراكيب الأدبية", "Linguistic Inquiry: Contextual semantics & rhetorical structure")
                            : disciplineType === "philosophy"
                              ? t("التفكير الفلسفي: تشريح المقدمات وبناء الحجج العقلانية المستقلة", "Philosophical Inquiry: Examining premises & rational argumentation")
                              : disciplineType === "english"
                                ? t("إتقان التراكيب والسياق الإنجليزي: القواعد المتصلة، المتلازمات اللفظية، وتقنيات الترجمة", "English Mastery: Contextual grammar, lexical collocations, and precision translation")
                                : t("إرشادات المذاكرة الفعالة", "Effective Study Guidelines")}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.85, color: "var(--ink)" }}>
                  {t(
                    "ابدأ باستيعاب المفاهيم الأساسية في المرحلة ٢، ثم تدرّج خطوة بخطوة في المثال المحلول، واختتم بنقطة التحقق التفاعلية.",
                    "Start by exploring the structured concept cards in Stage 2, step through the worked examples, then verify your understanding in the multi-question checkpoint.",
                  )}
                </p>
              </div>

              {hasRealTrack && (
                <>
                  <PreLessonDiagnostic
                    lessonIdOrSlug={lessonSlug}
                    subjectKey={resolvedSubjectKey}
                    uiLocale={locale}
                    contentLocale={contentLanguage}
                    onJumpToStage2={(focus) => {
                      setDiagnosticFocus(focus ?? null);
                      setActiveStage(1);
                    }}
                  />

                  <div className="noata-ai-companion-bar" dir={locale === "en" ? "ltr" : "rtl"}>
                    <div style={{ display: "grid", gap: 3 }}>
                      <strong style={{ fontSize: 13.5, color: "var(--ink)" }}>
                        {t("رفيق المذاكرة الذكي Noäta AI", "Noäta AI Study Companion")}
                      </strong>
                      <small style={{ color: "var(--muted)" }}>
                        {t(
                          "ابدأ جلسة شرح أو اختبار فوري مصممة لدرس اليوم:",
                          "Jump straight into an interactive AI session tailored to this lesson:",
                        )}
                      </small>
                    </div>
                    <div className="noata-ai-companion-prompts">
                      {([
                        { action: "explain_simply" as const, label: t("اشرحلي ببساطة", "Explain Simply") },
                        { action: "exam_quiz" as const, label: t("اختبرني (٣ أسئلة)", "Exam Quiz (3 Qs)") },
                        { action: "common_pitfalls" as const, label: t("أخطاء الامتحان", "Common Pitfalls") },
                      ]).map((chip, idx) => (
                        <Link
                          key={chip.action}
                          href={buildAiHref(chip.action, trackSlug, lessonSlug, lessonTitle)}
                          className="btn btn-secondary"
                          style={{ fontSize: 12, padding: "6px 12px" }}
                        >
                          <Icon name="sparkles" size={13} />
                          <span>{chip.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* STAGE 1: Core Concept Deep Dive */}
          {activeStage === 1 && (
            <>
              <div className="noata-stage-header">
                <div className="noata-stage-header-title">
                  <span className="noata-stage-icon-circle">
                    <Icon name="sparkles" size={20} />
                  </span>
                  <div>
                    <h2>{t("الشرح المفاهيمي والتفكيك المنطقي", "Core Concept & Conceptual Deep Dive")}</h2>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      {t("استيعاب جوهر الفكرة بدون حفظ سطحي.", "Deep conceptual understanding beyond superficial memorization.")}
                    </p>
                  </div>
                </div>
              </div>

              {diagnosticFocus && (
                <div className="noata-lab-alert noata-diag-focus-banner" role="status">
                  <Icon name="target" size={16} />
                  <span>
                    {t(
                      `نوصي بالبدء هنا بناءً على تشخيص المرحلة ١: ${diagnosticFocus}`,
                      `Recommended focus from your Stage 1 diagnostic: ${diagnosticFocus}`,
                    )}
                  </span>
                </div>
              )}

              {!(hasRealTrack && companion.keyConcepts.length > 0) ? (
                <article style={{ fontSize: 16, lineHeight: 1.95, color: "var(--ink)" }} dir={contentDir}>
                  {summary ? (
                    summary.split("\n\n").map((para, i) => (
                      <div key={i} style={{ margin: "0 0 14px" }}>
                        <StudyRichText content={para} dir={contentDir} locale={contentLanguage} />
                      </div>
                    ))
                  ) : (
                    <p>{t("محتوى الدرس غير منشور في المصدر المتصل.", "Lesson content is not published in the connected source.")}</p>
                  )}
                </article>
              ) : null}

              {hasRealTrack && companion.keyConcepts.length > 0 && (
                <div className="noata-study-sections" dir={contentDir}>
                  <h3 style={{ margin: "6px 0 0", fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>
                    {t(
                      "بطاقات المفاهيم التفصيلية · دليل أولى ثانوي",
                      "Structured Concept Breakdown · Sec. 1 Study Pack",
                    )}
                  </h3>
                  {companion.keyConcepts.map((concept) => {
                    const hasBlocks = Array.isArray(concept.blocks) && concept.blocks.length > 0;
                    const stageLabel =
                      concept.stage === "foundation"
                        ? t("التمهيد", "Foundation")
                        : concept.stage === "mechanism"
                          ? t("التفكيك", "Mechanism")
                          : concept.stage === "application"
                            ? t("التطبيق", "Application")
                            : null;
                    return (
                      <div key={concept.id} className="noata-concept-card" data-concept-id={concept.id}>
                        <div className="noata-concept-card-head">
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            {stageLabel ? (
                              <span className="noata-concept-stage-pill" data-stage={concept.stage}>
                                {stageLabel}
                              </span>
                            ) : null}
                            <h3 dir={contentDir}>
                              <StudyRichText content={concept.title} dir={contentDir} locale={contentLanguage} inline />
                            </h3>
                          </div>
                          <Link
                            href={buildAiHref("concept_clarify", trackSlug, lessonSlug, concept.title)}
                            className="btn btn-secondary"
                            style={{ fontSize: 11.5, padding: "4px 10px" }}
                          >
                            <Icon name="sparkles" size={12} />
                            <span>{t("استفسر من AI", "Ask AI")}</span>
                          </Link>
                        </div>
                        {hasBlocks ? (
                          <StudyRichText
                            blocks={concept.blocks}
                            dir={contentDir}
                            locale={contentLanguage}
                          />
                        ) : (
                          <>
                            <div style={{ lineHeight: 1.85, color: "var(--ink)" }}>
                              <StudyRichText content={concept.body} dir={contentDir} locale={contentLanguage} />
                            </div>
                            {concept.formulaOrRule && (
                              <div className="noata-concept-formula">
                                <StudyRichText content={concept.formulaOrRule} dir={contentDir} locale={contentLanguage} />
                              </div>
                            )}
                            {concept.example && (
                              <div className="noata-concept-example">
                                <strong style={{ color: "var(--ink)" }}>
                                  {t("مثال تطبيقي: ", "Example: ")}
                                </strong>
                                <StudyRichText content={concept.example} dir={contentDir} locale={contentLanguage} />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <SubjectLabRouter
                lessonIdOrSlug={lessonSlug}
                lessonTitle={[lesson.title_ar, lesson.title_en].filter(Boolean).join(" ")}
                subjectKey={resolvedSubjectKey}
                uiLocale={locale}
                contentLocale={contentLanguage}
              />

              {translationNote && (
                <div style={{ padding: 14, borderRadius: 12, background: "var(--surface-soft)", border: "1px solid var(--line)", fontSize: 13, color: "var(--muted)" }} dir={contentDir}>
                  <strong>{t("ملاحظة ترجمة معتمدة:", "Curriculum Translation Note:")}</strong>{" "}
                  <StudyRichText content={translationNote} dir={contentDir} locale={contentLanguage} inline />
                </div>
              )}
            </>
          )}

          {/* STAGE 2: Worked Application & Interactive Steppers */}
          {activeStage === 2 && (
            <>
              <div className="noata-stage-header">
                <div className="noata-stage-header-title">
                  <span className="noata-stage-icon-circle">
                    <Icon name="check" size={20} />
                  </span>
                  <div>
                    <h2>{t("التطبيق العملي والمثال المحلول", "Worked Example & Guided Application")}</h2>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      {t("تدرّج في كشف خطوات الحل لاختبار تفكيرك قبل رؤية النتيجة.", "Reveal solution steps progressively to test your reasoning.")}
                    </p>
                  </div>
                </div>
              </div>

              {(() => {
                const normCmp = (s: string) => s.replace(/[\s$]+/g, "").toLowerCase();
                const workedNorm = normCmp(worked);
                const workedDuplicatesCompanion =
                  Boolean(workedNorm) &&
                  hasRealTrack &&
                  companion.workedExamples.some((ex) => {
                    const exCombined = normCmp([ex.problem, ...ex.steps].join(" "));
                    const probNorm = normCmp(ex.problem);
                    return (
                      exCombined === workedNorm ||
                      (probNorm.length >= 16 && workedNorm.includes(probNorm)) ||
                      (workedNorm.length >= 20 && exCombined.includes(workedNorm))
                    );
                  });

                return worked && !workedDuplicatesCompanion ? (
                  <div className={`noata-discipline-panel ${disciplineType}`}>
                    <div className="noata-discipline-badge">
                      <Icon name="check" size={14} />
                      <span>{t("نموذج حل تطبيقي تفصيلي", "Detailed Guided Model Solution")}</span>
                    </div>
                    <div style={{ fontSize: 15.5, lineHeight: 1.9, color: "var(--ink)" }} dir={contentDir}>
                      {worked.split("\n\n").map((chunk, i) => (
                        <div key={i} style={{ margin: "0 0 12px" }}>
                          <StudyRichText content={chunk} dir={contentDir} locale={contentLanguage} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {hasRealTrack && companion.workedExamples.length > 0 ? (
                <div className="noata-study-sections" dir={contentDir}>
                  {companion.workedExamples.map((example, exIdx) => {
                    const revealed = revealedStepsByExample[exIdx] ?? 1;
                    const showingCount = Math.min(Math.max(1, revealed), example.steps.length);
                    return (
                      <div key={exIdx} className="noata-worked-stepper">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                          <div>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase" }}>
                              {t(
                                `مثال تطبيقي متدرج ${exIdx + 1}`,
                                `Interactive Worked Example ${exIdx + 1}`,
                              )}
                            </span>
                            <div style={{ fontWeight: 700, fontSize: 15.5, marginTop: 4, color: "var(--ink)" }}>
                              <StudyRichText content={example.problem} dir={contentDir} locale={contentLanguage} />
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {showingCount > 1 && (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ fontSize: 12, padding: "4px 10px" }}
                                onClick={() =>
                                  setRevealedStepsByExample((prev) => ({ ...prev, [exIdx]: 1 }))
                                }
                              >
                                {t("وضع خطوة بخطوة", "Step-by-step")}
                              </button>
                            )}
                            {showingCount < example.steps.length && (
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ fontSize: 12, padding: "4px 12px" }}
                                onClick={() =>
                                  setRevealedStepsByExample((prev) => ({
                                    ...prev,
                                    [exIdx]: showingCount + 1,
                                  }))
                                }
                              >
                                {t("أظهر الخطوة التالية", "Reveal Next Step")}
                              </button>
                            )}
                          </div>
                        </div>

                        <ol className="noata-worked-step-list">
                          {example.steps.slice(0, showingCount).map((stepText, stepIdx) => (
                            <li key={stepIdx} className="noata-worked-step-item">
                              <span className="noata-worked-step-index">{stepIdx + 1}</span>
                              <div style={{ flex: 1 }}>
                                <StudyRichText content={stepText} dir={contentDir} locale={contentLanguage} />
                              </div>
                            </li>
                          ))}
                        </ol>

                        <div className="noata-concept-formula">
                          <strong style={{ marginInlineEnd: 6 }}>
                            {t("القاعدة المستخلصة:", "Key Takeaway:")}
                          </strong>
                          <StudyRichText content={example.takeaway} dir={contentDir} locale={contentLanguage} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : !worked ? (
                <p style={{ color: "var(--muted)", padding: 24, textAlign: "center" }}>
                  {t("لا يوجد مثال محلول إضافي لهذا الدرس؛ انتقل إلى مرحلة حراسة المفاهيم أو ابدأ المهمة.", "No additional worked example record for this lesson; proceed to misconception check or launch the mission.")}
                </p>
              ) : null}
            </>
          )}

          {/* STAGE 3: Misconception Guard */}
          {activeStage === 3 && (
            <>
              <div className="noata-stage-header">
                <div className="noata-stage-header-title">
                  <span className="noata-stage-icon-circle" style={{ color: "var(--warning)", background: "color-mix(in srgb, var(--warning) 14%, var(--surface))" }}>
                    <Icon name="lock" size={20} />
                  </span>
                  <div>
                    <h2>{t("حراسة المفاهيم والأخطاء الشائعة", "Misconception Guard & Traps to Avoid")}</h2>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      {t("أشهر الخلط والمغالطات التي يقع فيها الطلاب في هذا الدرس وطريقة تجنبها.", "Common pitfalls and mistaken assumptions students frequently make.")}
                    </p>
                  </div>
                </div>
              </div>

              {mistakes.length > 0 ? (
                <div className="noata-misconceptions-card">
                  {mistakes.map((mistake, idx) => (
                    <div key={idx} className="noata-misconception-item" dir={contentDir}>
                      <span style={{ color: "var(--warning)", fontWeight: 800 }}>⚠️</span>
                      <StudyRichText content={mistake} dir={contentDir} locale={contentLanguage} />
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--muted)", padding: 24, textAlign: "center" }}>
                  {t("لم يتم تسجيل مغالطات خاصة لهذا الدرس. انتبه للتعريفات الأساسية.", "No specific misconceptions registered. Pay careful attention to core definitions.")}
                </p>
              )}
            </>
          )}

          {/* STAGE 4: Interactive Multi-Question Checkpoint & Retrieval Launch */}
          {activeStage === 4 && (
            <>
              <div className="noata-stage-header">
                <div className="noata-stage-header-title">
                  <span className="noata-stage-icon-circle" style={{ color: "var(--accent)" }}>
                    <Icon name="arrow-end" size={20} />
                  </span>
                  <div>
                    <h2>{t("نقطة التحقق التفاعلية والانطلاق للمهمة", "Multi-Question Checkpoint & Mission Launch")}</h2>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                      {t("اختبر فهمك عبر أسئلة مصححة فعلياً قبل بدء المهمة الرسمية.", "Test your grasp with verified answer grading before starting the formal mission.")}
                    </p>
                  </div>
                </div>
              </div>

              {activeQuestion ? (
                <div className="noata-checkpoint-box">
                  <div className="noata-practice-progress">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 13, color: "var(--ink)" }}>
                        {t("السؤال", "Question")} {safePracticeIndex + 1} / {practicePool.length}
                      </strong>
                      {activeQuestion.difficulty && (
                        <span className="noata-lesson-metric-chip" style={{ fontSize: 11.5 }}>
                          {activeQuestion.difficulty}
                        </span>
                      )}
                      {completedPracticeCount > 0 && (
                        <span className="noata-lesson-metric-chip is-completed" style={{ fontSize: 11.5 }}>
                          {correctPracticeCount}/{completedPracticeCount} {t("صحيح", "correct")}
                        </span>
                      )}
                    </div>

                    <div className="noata-practice-pills" role="tablist" aria-label={t("أسئلة التحقق", "Checkpoint questions")}>
                      {practicePool.map((qItem, qIdx) => {
                        const qState = answerStates[qIdx];
                        const stateClass = qState?.submitted
                          ? qState.correct
                            ? "is-correct"
                            : "is-wrong"
                          : "";
                        return (
                          <button
                            key={qItem.id}
                            type="button"
                            role="tab"
                            aria-selected={qIdx === safePracticeIndex}
                            aria-label={t(`السؤال ${qIdx + 1}`, `Question ${qIdx + 1}`)}
                            className={`noata-practice-pill ${qIdx === safePracticeIndex ? "is-active" : ""} ${stateClass}`}
                            onClick={() => {
                              setPracticeIndex(qIdx);
                              setHintVisible(false);
                            }}
                          >
                            {qIdx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <h3 style={{ margin: 0, fontSize: 17, lineHeight: 1.65 }} dir={contentDir}>
                    <StudyRichText content={activeQuestion.prompt} />
                  </h3>

                  {activeQuestion.choices.length > 0 ? (
                    <ChoiceCardGroup
                      legend={t("خيارات نقطة التحقق", "Checkpoint options")}
                      options={activeQuestion.choices}
                      value={activeAnswerState.selected}
                      contentDir={contentDir}
                      disabled={Boolean(activeAnswerState.grading)}
                      onChange={(val) => {
                        setAnswerStates((prev) => ({
                          ...prev,
                          [safePracticeIndex]: {
                            selected: val,
                            submitted: false,
                            correct: null,
                            feedback: "",
                          },
                        }));
                      }}
                    />
                  ) : (
                    <input
                      className="input"
                      dir={contentDir}
                      value={activeAnswerState.selected}
                      placeholder={t("اكتب إجابتك هنا...", "Type your answer...")}
                      onChange={(e) =>
                        setAnswerStates((prev) => ({
                          ...prev,
                          [safePracticeIndex]: {
                            selected: e.target.value,
                            submitted: false,
                            correct: null,
                            feedback: "",
                          },
                        }))
                      }
                    />
                  )}

                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={!activeAnswerState.selected.trim() || Boolean(activeAnswerState.grading)}
                      onClick={() => void handleCheckPracticeAnswer(safePracticeIndex)}
                    >
                      <Icon name="check" size={15} />
                      <span>
                        {activeAnswerState.grading
                          ? t("جاري التصحيح...", "Checking...")
                          : t("تحقق من الإجابة", "Check Answer")}
                      </span>
                    </button>

                    {activeQuestion.hint && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setHintVisible((v) => !v)}
                      >
                        <span>{hintVisible ? t("إخفاء التلميح", "Hide Hint") : t("تلميح مساعد", "Show Hint")}</span>
                      </button>
                    )}

                    {safePracticeIndex < practicePool.length - 1 && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setPracticeIndex((i) => Math.min(practicePool.length - 1, i + 1));
                          setHintVisible(false);
                        }}
                      >
                        <span>{t("السؤال التالي ←", "Next Question →")}</span>
                      </button>
                    )}
                  </div>

                  {hintVisible && activeQuestion.hint && (
                    <div
                      dir={contentDir}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 12,
                        background: "var(--surface-soft)",
                        border: "1px solid var(--line)",
                        fontSize: 13.5,
                        color: "var(--muted)",
                      }}
                    >
                      <strong>{t("تلميح:", "Hint:")}</strong>{" "}
                      <StudyRichText
                        content={activeQuestion.hint}
                        dir={contentDir}
                        locale={contentLanguage}
                        inline
                      />
                    </div>
                  )}

                  {activeAnswerState.error && (
                    <div className="noata-retry-banner" role="alert">
                      <span>{activeAnswerState.error}</span>
                      {!account.user && (
                        <Link href="/login" className="btn btn-secondary" style={{ fontSize: 12 }}>
                          {t("تسجيل الدخول", "Sign in")}
                        </Link>
                      )}
                    </div>
                  )}

                  {activeAnswerState.submitted && (
                    <div
                      className={`noata-checkpoint-feedback ${activeAnswerState.correct ? "is-correct" : "is-wrong"}`}
                      dir={contentDir}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                        <div>
                          <strong>
                            {activeAnswerState.correct
                              ? t("إجابة صحيحة وموثّقة!", "Correct & Verified!")
                              : t("إجابة تحتاج مراجعة — لاحظ السبب:", "Not quite — review why:")}
                          </strong>
                          {activeAnswerState.feedback && (
                            <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.7 }}>
                              <StudyRichText content={activeAnswerState.feedback} />
                            </p>
                          )}
                        </div>
                        <Link
                          href={buildAiHref(
                            activeAnswerState.correct ? "concept_clarify" : "mistake_repair",
                            trackSlug,
                            lessonSlug,
                            lessonTitle,
                          )}
                          className="btn btn-secondary"
                          style={{ fontSize: 12, padding: "6px 12px" }}
                        >
                          <Icon name="sparkles" size={13} />
                          <span>{t("ناقش الحل مع AI", "Discuss with AI")}</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {practicePool.length > 0 && completedPracticeCount >= practicePool.length ? (() => {
                const checkpointPct = Math.round(
                  (correctPracticeCount / Math.max(1, practicePool.length)) * 100,
                );
                const summary = computeLessonAchievementSummary({
                  scorePct: checkpointPct,
                  xpReward: lesson.xp_reward ?? 0,
                  coinReward: lesson.coin_reward ?? 0,
                  verifiedGems: checkpointPct === 100 ? 8 : checkpointPct >= 90 ? 5 : 0,
                  isPreview: true,
                });
                return (
                  <AchievementCelebration
                    kind="lesson"
                    locale={locale}
                    compact
                    rankLabel={summary.rank}
                    badgeText={t("إتمام نقطة التحقق التفاعلية", "Lesson Checkpoint Cleared")}
                    title={t(summary.titleAr, summary.titleEn)}
                    subtitle={t(
                      `أكملت جميع أسئلة التحقق (${correctPracticeCount}/${practicePool.length}). انتقل الآن للمهمة الرسمية لتثبيت الجواهر والعملات في رصيدك.`,
                      `Completed all checkpoint items (${correctPracticeCount}/${practicePool.length}). Launch the official mission to claim your XP, coins, and gems.`,
                    )}
                    scorePct={checkpointPct}
                    xpReward={summary.xpReward}
                    coinReward={summary.coinReward}
                    gemReward={summary.verifiedGems}
                    highlightNote={t(summary.gemNoteAr, summary.gemNoteEn)}
                    actions={
                      <>
                        <Link
                          href={`/missions?lesson=${encodeURIComponent(lesson.id)}${trackSlug ? `&track=${encodeURIComponent(trackSlug)}` : ""}`}
                          className="btn btn-primary"
                        >
                          {t("حصّل الجواهر والمهمة الرسمية ←", "Claim Rewards in Official Mission →")}
                        </Link>
                        <Link href={`${studyHrefBase}&mode=flashcards`} className="btn btn-secondary">
                          {t("احفظ كبطاقات مراجعة", "Save as Flashcards")}
                        </Link>
                      </>
                    }
                  />
                );
              })() : null}

              {/* Launch Banner */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "20px 24px", borderRadius: 20, background: "var(--accent-soft)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)", flexWrap: "wrap" }}>
                <div>
                  <strong style={{ fontSize: 16, display: "block", color: "var(--ink)", marginBottom: 4 }}>
                    {t("جاهز للمهمة التعليمية الرسمية؟", "Ready for the Official Learning Mission?")}
                  </strong>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                    {t(
                      `تشمل ${Math.max(questionCount, 5)} أسئلة متدرجة وتُسجل نقاط XP وتقدّمك الرسمي في الدرس.`,
                      `Includes ${Math.max(questionCount, 5)} progressive questions and awards official XP and lesson mastery.`,
                    )}
                  </p>
                </div>

                <Link
                  href={`/missions?lesson=${encodeURIComponent(lesson.id)}${trackSlug ? `&track=${encodeURIComponent(trackSlug)}` : ""}`}
                  className="btn btn-primary"
                  style={{ background: "var(--accent)", color: "var(--on-accent, #ffffff)", minHeight: 46, paddingInline: 24, fontSize: 14 }}
                >
                  {t("ابدأ المهمة التعليمية ←", "Start Mission →")}
                </Link>
              </div>
            </>
          )}

          {/* Stage Footer Step Navigation */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              paddingTop: 14,
              borderTop: "1px solid var(--line)",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              disabled={activeStage === 0}
              onClick={() => setActiveStage((s) => Math.max(0, s - 1))}
            >
              <span>{t("المرحلة السابقة", "Previous Stage")}</span>
            </button>
            <span style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600 }}>
              {t("المرحلة", "Stage")} {activeStage + 1} / {STAGES.length}
            </span>
            {activeStage < STAGES.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setActiveStage((s) => Math.min(STAGES.length - 1, s + 1))}
              >
                <span>{t("المرحلة التالية", "Next Stage")}</span>
                <Icon name="arrow-end" size={14} />
              </button>
            ) : (
              <Link
                className="btn btn-primary"
                href={`/missions?lesson=${encodeURIComponent(lesson.id)}${trackSlug ? `&track=${encodeURIComponent(trackSlug)}` : ""}`}
              >
                <span>{t("انطلق للمهمة", "Launch Mission")}</span>
                <Icon name="arrow-end" size={14} />
              </Link>
            )}
          </div>
        </section>
      </div>

      {/* 5. Action Dock */}
      <footer className="noata-lesson-action-dock" data-tour="lesson-actions">
        <div>
          <strong style={{ fontSize: 14, display: "block", color: "var(--ink)" }}>
            {t("أدوات الدعم الذكي والتكرار المتباعد", "Smart AI Tools & Spaced Review")}
          </strong>
          <small style={{ color: "var(--muted)" }}>
            {t("حوّل هذا الدرس لبطاقات استرجاع، أو استفسر من مساعد Noäta AI الذكي.", "Generate flashcards or consult Noäta AI for instant Socratic guidance.")}
          </small>
        </div>

        <div className="noata-lesson-action-dock-right">
          <Link
            className="btn btn-primary"
            href={`${studyHrefBase}&tab=generator`}
          >
            <Icon name="sparkles" size={16} />
            <span>{t("فتح حزمة المذاكرة الذكية", "Open Study Deck")}</span>
          </Link>

          <Link
            className="btn btn-secondary"
            href={`${studyHrefBase}&tab=review`}
          >
            <Icon name="review" size={16} />
            <span>{t("مراجعة تباعدية 3D", "3D Spaced Review")}</span>
          </Link>

          <Link
            className="btn btn-secondary"
            href={buildAiHref("explain_simply", trackSlug, lessonSlug, lessonTitle)}
          >
            <Icon name="sparkles" size={16} />
            <span>{t("استشر Noäta AI", "Ask Noäta AI")}</span>
          </Link>

          <Link
            className="btn btn-secondary"
            href={`/missions?lesson=${encodeURIComponent(lesson.id)}${trackSlug ? `&track=${encodeURIComponent(trackSlug)}` : ""}`}
          >
            <span>{t("المهمة التعليمية", "Launch Mission")}</span>
            <Icon name="arrow-end" size={16} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
