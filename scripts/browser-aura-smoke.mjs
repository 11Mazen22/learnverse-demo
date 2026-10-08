// Noata Aura browser smoke on Node 24 + runner Chrome and axe-core.
// Real browser layout/RTL/theme/render assertions; not an authenticated E2E claim.
import {resolve} from "node:path";
import {createRequire} from "node:module";
const require=createRequire(new URL("../apps/web/package.json",import.meta.url));
const axeSource=await readFile(require.resolve("axe-core/axe.min.js"),"utf8");
const accessibility=[],performanceResults=[];
import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile, mkdtemp, readFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

const binary = process.env.NOATA_CHROMIUM_PATH || ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]
  .find((b) => spawnSync("which", [b], {stdio: "ignore"}).status === 0);
if (!binary) throw new Error("Browser QA requires Chrome or Chromium on the runner");
const base = "http://127.0.0.1:3000";
let app, chrome, socket, nextId = 0, appLog="", chromeLog="";
const browserErrors=[];
const pending = new Map();
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
function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    socket = new WebSocket(wsUrl);
    socket.addEventListener("open", () => {
      socket.addEventListener("message", ({data}) => {
        const message = JSON.parse(String(data));
        if (!message.id) return;
        const entry = pending.get(message.id);
        if (!entry) return;
        pending.delete(message.id);
        if (message.error) entry.reject(new Error(message.error.message));
        else entry.resolve(message.result);
      });
      resolve();
    }, {once:true});
    socket.addEventListener("error", () => reject(new Error("Chrome CDP connection error")), {once:true});
  });
}
function command(method, params={}) {
  const id = ++nextId;
  return new Promise((resolve,reject)=>{
    const timer = setTimeout(()=>{pending.delete(id);reject(new Error("CDP timed out: "+method));},12000);
    pending.set(id, {
      resolve(v){clearTimeout(timer);resolve(v);},
      reject(e){clearTimeout(timer);reject(e);}
    });
    socket.send(JSON.stringify({id,method,params}));
  });
}
async function evaluate(expr) {
  const r = await command("Runtime.evaluate",{
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error("JS exception in browser");
  return r.result?.value;
}
async function navigate(path) {
  await command("Page.navigate",{url:base+path});
  await waitFor(async()=> {
    const state=await evaluate("({ready: document.readyState, path: location.pathname, size: document.body?.innerText?.length || 0})");
    return state.ready === "complete" && state.path === path && state.size > 30;
  }, path);
  await evaluate("document.fonts.ready.then(()=>true)");
}
async function screenshot(file) {
  const data = await command("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile(file,Buffer.from(data.data,"base64"));
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
  await waitFor(async()=>await evaluate('!document.querySelector("dialog[open]")'),"writing studio keyboard close");
  invariant(true,"Writing studio Escape close");
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

  app.stdout.on("data",chunk=>appLog+=String(chunk).slice(-2000));
  app.stderr.on("data",chunk=>appLog+=String(chunk).slice(-2000));
  await waitFor(async()=>{const r=await fetch(base+"/health");return r.ok&&(await r.json()).ok===true;}, "Next production server",30000);
  const profile=await mkdtemp("/tmp/noata-browser-");
  chrome=spawn(binary,["--user-data-dir="+profile,"--no-zygote","--single-process","--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu","--disable-background-networking","--remote-debugging-port=9228","--remote-allow-origins=*","about:blank"],{stdio:["ignore","ignore","pipe"]});
  chrome.stderr.on("data",data=>chromeLog+=String(data).slice(-2000));
  const tabs=await waitFor(async()=>{const r=await fetch("http://127.0.0.1:9228/json");const arr=await r.json();return arr.find(x=>x.type==="page"&&x.webSocketDebuggerUrl);},"Chrome debugger");
  await connect(tabs.webSocketDebuggerUrl);
  await command("Page.enable");
  await command("Runtime.enable");
  socket.addEventListener("message",({data})=>{const event=JSON.parse(String(data));if(event.method==="Runtime.exceptionThrown")browserErrors.push(event.params.exceptionDetails.text);});
  await command("Tracing.start",{categories:"devtools.timeline,loading,blink.user_timing",transferMode:"ReturnAsStream"});

  const routes=["/","/ai","/learn","/missions","/review","/boss","/progress","/rewards","/assignments","/settings","/help","/quran"];
  await command("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await command("Emulation.setEmulatedMedia",{features:[{name:"prefers-color-scheme",value:"light"}]});
  for(const width of [1440,390]) {
    await command("Emulation.setDeviceMetricsOverride",{width,height:900,deviceScaleFactor:1,mobile:width===390});
    for(const theme of ["light","dark"]) {
      await command("Emulation.setEmulatedMedia",{features:[{name:"prefers-color-scheme",value:theme}]});
      for(const path of routes) {
        console.log("[browser] checking route",path,width,theme);
        await navigate(path);
        const result=await evaluate(`({hasBody: !!document.body, rtl:document.documentElement.dir==="rtl", overflow:document.documentElement.scrollWidth - innerWidth, title:document.title, hasAI:!!document.querySelector(".owui-layout")})`);
        invariant(result.hasBody,path+" empty body");invariant(result.rtl,path+" missing Arabic RTL root");invariant(result.overflow <= 3,path+" horizontal overflow "+result.overflow);
        if(path==="/ai")invariant(result.hasAI,"AI workspace missing");
        if(path==="/quran")invariant(await evaluate('!!document.querySelector(".aura-quran-reading")'),"Quran reader UI missing");
        await evaluate(axeSource);
        const audit=await evaluate('axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa","wcag22aa"]}}).then(r=>({violations:r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>v.id)}))');
        accessibility.push({path,width,theme,...audit});
        performanceResults.push({path,width,theme,...await evaluate('({fcp:performance.getEntriesByName("first-contentful-paint")[0]?.startTime??null,domReady:performance.getEntriesByType("navigation")[0]?.domContentLoadedEventEnd??null,resources:performance.getEntriesByType("resource").reduce((s,r)=>s+r.transferSize,0)})')});
        await screenshot(`artifacts/noata-browser/${path==="/"?"home":path.slice(1)}-${width}-${theme}.png`);
      }
    }
  }
  for(const [width,height,mobile] of [[1920,1080,false],[1440,900,false],[1024,768,false],[768,1024,true],[390,844,true],[320,700,true]]) {
    await command("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile});
    for(const theme of ["light","dark"]) {
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
  await command("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await command("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"},{name:"prefers-color-scheme",value:"light"}]});
  await navigate('/ai');
  invariant(await evaluate('parseFloat(getComputedStyle(document.querySelector(".owui-welcome")).animationDuration)<=0.01'),"Reduced motion disables welcome animation");
  // Browser zoom halves the CSS viewport and doubles device pixels. CSS `zoom`
  // alone does not update media queries or viewport units, so it is not equivalent.
  await command("Emulation.setDeviceMetricsOverride",{width:720,height:500,deviceScaleFactor:2,mobile:false});
  invariant(await evaluate('(()=>{const r=document.querySelector(".owui-composer textarea").getBoundingClientRect();return r.left>=-3&&r.right<=innerWidth+3&&r.top>=0&&r.bottom<=innerHeight+3&&document.documentElement.scrollWidth<=innerWidth+3})()'),"AI composer remains visible at 200 percent equivalent viewport reflow");
  await screenshot('artifacts/noata-browser/ai-zoom-200-reduced-motion.png');
  const traceReady=new Promise(resolve=>socket.addEventListener("message",function listener({data}){const e=JSON.parse(String(data));if(e.method==="Tracing.tracingComplete"){socket.removeEventListener("message",listener);resolve(e.params.stream);}}));
  await command("Tracing.end");const handle=await traceReady;let trace="";
  for(;;){const chunk=await command("IO.read",{handle});trace+=chunk.base64Encoded?Buffer.from(chunk.data,"base64").toString():chunk.data;if(chunk.eof)break;}
  await command("IO.close",{handle});await writeFile("artifacts/noata-browser/browser-trace.json",trace);
  await writeFile("artifacts/noata-browser/accessibility.json",JSON.stringify(accessibility,null,2));
  await writeFile("artifacts/noata-browser/performance.json",JSON.stringify(performanceResults,null,2));
  const violations=accessibility.flatMap(a=>a.violations.map(v=>a.path+" "+a.width+" "+a.theme+" "+v.id+" "+JSON.stringify(v.nodes.map(n=>n.target))));
  invariant(violations.length===0,"Accessibility violations: "+violations.join("; "));
  invariant(browserErrors.length===0,"Uncaught browser exceptions: "+browserErrors.join(","));
  invariant(performanceResults.every(r=>r.resources<2*1024*1024),"Public route transferred resources remain below 2 MiB per navigation");
  console.log(`Noata browser QA PASS: ${checks} public-browser assertions; 68 route/theme/document/responsive screenshots.`);
  console.log("Authenticated student/teacher/admin E2E: NOT RUN (requires disposable credentials and protected preview access).");
}
let failure = null;
try { await main(); }
catch(error) { failure = error; console.error(error); }
finally {
  await writeFile("artifacts/noata-browser/accessibility.json",JSON.stringify(accessibility,null,2)).catch(()=>{});
  await writeFile("artifacts/noata-browser/performance.json",JSON.stringify(performanceResults,null,2)).catch(()=>{});
  await writeFile("artifacts/noata-browser/server.log",appLog).catch(()=>{});
  await writeFile("artifacts/noata-browser/chromium.log",chromeLog).catch(()=>{});
  await writeFile("artifacts/noata-browser/outcome.json",JSON.stringify({passed:!failure,revision:spawnSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).stdout.trim(),dirty:!!spawnSync("git",["status","--porcelain"],{encoding:"utf8"}).stdout.trim(),assertions:checks,browserErrors,failure:failure?.message??null},null,2)).catch(()=>{});
  socket?.close();
  if(chrome) chrome.kill("SIGTERM");
  if(app){try{process.kill(-app.pid,"SIGTERM");}catch{app.kill("SIGTERM");}}
  // pnpm/Next can leave inherited pipe handles open after child termination.
  // Exit explicitly AFTER reporting the actual pass/fail result to CI.
  process.exit(failure ? 1 : 0);
}
