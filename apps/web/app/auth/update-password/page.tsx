"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AuthJourney } from "@/components/auth/auth-journey";
import { createClient } from "@/lib/supabase/client";
import { localizeAuthError } from "@/lib/i18n/auth-errors";
import { RECOVERY_GRANT_KEY, validRecoveryGrant } from "@/lib/auth/flows";

type PageStatus = "checking" | "ready" | "invalid" | "unavailable";

export default function UpdatePasswordPage() {
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
    if (password.length < 8 || password.length > 128) {
      setError("استخدم كلمة مرور جديدة من ٨ إلى ١٢٨ حرفًا.");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    setBusy(true); setError("");
    try {
      const supabase = createClient();
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user ||
          !validRecoveryGrant(sessionStorage.getItem(RECOVERY_GRANT_KEY), data.user.id, Date.now())) {
        setStatus("invalid");
        setError("انتهت جلسة الاستعادة. اطلب رابطًا جديدًا.");
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError(localizeAuthError(updateError)); return; }
      sessionStorage.removeItem(RECOVERY_GRANT_KEY);
      setPassword(""); setConfirm("");
      window.location.replace("/auth/complete?type=password-updated");
    } catch {
      setError("تعذّر إكمال التحديث الآن. تأكد من الاتصال وحاول من جديد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthJourney eyebrow="الخطوة الأخيرة · أمان حسابك"
      title={status === "checking" ? "جارٍ التحقق من رابطك" : status === "ready" ? "أنشئ كلمة مرور جديدة" : status === "unavailable" ? "تعذّر الاتصال بالخدمة" : "رابط الاستعادة غير صالح"}
      description={status === "ready" ? "استخدم كلمة مرور قوية ومختلفة عن السابقة لحماية تقدّمك ومحادثاتك." :
        status === "checking" ? "نتحقق من صلاحية طلب الاستعادة قبل السماح بأي تغييرات." :
        status === "unavailable" ? "لم نتمكن من التحقق من الجلسة الآن. لا توجد أي تغييرات على كلمة المرور." :
        "يجب الوصول لهذه الصفحة من رابط الاستعادة المرسل إلى بريدك. قد يكون الرابط منتهيًا أو تم استخدامه سابقًا."}
      icon={status === "ready" ? "check" : "user"}>
      {status === "checking" ? <div className="auth-spinner" aria-label="جارٍ التحقق" /> :
       status !== "ready" ? (
         <>
           <div className="auth-journey-guidance">
             <strong>لماذا يحدث هذا؟</strong>
             <p>ربما فُتح الرابط في متصفح مختلف، أو انتهت صلاحيته، أو لم تبدأ طلب استعادة من بريدك.</p>
           </div>
           <Link className="auth-primary" href="/auth/forgot-password">اطلب رابط استعادة جديدًا</Link>
           {status === "unavailable" && <button type="button" className="auth-journey-subaction" onClick={() => window.location.reload()}>إعادة محاولة التحقق</button>}
         </>
       ) : (
         <>
           <div className="auth-journey-steps"><span>١ · البريد</span><span>٢ · التحقق</span><span className="is-active">٣ · كلمة جديدة</span></div>
           <form className="auth-form" onSubmit={submit}>
             <label className="auth-field">
               <span>كلمة المرور الجديدة</span>
               <span className="auth-password">
                 <input type={showPassword ? "text" : "password"} autoComplete="new-password" dir="ltr" minLength={8}
                   maxLength={128} placeholder="٨ أحرف على الأقل" required value={password} disabled={busy}
                   onChange={(event) => setPassword(event.target.value)} />
                 <button type="button" aria-pressed={showPassword} onClick={() => setShowPassword(x=>!x)}>
                   {showPassword ? "إخفاء" : "إظهار"}
                 </button>
               </span>
             </label>
             <label className="auth-field">
               <span>تأكيد كلمة المرور الجديدة</span>
               <input type={showPassword ? "text" : "password"} dir="ltr" autoComplete="new-password" minLength={8}
                 maxLength={128} placeholder="أعد كتابة كلمة المرور" required value={confirm} disabled={busy}
                 onChange={(event) => setConfirm(event.target.value)} />
             </label>
             <p className="auth-journey-note">اختر كلمة مرور مختلفة عن القديمة وتجنّب استخدام بيانات يسهل تخمينها.</p>
             {error && <p className="auth-alert is-error" role="alert">{error}</p>}
             <button type="submit" className="auth-primary" disabled={busy}>
               {busy ? "جارٍ تحديث كلمة المرور…" : "تأكيد كلمة المرور الجديدة"}
             </button>
           </form>
         </>
       )}
    </AuthJourney>
  );
}
