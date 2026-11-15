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
  specimenId: "samawal" | "antara";
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
    specimenId: "samawal",
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
    specimenId: "samawal",
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
    specimenId: "samawal",
    labelAr: "جميل (صيغة فعيل)",
    labelEn: "jamīl (فَعِيل pattern)",
    categoryAr: "صرف ومعنى الصفة",
    categoryEn: "Morphological Pattern",
    analysisAr:
      "صفة مشبهة باسم الفاعل على وزن (فعيل) تفيد الثبوت والدوام لا مجرد الحدث الطارئ، وهو خبر «كلُّ» مرفوع بالضمة.",
    analysisEn:
      "Stative adjective on the 'faʿīl' pattern denoting an enduring quality, serving here as the nominative predicate.",
  },
  {
    id: "antara-simile",
    specimenId: "antara",
    labelAr: "سيوفًا كالشُّهبِ (تشبيه)",
    labelEn: "Swords like meteors (Simile)",
    categoryAr: "التشبيه البليغ والأركان",
    categoryEn: "Rhetorical Simile",
    analysisAr:
      "تشبيه تام الأركان: المشبّه (السيوف)، وأداة التشبيه (الكاف)، والمشبّه به (الشُّهب)، ووجه الشبه اللمعان والسرعة لإبراز الفروسية.",
    analysisEn:
      "Full simile comparing swords to bright meteors with the particle كـ to evoke speed and heroic brilliance.",
  },
  {
    id: "antara-khabar",
    specimenId: "antara",
    labelAr: "فإني (التوكيد بإنَّ)",
    labelEn: "Emphasis via إِنَّ",
    categoryAr: "أسلوب التوكيد والخبر",
    categoryEn: "Nominal Emphasis",
    analysisAr:
      "توكيد الخبر بالحرف الناسخ (إنّ) واسمها الضمير المتصل (ياء المتكلم)، ما يرسخ ثقة الفارس بنفسه أمام قومه.",
    analysisEn:
      "The particle إِنَّ strengthens the assertion with its attached pronoun subject, reinforcing self-confidence.",
  },
];

const POETRY_SPECIMENS: Record<"samawal" | "antara", { titleAr: string; titleEn: string; block: StructuredStudyBlock[] }> = {
  samawal: {
    titleAr: "السموأل — الفخر والوفاء",
    titleEn: "Al-Samaw'al — Honor & Steadfastness",
    block: [
      {
        type: "poetry_couplet",
        hemistich1: "إِذا المَرءُ لَم يَدنَس مِنَ اللُؤمِ عِرضُهُ",
        hemistich2: "فَكُلُّ رِداءٍ يَرتَديهِ جَميلُ",
        meter: "البحر الطويل",
        poet: "السموأل",
        blockId: "lab-samawal-verse-1",
        conceptId: "arabic-samawal-poetry",
      },
    ],
  },
  antara: {
    titleAr: "عنترة بن شداد — شجاعة وفروسية",
    titleEn: "Antarah ibn Shaddad — Valor & Chivalry",
    block: [
      {
        type: "poetry_couplet",
        hemistich1: "ولَقَد ذَكَرتُكِ والرِّماحُ نَواهِلٌ",
        hemistich2: "مِنّي وبيضُ الهِندِ تَقطُرُ مِن دَمي",
        meter: "البحر الكامل",
        poet: "عنترة بن شداد",
        blockId: "lab-antara-verse-1",
        conceptId: "arabic-antara-poetry",
      },
    ],
  },
};

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
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);
  const [revealedTokens, setRevealedTokens] = useState<Record<string, boolean>>({});
  const [poetrySpecimen, setPoetrySpecimen] = useState<"samawal" | "antara">("samawal");
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
    selectedTokenIndex !== null &&
    selectedTokenIndex >= 0 &&
    selectedTokenIndex < activeSentence.tokens.length
      ? selectedTokenIndex
      : null;
  const activeToken = safeTokenIndex !== null ? activeSentence.tokens[safeTokenIndex] : null;

  const specimenFocusItems = useMemo(
    () => POETRY_FOCUS_ITEMS.filter((p) => p.specimenId === poetrySpecimen),
    [poetrySpecimen],
  );

  const activePoetryFocus = useMemo(
    () =>
      specimenFocusItems.find((p) => p.id === selectedPoetryId) ??
      specimenFocusItems[0],
    [specimenFocusItems, selectedPoetryId],
  );

  const liveStatusText =
    mode === "irab"
      ? activeToken
        ? tUi(
            `تحليل كلمة «${activeToken.word}»: ${activeToken.roleAr}، وعلامة الإعراب: ${activeToken.markerAr}.`,
            `Parsing '${activeToken.word}': ${activeToken.roleAr} (${activeToken.markerAr}).`,
          )
        : tUi(
            `اختر أي كلمة في جملة «${activeSentence.textAr}» لكشف موقعها الإعرابي دون حرق الإجابة.`,
            `Select any word in "${activeSentence.textAr}" to reveal its syntactic parsing.`,
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
                    setSelectedTokenIndex(null);
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
                const tokenKey = `${activeSentence.id}:${index}`;
                const active = index === safeTokenIndex;
                const isRevealed = Boolean(revealedTokens[tokenKey]);
                return (
                  <button
                    key={`${activeSentence.id}-${tok.word}`}
                    type="button"
                    className={`noata-lab-token-btn ${active ? "is-active" : ""}`}
                    aria-pressed={active}
                    onClick={() => {
                      setSelectedTokenIndex(index);
                      setRevealedTokens((prev) => ({ ...prev, [tokenKey]: true }));
                    }}
                  >
                    <span className="noata-lab-token-word">{tok.word}</span>
                    <span className="noata-lab-token-chip">
                      {isRevealed ? tok.roleAr : tUi("اكشف الإعراب", "Reveal role")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="noata-lab-inspector-card" dir={contentLocale === "ar" ? "rtl" : "ltr"}>
            {activeToken ? (
              <>
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
              </>
            ) : (
              <p className="noata-lab-explanation">
                {tUi(
                  "اختبر توقّعك الإعرابي أولًا ثم اضغط على أي كلمة بالأعلى لكشف موقعها وعلامتها وسبب الإعراب.",
                  "Predict the grammatical role first, then tap any Arabic word above to reveal its role, case marker, and explanation.",
                )}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="noata-lab-stack">
          <div
            className="noata-lab-preset-row"
            role="group"
            aria-label={tUi("اختر النص الشعري", "Select poetry specimen")}
          >
            {(["samawal", "antara"] as const).map((key) => {
              const active = poetrySpecimen === key;
              const entry = POETRY_SPECIMENS[key];
              return (
                <button
                  key={key}
                  type="button"
                  className={`noata-lab-preset-btn ${active ? "is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => {
                    setPoetrySpecimen(key);
                    const first = POETRY_FOCUS_ITEMS.find((p) => p.specimenId === key);
                    if (first) setSelectedPoetryId(first.id);
                  }}
                >
                  {tContent(entry.titleAr, entry.titleEn)}
                </button>
              );
            })}
          </div>

          <div dir="rtl">
            <StudyRichText blocks={POETRY_SPECIMENS[poetrySpecimen].block} dir="rtl" locale="ar" />
          </div>

          <div
            className="noata-lab-preset-row"
            role="group"
            aria-label={tUi("مواطن التحليل النحوي والبلاغي", "Verse analysis spotlights")}
          >
            {specimenFocusItems.map((item) => {
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
