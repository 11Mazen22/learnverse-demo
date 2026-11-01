"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import type { QuizGeckoBundle, QuizItem, QuizFlashcard } from "@/lib/study/quizgecko-engine";
import { convertMissedQuestionsToCards } from "@/lib/study/quizgecko-engine";

export type QuizRunnerProps = {
  bundle: QuizGeckoBundle;
  onFinish?: (score: number, missedCards: QuizFlashcard[]) => void;
  onRestart?: () => void;
};

export function InteractiveQuizRunner({ bundle, onFinish, onRestart }: QuizRunnerProps) {
  const t = useTranslation();
  const locale = useLocale();
  const isEn = locale === "en";

  const [mode, setMode] = useState<"practice" | "exam">("practice");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<number, number[]>>({});
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(true);

  const questions = bundle.questions;
  const currentQ = questions[currentIndex] ?? null;
  const totalQuestions = questions.length;

  // Timer ticker
  useEffect(() => {
    if (!timerActive || isFinished) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, isFinished]);

  const handleSelectOption = (optIndex: number) => {
    if (selectedAnswers[currentIndex] !== undefined && mode === "practice") {
      return; // Locked after selection in practice mode
    }
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optIndex }));
  };

  const handleUse5050 = () => {
    if (!currentQ || eliminatedOptions[currentIndex]) return;
    const wrongIndices = currentQ.options
      .map((_, i) => i)
      .filter((i) => i !== currentQ.correctIndex);
    const shuffled = [...wrongIndices].sort(() => 0.5 - Math.random());
    const toEliminate = shuffled.slice(0, 2);
    setEliminatedOptions((prev) => ({ ...prev, [currentIndex]: toEliminate }));
  };

  const handleToggleHint = () => {
    setRevealedHints((prev) => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
  };

  const calculateScore = useCallback(() => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correct += 1;
      }
    });
    return {
      correct,
      total: totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0,
    };
  }, [questions, selectedAnswers, totalQuestions]);

  const handleFinishQuiz = () => {
    setIsFinished(true);
    setTimerActive(false);
    const missed = questions.filter((q, idx) => selectedAnswers[idx] !== q.correctIndex);
    const missedCards = convertMissedQuestionsToCards(missed);
    const score = calculateScore();
    onFinish?.(score.percentage, missedCards);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (!currentQ && !isFinished) {
    return (
      <div className="noata-quiz-card" style={{ textAlign: "center", padding: 40 }}>
        <p>{t("لا توجد أسئلة متاحة في هذا الاختبار.", "No questions available in this assessment.")}</p>
        <button type="button" className="btn btn-primary" onClick={onRestart}>
          {t("العودة", "Go back")}
        </button>
      </div>
    );
  }

  // Diagnostic Report View
  if (isFinished) {
    const score = calculateScore();
    const missed = questions.filter((q, idx) => selectedAnswers[idx] !== q.correctIndex);
    const missedCards = convertMissedQuestionsToCards(missed);

    const gradeLabel =
      score.percentage >= 90
        ? isEn ? "Mastery — Exceptional" : "إتقان استثنائي (ممتاز مرتفع)"
        : score.percentage >= 75
          ? isEn ? "Proficient — Strong" : "استيعاب قوي (جيد جداً)"
          : score.percentage >= 50
            ? isEn ? "Developing — Practice Needed" : "مستوى متوسط (يحتاج ترسيخاً)"
            : isEn ? "Novice — Review Recommended" : "بحاجة لمراجعة الأساسيات";

    return (
      <div className="noata-quiz-container">
        <div className="noata-quiz-card" style={{ textAlign: "center" }}>
          <span className="pill" style={{ background: "var(--accent-soft)", color: "var(--accent)", fontSize: 13, padding: "6px 14px" }}>
            {t("تقرير الأداء التشخيصي", "Diagnostic Performance Report")}
          </span>
          <h2 style={{ fontSize: 36, margin: "16px 0 6px", fontWeight: 900 }}>
            {score.percentage}%
          </h2>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)", margin: "0 0 12px" }}>
            {gradeLabel}
          </p>
          <p style={{ color: "var(--muted)", margin: "0 0 24px", fontSize: 13.5 }}>
            {t(
              `أجبت بشكل صحيح على ${score.correct} من إجمالي ${score.total} أسئلة في زمن قدره ${formatTime(secondsElapsed)}.`,
              `Answered ${score.correct} of ${score.total} correctly in ${formatTime(secondsElapsed)}.`
            )}
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 30 }}>
            <button type="button" className="btn btn-primary" onClick={onRestart}>
              <Icon name="arrow" size={16} />
              <span>{t("اختبار جديد أو إعادة المحاولة", "New Quiz / Retry")}</span>
            </button>

            {missed.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  onFinish?.(score.percentage, missedCards);
                  alert(
                    isEn
                      ? `Generated ${missedCards.length} remedial flashcards from your missed questions!`
                      : `تم تحويل ${missedCards.length} أسئلة خاطئة إلى بطاقات مراجعة تباعدية بنجاح!`
                  );
                }}
              >
                <Icon name="sparkles" size={16} />
                <span>
                  {t(
                    `تحويل ${missed.length} أسئلة خاطئة لبطاقات استرجاع`,
                    `Turn ${missed.length} missed into Flashcards`
                  )}
                </span>
              </button>
            )}
          </div>

          {/* Question by question diagnostic review */}
          <div style={{ textAlign: "start", marginTop: 30, borderTop: "1px solid var(--line)", paddingTop: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
              {t("المراجعة التفصيلية وتفكيك المفاهيم الخاطئة", "Detailed Concept Review & Misconceptions")}
            </h3>
            <div style={{ display: "grid", gap: 14 }}>
              {questions.map((q, qIdx) => {
                const userAns = selectedAnswers[qIdx];
                const isCorrect = userAns === q.correctIndex;
                return (
                  <div
                    key={q.id}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      border: `1px solid ${isCorrect ? "color-mix(in srgb, #10b981 30%, var(--line))" : "color-mix(in srgb, #ef4444 30%, var(--line))"}`,
                      background: isCorrect ? "color-mix(in srgb, #10b981 6%, var(--surface))" : "color-mix(in srgb, #ef4444 6%, var(--surface))",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>
                        {t(`السؤال ${qIdx + 1}`, `Question ${qIdx + 1}`)}: {q.question}
                      </span>
                      <span className="pill" style={{ background: isCorrect ? "#10b981" : "#ef4444", color: "#fff", fontSize: 11 }}>
                        {isCorrect ? t("صحيح", "Correct") : t("غير صحيح", "Incorrect")}
                      </span>
                    </div>

                    <p style={{ margin: "4px 0 6px", fontSize: 13, color: "var(--ink)" }}>
                      <strong>{t("إجابتك:", "Your answer:")}</strong> {userAns !== undefined ? q.options[userAns] : t("لم تجب", "Unanswered")}
                    </p>
                    {!isCorrect && (
                      <p style={{ margin: "4px 0 6px", fontSize: 13, color: "#065f46" }}>
                        <strong>{t("الإجابة الصحيحة:", "Correct answer:")}</strong> {q.options[q.correctIndex]}
                      </p>
                    )}
                    <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6 }}>
                      💡 {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Question View
  const userAnswer = selectedAnswers[currentIndex];
  const isAnswered = userAnswer !== undefined;
  const isCorrect = isAnswered && userAnswer === currentQ.correctIndex;
  const isWrong = isAnswered && !isCorrect;
  const eliminated = eliminatedOptions[currentIndex] ?? [];
  const hintShown = revealedHints[currentIndex] ?? false;

  return (
    <div className="noata-quiz-container">
      {/* Top bar with progress and mode controls */}
      <div className="noata-quiz-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>
            {t(`سؤال ${currentIndex + 1} من ${totalQuestions}`, `Q ${currentIndex + 1} of ${totalQuestions}`)}
          </span>
          <span className="pill" style={{ background: "var(--surface-soft)" }}>
            ⏱ {formatTime(secondsElapsed)}
          </span>
        </div>

        <div className="noata-quiz-progress-track" style={{ maxWidth: 220 }}>
          <div
            className="noata-quiz-progress-fill"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Lifelines */}
        <div className="noata-lifeline-dock">
          <button
            type="button"
            className="noata-lifeline-btn"
            onClick={handleToggleHint}
            title={t("تلميح سقراطي", "Socratic hint")}
          >
            💡 <span>{t("تلميح", "Hint")}</span>
          </button>

          <button
            type="button"
            className="noata-lifeline-btn"
            onClick={handleUse5050}
            disabled={Boolean(eliminatedOptions[currentIndex]) || currentQ.options.length <= 2}
            title={t("حذف إجابتين (50:50)", "Eliminate 2 choices (50:50)")}
          >
            ⚡ <span>50:50</span>
          </button>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="noata-quiz-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="pill" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            {currentQ.concept || bundle.topic}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className="btn"
              style={{ fontSize: 11, padding: "4px 8px" }}
              onClick={() => setMode((m) => (m === "practice" ? "exam" : "practice"))}
            >
              {mode === "practice" ? t("نمط: تدريب فوري", "Mode: Practice") : t("نمط: امتحان محاكي", "Mode: Exam")}
            </button>
          </div>
        </div>

        <h3 className="noata-quiz-question-text" dir="auto">
          {currentQ.question}
        </h3>

        {/* Socratic Hint Dropdown */}
        {hintShown && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              background: "color-mix(in srgb, #f59e0b 10%, var(--surface))",
              border: "1px solid color-mix(in srgb, #f59e0b 30%, transparent)",
              marginBottom: 20,
              fontSize: 13.5,
              color: "var(--ink)",
              lineHeight: 1.6,
            }}
          >
            <strong>💡 {t("تلميح سقراطي:", "Socratic Hint:")}</strong> {currentQ.hint}
          </div>
        )}

        {/* Options Grid */}
        <div className="noata-quiz-options-grid">
          {currentQ.options.map((opt, optIdx) => {
            const isElim = eliminated.includes(optIdx);
            const isSelected = userAnswer === optIdx;
            const showFeedback = mode === "practice" && isAnswered;

            let extraClass = "";
            if (isElim) extraClass = "is-eliminated";
            else if (showFeedback) {
              if (optIdx === currentQ.correctIndex) extraClass = "is-correct";
              else if (isSelected) extraClass = "is-wrong";
            }

            const letterMarker = String.fromCharCode(65 + optIdx); // A, B, C, D

            return (
              <button
                key={optIdx}
                type="button"
                className={`noata-quiz-opt-btn ${extraClass}`}
                disabled={isElim || (mode === "practice" && isAnswered)}
                onClick={() => handleSelectOption(optIdx)}
              >
                <span className="noata-quiz-opt-marker">{letterMarker}</span>
                <span style={{ flex: 1 }} dir="auto">
                  {opt}
                </span>
                {showFeedback && optIdx === currentQ.correctIndex && <span>✓</span>}
                {showFeedback && isSelected && optIdx !== currentQ.correctIndex && <span>✗</span>}
              </button>
            );
          })}
        </div>

        {/* Pedagogical Explanation in Practice Mode */}
        {mode === "practice" && isAnswered && (
          <div className="noata-pedagogical-box">
            <h4>
              <Icon name="sparkles" size={18} />
              <span>
                {isCorrect
                  ? t("أحسنت! الشرح المنهجي:", "Correct! Pedagogical rationale:")
                  : t("تفكيك المفهوم والخطأ الشائع:", "Misconception Analysis & Correction:")}
              </span>
            </h4>
            <p dir="auto">{currentQ.explanation}</p>

            {isWrong && currentQ.distractorExplanations?.[userAnswer] && (
              <div className="noata-misconception-card" dir="auto">
                <strong>⚠️ {t("لماذا اختيارك غير دقيق؟", "Why was your selection a trap?")}</strong>
                <p style={{ margin: "4px 0 0" }}>{currentQ.distractorExplanations[userAnswer]}</p>
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <Link
                href={
                  "/ai?prompt=" +
                  encodeURIComponent(
                    isEn
                      ? `In the question "${currentQ.question}", I chose "${currentQ.options[userAnswer]}", but the correct answer is "${currentQ.options[currentQ.correctIndex]}". Explain why conceptually.`
                      : `في سؤال «${currentQ.question}»، اخترت «${currentQ.options[userAnswer]}»، والإجابة النموذجية هي «${currentQ.options[currentQ.correctIndex]}». اشرح لي المفهوم ولماذا وقعت في هذا الخطأ الشائع؟`
                  )
                }
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: 6 }}
                target="_blank"
              >
                <Icon name="sparkles" size={14} />
                <span>{t("اسأل Noäta AI لتعميق الفهم", "Ask Noäta AI why I got this wrong")}</span>
              </Link>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
          <button
            type="button"
            className="btn"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
          >
            {t("← السابق", "← Previous")}
          </button>

          {currentIndex < totalQuestions - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={mode === "practice" && !isAnswered}
              onClick={() => setCurrentIndex((idx) => Math.min(totalQuestions - 1, idx + 1))}
            >
              <span>{t("التالي →", "Next →")}</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={mode === "practice" && !isAnswered}
              onClick={handleFinishQuiz}
              style={{ background: "#10b981", borderColor: "#10b981", color: "#ffffff" }}
            >
              <Icon name="check" size={16} />
              <span>{t("إنهاء الاختبار وعرض النتيجة", "Finish & View Diagnostic")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
