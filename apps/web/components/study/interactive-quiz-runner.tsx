"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import type { QuizGeckoBundle, QuizFlashcard } from "@/lib/study/quizgecko-engine";
import { convertMissedQuestionsToCards } from "@/lib/study/quizgecko-engine";
import { matchAnswer } from "@/lib/study/answer-matcher";
import { loadScopedStudyDraft, saveScopedStudyDraft } from "@/lib/study/draft-storage";
import { StudyRichText } from "./study-rich-text";

export type QuizMistakeRecord = {
  topic: string;
  prompt: string;
  userAnswer: string;
  expectedAnswer: string;
  explanation: string;
  sourceType: "quiz" | "exam";
};

export type QuizRunnerProps = {
  bundle: QuizGeckoBundle;
  userId?: string | null;
  authEpoch?: number;
  onFinish?: (score: number, missedCards: QuizFlashcard[], mistakes: QuizMistakeRecord[]) => void;
  onSaveRemedialDeck?: (score: number, missedCards: QuizFlashcard[], mistakes: QuizMistakeRecord[]) => Promise<void> | void;
  onRestart?: () => void;
};

type QuizDraftState = {
  bundleId: string;
  mode: "practice" | "exam";
  currentIndex: number;
  selectedAnswers: Record<number, number>;
  typedAnswers: Record<number, string>;
  flagged: number[];
  secondsElapsed: number;
};

export function InteractiveQuizRunner({
  bundle,
  userId,
  authEpoch = 0,
  onFinish,
  onSaveRemedialDeck,
  onRestart,
}: QuizRunnerProps) {
  const t = useTranslation();
  const locale = useLocale();
  const isEn = locale === "en";
  const { push } = useToast();

  const [mode, setMode] = useState<"practice" | "exam">("practice");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [typedAnswers, setTypedAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<number[]>([]);
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<number, number[]>>({});
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [savingRemedial, setSavingRemedial] = useState(false);
  const [remedialSaved, setRemedialSaved] = useState(false);
  const finishSubmittedLock = useRef(false);

  const questions = bundle.questions;
  const totalQuestions = questions.length;
  const currentQ = questions[currentIndex] ?? null;

  // Restore scoped 24h recovery draft on same bundle + user epoch
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = loadScopedStudyDraft<QuizDraftState>(
      window.localStorage,
      userId,
      authEpoch,
      `quiz_${bundle.id}`,
    );
    if (saved && saved.bundleId === bundle.id) {
      setMode(saved.mode === "exam" ? "exam" : "practice");
      setCurrentIndex(Math.min(Math.max(0, saved.currentIndex), Math.max(0, totalQuestions - 1)));
      setSelectedAnswers(saved.selectedAnswers ?? {});
      setTypedAnswers(saved.typedAnswers ?? {});
      setFlagged(Array.isArray(saved.flagged) ? saved.flagged : []);
      setSecondsElapsed(typeof saved.secondsElapsed === "number" ? saved.secondsElapsed : 0);
    }
    finishSubmittedLock.current = false;
    setIsFinished(false);
    setRemedialSaved(false);
  }, [authEpoch, bundle.id, totalQuestions, userId]);

  // Persist scoped checkpoint continuously while quiz is active
  useEffect(() => {
    if (typeof window === "undefined" || isFinished) return;
    saveScopedStudyDraft<QuizDraftState>(window.localStorage, userId, authEpoch, `quiz_${bundle.id}`, {
      bundleId: bundle.id,
      mode,
      currentIndex,
      selectedAnswers,
      typedAnswers,
      flagged,
      secondsElapsed,
    });
  }, [authEpoch, bundle.id, currentIndex, flagged, isFinished, mode, secondsElapsed, selectedAnswers, typedAnswers, userId]);

  // Timer ticker
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  const isQuestionAnswered = useCallback(
    (idx: number): boolean => {
      const q = questions[idx];
      if (!q) return false;
      if (q.type === "fill_blank") return (typedAnswers[idx] ?? "").trim().length > 0;
      return selectedAnswers[idx] !== undefined;
    },
    [questions, selectedAnswers, typedAnswers],
  );

  const isQuestionCorrect = useCallback(
    (idx: number): boolean => {
      const q = questions[idx];
      if (!q) return false;
      if (q.type === "fill_blank") {
        const expected = q.options[q.correctIndex] ?? "";
        return matchAnswer(typedAnswers[idx] ?? "", expected, { mode: "normalized" }).matched;
      }
      return selectedAnswers[idx] === q.correctIndex;
    },
    [questions, selectedAnswers, typedAnswers],
  );

  const handleSelectOption = (optIndex: number) => {
    // Practice mode locks after answering so immediate pedagogical feedback cannot be gamed;
    // Exam mode allows changing answers freely until explicit final submission!
    if (selectedAnswers[currentIndex] !== undefined && mode === "practice") return;
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optIndex }));
  };

  const handleUse5050 = () => {
    if (mode === "exam" || !currentQ || eliminatedOptions[currentIndex]) return;
    const wrongIndices = currentQ.options
      .map((_, i) => i)
      .filter((i) => i !== currentQ.correctIndex);
    const shuffled = [...wrongIndices].sort(() => 0.5 - Math.random());
    setEliminatedOptions((prev) => ({ ...prev, [currentIndex]: shuffled.slice(0, 2) }));
  };

  const handleToggleHint = () => {
    if (mode === "exam") return;
    setRevealedHints((prev) => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
  };

  const toggleFlag = () => {
    setFlagged((prev) =>
      prev.includes(currentIndex) ? prev.filter((i) => i !== currentIndex) : [...prev, currentIndex],
    );
  };

  const switchMode = async (nextMode: "practice" | "exam") => {
    if (nextMode === mode) return;
    if (nextMode === "exam") {
      // Switching into Strict Exam hides any prior hints/eliminations cleanly
      setRevealedHints({});
      setEliminatedOptions({});
      push({
        title: t(
          "تم تفعيل وضع الامتحان الصارم: التلميحات وحذف الخيارات مقفلة حتى التسليم النهائي.",
          "Strict Exam Mode active: hints, lifelines, and answers are locked until final submission.",
        ),
        tone: "info",
      });
    }
    setMode(nextMode);
  };

  const buildMissedSummary = useCallback(() => {
    const missedQuestions = questions.filter((_, idx) => !isQuestionCorrect(idx));
    const missedCards = convertMissedQuestionsToCards(missedQuestions);
    const mistakes: QuizMistakeRecord[] = questions
      .map((q, idx) => ({ q, idx }))
      .filter(({ idx }) => !isQuestionCorrect(idx))
      .map(({ q, idx }) => ({
        topic: q.concept || bundle.topic,
        prompt: q.question,
        userAnswer:
          q.type === "fill_blank"
            ? typedAnswers[idx] || t("لم يكتب إجابة", "No answer typed")
            : selectedAnswers[idx] !== undefined
              ? q.options[selectedAnswers[idx]]
              : t("لم يجب", "Unanswered"),
        expectedAnswer: q.options[q.correctIndex] ?? "",
        explanation: q.explanation,
        sourceType: mode === "exam" ? "exam" : "quiz",
      }));
    return { missedCards, mistakes };
  }, [bundle.topic, isQuestionCorrect, mode, questions, selectedAnswers, t, typedAnswers]);

  const calculateScore = useCallback(() => {
    let correct = 0;
    questions.forEach((_, idx) => {
      if (isQuestionCorrect(idx)) correct += 1;
    });
    return {
      correct,
      total: totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0,
    };
  }, [isQuestionCorrect, questions, totalQuestions]);

  const handleFinishQuiz = async () => {
    if (finishSubmittedLock.current) return;
    const unansweredCount = questions.filter((_, idx) => !isQuestionAnswered(idx)).length;
    if (mode === "exam" && unansweredCount > 0) {
      const confirmed = await confirmAction({
        title: t(`تبقى ${unansweredCount} أسئلة دون إجابة`, `${unansweredCount} unanswered questions remain`),
        description: t(
          "هل تريد تسليم الامتحان الآن واحتساب الأسئلة الفارغة كأخطاء؟",
          "Submit the exam now? Unanswered questions will be scored as incorrect.",
        ),
        confirmLabel: t("تسليم الامتحان الآن", "Submit Exam"),
        cancelLabel: t("العودة للمراجعة", "Keep Reviewing"),
        tone: "default",
        icon: "check",
      });
      if (!confirmed) return;
    }

    finishSubmittedLock.current = true;
    setIsFinished(true);
    const score = calculateScore();
    const { missedCards, mistakes } = buildMissedSummary();
    onFinish?.(score.percentage, missedCards, mistakes);
  };

  const handleSaveRemedial = async () => {
    if (savingRemedial || remedialSaved) return;
    const score = calculateScore();
    const { missedCards, mistakes } = buildMissedSummary();
    if (missedCards.length === 0) return;

    setSavingRemedial(true);
    try {
      await onSaveRemedialDeck?.(score.percentage, missedCards, mistakes);
      setRemedialSaved(true);
      push({
        title: t(
          `تم تحويل ${missedCards.length} أسئلة إلى سجل الأخطاء ومجموعة بطاقات علاجية!`,
          `Saved ${missedCards.length} missed items to your Mistake Library & Remedial Deck!`,
        ),
        tone: "success",
      });
    } catch {
      push({
        title: t("تعذّر حفظ المجموعة العلاجية. حاول مرة أخرى.", "Could not save remedial deck. Try again."),
        tone: "danger",
      });
    } finally {
      setSavingRemedial(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (!currentQ && !isFinished) {
    return (
      <div className="noata-quiz-card nk-study-center-card">
        <p>{t("لا توجد أسئلة متاحة في هذا الاختبار.", "No questions available in this assessment.")}</p>
        <Button variant="primary" onClick={onRestart}>
          {t("العودة للمولّد", "Back to Generator")}
        </Button>
      </div>
    );
  }

  // Diagnostic Report View
  if (isFinished) {
    const score = calculateScore();
    const { missedCards } = buildMissedSummary();
    const gradeLabel =
      score.percentage >= 90
        ? isEn
          ? "Mastery — Exceptional"
          : "إتقان استثنائي (ممتاز مرتفع)"
        : score.percentage >= 75
          ? isEn
            ? "Proficient — Strong"
            : "استيعاب قوي (جيد جدًا)"
          : score.percentage >= 50
            ? isEn
              ? "Developing — Practice Needed"
              : "مستوى متوسط (يحتاج ترسيخًا)"
            : isEn
              ? "Foundational Review Recommended"
              : "بحاجة لمراجعة الأساسيات";

    return (
      <div className="noata-quiz-container">
        <div className="noata-quiz-card nk-study-center-card">
          <Badge tone={score.percentage >= 75 ? "success" : "warning"}>
            {mode === "exam"
              ? t("نتيجة الامتحان الصارم", "Strict Exam Diagnostic")
              : t("تقرير الأداء التشخيصي", "Diagnostic Performance Report")}
          </Badge>
          <h2 className="nk-study-complete-score">{score.percentage}%</h2>
          <p className="nk-study-complete-label">{gradeLabel}</p>
          <p className="nk-study-complete-sub">
            {t(
              `أجبت بشكل صحيح على ${score.correct} من إجمالي ${score.total} أسئلة في زمن قدره ${formatTime(secondsElapsed)}.`,
              `Answered ${score.correct} of ${score.total} correctly in ${formatTime(secondsElapsed)}.`,
            )}
          </p>

          <div className="nk-report-actions">
            <Button variant="primary" onClick={onRestart}>
              <Icon name="arrow" size={16} />
              <span>{t("اختبار جديد", "New Assessment")}</span>
            </Button>

            {missedCards.length > 0 && (
              <Button
                variant="secondary"
                disabled={savingRemedial || remedialSaved}
                onClick={() => void handleSaveRemedial()}
              >
                <Icon name="sparkles" size={16} />
                <span>
                  {remedialSaved
                    ? t("تم الحفظ في سجل الأخطاء والمجموعات ✓", "Saved to Mistake Hub & Remedial Deck ✓")
                    : t(
                        `حفظ ${missedCards.length} أسئلة خاطئة في سجل الأخطاء والبطاقات`,
                        `Save ${missedCards.length} Missed -> Mistake Hub & Deck`,
                      )}
                </span>
              </Button>
            )}
          </div>

          <div className="nk-diagnostic-breakdown">
            <h3>{t("المراجعة التفصيلية وتفكيك المفاهيم الخاطئة", "Detailed Concept Review & Misconceptions")}</h3>
            <div className="nk-diagnostic-list">
              {questions.map((q, qIdx) => {
                const isCorrect = isQuestionCorrect(qIdx);
                const userDisplay =
                  q.type === "fill_blank"
                    ? typedAnswers[qIdx] || t("لم تجب", "Unanswered")
                    : selectedAnswers[qIdx] !== undefined
                      ? q.options[selectedAnswers[qIdx]]
                      : t("لم تجب", "Unanswered");

                return (
                  <article
                    key={q.id}
                    className={`nk-diagnostic-item ${isCorrect ? "is-correct" : "is-wrong"}`}
                  >
                    <div className="nk-diagnostic-head">
                      <strong>
                        {t(`السؤال ${qIdx + 1}`, `Question ${qIdx + 1}`)}: {q.question}
                      </strong>
                      <Badge tone={isCorrect ? "success" : "danger"}>
                        {isCorrect ? t("صحيح", "Correct") : t("غير صحيح", "Incorrect")}
                      </Badge>
                    </div>
                    <p>
                      <strong>{t("إجابتك:", "Your answer:")}</strong> {userDisplay}
                    </p>
                    {!isCorrect && (
                      <p className="nk-diagnostic-expected">
                        <strong>{t("الإجابة الصحيحة:", "Expected answer:")}</strong>{" "}
                        {q.options[q.correctIndex]}
                      </p>
                    )}
                    <div className="nk-diagnostic-rationale">
                      <StudyRichText content={`💡 ${q.explanation}`} />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Question View
  const isAnswered = isQuestionAnswered(currentIndex);
  const isCorrect = isQuestionCorrect(currentIndex);
  const isWrong = isAnswered && !isCorrect;
  const eliminated = eliminatedOptions[currentIndex] ?? [];
  const hintShown = revealedHints[currentIndex] ?? false;
  const userAnswer = selectedAnswers[currentIndex];
  const isFlagged = flagged.includes(currentIndex);

  return (
    <div className="noata-quiz-container">
      <div className="noata-quiz-topbar">
        <div className="nk-quiz-meta-left">
          <strong className="nk-quiz-qnum">
            {t(`سؤال ${currentIndex + 1} من ${totalQuestions}`, `Q ${currentIndex + 1} of ${totalQuestions}`)}
          </strong>
          <Badge tone={mode === "exam" ? "warning" : "neutral"}>⏱ {formatTime(secondsElapsed)}</Badge>
        </div>

        <div className="noata-quiz-progress-track nk-quiz-track-inline" aria-hidden="true">
          <div
            className="noata-quiz-progress-fill"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        <div className="noata-lifeline-dock">
          <button
            type="button"
            className={`noata-lifeline-btn ${isFlagged ? "is-active" : ""}`}
            aria-pressed={isFlagged}
            onClick={toggleFlag}
          >
            <span>🚩 {isFlagged ? t("معلّم للمراجعة", "Flagged") : t("تحديد", "Flag")}</span>
          </button>

          <button
            type="button"
            className="noata-lifeline-btn"
            onClick={handleToggleHint}
            disabled={mode === "exam"}
            title={mode === "exam" ? t("معطل في وضع الامتحان الصارم", "Locked during Strict Exam") : t("تلميح سقراطي", "Socratic hint")}
          >
            <span>{mode === "exam" ? "🔒" : "💡"} {t("تلميح", "Hint")}</span>
          </button>

          <button
            type="button"
            className="noata-lifeline-btn"
            onClick={handleUse5050}
            disabled={mode === "exam" || Boolean(eliminatedOptions[currentIndex]) || currentQ.options.length <= 2 || currentQ.type === "fill_blank"}
            title={mode === "exam" ? t("معطل في وضع الامتحان الصارم", "Locked during Strict Exam") : t("حذف خيارين (50:50)", "Eliminate 2 options")}
          >
            <span>{mode === "exam" ? "🔒" : "⚡"} 50:50</span>
          </button>
        </div>
      </div>

      {/* Question Navigator Strip */}
      <nav className="nk-quiz-nav-dots" aria-label={t("التنقل بين أسئلة الاختبار", "Quiz question navigator")}>
        {questions.map((_, qIdx) => {
          const answered = isQuestionAnswered(qIdx);
          const qFlagged = flagged.includes(qIdx);
          return (
            <button
              key={qIdx}
              type="button"
              className={[
                "nk-quiz-dot",
                qIdx === currentIndex ? "is-current" : "",
                answered ? "is-answered" : "",
                qFlagged ? "is-flagged" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={qIdx === currentIndex ? "step" : undefined}
              onClick={() => setCurrentIndex(qIdx)}
            >
              {qIdx + 1}
              {qFlagged ? "!" : ""}
            </button>
          );
        })}
      </nav>

      {/* Main Question Card */}
      <div className="noata-quiz-card">
        <div className="nk-quiz-card-head">
          <Badge tone="accent">{currentQ.concept || bundle.topic}</Badge>

          <div className="nk-mode-switch" role="group" aria-label={t("نمط التقييم", "Assessment Mode")}>
            <Button
              size="sm"
              variant={mode === "practice" ? "primary" : "subtle"}
              onClick={() => void switchMode("practice")}
            >
              <span>{t("تدريب فوري (Tutor)", "Tutor Mode")}</span>
            </Button>
            <Button
              size="sm"
              variant={mode === "exam" ? "primary" : "subtle"}
              onClick={() => void switchMode("exam")}
            >
              <span>{t("امتحان صارم (Exam)", "Strict Exam")}</span>
            </Button>
          </div>
        </div>

        <div className="noata-quiz-question-text" dir="auto">
          <StudyRichText content={currentQ.question} />
        </div>

        {/* Socratic Hint in Tutor Mode */}
        {mode === "practice" && hintShown && (
          <div className="nk-study-hint-banner" dir="auto">
            <strong>💡 {t("تلميح سقراطي:", "Socratic Hint:")}</strong>{" "}
            <StudyRichText content={currentQ.hint} />
          </div>
        )}

        {/* Options or Typed Fill Blank */}
        {currentQ.type === "fill_blank" ? (
          <div className="nk-quiz-fill-blank">
            <label>
              <span>{t("أدخل الإجابة:", "Enter your answer:")}</span>
              <input
                type="text"
                className="nk-input"
                dir="auto"
                value={typedAnswers[currentIndex] ?? ""}
                onChange={(e) =>
                  setTypedAnswers((prev) => ({ ...prev, [currentIndex]: e.target.value }))
                }
                placeholder={t("اكتب المصطلح أو القيمة الدقيقة…", "Type exact concept or term…")}
              />
            </label>
          </div>
        ) : (
          <div className="noata-quiz-options-grid">
            {currentQ.options.map((opt, optIdx) => {
              const isElim = eliminated.includes(optIdx);
              const isSelected = userAnswer === optIdx;
              const showFeedback = mode === "practice" && isAnswered;

              const stateClasses = ["noata-quiz-opt-btn"];
              if (isElim) stateClasses.push("is-eliminated");
              else if (showFeedback) {
                if (optIdx === currentQ.correctIndex) stateClasses.push("is-correct");
                else if (isSelected) stateClasses.push("is-wrong");
              } else if (isSelected) {
                stateClasses.push("is-selected");
              }

              const letterMarker = String.fromCharCode(65 + optIdx);

              return (
                <button
                  key={optIdx}
                  type="button"
                  className={stateClasses.join(" ")}
                  aria-pressed={isSelected}
                  disabled={isElim || (mode === "practice" && isAnswered)}
                  onClick={() => handleSelectOption(optIdx)}
                >
                  <span className="noata-quiz-opt-marker">{letterMarker}</span>
                  <span className="nk-quiz-opt-text" dir="auto">
                    <StudyRichText content={opt} />
                  </span>
                  {showFeedback && optIdx === currentQ.correctIndex && <span aria-hidden="true">✓</span>}
                  {showFeedback && isSelected && optIdx !== currentQ.correctIndex && <span aria-hidden="true">✗</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Immediate Pedagogical Rationale strictly in Tutor Mode only */}
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
            <StudyRichText content={currentQ.explanation} />

            {isWrong && userAnswer !== undefined && currentQ.distractorExplanations?.[userAnswer] && (
              <div className="noata-misconception-card" dir="auto">
                <strong>⚠️ {t("لماذا اختيارك غير دقيق؟", "Why was your selection a trap?")}</strong>
                <StudyRichText content={currentQ.distractorExplanations[userAnswer]} />
              </div>
            )}

            <div className="nk-quiz-ai-followup">
              <Link
                href={
                  "/ai?prompt=" +
                  encodeURIComponent(
                    isEn
                      ? `In "${currentQ.question}", explain the core reasoning behind "${currentQ.options[currentQ.correctIndex]}".`
                      : `في سؤال «${currentQ.question}»، اشرح لي السبب العلمي وراء الإجابة «${currentQ.options[currentQ.correctIndex]}» وكيف أتجنب الخطأ الشائع.`
                  )
                }
                className="nk-btn nk-btn--secondary"
              >
                <Icon name="sparkles" size={14} />
                <span>{t("تعميق الفهم مع Noäta AI", "Deepen Understanding with Noäta AI")}</span>
              </Link>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="nk-quiz-nav-footer">
          <Button
            variant="subtle"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
          >
            <span>{t("السابق", "Previous")}</span>
          </Button>

          {currentIndex < totalQuestions - 1 ? (
            <Button
              variant="primary"
              disabled={mode === "practice" && !isAnswered}
              onClick={() => setCurrentIndex((idx) => Math.min(totalQuestions - 1, idx + 1))}
            >
              <span>{t("التالي", "Next")}</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={mode === "practice" && !isAnswered}
              onClick={() => void handleFinishQuiz()}
            >
              <Icon name="check" size={16} />
              <span>
                {mode === "exam"
                  ? t("تسليم الامتحان وعرض التقرير", "Submit Exam & View Report")
                  : t("إنهاء الاختبار وعرض التشخيص", "Finish & View Diagnostic")}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
