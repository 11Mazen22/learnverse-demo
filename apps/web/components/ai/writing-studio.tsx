"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {createClient} from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { RichMessage } from "./rich-message";
import { downloadNoataDocx,createNoataDocx } from "@/lib/ai/docx-export";
import { downloadNoataXlsx,createNoataXlsx } from "@/lib/ai/xlsx-export";
import { downloadNoataPptx,createNoataPptx } from "@/lib/ai/pptx-export";
import { Icon } from "@/components/ui/icon";
import { writingDrafts } from "@/lib/ai/session-work";

/** A genuine editable document workspace for real Noata AI responses. */
export function WritingStudio({
  open,
  onClose,
  source,
  draftKey,
  owner,
}: {
  open: boolean;
  onClose: () => void;
  source: string;
  draftKey: string;
  owner: string | null;
}) {
 const t=useTranslation(),locale=useLocale();
 const supabase=useMemo(()=>createClient(),[]);
 const [libraryProjects,setLibraryProjects]=useState<{id:string;name:string}[]>([]);
 const [saveFormat,setSaveFormat]=useState<"docx"|"xlsx"|"pptx">("docx");
 const [saveProject,setSaveProject]=useState("");
 const [savingToLibrary,setSavingToLibrary]=useState(false);
  const [draft, setDraft] = useState(source);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [notice, setNotice] = useState("");
  const [title, setTitle] = useState("Noata document");
  const [exporting, setExporting] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [retained, setRetained] = useState(true);
  const initialTitle =
    source.match(/^#\s+(.+)$/m)?.[1]?.slice(0, 120) || "Noata document";
  const dirty = draft !== source || title !== initialTitle;
  const exportRequest = useRef<AbortController | null>(null);
  // Reset before Dialog's passive showModal effect can reveal the previous
  // document. Reopening after discard must never flash the discarded text.
  useLayoutEffect(() => {
    if (open) {
      const saved = writingDrafts.get(draftKey);
      setDraft(saved?.source === source ? saved.text : source);
      setTitle(saved?.source === source ? saved.title : initialTitle);
      setRetained(true);
      setMode("edit");
      setConfirmClose(false);
      setNotice("");
      setExporting(false);
    }
    return () => {
      exportRequest.current?.abort();
      exportRequest.current = null;
    };
  }, [open, source, draftKey, initialTitle]);
  useEffect(()=>{
    let alive=true;
    setLibraryProjects([]);setSaveProject("");
    if(!open||!owner)return;
    void supabase.from("ai_projects").select("id,name").eq("user_id",owner).order("updated_at",{ascending:false}).limit(50)
      .then(({data,error})=>{if(alive&&!error)setLibraryProjects(data??[]);});
    return ()=>{alive=false;};
  },[open,owner,supabase]);
  useEffect(() => {
    if (!open || !dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [open, dirty]);
  function requestClose() {
    if (dirty || exporting) setConfirmClose(true);
    else onClose();
  }

  function downloadMarkdown() {
    const url = URL.createObjectURL(
      new Blob([draft], { type: "text/markdown;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "noata-writing.md";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
    setNotice(t("تم تجهيز ملف Markdown.","Markdown file prepared."));
  }
  function saveWord() {
    try {
      downloadNoataDocx(draft, "noata-writing.docx");
      setNotice(t("تم تجهيز ملف Word قابل للتعديل.","Editable Word document prepared."));
    } catch {
      setNotice(t("المستند طويل جدًا للتصدير. قصّره أو حمّله بصيغة Markdown.","This document is too long to export. Shorten it or download Markdown."));
    }
  }
  function saveOffice(format:"xlsx"|"pptx") {
    try {
      if(format==="xlsx") downloadNoataXlsx(draft,"noata-data.xlsx");
      else downloadNoataPptx(draft,"noata-slides.pptx");
      setNotice(format==="xlsx"
       ?t("تم إنشاء ملف Excel قابل للتعديل من النص أو الجدول.","Created an editable Excel workbook from the text or table.")
       :t("تم إنشاء عرض PowerPoint قابل للتعديل. راجع الشرائح قبل المشاركة.","Created an editable PowerPoint deck. Review its slides before sharing."));
    } catch {
      setNotice(format==="xlsx"
       ?t("تعذر تصدير Excel. راجع حجم النص وطول الجداول.","Excel export failed. Check source length and table size.")
       :t("تعذر تصدير PowerPoint. قصّر النص أو قسّمه إلى شرائح باستخدام --- .","PowerPoint export failed. Shorten the text or separate slides with --- ."));
    }
  }
  async function saveToLibrary(){
    if(!owner||savingToLibrary||!draft.trim())return;
    setSavingToLibrary(true);setNotice(t("جارٍ حفظ الملف في مكتبتك الخاصة…","Saving the file to your private library…"));
    let path:string|undefined;
    try{
      const id=crypto.randomUUID();
      const data=saveFormat==="xlsx"?createNoataXlsx(draft):saveFormat==="pptx"?createNoataPptx(draft):createNoataDocx(draft);
      const filename="noata-"+new Date().toISOString().slice(0,10)+"-"+id.slice(0,8)+"."+saveFormat;
      const mime=saveFormat==="xlsx"?"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        saveFormat==="pptx"?"application/vnd.openxmlformats-officedocument.presentationml.presentation":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      path=owner+"/"+id+"/"+filename;
      const upload=await supabase.storage.from("noata-ai-artifacts").upload(path,new Blob([Uint8Array.from(data)],{type:mime}),{contentType:mime,upsert:false});
      if(upload.error)throw upload.error;
      const record=await supabase.from("ai_artifacts").insert({
        id,user_id:owner,project_id:saveProject&&libraryProjects.some(x=>x.id===saveProject)?saveProject:null,
        filename,mime_type:mime,storage_path:path,byte_size:data.byteLength
      });
      if(record.error)throw record.error;
      path=undefined;
      setNotice(t("تم حفظ الملف في مكتبتك. افتح تبويب الملفات من إعدادات Noata AI.","Saved to your library. Open Files in Noata AI settings."));
    }catch{
      if(path)await supabase.storage.from("noata-ai-artifacts").remove([path]).catch(()=>{});
      setNotice(t("تعذّر حفظ الملف. قد تحتاج إلى تفعيل مكتبة الملفات في بيئة العمل.","Could not save the file. Artifact storage may not be enabled in this environment."));
    }finally{setSavingToLibrary(false);}
  }
  async function savePdf(textOnly = false) {
    if (exporting) return;
    setExporting(true);
    setNotice(t("بنجهّز صفحات المستند…","Preparing document pages…"));
    const controller = new AbortController();
    exportRequest.current = controller;
    try {
      const response = await fetch(textOnly ? "/api/pdf" : "/api/documents/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept-Language":locale },
        body: JSON.stringify(textOnly ? { markdown: draft, title: title === "Noata document" ? t("مستند Noata","Noata document") : title } : { text: draft, title: title === "Noata document" ? t("مستند Noata","Noata document") : title }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const body = await response.json();
        const reason=response.status===401?t("سجّل دخولك لتصدير المستند.","Sign in again to export the document."):response.status===429?t("التصدير مشغول أو وصلت لحد الطلبات. انتظر قليلًا.","PDF export is busy or the request limit was reached. Wait a moment and try again."):locale==="en"?"Could not export the PDF. Your draft is kept; try Text PDF, Word, or Markdown.":body.error||t("تعذّر تصدير PDF.","Could not export the PDF.");
        throw new Error(reason+(typeof body.code==="string"?` (${body.code})`:""));
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = textOnly ? "noata-writing-text.pdf" : "noata-writing.pdf";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 15000);
      if (!controller.signal.aborted)
        setNotice(t("تم تنزيل PDF بخط عربي مضمّن وصفحات مرقّمة.","PDF downloaded with embedded fonts and numbered pages."));
    } catch (error) {
      if (!controller.signal.aborted)
        setNotice(error instanceof Error ? error.message : t("تعذّر تصدير PDF.","Could not export the PDF."));
    } finally {
      if (exportRequest.current === controller) {
        setExporting(false);
        exportRequest.current = null;
      }
    }
  }
  return (
    <Dialog open={open} onClose={requestClose} variant="studio" title={t("تحرير النص","Edit text")}>
      <div className="aura-studio">
        <p>{t("حرّر النص بنفسك، راجع شكله، ثم صدّره في ملف حقيقي. النسخة الأصلية من المحادثة لن تتغير.","Edit this text and review the result. Your original conversation stays saved.")}</p>
        <p className="aura-studio-status">
          {retained
            ? t("تُحفظ المسودة في ذاكرة هذه الجلسة لمدة ٣٠ دقيقة فقط. نزّل نسخة قبل إعادة تحميل الصفحة أو تسجيل الخروج.","Your draft stays in this session for 30 minutes. Download a copy before reloading or signing out.")
            : t("المسودة تتجاوز حد ذاكرة الجلسة. نزّل نسخة قبل إغلاق المحرر.","This draft exceeds session storage limits. Download a copy before closing.")}
        </p>
        {confirmClose && (
          <div role="alert" className="aura-studio-close-confirm">
            <p>{t("لديك تعديلات في المسودة","You have draft changes")}{exporting ? t(" وتصدير PDF جارٍ"," and a PDF export is in progress") : ""}{t(". هل تريد إغلاق المحرر؟",". Close the editor?")}</p>
            <button type="button" onClick={() => setConfirmClose(false)}>{t("متابعة التحرير","Keep editing")}</button>
            {retained && (
              <button type="button" onClick={onClose}>{t("إغلاق مع الاحتفاظ بالمسودة","Close and keep draft")}</button>
            )}
            <button
              type="button"
              onClick={() => {
                writingDrafts.delete(draftKey);
                onClose();
              }}
            >{t("تجاهل التعديلات وإغلاق","Discard changes and close")}</button>
          </div>
        )}
        <label className="aura-studio-title">{t("عنوان المستند","Document title")}<input
            maxLength={120}
            value={title === "Noata document" ? t("مستند Noata","Noata document") : title}
            onChange={(e) => {
              setTitle(e.target.value);
              setRetained(
                writingDrafts.set(draftKey, {
                  text: draft,
                  title: e.target.value,
                  source,
                }),
              );
            }}
          />
        </label>
        <div
          className="aura-studio-tabs"
          role="group"
          aria-label={t("وضع محرر المستند","Document editor mode")}
        >
          <button
            type="button"
            aria-pressed={mode === "edit"}
            onClick={() => setMode("edit")}
          >
            <Icon name="edit" size={16} />{t("تحرير","Edit")}</button>
          <button
            type="button"
            aria-pressed={mode === "preview"}
            onClick={() => setMode("preview")}
          >
            <Icon name="book" size={16} />{t("معاينة","Preview")}</button>
        </div>
        {mode === "edit" ? (
          <textarea
            aria-label={t("محتوى مستند Noata","Noata document content")}
            spellCheck
            dir="auto"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setRetained(
                writingDrafts.set(draftKey, {
                  text: e.target.value,
                  title,
                  source,
                }),
              );
            }}
          />
        ) : (
          <div
            className="aura-studio-preview"
            role="region"
            aria-label={t("معاينة المستند","Document preview")}
          >
            <RichMessage content={draft} />
          </div>
        )}
        {owner&&<div className="noata-studio-library" role="group" aria-label={t("حفظ في المكتبة الخاصة","Save to private library")}>
          <strong>{t("احتفظ بنسخة في مكتبتك","Keep a copy in your library")}</strong>
          <div className="noata-studio-library-controls">
            <label>{t("نوع الملف","Format")}<select value={saveFormat} onChange={e=>setSaveFormat(e.target.value as "docx"|"xlsx"|"pptx")}>
              <option value="docx">Word DOCX</option><option value="xlsx">Excel XLSX</option><option value="pptx">PowerPoint PPTX</option>
            </select></label>
            <label>{t("المشروع","Project")}<select value={saveProject} onChange={e=>setSaveProject(e.target.value)}>
              <option value="">{t("بدون مشروع","Unfiled")}</option>
              {libraryProjects.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
            </select></label>
            <button type="button" disabled={savingToLibrary||!draft.trim()} onClick={()=>void saveToLibrary()}>
              {savingToLibrary?t("جارٍ الحفظ…","Saving…"):t("حفظ في المكتبة","Save to library")}
            </button>
          </div>
        </div>}
        <div className="aura-studio-footer">
          <small>{draft.length.toLocaleString(locale==="en"?"en":"ar-EG")}{t("حرف","characters")}</small>
          <button type="button" disabled={!draft.trim()} onClick={saveWord}>
            Word DOCX
          </button>
          <button type="button" disabled={!draft.trim()||draft.length>120000} onClick={()=>saveOffice("xlsx")}>
            {t("جدول Excel · XLSX","Excel · XLSX")}
          </button>
          <button type="button" disabled={!draft.trim()||draft.length>30000} onClick={()=>saveOffice("pptx")}>
            {t("عرض PowerPoint · PPTX","PowerPoint · PPTX")}
          </button>
          <button
            type="button"
            disabled={!draft.trim()}
            onClick={downloadMarkdown}
          >
            Markdown
          </button>
          <button
            type="button"
            onClick={() => void savePdf()}
            disabled={exporting || !draft.trim() || draft.length > 100000}
          >
            {exporting ? t("جارٍ إنشاء PDF…","Creating PDF…") : t("تنزيل PDF","Download PDF")}
          </button>
          <button
            type="button"
            onClick={() => void savePdf(true)}
            disabled={exporting || !draft.trim() || draft.length > 100000}
            aria-describedby="noata-text-pdf-help"
          >{t("PDF نصي","Text PDF")}</button>
        </div>
        <small id="noata-text-pdf-help" className="aura-studio-status">{t("PDF النصي مناسب للنصوص والجداول البسيطة؛ يعرض المعادلات بصيغة نصية مبسّطة.","Text PDF supports text and simple tables. Equations are shown as plain text.")}</small>
        {notice && (
          <p className="aura-studio-status" role="status">
            {notice}
          </p>
        )}
      </div>
    </Dialog>
  );
}
