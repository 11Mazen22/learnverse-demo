"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthJourney } from "@/components/auth/auth-journey";
import { createClient } from "@/lib/supabase/client";

function Content() {
  const params = useSearchParams();
  const isReset = params.get("type") === "password-updated";
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    let active = true;
    void createClient().auth.getUser().then(({data,error})=>{
      if (active) setStatus(!error && data.user ? "ready" : "error");
    }).catch(()=>{if(active)setStatus("error")});
    return ()=>{active=false};
  }, []);
  return (
    <AuthJourney eyebrow={isReset ? "أمان الحساب" : "حسابك جاهز"}
      title={status === "loading" ? "جارٍ تأكيد حسابك…" : status === "error" ? "تعذّر تأكيد جلستك" : isReset ? "تم تحديث كلمة مرورك" : "تم تأكيد بريدك بنجاح"}
      description={status === "loading" ? "نتحقق من الجلسة قبل استكمال رحلتك." : status === "error"
        ? "قد تكون جلسة التحقق انتهت. سجّل الدخول أو اطلب رابطًا جديدًا."
        : isReset ? "كلمة المرور الجديدة اتسجلت بنجاح. تقدر تكمل رحلتك التعليمية بأمان."
        : "أهلًا بك في Noata! حسابك اتفعل وبقيت جاهز تبدأ التعلّم."}>
      {status === "loading" ? <span className="auth-spinner" aria-label="جارٍ التحقق" /> : (
        <>
          {status === "ready" && <div className="auth-journey-success" aria-hidden="true">✓</div>}
          <Link className="auth-primary" href={status === "ready" ? "/" : "/login"}>{status === "ready" ? "الذهاب إلى مساحتي التعليمية" : "تسجيل الدخول"}</Link>
          {status === "error" && <Link href="/auth/forgot-password" className="auth-journey-subaction">طلب رابط جديد</Link>}
        </>
      )}
    </AuthJourney>
  );
}
export default function AuthCompletePage() {
  return <Suspense fallback={<AuthJourney eyebrow="تأكيد الحساب" title="جارٍ التحقق…" description="لحظة من فضلك…"><span className="auth-spinner"/></AuthJourney>}><Content/></Suspense>;
}
