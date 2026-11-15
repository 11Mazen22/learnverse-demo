"use client";

import { Component, type ReactNode, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { StudyRichText } from "@/components/study/study-rich-text";
import type { BilingualText, SubjectLabSpec } from "@/lib/curriculum/subject-labs";

type LabBoundaryProps = {
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackActionLabel: string;
  fallbackBlocks: ReactNode;
  children: ReactNode;
};

type LabBoundaryState = {
  hasError: boolean;
};

class LabContentErrorBoundary extends Component<LabBoundaryProps, LabBoundaryState> {
  state: LabBoundaryState = { hasError: false };

  static getDerivedStateFromError(): LabBoundaryState {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="noata-lab-fallback" role="alert">
        <div className="noata-lab-fallback-head">
          <Icon name="alert-triangle" size={18} />
          <div>
            <strong>{this.props.fallbackTitle}</strong>
            <p>{this.props.fallbackDescription}</p>
          </div>
        </div>
        {this.props.fallbackBlocks}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => this.setState({ hasError: false })}
        >
          <Icon name="refresh" size={15} />
          <span>{this.props.fallbackActionLabel}</span>
        </button>
      </div>
    );
  }
}

function pickText(text: BilingualText, lang: "ar" | "en"): string {
  return lang === "ar" ? text.ar : text.en;
}

export type SubjectLabFrameProps = {
  spec: SubjectLabSpec;
  uiLocale: "ar" | "en";
  contentLocale: "ar" | "en";
  liveStatusText: string;
  children: ReactNode;
  headerActions?: ReactNode;
};

/**
 * Canonical interactive lab container shared across all curriculum subjects.
 * Enforces objective clarity, keyboard/touch >= 44px controls, aria-live announcements,
 * deterministic structured fallback explanation, and embedded micro-assessment with feedback.
 */
export function SubjectLabFrame({
  spec,
  uiLocale,
  contentLocale,
  liveStatusText,
  children,
  headerActions,
}: SubjectLabFrameProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [checkedChoice, setCheckedChoice] = useState<string | null>(null);
  const [showFallbackText, setShowFallbackText] = useState(false);

  const tUi = (ar: string, en: string) => (uiLocale === "ar" ? ar : en);
  const uiDir = uiLocale === "ar" ? "rtl" : "ltr";
  const contentDir = contentLocale === "ar" ? "rtl" : "ltr";

  const fallbackBlocks =
    contentLocale === "ar" ? spec.fallbackBlocks.ar : spec.fallbackBlocks.en;
  const fallbackNode = (
    <div className="noata-lab-fallback-blocks" dir={contentDir}>
      <StudyRichText blocks={fallbackBlocks} dir={contentDir} locale={contentLocale} />
    </div>
  );

  const isPredictionSubmitted = checkedChoice !== null;
  const isPredictionCorrect = checkedChoice === spec.prediction.correctId;
  const predictionFeedback =
    checkedChoice && spec.prediction.explainByChoice[checkedChoice]
      ? pickText(spec.prediction.explainByChoice[checkedChoice], contentLocale)
      : null;

  return (
    <section
      className="noata-lab-frame"
      data-lab-id={spec.id}
      data-subject-accent={spec.accent}
      dir={uiDir}
      aria-label={pickText(spec.title, uiLocale)}
    >
      <header className="noata-lab-header">
        <div className="noata-lab-header-main">
          <div className="noata-lab-badge-row">
            <span className="noata-lab-badge">
              <Icon name="microscope" size={14} />
              <span>{tUi("مختبر المادة التفاعلي", "Interactive Subject Lab")}</span>
            </span>
            <button
              type="button"
              className="noata-lab-text-toggle"
              aria-expanded={showFallbackText}
              onClick={() => setShowFallbackText((prev) => !prev)}
            >
              <Icon name="book" size={14} />
              <span>
                {showFallbackText
                  ? tUi("إخفاء الملخص النصي البديل", "Hide accessible summary")
                  : tUi("الملخص النصي والمعادلات", "Accessible text summary")}
              </span>
            </button>
          </div>
          <h3 className="noata-lab-title" dir={contentDir}>
            {pickText(spec.title, contentLocale)}
          </h3>
          <p className="noata-lab-objective" dir={contentDir}>
            <strong dir={uiDir}>{tUi("هدف التعلّم:", "Learning objective:")}</strong>{" "}
            {pickText(spec.learningObjective, contentLocale)}
          </p>
          <p className="noata-lab-guide" dir={uiDir}>
            <Icon name="compass" size={14} />
            <span>{pickText(spec.interactionGuide, uiLocale)}</span>
          </p>
        </div>
        {headerActions ? <div className="noata-lab-header-actions">{headerActions}</div> : null}
      </header>

      {spec.scientificCaveat ? (
        <div className="noata-lab-caveat" dir={contentDir} role="note">
          <Icon name="info" size={16} />
          <span>{pickText(spec.scientificCaveat, contentLocale)}</span>
        </div>
      ) : null}

      {showFallbackText ? fallbackNode : null}

      <LabContentErrorBoundary
        fallbackTitle={tUi(
          "تم تفعيل الشرح النصي البديل للمختبر",
          "Showing accessible structured fallback",
        )}
        fallbackDescription={tUi(
          "تعذّر عرض اللوحة التفاعلية حاليًا؛ القواعد والمعادلات الكاملة متاحة أدناه دون فقدان أي معلومة.",
          "The interactive canvas could not render right now; full concepts and equations remain available below.",
        )}
        fallbackActionLabel={tUi("إعادة تشغيل المحاكي", "Reload simulator")}
        fallbackBlocks={fallbackNode}
      >
        <div className="noata-lab-canvas-wrap">{children}</div>
      </LabContentErrorBoundary>

      <div className="noata-lab-live-status" aria-live="polite" dir={contentDir}>
        <span className="noata-lab-live-label" dir={uiDir}>
          {tUi("القراءة المباشرة:", "Live state:")}
        </span>{" "}
        <span>{liveStatusText}</span>
      </div>

      <section
        className="noata-lab-prediction"
        aria-labelledby={`${spec.prediction.id}-heading`}
      >
        <div className="noata-lab-prediction-head">
          <span className="noata-lab-prediction-pill">
            <Icon name="lightbulb" size={14} />
            <span>{tUi("توقّع وتحقق", "Predict & Verify")}</span>
          </span>
          <h4 id={`${spec.prediction.id}-heading`} dir={contentDir}>
            <StudyRichText
              content={pickText(spec.prediction.prompt, contentLocale)}
              dir={contentDir}
              locale={contentLocale}
              inline
            />
          </h4>
        </div>

        <div
          className="noata-lab-choice-grid"
          role="radiogroup"
          aria-labelledby={`${spec.prediction.id}-heading`}
          dir={contentDir}
        >
          {spec.prediction.choices.map((choice) => {
            const rawLabel = pickText(choice.label, contentLocale);
            const accessibleChoiceLabel = rawLabel.replace(/\$\$?/g, "").replace(/\\([a-zA-Z]+)/g, "$1 ").trim();
            const isSelected = selectedChoice === choice.id;
            const showCorrect =
              isPredictionSubmitted && choice.id === spec.prediction.correctId;
            const showWrong =
              isPredictionSubmitted &&
              checkedChoice === choice.id &&
              choice.id !== spec.prediction.correctId;

            return (
              <button
                key={choice.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={accessibleChoiceLabel || rawLabel}
                className={`noata-lab-choice ${isSelected ? "is-selected" : ""} ${
                  showCorrect ? "is-correct" : ""
                } ${showWrong ? "is-wrong" : ""}`}
                onClick={() => {
                  setSelectedChoice(choice.id);
                  if (checkedChoice !== null) setCheckedChoice(null);
                }}
              >
                <StudyRichText
                  content={rawLabel}
                  dir={contentDir}
                  locale={contentLocale}
                  inline
                />
              </button>
            );
          })}
        </div>

        <div className="noata-lab-prediction-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!selectedChoice}
            onClick={() => {
              if (selectedChoice) setCheckedChoice(selectedChoice);
            }}
          >
            <Icon name="check-circle" size={16} />
            <span>{tUi("تحقّق من التوقّع", "Check Prediction")}</span>
          </button>
          {isPredictionSubmitted && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSelectedChoice(null);
                setCheckedChoice(null);
              }}
            >
              <span>{tUi("إعادة المحاولة", "Try another")}</span>
            </button>
          )}
        </div>

        {isPredictionSubmitted && predictionFeedback ? (
          <div
            className={`noata-lab-feedback ${isPredictionCorrect ? "is-correct" : "is-wrong"}`}
            role="status"
            dir={contentDir}
          >
            <strong dir={uiDir}>
              {isPredictionCorrect
                ? tUi("توقّع دقيق!", "Accurate prediction!")
                : tUi("تحتاج مراجعة — إليك التفسير:", "Not quite — here is why:")}
            </strong>
            <div style={{ marginTop: 6 }}>
              <StudyRichText
                content={predictionFeedback}
                dir={contentDir}
                locale={contentLocale}
              />
            </div>
          </div>
        ) : null}
      </section>
    </section>
  );
}
