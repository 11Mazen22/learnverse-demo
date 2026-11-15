"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Icon } from "@/components/ui/icon";
import { localized, useLocale } from "@/lib/i18n/locale";
import { createClient } from "@/lib/supabase/client";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import {
  getActiveAccountScope,
  isReducedMotionActive,
  setActiveAccountScope,
} from "@/lib/appearance/device-preferences";
import {
  clampSidebarWidth,
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_KEYBOARD_SHIFT_STEP,
  SIDEBAR_KEYBOARD_STEP,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from "@/lib/shell/sidebar-config";
import {
  DEFAULT_SHELL_SIDEBAR_PREFERENCES,
  extractShellPreferencesFromDashboard,
  LEGACY_SIDEBAR_COLLAPSED_KEY,
  mergeShellIntoDashboardPreferences,
  parseShellPreferences,
  readScopedShellPreferences,
  SIDEBAR_PREFS_EVENT,
  writeScopedShellPreferences,
  type ShellSidebarPreferences,
} from "@/lib/shell/sidebar-preferences";
import { StaffNav } from "@/components/auth/staff-nav";
import { SidebarHeader } from "./sidebar-header";
import { SidebarGroup } from "./sidebar-group";
import { SidebarItem } from "./sidebar-item";
import { SidebarCurriculum } from "./sidebar-curriculum";
import { SidebarFooter } from "./sidebar-footer";

type SidebarProps = {
  active: string;
  aiIsNew?: boolean;
  onNavigate: (href: string) => void;
  onOpenSearch?: () => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  onResizingChange?: (resizing: boolean) => void;
};

export function Sidebar({
  active,
  aiIsNew = false,
  onNavigate,
  onOpenSearch,
  isMobileDrawer = false,
  onCloseMobileDrawer,
  onCollapsedChange,
  onResizingChange,
}: SidebarProps) {
  const locale = useLocale();
  const t = useCallback((ar: string, en: string) => localized(locale, ar, en), [locale]);
  const account = useVerifiedAccount();
  const supabase = useMemo(() => createClient(), []);
  const scopeUserId = account.user?.id ?? null;

  const [prefs, setPrefs] = useState<ShellSidebarPreferences>(DEFAULT_SHELL_SIDEBAR_PREFERENCES);
  const [hasTopShadow, setHasTopShadow] = useState(false);
  const [hasBottomShadow, setHasBottomShadow] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const rawDashboardPrefsRef = useRef<unknown>(null);
  const prefsRef = useRef<ShellSidebarPreferences>(prefs);
  prefsRef.current = prefs;

  const dragSessionRef = useRef<{
    startX: number;
    startWidth: number;
    startCollapsed: boolean;
    pointerId: number;
    moved: boolean;
    liveWidth: number;
    liveCollapsed: boolean;
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const remoteTimerRef = useRef<number | null>(null);
  const remoteWriteSeqRef = useRef(0);

  const applyDomDimensions = useCallback(
    (widthPx: number, collapsed: boolean, resizing?: boolean) => {
      if (isMobileDrawer || typeof document === "undefined") return;
      const root = document.documentElement;
      root.style.setProperty("--sidebar-user-w", `${clampSidebarWidth(widthPx)}px`);
      if (collapsed) {
        root.dataset.sidebarCollapsed = "true";
      } else {
        root.removeAttribute("data-sidebar-collapsed");
      }
      if (typeof resizing === "boolean") {
        if (resizing) {
          root.dataset.sidebarResizing = "true";
        } else {
          root.removeAttribute("data-sidebar-resizing");
        }
      }
    },
    [isMobileDrawer],
  );

  const flushRemoteShellPrefs = useCallback(
    async (nextPrefs: ShellSidebarPreferences) => {
      if (isMobileDrawer || !account.user) return;
      const uid = account.user.id;
      const seq = ++remoteWriteSeqRef.current;
      const revision = account.revision.current;

      try {
        let existingDashboard = rawDashboardPrefsRef.current;
        if (!existingDashboard) {
          const latest = await supabase
            .from("user_settings")
            .select("dashboard_preferences")
            .eq("user_id", uid)
            .maybeSingle();
          if (seq !== remoteWriteSeqRef.current || revision !== account.revision.current) return;
          existingDashboard = latest.data?.dashboard_preferences ?? null;
        }

        const mergedPayload = mergeShellIntoDashboardPreferences(existingDashboard, nextPrefs);
        rawDashboardPrefsRef.current = mergedPayload;

        await supabase
          .from("user_settings")
          .upsert(
            {
              user_id: uid,
              dashboard_preferences: mergedPayload as Record<string, never>,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
      } catch {
        /* Scoped local persistence remains authoritative offline. */
      }
    },
    [account.revision, account.user, isMobileDrawer, supabase],
  );

  const commitPreferences = useCallback(
    (nextPrefs: ShellSidebarPreferences, immediateRemote = true) => {
      const normalized = parseShellPreferences(nextPrefs);
      setPrefs(normalized);
      applyDomDimensions(normalized.widthPx, normalized.collapsed, false);
      onCollapsedChange?.(normalized.collapsed);
      onResizingChange?.(false);

      if (!isMobileDrawer && typeof window !== "undefined") {
        writeScopedShellPreferences(window.localStorage, scopeUserId, normalized);
        setActiveAccountScope(scopeUserId, window.localStorage);
        window.dispatchEvent(new Event(SIDEBAR_PREFS_EVENT));

        if (account.user) {
          if (remoteTimerRef.current !== null) {
            window.clearTimeout(remoteTimerRef.current);
            remoteTimerRef.current = null;
          }
          if (immediateRemote) {
            void flushRemoteShellPrefs(normalized);
          } else {
            remoteTimerRef.current = window.setTimeout(() => {
              remoteTimerRef.current = null;
              void flushRemoteShellPrefs(normalized);
            }, 280);
          }
        }
      }
    },
    [
      account.user,
      applyDomDimensions,
      flushRemoteShellPrefs,
      isMobileDrawer,
      onCollapsedChange,
      onResizingChange,
      scopeUserId,
    ],
  );

  // Zero-FOUC & zero-hydration-mismatch pre-paint restoration from account-scoped storage
  useLayoutEffect(() => {
    if (isMobileDrawer || typeof window === "undefined") return;

    const syncFromLocalStorage = () => {
      // Preserve the pre-hydrated account scope while auth verification is still in flight
      // so initial client hydration never flashes back to guest width before getUser() finishes.
      const storageScope = account.loading
        ? (() => {
            const activeScope = getActiveAccountScope(window.localStorage);
            return activeScope === "guest" ? null : activeScope;
          })()
        : scopeUserId;
      let resolved = readScopedShellPreferences(window.localStorage, storageScope);
      if (!resolved && !storageScope) {
        try {
          const legacy = window.localStorage.getItem(LEGACY_SIDEBAR_COLLAPSED_KEY);
          if (legacy === "true" || legacy === "1") {
            resolved = {
              version: 1,
              widthPx: SIDEBAR_DEFAULT_WIDTH,
              collapsed: true,
              openGroups: {},
            };
          }
        } catch {
          /* Ignore optional storage failure */
        }
      }
      const finalPrefs = resolved ?? { ...DEFAULT_SHELL_SIDEBAR_PREFERENCES, openGroups: {} };
      setPrefs((prev) =>
        JSON.stringify(prev) === JSON.stringify(finalPrefs) ? prev : finalPrefs,
      );
      applyDomDimensions(finalPrefs.widthPx, finalPrefs.collapsed);
      onCollapsedChange?.(finalPrefs.collapsed);
    };

    syncFromLocalStorage();
    const raf = requestAnimationFrame(() => {
      document.documentElement.dataset.shellReady = "true";
    });
    window.addEventListener(SIDEBAR_PREFS_EVENT, syncFromLocalStorage);
    window.addEventListener("storage", syncFromLocalStorage);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(SIDEBAR_PREFS_EVENT, syncFromLocalStorage);
      window.removeEventListener("storage", syncFromLocalStorage);
    };
  }, [account.loading, applyDomDimensions, isMobileDrawer, onCollapsedChange, scopeUserId]);

  // Synchronize persisted server shell layout from user_settings.dashboard_preferences.shell
  useEffect(() => {
    rawDashboardPrefsRef.current = null;
    if (isMobileDrawer || account.loading || !account.user) return;
    let alive = true;
    const uid = account.user.id;
    const revision = account.revision.current;

    void (async () => {
      try {
        const { data } = await supabase
          .from("user_settings")
          .select("dashboard_preferences")
          .eq("user_id", uid)
          .maybeSingle();
        if (!alive || revision !== account.revision.current) return;
        rawDashboardPrefsRef.current = data?.dashboard_preferences ?? null;
        const serverShell = extractShellPreferencesFromDashboard(data?.dashboard_preferences);
        if (!serverShell) return;

        setPrefs((prev) =>
          JSON.stringify(prev) === JSON.stringify(serverShell) ? prev : serverShell,
        );
        applyDomDimensions(serverShell.widthPx, serverShell.collapsed);
        onCollapsedChange?.(serverShell.collapsed);
        if (typeof window !== "undefined") {
          writeScopedShellPreferences(window.localStorage, uid, serverShell);
        }
      } catch {
        /* Scoped local storage remains active if server fetch is unavailable. */
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    account.loading,
    account.revision,
    account.user,
    applyDomDimensions,
    isMobileDrawer,
    onCollapsedChange,
    supabase,
  ]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (remoteTimerRef.current !== null) window.clearTimeout(remoteTimerRef.current);
    };
  }, []);

  const toggleCollapsed = useCallback(() => {
    if (isMobileDrawer) return;
    const current = prefsRef.current;
    const nextCollapsed = !current.collapsed;
    commitPreferences({ ...current, collapsed: nextCollapsed }, true);
    setAnnouncement(
      nextCollapsed
        ? t("تم طي القائمة الجانبية", "Navigation sidebar collapsed")
        : t("تم توسيع القائمة الجانبية", "Navigation sidebar expanded"),
    );
  }, [commitPreferences, isMobileDrawer, t]);

  useEffect(() => {
    if (isMobileDrawer) return;
    const onToggleEvent = () => toggleCollapsed();
    window.addEventListener("noata:toggle-sidebar", onToggleEvent);
    return () => window.removeEventListener("noata:toggle-sidebar", onToggleEvent);
  }, [isMobileDrawer, toggleCollapsed]);

  // Cancel active pointer drag safely on Escape
  useEffect(() => {
    if (isMobileDrawer) return;
    const onWindowKeyDown = (e: KeyboardEvent) => {
      const session = dragSessionRef.current;
      if (!session || e.key !== "Escape") return;
      e.preventDefault();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      dragSessionRef.current = null;
      onResizingChange?.(false);
      onCollapsedChange?.(session.startCollapsed);
      applyDomDimensions(session.startWidth, session.startCollapsed, false);
    };
    window.addEventListener("keydown", onWindowKeyDown);
    return () => window.removeEventListener("keydown", onWindowKeyDown);
  }, [applyDomDimensions, isMobileDrawer, onCollapsedChange, onResizingChange]);

  const handleResizerPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (isMobileDrawer || e.button !== 0) return;
      e.preventDefault();
      const target = e.currentTarget;
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        /* Some synthetic environments omit pointer capture */
      }
      const current = prefsRef.current;
      dragSessionRef.current = {
        startX: e.clientX,
        startWidth: current.widthPx,
        startCollapsed: current.collapsed,
        pointerId: e.pointerId,
        moved: false,
        liveWidth: current.widthPx,
        liveCollapsed: current.collapsed,
      };
      onResizingChange?.(true);
      document.documentElement.dataset.sidebarResizing = "true";
    },
    [isMobileDrawer, onResizingChange],
  );

  const handleResizerPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const session = dragSessionRef.current;
      if (!session || session.pointerId !== e.pointerId) return;
      const isRtl =
        document.documentElement.dir === "rtl" ||
        getComputedStyle(e.currentTarget).direction === "rtl";
      const delta = isRtl ? session.startX - e.clientX : e.clientX - session.startX;
      if (Math.abs(delta) >= 2) {
        session.moved = true;
      }
      const anchorWidth = session.startCollapsed ? SIDEBAR_COLLAPSED_WIDTH : session.startWidth;
      const rawCandidate = anchorWidth + delta;
      const shouldUncollapse = session.startCollapsed ? rawCandidate > 136 : false;
      const nextCollapsed = session.startCollapsed ? !shouldUncollapse : false;
      const nextWidth = nextCollapsed ? session.startWidth : clampSidebarWidth(rawCandidate);
      session.liveWidth = nextWidth;
      session.liveCollapsed = nextCollapsed;

      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (!dragSessionRef.current) return;
        applyDomDimensions(nextWidth, nextCollapsed, true);
        onCollapsedChange?.(nextCollapsed);
      });
    },
    [applyDomDimensions, onCollapsedChange],
  );

  const finishResizerDrag = useCallback(
    (pointerId: number) => {
      const session = dragSessionRef.current;
      if (!session || session.pointerId !== pointerId) return;
      dragSessionRef.current = null;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (!session.moved) {
        onResizingChange?.(false);
        applyDomDimensions(session.startWidth, session.startCollapsed, false);
        return;
      }
      commitPreferences(
        {
          ...prefsRef.current,
          widthPx: session.liveWidth,
          collapsed: session.liveCollapsed,
        },
        true,
      );
      setAnnouncement(
        locale === "en"
          ? `Sidebar width set to ${session.liveWidth} pixels`
          : `تم ضبط عرض القائمة الجانبية إلى ${session.liveWidth} بكسل`,
      );
    },
    [applyDomDimensions, commitPreferences, locale, onResizingChange],
  );

  const handleResizerKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (isMobileDrawer) return;
      const isRtl = document.documentElement.dir === "rtl";
      const widenKey = isRtl ? "ArrowLeft" : "ArrowRight";
      const narrowKey = isRtl ? "ArrowRight" : "ArrowLeft";
      const step = e.shiftKey ? SIDEBAR_KEYBOARD_SHIFT_STEP : SIDEBAR_KEYBOARD_STEP;
      const current = prefsRef.current;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleCollapsed();
        return;
      }

      let nextWidth: number | null = null;
      if (e.key === widenKey) {
        nextWidth = clampSidebarWidth(current.widthPx + step);
      } else if (e.key === narrowKey) {
        nextWidth = clampSidebarWidth(current.widthPx - step);
      } else if (e.key === "Home") {
        nextWidth = SIDEBAR_MIN_WIDTH;
      } else if (e.key === "End") {
        nextWidth = SIDEBAR_MAX_WIDTH;
      }

      if (nextWidth === null) return;
      e.preventDefault();
      commitPreferences(
        {
          ...current,
          widthPx: nextWidth,
          collapsed: false,
        },
        false,
      );
      setAnnouncement(
        locale === "en"
          ? `Sidebar width ${nextWidth} pixels`
          : `عرض القائمة الجانبية ${nextWidth} بكسل`,
      );
    },
    [commitPreferences, isMobileDrawer, locale, toggleCollapsed],
  );

  const handleResizerDoubleClick = useCallback(() => {
    if (isMobileDrawer) return;
    commitPreferences(
      {
        ...prefsRef.current,
        widthPx: SIDEBAR_DEFAULT_WIDTH,
        collapsed: false,
      },
      true,
    );
    setAnnouncement(
      locale === "en"
        ? `Sidebar width reset to ${SIDEBAR_DEFAULT_WIDTH} pixels`
        : `تمت إعادة عرض القائمة الجانبية إلى ${SIDEBAR_DEFAULT_WIDTH} بكسل`,
    );
  }, [commitPreferences, isMobileDrawer, locale]);

  const handleGroupOpenChange = useCallback(
    (groupId: string, nextOpen: boolean) => {
      const current = prefsRef.current;
      commitPreferences(
        {
          ...current,
          openGroups: {
            ...current.openGroups,
            [groupId]: nextOpen,
          },
        },
        true,
      );
    },
    [commitPreferences],
  );

  // Global keyboard shortcut: Ctrl+B or ⌘B to toggle collapse (suppressed during text input / IME)
  useEffect(() => {
    if (isMobileDrawer) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.isComposing) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileDrawer, toggleCollapsed]);

  // Check scroll masks for independent scrolling region
  const handleScroll = useCallback(() => {
    const el = scrollViewportRef.current;
    if (!el) return;
    setHasTopShadow(el.scrollTop > 6);
    setHasBottomShadow(el.scrollHeight - el.scrollTop - el.clientHeight > 6);
  }, []);

  // Update shadow masks on resize or content change
  useEffect(() => {
    handleScroll();
    const el = scrollViewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => handleScroll());
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleScroll, prefs.collapsed]);

  // Smoothly scroll active item into view when active route changes
  useEffect(() => {
    const container = scrollViewportRef.current;
    if (!container) return;

    const timer = setTimeout(() => {
      const activeEl = container.querySelector<HTMLElement>(
        '.noata-nav-item.is-active, .noata-curriculum-item.is-active'
      );
      if (!activeEl) return;

      const containerRect = container.getBoundingClientRect();
      const itemRect = activeEl.getBoundingClientRect();

      const isAbove = itemRect.top < containerRect.top + 8;
      const isBelow = itemRect.bottom > containerRect.bottom - 8;

      if (isAbove || isBelow) {
        activeEl.scrollIntoView({
          behavior: isReducedMotionActive() ? "auto" : "smooth",
          block: "nearest",
        });
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [active]);

  const handleLinkClick = (href: string) => {
    onNavigate(href);
    if (isMobileDrawer) {
      onCloseMobileDrawer?.();
    }
  };

  const isLearningActive =
    active.startsWith("/learn") ||
    ["/missions", "/review", "/study", "/boss"].includes(active);

  const isToolsActive = ["/quran", "/assignments"].includes(active);
  const isProgressActive = ["/progress", "/rewards"].includes(active);

  const effectiveCollapsed = isMobileDrawer ? false : prefs.collapsed;
  const groupOpenState = (id: string, fallback: boolean) =>
    typeof prefs.openGroups[id] === "boolean" ? prefs.openGroups[id] : fallback;

  return (
    <aside
      className={[
        "noata-sidebar",
        "noata-sidebar-aura",
        effectiveCollapsed && "is-collapsed",
        effectiveCollapsed && "noata-compact-rail",
        isMobileDrawer && "is-mobile-drawer-view",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={t("التنقل الرئيسي لمنصة Noäta", "Noäta Main Navigation")}
      data-collapsed={effectiveCollapsed}
    >
      {/* 1. Header with Logo and Collapse Toggle */}
      <SidebarHeader
        isCollapsed={effectiveCollapsed}
        onToggleCollapse={toggleCollapsed}
        onNavigateHome={() => handleLinkClick("/")}
      />

      {/* 2. Independent Scroll Container */}
      <div
        className={[
          "noata-sidebar-scroll-viewport",
          hasTopShadow && "has-top-mask",
          hasBottomShadow && "has-bottom-mask",
        ]
          .filter(Boolean)
          .join(" ")}
        ref={scrollViewportRef}
        onScroll={handleScroll}
        tabIndex={0}
        aria-label={t("قائمة التنقل القابلة للتمرير", "Scrollable navigation list")}
      >
        <nav className="noata-sidebar-nav sidebar-nav" aria-label={t("أقسام المنصة", "Platform sections")}>
          {/* Group 1: المساحة الرئيسية */}
          <SidebarGroup
            id="primary-hub"
            titleAr="المساحة الرئيسية"
            titleEn="Primary Space"
            collapsible={false}
            isCollapsedSidebar={effectiveCollapsed}
          >
            <SidebarItem
              href="/"
              icon="home"
              labelAr="الرئيسية"
              labelEn="Home"
              descriptionAr="مساحتك اليومية ومتابعة الأهداف"
              descriptionEn="Your daily overview & goals"
              isActive={active === "/"}
              isCollapsed={effectiveCollapsed}
              onClick={() => handleLinkClick("/")}
            />

            <SidebarItem
              href="/ai"
              icon="ai"
              labelAr="Noäta AI"
              labelEn="Noäta AI"
              descriptionAr="رفيق المذاكرة وورشة التعلّم"
              descriptionEn="Smart study companion & studio"
              isActive={active === "/ai"}
              isCollapsed={effectiveCollapsed}
              isAiSpecial={true}
              tag={aiIsNew ? t("جديد", "New") : undefined}
              tagVariant="accent"
              onClick={() => handleLinkClick("/ai")}
            />

            {/* Quick Command Trigger */}
            {onOpenSearch && !effectiveCollapsed && (
              <button
                type="button"
                className="noata-sidebar-command-btn"
                onClick={onOpenSearch}
                aria-label={t("بحث وانتقال سريع (⌘K)", "Quick search and jump (⌘K)")}
              >
                <span className="noata-cmd-icon" aria-hidden="true">
                  <Icon name="search" size={16} />
                </span>
                <span className="noata-cmd-label">
                  {t("انتقل إلى أي مكان…", "Jump to anything…")}
                </span>
                <kbd className="noata-cmd-kbd">⌘K</kbd>
              </button>
            )}
          </SidebarGroup>

          {/* Group 2: التعلّم والمناهج الدراسية */}
          <SidebarGroup
            id="learning-and-curriculum"
            titleAr="التعلّم والمناهج"
            titleEn="Learning & Curriculum"
            icon="book"
            collapsible={true}
            defaultExpanded={true}
            controlledOpen={groupOpenState("learning-and-curriculum", true)}
            onOpenChange={handleGroupOpenChange}
            hasActiveChild={isLearningActive}
            isCollapsedSidebar={effectiveCollapsed}
          >
            <SidebarItem
              href="/learn"
              icon="book"
              labelAr="رحلة التعلّم"
              labelEn="Learning Paths"
              descriptionAr="خارطة المحتوى والوحدات المنشورة"
              descriptionEn="Published content roadmap & units"
              isActive={active === "/learn"}
              isCollapsed={effectiveCollapsed}
              onClick={() => handleLinkClick("/learn")}
            />

            {/* 6 Core Subjects Module */}
            <SidebarCurriculum
              active={active}
              isCollapsedSidebar={effectiveCollapsed}
              onNavigate={handleLinkClick}
            />

            <SidebarItem
              href="/missions"
              icon="target"
              labelAr="المهام اليومية"
              labelEn="Missions"
              descriptionAr="تحديات قصيرة وتثبيت فوري"
              descriptionEn="Short daily challenges"
              isActive={active === "/missions"}
              isCollapsed={effectiveCollapsed}
              onClick={() => handleLinkClick("/missions")}
            />

            <SidebarItem
              href="/review"
              icon="review"
              labelAr="المراجعة الذكية"
              labelEn="Smart Review"
              descriptionAr="تكرار متباعد وتثبيت المفاهيم"
              descriptionEn="Spaced repetition & practice"
              isActive={active === "/review"}
              isCollapsed={effectiveCollapsed}
              onClick={() => handleLinkClick("/review")}
            />

            <SidebarItem
              href="/study"
              icon="clipboard"
              labelAr="مركز المذاكرة"
              labelEn="Study Center"
              descriptionAr="استوديو المذاكرة الذكي وبطاقات 3D"
              descriptionEn="Smart study studio, quizzes & 3D cards"
              isActive={active === "/study"}
              isCollapsed={effectiveCollapsed}
              onClick={() => handleLinkClick("/study")}
            />

            <SidebarItem
              href="/boss"
              icon="boss"
              labelAr="تحدّي الوحدة"
              labelEn="Unit Challenge"
              descriptionAr="اختبار إتقان شامل ومحاكاة"
              descriptionEn="Mastery test & evaluation"
              isActive={active === "/boss"}
              isCollapsed={effectiveCollapsed}
              onClick={() => handleLinkClick("/boss")}
            />
          </SidebarGroup>

          {/* Group 3: الأدوات والمصادر */}
          <SidebarGroup
            id="tools-and-resources"
            titleAr="الأدوات والمصادر"
            titleEn="Tools & Resources"
            icon="award"
            collapsible={true}
            defaultExpanded={true}
            controlledOpen={groupOpenState("tools-and-resources", true)}
            onOpenChange={handleGroupOpenChange}
            hasActiveChild={isToolsActive}
            isCollapsedSidebar={effectiveCollapsed}
          >
            <SidebarItem
              href="/quran"
              icon="book"
              labelAr="المصحف الشريف"
              labelEn="Noble Quran"
              descriptionAr="آيات موثّقة وتلاوة صوتية"
              descriptionEn="Verified verses & recitation"
              isActive={active === "/quran"}
              isCollapsed={effectiveCollapsed}
              onClick={() => handleLinkClick("/quran")}
            />

            <SidebarItem
              href="/assignments"
              icon="check"
              labelAr="الواجبات الدراسية"
              labelEn="Assignments"
              descriptionAr="مهام معلّمك واختبارات المتابعة"
              descriptionEn="Assigned tasks from teachers"
              isActive={active === "/assignments"}
              isCollapsed={effectiveCollapsed}
              onClick={() => handleLinkClick("/assignments")}
            />
          </SidebarGroup>

          {/* Group 4: متابعة الإنجاز والنمو */}
          <SidebarGroup
            id="progress-and-growth"
            titleAr="متابعة الإنجاز والنمو"
            titleEn="Progress & Growth"
            icon="chart"
            collapsible={true}
            defaultExpanded={true}
            controlledOpen={groupOpenState("progress-and-growth", true)}
            onOpenChange={handleGroupOpenChange}
            hasActiveChild={isProgressActive}
            isCollapsedSidebar={effectiveCollapsed}
          >
            <SidebarItem
              href="/progress"
              icon="chart"
              labelAr="تقدّمي وإحصائياتي"
              labelEn="My Progress"
              descriptionAr="معدل الإتقان والنمو المستمر"
              descriptionEn="Mastery metrics & analytics"
              isActive={active === "/progress"}
              isCollapsed={effectiveCollapsed}
              onClick={() => handleLinkClick("/progress")}
            />

            <SidebarItem
              href="/rewards"
              icon="gift"
              labelAr="المكافآت والمظاهر"
              labelEn="Rewards & Cosmetics"
              descriptionAr="احتفل بنقاط تميزك ومحطات إتقانك"
              descriptionEn="Celebrate milestones & streaks"
              isActive={active === "/rewards"}
              isCollapsed={effectiveCollapsed}
              onClick={() => handleLinkClick("/rewards")}
            />
          </SidebarGroup>

          {/* Group 5: مساحات العمل الخاصة بالمعلم والإدارة (Role-gated) */}
          <StaffNav
            active={active}
            isCollapsed={effectiveCollapsed}
            onNavigate={handleLinkClick}
          />
        </nav>
      </div>

      {/* 3. Stationary Bottom Footer (Settings & Help Center) */}
      <SidebarFooter
        active={active}
        isCollapsed={effectiveCollapsed}
        onNavigate={handleLinkClick}
      />

      {!isMobileDrawer && (
        <>
          <div
            id="noata-sidebar-resizer"
            className="noata-sidebar-resizer"
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-valuemin={SIDEBAR_MIN_WIDTH}
            aria-valuemax={SIDEBAR_MAX_WIDTH}
            aria-valuenow={prefs.widthPx}
            aria-valuetext={
              effectiveCollapsed
                ? t("مطوي، اضغط Enter للتوسيع", "Collapsed, press Enter to expand")
                : locale === "en"
                  ? `${prefs.widthPx} pixels`
                  : `${prefs.widthPx} بكسل`
            }
            aria-label={t("تغيير عرض القائمة الجانبية", "Resize navigation sidebar")}
            onPointerDown={handleResizerPointerDown}
            onPointerMove={handleResizerPointerMove}
            onPointerUp={(e) => finishResizerDrag(e.pointerId)}
            onPointerCancel={(e) => finishResizerDrag(e.pointerId)}
            onLostPointerCapture={(e) => finishResizerDrag(e.pointerId)}
            onDoubleClick={handleResizerDoubleClick}
            onKeyDown={handleResizerKeyDown}
          />
          <span className="sr-only" aria-live="polite">
            {announcement}
          </span>
        </>
      )}
    </aside>
  );
}
