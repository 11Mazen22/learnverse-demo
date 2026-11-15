"use client";

import { useMemo, useState } from "react";
import { StudyRichText } from "@/components/study/study-rich-text";
import type { StructuredStudyBlock } from "@/lib/curriculum/structured-content";
import {
  ARABIC_IRAB_SENTENCES,
  getSubjectLabSpec,
  type SubjectLabInitialMode,
} from "@/lib/curriculum/subject-labs";
import { SubjectLabFrame } from "./subject-lab-frame";

export type ArabicLabProps = {
  initialMode: SubjectLabInitialMode;
  uiLocale: "ar" | "en";
  contentLocale: "ar" | "en";
};

type PoetryFocusItem = {
  id: string;
  labelAr: string;
  labelEn: string;
  categoryAr: string;
  categoryEn: string;
  analysisAr: string;
  analysisEn: string;
};

const POETRY_FOCUS_ITEMS: PoetryFocusItem[] = [
  {
    id: "jussive-lam",
    labelAr: "لم يدنسْ",
    labelEn: "lam yadnas (لم يدنسْ)",
    categoryAr: "إعراب الفعل المضارع",
    categoryEn: "Jussive Present Verb",
    analysisAr:
      "فعل مضارع مجزوم بعد (لم) وعلامة جزمه السكون الظاهر لأنه صحيح الآخر، و(لم) تفيد نفي الحدث وقلبه للماضي.",
    analysisEn:
      "Present verb placed in the jussive mood by 'lam' with a visible sukun because its final radical is sound.",
  },
  {
    id: "tashbih-baligh",
    labelAr: "كل رداءٍ يرتديه",
    labelEn: "Every garment worn (رِداء)",
    categoryAr: "بلاغة واستعارة تصريحية",
    categoryEn: "Imagery & Metaphor",
    analysisAr:
      "استعارة وتصوير معنوي للصفات والأخلاق وكأنها ثياب يرتديها الإنسان؛ فإن صان عرضه حسُن كل ثوب يظهر به.",
    analysisEn:
      "Moral character is pictured as garments worn by a person; preserving honor makes every trait appear noble.",
  },
  {
    id: "sarf-jamil",
    labelAr: "جميل (صيغة فعيل)",
    labelEn: "jamīl (فَعِيل pattern)",
    categoryAr: "صرف ومعنى الصفة",
    categoryEn: "Morphological Pattern",
    analysisAr:
      "صفة مشبهة باسم الفاعل على وزن (فعيل) تفيد الثبوت والدوام لا مجرد الحدث الطارئ، وهو خبر «كلُّ» مرفوع بالضمة.",
    analysisEn:
      "Stative adjective on the 'faʿīl' pattern denoting an enduring quality, serving here as the nominative predicate.",
  },
];

const SAMAWAL_POETRY_BLOCK: StructuredStudyBlock[] = [
  {
    type: "poetry_couplet",
    hemistich1: "إِذا المَرءُ لَم يَدنَس مِنَ اللُؤمِ عِرضُهُ",
    hemistich2: "فَكُلُّ رِداءٍ يَرتَديهِ جَميلُ",
    meter: "البحر الطويل",
    poet: "السموأل",
    blockId: "lab-samawal-verse-1",
    conceptId: "arabic-samawal-poetry",
  },
];

export function ArabicLab({
  initialMode,
  uiLocale,
  contentLocale,
}: ArabicLabProps) {
  const spec = getSubjectLabSpec("arabic-irab-poetry");
  const [mode, setMode] = useState<"irab" | "poetry">(
    initialMode === "poetry" ? "poetry" : "irab",
  );
  const [sentenceId, setSentenceId] = useState<string>(ARABIC_IRAB_SENTENCES[0].id);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(0);
  const [selectedPoetryId, setSelectedPoetryId] = useState<string>(POETRY_FOCUS_ITEMS[0].id);

  const tUi = (ar: string, en: string) => (uiLocale === "ar" ? ar : en);
  const tContent = (ar: string, en: string) => (contentLocale === "ar" ? ar : en);

  const activeSentence = useMemo(
    () =>
      ARABIC_IRAB_SENTENCES.find((s) => s.id === sentenceId) ??
      ARABIC_IRAB_SENTENCES[0],
    [sentenceId],
  );

  const safeTokenIndex =
    selectedTokenIndex >= 0 && selectedTokenIndex < activeSentence.tokens.length
      ? selectedTokenIndex
      : 0;
  const activeToken = activeSentence.tokens[safeTokenIndex];

  const activePoetryFocus = useMemo(
    () =>
      POETRY_FOCUS_ITEMS.find((p) => p.id === selectedPoetryId) ??
      POETRY_FOCUS_ITEMS[0],
    [selectedPoetryId],
  );

  const liveStatusText =
    mode === "irab"
      ? tUi(
          `تحليل كلمة «${activeToken.word}»: ${activeToken.roleAr}، وعلامة الإعراب: ${activeToken.markerAr}.`,
          `Parsing '${activeToken.word}': ${activeToken.roleAr} (${activeToken.markerAr}).`,
        )
      : tUi(
          `موضع التحليل الشعري: ${activePoetryFocus.labelAr} (${activePoetryFocus.categoryAr}).`,
          `Poetry analysis focus: ${activePoetryFocus.labelEn} (${activePoetryFocus.categoryEn}).`,
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
          aria-label={tUi("أوضاع مختبر اللغة العربية", "Arabic lab modes")}
        >
          <button
            type="button"
            className={`noata-lab-mode-btn ${mode === "irab" ? "is-active" : ""}`}
            aria-pressed={mode === "irab"}
            onClick={() => setMode("irab")}
          >
            {tUi("تفكيك الإعراب والنواسخ", "I'rab & Syntax Tokens")}
          </button>
          <button
            type="button"
            className={`noata-lab-mode-btn ${mode === "poetry" ? "is-active" : ""}`}
            aria-pressed={mode === "poetry"}
            onClick={() => setMode("poetry")}
          >
            {tUi("تذوق البيت والبلاغة", "Classical Poetry & Rhetoric")}
          </button>
        </div>
      }
    >
      {mode === "irab" ? (
        <div className="noata-lab-stack">
          <div
            className="noata-lab-preset-row"
            role="group"
            aria-label={tUi("اختر جملة للإعراب", "Choose Arabic sentence")}
          >
            {ARABIC_IRAB_SENTENCES.map((sentence) => {
              const active = sentence.id === activeSentence.id;
              return (
                <button
                  key={sentence.id}
                  type="button"
                  className={`noata-lab-preset-btn ${active ? "is-active" : ""}`}
                  aria-pressed={active}
                  dir="rtl"
                  onClick={() => {
                    setSentenceId(sentence.id);
                    setSelectedTokenIndex(0);
                  }}
                >
                  <span>{sentence.sentenceTypeAr}</span>
                </button>
              );
            })}
          </div>

          <div className="noata-lab-arabic-stage" dir="rtl">
            <div className="noata-lab-arabic-type">{activeSentence.sentenceTypeAr}</div>
            <div
              className="noata-lab-token-row"
              role="group"
              aria-label={tUi("كلمات الجملة التفاعلية", "Interactive sentence words")}
            >
              {activeSentence.tokens.map((tok, index) => {
                const active = index === safeTokenIndex;
                return (
                  <button
                    key={`${activeSentence.id}-${tok.word}`}
                    type="button"
                    className={`noata-lab-token-btn ${active ? "is-active" : ""}`}
                    aria-pressed={active}
                    onClick={() => setSelectedTokenIndex(index)}
                  >
                    <span className="noata-lab-token-word">{tok.word}</span>
                    <span className="noata-lab-token-chip">{tok.roleAr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="noata-lab-inspector-card" dir={contentLocale === "ar" ? "rtl" : "ltr"}>
            <div className="noata-lab-formula-grid">
              <div className="noata-lab-stat">
                <span>{tUi("الموقع الإعرابي", "Syntactic Role")}</span>
                <strong dir="rtl">{activeToken.roleAr}</strong>
              </div>
              <div className="noata-lab-stat">
                <span>{tUi("علامة الإعراب", "Case Marker")}</span>
                <strong dir="rtl">{activeToken.markerAr}</strong>
              </div>
            </div>
            <p className="noata-lab-explanation">
              {tContent(activeToken.explanationAr, activeToken.explanationEn)}
            </p>
          </div>
        </div>
      ) : (
        <div className="noata-lab-stack">
          <div dir="rtl">
            <StudyRichText blocks={SAMAWAL_POETRY_BLOCK} dir="rtl" locale="ar" />
          </div>

          <div
            className="noata-lab-preset-row"
            role="group"
            aria-label={tUi("مواطن التحليل النحوي والبلاغي", "Verse analysis spotlights")}
          >
            {POETRY_FOCUS_ITEMS.map((item) => {
              const active = item.id === activePoetryFocus.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`noata-lab-preset-btn ${active ? "is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => setSelectedPoetryId(item.id)}
                >
                  {uiLocale === "ar" ? item.labelAr : item.labelEn}
                </button>
              );
            })}
          </div>

          <div className="noata-lab-inspector-card" dir={contentLocale === "ar" ? "rtl" : "ltr"}>
            <div className="noata-lab-stat">
              <span>
                {tUi("الزاوية التحليلية", "Analytical Lens")}
              </span>
              <strong>
                {tContent(activePoetryFocus.categoryAr, activePoetryFocus.categoryEn)}
              </strong>
            </div>
            <p className="noata-lab-explanation">
              {tContent(activePoetryFocus.analysisAr, activePoetryFocus.analysisEn)}
            </p>
          </div>
        </div>
      )}
    </SubjectLabFrame>
  );
}
