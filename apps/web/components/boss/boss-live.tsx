"use client";

import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { buildStructuredAiHandoffHref } from "@/lib/ai/handoff-contract";
import { ModuleWelcome } from "@/components/ui/module-welcome";
import { Icon } from "@/components/ui/icon";
import { StudyRichText } from "@/components/study/study-rich-text";
import {
  AchievementCelebration,
  computeExamAchievementSummary,
} from "@/components/ui/achievement-celebration";
import { useConfirmedMutation } from "@/lib/supabase/use-confirmed-mutation";
import { createClient } from "@/lib/supabase/client";
import { ChoiceCardGroup } from "@/components/ui/choice-card-group";
import {
  AttemptIdempotencyController,
  extractDistractorFeedback,
} from "@/lib/curriculum/attempt-guard";
import {
  resolveCurriculumText,
  type ContentLanguage,
} from "@/lib/curriculum/catalog";
import {
  evaluateLocalChoice,
  getSubjectQuestionBank,
} from "@/lib/curriculum/sec1-study-pack";
import {
  ACCOUNT_DRAFT_EPOCH,
  loadScopedStudyDraft,
  removeScopedStudyDraft,
  saveScopedStudyDraft,
} from "@/lib/study/draft-storage";

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
  boss_enabled?: boolean | null;
  metadata?: unknown;
};

type LessonMeta = {
  id: string;
  unit_id: string;
};

type BossQuestion = {
  id: string;
  source: "db" | "curated";
  isOfficialBoss: boolean;
  unit_id: string | null;
  variant_of: string | null;
  position: number | null;
  question_type: string;
  prompt_ar: string;
  prompt_en: string | null;
  choices_en: unknown;
  choices_ar: unknown;
  correct_index?: number;
  explanation?: string;
  hint?: string;
  difficulty?: string;
  metadata: unknown;
};

type Grade = {
  correct?: boolean;
  explanation_ar?: string;
  explanation_en?: string;
};

type BossResult = {
  score?: number;
  passed?: boolean;
  first_reward?: boolean;
  xp_reward?: number;
  coin_reward?: number;
  reward_box_id?: string | null;
};

type BoxResult = {
  reward?: { coins?: number; xp?: number; tier?: string };
  duplicate?: boolean;
};

const opts = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);

function isLocked(metadata: unknown): boolean {
  return Boolean(
    metadata &&
      typeof metadata === "object" &&
      "locked" in metadata &&
      (metadata as { locked?: boolean }).locked,
  );
}

export function BossLive() {
  const t = useTranslation();
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const { account, busy, status, run } = useConfirmedMutation();
  const attemptGuard = useRef(new AttemptIdempotencyController());
  const signedIn = account.loading ? null : Boolean(account.user);

  const [tracks, setTracks] = useState<TrackOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

  const [selectedTrack, setSelectedTrack] = useState<TrackOption | null>(null);
  const [unit, setUnit] = useState<UnitOption | null>(null);
  const [questions, setQuestions] = useState<BossQuestion[]>([]);
  const [contentLanguage, setContentLanguage] = useState<ContentLanguage>("ar");
  // Strict curriculum language: never override Arabic/English curriculum materials on UI locale switch
  const effectiveLang: ContentLanguage = contentLanguage;
  const contentDir: "ltr" | "rtl" = effectiveLang === "en" ? "ltr" : "rtl";

  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [hintVisible, setHintVisible] = useState(false);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [shields, setShields] = useState(3);
  const [firstTryCorrectIds, setFirstTryCorrectIds] = useState<Set<string>>(new Set());
  const [attemptedIds, setAttemptedIds] = useState<Set<string>>(new Set());
  const [missedPrompts, setMissedPrompts] = useState<string[]>([]);
  const [bossResult, setBossResult] = useState<BossResult | null>(null);
  const [localCompleted, setLocalCompleted] = useState(false);
  const [box, setBox] = useState<BoxResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingArena, setLoadingArena] = useState(false);
  const [reload, setReload] = useState(0);

  const loadArenaForUnit = useCallback(
    async (
      targetUnit: UnitOption,
      trackCtx: TrackOption,
      allLessons: LessonMeta[],
      isAlive: () => boolean,
    ) => {
      attemptGuard.current.resetAll();
      setQuestions([]);
      setAnswer("");
      setHintVisible(false);
      setGrade(null);
      setIdx(0);
      setShields(3);
      setFirstTryCorrectIds(new Set());
      setAttemptedIds(new Set());
      setMissedPrompts([]);
      setBossResult(null);
      setLocalCompleted(false);
      setBox(null);
      setError("");
      setLoadingArena(true);

      try {
        setUnit(targetUnit);
        setSelectedTrack(trackCtx);
        const lang = trackCtx.content_language;
        setContentLanguage(lang);

        const unitLessonIds = allLessons
          .filter((l) => l.unit_id === targetUnit.id)
          .map((l) => l.id);

        const [unitQRes, lessonQRes] = await Promise.all([
          supabase
            .from("questions")
            .select(
              "id,unit_id,variant_of,position,question_type,prompt_ar,prompt_en,choices_ar,choices_en,metadata",
            )
            .eq("unit_id", targetUnit.id)
            .in("publication_status", ["published_demo", "published"])
            .order("position")
            .limit(20),
          unitLessonIds.length
            ? supabase
                .from("questions")
                .select(
                  "id,unit_id,variant_of,position,question_type,prompt_ar,prompt_en,choices_ar,choices_en,metadata",
                )
                .in("lesson_id", unitLessonIds)
                .in("publication_status", ["published_demo", "published"])
                .order("position")
                .limit(20)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (!isAlive()) return;
        if (unitQRes.error) throw unitQRes.error;

        const isPrimary = (q: { variant_of: string | null; metadata: unknown }) => {
          const meta =
            q.metadata && typeof q.metadata === "object"
              ? (q.metadata as Record<string, unknown>)
              : {};
          const metadata = meta;
          return q.variant_of === null || metadata.translation_track === true;
        };

        const seenIds = new Set<string>();
        const seenPrompts = new Set<string>();
        const arenaQuestions: BossQuestion[] = [];

        // Prioritize the 3 official unit_id boss questions first so complete_unit_boss RPC succeeds cleanly
        const rawUnitRows = (unitQRes.data ?? []).filter(isPrimary);
        let bossCount = 0;
        for (const row of rawUnitRows) {
          const meta =
            row.metadata && typeof row.metadata === "object"
              ? (row.metadata as Record<string, unknown>)
              : {};
          const prompt = resolveCurriculumText(lang, row.prompt_ar, row.prompt_en).trim();
          if (!prompt || seenIds.has(row.id)) continue;
          const officialBoss = row.unit_id === targetUnit.id && meta.boss === true && bossCount < 3;
          if (officialBoss) bossCount += 1;
          seenIds.add(row.id);
          seenPrompts.add(prompt.toLowerCase());
          arenaQuestions.push({
            id: row.id,
            source: "db",
            isOfficialBoss: officialBoss,
            unit_id: row.unit_id,
            variant_of: row.variant_of,
            position: row.position,
            question_type: row.question_type,
            prompt_ar: row.prompt_ar,
            prompt_en: row.prompt_en,
            choices_ar: row.choices_ar,
            choices_en: row.choices_en,
            metadata: row.metadata,
          });
        }

        // Pull unit-lesson DB questions to expand challenge depth
        if (!lessonQRes.error && lessonQRes.data?.length) {
          for (const row of lessonQRes.data.filter(isPrimary)) {
            if (arenaQuestions.length >= 6) break;
            const prompt = resolveCurriculumText(lang, row.prompt_ar, row.prompt_en).trim();
            if (!prompt || seenIds.has(row.id) || seenPrompts.has(prompt.toLowerCase())) continue;
            seenIds.add(row.id);
            seenPrompts.add(prompt.toLowerCase());
            arenaQuestions.push({
              id: row.id,
              source: "db",
              isOfficialBoss: false,
              unit_id: row.unit_id,
              variant_of: row.variant_of,
              position: row.position,
              question_type: row.question_type,
              prompt_ar: row.prompt_ar,
              prompt_en: row.prompt_en,
              choices_ar: row.choices_ar,
              choices_en: row.choices_en,
              metadata: row.metadata,
            });
          }
        }

        // Supplement with curated Sec. 1 bank so challenge always covers 6-8 substantive items
        const bank = getSubjectQuestionBank(trackCtx.slug, lang);
        for (const q of bank) {
          if (arenaQuestions.length >= 8) break;
          const norm = q.prompt.trim().toLowerCase();
          if (seenPrompts.has(norm)) continue;
          seenPrompts.add(norm);
          arenaQuestions.push({
            id: `${trackCtx.slug}-boss-${q.id}`,
            source: "curated",
            isOfficialBoss: false,
            unit_id: targetUnit.id,
            variant_of: null,
            position: arenaQuestions.length + 1,
            question_type: "multiple-choice",
            prompt_ar: q.prompt,
            prompt_en: q.prompt,
            choices_ar: q.choices,
            choices_en: q.choices,
            correct_index: q.correct_index,
            explanation: q.explanation,
            hint: q.hint,
            difficulty: q.difficulty,
            metadata: { curated: true, difficulty: q.difficulty },
          });
        }

        setQuestions(arenaQuestions);
        if (typeof window !== "undefined" && arenaQuestions.length > 0) {
          const saved = loadScopedStudyDraft<{
            fingerprint: string;
            idx: number;
            answer: string;
            hintVisible: boolean;
            shields: number;
            firstTryCorrectIds: string[];
            attemptedIds: string[];
            missedPrompts: string[];
          }>(
            window.localStorage,
            account.user?.id ?? null,
            ACCOUNT_DRAFT_EPOCH,
            `boss_${targetUnit.id}`,
          );
          if (saved && saved.fingerprint === arenaQuestions.map((q) => q.id).join(",")) {
            setIdx(Math.min(Math.max(0, saved.idx ?? 0), Math.max(0, arenaQuestions.length - 1)));
            setAnswer(saved.answer ?? "");
            setHintVisible(Boolean(saved.hintVisible));
            if (typeof saved.shields === "number") setShields(Math.max(0, Math.min(3, saved.shields)));
            if (Array.isArray(saved.firstTryCorrectIds)) {
              setFirstTryCorrectIds(new Set(saved.firstTryCorrectIds));
            }
            if (Array.isArray(saved.attemptedIds)) {
              setAttemptedIds(new Set(saved.attemptedIds));
            }
            if (Array.isArray(saved.missedPrompts)) {
              setMissedPrompts(saved.missedPrompts);
            }
          }
        }
      } catch {
        if (isAlive()) {
          setError(
            t(
              "تعذّر تحميل أسئلة تحدّي الوحدة. حاول مرة أخرى.",
              "Could not load unit challenge questions. Please try again.",
            ),
          );
        }
      } finally {
        if (isAlive()) setLoadingArena(false);
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
        const requestedTrackSlug = searchParams.get("track")?.trim();
        const requestedUnitId = searchParams.get("unit")?.trim();

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
        if (tracksRes.error) throw tracksRes.error;
        const trackList = (tracksRes.data ?? []) as TrackOption[];
        setTracks(trackList);
        if (!trackList.length) return;

        if (!progressRes.error && progressRes.data) {
          setCompletedLessonIds(
            new Set(progressRes.data.filter((p) => Boolean(p.completed_at)).map((p) => p.lesson_id)),
          );
        }

        const courseIds = trackList
          .map((tr) => tr.course_id)
          .filter((cid): cid is string => Boolean(cid));
        const unitsRes = courseIds.length
          ? await supabase
              .from("units")
              .select("id,course_id,position,title_ar,title_en,boss_enabled,metadata")
              .in("course_id", courseIds)
              .order("position")
          : { data: [], error: null };
        if (!active) return;
        if (unitsRes.error) throw unitsRes.error;
        const unitList = (unitsRes.data ?? []) as UnitOption[];
        setUnits(unitList);

        const allUnitIds = unitList.map((u) => u.id);
        const lessonsRes = allUnitIds.length
          ? await supabase.from("lessons").select("id,unit_id").in("unit_id", allUnitIds)
          : { data: [], error: null };
        if (!active) return;
        const lessonMetaList = !lessonsRes.error && lessonsRes.data ? (lessonsRes.data as LessonMeta[]) : [];
        setLessons(lessonMetaList);

        const initialUnitFromParam = requestedUnitId
          ? unitList.find((u) => u.id === requestedUnitId)
          : undefined;
        const initialTrack =
          (initialUnitFromParam?.course_id
            ? trackList.find((tr) => tr.course_id === initialUnitFromParam.course_id)
            : undefined) ??
          (requestedTrackSlug
            ? trackList.find((tr) => tr.slug === requestedTrackSlug)
            : undefined) ??
          (enrollRes.data?.track_id
            ? trackList.find((tr) => tr.id === enrollRes.data!.track_id)
            : undefined) ??
          trackList[0];

        const trackUnits = unitList.filter(
          (u) => u.course_id === initialTrack.course_id && !isLocked(u.metadata),
        );
        const chosenUnit =
          initialUnitFromParam ??
          trackUnits.find((u) => u.boss_enabled !== false) ??
          trackUnits[0] ??
          null;

        if (chosenUnit) {
          await loadArenaForUnit(chosenUnit, initialTrack, lessonMetaList, isAlive);
        } else {
          setSelectedTrack(initialTrack);
          setContentLanguage(initialTrack.content_language);
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
  }, [supabase, reload, account.user, account.loading, loadArenaForUnit, t]);

  const trackUnits = useMemo(
    () =>
      selectedTrack
        ? units.filter((u) => u.course_id === selectedTrack.course_id && !isLocked(u.metadata))
        : [],
    [selectedTrack, units],
  );

  const unitLessonRows = useMemo(
    () => (unit ? lessons.filter((l) => l.unit_id === unit.id) : []),
    [lessons, unit],
  );
  const completedInUnit = unitLessonRows.filter((l) => completedLessonIds.has(l.id)).length;
  const readinessPct = unitLessonRows.length
    ? Math.round((completedInUnit / unitLessonRows.length) * 100)
    : 100;

  const current = questions[idx];
  const currentPrompt = current
    ? resolveCurriculumText(effectiveLang, current.prompt_ar, current.prompt_en)
    : "";
  const currentChoices = current
    ? opts(
        effectiveLang === "en"
          ? opts(current.choices_en).length
            ? current.choices_en
            : current.choices_ar
          : opts(current.choices_ar).length
            ? current.choices_ar
            : current.choices_en,
      )
    : [];

  async function selectTrack(nextTrack: TrackOption) {
    const nextUnits = units.filter(
      (u) => u.course_id === nextTrack.course_id && !isLocked(u.metadata),
    );
    const chosenUnit =
      nextUnits.find((u) => u.boss_enabled !== false) ?? nextUnits[0] ?? null;
    if (chosenUnit) {
      await loadArenaForUnit(chosenUnit, nextTrack, lessons, () => true);
    } else {
      setSelectedTrack(nextTrack);
      setContentLanguage(nextTrack.content_language);
      setUnit(null);
      setQuestions([]);
    }
  }

  async function selectUnit(nextUnit: UnitOption) {
    if (!selectedTrack) return;
    await loadArenaForUnit(nextUnit, selectedTrack, lessons, () => true);
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!current || !answer.trim() || busy || attemptGuard.current.isBusy()) return;

    const firstAttempt = !attemptedIds.has(current.id);

    if (current.source === "curated") {
      const selectedIdx = Number(answer);
      const chosenText =
        currentChoices.length > 0 &&
        Number.isInteger(selectedIdx) &&
        currentChoices[selectedIdx] !== undefined
          ? currentChoices[selectedIdx]
          : answer;
      const evaluated = evaluateLocalChoice({
        selectedChoice: chosenText,
        choices: currentChoices,
        correctIndex: current.correct_index,
      });
      const correct = evaluated?.correct === true;
      const nextAttempted = new Set(attemptedIds);
      nextAttempted.add(current.id);
      setAttemptedIds(nextAttempted);

      if (firstAttempt) {
        if (correct) {
          setFirstTryCorrectIds((prev) => new Set(prev).add(current.id));
        } else {
          setShields((s) => Math.max(0, s - 1));
          setMissedPrompts((prev) => [...prev, currentPrompt]);
        }
      }

      setGrade({
        correct,
        explanation_ar: current.explanation ?? "",
        explanation_en: current.explanation ?? "",
      });
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

        const nextAttempted = new Set(attemptedIds);
        nextAttempted.add(current.id);
        setAttemptedIds(nextAttempted);

        if (firstAttempt) {
          if (result.correct) {
            setFirstTryCorrectIds((prev) => new Set(prev).add(current.id));
          } else {
            setShields((s) => Math.max(0, s - 1));
            setMissedPrompts((prev) => [...prev, currentPrompt]);
          }
        }
        setGrade(result);
      }, "");
    });
  }

  async function advance() {
    if (!current || !grade || busy || attemptGuard.current.isBusy()) return;
    await attemptGuard.current.runExclusive(async () => {
      await run(async (check) => {
        if (!grade.correct) {
          // Only swap non-official-boss DB questions to variants so the 3 official boss UUIDs stay exact for RPC verification
          if (current.source === "db" && !current.isOfficialBoss) {
            const { data: variant, error: variantError } = await supabase
              .from("questions")
              .select(
                "id,unit_id,variant_of,position,question_type,prompt_ar,prompt_en,choices_ar,choices_en,metadata",
              )
              .eq("variant_of", current.id)
              .in("publication_status", ["published_demo", "published"])
              .limit(1)
              .maybeSingle();
            check();
            if (variantError) throw variantError;
            if (variant) {
              setQuestions((list) =>
                list.map((q, i) =>
                  i === idx
                    ? {
                        ...(variant as Omit<BossQuestion, "source" | "isOfficialBoss">),
                        source: "db",
                        isOfficialBoss: false,
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
          return;
        }

        if (idx < questions.length - 1) {
          setIdx((x) => x + 1);
          setAnswer("");
          setHintVisible(false);
          setGrade(null);
          return;
        }

        if (!unit) return;
        const officialBossIds = questions
          .filter((q) => q.source === "db" && q.isOfficialBoss)
          .map((q) => q.id)
          .slice(0, 3);

        if (
          officialBossIds.length === 3 &&
          !attemptGuard.current.hasCompleted("complete_unit_boss", unit.id)
        ) {
          const { data, error: rpcError } = await supabase.rpc("complete_unit_boss", {
            p_unit_id: unit.id,
            p_question_ids: officialBossIds,
          });
          check();
          if (rpcError) throw rpcError;
          if (typeof (data as BossResult | null)?.passed !== "boolean") {
            throw Error("Missing confirmed boss result");
          }
          attemptGuard.current.markCompleted("complete_unit_boss", unit.id);
          setBossResult(data as BossResult);
        } else {
          setLocalCompleted(true);
        }
        if (typeof window !== "undefined" && unit?.id) {
          removeScopedStudyDraft(
            window.localStorage,
            account.user?.id ?? null,
            ACCOUNT_DRAFT_EPOCH,
            `boss_${unit.id}`,
          );
        }
      }, "");
    });
  }

  useEffect(() => {
    if (
      loadingArena ||
      bossResult ||
      localCompleted ||
      !unit?.id ||
      !questions.length ||
      typeof window === "undefined"
    ) {
      return;
    }
    if (idx === 0 && !answer.trim() && attemptedIds.size === 0 && !hintVisible) return;
    saveScopedStudyDraft(
      window.localStorage,
      account.user?.id ?? null,
      ACCOUNT_DRAFT_EPOCH,
      `boss_${unit.id}`,
      {
        fingerprint: questions.map((q) => q.id).join(","),
        idx,
        answer,
        hintVisible,
        shields,
        firstTryCorrectIds: Array.from(firstTryCorrectIds),
        attemptedIds: Array.from(attemptedIds),
        missedPrompts,
      },
    );
  }, [
    account.revision,
    account.user?.id,
    answer,
    attemptedIds,
    bossResult,
    firstTryCorrectIds,
    hintVisible,
    idx,
    loadingArena,
    localCompleted,
    missedPrompts,
    questions,
    shields,
    unit?.id,
  ]);

  async function openBox() {
    if (!bossResult?.reward_box_id || busy || attemptGuard.current.isBusy()) return;
    const boxId = bossResult.reward_box_id;
    if (attemptGuard.current.hasCompleted("claim_reward_box", boxId)) return;
    await attemptGuard.current.runExclusive(async () => {
      await run(async (check) => {
        setError("");
        const { data, error: boxError } = await supabase.rpc("claim_reward_box", {
          p_box_id: boxId,
        });
        check();
        if (boxError) throw boxError;
        if (!data) throw Error("Missing reward result");
        attemptGuard.current.markCompleted("claim_reward_box", boxId);
        setBox(data as BoxResult);
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
        <h2>{t("جارٍ تجهيز مساحتك…", "Preparing your space…")}</h2>
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
        title={t("اجمع كل ما تعلّمته.", "Bring your learning together.")}
        description={t(
          "تحدّي الوحدة يربط مهارات الوحدة كاملة في مواجهة تشخيصية من ٦–٨ أسئلة متدرجة بدلاً من ٣ أسئلة فقط.",
          "Unit Challenge tests your mastery across an entire unit with a 6–8 question diagnostic gauntlet.",
        )}
        icon="boss"
        route="/boss"
        eyebrow={t("تحدّي الوحدة الشامل", "Unit Challenge Arena")}
        steps={[
          t("اختر المسار والوحدة ومقياس جاهزيتك", "Select your track & check readiness"),
          t("خض اختبار الوحدة المتكامل مع نظام الدروع", "Tackle the multi-stage gauntlet"),
          t("احصل على تحليل تشخيصي ومكافآتك", "Unlock diagnostic results & rewards"),
        ]}
      />
    );
  }

  if (bossResult || localCompleted) {
    const totalQuestions = Math.max(1, questions.length);
    const totalFirstTry = firstTryCorrectIds.size;
    const accuracyPct = Math.round((totalFirstTry / totalQuestions) * 100);
    const passed = bossResult ? Boolean(bossResult.passed) : accuracyPct >= 60;
    const summary = computeExamAchievementSummary({
      passed,
      scorePct: accuracyPct,
      correctCount: totalFirstTry,
      totalQuestions,
      shieldsLeft: shields,
      xpReward: bossResult?.xp_reward ?? 0,
      coinReward: bossResult?.coin_reward ?? 0,
      hasServerBox: Boolean(bossResult?.reward_box_id),
      boxOpened: Boolean(box),
      boxTier: box?.reward?.tier,
      boxCoins: box?.reward?.coins,
      boxXp: box?.reward?.xp,
    });

    return (
      <AchievementCelebration
        kind="exam"
        locale={locale}
        rankLabel={summary.rank}
        badgeText={t("التقرير التشخيصي لتحدّي الوحدة", "Unit Challenge Diagnostic Report")}
        title={t(summary.titleAr, summary.titleEn)}
        subtitle={
          bossResult
            ? t(
                `حصلت على ${bossResult.score ?? 0}/3 في الأسئلة الموثّقة وبنسبة إتقان إجمالية ${accuracyPct}% عبر ${totalQuestions} أسئلة (${shields}/3 دروع متبقية).`,
                `Verified Boss Core: ${bossResult.score ?? 0}/3 · Overall Arena Accuracy: ${accuracyPct}% across ${totalQuestions} questions (${shields}/3 shields left).`,
              )
            : t(summary.subtitleAr, summary.subtitleEn)
        }
        scorePct={accuracyPct}
        xpReward={passed ? summary.xpReward : 0}
        coinReward={passed ? summary.coinReward : 0}
        highlightNote={
          passed
            ? t(
                `أنهيت الامتحان مع ${shields} من 3 دروع حماية — كل درع متبقٍ يؤكد ثبات فهمك لمفاهيم الوحدة.`,
                `Cleared with ${shields} of 3 protection shields remaining — solid unit mastery!`,
              )
            : t(
                "ركّز على الأسئلة المشار إليها بالأسفل ثم أعد التحدّي لفتح صندوق مكافآت الوحدة.",
                "Review the missed prompts below, then retake the unit exam to unlock your reward chest.",
              )
        }
        gift={
          passed
            ? bossResult?.reward_box_id
              ? {
                  title: t(summary.giftTitleAr, summary.giftTitleEn),
                  subtitle: box
                    ? t(
                        "تم فتح صندوق هدية الامتحان وإضافة المكافآت إلى رصيدك!",
                        "Exam gift chest opened and rewards credited to your ledger!",
                      )
                    : t(
                        "اجتزت امتحان الوحدة! افتح صندوق هديتك الآن لكشف العملات ونقاط الخبرة الإضافية.",
                        "Unit exam passed! Open your official gift chest to reveal bonus coins and XP.",
                      ),
                  tier: summary.giftTier,
                  unsealed: Boolean(box),
                  coins: box?.reward?.coins ?? 0,
                  xp: box?.reward?.xp ?? 0,
                  badge: box
                    ? `${(box.reward?.tier ?? "reward").toUpperCase()} GIFT`
                    : undefined,
                  busy,
                  openButtonLabel: t("🎁 افتح صندوق هدية الامتحان", "🎁 Open Exam Gift Chest"),
                  openingLabel: t("جارٍ فتح صندوق الامتحان...", "Unsealing exam chest..."),
                  onOpen: () => openBox(),
                }
              : {
                  title: t(
                    `وسام اجتياز الامتحان (${summary.rank})`,
                    `Exam Victory Distinction (${summary.rank})`,
                  ),
                  subtitle: t(
                    "حققت درجة النجاح في مسار المعاينة. أكمل المسار الموثّق في المنهج لفتح الصندوق الرسمي في المتجر.",
                    "Passing score achieved in preview arena. Official gift chests unlock on live server-verified exams.",
                  ),
                  tier: summary.giftTier,
                  unsealed: true,
                  badge: t(`🎯 دقة ${accuracyPct}% · ${shields} 🛡️`, `🎯 ${accuracyPct}% · ${shields} 🛡️`),
                }
            : undefined
        }
        actions={
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                unit && selectedTrack
                  ? void loadArenaForUnit(unit, selectedTrack, lessons, () => true)
                  : setReload((n) => n + 1)
              }
            >
              {t("أعد خوض تحدّي الوحدة", "Retake Unit Challenge")}
            </button>
            <Link
              className="btn btn-secondary"
              href={`/review?mode=topic${selectedTrack ? `&track=${encodeURIComponent(selectedTrack.slug)}` : ""}`}
            >
              {t("مراجعة متباعدة للوحدة", "Spaced Review")}
            </Link>
            <Link
              className="btn btn-secondary"
              href={`/study${selectedTrack ? `?track=${encodeURIComponent(selectedTrack.slug)}` : ""}`}
            >
              {t("مركز المذاكرة", "Study Center")}
            </Link>
            <Link className="btn btn-secondary" href="/rewards">
              {t("الهدايا والمتجر", "Rewards & Shop")}
            </Link>
          </>
        }
      >
        {missedPrompts.length > 0 && (
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              background: "var(--surface-soft)",
              border: "1px solid var(--line)",
            }}
            dir={contentDir}
          >
            <strong style={{ fontSize: 13.5, display: "block", marginBottom: 8 }}>
              {t("نقاط يُنصح بمراجعتها في هذه الوحدة:", "Focus areas to reinforce in this unit:")}
            </strong>
            <ul style={{ margin: 0, paddingInlineStart: 20, fontSize: 13, lineHeight: 1.75 }}>
              {missedPrompts.slice(0, 4).map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
            <div style={{ marginTop: 12 }}>
              <Link
                className="btn btn-secondary"
                style={{ fontSize: 12.5 }}
                href={buildStructuredAiHandoffHref({
                  source: "boss",
                  action: "weakness_review",
                  subject: selectedTrack?.slug,
                  topic: resolveCurriculumText(
                    effectiveLang,
                    unit?.title_ar,
                    unit?.title_en,
                  ),
                })}
              >
                <Icon name="sparkles" size={14} />
                <span>{t("راجع نقاط الضعف مع Noäta AI", "Review Weaknesses with Noäta AI")}</span>
              </Link>
            </div>
          </div>
        )}
      </AchievementCelebration>
    );
  }

  return (
    <>
      <header className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>
            {t("ساحة تحدّي الوحدة · تقييم شامل", "UNIT CHALLENGE ARENA · DIAGNOSTIC")}
          </div>
          <h1 style={{ margin: "6px 0 0" }} dir={contentDir}>
            {resolveCurriculumText(
              effectiveLang,
              unit?.title_ar,
              unit?.title_en,
              t("تحدّي الوحدة", "Unit Challenge"),
            )}
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span className="noata-shield-row" title={t("دروع التحدي", "Challenge shields")}>
            <span>{"🛡️".repeat(shields)}</span>
            <span>{shields}/3 {t("دروع", "Shields")}</span>
          </span>
          <span className="pill">
            {locale === "en"
              ? `Question ${questions.length ? idx + 1 : 0} of ${questions.length}`
              : `السؤال ${questions.length ? idx + 1 : 0} من ${questions.length}`}
          </span>
        </div>
      </header>

      {/* Track & Unit Arena Selector + Readiness Meter */}
      {tracks.length > 0 && (
        <section className="noata-learning-toolbar" aria-label={t("اختيار المسار والوحدة", "Track and unit selector")}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <strong style={{ fontSize: 13.5, color: "var(--ink)" }}>
              {t("اختر المسار والوحدة للبدء:", "Select Track & Unit Arena:")}
            </strong>
            <span className="pill" style={{ fontSize: 12 }}>
              {t("جاهزية الوحدة:", "Unit Readiness:")} {completedInUnit}/{unitLessonRows.length || 1} ({readinessPct}%)
            </span>
          </div>

          <div className="noata-learning-pills" role="group" aria-label={t("المسارات", "Tracks")}>
            {tracks.map((tr) => {
              const active = tr.id === selectedTrack?.id;
              return (
                <button
                  key={tr.id}
                  type="button"
                  className={`noata-learning-pill ${active ? "is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => void selectTrack(tr)}
                >
                  <span>{tr.content_language === "en" ? tr.title_en : tr.title_ar}</span>
                </button>
              );
            })}
          </div>

          {trackUnits.length > 0 && (
            <div className="noata-learning-pills" role="group" aria-label={t("الوحدات", "Units")}>
              {trackUnits.map((u) => {
                const active = u.id === unit?.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    className={`noata-learning-pill ${active ? "is-active" : ""}`}
                    aria-pressed={active}
                    onClick={() => void selectUnit(u)}
                  >
                    <span>{resolveCurriculumText(effectiveLang, u.title_ar, u.title_en)}</span>
                  </button>
                );
              })}
            </div>
          )}

          {loadingArena && (
            <small style={{ color: "var(--accent)", fontWeight: 700 }}>
              {t("جاري تجهيز أسئلة ساحة التحدّي...", "Preparing unit challenge arena...")}
            </small>
          )}
        </section>
      )}

      <section className="hero" style={{ padding: 26, marginBottom: 18 }}>
        <div className="eyebrow">{t("تقييم تكاملي للوحدة", "Integrative Unit Assessment")}</div>
        <h2 style={{ margin: "8px 0", fontSize: 26 }}>
          {t("اربط المفاهيم وحافظ على دروعك.", "Connect concepts and protect your shields.")}
        </h2>
        <p>
          {t(
            `تحدٍ شامل من ${questions.length || 6} أسئلة متدرجة تربط دروس الوحدة بالمواقف التطبيقية والأسئلة العميقة.`,
            `A comprehensive ${questions.length || 6}-question gauntlet connecting unit lessons to deep exam applications.`,
          )}
        </p>
      </section>

      <section className="panel" style={{ padding: 28 }}>
        {!current ? (
          <p>{t("لا يوجد تحدّي منشور لهذه الوحدة بعد.", "No challenge has been published for this unit yet.")}</p>
        ) : (
          <form onSubmit={(e) => void submit(e)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <span className="pill" style={{ fontSize: 12 }}>
                {current.isOfficialBoss
                  ? t("سؤال أساسي موثّق", "Verified Boss Core")
                  : t("سؤال تطبيقي متقدّم", "Extended Mastery Item")}
              </span>
              {current.difficulty && (
                <small style={{ color: "var(--muted)" }}>{current.difficulty}</small>
              )}
            </div>

            <h2 style={{ lineHeight: 1.7 }} dir={contentDir}>
              <StudyRichText content={currentPrompt} inline />
            </h2>

            {current.question_type === "multiple-choice" ? (
              <ChoiceCardGroup
                legend={t("خيارات تحدي الوحدة", "Unit challenge choices")}
                options={currentChoices}
                value={answer}
                disabled={Boolean(grade) || busy}
                contentDir={contentDir}
                onChange={(val) => setAnswer(val)}
              />
            ) : (
              <input
                className="search"
                style={{ width: "100%" }}
                disabled={Boolean(grade) || busy}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                inputMode={current.question_type === "numeric" ? "decimal" : "text"}
                aria-label={t("إجابتك على السؤال", "Your answer")}
                placeholder={t("الإجابة…", "Your answer…")}
              />
            )}

            {current.hint && (
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
                <b>{grade.correct ? t("صح 👏", "Correct 👏") : t("تحتاج تركيز — راجع السبب:", "Not quite — review why:")}</b>
                <p style={{ margin: "4px 0 0", lineHeight: 1.7 }}>
                  <StudyRichText
                    inline
                    content={resolveCurriculumText(
                      effectiveLang,
                      grade.explanation_ar,
                      grade.explanation_en,
                    )}
                  />
                </p>
                {!grade.correct &&
                  current.source === "db" &&
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
              </div>
            )}

            {(error || status) && (
              <div className="noata-retry-banner" role="alert">
                <span>{error || status}</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={() => void (grade ? advance() : submit())}
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
                  disabled={!answer || busy}
                  className="btn"
                  style={{
                    background: "var(--accent)",
                    color: "var(--on-accent, #ffffff)",
                  }}
                >
                  {t("تحقق", "Check answer")}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void advance()}
                  className="btn"
                  style={{
                    background: "var(--accent)",
                    color: "var(--on-accent, #ffffff)",
                  }}
                >
                  {grade.correct
                    ? idx === questions.length - 1
                      ? t("إنهاء تحدّي الوحدة", "Finish Challenge")
                      : t("التالي", "Next")
                    : current.source === "db" && !current.isOfficialBoss
                      ? t("جرّب سؤالًا موازيًا", "Try similar question")
                      : t("حاول مرة أخرى", "Try again")}
                </button>
              )}
            </div>
          </form>
        )}
      </section>
    </>
  );
}
