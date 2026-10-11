"use client";
import {useState} from "react";
import {useTranslation,useLocale} from "@/lib/i18n/locale";
import {Icon} from "@/components/ui/icon";
import {answerExportFormats,safeExportStem,type AnswerFormat} from "@/lib/ai/answer-export";
function saveBytes(data:Uint8Array,filename:string,mime:string){
 if(data.byteLength<50||data[0]!==80||data[1]!==75)throw Error("Invalid Office file");
 const url=URL.createObjectURL(new Blob([Uint8Array.from(data)],{type:mime}));
 const anchor=document.createElement("a");anchor.href=url;anchor.download=filename;
 document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
}
function saveText(text:string,name:string){
 const url=URL.createObjectURL(new Blob([text],{type:"text/markdown;charset=utf-8"}));
 const a=document.createElement("a");a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),15000);
}
export function NoataAnswerExports({text,title,ready}:{text:string;title?:string;ready:boolean}){
 const t=useTranslation(),locale=useLocale(),[busy,setBusy]=useState<AnswerFormat|null>(null),[status,setStatus]=useState("");
 const available=answerExportFormats(text),stem=safeExportStem(title||"noata-answer");
 async function exportAs(format:AnswerFormat){
  if(busy||!ready||!available.includes(format))return;
  setBusy(format);setStatus(t("بنجهّز الملف الحقيقي…","Preparing a real file…"));
  try{
   if(format==="markdown")saveText(text,stem+".md");
   else if(format==="pdf"){
    const response=await fetch("/api/documents/pdf",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json","Accept-Language":locale},
     body:JSON.stringify({text,title:title?.slice(0,120)||"Noata AI"})});
    if(!response.ok)throw Error(response.status===401?"AUTH":response.status===429?"RATE":"SERVICE");
    const blob=await response.blob(),magic=await blob.slice(0,5).text();
    if(!blob.type.includes("application/pdf")||magic!=="%PDF-"||blob.size<250)throw Error("INVALID");
    const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=stem+".pdf";
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
   }else if(format==="docx"){
    const {createNoataDocx}=await import("@/lib/ai/docx-export");
    saveBytes(createNoataDocx(text),stem+".docx","application/vnd.openxmlformats-officedocument.wordprocessingml.document");
   }else if(format==="xlsx"){
    const {createNoataXlsx}=await import("@/lib/ai/xlsx-export");
    saveBytes(createNoataXlsx(text),stem+".xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
   }else{
    const {createNoataPptx}=await import("@/lib/ai/pptx-export");
    saveBytes(createNoataPptx(text),stem+".pptx","application/vnd.openxmlformats-officedocument.presentationml.presentation");
   }
   setStatus(t("الملف جاهز للتنزيل. راجع محتواه قبل مشاركته.","Download started. Review the document before sharing."));
  }catch(error){
   const reason=error instanceof Error?error.message:"";
   setStatus(reason==="AUTH"?t("يجب تسجيل الدخول لإنشاء PDF.","Sign in to generate a PDF."):
    reason==="RATE"?t("وصلت لحد تصدير PDF. انتظر قليلًا.","PDF quota reached. Please try later."):
    t("تعذّر إنشاء هذا الملف، ولم يتم تجهيز تنزيل ناجح.","This file could not be generated; no successful download was prepared."));
  }finally{setBusy(null);}
 }
 if(!ready||!available.length)return null;
 return <div className="noata-answer-artifacts">
  <div className="noata-artifact-main">
   {available.includes("pdf")&&<button type="button" onClick={()=>void exportAs("pdf")} disabled={Boolean(busy)} aria-label={t("أنشئ PDF حقيقيًا لهذا الرد","Generate a real PDF from this answer")}>
    <Icon name="download" size={15}/><span>{busy==="pdf"?t("جارٍ الإنشاء…","Creating…"):t("تنزيل PDF","Download PDF")}</span>
   </button>}
   <details className="noata-export-more"><summary>{t("صيغ أخرى","More formats")} <span aria-hidden="true">⌄</span></summary>
    <div className="noata-export-format-menu">
     {available.filter(x=>x!=="pdf").map(format=><button type="button" key={format} disabled={Boolean(busy)} onClick={()=>void exportAs(format)}>
      {format.toUpperCase()}<span>{format==="xlsx"?t("من الجدول","From table"):format==="pptx"?t("من العناوين","From headings"):""}</span>
     </button>)}
    </div>
   </details>
  </div>
  {status&&<p className="noata-artifact-status" role="status">{status}</p>}
 </div>;
}
