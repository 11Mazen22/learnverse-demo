"use client";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/locale";
import { LocaleControl } from "@/components/preferences/locale-control";
import { NoataBrand } from "@/components/ui/noata-logo";
import { Icon } from "@/components/ui/icon";
import type { ReactNode } from "react";

/** Shared Noata account-recovery layout: consistent across every auth state. */
export function AuthJourney({
  eyebrow, title, description, children, icon = "check",
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  icon?: string;
}) {
  const t = useTranslation();
  return (
    <main id="noata-main" className="auth-shell is-centered auth-journey-shell" >
      <section className="auth-card auth-journey-card" aria-labelledby="auth-journey-title">
        <div className="auth-journey-top">
          <NoataBrand size={44} />
          <LocaleControl />
          <span className="auth-journey-lock"><Icon name={icon} size={22} /></span>
        </div>
        <p className="auth-eyebrow">{eyebrow}</p>
        <h1 id="auth-journey-title">{title}</h1>
        <p className="auth-lead">{description}</p>
        <div className="auth-journey-content">{children}</div>
        <div className="auth-journey-footer">
          <Link href="/login" className="auth-journey-back">
            <Icon name="arrow" size={16} />{t("تسجيل الدخول","Sign in")}</Link>
          <span>{t("حسابك ورحلتك التعليمية في أمان","Your account and learning journey are secure")}</span>
        </div>
      </section>
    </main>
  );
}
