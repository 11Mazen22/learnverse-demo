"use client";

import { useEffect, useMemo, useState } from "react";
import {
  boundedRead,
  useVerifiedAccount,
} from "@/lib/supabase/use-verified-account";
import { useTranslation } from "@/lib/i18n/locale";
import { createClient } from "@/lib/supabase/client";

export function RoleGate({
  allow,
  children,
}: {
  allow: ("teacher" | "admin")[];
  children: React.ReactNode;
}) {
  const t = useTranslation();
  const supabase = useMemo(() => createClient(), []);
  const account = useVerifiedAccount();
  const allowKey = allow.slice().sort().join(",");
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<
    "loading" | "allowed" | "denied" | "signed-out" | "error"
  >("loading");

  useEffect(() => {
    let alive = true;
    setState("loading");
    if (account.loading) return;
    if (account.error) {
      setState("error");
      return;
    }
    if (!account.user) {
      setState("signed-out");
      return;
    }
    const token = account.revision.current;
    void (async () => {
      try {
        const { data, error } = await boundedRead(
          supabase
            .from("profiles")
            .select("role")
            .eq("id", account.user!.id)
            .single(),
        );
        if (!alive || token !== account.revision.current) return;
        if (error) throw error;
        setState(
          data && allowKey.split(",").includes(data.role)
            ? "allowed"
            : "denied",
        );
      } catch {
        if (alive && token === account.revision.current) setState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [
    account.user,
    account.loading,
    account.error,
    account.revision,
    allowKey,
    supabase,
    retry,
  ]);

  if (account.loading || state === "loading")
    return (
      <section className="aura-loading-state" role="status">
        <span />
        <h2>{t("نتحقق من صلاحيات مساحة العمل…","Checking workspace permissions…")}</h2>
      </section>
    );
  if (account.error || state === "error")
    return (
      <section className="aura-load-error" role="alert">
        <h2>{t("تعذّر التحقق من الصلاحيات","Could not verify permissions")}</h2>
        <p>{t("أعد المحاولة عند عودة الاتصال.","Try again when your connection returns.")}</p>
        <button
          type="button"
          onClick={() => {
            if (account.error) void account.refresh();
            else setRetry((x) => x + 1);
          }}
        >{t("إعادة المحاولة","Try again")}</button>
      </section>
    );
  if (!account.user || state === "signed-out")
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
  if (state === "denied")
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
