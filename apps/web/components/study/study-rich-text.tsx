"use client";

import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { displayMarkdown } from "@/lib/ai/display-markdown";
import {
  inferTextDirection,
  normalizeStructuredBlocks,
  renderSafeKatexHtml,
  SAFE_KATEX_OPTIONS,
  type StructuredBlockCalloutVariant,
  type StructuredStudyBlock,
} from "@/lib/curriculum/structured-content";

export interface StudyRichTextProps {
  /** Primary Markdown / KaTeX string prop preserved for backward compatibility. */
  content?: string | null;
  /** Alias for `content` supported by structured curriculum adapters. */
  text?: string | null;
  /** Optional typed educational blocks rendered natively without fragile regex parsing. */
  blocks?: StructuredStudyBlock[] | null;
  className?: string;
  dir?: "auto" | "rtl" | "ltr";
  locale?: "ar" | "en";
  /** Render inline phrasing elements (`<span>`) instead of block wrappers for use inside `<label>` or `<button>`. */
  inline?: boolean;
}

function isSafeHref(href?: string): boolean {
  if (!href) return false;
  const trimmed = href.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" || url.protocol === "mailto:";
  } catch {
    return false;
  }
}

const CALLOUT_LABELS: Record<
  StructuredBlockCalloutVariant,
  { ar: string; en: string }
> = {
  rule: { ar: "قاعدة أساسية", en: "Key Rule" },
  tip: { ar: "نصيحة مذاكرة", en: "Study Tip" },
  pitfall: { ar: "انتبه من الخطأ", en: "Common Pitfall" },
  summary: { ar: "الخلاصة", en: "Key Takeaway" },
  note: { ar: "ملاحظة", en: "Note" },
};

function resolveDir(explicitDir: "auto" | "rtl" | "ltr" | undefined, sampleText: string): "rtl" | "ltr" {
  if (explicitDir === "rtl" || explicitDir === "ltr") return explicitDir;
  return inferTextDirection(sampleText);
}

const MarkdownContent = memo(function MarkdownContent({
  markdown,
  resolvedDir,
  inline = false,
}: {
  markdown: string;
  resolvedDir: "rtl" | "ltr";
  inline?: boolean;
}) {
  const normalized = useMemo(() => displayMarkdown(markdown), [markdown]);

  if (!normalized.trim()) return null;

  const Wrapper = inline ? "span" : "div";

  return (
    <Wrapper className="noata-study-markdown" dir={resolvedDir}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, SAFE_KATEX_OPTIONS]]}
        components={{
          ...(inline
            ? {
                p: ({ children }) => <span className="noata-study-inline-p">{children}</span>,
                h1: ({ children }) => <span className="noata-study-inline-heading">{children}</span>,
                h2: ({ children }) => <span className="noata-study-inline-heading">{children}</span>,
                h3: ({ children }) => <span className="noata-study-inline-heading">{children}</span>,
                h4: ({ children }) => <span className="noata-study-inline-heading">{children}</span>,
                h5: ({ children }) => <span className="noata-study-inline-heading">{children}</span>,
                h6: ({ children }) => <span className="noata-study-inline-heading">{children}</span>,
                blockquote: ({ children }) => <span className="noata-study-inline-quote">{children}</span>,
                ul: ({ children }) => <span className="noata-study-inline-list">{children}</span>,
                ol: ({ children }) => <span className="noata-study-inline-list">{children}</span>,
                li: ({ children }) => <span className="noata-study-inline-li">{children}</span>,
                pre: ({ children }) => <code className="noata-study-inline-pre">{children}</code>,
                hr: () => null,
              }
            : {}),
          a: ({ href, children, ...rest }) => {
            if (!isSafeHref(href)) {
              return <span className="noata-study-blocked-link">{children}</span>;
            }
            const external = /^https?:\/\//i.test(href ?? "");
            return (
              <a
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                {...rest}
              >
                {children}
              </a>
            );
          },
          table: ({ children }) => (
            <div className="noata-study-table-wrap" tabIndex={0}>
              <table>{children}</table>
            </div>
          ),
          code: ({ className: codeClass, children, ...rest }) => {
            const isBlock = Boolean(codeClass && /language-/.test(codeClass));
            return (
              <code
                dir="ltr"
                className={isBlock ? `${codeClass} noata-study-codeblock` : "noata-study-inline-code"}
                {...rest}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre dir="ltr" className="noata-study-pre" tabIndex={0}>
              {children}
            </pre>
          ),
        }}
      >
        {normalized}
      </ReactMarkdown>
    </Wrapper>
  );
});

const StructuredBlockView = memo(function StructuredBlockView({
  block,
  fallbackDir,
  locale = "ar",
}: {
  block: StructuredStudyBlock;
  fallbackDir?: "auto" | "rtl" | "ltr";
  locale?: "ar" | "en";
}) {
  const anchorAttrs = {
    ...(block.blockId ? { "data-block-id": block.blockId } : {}),
    ...(block.conceptId ? { "data-concept-id": block.conceptId } : {}),
  };

  if (block.type === "explanation") {
    const blockDir = resolveDir(block.dir ?? fallbackDir, block.content);
    return (
      <div className="noata-study-block noata-study-block--explanation" dir={blockDir} {...anchorAttrs}>
        {block.title && <h4 className="noata-study-block-title">{block.title}</h4>}
        <MarkdownContent markdown={block.content} resolvedDir={blockDir} />
      </div>
    );
  }

  if (block.type === "math") {
    const display = block.display ?? true;
    const rendered = renderSafeKatexHtml(block.tex, { displayMode: display });
    return (
      <div
        className={`noata-study-block noata-study-block--math ${display ? "is-display" : "is-inline"}`}
        {...anchorAttrs}
      >
        {rendered.ok ? (
          <div
            className={display ? "noata-math-display" : "noata-math-inline"}
            tabIndex={display ? 0 : undefined}
            dir="ltr"
            // Safe strictly because renderSafeKatexHtml locks trust: false & maxExpand: 100
            dangerouslySetInnerHTML={{ __html: rendered.html }}
          />
        ) : (
          <div className="noata-math-fallback" dir="ltr">
            <code>{rendered.fallbackText}</code>
          </div>
        )}
        {block.caption && (
          <p className="noata-study-block-caption" dir={inferTextDirection(block.caption)}>
            {block.caption}
          </p>
        )}
      </div>
    );
  }

  if (block.type === "chemistry") {
    const display = block.display ?? true;
    const rendered = block.tex ? renderSafeKatexHtml(block.tex, { displayMode: display }) : null;
    return (
      <div className="noata-study-block noata-study-block--chemistry" {...anchorAttrs}>
        {rendered && rendered.ok ? (
          <div
            className="noata-math-display"
            tabIndex={display ? 0 : undefined}
            dir="ltr"
            dangerouslySetInnerHTML={{ __html: rendered.html }}
          />
        ) : (
          <div className="noata-chemistry-eq" tabIndex={display ? 0 : undefined} dir="ltr">
            <code>{block.equation}</code>
          </div>
        )}
        {block.caption && (
          <p className="noata-study-block-caption" dir={inferTextDirection(block.caption)}>
            {block.caption}
          </p>
        )}
      </div>
    );
  }

  if (block.type === "callout") {
    const labelMeta = CALLOUT_LABELS[block.variant];
    const badgeLabel = locale === "en" ? labelMeta.en : labelMeta.ar;
    const contentDir = resolveDir(fallbackDir, block.content);
    return (
      <aside
        className={`noata-study-block noata-callout noata-callout--${block.variant}`}
        dir={contentDir}
        {...anchorAttrs}
      >
        <div className="noata-callout-head">
          <span className="noata-callout-badge">{badgeLabel}</span>
          {block.title && <strong className="noata-callout-title">{block.title}</strong>}
        </div>
        <MarkdownContent markdown={block.content} resolvedDir={contentDir} />
      </aside>
    );
  }

  if (block.type === "poetry_couplet") {
    return (
      <figure className="noata-study-block noata-poetry-couplet" dir="rtl" lang="ar" {...anchorAttrs}>
        <div className="noata-poetry-line">
          <span className="noata-poetry-hemistich">{block.hemistich1}</span>
          <span className="noata-poetry-divider" aria-hidden="true">❖</span>
          <span className="noata-poetry-hemistich">{block.hemistich2}</span>
        </div>
        {(block.poet || block.meter) && (
          <figcaption className="noata-poetry-meta">
            {block.poet && <span>{block.poet}</span>}
            {block.meter && <span>{block.meter}</span>}
          </figcaption>
        )}
      </figure>
    );
  }

  // Primary historical or philosophical source quote
  const quoteDir = resolveDir(fallbackDir, block.quote);
  return (
    <figure className="noata-study-block noata-primary-source" dir={quoteDir} {...anchorAttrs}>
      <blockquote className="noata-primary-source-quote">{block.quote}</blockquote>
      <figcaption className="noata-primary-source-meta">
        <span className="noata-primary-source-attr">{block.attribution}</span>
        {block.period && <span className="noata-primary-source-period">{block.period}</span>}
      </figcaption>
      {block.reliabilityNote && (
        <p className="noata-primary-source-note">{block.reliabilityNote}</p>
      )}
    </figure>
  );
});

/**
 * Sanitized Markdown, structured study blocks, and hardened KaTeX renderer
 * shared across lessons, flashcards, quizzes, missions, and review flows.
 */
export const StudyRichText = memo(function StudyRichText({
  content,
  text,
  blocks,
  className = "",
  dir,
  locale = "ar",
  inline = false,
}: StudyRichTextProps) {
  const rawText = String(content ?? text ?? "");
  const normalizedBlocks = useMemo(
    () => (blocks && blocks.length > 0 ? normalizeStructuredBlocks(blocks) : []),
    [blocks],
  );
  const resolvedDir = useMemo(
    () => resolveDir(dir, rawText || normalizedBlocks.map((b) => ("content" in b ? b.content : "")).join(" ")),
    [dir, normalizedBlocks, rawText],
  );

  if (!rawText.trim() && normalizedBlocks.length === 0) {
    return null;
  }

  const Root = inline ? "span" : "div";

  return (
    <Root className={`noata-study-rich-text ${className}`.trim()} dir={resolvedDir}>
      {rawText.trim().length > 0 && (
        <MarkdownContent markdown={rawText} resolvedDir={resolvedDir} inline={inline} />
      )}
      {!inline && normalizedBlocks.length > 0 && (
        <div className="noata-study-blocks">
          {normalizedBlocks.map((block, index) => (
            <StructuredBlockView
              key={block.blockId || `${block.type}-${index}`}
              block={block}
              fallbackDir={dir}
              locale={locale}
            />
          ))}
        </div>
      )}
    </Root>
  );
});
