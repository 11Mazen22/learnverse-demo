"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "@/lib/i18n/locale";
import type { StudioCardItem } from "./flashcard-review-studio";
import { StudyRichText } from "./study-rich-text";

export type MistakeLogItem = {
  id: string;
  source_type: "quiz" | "cloze" | "typed_recall" | "flashcard" | "exam" | string;
  deck_id: string | null;
  card_id: string | null;
  lesson_id: string | null;
  topic: string;
  prompt: string;
  user_answer: string;
  expected_answer: string;
  explanation: string;
  mistake_count: number;
  resolved_at: string | null;
  last_missed_at: string;
};

export type StudySessionItem = {
  id: string;
  session_mode: string;
  title: string;
  deck_ids: string[];
  status: string;
  total_items: number;
  completed_items: number;
  correct_items: number;
  started_at: string;
  updated_at: string;
  checkpoint?: Record<string, unknown> | null;
};

export type DeckSummary = {
  id: string;
  title: string;
  cardCount: number;
  dueCount: number;
  lapseCount: number;
};

export type StudyMistakeHubProps = {
  decks: DeckSummary[];
  mistakes: MistakeLogItem[];
  sessions: StudySessionItem[];
  onStartInterleaved: (deckIds: string[]) => void;
  onStartAdaptive: () => void;
  onStartMistakeDrill: (cards: StudioCardItem[], title: string) => void;
  onToggleResolveMistake: (mistake: MistakeLogItem, resolved: boolean) => Promise<void> | void;
  onDeleteMistake: (mistakeId: string) => Promise<void> | void;
  onCompleteSession: (sessionId: string) => Promise<void> | void;
  busy?: boolean;
};

export function StudyMistakeHub({
  decks,
  mistakes,
  sessions,
  onStartInterleaved,
  onStartAdaptive,
  onStartMistakeDrill,
  onToggleResolveMistake,
  onDeleteMistake,
  onCompleteSession,
  busy = false,
}: StudyMistakeHubProps) {
  const t = useTranslation();

  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>(() =>
    decks.slice(0, 2).map((d) => d.id),
  );
  const [mistakeFilter, setMistakeFilter] = useState<"unresolved" | "resolved" | "all">("unresolved");

  const unresolvedMistakes = useMemo(
    () => mistakes.filter((m) => !m.resolved_at),
    [mistakes],
  );

  const visibleMistakes = useMemo(() => {
    if (mistakeFilter === "unresolved") return unresolvedMistakes;
    if (mistakeFilter === "resolved") return mistakes.filter((m) => Boolean(m.resolved_at));
    return mistakes;
  }, [mistakeFilter, mistakes, unresolvedMistakes]);

  const adaptiveTotal = useMemo(
    () => decks.reduce((acc, d) => acc + d.lapseCount + d.dueCount, 0),
    [decks],
  );

  function toggleDeckChoice(deckId: string) {
    setSelectedDeckIds((prev) =>
      prev.includes(deckId) ? prev.filter((id) => id !== deckId) : [...prev, deckId],
    );
  }

  function launchMistakeDrill() {
    if (unresolvedMistakes.length === 0) return;
    const drillCards: StudioCardItem[] = unresolvedMistakes.map((m) => ({
      id: m.card_id || `mistake-${m.id}`,
      front: m.prompt,
      back: m.expected_answer,
      cardType: "question_answer",
      concept: m.topic,
      hint: m.user_answer
        ? t(`إجابتك السابقة: ${m.user_answer}`, `Previous miss: ${m.user_answer}`)
        : undefined,
      explanation: m.explanation,
      state: "relearning",
      lapses: m.mistake_count,
    }));
    onStartMistakeDrill(drillCards, t("مراجعة الأخطاء غير المحلولة", "Unresolved Mistakes Drill"));
  }

  async function handleConfirmDelete(mistakeId: string) {
    const ok = await confirmAction({
      title: t("حذف سجل الخطأ؟", "Delete Mistake Entry?"),
      description: t(
        "سيُزال هذا السجل من مكتبة الأخطاء ولن يظهر في تدريبات التعافي.",
        "This removes the entry from your mistake replay library.",
      ),
      confirmLabel: t("حذف", "Delete"),
      tone: "danger",
      icon: "trash",
    });
    if (ok) await onDeleteMistake(mistakeId);
  }

  return (
    <div className="noata-mistake-hub">
      {/* Multi-Deck Interleaving + Adaptive Queue Panel */}
      <div className="noata-hub-strategies-grid">
        <section className="card noata-strategy-card">
          <div className="noata-strategy-head">
            <Badge tone="accent">{t("تداخل متعدد المجموعات", "Interleaved Mix")}</Badge>
            <span className="noata-study-muted">
              {t(`${selectedDeckIds.length} محددة`, `${selectedDeckIds.length} selected`)}
            </span>
          </div>
          <h4>{t("جلسة متداخلة بين المواد", "Multi-Deck Interleaved Practice")}</h4>
          <p className="noata-study-muted">
            {t(
              "ادمج بطاقات من مجموعتين أو أكثر في دورة واحدة لتعزيز التمييز المفاهيمي وتثبيت الذاكرة طويلة المدى.",
              "Blend cards across multiple decks into one mixed queue to strengthen long-term discrimination.",
            )}
          </p>

          {decks.length === 0 ? (
            <p className="noata-study-muted">{t("أنشئ مجموعات أولاً لاستخدام المزج المتداخل.", "Create decks first to mix across them.")}</p>
          ) : (
            <div className="noata-interleave-chips" role="group" aria-label={t("اختيار المجموعات", "Select decks to interleave")}>
              {decks.map((deck) => {
                const chosen = selectedDeckIds.includes(deck.id);
                return (
                  <button
                    key={deck.id}
                    type="button"
                    aria-pressed={chosen}
                    className={`noata-chip-btn ${chosen ? "is-active" : ""}`}
                    onClick={() => toggleDeckChoice(deck.id)}
                  >
                    <span>{deck.title}</span>
                    <small>({deck.cardCount})</small>
                  </button>
                );
              })}
            </div>
          )}

          <div className="noata-strategy-actions">
            <Button
              variant="primary"
              disabled={selectedDeckIds.length === 0 || busy}
              onClick={() => onStartInterleaved(selectedDeckIds)}
            >
              <Icon name="layers" size={16} />
              {t("ابدأ الجلسة المتداخلة", "Start Interleaved Session")}
            </Button>
          </div>
        </section>

        <section className="card noata-strategy-card">
          <div className="noata-strategy-head">
            <Badge tone="warning">{t("مراجعة تكيفية", "Adaptive Focus")}</Badge>
            <span className="noata-study-muted">
              {t(`${adaptiveTotal} بطاقة ذات أولوية`, `${adaptiveTotal} high-priority cards`)}
            </span>
          </div>
          <h4>{t("معالجة نقاط الضعف والتكرار العالي", "High-Lapse & Weak-Card Drill")}</h4>
          <p className="noata-study-muted">
            {t(
              "يجمع هذا الوضع البطاقات ذات الإخفاقات المتكررة والبطاقات المستحقة أولاً لتقليص فجوات الاسترجاع.",
              "Automatically targets cards with prior lapses and urgent SM-2 due dates first.",
            )}
          </p>

          <div className="noata-strategy-actions">
            <Button
              variant="primary"
              disabled={adaptiveTotal === 0 || busy}
              onClick={onStartAdaptive}
            >
              <Icon name="target" size={16} />
              {t("بدء المراجعة التكيفية", "Launch Adaptive Drill")}
            </Button>
            <Button
              variant="secondary"
              disabled={unresolvedMistakes.length === 0 || busy}
              onClick={launchMistakeDrill}
            >
              <Icon name="review" size={16} />
              {t(`تدريب الأخطاء (${unresolvedMistakes.length})`, `Mistake Drill (${unresolvedMistakes.length})`)}
            </Button>
          </div>
        </section>
      </div>

      {/* Mistake Replay Library */}
      <section className="card noata-mistake-library">
        <div className="noata-mistake-lib-header">
          <div>
            <h3>{t("مكتبة الأخطاء والتصحيح النشط", "Mistake Replay Library")}</h3>
            <p className="noata-study-muted">
              {t(
                "كل إجابة خاطئة من الاختبارات أو المطابقة أو الاسترجاع الكتابي تُحفظ هنا لمراجعتها وحلها.",
                "Every miss from quizzes, typed recall, cloze, or speed match is captured here for deliberate repair.",
              )}
            </p>
          </div>

          <div className="noata-mistake-filter-group" role="tablist" aria-label={t("تصفية الأخطاء", "Mistake Filter")}>
            {(
              [
                { id: "unresolved", label: t(`قيد المراجعة (${unresolvedMistakes.length})`, `Unresolved (${unresolvedMistakes.length})`) },
                { id: "resolved", label: t("تم إتقانها", "Resolved") },
                { id: "all", label: t("الكل", "All") },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={mistakeFilter === tab.id}
                className={`noata-chip-btn ${mistakeFilter === tab.id ? "is-active" : ""}`}
                onClick={() => setMistakeFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {visibleMistakes.length === 0 ? (
          <EmptyState
            icon="check-circle"
            title={t("لا توجد أخطاء في هذا التصنيف", "No mistakes in this view")}
            description={t(
              "عند مواجهة سؤال صعب أو خطأ كتابي أثناء المذاكرة سيظهر هنا مع الإجابة الصحيحة.",
              "Missed questions and recall slips automatically log here with full explanations.",
            )}
          />
        ) : (
          <ul className="noata-mistake-list">
            {visibleMistakes.map((m) => (
              <li key={m.id} className={`noata-mistake-item ${m.resolved_at ? "is-resolved" : ""}`}>
                <div className="noata-mistake-meta">
                  <Badge tone="neutral">{m.source_type}</Badge>
                  <Badge tone={m.mistake_count > 1 ? "danger" : "warning"}>
                    {t(`تكرر ${m.mistake_count}×`, `${m.mistake_count}× missed`)}
                  </Badge>
                  <span className="noata-mistake-topic">{m.topic}</span>
                </div>

                <div className="noata-mistake-body">
                  <div className="noata-mistake-prompt">
                    <StudyRichText content={m.prompt} />
                  </div>
                  <div className="noata-mistake-comparison">
                    {m.user_answer ? (
                      <div className="noata-mistake-wrong-ans">
                        <strong>{t("إجابتك:", "Your answer:")}</strong> {m.user_answer}
                      </div>
                    ) : null}
                    <div className="noata-mistake-expected-ans">
                      <strong>{t("الصحيح:", "Expected:")}</strong> <StudyRichText content={m.expected_answer} />
                    </div>
                  </div>
                  {m.explanation ? (
                    <p className="noata-mistake-explanation">{m.explanation}</p>
                  ) : null}
                </div>

                <div className="noata-mistake-actions">
                  <Button
                    size="sm"
                    variant={m.resolved_at ? "secondary" : "primary"}
                    disabled={busy}
                    onClick={() => onToggleResolveMistake(m, !m.resolved_at)}
                  >
                    <Icon name={m.resolved_at ? "refresh" : "check"} size={14} />
                    {m.resolved_at ? t("إعادة للمراجعة", "Reopen") : t("تحديد كمتقن", "Mark Resolved")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    aria-label={t("حذف سجل الخطأ", "Delete mistake entry")}
                    onClick={() => handleConfirmDelete(m.id)}
                  >
                    <Icon name="trash" size={14} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent Study Sessions */}
      {sessions.length > 0 ? (
        <section className="card noata-sessions-card">
          <h3>{t("سجل الجلسات الحديثة", "Recent Study Sessions")}</h3>
          <div className="noata-sessions-list">
            {sessions.slice(0, 6).map((s) => (
              <div key={s.id} className="noata-session-row">
                <div>
                  <strong>{s.title}</strong>
                  <div className="noata-session-sub">
                    <Badge tone="neutral">{s.session_mode}</Badge>
                    <span>
                      {s.completed_items}/{s.total_items} {t("عنصر", "items")}
                    </span>
                  </div>
                </div>
                <div className="noata-session-right">
                  <Badge tone={s.status === "completed" ? "success" : "warning"}>
                    {s.status === "completed" ? t("مكتملة", "Completed") : t("قيد التقدم", "In Progress")}
                  </Badge>
                  {s.status !== "completed" ? (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => onCompleteSession(s.id)}>
                      <Icon name="check" size={14} />
                      {t("إغلاق", "Finish")}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
