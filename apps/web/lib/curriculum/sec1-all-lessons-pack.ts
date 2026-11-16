import type { ContentLanguage } from "./catalog.ts";
import type { CanonicalLessonStudyPack, CuratedStudyQuestion } from "./pack-types.ts";
import { RENAISSANCE_LESSON_STUDY_PACKS } from "./packs/index.ts";
import {
  selectLessonPack,
  selectPackQuestion,
  selectTrackPacks,
} from "./pack-select.ts";

export type {
  CanonicalFlashcard,
  CanonicalLessonStudyPack,
  CuratedStudyQuestion,
  StudyConceptSection,
  StudyWorkedExample,
  SubjectSlugKey,
} from "./pack-types.ts";

export { selectLessonPack, selectPackQuestion, selectTrackPacks };

/**
 * Effective pack list. Each of the 47 legacy Phase-0 packs was superseded by a
 * Renaissance pack carrying the same pack id, so the old merge step never returned a
 * legacy entry. Those duplicated packs were pruned rather than shipped and discarded;
 * git history keeps them if a rollback reference is ever needed again.
 *
 * The client does not import this module: it renders lists from `packs/index-map.ts` and
 * pulls pack bodies per track through `live-packs.ts`.
 */
export const ALL_LESSON_STUDY_PACKS: CanonicalLessonStudyPack[] = [...RENAISSANCE_LESSON_STUDY_PACKS];

export function getTrackLessonStudyPacks(trackSlug: string): CanonicalLessonStudyPack[] {
  return selectTrackPacks(ALL_LESSON_STUDY_PACKS, trackSlug);
}

export function getLessonStudyPack(
  lessonSlug?: string | null,
  contentLanguage?: ContentLanguage,
): CanonicalLessonStudyPack | null {
  return selectLessonPack(ALL_LESSON_STUDY_PACKS, lessonSlug, contentLanguage);
}

export function findPackQuestionById(questionId: string): CuratedStudyQuestion | null {
  return selectPackQuestion(ALL_LESSON_STUDY_PACKS, questionId);
}
