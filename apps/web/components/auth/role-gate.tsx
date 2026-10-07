"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function RoleGate({
  allow,
  children,
}: {
  allow: ("teacher" | "admin")[];
  children: React.ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<
    "loading" | "allowed" | "denied" | "signed-out"
  >("loading");

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState("signed-out");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setState(
        data && allow.includes(data.role as "teacher" | "admin")
          ? "allowed"
          : "denied",
      );
    })();
  }, [allow, supabase]);

  if (state === "loading")
    return (
      <section className="panel">
        <p>Loading workspace…</p>
      </section>
    );
  if (state === "signed-out")
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
