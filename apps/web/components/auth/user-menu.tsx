"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
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
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [menuOpen]);
  useEffect(() => { setMenuOpen(false); }, [account.user?.id]);
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
    setMenuOpen(false);
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
    <div className="noata-user-account" ref={menuRef}>
      <div className="noata-user-account-trigger-row">
        <div className="noata-user-summary">
          <strong>{name}</strong>
          <small>
            {profile
              ? `${roles[profile.role]} · ${profile.coins.toLocaleString("ar-EG")} عملة`
              : "بيانات الرصيد غير متاحة"}
          </small>
        </div>
        <button
          type="button"
          className="avatar noata-account-trigger"
          onClick={() => setMenuOpen((open) => !open)}
          disabled={busy}
          aria-label={"فتح قائمة حساب " + name}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls="noata-account-menu"
          title="حسابي والإعدادات"
        >
          {name.slice(0, 1).toUpperCase()}
        </button>
      </div>
      {menuOpen && (
        <div id="noata-account-menu" className="noata-account-menu" role="menu" aria-label="خيارات الحساب">
          <div className="noata-account-menu-identity">
            <strong>{name}</strong>
            <small dir="ltr">{account.user.email ?? "حساب Noata"}</small>
            <span>{profile ? roles[profile.role] : "الحساب الشخصي"}</span>
          </div>
          <Link href="/settings#aura-profile" role="menuitem" onClick={() => setMenuOpen(false)}>
            <Icon name="user" size={18} /> الملف الشخصي
          </Link>
          <Link href="/settings" role="menuitem" onClick={() => setMenuOpen(false)}>
            <Icon name="settings" size={18} /> إعدادات الحساب
          </Link>
          <div className="noata-account-menu-separator" />
          <button type="button" role="menuitem" className="noata-account-logout" onClick={() => void logout()} disabled={busy}>
            <Icon name="arrow" size={18} />
            {busy ? "جارٍ تسجيل الخروج…" : "تسجيل الخروج"}
          </button>
        </div>
      )}
      {error && <small role="alert" className="noata-account-error">{error}</small>}
    </div>
  );
}
