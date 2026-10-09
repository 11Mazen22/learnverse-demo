"use client";

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
    if (supabaseConfiguration.error) { setError(supabaseConfiguration.error); return; }
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
      if (result.error) { setError(localizeAuthError(result.error)); return; }
      setMessage("لو البريد مرتبط بحساب مؤهل، هتصلك رسالة جديدة قريبًا. راجع البريد الوارد والرسائل غير المرغوب فيها.");
    } catch {
      setError("تعذّر إرسال الرسالة الآن. جرّب مرة أخرى بعد قليل.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthJourney eyebrow="تحقّق من بريدك" title={recovery ? "افتح رسالة الاستعادة" : "باقي خطوة لتأكيد حسابك"} icon="check"
      description={recovery
        ? "أرسلنا طلب استعادة كلمة المرور. افتح الرسالة الجديدة من بريدك وانتقل إلى صفحة تعيين كلمة المرور."
        : "افتح رسالة تأكيد البريد واتبع الرابط للعودة إلى Noata وتفعيل حسابك."}>
      <div className="auth-journey-mail-icon" aria-hidden="true"><span>✉</span></div>
      <div className="auth-journey-guidance">
        <strong>نصيحة قبل ما تعيد الإرسال</strong>
        <p>راجع البريد الوارد وSpam، وتأكد من فتح الرابط في نفس المتصفح الذي بدأت منه الطلب. كل رابط له صلاحية محدودة.</p>
      </div>
      <form className="auth-form" onSubmit={resend}>
        <label className="auth-field">
          <span>لم تصلك الرسالة؟ أدخل بريدك لإعادة الإرسال</span>
          <input dir="ltr" type="email" placeholder="name@example.com" autoComplete="email"
            required value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} />
        </label>
        {error && <p className="auth-alert is-error" role="alert">{error}</p>}
        {message && <p className="auth-alert is-success" role="status">{message}</p>}
        <button className="auth-primary" disabled={busy} type="submit">{busy ? "جارٍ الإرسال…" : "إعادة إرسال الرسالة"}</button>
      </form>
    </AuthJourney>
  );
}

export default function CheckEmailPage() {
  return <Suspense fallback={<AuthJourney eyebrow="البريد الإلكتروني" title="جارٍ تجهيز الإرشادات" description="لحظة من فضلك…"><div className="auth-spinner" /></AuthJourney>}><CheckEmailContent /></Suspense>;
}
