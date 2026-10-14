// Noata Aura browser smoke on Node 24 + runner Chrome and axe-core.
// Real browser layout/RTL/theme/render assertions; not an authenticated E2E claim.
import {resolve} from "node:path";
import {launchQaBrowser,findQaChrome,diagnosticError} from "./lib/qa-browser.mjs";
import {verifyUiAccountContracts} from "./lib/ui-account-fixture.mjs";
import {verifyPublicCurriculum} from "./lib/public-curriculum-fixture.mjs";
import {createRequire} from "node:module";
const require=createRequire(new URL("../apps/web/package.json",import.meta.url));
const axeSource=await readFile(require.resolve("axe-core/axe.min.js"),"utf8");
const accessibility=[],performanceResults=[],captures=[];
import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

const testedRevision=spawnSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).stdout.trim();
const initiallyDirty=!!spawnSync("git",["status","--porcelain"],{encoding:"utf8"}).stdout.trim();
const binary = findQaChrome();
const qaPort = Number(process.env.NOATA_QA_PORT ?? "3000");
if (!Number.isInteger(qaPort) || qaPort < 1024 || qaPort > 65535) throw Error("Invalid local browser QA port");
const base = "http://127.0.0.1:" + qaPort;
let app, browser, socket, appLog="";
const browserErrors=[];
const location={path:"",width:null,theme:"",stage:"setup"};

let checks = 0;
function invariant(ok, reason) { if (!ok) throw new Error("BROWSER QA FAIL: " + reason); checks++; }

async function waitFor(fn, label, ms=20000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try { const v = await fn(); if (v) return v; } catch {}
    await sleep(250);
  }
  throw new Error("Timeout waiting for " + label);
}
function command(method,params={}) { return browser.command(method,params); }
async function evaluate(expr, stage="DOM evaluation", timeoutMs=12000) {
  location.stage=stage;
  let r;
  try {
    r=await browser.command("Runtime.evaluate",{
      expression:expr,
      returnByValue:true,
      awaitPromise:true,
    },timeoutMs);
  } catch(error) {
    throw new Error(`Chrome ${stage} failed on ${location.path||"initial"} (${location.width??"?"}px/${location.theme||"?"}): ${error.message}`,{cause:error});
  }
  if (r.exceptionDetails) throw new Error("JS exception in browser during "+stage+": "+(r.exceptionDetails.text??"unknown"));
  return r.result?.value;
}
async function navigate(path) {
  location.path=path;
  location.stage="Page.navigate";
  await command("Page.navigate",{url:base+path});
  const expected = new URL(path, base);
  await waitFor(async()=> {
    const state=await evaluate("({ready: document.readyState, path: location.pathname, search: location.search, size: document.body?.innerText?.length || 0})");
    return state.ready === "complete" && state.path === expected.pathname &&
      state.search === expected.search && state.size > 30;
  }, path);
  await waitFor(async()=>await evaluate(`!document.querySelector('.aura-loading-state,.aura-progress-loading,.owui-loading,[aria-busy="true"]') && !Array.from(document.querySelectorAll('[role="status"]')).some(el=>/بنحمّل|بنجهّز|نتحقق من الحساب/.test(el.textContent))`),path+" settled loading/error/guest state",30000);
  // Never await document.fonts.ready unbounded in a CDP evaluate call: slow
  // font requests can strand an awaited promise and block an entire CI run.
  // font-display:swap provides readable fallback, so read status synchronously.
  const fontStatus=await evaluate("document.fonts.status","font status (nonblocking)");
  if(fontStatus!=="loaded") console.warn("[browser] fonts still loading for",path);
}
async function screenshot(file) {
  const data = await command("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile(file,Buffer.from(data.data,"base64"));
  captures.push({file,...location});
}
async function settleUiTransitions(stage) {
  // Wait for finite RUNNING animations only. Paused transitions have unresolved
  // finished promises and must not cause false accessibility-audit timeouts.
  // Recheck after a frame so newly started transitions are also observed.
  const script = `(async()=>{
    const until=performance.now()+8000;
    for (;;) {
      const active=()=>document.getAnimations().filter(a=>a.playState==="running"&&a.effect?.getComputedTiming().iterations!==Infinity);
      const animations=active();
      if(!animations.length) {
        await new Promise(resolve=>requestAnimationFrame(resolve));
        if(!active().length)return true;
      }
      if(performance.now()>until)throw Error("Finite UI animations still running at accessibility audit: "+active().length);
      await Promise.race([
        Promise.all(animations.map(a=>a.finished.catch(()=>{}))),
        new Promise(resolve=>setTimeout(resolve,120))
      ]);
    }
  })()`;
  await evaluate(script,stage,11000);
}
async function auditView(kind) {
// Theme attributes update before the 180 ms foreground/background transitions finish.
// Audit the settled interface on every route, as the synthetic views already do.
await settleUiTransitions("settled UI transitions");
const clippedHeaderActions=await evaluate("Array.from(document.querySelectorAll('.shell-topbar > .top-actions > a, .shell-topbar > .top-actions > button, .shell-topbar > .top-context > button')).filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&(r.left< -1||r.right>document.documentElement.clientWidth+1)}).map(el=>el.getAttribute('aria-label')||el.textContent.trim())");
invariant(clippedHeaderActions.length===0,"header actions remain inside the visible viewport: "+clippedHeaderActions.join(", "));
await evaluate(axeSource);
        const audit=await evaluate('Promise.race([axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa","wcag22aa"]}}).then(r=>({violations:r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>v.id),manualReview:r.incomplete.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))})),new Promise((_,reject)=>setTimeout(()=>reject(Error("axe audit exceeded 16 seconds")),16000))])',"axe accessibility audit",22000);
        accessibility.push({...location,kind,...audit});
}
async function auditSyntheticView(name) {
  for(const width of [1920,1440,1024,768,390,320]) {
    location.width=width;
    await command("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:width<=768});
    for(const theme of ["light","dark"]) {
      location.theme=theme;
      await command("Emulation.setEmulatedMedia",{features:[{name:"prefers-color-scheme",value:theme}]});
      await waitFor(()=>evaluate('document.documentElement.dataset.theme==='+JSON.stringify(theme)),name+" synthetic theme applied");
      // Audit the settled theme, after finite entry/color transitions complete.
      // Infinite decorative animations do not prevent accessibility measurement.
      await settleUiTransitions("settled synthetic theme");
      invariant(await evaluate("document.documentElement.scrollWidth-innerWidth<=3"),name+" synthetic viewport overflow "+width);
      await auditView("synthetic-ui-only");
      await screenshot(`artifacts/noata-browser/${name}-synthetic-${width}-${theme}.png`);
    }
  }
  await command("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
}
async function verifyToolThemeContrast(){
  await command('Emulation.setDeviceMetricsOverride',{width:1920,height:900,deviceScaleFactor:1,mobile:false});
  await navigate('/ai');
  await waitFor(()=>evaluate('!!document.querySelector(".owui-input-menu-wrap > button")'),'Composer attachment/actions control');
  // Sample actual rendered colors on every animation frame, including the
  // first frame after a scheme change. Waiting for transitions hides this bug.
  const measurements=await evaluate(`(async()=>{
    const button=document.querySelector('.owui-input-menu-wrap > button');
    const original=document.documentElement.dataset.theme,rows=[];
    const rgb=s=>(s.match(/[\\d.]+/g)||[]).map(Number);
    const luminance=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const sample=()=>{
      let background=[255,255,255],ancestors=[];
      for(let el=button;el;el=el.parentElement)ancestors.unshift(el);
      for(const el of ancestors){const c=rgb(getComputedStyle(el).backgroundColor),alpha=c[3]??1;background=c.slice(0,3).map((v,i)=>v*alpha+background[i]*(1-alpha));}
      const foreground=rgb(getComputedStyle(button).color),a=luminance(foreground),b=luminance(background);
      return {foreground,background,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
    };
    try{
      for(const active of [false,true]){
        if((button.getAttribute('aria-expanded')==='true')!==active){button.click();await new Promise(requestAnimationFrame);}
        for(const theme of ['light','dark']){
          document.documentElement.dataset.theme=theme==='light'?'dark':'light';
          await new Promise(r=>setTimeout(r,220));
          document.documentElement.dataset.theme=theme;
          const frames=[],start=performance.now();
          do{frames.push(sample());await new Promise(requestAnimationFrame);}while(performance.now()-start<220);
          rows.push({active,theme,frames});
        }
      }
    }finally{document.documentElement.dataset.theme=original;if(button.getAttribute('aria-expanded')==='true')button.click();}
    return rows;
  })()`,'Composer action theme transition contrast');
  await writeFile('artifacts/noata-browser/tool-theme-contrast.json',JSON.stringify(measurements,null,2));
  for(const row of measurements)invariant(row.frames.every(f=>f.ratio>=4.5),`Composer action ${row.theme} ${row.active?'active':'idle'} remains AA during theme changes (minimum ${Math.min(...row.frames.map(f=>f.ratio)).toFixed(2)}:1)`);
}
async function verifyQuranControls(){
  // No production code is altered. Mocked responses make interactive UI
  // behavior repeatable even when the external Quran API is temporarily down.
  const fixture = [
    {number:1,text:"آية تجريبية أولى",globalNumber:1,audio:null},
    {number:2,text:"آية تجريبية ثانية",globalNumber:2,audio:null},
  ];
  const longFixture = Array.from({length:8},(_,index)=>({number:index+1,text:"آية اختبار "+(index+1),globalNumber:index+1,audio:null}));
  const script = `(()=>{
    const originalFetch=window.fetch;
    window.fetch=async (input,options)=>{
      const url=String(input?.url??input);
      if(url.startsWith("/api/quran")){
        const params=new URL(url,location.origin).searchParams;
        if(params.get("reciters")==="1"){
          return new Response(JSON.stringify({reciters:[]}),{status:200,headers:{"Content-Type":"application/json"}});
        }
        if(params.has("verseReciter")){
          return new Response(JSON.stringify({reciter:params.get("verseReciter"),surah:Number(params.get("surah")),verses:[],label:null}),{status:200,headers:{"Content-Type":"application/json"}});
        }
        if(params.get("list")==="1"){
          return new Response(JSON.stringify({surahs:[
            {number:1,name:"الفاتحة",englishName:"Al-Faatiha",numberOfAyahs:2},
            {number:2,name:"البقرة",englishName:"Al-Baqara",numberOfAyahs:8}
          ]}),{status:200,headers:{"Content-Type":"application/json"}});
        }
        if(params.has("search")){
          return new Response(JSON.stringify({results:[{surah:1,surahName:"الفاتحة",number:2,text:"آية تجريبية ثانية"}],total:1}),{status:200,headers:{"Content-Type":"application/json"}});
        }
        const n=Number(params.get("surah")??1);
        window.__noataLastQuranReciter=params.get("reciter");
        return new Response(JSON.stringify({surah:{number:n,name:n===1?"الفاتحة":"البقرة",englishName:"Example",numberOfAyahs:n===1?2:8},verses:n===1?${JSON.stringify(fixture)}:${JSON.stringify(longFixture)},source:{name:"CI TEST FIXTURE",edition:"fixture",reference:"https://alquran.cloud/api",audioEdition:"fixture"},audioAvailable:false,audioUnavailableReason:"اختبار: هذا المصدر لا يتضمن ملفات صوت"}),{status:200,headers:{"Content-Type":"application/json"}});
      }
      return originalFetch(input,options);
    };
  })()`;
  const install=await command("Page.addScriptToEvaluateOnNewDocument",{source:script});
  try{
    await navigate("/quran");
    await waitFor(async()=>await evaluate('document.querySelectorAll(".aura-quran-ayah").length===2'),"Quran fixture loaded");
    invariant(await evaluate('document.querySelectorAll(".aura-quran-ayah").length===2'),"Quran verse reader");
    await evaluate('document.querySelector(".aura-quran-ayah-actions button")?.click()');
    invariant(await evaluate('(localStorage.getItem("noata-quran-bookmarks-v1")??"").includes("1:1")'),"Quran bookmark persistence");
    const original=await evaluate('document.querySelector(".aura-quran-verse")?.style.fontSize');
    await evaluate('document.querySelector("[aria-label=\\\"تكبير خط القرآن\\\"]")?.click()');
    const changed=await evaluate('document.querySelector(".aura-quran-verse")?.style.fontSize');
    invariant(original!==changed,"Quran font sizing");
    const reading=await evaluate('(()=>{const b=document.querySelector("[aria-label^=\\\"حجم القراءة\\\"]");const p=document.querySelector(".aura-quran-verse");return {label:b?.textContent?.trim(),font:p?.style.fontSize,persisted:localStorage.getItem("noata-quran-reading-percent-v2")}})()');
    invariant(reading.label.includes("١١٠")&&reading.persisted==="110"&&Math.abs(parseFloat(reading.font)-35.2)<0.2,"Quran percentage matches rendered font and stored size");
    await navigate("/quran");
    await waitFor(async()=>await evaluate('document.querySelectorAll(".aura-quran-ayah").length===2'),"Quran size persisted on reload");
    invariant(await evaluate('document.querySelector("[aria-label^=\\\"حجم القراءة\\\"]")?.textContent?.includes("١١٠")'),"Quran percentage restores from persistent state");
    await evaluate('document.querySelector("[aria-label^=\\\"حجم القراءة\\\"]")?.click()');
    const reset=await evaluate('(()=>({value:document.querySelector("[aria-label^=\\\"حجم القراءة\\\"]")?.textContent,px:parseFloat(getComputedStyle(document.querySelector(".aura-quran-verse")).fontSize)}))()');
    invariant(reset.value.includes("١٠٠")&&Math.abs(reset.px-32)<0.2,"Quran reset returns to exact 100 percent font size");
    await evaluate('(()=>{const s=document.querySelector("select[aria-label=\\\"اختيار سورة\\\"]");s.value="2";s.dispatchEvent(new Event("change",{bubbles:true}));})()');
    await waitFor(async()=>await evaluate('document.querySelector(".aura-quran-chapter h2")?.innerText.includes("البقرة")'),"Quran chapter navigation");
    invariant(await evaluate('document.querySelector(".aura-quran-chapter h2")?.innerText.includes("البقرة")'),"Quran surah chooser");
    await waitFor(async()=>await evaluate('document.querySelectorAll(".aura-quran-ayah").length===5'),"Long Surah default shows only five verses");
    invariant(await evaluate('document.querySelector(".mushaf-expand button")?.getAttribute("aria-expanded")==="false"'),"Compact five-Ayah Surah disclosed accessibly");
    await evaluate('document.querySelector(".mushaf-expand button").click()');
    await waitFor(async()=>await evaluate('document.querySelectorAll(".aura-quran-ayah").length===8'),"Full Surah expansion reveals all verified verses");
    await evaluate('document.querySelector(".mushaf-expand button").click()');
    await waitFor(async()=>await evaluate('document.querySelectorAll(".aura-quran-ayah").length===5'),"Surah collapse restores five-Ayah view");
    await evaluate('document.querySelectorAll(".mushaf-reciter-card")[7].click()');
    await waitFor(async()=>await evaluate('window.__noataLastQuranReciter==="ar.sudais"'),"Sudais selection triggers own repaired audio API edition");
    invariant(await evaluate('document.querySelectorAll(".mushaf-player audio").length===1 && document.querySelectorAll("audio").length===1'),"Mushaf uses exactly one player");
    invariant(await evaluate('document.querySelectorAll(".aura-quran-ayah-actions button[aria-label^=\\\"تلاوة الآية\\\"]:not(:disabled)").length===0'),"Unavailable Sudais fixture keeps verse controls disabled");
    invariant(await evaluate('document.querySelector(".mushaf-player-play").disabled'),"Unavailable chapter catalogue cannot invent playback");

    await evaluate('(()=>{const el=document.querySelector("input[aria-label=\\\"البحث في القرآن\\\"]");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,"التجريبية");el.dispatchEvent(new Event("input",{bubbles:true}));})()');
    await evaluate('document.querySelector(".aura-quran-search")?.requestSubmit()');
    await waitFor(async()=>await evaluate('document.querySelectorAll(".aura-quran-search-results button").length>0'),"Quran search matches");
    invariant(await evaluate('document.querySelectorAll(".aura-quran-search-results button").length>0'),"Quran search UI");
    console.log("[browser] Quran interactions verified with deterministic test-only API fixture");
  } finally {
    await command("Page.removeScriptToEvaluateOnNewDocument",{identifier:install.identifier});
  }
}
async function verifyContextualCoach(){
  await navigate("/");
  await waitFor(async()=>await evaluate('!!document.querySelector(".noata-context-coach-trigger")'),"contextual AI trigger is available");
  await evaluate('document.querySelector(".noata-context-coach-trigger").click()');
  await waitFor(async()=>await evaluate('!!document.querySelector("dialog[open] .noata-context-coach")'),"contextual AI dialog opens");
  invariant(await evaluate('document.querySelectorAll("dialog[open] .noata-context-coach-options button").length===3'),"Homepage has three purposeful, editable AI prompts");
  const previous=await evaluate('document.querySelector("dialog[open] .noata-context-coach textarea").value');
  await evaluate('document.querySelectorAll("dialog[open] .noata-context-coach-options button")[1].click()');
  invariant(await evaluate('document.querySelector("dialog[open] .noata-context-coach textarea").value')!==previous,"Choosing a purpose changes editable AI context");
  invariant(await evaluate('!document.querySelector("dialog[open] .noata-context-coach-submit").disabled'),"Contextual AI action enabled for valid prompt");
  invariant(await evaluate('!document.querySelector("dialog[open] .noata-context-coach").textContent.includes("تم الإرسال")'),"No accidental send claim before user confirms");
  await command("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  await waitFor(async()=>await evaluate('!document.querySelector("dialog[open] .noata-context-coach")'),"AI dialog Escape close and focus safe");
  await navigate("/learn");
  await waitFor(async()=>await evaluate('!!document.querySelector(".noata-context-coach-trigger")'),"Context-aware AI survives navigation");
  await evaluate('document.querySelector(".noata-context-coach-trigger").click()');
  await waitFor(async()=>await evaluate('!!document.querySelector("dialog[open] .noata-context-coach")'),"Learn context opens");
  invariant(await evaluate('document.querySelector("dialog[open] .dialog-heading h2")?.textContent.includes("رفيق رحلة التعلّم")'),"Learn receives a different pedagogical AI context");
  await command("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
}
async function openWritingStudioFromComposer(){
  await waitFor(async()=>await evaluate('!!document.querySelector(".owui-input-menu-wrap > button")'),"composer action is available");
  await evaluate('document.querySelector(".owui-input-menu-wrap > button").click()');
  await waitFor(async()=>await evaluate('!!document.querySelector(".noata-start-document")'),"Create document action is in attachment menu");
  await evaluate('document.querySelector(".noata-start-document").click()');
}
async function verifyWritingAndTheme(){
  await navigate("/ai");
  await openWritingStudioFromComposer();
  invariant(await evaluate('!!document.querySelector("dialog[open] .aura-studio textarea")'),"Writing studio opens");
  invariant(await evaluate('(()=>{const v=document.querySelector("dialog[open] .aura-studio textarea")?.value||"";return v.split(String.fromCharCode(10)).length>2 && !v.includes(String.fromCharCode(92)+"n")})()'),"Writing template uses actual newlines, not literal escaped characters");
  await evaluate(`(()=>{const el=document.querySelector('.aura-studio textarea');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,'## مستند عربي\\n\\n| مفهوم | قيمة |\\n|---|---|\\n| اختبار | ٣ |');el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await evaluate('Array.from(document.querySelectorAll(".aura-studio-tabs button")).find(b=>b.textContent.includes("معاينة")).click()');
  invariant(await evaluate('!!document.querySelector(".aura-studio-preview h2")&&!!document.querySelector(".aura-studio-preview table")'),"Writing preview renders headings and tables");
  await command("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  await waitFor(async()=>await evaluate('!!document.querySelector("dialog[open] .aura-studio-close-confirm")'),"unsaved writing protection on Escape");
  invariant(await evaluate('!!document.querySelector("dialog[open]")'),"Escape preserves unsaved editor");
  await evaluate('Array.from(document.querySelectorAll(".aura-studio-close-confirm button")).find(b=>b.textContent.includes("متابعة التحرير")).click()');
  invariant(await evaluate('!!document.querySelector("dialog[open] .aura-studio-preview table")'),"Keep editing preserves document preview");
  await evaluate('document.querySelector("dialog[open] .dialog-heading button").click()');
  await evaluate('Array.from(document.querySelectorAll(".aura-studio-close-confirm button")).find(b=>b.textContent.includes("الاحتفاظ")).click()');
  await waitFor(async()=>await evaluate('!document.querySelector("dialog[open]")'),"explicit keep-draft close");
  await openWritingStudioFromComposer();
  await waitFor(async()=>await evaluate('document.querySelector("dialog[open] .aura-studio textarea")?.value.includes("مستند عربي")'),"writing draft restores on reopening");
  invariant(true,"Writing draft survives close and reopen");
  await command("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  await evaluate('Array.from(document.querySelectorAll(".aura-studio-close-confirm button")).find(b=>b.textContent.includes("تجاهل")).click()');
  await waitFor(async()=>await evaluate('!document.querySelector("dialog[open]")'),"discard confirmed draft close");
  await openWritingStudioFromComposer();
  await waitFor(async()=>await evaluate('!!document.querySelector("dialog[open] .aura-studio textarea")'),"fresh draft opens after discard");
  invariant(await evaluate('!document.querySelector("dialog[open] .aura-studio textarea").value.includes("مستند عربي")'),"Discard actually clears retained draft");
  await command("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  await waitFor(async()=>await evaluate('!document.querySelector("dialog[open]")'),"unchanged draft keyboard close");
  await navigate("/settings");
  await waitFor(async()=>await evaluate('!!document.querySelector(".aura-device-appearance")'),"Guest settings is usable without a false auth error");
  invariant(true,"Guest settings recognizes missing session");
  await evaluate('document.querySelector(".aura-theme-picker button").click()');
  await waitFor(async()=>await evaluate('document.activeElement?.matches(".aura-theme-menu button")'),"Theme selector focuses a choice");
  invariant(true,"Theme keyboard initial focus");
  await command("Input.dispatchKeyEvent",{type:"keyDown",key:"ArrowDown",code:"ArrowDown",windowsVirtualKeyCode:40});
  invariant(await evaluate('document.activeElement?.matches(".aura-theme-menu button")'),"Theme arrow navigation");
  await command("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  invariant(await evaluate('document.activeElement?.matches(".aura-theme-picker>button")'),"Theme focus restored after Escape");
  await evaluate('document.querySelector(".aura-theme-picker button").click()');
  await evaluate('Array.from(document.querySelectorAll(".aura-theme-menu button")).find(b=>b.textContent.includes("نهاري")).click()');
  invariant(await evaluate('document.documentElement.dataset.theme==="light"&&localStorage.getItem("noata-theme")==="light"'),"Theme selection persists on device");
  await evaluate('localStorage.removeItem("noata-theme")');
}
async function verifyPaletteBrandConsistency(){
  // Regresses the reported Forest screenshot defect using real computed styles.
  const palettes=["classic","aura","ocean","forest","sunset","rose","midnight"],seen=new Map();
  await navigate("/settings");
  await evaluate('localStorage.setItem("noata-theme","light")');
  invariant(await evaluate('!!document.querySelector("#noata-ai-design-studio") && !!document.querySelector("#noata-ai-design-studio textarea")'),"Guest AI Design Studio includes user-editable prompt and login guidance");
  await evaluate('(()=>{if(!document.querySelector(".aura-theme-menu"))document.querySelector(".aura-theme-picker>button").click()})()');
  await waitFor(async()=>await evaluate('document.querySelectorAll(".noata-palette-grid button").length===7'),"seven theme choices");
  for(const name of palettes){
    const selected=await evaluate('(()=>{const el=Array.from(document.querySelectorAll(".noata-palette-grid button")).find(b=>b.getAttribute("aria-label")?.toLowerCase().endsWith('+JSON.stringify(name)+'));if(!el)return false;el.click();return true})()',"select palette "+name);
    invariant(selected,"Palette "+name+" has an actual selector");
    await waitFor(async()=>await evaluate('document.documentElement.dataset.palette==='+JSON.stringify(name)),"palette applied "+name);
    invariant(await evaluate('document.documentElement.dataset.theme==='+JSON.stringify(name==="midnight"?"dark":"light")),"Midnight is dark-only while every other world respects light");
    invariant(await evaluate('localStorage.getItem("noata-palette")==='+JSON.stringify(name)),"palette persisted "+name);
    await navigate("/");
    await waitFor(async()=>await evaluate('!!document.querySelector(".dashboard-hero .noata-logo-vector")'),"original brand visible "+name);
    const result=await evaluate('(()=>{const root=getComputedStyle(document.documentElement),hero=document.querySelector(".dashboard-hero"),logo=hero.querySelector(".noata-logo-vector"),brand=document.querySelector(".sidebar-brand .noata-logo-vector");return {background:getComputedStyle(hero).backgroundImage,ribbon:getComputedStyle(logo.querySelector(".noata-mark-ribbon")).fill,outline:getComputedStyle(brand.querySelector(".noata-mark-outline")).fill,accent:root.getPropertyValue("--accent"),overflow:document.documentElement.scrollWidth-window.innerWidth}})()',"palette render "+name);
    invariant(result.background.includes("linear-gradient")&&result.ribbon!=="none"&&result.ribbon!=="transparent"&&result.outline!=="none"&&result.outline!=="transparent"&&Boolean(result.ribbon)&&Boolean(result.outline),"Palette "+name+" has themed hero and true vector brand; actual "+JSON.stringify(result));
    invariant(result.overflow<=3,"Palette "+name+" has no horizontal overflow");
    seen.set(name,result);
    if(["forest","ocean","aura"].includes(name))await screenshot("artifacts/noata-browser/brand-"+name+"-home.png");
    await navigate("/settings");
    await evaluate('(()=>{if(!document.querySelector(".aura-theme-menu"))document.querySelector(".aura-theme-picker>button").click()})()');
    await waitFor(async()=>await evaluate('document.querySelectorAll(".noata-palette-grid button").length===7'),"selector restored "+name);
  }
  await navigate("/login");
  await waitFor(async()=>await evaluate('!!document.querySelector(".auth-aside .noata-auth-journey-visual")'),"redesigned Noata auth illustration");
  invariant(await evaluate('getComputedStyle(document.querySelector(".auth-aside")).backgroundImage.includes("linear-gradient")'),"auth background follows new responsive design");
    for(const [a,b] of [["forest","ocean"],["aura","forest"],["midnight","rose"]]){
    invariant(seen.get(a).background!==seen.get(b).background,"hero is distinctly themed "+a+" "+b);
    invariant(seen.get(a).ribbon!==seen.get(b).ribbon,"original Noata logo ribbon follows theme "+a+" "+b);
  }
  await evaluate('localStorage.removeItem("noata-palette");localStorage.removeItem("noata-theme");document.documentElement.dataset.palette="classic";window.dispatchEvent(new Event("noata-palette-change"))');
}
async function verifyDocuments(){
  for(const [name,marker] of [["source.txt","مصدر فعلي"],["source.md","محتوى Markdown"],["source.csv","المفهوم"],["source.json","محتوى JSON"],["arabic-longform.docx","تجربة تعلّم"],["arabic-longform.pdf",null]]){
    await navigate("/ai");
    await waitFor(async()=>await evaluate('!!document.querySelector(".noata-suggested-actions.welcome .noata-suggested-item")'),"AI hydration");
    const dom=await command("DOM.getDocument");const input=await command("DOM.querySelector",{nodeId:dom.root.nodeId,selector:"input[type=file]"});
    invariant(!!input.nodeId,"Document picker exists");
    await command("DOM.setFileInputFiles",{nodeId:input.nodeId,files:[resolve("artifacts/noata-documents/"+name)]});
    await waitFor(async()=>await evaluate('!!document.querySelector(".aura-pending-preview")'),"selected document preview button");
    await evaluate('document.querySelector(".aura-pending-preview").click()');
    await waitFor(async()=>await evaluate('!!document.querySelector(".noata-creative-preview")'),"Creative Studio opened genuine source preview: "+name);
    if(marker){
      // The Office preview is paginated; search actual rendered pages, not
      // a hidden text fixture or a synthetic preview container.
      let found=false;
      for(let pageIndex=0;pageIndex<15;pageIndex++){
        if(await evaluate('document.querySelector(".noata-creative-page")?.textContent.includes('+JSON.stringify(marker)+')')){found=true;break;}
        const canAdvance=await evaluate('!document.querySelector(".noata-creative-pages button:last-child")?.disabled');
        if(!canAdvance)break;
        await evaluate('document.querySelector(".noata-creative-pages button:last-child").click()');
        await waitFor(async()=>await evaluate('!!document.querySelector(".noata-creative-page")'),"Next preview page for "+name);
      }
      invariant(found,"Real preview includes expected source bytes/text: "+name);
    }else{
      await waitFor(async()=>await evaluate('document.querySelector(".noata-creative-pdf canvas")?.width>0&&document.querySelector(".noata-creative-pages")?.textContent.includes("11")'),"real 11-page PDF preview");
      await evaluate('document.querySelector(".noata-creative-pages button:last-child").click()');
      await waitFor(async()=>await evaluate('document.querySelector(".noata-creative-pages")?.textContent.includes("2 / 11")'),"Real PDF next-page navigation");
    }
    invariant(await evaluate('!!document.querySelector(".noata-download-original")'),"Unmodified original file has an explicit download action: "+name);
    await screenshot("artifacts/noata-browser/document-"+name.replaceAll(".","-")+".png");
    await command("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
    await waitFor(async()=>await evaluate('!document.querySelector("dialog[open]")'),"document modal Escape");
    invariant(true,"Document preview keyboard close");
  }
  await navigate('/ai');
  await waitFor(async()=>await evaluate('!!document.querySelector(".noata-suggested-actions.welcome .noata-suggested-item")'),"image fixture hydration");
  const dom=await command('DOM.getDocument');
  const input=await command('DOM.querySelector',{nodeId:dom.root.nodeId,selector:'input[type=file]'});
  await command('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[resolve('artifacts/noata-documents/arabic-layout.png')]});
  await waitFor(async()=>await evaluate('document.querySelector(".owui-attachment img")?.naturalWidth===794'),"actual PNG preview");
  invariant(true,'Image preview loads the actual raster fixture');
  await screenshot('artifacts/noata-browser/document-image-png.png');
  await evaluate('document.querySelector(".owui-attachment button").click()');
  invariant(await evaluate('!document.querySelector(".owui-attachment")'),'Image attachment removal');
  await command('DOM.setFileInputFiles',{nodeId:input.nodeId,files:['source.txt','source.md','source.csv','source.json'].map(n=>resolve('artifacts/noata-documents/'+n))});
  await waitFor(async()=>await evaluate('document.querySelectorAll(".aura-document-chip").length===4'),"four source composer tray");
  invariant(true,'Four actual files are staged independently');
  const result=await evaluate(`fetch('/api/documents/pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'fixture'})}).then(r=>r.status)`);
  invariant(result===401,"Unauthenticated PDF generation must be denied, received "+result);
}
async function main() {
  await mkdir("artifacts/noata-browser",{recursive:true});
  app=spawn("pnpm",["--filter","@noata/web","start"],{stdio:"pipe",detached:true,env:{...process.env,PORT:String(qaPort)}});

  app.stdout.on("data",chunk=>appLog+=String(chunk));
  app.stderr.on("data",chunk=>appLog+=String(chunk));
  let appFailure;
  app.on('error',error=>{appFailure=error;});
  app.on('exit',(code,signal)=>{appFailure=Error(`Next server exited: code=${code}, signal=${signal??'none'}`);});
  const serverDeadline=Date.now()+30000;let appReady=false;
  while(Date.now()<serverDeadline){
    if(appFailure)throw appFailure;
    try{const r=await fetch(base+'/health',{signal:AbortSignal.timeout(1500)});if(r.ok&&(await r.json()).ok===true){appReady=true;break;}}catch{}
    await sleep(250);
  }
  // Require the process we started to remain alive; an unrelated existing /health
  // listener must not make an EADDRINUSE startup look successful.
  await sleep(250);
  if(appFailure)throw appFailure;
  if(!appReady)throw Error('Next production server did not become ready');
  // Check initial HTML before JavaScript: returning English users must not see Arabic hydration copy.
  for(const [locale,direction,label] of [["en","ltr","Skip to content"],["ar","rtl","\u0627\u0646\u062a\u0642\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u062d\u062a\u0648\u0649"]]){
    const response=await fetch(base+"/help",{headers:{cookie:"noata_locale="+locale},signal:AbortSignal.timeout(15000)});
    const html=await response.text();
    invariant(response.ok && new RegExp("<html[^>]*lang=\\\""+locale+"\\\"").test(html) && new RegExp("<html[^>]*dir=\\\""+direction+"\\\"").test(html),"Initial server language and direction "+locale);
    invariant(new RegExp("class=\\\"skip-link\\\"[^>]*>"+label+"<").test(html),"Initial translated skip link "+locale);
  }
  browser=await launchQaBrowser({executablePath:binary,artifactsDir:"artifacts/noata-browser"});
  socket=browser.socket;
  console.log("[browser] Chrome startup",JSON.stringify({pid:browser.diagnostics.pid,port:browser.diagnostics.port,version:browser.diagnostics.version.Browser}));
  await command("Page.enable");
  await command("Runtime.enable");
  socket.addEventListener("message",({data})=>{const event=JSON.parse(String(data));if(event.method==="Runtime.exceptionThrown")browserErrors.push(event.params.exceptionDetails.text);});
  // Full-session tracing introduces excessive renderer overhead across
  // route axe audits. Collect a focused final interaction trace instead.

  const routes=["/","/ai","/learn","/missions","/review","/boss","/progress","/rewards","/assignments","/settings","/help","/quran","/notifications","/teacher","/admin"];
  await command("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await command("Emulation.setEmulatedMedia",{features:[{name:"prefers-color-scheme",value:"light"}]});
  for(const width of [1920,1440,1024,768,390,320]) {
    location.width=width;
    await command("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:width<=768});
    for(const theme of ["light","dark"]) {
      location.theme=theme;
      await command("Emulation.setEmulatedMedia",{features:[{name:"prefers-color-scheme",value:theme}]});
      for(const path of routes) {
         console.log("[browser] checking route",path,width,theme);
         await navigate(path);
         if(width===1920 && theme==="light" && path==="/") {
           await waitFor(async()=>await evaluate('!!document.querySelector(".nav-link-ai .nav-tag")'),"first-view AI badge");
           invariant(true,"AI badge is initially visible for an unseen guest");
         }
        const result=await evaluate(`({hasBody: !!document.body, rtl:document.documentElement.dir==="rtl", overflow:document.documentElement.scrollWidth - innerWidth, title:document.title, hasAI:!!document.querySelector(".owui-layout")})`);
        invariant(result.hasBody,path+" empty body");invariant(result.rtl,path+" missing Arabic RTL root");invariant(result.overflow <= 3,path+" horizontal overflow "+result.overflow);
        if(path==="/ai")invariant(result.hasAI,"AI workspace missing");
        if(path==="/quran")invariant(await evaluate('!!document.querySelector(".aura-quran-reading")'),"Quran reader UI missing");
        await auditView("public");
        performanceResults.push({path,width,theme,...await evaluate('({fcp:performance.getEntriesByName("first-contentful-paint")[0]?.startTime??null,domReady:performance.getEntriesByType("navigation")[0]?.domContentLoadedEventEnd??null,resources:performance.getEntriesByType("resource").reduce((s,r)=>s+r.transferSize,0)})')});
        await screenshot(`artifacts/noata-browser/${path==="/"?"home":path.slice(1)}-${width}-${theme}.png`);
      }
    }
  }
  await navigate("/");
  await waitFor(async()=>await evaluate('!document.querySelector(".nav-link-ai .nav-tag")'),"AI badge cleared after visiting AI");
  invariant(await evaluate('localStorage.getItem("noata:seen:guest:ai:1")==="1"'),"AI badge dismissal persists for the guest");
  await evaluate('localStorage.setItem("noata-locale","en")');
  await navigate("/");
  await waitFor(async()=>await evaluate('document.documentElement.lang==="en" && document.documentElement.dir==="ltr" && !!Array.from(document.querySelectorAll(".sidebar-nav .nav-link")).find(x=>x.textContent.includes("Home"))'),"English navigation and LTR");
  invariant(await evaluate('document.querySelector(".skip-link")?.textContent?.includes("Skip to content")'),"English skip link follows locale");
  // Every public route must honor English, including the guest/error states.
  // Authenticated content selection is covered separately by isolated fixtures.
  for(const path of ["/","/learn","/missions","/review","/boss","/progress","/rewards","/assignments","/notifications","/ai","/settings","/teacher","/admin","/help","/privacy","/terms","/login","/login?mode=signup"]){
    await navigate(path);
    await waitFor(()=>evaluate('document.documentElement.lang==="en" && document.documentElement.dir==="ltr"'),"English root on "+path);
    const leaked=await evaluate(`(()=>{const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),found=[];while(walker.nextNode()){const node=walker.currentNode,el=node.parentElement,text=node.textContent.trim();if(!text||!el||el.closest('script,style,option,[lang="ar"]')||!el.getClientRects().length||text==='العربية'||text==='Language / اللغة')continue;if(/[\\u0600-\\u06ff]/.test(text))found.push(text.slice(0,160));}return found})()`);
    invariant(leaked.length===0,"English interface has no Arabic copy on "+path+": "+leaked.join(" | "));
    invariant(await evaluate('document.documentElement.scrollWidth-innerWidth<=3'),"English layout fits "+path);
    if(path==="/ai")invariant(await evaluate('getComputedStyle(document.querySelector(".owui-layout")).direction==="ltr"'),"English AI workspace uses actual LTR layout");
  }
  for(const width of [1440,768,390]) {
    location.width=width;
    await command("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:width<=768});
    await navigate("/settings");
    invariant(await evaluate('document.documentElement.dir==="ltr" && document.querySelector("#noata-ai-design-studio")?.textContent?.includes("My designs") && document.documentElement.scrollWidth-innerWidth<=3'),"English Design Studio and LTR layout at "+width);
    await screenshot("artifacts/noata-browser/settings-en-"+width+".png");
  }
  await evaluate('localStorage.setItem("noata-locale","ar")');
  await navigate("/");
  invariant(await evaluate('document.documentElement.lang==="ar" && document.documentElement.dir==="rtl" && !!Array.from(document.querySelectorAll(".sidebar-nav .nav-link")).find(x=>x.textContent.includes("الرئيسية"))'),"Arabic navigation and RTL restored");
  for(const [width,height,mobile] of [[1920,1080,false],[1440,900,false],[1024,768,false],[768,1024,true],[390,844,true],[320,700,true]]) {
    location.width=width;
    await command("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile});
    for(const theme of ["light","dark"]) {
      location.theme=theme;
      console.log("[browser] viewport/theme",width,theme);
      await command("Emulation.setEmulatedMedia",{features:[{name:"prefers-color-scheme",value:theme}]});
      await navigate("/ai");
      const r=await evaluate(`({
        overflow:document.documentElement.scrollWidth-innerWidth,
        input:!!document.querySelector(".owui-composer textarea"),
        side:!!document.querySelector(".owui-layout"),
        visible:!!document.querySelector(".owui-model-trigger"),
        direction:document.documentElement.dir,
        theme:document.documentElement.dataset.theme
      })`);
      invariant(r.overflow <= 3,`/ai ${width} ${theme} overflow ${r.overflow}`);
      invariant(r.input&&r.side&&r.visible,`/ai ${width} ${theme} missing controls`);
      invariant(r.direction==="rtl",`/ai ${width} ${theme} RTL`);
      invariant(r.theme===theme,`/ai ${width} ${theme} appearance did not follow system: ${r.theme}`);
      await screenshot(`artifacts/noata-browser/ai-${width}-${theme}.png`);
    }
  }
  // Exercise hydrated React interaction without creating an account or an AI inference.
  await command("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await navigate("/ai");
  const ready = await waitFor(async()=>await evaluate(`({
    suggestions: !!document.querySelector(".noata-suggested-actions.welcome .noata-suggested-item"),
    loading: !!document.querySelector(".owui-loading"),
    error: document.querySelector('[role="alert"]')?.textContent?.slice(0,200) ?? "",
    text: document.querySelector(".owui-messages")?.innerText?.slice(0,200) ?? ""
  })`), "AI workspace DOM");
  console.log("[browser] AI bootstrap state", JSON.stringify(ready));
  await waitFor(async()=>await evaluate('document.querySelectorAll(".noata-suggested-actions.welcome .noata-suggested-item").length === 4 && [...document.querySelectorAll(".noata-suggested-actions.welcome .noata-suggested-item")].every(button => !button.disabled && button.textContent?.trim())'), "four interactive AI welcome suggestions / bounded auth initialization", 26000);
  // ONE shell contracts: one composer, keyboard-accessible menus, seven widths,
  // both reading directions, no separate creation dashboard. These are UI fixtures.
  for(const oneLocale of ["en","ar"]){
    await evaluate('localStorage.setItem("noata-locale",'+JSON.stringify(oneLocale)+')');
    for(const oneWidth of [320,375,390,768,1024,1440,1920]){
      await command("Emulation.setDeviceMetricsOverride",{width:oneWidth,height:900,deviceScaleFactor:1,mobile:oneWidth<=768});
      await navigate("/ai");
      const shape=await evaluate('(()=>{const input=document.querySelector(".owui-composer textarea"),welcome=document.querySelector(".owui-welcome"),suggestions=document.querySelector(".noata-suggested-actions.welcome");const a=input?.getBoundingClientRect(),b=welcome?.getBoundingClientRect(),c=suggestions?.getBoundingClientRect();return{landmarks:document.querySelectorAll("main,[role=main]").length,inputs:document.querySelectorAll(".owui-composer textarea").length,locale:document.documentElement.lang,dir:document.querySelector(".owui-layout")?.getAttribute("dir"),overflow:document.documentElement.scrollWidth-innerWidth,input:a&&{left:a.left,right:a.right,top:a.top,bottom:a.bottom},welcomeBottom:b?.bottom,suggestionsTop:c?.top,starters:suggestions?.querySelectorAll("button").length,old:!!document.querySelector(".noata-launchpad,.owui-tool-panel,.noata-inline-export")}})()');
      invariant(shape.locale===oneLocale&&shape.dir===(oneLocale==="en"?"ltr":"rtl"),"ONE locale at "+oneWidth);
      invariant(shape.landmarks===1&&shape.inputs===1&&shape.starters===4&&!shape.old,"ONE single composer and contextual suggestions");
      invariant(shape.overflow<=3&&shape.input.left>=-1&&shape.input.right<=oneWidth+1&&shape.input.top>=0&&shape.input.bottom<=900,"ONE composer visible at "+oneWidth);
      invariant(shape.welcomeBottom<=shape.input.top+1&&shape.suggestionsTop>=shape.input.bottom,"ONE greeting, composer, suggestions reading order");
      // Model selection must stay onscreen in every reading direction; former
      // position:fixed inside the backdrop-filter header placed it above view.
      await evaluate('document.querySelector(".owui-model-trigger").click()');
      const menuShape=await waitFor(async()=>await evaluate(`(()=>{
        const trigger=document.querySelector(".owui-model-trigger"),menu=document.querySelector(".owui-model-menu.aura-model-gallery"),list=menu?.querySelector(".aura-model-gallery-list");
        if(!trigger||!menu||!list)return null;
        const r=menu.getBoundingClientRect(),t=trigger.getBoundingClientRect();
        return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,triggerBottom:t.bottom,
          w:innerWidth,h:innerHeight,expanded:trigger.getAttribute("aria-expanded"),
          options:list.querySelectorAll(".aura-model-card").length,close:!!menu.querySelector(".aura-model-gallery-dismiss"),
          position:getComputedStyle(menu).position};
      })()`),"model gallery at "+oneWidth);
      invariant(menuShape.expanded==="true"&&menuShape.close&&menuShape.options>=2,
        "Model gallery has working menu options at "+oneWidth);
      invariant(menuShape.left>=-1&&menuShape.right<=menuShape.w+1&&menuShape.top>=0&&menuShape.bottom<=menuShape.h+1&&menuShape.top>=menuShape.triggerBottom-2,
        "Model gallery is fully visible below header at "+oneWidth+": "+JSON.stringify(menuShape));
      if(oneWidth<=640)invariant(menuShape.position==="absolute","Model gallery avoids fixed positioning on phones");
      const modelScroll=await evaluate(`(()=>{
        const list=document.querySelector(".aura-model-gallery-list");list.scrollTop=list.scrollHeight;
        const last=list.lastElementChild?.getBoundingClientRect(),box=list.getBoundingClientRect();
        return !!last&&last.top>=box.top-2&&last.bottom<=box.bottom+2;
      })()`);
      invariant(modelScroll,"Last model option reachable in scrollable list at "+oneWidth);
      if([320,390,768,1440].includes(oneWidth))await screenshot("artifacts/noata-browser/one-models-"+oneLocale+"-"+oneWidth+".png");
      await evaluate('document.querySelector(".aura-model-gallery-dismiss").click()');
      invariant(await evaluate('!document.querySelector(".owui-model-menu")&&document.querySelector(".owui-model-trigger").getAttribute("aria-expanded")==="false"'),
        "Model gallery closes cleanly at "+oneWidth);
      if([390,1440].includes(oneWidth))await screenshot("artifacts/noata-browser/one-"+oneLocale+"-"+oneWidth+".png");
    }
  }
  await evaluate('localStorage.setItem("noata-ai-motion-v1","off")');
  await navigate("/ai");
  invariant(await evaluate('document.documentElement.getAttribute("data-noata-motion")==="off"'),"ONE saved motion applied before Settings opens");
  invariant(await evaluate('document.querySelector(".owui-composer-wrap").getAnimations().every(a=>a.playState!=="running")'),"ONE motion off has no composer animation");
  await evaluate('localStorage.removeItem("noata-ai-motion-v1");localStorage.setItem("noata-locale","ar")');
  await command("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await navigate("/ai");
  // Conversation-first layout: no disconnected AI Tools dashboard.
  invariant(await evaluate('!document.querySelector(".owui-tool-toggle,.owui-tool-panel,.noata-launchpad")'),
    "No redundant AI Tools tab/panel or oversized six-card launchpad");
  invariant(await evaluate('!!document.querySelector(".owui-input-menu-wrap > button")'),
    "Attachments and real document creation remain available via one compact composer menu");
  await openWritingStudioFromComposer();
  await waitFor(async()=>await evaluate('!!document.querySelector("dialog[open] .aura-studio")'),
    "Compact composer opens functional writing studio");
  await evaluate('document.querySelector("dialog[open] .dialog-heading button").click()');
  await waitFor(async()=>await evaluate('!document.querySelector("dialog[open] .aura-studio")'),
    "Document editor closes without unsaved work");
  await evaluate('document.querySelector(".noata-suggested-actions.welcome .noata-suggested-item").click()');
  const draft=await waitFor(async()=>await evaluate('document.querySelector(".owui-composer textarea")?.value || ""'),"React suggestion populating composer");
  invariant(draft.length>15,"AI suggestion was visual-only and did not update draft");
  await evaluate('document.querySelector(".owui-model-trigger")?.click()');
  const modelMenu=await waitFor(async()=>await evaluate('!!document.querySelector(".owui-model-menu")'),"model menu opens");
  invariant(modelMenu,"AI model selector failed to open");


  // Responsive workshop regression: one internal scroller and visible actions.
  await evaluate('document.querySelector(\'[aria-label="افتح ورشة المذاكرة"]\').click()');
  await waitFor(async()=>await evaluate('!!document.querySelector("dialog[open].noata-dialog--workshop .aura-workshop-scroll")'),"Workshop dialog opens");
  invariant(await evaluate('document.querySelectorAll("dialog[open] .aura-workshop-flows button").length===9'),"Nine workshop flows available");
  await evaluate('document.querySelectorAll("dialog[open] .aura-workshop-flows button")[1].click()');
  invariant(await evaluate('document.querySelectorAll("dialog[open] .aura-workshop-flows button[aria-pressed=true]").length===1'),"Workshop pressed selection");
  for (const [workshopWidth,workshopHeight] of [[1920,1080],[1024,768],[768,1024],[390,844],[320,700]]) {
    location.width=workshopWidth;
    await command("Emulation.setDeviceMetricsOverride",{width:workshopWidth,height:workshopHeight,deviceScaleFactor:1,mobile:workshopWidth<=768});
    const wr=await evaluate('(()=>{const d=document.querySelector("dialog[open].noata-dialog--workshop"),sc=d?.querySelector(".aura-workshop-scroll"),foot=d?.querySelector(".aura-workshop-footer");if(!d||!sc||!foot)return null;const dr=d.getBoundingClientRect(),sr=sc.getBoundingClientRect(),fr=foot.getBoundingClientRect();return {viewport:innerWidth,dialogLeft:dr.left,dialogRight:dr.right,footerBottom:fr.bottom,footerTop:fr.top,scrollBottom:sr.bottom,dialogOverflow:getComputedStyle(d).overflowY,scrollOverflow:getComputedStyle(sc).overflowY,scrollWidth:document.documentElement.scrollWidth-innerWidth}})()');
    invariant(wr!==null,"Workshop "+workshopWidth+" missing scroll layout");
    invariant(wr.scrollWidth<=3,"Workshop "+workshopWidth+" horizontal overflow: "+wr.scrollWidth);
    invariant(wr.dialogLeft>=-3&&wr.dialogRight<=wr.viewport+3,"Workshop "+workshopWidth+" outside viewport");
    invariant(wr.dialogOverflow==="hidden"&&wr.scrollOverflow==="auto","Workshop "+workshopWidth+" double-scrolling");
    invariant(wr.footerBottom<=workshopHeight+3&&wr.footerTop>wr.scrollBottom-3,"Workshop "+workshopWidth+" inaccessible actions");
    await screenshot("artifacts/noata-browser/workshop-"+workshopWidth+".png");
  }
  await evaluate('document.querySelector("dialog[open].noata-dialog--workshop .dialog-heading button").click()');
  await waitFor(async()=>await evaluate('!document.querySelector("dialog[open].noata-dialog--workshop")'),"Workshop dialog closes");
  // Specifically guard the sidebar regressions reported on the visual preview.
  await command("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await navigate("/ai");
  await waitFor(async()=>await evaluate('!!document.querySelector(".owui-layout>.noata-organized-sidebar")'),"expanded Noata sidebar");
  const sidebarLayout=await evaluate('(()=>{const sidebar=document.querySelector(".owui-layout>.noata-organized-sidebar"),quick=sidebar?.querySelector(".noata-quick-grid"),search=sidebar?.querySelector(".noata-sidebar-search");if(!sidebar||!quick||!search)return null;const r=sidebar.getBoundingClientRect(),q=quick.getBoundingClientRect();return {width:r.width,quickRight:q.right,sidebarRight:r.right,searchRight:search.getBoundingClientRect().right,links:quick.querySelectorAll(".noata-quick-link").length}})()');
  invariant(sidebarLayout&&sidebarLayout.width>=305&&sidebarLayout.quickRight<=sidebarLayout.sidebarRight+2&&sidebarLayout.searchRight<=sidebarLayout.sidebarRight+2&&sidebarLayout.links>=1,"AI sidebar is spacious and not clipped");
  await evaluate('document.querySelector(".owui-layout>.noata-organized-sidebar .owui-sidebar-top>button").click()');
  await waitFor(async()=>await evaluate('!!document.querySelector(".owui-layout>.noata-compact-rail")'),"compact Noata rail");
  const compact=await evaluate('(()=>{const icons=Array.from(document.querySelectorAll(".owui-layout .noata-compact-rail .owui-rail svg[data-icon]")).map(i=>i.dataset.icon);return {icons,count:icons.length,unique:new Set(icons).size,rail:document.querySelector(".noata-compact-rail").getBoundingClientRect().width}})()');
  invariant(compact.count>=5&&compact.count===compact.unique&&compact.rail>=64&&compact.rail<=80,"Collapsed rail must use distinct, intentional actions: "+JSON.stringify(compact));
  await screenshot("artifacts/noata-browser/ai-navigation-compact-desktop.png");
  await evaluate('document.querySelector(".noata-compact-rail .owui-rail-toggle").click()');
  await waitFor(async()=>await evaluate('!!document.querySelector(".owui-layout>.noata-organized-sidebar")'),"expanded sidebar restore");
  await screenshot("artifacts/noata-browser/ai-navigation-expanded-desktop.png");

  for(const authWidth of [1440,390,320]){
    location.width=authWidth;
    await command("Emulation.setDeviceMetricsOverride",{width:authWidth,height:900,deviceScaleFactor:1,mobile:authWidth<=768});
    await navigate("/login");
    const ar=await evaluate('(()=>{const card=document.querySelector(".auth-card"),google=document.querySelector(".auth-google");if(!card||!google)return null;const r=card.getBoundingClientRect();return {left:r.left,right:r.right,viewport:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,googleLabel:google.textContent}})()');
    invariant(ar!==null&&ar.googleLabel.includes("Google"),"Auth "+authWidth+" missing Google entry");
    invariant(ar.overflow<=3&&ar.left>=-3&&ar.right<=ar.viewport+3,"Auth "+authWidth+" overflow");
    const pass=await evaluate('(()=>{const input=document.querySelector(".auth-password input"),button=document.querySelector(".auth-password button");if(!input||!button)return null;const r=input.getBoundingClientRect(),b=button.getBoundingClientRect();return {reserved:parseFloat(getComputedStyle(input).paddingRight),buttonSpace:r.right-b.left,within:b.left>=r.left&&b.right<=r.right+2,label:button.getAttribute("aria-label")}})()');
    invariant(pass&&pass.within&&pass.reserved>=pass.buttonSpace+5&&pass.label,"Auth "+authWidth+" password show/hide overlaps the input: "+JSON.stringify(pass));
    await screenshot("artifacts/noata-browser/auth-"+authWidth+".png");
  }
  // Real public browser audit for every stage of the Arabic recovery journey.
  // Never request actual reset emails from this non-authenticated browser fixture.
  for (const width of [1440,390,320]) {
    location.width=width;
    await command("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:width<=768});
    for(const [route,expected] of [
      ["/auth/forgot-password","رابط الاستعادة"],
      ["/auth/check-email?type=signup","حسابك"],
      ["/auth/check-email?type=recovery","الاستعادة"],
      ["/auth/error?reason=expired","صلاحية"],
      ["/auth/error?reason=invalid","صالح"],
      ["/auth/complete?type=verified","حسابك"],
      ["/auth/update-password","الاستعادة"],
    ]) {
      await navigate(route);
      await waitFor(async()=>await evaluate('!!document.querySelector(".auth-journey-card h1")'),"account journey "+route);
      const result=await evaluate('(()=>{const card=document.querySelector(".auth-journey-card");const r=card.getBoundingClientRect();return {title:card.querySelector("h1")?.textContent,scroll:document.documentElement.scrollWidth-innerWidth,left:r.left,right:r.right,viewport:innerWidth}})()');
      invariant(result.title&&result.scroll<=3&&result.left>=-3&&result.right<=result.viewport+3,"Broken "+route+" at "+width);
      await screenshot("artifacts/noata-browser/auth-flow-"+route.split("?")[0].split("/").at(-1)+"-"+width+(route.includes("?")?"-"+new URLSearchParams(route.split("?")[1]).values().next().value:"")+".png");
    }
    await navigate("/auth/update-password");
    await waitFor(async()=>await evaluate('!document.querySelector(".auth-journey-card h1")?.textContent.includes("جارٍ التحقق")'),"untrusted reset session denied");
    invariant(await evaluate('!document.querySelector(".auth-journey-card input[type=password]")'),"Password reset cannot be used without recovery verification");
  }
  await command("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});

  // Confirm dialogue must be centered in the actual browser top layer in both modes.
  for (const [width,height] of [[1440,900],[390,844],[320,700]]) {
    await command("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<=768});
    const rect=await evaluate('(()=>{const d=document.createElement("dialog");d.className="noata-confirm";d.innerHTML="<div class=noata-confirm-body><h2>مراجعة مغادرة الصفحة</h2><p>هل تريد المغادرة؟</p><div class=noata-confirm-actions><button>مغادرة الصفحة</button><button>البقاء</button></div></div>";document.body.appendChild(d);d.showModal();const r=d.getBoundingClientRect(),b=getComputedStyle(d);const v={left:r.left,top:r.top,width:r.width,height:r.height,viewportWidth:innerWidth,viewportHeight:innerHeight,overflow:b.overflowY};d.close();d.remove();return v})()');
    invariant(Math.abs(rect.left+(rect.width/2)-rect.viewportWidth/2)<4 && Math.abs(rect.top+(rect.height/2)-rect.viewportHeight/2)<4,"Confirm modal not centered at "+width);
    invariant(rect.left>=6&&rect.left+rect.width<=width-6,"Confirm modal clipped at "+width);
  }
  await command("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await navigate("/");
  await waitFor(async()=>await evaluate('!!document.querySelector(".notification-bell")'),"Notification bell visible");
  const badge=await evaluate('(()=>{const bell=document.querySelector(".notification-bell"),count=document.createElement("b");count.textContent="٩٩+";count.dataset.qa="count";bell.appendChild(count);const a=bell.getBoundingClientRect(),b=count.getBoundingClientRect(),sty=getComputedStyle(count);const r={height:b.height,width:b.width,inBellCorner:b.top<a.top+8&&b.right>a.left+4,fontSize:parseFloat(sty.fontSize),rounded:sty.borderRadius};count.remove();return r})()');
  invariant(badge.height>=20 && badge.width>=20 && badge.fontSize>=10 && badge.inBellCorner,"Notification badge alignment and size");
  await navigate("/help");
  await waitFor(async()=>await evaluate('document.querySelectorAll(".aura-help-topic").length>5'),"Help topics");
  const countBefore=await evaluate('document.querySelectorAll(".aura-help-topic").length');
  invariant(countBefore>5,"Help topics missing");
  await evaluate('(()=>{const el=document.querySelector(".aura-help-search input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,"PDF");el.dispatchEvent(new Event("input",{bubbles:true}));})()');
  await waitFor(async()=>await evaluate('document.querySelectorAll(".aura-help-topic").length>0&&document.querySelectorAll(".aura-help-topic").length<10'),"Help search");
  const countAfter=await evaluate('document.querySelectorAll(".aura-help-topic").length');
  invariant(countAfter<countBefore,"Help search did not filter entries");
  await evaluate('document.querySelector(".aura-help-topic > button")?.click()');
  invariant(await evaluate('document.querySelector(".aura-help-topic > button")?.getAttribute("aria-expanded")==="true"'),"Help FAQ was not expandable");
  invariant(await evaluate('!!document.querySelector(".aura-help-answer")'),"Help answer not rendered");
  await verifyToolThemeContrast();
  await verifyWritingAndTheme();
  await verifyContextualCoach();
  await verifyPaletteBrandConsistency();
  await verifyDocuments();
  await verifyQuranControls();
  await verifyPublicCurriculum({browser,evaluate,navigate,waitFor,invariant,auditView:auditSyntheticView});
  await verifyUiAccountContracts({browser,evaluate,navigate,waitFor,invariant,screenshot,base,auditView:auditSyntheticView});
  // Keep a bounded trace over the final reduced-motion/reflow interaction only.
  await command("Tracing.start",{categories:"devtools.timeline,blink.user_timing",transferMode:"ReturnAsStream"});
  await command("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await command("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"},{name:"prefers-color-scheme",value:"light"}]});
  await navigate('/ai');
  invariant(await evaluate('parseFloat(getComputedStyle(document.querySelector(".owui-welcome")).animationDuration)<=0.01'),"Reduced motion disables welcome animation");
  // Browser zoom halves the CSS viewport and doubles device pixels. CSS `zoom`
  // alone does not update media queries or viewport units, so it is not equivalent.
  await command("Emulation.setDeviceMetricsOverride",{width:720,height:500,deviceScaleFactor:2,mobile:false});
  invariant(await evaluate('(()=>{const r=document.querySelector(".owui-composer textarea").getBoundingClientRect();return r.left>=-3&&r.right<=innerWidth+3&&r.top>=0&&r.bottom<=innerHeight+3&&document.documentElement.scrollWidth<=innerWidth+3})()'),"AI composer remains visible at 200 percent equivalent viewport reflow");
  await screenshot('artifacts/noata-browser/ai-zoom-200-reduced-motion.png');
  const traceReady=new Promise((resolve,reject)=>{
    const cleanup=()=>{clearTimeout(timer);socket.removeEventListener('message',listener);socket.removeEventListener('close',closed);};
    const listener=({data})=>{const e=JSON.parse(String(data));if(e.method==='Tracing.tracingComplete'){cleanup();resolve(e.params.stream);}};
    const closed=event=>{cleanup();reject(Error('Chrome disconnected before trace completion: '+event.code));};
    const timer=setTimeout(()=>{cleanup();reject(Error('Chrome trace completion timed out'));},15000);
    socket.addEventListener('message',listener);socket.addEventListener('close',closed);
  });
  const [,handle]=await Promise.all([command("Tracing.end"),traceReady]);let trace="";
  for(;;){const chunk=await command("IO.read",{handle});trace+=chunk.base64Encoded?Buffer.from(chunk.data,"base64").toString():chunk.data;if(chunk.eof)break;}
  await command("IO.close",{handle});await writeFile("artifacts/noata-browser/browser-trace.json",trace);
  await writeFile("artifacts/noata-browser/accessibility.json",JSON.stringify(accessibility,null,2));
  await writeFile("artifacts/noata-browser/performance.json",JSON.stringify(performanceResults,null,2));
  const violations=accessibility.flatMap(a=>a.violations.map(v=>a.path+" "+a.width+" "+a.theme+" "+v.id+" "+JSON.stringify(v.nodes.map(n=>n.target))));
  invariant(violations.length===0,"Accessibility violations: "+violations.join("; "));
  invariant(browserErrors.length===0,"Uncaught browser exceptions: "+browserErrors.join(","));
  invariant(performanceResults.every(r=>r.resources<2*1024*1024),"Public route transferred resources remain below 2 MiB per navigation");
  console.log(`Noata browser QA PASS: ${checks} public-browser assertions; ${new Set(captures.map(c=>c.file)).size} route/theme/document/responsive screenshots.`);
  console.log("Authenticated student/teacher/admin E2E: NOT RUN (requires disposable credentials and protected preview access).");
}
let failure = null;
try { await main(); }
catch(error) { failure = error; console.error(error); }
finally {
  await writeFile("artifacts/noata-browser/accessibility.json",JSON.stringify(accessibility,null,2)).catch(()=>{});
  await writeFile("artifacts/noata-browser/performance.json",JSON.stringify(performanceResults,null,2)).catch(()=>{});
  await writeFile("artifacts/noata-browser/captures.json",JSON.stringify(captures,null,2)).catch(()=>{});
  await writeFile("artifacts/noata-browser/server.log",appLog).catch(()=>{});
  try{await browser?.close();}catch(error){failure??=error;console.error(error);}
  const endingRevision=spawnSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).stdout.trim();
  if(endingRevision!==testedRevision)failure??=Error("Repository revision changed during browser QA");
  await writeFile("artifacts/noata-browser/outcome.json",JSON.stringify({passed:!failure,revision:testedRevision,endingRevision,dirty:initiallyDirty||!!spawnSync("git",["status","--porcelain"],{encoding:"utf8"}).stdout.trim(),assertions:checks,routeViews:accessibility.filter(a=>a.kind==="public").length,syntheticUiViews:accessibility.filter(a=>a.kind==="synthetic-ui-only").length,screenshots:new Set(captures.map(c=>c.file)).size,browserErrors,failure:diagnosticError(failure),chrome:browser?.diagnostics??failure?.diagnostics??null},null,2)).catch(()=>{});
  if(app){try{process.kill(-app.pid,"SIGTERM");}catch{app.kill("SIGTERM");}}
  // pnpm/Next can leave inherited pipe handles open after child termination.
  // Exit explicitly AFTER reporting the actual pass/fail result to CI.
  process.exit(failure ? 1 : 0);
}
