"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import Link from "next/link";
import {useMemo,useState} from "react";
import {Icon} from "@/components/ui/icon";

type Category="getting-started"|"learning"|"ai"|"account";
type Topic={id:string;category:Category;title:string;body:string;href:string;link:string};
export function HelpCenter(){
 const t=useTranslation(),locale=useLocale();
const CATEGORIES:{id:"all"|Category;label:string}[]=[
 {id:"all",label:t("كل المواضيع","All topics")},
 {id:"getting-started",label:t("البداية","Getting started")},
 {id:"learning",label:t("التعلّم","Learning")},
 {id:"ai",label:"Noata AI"},
 {id:"account",label:t("الحساب والخصوصية","Account and privacy")},
];
const TOPICS:Topic[]=[
 {id:"first",category:"getting-started",title:t("أبدأ في Noata منين؟","Where should I start?"),body:t("ادخل رحلة التعلّم، اختار الوحدة المناسبة لمستواك، وابدأ الدرس. بعد الشرح جرّب مهمة قصيرة واستخدم المراجعة علشان تثبّت ما فهمته.","Open your learning journey, choose a unit, and start a lesson. Then try a mission and review what you learned."),href:"/learn",link:t("افتح رحلة التعلّم","Open your learning journey")},
 {id:"xp",category:"learning",title:t("إيه الفرق بين XP والإتقان؟","How does XP differ from mastery?"),body:t("نقاط XP والمكافآت بتحتفل بالتفاعل والإنجاز. الإتقان بيتأثر بإجاباتك الفعلية المستقلة والمراجعات، مش بعدد العملات اللي جمعتها.","XP and rewards celebrate participation and achievement. Mastery follows your independent answers and reviews."),href:"/progress",link:t("استكشف خريطة المهارات","Explore your skills")},
 {id:"mission",category:"learning",title:t("فين المهام والمراجعات؟","Where are missions and reviews?"),body:t("افتح المهام للتحديات الجديدة، أو صفحة المراجعة للأسئلة المستحقة. الأسئلة بتتسجل بحسابك لما تكون مسجّل الدخول.","Open Missions for new challenges or Review for questions due for practice. Sign in to save your progress."),href:"/review",link:t("اذهب إلى المراجعة","Open review")},
 {id:"assignments",category:"learning",title:t("أشوف واجبات المدرسة إزاي؟","How do I view class assignments?"),body:t("الواجبات المنشورة لفصلك بتظهر في صفحة الواجبات حسب صلاحيات حسابك. لو مش شايف واجبًا متوقعًا، تواصل مع المعلم للتأكد إنه اتنشر للفصل الصحيح.","Published assignments for your classes appear on the Assignments page. Ask your teacher if an expected assignment is missing."),href:"/assignments",link:t("شوف واجباتك","View assignments")},
 {id:"ai",category:"ai",title:t("إزاي أبدأ محادثة مع Noata AI؟","How do I start a conversation with Noata AI?"),body:t("اكتب سؤالًا في مساحة AI، أو استخدم ورشة المذاكرة للتحضير لاختبار أو ملخص. الوضع التلقائي بيختار نموذجًا مُهيأ حسب نوع الطلب، لكن التوفر الفعلي يعتمد على الخدمة.","Enter a question in Noata AI or use the study workshop. Auto selects a configured model based on the request. Availability depends on the provider."),href:"/ai",link:t("افتح Noata AI","Open Noata AI")},
 {id:"attachments",category:"ai",title:t("أنواع الملفات اللي يقدر AI يقرأها؟","Which files can AI read?"),body:t("المستندات النصية TXT وMD وCSV وJSON وDOCX، وملفات PDF القابلة لاستخراج النص؛ لغاية أربعة مستندات مع صورة واحدة. الـ PDF الممسوح ضوئيًا قد يحتاج OCR غير متاح بعد. XLSX وPPTX الأصليان غير مدعومين حاليًا.","Attach up to four TXT, Markdown, CSV, JSON, DOCX, or text-based PDF documents with one image. Scanned PDFs may need OCR, which is unavailable. XLSX and PPTX are not currently supported."),href:"/ai",link:t("افتح مساحة الملفات","Open the file workspace")},
 {id:"sources",category:"ai",title:t("هل ملفات PDF وWord الأصلية بتتحفظ؟","Are original PDF and Word files retained?"),body:t("يستخلص Noata النص داخل متصفحك ويحفظ مقتطفات مرتبطة بالرسالة. يمكن حفظ الملفات الأصلية المدعومة في التخزين الخاص للمحادثات المحفوظة عند إتاحته. في المحادثات المؤقتة تبقى الأصول خلال جلسة الرفع فقط. المعاينة المستخلصة ليست الملف الكامل.","Noata extracts text in your browser and links source excerpts to the message. Saved conversations can retain supported originals in private storage when available. Temporary conversations keep originals only for the upload session. An excerpt preview is not the full document."),href:"/ai",link:t("راجع مرفقاتك","Review attachments")},
 {id:"export",category:"ai",title:t("أصدّر مستندًا من Noata إزاي؟","How do I export a document?"),body:t("افتح الرد في مساحة الكتابة وحرره ثم نزّل PDF أو Word DOCX قابلًا للتعديل أو Markdown. يدعم PDF النصي النصوص والجداول البسيطة ويعرض المعادلات كنص.","Open an answer in Writing Studio, edit it, and download PDF, editable Word DOCX, or Markdown. Text PDF supports basic text and tables; complex equations use plain text."),href:"/ai",link:t("افتح مساحة الكتابة","Open Writing Studio")},
 {id:"quran",category:"learning",title:t("هل آيات القرآن من إنشاء AI؟","Does AI generate Quran verses?"),body:t("لا. قارئ القرآن يعرض نص الآيات من مصدر Quran Uthmani عبر AlQuran Cloud مع إظهار المصدر. تفسير Noata AI منفصل عن النص القرآني، ولا ينبغي معاملته كاقتباس موثّق دون مراجعة.","No. The reader uses Quran Uthmani text from AlQuran Cloud and identifies its source. AI explanations are separate and require source verification."),href:"/quran",link:t("افتح قارئ القرآن","Open the Quran reader")},
 {id:"preferences",category:"account",title:t("إزاي أغيّر المظهر والنموذج؟","How do I change appearance and the model?"),body:t("افتح الإعدادات لتغيير المظهر الفاتح أو الداكن أو التلقائي، اللغة، الحركة، والنموذج الافتراضي. احفظ التغييرات علشان تنتقل مع حسابك.","Open Settings to change light, dark, or system appearance, language, motion, and the default model. Save to keep account preferences."),href:"/settings",link:t("إدارة إعدادات الحساب","Manage settings")},
 {id:"private",category:"account",title:t("هل AI بيحتفظ بكل محادثاتي؟","Does AI save all my conversations?"),body:t("وضع المحادثة المحفوظة يحتفظ بالرسائل على حسابك ضمن سياسات الوصول. تقدر تستخدم محادثة مؤقتة، أو تدير محادثاتك من قائمة AI. إيقاف حفظ المحادثات الجديدة لا يمسح القديم تلقائيًا.","Saved conversations remain in your account under its access rules. Use a temporary conversation or manage history from Noata AI. Turning off saving does not automatically delete older conversations."),href:"/ai",link:t("إدارة سجل AI","Manage AI history")},
];
const STEPS=[
 {title:t("الصفحة مش بتفتح","A page will not open"),body:t("جرّب تحديث الصفحة واتأكد من اتصال الإنترنت. لو المشكلة مستمرة راجع حالة تسجيل الدخول ومسار الصفحة بدل إعادة إرسال نفس الطلب.","Refresh the page and check your connection. If it still fails, check your sign-in status and the page address.")},
 {title:t("Noata AI مش بيرد","Noata AI is not responding"),body:t("تأكد إنك مسجل الدخول، جرّب طلبًا نصيًا قصيرًا ونموذجًا متاحًا. لو ظهر خطأ، احتفظ برسالة الخطأ ووقت حدوثها من غير إرسال كلمات مرور أو مفاتيح API.","Check that you are signed in and try a short request with an available model. Keep the error message and time, without sharing passwords or API keys.")},
 {title:t("ملف مش بيتحلّل","A file cannot be analyzed"),body:t("راجع نوع الملف وحجمه. PDF المصوّر قد لا يحتوي نصًا قابلًا للاستخراج؛ حاول نسخة نصية عند توفرها. لو الملف غير مدعوم هتظهر رسالة واضحة بدل إجابة متخيلة.","Check the file type and size. A scanned PDF may have no extractable text; use a text version when available. Unsupported files show an error.")},
];

 const [query,setQuery]=useState("");
 const [category,setCategory]=useState<(typeof CATEGORIES)[number]["id"]>("all");
 const [open,setOpen]=useState<string[]>([]);
 const shown=useMemo(()=>TOPICS.filter(t=>{
  if(category!=="all"&&t.category!==category)return false;
  const haystack=(t.title+" "+t.body).toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
 }),[query,category,locale]);
 return <div className="aura-help-page">
  <header className="aura-help-hero">
   <span className="eyebrow">{t("مركز مساعدة Noata Aura","Noata Aura help center")}</span>
   <h1>{t("اللي محتاج تعرفه، في مكان واحد.","What you need to know, in one place.")}</h1>
   <p>{t("اعرف الخطوات الصحيحة، حدود الأدوات الحقيقية، وإيه تعمل لو حاجة وقفت معاك.","Find guidance, tool capabilities, and practical steps when something goes wrong.")}</p>
   <label className="aura-help-search"><Icon name="search" size={19}/>
    <input type="search" value={query} onChange={e=>setQuery(e.target.value)}
     aria-label={t("ابحث في موضوعات المساعدة","Search help topics")} placeholder={t("بتدور على شرح إيه؟","What do you need help with?")} autoComplete="off"/>
    {query&&<button type="button" onClick={()=>setQuery("")} aria-label={t("مسح البحث","Clear search")}><Icon name="close" size={15}/></button>}
   </label>
  </header>
  <section className="aura-help-content" aria-labelledby="aura-help-heading">
   <div className="aura-help-heading">
    <div><span className="eyebrow">{t("دليلك داخل Noata","Your guide to Noata")}</span><h2 id="aura-help-heading">{t("موضوعات المساعدة","Help topics")}</h2></div>
    <span>{shown.length}{t("موضوع","topics")}</span>
   </div>
   <div className="aura-help-filters" role="group" aria-label={t("تصفية موضوعات المساعدة","Filter help topics")}>
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
      <Icon name="search" size={29}/><h3>{t("ملقيناش موضوع بنفس البحث","No matching topics")}</h3>
      <p>{t("جرّب كلمة مختلفة أو اختار «كل المواضيع».","Try a different word or select All topics.")}</p>
      <button type="button" onClick={()=>{setQuery("");setCategory("all");}}>{t("إظهار كل المواضيع","Show all topics")}</button>
    </div>}
   </div>
  </section>
  <section className="aura-help-troubleshooting" aria-labelledby="aura-fix-title">
   <div className="aura-help-heading"><div><span className="eyebrow">{t("حلول عملية","Practical solutions")}</span><h2 id="aura-fix-title">{t("لو حاجة مش شغّالة","When something is not working")}</h2></div></div>
   <div className="aura-help-steps">
    {STEPS.map((step,index)=><div key={index}><span>{index+1}</span><h3>{step.title}</h3><p>{step.body}</p></div>)}
   </div>
  </section>
 </div>;
}
