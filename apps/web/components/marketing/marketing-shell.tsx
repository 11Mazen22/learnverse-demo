"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NoataBrand } from "@/components/ui/noata-logo";
import { LocaleControl } from "@/components/preferences/locale-control";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import "../app/premium-home.css";
import "../app/marketing.css";

const NAV: { href: string; ar: string; en: string }[] = [
  { href: "/", ar: "الرئيسية", en: "Home" },
  { href: "/features", ar: "المزايا", en: "Features" },
  { href: "/about", ar: "عن نقطة", en: "About" },
  { href: "/faq", ar: "أسئلة شائعة", en: "FAQ" },
];

const FOOTER_LINKS: { titleAr: string; titleEn: string; links: { href: string; ar: string; en: string }[] }[] = [
  {
    titleAr: "المنتج", titleEn: "Product",
    links: [
      { href: "/features", ar: "المزايا", en: "Features" },
      { href: "/features#how", ar: "كيف يعمل", en: "How it works" },
      { href: "/signup", ar: "ابدأ التعلم", en: "Get started" },
      { href: "/login", ar: "تسجيل الدخول", en: "Log in" },
    ],
  },
  {
    titleAr: "المساعدة", titleEn: "Help",
    links: [
      { href: "/faq", ar: "أسئلة شائعة", en: "FAQ" },
      { href: "/help", ar: "مركز المساعدة", en: "Help center" },
    ],
  },
  {
    titleAr: "الشركة", titleEn: "Company",
    links: [
      { href: "/about", ar: "عن نقطة", en: "About" },
      { href: "/privacy", ar: "الخصوصية", en: "Privacy" },
      { href: "/terms", ar: "الشروط", en: "Terms" },
    ],
  },
];

/** Wrap a section so it fades in on scroll — skipped entirely under reduced motion. */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`mk-reveal ${className}`} data-visible={visible}>
      {children}
    </div>
  );
}

export function MarketingShell({ children }: { children: ReactNode }) {
  const t = useTranslation(), locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="marketing-page">
      <a href="#mk-main" className="skip-link">{t("تخطَّ إلى المحتوى", "Skip to content")}</a>
      <header className="mk-header">
        <Link href="/" className="mk-brand">
          <NoataBrand />
        </Link>
        <button
          type="button"
          className="mk-burger"
          aria-expanded={open}
          aria-controls="mk-mobile-nav"
          aria-label={t("فتح القائمة", "Open menu")}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "×" : "≡"}
        </button>
        <nav className="mk-nav" aria-label={t("التنقل الرئيسي", "Primary")}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
              {locale === "en" ? item.en : item.ar}
            </Link>
          ))}
        </nav>
        <div className="mk-actions">
          <span className="mk-locale"><LocaleControl /></span>
          <Link href="/login" className="mk-login">{t("دخول", "Log in")}</Link>
          <Link href="/signup" className="mk-cta">{t("ابدأ مجانًا", "Start free")}</Link>
        </div>
      </header>
      <nav className="mk-mobile" id="mk-mobile-nav" data-open={open} aria-label={t("قائمة الجوال", "Mobile menu")}>
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
            {locale === "en" ? item.en : item.ar}
          </Link>
        ))}
        <Link href="/login">{t("تسجيل الدخول", "Log in")}</Link>
        <Link href="/signup" data-cta="true">{t("ابدأ مجانًا", "Start free")}</Link>
      </nav>
      <main className="mk-main" id="mk-main">{children}</main>
      <footer className="mk-footer">
        <div className="mk-footer-inner">
          {FOOTER_LINKS.map((group) => (
            <section key={group.titleEn}>
              <h4>{locale === "en" ? group.titleEn : group.titleAr}</h4>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href + link.en}>
                    <Link href={link.href}>{locale === "en" ? link.en : link.ar}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <section>
            <h4>{t("المنهج", "Curriculum")}</h4>
            <ul>
              <li><Link href="/features#curriculum">{t("الصف الأول الثانوي — الترم الأول", "First Secondary — Term 1")}</Link></li>
              <li><Link href="/features#curriculum">{t("ست مواد كاملة", "Six complete subjects")}</Link></li>
            </ul>
          </section>
        </div>
        <p className="mk-footer-bottom">
          {t(
            "نقطة — منصة تعلم تجمع الدروس والمراجعة المجدولة والمساعد الذكي في مكان واحد.",
            "Noata — a learning platform that brings lessons, scheduled review and an AI study companion together.",
          )}
        </p>
      </footer>
    </div>
  );
}
