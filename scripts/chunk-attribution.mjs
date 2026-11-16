/**
 * Chunk attribution: which libraries and data packs actually ride along with a
 * route's initial script set. Prints per-chunk gz size plus detected markers so
 * splitting work targets real weight instead of assumptions.
 */
import { gzipSync } from "node:zlib";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const BASE = process.env.NOATA_BASE_URL || "http://127.0.0.1:3100";
const WEB_ROOT = path.resolve("apps/web");
const ROUTES = process.argv.slice(2);
const NEEDLES = [
  ["katex", /katex/i],
  ["react-markdown", /remark-gfm|react-markdown|micromark/i],
  ["highlight", /highlight\.js|rehype-highlight|hljs/i],
  ["pdfjs", /pdfjs|pdf-lib|pdfkit/i],
  ["quizgecko", /quizgecko|AnkiTSV|anki/i],
  ["packs", /sec1-all-lessons-pack|العلوم المتكاملة|الفلسفة والمنطق/i],
  ["supabase", /supabase/i],
  ["charts", /cartesian-chart|svg-chart/i],
  ["docx", /docx|pptx|xlsx/i],
];

function fileFor(url) {
  return path.join(WEB_ROOT, ".next", url.split("?")[0].replace(/^\/_next\//, ""));
}

for (const route of ROUTES) {
  const html = await (await fetch(`${BASE}${route}`, { headers: { "Accept-Language": "en" } })).text();
  const urls = [...new Set([...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1]))];
  const rows = [];
  let total = 0;
  for (const url of urls) {
    const file = fileFor(url);
    if (!existsSync(file)) continue;
    const source = readFileSync(file, "utf8");
    const gz = gzipSync(source, { level: 9 }).length / 1024;
    total += gz;
    rows.push({
      kb: Math.round(gz * 10) / 10,
      chunk: path.basename(url),
      markers: NEEDLES.filter(([, re]) => re.test(source)).map(([name]) => name),
    });
  }
  rows.sort((a, b) => b.kb - a.kb);
  console.log(`\n### ${route} — ${Math.round(total * 10) / 10} KB gz, ${rows.length} scripts`);
  for (const row of rows.slice(0, 10)) {
    console.log(`${String(row.kb).padStart(7)} KB  ${row.chunk.padEnd(26)} ${row.markers.join(",")}`);
  }
}
