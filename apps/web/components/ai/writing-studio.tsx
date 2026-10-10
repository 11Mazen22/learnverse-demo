"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { RichMessage } from "./rich-message";
import { downloadNoataDocx } from "@/lib/ai/docx-export";
import { Icon } from "@/components/ui/icon";
import { writingDrafts } from "@/lib/ai/session-work";

/** A genuine editable document workspace for real Noata AI responses. */
export function WritingStudio({
  open,
  onClose,
  source,
  draftKey,
}: {
  open: boolean;
  onClose: () => void;
  source: string;
  draftKey: string;
}) {
 const t=useTranslation(),locale=useLocale();
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
        throw new Error(locale==="en" ? "Could not export the PDF. Your draft is kept; try again or download Word or Markdown." : body.error || t("تعذّر تصدير PDF.","Could not export the PDF."));
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
    <Dialog open={open} onClose={requestClose} variant="studio" title={t("مساحة الكتابة في Noata","Noata writing studio")}>
      <div className="aura-studio">
        <p>{t("حرّر النص بنفسك، راجع شكله، ثم صدّره في ملف حقيقي. النسخة الأصلية من المحادثة لن تتغير.","Edit your draft, preview the layout, and download a document. Your original conversation stays saved.")}</p>
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
        <div className="aura-studio-footer">
          <small>{draft.length.toLocaleString(locale==="en"?"en":"ar-EG")}{t("حرف","characters")}</small>
          <button type="button" disabled={!draft.trim()} onClick={saveWord}>
            Word DOCX
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
