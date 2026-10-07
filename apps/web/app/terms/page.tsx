import {AppShell} from "@/components/app-shell";

export const metadata={title:"Terms"};

export default function TermsPage(){
  return <AppShell active="">
    <article className="panel" style={{maxWidth:900,margin:"0 auto",padding:"clamp(24px,5vw,48px)",lineHeight:1.9}}>
      <div className="eyebrow" style={{color:"#2f7cff"}}>TERMS</div>
      <h1>شروط استخدام Noata</h1>
      <p>باستخدام Noata، أنت توافق على استخدام المنصة بصورة تعليمية وآمنة وعدم محاولة تجاوز صلاحيات الحساب أو الوصول إلى بيانات مستخدمين آخرين أو مفاتيح إجابات غير مصرح لك بها.</p>
      <h2>المحتوى التعليمي</h2>
      <p>أي محتوى يحمل وسم Demo أو Illustrative هو محتوى تجريبي لا يُقدّم على أنه منهج رسمي. المحتوى الإنتاجي يجب أن يمر بمراحل المراجعة والموافقة والنشر داخل Content Studio.</p>
      <h2>Noata AI</h2>
      <p>مخرجات الذكاء الاصطناعي قد تحتوي على أخطاء. المنصة تحاول تنظيمها وتنظيف علامات التحكم الداخلية وتطبيق سياسات تعليمية، لكنها لا تضمن الدقة المطلقة.</p>
      <h2>الحسابات والصلاحيات</h2>
      <p>الحساب الجديد يبدأ بصلاحية Student. صلاحيات Teacher وAdmin تمنحها الإدارة فقط. محاولة التحايل على الصلاحيات أو إساءة استخدام API قد تؤدي إلى تقييد الحساب.</p>
      <h2>XP وCoins وRewards</h2>
      <p>هذه عناصر داخلية للمنصة وليست أموالًا حقيقية ولا تمثل قيمة مالية خارج Noata. Mastery مستقل عن الاقتصاد والمكافآت.</p>
      <h2>التغييرات</h2>
      <p>قد تتطور الميزات والسياسات مع تطور Noata. سيتم تحديث هذه الصفحة عند حدوث تغييرات جوهرية.</p>
      <small style={{color:"var(--muted)"}}>Last updated: 7 October 2026</small>
    </article>
  </AppShell>;
}
