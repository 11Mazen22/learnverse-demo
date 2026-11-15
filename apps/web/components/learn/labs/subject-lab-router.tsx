"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { resolveSubjectLabForLesson } from "@/lib/curriculum/subject-labs";

function LabLoadingFallback() {
  return (
    <div
      className="noata-lab-frame noata-lab-skeleton"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="noata-lab-skeleton-bar" style={{ width: "42%", height: 18 }} />
      <div className="noata-lab-skeleton-bar" style={{ width: "86%", height: 14 }} />
      <div className="noata-lab-skeleton-bar" style={{ width: "100%", height: 148 }} />
    </div>
  );
}

const ArabicLab = dynamic(
  () => import("./arabic-lab").then((mod) => mod.ArabicLab),
  { ssr: false, loading: () => <LabLoadingFallback /> },
);
const EnglishLab = dynamic(
  () => import("./english-lab").then((mod) => mod.EnglishLab),
  { ssr: false, loading: () => <LabLoadingFallback /> },
);
const HistoryLab = dynamic(
  () => import("./history-lab").then((mod) => mod.HistoryLab),
  { ssr: false, loading: () => <LabLoadingFallback /> },
);
const MathPilotLab = dynamic(
  () => import("./math-pilot-lab").then((mod) => mod.MathPilotLab),
  { ssr: false, loading: () => <LabLoadingFallback /> },
);
const PhilosophyLab = dynamic(
  () => import("./philosophy-lab").then((mod) => mod.PhilosophyLab),
  { ssr: false, loading: () => <LabLoadingFallback /> },
);
const SciencePilotLab = dynamic(
  () => import("./science-pilot-lab").then((mod) => mod.SciencePilotLab),
  { ssr: false, loading: () => <LabLoadingFallback /> },
);

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
