"use client";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { RichMessage } from "./rich-message";
import { downloadNoataDocx } from "@/lib/ai/docx-export";
import { Icon } from "@/components/ui/icon";

/** A genuine editable document workspace for real Noata AI responses. */
export function WritingStudio({
  open,onClose,source,
}:{
  open:boolean; onClose:()=>void; source:string;
}) {
  const [draft,setDraft]=useState(source);
  const [mode,setMode]=useState<"edit"|"preview">("edit");
  const [notice,setNotice]=useState("");
  useEffect(()=>{
    if(open){setDraft(source);setMode("edit");setNotice("");}
  },[open,source]);

  function downloadMarkdown() {
    const url=URL.createObjectURL(new Blob([draft],{type:"text/markdown;charset=utf-8"}));
    const a=document.createElement("a");
    a.href=url;a.download="noata-writing.md";
    document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),15000);
    setNotice("تم تجهيز ملف Markdown.");
  }
  function saveWord() {
    try {
      downloadNoataDocx(draft,"noata-writing.docx");
      setNotice("تم تجهيز ملف Word قابل للتعديل.");
    } catch {
      setNotice("المستند طويل جدًا للتصدير. قصّره أو حمّله بصيغة Markdown.");
    }
  }
  function printToPdf() {
    const win=window.open("","_blank");
    if(!win){setNotice("اسمح بالنوافذ المنبثقة لطباعة المستند أو حفظه بصيغة PDF.");return;}
    const documentTitle=win.document.createElement("title");
    documentTitle.textContent="Noata Writing Studio";
    win.document.head.append(documentTitle);
    const style=win.document.createElement("style");
    style.textContent="@page{size:A4;margin:17mm}html{direction:rtl}body{font:15px/1.95 Arial,Tahoma,sans-serif;color:#1b2923}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}h1{font-size:21px}";
    win.document.head.append(style);
    const h=win.document.createElement("h1");
    h.textContent="Noata · مساحة الكتابة";
    win.document.body.append(h);
    const pre=win.document.createElement("pre");
    pre.textContent=draft;
    win.document.body.append(pre);
    win.focus();
    win.print();
    setNotice("اختر «حفظ بصيغة PDF» من نافذة الطباعة عند توفرها.");
  }
  return (
    <Dialog open={open} onClose={onClose} title="مساحة الكتابة في Noata">
      <div className="aura-studio">
        <p>حرّر النص بنفسك، راجع شكله، ثم صدّره في ملف حقيقي. النسخة الأصلية من المحادثة لن تتغير.</p>
        <div className="aura-studio-tabs" role="group" aria-label="وضع محرر المستند">
          <button type="button" aria-pressed={mode==="edit"} onClick={()=>setMode("edit")}><Icon name="edit" size={16}/> تحرير</button>
          <button type="button" aria-pressed={mode==="preview"} onClick={()=>setMode("preview")}><Icon name="book" size={16}/> معاينة</button>
        </div>
        {mode==="edit" ?
          <textarea
            aria-label="محتوى مستند Noata"
            spellCheck
            dir="auto"
            value={draft}
            onChange={e=>setDraft(e.target.value)}
          /> :
          <div className="aura-studio-preview" role="region" aria-label="معاينة المستند">
            <RichMessage content={draft}/>
          </div>}
        <div className="aura-studio-footer">
          <small>{draft.length.toLocaleString("ar-EG")} حرف</small>
          <button type="button" disabled={!draft.trim()} onClick={saveWord}>Word DOCX</button>
          <button type="button" disabled={!draft.trim()} onClick={downloadMarkdown}>Markdown</button>
          <button type="button" disabled={!draft.trim()} onClick={printToPdf}>طباعة / حفظ PDF</button>
        </div>
        {notice && <p className="aura-studio-status" role="status">{notice}</p>}
      </div>
    </Dialog>
  );
}
