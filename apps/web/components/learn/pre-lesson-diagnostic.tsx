"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { StudyRichText } from "@/components/study/study-rich-text";
import { getPreLessonDiagnosticItems } from "@/lib/curriculum/knowledge-map";

export type PreLessonDiagnosticProps = {
  lessonIdOrSlug: string;
  subjectKey: string;
  uiLocale: "ar" | "en";
  contentLocale: "ar" | "en";
  onJumpToStage2?: (recommendedFocus?: string) => void;
};

/**
 * Optional, skippable 2-question Stage 1 readiness check that diagnoses prerequisite
 * gaps before entering Stage 2 concept breakdown & interactive labs.
 */
export function PreLessonDiagnostic({
  lessonIdOrSlug,
  subjectKey,
  uiLocale,
  contentLocale,
  onJumpToStage2,
}: PreLessonDiagnosticProps) {
  const [dismissed, setDismissed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const questions = useMemo(
    () => getPreLessonDiagnosticItems(lessonIdOrSlug, subjectKey, contentLocale),
    [lessonIdOrSlug, subjectKey, contentLocale],
  );

  if (dismissed || questions.length === 0) return null;

  const tUi = (ar: string, en: string) => (uiLocale === "ar" ? ar : en);
  const missedFocuses = questions
    .filter((q) => answers[q.id] && answers[q.id] !== q.correctId)
    .map((q) => q.focusIfMissed);
  const answeredCount = questions.filter((q) => Boolean(answers[q.id])).length;

  return (
    <section
      className="noata-diag-card"
      dir={uiLocale === "ar" ? "rtl" : "ltr"}
      aria-label={tUi("تشخيص سريع قبل الشرح (اختياري)", "Optional Pre-Lesson Readiness Check")}
    >
      <div className="noata-diag-head">
        <div className="noata-diag-title-wrap">
          <Icon name="compass" size={16} />
          <div>
            <h3>{tUi("فحص الاستعداد السريع (اختياري)", "Quick Readiness Check (Optional)")}</h3>
            <p>
              {tUi(
                "سؤالان اختياريان لتحديد الجزء الأهم لك في الشرح والمختبر — أو تخطّهما مباشرة.",
                "Two optional check-ins to pinpoint which concept/lab to focus on — skip anytime.",
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="noata-diag-skip"
          onClick={() => setDismissed(true)}
        >
          {tUi("تخطي والبدء", "Skip check")}
        </button>
      </div>

      <div className="noata-diag-list">
        {questions.map((q, index) => {
          const picked = answers[q.id] ?? null;
          const isCorrect = picked === q.correctId;
          return (
            <div
              key={q.id}
              className="noata-diag-q"
              dir={contentLocale === "ar" ? "rtl" : "ltr"}
            >
              <div className="noata-diag-prompt">
                <strong>{index + 1}.</strong>{" "}
                <StudyRichText content={q.prompt} />
              </div>

              <div className="noata-diag-options" role="radiogroup" aria-label={q.prompt}>
                {q.options.map((opt) => {
                  const active = picked === opt.id;
                  const optRight = Boolean(picked && opt.id === q.correctId);
                  const optWrong = Boolean(picked && active && !optRight);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={opt.label}
                      className={`noata-diag-opt ${active ? "is-picked" : ""} ${
                        optRight ? "is-right" : optWrong ? "is-wrong" : ""
                      }`}
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                      }
                    >
                      <span>
                        <StudyRichText content={opt.label} />
                      </span>
                    </button>
                  );
                })}
              </div>

              {picked ? (
                <div className={`noata-diag-feedback ${isCorrect ? "is-right" : "is-wrong"}`}>
                  <Icon name={isCorrect ? "check-circle" : "alert-circle"} size={15} />
                  <span>{isCorrect ? q.feedbackCorrect : q.feedbackMissed}</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {answeredCount > 0 && onJumpToStage2 ? (
        <div className="noata-diag-footer">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onJumpToStage2(missedFocuses[0])}
          >
            <Icon name="sparkles" size={15} />
            <span>
              {missedFocuses.length > 0
                ? tUi(
                    `انتقل للشرح وابدأ بـ: ${missedFocuses[0]}`,
                    `Jump to Stage 2 & Focus: ${missedFocuses[0]}`,
                  )
                : tUi("انتقل الآن للشرح والمختبر", "Continue to Concepts & Lab")}
            </span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
