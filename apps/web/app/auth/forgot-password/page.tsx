"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AuthJourney } from "@/components/auth/auth-journey";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfiguration } from "@/lib/supabase/config";
import { localizeAuthError } from "@/lib/i18n/auth-errors";
import { authCallbackUrl } from "@/lib/auth/flows";
import { canonicalAuthOrigin, canonicalLoginDestination } from "@/lib/auth/canonical-origin";

export default function ForgotPasswordPage() {
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
    if (supabaseConfiguration.error) { setError(supabaseConfiguration.error); return; }
    setBusy(true); setError("");
    try {
      const origin = canonicalAuthOrigin(window.location.origin, process.env.NEXT_PUBLIC_AUTH_CANONICAL_ORIGIN);
      const { error: issue } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: authCallbackUrl(origin, "recovery", "/", process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL),
      });
      if (issue) { setError(localizeAuthError(issue)); return; }
      window.location.assign("/auth/check-email?type=recovery");
    } catch {
      setError("تعذّر الاتصال بخدمة البريد حاليًا. تحقّق من اتصالك وحاول مجددًا.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthJourney eyebrow="استعادة الوصول" title="لنبدأ باستعادة حسابك" icon="user"
      description="اكتب بريدك الإلكتروني، وسنرسل رابطًا آمنًا يساعدك على إنشاء كلمة مرور جديدة.">
      <div className="auth-journey-steps"><span className="is-active">١ · بريدك</span><span>٢ · التأكيد</span><span>٣ · كلمة جديدة</span></div>
      <form className="auth-form" onSubmit={submit}>
        <label className="auth-field">
          <span>البريد الإلكتروني المرتبط بالحساب</span>
          <input dir="ltr" type="email" autoComplete="email" placeholder="name@example.com"
            required value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} />
        </label>
        {error && <p role="alert" className="auth-alert is-error">{error}</p>}
        <button className="auth-primary" type="submit" disabled={busy}>
          {busy ? "جارٍ إرسال الرابط…" : "إرسال رابط الاستعادة"}
        </button>
      </form>
      <p className="auth-journey-note">لحماية خصوصيتك، لن نؤكد وجود البريد في سجلاتنا. لن يطلب منك فريق Noata كلمة مرورك عبر البريد.</p>
      <Link className="auth-journey-subaction" href="/login">تذكرت كلمة المرور؟ العودة للدخول</Link>
    </AuthJourney>
  );
}
