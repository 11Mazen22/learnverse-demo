"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/locale";
import { stripClozeMarkup } from "@/lib/study/cloze";
import type { StudioCardItem } from "./flashcard-review-studio";
import { StudyRichText } from "./study-rich-text";

type MatchTile = {
  key: string;
  cardId: string;
  text: string;
  side: "front" | "back";
};

function shuffleList<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export type SpeedMatchProps = {
  cards: StudioCardItem[];
  deckTitle?: string;
  onLogMistake?: (entry: {
    cardId: string;
    sourceType: "flashcard";
    topic: string;
    prompt: string;
    userAnswer: string;
    expectedAnswer: string;
    explanation: string;
  }) => void;
  onSessionComplete?: (summary: {
    totalPairs: number;
    mistakesCount: number;
    elapsedSeconds: number;
  }) => void;
  onExit?: () => void;
};

export function StudySpeedMatch({
  cards,
  deckTitle,
  onLogMistake,
  onSessionComplete,
  onExit,
}: SpeedMatchProps) {
  const t = useTranslation();

  const usableCards = useMemo(
    () =>
      cards
        .filter((c) => !c.suspended && (c.front.trim().length > 0 || (c.clozeText && c.clozeText.trim().length > 0)))
        .map((c) => ({
          ...c,
          promptText: c.cardType === "cloze" && c.clozeText ? stripClozeMarkup(c.clozeText) : c.front,
          answerText: c.back.trim() || c.front,
        })),
    [cards],
  );

  const [pairLimit, setPairLimit] = useState<4 | 6 | 8>(6);
  const [roundNonce, setRoundNonce] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [mismatchPair, setMismatchPair] = useState<[string, string] | null>(null);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const activeRoundCards = useMemo(() => {
    // roundNonce forces fresh sample on reset
    void roundNonce;
    const count = Math.min(pairLimit, usableCards.length);
    return shuffleList(usableCards).slice(0, count);
  }, [usableCards, pairLimit, roundNonce]);

  const { leftTiles, rightTiles } = useMemo(() => {
    void roundNonce;
    const left: MatchTile[] = shuffleList(
      activeRoundCards.map((c) => ({
        key: `L-${c.id}`,
        cardId: c.id,
        text: c.promptText,
        side: "front" as const,
      })),
    );
    const right: MatchTile[] = shuffleList(
      activeRoundCards.map((c) => ({
        key: `R-${c.id}`,
        cardId: c.id,
        text: c.answerText,
        side: "back" as const,
      })),
    );
    return { leftTiles: left, rightTiles: right };
  }, [activeRoundCards, roundNonce]);

  useEffect(() => {
    if (isDone || activeRoundCards.length === 0) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isDone, activeRoundCards.length]);

  const restartRound = useCallback((nextLimit?: 4 | 6 | 8) => {
    if (nextLimit) setPairLimit(nextLimit);
    setRoundNonce((n) => n + 1);
    setSelectedPrompt(null);
    setSelectedAnswer(null);
    setMatchedIds([]);
    setMismatchPair(null);
    setMistakeCount(0);
    setElapsedSeconds(0);
    setIsDone(false);
  }, []);

  const checkPair = useCallback(
    (promptCardId: string, answerCardId: string) => {
      if (promptCardId === answerCardId) {
        const nextMatched = [...matchedIds, promptCardId];
        setMatchedIds(nextMatched);
        setSelectedPrompt(null);
        setSelectedAnswer(null);
        setMismatchPair(null);

        if (nextMatched.length >= activeRoundCards.length) {
          setIsDone(true);
          onSessionComplete?.({
            totalPairs: activeRoundCards.length,
            mistakesCount: mistakeCount,
            elapsedSeconds,
          });
        }
      } else {
        setMistakeCount((m) => m + 1);
        setMismatchPair([promptCardId, answerCardId]);

        const card = activeRoundCards.find((c) => c.id === promptCardId);
        const wrongCard = activeRoundCards.find((c) => c.id === answerCardId);
        if (card) {
          onLogMistake?.({
            cardId: card.id,
            sourceType: "flashcard",
            topic: deckTitle || t("تحدي المطابقة السريعة", "Speed Match Sprint"),
            prompt: card.promptText,
            userAnswer: wrongCard?.answerText || "",
            expectedAnswer: card.answerText,
            explanation: card.explanation || "",
          });
        }

        window.setTimeout(() => {
          setSelectedPrompt(null);
          setSelectedAnswer(null);
          setMismatchPair(null);
        }, 420);
      }
    },
    [activeRoundCards, deckTitle, elapsedSeconds, matchedIds, mistakeCount, onLogMistake, onSessionComplete, t],
  );

  function handleSelectLeft(cardId: string) {
    if (matchedIds.includes(cardId) || isDone || mismatchPair) return;
    if (selectedPrompt === cardId) {
      setSelectedPrompt(null);
      return;
    }
    setSelectedPrompt(cardId);
    if (selectedAnswer) {
      checkPair(cardId, selectedAnswer);
    }
  }

  function handleSelectRight(cardId: string) {
    if (matchedIds.includes(cardId) || isDone || mismatchPair) return;
    if (selectedAnswer === cardId) {
      setSelectedAnswer(null);
      return;
    }
    setSelectedAnswer(cardId);
    if (selectedPrompt) {
      checkPair(selectedPrompt, cardId);
    }
  }

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  };

  if (usableCards.length < 2) {
    return (
      <section className="noata-study-empty-panel">
        <Icon name="zap" size={28} />
        <h3>{t("تحتاج البطاقات إلى بطاقتين نشطتين على الأقل", "Speed Match needs at least 2 active cards")}</h3>
        <p>{t("أضف بطاقتين أو استورد مجموعة لتجربة تحدي المطابقة السريعة.", "Add two cards or import a deck to launch Speed Match Sprint.")}</p>
        {onExit ? (
          <Button variant="secondary" onClick={onExit}>
            {t("العودة", "Go Back")}
          </Button>
        ) : null}
      </section>
    );
  }

  return (
    <section className="noata-speed-match-shell" aria-label={t("سباق المطابقة السريعة", "Speed Match Sprint")}>
      <header className="noata-speed-match-header">
        <div className="noata-speed-match-title">
          <Badge tone="accent">{t("تحدي المطابقة", "Speed Match")}</Badge>
          <h3>{deckTitle || t("جلسة استرجاع سريع", "Rapid Recall Round")}</h3>
        </div>

        <div className="noata-speed-match-controls">
          <div className="noata-speed-size-group" role="group" aria-label={t("عدد الأزواج", "Pair count")}>
            {([4, 6, 8] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                className={`noata-chip-btn ${pairLimit === sz ? "is-active" : ""}`}
                disabled={sz > 4 && usableCards.length < sz}
                onClick={() => restartRound(sz)}
              >
                {sz} {t("أزواج", "pairs")}
              </button>
            ))}
          </div>

          <Badge tone="neutral" icon="clock">
            {formatTimer(elapsedSeconds)}
          </Badge>
          <Badge tone={mistakeCount > 0 ? "warning" : "success"}>
            {matchedIds.length} / {activeRoundCards.length}
          </Badge>

          <Button size="sm" variant="ghost" onClick={() => restartRound()}>
            <Icon name="refresh" size={14} />
            {t("تبديل الجولة", "New Round")}
          </Button>
          {onExit ? (
            <Button size="sm" variant="secondary" onClick={onExit}>
              {t("إنهاء", "Exit")}
            </Button>
          ) : null}
        </div>
      </header>

      {isDone ? (
        <div className="noata-speed-complete-banner">
          <Icon name="award" size={32} />
          <div>
            <h4>{t("تمت مطابقة جميع الأزواج بنجاح!", "All pairs matched cleanly!")}</h4>
            <p>
              {t(
                `الوقت المستغرق: ${formatTimer(elapsedSeconds)} • المحاولات الخاطئة المسجلة: ${mistakeCount}`,
                `Elapsed time: ${formatTimer(elapsedSeconds)} • Logged mismatches: ${mistakeCount}`,
              )}
            </p>
          </div>
          <div className="noata-speed-complete-actions">
            <Button variant="primary" onClick={() => restartRound()}>
              <Icon name="play" size={16} />
              {t("جولة جديدة", "Play Another Round")}
            </Button>
            {onExit ? (
              <Button variant="secondary" onClick={onExit}>
                {t("العودة إلى المركز", "Back to Hub")}
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="noata-speed-grid">
          <div className="noata-speed-column" aria-label={t("المفاهيم والأسئلة", "Prompts")}>
            <div className="noata-speed-col-label">{t("المفهوم / السؤال", "Prompt")}</div>
            {leftTiles.map((tile) => {
              const matched = matchedIds.includes(tile.cardId);
              const selected = selectedPrompt === tile.cardId;
              const wrong = mismatchPair?.[0] === tile.cardId;
              return (
                <button
                  key={tile.key}
                  type="button"
                  disabled={matched}
                  aria-pressed={selected}
                  onClick={() => handleSelectLeft(tile.cardId)}
                  className={`noata-speed-tile ${selected ? "is-selected" : ""} ${matched ? "is-matched" : ""} ${wrong ? "is-wrong" : ""}`}
                >
                  <StudyRichText content={tile.text} inline />
                </button>
              );
            })}
          </div>

          <div className="noata-speed-column" aria-label={t("الإجابات والتعاريف", "Answers")}>
            <div className="noata-speed-col-label">{t("الإجابة / التعريف", "Answer")}</div>
            {rightTiles.map((tile) => {
              const matched = matchedIds.includes(tile.cardId);
              const selected = selectedAnswer === tile.cardId;
              const wrong = mismatchPair?.[1] === tile.cardId;
              return (
                <button
                  key={tile.key}
                  type="button"
                  disabled={matched}
                  aria-pressed={selected}
                  onClick={() => handleSelectRight(tile.cardId)}
                  className={`noata-speed-tile ${selected ? "is-selected" : ""} ${matched ? "is-matched" : ""} ${wrong ? "is-wrong" : ""}`}
                >
                  <StudyRichText content={tile.text} inline />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
