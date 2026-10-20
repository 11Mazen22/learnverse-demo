import {findActualCharts} from "./artifact-chart.ts";
import {responseText} from "../../../../supabase/functions/noata-ai/response-ui.ts";
import type {DocumentStyle} from "./document-style.ts";
import {readFile, access} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import puppeteer from "puppeteer-core";
import type {Page} from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import {PDFDocument} from "pdf-lib";
import {documentHtml, escapeHtml} from "./pdf-export.ts";
import {designedDocumentParts} from "./pdf-design.ts";
import {parseDesignDocument} from "../../../../supabase/functions/noata-ai/document-design.ts";
import {documentPalette} from "./document-theme.ts";
import {acquirePdfSlot} from "./pdf-pressure.ts";
import {documentDirection} from "./document-direction.ts";
import {chartPdfMarkup,type ActualChartData} from "./line-chart.ts";
export {PdfBusyError} from "./pdf-pressure.ts";

async function mergePdfs(parts:Uint8Array[]):Promise<Uint8Array>{
  const merged=await PDFDocument.create();
  for(const part of parts){
    const source=await PDFDocument.load(part);
    const pages=await merged.copyPages(source,source.getPageIndices());
    for(const page of pages)merged.addPage(page);
  }
  return merged.save();
}
async function loadEmbeddedFonts(page:Page,family:string,expected:number){
  await page.evaluate(async (fontFamily) => {
    await Promise.all([document.fonts.load('12px Noata', 'English'), document.fonts.load('12px Noata', 'العربية'), document.fonts.load('12px NoataSymbols', '→ ≤ ∑ √')]);
    if(fontFamily!=="Noata")await document.fonts.load("12px "+fontFamily,"English");
    await document.fonts.ready;
  },family);
  const loaded=await page.evaluate((count) => [...document.fonts].length === count && [...document.fonts].every(font => font.status === "loaded"),expected);
  if(!loaded)throw new Error("PDF fonts failed to load; refusing a blank document");
}

// Per-instance pressure control. The deployment must also enforce request quotas.
export async function renderNoataPdf(text: string, title: string, screenshotPath?: string, chart?: ActualChartData,style:DocumentStyle="classic",font:"noata"|"editorial"|"mono"="noata"): Promise<Uint8Array> {
  const release = acquirePdfSlot();
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    let root = join(process.cwd(), "public", "fonts");
    try { await access(root); } catch { root = join(process.cwd(), "apps/web/public/fonts"); }
    const [arabic, latin, symbols] = await Promise.all([readFile(join(root,"cairo-arabic.woff2")),readFile(join(root,"cairo-latin.woff2")),readFile(join(root,"..","..","lib","pdf","fonts","noto-sans-math-latin-400-normal.woff"))]);
    const extra=font==="noata"?undefined:await readFile(join(root,font==="editorial"?"lora.ttf":"roboto-mono.ttf"));
    const textFont=font==="editorial"?"NoataEditorial":font==="mono"?"NoataMono":"Noata";
    const fonts={arabic:arabic.toString("base64"),latin:latin.toString("base64"),symbols:symbols.toString("base64"),...(extra?{extra:extra.toString("base64")}:{})};
    const executablePath = process.env.NOATA_CHROMIUM_PATH || await chromium.executablePath();
    const environment = {...process.env};
    // Packaged Chromium extracts its fonts even outside Lambda, but only Lambda
    // gets FONTCONFIG_PATH automatically. Without it, embedded fonts can fail
    // silently and the renderer emits a valid PDF containing no text.
    if (!process.env.NOATA_CHROMIUM_PATH && !environment.FONTCONFIG_PATH)
      environment.FONTCONFIG_PATH = join(tmpdir(), "fonts");
    browser = await puppeteer.launch({executablePath, args:chromium.args, env:environment, headless:true, timeout:15_000});
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
    const parsed=parseDesignDocument(text,title);
    if(parsed.designed){
      const parts=await designedDocumentParts(text,title,fonts,font);
      const palette=documentPalette(parts.design.theme);
      const template = `<style>@font-face{font-family:Noata;src:url(data:font/woff2;base64,${fonts.arabic});unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF}@font-face{font-family:Noata;src:url(data:font/woff2;base64,${fonts.latin})}@font-face{font-family:NoataSymbols;src:url(data:font/woff;base64,${fonts.symbols})}body{font-family:Noata,NoataSymbols,sans-serif;font-feature-settings:"liga" 0,"clig" 0,"dlig" 0}</style>`;
      const header=template+`<div style="font:8.5px Noata,NoataSymbols,sans-serif;color:#${palette.muted.replace("#","")};width:100%;margin:0 17mm;text-align:${parts.direction === "rtl" ? "right" : "left"};direction:${parts.direction}">${escapeHtml(parts.design.title)}</div>`;
      const footer=template+`<div style="font:8.5px Noata,NoataSymbols,sans-serif;color:#${palette.muted.replace("#","")};width:100%;margin:0 17mm;display:flex;justify-content:space-between;direction:${parts.direction}"><span>Noata · ${parts.direction==="rtl"?"وثيقة مصممة":"Designed document"}</span><span class="pageNumber"></span></div>`;
      const render=(html:string,showHeader:boolean,path?:string)=>{
        return page.setContent(html,{waitUntil:"load",timeout:15_000})
          .then(async()=>{
            await loadEmbeddedFonts(page,textFont,extra?4:3);
            if(path){await page.setViewport({width:794,height:1123});await page.screenshot({path:path as `${string}.png`,fullPage:false});}
            return page.pdf({format:"A4",printBackground:true,preferCSSPageSize:true,displayHeaderFooter:showHeader,
              ...(showHeader?{headerTemplate:header,footerTemplate:footer}:{}),timeout:15_000,tagged:true});
          });
      };
      let bytes:Uint8Array;
      if(parts.coverHtml){
        const cover=await render(parts.coverHtml,false);
        const body=await render(parts.bodyHtml,true,screenshotPath);
        bytes=await mergePdfs([cover,body]);
      }else bytes=await render(parts.bodyHtml,true,screenshotPath);
      if(bytes.byteLength > 15*1024*1024) throw new Error("PDF output exceeds size limit");
      return bytes;
    }
    const embedded=findActualCharts(text),charts=[...new Map([...(chart?[chart]:[]),...embedded].map(value=>[JSON.stringify(value),value])).values()].slice(0,6);
    const legacySource=parsed.body||text;
    let html=await documentHtml(embedded.length?responseText(legacySource):legacySource,title,fonts,style,font);
    if(charts.length)html=html.replace("</main>",charts.map(value=>chartPdfMarkup(value,title)).join("")+"</main>");
    // The export is self-contained and external requests are aborted above. Wait for document load, then explicitly await each embedded font below.
    await page.setContent(html,{waitUntil:"load",timeout:15_000});
    await loadEmbeddedFonts(page,textFont,extra?4:3);
    if(screenshotPath) { await page.setViewport({width:794,height:1123}); await page.screenshot({path:screenshotPath as `${string}.png`,fullPage:false}); }
    const direction = documentDirection(legacySource);
    const template = `<style>@font-face{font-family:Noata;src:url(data:font/woff2;base64,${fonts.arabic});unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF}@font-face{font-family:Noata;src:url(data:font/woff2;base64,${fonts.latin})}@font-face{font-family:NoataSymbols;src:url(data:font/woff;base64,${fonts.symbols})}body{font-family:Noata,NoataSymbols,sans-serif;font-feature-settings:"liga" 0,"clig" 0,"dlig" 0}</style>`;
    const bytes = await page.pdf({format:"A4",printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,
      headerTemplate:template+`<div style="font:9px Noata,NoataSymbols,sans-serif;color:#44618a;width:100%;margin:0 18mm;text-align:${direction === "rtl" ? "right" : "left"};direction:${direction}">${escapeHtml(title)}</div>`,
      footerTemplate:template+'<div style="font:9px sans-serif;color:#44618a;width:100%;margin:0 18mm;display:flex;justify-content:space-between"><span>Noata · Learn. Grow. Achieve.</span><span class="pageNumber"></span></div>',
      timeout:15_000,tagged:true});
    if(bytes.byteLength > 15*1024*1024) throw new Error("PDF output exceeds size limit");
    return bytes;
  } finally {
    if(deadline) clearTimeout(deadline);
    try { await browser?.close(); } finally { release(); }
  }
}
