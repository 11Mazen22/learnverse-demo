"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { AuthJourney } from "@/components/auth/auth-journey";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfiguration } from "@/lib/supabase/config";
import { localizeAuthError } from "@/lib/i18n/auth-errors";
import { authCallbackUrl } from "@/lib/auth/flows";
import { canonicalAuthOrigin, canonicalLoginDestination } from "@/lib/auth/canonical-origin";

export default function ForgotPasswordPage() {
  const t = useTranslation();
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canonical = () => canonicalLoginDestination(window.location.href, process.env.NEXT_PUBLIC_AUTH_CANONICAL_ORIGIN);
  useEffect(() => {
    const target = canonical();
    if (target) window.location.replace(target);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const target = canonical();
    if (target) { window.location.replace(target); return; }
    if (supabaseConfiguration.error) { setError(localizeAuthError({code:"SUPABASE_CONFIGURATION_INVALID"},locale)); return; }
    setBusy(true); setError("");
    try {
      const origin = canonicalAuthOrigin(window.location.origin, process.env.NEXT_PUBLIC_AUTH_CANONICAL_ORIGIN);
      const { error: issue } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: authCallbackUrl(origin, "recovery", "/", process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL),
      });
      if (issue) { setError(localizeAuthError(issue, locale)); return; }
      window.location.assign("/auth/check-email?type=recovery");
    } catch {
      setError(t("تعذّر الاتصال بخدمة البريد حاليًا. تحقّق من اتصالك وحاول مجددًا.","Could not reach the email service. Check your connection and try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthJourney eyebrow={t("استعادة الوصول","Recover access")} title={t("لنبدأ باستعادة حسابك","Let’s recover your account")} icon="user"
      description={t("اكتب بريدك الإلكتروني، وسنرسل رابطًا آمنًا يساعدك على إنشاء كلمة مرور جديدة.","Enter your email to receive a secure link for setting a new password.")}>
      <div className="auth-journey-steps"><span className="is-active">{t("١ · بريدك","1 · Email")}</span><span>{t("٢ · التأكيد","2 · Confirmation")}</span><span>{t("٣ · كلمة جديدة","3 · New password")}</span></div>
      <form className="auth-form" onSubmit={submit}>
        <label className="auth-field">
          <span>{t("البريد الإلكتروني المرتبط بالحساب","Account email")}</span>
          <input dir="ltr" type="email" autoComplete="email" placeholder="name@example.com"
            required value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} />
        </label>
        {error && <p role="alert" className="auth-alert is-error">{error}</p>}
        <button className="auth-primary" type="submit" disabled={busy}>
          {busy ? t("جارٍ إرسال الرابط…","Sending the link…") : t("إرسال رابط الاستعادة","Send recovery link")}
        </button>
      </form>
      <p className="auth-journey-note">{t("لحماية خصوصيتك، لن نؤكد وجود البريد في سجلاتنا. لن يطلب منك فريق Noata كلمة مرورك عبر البريد.","For your privacy, we do not confirm whether an email is registered. Noata will never ask for your password by email.")}</p>
      <Link className="auth-journey-subaction" href="/login">{t("تذكرت كلمة المرور؟ العودة للدخول","Remembered your password? Back to sign in")}</Link>
    </AuthJourney>
  );
}
