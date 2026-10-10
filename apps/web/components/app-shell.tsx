"use client";
import { NoataBrand } from "@/components/ui/noata-logo";
import Link from "next/link";
import { useEffect, useState } from "react";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeControl } from "@/components/preferences/theme-control";
import { LocaleControl } from "@/components/preferences/locale-control";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { StaffNav } from "@/components/auth/staff-nav";
import { Icon } from "@/components/ui/icon";
import { Dialog } from "@/components/ui/dialog";
import { ContextualCoach } from "@/components/ai/contextual-coach";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { AI_INTRO_VERSION, hasSeenFeature, markFeatureSeen } from "@/lib/feature-seen";
import { localized, useLocale } from "@/lib/i18n/locale";

type Route = [ar: string, en: string, href: string, icon: string, arDescription: string, enDescription: string];
const navGroups: { titleAr: string; titleEn: string; routes: Route[] }[] = [
  {
    titleAr: "التعلّم", titleEn: "Learning",
    routes: [
      ["الرئيسية", "Home", "/", "home", "مساحتك اليومية", "Your daily space"],
      ["رحلة التعلّم", "Learning journey", "/learn", "book", "المواد والدروس", "Subjects and lessons"],
      ["المهام", "Missions", "/missions", "target", "تحديات قصيرة", "Short challenges"],
      ["المراجعة", "Review", "/review", "review", "ثبّت ما تعلّمته", "Strengthen what you learned"],
      ["تحدّي الوحدة", "Unit challenge", "/boss", "boss", "اختبر إتقانك", "Check your mastery"],
    ],
  },
  {
    titleAr: "أدوات ذكية", titleEn: "Smart tools",
    routes: [
      ["Noata AI", "Noata AI", "/ai", "ai", "مساعدك الذكي للمذاكرة", "Your study companion"],
      ["المصحف", "Quran", "/quran", "book", "آيات موثّقة وتلاوة", "Verified verses and recitation"],
    ],
  },
  {
    titleAr: "إنجازاتي", titleEn: "My achievements",
    routes: [
      ["تقدّمي", "My progress", "/progress", "chart", "كل خطوة تُحتسب", "Every step counts"],
      ["المكافآت", "Rewards", "/rewards", "gift", "احتفل بتقدّمك", "Celebrate your progress"],
      ["الواجبات", "Assignments", "/assignments", "check", "من معلّمك", "From your teacher"],
    ],
  },
];
const utilityRoutes: Route[] = [
  ["الإعدادات", "Settings", "/settings", "settings", "تجربتك بطريقتك", "Make Noata yours"],
  ["المساعدة", "Help", "/help", "help", "إجابات وإرشادات", "Answers and guidance"],
];
const routes: Route[] = [...navGroups.flatMap((g) => g.routes), ...utilityRoutes];
export function AppShell({
  children,
  active,
  role = "student",
}: {
  children: React.ReactNode;
  active: string;
  role?: "student" | "teacher" | "admin";
}) {
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const locale = useLocale();
  const t = (ar: string, en: string) => localized(locale, ar, en);
  const account = useVerifiedAccount();
  const [aiIsNew, setAiIsNew] = useState(false);
  useEffect(() => {
    if (account.loading) return;
    const update = () => setAiIsNew(!hasSeenFeature("ai", AI_INTRO_VERSION, account.user?.id ?? null));
    update();
    window.addEventListener("storage", update);
    window.addEventListener("noata-feature-seen", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("noata-feature-seen", update);
    };
  }, [account.loading, account.user?.id]);
  function openRoute(href: string) {
    if (href === "/ai") markFeatureSeen("ai", AI_INTRO_VERSION, account.user?.id ?? null);
    setMenu(false);
  }
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch((x) => !x);
      }
    }
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  const link = ([labelAr, labelEn, href, icon]: Route) => (
    <Link
      key={href}
      className={
        "nav-link" +
        (active === href ? " active" : "") +
        (href === "/ai" ? " nav-link-ai" : "")
      }
      aria-current={active === href ? "page" : undefined}
      href={href}
      onClick={() => openRoute(href)}
    >
      <span className="nav-icon">
        <Icon name={icon} size={18} />
      </span>
      <span className="nav-label">{t(labelAr, labelEn)}</span>
      {href === "/ai" && aiIsNew && <small className="nav-tag">{t("جديد", "New")}</small>}
    </Link>
  );
  const nav = (
    <>
      <Link href="/" className="brand sidebar-brand" aria-label={t("Noata — الرئيسية", "Noata — Home")}>
        <NoataBrand size={40} />
      </Link>
      <nav aria-label={t("التنقل الرئيسي", "Main navigation")} className="sidebar-nav">
        {navGroups.map((group) => (
          <div className="nav-group" key={group.titleAr}>
            <div className="nav-title">{t(group.titleAr, group.titleEn)}</div>
            {group.routes.map(link)}
          </div>
        ))}
      </nav>
      <StaffNav active={active} />
      <div className="sidebar-foot">
        <Link href="/ai" className="sidebar-ai-card" onClick={() => openRoute("/ai")}>
          <span className="sidebar-ai-icon">
            <Icon name="ai" size={18} />
          </span>
          <span>
            <b>{t("المعرفة تبدأ بسؤال", "Knowledge begins with a question")}</b>
            <small>{t("اسأل Noata AI أو افتح ورشة المذاكرة", "Ask Noata AI or open the study studio")}</small>
          </span>
          <Icon name="arrow" size={16} />
        </Link>
        <nav aria-label={t("الحساب والمساعدة", "Account and help")} className="sidebar-utility">
          {utilityRoutes.map(link)}
        </nav>
        <div className="legal-links">
          <Link href="/privacy">{t("الخصوصية", "Privacy")}</Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms">{t("الشروط", "Terms")}</Link>
        </div>
      </div>
    </>
  );
  return (
    <div className="noata-shell" data-workspace={role}>
      <aside className="noata-sidebar">{nav}</aside>
      <div className="noata-main">
        <header className="topbar shell-topbar">
          <div className="top-context">
            <button
              className="top-icon mobile-menu"
              onClick={() => setMenu(true)}
              aria-label={t("فتح القائمة", "Open menu")}
            >
              <Icon name="menu" />
            </button>
            <div>
              <span className="tiny-label">
                {role === "student"
                  ? t("مساحتي التعليمية", "My learning space")
                  : role === "teacher"
                    ? t("مساحة المعلّم", "Teacher workspace")
                    : t("مساحة الإدارة", "Admin workspace")}
              </span>
              <b>
                {routes.find((r) => r[2] === active)?.[locale === "en" ? 1 : 0] ??
                  (role === "teacher" ? t("مساحة المعلّم", "Teacher workspace") : t("إدارة Noata", "Manage Noata"))}
              </b>
            </div>
          </div>
          <div className="top-actions">
            <button className="command-trigger" onClick={() => setSearch(true)}>
              <Icon name="search" size={17} />
              <span>{t("انتقل إلى…", "Go to…")}</span>
              <kbd>⌘ K</kbd>
            </button>
            <ContextualCoach active={active} />
            {!account.loading&&!account.user&&<LocaleControl />}
            <ThemeControl />
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main
          id="noata-main"
          tabIndex={-1}
          className="page-content"
          key={active}
        >
          {children}
        </main>
        <footer className="page-footer">
          {t("Noata · مساحة تكبر معك", "Noata · A space to grow")}
          <span>{t("تعلّم بفضول، وتقدّم بثقة.", "Learn with curiosity. Grow with confidence.")}</span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label={t("تنقل سريع", "Quick navigation")}>
        {routes
          .filter((r) => ["/", "/learn", "/ai", "/progress"].includes(r[2]))
          .map(([labelAr, labelEn, href, icon]) => (
            <Link
              href={href}
              key={href}
              className={active === href ? "active" : ""}
              aria-current={active === href ? "page" : undefined}
            >
              <Icon name={icon} />
              <small>{t(labelAr, labelEn)}</small>
            </Link>
          ))}
        <button onClick={() => setMenu(true)}>
          <Icon name="menu" />
          <small>{t("المزيد", "More")}</small>
        </button>
      </nav>
      <Dialog
        open={menu}
        onClose={() => setMenu(false)}
        title={t("مساحتك في Noata", "Your Noata space")}
      >
        <div className="mobile-menu-content">{nav}</div>
      </Dialog>
      <Dialog
        open={search}
        onClose={() => setSearch(false)}
        title={t("رايح فين النهارده؟", "Where would you like to go?")}
      >
        <input
          className="search command-input"
          autoFocus
          aria-label={t("ابحث عن صفحة", "Search pages")}
          placeholder={t("ابحث عن صفحة أو أداة…", "Search for a page or tool…")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="command-results">
          {routes
            .filter((r) =>
              r.join(" ").toLowerCase().includes(query.toLowerCase()),
            )
            .map(([labelAr, labelEn, href, icon, descriptionAr, descriptionEn]) => (
              <Link href={href} key={href} onClick={() => { openRoute(href); setSearch(false); }}>
                <Icon name={icon} />
                <span>
                  <b>{t(labelAr, labelEn)}</b>
                  <small>{t(descriptionAr, descriptionEn)}</small>
                </span>
                <Icon name="arrow" size={16} />
              </Link>
            ))}
        </div>
      </Dialog>
    </div>
  );
}
