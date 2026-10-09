"use client";

import { useState } from "react";
import Link from "next/link";
import { NoataBrand } from "@/components/ui/noata-logo";
import "./legal-pages.css";

export type LegalSection = {
  id: string;
  titleAr: string;
  titleEn: string;
  ar: string[];
  en: string[];
};

export function LegalPage({
  kind,
  titleAr,
  titleEn,
  summaryAr,
  summaryEn,
  sections,
}: {
  kind: "privacy" | "terms";
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  sections: LegalSection[];
}) {
  const [locale, setLocale] = useState<"ar" | "en">("ar");
  const arabic = locale === "ar";
  const title = arabic ? titleAr : titleEn;

  return (
    <main id="noata-main" className="noata-legal" dir={arabic ? "rtl" : "ltr"} lang={locale}>
      <header className="noata-legal-header">
        <Link href="/" className="noata-legal-brand" aria-label="Noata home">
          <NoataBrand size={42} tagline={null} />
        </Link>
        <nav className="noata-legal-topnav" aria-label={arabic ? "روابط المنصة" : "Platform links"}>
          <Link href="/">{arabic ? "الرئيسية" : "Home"}</Link>
          <Link href="/help">{arabic ? "المساعدة" : "Help"}</Link>
          <Link href="/login" className="noata-legal-login">{arabic ? "تسجيل الدخول" : "Sign in"}</Link>
        </nav>
      </header>

      <div className="noata-legal-body">
        <section className="noata-legal-hero">
          <div className="noata-legal-hero-text">
            <div className="noata-legal-kicker">NOATA / {kind === "privacy" ? "TRUST & PRIVACY" : "TERMS OF USE"}</div>
            <h1>{title}</h1>
            <p>{arabic ? summaryAr : summaryEn}</p>
            <span className="noata-legal-date">
              {arabic ? "آخر تحديث: 9 أكتوبر 2026" : "Last updated: 9 October 2026"}
            </span>
          </div>
          <div className="noata-legal-hero-mark" aria-hidden="true"><span>✦</span><span>NOATA</span></div>
        </section>

        <div className="noata-legal-columns">
          <aside className="noata-legal-sidebar" aria-label={arabic ? "فهرس الصفحة" : "Contents"}>
            <div className="noata-legal-language" role="group" aria-label="Language / اللغة">
              <button type="button" aria-pressed={arabic} onClick={() => setLocale("ar")}>العربية</button>
              <button type="button" aria-pressed={!arabic} onClick={() => setLocale("en")}>English</button>
            </div>
            <p>{arabic ? "في هذه الصفحة" : "On this page"}</p>
            <nav>
              {sections.map((section, index) => (
                <a key={section.id} href={`#${section.id}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {arabic ? section.titleAr : section.titleEn}
                </a>
              ))}
            </nav>
          </aside>

          <article className="noata-legal-article">
            {sections.map((section, index) => (
              <section id={section.id} key={section.id} className="noata-legal-section">
                <span className="noata-legal-section-index">{String(index + 1).padStart(2, "0")} / {String(sections.length).padStart(2, "0")}</span>
                <h2>{arabic ? section.titleAr : section.titleEn}</h2>
                {(arabic ? section.ar : section.en).map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex}>{paragraph}</p>
                ))}
              </section>
            ))}
            <div className="noata-legal-related">
              <strong>{arabic ? "المزيد من المعلومات" : "Explore further"}</strong>
              <p>{arabic ? "قبل إنشاء حساب، راجع الوثيقتين واسأل عن أي نقطة مش واضحة." : "Review both documents before creating an account, and ask about anything unclear."}</p>
              <div>
                <Link href="/privacy">{arabic ? "سياسة الخصوصية" : "Privacy policy"}</Link>
                <Link href="/terms">{arabic ? "شروط الاستخدام" : "Terms of use"}</Link>
                <Link href="/help">{arabic ? "مركز المساعدة" : "Help center"}</Link>
              </div>
            </div>
          </article>
        </div>
      </div>
      <footer className="noata-legal-footer">
        <span>© 2026 Noata · {arabic ? "تعلّم بفضول وتقدّم بثقة" : "Learn with curiosity, grow with confidence"}</span>
        <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </footer>
    </main>
  );
}
