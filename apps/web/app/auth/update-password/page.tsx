"use client";
import { useTranslation, useLocale } from "@/lib/i18n/locale";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AuthJourney } from "@/components/auth/auth-journey";
import { createClient } from "@/lib/supabase/client";
import { localizeAuthError } from "@/lib/i18n/auth-errors";
import { RECOVERY_GRANT_KEY, validRecoveryGrant, AUTH_COMPLETION_KEY, authCompletionValue } from "@/lib/auth/flows";
import {newPasswordProblem,MIN_NEW_PASSWORD_LENGTH} from "@/lib/auth/password-policy";

type PageStatus = "checking" | "ready" | "invalid" | "unavailable";

export default function UpdatePasswordPage() {
  const t = useTranslation();
  const locale = useLocale();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<PageStatus>("checking");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    // Being logged in by itself must NOT imply a recovery flow.
    void createClient().auth.getUser().then(({ data, error: userError }) => {
      if (!active) return;
      if (userError || !data.user) { setStatus("invalid"); return; }
      try {
        const grant = sessionStorage.getItem(RECOVERY_GRANT_KEY);
        const valid = validRecoveryGrant(grant, data.user.id, Date.now());
        if (!valid) sessionStorage.removeItem(RECOVERY_GRANT_KEY);
        setStatus(valid ? "ready" : "invalid");
      } catch {
        setStatus("invalid");
      }
    }).catch(() => { if (active) setStatus("unavailable"); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || status !== "ready") return;
    const passwordError=newPasswordProblem(password, locale);
    if(passwordError){
      setError(passwordError);
      return;
    }
    if (password !== confirm) {
      setError(t("كلمتا المرور غير متطابقتين.","The passwords do not match."));
      return;
    }
    setBusy(true); setError("");
    try {
      const supabase = createClient();
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user ||
          !validRecoveryGrant(sessionStorage.getItem(RECOVERY_GRANT_KEY), data.user.id, Date.now())) {
        setStatus("invalid");
        setError(t("انتهت جلسة الاستعادة. اطلب رابطًا جديدًا.","Your recovery session has expired. Request a new link."));
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError(localizeAuthError(updateError, locale)); return; }
      sessionStorage.removeItem(RECOVERY_GRANT_KEY);
      sessionStorage.setItem(AUTH_COMPLETION_KEY, authCompletionValue("password-updated", data.user.id, Date.now()));
      setPassword(""); setConfirm("");
      window.location.replace("/auth/complete?type=password-updated");
    } catch {
      setError(t("تعذّر إكمال التحديث الآن. تأكد من الاتصال وحاول من جديد.","Could not complete the update. Check your connection and try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthJourney eyebrow={t("الخطوة الأخيرة · أمان حسابك","Final step · Account security")}
      title={status === "checking" ? t("جارٍ التحقق من رابطك","Checking your link") : status === "ready" ? t("أنشئ كلمة مرور جديدة","Create a new password") : status === "unavailable" ? t("تعذّر الاتصال بالخدمة","Could not reach the service") : t("رابط الاستعادة غير صالح","Invalid recovery link")}
      description={status === "ready" ? t("استخدم كلمة مرور قوية ومختلفة عن السابقة لحماية تقدّمك ومحادثاتك.","Use a strong password different from your previous one to protect your progress and conversations.") :
        status === "checking" ? t("نتحقق من صلاحية طلب الاستعادة قبل السماح بأي تغييرات.","Checking your recovery request before allowing changes.") :
        status === "unavailable" ? t("لم نتمكن من التحقق من الجلسة الآن. لا توجد أي تغييرات على كلمة المرور.","We could not verify your session. Your password has not changed.") :
        t("يجب الوصول لهذه الصفحة من رابط الاستعادة المرسل إلى بريدك. قد يكون الرابط منتهيًا أو تم استخدامه سابقًا.","Open this page using the recovery link in your email. The link may have expired or already been used.")}
      icon={status === "ready" ? "check" : "user"}>
      {status === "checking" ? <div className="auth-spinner" aria-label={t("جارٍ التحقق","Verifying…")} /> :
       status !== "ready" ? (
         <>
           <div className="auth-journey-guidance">
             <strong>{t("لماذا يحدث هذا؟","Why does this happen?")}</strong>
             <p>{t("ربما فُتح الرابط في متصفح مختلف، أو انتهت صلاحيته، أو لم تبدأ طلب استعادة من بريدك.","The link may have been opened in a different browser, expired, or opened without an email recovery request.")}</p>
           </div>
           <Link className="auth-primary" href="/auth/forgot-password">{t("اطلب رابط استعادة جديدًا","Request a new recovery link")}</Link>
           {status === "unavailable" && <button type="button" className="auth-journey-subaction" onClick={() => window.location.reload()}>{t("إعادة محاولة التحقق","Try verification again")}</button>}
         </>
       ) : (
         <>
           <div className="auth-journey-steps"><span>{t("١ · البريد","1 · Email")}</span><span>{t("٢ · التحقق","2 · Verification")}</span><span className="is-active">{t("٣ · كلمة جديدة","3 · New password")}</span></div>
           <form className="auth-form" onSubmit={submit}>
             <label className="auth-field">
               <span>{t("كلمة المرور الجديدة","New password")}</span>
               <span className="auth-password">
                 <input type={showPassword ? "text" : "password"} autoComplete="new-password" dir="ltr" minLength={MIN_NEW_PASSWORD_LENGTH}
                   maxLength={128} placeholder={t("١٢ حرفًا على الأقل","At least 12 characters")} required value={password} disabled={busy}
                   onChange={(event) => setPassword(event.target.value)} />
                 <button type="button" aria-pressed={showPassword} onClick={() => setShowPassword(x=>!x)}>
                   {showPassword ? t("إخفاء","Hide") : t("إظهار","Show")}
                 </button>
               </span>
             </label>
             <label className="auth-field">
               <span>{t("تأكيد كلمة المرور الجديدة","Confirm new password")}</span>
               <input type={showPassword ? "text" : "password"} dir="ltr" autoComplete="new-password" minLength={MIN_NEW_PASSWORD_LENGTH}
                 maxLength={128} placeholder={t("أعد كتابة كلمة المرور","Re-enter your password")} required value={confirm} disabled={busy}
                 onChange={(event) => setConfirm(event.target.value)} />
             </label>
             <p className="auth-journey-note">{t("اختر كلمة مرور مختلفة عن القديمة وتجنّب استخدام بيانات يسهل تخمينها.","Choose a different password and avoid information that is easy to guess.")}</p>
             {error && <p className="auth-alert is-error" role="alert">{error}</p>}
             <button type="submit" className="auth-primary" disabled={busy}>
               {busy ? t("جارٍ تحديث كلمة المرور…","Updating your password…") : t("تأكيد كلمة المرور الجديدة","Confirm new password")}
             </button>
           </form>
         </>
       )}
    </AuthJourney>
  );
}
