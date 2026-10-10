"use client";
import { useTranslation, useLocale } from "@/lib/i18n/locale";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthJourney } from "@/components/auth/auth-journey";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfiguration } from "@/lib/supabase/config";
import { localizeAuthError } from "@/lib/i18n/auth-errors";
import { authCallbackUrl } from "@/lib/auth/flows";
import { canonicalAuthOrigin, canonicalLoginDestination } from "@/lib/auth/canonical-origin";

function CheckEmailContent() {
  const t = useTranslation();
  const locale = useLocale();
  const params = useSearchParams();
  const recovery = params.get("type") === "recovery";
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canonical = () => canonicalLoginDestination(window.location.href, process.env.NEXT_PUBLIC_AUTH_CANONICAL_ORIGIN);
  useEffect(() => {
    const target = canonical();
    if (target) window.location.replace(target);
  }, []);

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const target = canonical();
    if (target) { window.location.replace(target); return; }
    if (supabaseConfiguration.error) { setError(localizeAuthError({code:"SUPABASE_CONFIGURATION_INVALID"},locale)); return; }
    setError(""); setMessage(""); setBusy(true);
    try {
      const origin = canonicalAuthOrigin(window.location.origin, process.env.NEXT_PUBLIC_AUTH_CANONICAL_ORIGIN);
      const result = recovery
        ? await createClient().auth.resetPasswordForEmail(email.trim(), {
            redirectTo: authCallbackUrl(origin, "recovery", "/", process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL),
          })
        : await createClient().auth.resend({
            type: "signup", email: email.trim(),
            options: { emailRedirectTo: authCallbackUrl(origin, "signup", "/", process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL) },
          });
      if (result.error) { setError(localizeAuthError(result.error, locale)); return; }
      setMessage(t("لو البريد مرتبط بحساب مؤهل، هتصلك رسالة جديدة قريبًا. راجع البريد الوارد والرسائل غير المرغوب فيها.","If this email belongs to an eligible account, a new message will arrive shortly. Check your inbox and spam folder."));
    } catch {
      setError(t("تعذّر إرسال الرسالة الآن. جرّب مرة أخرى بعد قليل.","Could not send the email. Please try again shortly."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthJourney eyebrow={t("تحقّق من بريدك","Check your email")} title={recovery ? t("افتح رسالة الاستعادة","Open the recovery email") : t("باقي خطوة لتأكيد حسابك","One more step to confirm your account")} icon="check"
      description={recovery
        ? t("أرسلنا طلب استعادة كلمة المرور. افتح الرسالة الجديدة من بريدك وانتقل إلى صفحة تعيين كلمة المرور.","A password recovery request has been sent. Open the latest email and follow the link to set your password.")
        : t("افتح رسالة تأكيد البريد واتبع الرابط للعودة إلى Noata وتفعيل حسابك.","Open the confirmation email and follow the link to activate your Noata account.")}>
      <div className="auth-journey-mail-icon" aria-hidden="true"><span>✉</span></div>
      <div className="auth-journey-guidance">
        <strong>{t("نصيحة قبل ما تعيد الإرسال","Before sending another email")}</strong>
        <p>{t("راجع البريد الوارد وSpam، وتأكد من فتح الرابط في نفس المتصفح الذي بدأت منه الطلب. كل رابط له صلاحية محدودة.","Check your inbox and spam folder. Open the link in the browser where you requested it. Each link expires after a limited time.")}</p>
      </div>
      <form className="auth-form" onSubmit={resend}>
        <label className="auth-field">
          <span>{t("لم تصلك الرسالة؟ أدخل بريدك لإعادة الإرسال","No email yet? Enter your email to send it again")}</span>
          <input dir="ltr" type="email" placeholder="name@example.com" autoComplete="email"
            required value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} />
        </label>
        {error && <p className="auth-alert is-error" role="alert">{error}</p>}
        {message && <p className="auth-alert is-success" role="status">{message}</p>}
        <button className="auth-primary" disabled={busy} type="submit">{busy ? t("جارٍ الإرسال…","Sending…") : t("إعادة إرسال الرسالة","Resend email")}</button>
      </form>
    </AuthJourney>
  );
}

export default function CheckEmailPage() {
  const t = useTranslation();
  return <Suspense fallback={<AuthJourney eyebrow={t("البريد الإلكتروني","Email")} title={t("جارٍ تجهيز الإرشادات","Preparing your next steps")} description={t("لحظة من فضلك…","Please wait…")}><div className="auth-spinner" /></AuthJourney>}><CheckEmailContent /></Suspense>;
}
