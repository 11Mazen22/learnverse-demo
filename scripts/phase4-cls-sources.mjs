/**
 * Reports the DOM nodes that cause layout shifts on the heaviest routes, so CLS
 * work targets the actual culprit instead of guessing.
 */
import { createRequire } from "node:module";
const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
const puppeteer = require("puppeteer-core");

const BASE = process.env.NOATA_BASE_URL || "http://127.0.0.1:3100";
const CHROME =
  process.env.NOATA_CHROMIUM_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
  defaultViewport: { width: 1440, height: 960 },
});
const page = await browser.newPage();
await page.setCookie({ name: "noata_locale", value: "en", url: BASE });

for (const route of ["/ai", "/settings", "/quran", "/help", "/landing"]) {
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("noata:theme:guest", "light");
      localStorage.setItem("noata:palette:guest", "classic");
      localStorage.setItem("noata:motion:guest", "off");
    } catch {}
  });
  await page.evaluateOnNewDocument(() => {
    window.__shifts = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        window.__shifts.push({
          value: Math.round(entry.value * 10000) / 10000,
          at: Math.round(entry.startTime),
          sources: (entry.sources || []).map((s) => ({
            tag: s.node?.tagName ?? null,
            id: s.node?.id ?? null,
            cls: (s.node?.className ?? "").toString().slice(0, 80),
            text: (s.node?.textContent ?? "").trim().slice(0, 60),
          })),
        });
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle2", timeout: 45000 });
  await new Promise((r) => setTimeout(r, 1200));
  const before = await page.evaluate(() => window.__shifts || []);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await new Promise((r) => setTimeout(r, 900));
  const shifts = await page.evaluate(() => window.__shifts || []);
  const total = shifts.reduce((sum, s) => sum + s.value, 0);
  const loadTotal = before.reduce((sum, s) => sum + s.value, 0);
  const focus = await page.evaluate(() => ({
    tag: document.activeElement?.tagName ?? null,
    cls: (document.activeElement?.className ?? "").toString().slice(0, 60),
    id: document.activeElement?.id ?? null,
  }));
  console.log(
    `\n=== ${route} loadOnly=${loadTotal.toFixed(4)} withKeys=${total.toFixed(4)} focus=${JSON.stringify(focus)}`,
  );
  for (const shift of shifts.sort((a, b) => b.value - a.value).slice(0, 4)) {
    console.log(JSON.stringify(shift));
  }
}

await browser.close();
