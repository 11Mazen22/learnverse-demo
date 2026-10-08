/**
 * Noata Arabic-first PDF generator.
 *
 * Pipeline: Markdown subset -> blocks -> inline runs -> bidi levels (Unicode UBA via bidi-js)
 * -> per-script font fallback -> OpenType shaping (fontkit through pdfkit) -> greedy line breaking
 * -> visual reordering per line -> paginated drawing with header/footer/page numbers.
 *
 * Every drawn line is wrapped in marked content carrying /ActualText in logical order, so copy/paste
 * and text extraction return real Arabic instead of presentation-form glyph soup.
 *
 * Honest limits: no kashida justification (right-aligned ragged text), no images, no nested lists deeper
 * than visual indentation, math is a readable Unicode rendering of common LaTeX, not a typesetting engine.
 */
import PDFDocument from "pdfkit";
import * as fontkit from "fontkit";
import bidiFactory from "bidi-js";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

export const PDF_MAX_CHARACTERS = 120_000;
export const PDF_MAX_PAGES = 120;

export interface ArabicPdfInput {
  title: string;
  markdown: string;
  author?: string;
  subject?: string;
  /** Defaults to now. Pass a fixed value in tests for reproducibility. */
  date?: Date;
  /** "rtl" (default for Arabic text), "ltr", or "auto" which follows each paragraph's first strong character. */
  direction?: "rtl" | "ltr" | "auto";
}
export interface ArabicPdfResult {
  bytes: Uint8Array;
  pageCount: number;
}

type FontKey = "ar" | "arB" | "lat" | "latB" | "math";
const FONT_FILES: Record<FontKey, string> = {
  ar: "cairo-arabic-400-normal.woff",
  arB: "cairo-arabic-700-normal.woff",
  lat: "cairo-latin-400-normal.woff",
  latB: "cairo-latin-700-normal.woff",
  math: "noto-sans-math-latin-400-normal.woff",
};

const COLORS = {
  ink: "#0B1630",
  muted: "#55627C",
  navy: "#05204F",
  blue: "#0A84FF",
  rule: "#D5DDEB",
  tint: "#EEF4FF",
  codeBg: "#F3F5F9",
};

const bidi = bidiFactory();
let fontBufferCache: Record<FontKey, Buffer> | null = null;
let parsedCache: Record<FontKey, any> | null = null;

function fontDirectoryCandidates(): string[] {
  const dirs: string[] = [];
  if (process.env.NOATA_PDF_FONT_DIR) dirs.push(process.env.NOATA_PDF_FONT_DIR);
  dirs.push(path.join(process.cwd(), "lib", "pdf", "fonts"));
  dirs.push(path.join(process.cwd(), "apps", "web", "lib", "pdf", "fonts"));
  try {
    dirs.push(path.join(path.dirname(fileURLToPath(import.meta.url)), "fonts"));
  } catch {
    /* bundlers may not provide a file URL */
  }
  return dirs;
}
function loadFontBuffers(): Record<FontKey, Buffer> {
  if (fontBufferCache) return fontBufferCache;
  for (const dir of fontDirectoryCandidates()) {
    if (!fs.existsSync(path.join(/* turbopackIgnore: true */ dir, FONT_FILES.ar))) continue;
    const out = {} as Record<FontKey, Buffer>;
    for (const key of Object.keys(FONT_FILES) as FontKey[]) out[key] = fs.readFileSync(path.join(/* turbopackIgnore: true */ dir, FONT_FILES[key]));
    fontBufferCache = out;
    return out;
  }
  throw new Error("Noata PDF fonts were not found. Set NOATA_PDF_FONT_DIR or include lib/pdf/fonts in the deployment.");
}
function parsedFonts() {
  if (parsedCache) return parsedCache;
  const buffers = loadFontBuffers();
  const out = {} as Record<FontKey, any>;
  for (const key of Object.keys(buffers) as FontKey[]) out[key] = (fontkit as any).create(buffers[key]);
  parsedCache = out;
  return out;
}


/* ---------------------------------------------------------------- extraction-safe font embedding */

/**
 * pdfkit maps ToUnicode by glyph id, so a glyph shared by several characters (alef / alef-with-hamza,
 * dotted and undotted bases, marks) extracts as the wrong letter or as control characters.
 * This gives every (glyph, source-characters) pair its own CID, resolved to the real glyph through a
 * CIDToGIDMap, so ToUnicode is exact. Rendering is untouched.
 */
function installExtractionSafeEncoding(font: any) {
  if (font.__noataCids) return;
  const cidKey = new Map<string, number>();
  const cidToGid: number[] = [0];
  font.__noataCids = true;
  font.__mirror = null as Map<number, number> | null;
  // fontkit picks the run direction from the script, and Arabic-Indic digits belong to the Arabic script,
  // which would reverse "٢٠٢٦" visually. Numbers are always laid out left-to-right.
  font.layoutRun = function (text: string, features?: string[]) {
    const numeric = /^[\p{Nd}\u066B\u066C.,:\/+\-−%\s]*$/u.test(text) && /\p{Nd}/u.test(text);
    const run = this.font.layout(text, features, undefined, undefined, numeric ? "ltr" : undefined);
    for (let i = 0; i < run.positions.length; i++) {
      const position = run.positions[i];
      for (const key in position) position[key] *= this.scale;
      position.advanceWidth = run.glyphs[i].advanceWidth * this.scale;
    }
    return run;
  };
  font.encode = function (text: string, features?: string[]) {
    const { glyphs, positions } = this.layout(text, features);
    const res: string[] = [];
    for (let i = 0; i < glyphs.length; i++) {
      const glyph = glyphs[i];
      let codePoints: number[] = Array.isArray(glyph.codePoints) ? glyph.codePoints : [];
      // Mirrored brackets are drawn with the opposite glyph in right-to-left runs; extract the logical one.
      if (this.__mirror && codePoints.length === 1 && this.__mirror.has(codePoints[0])) codePoints = [this.__mirror.get(codePoints[0])!];
      const key = glyph.id + ":" + codePoints.join(",");
      let cid = cidKey.get(key);
      if (cid === undefined) {
        cid = cidToGid.length;
        cidKey.set(key, cid);
        cidToGid.push(this.subset.includeGlyph(glyph.id));
        this.widths[cid] = glyph.advanceWidth * this.scale;
        // PDF.js (and others) reverse each right-to-left chunk assuming visual order, which would also
        // flip the characters inside one ligature glyph (e.g. lam-alef). Store those pre-reversed.
        const arabicLigature = codePoints.length > 1 && codePoints.every((c) => isArabicScript(c));
        this.unicode[cid] = codePoints.length ? (arabicLigature ? [...codePoints].reverse() : codePoints) : [0xfffd];
      }
      res.push(("0000" + cid.toString(16)).slice(-4));
    }
    return [res, positions];
  };
  const originalEmbed = font.embed;
  font.embed = function () {
    // Re-run pdfkit's own embed, but hand it a CIDToGIDMap through a document-ref interception.
    const doc = this.document;
    const map = Buffer.alloc(cidToGid.length * 2);
    cidToGid.forEach((gid, cid) => map.writeUInt16BE(gid, cid * 2));
    const mapRef = doc.ref();
    mapRef.end(map);
    const originalRef = doc.ref;
    doc.ref = function (data?: any) {
      if (data && data.Subtype === "CIDFontType2" && data.CIDToGIDMap === "Identity") data.CIDToGIDMap = mapRef;
      return originalRef.call(this, data);
    };
    try {
      return originalEmbed.call(this);
    } finally {
      doc.ref = originalRef;
    }
  };
}

/* ---------------------------------------------------------------- character classes */

function isArabicScript(cp: number) {
  return (cp >= 0x0600 && cp <= 0x06ff) || (cp >= 0x0750 && cp <= 0x077f) || (cp >= 0x08a0 && cp <= 0x08ff) ||
    (cp >= 0xfb50 && cp <= 0xfdff) || (cp >= 0xfe70 && cp <= 0xfeff) || cp === 0x200c || cp === 0x200d;
}
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
export function toArabicIndic(value: number | string) {
  return String(value).replace(/\d/g, (d) => ARABIC_INDIC[Number(d)]);
}

/** Converts the most common LaTeX constructs to readable Unicode. Not a typesetting engine. */
export function latexToUnicode(source: string): string {
  const greek: Record<string, string> = {
    alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", theta: "θ", lambda: "λ", mu: "μ", pi: "π",
    sigma: "σ", phi: "φ", omega: "ω", Delta: "Δ", Sigma: "Σ", Omega: "Ω", Pi: "Π", rho: "ρ", tau: "τ",
  };
  const symbols: Record<string, string> = {
    times: "×", cdot: "·", div: "÷", pm: "±", leq: "≤", le: "≤", geq: "≥", ge: "≥", neq: "≠", ne: "≠", approx: "≈",
    infty: "∞", sum: "∑", int: "∫", partial: "∂", rightarrow: "→", to: "→", leftarrow: "←", Rightarrow: "⇒",
    in: "∈", subset: "⊂", cup: "∪", cap: "∩", forall: "∀", exists: "∃", degree: "°", ldots: "…", dots: "…",
  };
  const sup: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", n: "ⁿ" };
  const sub: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };
  let out = source;
  for (let i = 0; i < 4; i++) {
    out = out.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, (_m, a, b) => "(" + a + ")/(" + b + ")");
    out = out.replace(/\\sqrt\s*\{([^{}]*)\}/g, (_m, a) => "√(" + a + ")");
  }
  out = out.replace(/\\([A-Za-z]+)/g, (m, name) => greek[name] ?? symbols[name] ?? name);
  out = out.replace(/\^\{([^{}]*)\}/g, (_m, a) => [...a].every((c: string) => sup[c]) ? [...a].map((c: string) => sup[c]).join("") : "^(" + a + ")");
  out = out.replace(/\^([0-9n+-])/g, (_m, a) => sup[a]);
  out = out.replace(/_\{([^{}]*)\}/g, (_m, a) => [...a].every((c: string) => sub[c]) ? [...a].map((c: string) => sub[c]).join("") : "_(" + a + ")");
  out = out.replace(/_([0-9])/g, (_m, a) => sub[a]);
  return out.replace(/[{}]/g, "").replace(/\s+/g, " ").trim();
}

/* ---------------------------------------------------------------- markdown model */

type Inline = { text: string; bold?: boolean; code?: boolean; math?: boolean };
type Block =
  | { kind: "heading"; level: 1 | 2 | 3; inlines: Inline[] }
  | { kind: "paragraph"; inlines: Inline[] }
  | { kind: "list"; ordered: boolean; items: Inline[][] }
  | { kind: "quote"; inlines: Inline[] }
  | { kind: "code"; text: string }
  | { kind: "math"; text: string }
  | { kind: "table"; header: Inline[][]; rows: Inline[][][] }
  | { kind: "rule" };

export function parseInlines(source: string): Inline[] {
  const out: Inline[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\$[^$\n]+\$)/g;
  let last = 0;
  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) out.push({ text: source.slice(last, index) });
    const token = match[0];
    if (token.startsWith("**")) out.push({ text: token.slice(2, -2), bold: true });
    else if (token.startsWith("`")) out.push({ text: token.slice(1, -1), code: true });
    else out.push({ text: latexToUnicode(token.slice(1, -1)), math: true });
    last = index + token.length;
  }
  if (last < source.length) out.push({ text: source.slice(last) });
  return out
    .map((r) => (r.bold || r.code || r.math ? r : { ...r, text: r.text.replace(/\*([^*\n]+)\*/g, "$1").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)") }))
    .filter((r) => r.text.length > 0);
}

function splitRow(line: string): string[] {
  let body = line.trim();
  if (body.startsWith("|")) body = body.slice(1);
  if (body.endsWith("|")) body = body.slice(0, -1);
  return body.split("|").map((c) => c.trim());
}

export function parseMarkdown(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "paragraph", inlines: parseInlines(paragraph.join(" ")) });
    paragraph = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) {
      flush();
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) body.push(lines[i++]);
      blocks.push({ kind: "code", text: body.join("\n") });
      continue;
    }
    if (/^\$\$/.test(trimmed)) {
      flush();
      let text = trimmed.slice(2);
      if (text.endsWith("$$") && text.length >= 2) text = text.slice(0, -2);
      else {
        const body = [text];
        i++;
        while (i < lines.length && !lines[i].includes("$$")) body.push(lines[i++]);
        if (i < lines.length) body.push(lines[i].replace(/\$\$.*$/, ""));
        text = body.join(" ");
      }
      blocks.push({ kind: "math", text: latexToUnicode(text) });
      continue;
    }
    if (!trimmed) { flush(); continue; }
    const heading = /^(#{1,6})\s+(.+?)\s*#*$/.exec(trimmed);
    if (heading) {
      flush();
      blocks.push({ kind: "heading", level: Math.min(heading[1].length, 3) as 1 | 2 | 3, inlines: parseInlines(heading[2]) });
      continue;
    }
    if (/^([-*_])(\s*\1){2,}$/.test(trimmed)) { flush(); blocks.push({ kind: "rule" }); continue; }
    if (trimmed.startsWith("|") && i + 1 < lines.length && /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(lines[i + 1].trim())) {
      flush();
      const header = splitRow(trimmed).map(parseInlines);
      i += 2;
      const rows: Inline[][][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(splitRow(lines[i++]).map(parseInlines));
      i--;
      blocks.push({ kind: "table", header, rows });
      continue;
    }
    const bullet = /^([-*+])\s+(.+)$/.exec(trimmed);
    const numbered = /^(\d+)[.)]\s+(.+)$/.exec(trimmed);
    if (bullet || numbered) {
      flush();
      const ordered = !!numbered;
      const items: Inline[][] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const m = ordered ? /^\d+[.)]\s+(.+)$/.exec(t) : /^[-*+]\s+(.+)$/.exec(t);
        if (!m) break;
        items.push(parseInlines(m[1]));
        i++;
      }
      i--;
      blocks.push({ kind: "list", ordered, items });
      continue;
    }
    if (trimmed.startsWith(">")) {
      flush();
      const body: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) body.push(lines[i++].trim().replace(/^>\s?/, ""));
      i--;
      blocks.push({ kind: "quote", inlines: parseInlines(body.join(" ")) });
      continue;
    }
    paragraph.push(trimmed);
  }
  flush();
  return blocks;
}

/* ---------------------------------------------------------------- text layout */

interface Segment {
  text: string;        // logical text
  draw: string;        // text actually drawn (bracket mirroring applied)
  font: FontKey;
  size: number;
  level: number;
  space: boolean;
  width: number;
  color?: string;
}
interface Line { segments: Segment[]; width: number; logical: string }

function firstStrong(text: string): "rtl" | "ltr" {
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (isArabicScript(cp) || (cp >= 0x0590 && cp <= 0x05ff)) return "rtl";
    if (/\p{L}/u.test(ch)) return "ltr";
  }
  return "rtl";
}

class Renderer {
  doc: any;
  fonts = parsedFonts();
  pages = 0;
  y = 0;
  readonly pageW = 595.28;
  readonly pageH = 841.89;
  readonly margin = { top: 92, bottom: 78, side: 56 };
  readonly contentW = 595.28 - 112;
  readonly bodySize = 12.5;
  readonly lineGap = 1.85;
  readonly baseDirection: "rtl" | "ltr" | "auto";
  readonly title: string;

  constructor(input: ArabicPdfInput, date: Date) {
    this.title = input.title;
    this.baseDirection = input.direction ?? "rtl";
    this.doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      bufferPages: true,
      lang: "ar",
      displayTitle: true,
      info: {
        Title: input.title,
        Author: input.author ?? "Noata",
        Subject: input.subject ?? "مستند من Noata",
        Creator: "Noata Aura",
        Producer: "Noata Aura Arabic PDF",
        CreationDate: date,
        ModDate: date,
      },
    });
    const buffers = loadFontBuffers();
    for (const key of Object.keys(buffers) as FontKey[]) {
      this.doc.registerFont(key, buffers[key]);
      this.doc.font(key);
      installExtractionSafeEncoding(this.doc._font);
    }
    this.y = this.margin.top;
  }

  /* font choice per character, with fallback */
  fontFor(ch: string, bold: boolean, preferArabicSpace: boolean): FontKey {
    const cp = ch.codePointAt(0)!;
    if (isArabicScript(cp)) return bold ? "arB" : "ar";
    if (ch === " ") return preferArabicSpace ? (bold ? "arB" : "ar") : bold ? "latB" : "lat";
    const lat = bold ? "latB" : "lat";
    if (this.fonts[lat].hasGlyphForCodePoint(cp)) return lat;
    if (this.fonts.math.hasGlyphForCodePoint(cp)) return "math";
    if (this.fonts.ar.hasGlyphForCodePoint(cp)) return bold ? "arB" : "ar";
    return lat;
  }
  measure(text: string, font: FontKey, size: number): number {
    if (!text) return 0;
    this.doc.font(font).fontSize(size);
    return this.doc.widthOfString(text);
  }

  /** Turns inline runs into bidi-aware, font-assigned segments (spaces are standalone segments). */
  segments(inlines: Inline[], size: number, baseDir: "rtl" | "ltr", boldAll = false, color?: string): Segment[] {
    const full = inlines.map((r) => r.text).join("");
    const levels = full ? bidi.getEmbeddingLevels(full, baseDir).levels : new Uint8Array();
    const out: Segment[] = [];
    let cursor = 0;
    for (const run of inlines) {
      const bold = !!(run.bold || boldAll);
      const chars = [...run.text];
      let buffer = "";
      let bufferFont: FontKey | null = null;
      let bufferLevel = 0;
      let bufferSpace = false;
      const pushBuffer = () => {
        if (!buffer) return;
        const level = bufferLevel;
        let draw = buffer;
        if (level % 2 === 1) draw = [...buffer].map((c) => bidi.getMirroredCharacter(c) ?? c).join("");
        out.push({ text: buffer, draw, font: bufferFont!, size: run.code ? size * 0.92 : size, level, space: bufferSpace, width: 0, color: run.code ? COLORS.navy : color });
        buffer = "";
      };
      for (const ch of chars) {
        const level = levels[cursor] ?? (baseDir === "rtl" ? 1 : 0);
        cursor += ch.length;
        const space = ch === " " || ch === "\t";
        const font = this.fontFor(space ? " " : ch, bold, baseDir === "rtl");
        const effectiveFont: FontKey = run.math && font === "ar" ? "lat" : font;
        if (buffer && (effectiveFont !== bufferFont || level !== bufferLevel || space !== bufferSpace || space)) pushBuffer();
        if (!buffer) { bufferFont = effectiveFont; bufferLevel = level; bufferSpace = space; }
        buffer += ch;
      }
      pushBuffer();
    }
    for (const s of out) s.width = this.measure(s.draw, s.font, s.size);
    return out;
  }

  breakLines(segs: Segment[], width: number): Line[] {
    const lines: Line[] = [];
    let current: Segment[] = [];
    let currentW = 0;
    // group into words (maximal runs of non-space segments)
    const words: Segment[][] = [];
    let spaceBefore: Segment | null = null;
    const wordSpace: (Segment | null)[] = [];
    let word: Segment[] = [];
    for (const s of segs) {
      if (s.space) {
        if (word.length) { words.push(word); wordSpace.push(spaceBefore); word = []; }
        spaceBefore = s;
      } else word.push(s);
    }
    if (word.length) { words.push(word); wordSpace.push(spaceBefore); }
    const commit = () => {
      if (!current.length) return;
      lines.push({ segments: current, width: currentW, logical: current.map((s) => s.text).join("") });
      current = []; currentW = 0;
    };
    words.forEach((w, index) => {
      const ww = w.reduce((a, s) => a + s.width, 0);
      const sp = current.length ? wordSpace[index] : null;
      const spW = sp ? sp.width : 0;
      if (current.length && currentW + spW + ww > width) commit();
      if (ww > width && !current.length) {
        // hard-break an over-long unbreakable token (URL, long code) by characters
        let piece: Segment[] = [];
        let pieceW = 0;
        for (const s of w) {
          for (const ch of [...s.draw]) {
            const cw = this.measure(ch, s.font, s.size);
            if (pieceW + cw > width && piece.length) {
              lines.push({ segments: piece, width: pieceW, logical: piece.map((p) => p.text).join("") });
              piece = []; pieceW = 0;
            }
            piece.push({ ...s, text: ch, draw: ch, width: cw });
            pieceW += cw;
          }
        }
        current = piece; currentW = pieceW;
        return;
      }
      if (sp && current.length) { current.push(sp); currentW += spW; }
      current.push(...w); currentW += ww;
    });
    commit();
    return lines;
  }

  /** UAX#9 L2 on segment levels. */
  visualOrder(segs: Segment[]): Segment[] {
    if (!segs.length) return segs;
    const levels = segs.map((s) => s.level);
    const order = segs.map((_, i) => i);
    const max = Math.max(...levels);
    const minOdd = Math.min(...levels.filter((l) => l % 2 === 1), max + 1);
    for (let l = max; l >= minOdd; l--) {
      for (let i = 0; i < order.length; ) {
        if (levels[order[i]] >= l) {
          let j = i;
          while (j < order.length && levels[order[j]] >= l) j++;
          const slice = order.slice(i, j).reverse();
          order.splice(i, j - i, ...slice);
          i = j;
        } else i++;
      }
    }
    return order.map((i) => segs[i]);
  }

  ensure(height: number) {
    if (this.y + height > this.pageH - this.margin.bottom) this.newPage();
  }
  newPage() {
    if (this.pages > 0) {
      this.doc.addPage();
    }
    this.pages++;
    if (this.pages > PDF_MAX_PAGES) throw new Error("The document exceeds the maximum PDF length of " + PDF_MAX_PAGES + " pages.");
    this.y = this.margin.top;
  }

  drawLine(line: Line, xRight: number, xLeft: number, y: number, dir: "rtl" | "ltr", align: "start" | "center") {
    const ordered = this.visualOrder(line.segments);
    let x: number;
    if (align === "center") x = (xLeft + xRight) / 2 - line.width / 2;
    else x = dir === "rtl" ? xRight - line.width : xLeft;
    // Positions follow the visual order; the content stream is written in LOGICAL order so extractors
    // (PDF.js, Poppler, Acrobat) read words in reading order instead of left-to-right pixel order.
    const placed = new Map<Segment, number>();
    for (const s of ordered) { placed.set(s, x); x += s.width; }
    for (const s of line.segments) {
      this.doc.fillColor(s.color ?? COLORS.ink).font(s.font).fontSize(s.size);
      const font = this.doc._font;
      if (s.draw !== s.text) {
        const map = new Map<number, number>();
        const drawn = [...s.draw], logical = [...s.text];
        drawn.forEach((c, i) => { if (c !== logical[i]) map.set(c.codePointAt(0)!, logical[i].codePointAt(0)!); });
        font.__mirror = map;
      }
      this.doc.text(s.draw, placed.get(s)!, y, { lineBreak: false, baseline: "alphabetic" });
      font.__mirror = null;
    }
  }

  dirFor(text: string): "rtl" | "ltr" {
    return this.baseDirection === "auto" ? firstStrong(text) : this.baseDirection;
  }

  /** Lays out and draws a paragraph. Returns nothing; advances y and paginates. */
  paragraph(inlines: Inline[], opts: { size?: number; bold?: boolean; color?: string; x?: number; width?: number; after?: number; keepNext?: boolean; align?: "start" | "center"; widow?: boolean } = {}) {
    const size = opts.size ?? this.bodySize;
    const width = opts.width ?? this.contentW;
    const left = opts.x ?? this.margin.side;
    const plain = inlines.map((r) => r.text).join("");
    const dir = this.dirFor(plain);
    const segs = this.segments(inlines, size, dir, opts.bold, opts.color);
    const lines = this.breakLines(segs, width);
    const lineH = size * this.lineGap;
    const widow = opts.widow !== false;
    for (let i = 0; i < lines.length; i++) {
      const remaining = lines.length - i;
      let need = lineH;
      if (i === 0 && opts.keepNext) need += lineH * 2;
      if (widow && lines.length >= 3) {
        if (i === 0) need = Math.max(need, lineH * 2);                    // keep >=2 lines at the bottom
        if (remaining === 2) need = Math.max(need, lineH * 2);            // never strand a lone last line
      }
      this.ensure(need);
      this.drawLine(lines[i], left + width, left, this.y + size * 1.15, dir, opts.align ?? "start");
      this.y += lineH;
    }
    this.y += opts.after ?? size * 0.75;
    return lines.length;
  }

  heading(level: 1 | 2 | 3, inlines: Inline[]) {
    const size = level === 1 ? 24 : level === 2 ? 18 : 14.5;
    this.y += level === 1 ? 6 : 10;
    this.ensure(size * this.lineGap * 3);
    const startY = this.y;
    const plain = inlines.map((r) => r.text).join("");
    const dir = this.dirFor(plain);
    if (level <= 2) {
      const barX = dir === "rtl" ? this.margin.side + this.contentW - 4 : this.margin.side;
      this.doc.save().rect(barX, startY + 3, 4, size * 1.35).fill(COLORS.blue).restore();
    }
    const inset = level <= 2 ? 14 : 0;
    this.paragraph(inlines, {
      size, bold: true, color: COLORS.navy, keepNext: true, after: size * 0.35,
      x: this.margin.side + (dir === "ltr" ? inset : 0), width: this.contentW - inset,
    });
    if (level === 1) {
      this.doc.save().moveTo(this.margin.side, this.y).lineTo(this.margin.side + this.contentW, this.y).lineWidth(0.8).strokeColor(COLORS.rule).stroke().restore();
      this.y += 10;
    }
  }

  list(ordered: boolean, items: Inline[][]) {
    items.forEach((item, index) => {
      const plain = item.map((r) => r.text).join("");
      const dir = this.dirFor(plain);
      const marker = ordered ? (dir === "rtl" ? toArabicIndic(index + 1) + "." : String(index + 1) + ".") : "•";
      const indent = 26;
      const markerSeg: Inline[] = [{ text: marker, bold: ordered }];
      this.ensure(this.bodySize * this.lineGap * 2);
      const markerY = this.y + this.bodySize * 1.15;
      const msegs = this.segments(markerSeg, this.bodySize, dir, ordered, ordered ? COLORS.blue : COLORS.blue);
      const mw = msegs.reduce((a, s) => a + s.width, 0);
      const markerX = dir === "rtl" ? this.margin.side + this.contentW - mw : this.margin.side;
      for (const s of msegs) {
        this.doc.fillColor(COLORS.blue).font(s.font).fontSize(s.size).text(s.draw, markerX, markerY, { lineBreak: false, baseline: "alphabetic" });
      }
      this.paragraph(item, {
        x: this.margin.side + (dir === "ltr" ? indent : 0), width: this.contentW - indent, after: this.bodySize * 0.35, widow: false,
      });
    });
    this.y += this.bodySize * 0.4;
  }

  quote(inlines: Inline[]) {
    const plain = inlines.map((r) => r.text).join("");
    const dir = this.dirFor(plain);
    const startPage = this.pages;
    const startY = this.y;
    this.y += 6;
    this.paragraph(inlines, { size: this.bodySize, color: COLORS.muted, x: this.margin.side + (dir === "ltr" ? 16 : 0), width: this.contentW - 16, after: 4 });
    if (this.pages === startPage) {
      const barX = dir === "rtl" ? this.margin.side + this.contentW - 3 : this.margin.side;
      this.doc.save().rect(barX, startY + 4, 3, this.y - startY - 6).fill(COLORS.blue).restore();
    }
    this.y += 6;
  }

  code(text: string) {
    const size = 10;
    const lineH = size * 1.55;
    const width = this.contentW - 20;
    const rows: Line[] = [];
    for (const raw of text.split("\n")) {
      const segs = this.segments([{ text: raw.replace(/\t/g, "  "), code: true }], size, "ltr");
      // preserve leading indentation: segments() makes spaces separate, which breakLines keeps inside a line
      const broken = this.breakLines(segs.length ? segs : [], width);
      if (broken.length) rows.push(...broken); else rows.push({ segments: [], width: 0, logical: "" });
    }
    let index = 0;
    while (index < rows.length) {
      this.ensure(lineH * 3 + 12);
      const fit = Math.max(1, Math.floor((this.pageH - this.margin.bottom - this.y - 12) / lineH));
      const chunk = rows.slice(index, index + fit);
      const boxH = chunk.length * lineH + 12;
      this.doc.save().roundedRect(this.margin.side, this.y, this.contentW, boxH, 5).fill(COLORS.codeBg).restore();
      let yy = this.y + 6;
      for (const row of chunk) {
        this.drawLine(row, this.margin.side + this.contentW, this.margin.side + 10, yy + size * 1.1, "ltr", "start");
        yy += lineH;
      }
      this.y += boxH + 6;
      index += chunk.length;
    }
    this.y += 4;
  }

  math(text: string) {
    this.ensure(this.bodySize * this.lineGap * 2.5);
    this.doc.save().roundedRect(this.margin.side, this.y, this.contentW, this.bodySize * this.lineGap * 1.6, 8).fill(COLORS.tint).restore();
    this.y += this.bodySize * 0.35;
    const segs = this.segments([{ text, math: true }], this.bodySize + 1.5, "ltr");
    const lines = this.breakLines(segs, this.contentW - 24);
    for (const line of lines) {
      this.drawLine(line, this.margin.side + this.contentW, this.margin.side, this.y + 17, "ltr", "center");
      this.y += this.bodySize * this.lineGap;
    }
    this.y += this.bodySize * 1.1;
  }

  table(header: Inline[][], rows: Inline[][][]) {
    const columns = Math.max(header.length, ...rows.map((r) => r.length), 1);
    const widths = this.columnWidths(header, rows, columns);
    const size = 11;
    const padding = 7;
    const plainHeader = header.map((c) => c.map((r) => r.text).join("")).join(" ");
    const dir = this.baseDirection === "auto" ? firstStrong(plainHeader) : this.baseDirection;
    const colX: number[] = [];
    let cursor = dir === "rtl" ? this.margin.side + this.contentW : this.margin.side;
    for (let c = 0; c < columns; c++) {
      if (dir === "rtl") { cursor -= widths[c]; colX.push(cursor); } else { colX.push(cursor); cursor += widths[c]; }
    }
    const measureRow = (cells: Inline[][], bold: boolean) => cells.map((cell, c) => {
      const segs = this.segments(cell, size, dir, bold, bold ? "#FFFFFF" : undefined);
      return this.breakLines(segs, widths[c] - padding * 2);
    });
    const drawRow = (cells: Inline[][], bold: boolean, striped: boolean) => {
      const wrapped = measureRow(cells, bold);
      const rowLines = Math.max(1, ...wrapped.map((w) => w.length));
      const lineH = size * 1.75;
      const rowH = rowLines * lineH + padding * 1.2;
      this.ensure(rowH + 4);
      if (bold) this.doc.save().rect(this.margin.side, this.y, this.contentW, rowH).fill(COLORS.navy).restore();
      else if (striped) this.doc.save().rect(this.margin.side, this.y, this.contentW, rowH).fill(COLORS.tint).restore();
      wrapped.forEach((lines, c) => {
        lines.forEach((line, i) => {
          this.drawLine(line, colX[c] + widths[c] - padding, colX[c] + padding, this.y + padding * 0.6 + i * lineH + size * 1.15, dir, "start");
        });
      });
      this.doc.save().lineWidth(0.6).strokeColor(COLORS.rule);
      this.doc.moveTo(this.margin.side, this.y + rowH).lineTo(this.margin.side + this.contentW, this.y + rowH).stroke();
      colX.forEach((x) => this.doc.moveTo(x, this.y).lineTo(x, this.y + rowH).stroke());
      const edge = dir === "rtl" ? this.margin.side : this.margin.side + this.contentW;
      this.doc.moveTo(edge, this.y).lineTo(edge, this.y + rowH).stroke();
      const outer = dir === "rtl" ? this.margin.side + this.contentW : this.margin.side;
      this.doc.moveTo(outer, this.y).lineTo(outer, this.y + rowH).stroke();
      this.doc.restore();
      this.y += rowH;
    };
    this.y += 4;
    this.ensure(size * 1.75 * 4 + padding * 4);
    const normalize = (cells: Inline[][]) => Array.from({ length: columns }, (_, i) => cells[i] ?? []);
    drawRow(normalize(header), true, false);
    rows.forEach((row, i) => {
      const before = this.pages;
      const cells = normalize(row);
      const probeHeight = Math.max(1, ...measureRow(cells, false).map((w) => w.length)) * size * 1.75 + padding * 1.2;
      if (this.y + probeHeight > this.pageH - this.margin.bottom) {
        this.newPage();
        drawRow(normalize(header), true, false); // repeat header row on the next page
      }
      void before;
      drawRow(cells, false, i % 2 === 1);
    });
    this.y += 12;
  }

  columnWidths(header: Inline[][], rows: Inline[][][], columns: number): number[] {
    const sample = [header, ...rows.slice(0, 40)];
    const weights = Array.from({ length: columns }, (_, c) => {
      const longest = Math.max(...sample.map((r) => (r[c] ?? []).map((x) => x.text).join("").length), 4);
      return Math.min(Math.max(longest, 6), 34);
    });
    const total = weights.reduce((a, b) => a + b, 0);
    return weights.map((w) => (w / total) * this.contentW);
  }

  rule() {
    this.y += 6;
    this.ensure(10);
    this.doc.save().moveTo(this.margin.side, this.y).lineTo(this.margin.side + this.contentW, this.y).lineWidth(0.8).strokeColor(COLORS.rule).stroke().restore();
    this.y += 12;
  }

  titleBlock(date: Date) {
    this.newPage();
    const dir = this.dirFor(this.title);
    this.doc.save().rect(this.margin.side, this.y, this.contentW, 3).fill(COLORS.blue).restore();
    this.y += 20;
    this.paragraph([{ text: this.title }], { size: 28, bold: true, color: COLORS.navy, after: 4 });
    const dateText = new Intl.DateTimeFormat("ar-EG", { dateStyle: "long", timeZone: "UTC" }).format(date);
    this.paragraph([{ text: dateText + " · Noata" }], { size: 11, color: COLORS.muted, after: 14 });
    void dir;
    this.rule();
  }

  /** Header and footer need the final page count, so they are painted after layout. */
  decoratePages() {
    const range = this.doc.bufferedPageRange();
    const total = range.count;
    for (let i = 0; i < total; i++) {
      this.doc.switchToPage(range.start + i);
      const brandSegs = this.segments([{ text: "نوتة", bold: true }, { text: " · Noata", bold: true }], 12, "rtl", true, COLORS.navy);
      const bw = brandSegs.reduce((a, s) => a + s.width, 0);
      const bx = this.margin.side + this.contentW - bw;
      let x = bx;
      for (const s of this.visualOrder(brandSegs)) {
        if (!s.space) this.doc.fillColor(s.color ?? COLORS.navy).font(s.font).fontSize(s.size).text(s.draw, x, 40, { lineBreak: false });
        x += s.width;
      }
      const shortTitle = this.title.length > 60 ? this.title.slice(0, 57) + "…" : this.title;
      const tdir = firstStrong(shortTitle);
      const tsegs = this.segments([{ text: shortTitle }], 9.5, tdir, false, COLORS.muted);
      const tw = tsegs.reduce((a, s) => a + s.width, 0);
      let tx = this.margin.side;
      if (tw > this.contentW - bw - 24) tx = this.margin.side; // long titles stay on the left, truncated above
      for (const s of this.visualOrder(tsegs)) {
        if (!s.space) this.doc.fillColor(COLORS.muted).font(s.font).fontSize(s.size).text(s.draw, tx, 43, { lineBreak: false });
        tx += s.width;
      }
      this.doc.save().moveTo(this.margin.side, 64).lineTo(this.margin.side + this.contentW, 64).lineWidth(0.7).strokeColor(COLORS.rule).stroke().restore();
      this.doc.save().moveTo(this.margin.side, this.pageH - 54).lineTo(this.margin.side + this.contentW, this.pageH - 54).lineWidth(0.7).strokeColor(COLORS.rule).stroke().restore();
      const label = "صفحة " + toArabicIndic(i + 1) + " من " + toArabicIndic(total);
      const fsegs = this.segments([{ text: label }], 10, "rtl", false, COLORS.muted);
      const fw = fsegs.reduce((a, s) => a + s.width, 0);
      let fx = this.margin.side + this.contentW / 2 - fw / 2;
      for (const s of this.visualOrder(fsegs)) {
        if (!s.space) this.doc.fillColor(COLORS.muted).font(s.font).fontSize(s.size).text(s.draw, fx, this.pageH - 44, { lineBreak: false });
        fx += s.width;
      }
    }
  }
}

/* ---------------------------------------------------------------- public API */

export async function generateArabicPdf(input: ArabicPdfInput): Promise<ArabicPdfResult> {
  const markdown = (input.markdown ?? "").toString();
  const title = (input.title || "مستند Noata").trim().slice(0, 160) || "مستند Noata";
  if (!markdown.trim()) throw new Error("لا يوجد محتوى لإنشاء ملف PDF.");
  if (markdown.length > PDF_MAX_CHARACTERS) throw new Error("المستند أطول من الحد المسموح (" + PDF_MAX_CHARACTERS.toLocaleString("en-US") + " حرف).");
  const date = input.date ?? new Date();
  const renderer = new Renderer({ ...input, title }, date);
  const chunks: Buffer[] = [];
  renderer.doc.on("data", (c: Buffer) => chunks.push(c));
  const finished = new Promise<void>((resolve, reject) => {
    renderer.doc.on("end", () => resolve());
    renderer.doc.on("error", reject);
  });
  renderer.titleBlock(date);
  for (const block of parseMarkdown(markdown)) {
    switch (block.kind) {
      case "heading": renderer.heading(block.level, block.inlines); break;
      case "paragraph": renderer.paragraph(block.inlines); break;
      case "list": renderer.list(block.ordered, block.items); break;
      case "quote": renderer.quote(block.inlines); break;
      case "code": renderer.code(block.text); break;
      case "math": renderer.math(block.text); break;
      case "table": renderer.table(block.header, block.rows); break;
      case "rule": renderer.rule(); break;
    }
  }
  renderer.decoratePages();
  const pageCount = renderer.doc.bufferedPageRange().count;
  renderer.doc.end();
  await finished;
  return { bytes: new Uint8Array(Buffer.concat(chunks)), pageCount };
}
