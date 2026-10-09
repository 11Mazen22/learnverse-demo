import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { launchQaBrowser, reloadQaPage, diagnosticError } from "./lib/qa-browser.mjs";

const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
const axeSource = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");
const base = new URL(process.env.NOATA_PALETTE_QA_BASE || "http://127.0.0.1:3000");
if (!["127.0.0.1", "localhost"].includes(base.hostname) || base.protocol !== "http:" || base.username || base.password || base.search || base.hash) throw Error("Appearance QA runs only against a local, non-credentialed app");
const palettes = ["classic", "aura", "ocean", "forest", "sunset", "rose", "midnight"];
const widths = [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920];
const directory = "artifacts/noata-palettes";
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const revision = git("rev-parse", "HEAD"), initiallyDirty = Boolean(git("status", "--porcelain"));
const views = [], screenshots = [];
let browser, failure, assertions = 0;
let location = {};
function invariant(value, message) { if (!value) throw Error(message); assertions++; }
async function evaluate(expression) {
  const result = await browser.command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, 22000);
  if (result.exceptionDetails) throw Error("Browser evaluation failed: " + result.exceptionDetails.text);
  return result.result?.value;
}
async function until(expression, reason, timeout = 26000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await sleep(100);
  }
  throw Error("Appearance readiness timed out: " + reason);
}
async function navigate(path) {
  await browser.command("Page.navigate", { url: new URL(path, base).href });
  await until(`location.pathname===${JSON.stringify(path)} && document.readyState==='complete' && !!document.querySelector('.aura-theme-picker > button,.noata-legal-language button')`, "route " + path);
  await until(`!document.querySelector('.aura-loading-state,.owui-loading') && !Array.from(document.querySelectorAll('[role="status"]')).some(el=>/نتحقق من الحساب/.test(el.textContent))`, "bounded account initialization");
}
async function click(selector) {
  const position = await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el||el.disabled)return null;el.scrollIntoView({block:'nearest'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  invariant(position, "Missing actionable control: " + selector);
  await browser.command("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...position });
  await browser.command("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...position });
}
async function openPicker() {
  if (!await evaluate("!!document.querySelector('.aura-theme-menu')")) await click(".aura-theme-picker > button");
  await until("Array.from(document.querySelectorAll('[data-palette-option]')).some(el=>el.dataset.paletteOption===document.documentElement.dataset.palette&&el.getAttribute('aria-pressed')==='true')", "hydrated picker selection agrees with applied palette");
}
async function choose(palette) {
  await click(`[data-palette-option="${palette}"]`);
  await until(`document.documentElement.dataset.palette===${JSON.stringify(palette)} && !!document.querySelector('[data-palette-option="${palette}"][aria-pressed="true"]')`, "palette applied and selected");
}
async function settle() {
  await evaluate("Promise.all(document.getAnimations().filter(animation=>animation.effect?.getTiming().iterations!==Infinity).map(animation=>animation.finished.catch(()=>{})))");
}
async function capture(name) {
  const shot = await browser.command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const file = directory + "/" + name + ".png";
  await writeFile(file, Buffer.from(shot.data, "base64"));
  screenshots.push({ file, ...location });
}
async function audit() {
  await evaluate(axeSource);
  const result = await evaluate(`Promise.race([axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}).then(r=>({violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))})),new Promise((_,reject)=>setTimeout(()=>reject(Error('axe timeout')),16000))])`);
  views.push({ ...location, ...result, evidence: "public-appearance-only" });
  invariant(!result.violations.length, "Accessibility failures: " + JSON.stringify({ ...location, violations: result.violations }));
}

await mkdir(directory, { recursive: true });
try {
  browser = await launchQaBrowser({ artifactsDir: directory });
  await browser.command("Page.enable");
  await browser.command("Runtime.enable");
  for (const [path, width] of [["/", 390], ["/ai", 1440], ["/privacy", 1440]]) {
    await browser.command("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width <= 768 });
    await navigate(path);
    const hasPicker = await evaluate("!!document.querySelector('.aura-theme-picker > button')");
    if (hasPicker) await openPicker();
    for (const palette of palettes) {
      if (hasPicker) await choose(palette);
      else await evaluate(`document.documentElement.dataset.palette=${JSON.stringify(palette)}`);
      for (const theme of ["light", "dark"]) {
        location = { path, width, palette, theme };
        await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);
        await settle();
        invariant(await evaluate("document.documentElement.scrollWidth-innerWidth<=3"), "Horizontal overflow: " + JSON.stringify(location));
        if (hasPicker) {
          const geometry = await evaluate("(()=>{const menu=document.querySelector('.aura-theme-menu').getBoundingClientRect();const swatch=document.querySelector('.noata-palette-swatch').getBoundingClientRect();return {left:menu.left,right:menu.right,viewport:innerWidth,swatchWidth:swatch.width,swatchHeight:swatch.height}})()");
          invariant(geometry.left >= -3 && geometry.right <= geometry.viewport + 3, "Appearance picker is offscreen");
          invariant(Math.abs(geometry.swatchWidth - geometry.swatchHeight) < 1, "Palette swatch stretched by menu styles");
        }
        invariant(await evaluate("getComputedStyle(document.documentElement).colorScheme") === theme, "Palette overwrote independent browser color mode");
        await audit();
        await capture((path.replaceAll("/", "") || "home") + "-" + palette + "-" + theme);
        console.log("Appearance view verified", JSON.stringify(location));
      }
    }
  }
  await navigate("/");
  await openPicker();
  await choose("ocean");
  for (const width of widths) {
    location = { path: "/", width, palette: "ocean", theme: "light", evidence: "responsive-picker" };
    await browser.command("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width <= 768 });
    await evaluate("document.documentElement.dataset.theme='light'");
    await settle();
    const fitting = await evaluate("(()=>{const r=document.querySelector('.aura-theme-menu').getBoundingClientRect();return document.documentElement.scrollWidth-innerWidth<=3&&r.left>=-3&&r.right<=innerWidth+3&&r.bottom<=innerHeight+3})()");
    invariant(fitting, "Responsive picker overflow at " + width);
    await capture("picker-" + width);
  }
  await browser.command("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await until("!document.querySelector('.aura-theme-menu') && document.activeElement===document.querySelector('.aura-theme-picker > button')", "Escape restores focus");
  invariant(true, "keyboard dismissal");
  await reloadQaPage(browser);
  await until("document.readyState==='complete' && document.documentElement.dataset.palette==='ocean' && !!document.querySelector('.aura-theme-picker > button')", "persisted palette in the loaded replacement document");
  await openPicker();
  invariant(await evaluate("!!document.querySelector('[data-palette-option=ocean][aria-pressed=true]')"), "Reloaded picker disagrees with palette");
  await evaluate("window.__paletteStorageDescriptors={get:Object.getOwnPropertyDescriptor(Storage.prototype,'getItem'),set:Object.getOwnPropertyDescriptor(Storage.prototype,'setItem')};Object.defineProperty(Storage.prototype,'setItem',{configurable:true,value(){throw Error('QA storage unavailable')}});true");
  await choose("forest");
  invariant(await evaluate("document.querySelector('.noata-palette-notice')?.textContent.includes('لهذه الجلسة فقط')"), "Storage denial must disclose session-only appearance");
  await browser.command("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await until("!document.querySelector('.aura-theme-menu')", "faulted picker closes");
  await openPicker();
  invariant(await evaluate("document.documentElement.dataset.palette==='forest' && !!document.querySelector('[data-palette-option=forest][aria-pressed=true]')"), "Readable old storage must not overwrite the session selection on reopening");
  await evaluate("Object.defineProperty(Storage.prototype,'getItem',window.__paletteStorageDescriptors.get);Object.defineProperty(Storage.prototype,'setItem',window.__paletteStorageDescriptors.set);delete window.__paletteStorageDescriptors;true");
  location = { path: "/", width: 1920, palette: "forest", evidence: "storage-denied-session-only" };
  await capture("storage-denied");
} catch (error) {
  failure = error;
  console.error(error);
} finally {
  try { await browser?.close(); } catch (error) { failure ??= error; }
  const endingRevision = git("rev-parse", "HEAD");
  if (endingRevision !== revision) failure ??= Error("Revision changed during appearance QA");
  await writeFile(directory + "/outcome.json", JSON.stringify({ passed: !failure, revision, endingRevision, dirty: initiallyDirty || Boolean(git("status", "--porcelain")), assertions, publicViews: views.length, screenshots, views, failure: diagnosticError(failure), notVerified: ["Authenticated preferences and cross-device palette persistence", "Every private route/modal/state across all seven palettes", "Manual screen-reader, physical touch and field performance"], storageDenial: "Synthetic storage fault in a real browser; not an authenticated test", runtime: process.env.NOATA_PALETTE_QA_RUNTIME || "unspecified", chrome: browser?.diagnostics?.version?.Browser ?? null }, null, 2) + "\n");
  process.exitCode = failure ? 1 : 0;
}
