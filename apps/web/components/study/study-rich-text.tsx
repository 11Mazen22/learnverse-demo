"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { displayMarkdown } from "@/lib/ai/display-markdown";

function safeExternalUrl(href: string | undefined): string | null {
  if (!href) return null;
  try {
    const parsed = new URL(href);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Lightweight, sanitized Markdown + KaTeX math renderer scoped for Study Center
 * flashcards, cloze items, explanations, and composer previews. Never executes raw HTML.
 */
export const StudyRichText = memo(function StudyRichText({
  content,
  className = "",
}: {
  content: string;
  className?: string;
}) {
  const normalized = displayMarkdown(String(content ?? ""));
  return (
    <div dir="auto" className={["nk-study-prose", className].filter(Boolean).join(" ")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          a: ({ href, children }) => {
            const safe = safeExternalUrl(href);
            if (!safe) return <span>{children}</span>;
            return (
              <a href={safe} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
                {children}
              </a>
            );
          },
          img: ({ src, alt }) => {
            const safe = typeof src === "string" ? safeExternalUrl(src) : null;
            if (safe) {
              return (
                <a href={safe} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
                  {alt || safe}
                </a>
              );
            }
            return <span>{alt || ""}</span>;
          },
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
});
