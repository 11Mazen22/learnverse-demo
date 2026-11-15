"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  ENGLISH_TRANSFORM_CASES,
  evaluateEnglishCase,
  getSubjectLabSpec,
  type SubjectLabInitialMode,
} from "@/lib/curriculum/subject-labs";
import { SubjectLabFrame } from "./subject-lab-frame";

export type EnglishLabProps = {
  initialMode: SubjectLabInitialMode;
  uiLocale: "ar" | "en";
  contentLocale: "ar" | "en";
};

export function EnglishLab({
  initialMode,
  uiLocale,
  contentLocale,
}: EnglishLabProps) {
  const spec = getSubjectLabSpec("english-transform-collocation");
  const [mode, setMode] = useState<"transform" | "collocation">(
    initialMode === "collocation" ? "collocation" : "transform",
  );
  const [caseIndex, setCaseIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const tUi = (ar: string, en: string) => (uiLocale === "ar" ? ar : en);
  const tContent = (ar: string, en: string) => (contentLocale === "ar" ? ar : en);

  const modeCases = useMemo(() => {
    const filtered = ENGLISH_TRANSFORM_CASES.filter((c) => c.category === mode);
    return filtered.length > 0 ? filtered : ENGLISH_TRANSFORM_CASES;
  }, [mode]);

  const activeCase = modeCases[caseIndex % modeCases.length] ?? ENGLISH_TRANSFORM_CASES[0];

  const evaluation = useMemo(
    () =>
      selectedOption ? evaluateEnglishCase(activeCase.id, selectedOption) : null,
    [activeCase.id, selectedOption],
  );

  const liveStatusText = evaluation
    ? tContent(evaluation.reasonAr, evaluation.reasonEn)
    : tContent(
        `الجملة النشطة: ${activeCase.promptEn} — اختر الصيغة اللغوية الأدق.`,
        `Active sentence: ${activeCase.promptEn} — Choose the accurate structure.`,
      );

  return (
    <SubjectLabFrame
      spec={spec}
      uiLocale={uiLocale}
      contentLocale={contentLocale}
      liveStatusText={liveStatusText}
      headerActions={
        <div
          className="noata-lab-mode-tabs"
          role="group"
          aria-label={tUi("أوضاع مختبر الإنجليزية", "English lab modes")}
        >
          <button
            type="button"
            className={`noata-lab-mode-btn ${mode === "transform" ? "is-active" : ""}`}
            aria-pressed={mode === "transform"}
            onClick={() => {
              setMode("transform");
              setCaseIndex(0);
              setSelectedOption(null);
            }}
          >
            {tUi("تحويل الأزمنة والجمل", "Sentence & Tense Transform")}
          </button>
          <button
            type="button"
            className={`noata-lab-mode-btn ${mode === "collocation" ? "is-active" : ""}`}
            aria-pressed={mode === "collocation"}
            onClick={() => {
              setMode("collocation");
              setCaseIndex(0);
              setSelectedOption(null);
            }}
          >
            {tUi("المعدود والمتلازمات", "Quantifiers & Collocations")}
          </button>
        </div>
      }
    >
      <div className="noata-lab-stack">
        {modeCases.length > 1 ? (
          <div
            className="noata-lab-preset-row"
            role="group"
            aria-label={tUi("تمارين التحويل المتاحة", "Available sentence drills")}
          >
            {modeCases.map((item, idx) => {
              const active = item.id === activeCase.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`noata-lab-preset-btn ${active ? "is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => {
                    setCaseIndex(idx);
                    setSelectedOption(null);
                  }}
                >
                  {tUi(`نموذج ${idx + 1}`, `Drill ${idx + 1}`)}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="noata-lab-inspector-card">
          <div className="noata-lab-english-sentence" dir="ltr">
            {activeCase.promptEn}
          </div>
          {contentLocale === "ar" ? (
            <p className="noata-lab-hint-ar" dir="rtl">
              <Icon name="compass" size={14} />
              <span>تلميح السياق: {activeCase.contextHintAr}</span>
            </p>
          ) : (
            <p className="noata-lab-hint-ar" dir="ltr">
              <Icon name="compass" size={14} />
              <span>Grammar cue: inspect tense agreement, modal necessity, or noun countability.</span>
            </p>
          )}

          <div
            className="noata-lab-preset-row"
            role="radiogroup"
            aria-label={tUi("اختر التركيب اللغوي الصحيح", "Select the grammatical form")}
          >
            {activeCase.options.map((opt) => {
              const active = selectedOption === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  dir="ltr"
                  className={`noata-lab-preset-btn ${active ? "is-active" : ""}`}
                  onClick={() => setSelectedOption(opt)}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {evaluation ? (
            <div
              className={`noata-lab-feedback ${evaluation.ok ? "is-correct" : "is-wrong"}`}
              role="status"
              dir={contentLocale === "ar" ? "rtl" : "ltr"}
            >
              <Icon
                name={evaluation.ok ? "check-circle" : "alert-circle"}
                size={16}
              />
              <span>{tContent(evaluation.reasonAr, evaluation.reasonEn)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </SubjectLabFrame>
  );
}
