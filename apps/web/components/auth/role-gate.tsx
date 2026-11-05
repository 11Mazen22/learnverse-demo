"use client";

import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { useTranslation } from "@/lib/i18n/locale";

export function RoleGate({
  allow,
  children,
}: {
  allow: ("teacher" | "admin")[];
  children: React.ReactNode;
}) {
  const t = useTranslation();
  const account = useVerifiedAccount();

  if (account.loading || account.profileLoading)
    return (
      <section className="aura-loading-state" role="status">
        <span />
        <h2>{t("نتحقق من صلاحيات مساحة العمل…","Checking workspace permissions…")}</h2>
      </section>
    );
  if (account.error || account.profileError || (account.user && !account.role))
    return (
      <section className="aura-load-error" role="alert">
        <h2>{t("تعذّر التحقق من الصلاحيات","Could not verify permissions")}</h2>
        <p>{t("أعد المحاولة عند عودة الاتصال.","Try again when your connection returns.")}</p>
        <button
          type="button"
          onClick={() => void account.refresh()}
        >{t("إعادة المحاولة","Try again")}</button>
      </section>
    );
  if (!account.user)
    return (
      <section className="panel" style={{ textAlign: "center", padding: 30 }}>
        <h2>{t("سجّل الدخول أولًا","Sign in to continue")}</h2>
        <a
          className="btn"
          style={{ background: "var(--accent)", color: "var(--surface)" }}
          href="/login"
        >{t("دخول","Sign in")}</a>
      </section>
    );
  if (!account.role || !allow.some((role) => role === account.role))
    return (
      <section className="panel" style={{ textAlign: "center", padding: 30 }}>
        <h2>{t("المساحة دي مش متاحة لحسابك.","This workspace is unavailable for your account.")}</h2>
        <p style={{ color: "var(--muted)" }}>{t("لو محتاج الوصول لمساحة المدرّس، تواصل مع إدارة منصتك.","Contact your platform administrator if you need access to the teacher workspace.")}</p>
        <a
          className="btn"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          href="/"
        >{t("رجوع","Back")}</a>
      </section>
    );
  return <>{children}</>;
}
