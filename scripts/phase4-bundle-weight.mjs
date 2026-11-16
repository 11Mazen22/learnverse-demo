/**
 * Initial route JavaScript weight, measured the same way the Phase 0 baseline
 * was: the scripts referenced by the route's own HTML document, gzipped.
 *
 * This avoids two traps: `next start` on this host does not gzip responses (so
 * wire bytes are uncompressed), and Next 16's Turbopack build does not print a
 * per-route "First Load JS" table. Reading the document's own script tags and
 * gzipping those files gives a like-for-like comparison.
 */
import { gzipSync } from "node:zlib";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.NOATA_BASE_URL || "http://127.0.0.1:3100";
const WEB_ROOT = path.resolve("apps/web");
const ROUTES = [
  "/",
  "/learn",
  "/lesson/sci-1-1",
  "/study",
  "/review",
  "/ai",
  "/assignments",
  "/settings",
  "/teacher",
  "/admin",
  "/landing",
  "/help",
  "/quran",
  "/login",
];

function staticPathFor(url) {
  const clean = url.split("?")[0];
  const relative = clean.replace(/^\/_next\//, "");
  return path.join(WEB_ROOT, ".next", relative);
}

const rows = [];
for (const route of ROUTES) {
  const response = await fetch(`${BASE}${route}`, {
    headers: { "Accept-Language": "en" },
  });
  const html = await response.text();
  const urls = new Set();
  for (const match of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.js)"/g)) {
    urls.add(match[1]);
  }
  let gz = 0;
  let raw = 0;
  const missing = [];
  for (const url of urls) {
    const file = staticPathFor(url);
    if (!existsSync(file)) {
      missing.push(url);
      continue;
    }
    const bytes = readFileSync(file);
    raw += bytes.length;
    gz += gzipSync(bytes, { level: 9 }).length;
  }
  rows.push({
    route,
    status: response.status,
    scripts: urls.size,
    gzKb: Math.round((gz / 1024) * 10) / 10,
    rawKb: Math.round((raw / 1024) * 10) / 10,
    missing,
  });
  console.log(
    `${route.padEnd(18)} ${String(response.status).padEnd(4)} scripts ${String(urls.size).padStart(3)}  gz ${String(
      Math.round((gz / 1024) * 10) / 10,
    ).padStart(7)}KB  raw ${Math.round((raw / 1024) * 10) / 10}KB${missing.length ? `  missing ${missing.length}` : ""}`,
  );
}

mkdirSync("artifacts/phase4", { recursive: true });
writeFileSync(
  path.join("artifacts/phase4", "bundle-weight-report.json"),
  JSON.stringify({ base: BASE, generatedAt: new Date().toISOString(), rows }, null, 2),
);
console.log("\nwrote artifacts/phase4/bundle-weight-report.json");
