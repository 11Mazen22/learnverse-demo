"use client";

import { useEffect, useMemo, useState } from "react";
import {
  boundedRead,
  useVerifiedAccount,
} from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";

export function RoleGate({
  allow,
  children,
}: {
  allow: ("teacher" | "admin")[];
  children: React.ReactNode;
}) {
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
        <h2>نتحقق من صلاحيات مساحة العمل…</h2>
      </section>
    );
  if (account.error || state === "error")
    return (
      <section className="aura-load-error" role="alert">
        <h2>تعذّر التحقق من الصلاحيات</h2>
        <p>أعد المحاولة عند عودة الاتصال.</p>
        <button
          type="button"
          onClick={() => {
            if (account.error) void account.refresh();
            else setRetry((x) => x + 1);
          }}
        >
          إعادة المحاولة
        </button>
      </section>
    );
  if (!account.user || state === "signed-out")
    return (
      <section className="panel" style={{ textAlign: "center", padding: 30 }}>
        <h2>سجّل الدخول أولًا</h2>
        <a
          className="btn"
          style={{ background: "var(--accent)", color: "var(--surface)" }}
          href="/login"
        >
          دخول
        </a>
      </section>
    );
  if (state === "denied")
    return (
      <section className="panel" style={{ textAlign: "center", padding: 30 }}>
        <h2>المساحة دي مش متاحة لحسابك.</h2>
        <p style={{ color: "var(--muted)" }}>
          لو محتاج الوصول لمساحة المدرّس، تواصل مع إدارة منصتك.
        </p>
        <a
          className="btn"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          href="/"
        >
          رجوع
        </a>
      </section>
    );
  return <>{children}</>;
}
