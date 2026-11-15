"use client";

import { useMemo } from "react";
import { resolveSubjectLabForLesson } from "@/lib/curriculum/subject-labs";
import { ArabicLab } from "./arabic-lab";
import { EnglishLab } from "./english-lab";
import { HistoryLab } from "./history-lab";
import { MathPilotLab } from "./math-pilot-lab";
import { PhilosophyLab } from "./philosophy-lab";
import { SciencePilotLab } from "./science-pilot-lab";

export type SubjectLabRouterProps = {
  lessonIdOrSlug?: string | null;
  lessonTitle?: string | null;
  subjectKey?: string | null;
  uiLocale: "ar" | "en";
  contentLocale: "ar" | "en";
};

/**
 * Resolves and renders the domain-specific interactive lab matching the active lesson across all 6 core subjects.
 */
export function SubjectLabRouter({
  lessonIdOrSlug,
  lessonTitle,
  subjectKey,
  uiLocale,
  contentLocale,
}: SubjectLabRouterProps) {
  const match = useMemo(
    () => resolveSubjectLabForLesson({ lessonIdOrSlug, lessonTitle, subjectKey }),
    [lessonIdOrSlug, lessonTitle, subjectKey],
  );

  if (!match) return null;

  switch (match.spec.id) {
    case "math-complex-argand":
    case "math-quadratic-parabola":
      return (
        <MathPilotLab
          labId={match.spec.id}
          initialMode={match.initialMode}
          uiLocale={uiLocale}
          contentLocale={contentLocale}
        />
      );
    case "sci-water-polarity-density":
    case "sci-aquatic-solution-osmosis":
      return (
        <SciencePilotLab
          labId={match.spec.id}
          initialMode={match.initialMode}
          uiLocale={uiLocale}
          contentLocale={contentLocale}
        />
      );
    case "arabic-irab-poetry":
      return (
        <ArabicLab
          initialMode={match.initialMode}
          uiLocale={uiLocale}
          contentLocale={contentLocale}
        />
      );
    case "history-source-timeline":
      return (
        <HistoryLab
          initialMode={match.initialMode}
          uiLocale={uiLocale}
          contentLocale={contentLocale}
        />
      );
    case "philosophy-logic-fallacy":
      return (
        <PhilosophyLab
          initialMode={match.initialMode}
          uiLocale={uiLocale}
          contentLocale={contentLocale}
        />
      );
    case "english-transform-collocation":
      return (
        <EnglishLab
          initialMode={match.initialMode}
          uiLocale={uiLocale}
          contentLocale={contentLocale}
        />
      );
    default:
      return null;
  }
}
