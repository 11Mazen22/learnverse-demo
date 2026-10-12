"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import {useState} from "react";
import {OriginalDocumentPreview} from "./original-document-preview";
import {Dialog} from "@/components/ui/dialog";
import {Icon} from "@/components/ui/icon";

type Source={localId?:string;documentId?:string;expiresAt?:string;name:string;format:"text"|"docx"|"pdf"|"xlsx";excerpt:string;truncated:boolean};
/** Files are read-only extracted source excerpts; original files are not retained. */
export function DocumentSourcesMessage({sources}:{sources:unknown}){
 const t=useTranslation(),locale=useLocale();
  const [active,setActive]=useState<number|null>(null);
  const [tab,setTab]=useState<"original"|"context">("original");
  const items:Source[]=Array.isArray(sources)
    ? sources.slice(0,4).filter((value):value is Source=>
        !!value&&typeof value==="object" &&
        typeof value.name==="string" &&
        typeof value.excerpt==="string" &&
        (value.format==="text"||value.format==="docx"||value.format==="pdf"||value.format==="xlsx") &&
        typeof value.truncated==="boolean")
    : [];
  if(!items.length)return null;
  const selected=active===null?null:items[active];
  return <>
    <div className="aura-source-files" aria-label={t("ملفات استخدمتها المحادثة","Files used in this conversation")}>
      {items.map((item,index)=>(
        <button type="button" key={index} onClick={()=>{setActive(index);setTab("original");}}
          aria-label={t("معاينة مصدر ","Preview source ")+item.name}>
          <Icon name="book" size={17}/>
          <span><strong>{item.name}</strong><small>{t("محتوى مستخلص · مصدر","Extracted content · Source")}{index+1}</small></span>
          <Icon name="arrow" size={14}/>
        </button>
      ))}
    </div>
    <Dialog open={selected!==null} onClose={()=>setActive(null)} title={selected?.name??t("معاينة المصدر","Source preview")}>
      {selected&&<div className="aura-source-preview">
        <div className="aura-studio-tabs"><button type="button" aria-pressed={tab==="original"} onClick={()=>setTab("original")}>{t("المستند الأصلي","Original document")}</button><button type="button" aria-pressed={tab==="context"} onClick={()=>setTab("context")}>{t("السياق المرسل للذكاء الاصطناعي","Context sent to AI")}</button></div>
        {tab==="original"?<OriginalDocumentPreview key={selected.localId??selected.documentId??selected.name} source={selected}/>:<>
        <p>{t("محتوى مستخلص من ملف","Content extracted from a")}{selected.format==="docx"?"Word":selected.format==="pdf"?"PDF":selected.format==="xlsx"?"Excel":t("نصي","text file")}{t(". محفوظ في سياق هذه المحادثة، راجع تبويب المستند الأصلي للعرض والتنزيل عندما يكون متاحًا.",". Saved in this conversation’s context. Open the Original document tab to view or download it when available.")}</p>
        {selected.truncated&&<p role="status">{t("المستند طويل؛ تم اختيار مقاطع ضمن حدود السياق، وقد لا تغطي كل معلومات الملف. لا تُعامل المعاينة كمحتوى الملف الكامل.","This document is long. Selected excerpts may not cover every part of the file. This preview is not the complete document.")}</p>}
        <pre dir="auto">{selected.excerpt}</pre>
        <small>{t("إذا طلبت من Noata الاستشهاد بمصدر، راجع الإجابة مقابل النص المستخلص الظاهر هنا.","Check source citations in Noata’s answer against the extracted text shown here.")}</small></>}
      </div>}
    </Dialog>
  </>;
}
