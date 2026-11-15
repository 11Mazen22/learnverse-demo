"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  evaluateSyllogismScenario,
  getSubjectLabSpec,
  SYLLOGISM_SCENARIOS,
  type SubjectLabInitialMode,
} from "@/lib/curriculum/subject-labs";
import { SubjectLabFrame } from "./subject-lab-frame";

export type PhilosophyLabProps = {
  initialMode: SubjectLabInitialMode;
  uiLocale: "ar" | "en";
  contentLocale: "ar" | "en";
};

type FallacyCase = {
  id: string;
  titleAr: string;
  titleEn: string;
  statementAr: string;
  statementEn: string;
  tagAr: string;
  tagEn: string;
  diagnosisAr: string;
  diagnosisEn: string;
};

const FALLACY_CASES: FallacyCase[] = [
  {
    id: "thinking-styles",
    titleAr: "التمييز: أسلوب علمي مقابل فلسفي",
    titleEn: "Scientific vs Philosophical Style",
    statementAr:
      "«انكماش الكتلة عند التبريد يُقاس بالميزان والترميم، بينما سؤال (لماذا يسعى الإنسان للعدل رغم مشقته؟) يستكشف الغايات الكلية والقيم.»",
    statementEn:
      "Immediate physical causes rely on observation & measurement (Scientific), whereas ultimate meaning & values belong to Philosophical reflection.",
    tagAr: "تنوع أساليب التفكير",
    tagEn: "Styles of Thinking",
    diagnosisAr:
      "الأسلوب العلمي يفسر العلل القريبة القابلة للقياس، أما الأسلوب الفلسفي فيربط الظواهر في نظرة عقلية كلية.",
    diagnosisEn:
      "Scientific style targets proximate testable causes; Philosophical style investigates overarching principles and value.",
  },
  {
    id: "hasty-gen",
    titleAr: "مغالطة التعميم المتسرّع",
    titleEn: "Hasty Generalization",
    statementAr:
      "«انطفأ جهاز الحاسوب في المختبر الأول واليوم تعطل في المكتبة، إذن جميع الأجهزة التعليمية فاشلة!»",
    statementEn:
      "\"Two laptops froze in the lab today; therefore every school computer is defective!\"",
    tagAr: "مغالطة غير صورية",
    tagEn: "Informal Fallacy",
    diagnosisAr:
      "الانتقال من حالتين فرديتين إلى حكم كلي يشمل كل الأجهزة دون عينة كافية أو فحص السبب يمثل تعميمًا متسرعًا.",
    diagnosisEn:
      "Leaping from two isolated instances to a universal conclusion ignores sample size and confounding causes.",
  },
  {
    id: "ad-hominem",
    titleAr: "مغالطة الشخصنة (مهاجمة القائل)",
    titleEn: "Ad Hominem",
    statementAr:
      "«لا تأخذ بدراسة تحسين جودة المياه لأن الباحث لم يرتدِ معطفًا أنيقًا في المؤتمر.»",
    statementEn:
      "\"Ignore that water-quality data because the researcher dressed casually at the symposium.\"",
    tagAr: "مغالطة غير صورية",
    tagEn: "Informal Fallacy",
    diagnosisAr:
      "مهاجمة مظهر أو شخصية صاحب الحجة بدل مناقشة الأدلة والمنهج تجعل الرد بلا قيمة منطقية.",
    diagnosisEn:
      "Attacking the speaker's appearance or traits rather than addressing the empirical argument is logically irrelevant.",
  },
  {
    id: "straw-man",
    titleAr: "مغالطة رجل القش (تحريف الحجة)",
    titleEn: "Straw Man Fallacy",
    statementAr:
      "«تقول إن علينا تقليل هدر المياه في الري؟ إذن أنت تريد تجفيف الأراضي الزراعية وتجويع المزارعين!»",
    statementEn:
      "\"You recommend reducing irrigation waste? So you want to shut down farming completely and starve everyone!\"",
    tagAr: "مغالطة تشويه الحجة",
    tagEn: "Distortion Fallacy",
    diagnosisAr:
      "تحريف دعوى الخصم إلى موقف متطرف يسهل دحضه ثم مهاجمة الصورة المشوَّهة بدل الحجة الأصلية.",
    diagnosisEn:
      "Replacing the opponent's actual moderate proposal with an exaggerated caricature makes refutation illusory.",
  },
  {
    id: "false-dilemma",
    titleAr: "مغالطة القسمة الزائفة (الأبيض أو الأسود)",
    titleEn: "False Dilemma",
    statementAr:
      "«إما أن تحفظ الدرس حرفيًا دون سؤال، أو أنك سترسب في الامتحان لا محالة!»",
    statementEn:
      "\"Either memorize every page verbatim without questioning, or you are guaranteed to fail the exam!\"",
    tagAr: "حصر وهمي للبدائل",
    tagEn: "False Dichotomy",
    diagnosisAr:
      "افتراض وجود بديلين فقط متنافرين وإهمال بدائل وسطية راجحة مثل الفهم التحليلي وحل المسائل المتدرجة.",
    diagnosisEn:
      "Presenting only two extremes while ignoring viable middle alternatives such as conceptual understanding and guided practice.",
  },
];

export function PhilosophyLab({
  initialMode,
  uiLocale,
  contentLocale,
}: PhilosophyLabProps) {
  const spec = getSubjectLabSpec("philosophy-logic-fallacy");
  const [mode, setMode] = useState<"syllogism" | "fallacy">(
    initialMode === "fallacy" ? "fallacy" : "syllogism",
  );
  const [scenarioId, setScenarioId] = useState<string>("valid-unsound-gold");
  const [fallacyId, setFallacyId] = useState<string>(FALLACY_CASES[0].id);

  const tUi = (ar: string, en: string) => (uiLocale === "ar" ? ar : en);
  const tContent = (ar: string, en: string) => (contentLocale === "ar" ? ar : en);

  const scenario = useMemo(
    () => evaluateSyllogismScenario(scenarioId),
    [scenarioId],
  );
  const fallacy = useMemo(
    () => FALLACY_CASES.find((c) => c.id === fallacyId) ?? FALLACY_CASES[0],
    [fallacyId],
  );

  const liveStatusText =
    mode === "syllogism"
      ? tUi(
          `حالة القياس: ${scenario.isFormallyValid ? "صحيح صوريًا" : "فاسد صوريًا"}، وصدق المقدمات واقعيًا: ${scenario.premisesFactuallyTrue ? "صادق" : "كاذب"}.`,
          `Syllogism: ${scenario.isFormallyValid ? "Formally Valid" : "Formally Invalid"}, Premises factually ${scenario.premisesFactuallyTrue ? "true" : "false"}.`,
        )
      : tUi(
          `تحليل الحالة المنطقية: ${fallacy.titleAr}.`,
          `Inspecting reasoning case: ${fallacy.titleEn}.`,
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
          aria-label={tUi("أوضاع مختبر الفلسفة والمنطق", "Philosophy & Logic lab modes")}
        >
          <button
            type="button"
            className={`noata-lab-mode-btn ${mode === "syllogism" ? "is-active" : ""}`}
            aria-pressed={mode === "syllogism"}
            onClick={() => setMode("syllogism")}
          >
            {tUi("صحة الصورة مقابل صدق الواقع", "Formal Validity vs Truth")}
          </button>
          <button
            type="button"
            className={`noata-lab-mode-btn ${mode === "fallacy" ? "is-active" : ""}`}
            aria-pressed={mode === "fallacy"}
            onClick={() => setMode("fallacy")}
          >
            {tUi("الأساليب والمغالطات", "Styles & Fallacies")}
          </button>
        </div>
      }
    >
      {mode === "syllogism" ? (
        <div className="noata-lab-stack">
          <div
            className="noata-lab-preset-row"
            role="group"
            aria-label={tUi("أمثلة القياس الصوري", "Syllogism test cases")}
          >
            {SYLLOGISM_SCENARIOS.map((item) => {
              const active = item.id === scenario.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`noata-lab-preset-btn ${active ? "is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => setScenarioId(item.id)}
                >
                  {tContent(item.label.ar, item.label.en)}
                </button>
              );
            })}
          </div>

          <div className="noata-lab-inspector-card" dir={contentLocale === "ar" ? "rtl" : "ltr"}>
            <div className="noata-lab-premise-list">
              <div className="noata-lab-premise-card">
                <span>{tUi("المقدمة الكبرى", "Major Premise")}</span>
                <strong>{tContent(scenario.majorPremise.ar, scenario.majorPremise.en)}</strong>
              </div>
              <div className="noata-lab-premise-card">
                <span>{tUi("المقدمة الصغرى", "Minor Premise")}</span>
                <strong>{tContent(scenario.minorPremise.ar, scenario.minorPremise.en)}</strong>
              </div>
              <div className="noata-lab-premise-card is-conclusion">
                <span>{tUi("النتيجة اللازمة", "Conclusion")}</span>
                <strong>{tContent(scenario.conclusion.ar, scenario.conclusion.en)}</strong>
              </div>
            </div>

            <div className="noata-lab-formula-grid">
              <div className="noata-lab-stat">
                <span>{tUi("الحكم المنطقي (الصورة)", "Formal Validity")}</span>
                <strong>
                  {scenario.isFormallyValid
                    ? tUi("صحيح صوريًا", "Formally Valid")
                    : tUi("فاسد صوريًا", "Formally Invalid")}
                </strong>
              </div>
              <div className="noata-lab-stat">
                <span>{tUi("مطابقة الواقع التجريبي", "Empirical Premise Check")}</span>
                <strong>
                  {scenario.premisesFactuallyTrue
                    ? tUi("مقدمات صادقة واقعيًا", "Factually True Premises")
                    : tUi("مقدمة كاذبة تجريبيًا", "Factually False Premise")}
                </strong>
              </div>
            </div>

            <div className="noata-lab-alert" role="status">
              <Icon name={scenario.soundness === "sound" ? "check-circle" : "info"} size={16} />
              <span>{tContent(scenario.explanation.ar, scenario.explanation.en)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="noata-lab-stack">
          <div
            className="noata-lab-preset-row"
            role="group"
            aria-label={tUi("حالات أساليب التفكير والمغالطات", "Reasoning fallacy scenarios")}
          >
            {FALLACY_CASES.map((item) => {
              const active = item.id === fallacy.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`noata-lab-preset-btn ${active ? "is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => setFallacyId(item.id)}
                >
                  {tContent(item.titleAr, item.titleEn)}
                </button>
              );
            })}
          </div>

          <div className="noata-lab-inspector-card" dir={contentLocale === "ar" ? "rtl" : "ltr"}>
            <span className="noata-lab-token-chip">
              {tContent(fallacy.tagAr, fallacy.tagEn)}
            </span>
            <p className="noata-lab-quote">
              {tContent(fallacy.statementAr, fallacy.statementEn)}
            </p>
            <div className="noata-lab-alert" role="status">
              <Icon name="lightbulb" size={16} />
              <span>{tContent(fallacy.diagnosisAr, fallacy.diagnosisEn)}</span>
            </div>
          </div>
        </div>
      )}
    </SubjectLabFrame>
  );
}
