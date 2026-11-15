import type { ContentLanguage } from "./catalog.ts";
import type { StructuredStudyBlock } from "./structured-content.ts";

export type SubjectSlugKey =
  | "integrated-science"
  | "mathematics"
  | "arabic-language"
  | "english"
  | "history"
  | "philosophy-logic";

/**
 * One progressive concept card. `body`/`formulaOrRule`/`example` remain a plain-text
 * summary used by search, flashcard generation, and AI hand-off. When `blocks` is
 * present the lesson UI renders ONLY the structured blocks (KaTeX, chemistry,
 * callouts, poetry, primary sources) so no content is duplicated on screen.
 */
export type StudyConceptSection = {
  id: string;
  title: string;
  body: string;
  formulaOrRule?: string;
  example?: string;
  /** Optional one-line learning cue shown on the concept card header (e.g. "Foundation"). */
  stage?: "foundation" | "mechanism" | "application";
  blocks?: StructuredStudyBlock[];
};

export type StudyWorkedExample = {
  problem: string;
  steps: string[];
  takeaway: string;
  title?: string;
};

export type CuratedStudyQuestion = {
  id: string;
  question_type: "multiple-choice";
  prompt: string;
  choices: string[];
  correct_index: number;
  explanation: string;
  hint: string;
  difficulty: "foundational" | "standard" | "challenging";
  lessonTitle?: string;
};

export type CanonicalFlashcard = {
  front: string;
  back: string;
  hint?: string;
};

export type CanonicalLessonStudyPack = {
  id: string;
  lessonSlug: string;
  trackSlug: string;
  subject: SubjectSlugKey;
  contentLanguage: ContentLanguage;
  position: number;
  title: string;
  titleAr: string;
  titleEn: string;
  isExtraReview?: boolean;
  /** Concise 1–2 sentence orientation hook shown in the lesson hero (never repeats stage content). */
  hook?: string;
  summary: string;
  formulaOrRule?: string;
  keyConcepts: StudyConceptSection[];
  workedExamples: StudyWorkedExample[];
  commonMistakes: string[];
  questions: CuratedStudyQuestion[];
  cards: CanonicalFlashcard[];
};
