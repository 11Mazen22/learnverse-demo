import Link from "next/link";
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
  return (
    <main id="noata-main" className="auth-shell is-centered auth-journey-shell" dir="rtl">
      <section className="auth-card auth-journey-card" aria-labelledby="auth-journey-title">
        <div className="auth-journey-top">
          <NoataBrand size={44} />
          <span className="auth-journey-lock"><Icon name={icon} size={22} /></span>
        </div>
        <p className="auth-eyebrow">{eyebrow}</p>
        <h1 id="auth-journey-title">{title}</h1>
        <p className="auth-lead">{description}</p>
        <div className="auth-journey-content">{children}</div>
        <div className="auth-journey-footer">
          <Link href="/login" className="auth-journey-back">
            <Icon name="arrow" size={16} /> تسجيل الدخول
          </Link>
          <span>حسابك ورحلتك التعليمية في أمان</span>
        </div>
      </section>
    </main>
  );
}
