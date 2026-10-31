"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NoataBrand } from "@/components/ui/noata-logo";
import { LocaleControl } from "@/components/preferences/locale-control";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import "../../app/premium-home.css";
import "../../app/marketing.css";
import "../../app/marketing-premium.css";

const NAV: { href: string; ar: string; en: string }[] = [
  { href: "/", ar: "الرئيسية", en: "Home" },
  { href: "/features", ar: "المزايا", en: "Features" },
  { href: "/curriculum", ar: "المنهج والمسارات", en: "Curriculum & Tracks" },
  { href: "/how", ar: "طريقة التعلم", en: "How It Works" },
  { href: "/faq", ar: "أسئلة شائعة", en: "FAQ" },
  { href: "/help", ar: "مركز المساعدة", en: "Help Center" },
  { href: "/about", ar: "عن نقطة", en: "About Noäta" },
];

const FOOTER_LINKS: { titleAr: string; titleEn: string; links: { href: string; ar: string; en: string }[] }[] = [
  {
    titleAr: "المنتج والتعلم",
    titleEn: "Product & Learning",
    links: [
      { href: "/features", ar: "كل المزايا", en: "All Features" },
      { href: "/curriculum", ar: "المنهج والمسارات (٦ مواد)", en: "Curriculum Tracks (6 Subjects)" },
      { href: "/how", ar: "طريقة التعلم (دورة الإتقان)", en: "How It Works" },
      { href: "/features#ai", ar: "قدرات المساعد الذكي Noäta AI", en: "Noäta AI Capabilities" },
      { href: "/about", ar: "فلسفة التعلم والإتقان", en: "Learning Philosophy" },
    ],
  },
  {
    titleAr: "المواد الدراسية (أولى ثانوي)",
    titleEn: "Core Curriculum (G10)",
    links: [
      { href: "/curriculum?subject=integrated-science", ar: "العلوم المتكاملة (عربي / English)", en: "Integrated Science (AR / EN)" },
      { href: "/curriculum?subject=mathematics", ar: "الرياضيات (عربي / English)", en: "Mathematics (AR / EN)" },
      { href: "/curriculum?subject=history", ar: "تاريخ مصر والعالم القديم", en: "History" },
      { href: "/curriculum?subject=arabic-language", ar: "اللغة العربية وقصة عنترة", en: "Arabic Language" },
      { href: "/curriculum?subject=english", ar: "اللغة الإنجليزية (Term 1)", en: "English Language" },
      { href: "/curriculum?subject=philosophy-logic", ar: "الفلسفة والتفكير المنطقي", en: "Philosophy & Logic" },
    ],
  },
  {
    titleAr: "المساعدة والدعم",
    titleEn: "Help & Support",
    links: [
      { href: "/help", ar: "مركز المساعدة والأدلة", en: "Help Center & Guides" },
      { href: "/help#contact", ar: "تواصل مع الدعم الفني", en: "Contact Support" },
      { href: "/faq", ar: "الأسئلة الشائعة", en: "Frequently Asked Questions" },
    ],
  },
  {
    titleAr: "المنصة والخصوصية",
    titleEn: "Platform & Privacy",
    links: [
      { href: "/about", ar: "عن نقطة ورسالتنا", en: "About Noäta" },
      { href: "/privacy", ar: "سياسة الخصوصية", en: "Privacy Policy" },
      { href: "/terms", ar: "شروط الاستخدام", en: "Terms of Service" },
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

export function MarketingShell({ children, tone = "dark" }: { children: ReactNode; tone?: "light" | "dark" }) {
  const t = useTranslation(), locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="marketing-page" data-tone={tone}>
      <header className="mk-header">
        <div className="mk-header-inner">
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
            {open ? "✕" : "☰"}
          </button>
          <nav className="mk-nav" aria-label={t("التنقل الرئيسي", "Primary")}>
            {NAV.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className="relative inline-flex items-center gap-1.5 font-medium transition-colors"
                >
                  <span>{locale === "en" ? item.en : item.ar}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mk-actions">
            <span className="mk-locale"><LocaleControl /></span>
            <Link href="/login" className="mk-login">{t("دخول", "Log in")}</Link>
            <Link href="/signup" className="mk-cta">{t("ابدأ مجانًا", "Start free")}</Link>
          </div>
        </div>
      </header>

      {/* Accessible Mobile Menu */}
      <nav className="mk-mobile" id="mk-mobile-nav" data-open={open} aria-label={t("قائمة الجوال", "Mobile menu")}>
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08]">
          <span className="text-xs text-muted font-semibold">{t("تنقل المنصة", "Platform Navigation")}</span>
          <LocaleControl />
        </div>
        {NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive ? "bg-indigo-500/15 text-indigo-300" : "text-[#e2e8f0] hover:bg-white/[0.05]"
              }`}
            >
              <span>{locale === "en" ? item.en : item.ar}</span>
            </Link>
          );
        })}
        <div className="pt-3 mt-2 border-t border-white/[0.08] flex flex-col gap-2">
          <Link
            href="/login"
            className="w-full text-center py-2.5 rounded-xl border border-white/10 text-sm font-bold text-white bg-white/[0.04] hover:bg-white/[0.08]"
          >
            {t("تسجيل الدخول", "Log in")}
          </Link>
          <Link
            href="/signup"
            data-cta="true"
            className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/25"
          >
            {t("ابدأ التعلم مجانًا", "Start learning free")}
          </Link>
        </div>
      </nav>

      <main className="mk-main" id="mk-main">{children}</main>

      <footer className="mk-footer">
        {/* Top Brand & Mission Banner */}
        <div className="mk-footer-top max-w-[1440px] mx-auto w-full px-6 md:px-12 pb-10 border-b border-white/[0.08]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-3">
                <NoataBrand />
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{t("منظومة التعلّم والإتقان 2026–2027", "Active Mastery Platform 2026–2027")}</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed">
                {t(
                  "أعدنا ابتكار المذاكرة في مصر لطلاب الصف الأول الثانوي: منهج موثق، ومسارات لغوية مستقلة، وتصحيح حتمي يعلل الصواب ويفكك المغالطات، ومراجعة مجدولة ترعى وقت وجهد كل طالب.",
                  "Re-engineering study in Egypt for First Secondary learners: verified syllabus, independent tracks, deterministic feedback explaining misconceptions, and scheduled recall that values every student's time.",
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-cyan-300">
                <span>✉️</span>
                <span>mazenshazly011@gmail.com</span>
              </div>
              <Link
                href="/signup"
                className="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 hover:brightness-110 transition-all whitespace-nowrap"
              >
                {t("ابدأ مجانًا", "Start Free")}
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Grand Columns */}
        <div className="mk-footer-inner max-w-[1440px] mx-auto w-full px-6 md:px-12 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FOOTER_LINKS.map((group) => (
            <section key={group.titleEn} className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>{locale === "en" ? group.titleEn : group.titleAr}</span>
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href + link.en}>
                    <Link
                      href={link.href}
                      className="text-xs text-[#94a3b8] hover:text-white transition-all flex items-center gap-1.5 group"
                    >
                      <span className="text-indigo-400/40 group-hover:text-indigo-300 transition-colors">›</span>
                      <span>{locale === "en" ? link.en : link.ar}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Bottom Trust & Legal Strip */}
        <div className="mk-footer-bottom max-w-[1440px] mx-auto w-full px-6 md:px-12 py-6 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#64748b]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{t("جميع الأنظمة وقواعد البيانات تعمل بكفاءة 99.9%", "All Systems Operational · 99.9% Uptime")}</span>
          </div>

          <p className="text-center md:text-start">
            {t(
              "نقطة © 2026–2027 — صُممت وطُوّرت بأعلى معايير الإتاحة وتجربة المستخدم لطلاب مصر.",
              "Noäta © 2026–2027 — Designed and engineered for Egyptian students with universal accessibility.",
            )}
          </p>

          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">{t("الخصوصية", "Privacy")}</Link>
            <span aria-hidden="true">·</span>
            <Link href="/terms" className="hover:text-white transition-colors">{t("الشروط", "Terms")}</Link>
            <span aria-hidden="true">·</span>
            <Link href="/help" className="hover:text-white transition-colors">{t("الدعم", "Support")}</Link>
            <span aria-hidden="true">·</span>
            <span className="mk-locale"><LocaleControl /></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
