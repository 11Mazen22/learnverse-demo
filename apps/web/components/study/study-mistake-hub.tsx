"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import {
  buildClusterDrillCards,
  buildMistakeClusters,
  filterMistakesByCluster,
  type MistakeClusterDimension,
  type MistakeClusterSummary,
} from "@/lib/study/mistake-clustering";
import { buildStructuredAiHandoffHref } from "@/lib/ai/handoff-contract";
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
  initialTopicFilter?: string;
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
  initialTopicFilter,
  busy = false,
}: StudyMistakeHubProps) {
  const locale = useLocale();
  const t = useTranslation();

  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>(() =>
    decks.slice(0, 2).map((d) => d.id),
  );
  const [mistakeFilter, setMistakeFilter] = useState<"unresolved" | "resolved" | "all">("unresolved");
  const [clusterDimension, setClusterDimension] = useState<MistakeClusterDimension>("all");
  const [selectedCluster, setSelectedCluster] = useState<{
    dimension: Exclude<MistakeClusterDimension, "all">;
    key: string;
  } | null>(null);

  const clusterReport = useMemo(() => buildMistakeClusters(mistakes), [mistakes]);

  useEffect(() => {
    const clean = initialTopicFilter?.trim().toLowerCase();
    if (!clean) return;
    const matched = clusterReport.skills.find(
      (s) => s.key.toLowerCase() === clean || s.key.toLowerCase().includes(clean),
    );
    if (matched) {
      setClusterDimension("skill");
      setSelectedCluster({ dimension: "skill", key: matched.key });
    }
  }, [clusterReport.skills, initialTopicFilter]);

  const displayedClusters = useMemo<MistakeClusterSummary[]>(() => {
    if (clusterDimension === "skill") return clusterReport.skills;
    if (clusterDimension === "misconception") return clusterReport.misconceptions;
    if (clusterDimension === "format") return clusterReport.formats;
    return [
      ...clusterReport.misconceptions.slice(0, 3),
      ...clusterReport.skills.slice(0, 3),
    ];
  }, [clusterDimension, clusterReport]);

  const activeClusterSummary = useMemo(() => {
    if (!selectedCluster) return null;
    const pool =
      selectedCluster.dimension === "skill"
        ? clusterReport.skills
        : selectedCluster.dimension === "misconception"
          ? clusterReport.misconceptions
          : clusterReport.formats;
    return pool.find((item) => item.key === selectedCluster.key) ?? null;
  }, [clusterReport, selectedCluster]);

  const unresolvedMistakes = useMemo(
    () => mistakes.filter((m) => !m.resolved_at),
    [mistakes],
  );

  const visibleMistakes = useMemo(() => {
    const base =
      mistakeFilter === "unresolved"
        ? unresolvedMistakes
        : mistakeFilter === "resolved"
          ? mistakes.filter((m) => Boolean(m.resolved_at))
          : mistakes;
    if (!selectedCluster) return base;
    return filterMistakesByCluster(base, selectedCluster.dimension, selectedCluster.key);
  }, [mistakeFilter, mistakes, selectedCluster, unresolvedMistakes]);

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

  function launchClusterDrill() {
    if (!selectedCluster || !activeClusterSummary) return;
    const synthesized = buildClusterDrillCards(
      mistakes,
      selectedCluster.dimension,
      selectedCluster.key,
    );
    if (synthesized.length === 0) return;
    const drillCards: StudioCardItem[] = synthesized.map((card) => ({
      id: card.id,
      front: card.front,
      back: card.back,
      cardType: "question_answer",
      concept: card.tags[2] || (locale === "en" ? activeClusterSummary.labelEn : activeClusterSummary.labelAr),
      hint: card.hint,
      explanation: card.explanation,
      state: "relearning",
      lapses: card.lapses,
    }));
    const clusterTitle =
      locale === "en" ? activeClusterSummary.labelEn : activeClusterSummary.labelAr;
    onStartMistakeDrill(
      drillCards,
      t(`تدريب ذكي: ${clusterTitle}`, `Focused Drill: ${clusterTitle}`),
    );
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

        {/* Mistake Intelligence Clustering Bar */}
        {mistakes.length > 0 ? (
          <div className="noata-cluster-panel">
            <div className="noata-cluster-dim-tabs" role="tablist" aria-label={t("تحليل أنماط الأخطاء", "Mistake Clustering Dimensions")}>
              {(
                [
                  { id: "all", label: t("أبرز الأنماط", "Top Patterns") },
                  { id: "misconception", label: t(`المفاهيم الخاطئة (${clusterReport.misconceptions.length})`, `Misconceptions (${clusterReport.misconceptions.length})`) },
                  { id: "skill", label: t(`المهارات (${clusterReport.skills.length})`, `Skills (${clusterReport.skills.length})`) },
                  { id: "format", label: t(`صيغة التمرين (${clusterReport.formats.length})`, `Formats (${clusterReport.formats.length})`) },
                ] as const
              ).map((dim) => (
                <button
                  key={dim.id}
                  type="button"
                  role="tab"
                  aria-selected={clusterDimension === dim.id}
                  className={`noata-cluster-dim-btn ${clusterDimension === dim.id ? "is-active" : ""}`}
                  onClick={() => {
                    setClusterDimension(dim.id);
                    setSelectedCluster(null);
                  }}
                >
                  {dim.label}
                </button>
              ))}
            </div>

            {displayedClusters.length > 0 ? (
              <div className="noata-cluster-chips" role="group" aria-label={t("عناقيد الأخطاء المكتشفة", "Detected Mistake Clusters")}>
                {displayedClusters.map((cluster) => {
                  const isActive =
                    selectedCluster?.dimension === cluster.dimension &&
                    selectedCluster?.key === cluster.key;
                  const label = locale === "en" ? cluster.labelEn : cluster.labelAr;
                  return (
                    <button
                      key={`${cluster.dimension}-${cluster.key}`}
                      type="button"
                      aria-pressed={isActive}
                      className={`noata-cluster-pill ${isActive ? "is-active" : ""}`}
                      onClick={() =>
                        setSelectedCluster((prev) =>
                          prev?.dimension === cluster.dimension && prev?.key === cluster.key
                            ? null
                            : { dimension: cluster.dimension, key: cluster.key },
                        )
                      }
                    >
                      <span className="noata-cluster-pill-label">{label}</span>
                      <span className="noata-cluster-pill-count">
                        {cluster.unresolvedCount > 0 ? cluster.unresolvedCount : cluster.totalCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {activeClusterSummary ? (
              <div className="noata-cluster-focus-bar">
                <div className="noata-cluster-focus-copy">
                  <strong>
                    {locale === "en" ? activeClusterSummary.labelEn : activeClusterSummary.labelAr}
                  </strong>
                  <div className="noata-study-muted">
                    <StudyRichText
                      content={locale === "en" ? activeClusterSummary.hintEn : activeClusterSummary.hintAr}
                    />
                  </div>
                </div>
                <div className="noata-cluster-focus-actions">
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={busy}
                    onClick={launchClusterDrill}
                  >
                    <Icon name="target" size={14} />
                    {t("تدريب مركّز على العنقود", "Launch Cluster Drill")}
                  </Button>
                  <Link
                    href={buildStructuredAiHandoffHref({
                      source: "mistake",
                      action: "mistake_repair",
                      topic: locale === "en" ? activeClusterSummary.labelEn : activeClusterSummary.labelAr,
                    })}
                    className="nk-btn nk-btn--secondary nk-btn--sm"
                  >
                    <Icon name="ai" size={14} />
                    {t("أصلح مع المعلم الذكي", "Repair with Noäta AI")}
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedCluster(null)}
                  >
                    {t("عرض الكل", "Clear")}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

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
                        <strong>{t("إجابتك:", "Your answer:")}</strong> <StudyRichText content={m.user_answer} inline />
                      </div>
                    ) : null}
                    <div className="noata-mistake-expected-ans">
                      <strong>{t("الصحيح:", "Expected:")}</strong> <StudyRichText content={m.expected_answer} inline />
                    </div>
                  </div>
                  {m.explanation ? (
                    <div className="noata-mistake-explanation">
                      <StudyRichText content={m.explanation} />
                    </div>
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
                  <Link
                    href={buildStructuredAiHandoffHref({
                      source: "mistake",
                      action: "mistake_repair",
                      lessonId: m.lesson_id,
                      topic: m.topic || m.prompt.slice(0, 80),
                    })}
                    className="nk-btn nk-btn--secondary nk-btn--sm"
                  >
                    <Icon name="ai" size={14} />
                    {t("اسأل AI", "Ask AI")}
                  </Link>
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
