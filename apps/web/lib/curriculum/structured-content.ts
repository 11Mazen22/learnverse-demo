import katex, { type KatexOptions } from "katex";

export const MAX_KATEX_INPUT_LENGTH = 2000;
export const MAX_STRUCTURED_BLOCKS_PER_SECTION = 64;

/**
 * Hardened KaTeX configuration shared by direct KaTeX rendering and rehype-katex.
 * - `trust: false` blocks unsafe links/HTML attributes (\href, \htmlClass, \htmlStyle, etc.).
 * - `maxExpand: 100` bounds TeX macro recursion against DoS payloads.
 * - `maxSize: 20` caps custom font/spacing commands.
 */
export const SAFE_KATEX_OPTIONS: Readonly<KatexOptions> = Object.freeze({
  trust: false,
  maxExpand: 100,
  maxSize: 20,
  strict: "ignore",
  throwOnError: false,
  output: "htmlAndMathml",
});

export type StructuredBlockCalloutVariant = "rule" | "tip" | "pitfall" | "summary" | "note";

export interface StructuredBlockAnchorMeta {
  /** Optional stable anchor identifier preserved for deferred Study Notebook integration. */
  blockId?: string;
  /** Optional concept identifier preserved for future concept-level mastery & bookmarking. */
  conceptId?: string;
}

export interface ExplanationStudyBlock extends StructuredBlockAnchorMeta {
  type: "explanation";
  content: string;
  title?: string;
  dir?: "auto" | "rtl" | "ltr";
}

export interface MathStudyBlock extends StructuredBlockAnchorMeta {
  type: "math";
  tex: string;
  display?: boolean;
  caption?: string;
}

export interface ChemistryStudyBlock extends StructuredBlockAnchorMeta {
  type: "chemistry";
  equation: string;
  tex?: string;
  caption?: string;
  display?: boolean;
}

export interface CalloutStudyBlock extends StructuredBlockAnchorMeta {
  type: "callout";
  variant: StructuredBlockCalloutVariant;
  title?: string;
  content: string;
}

export interface PoetryCoupletStudyBlock extends StructuredBlockAnchorMeta {
  type: "poetry_couplet";
  hemistich1: string;
  hemistich2: string;
  meter?: string;
  poet?: string;
}

export interface PrimarySourceStudyBlock extends StructuredBlockAnchorMeta {
  type: "primary_source";
  quote: string;
  attribution: string;
  period?: string;
  reliabilityNote?: string;
}

export type StructuredStudyBlock =
  | ExplanationStudyBlock
  | MathStudyBlock
  | ChemistryStudyBlock
  | CalloutStudyBlock
  | PoetryCoupletStudyBlock
  | PrimarySourceStudyBlock;

export interface StructuredConceptSection {
  type: "concept";
  id?: string;
  conceptId?: string;
  title: string;
  blocks: StructuredStudyBlock[];
}

export interface SafeKatexRenderResult {
  ok: boolean;
  html: string;
  fallbackText: string;
  errorProtected: boolean;
  reason?: "empty" | "too_long" | "render_error";
}

const CONTROL_CHARS_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const UNTRUSTED_TEX_MACRO_RE =
  /\\(?:href|url|includegraphics|htmlClass|htmlId|htmlStyle|htmlData)\b/;
const ARABIC_CHAR_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const LATIN_CHAR_RE = /[A-Za-z]/;
const CALLOUT_VARIANTS = new Set<StructuredBlockCalloutVariant>([
  "rule",
  "tip",
  "pitfall",
  "summary",
  "note",
]);

export function sanitizeKatexInput(raw: string): {
  valid: boolean;
  value: string;
  reason?: "empty" | "too_long";
} {
  const cleaned = String(raw ?? "").replace(CONTROL_CHARS_RE, "").trim();
  if (!cleaned) {
    return { valid: false, value: "", reason: "empty" };
  }
  if (cleaned.length > MAX_KATEX_INPUT_LENGTH) {
    return { valid: false, value: cleaned, reason: "too_long" };
  }
  return { valid: true, value: cleaned };
}

/**
 * Safely render explicit TeX into KaTeX HTML + MathML without arbitrary HTML injection.
 * Unexpanded/rejected expressions (e.g. `trust: false` rejections or `maxExpand` overflow)
 * surface cleanly via escaped fallback text when KaTeX flags `.katex-error`.
 */
export function renderSafeKatexHtml(
  rawTex: string,
  options?: { displayMode?: boolean },
): SafeKatexRenderResult {
  const check = sanitizeKatexInput(rawTex);
  if (!check.valid) {
    return {
      ok: false,
      html: "",
      fallbackText: check.value,
      errorProtected: true,
      reason: check.reason,
    };
  }
  if (UNTRUSTED_TEX_MACRO_RE.test(check.value)) {
    return {
      ok: false,
      html: "",
      fallbackText: check.value,
      errorProtected: true,
      reason: "render_error",
    };
  }

  try {
    const html = katex.renderToString(check.value, {
      ...SAFE_KATEX_OPTIONS,
      displayMode: Boolean(options?.displayMode),
    });
    const flaggedError = html.includes("katex-error") || html.includes("color:#cc0000");
    return {
      ok: !flaggedError,
      html,
      fallbackText: check.value,
      errorProtected: flaggedError,
      reason: flaggedError ? "render_error" : undefined,
    };
  } catch {
    return {
      ok: false,
      html: "",
      fallbackText: check.value,
      errorProtected: true,
      reason: "render_error",
    };
  }
}

/**
 * Detect explicit `$...$` or `$$...$$` math delimiters only.
 * Never heuristically guesses plain text like `a/b` or `H₂O` as KaTeX.
 */
export function hasExplicitMathDelimiters(text: string): boolean {
  if (!text || !text.includes("$")) return false;
  // Block $$...$$ delimiters (non-empty content across one or more lines)
  if (/(^|[^\\])\$\$[\s\S]+?\$\$/.test(text)) {
    return true;
  }
  // Inline $...$ delimiters: require non-space after opening $ and non-digit before closing $,
  // and reject standalone currency patterns like `$50`.
  const inlineMatches = text.matchAll(/(^|[^\\$])\$(?!\s)([^$\n]+?)(?<!\s)\$(?!\d)/g);
  for (const match of inlineMatches) {
    const body = (match[2] ?? "").trim();
    if (!body) continue;
    // Skip pure currency / numeric tokens like "$100" or "$25.50"
    if (/^\d[\d,.\s]*$/.test(body)) continue;
    return true;
  }
  return false;
}

/**
 * Detect dominant natural script direction from the first strong directional letter.
 */
export function inferTextDirection(text: string): "rtl" | "ltr" {
  const sample = String(text ?? "").slice(0, 400);
  for (let i = 0; i < sample.length; i += 1) {
    const ch = sample[i];
    if (ARABIC_CHAR_RE.test(ch)) return "rtl";
    if (LATIN_CHAR_RE.test(ch)) return "ltr";
  }
  return "rtl";
}

function readOptionalAnchorMeta(obj: Record<string, unknown>): StructuredBlockAnchorMeta {
  const meta: StructuredBlockAnchorMeta = {};
  if (typeof obj.blockId === "string" && obj.blockId.trim()) {
    meta.blockId = obj.blockId.trim().slice(0, 120);
  }
  if (typeof obj.conceptId === "string" && obj.conceptId.trim()) {
    meta.conceptId = obj.conceptId.trim().slice(0, 120);
  }
  return meta;
}

export function isStructuredStudyBlock(value: unknown): value is StructuredStudyBlock {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  switch (obj.type) {
    case "explanation":
      return typeof obj.content === "string";
    case "math":
      return typeof obj.tex === "string";
    case "chemistry":
      return typeof obj.equation === "string";
    case "callout":
      return (
        typeof obj.content === "string" &&
        typeof obj.variant === "string" &&
        CALLOUT_VARIANTS.has(obj.variant as StructuredBlockCalloutVariant)
      );
    case "poetry_couplet":
      return typeof obj.hemistich1 === "string" && typeof obj.hemistich2 === "string";
    case "primary_source":
      return typeof obj.quote === "string" && typeof obj.attribution === "string";
    default:
      return false;
  }
}

export function normalizeStructuredBlocks(input: unknown): StructuredStudyBlock[] {
  if (!Array.isArray(input)) return [];
  const out: StructuredStudyBlock[] = [];
  for (const item of input) {
    if (out.length >= MAX_STRUCTURED_BLOCKS_PER_SECTION) break;
    if (!isStructuredStudyBlock(item)) continue;
    const anchor = readOptionalAnchorMeta(item as unknown as Record<string, unknown>);
    if (item.type === "explanation") {
      out.push({
        type: "explanation",
        content: item.content,
        title: typeof item.title === "string" ? item.title : undefined,
        dir: item.dir === "rtl" || item.dir === "ltr" || item.dir === "auto" ? item.dir : undefined,
        ...anchor,
      });
    } else if (item.type === "math") {
      out.push({
        type: "math",
        tex: item.tex,
        display: typeof item.display === "boolean" ? item.display : true,
        caption: typeof item.caption === "string" ? item.caption : undefined,
        ...anchor,
      });
    } else if (item.type === "chemistry") {
      out.push({
        type: "chemistry",
        equation: item.equation,
        tex: typeof item.tex === "string" ? item.tex : undefined,
        caption: typeof item.caption === "string" ? item.caption : undefined,
        display: typeof item.display === "boolean" ? item.display : true,
        ...anchor,
      });
    } else if (item.type === "callout") {
      out.push({
        type: "callout",
        variant: item.variant,
        title: typeof item.title === "string" ? item.title : undefined,
        content: item.content,
        ...anchor,
      });
    } else if (item.type === "poetry_couplet") {
      out.push({
        type: "poetry_couplet",
        hemistich1: item.hemistich1,
        hemistich2: item.hemistich2,
        meter: typeof item.meter === "string" ? item.meter : undefined,
        poet: typeof item.poet === "string" ? item.poet : undefined,
        ...anchor,
      });
    } else if (item.type === "primary_source") {
      out.push({
        type: "primary_source",
        quote: item.quote,
        attribution: item.attribution,
        period: typeof item.period === "string" ? item.period : undefined,
        reliabilityNote: typeof item.reliabilityNote === "string" ? item.reliabilityNote : undefined,
        ...anchor,
      });
    }
  }
  return out;
}
