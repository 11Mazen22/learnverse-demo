"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { createClient } from "@/lib/supabase/client";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { localized, useLocale } from "@/lib/i18n/locale";
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
export function UserMenu() {
  const locale = useLocale();
  const t = useCallback((ar: string, en: string) => localized(locale, ar, en), [locale]);
  const roles = { student: t("طالب", "Student"), teacher: t("معلّم", "Teacher"), admin: t("إدارة", "Admin") };
  const account = useVerifiedAccount();
  const [profile, setProfile] = useState<Profile | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    function outside(event: PointerEvent) {
      if (document.querySelector("dialog[open]")) return;
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (document.querySelector("dialog[open]")) return;
      if (event.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
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
             setError(t("تعذّر تحميل بيانات الحساب.", "Could not load account details."));
        }
      })();
    return () => {
      alive = false;
    };
   }, [account.user, account.revision, t]);
   if (account.loading) return <span role="status">{t("نتحقق من الحساب…", "Verifying your account…")}</span>;
  if (account.error)
    return (
      <button
        type="button"
        className="btn"
        onClick={() => void account.refresh()}
      >
         {t("إعادة التحقق من الحساب", "Verify account again")}
      </button>
    );
  if (!account.user)
    return (
      <a className="btn noata-sign-in" href="/login">
         {t("دخول", "Sign in")}
      </a>
    );
  const name =
    profile?.display_name?.trim() ||
    account.user.email?.split("@")[0] ||
     t("حسابك", "Your account");
  async function logout() {
    if (lock.current) return;
    lock.current = true;
    const revision = account.revision.current;
    setError("");
    try {
      const approved = await confirmAction({
         title: t("تسجيل الخروج من Noata؟", "Sign out of Noata?"),
         description: t("ستظل بياناتك محفوظة في حسابك. احفظ أي عمل غير مكتمل قبل تسجيل الخروج.", "Your account data will remain saved. Save unfinished work before signing out."),
         confirmLabel: t("تسجيل الخروج", "Sign out"),
         cancelLabel: t("البقاء في حسابي", "Stay signed in"),
        tone: "danger",
        icon: "user",
      });
      if (!approved || revision !== account.revision.current) return;
      setBusy(true);
      setMenuOpen(false);
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      window.location.href = "/login";
    } catch {
       setError(t("لم يتأكد تسجيل الخروج. حاول مرة أخرى.", "Could not confirm sign-out. Please try again."));
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
               ? `${roles[profile.role]} · ${profile.coins.toLocaleString(locale === "en" ? "en" : "ar-EG")}${t(" عملة", " coins")}`
               : t("بيانات الرصيد غير متاحة", "Balance unavailable")}
          </small>
        </div>
        <button
          type="button"
          className="avatar noata-account-trigger"
          ref={triggerRef}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setMenuOpen(true);
            }
          }}
          onClick={() => setMenuOpen((open) => !open)}
          disabled={busy}
           aria-label={t("فتح قائمة حساب ", "Open account menu for ") + name}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls="noata-account-menu"
           title={t("حسابي والإعدادات", "My account and settings")}
        >
          {name.slice(0, 1).toUpperCase()}
        </button>
      </div>
      {menuOpen && (
         <div id="noata-account-menu" className="noata-account-menu" role="menu" aria-label={t("خيارات الحساب", "Account options")}
          onKeyDown={(event) => {
            const items = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')];
            const index = items.indexOf(document.activeElement as HTMLElement);
            if (event.key === "Tab") { setMenuOpen(false); triggerRef.current?.focus(); return; }
            const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 :
              event.key === "ArrowDown" ? (index + 1) % items.length :
              event.key === "ArrowUp" ? (index - 1 + items.length) % items.length : null;
            if (next !== null) { event.preventDefault(); items[next]?.focus(); }
          }}>
          <div className="noata-account-menu-identity">
            <strong>{name}</strong>
             <small dir="ltr">{account.user.email ?? t("حساب Noata", "Noata account")}</small>
             <span>{profile ? roles[profile.role] : t("الحساب الشخصي", "Personal account")}</span>
          </div>
          <Link href="/settings#aura-profile" role="menuitem" tabIndex={-1} onClick={() => setMenuOpen(false)}>
             <Icon name="user" size={18} /> {t("الملف الشخصي", "Profile")}
          </Link>
          <Link href="/settings" role="menuitem" tabIndex={-1} onClick={() => setMenuOpen(false)}>
             <Icon name="settings" size={18} /> {t("إعدادات الحساب", "Account settings")}
          </Link>
          <div className="noata-account-menu-separator" />
          <button type="button" role="menuitem" tabIndex={-1} className="noata-account-logout" onClick={() => void logout()} disabled={busy}>
            <Icon name="arrow" size={18} />
             {busy ? t("جارٍ تسجيل الخروج…", "Signing out…") : t("تسجيل الخروج", "Sign out")}
          </button>
        </div>
      )}
      {error && <small role="alert" className="noata-account-error">{error}</small>}
    </div>
  );
}
