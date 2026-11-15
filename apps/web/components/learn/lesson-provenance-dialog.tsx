"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";

export type LessonProvenanceDialogProps = {
  sourceDocument?: string | null;
  sourceSha256?: string | null;
  trackTitle?: string | null;
  subjectTitle?: string | null;
  uiLocale: "ar" | "en";
};

/**
 * Replaces raw inline SHA-256 hash clutter in the lesson hero with a clean
 * verified syllabus pill opening a structured editorial provenance dialog.
 */
export function LessonProvenanceDialog({
  sourceDocument,
  sourceSha256,
  trackTitle,
  subjectTitle,
  uiLocale,
}: LessonProvenanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!sourceDocument && !sourceSha256) return null;

  const t = (ar: string, en: string) => (uiLocale === "ar" ? ar : en);

  async function handleCopyHash() {
    if (!sourceSha256 || typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(sourceSha256);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard denials in sandboxed frames
    }
  }

  return (
    <>
      <button
        type="button"
        className="noata-provenance-trigger"
        onClick={() => setOpen(true)}
      >
        <Icon name="shield" size={14} />
        <span>{t("مصدر المنهج الموثق", "Verified Syllabus")}</span>
        <Icon name="info" size={13} />
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("بيانات توثيق المنهج والتحرير الأكاديمي", "Curriculum Provenance & Editorial Record")}
      >
        <div className="noata-provenance-dialog-body" dir={uiLocale === "ar" ? "rtl" : "ltr"}>
          <p className="noata-provenance-lead">
            {t(
              "محتوى هذا الدرس منشور ومطابق لبصمة التوثيق الرسمية للصف الأول الثانوي دون اختزال للمفاهيم.",
              "This lesson is audited against the official First Secondary study pack and cryptographic syllabus manifest.",
            )}
          </p>

          <dl className="noata-provenance-dl">
            {subjectTitle ? (
              <div className="noata-provenance-row">
                <dt>{t("المادة والمسار", "Subject & Track")}</dt>
                <dd>
                  {subjectTitle}
                  {trackTitle ? ` — ${trackTitle}` : ""}
                </dd>
              </div>
            ) : null}

            {sourceDocument ? (
              <div className="noata-provenance-row">
                <dt>{t("ملف المرجع المعتمد", "Source Manifest File")}</dt>
                <dd dir="ltr" className="noata-provenance-code">
                  {sourceDocument}
                </dd>
              </div>
            ) : null}

            {sourceSha256 ? (
              <div className="noata-provenance-row">
                <dt>{t("البصمة الرقمية (SHA-256)", "Verification Hash (SHA-256)")}</dt>
                <dd className="noata-provenance-hash-wrap">
                  <code dir="ltr" className="noata-provenance-code">
                    {sourceSha256}
                  </code>
                  <button
                    type="button"
                    className="btn btn-secondary noata-provenance-copy"
                    onClick={handleCopyHash}
                  >
                    <Icon name={copied ? "check" : "copy"} size={14} />
                    <span>{copied ? t("تم النسخ", "Copied") : t("نسخ البصمة", "Copy")}</span>
                  </button>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </Dialog>
    </>
  );
}
