"use client";
import { NoataBrand } from "@/components/ui/noata-logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeControl } from "@/components/preferences/theme-control";
import { LocaleControl } from "@/components/preferences/locale-control";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Icon } from "@/components/ui/icon";
import { Dialog } from "@/components/ui/dialog";
import { ContextualCoach } from "@/components/ai/contextual-coach";
import { TourTrigger } from "@/components/tour/tour-trigger";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { AI_INTRO_VERSION, hasSeenFeature, markFeatureSeen } from "@/lib/feature-seen";
import { localized, useLocale } from "@/lib/i18n/locale";
import { matchesStaffSearch } from "@/lib/dashboard/staff-search";
import { Sidebar } from "@/components/sidebar/sidebar";

type Route = [ar: string, en: string, href: string, icon: string, arDescription: string, enDescription: string];

const navGroups: { titleAr: string; titleEn: string; routes: Route[] }[] = [
  {
    titleAr: "التعلّم والمناهج",
    titleEn: "Learning & Curriculum",
    routes: [
      ["الرئيسية", "Home", "/", "home", "مساحتك اليومية", "Your daily space"],
      ["رحلة التعلّم", "Learning journey", "/learn", "book", "المواد والدروس", "Subjects and lessons"],
      ["العلوم المتكاملة", "Integrated Science", "/learn?subject=integrated-science", "microscope", "مسار عربي وإنجليزي", "Arabic & English tracks"],
      ["الرياضيات", "Mathematics", "/learn?subject=mathematics", "compass", "مسار عربي وإنجليزي", "Arabic & English tracks"],
      ["تاريخ", "History", "/learn?subject=history", "landmark", "مصر الحضارة والعالم القديم", "Civilisation & Ancient world"],
      ["اللغة العربية", "Arabic Language", "/learn?subject=arabic-language", "feather", "نصوص ونحو وقصة عنترة", "Literature, grammar & story"],
      ["اللغة الإنجليزية", "English Language", "/learn?subject=english", "globe", "وحدات مرتبطة بالمصدر", "Source-mapped units"],
      ["الفلسفة والمنطق", "Philosophy & Logic", "/learn?subject=philosophy-logic", "lightbulb", "التفكير والموقف الفلسفي", "Thinking & philosophical stance"],
      ["المهام", "Missions", "/missions", "target", "تحديات قصيرة", "Short challenges"],
      ["المراجعة", "Review", "/review", "review", "ثبّت ما تعلّمته", "Strengthen what you learned"],
      ["مركز المذاكرة", "Study center", "/study", "clipboard", "مهام شخصية وبطاقات محفوظة", "Personal tasks and saved flashcards"],
      ["تحدّي الوحدة", "Unit challenge", "/boss", "boss", "اختبر إتقانك", "Check your mastery"],
    ],
  },
  {
    titleAr: "أدوات ذكية",
    titleEn: "Smart tools",
    routes: [
      ["Noäta AI", "Noäta AI", "/ai", "ai", "مساعدك الذكي للمذاكرة", "Your study companion"],
      ["المصحف", "Quran", "/quran", "book", "آيات موثّقة وتلاوة", "Verified verses and recitation"],
    ],
  },
  {
    titleAr: "تقدّمي ومكافآتي",
    titleEn: "Progress & Rewards",
    routes: [
      ["تقدّمي", "My progress", "/progress", "chart", "كل خطوة تُحتسب", "Every step counts"],
      ["المكافآت", "Rewards", "/rewards", "gift", "احتفل بتقدّمك", "Celebrate your progress"],
      ["الواجبات", "Assignments", "/assignments", "check", "من معلّمك", "From your teacher"],
    ],
  },
];

const utilityRoutes: Route[] = [
  ["الإعدادات", "Settings", "/settings", "settings", "تجربتك بطريقتك", "Make Noäta yours"],
  ["المساعدة", "Help", "/help", "help", "إجابات وإرشادات", "Answers and guidance"],
  ["مساحة المعلّم", "Teacher workspace", "/teacher", "user", "إدارة الفصول والواجبات", "Manage classes & assignments"],
  ["إدارة Noäta", "Manage Noäta", "/admin", "shield", "لوحة الإدارة والعمليات", "Admin operations dashboard"],
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [activeResult, setActiveResult] = useState(0);
  const resultRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const router = useRouter();
  const locale = useLocale();
  const t = (ar: string, en: string) => localized(locale, ar, en);

  const pageLabel =
    routes.find((route) => route[2] === active)?.[locale === "en" ? 1 : 0] ??
    (role === "teacher"
      ? t("مساحة المعلّم", "Teacher workspace")
      : role === "admin"
        ? t("إدارة Noäta", "Manage Noäta")
        : t("مساحتي التعليمية", "My learning space"));

  useEffect(() => {
    document.title = pageLabel + " · Noäta";
  }, [pageLabel, active]);

  const account = useVerifiedAccount();
  const [aiIsNew, setAiIsNew] = useState(false);

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
    if (href !== active) {
      router.push(href);
    }
  }

  const searchResults = useMemo(
    () =>
      routes.filter((route) =>
        matchesStaffSearch(
          query,
          [route[0], route[1], route[4], route[5]],
          locale,
        ),
      ),
    [locale, query],
  );

  function closeSearch() {
    setSearch(false);
    setQuery("");
    setActiveResult(0);
  }

  function openSearchResult(href: string) {
    openRoute(href);
    closeSearch();
  }

  useEffect(() => {
    setActiveResult(0);
  }, [query]);

  useEffect(() => {
    if (!search) return;
    resultRefs.current[activeResult]?.scrollIntoView({ block: "nearest" });
  }, [activeResult, search, searchResults.length]);

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
                  (role === "teacher"
                    ? t("مساحة المعلّم", "Teacher workspace")
                    : t("إدارة Noäta", "Manage Noäta"))}
              </b>
            </div>
          </div>
          <div className="top-actions">
            <button
              className="command-trigger"
              onClick={() => setSearch(true)}
              aria-label={t("بحث وانتقال سريع (⌘K)", "Search and quick jump (⌘K)")}
            >
              <Icon name="search" size={17} />
              <span>{t("انتقل إلى…", "Go to…")}</span>
              <kbd>⌘ K</kbd>
            </button>
            <ContextualCoach active={active} />
            <TourTrigger />
            {!account.loading && !account.user && <LocaleControl />}
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
          {t("Noäta · مساحة تكبر معك", "Noäta · A space to grow")}
          <span>{t("تعلّم بفضول، وتقدّم بثقة.", "Learn with curiosity. Grow with confidence.")}</span>
        </footer>
      </div>

      {/* Mobile Quick Thumb Navigation Bar */}
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
              <small>
                {locale === "en"
                  ? { "/": "Home", "/learn": "Learn", "/ai": "Noäta AI", "/progress": "Progress" }[
                      href
                    ] ?? labelEn
                  : labelAr}
              </small>
            </Link>
          ))}
        <button
          type="button"
          onClick={() => setMenu(true)}
          aria-label={t("المزيد من الأقسام", "More sections")}
        >
          <Icon name="menu" />
          <small>{t("المزيد", "More")}</small>
        </button>
      </nav>

      {/* Mobile Full Sidebar Drawer */}
      <Dialog
        open={menu}
        onClose={() => setMenu(false)}
        title={t("مساحتك في Noäta", "Your Noäta space")}
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
      </Dialog>

      {/* Command Palette Jump Search */}
      <Dialog
        open={search}
        onClose={closeSearch}
        title={t("رايح فين النهارده؟", "Where would you like to go?")}
      >
        <input
          className="search command-input"
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-autocomplete="list"
          aria-controls="noata-command-results"
          aria-activedescendant={
            searchResults[activeResult]
              ? `noata-command-option-${activeResult}`
              : undefined
          }
          aria-label={t("ابحث عن صفحة", "Search pages")}
          placeholder={t("ابحث عن صفحة أو أداة أو مادة دراسية…", "Search for a page, tool or subject…")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              if (!searchResults.length) return;
              const direction = event.key === "ArrowDown" ? 1 : -1;
              setActiveResult(
                (current) =>
                  (current + direction + searchResults.length) %
                  searchResults.length,
              );
            } else if (event.key === "Home") {
              event.preventDefault();
              setActiveResult(0);
            } else if (event.key === "End") {
              event.preventDefault();
              setActiveResult(Math.max(0, searchResults.length - 1));
            } else if (event.key === "Enter") {
              const result = searchResults[activeResult];
              if (!result) return;
              event.preventDefault();
              openSearchResult(result[2]);
            }
          }}
        />
        <div id="noata-command-results">
          {searchResults.length ? (
            <div
              className="command-results"
              role="listbox"
              aria-label={t("الصفحات والمواد المتاحة", "Available pages & subjects")}
            >
              {searchResults.map(([labelAr, labelEn, href, icon, descriptionAr, descriptionEn], index) => (
                <Link
                  href={href}
                  key={href}
                  id={`noata-command-option-${index}`}
                  role="option"
                  aria-selected={index === activeResult}
                  tabIndex={-1}
                  ref={(node) => {
                    resultRefs.current[index] = node;
                  }}
                  onMouseEnter={() => setActiveResult(index)}
                  onClick={() => openSearchResult(href)}
                >
                  <Icon name={icon} />
                  <span>
                    <b>{t(labelAr, labelEn)}</b>
                    <small>{t(descriptionAr, descriptionEn)}</small>
                  </span>
                  <Icon name="arrow" size={16} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="command-results command-empty" role="status">
              {t(
                "لا توجد صفحة تطابق هذا البحث. جرّب كلمة أخرى.",
                "No page matches that search. Try another word.",
              )}
            </p>
          )}
        </div>
      </Dialog>
    </div>
  );
}
