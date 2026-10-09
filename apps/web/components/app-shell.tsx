"use client";
import { NoataBrand } from "@/components/ui/noata-logo";
import Link from "next/link";
import { useEffect, useState } from "react";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeControl } from "@/components/preferences/theme-control";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { StaffNav } from "@/components/auth/staff-nav";
import { Icon } from "@/components/ui/icon";
import { Dialog } from "@/components/ui/dialog";
import { ContextualCoach } from "@/components/ai/contextual-coach";

type Route = [label: string, href: string, icon: string, description: string];
const navGroups: { title: string; routes: Route[] }[] = [
  {
    title: "التعلّم",
    routes: [
      ["الرئيسية", "/", "home", "مساحتك اليومية"],
      ["رحلة التعلّم", "/learn", "book", "المواد والدروس"],
      ["المهام", "/missions", "target", "تحديات قصيرة"],
      ["المراجعة", "/review", "review", "ثبّت ما تعلّمته"],
      ["تحدّي الوحدة", "/boss", "boss", "اختبر إتقانك"],
    ],
  },
  {
    title: "أدوات ذكية",
    routes: [
      ["Noata AI", "/ai", "ai", "مساعدك الذكي للمذاكرة"],
      ["المصحف", "/quran", "book", "آيات موثّقة وتلاوة"],
    ],
  },
  {
    title: "إنجازاتي",
    routes: [
      ["تقدّمي", "/progress", "chart", "كل خطوة تُحتسب"],
      ["المكافآت", "/rewards", "gift", "احتفل بتقدّمك"],
      ["الواجبات", "/assignments", "check", "من معلّمك"],
    ],
  },
];
const utilityRoutes: Route[] = [
  ["الإعدادات", "/settings", "settings", "تجربتك بطريقتك"],
  ["المساعدة", "/help", "help", "إجابات وإرشادات"],
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
  const link = ([label, href, icon]: Route) => (
    <Link
      key={href}
      className={
        "nav-link" +
        (active === href ? " active" : "") +
        (href === "/ai" ? " nav-link-ai" : "")
      }
      aria-current={active === href ? "page" : undefined}
      href={href}
      onClick={() => setMenu(false)}
    >
      <span className="nav-icon">
        <Icon name={icon} size={18} />
      </span>
      <span className="nav-label">{label}</span>
      {href === "/ai" && <small className="nav-tag">جديد</small>}
    </Link>
  );
  const nav = (
    <>
      <Link href="/" className="brand sidebar-brand" aria-label="Noata — الرئيسية">
        <NoataBrand size={40} />
      </Link>
      <nav aria-label="التنقل الرئيسي" className="sidebar-nav">
        {navGroups.map((group) => (
          <div className="nav-group" key={group.title}>
            <div className="nav-title">{group.title}</div>
            {group.routes.map(link)}
          </div>
        ))}
      </nav>
      <StaffNav active={active} />
      <div className="sidebar-foot">
        <Link href="/ai" className="sidebar-ai-card" onClick={() => setMenu(false)}>
          <span className="sidebar-ai-icon">
            <Icon name="ai" size={18} />
          </span>
          <span>
            <b>المعرفة تبدأ بسؤال</b>
            <small>اسأل Noata AI أو افتح ورشة المذاكرة</small>
          </span>
          <Icon name="arrow" size={16} />
        </Link>
        <nav aria-label="الحساب والمساعدة" className="sidebar-utility">
          {utilityRoutes.map(link)}
        </nav>
        <div className="legal-links">
          <Link href="/privacy">الخصوصية</Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms">الشروط</Link>
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
              aria-label="فتح القائمة"
            >
              <Icon name="menu" />
            </button>
            <div>
              <span className="tiny-label">
                {role === "student"
                  ? "مساحتي التعليمية"
                  : role === "teacher"
                    ? "مساحة المعلّم"
                    : "مساحة الإدارة"}
              </span>
              <b>
                {routes.find((r) => r[1] === active)?.[0] ??
                  (role === "teacher" ? "مساحة المعلّم" : "إدارة Noata")}
              </b>
            </div>
          </div>
          <div className="top-actions">
            <button className="command-trigger" onClick={() => setSearch(true)}>
              <Icon name="search" size={17} />
              <span>انتقل إلى…</span>
              <kbd>⌘ K</kbd>
            </button>
            <ContextualCoach active={active} />
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
          Noata · مساحة تكبر معك<span>تعلّم بفضول، وتقدّم بثقة.</span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="تنقل سريع">
        {routes
          .filter((r) => ["/", "/learn", "/ai", "/progress"].includes(r[1]))
          .map(([label, href, icon]) => (
            <Link
              href={href}
              key={href}
              className={active === href ? "active" : ""}
              aria-current={active === href ? "page" : undefined}
            >
              <Icon name={icon} />
              <small>{label}</small>
            </Link>
          ))}
        <button onClick={() => setMenu(true)}>
          <Icon name="menu" />
          <small>المزيد</small>
        </button>
      </nav>
      <Dialog
        open={menu}
        onClose={() => setMenu(false)}
        title="مساحتك في Noata"
      >
        <div className="mobile-menu-content">{nav}</div>
      </Dialog>
      <Dialog
        open={search}
        onClose={() => setSearch(false)}
        title="رايح فين النهارده؟"
      >
        <input
          className="search command-input"
          autoFocus
          aria-label="ابحث عن صفحة"
          placeholder="ابحث عن صفحة أو أداة…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="command-results">
          {routes
            .filter((r) =>
              r.join(" ").toLowerCase().includes(query.toLowerCase()),
            )
            .map(([label, href, icon, description]) => (
              <Link href={href} key={href} onClick={() => setSearch(false)}>
                <Icon name={icon} />
                <span>
                  <b>{label}</b>
                  <small>{description}</small>
                </span>
                <Icon name="arrow" size={16} />
              </Link>
            ))}
        </div>
      </Dialog>
    </div>
  );
}
