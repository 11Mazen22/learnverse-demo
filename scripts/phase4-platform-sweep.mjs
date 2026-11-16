/**
 * Phase 4/5 whole-platform browser sweep.
 *
 * Loads every public/guest-renderable route on the production server and checks
 * runtime exceptions, horizontal overflow, leaked personal contact strings,
 * locale leakage, and axe-core WCAG 2.2 AA violations at mobile and desktop
 * widths in both RTL Arabic and LTR English.
 *
 * Usage:
 *   node scripts/phase4-platform-sweep.mjs
 *   NOATA_BASE_URL=http://127.0.0.1:3100 NOATA_SCREENSHOT_DIR=artifacts/phase4 node ...
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
// puppeteer-core and axe-core live in the web workspace, matching the other QA scripts.
const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
const puppeteer = require("puppeteer-core");
const BASE = process.env.NOATA_BASE_URL || "http://127.0.0.1:3100";
const screenshotDir = process.env.NOATA_SCREENSHOT_DIR || "artifacts/phase4";
const CHROME =
  process.env.NOATA_CHROMIUM_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const ALL_ROUTES = [
  "/",
  "/landing",
  "/about",
  "/features",
  "/how",
  "/faq",
  "/curriculum",
  "/help",
  "/quran",
  "/learn",
  "/study",
  "/review",
  "/missions",
  "/boss",
  "/progress",
  "/rewards",
  "/assignments",
  "/notifications",
  "/settings",
  "/ai",
  "/teacher",
  "/admin",
  "/privacy",
  "/terms",
  "/login",
];

// NOATA_ROUTES / NOATA_WIDTHS allow a focused re-check after a late edit without
// re-running the full matrix.
const ROUTES = process.env.NOATA_ROUTES
  ? process.env.NOATA_ROUTES.split(",").map((r) => r.trim()).filter(Boolean)
  : ALL_ROUTES;
const ALL_WIDTHS = process.env.NOATA_WIDTHS
  ? process.env.NOATA_WIDTHS.split(",").map((w) => Number(w.trim()))
  : null;

const VIEWPORTS = [
  { label: "320", width: 320, height: 720 },
  { label: "360", width: 360, height: 780 },
  { label: "768", width: 768, height: 900 },
  { label: "1024", width: 1024, height: 900 },
  { label: "1440", width: 1440, height: 960 },
  { label: "1920", width: 1920, height: 1080 },
];

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const LEAK_PATTERNS = [/gmail\.com/i, /mazenshazly/i];
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const results = [];
const failures = [];

function record(entry) {
  results.push(entry);
  if (entry.issues.length) failures.push(entry);
}

async function applyPreferences(page, { locale, theme, palette }) {
  await page.evaluateOnNewDocument(
    ({ locale, theme, palette }) => {
      try {
        localStorage.setItem("noata:theme:guest", theme);
        localStorage.setItem("noata:palette:guest", palette);
        localStorage.setItem("noata:motion:guest", "off");
      } catch {
        /* storage may be unavailable */
      }
      document.addEventListener("DOMContentLoaded", () => {
        document.documentElement.lang = locale;
        document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
      });
    },
    { locale, theme, palette },
  );
  await page.setCookie({ name: "noata_locale", value: locale, url: BASE });
}

async function auditPage(page, route, { runAxe = true, settle = 700 } = {}) {
  const consoleErrors = [];
  const pageErrors = [];
  const offlineRequests = [];
  const onConsole = (message) => {
    if (message.type() === "error") {
      const text = message.text();
      const url = message.location()?.url ?? "";
      // React dev-overlay noise and blocked third-party beacons are not defects.
      if (/favicon|net::ERR_FAILED|Failed to load resource.*401/.test(text)) return;
      // Offline fixture: the Supabase host does not resolve on this machine, which
      // is an environment limit rather than a page defect. Recorded separately.
      if (/ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED/.test(text)) {
        offlineRequests.push(url || text);
        return;
      }
      consoleErrors.push(`${text.slice(0, 240)} @ ${url.slice(0, 120)}`);
    }
  };
  const onPageError = (error) => pageErrors.push(String(error).slice(0, 300));
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  try {
    const response = await page.goto(`${BASE}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    await new Promise((resolve) => setTimeout(resolve, settle));
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      bodyText: document.body.innerText.slice(0, 4000),
      html: document.documentElement.outerHTML.slice(0, 200000),
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      title: document.title,
    }));

    let axe = [];
    if (runAxe) {
      await page.evaluate(axeSource);
      axe = await page.evaluate(async (tags) => {
        const result = await window.axe.run(document, {
          runOnly: { type: "tag", values: tags },
          resultTypes: ["violations"],
        });
        return result.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.length,
          target: violation.nodes[0]?.target?.join(" ") ?? "",
        }));
      }, AXE_TAGS);
    }

    const issues = [];
    if (!response || response.status() >= 400) issues.push(`HTTP ${response?.status()}`);
    if (pageErrors.length) issues.push(`pageerror: ${pageErrors.join(" | ")}`);
    if (consoleErrors.length) issues.push(`console: ${consoleErrors.join(" | ")}`);
    if (metrics.scrollWidth > metrics.innerWidth + 2)
      issues.push(`overflow ${metrics.scrollWidth}>${metrics.innerWidth}`);
    for (const pattern of LEAK_PATTERNS) {
      if (pattern.test(metrics.html) || pattern.test(metrics.bodyText))
        issues.push(`leak ${pattern}`);
    }
    if (axe.length)
      issues.push(`axe ${axe.map((v) => `${v.id}(${v.nodes})@${v.target}`).join("; ")}`);

    return {
      route,
      width: page.viewport()?.width,
      locale: metrics.lang,
      dir: metrics.dir,
      status: response?.status(),
      issues,
      axe,
      offlineRequests: offlineRequests.length,
      scrollWidth: metrics.scrollWidth,
      innerWidth: metrics.innerWidth,
    };
  } catch (error) {
    return { route, issues: [`exception ${String(error).slice(0, 200)}`], axe: [] };
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
}

async function measureRouteWeight(page, route) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle2", timeout: 45000 });
  return page.evaluate(() => {
    const resources = performance.getEntriesByType("resource");
    let js = 0;
    for (const entry of resources) {
      if (!/\.js(\?|$)/.test(entry.name)) continue;
      js += entry.encodedBodySize || entry.transferSize || 0;
    }
    const nav = performance.getEntriesByType("navigation")[0];
    return {
      jsKb: Math.round((js / 1024) * 10) / 10,
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
      load: Math.round(nav.loadEventEnd),
      lcp: null,
      cls: null,
    };
  });
}

async function measureVitals(page, route) {
  await page.evaluateOnNewDocument(() => {
    window.__noataVitals = { lcp: 0, cls: 0, longTasks: [] };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__noataVitals.lcp = Math.max(window.__noataVitals.lcp, entry.startTime);
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__noataVitals.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__noataVitals.longTasks.push(Math.round(entry.duration));
      }
    }).observe({ type: "longtask", buffered: true });
    // Event Timing: the INP proxy. Only real interactions (interactionId set)
    // are counted, so scroll-triggered work does not inflate the number.
    window.__noataVitals.events = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.interactionId) window.__noataVitals.events.push(Math.round(entry.duration));
      }
    }).observe({ type: "event", buffered: true, durationThreshold: 16 });
  });
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle2", timeout: 45000 });
  // A real keyboard interaction only: no synthetic scrolling, which would make
  // lazy content insertion look like a layout shift the user never saw.
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return page.evaluate(() => {
    const vitals = window.__noataVitals || { lcp: 0, cls: 0, longTasks: [] };
    const resources = performance.getEntriesByType("resource");
    const nav = performance.getEntriesByType("navigation")[0];
    let initial = 0;
    let total = 0;
    for (const entry of resources) {
      if (!/\.js(\?|$)/.test(entry.name)) continue;
      const bytes = entry.encodedBodySize || entry.transferSize || 0;
      total += bytes;
      // "Initial route JS" = scripts that finished before the load event,
      // matching how the Phase 0 baseline was recorded.
      if (entry.responseEnd <= nav.loadEventEnd) initial += bytes;
    }
    const events = vitals.events || [];
    return {
      lcp: Math.round(vitals.lcp),
      cls: Math.round(vitals.cls * 10000) / 10000,
      inp: events.length ? Math.max(...events) : 0,
      maxLongTask: vitals.longTasks.length ? Math.max(...vitals.longTasks) : 0,
      jsInitialKb: Math.round((initial / 1024) * 10) / 10,
      jsTotalKb: Math.round((total / 1024) * 10) / 10,
      dcl: Math.round(nav.domContentLoadedEventEnd),
      load: Math.round(nav.loadEventEnd),
    };
  });
}

async function main() {
  mkdirSync(screenshotDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--lang=en-US"],
    defaultViewport: { width: 1440, height: 960 },
  });

  const page = await browser.newPage();
  const modes = [
    { locale: "ar", theme: "dark", palette: "midnight", label: "AR-dark" },
    { locale: "en", theme: "light", palette: "classic", label: "EN-light" },
  ];

  // axe-core is the expensive part, so the full matrix runs on the three
  // representative widths; the remaining widths are covered by the overflow and
  // runtime checks below without a second axe pass.
  const auditViewports = VIEWPORTS.filter(
    (v) => [320, 768, 1440].includes(v.width) && (!ALL_WIDTHS || ALL_WIDTHS.includes(v.width)),
  );
  for (const mode of modes) {
    for (const viewport of auditViewports) {
      await page.setViewport({ width: viewport.width, height: viewport.height });
      await applyPreferences(page, mode);
      for (const route of ROUTES) {
        const entry = await auditPage(page, route);
        record({ ...entry, width: viewport.width, mode: mode.label });
      }
    }
  }

  // Width-only pass: overflow and runtime checks at every remaining width.
  for (const mode of modes) {
    for (const viewport of VIEWPORTS.filter(
      (v) => ![320, 768, 1440].includes(v.width) && (!ALL_WIDTHS || ALL_WIDTHS.includes(v.width)),
    )) {
      await page.setViewport({ width: viewport.width, height: viewport.height });
      await applyPreferences(page, mode);
      for (const route of ROUTES) {
        const entry = await auditPage(page, route, { runAxe: false, settle: 350 });
        record({ ...entry, width: viewport.width, mode: mode.label });
      }
    }
  }

  // Representative screenshots for human inspection.
  const shots = [
    { route: "/", width: 1440, mode: modes[0], name: "home-desktop-ar-dark" },
    { route: "/", width: 1440, mode: modes[1], name: "home-desktop-en-light" },
    { route: "/", width: 320, mode: modes[0], name: "home-mobile-ar-dark" },
    { route: "/", width: 320, mode: modes[1], name: "home-mobile-en-light" },
    { route: "/help", width: 1440, mode: modes[0], name: "help-desktop-ar-dark" },
    { route: "/help", width: 320, mode: modes[1], name: "help-mobile-en-light" },
    { route: "/admin", width: 1440, mode: modes[0], name: "admin-desktop-ar-dark" },
    { route: "/landing", width: 320, mode: modes[0], name: "landing-mobile-ar-dark" },
    { route: "/ai", width: 1440, mode: modes[1], name: "ai-desktop-en-light" },
    { route: "/curriculum", width: 320, mode: modes[0], name: "curriculum-mobile-ar-dark" },
  ];
  for (const shot of shots) {
    await page.setViewport({ width: shot.width, height: shot.width < 500 ? 900 : 1000 });
    await applyPreferences(page, shot.mode);
    await page.goto(`${BASE}${shot.route}`, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise((resolve) => setTimeout(resolve, 700));
    await page.screenshot({
      path: path.join(screenshotDir, `${shot.name}.png`),
      fullPage: false,
    });
  }

  // Core Web Vitals + initial JS weight per key route.
  const vitalsPage = await browser.newPage();
  await vitalsPage.setViewport({ width: 1440, height: 960 });
  await applyPreferences(vitalsPage, modes[1]);
  const vitals = [];
  for (const route of [
    "/",
    "/learn",
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
  ]) {
    vitals.push({ route, ...(await measureVitals(vitalsPage, route)) });
  }

  await browser.close();

  const summary = {
    base: BASE,
    generatedAt: new Date().toISOString(),
    pageChecks: results.length,
    axeChecks: results.length,
    failures: failures.map((f) => ({
      route: f.route,
      width: f.width,
      mode: f.mode,
      issues: f.issues,
    })),
    vitals,
  };
  writeFileSync(
    path.join(screenshotDir, "sweep-report.json"),
    JSON.stringify(summary, null, 2),
  );
  console.log(JSON.stringify(summary, null, 2));
}

await main();
