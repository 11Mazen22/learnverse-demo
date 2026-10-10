"use client";
import Link from "next/link";
import {useMemo,useState} from "react";
import {Icon} from "@/components/ui/icon";

type Category="getting-started"|"learning"|"ai"|"account";
type Topic={id:string;category:Category;title:string;body:string;href:string;link:string};
const CATEGORIES:{id:"all"|Category;label:string}[]=[
 {id:"all",label:"كل المواضيع"},
 {id:"getting-started",label:"البداية"},
 {id:"learning",label:"التعلّم"},
 {id:"ai",label:"Noata AI"},
 {id:"account",label:"الحساب والخصوصية"},
];
const TOPICS:Topic[]=[
 {id:"first",category:"getting-started",title:"أبدأ في Noata منين؟",body:"ادخل رحلة التعلّم، اختار الوحدة المناسبة لمستواك، وابدأ الدرس. بعد الشرح جرّب مهمة قصيرة واستخدم المراجعة علشان تثبّت ما فهمته.",href:"/learn",link:"افتح رحلة التعلّم"},
 {id:"xp",category:"learning",title:"إيه الفرق بين XP والإتقان؟",body:"نقاط XP والمكافآت بتحتفل بالتفاعل والإنجاز. الإتقان بيتأثر بإجاباتك الفعلية المستقلة والمراجعات، مش بعدد العملات اللي جمعتها.",href:"/progress",link:"استكشف خريطة المهارات"},
 {id:"mission",category:"learning",title:"فين المهام والمراجعات؟",body:"افتح المهام للتحديات الجديدة، أو صفحة المراجعة للأسئلة المستحقة. الأسئلة بتتسجل بحسابك لما تكون مسجّل الدخول.",href:"/review",link:"اذهب إلى المراجعة"},
 {id:"assignments",category:"learning",title:"أشوف واجبات المدرسة إزاي؟",body:"الواجبات المنشورة لفصلك بتظهر في صفحة الواجبات حسب صلاحيات حسابك. لو مش شايف واجبًا متوقعًا، تواصل مع المعلم للتأكد إنه اتنشر للفصل الصحيح.",href:"/assignments",link:"شوف واجباتك"},
 {id:"ai",category:"ai",title:"إزاي أبدأ محادثة مع Noata AI؟",body:"اكتب سؤالًا في مساحة AI، أو استخدم ورشة المذاكرة للتحضير لاختبار أو ملخص. الوضع التلقائي بيختار نموذجًا مُهيأ حسب نوع الطلب، لكن التوفر الفعلي يعتمد على الخدمة.",href:"/ai",link:"افتح Noata AI"},
 {id:"attachments",category:"ai",title:"أنواع الملفات اللي يقدر AI يقرأها؟",body:"المستندات النصية TXT وMD وCSV وJSON وDOCX، وملفات PDF القابلة لاستخراج النص؛ لغاية أربعة مستندات مع صورة واحدة. الـ PDF الممسوح ضوئيًا قد يحتاج OCR غير متاح بعد. XLSX وPPTX الأصليان غير مدعومين حاليًا.",href:"/ai",link:"افتح مساحة الملفات"},
 {id:"sources",category:"ai",title:"هل ملفات PDF وWord الأصلية بتتحفظ؟",body:"حاليًا Noata بيستخلص النص داخل متصفحك ثم يحفظ مقتطفات مرتبطة بالرسالة علشان المتابعة. ملفات PDF وWord الأصلية لا يتم الاحتفاظ بها في التخزين الدائم، لذلك معاينة النص ليست نسخة من الملف الأصلي.",href:"/ai",link:"راجع مرفقاتك"},
 {id:"export",category:"ai",title:"أصدّر مستندًا من Noata إزاي؟",body:"تقدر تفتح الرد في مساحة الكتابة، تحرره، وتصدر ملف Word DOCX قابل للتعديل أو Markdown. الطباعة عبر المتصفح قد تسمح بالحفظ PDF، لكن توليد PDF أصلي احترافي داخل التطبيق غير متاح بعد.",href:"/ai",link:"افتح مساحة الكتابة"},
 {id:"quran",category:"learning",title:"هل آيات القرآن من إنشاء AI؟",body:"لا. قارئ القرآن يعرض نص الآيات من مصدر Quran Uthmani عبر AlQuran Cloud مع إظهار المصدر. تفسير Noata AI منفصل عن النص القرآني، ولا ينبغي معاملته كاقتباس موثّق دون مراجعة.",href:"/quran",link:"افتح قارئ القرآن"},
 {id:"preferences",category:"account",title:"إزاي أغيّر المظهر والنموذج؟",body:"افتح الإعدادات لتغيير المظهر الفاتح أو الداكن أو التلقائي، اللغة، الحركة، والنموذج الافتراضي. احفظ التغييرات علشان تنتقل مع حسابك.",href:"/settings",link:"إدارة إعدادات الحساب"},
 {id:"private",category:"account",title:"هل AI بيحتفظ بكل محادثاتي؟",body:"وضع المحادثة المحفوظة يحتفظ بالرسائل على حسابك ضمن سياسات الوصول. تقدر تستخدم محادثة مؤقتة، أو تدير محادثاتك من قائمة AI. إيقاف حفظ المحادثات الجديدة لا يمسح القديم تلقائيًا.",href:"/ai",link:"إدارة سجل AI"},
];
const STEPS=[
 {title:"الصفحة مش بتفتح",body:"جرّب تحديث الصفحة واتأكد من اتصال الإنترنت. لو المشكلة مستمرة راجع حالة تسجيل الدخول ومسار الصفحة بدل إعادة إرسال نفس الطلب."},
 {title:"Noata AI مش بيرد",body:"تأكد إنك مسجل الدخول، جرّب طلبًا نصيًا قصيرًا ونموذجًا متاحًا. لو ظهر خطأ، احتفظ برسالة الخطأ ووقت حدوثها من غير إرسال كلمات مرور أو مفاتيح API."},
 {title:"ملف مش بيتحلّل",body:"راجع نوع الملف وحجمه. PDF المصوّر قد لا يحتوي نصًا قابلًا للاستخراج؛ حاول نسخة نصية عند توفرها. لو الملف غير مدعوم هتظهر رسالة واضحة بدل إجابة متخيلة."},
];
export function HelpCenter(){
 const [query,setQuery]=useState("");
 const [category,setCategory]=useState<(typeof CATEGORIES)[number]["id"]>("all");
 const [open,setOpen]=useState<string[]>([]);
 const shown=useMemo(()=>TOPICS.filter(t=>{
  if(category!=="all"&&t.category!==category)return false;
  const haystack=(t.title+" "+t.body).toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
 }),[query,category]);
 return <div className="aura-help-page">
  <header className="aura-help-hero">
   <span className="eyebrow">مركز مساعدة Noata Aura</span>
   <h1>اللي محتاج تعرفه، في مكان واحد.</h1>
   <p>اعرف الخطوات الصحيحة، حدود الأدوات الحقيقية، وإيه تعمل لو حاجة وقفت معاك.</p>
   <label className="aura-help-search"><Icon name="search" size={19}/>
    <input type="search" value={query} onChange={e=>setQuery(e.target.value)}
     aria-label="ابحث في موضوعات المساعدة" placeholder="بتدور على شرح إيه؟" autoComplete="off"/>
    {query&&<button type="button" onClick={()=>setQuery("")} aria-label="مسح البحث"><Icon name="close" size={15}/></button>}
   </label>
  </header>
  <section className="aura-help-content" aria-labelledby="aura-help-heading">
   <div className="aura-help-heading">
    <div><span className="eyebrow">دليلك داخل Noata</span><h2 id="aura-help-heading">موضوعات المساعدة</h2></div>
    <span>{shown.length} موضوع</span>
   </div>
   <div className="aura-help-filters" role="group" aria-label="تصفية موضوعات المساعدة">
    {CATEGORIES.map(c=><button type="button" key={c.id} aria-pressed={category===c.id}
     onClick={()=>setCategory(c.id)}>{c.label}</button>)}
   </div>
   <div className="aura-help-topics">
    {shown.map(t=><article key={t.id} className="aura-help-topic">
     <button type="button" aria-expanded={open.includes(t.id)} aria-controls={"help-"+t.id}
      onClick={()=>setOpen(list=>list.includes(t.id)?list.filter(x=>x!==t.id):[...list,t.id])}>
      <Icon name={t.category==="ai"?"ai":t.category==="learning"?"book":t.category==="account"?"settings":"help"} size={19}/>
      <strong>{t.title}</strong>
      <Icon name="chevron" size={15}/>
     </button>
     {open.includes(t.id)&&<div className="aura-help-answer" id={"help-"+t.id}>
      <p>{t.body}</p><Link href={t.href}>{t.link} <Icon name="arrow" size={15}/></Link>
     </div>}
    </article>)}
    {!shown.length&&<div className="aura-help-empty">
      <Icon name="search" size={29}/><h3>ملقيناش موضوع بنفس البحث</h3>
      <p>جرّب كلمة مختلفة أو اختار «كل المواضيع».</p>
      <button type="button" onClick={()=>{setQuery("");setCategory("all");}}>إظهار كل المواضيع</button>
    </div>}
   </div>
  </section>
  <section className="aura-help-troubleshooting" aria-labelledby="aura-fix-title">
   <div className="aura-help-heading"><div><span className="eyebrow">حلول عملية</span><h2 id="aura-fix-title">لو حاجة مش شغّالة</h2></div></div>
   <div className="aura-help-steps">
    {STEPS.map((step,index)=><div key={index}><span>{index+1}</span><h3>{step.title}</h3><p>{step.body}</p></div>)}
   </div>
  </section>
 </div>;
}
