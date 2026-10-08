import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";

export const MAX_PDF_EXPORT_CHARS = 100_000;
export function validatePdfInput(value: unknown): value is {text: string; title?: string} {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.text === "string" && !!v.text.trim() && v.text.length <= MAX_PDF_EXPORT_CHARS &&
    (v.title === undefined || (typeof v.title === "string" && v.title.length <= 120));
}
export function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"})[c]!);
}
/** Raw HTML is discarded. JavaScript, remote images and styles cannot enter the renderer. */
export async function documentHtml(text: string, title: string, fonts: {arabic: string; latin: string}) {
  if (!validatePdfInput({text, title})) throw new Error("Invalid PDF document");
  const content = await unified().use(remarkParse).use(remarkGfm).use(remarkMath)
    .use(remarkRehype).use(rehypeKatex, {output: "mathml", strict: "ignore", trust: false})
    .use(() => (tree: any) => {
      function visit(node: any) {
        if (node.tagName === "img") { node.tagName = "span"; node.children = [{type:"text", value: String(node.properties?.alt ?? "صورة") }]; node.properties = {}; }
        if (node.tagName === "a") { node.tagName = "span"; node.properties = {}; }
        for (const child of node.children ?? []) visit(child);
      }
      visit(tree);
    }).use(rehypeStringify).process(text);
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:"><title>${escapeHtml(title)}</title><style>
  @font-face{font-family:Noata;src:url(data:font/woff2;base64,${fonts.arabic}) format('woff2');font-weight:200 1000;unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF}
  @font-face{font-family:Noata;src:url(data:font/woff2;base64,${fonts.latin}) format('woff2');font-weight:200 1000}
  @page{size:A4;margin:22mm 18mm 22mm}*{box-sizing:border-box}body{margin:0;color:#081a3d;font:11pt/1.9 Noata,sans-serif;overflow-wrap:anywhere}h1,h2,h3,h4{line-height:1.6;break-after:avoid;color:#07285a}h1{font-size:25pt}h2{font-size:17pt;border-bottom:1px solid #d9e8f7;padding-bottom:6pt}h3{font-size:13pt}p{orphans:3;widows:3}li{break-inside:avoid}table{border-collapse:collapse;width:100%;font-size:10pt;table-layout:fixed}thead{display:table-header-group}tr{break-inside:avoid}th,td{padding:7pt;border:1px solid #ccddeb;text-align:start;vertical-align:top}th{background:#edf6ff}blockquote{margin:12pt 0;border-inline-start:3pt solid #009aff;padding-inline-start:12pt;color:#354966}pre,code{direction:ltr;unicode-bidi:isolate;font-family:monospace;font-size:9pt}pre{white-space:pre-wrap;background:#f1f5fa;padding:10pt}ul,ol{padding-inline-start:20pt}math{direction:ltr}math[display=block]{display:block;overflow-wrap:normal;margin:12pt 0}hr{border:0;border-top:1px solid #ccddeb;margin:18pt 0}.document-title{margin-bottom:18pt}.document-brand{font-size:9pt;color:#2365a0;letter-spacing:.12em}
  </style></head><body><header class="document-title"><div class="document-brand" dir="ltr">NOATA · LEARN. GROW. ACHIEVE.</div><h1>${escapeHtml(title)}</h1></header><main>${String(content)}</main></body></html>`;
}
