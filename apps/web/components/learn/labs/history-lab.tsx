"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  evaluateSourceReliabilityRubric,
  getSubjectLabSpec,
  SOURCE_RUBRIC_MAX_WEIGHTS,
  type SourceRubricInput,
  type SubjectLabInitialMode,
} from "@/lib/curriculum/subject-labs";
import { SubjectLabFrame } from "./subject-lab-frame";

export type HistoryLabProps = {
  initialMode: SubjectLabInitialMode;
  uiLocale: "ar" | "en";
  contentLocale: "ar" | "en";
};

type ArtefactPreset = {
  id: string;
  labelAr: string;
  labelEn: string;
  kindAr: string;
  kindEn: string;
  summaryAr: string;
  summaryEn: string;
  weights: SourceRubricInput;
};

const ARTEFACT_PRESETS: ArtefactPreset[] = [
  {
    id: "royal-stela",
    labelAr: "لوحة نصر ملكية معاصرة",
    labelEn: "Contemporary Royal Victory Stela",
    kindAr: "مصدر أولي",
    kindEn: "Primary Source",
    summaryAr:
      "نقش أثري معاصر للحدث وماديًا أصيل، لكنه كُتب لتمجيد الحاكم ويحتاج مقارنة بمصادر مستقلة.",
    summaryEn:
      "Physically authentic and contemporary primary inscription, yet written as royal propaganda needing cross-checks.",
    weights: {
      authenticity: 19,
      eyewitnessProximity: 18,
      biasControl: 5,
      contextualClarity: 12,
      corroboration: 6,
      preservation: 13,
    },
  },
  {
    id: "admin-ledger",
    labelAr: "أوستراكا ضرائب ووثيقة إدارية",
    labelEn: "Tax Ostracon & Administrative Ledger",
    kindAr: "مصدر أولي إداري",
    kindEn: "Administrative Primary",
    summaryAr:
      "سجل يومي لمعاملات غير دعائية؛ ضعيف المبالغة السياسية وتؤيده أختام وحسابات مخازن معاصرة.",
    summaryEn:
      "Routine non-propagandistic ledger with contemporary seals and archaeological corroboration.",
    weights: {
      authenticity: 19,
      eyewitnessProximity: 19,
      biasControl: 14,
      contextualClarity: 13,
      corroboration: 14,
      preservation: 13,
    },
  },
  {
    id: "later-chronicle",
    labelAr: "كتاب مؤرخ بعد قرون (مصدر ثانوي)",
    labelEn: "Historian Writing Centuries Later",
    kindAr: "مصدر ثانوي",
    kindEn: "Secondary Source",
    summaryAr:
      "تفسير لاحق مفيد في الرؤية العامة، لكنه بعيد زمنيًا ويستلزم التحقق من مصادره الأولى.",
    summaryEn:
      "Valuable synthetic interpretation centuries afterward; must be traced back to contemporary primary records.",
    weights: {
      authenticity: 15,
      eyewitnessProximity: 6,
      biasControl: 10,
      contextualClarity: 12,
      corroboration: 11,
      preservation: 12,
    },
  },
];

type TimelineEra = {
  id: string;
  eraAr: string;
  eraEn: string;
  span: string;
  hallmarksAr: string;
  hallmarksEn: string;
  centerOfGravityAr: string;
  centerOfGravityEn: string;
};

const TIMELINE_ERAS: TimelineEra[] = [
  {
    id: "ancient",
    eraAr: "العصور القديمة",
    eraEn: "Ancient Era",
    span: "3300 BCE – 476 CE",
    hallmarksAr: "اختراع الكتابة، قيام الحضارات الكبرى في مصر والعراق وفارس واليونان والرومان، الزراعة والاستقرار.",
    hallmarksEn: "Invention of writing, Nile & Mesopotamian civilizations, classical Mediterranean empires, monumental architecture.",
    centerOfGravityAr: "الشرق الأدنى وحوض المتوسط (مصر، الرافدين، اليونان، روما)",
    centerOfGravityEn: "Near East & Mediterranean (Egypt, Mesopotamia, Greece, Rome)",
  },
  {
    id: "medieval",
    eraAr: "العصور الوسطى",
    eraEn: "Medieval Era",
    span: "476 CE – 1453 CE",
    hallmarksAr: "ازدهار الحضارة الإسلامية علميًا وترجمةً وابتكارًا، ونظام الإقطاع والكنيسة في أوروبا حتى فتح القسطنطينية.",
    hallmarksEn: "Islamic Golden Age scholarship & trade networks alongside feudal Europe, ending with 1453 Constantinople.",
    centerOfGravityAr: "عواصم العالم الإسلامي (بغداد، قرطبة، القاهرة، دمشق)",
    centerOfGravityEn: "Centers of Islamic civilization (Baghdad, Cairo, Cordoba, Damascus)",
  },
  {
    id: "modern",
    eraAr: "التاريخ الحديث",
    eraEn: "Early Modern & Modern Era",
    span: "1453 CE – 1914 CE",
    hallmarksAr: "النهضة الأوروبية، الكشوف الجغرافية، الثورة الصناعية وحركة الاستعمار، وصولًا إلى الحرب العالمية الأولى.",
    hallmarksEn: "European Renaissance, maritime voyages, Industrial Revolution, colonial expansion up to WWI.",
    centerOfGravityAr: "الانتقال إلى القوى الأوروبية الأطلسية",
    centerOfGravityEn: "Shift toward Atlantic European industrial powers",
  },
  {
    id: "contemporary",
    eraAr: "التاريخ المعاصر",
    eraEn: "Contemporary History",
    span: "1914 CE – Present",
    hallmarksAr: "حركات التحرر الوطني من الاستعمار، الثورة التكنولوجية والمعلوماتية، الهبوط على القمر، وتحديات العولمة.",
    hallmarksEn: "Anti-colonial independence movements, digital/space revolution, globalization & environmental challenges.",
    centerOfGravityAr: "ترابط عالمي وتعدد مراكز المعرفة",
    centerOfGravityEn: "Interconnected global network & multipolar hubs",
  },
];

export function HistoryLab({
  initialMode,
  uiLocale,
  contentLocale,
}: HistoryLabProps) {
  const spec = getSubjectLabSpec("history-source-timeline");
  const [mode, setMode] = useState<"rubric" | "timeline">(
    initialMode === "timeline" ? "timeline" : "rubric",
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>(ARTEFACT_PRESETS[0].id);
  const [weights, setWeights] = useState<SourceRubricInput>(ARTEFACT_PRESETS[0].weights);
  const [selectedEraId, setSelectedEraId] = useState<string>(TIMELINE_ERAS[0].id);

  const tUi = (ar: string, en: string) => (uiLocale === "ar" ? ar : en);
  const tContent = (ar: string, en: string) => (contentLocale === "ar" ? ar : en);

  const evaluation = useMemo(
    () => evaluateSourceReliabilityRubric(weights),
    [weights],
  );

  const activePreset = useMemo(
    () => ARTEFACT_PRESETS.find((p) => p.id === selectedPresetId) ?? ARTEFACT_PRESETS[0],
    [selectedPresetId],
  );

  const activeEra = useMemo(
    () => TIMELINE_ERAS.find((e) => e.id === selectedEraId) ?? TIMELINE_ERAS[0],
    [selectedEraId],
  );

  const criteriaList: Array<{
    key: keyof SourceRubricInput;
    max: number;
    labelAr: string;
    labelEn: string;
  }> = [
    { key: "authenticity", max: SOURCE_RUBRIC_MAX_WEIGHTS.authenticity, labelAr: "الأصالة المادية", labelEn: "Authenticity" },
    { key: "eyewitnessProximity", max: SOURCE_RUBRIC_MAX_WEIGHTS.eyewitnessProximity, labelAr: "القرب الزمني والمعاصرة", labelEn: "Eyewitness Proximity" },
    { key: "biasControl", max: SOURCE_RUBRIC_MAX_WEIGHTS.biasControl, labelAr: "انخفاض التحيز الدعائي", labelEn: "Low Bias / Neutrality" },
    { key: "contextualClarity", max: SOURCE_RUBRIC_MAX_WEIGHTS.contextualClarity, labelAr: "وضوح السياق والغرض", labelEn: "Contextual Clarity" },
    { key: "corroboration", max: SOURCE_RUBRIC_MAX_WEIGHTS.corroboration, labelAr: "التأييد بمصادر مستقلة", labelEn: "Corroboration" },
    { key: "preservation", max: SOURCE_RUBRIC_MAX_WEIGHTS.preservation, labelAr: "اكتمال النص وحفظه", labelEn: "Preservation State" },
  ];

  const bandLabel =
    evaluation.band === "high"
      ? tUi("موثوقية مرتفعة (مع مراجعة السياق)", "High Reliability")
      : evaluation.band === "moderate"
        ? tUi("موثوقية متوسطة — يتطلب مقارنة", "Moderate — Needs Cross-Check")
        : tUi("حذر شديد — مؤشرات تحيز أو فجوات", "Caution — High Risk / Gaps");

  const liveStatusText =
    mode === "rubric"
      ? tUi(
          `درجة موثوقية المصدر: ${evaluation.totalScore} من 100 (${bandLabel}).`,
          `Source reliability rubric score: ${evaluation.totalScore}/100 (${bandLabel}).`,
        )
      : tUi(
          `العصر المختار: ${activeEra.eraAr} (${activeEra.span}).`,
          `Selected historical era: ${activeEra.eraEn} (${activeEra.span}).`,
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
          aria-label={tUi("أوضاع مختبر التاريخ", "History lab modes")}
        >
          <button
            type="button"
            className={`noata-lab-mode-btn ${mode === "rubric" ? "is-active" : ""}`}
            aria-pressed={mode === "rubric"}
            onClick={() => setMode("rubric")}
          >
            {tUi("ميزان تقييم المصادر (100)", "Source Reliability Rubric")}
          </button>
          <button
            type="button"
            className={`noata-lab-mode-btn ${mode === "timeline" ? "is-active" : ""}`}
            aria-pressed={mode === "timeline"}
            onClick={() => setMode("timeline")}
          >
            {tUi("خط العصور وانتقال الحضارة", "Eras & Civilization Shifts")}
          </button>
        </div>
      }
    >
      {mode === "rubric" ? (
        <div className="noata-lab-stack">
          <div
            className="noata-lab-preset-row"
            role="group"
            aria-label={tUi("نماذج مصادر تاريخية", "Historical artefact presets")}
          >
            {ARTEFACT_PRESETS.map((preset) => {
              const active = preset.id === activePreset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`noata-lab-preset-btn ${active ? "is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => {
                    setSelectedPresetId(preset.id);
                    setWeights(preset.weights);
                  }}
                >
                  {tContent(preset.labelAr, preset.labelEn)}
                </button>
              );
            })}
          </div>

          <div className="noata-lab-inspector-card" dir={contentLocale === "ar" ? "rtl" : "ltr"}>
            <div className="noata-lab-score-banner">
              <div>
                <span className="noata-lab-token-chip">
                  {tContent(activePreset.kindAr, activePreset.kindEn)}
                </span>
                <p className="noata-lab-explanation">
                  {tContent(activePreset.summaryAr, activePreset.summaryEn)}
                </p>
              </div>
              <div className="noata-lab-score-pill" data-band={evaluation.band}>
                <strong>
                  {evaluation.totalScore} / {evaluation.maxScore}
                </strong>
                <span>{bandLabel}</span>
              </div>
            </div>

            {evaluation.needsCrossCheckWarning ? (
              <div className="noata-lab-alert" role="status">
                <Icon name="alert-triangle" size={16} />
                <span>
                  {tUi(
                    "تنبيه نقدي: درجة الحياد أو التأييد المستقل منخفضة؛ حتى المصدر الأولي الأصيل قد يبالغ في روايته دون مقارنة.",
                    "Critical Warning: Weak bias-control or corroboration score — even an authentic primary source requires external cross-checking.",
                  )}
                </span>
              </div>
            ) : null}

            <div className="noata-lab-rubric-grid">
              {criteriaList.map((crit) => {
                const value = evaluation.clampedWeights[crit.key];
                const inputId = `history-rubric-${crit.key}`;
                return (
                  <div key={crit.key} className="noata-lab-slider-field">
                    <label htmlFor={inputId}>
                      <span>{uiLocale === "ar" ? crit.labelAr : crit.labelEn}</span>
                      <strong>
                        {value} / {crit.max}
                      </strong>
                    </label>
                    <input
                      id={inputId}
                      type="range"
                      min={0}
                      max={crit.max}
                      step={1}
                      value={value}
                      onChange={(e) => {
                        const nextVal = Number(e.target.value);
                        setWeights((prev) => ({ ...prev, [crit.key]: nextVal }));
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="noata-lab-stack">
          <div
            className="noata-lab-preset-row"
            role="group"
            aria-label={tUi("العصور التاريخية الأربعة", "Four historical eras")}
          >
            {TIMELINE_ERAS.map((era) => {
              const active = era.id === activeEra.id;
              return (
                <button
                  key={era.id}
                  type="button"
                  className={`noata-lab-preset-btn ${active ? "is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => setSelectedEraId(era.id)}
                >
                  <span>{tContent(era.eraAr, era.eraEn)}</span>
                </button>
              );
            })}
          </div>

          <div className="noata-lab-inspector-card" dir={contentLocale === "ar" ? "rtl" : "ltr"}>
            <div className="noata-lab-formula-grid">
              <div className="noata-lab-stat">
                <span>{tUi("النطاق الزمني", "Time Span")}</span>
                <strong dir="ltr">{activeEra.span}</strong>
              </div>
              <div className="noata-lab-stat">
                <span>{tUi("مركز الثقل الحضاري", "Civilizational Center")}</span>
                <strong>{tContent(activeEra.centerOfGravityAr, activeEra.centerOfGravityEn)}</strong>
              </div>
            </div>
            <p className="noata-lab-explanation">
              {tContent(activeEra.hallmarksAr, activeEra.hallmarksEn)}
            </p>
          </div>
        </div>
      )}
    </SubjectLabFrame>
  );
}
