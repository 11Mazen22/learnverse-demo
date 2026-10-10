"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { memo,useState } from "react";
import { Icon } from "@/components/ui/icon";
import { safeStorageLink } from "@/lib/ai/workspace";
import { SUPABASE_URL } from "@/lib/supabase/config";
import {displayMarkdown} from "@/lib/ai/display-markdown";
import {responseSegments} from "../../../../supabase/functions/noata-ai/response-ui.ts";
import {validatedResearch} from "../../../../supabase/functions/noata-ai/research.ts";
import {ResponseComponent} from "./response-components";
export const RichMessage=memo(function RichMessage({ content, research, streaming=false }: { content: string;research?:unknown;streaming?:boolean }) {
 const t=useTranslation(),locale=useLocale();
  const [copied, setCopied] = useState(false);
  const evidence=validatedResearch(research);
  const segments=responseSegments(content);
  return (
    <div dir="auto" className="ai-rich-message">
      {segments.map((segment,index)=>segment.type==="interactive"?<ResponseComponent key={segment.data.id+index} data={segment.data}/>:segment.type==="pending"?<p key={index} className="noata-widget-note">{streaming?t("بنجهّز العرض التفاعلي…","Preparing interactive view…"):t("لم يكتمل العرض التفاعلي. يمكنك قراءة الشرح أو إعادة المحاولة.","The interactive view was incomplete. Read the explanation or try again.")}</p>:segment.type==="fallback"?<p key={index}>{segment.text||t("العرض التفاعلي غير متاح. اقرأ الشرح أعلاه.","Interactive view unavailable. Read the explanation above.")}</p>:<ReactMarkdown key={index}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, [rehypeHighlight, { detect: false }]]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ src, alt }) => {
            const allowed =
              safeStorageLink(src, SUPABASE_URL, "noata-generated") ??
              safeStorageLink(src, SUPABASE_URL);
            if (allowed)
              return (
                <img
                  src={allowed}
                  alt={alt ?? t("صورة","Image")}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              );
            // Model-authored external images can encode private prompt text in
            // their URL. Load them only after the user explicitly follows a link.
            if (typeof src === "string" && /^https:\/\//.test(src))
              return (
                <a href={src} target="_blank" rel="noopener noreferrer">
                  {alt || t("صورة خارجية","External image")}{t("· فتح رابط الصورة","· Open image link")}</a>
              );
            return <span>{alt || t("الصورة غير متاحة","Image unavailable")}</span>;
          },
          pre: ({ children }) => (
            <div>
              <pre>{children}</pre>
              <button
                type="button"
                className="filter-chip"
                onClick={async (e) => {
                  const code =
                    e.currentTarget.previousElementSibling?.textContent ?? "";
                  try {
                    await navigator.clipboard.writeText(code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                <Icon name="copy" size={13} />
                {copied ? t(" تم النسخ"," Copied") : t(" نسخ الكود"," Copy code")}
              </button>
            </div>
          ),
        }}
      >
        {displayMarkdown(evidence?.status==="complete"?segment.text.replace(/\[(\d{1,2})\](?!\()/g,(marker,id)=>{const source=evidence.sources.find(s=>s.id===Number(id));return source?`[${id}](<${source.url}>)`:marker;}):segment.text)}
      </ReactMarkdown>)}
    </div>
  );
});
