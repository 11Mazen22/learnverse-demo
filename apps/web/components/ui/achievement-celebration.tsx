"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { isReducedMotionActive } from "@/lib/appearance/device-preferences";
import {
  computeExamAchievementSummary,
  computeLessonAchievementSummary,
  evaluateStreakMilestones,
  type StreakMilestoneDefinition,
} from "@/lib/curriculum/achievement-milestones";

export interface AchievementGiftConfig {
  title: string;
  subtitle?: string;
  tier?: "bronze" | "silver" | "gold" | "diamond";
  openButtonLabel?: string;
  openingLabel?: string;
  unsealed: boolean;
  coins?: number;
  xp?: number;
  badge?: string;
  busy?: boolean;
  onOpen?: () => Promise<void> | void;
}

export interface AchievementCelebrationProps {
  kind: "streak" | "lesson" | "exam" | "review";
  locale: string;
  title?: string;
  subtitle?: string;
  rankLabel?: string;
  scorePct?: number;
  xpReward?: number;
  coinReward?: number;
  gemReward?: number;
  badgeText?: string;
  highlightNote?: string;
  gift?: AchievementGiftConfig;
  compact?: boolean;
  onClose?: () => void;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

function useAnimatedValue(target: number, durationMs = 650): number {
  const safeTarget = Number.isFinite(target) ? Math.max(0, Math.round(target)) : 0;
  const [value, setValue] = useState<number>(safeTarget);

  useEffect(() => {
    if (safeTarget === 0) {
      setValue(0);
      return;
    }
    if (isReducedMotionActive()) {
      setValue(safeTarget);
      return;
    }

    let raf = 0;
    const start = performance.now();
    setValue(0);

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(safeTarget * eased));
      if (progress < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [safeTarget, durationMs]);

  return value;
}

const PARTICLE_SYMBOLS_BY_KIND: Record<AchievementCelebrationProps["kind"], readonly string[]> = {
  streak: ["🔥", "⚡", "👑", "🎁", "✨", "⭐"],
  lesson: ["💎", "🪙", "✨", "⭐", "🎯", "🏆"],
  exam: ["🏆", "🎁", "🪙", "✨", "🛡️", "👑"],
  review: ["🧠", "✨", "🎯", "⭐", "💎", "📚"],
};

export function AchievementCelebration({
  kind,
  locale,
  title,
  subtitle,
  rankLabel,
  scorePct,
  xpReward = 0,
  coinReward = 0,
  gemReward = 0,
  badgeText,
  highlightNote,
  gift,
  compact = false,
  onClose,
  actions,
  children,
}: AchievementCelebrationProps) {
  const isAr = locale === "ar";
  const [openingAnim, setOpeningAnim] = useState(false);

  const animatedXp = useAnimatedValue(xpReward);
  const animatedCoins = useAnimatedValue(coinReward);
  const animatedGems = useAnimatedValue(gemReward);
  const animatedScore = useAnimatedValue(scorePct ?? 0);

  const particles = PARTICLE_SYMBOLS_BY_KIND[kind];

  const defaultCrest =
    rankLabel ||
    (kind === "streak"
      ? "🔥"
      : kind === "lesson"
        ? "💎"
        : kind === "exam"
          ? "🏆"
          : "🧠");

  const resolvedTitle =
    title ||
    (isAr
      ? kind === "streak"
        ? "إنجاز استمرارية جديد!"
        : kind === "lesson"
          ? "أحسنت! أتممت الدرس بنجاح"
          : kind === "exam"
            ? "مبروك اجتياز التحدي!"
            : "جلسة مراجعة ذكية مكتملة!"
      : kind === "streak"
        ? "Streak Milestone Unlocked!"
        : kind === "lesson"
          ? "Lesson Completed!"
          : kind === "exam"
            ? "Exam Victory!"
            : "Spaced Review Complete!");

  const handleGiftOpen = async () => {
    if (!gift?.onOpen || gift.unsealed || gift.busy || openingAnim) return;
    setOpeningAnim(true);
    try {
      await gift.onOpen();
    } finally {
      window.setTimeout(() => setOpeningAnim(false), 320);
    }
  };

  const hasCounters =
    typeof scorePct === "number" || xpReward > 0 || coinReward > 0 || gemReward > 0;

  return (
    <section
      className={`ach-celebration ach-celebration--${kind}${compact ? " ach-celebration--compact" : ""}`}
      aria-live="polite"
      data-testid={`achievement-celebration-${kind}`}
    >
      <div className="ach-particles" aria-hidden="true">
        {particles.map((symbol, index) => (
          <span
            key={`${kind}-p-${index}`}
            className="ach-particle"
            style={{ "--ach-idx": index } as React.CSSProperties}
          >
            {symbol}
          </span>
        ))}
      </div>

      <div className="ach-header">
        <div className="ach-crest" aria-hidden="true">
          <span className="ach-crest-inner">{defaultCrest}</span>
        </div>

        <div className="ach-header-copy">
          {badgeText ? <span className="ach-kicker">{badgeText}</span> : null}
          <h2 className="ach-title">{resolvedTitle}</h2>
          {subtitle ? <p className="ach-subtitle">{subtitle}</p> : null}
        </div>

        {onClose ? (
          <button
            type="button"
            className="btn btn-secondary ach-close-btn"
            onClick={onClose}
            aria-label={isAr ? "إغلاق نافذة التهنئة" : "Close celebration"}
          >
            ✕
          </button>
        ) : null}
      </div>

      {hasCounters ? (
        <div className="ach-reward-grid">
          {typeof scorePct === "number" ? (
            <div className="ach-reward-card ach-reward-card--score">
              <span className="ach-reward-icon" aria-hidden="true">
                🎯
              </span>
              <div>
                <strong>{animatedScore}%</strong>
                <span>{isAr ? "دقة الإتقان" : "Accuracy"}</span>
              </div>
            </div>
          ) : null}

          {gemReward > 0 ? (
            <div className="ach-reward-card ach-reward-card--gem">
              <span className="ach-reward-icon ach-gem-spin" aria-hidden="true">
                💎
              </span>
              <div>
                <strong>+{animatedGems}</strong>
                <span>{isAr ? "جواهر الدرس" : "Lesson Gems"}</span>
              </div>
            </div>
          ) : null}

          {coinReward > 0 ? (
            <div className="ach-reward-card ach-reward-card--coin">
              <span className="ach-reward-icon" aria-hidden="true">
                🪙
              </span>
              <div>
                <strong>+{animatedCoins}</strong>
                <span>{isAr ? "عملات ذهبية" : "Coins"}</span>
              </div>
            </div>
          ) : null}

          {xpReward > 0 ? (
            <div className="ach-reward-card ach-reward-card--xp">
              <span className="ach-reward-icon" aria-hidden="true">
                ⚡
              </span>
              <div>
                <strong>+{animatedXp} XP</strong>
                <span>{isAr ? "نقاط الخبرة" : "Experience"}</span>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {highlightNote ? <div className="ach-highlight-note">{highlightNote}</div> : null}

      {gift ? (
        <div
          className={`ach-gift-chest ach-gift-chest--${gift.tier || "gold"} ${
            gift.unsealed
              ? "ach-gift-chest--unsealed"
              : openingAnim
                ? "ach-gift-chest--opening"
                : "ach-gift-chest--sealed"
          }`}
          data-testid="achievement-gift-chest"
        >
          <div className="ach-gift-visual" aria-hidden="true">
            {gift.unsealed ? "🎊" : "🎁"}
          </div>
          <div className="ach-gift-copy">
            <strong>{gift.title}</strong>
            {gift.subtitle ? <p>{gift.subtitle}</p> : null}
            {gift.unsealed ? (
              <div className="ach-gift-loot">
                {typeof gift.coins === "number" && gift.coins > 0 ? (
                  <span className="ach-loot-pill">🪙 +{gift.coins} {isAr ? "عملة" : "Coins"}</span>
                ) : null}
                {typeof gift.xp === "number" && gift.xp > 0 ? (
                  <span className="ach-loot-pill">⚡ +{gift.xp} XP</span>
                ) : null}
                {gift.badge ? <span className="ach-loot-pill">{gift.badge}</span> : null}
              </div>
            ) : null}
          </div>
          {!gift.unsealed && gift.onOpen ? (
            <button
              type="button"
              className="btn btn-primary ach-gift-open-btn"
              onClick={handleGiftOpen}
              disabled={gift.busy || openingAnim}
              data-testid="open-achievement-gift-btn"
            >
              {gift.busy || openingAnim
                ? gift.openingLabel || (isAr ? "جارٍ فتح الهدية..." : "Opening gift...")
                : gift.openButtonLabel || (isAr ? "🎁 افتح هديتك الآن" : "🎁 Open Your Gift")}
            </button>
          ) : null}
        </div>
      ) : null}

      {children ? <div className="ach-body">{children}</div> : null}

      {actions ? <div className="ach-actions">{actions}</div> : null}
    </section>
  );
}

export interface StreakMilestoneRoadProps {
  streakDays: number;
  locale: string;
  userId?: string | null;
  compact?: boolean;
  rewardsHref?: string;
  studyHref?: string;
}

export function StreakMilestoneRoad({
  streakDays,
  locale,
  userId,
  compact = false,
  rewardsHref = "/rewards",
  studyHref = "/missions",
}: StreakMilestoneRoadProps) {
  const isAr = locale === "ar";
  const evaluation = useMemo(() => evaluateStreakMilestones(streakDays), [streakDays]);
  const [modalMilestone, setModalMilestone] = useState<StreakMilestoneDefinition | null>(null);
  const [giftUnsealed, setGiftUnsealed] = useState(false);

  // Auto-open celebration modal once per milestone reached (>= 3, 7, 14, 30 days)
  useEffect(() => {
    if (!evaluation.currentMilestone) return;
    if (typeof window === "undefined") return;
    const key = `noata:celebration-seen:${userId || "guest"}:streak-${evaluation.currentMilestone.days}`;
    try {
      if (window.localStorage.getItem(key) === "1") return;
      window.localStorage.setItem(key, "1");
      setGiftUnsealed(false);
      setModalMilestone(evaluation.currentMilestone);
    } catch {
      // Ignore storage failures
    }
  }, [evaluation.currentMilestone, userId]);

  // Allow closing modal cleanly with Escape
  useEffect(() => {
    if (!modalMilestone) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalMilestone(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalMilestone]);

  const openMilestoneCelebration = (target: StreakMilestoneDefinition) => {
    setGiftUnsealed(false);
    setModalMilestone(target);
  };

  const previewTarget = evaluation.currentMilestone ?? evaluation.nextMilestone;

  const modalOverlay =
    modalMilestone ? (
      <div
        className="ach-modal-backdrop"
        dir={isAr ? "rtl" : "ltr"}
        role="dialog"
        aria-modal="true"
        aria-label={isAr ? "احتفال هدية الاستمرارية" : "Streak Milestone Celebration"}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModalMilestone(null);
        }}
      >
        <div className="ach-modal-shell">
          <AchievementCelebration
            kind="streak"
            locale={locale}
            rankLabel={`${modalMilestone.icon} ${modalMilestone.days}`}
            badgeText={
              streakDays >= modalMilestone.days
                ? isAr
                  ? `تهنئة إنجاز ${modalMilestone.days} أيام`
                  : `${modalMilestone.days}-Day Milestone Reached`
                : isAr
                  ? `هدفك القادم: ${modalMilestone.days} أيام`
                  : `Next Milestone: ${modalMilestone.days} Days`
            }
            title={
              streakDays >= modalMilestone.days
                ? isAr
                  ? `مبروك! حققت ${modalMilestone.titleAr} (${modalMilestone.days} أيام)`
                  : `Congrats! ${modalMilestone.titleEn} (${modalMilestone.days} Days)`
                : isAr
                  ? `استعد لهدية ${modalMilestone.titleAr} (${modalMilestone.days} أيام)`
                  : `Preview: ${modalMilestone.titleEn} (${modalMilestone.days} Days)`
            }
            subtitle={isAr ? modalMilestone.descAr : modalMilestone.descEn}
            highlightNote={
              streakDays >= modalMilestone.days
                ? isAr
                  ? `استمرارتك الحالية ${streakDays} يومًا تمنحك شارة ${modalMilestone.titleAr}. افتح الهدية لاستكشاف مكافأة المرحلة!`
                  : `Your ${streakDays}-day streak unlocked ${modalMilestone.titleEn}. Open your milestone gift below!`
                : isAr
                  ? `أكمل ${Math.max(1, modalMilestone.days - streakDays)} يومًا إضافيًا من المذاكرة لفتح هذه المرحلة تلقائيًا.`
                  : `Complete ${Math.max(1, modalMilestone.days - streakDays)} more day(s) of study to unlock this milestone.`
            }
            onClose={() => setModalMilestone(null)}
            gift={{
              title: isAr ? modalMilestone.giftLabelAr : modalMilestone.giftLabelEn,
              subtitle:
                streakDays >= modalMilestone.days
                  ? isAr
                    ? "شارة إنجاز استمرارية بصرية — تُفتح الصناديق الرسمية للعملات والخبرة عبر سجل الخادم في صفحة المكافآت."
                    : "Visual milestone distinction — official Coin & XP reward boxes open via verified server ledger on Rewards."
                  : isAr
                    ? "معاينة لمكافأة المرحلة عند بلوغها."
                    : "Preview of the milestone reward.",
              tier: modalMilestone.tier,
              unsealed: giftUnsealed,
              badge: `${modalMilestone.icon} ${
                isAr ? modalMilestone.titleAr : modalMilestone.titleEn
              }`,
              openButtonLabel: isAr ? "🎁 اكشف هدية المرحلة" : "🎁 Reveal Milestone Gift",
              onOpen: () => {
                setGiftUnsealed(true);
              },
            }}
            actions={
              <>
                <Link
                  href={studyHref}
                  className="btn btn-primary"
                  onClick={() => setModalMilestone(null)}
                >
                  {isAr ? "أكمل مهمة اليوم" : "Complete Today's Mission"}
                </Link>
                <Link
                  href={rewardsHref}
                  className="btn btn-secondary"
                  onClick={() => setModalMilestone(null)}
                >
                  {isAr ? "متجر وصناديق الهدايا" : "Rewards & Gift Boxes"}
                </Link>
              </>
            }
          />
        </div>
      </div>
    ) : null;

  return (
    <div
      className={`ach-streak-road${compact ? " ach-streak-road--compact" : ""}`}
      data-testid="streak-milestone-road"
    >
      <div className="ach-streak-road-head">
        <div className="ach-streak-road-title">
          <span className="ach-streak-flame" aria-hidden="true">
            🔥
          </span>
          <div>
            <strong>
              {isAr
                ? `طريق هدايا الاستمرارية (${evaluation.streakDays} يوم حاليًا)`
                : `Streak Gift Road (${evaluation.streakDays} day streak)`}
            </strong>
            <p>
              {evaluation.allCompleted
                ? isAr
                  ? "أتممت جميع مراحل الاستمرارية حتى 30 يومًا! واصل الحفاظ على اللقب الماسي."
                  : "You unlocked every milestone up to 30 days! Keep your Diamond Legend streak alive."
                : isAr
                  ? `متبقّي ${evaluation.daysToNext} يوم لفتح هدية «${evaluation.nextMilestone.titleAr}» (${evaluation.nextMilestone.days} أيام).`
                  : `${evaluation.daysToNext} day(s) left to unlock "${evaluation.nextMilestone.titleEn}" (${evaluation.nextMilestone.days} days).`}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary ach-streak-preview-btn"
          onClick={() => openMilestoneCelebration(previewTarget)}
          data-testid="open-streak-celebration-btn"
        >
          {evaluation.currentMilestone
            ? isAr
              ? `🎁 تهنئة وهدية ${evaluation.currentMilestone.days} أيام`
              : `🎁 ${evaluation.currentMilestone.days}d Gift`
            : isAr
              ? "🎁 معاينة هدايا الاستمرارية"
              : "🎁 Preview Streak Gifts"}
        </button>
      </div>

      <div className="ach-streak-bar" aria-hidden="true">
        <span style={{ width: `${evaluation.progressPct}%` }} />
      </div>

      <div className="ach-streak-nodes">
        {evaluation.milestones.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => openMilestoneCelebration(m)}
            className={`ach-streak-node ach-streak-node--${m.tier}${
              m.unlocked ? " is-unlocked" : " is-locked"
            }${m.isCurrent ? " is-current" : ""}`}
            data-testid={`streak-node-${m.days}`}
          >
            <span className="ach-streak-node-icon" aria-hidden="true">
              {m.unlocked ? m.icon : "🎁"}
            </span>
            <span className="ach-streak-node-days">
              {isAr ? `${m.days} أيام` : `${m.days}d`}
            </span>
            <span className="ach-streak-node-label">
              {isAr ? m.titleAr : m.titleEn}
            </span>
            <span className="ach-streak-node-state">
              {m.unlocked
                ? isAr
                  ? "مفتوحة ✓"
                  : "Unlocked ✓"
                : isAr
                  ? "قادمة"
                  : "Locked"}
            </span>
          </button>
        ))}
      </div>

      {modalOverlay && typeof document !== "undefined"
        ? createPortal(modalOverlay, document.body)
        : modalOverlay}
    </div>
  );
}

export { computeExamAchievementSummary, computeLessonAchievementSummary };
