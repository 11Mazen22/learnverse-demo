"use client";
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { safeStorageLink } from "@/lib/ai/workspace";
import { SUPABASE_URL } from "@/lib/supabase/config";

export function AttachmentMessage({metadata}:{metadata?:Record<string,unknown>}) {
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
          <small>{isImage ? "صورة مرفقة" : text!==null ? "نص المستند المستخلص" : "مرفق"}</small>
        </span>
        {(text !== null || signed) ? (
          <button type="button" onClick={()=>setOpen(true)} aria-label={"معاينة "+name}>
            معاينة <Icon name="arrow" size={14}/>
          </button>
        ) : (
          <small>رابط المعاينة منتهي. أعد فتح المحادثة.</small>
        )}
      </div>
      <Dialog open={open} onClose={()=>setOpen(false)} title={"معاينة المرفق: "+name}>
        <div className="aura-attachment-viewer">
          {isImage && signed ? (
            <img src={signed} alt={"الصورة المرفقة: "+name} loading="lazy"/>
          ) : text!==null ? (
            <>
              <p className="aura-document-disclosure">
                النص أدناه مستخلص من المستند وأُرسل بالفعل إلى نموذج Noata AI.
                {truncated ? " الملف طويل؛ جرى استخدام أول 9000 حرف فقط." : ""}
                لا يتم الاحتفاظ بنسخة من الملف الأصلي في التخزين في هذا الوضع.
              </p>
              <pre dir="auto">{text}</pre>
            </>
          ) : <p>المعاينة غير متاحة. أعد فتح المحادثة للحصول على رابط جديد.</p>}
          {signed && (
            <a href={signed} target="_blank" rel="noopener noreferrer" className="aura-attachment-download">
              <Icon name="download" size={16}/> فتح الملف المرفق
            </a>
          )}
        </div>
      </Dialog>
    </>
  );
}
