"use client";
import { useTranslation, useLocale } from "@/lib/i18n/locale";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthJourney } from "@/components/auth/auth-journey";
import { createClient } from "@/lib/supabase/client";
import { AUTH_COMPLETION_KEY, validAuthCompletion } from "@/lib/auth/flows";

function Content() {
  const t = useTranslation();
  const params = useSearchParams();
  const isReset = params.get("type") === "password-updated";
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    let active = true;
    void createClient().auth.getUser().then(({data,error})=>{
      if (!active) return;
      if (error || !data.user) { setStatus("error"); return; }
      try {
        const marker = sessionStorage.getItem(AUTH_COMPLETION_KEY);
        const type = isReset ? "password-updated" : "verified";
        setStatus(validAuthCompletion(marker,type,data.user.id,Date.now()) ? "ready" : "error");
      } catch {
        setStatus("error");
      }
    }).catch(()=>{if(active)setStatus("error")});
    return ()=>{active=false};
  }, [isReset]);
  return (
    <AuthJourney eyebrow={isReset ? t("أمان الحساب","Account security") : t("حسابك جاهز","Your account is ready")}
      title={status === "loading" ? t("جارٍ تأكيد حسابك…","Confirming your account…") : status === "error" ? t("تعذّر تأكيد جلستك","Could not confirm your session") : isReset ? t("تم تحديث كلمة مرورك","Your password has been updated") : t("تم تأكيد بريدك بنجاح","Your email has been confirmed")}
      description={status === "loading" ? t("نتحقق من الجلسة قبل استكمال رحلتك.","Checking your session before you continue.") : status === "error"
        ? t("لم نتمكن من تأكيد إتمام العملية من هذه الصفحة. افتح رابط التأكيد الجديد أو سجّل الدخول.","We could not confirm completion from this page. Open a new confirmation link or sign in.")
        : isReset ? t("كلمة المرور الجديدة اتسجلت بنجاح. تقدر تكمل رحلتك التعليمية بأمان.","Your new password was saved. You can safely continue your learning journey.")
        : t("أهلًا بك في Noata! حسابك اتفعل وبقيت جاهز تبدأ التعلّم.","Welcome to Noata! Your account is active and ready for learning.")}>
      {status === "loading" ? <span className="auth-spinner" aria-label={t("جارٍ التحقق","Verifying…")} /> : (
        <>
          {status === "ready" && <div className="auth-journey-success" aria-hidden="true">✓</div>}
          <Link className="auth-primary" href={status === "ready" ? "/" : "/login"}>{status === "ready" ? t("الذهاب إلى مساحتي التعليمية","Go to my learning space") : t("تسجيل الدخول","Sign in")}</Link>
          {status === "error" && <Link href="/auth/forgot-password" className="auth-journey-subaction">{t("طلب رابط جديد","Request a new link")}</Link>}
        </>
      )}
    </AuthJourney>
  );
}
export default function AuthCompletePage() {
  const t = useTranslation();
  return <Suspense fallback={<AuthJourney eyebrow={t("تأكيد الحساب","Account confirmation")} title={t("جارٍ التحقق…","Verifying…")} description={t("لحظة من فضلك…","Please wait…")}><span className="auth-spinner"/></AuthJourney>}><Content/></Suspense>;
}
