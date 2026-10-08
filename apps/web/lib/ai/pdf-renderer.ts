import {readFile, access} from "node:fs/promises";
import {join} from "node:path";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import {documentHtml, escapeHtml} from "./pdf-export.ts";

// Per-instance pressure control. The deployment must also enforce request quotas.
let active = 0;
export class PdfBusyError extends Error {}
export async function renderNoataPdf(text: string, title: string, screenshotPath?: string): Promise<Uint8Array> {
  if (active >= 2) throw new PdfBusyError("PDF renderer is busy");
  active++;
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    let root = join(process.cwd(), "public", "fonts");
    try { await access(root); } catch { root = join(process.cwd(), "apps/web/public/fonts"); }
    const [arabic, latin] = await Promise.all([readFile(join(root,"cairo-arabic.woff2")),readFile(join(root,"cairo-latin.woff2"))]);
    const executablePath = process.env.NOATA_CHROMIUM_PATH || await chromium.executablePath();
    browser = await puppeteer.launch({executablePath, args:chromium.args, headless:true, timeout:15_000});
    const currentBrowser = browser;
    deadline = setTimeout(() => { void currentBrowser.close(); }, 25_000);
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", request => {
      // No SSRF, tracking requests or user-supplied external resources.
      if (request.url().startsWith("data:") || request.url() === "about:blank") void request.continue();
      else void request.abort();
    });
    await page.setContent(await documentHtml(text,title,{arabic:arabic.toString("base64"),latin:latin.toString("base64")}),{waitUntil:"networkidle0",timeout:15_000});
    await page.evaluate(() => document.fonts.ready);
    if(screenshotPath) { await page.setViewport({width:794,height:1123}); await page.screenshot({path:screenshotPath as `${string}.png`,fullPage:false}); }
    const template = `<style>@font-face{font-family:Noata;src:url(data:font/woff2;base64,${arabic.toString("base64")})}body{font-family:Noata,sans-serif}</style>`;
    const bytes = await page.pdf({format:"A4",printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,
      headerTemplate:template+`<div style="font:9px Noata,sans-serif;color:#44618a;width:100%;margin:0 18mm;text-align:right;direction:rtl">${escapeHtml(title)}</div>`,
      footerTemplate:template+'<div style="font:9px sans-serif;color:#44618a;width:100%;margin:0 18mm;display:flex;justify-content:space-between"><span>Noata · Learn. Grow. Achieve.</span><span class="pageNumber"></span></div>',
      timeout:15_000,tagged:true});
    if(bytes.byteLength > 15*1024*1024) throw new Error("PDF output exceeds size limit");
    return bytes;
  } finally {
    if(deadline) clearTimeout(deadline);
    try { await browser?.close(); } finally { active--; }
  }
}
