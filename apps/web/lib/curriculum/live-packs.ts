"use client";

import { useEffect, useState } from "react";
import type { ContentLanguage } from "./catalog.ts";
import type { CanonicalLessonStudyPack } from "./pack-types.ts";
import {
  PACK_INDEX,
  PACK_TRACK_COUNTS,
  type PackIndexEntry,
  type PackModuleKey,
} from "./packs/index-map.ts";

/**
 * Per-track pack loading for the client.
 *
 * The 64 Sec. 1 lesson packs are ~132 KB gzipped up front, and a page only ever needs
 * the metadata (lists, counts, filters) plus the packs of the track the learner picked.
 * `PACK_INDEX` ships in the initial bundle for the metadata; pack bodies arrive one
 * track at a time through the dynamic imports below.
 *
 * The selectors mirror `sec1-all-lessons-pack.ts` exactly (both delegate to
 * `select*` helpers), so lazy and eager results are identical — see live-packs.test.ts.
 */

type TrackModule = () => Promise<Record<string, readonly CanonicalLessonStudyPack[]>>;

const TRACK_IMPORTS: Record<PackModuleKey, TrackModule> = {
  science: () => import("./packs/science.ts") as Promise<Record<string, readonly CanonicalLessonStudyPack[]>>,
  mathematics: () => import("./packs/mathematics.ts") as Promise<Record<string, readonly CanonicalLessonStudyPack[]>>,
  arabic: () => import("./packs/arabic.ts") as Promise<Record<string, readonly CanonicalLessonStudyPack[]>>,
  english: () => import("./packs/english.ts") as Promise<Record<string, readonly CanonicalLessonStudyPack[]>>,
  history: () => import("./packs/history.ts") as Promise<Record<string, readonly CanonicalLessonStudyPack[]>>,
  philosophy: () => import("./packs/philosophy.ts") as Promise<Record<string, readonly CanonicalLessonStudyPack[]>>,
  pathways: () => import("./packs/pathways.ts") as Promise<Record<string, readonly CanonicalLessonStudyPack[]>>,
};

const TRACK_EXPORT: Record<PackModuleKey, string> = {
  science: "INTEGRATED_SCIENCE_PACKS",
  mathematics: "MATHEMATICS_PACKS",
  arabic: "ARABIC_PACKS",
  english: "ENGLISH_PACKS",
  history: "HISTORY_PACKS",
  philosophy: "PHILOSOPHY_PACKS",
  pathways: "PATHWAY_LESSON_PACKS",
};

const TRACK_SUFFIX = /^(arabic-language|english|history|philosophy-logic)-(ar|en)$/;

const loadedModules = new Map<PackModuleKey, readonly CanonicalLessonStudyPack[]>();
const inflight = new Map<PackModuleKey, Promise<void>>();
let loadedPacks: readonly CanonicalLessonStudyPack[] = [];
const listeners = new Set<() => void>();

type StudyEngine = typeof import("./sec1-study-pack.ts");
type QuizEngine = typeof import("../study/quizgecko-engine.ts");
let studyEngineModule: StudyEngine | null = null;
let quizEngineModule: QuizEngine | null = null;
let studyEngineRequest: Promise<void> | null = null;

/**
 * The study engine (`sec1-study-pack.ts`) owns TOPIC_MODULES and the deck/companion/
 * grading helpers. It also statically holds the pack data, so it loads as a single
 * deferred chunk instead of riding in every route's initial JS.
 */
export function loadStudyEngine(): Promise<void> {
  if (studyEngineModule) return Promise.resolve();
  studyEngineRequest ??= Promise.all([
    import("./sec1-study-pack.ts"),
    import("../study/quizgecko-engine.ts"),
  ]).then(([study, quiz]) => {
    studyEngineModule = study;
    quizEngineModule = quiz;
    notify();
  });
  return studyEngineRequest;
}

function requireEngine(): StudyEngine {
  if (!studyEngineModule) {
    throw new Error("Curriculum engine accessed before loadStudyEngine() resolved");
  }
  return studyEngineModule;
}

function requireQuizEngine(): QuizEngine {
  if (!quizEngineModule) {
    throw new Error("Quiz engine accessed before loadStudyEngine() resolved");
  }
  return quizEngineModule;
}

/** Sync access to the engine once `loadStudyEngine` has resolved, otherwise null. */
export function studyEngine(): StudyEngine | null {
  return studyEngineModule;
}

function notify() {
  loadedPacks = [...loadedModules.values()].flat();
  for (const listener of listeners) listener();
}

/** Load (and cache) one pack module. Resolves immediately when already loaded. */
export function loadPackModule(key: PackModuleKey): Promise<void> {
  if (loadedModules.has(key)) return Promise.resolve();
  const existing = inflight.get(key);
  if (existing) return existing;
  const request = TRACK_IMPORTS[key]()
    .then((mod) => {
      loadedModules.set(key, mod[TRACK_EXPORT[key]] ?? []);
      inflight.delete(key);
      notify();
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });
  inflight.set(key, request);
  return request;
}

function moduleForTrack(trackSlug: string): PackModuleKey | null {
  const direct = PACK_INDEX.find((entry) => entry.trackSlug === trackSlug);
  if (direct) return direct.module;
  const normalized = trackSlug.replace(TRACK_SUFFIX, "$1");
  return PACK_INDEX.find((entry) => entry.trackSlug === normalized)?.module ?? null;
}

function moduleForLesson(lessonSlug: string): PackModuleKey | null {
  const withoutEn = lessonSlug.replace(/-en$/i, "");
  const entry =
    PACK_INDEX.find((row) => row.lessonSlug === lessonSlug) ??
    PACK_INDEX.find((row) => row.lessonSlug === withoutEn);
  return entry?.module ?? null;
}

/** Load the packs behind one track slug (no-op for unknown or already-loaded tracks). */
export function loadTrackPacks(trackSlug: string): Promise<void> {
  const key = moduleForTrack(trackSlug);
  return key ? loadPackModule(key) : Promise.resolve();
}

/** Load the packs behind one lesson slug. */
export function loadLessonPacks(lessonSlug?: string | null): Promise<void> {
  if (!lessonSlug) return Promise.resolve();
  const key = moduleForLesson(lessonSlug);
  return key ? loadPackModule(key) : Promise.resolve();
}

/** Load every pack module (used by views that genuinely span all tracks). */
export function loadAllPacks(): Promise<void> {
  return Promise.all(
    [loadStudyEngine(), ...(Object.keys(TRACK_IMPORTS) as PackModuleKey[]).map(loadPackModule)],
  ).then(() => undefined);
}

// ---- synchronous accessors over whatever has loaded so far --------------------

export function trackPacks(trackSlug: string): CanonicalLessonStudyPack[] {
  const direct = loadedPacks.filter((pack) => pack.trackSlug === trackSlug);
  if (direct.length > 0) return direct.sort((a, b) => a.position - b.position);
  const normalized = trackSlug.replace(TRACK_SUFFIX, "$1");
  return loadedPacks
    .filter((pack) => pack.trackSlug === normalized)
    .sort((a, b) => a.position - b.position);
}

/** Pack lookup for the canonical Sec. 1 decks once the engine is in memory. */
export function studyDecks(): ReturnType<StudyEngine["getCanonicalStudyDecks"]> {
  return studyEngineModule ? studyEngineModule.getCanonicalStudyDecks() : [];
}

export function lessonPack(
  lessonSlug?: string | null,
  contentLanguage?: ContentLanguage,
): CanonicalLessonStudyPack | null {
  if (!lessonSlug) return null;
  const candidates = [lessonSlug.trim(), lessonSlug.trim().replace(/-en$/i, "")].filter(
    (value, index, all) => value && all.indexOf(value) === index,
  );
  if (contentLanguage) {
    for (const key of candidates) {
      const exact = loadedPacks.find(
        (pack) => pack.lessonSlug === key && pack.contentLanguage === contentLanguage,
      );
      if (exact) return exact;
    }
  }
  for (const key of candidates) {
    const any = loadedPacks.find((pack) => pack.lessonSlug === key);
    if (any) return any;
  }
  return null;
}

/** Sync metadata straight from the index — never needs a pack chunk. */
export function trackPackCount(trackSlug: string): number {
  const normalized = trackSlug.replace(TRACK_SUFFIX, "$1");
  return PACK_TRACK_COUNTS[trackSlug] ?? PACK_TRACK_COUNTS[normalized] ?? 0;
}

export function lessonIndexEntry(lessonSlug?: string | null): PackIndexEntry | null {
  if (!lessonSlug) return null;
  const withoutEn = lessonSlug.replace(/-en$/i, "");
  return (
    PACK_INDEX.find((row) => row.lessonSlug === lessonSlug) ??
    PACK_INDEX.find((row) => row.lessonSlug === withoutEn) ??
    null
  );
}

export function indexEntriesForTrack(trackSlug: string): PackIndexEntry[] {
  const normalized = trackSlug.replace(TRACK_SUFFIX, "$1");
  return PACK_INDEX.filter(
    (row) => row.trackSlug === trackSlug || row.trackSlug === normalized,
  ).sort((a, b) => a.position - b.position);
}

// ---- React binding -----------------------------------------------------------

/**
 * Loads the packs a view needs and re-renders as each module arrives.
 * Pass `"all"` for views that span every track; pass `"idle"` to wait until a
 * dynamic route parameter resolves to a track or fallback.
 */
export function useCurriculumPacks(trackSlug?: string | null | "all" | "idle"): { ready: boolean } {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (trackSlug === "idle") {
      setReady(false);
      return;
    }
    let active = true;
    const done = () => {
      if (active) setReady(true);
    };
    const request =
      !trackSlug || trackSlug === "all"
        ? loadAllPacks()
        : Promise.all([loadStudyEngine(), loadTrackPacks(trackSlug)]).then(() => undefined);
    // A failed chunk fetch must not strand the view on a loading state forever; the
    // pages fall back to their own empty/error handling.
    void request.then(done).catch(done);
    return () => {
      active = false;
    };
  }, [trackSlug]);

  return { ready };
}

// ---- sync proxies with the same names as the engine modules -------------------
// Components import these instead of `sec1-study-pack` / `quizgecko-engine`, so the
// engine only enters the page once `useCurriculumPacks` has fetched it.

export type {
  CanonicalLessonStudyPack,
  CanonicalStudyDeck,
  LessonStudyCompanion,
} from "./sec1-study-pack.ts";
export type {
  QuizDifficulty,
  QuizFlashcard,
  QuizGeckoBundle,
} from "../study/quizgecko-engine.ts";

export function getCanonicalStudyDecks(): ReturnType<StudyEngine["getCanonicalStudyDecks"]> {
  return studyDecks();
}

export function getTrackLessonStudyPacks(trackSlug: string): CanonicalLessonStudyPack[] {
  return trackPacks(trackSlug);
}

export function getLessonStudyPack(
  lessonSlug?: string | null,
  contentLanguage?: ContentLanguage,
): CanonicalLessonStudyPack | null {
  return lessonPack(lessonSlug, contentLanguage);
}

export function evaluateLocalChoice(
  input: Parameters<StudyEngine["evaluateLocalChoice"]>[0],
): ReturnType<StudyEngine["evaluateLocalChoice"]> {
  return requireEngine().evaluateLocalChoice(input);
}

/**
 * `source: "none"` is the engine's own "no verified content" answer, so rendering this
 * before the engine arrives is honest rather than wrong: nothing is claimed.
 */
const EMPTY_COMPANION: ReturnType<StudyEngine["getLessonStudyCompanion"]> = {
  matchedTopic: "",
  source: "none",
  keyConcepts: [],
  workedExamples: [],
  commonMistakes: [],
  aiTutorPrompts: [],
  curatedQuestions: [],
  flashcards: [],
};

export function getSubjectQuestionBank(
  subjectOrTrackSlug: string,
  contentLanguage: ContentLanguage,
): ReturnType<StudyEngine["getSubjectQuestionBank"]> {
  return studyEngineModule
    ? studyEngineModule.getSubjectQuestionBank(subjectOrTrackSlug, contentLanguage)
    : [];
}

export function getLessonStudyCompanion(
  input: Parameters<StudyEngine["getLessonStudyCompanion"]>[0],
): ReturnType<StudyEngine["getLessonStudyCompanion"]> {
  return studyEngineModule ? studyEngineModule.getLessonStudyCompanion(input) : EMPTY_COMPANION;
}

export function createBundleFromLessonPack(
  ...args: Parameters<QuizEngine["createBundleFromLessonPack"]>
): ReturnType<QuizEngine["createBundleFromLessonPack"]> {
  return requireQuizEngine().createBundleFromLessonPack(...args);
}

export async function generateQuizGeckoBundle(
  ...args: Parameters<QuizEngine["generateQuizGeckoBundle"]>
): Promise<Awaited<ReturnType<QuizEngine["generateQuizGeckoBundle"]>>> {
  await loadStudyEngine();
  return requireQuizEngine().generateQuizGeckoBundle(...args);
}

export function exportToAnkiTSV(
  ...args: Parameters<QuizEngine["exportToAnkiTSV"]>
): ReturnType<QuizEngine["exportToAnkiTSV"]> {
  return requireQuizEngine().exportToAnkiTSV(...args);
}
