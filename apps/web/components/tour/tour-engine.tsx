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
import { useVerifiedAccount, boundedRead } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import type { TourDefinition, TourRole, TourStateMap } from "./tour-types";
import {
  STUDENT_WELCOME_TOUR,
  TEACHER_WELCOME_TOUR,
  ADMIN_WELCOME_TOUR,
  PAGE_MINI_TOURS,
} from "./tour-catalog";

const STORAGE_KEY = "noata_tour_state_v1";

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
  hasPageTour: boolean;
  isTourCompleted: (tourId: string) => boolean;
};

const TourContext = createContext<TourContextValue | null>(null);

export function useAuraTour() {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useAuraTour must be used within an AuraTourProvider");
  }
  return ctx;
}

export function AuraTourProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const t = useCallback((ar: string, en: string) => localized(locale, ar, en), [locale]);
  const pathname = usePathname();
  const account = useVerifiedAccount();
  const supabase = useMemo(() => createClient(), []);

  const [userRole, setUserRole] = useState<TourRole>("student");
  const [activeTour, setActiveTour] = useState<TourDefinition | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [tourStates, setTourStates] = useState<TourStateMap>({});
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  // 1. Load persisted tour state from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setTourStates(JSON.parse(raw));
      }
    } catch {
      // Storage unavailable or disabled
    }
  }, []);

  // 2. Fetch authenticated profile role securely
  useEffect(() => {
    if (!account.user) {
      setUserRole("student");
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const res = await boundedRead(
          supabase
            .from("profiles")
            .select("role")
            .eq("id", account.user!.id)
            .maybeSingle(),
        );
        if (alive && res.data?.role) {
          setUserRole(res.data.role as TourRole);
        }
      } catch {
        // Fall back to student role
      }
    })();
    return () => {
      alive = false;
    };
  }, [account.user, supabase]);

  // Save tour progress helper
  const persistTourProgress = useCallback(
    (tourId: string, status: "completed" | "skipped", version: number, disableAuto = false) => {
      setTourStates((prev) => {
        const next: TourStateMap = {
          ...prev,
          [tourId]: {
            status,
            stepIndex: 0,
            version,
            updatedAt: new Date().toISOString(),
            dontShowAgain: disableAuto,
          },
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore write error
        }
        return next;
      });
    },
    [],
  );

  const isTourCompleted = useCallback(
    (tourId: string) => {
      const record = tourStates[tourId];
      return record?.status === "completed" || record?.status === "skipped";
    },
    [tourStates],
  );

  // 3. Find and start tour
  const startTour = useCallback(
    (tourId: string) => {
      let def: TourDefinition | null = null;
      if (tourId === "student_welcome") def = STUDENT_WELCOME_TOUR;
      else if (tourId === "teacher_welcome") def = TEACHER_WELCOME_TOUR;
      else if (tourId === "admin_welcome") def = ADMIN_WELCOME_TOUR;
      else {
        // Look in page mini tours
        def = Object.values(PAGE_MINI_TOURS).find((p) => p.id === tourId) || null;
      }

      if (def) {
        setActiveTour(def);
        setStepIndex(0);
        setDontShowAgain(false);
      }
    },
    [],
  );

  const nextStep = useCallback(() => {
    if (!activeTour) return;
    if (stepIndex < activeTour.steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      // Finished
      persistTourProgress(activeTour.id, "completed", activeTour.version, dontShowAgain);
      setActiveTour(null);
    }
  }, [activeTour, stepIndex, dontShowAgain, persistTourProgress]);

  const prevStep = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    }
  }, [stepIndex]);

  const skipTour = useCallback(() => {
    if (!activeTour) return;
    persistTourProgress(activeTour.id, "skipped", activeTour.version, dontShowAgain);
    setActiveTour(null);
  }, [activeTour, dontShowAgain, persistTourProgress]);

  const finishTour = useCallback(() => {
    if (!activeTour) return;
    persistTourProgress(activeTour.id, "completed", activeTour.version, dontShowAgain);
    setActiveTour(null);
  }, [activeTour, dontShowAgain, persistTourProgress]);

  // Current page mini-tour check
  const currentPageTour = useMemo(() => {
    if (!pathname) return null;
    const tour = PAGE_MINI_TOURS[pathname];
    if (!tour) return null;
    if (tour.role && tour.role !== "all" && tour.role !== userRole) return null;
    return tour;
  }, [pathname, userRole]);

  const replayPageTour = useCallback(() => {
    if (currentPageTour) {
      startTour(currentPageTour.id);
    } else {
      // Replay role welcome tour as fallback
      const roleTourId =
        userRole === "admin"
          ? "admin_welcome"
          : userRole === "teacher"
            ? "teacher_welcome"
            : "student_welcome";
      startTour(roleTourId);
    }
  }, [currentPageTour, userRole, startTour]);

  // 4. Automatic first-run prompt logic
  useEffect(() => {
    if (account.loading || activeTour) return;

    // A. Role Welcome Tour Check
    const roleTourId =
      userRole === "admin"
        ? "admin_welcome"
        : userRole === "teacher"
          ? "teacher_welcome"
          : "student_welcome";

    const hasCompletedRoleTour = tourStates[roleTourId]?.status;

    if (!hasCompletedRoleTour) {
      const timer = setTimeout(() => {
        // Only launch on home / dashboard / teacher / admin roots
        if (
          pathname === "/" ||
          pathname === "/dashboard" ||
          (userRole === "teacher" && pathname === "/teacher") ||
          (userRole === "admin" && pathname === "/admin")
        ) {
          startTour(roleTourId);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }

    // B. Page mini-tour check
    if (currentPageTour) {
      const pageTourState = tourStates[currentPageTour.id];
      if (!pageTourState?.status && !pageTourState?.dontShowAgain) {
        const timer = setTimeout(() => {
          startTour(currentPageTour.id);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [account.loading, activeTour, userRole, pathname, tourStates, currentPageTour, startTour]);

  // 5. Calculate spotlight target bounding rect
  useEffect(() => {
    if (!activeTour) {
      setTargetRect(null);
      return;
    }

    const currentStep = activeTour.steps[stepIndex];
    if (!currentStep?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const selectors = currentStep.targetSelector!.split(",").map((s) => s.trim());
      let el: HTMLElement | null = null;
      for (const sel of selectors) {
        const candidate = document.querySelector<HTMLElement>(sel);
        if (candidate && candidate.offsetParent !== null) {
          el = candidate;
          break;
        }
      }

      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        // Scroll into view if offscreen
        const isOffscreen =
          rect.top < 60 ||
          rect.bottom > window.innerHeight - 60 ||
          rect.left < 20 ||
          rect.right > window.innerWidth - 20;

        if (isOffscreen) {
          el.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
            block: "center",
            inline: "nearest",
          });
        }
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [activeTour, stepIndex]);

  // 6. Keyboard navigation & Focus management
  useEffect(() => {
    if (!activeTour) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        skipTour();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (locale === "ar") prevStep();
        else nextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (locale === "ar") nextStep();
        else prevStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTour, locale, nextStep, prevStep, skipTour]);

  const value = useMemo<TourContextValue>(
    () => ({
      activeTour,
      stepIndex,
      totalSteps: activeTour ? activeTour.steps.length : 0,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      finishTour,
      replayPageTour,
      hasPageTour: Boolean(currentPageTour),
      isTourCompleted,
    }),
    [
      activeTour,
      stepIndex,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      finishTour,
      replayPageTour,
      currentPageTour,
      isTourCompleted,
    ],
  );

  return (
    <TourContext.Provider value={value}>
      {children}

      {/* Render Tour Overlay and Spotlight when active */}
      {activeTour && (
        <AuraTourModal
          tour={activeTour}
          stepIndex={stepIndex}
          targetRect={targetRect}
          dontShowAgain={dontShowAgain}
          onToggleDontShowAgain={(val) => setDontShowAgain(val)}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipTour}
          onFinish={finishTour}
          popoverRef={popoverRef}
        />
      )}
    </TourContext.Provider>
  );
}

// Subcomponent: Tour Spotlight and Step Card
function AuraTourModal({
  tour,
  stepIndex,
  targetRect,
  dontShowAgain,
  onToggleDontShowAgain,
  onNext,
  onPrev,
  onSkip,
  onFinish,
  popoverRef,
}: {
  tour: TourDefinition;
  stepIndex: number;
  targetRect: DOMRect | null;
  dontShowAgain: boolean;
  onToggleDontShowAgain: (val: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
  popoverRef: React.RefObject<HTMLDivElement | null>;
}) {
  const locale = useLocale();
  const t = useCallback((ar: string, en: string) => localized(locale, ar, en), [locale]);
  const step = tour.steps[stepIndex];
  const isLast = stepIndex === tour.steps.length - 1;
  const isFirst = stepIndex === 0;

  // Compute smart popover position
  const popoverStyle = useMemo<React.CSSProperties>(() => {
    if (!targetRect || typeof window === "undefined" || window.innerWidth < 768) {
      // Centered or Mobile bottom sheet
      return {};
    }

    const padding = 14;
    const popoverWidth = 380;
    const placement = step.placement || "bottom";

    let top = 0;
    let left = 0;

    if (placement === "bottom") {
      top = targetRect.bottom + padding;
      left = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, targetRect.left));
      if (top + 280 > window.innerHeight) {
        top = Math.max(16, targetRect.top - 280 - padding);
      }
    } else if (placement === "top") {
      top = Math.max(16, targetRect.top - 280 - padding);
      left = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, targetRect.left));
    } else if (placement === "right") {
      top = Math.max(16, Math.min(window.innerHeight - 280, targetRect.top));
      left = targetRect.right + padding;
      if (left + popoverWidth > window.innerWidth) {
        left = Math.max(16, targetRect.left - popoverWidth - padding);
      }
    } else {
      top = Math.max(16, Math.min(window.innerHeight - 280, targetRect.top));
      left = Math.max(16, targetRect.left - popoverWidth - padding);
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      position: "fixed",
    };
  }, [targetRect, step.placement]);

  return (
    <div
      className="aura-tour-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={locale === "en" ? tour.titleEn : tour.titleAr}
    >
      {/* SVG Spotlight Cutout */}
      {targetRect && (
        <div
          className="aura-tour-spotlight"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Tour Step Card */}
      <div
        ref={popoverRef}
        className={`aura-tour-card ${!targetRect ? "is-centered" : ""}`}
        style={popoverStyle}
      >
        <header className="aura-tour-header">
          <div className="aura-tour-header-meta">
            <span className="aura-tour-badge">
              <Icon name="sparkles" size={13} />
              <span>{locale === "en" ? tour.titleEn : tour.titleAr}</span>
            </span>
            <span className="aura-tour-step-pill">
              {t(`خطوة ${stepIndex + 1} من ${tour.steps.length}`, `Step ${stepIndex + 1} of ${tour.steps.length}`)}
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
          <h3 className="aura-tour-title">{locale === "en" ? step.titleEn : step.titleAr}</h3>
          <p className="aura-tour-desc">{locale === "en" ? step.descriptionEn : step.descriptionAr}</p>

          {(step.tipAr || step.tipEn) && (
            <div className="aura-tour-tip">
              <span className="aura-tour-tip-icon">
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
              checked={dontShowAgain}
              onChange={(e) => onToggleDontShowAgain(e.target.checked)}
            />
            <span>{t("عدم الإظهار تلقائيًا", "Don't show automatically")}</span>
          </label>

          <div className="aura-tour-actions">
            {!isFirst && (
              <button type="button" className="aura-tour-btn-ghost" onClick={onPrev}>
                <span>{t("السابق", "Previous")}</span>
              </button>
            )}

            <button type="button" className="aura-tour-btn-primary" onClick={isLast ? onFinish : onNext}>
              <span>{isLast ? t("إتمام الجولة", "Finish Tour") : t("التالي", "Next")}</span>
              <Icon name="arrow" size={13} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
