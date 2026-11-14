"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudyStageCanvas } from "@/components/ui/patterns";
import { useToast } from "@/components/ui/toast";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { previewIntervalsForCard, type RecallRating } from "@/lib/study/scheduler";
import {
  getClozeAnswers,
  parseClozeGroups,
  renderClozeSegments,
  stripClozeMarkup,
} from "@/lib/study/cloze";
import { matchAnswer, type MatchResult } from "@/lib/study/answer-matcher";
import type { FlashcardMetadata } from "@/lib/study/metadata";
import { StudyRichText } from "./study-rich-text";

export type StudioCardItem = {
  id: string;
  front: string;
  back: string;
  cardType?: "term_definition" | "question_answer" | "cloze" | string;
  clozeText?: string | null;
  hint?: string;
  concept?: string;
  mnemonic?: string;
  explanation?: string;
  state?: string;
  intervalDays?: number;
  easeFactor?: number;
  repetitions?: number;
  lapses?: number;
  suspended?: boolean;
  metadata?: FlashcardMetadata;
};

export type FlashcardStudioProps = {
  deckTitle?: string;
  cards: StudioCardItem[];
  sessionKind?: "spaced" | "cram";
  canPersistRatings?: boolean;
  onRateCard?: (cardId: string, rating: RecallRating) => Promise<boolean> | boolean | Promise<void> | void;
  onSuspendCard?: (cardId: string, suspended: boolean) => Promise<boolean> | Promise<void> | void;
  onLogMistake?: (entry: {
    cardId: string;
    sourceType: "cloze" | "typed_recall" | "flashcard";
    topic: string;
    prompt: string;
    userAnswer: string;
    expectedAnswer: string;
    explanation: string;
  }) => void;
  onFinish?: () => void;
  busy?: boolean;
};

function shuffleIndices(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function FlashcardReviewStudio({
  deckTitle,
  cards,
  sessionKind = "spaced",
  canPersistRatings = true,
  onRateCard,
  onSuspendCard,
  onLogMistake,
  onFinish,
  busy = false,
}: FlashcardStudioProps) {
  const t = useTranslation();
  const locale = useLocale() === "en" ? "en" : "ar";
  const { push } = useToast();

  const [practiceMode, setPracticeMode] = useState<"spaced" | "cram">(sessionKind);
  const [recallStyle, setRecallStyle] = useState<"flip" | "cloze" | "typed">("flip");
  const [swapSides, setSwapSides] = useState(false);
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [cursor, setCursor] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [ratingsHistory, setRatingsHistory] = useState<RecallRating[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Cloze & typed recall state
  const [clozeCursor, setClozeCursor] = useState(0);
  const [typedInput, setTypedInput] = useState("");
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [overrideExact, setOverrideExact] = useState(false);

  // Sync card order only when card IDs list changes meaningfully
  const cardsSignature = useMemo(() => cards.map((c) => c.id).join("|"), [cards]);
  useEffect(() => {
    setOrder(cards.map((_, i) => i));
    setCursor(0);
    setIsFlipped(false);
    setShowHint(false);
    setReviewedCount(0);
    setRatingsHistory([]);
    setIsComplete(false);
    setClozeCursor(0);
    setTypedInput("");
    setMatchResult(null);
    setOverrideExact(false);
  }, [cardsSignature, cards.length]);

  const activeCardIndex = order[cursor] ?? 0;
  const currentCard = cards[activeCardIndex] ?? null;
  const totalCards = order.length;

  const clozeSource = currentCard?.clozeText || currentCard?.front || "";
  const parsedCloze = useMemo(() => parseClozeGroups(clozeSource), [clozeSource]);
  const isClozeCard = parsedCloze.hasCloze && (recallStyle === "cloze" || currentCard?.cardType === "cloze");
  const activeClozeIndex = parsedCloze.indices[Math.min(clozeCursor, Math.max(0, parsedCloze.indices.length - 1))] ?? 1;

  const effectiveFront = swapSides && !isClozeCard ? currentCard?.back ?? "" : currentCard?.front ?? "";
  const effectiveBack = swapSides && !isClozeCard ? currentCard?.front ?? "" : currentCard?.back ?? "";
  const cardHint = currentCard?.metadata?.hint || currentCard?.hint || "";
  const cardMnemonic = currentCard?.metadata?.mnemonic || currentCard?.mnemonic || "";
  const cardExplanation = currentCard?.metadata?.explanation || currentCard?.explanation || "";

  const intervalPreviews = useMemo(
    () =>
      previewIntervalsForCard(
        {
          intervalDays: currentCard?.intervalDays ?? 0,
          easeFactor: currentCard?.easeFactor ?? 2.5,
          repetitions: currentCard?.repetitions ?? 0,
          lapses: currentCard?.lapses ?? 0,
        },
        locale,
      ),
    [currentCard?.easeFactor, currentCard?.intervalDays, currentCard?.lapses, currentCard?.repetitions, locale],
  );

  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const clean = stripClozeMarkup(text);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = /[\u0600-\u06FF]/.test(clean) ? "ar-SA" : "en-US";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }, []);

  const advanceCardState = useCallback(() => {
    setIsFlipped(false);
    setShowHint(false);
    setTypedInput("");
    setMatchResult(null);
    setOverrideExact(false);
    setClozeCursor(0);
    if (cursor + 1 < totalCards) {
      setCursor((prev) => prev + 1);
    } else {
      setIsComplete(true);
      onFinish?.();
    }
  }, [cursor, onFinish, totalCards]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleSceneClick = useCallback(() => {
    const selected = typeof window !== "undefined" ? window.getSelection()?.toString()?.trim() : "";
    if (selected && selected.length > 0) return; // Allow selecting/copying text inside card freely
    handleFlip();
  }, [handleFlip]);

  const handleRate = useCallback(
    async (rating: RecallRating) => {
      if (!currentCard || busy) return;

      // In spaced repetition mode, await server/caller confirmation BEFORE mutating counters or advancing!
      if (practiceMode === "spaced" && onRateCard) {
        const result = await onRateCard(currentCard.id, rating);
        if (result === false) {
          return;
        }
      }

      if (rating === 0 && onLogMistake) {
        onLogMistake({
          cardId: currentCard.id,
          sourceType: isClozeCard ? "cloze" : recallStyle === "typed" ? "typed_recall" : "flashcard",
          topic: deckTitle || currentCard.concept || t("مراجعة بطاقات", "Flashcards"),
          prompt: isClozeCard ? clozeSource : effectiveFront,
          userAnswer: typedInput.trim() || t("مراجعة فائتة (مرة أخرى)", "Rated Again"),
          expectedAnswer: isClozeCard
            ? getClozeAnswers(clozeSource, activeClozeIndex).map((a) => a.answer).join(" · ")
            : effectiveBack,
          explanation: cardExplanation,
        });
      }

      // Advance multi-group cloze steps inside same card during cram/cloze study if desired
      if (isClozeCard && clozeCursor + 1 < parsedCloze.indices.length && practiceMode === "cram") {
        setClozeCursor((prev) => prev + 1);
        setIsFlipped(false);
        setTypedInput("");
        setMatchResult(null);
        setOverrideExact(false);
        return;
      }

      setRatingsHistory((prev) => [...prev, rating]);
      setReviewedCount((prev) => prev + 1);
      advanceCardState();
    },
    [
      activeClozeIndex,
      advanceCardState,
      busy,
      cardExplanation,
      clozeCursor,
      clozeSource,
      currentCard,
      deckTitle,
      effectiveBack,
      effectiveFront,
      isClozeCard,
      onLogMistake,
      onRateCard,
      parsedCloze.indices.length,
      practiceMode,
      recallStyle,
      t,
      typedInput,
    ],
  );

  const handleCheckTypedAnswer = useCallback(() => {
    if (!currentCard) return;
    const expected = isClozeCard
      ? getClozeAnswers(clozeSource, activeClozeIndex).map((a) => a.answer)[0] ?? effectiveBack
      : effectiveBack;

    const meta = currentCard.metadata;
    const extraAccepted = isClozeCard
      ? getClozeAnswers(clozeSource, activeClozeIndex).map((a) => a.answer)
      : meta?.accepted_answers ?? [];

    const res = matchAnswer(typedInput, expected, {
      mode: meta?.matching_mode ?? "normalized",
      normalizeAlef: meta?.normalize_alef ?? false,
      acceptedAnswers: extraAccepted,
    });
    setMatchResult(res);
    setOverrideExact(false);
    setIsFlipped(true);

    if (res.status === "incorrect" && onLogMistake) {
      onLogMistake({
        cardId: currentCard.id,
        sourceType: isClozeCard ? "cloze" : "typed_recall",
        topic: deckTitle || currentCard.concept || t("استرجاع كتابي", "Typed Recall"),
        prompt: isClozeCard ? clozeSource : effectiveFront,
        userAnswer: typedInput.trim(),
        expectedAnswer: expected,
        explanation: cardExplanation,
      });
    }
  }, [
    activeClozeIndex,
    cardExplanation,
    clozeSource,
    currentCard,
    deckTitle,
    effectiveBack,
    effectiveFront,
    isClozeCard,
    onLogMistake,
    t,
    typedInput,
  ]);

  const handleShuffleDeck = () => {
    setPracticeMode("cram");
    setOrder(shuffleIndices(cards.length));
    setCursor(0);
    setIsFlipped(false);
    setShowHint(false);
    setTypedInput("");
    setMatchResult(null);
    setIsComplete(false);
    push({
      title: t("تم خلط البطاقات في وضع التدريب الحر", "Deck shuffled in Free Cram mode"),
      tone: "info",
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped && !busy && !isComplete) {
        if (e.key === "1") {
          e.preventDefault();
          void handleRate(0);
        } else if (e.key === "2") {
          e.preventDefault();
          void handleRate(1);
        } else if (e.key === "3") {
          e.preventDefault();
          void handleRate(2);
        } else if (e.key === "4") {
          e.preventDefault();
          void handleRate(3);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, handleFlip, handleRate, isComplete, isFlipped]);

  if (!currentCard || isComplete) {
    const goodRatings = ratingsHistory.filter((r) => r >= 2).length;
    const accuracy = reviewedCount > 0 ? Math.round((goodRatings / reviewedCount) * 100) : 100;

    return (
      <StudyStageCanvas
        header={
          <Badge tone="success">
            {practiceMode === "spaced"
              ? t("اكتملت جلسة التكرار المتباعد", "Spaced Review Session Complete")
              : t("اكتملت جلسة التدريب الحر", "Free Cram Session Complete")}
          </Badge>
        }
        footer={
          <Button
            variant="primary"
            onClick={() => {
              setCursor(0);
              setIsFlipped(false);
              setIsComplete(false);
              setReviewedCount(0);
              setRatingsHistory([]);
              setTypedInput("");
              setMatchResult(null);
            }}
          >
            <Icon name="arrow" size={16} />
            <span>{t("إعادة مراجعة المجموعة", "Review Deck Again")}</span>
          </Button>
        }
      >
        <div className="nk-study-complete-box">
          <h2 className="nk-study-complete-score">{accuracy}%</h2>
          <p className="nk-study-complete-label">
            {t("معدل الاسترجاع النشط", "Active Recall Rate")}
          </p>
          <p className="nk-study-complete-sub">
            {practiceMode === "spaced" && canPersistRatings
              ? t(
                  `راجعت ${reviewedCount} بطاقة وتم تثبيت مواعيد الاسترجاع من الخادم بنجاح.`,
                  `Reviewed ${reviewedCount} cards. Spaced intervals synced authoritatively with the server.`,
                )
              : t(
                  `أتممت ${reviewedCount} بطاقة في وضع التدريب الحر دون تغيير جدولك التباعدي.`,
                  `Practiced ${reviewedCount} cards in Free Cram / Preview mode without modifying your SM-2 schedule.`,
                )}
          </p>
        </div>
      </StudyStageCanvas>
    );
  }

  return (
    <StudyStageCanvas
      header={
        <div className="nk-studio-toolbar">
          <div className="nk-studio-title-group">
            <span className="nk-studio-eyebrow">
              {deckTitle || t("استوديو الاسترجاع النشط", "Active Recall Studio")}
            </span>
            <h3 className="nk-studio-counter">
              {t(`بطاقة ${cursor + 1} من ${totalCards}`, `Card ${cursor + 1} of ${totalCards}`)}
              {isClozeCard && parsedCloze.indices.length > 1 && (
                <Badge tone="accent">c{activeClozeIndex} ({clozeCursor + 1}/{parsedCloze.indices.length})</Badge>
              )}
            </h3>
          </div>

          <div className="nk-studio-controls-wrap" role="group" aria-label={t("أدوات الجلسة", "Session controls")}>
            {/* Practice vs Spaced toggle */}
            <Button
              size="sm"
              variant={practiceMode === "cram" ? "primary" : "subtle"}
              onClick={() => setPracticeMode((m) => (m === "spaced" ? "cram" : "spaced"))}
            >
              <span>
                {practiceMode === "spaced"
                  ? t("وضع التكرار المتباعد (SM-2)", "SM-2 Spaced")
                  : t("وضع التدريب الحر (Cram)", "Free Cram")}
              </span>
            </Button>

            {/* Recall Style selector */}
            <Button
              size="sm"
              variant={recallStyle === "typed" ? "primary" : "subtle"}
              onClick={() => {
                setRecallStyle((s) => (s === "typed" ? "flip" : "typed"));
                setIsFlipped(false);
                setMatchResult(null);
              }}
            >
              <span>{recallStyle === "typed" ? t("كتابي: مفعّل", "Typed: On") : t("اختبار كتابي", "Type Answer")}</span>
            </Button>

            <Button size="sm" variant="subtle" onClick={handleShuffleDeck}>
              <span>{t("خلط البطاقات", "Shuffle")}</span>
            </Button>

            <Button
              size="sm"
              variant={swapSides ? "primary" : "subtle"}
              onClick={() => {
                setSwapSides((v) => !v);
                setIsFlipped(false);
              }}
            >
              <span>{t("عكس الوجهين", "Swap Sides")}</span>
            </Button>

            <Button
              size="sm"
              variant="subtle"
              onClick={() => speakText(isFlipped ? effectiveBack : effectiveFront)}
              aria-label={t("نطق النص صوتيًا", "Speak card text")}
            >
              <span>🔊 {t("نطق", "Speak")}</span>
            </Button>

            {cardHint && (
              <Button size="sm" variant={showHint ? "primary" : "subtle"} onClick={() => setShowHint((h) => !h)}>
                <span>💡 {showHint ? t("إخفاء التلميح", "Hide Hint") : t("تلميح", "Hint")}</span>
              </Button>
            )}

            {onSuspendCard && (
              <Button
                size="sm"
                variant="subtle"
                disabled={busy}
                onClick={() => void onSuspendCard(currentCard.id, !currentCard.suspended)}
              >
                <span>{currentCard.suspended ? t("إعادة التفعيل", "Unsuspend") : t("تعليق", "Suspend")}</span>
              </Button>
            )}
          </div>
        </div>
      }
      footer={
        <>
          {practiceMode === "spaced" && !canPersistRatings && (
            <p className="nk-studio-preview-note" role="status">
              {t(
                "معاينة محلية: سجّل الدخول لحفظ التقييمات ومواعيد التكرار المتباعد على الخادم.",
                "Local preview: sign in to commit server-verified SM-2 intervals to your account.",
              )}
            </p>
          )}
          <div className="noata-sm2-rating-grid">
            {intervalPreviews.map((item) => {
              const rateCls =
                item.rating === 0
                  ? "rate-again"
                  : item.rating === 1
                    ? "rate-hard"
                    : item.rating === 2
                      ? "rate-good"
                      : "rate-easy";
              return (
                <button
                  key={item.rating}
                  type="button"
                  className={`noata-sm2-btn ${rateCls}`}
                  disabled={!isFlipped || busy}
                  onClick={() => void handleRate(item.rating)}
                >
                  <strong>{item.title}</strong>
                  <small>{practiceMode === "cram" ? t("بدون تعديل SM-2", "Cram") : item.label}</small>
                </button>
              );
            })}
          </div>

          <div className="noata-keyboard-hint">
            {t("اختصارات:", "Shortcuts:")}{" "}
            <span className="noata-keyboard-badge">Space</span> {t("قلب", "flip")} ·{" "}
            <span className="noata-keyboard-badge">1</span>{" "}
            <span className="noata-keyboard-badge">2</span>{" "}
            <span className="noata-keyboard-badge">3</span>{" "}
            <span className="noata-keyboard-badge">4</span> {t("تقييم الاسترجاع", "rate recall")}
          </div>
        </>
      }
    >
      {/* Progress Track */}
      <div className="noata-quiz-progress-track" aria-hidden="true">
        <div
          className="noata-quiz-progress-fill"
          style={{ width: `${((cursor + 1) / totalCards) * 100}%` }}
        />
      </div>

      {/* Hint Banner */}
      {showHint && cardHint && (
        <div className="nk-study-hint-banner" role="note" dir="auto">
          <strong>💡 {t("تلميح استرجاعي:", "Recall Hint:")}</strong>{" "}
          <StudyRichText content={cardHint} />
        </div>
      )}

      {/* Explicit Flip Control (Accessible primary control + copy-safe 3D card) */}
      <div className="nk-card-action-bar">
        <Badge tone={isFlipped ? "success" : "accent"}>
          {isClozeCard
            ? t(`ملء فراغ Cloze c${activeClozeIndex}`, `Cloze c${activeClozeIndex}`)
            : isFlipped
              ? t("الإجابة الظاهرة", "Back Revealed")
              : t("وجه السؤال", "Prompt Side")}
        </Badge>
        <Button size="sm" variant="secondary" onClick={handleFlip}>
          <span>{isFlipped ? t("عرض الوجه الأمامي ⟳", "Show Prompt ⟳") : t("كشف الإجابة ⟳", "Reveal Answer ⟳")}</span>
        </Button>
      </div>

      {/* 3D CSS-Grid Flip Scene (arbitrary height grows naturally cleanly with KaTeX/Bilingual prose) */}
      <div className="noata-3d-scene" onClick={handleSceneClick}>
        <div className={`noata-3d-card ${isFlipped ? "is-flipped" : ""}`}>
          {/* FRONT FACE */}
          <div className="noata-3d-face is-front">
            <div className="nk-card-face-head">
              <span className="nk-card-concept-pill">
                {currentCard.concept || t("السؤال / المصطلح", "Prompt / Term")}
              </span>
              <small className="nk-card-flip-note">{t("انقر للقلب", "Click card or Space")}</small>
            </div>

            <div className="noata-card-prompt" dir="auto">
              {isClozeCard ? (
                <p className="nk-cloze-paragraph">
                  {renderClozeSegments(clozeSource, activeClozeIndex, false).map((seg, i) => {
                    if (seg.kind === "blank") {
                      return (
                        <mark key={i} className="nk-cloze-blank">
                          {seg.hint ? `[c${seg.groupIndex}: ${seg.hint}]` : `[c${seg.groupIndex}: …]`}
                        </mark>
                      );
                    }
                    return <span key={i}>{seg.text}</span>;
                  })}
                </p>
              ) : (
                <StudyRichText content={effectiveFront} />
              )}
            </div>

            <div className="nk-card-face-foot">
              {t("اضغط Space أو زر «كشف الإجابة» لرؤية الحل", "Press Space or Reveal Answer when ready")}
            </div>
          </div>

          {/* BACK FACE */}
          <div className="noata-3d-face is-back">
            <div className="nk-card-face-head">
              <span className="nk-card-concept-pill is-answer">
                {t("الإجابة النموذجية والشرح", "Verified Answer & Rationale")}
              </span>
              <small className="nk-card-flip-note">✓ {t("مكشوفة", "Revealed")}</small>
            </div>

            <div className="noata-card-answer" dir="auto">
              {isClozeCard ? (
                <p className="nk-cloze-paragraph">
                  {renderClozeSegments(clozeSource, activeClozeIndex, true).map((seg, i) => {
                    if (seg.kind === "revealed-target") {
                      return (
                        <strong key={i} className="nk-cloze-revealed">
                          {seg.text}
                        </strong>
                      );
                    }
                    if (seg.kind === "blank") {
                      return (
                        <mark key={i} className="nk-cloze-blank">
                          {seg.answer}
                        </mark>
                      );
                    }
                    return <span key={i}>{seg.text}</span>;
                  })}
                </p>
              ) : (
                <StudyRichText content={effectiveBack} />
              )}
            </div>

            {(cardExplanation || cardMnemonic) && (
              <div className="nk-card-meta-notes" dir="auto">
                {cardExplanation && (
                  <div className="nk-card-note-box">
                    <strong>{t("الشرح المفاهيمي:", "Explanation:")}</strong>
                    <StudyRichText content={cardExplanation} />
                  </div>
                )}
                {cardMnemonic && (
                  <div className="nk-card-note-box">
                    <strong>🧠 {t("مفتاح التذكر:", "Mnemonic:")}</strong>
                    <StudyRichText content={cardMnemonic} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Typed Active Recall Verification Panel (when enabled or Cloze + Typed) */}
      {(recallStyle === "typed" || isClozeCard) && (
        <div
          className="nk-typed-recall-box"
          onClick={(e) => e.stopPropagation()}
        >
          <form
            className="nk-typed-recall-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleCheckTypedAnswer();
            }}
          >
            <input
              type="text"
              className="nk-input"
              dir="auto"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={
                isClozeCard
                  ? t(`اكتب قيمة الفراغ c${activeClozeIndex}…`, `Type answer for cloze c${activeClozeIndex}…`)
                  : t("اكتب إجابتك للتحقق قبل الكشف…", "Type your recall answer to check…")
              }
              aria-label={t("حقل كتابة الإجابة", "Type your recall answer")}
            />
            <Button type="submit" variant="primary" disabled={!typedInput.trim()}>
              <span>{t("تحقق من الإجابة", "Check Answer")}</span>
            </Button>
          </form>

          {matchResult && (
            <div
              role="status"
              className={[
                "nk-match-feedback",
                matchResult.matched || overrideExact
                  ? "is-exact"
                  : matchResult.status === "close"
                    ? "is-close"
                    : "is-wrong",
              ].join(" ")}
            >
              {matchResult.matched || overrideExact ? (
                <strong>
                  ✓ {t("إجابة دقيقة ومطابقة!", "Exact verified match!")}
                </strong>
              ) : matchResult.status === "close" ? (
                <div className="nk-close-match-row">
                  <span>
                    ⚠️{" "}
                    {t(
                      `إجابة قريبة جدًا (تطابق ${Math.round(matchResult.similarity * 100)}%) — راجع الإملاء بدقة (المتوقع: ${matchResult.matchedCandidate ?? ""}).`,
                      `Close match (${Math.round(matchResult.similarity * 100)}% similarity) — verify spelling (expected: ${matchResult.matchedCandidate ?? ""}).`,
                    )}
                  </span>
                  <div className="nk-close-match-actions">
                    <Button size="sm" variant="secondary" onClick={() => setOverrideExact(true)}>
                      <span>{t("اعتماد الإجابة", "Accept spelling")}</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <span>
                  ✗{" "}
                  {t(
                    `غير مطابقة. المتوقع: ${matchResult.matchedCandidate ?? effectiveBack}`,
                    `Does not match. Expected: ${matchResult.matchedCandidate ?? effectiveBack}`,
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </StudyStageCanvas>
  );
}
