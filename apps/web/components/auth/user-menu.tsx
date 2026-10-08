"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  boundedRead,
  useVerifiedAccount,
} from "@/lib/supabase/use-verified-account";

type Profile = {
  display_name: string;
  role: "student" | "teacher" | "admin";
  xp: number;
  coins: number;
};
const roles = { student: "طالب", teacher: "معلّم", admin: "إدارة" };
export function UserMenu() {
  const account = useVerifiedAccount();
  const [profile, setProfile] = useState<Profile | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    let alive = true;
    const token = account.revision.current;
    setProfile(null);
    setError("");
    if (account.user)
      void (async () => {
        try {
          const result = await boundedRead(
            createClient()
              .from("profiles")
              .select("display_name,role,xp,coins")
              .eq("id", account.user!.id)
              .single(),
          );
          if (!alive || token !== account.revision.current) return;
          if (result.error) throw result.error;
          setProfile(result.data as Profile);
        } catch {
          if (alive && token === account.revision.current)
            setError("تعذّر تحميل بيانات الحساب.");
        }
      })();
    return () => {
      alive = false;
    };
  }, [account.user, account.revision]);
  if (account.loading) return <span role="status">نتحقق من الحساب…</span>;
  if (account.error)
    return (
      <button
        type="button"
        className="btn"
        onClick={() => void account.refresh()}
      >
        إعادة التحقق من الحساب
      </button>
    );
  if (!account.user)
    return (
      <a className="btn noata-sign-in" href="/login">
        دخول
      </a>
    );
  const name =
    profile?.display_name?.trim() ||
    account.user.email?.split("@")[0] ||
    "حسابك";
  async function logout() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      window.location.href = "/login";
    } catch {
      setError("لم يتأكد تسجيل الخروج. حاول مرة أخرى.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="noata-user-account">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="noata-user-summary" style={{ textAlign: "end" }}>
          <div style={{ fontSize: 12, fontWeight: 800 }}>{name}</div>
          <small style={{ color: "var(--muted)" }}>
            {profile
              ? `${roles[profile.role]} · ${profile.coins.toLocaleString("ar-EG")} عملة`
              : "بيانات الرصيد غير متاحة"}
          </small>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          disabled={busy}
          aria-label={
            busy ? "جارٍ تسجيل الخروج" : "تسجيل الخروج من حساب " + name
          }
          title="تسجيل الخروج"
          className="avatar"
          style={{ border: 0 }}
        >
          {name.slice(0, 1).toUpperCase()}
        </button>
      </div>
      {error && <small role="alert">{error}</small>}
    </div>
  );
}
