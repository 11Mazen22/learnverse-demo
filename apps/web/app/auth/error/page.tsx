"use client";
import { useTranslation, useLocale } from "@/lib/i18n/locale";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthJourney } from "@/components/auth/auth-journey";


function Content() {
  const t = useTranslation();
const explanations: Record<string, { title: string; body: string }> = {
  expired: { title: t("انتهت صلاحية الرابط","This link has expired"), body: t("روابط التأكيد والاستعادة مؤقتة، وقد يكون هذا الرابط مستخدمًا بالفعل. اطلب رسالة جديدة بدل تكرار الرابط القديم.","Confirmation and recovery links expire and can only be used once. Request a new email instead of reusing this link.") },
  invalid: { title: t("الرابط غير صالح","Invalid link"), body: t("هذا الرابط ناقص أو غير صحيح. افتح أحدث رسالة من Noata، أو ابدأ طلب استعادة جديدًا.","This link is incomplete or invalid. Open the latest email from Noata or start a new recovery request.") },
  same_browser: { title: t("أكمل من المتصفح الصحيح","Continue in the original browser"), body: t("لأمان حسابك، يجب فتح رابط التحقق من نفس المتصفح الذي أرسلت منه الطلب.","For your security, open the verification link in the browser where you requested it.") },
  cancelled: { title: t("لم تكتمل عملية الدخول","Sign-in was not completed"), body: t("أُلغيت عملية التحقق أو رفض مزود الحساب المتابعة. تقدر تعيد المحاولة بدون فقدان بياناتك.","Verification was cancelled or declined by your account provider. You can try again; your data remains saved.") },
  service: { title: t("تعذّر إكمال التحقق حاليًا","Verification is currently unavailable"), body: t("خدمة التحقق غير متاحة مؤقتًا. انتظر قليلًا، ثم اطلب رابطًا جديدًا لو احتجت.","The verification service is temporarily unavailable. Wait a moment, then request a new link if needed.") },
};
  const params = useSearchParams();
  const kind = params.get("reason") ?? "invalid";
  const copy = explanations[kind] ?? explanations.invalid;
  return (
    <AuthJourney eyebrow={t("مساعدة الحساب","Account help")} title={copy.title} description={copy.body} icon="help">
      <div className="auth-journey-guidance">
        <strong>{t("ماذا يمكنك أن تفعل الآن؟","What can you do next?")}</strong>
        <p>{t("لا تشارك رابط التحقق أو رمزه مع أحد. لو انتهت صلاحيته، ابدأ طلبًا جديدًا من صفحة Noata الرسمية.","Never share your verification link or code. If it expires, start a new request from the official Noata page.")}</p>
      </div>
      <Link className="auth-primary" href="/auth/forgot-password">{t("طلب رابط استعادة جديد","Request a new recovery link")}</Link>
      <Link className="auth-journey-subaction" href="/login">{t("العودة إلى تسجيل الدخول","Back to sign in")}</Link>
    </AuthJourney>
  );
}
export default function AuthErrorPage() {
  const t = useTranslation();
  return <Suspense fallback={<AuthJourney eyebrow={t("مساعدة الحساب","Account help")} title={t("جارٍ التحقق","Verifying…")} description={t("لحظة من فضلك…","Please wait…")} ><div className="auth-spinner"/></AuthJourney>}><Content/></Suspense>;
}
