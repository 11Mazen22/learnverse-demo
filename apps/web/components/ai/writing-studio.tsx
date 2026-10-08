"use client";
import { useEffect, useRef, useState } from "react";
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
  const [draft, setDraft] = useState(source);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [notice, setNotice] = useState("");
  const [title, setTitle] = useState("مستند Noata");
  const [exporting, setExporting] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [retained, setRetained] = useState(true);
  const initialTitle =
    source.match(/^#\s+(.+)$/m)?.[1]?.slice(0, 120) || "مستند Noata";
  const dirty = draft !== source || title !== initialTitle;
  const exportRequest = useRef<AbortController | null>(null);
  useEffect(() => {
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
    setNotice("تم تجهيز ملف Markdown.");
  }
  function saveWord() {
    try {
      downloadNoataDocx(draft, "noata-writing.docx");
      setNotice("تم تجهيز ملف Word قابل للتعديل.");
    } catch {
      setNotice("المستند طويل جدًا للتصدير. قصّره أو حمّله بصيغة Markdown.");
    }
  }
  async function savePdf() {
    if (exporting) return;
    setExporting(true);
    setNotice("بنجهّز صفحات المستند…");
    const controller = new AbortController();
    exportRequest.current = controller;
    try {
      const response = await fetch("/api/documents/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft, title }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "تعذّر تصدير PDF.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "noata-writing.pdf";
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 15000);
      if (!controller.signal.aborted)
        setNotice("تم تنزيل PDF بخط عربي مضمّن وصفحات مرقّمة.");
    } catch (error) {
      if (!controller.signal.aborted)
        setNotice(error instanceof Error ? error.message : "تعذّر تصدير PDF.");
    } finally {
      if (exportRequest.current === controller) {
        setExporting(false);
        exportRequest.current = null;
      }
    }
  }
  return (
    <Dialog open={open} onClose={requestClose} title="مساحة الكتابة في Noata">
      <div className="aura-studio">
        <p>
          حرّر النص بنفسك، راجع شكله، ثم صدّره في ملف حقيقي. النسخة الأصلية من
          المحادثة لن تتغير.
        </p>
        <p className="aura-studio-status">
          {retained
            ? "تُحفظ المسودة في ذاكرة هذه الجلسة لمدة ٣٠ دقيقة فقط. نزّل نسخة قبل إعادة تحميل الصفحة أو تسجيل الخروج."
            : "المسودة تتجاوز حد ذاكرة الجلسة. نزّل نسخة قبل إغلاق المحرر."}
        </p>
        {confirmClose && (
          <div role="alert" className="aura-studio-close-confirm">
            <p>
              لديك تعديلات في المسودة{exporting ? " وتصدير PDF جارٍ" : ""}. هل
              تريد إغلاق المحرر؟
            </p>
            <button type="button" onClick={() => setConfirmClose(false)}>
              متابعة التحرير
            </button>
            {retained && (
              <button type="button" onClick={onClose}>
                إغلاق مع الاحتفاظ بالمسودة
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                writingDrafts.delete(draftKey);
                onClose();
              }}
            >
              تجاهل التعديلات وإغلاق
            </button>
          </div>
        )}
        <label className="aura-studio-title">
          عنوان المستند
          <input
            maxLength={120}
            value={title}
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
          aria-label="وضع محرر المستند"
        >
          <button
            type="button"
            aria-pressed={mode === "edit"}
            onClick={() => setMode("edit")}
          >
            <Icon name="edit" size={16} /> تحرير
          </button>
          <button
            type="button"
            aria-pressed={mode === "preview"}
            onClick={() => setMode("preview")}
          >
            <Icon name="book" size={16} /> معاينة
          </button>
        </div>
        {mode === "edit" ? (
          <textarea
            aria-label="محتوى مستند Noata"
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
            aria-label="معاينة المستند"
          >
            <RichMessage content={draft} />
          </div>
        )}
        <div className="aura-studio-footer">
          <small>{draft.length.toLocaleString("ar-EG")} حرف</small>
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
            {exporting ? "جارٍ إنشاء PDF…" : "تنزيل PDF"}
          </button>
        </div>
        {notice && (
          <p className="aura-studio-status" role="status">
            {notice}
          </p>
        )}
      </div>
    </Dialog>
  );
}
