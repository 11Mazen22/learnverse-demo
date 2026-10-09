"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthJourney } from "@/components/auth/auth-journey";

const explanations: Record<string, { title: string; body: string }> = {
  expired: { title: "انتهت صلاحية الرابط", body: "روابط التأكيد والاستعادة مؤقتة، وقد يكون هذا الرابط مستخدمًا بالفعل. اطلب رسالة جديدة بدل تكرار الرابط القديم." },
  invalid: { title: "الرابط غير صالح", body: "هذا الرابط ناقص أو غير صحيح. افتح أحدث رسالة من Noata، أو ابدأ طلب استعادة جديدًا." },
  same_browser: { title: "أكمل من المتصفح الصحيح", body: "لأمان حسابك، يجب فتح رابط التحقق من نفس المتصفح الذي أرسلت منه الطلب." },
  cancelled: { title: "لم تكتمل عملية الدخول", body: "أُلغيت عملية التحقق أو رفض مزود الحساب المتابعة. تقدر تعيد المحاولة بدون فقدان بياناتك." },
  service: { title: "تعذّر إكمال التحقق حاليًا", body: "خدمة التحقق غير متاحة مؤقتًا. انتظر قليلًا، ثم اطلب رابطًا جديدًا لو احتجت." },
};
function Content() {
  const params = useSearchParams();
  const kind = params.get("reason") ?? "invalid";
  const copy = explanations[kind] ?? explanations.invalid;
  return (
    <AuthJourney eyebrow="مساعدة الحساب" title={copy.title} description={copy.body} icon="help">
      <div className="auth-journey-guidance">
        <strong>ماذا يمكنك أن تفعل الآن؟</strong>
        <p>لا تشارك رابط التحقق أو رمزه مع أحد. لو انتهت صلاحيته، ابدأ طلبًا جديدًا من صفحة Noata الرسمية.</p>
      </div>
      <Link className="auth-primary" href="/auth/forgot-password">طلب رابط استعادة جديد</Link>
      <Link className="auth-journey-subaction" href="/login">العودة إلى تسجيل الدخول</Link>
    </AuthJourney>
  );
}
export default function AuthErrorPage() {
  return <Suspense fallback={<AuthJourney eyebrow="مساعدة الحساب" title="جارٍ التحقق" description="لحظة من فضلك…" ><div className="auth-spinner"/></AuthJourney>}><Content/></Suspense>;
}
