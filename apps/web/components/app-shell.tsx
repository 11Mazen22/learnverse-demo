"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeControl } from "@/components/preferences/theme-control";
import { LocaleControl } from "@/components/preferences/locale-control";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Badge } from "@/components/ui/badge";
import { Drawer } from "@/components/ui/drawer";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Icon } from "@/components/ui/icon";
import { ContextualCoach } from "@/components/ai/contextual-coach";
import { TourTrigger } from "@/components/tour/tour-trigger";
import { CommandPalette } from "@/components/shell/command-palette";
import { Sidebar } from "@/components/sidebar/sidebar";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { AI_INTRO_VERSION, hasSeenFeature, markFeatureSeen } from "@/lib/feature-seen";
import { localized, useLocale } from "@/lib/i18n/locale";
import {
  getEffectiveRole,
  getMobileDockRoutes,
  getWorkspaceLabel,
  pushRecentDestination,
  recentRoutesStorageKey,
  resolvePageTitle,
  resolveRouteIcon,
  type ShellRole,
} from "@/lib/shell/navigation";

export function AppShell({
  children,
  active,
  role = "student",
}: {
  children: React.ReactNode;
  active: string;
  role?: ShellRole;
}) {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [recentHrefs, setRecentHrefs] = useState<string[]>([]);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const wasMenuOpen = useRef(false);
  const router = useRouter();
  const locale = useLocale();
  const t = (ar: string, en: string) => localized(locale, ar, en);

  const account = useVerifiedAccount();
  const [aiIsNew, setAiIsNew] = useState(false);

  const effectiveRole = useMemo(
    () => getEffectiveRole(account.role, Boolean(account.user), role),
    [account.role, account.user, role]
  );

  const workspaceMeta = useMemo(
    () => getWorkspaceLabel(role, effectiveRole, locale),
    [role, effectiveRole, locale]
  );

  const pageLabel = useMemo(
    () => resolvePageTitle(active, role, locale),
    [active, role, locale]
  );

  const routeIcon = useMemo(() => resolveRouteIcon(active), [active]);

  const mobileDockRoutes = useMemo(
    () => getMobileDockRoutes(effectiveRole),
    [effectiveRole]
  );

  useEffect(() => {
    document.title = pageLabel + " · Noäta";
  }, [pageLabel, active]);

  // Restore focus to mobile drawer opener on drawer close
  useEffect(() => {
    if (wasMenuOpen.current && !menu) {
      requestAnimationFrame(() => menuTriggerRef.current?.focus());
    }
    wasMenuOpen.current = menu;
  }, [menu]);

  // Load and update per-user recent route history
  useEffect(() => {
    const key = recentRoutesStorageKey(account.user?.id);
    try {
      const raw = sessionStorage.getItem(key);
      const parsed: string[] = raw ? JSON.parse(raw) : [];
      const next = pushRecentDestination(Array.isArray(parsed) ? parsed : [], active);
      setRecentHrefs(next);
      sessionStorage.setItem(key, JSON.stringify(next));
    } catch {
      setRecentHrefs((curr) => pushRecentDestination(curr, active));
    }
  }, [active, account.user?.id]);

  useEffect(() => {
    const update = () =>
      setAiIsNew(!hasSeenFeature("ai", AI_INTRO_VERSION, account.user?.id ?? null));
    update();
    window.addEventListener("storage", update);
    window.addEventListener("noata-feature-seen", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("noata-feature-seen", update);
    };
  }, [account.user?.id]);

  useEffect(() => {
    if (active === "/ai") {
      markFeatureSeen("ai", AI_INTRO_VERSION, account.user?.id ?? null);
    }
  }, [active, account.user?.id]);

  function openRoute(href: string) {
    if (href === "/ai") markFeatureSeen("ai", AI_INTRO_VERSION, account.user?.id ?? null);
    setMenu(false);
    const currentWithQuery =
      typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : active;
    if (href !== currentWithQuery) {
      router.push(href);
    }
  }

  // Global shortcut: ⌘K / Ctrl+K opens Command Center unless another modal dialog is blocking or IME is composing
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.isComposing) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const openDialogs = document.querySelectorAll("dialog[open]");
        if (!search && openDialogs.length > 0) return;
        e.preventDefault();
        setSearch((prev) => !prev);
      }
    }
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [search]);

  return (
    <div
      className="noata-shell"
      data-workspace={role}
      data-sidebar-collapsed={isSidebarCollapsed}
    >
      {/* Signature Noäta Aura Sidebar */}
      <Sidebar
        active={active}
        aiIsNew={aiIsNew}
        onNavigate={openRoute}
        onOpenSearch={() => setSearch(true)}
        onCollapsedChange={setIsSidebarCollapsed}
      />

      <div className="noata-main">
        <header className="topbar shell-topbar">
          {/* Zone 1: Start — Mobile Drawer Toggle + Route Emblem + Breadcrumbs + Workspace Badge */}
          <div className="top-context">
            <button
              ref={menuTriggerRef}
              type="button"
              className="top-icon mobile-menu"
              onClick={() => setMenu(true)}
              aria-label={t("فتح القائمة", "Open menu")}
              aria-expanded={menu}
            >
              <Icon name="menu" />
            </button>
            <span className="nk-topbar-route-emblem" aria-hidden="true">
              <Icon name={routeIcon} size={18} />
            </span>
            <div className="nk-topbar-crumbs">
              <div className="nk-topbar-workspace-row">
                <span className="tiny-label">{workspaceMeta.label}</span>
                <Badge
                  tone={
                    effectiveRole === "admin" || effectiveRole === "teacher"
                      ? "warning"
                      : effectiveRole === "student"
                        ? "accent"
                        : "neutral"
                  }
                  className="nk-workspace-badge"
                >
                  {t(workspaceMeta.badgeAr, workspaceMeta.badgeEn)}
                </Badge>
              </div>
              <b className="nk-topbar-title">{pageLabel}</b>
            </div>
          </div>

          {/* Zone 2 & 3: Omnibox Command Trigger + Smart Assistance + Utilities & Account */}
          <div className="top-actions">
            <button
              type="button"
              className="command-trigger"
              onClick={() => setSearch(true)}
              aria-label={t("بحث وانتقال سريع (⌘K)", "Search and quick jump (⌘K)")}
            >
              <Icon name="search" size={16} />
              <span className="nk-command-label">{t("انتقل إلى…", "Go to…")}</span>
              <kbd>⌘ K</kbd>
            </button>
            <span className="nk-topbar-divider nk-topbar-divider-search" aria-hidden="true" />
            <ContextualCoach active={active} />
            <TourTrigger />
            <span className="nk-topbar-divider nk-topbar-divider-assist" aria-hidden="true" />
            {!account.loading && !account.user && <LocaleControl />}
            <ThemeControl />
            <NotificationBell />
            <span className="nk-topbar-divider nk-topbar-divider-account" aria-hidden="true" />
            <UserMenu />
          </div>
        </header>

        <main
          id="noata-main"
          tabIndex={-1}
          className="page-content"
          key={active}
        >
          <ErrorBoundary
            fallbackTitleAr="تعذّر عرض هذه الصفحة"
            fallbackTitleEn="Could not render this section"
          >
            {children}
          </ErrorBoundary>
        </main>

        <footer className="page-footer">
          {t("Noäta · مساحة تكبر معك", "Noäta · A space to grow")}
          <span>{t("تعلّم بفضول، وتقدّم بثقة.", "Learn with curiosity. Grow with confidence.")}</span>
        </footer>
      </div>

      {/* Mobile Quick Thumb Navigation Bar */}
      <nav className="mobile-nav" aria-label={t("تنقل سريع", "Quick navigation")}>
        {mobileDockRoutes.map((route) => {
          const shortEn =
            route.href === "/"
              ? "Home"
              : route.href === "/learn"
                ? "Learn"
                : route.href === "/progress"
                  ? "Progress"
                  : route.href === "/assignments"
                    ? "Tasks"
                    : route.href === "/teacher"
                      ? "Teacher"
                      : route.href === "/admin"
                        ? "Admin"
                        : route.labelEn;
          const shortAr =
            route.href === "/"
              ? "الرئيسية"
              : route.href === "/learn"
                ? "رحلة التعلّم"
                : route.href === "/progress"
                  ? "تقدّمي"
                  : route.href === "/assignments"
                    ? "الواجبات"
                    : route.href === "/teacher"
                      ? "المعلّم"
                      : route.href === "/admin"
                        ? "الإدارة"
                        : route.labelAr;

          return (
            <Link
              href={route.href}
              key={route.href}
              className={active === route.href ? "active" : ""}
              aria-current={active === route.href ? "page" : undefined}
            >
              <Icon name={route.icon} />
              <small>{locale === "en" ? shortEn : shortAr}</small>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMenu(true)}
          aria-label={t("المزيد من الأقسام", "More sections")}
        >
          <Icon name="menu" />
          <small>{t("المزيد", "More")}</small>
        </button>
      </nav>

      {/* Mobile Full Sidebar Drawer (Stage 01 Tier 3 RTL/LTR Drawer) */}
      <Drawer
        open={menu}
        onClose={() => setMenu(false)}
        side="start"
        title={t("مساحتك في Noäta", "Your Noäta space")}
        className="nk-drawer-mobile-nav"
      >
        <div className="mobile-menu-content">
          <Sidebar
            active={active}
            aiIsNew={aiIsNew}
            onNavigate={openRoute}
            onOpenSearch={() => {
              setMenu(false);
              setSearch(true);
            }}
            isMobileDrawer={true}
            onCloseMobileDrawer={() => setMenu(false)}
          />
        </div>
      </Drawer>

      {/* Universal Command Center (⌘K) */}
      <CommandPalette
        open={search}
        onClose={() => setSearch(false)}
        onNavigate={openRoute}
        effectiveRole={effectiveRole}
        recentHrefs={recentHrefs}
      />
    </div>
  );
}
