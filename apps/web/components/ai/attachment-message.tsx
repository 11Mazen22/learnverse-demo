"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { safeStorageLink } from "@/lib/ai/workspace";
import { SUPABASE_URL } from "@/lib/supabase/config";

export function AttachmentMessage({metadata}:{metadata?:Record<string,unknown>}) {
 const t=useTranslation(),locale=useLocale();
  const [open,setOpen] = useState(false);
  if (typeof metadata?.attachmentName !== "string") return null;
  const name = metadata.attachmentName.slice(0,160);
  const mime = typeof metadata.attachmentMime === "string" ? metadata.attachmentMime : "";
  const text = typeof metadata.documentExcerpt === "string" ? metadata.documentExcerpt : null;
  const truncated = metadata.documentTruncated === true;
  const signed = safeStorageLink(metadata.attachmentUrl, SUPABASE_URL);
  const isImage = mime.startsWith("image/");
  return (
    <>
      <div className="aura-attachment-card">
        <span className="aura-attachment-type" aria-hidden="true"><Icon name={isImage?"image":"book"} size={21}/></span>
        <span className="aura-attachment-details">
          <strong title={name}>{name}</strong>
          <small>{isImage ? t("صورة مرفقة","Attached image") : text!==null ? t("نص المستند المستخلص","Extracted document text") : t("مرفق","Attachment")}</small>
        </span>
        {(text !== null || signed) ? (
          <button type="button" onClick={()=>setOpen(true)} aria-label={t("معاينة ","Preview ")+name}>{t("معاينة","Preview")}<Icon name="arrow" size={14}/>
          </button>
        ) : (
          <small>{t("رابط المعاينة منتهي. أعد فتح المحادثة.","This preview link expired. Reopen the conversation.")}</small>
        )}
      </div>
      <Dialog open={open} onClose={()=>setOpen(false)} title={t("معاينة المرفق: ","Attachment preview: ")+name}>
        <div className="aura-attachment-viewer">
          {isImage && signed ? (
            <img src={signed} alt={t("الصورة المرفقة: ","Attached image: ")+name} loading="lazy"/>
          ) : text!==null ? (
            <>
              <p className="aura-document-disclosure">{t("النص أدناه مستخلص من المستند وأُرسل بالفعل إلى نموذج Noata AI.","The text below was extracted from the document and sent to Noata AI.")}{truncated ? t(" الملف طويل؛ جرى استخدام أول 9000 حرف فقط."," This file is long. Only the first 9,000 characters were used.") : ""}{t("لا يتم الاحتفاظ بنسخة من الملف الأصلي في التخزين في هذا الوضع.","The original file is not retained in storage in this mode.")}</p>
              <pre dir="auto">{text}</pre>
            </>
          ) : <p>{t("المعاينة غير متاحة. أعد فتح المحادثة للحصول على رابط جديد.","Preview unavailable. Reopen the conversation for a new link.")}</p>}
          {signed && (
            <a href={signed} target="_blank" rel="noopener noreferrer" className="aura-attachment-download">
              <Icon name="download" size={16}/>{t("فتح الملف المرفق","Open attachment")}</a>
          )}
        </div>
      </Dialog>
    </>
  );
}
