/**
 * Verifies the code-split interactive surfaces still mount on demand: loads each
 * view that used to be shipped eagerly, waits for its lazy chunk, and asserts the
 * placeholder is gone, the panel rendered, and no runtime error occurred.
 *
 * Usage: node scripts/split-verify.mjs
 */
import { createRequire } from "node:module";
const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
const puppeteer = require("puppeteer-core");

const BASE = process.env.NOATA_BASE_URL || "http://127.0.0.1:3100";
const CHROME =
  process.env.NOATA_CHROMIUM_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const VIEWS = [
  { path: "/study", label: "study generator (default)", expect: /AI Studio|توليد ذكي/i },
  { path: "/study?tab=review&mode=spaced", label: "flashcard studio", expect: /Rate|تقييم|Spaced|متباعد/i },
  { path: "/study?tab=review&mode=speed_match", label: "speed match", expect: /Speed Match|المطابقة السريعة/i },
  { path: "/study?tab=review&mode=mistake_hub", label: "mistake hub", expect: /Mistake|الأخطاء|Interleaved|موزع/i },
  { path: "/study?tab=quiz", label: "quiz tab", expect: /quiz|اختبار/i },
  { path: "/review", label: "review session", expect: /review|مراجع|question|سؤال/i },
  { path: "/lesson/sci-1-1", label: "lesson stage", expect: /stage|مرحلة|lesson|درس/i },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const results = [];
for (const view of VIEWS) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });
  const errors = [];
  const lazyChunks = new Set();
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text().slice(0, 160)}`);
  });
  page.on("response", (res) => {
    const url = res.url();
    if (url.includes("/_next/static/chunks/") && res.status() === 200) {
      lazyChunks.add(url.split("/").pop());
    }
  });
  await page.goto(`${BASE}${view.path}`, { waitUntil: "networkidle2", timeout: 30000 });
  // Give lazy chunks a beat to resolve, then assert the placeholder cleared.
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const state = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      busy: document.querySelectorAll('[aria-busy="true"]').length,
      text: text.slice(0, 4000),
      length: text.length,
    };
  });
  const ok = state.length > 400 && state.busy === 0 && view.expect.test(state.text) && errors.length === 0;
  results.push({ view: view.label, path: view.path, ok, busy: state.busy, textLength: state.length, errors, chunks: lazyChunks.size });
  await page.close();
}
await browser.close();

let failed = 0;
for (const result of results) {
  if (!result.ok) failed += 1;
  console.log(
    `${result.ok ? "PASS" : "FAIL"}  ${result.view.padEnd(26)} text=${String(result.textLength).padStart(5)} ` +
      `pendingPlaceholders=${result.busy} chunks=${result.chunks}` +
      (result.errors.length ? `\n      errors: ${result.errors.slice(0, 3).join(" | ")}` : ""),
  );
}
console.log(`\n${results.length - failed}/${results.length} views mounted cleanly`);
process.exit(failed === 0 ? 0 : 1);
