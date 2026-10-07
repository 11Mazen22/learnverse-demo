"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
export function RichMessage({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div dir="auto" className="ai-rich-message">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, [rehypeHighlight, { detect: false }]]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img src={src} alt={alt ?? "صورة"} loading="lazy" />
          ),
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
                {copied ? " تم النسخ" : " نسخ الكود"}
              </button>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
