"use client";
import {useState} from "react";
import {Dialog} from "@/components/ui/dialog";
import {Icon} from "@/components/ui/icon";

type Source={name:string;format:"text"|"docx";excerpt:string;truncated:boolean};
/** Files are read-only extracted source excerpts; original files are not retained. */
export function DocumentSourcesMessage({sources}:{sources:unknown}){
  const [active,setActive]=useState<number|null>(null);
  const items:Source[]=Array.isArray(sources)
    ? sources.slice(0,4).filter((value):value is Source=>
        !!value&&typeof value==="object" &&
        typeof value.name==="string" &&
        typeof value.excerpt==="string" &&
        (value.format==="text"||value.format==="docx") &&
        typeof value.truncated==="boolean")
    : [];
  if(!items.length)return null;
  const selected=active===null?null:items[active];
  return <>
    <div className="aura-source-files" aria-label="ملفات استخدمتها المحادثة">
      {items.map((item,index)=>(
        <button type="button" key={index} onClick={()=>setActive(index)}
          aria-label={"معاينة مصدر "+item.name}>
          <Icon name="book" size={17}/>
          <span><strong>{item.name}</strong><small>محتوى مستخلص · مصدر {index+1}</small></span>
          <Icon name="arrow" size={14}/>
        </button>
      ))}
    </div>
    <Dialog open={selected!==null} onClose={()=>setActive(null)} title={selected?.name??"معاينة المصدر"}>
      {selected&&<div className="aura-source-preview">
        <p>محتوى مستخلص من ملف {selected.format==="docx"?"Word":"نصي"}. محفوظ في سياق هذه المحادثة، وليس نسخة أصلية قابلة للتنزيل.</p>
        {selected.truncated&&<p role="status">المستند طويل؛ تم اقتطاع النص عند الحد المسموح. لا تُعامل المعاينة كمحتوى الملف الكامل.</p>}
        <pre dir="auto">{selected.excerpt}</pre>
        <small>إذا طلبت من Noata الاستشهاد بمصدر، راجع الإجابة مقابل النص المستخلص الظاهر هنا.</small>
      </div>}
    </Dialog>
  </>;
}
