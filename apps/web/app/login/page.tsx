"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { NoataBrand } from "@/components/ui/noata-logo";
import { Icon } from "@/components/ui/icon";
import { createClient } from "@/lib/supabase/client";
import { localizeAuthError, safeNextPath } from "@/lib/i18n/auth-errors";

type Mode = "signin" | "signup" | "forgot" | "verify";

const COPY: Record<Mode, { eyebrow: string; title: string; lead: string }> = {
  signin: {
    eyebrow: "أهلًا بعودتك",
    title: "أكمل رحلتك",
    lead: "تقدّمك ومكافآتك ومحادثاتك مع Noata AI محفوظة بأمان في حسابك.",
  },
  signup: {
    eyebrow: "ابدأ رحلتك",
    title: "أنشئ حسابك في Noata",
    lead: "كل فكرة جديدة تستحق فرصة. أنشئ حسابك وابدأ التعلّم بطريقتك.",
  },
  forgot: {
    eyebrow: "استعادة الحساب",
    title: "نسيت كلمة المرور؟",
    lead: "اكتب البريد المرتبط بحسابك وسنرسل إليك رابطًا آمنًا لتعيين كلمة مرور جديدة.",
  },
  verify: {
    eyebrow: "خطوة أخيرة",
    title: "تحقّق من بريدك",
    lead: "",
  },
};

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"" | "form" | "google" | "resend">("");

  const nextPath = () =>
    safeNextPath(new URLSearchParams(window.location.search).get("next"));
  const callbackUrl = () =>
    window.location.origin +
    "/auth/callback?next=" +
    encodeURIComponent(nextPath());

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setMessage("");
  }

  async function signInWithGoogle() {
    if (busy) return;
    setBusy("google");
    setError("");
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl(),
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) setError(localizeAuthError(error));
    } catch {
      setError("تعذّر الاتصال بخدمة Google الآن. تحقّق من اتصالك أو استخدم البريد الإلكتروني.");
    } finally {
      // Clear the busy state if the provider rejects the request or navigation
      // does not begin; a successful OAuth redirect leaves this page.
      setBusy("");
    }
  }

  async function resendVerification() {
    setBusy("resend");
    setError("");
    const { error } = await createClient().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: callbackUrl() },
    });
    setBusy("");
    if (error) setError(localizeAuthError(error));
    else setMessage("أرسلنا رسالة تأكيد جديدة. قد تستغرق دقيقة للوصول.");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy("form");
    setError("");
    setMessage("");
    const supabase = createClient();

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/auth/callback?next=" + encodeURIComponent("/auth/update-password"),
      });
      setBusy("");
      if (error) {
        setError(localizeAuthError(error));
        return;
      }
      setMessage(
        "إذا كان البريد مسجّلًا لدينا، فستصلك رسالة تحتوي على رابط لتعيين كلمة مرور جديدة.",
      );
      return;
    }

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.code === "email_not_confirmed") {
          setBusy("");
          setMode("verify");
          return;
        }
        setError(localizeAuthError(error));
        setBusy("");
        return;
      }
      window.location.href = nextPath();
      return;
    }

    if (password.length < 8) {
      setError("استخدم كلمة مرور من 8 أحرف على الأقل.");
      setBusy("");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name.trim() },
        emailRedirectTo: callbackUrl(),
      },
    });
    if (error) {
      setError(localizeAuthError(error));
      setBusy("");
      return;
    }
    if (data.session) {
      window.location.href = nextPath();
      return;
    }
    setBusy("");
    setMode("verify");
  }

  const copy = COPY[mode];
  const showTabs = mode === "signin" || mode === "signup";

  return (
    <main id="noata-main" className="auth-shell">
      <aside className="auth-aside" aria-hidden="true">
        <NoataBrand size={44} />
        <div className="auth-aside-copy">
          <h2>مساحة تعلّم عربية تكبر معك</h2>
          <p>دروس تفاعلية، مراجعة ذكية، مصحف موثّق، ومساعد Noata AI يرافقك خطوة بخطوة.</p>
        </div>
        <div className="auth-aside-stage" aria-hidden="true">
          <span className="auth-aside-stage-glow" />
          <span className="auth-aside-stage-mark"><NoataBrand size={76} compact /></span>
          <span className="auth-aside-stage-caption">الفكرة اليوم، إنجاز الغد</span>
        </div>
        <ul className="auth-aside-points">
          <li><Icon name="ai" size={18} /> ورشة مذاكرة: شرح، اختبارات، وبطاقات مراجعة</li>
          <li><Icon name="chart" size={18} /> تقدّم ومكافآت تُحفظ مع حسابك</li>
          <li><Icon name="check" size={18} /> واجبات ومتابعة مباشرة من معلّمك</li>
        </ul>
      </aside>

      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-card-brand">
          <NoataBrand size={40} />
        </div>

        {showTabs && (
          <div className="auth-tabs" role="tablist" aria-label="طريقة الدخول">
            <button type="button" role="tab" aria-selected={mode === "signin"} onClick={() => switchMode("signin")}>
              تسجيل الدخول
            </button>
            <button type="button" role="tab" aria-selected={mode === "signup"} onClick={() => switchMode("signup")}>
              حساب جديد
            </button>
          </div>
        )}

        {mode === "verify" ? (
          <div className="auth-verify">
            <span className="auth-verify-icon"><Icon name="check" size={26} /></span>
            <p className="auth-eyebrow">{copy.eyebrow}</p>
            <h1 id="auth-title">{copy.title}</h1>
            <p className="auth-lead">
              أرسلنا رابط التأكيد إلى <b dir="ltr">{email || "بريدك الإلكتروني"}</b>. افتح الرسالة واضغط
              «تأكيد البريد» وسنكمل تسجيل دخولك تلقائيًا.
            </p>
            <ul className="auth-verify-tips">
              <li>لم تصلك الرسالة؟ تحقّق من مجلد الرسائل غير المرغوب فيها.</li>
              <li>افتح الرابط من نفس المتصفح لإكمال الدخول بسلاسة.</li>
            </ul>
            {error && <p className="auth-alert is-error" role="alert">{error}</p>}
            {message && <p className="auth-alert is-success" role="status">{message}</p>}
            <button type="button" className="auth-primary" onClick={resendVerification} disabled={!email || busy !== ""}>
              {busy === "resend" ? "جارٍ الإرسال…" : "إعادة إرسال رسالة التأكيد"}
            </button>
            <button type="button" className="auth-link" onClick={() => switchMode("signin")}>
              العودة إلى تسجيل الدخول
            </button>
          </div>
        ) : (
          <>
            <p className="auth-eyebrow">{copy.eyebrow}</p>
            <h1 id="auth-title">{copy.title}</h1>
            <p className="auth-lead">{copy.lead}</p>

            {showTabs && (
              <>
                <button type="button" className="auth-google" onClick={signInWithGoogle} disabled={busy !== ""}>
                  <GoogleMark />
                  {busy === "google" ? "جارٍ التحويل إلى Google…" : "المتابعة باستخدام Google"}
                </button>
                <div className="auth-divider"><span>أو بالبريد الإلكتروني</span></div>
              </>
            )}

            <form onSubmit={submit} className="auth-form" noValidate={false}>
              {mode === "signup" && (
                <label className="auth-field">
                  <span>الاسم</span>
                  <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="كيف نناديك؟" />
                </label>
              )}
              <label className="auth-field">
                <span>البريد الإلكتروني</span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" dir="ltr" placeholder="name@example.com" />
              </label>
              {mode !== "forgot" && (
                <label className="auth-field">
                  <span className="auth-field-row">
                    كلمة المرور
                    {mode === "signin" && (
                      <button type="button" className="auth-inline-link" onClick={() => switchMode("forgot")}>
                        نسيت كلمة المرور؟
                      </button>
                    )}
                  </span>
                  <span className="auth-password">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={mode === "signup" ? 8 : undefined}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      dir="ltr"
                      placeholder={mode === "signup" ? "8 أحرف على الأقل" : "••••••••"}
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} aria-pressed={showPassword} aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
                      {showPassword ? "إخفاء" : "إظهار"}
                    </button>
                  </span>
                </label>
              )}
              {error && <p className="auth-alert is-error" role="alert">{error}</p>}
              {message && <p className="auth-alert is-success" role="status">{message}</p>}
              <button className="auth-primary" disabled={busy !== ""}>
                {busy === "form"
                  ? "جارٍ التنفيذ…"
                  : mode === "signin"
                    ? "تسجيل الدخول"
                    : mode === "signup"
                      ? "إنشاء الحساب"
                      : "إرسال رابط الاستعادة"}
              </button>
            </form>

            {mode === "forgot" && (
              <button type="button" className="auth-link" onClick={() => switchMode("signin")}>
                العودة إلى تسجيل الدخول
              </button>
            )}
          </>
        )}

        <Link href="/" className="auth-explore">
          استكشف Noata دون حساب
        </Link>
      </section>
    </main>
  );
}
