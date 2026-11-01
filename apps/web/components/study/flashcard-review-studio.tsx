"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import type { QuizFlashcard } from "@/lib/study/quizgecko-engine";

export type FlashcardStudioProps = {
  deckTitle?: string;
  cards: Array<{
    id: string;
    front: string;
    back: string;
    hint?: string;
    concept?: string;
    mnemonic?: string;
  }>;
  onRateCard?: (cardId: string, rating: 0 | 1 | 2 | 3) => Promise<void> | void;
  onFinish?: () => void;
  busy?: boolean;
};

export function FlashcardReviewStudio({
  deckTitle,
  cards,
  onRateCard,
  onFinish,
  busy = false,
}: FlashcardStudioProps) {
  const t = useTranslation();
  const locale = useLocale();
  const isEn = locale === "en";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [ratingsHistory, setRatingsHistory] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const currentCard = cards[currentIndex] ?? null;
  const totalCards = cards.length;

  // Speak text using Web Speech API
  const speakText = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = /[\u0600-\u06FF]/.test(text) ? "ar-SA" : "en-US";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRate = useCallback(
    async (rating: 0 | 1 | 2 | 3) => {
      if (!currentCard || busy) return;

      setRatingsHistory((prev) => [...prev, rating]);
      setReviewedCount((prev) => prev + 1);

      await onRateCard?.(currentCard.id, rating);

      setIsFlipped(false);
      setShowHint(false);

      if (currentIndex + 1 < totalCards) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsComplete(true);
        onFinish?.();
      }
    },
    [busy, currentCard, currentIndex, onFinish, onRateCard, totalCards]
  );

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is focused inside an input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped && !busy) {
        if (e.key === "1") {
          e.preventDefault();
          void handleRate(0); // Again
        } else if (e.key === "2") {
          e.preventDefault();
          void handleRate(1); // Hard
        } else if (e.key === "3") {
          e.preventDefault();
          void handleRate(2); // Good
        } else if (e.key === "4") {
          e.preventDefault();
          void handleRate(3); // Easy
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, handleFlip, handleRate, isFlipped]);

  if (!currentCard || isComplete) {
    const goodRatings = ratingsHistory.filter((r) => r >= 2).length;
    const accuracy = reviewedCount > 0 ? Math.round((goodRatings / reviewedCount) * 100) : 100;

    return (
      <div className="noata-quiz-card" style={{ maxWidth: 680, margin: "20px auto", textAlign: "center", padding: 40 }}>
        <span className="pill" style={{ background: "color-mix(in srgb, #10b981 15%, var(--surface))", color: "#10b981", fontSize: 13 }}>
          {t("اكتملت جلسة المراجعة التباعدية", "Spaced Review Session Complete")}
        </span>
        <h2 style={{ fontSize: 32, margin: "16px 0 8px", fontWeight: 900 }}>
          {accuracy}% {t("معدل الاسترجاع النشط", "Retention Rate")}
        </h2>
        <p style={{ color: "var(--muted)", margin: "0 0 24px", fontSize: 14 }}>
          {t(
            `راجعت ${reviewedCount} بطاقة استرجاع في هذه الجلسة. تم تحديث فواصل التكرار المتباعد بدقة.`,
            `Reviewed ${reviewedCount} active-recall cards this session. Spaced repetition intervals successfully updated.`
          )}
        </p>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setCurrentIndex(0);
            setIsFlipped(false);
            setIsComplete(false);
            setReviewedCount(0);
            setRatingsHistory([]);
          }}
        >
          <Icon name="arrow" size={16} />
          <span>{t("إعادة مراجعة المجموعة", "Review Deck Again")}</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 740, margin: "0 auto" }}>
      {/* Top Header with Progress */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase" }}>
            {deckTitle || t("استوديو التكرار المتباعد", "Spaced Repetition Studio")}
          </span>
          <h3 style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 800 }}>
            {t(`بطاقة ${currentIndex + 1} من ${totalCards}`, `Card ${currentIndex + 1} of ${totalCards}`)}
          </h3>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="btn"
            style={{ padding: "6px 12px", fontSize: 12 }}
            onClick={() => speakText(isFlipped ? currentCard.back : currentCard.front)}
            title={t("نطق صوتي", "Text to speech")}
          >
            🔊 <span>{t("نطق", "Speak")}</span>
          </button>

          {currentCard.hint && (
            <button
              type="button"
              className="btn"
              style={{ padding: "6px 12px", fontSize: 12 }}
              onClick={() => setShowHint((h) => !h)}
            >
              💡 <span>{showHint ? t("إخفاء التلميح", "Hide Hint") : t("تلميح", "Hint")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="noata-quiz-progress-track" style={{ marginBottom: 20 }}>
        <div
          className="noata-quiz-progress-fill"
          style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
        />
      </div>

      {/* Hint Banner */}
      {showHint && currentCard.hint && (
        <div
          style={{
            padding: "10px 16px",
            borderRadius: 14,
            background: "color-mix(in srgb, #f59e0b 10%, var(--surface))",
            border: "1px solid color-mix(in srgb, #f59e0b 30%, transparent)",
            fontSize: 13,
            color: "var(--ink)",
            marginBottom: 16,
          }}
        >
          <strong>💡 {t("تلميح استرجاعي:", "Recall Hint:")}</strong> {currentCard.hint}
        </div>
      )}

      {/* 3D Flip Card Scene */}
      <div className="noata-3d-scene" onClick={handleFlip}>
        <div className={`noata-3d-card ${isFlipped ? "is-flipped" : ""}`}>
          {/* FRONT FACE */}
          <div className="noata-3d-face is-front">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="pill" style={{ background: "var(--accent-soft)", color: "var(--accent)", fontSize: 11 }}>
                {currentCard.concept || t("السؤال / المصطلح", "Question / Term")}
              </span>
              <small style={{ color: "var(--muted)", fontSize: 12 }}>
                {t("انقر للقلب", "Click to flip")} ⟳
              </small>
            </div>

            <div className="noata-card-prompt" dir="auto">
              {currentCard.front}
            </div>

            <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 12 }}>
              {t("اضغط المسافة (Space) لقلب البطاقة", "Press Space to flip card")}
            </div>
          </div>

          {/* BACK FACE */}
          <div className="noata-3d-face is-back">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="pill" style={{ background: "color-mix(in srgb, #10b981 15%, var(--surface))", color: "#10b981", fontSize: 11 }}>
                {t("الإجابة / المفهوم المحوري", "Answer / Core Concept")}
              </span>
              <small style={{ color: "var(--muted)", fontSize: 12 }}>
                {t("مقلوبة", "Flipped")} ✓
              </small>
            </div>

            <div className="noata-card-answer" dir="auto">
              {currentCard.back}
            </div>

            {currentCard.mnemonic && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 12,
                  background: "var(--surface-soft)",
                  border: "1px solid var(--line)",
                  fontSize: 12,
                  color: "var(--muted)",
                  textAlign: "center",
                }}
              >
                🧠 <strong>{t("مفتاح التذكر:", "Mnemonic:")}</strong> {currentCard.mnemonic}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Buttons (SM-2 Interval Scheduling) */}
      <div className="noata-sm2-rating-grid">
        <button
          type="button"
          className="noata-sm2-btn rate-again"
          disabled={!isFlipped || busy}
          onClick={() => void handleRate(0)}
        >
          <strong>{t("مرة أخرى", "Again")}</strong>
          <small>{t("< 10 دقائق", "< 10 mins")}</small>
        </button>

        <button
          type="button"
          className="noata-sm2-btn rate-hard"
          disabled={!isFlipped || busy}
          onClick={() => void handleRate(1)}
        >
          <strong>{t("صعب", "Hard")}</strong>
          <small>{t("1 يوم", "1 day")}</small>
        </button>

        <button
          type="button"
          className="noata-sm2-btn rate-good"
          disabled={!isFlipped || busy}
          onClick={() => void handleRate(2)}
        >
          <strong>{t("جيد", "Good")}</strong>
          <small>{t("3 أيام", "3 days")}</small>
        </button>

        <button
          type="button"
          className="noata-sm2-btn rate-easy"
          disabled={!isFlipped || busy}
          onClick={() => void handleRate(3)}
        >
          <strong>{t("سهل", "Easy")}</strong>
          <small>{t("7 أيام", "7 days")}</small>
        </button>
      </div>

      <div className="noata-keyboard-hint">
        {t("اختصارات لوحة المفاتيح:", "Keyboard shortcuts:")}
        <span className="noata-keyboard-badge">Space</span> {t("للقلب", "to flip")} ·
        <span className="noata-keyboard-badge">1</span> {t("إعادة", "again")} ·
        <span className="noata-keyboard-badge">2</span> {t("صعب", "hard")} ·
        <span className="noata-keyboard-badge">3</span> {t("جيد", "good")} ·
        <span className="noata-keyboard-badge">4</span> {t("سهل", "easy")}
      </div>
    </div>
  );
}
