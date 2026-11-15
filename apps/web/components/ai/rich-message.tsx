"use client";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { type ComponentProps, Fragment, memo, useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { safeStorageLink } from "@/lib/ai/workspace";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { displayMarkdown } from "@/lib/ai/display-markdown";
import { splitQuranDirectives } from "@/lib/ai/quran-directives";
import { splitPresentationBlocks } from "@/lib/ai/presentation-blocks";
import { QuranPassage } from "./quran-passage";
import { interactiveResponseSegments } from "../../../../supabase/functions/noata-ai/response-ui.ts";
import { validatedResearch } from "../../../../supabase/functions/noata-ai/research.ts";
import { citationDestination } from "../../../../supabase/functions/noata-ai/citations.ts";
import { ResponseComponent } from "./response-components";

type HastNode = {
  type?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  value?: string;
  children?: HastNode[];
};

const INLINE_CARET_CONTAINERS = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "td",
  "th",
  "blockquote",
  "strong",
  "em",
  "b",
  "i",
  "span",
  "a",
  "code",
]);

function appendCaretToLastTextContainer(children: HastNode[] | undefined): boolean {
  if (!children || children.length === 0) return false;
  for (let i = children.length - 1; i >= 0; i -= 1) {
    const child = children[i];
    if (!child) continue;
    if (child.type === "text" && !child.value?.trim() && i > 0) continue;
    if (child.type === "text") {
      children.splice(i + 1, 0, {
        type: "element",
        tagName: "span",
        properties: { className: ["noata-stream-caret"], ariaHidden: "true" },
        children: [],
      });
      return true;
    }
    if (child.type === "element" && child.tagName) {
      if (child.tagName === "pre" || child.tagName === "hr") return false;
      if (child.tagName === "table") {
        // Walk into the last cell when streaming inside a Markdown table.
        if (appendCaretToLastTextContainer(child.children)) return true;
        return false;
      }
      if (appendCaretToLastTextContainer(child.children)) return true;
      if (INLINE_CARET_CONTAINERS.has(child.tagName)) {
        child.children = child.children ?? [];
        child.children.push({
          type: "element",
          tagName: "span",
          properties: { className: ["noata-stream-caret"], ariaHidden: "true" },
          children: [],
        });
        return true;
      }
    }
  }
  return false;
}

/**
 * Rehype plugin that anchors the blinking caret directly inline inside the
 * deepest trailing text block during streaming, preventing orphan blank-line cursors.
 */
function rehypeStreamingCaret() {
  return (tree: HastNode) => {
    appendCaretToLastTextContainer(tree.children);
  };
}

export const RichMessage = memo(function RichMessage({
  content,
  research,
  streaming = false,
  poetryHint = false,
}: {
  content: string;
  research?: unknown;
  streaming?: boolean;
  poetryHint?: boolean;
}) {
  const t = useTranslation();
  useLocale();
  const [copied, setCopied] = useState(false);
  const evidence = validatedResearch(research);
  const segments = interactiveResponseSegments(content, streaming);
  const staticPlugins = useMemo<ComponentProps<typeof ReactMarkdown>["rehypePlugins"]>(
    () => [rehypeKatex, [rehypeHighlight, { detect: false }]],
    [],
  );
  const streamPlugins = useMemo<ComponentProps<typeof ReactMarkdown>["rehypePlugins"]>(
    () => (streaming ? [rehypeStreamingCaret as unknown as NonNullable<ComponentProps<typeof ReactMarkdown>["rehypePlugins"]>[number]] : staticPlugins),
    [streaming, staticPlugins],
  );

  return (
    <div dir="auto" className="ai-rich-message">
      {segments.map((segment, index) => {
        const isLastSegment = index === segments.length - 1;
        if (segment.type === "interactive") {
          return <ResponseComponent key={segment.data.id + index} data={segment.data} />;
        }
        if (segment.type === "pending") {
          return (
            <div key={index} className="noata-widget-pending-card" role="status">
              <span className="noata-stream-indicator" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span>
                {streaming
                  ? t("بنجهّزلك البطاقة التفاعلية الذكية…", "Building your interactive Smart UI card…")
                  : t(
                      "لم يكتمل العرض التفاعلي. تقدر تقرأ الشرح أو تحاول تاني.",
                      "The interactive view was incomplete. Read the explanation or try again.",
                    )}
              </span>
            </div>
          );
        }
        if (segment.type === "fallback") {
          return (
            <p key={index}>
              {segment.text ||
                t(
                  "العرض التفاعلي غير متاح حاليًا. تقدر تقرأ الشرح فوق.",
                  "Interactive view unavailable. Read the explanation above.",
                )}
            </p>
          );
        }

        const quranParts = splitQuranDirectives(segment.text);
        return (
          <Fragment key={"markdown-" + index}>
            {quranParts.map((part, partIndex) => {
              const isLastPart = isLastSegment && partIndex === quranParts.length - 1;
              if (part.kind === "quran") {
                return (
                  <QuranPassage
                    key={partIndex}
                    surah={part.surah}
                    start={part.start}
                    end={part.end}
                  />
                );
              }
              const blocks = splitPresentationBlocks(part.text, poetryHint);
              return (
                <Fragment key={partIndex}>
                  {blocks.map((block, blockIndex) => {
                    const isTailStream =
                      streaming && isLastPart && blockIndex === blocks.length - 1;
                    if (block.type === "poem") {
                      const stanzas = block.text.split(/\n\s*\n/);
                      return (
                        <figure
                          key={blockIndex}
                          className="noata-literary-piece"
                          lang={/[؀-ۿ]/.test(block.text) ? "ar" : "en"}
                          dir={/[؀-ۿ]/.test(block.text) ? "rtl" : "ltr"}
                        >
                          <div className="noata-literary-rule" aria-hidden="true">
                            <span>✦</span>
                          </div>
                          <div className="noata-literary-verses">
                            {stanzas.map((stanza, si) => {
                              const lines = stanza.split("\n");
                              const isLastStanza = isTailStream && si === stanzas.length - 1;
                              return (
                                <p className="noata-literary-stanza" key={si}>
                                  {lines.map((line, li) => (
                                    <span className="noata-literary-line" key={li}>
                                      {line}
                                      {isLastStanza && li === lines.length - 1 && (
                                        <span className="noata-stream-caret" aria-hidden="true" />
                                      )}
                                    </span>
                                  ))}
                                </p>
                              );
                            })}
                          </div>
                          <figcaption className="noata-literary-end" aria-hidden="true">
                            ✦
                          </figcaption>
                        </figure>
                      );
                    }
                    if (block.type === "insight" || block.type === "example") {
                      return (
                        <aside
                          key={blockIndex}
                          className={
                            "noata-literary-note " +
                            (block.type === "example" ? "is-example" : "is-insight")
                          }
                        >
                          <strong>
                            {block.type === "example"
                              ? t("مثال محلول", "Worked example")
                              : t("تكة مهمة", "Key insight")}
                          </strong>
                          <p dir="auto">
                            {block.text}
                            {isTailStream && (
                              <span className="noata-stream-caret" aria-hidden="true" />
                            )}
                          </p>
                        </aside>
                      );
                    }
                    return (
                      <ReactMarkdown
                        key={blockIndex}
                        remarkPlugins={streaming ? [remarkGfm] : [remarkGfm, remarkMath]}
                        rehypePlugins={isTailStream ? streamPlugins : staticPlugins}
                        components={{
                          a: ({ href, children }) =>
                            evidence && !citationDestination(href, evidence) ? (
                              <span>{children}</span>
                            ) : (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                referrerPolicy="no-referrer"
                              >
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
                                  alt={alt ?? t("صورة", "Image")}
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                />
                              );
                            if (typeof src === "string" && /^https:\/\//.test(src))
                              return (
                                <a href={src} target="_blank" rel="noopener noreferrer">
                                  {alt || t("صورة خارجية", "External image")}
                                  {t(" · فتح رابط الصورة", " · Open image link")}
                                </a>
                              );
                            return <span>{alt || t("الصورة غير متاحة", "Image unavailable")}</span>;
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
                                {copied ? t(" تم النسخ", " Copied") : t(" نسخ الكود", " Copy code")}
                              </button>
                            </div>
                          ),
                        }}
                      >
                        {displayMarkdown(
                          evidence?.status === "complete"
                            ? block.text.replace(/\[(\d{1,2})\](?!\()/g, (marker, id) => {
                                const source = evidence.sources.find((s) => s.id === Number(id));
                                return source ? `[${id}](<${source.url}>)` : marker;
                              })
                            : block.text,
                        )}
                      </ReactMarkdown>
                    );
                  })}
                </Fragment>
              );
            })}
          </Fragment>
        );
      })}
    </div>
  );
});
