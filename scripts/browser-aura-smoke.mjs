// Noata Aura browser smoke on Node 24 + runner Chrome and axe-core.
// Real browser layout/RTL/theme/render assertions; not an authenticated E2E claim.
import {resolve} from "node:path";
import {launchQaBrowser,findQaChrome,diagnosticError} from "./lib/qa-browser.mjs";
import {verifyUiAccountContracts} from "./lib/ui-account-fixture.mjs";
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
const base = "http://127.0.0.1:3000";
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
  await waitFor(async()=> {
    const state=await evaluate("({ready: document.readyState, path: location.pathname, size: document.body?.innerText?.length || 0})");
    return state.ready === "complete" && state.path === path && state.size > 30;
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
async function auditView(kind) {
await evaluate(axeSource);
        const audit=await evaluate('Promise.race([axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa","wcag22aa"]}}).then(r=>({violations:r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>v.id)})),new Promise((_,reject)=>setTimeout(()=>reject(Error("axe audit exceeded 16 seconds")),16000))])',"axe accessibility audit",22000);
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
      await evaluate('Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))',"settled synthetic theme");
      invariant(await evaluate("document.documentElement.scrollWidth-innerWidth<=3"),name+" synthetic viewport overflow "+width);
      await auditView("synthetic-ui-only");
      await screenshot(`artifacts/noata-browser/${name}-synthetic-${width}-${theme}.png`);
    }
  }
  await command("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
}
async function verifyQuranControls(){
  // No production code is altered. Mocked responses make interactive UI
  // behavior repeatable even when the external Quran API is temporarily down.
  const fixture = [
    {number:1,text:"آية تجريبية أولى",globalNumber:1,audio:null},
    {number:2,text:"آية تجريبية ثانية",globalNumber:2,audio:null},
  ];
  const script = `(()=>{
    const originalFetch=window.fetch;
    window.fetch=async (input,options)=>{
      const url=String(input?.url??input);
      if(url.startsWith("/api/quran")){
        const params=new URL(url,location.origin).searchParams;
        if(params.get("list")==="1"){
          return new Response(JSON.stringify({surahs:[
            {number:1,name:"الفاتحة",englishName:"Al-Faatiha",numberOfAyahs:2},
            {number:2,name:"البقرة",englishName:"Al-Baqara",numberOfAyahs:2}
          ]}),{status:200,headers:{"Content-Type":"application/json"}});
        }
        if(params.has("search")){
          return new Response(JSON.stringify({results:[{surah:1,surahName:"الفاتحة",number:2,text:"آية تجريبية ثانية"}],total:1}),{status:200,headers:{"Content-Type":"application/json"}});
        }
        const n=Number(params.get("surah")??1);
        return new Response(JSON.stringify({surah:{number:n,name:n===1?"الفاتحة":"البقرة",englishName:"Example",numberOfAyahs:2},verses:${JSON.stringify(fixture)},source:{name:"CI TEST FIXTURE",edition:"fixture",reference:"https://alquran.cloud/api",audioEdition:"fixture"}}),{status:200,headers:{"Content-Type":"application/json"}});
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
    await evaluate('(()=>{const s=document.querySelector("select[aria-label=\\\"اختيار سورة\\\"]");s.value="2";s.dispatchEvent(new Event("change",{bubbles:true}));})()');
    await waitFor(async()=>await evaluate('document.querySelector(".aura-quran-chapter h2")?.innerText.includes("البقرة")'),"Quran chapter navigation");
    invariant(await evaluate('document.querySelector(".aura-quran-chapter h2")?.innerText.includes("البقرة")'),"Quran surah chooser");
    await evaluate('(()=>{const el=document.querySelector("input[aria-label=\\\"البحث في القرآن\\\"]");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(el,"التجريبية");el.dispatchEvent(new Event("input",{bubbles:true}));})()');
    await evaluate('document.querySelector(".aura-quran-search")?.requestSubmit()');
    await waitFor(async()=>await evaluate('document.querySelectorAll(".aura-quran-search-results button").length>0'),"Quran search matches");
    invariant(await evaluate('document.querySelectorAll(".aura-quran-search-results button").length>0'),"Quran search UI");
    console.log("[browser] Quran interactions verified with deterministic test-only API fixture");
  } finally {
    await command("Page.removeScriptToEvaluateOnNewDocument",{identifier:install.identifier});
  }
}
async function verifyWritingAndTheme(){
  await navigate("/ai");
  await waitFor(async()=>await evaluate('!!document.querySelector(".aura-writing-entry")'),"writing entry");
  await evaluate('document.querySelector(".aura-writing-entry").click()');
  invariant(await evaluate('!!document.querySelector("dialog[open] .aura-studio textarea")'),"Writing studio opens");
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
  await evaluate('document.querySelector(".aura-writing-entry").click()');
  await waitFor(async()=>await evaluate('document.querySelector("dialog[open] .aura-studio textarea")?.value.includes("مستند عربي")'),"writing draft restores on reopening");
  invariant(true,"Writing draft survives close and reopen");
  await command("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  await evaluate('Array.from(document.querySelectorAll(".aura-studio-close-confirm button")).find(b=>b.textContent.includes("تجاهل")).click()');
  await waitFor(async()=>await evaluate('!document.querySelector("dialog[open]")'),"discard confirmed draft close");
  await evaluate('document.querySelector(".aura-writing-entry").click()');
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
async function verifyDocuments(){
  for(const [name,marker] of [["source.txt","مصدر فعلي"],["source.md","محتوى Markdown"],["source.csv","المفهوم"],["source.json","محتوى JSON"],["arabic-longform.docx","تجربة تعلّم"],["arabic-longform.pdf",null]]){
    await navigate("/ai");
    await waitFor(async()=>await evaluate('!!document.querySelector(".owui-suggestions button")'),"AI hydration");
    const dom=await command("DOM.getDocument");const input=await command("DOM.querySelector",{nodeId:dom.root.nodeId,selector:"input[type=file]"});
    invariant(!!input.nodeId,"Document picker exists");
    await command("DOM.setFileInputFiles",{nodeId:input.nodeId,files:[resolve("artifacts/noata-documents/"+name)]});
    await waitFor(async()=>await evaluate('!!document.querySelector(".aura-pending-preview")'),"selected document preview button");
    await evaluate('document.querySelector(".aura-pending-preview").click()');
    if(marker){await waitFor(async()=>await evaluate('document.querySelector(".aura-original-preview pre")?.textContent.includes('+JSON.stringify(marker)+')'),"real file preview: "+name);invariant(true,"Real "+name+" content");}
    else {await waitFor(async()=>await evaluate('document.querySelector(".aura-original-preview canvas")?.width>0&&document.querySelector(".aura-pdf-pagination")?.textContent.includes("11")'),"real PDF page preview");invariant(true,"Real PDF page preview");await evaluate('Array.from(document.querySelectorAll(".aura-pdf-pagination button")).find(x=>x.textContent.includes("التالي")).click()');await waitFor(async()=>await evaluate('document.querySelector(".aura-pdf-pagination")?.textContent.includes("صفحة 2")'),"PDF next page");invariant(true,"PDF navigation");}
    invariant(await evaluate('!!document.querySelector(".aura-document-toolbar a[download]")'),"Original download available: "+name);
    await screenshot("artifacts/noata-browser/document-"+name.replaceAll(".","-")+".png");
    await command("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
    await waitFor(async()=>await evaluate('!document.querySelector("dialog[open]")'),"document modal Escape");
    invariant(true,"Document preview keyboard close");
  }
  await navigate('/ai');
  await waitFor(async()=>await evaluate('!!document.querySelector(".owui-suggestions button")'),"image fixture hydration");
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
  app=spawn("pnpm",["--filter","@noata/web","start"],{stdio:"pipe",detached:true,env:{...process.env,PORT:"3000"}});

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
    suggestions: !!document.querySelector(".owui-suggestions button"),
    loading: !!document.querySelector(".owui-loading"),
    error: document.querySelector('[role="alert"]')?.textContent?.slice(0,200) ?? "",
    text: document.querySelector(".owui-messages")?.innerText?.slice(0,200) ?? ""
  })`), "AI workspace DOM");
  console.log("[browser] AI bootstrap state", JSON.stringify(ready));
  await waitFor(async()=>await evaluate('!!document.querySelector(".owui-suggestions button")'), "AI welcome suggestions / bounded auth initialization", 26000);
  await evaluate('document.querySelector(".owui-suggestions button").click()');
  const draft=await waitFor(async()=>await evaluate('document.querySelector(".owui-composer textarea")?.value || ""'),"React suggestion populating composer");
  invariant(draft.length>15,"AI suggestion was visual-only and did not update draft");
  await evaluate('document.querySelector(".owui-model-trigger")?.click()');
  const modelMenu=await waitFor(async()=>await evaluate('!!document.querySelector(".owui-model-menu")'),"model menu opens");
  invariant(modelMenu,"AI model selector failed to open");

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
  await verifyWritingAndTheme();
  await verifyDocuments();
  await verifyQuranControls();
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
