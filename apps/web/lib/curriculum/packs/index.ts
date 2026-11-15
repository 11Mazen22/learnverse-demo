import type { CanonicalLessonStudyPack } from "../pack-types.ts";
import { ARABIC_PACKS } from "./arabic.ts";
import { ENGLISH_PACKS } from "./english.ts";
import { HISTORY_PACKS } from "./history.ts";
import { MATHEMATICS_PACKS } from "./mathematics.ts";
import { PATHWAY_LESSON_PACKS } from "./pathways.ts";
import { PHILOSOPHY_PACKS } from "./philosophy.ts";
import { INTEGRATED_SCIENCE_PACKS } from "./science.ts";

export const RENAISSANCE_LESSON_STUDY_PACKS: readonly CanonicalLessonStudyPack[] = [
  ...INTEGRATED_SCIENCE_PACKS,
  ...MATHEMATICS_PACKS,
  ...ARABIC_PACKS,
  ...ENGLISH_PACKS,
  ...HISTORY_PACKS,
  ...PHILOSOPHY_PACKS,
  ...PATHWAY_LESSON_PACKS,
];
