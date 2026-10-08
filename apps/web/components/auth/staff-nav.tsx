"use client";

import { useEffect, useMemo, useState } from "react";
import {
  boundedRead,
  useVerifiedAccount,
} from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";

export function StaffNav({ active }: { active: string }) {
  const supabase = useMemo(() => createClient(), []);
  const account = useVerifiedAccount();
  const [role, setRole] = useState<"student" | "teacher" | "admin">("student");

  useEffect(() => {
    let alive = true;
    const token = account.revision.current;
    setRole("student");
    if (account.user)
      void (async () => {
        try {
          const result = await boundedRead(
            supabase
              .from("profiles")
              .select("role")
              .eq("id", account.user!.id)
              .single(),
          );
          if (
            alive &&
            token === account.revision.current &&
            !result.error &&
            result.data?.role
          )
            setRole(result.data.role);
        } catch {
          /* Permissions remain enforced by RoleGate and database RLS. */
        }
      })();
    return () => {
      alive = false;
    };
  }, [supabase, account.user, account.revision]);

  if (!account.user || account.loading || role === "student") return null;
  const items =
    role === "admin"
      ? [
          ["مساحة المعلّم", "/teacher", "◫"],
          ["إدارة Noata", "/admin", "▣"],
        ]
      : [["مساحة المعلّم", "/teacher", "◫"]];

  return (
    <div className="nav-group">
      <div className="nav-title">مساحات العمل</div>
      {items.map(([label, href, icon]) => (
        <a
          className={"nav-link " + (active === href ? "active" : "")}
          href={href}
          key={href}
        >
          <span>{icon}</span>
          {label}
        </a>
      ))}
    </div>
  );
}
