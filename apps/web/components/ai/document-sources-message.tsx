"use client";
import {useState} from "react";
import {OriginalDocumentPreview} from "./original-document-preview";
import {Dialog} from "@/components/ui/dialog";
import {Icon} from "@/components/ui/icon";

type Source={localId?:string;documentId?:string;expiresAt?:string;name:string;format:"text"|"docx"|"pdf";excerpt:string;truncated:boolean};
/** Files are read-only extracted source excerpts; original files are not retained. */
export function DocumentSourcesMessage({sources}:{sources:unknown}){
  const [active,setActive]=useState<number|null>(null);
  const [tab,setTab]=useState<"original"|"context">("original");
  const items:Source[]=Array.isArray(sources)
    ? sources.slice(0,4).filter((value):value is Source=>
        !!value&&typeof value==="object" &&
        typeof value.name==="string" &&
        typeof value.excerpt==="string" &&
        (value.format==="text"||value.format==="docx"||value.format==="pdf") &&
        typeof value.truncated==="boolean")
    : [];
  if(!items.length)return null;
  const selected=active===null?null:items[active];
  return <>
    <div className="aura-source-files" aria-label="ملفات استخدمتها المحادثة">
      {items.map((item,index)=>(
        <button type="button" key={index} onClick={()=>{setActive(index);setTab("original");}}
          aria-label={"معاينة مصدر "+item.name}>
          <Icon name="book" size={17}/>
          <span><strong>{item.name}</strong><small>محتوى مستخلص · مصدر {index+1}</small></span>
          <Icon name="arrow" size={14}/>
        </button>
      ))}
    </div>
    <Dialog open={selected!==null} onClose={()=>setActive(null)} title={selected?.name??"معاينة المصدر"}>
      {selected&&<div className="aura-source-preview">
        <div className="aura-studio-tabs"><button type="button" aria-pressed={tab==="original"} onClick={()=>setTab("original")}>المستند الأصلي</button><button type="button" aria-pressed={tab==="context"} onClick={()=>setTab("context")}>السياق المرسل للذكاء الاصطناعي</button></div>
        {tab==="original"?<OriginalDocumentPreview key={selected.localId??selected.documentId??selected.name} source={selected}/>:<>
        <p>محتوى مستخلص من ملف {selected.format==="docx"?"Word":selected.format==="pdf"?"PDF":"نصي"}. محفوظ في سياق هذه المحادثة، راجع تبويب المستند الأصلي للعرض والتنزيل عندما يكون متاحًا.</p>
        {selected.truncated&&<p role="status">المستند طويل؛ تم اختيار مقاطع ضمن حدود السياق، وقد لا تغطي كل معلومات الملف. لا تُعامل المعاينة كمحتوى الملف الكامل.</p>}
        <pre dir="auto">{selected.excerpt}</pre>
        <small>إذا طلبت من Noata الاستشهاد بمصدر، راجع الإجابة مقابل النص المستخلص الظاهر هنا.</small></>}
      </div>}
    </Dialog>
  </>;
}
