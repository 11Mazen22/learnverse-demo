"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { localized, useLocale } from "@/lib/i18n/locale";
import { boundedRead, useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import type { TourDefinition, TourProgress, TourRole, TourStateMap } from "./tour-types";
import {
  mergeTourStates,
  pageTourForPath,
  progressIsCurrent,
  roleCanUseTour,
  sanitizeTourState,
  tourDefinitionById,
  tourStateFromRows,
  tourStorageKey,
  welcomeTourForRole,
  type TourProgressRow,
} from "./tour-state";

type TourContextValue = {
  activeTour: TourDefinition | null;
  stepIndex: number;
  totalSteps: number;
  startTour: (tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  finishTour: () => void;
  replayPageTour: () => void;
  replayWelcomeTour: () => void;
  hasPageTour: boolean;
  canUseTours: boolean;
  isTourCompleted: (tourId: string) => boolean;
};

const TourContext = createContext<TourContextValue | null>(null);

export function useAuraTour() {
  const value = useContext(TourContext);
  if (!value) throw new Error("useAuraTour must be used within an AuraTourProvider");
  return value;
}

// Fixed and sticky landmarks have a null offsetParent even when visible, so
// visibility is decided from layout rects and computed styles instead.
function isRenderedVisible(element: HTMLElement): boolean {
  if (element.hidden || element.getClientRects().length === 0) return false;
  const style = window.getComputedStyle(element);
  if (style.visibility === "hidden" || style.display === "none") return false;
  return !element.closest('[aria-hidden="true"]');
}

function visibleTarget(selector?: string): HTMLElement | null {
  if (!selector || typeof document === "undefined") return null;
  for (const value of selector.split(",").map((item) => item.trim()).filter(Boolean)) {
    try {
      const element = document.querySelector<HTMLElement>(value);
      if (element && isRenderedVisible(element)) return element;
    } catch {
      // Invalid catalog selectors are treated as unavailable, never highlighted elsewhere.
    }
  }
  return null;
}

function resolveMountedTour(tour: TourDefinition): TourDefinition | null {
  const steps = tour.steps.filter((step) => !step.targetSelector || visibleTarget(step.targetSelector));
  return steps.length ? { ...tour, steps } : null;
}

function autoTourBlocked(): boolean {
  if (typeof document === "undefined") return true;
  if (
    document.querySelector(
      '[data-tour-critical="true"], dialog[open], [role="dialog"][aria-modal="true"], [aria-busy="true"]',
    )
  ) {
    return true;
  }
  const active = document.activeElement;
  return Boolean(
    active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      active instanceof HTMLSelectElement ||
      (active instanceof HTMLElement && active.isContentEditable),
  );
}

function focusableElements(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter(isRenderedVisible);
}

export function AuraTourProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const t = useCallback((ar: string, en: string) => localized(locale, ar, en), [locale]);
  const pathname = usePathname();
  const account = useVerifiedAccount();
  const supabase = useMemo(() => createClient(), []);
  const role = account.role as TourRole | null;
  const identityKey = account.user && role ? `${account.user.id}:${role}` : null;

  const [activeTour, setActiveTour] = useState<TourDefinition | null>(null);
  const [activeIdentity, setActiveIdentity] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [tourStates, setTourStates] = useState<TourStateMap>({});
  const [stateReady, setStateReady] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [automaticDismissed, setAutomaticDismissed] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const welcomeEndedPathRef = useRef<string | null>(null);
  const lastAutoTourRef = useRef("");
  const tourPathRef = useRef<string | null>(null);

  const currentPageTour = useMemo(
    () => pageTourForPath(pathname, role),
    [pathname, role],
  );
  const visibleActiveTour = activeIdentity === identityKey ? activeTour : null;
  const canUseTours = Boolean(
    identityKey &&
      stateReady &&
      !account.loading &&
      !account.error &&
      !account.profileLoading &&
      !account.profileError &&
      role,
  );

  useEffect(() => {
    let alive = true;
    setActiveTour(null);
    setActiveIdentity(null);
    setStepIndex(0);
    setTargetRect(null);
    setTourStates({});
    setStateReady(false);
    lastAutoTourRef.current = "";

    if (
      account.loading ||
      account.profileLoading ||
      account.error ||
      account.profileError
    ) {
      return () => {
        alive = false;
      };
    }

    if (!account.user || !role) {
      setStateReady(true);
      return () => {
        alive = false;
      };
    }

    const userId = account.user.id;
    const key = tourStorageKey(userId, role);
    let local: TourStateMap = {};
    try {
      localStorage.removeItem("noata_tour_state_v1");
      local = sanitizeTourState(JSON.parse(localStorage.getItem(key) ?? "{}"));
    } catch {
      local = {};
    }
    setTourStates(local);

    void (async () => {
      let merged = local;
      try {
        const result = await boundedRead(
          supabase
            .from("user_tour_progress")
            .select(
              "tour_id,tour_version,status,step_index,automatic_dismissed,completed_at,updated_at",
            )
            .eq("user_id", userId)
            .eq("role", role),
          5000,
        );
        if (result.error) throw result.error;
        merged = mergeTourStates(local, tourStateFromRows((result.data ?? []) as TourProgressRow[]));
      } catch {
        // Account-scoped local state remains safe when the additive migration is
        // not deployed or the network is unavailable. No other user's key is read.
      }
      if (!alive || `${userId}:${role}` !== identityKey) return;
      setTourStates(merged);
      try {
        localStorage.setItem(key, JSON.stringify(merged));
      } catch {
        // Persistence can be unavailable in private/restricted browser modes.
      }
      setStateReady(true);
    })();

    return () => {
      alive = false;
    };
  }, [
    account.error,
    account.loading,
    account.profileError,
    account.profileLoading,
    account.user,
    identityKey,
    role,
    supabase,
  ]);

  const persistProgress = useCallback(
    (
      tour: TourDefinition,
      status: TourProgress["status"],
      nextStepIndex: number,
      dismissAutomatic: boolean,
    ) => {
      if (!account.user || !role || !identityKey) return;
      const owner = account.user;
      const now = new Date().toISOString();
      const progress: TourProgress = {
        status,
        stepIndex: Math.max(0, nextStepIndex),
        version: tour.version,
        updatedAt: now,
        automaticDismissed: dismissAutomatic,
        completedAt: status === "completed" ? now : null,
      };
      const key = tourStorageKey(account.user.id, role);
      setTourStates((current) => {
        const next = { ...current, [tour.id]: progress };
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // The database write below still provides durable persistence when available.
        }
        return next;
      });
      void (async () => {
        try {
          await supabase
            .from("user_tour_progress")
            .upsert(
              {
                user_id: owner.id,
                role,
                tour_id: tour.id,
                tour_version: tour.version,
                status,
                step_index: Math.max(0, nextStepIndex),
                automatic_dismissed: dismissAutomatic,
                completed_at: status === "completed" ? now : null,
                updated_at: now,
              },
              { onConflict: "user_id,role,tour_id" },
            );
        } catch {
          // Durable persistence stays best-effort; local state above is already written.
        }
      })();
    },
    [account.user, identityKey, role, supabase],
  );

  const restoreFocus = useCallback(() => {
    const previous = previousFocusRef.current;
    previousFocusRef.current = null;
    requestAnimationFrame(() => previous?.focus());
  }, []);

  const closeTour = useCallback(
    (tour: TourDefinition) => {
      if (tour.id.endsWith("_welcome")) welcomeEndedPathRef.current = pathname;
      setActiveTour(null);
      setActiveIdentity(null);
      setTargetRect(null);
      restoreFocus();
    },
    [pathname, restoreFocus],
  );

  const startResolvedTour = useCallback(
    (tourId: string, resume = false): boolean => {
      if (!canUseTours || !role || !identityKey) return false;
      const definition = tourDefinitionById(tourId);
      if (!definition || !roleCanUseTour(definition, role)) return false;
      const mounted = resolveMountedTour(definition);
      if (!mounted) return false;

      const saved = tourStates[tourId];
      const savedStep =
        resume && progressIsCurrent(saved, definition) && saved?.status === "in_progress"
          ? Math.min(saved.stepIndex, mounted.steps.length - 1)
          : 0;

      previousFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setActiveTour(mounted);
      setActiveIdentity(identityKey);
      setStepIndex(savedStep);
      setAutomaticDismissed(false);
      tourPathRef.current = pathname;
      persistProgress(mounted, "in_progress", savedStep, false);
      return true;
    },
    [canUseTours, identityKey, pathname, persistProgress, role, tourStates],
  );

  const startTour = useCallback(
    (tourId: string) => {
      startResolvedTour(tourId, false);
    },
    [startResolvedTour],
  );

  const finishTour = useCallback(() => {
    if (!visibleActiveTour) return;
    persistProgress(
      visibleActiveTour,
      "completed",
      visibleActiveTour.steps.length - 1,
      automaticDismissed,
    );
    closeTour(visibleActiveTour);
  }, [automaticDismissed, closeTour, persistProgress, visibleActiveTour]);

  const nextStep = useCallback(() => {
    if (!visibleActiveTour) return;
    if (stepIndex >= visibleActiveTour.steps.length - 1) {
      finishTour();
      return;
    }
    const next = stepIndex + 1;
    setStepIndex(next);
    persistProgress(visibleActiveTour, "in_progress", next, automaticDismissed);
  }, [automaticDismissed, finishTour, persistProgress, stepIndex, visibleActiveTour]);

  const prevStep = useCallback(() => {
    if (!visibleActiveTour || stepIndex <= 0) return;
    const previous = stepIndex - 1;
    setStepIndex(previous);
    persistProgress(visibleActiveTour, "in_progress", previous, automaticDismissed);
  }, [automaticDismissed, persistProgress, stepIndex, visibleActiveTour]);

  const skipTour = useCallback(() => {
    if (!visibleActiveTour) return;
    persistProgress(visibleActiveTour, "skipped", stepIndex, true);
    closeTour(visibleActiveTour);
  }, [closeTour, persistProgress, stepIndex, visibleActiveTour]);

  const replayPageTour = useCallback(() => {
    if (currentPageTour) startResolvedTour(currentPageTour.id, false);
    else if (role) startResolvedTour(welcomeTourForRole(role).id, false);
  }, [currentPageTour, role, startResolvedTour]);

  const replayWelcomeTour = useCallback(() => {
    if (role) startResolvedTour(welcomeTourForRole(role).id, false);
  }, [role, startResolvedTour]);

  const isTourCompleted = useCallback(
    (tourId: string) => {
      const tour = tourDefinitionById(tourId);
      const progress = tourStates[tourId];
      return Boolean(
        tour &&
          progressIsCurrent(progress, tour) &&
          (progress?.status === "completed" || progress?.status === "skipped"),
      );
    },
    [tourStates],
  );

  useEffect(() => {
    if (!canUseTours || !role || visibleActiveTour) return;

    const welcome = welcomeTourForRole(role);
    const welcomeProgress = tourStates[welcome.id];
    const welcomeCurrent = progressIsCurrent(welcomeProgress, welcome);
    const roleHome =
      (role === "student" && (pathname === "/" || pathname === "/dashboard")) ||
      (role === "teacher" && pathname === "/teacher") ||
      (role === "admin" && pathname === "/admin");

    let candidate: TourDefinition | null = null;
    let resume = false;
    if (
      roleHome &&
      (!welcomeCurrent ||
        (welcomeProgress?.status !== "completed" && welcomeProgress?.status !== "skipped")) &&
      !welcomeProgress?.automaticDismissed
    ) {
      candidate = welcome;
      resume = welcomeCurrent && welcomeProgress?.status === "in_progress";
    } else if (
      welcomeCurrent &&
      (welcomeProgress?.status === "completed" || welcomeProgress?.status === "skipped") &&
      currentPageTour &&
      welcomeEndedPathRef.current !== pathname
    ) {
      const pageProgress = tourStates[currentPageTour.id];
      if (
        !progressIsCurrent(pageProgress, currentPageTour) ||
        (pageProgress?.status !== "completed" && pageProgress?.status !== "skipped")
      ) {
        if (!pageProgress?.automaticDismissed) {
          candidate = currentPageTour;
          resume = progressIsCurrent(pageProgress, currentPageTour) && pageProgress?.status === "in_progress";
        }
      }
    }

    if (!candidate) return;
    const autoKey = `${identityKey}:${pathname}:${candidate.id}:${candidate.version}`;
    if (lastAutoTourRef.current === autoKey) return;

    let stopped = false;
    let observer: MutationObserver | null = null;
    let delay: ReturnType<typeof setTimeout> | null = null;
    let deadline: ReturnType<typeof setTimeout> | null = null;
    const cleanup = () => {
      if (delay) clearTimeout(delay);
      if (deadline) clearTimeout(deadline);
      observer?.disconnect();
      observer = null;
    };
    const attempt = () => {
      if (stopped || autoTourBlocked()) return;
      if (startResolvedTour(candidate!.id, resume)) {
        lastAutoTourRef.current = autoKey;
        cleanup();
      }
    };

    delay = setTimeout(attempt, 900);
    observer = new MutationObserver(attempt);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-busy", "data-tour-critical"],
    });
    deadline = setTimeout(cleanup, 8000);

    return () => {
      stopped = true;
      cleanup();
    };
  }, [
    canUseTours,
    currentPageTour,
    identityKey,
    pathname,
    role,
    startResolvedTour,
    tourStates,
    visibleActiveTour,
  ]);

  useEffect(() => {
    if (!visibleActiveTour || tourPathRef.current === pathname) return;
    setActiveTour(null);
    setActiveIdentity(null);
    setTargetRect(null);
    restoreFocus();
  }, [pathname, restoreFocus, visibleActiveTour]);

  useEffect(() => {
    if (!visibleActiveTour) {
      setTargetRect(null);
      return;
    }
    const step = visibleActiveTour.steps[stepIndex];
    if (!step?.targetSelector) {
      setTargetRect(null);
      return;
    }
    const element = visibleTarget(step.targetSelector);
    if (!element) {
      setTargetRect(null);
      const skipMissing = setTimeout(nextStep, 350);
      return () => clearTimeout(skipMissing);
    }

    const updateRect = () => {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      const offscreen =
        rect.top < 60 ||
        rect.bottom > window.innerHeight - 60 ||
        rect.left < 20 ||
        rect.right > window.innerWidth - 20;
      if (offscreen) {
        element.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    };

    updateRect();
    const resizeObserver = new ResizeObserver(updateRect);
    resizeObserver.observe(element);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [nextStep, stepIndex, visibleActiveTour]);

  useEffect(() => {
    if (!visibleActiveTour) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        skipTour();
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (locale === "ar") prevStep();
        else nextStep();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (locale === "ar") nextStep();
        else prevStep();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [locale, nextStep, prevStep, skipTour, visibleActiveTour]);

  const context = useMemo<TourContextValue>(
    () => ({
      activeTour: visibleActiveTour,
      stepIndex,
      totalSteps: visibleActiveTour?.steps.length ?? 0,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      finishTour,
      replayPageTour,
      replayWelcomeTour,
      hasPageTour: Boolean(canUseTours && currentPageTour),
      canUseTours,
      isTourCompleted,
    }),
    [
      canUseTours,
      currentPageTour,
      finishTour,
      isTourCompleted,
      nextStep,
      prevStep,
      replayPageTour,
      replayWelcomeTour,
      skipTour,
      startTour,
      stepIndex,
      visibleActiveTour,
    ],
  );

  return (
    <TourContext.Provider value={context}>
      {children}
      {visibleActiveTour && (
        <AuraTourModal
          tour={visibleActiveTour}
          stepIndex={stepIndex}
          targetRect={targetRect}
          automaticDismissed={automaticDismissed}
          onToggleAutomaticDismissed={setAutomaticDismissed}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTour}
          onFinish={finishTour}
          popoverRef={popoverRef}
          t={t}
        />
      )}
    </TourContext.Provider>
  );
}

function AuraTourModal({
  tour,
  stepIndex,
  targetRect,
  automaticDismissed,
  onToggleAutomaticDismissed,
  onNext,
  onPrev,
  onSkip,
  onFinish,
  popoverRef,
  t,
}: {
  tour: TourDefinition;
  stepIndex: number;
  targetRect: DOMRect | null;
  automaticDismissed: boolean;
  onToggleAutomaticDismissed: (value: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
  popoverRef: React.RefObject<HTMLDivElement | null>;
  t: (ar: string, en: string) => string;
}) {
  const locale = useLocale();
  const step = tour.steps[stepIndex];
  const isLast = stepIndex === tour.steps.length - 1;
  const isFirst = stepIndex === 0;
  const titleId = `aura-tour-title-${tour.id}`;
  const descriptionId = `aura-tour-description-${tour.id}`;

  const popoverStyle = useMemo<React.CSSProperties>(() => {
    if (!targetRect || typeof window === "undefined" || window.innerWidth < 768) return {};
    const padding = 14;
    const width = 380;
    const estimatedHeight = 320;
    const placement = step.placement || "bottom";
    let top = targetRect.bottom + padding;
    let left = Math.max(16, Math.min(window.innerWidth - width - 16, targetRect.left));

    if (placement === "top") top = targetRect.top - estimatedHeight - padding;
    if (placement === "right") {
      top = targetRect.top;
      left = targetRect.right + padding;
    }
    if (placement === "left") {
      top = targetRect.top;
      left = targetRect.left - width - padding;
    }
    if (left + width > window.innerWidth - 16) left = targetRect.left - width - padding;
    if (left < 16) left = 16;
    if (top + estimatedHeight > window.innerHeight - 16) {
      top = Math.max(16, targetRect.top - estimatedHeight - padding);
    }
    if (top < 16) top = 16;
    return { top, left, position: "fixed" };
  }, [step.placement, targetRect]);

  useEffect(() => {
    requestAnimationFrame(() => popoverRef.current?.focus());
  }, [popoverRef, stepIndex]);

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !popoverRef.current) return;
    const focusable = focusableElements(popoverRef.current);
    if (!focusable.length) {
      event.preventDefault();
      popoverRef.current.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="aura-tour-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      {targetRect && (
        <div
          className="aura-tour-spotlight"
          style={{
            top: Math.max(0, targetRect.top - 6),
            left: Math.max(0, targetRect.left - 6),
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
          aria-hidden="true"
        />
      )}

      <div
        ref={popoverRef}
        className={`aura-tour-card ${!targetRect ? "is-centered" : ""}`}
        style={popoverStyle}
        tabIndex={-1}
        onKeyDown={trapFocus}
      >
        <header className="aura-tour-header">
          <div className="aura-tour-header-meta">
            <span className="aura-tour-badge">
              <Icon name="sparkles" size={13} />
              <span>{locale === "en" ? tour.titleEn : tour.titleAr}</span>
            </span>
            <span className="aura-tour-step-pill" aria-live="polite">
              {t(
                `خطوة ${stepIndex + 1} من ${tour.steps.length}`,
                `Step ${stepIndex + 1} of ${tour.steps.length}`,
              )}
            </span>
          </div>
          <button
            type="button"
            className="aura-tour-close-btn"
            onClick={onSkip}
            aria-label={t("تخطي الجولة", "Skip tour")}
          >
            <Icon name="close" size={14} />
          </button>
        </header>

        <div className="aura-tour-body">
          <h3 className="aura-tour-title" id={titleId}>
            {locale === "en" ? step.titleEn : step.titleAr}
          </h3>
          <p className="aura-tour-desc" id={descriptionId}>
            {locale === "en" ? step.descriptionEn : step.descriptionAr}
          </p>
          {(step.tipAr || step.tipEn) && (
            <div className="aura-tour-tip">
              <span className="aura-tour-tip-icon" aria-hidden="true">
                <Icon name="lightbulb" size={14} />
              </span>
              <p>{locale === "en" ? step.tipEn : step.tipAr}</p>
            </div>
          )}
        </div>

        <footer className="aura-tour-footer">
          <label className="aura-tour-dont-show">
            <input
              type="checkbox"
              checked={automaticDismissed}
              onChange={(event) => onToggleAutomaticDismissed(event.target.checked)}
            />
            <span>{t("عدم البدء تلقائيًا مرة أخرى", "Do not start automatically again")}</span>
          </label>
          <div className="aura-tour-actions">
            {!isFirst && (
              <button type="button" className="aura-tour-btn-ghost" onClick={onPrev}>
                {t("السابق", "Previous")}
              </button>
            )}
            <button
              type="button"
              className="aura-tour-btn-primary"
              onClick={isLast ? onFinish : onNext}
            >
              <span>{isLast ? t("إتمام الجولة", "Finish tour") : t("التالي", "Next")}</span>
              <Icon name="arrow" size={13} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
