/**
 * Core Web Vitals + initial JS weight per route, measured on the production
 * server. Each route gets a brand-new tab so a previous navigation can never
 * pollute the layout-shift or paint timeline.
 *
 * Guards: no synthetic scrolling and no DOM mutation before the numbers are
 * read, so CLS reflects only what a visitor actually sees while loading.
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
const puppeteer = require("puppeteer-core");

const BASE = process.env.NOATA_BASE_URL || "http://127.0.0.1:3100";
const CHROME =
  process.env.NOATA_CHROME ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const ROUTES = [
  "/",
  "/learn",
  "/lesson/sci-1-1",
  "/study",
  "/review",
  "/assignments",
  "/ai",
  "/settings",
  "/teacher",
  "/admin",
  "/landing",
  "/help",
  "/quran",
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const rows = [];
for (const route of ROUTES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });
  await page.setCookie({ name: "noata_locale", value: "en", url: BASE });
  await page.evaluateOnNewDocument(() => {
    window.__v = { lcp: 0, cls: 0, events: [], shifts: [] };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__v.lcp = Math.max(window.__v.lcp, e.startTime);
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__v.cls += e.value;
        window.__v.shifts.push({
          value: Math.round(e.value * 10000) / 10000,
          node: e.sources?.[0]?.node
            ? `${e.sources[0].node.tagName}.${(e.sources[0].node.className ?? "").toString().slice(0, 40)}`
            : null,
        });
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (e.interactionId) window.__v.events.push(Math.round(e.duration));
    }).observe({ type: "event", buffered: true, durationThreshold: 16 });
  });

  let status = 0;
  try {
    const response = await page.goto(`${BASE}${route}`, {
      waitUntil: "networkidle2",
      timeout: 45000,
    });
    status = response?.status() ?? 0;
    // One real keyboard interaction for the INP proxy.
    await page.keyboard.press("Tab");
    await new Promise((r) => setTimeout(r, 900));
    const data = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      let initial = 0;
      let deferred = 0;
      for (const entry of performance.getEntriesByType("resource")) {
        if (!/\.js(\?|$)/.test(entry.name)) continue;
        const bytes = entry.encodedBodySize || entry.transferSize || 0;
        if (entry.responseEnd <= nav.domContentLoadedEventEnd) initial += bytes;
        else deferred += bytes;
      }
      const v = window.__v;
      return {
        lcp: Math.round(v.lcp),
        cls: Math.round(v.cls * 10000) / 10000,
        inp: v.events.length ? Math.max(...v.events) : 0,
        shifts: v.shifts.sort((a, b) => b.value - a.value).slice(0, 3),
        initialJsKb: Math.round((initial / 1024) * 10) / 10,
        deferredJsKb: Math.round((deferred / 1024) * 10) / 10,
      };
    });
    rows.push({ route, status, ...data });
    console.log(
      `${route.padEnd(18)} ${String(status).padEnd(4)} LCP ${String(data.lcp).padStart(4)}ms  CLS ${data.cls
        .toFixed(4)
        .padStart(6)}  INP ${String(data.inp).padStart(3)}ms  initialJS ${String(data.initialJsKb).padStart(7)}KB  deferred ${data.deferredJsKb}KB`,
    );
  } catch (error) {
    rows.push({ route, status, error: String(error).slice(0, 160) });
    console.log(`${route.padEnd(18)} FAILED ${String(error).slice(0, 120)}`);
  } finally {
    await page.close();
  }
}

await browser.close();
mkdirSync("artifacts/phase4", { recursive: true });
writeFileSync(
  path.join("artifacts/phase4", "vitals-report.json"),
  JSON.stringify({ base: BASE, generatedAt: new Date().toISOString(), rows }, null, 2),
);
console.log("\nwrote artifacts/phase4/vitals-report.json");
