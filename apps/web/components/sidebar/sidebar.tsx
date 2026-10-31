"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { localized, useLocale } from "@/lib/i18n/locale";
import { StaffNav } from "@/components/auth/staff-nav";
import { SidebarHeader } from "./sidebar-header";
import { SidebarGroup } from "./sidebar-group";
import { SidebarItem } from "./sidebar-item";
import { SidebarCurriculum } from "./sidebar-curriculum";
import { SidebarFooter } from "./sidebar-footer";

const COLLAPSED_STORAGE_KEY = "noata_sidebar_collapsed";

type SidebarProps = {
  active: string;
  aiIsNew?: boolean;
  onNavigate: (href: string) => void;
  onOpenSearch?: () => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
};

export function Sidebar({
  active,
  aiIsNew = false,
  onNavigate,
  onOpenSearch,
  isMobileDrawer = false,
  onCloseMobileDrawer,
  onCollapsedChange,
}: SidebarProps) {
  const locale = useLocale();
  const t = (ar: string, en: string) => localized(locale, ar, en);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasTopShadow, setHasTopShadow] = useState(false);
  const [hasBottomShadow, setHasBottomShadow] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // Read saved collapsed preference on mount (not in mobile drawer)
  useEffect(() => {
    if (isMobileDrawer) return;
    try {
      const saved = localStorage.getItem(COLLAPSED_STORAGE_KEY);
      if (saved !== null) {
        const val = saved === "true";
        setIsCollapsed(val);
        onCollapsedChange?.(val);
      }
    } catch {
      // Storage unavailable or disabled
    }
  }, [isMobileDrawer, onCollapsedChange]);

  const toggleCollapsed = useCallback(() => {
    if (isMobileDrawer) return;
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        // Ignored
      }
      onCollapsedChange?.(next);
      return next;
    });
  }, [isMobileDrawer, onCollapsedChange]);

  // Global keyboard shortcut: Ctrl+B or ⌘B to toggle collapse
  useEffect(() => {
    if (isMobileDrawer) return;
    function handleKeyDown(e: KeyboardEvent) {
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
  }, [handleScroll, isCollapsed]);

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
        const prefersReduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        activeEl.scrollIntoView({
          behavior: prefersReduced ? "auto" : "smooth",
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

  const effectiveCollapsed = isMobileDrawer ? false : isCollapsed;

  return (
    <aside
      className={[
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
        <nav className="noata-sidebar-nav" aria-label={t("أقسام المنصة", "Platform sections")}>
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
              descriptionAr="مهام شخصية وبطاقات مراجعة محفوظة"
              descriptionEn="Personal tasks & saved flashcards"
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
    </aside>
  );
}
