"use client";
import {useEffect,useMemo,useState} from "react";
import {useTranslation,useLocale} from "@/lib/i18n/locale";
import {createClient} from "@/lib/supabase/client";
import {AI_FUNCTION} from "@/lib/ai/workspace";
import type {CapabilityAvailability,CapabilityId,CapabilityStatus} from "../../../../supabase/functions/noata-ai/capabilities.ts";
const names:Partial<Record<CapabilityId,{en:string;ar:string}>>={
 chat:{en:"Conversation",ar:"المحادثات"}, "research.search":{en:"Web research",ar:"بحث الويب"},
 "text.translate":{en:"Translation",ar:"الترجمة"}, "image.generate":{en:"Image generation",ar:"توليد الصور"},
 "voice.transcribe":{en:"Speech to text",ar:"تحويل الصوت لنص"}, "voice.speak":{en:"Text to speech",ar:"تحويل النص لصوت"},
 "document.pdf":{en:"PDF export",ar:"تصدير PDF"}, "document.docx":{en:"Word export",ar:"تصدير Word"},
 "memory.recall":{en:"Approved memory",ar:"الذاكرة بموافقتك"}, "artifact.xlsx":{en:"Excel export",ar:"تصدير Excel"},
 "artifact.pptx":{en:"PowerPoint export",ar:"تصدير PowerPoint"},"projects.manage":{en:"Projects and files",ar:"المشروعات والملفات"}
};
const statusCopy:Record<CapabilityStatus,{en:string;ar:string}>={
 configured:{en:"Provider configured",ar:"الخدمة مهيّأة"},
 unavailable:{en:"Unavailable",ar:"غير متاح"},
 planned:{en:"Not implemented",ar:"غير منفّذ"},
 local:{en:"Built-in tool",ar:"أداة مدمجة"}
};
export function NoataCapabilityCenter({open,owner}:{open:boolean;owner:string|null}){
 const t=useTranslation(),locale=useLocale(),supabase=useMemo(()=>createClient(),[]);
 const [list,setList]=useState<CapabilityAvailability[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState("");
 const [reload,setReload]=useState(0);
 useEffect(()=>{
  let live=true;setList([]);setError("");
  if(!open||!owner)return;
  setLoading(true);
  void (async()=>{
   try{
    const {data,error}=await supabase.functions.invoke(AI_FUNCTION,{body:{action:"capabilities"}});
    if(error||!data||!Array.isArray(data.capabilities))throw Error("Capability service unavailable");
    const safe=data.capabilities.filter((x:unknown):x is CapabilityAvailability=>{
      if(!x||typeof x!=="object")return false;
      const row=x as Record<string,unknown>;
      return typeof row.id==="string"&&Object.hasOwn(names,row.id)&&
       (row.status==="configured"||row.status==="unavailable"||row.status==="planned"||row.status==="local");
    });
    if(live)setList(safe);
   }catch{if(live)setError(t("تعذر التحقق من القدرات الآن. لم يتم إثبات أي خدمة.","Capability status could not be checked. No provider is claimed available."));}
   finally{if(live)setLoading(false);}
  })();
  return()=>{live=false;};
 },[open,owner,locale,reload,supabase]);
 return <section className="noata-capability-center">
  <h3>{t("مركز قدرات Noata AI","Noata AI capability center")}</h3>
  <p>{t("فرق مهم: إعداد مفتاح الخدمة لا يعني نجاح طلب مباشر. «أداة مدمجة» تعني وجود التنفيذ، وليس إثبات كل سيناريو.","Important: a configured provider is not a verified successful request. Built-in means code exists, not that every scenario passed.")}</p>
  <div className="noata-capability-heading"><strong>{t("الحالة التقنية الحالية","Current technical status")}</strong>
   <button type="button" disabled={!owner||loading} onClick={()=>setReload(x=>x+1)}>{t("إعادة التحقق","Refresh")}</button>
  </div>
  {!owner?<p role="status">{t("سجّل الدخول لقراءة الحالة.","Sign in to read status.")}</p>:loading?<p role="status">{t("جارٍ التحقق…","Checking capabilities…")}</p>:
   error?<p role="alert">{error}</p>:<ul className="noata-capability-list">{list.map(item=><li key={item.id}>
    <span>{locale==="ar"?names[item.id]?.ar:names[item.id]?.en}</span>
    <span className={"noata-capability-badge status-"+item.status}>{locale==="ar"?statusCopy[item.status].ar:statusCopy[item.status].en}</span>
   </li>)}</ul>}
  <p className="noata-capability-footer">{t("الخصوصية: الأدوات الخارجية تخضع لمفاتيح الخدمة والحصص والأذونات. لا يتم تشغيلها بمجرد عرض هذه القائمة.","Privacy: external tools depend on provider keys, quotas and authorization. Viewing this list does not execute them.")}</p>
 </section>;
}
