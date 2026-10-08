// Dependency-free Noata Aura browser smoke on Node 24 + runner Chrome.
// Real browser layout/RTL/theme/render assertions; not an authenticated E2E claim.
import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

const binary = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]
  .find((b) => spawnSync("which", [b], {stdio: "ignore"}).status === 0);
if (!binary) throw new Error("Browser QA requires Chrome or Chromium on the runner");
const base = "http://127.0.0.1:3000";
let app, chrome, socket, nextId = 0;
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
async function main() {
  await mkdir("artifacts/noata-browser",{recursive:true});
  app=spawn("pnpm",["--filter","@noata/web","start"],{stdio:"pipe",env:{...process.env,PORT:"3000"}});
  let appLog="";
  app.stdout.on("data",chunk=>appLog+=String(chunk).slice(-2000));
  app.stderr.on("data",chunk=>appLog+=String(chunk).slice(-2000));
  await waitFor(async()=>{const r=await fetch(base+"/health");return r.ok&&(await r.json()).ok===true;}, "Next production server",30000);
  chrome=spawn(binary,["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu","--disable-background-networking","--remote-debugging-port=9228","--remote-allow-origins=*","about:blank"],{stdio:"ignore"});
  const tabs=await waitFor(async()=>{const r=await fetch("http://127.0.0.1:9228/json");const arr=await r.json();return arr.find(x=>x.type==="page"&&x.webSocketDebuggerUrl);},"Chrome debugger");
  await connect(tabs.webSocketDebuggerUrl);
  await command("Page.enable");
  await command("Runtime.enable");

  const routes=["/","/ai","/learn","/missions","/review","/boss","/progress","/rewards","/assignments","/settings","/help","/quran"];
  await command("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await command("Emulation.setEmulatedMedia",{features:[{name:"prefers-color-scheme",value:"light"}]});
  for(const path of routes) {
    console.log("[browser] checking route",path);
    await navigate(path);
    const result=await evaluate(`({hasBody: !!document.body, rtl:document.documentElement.dir==="rtl", overflow:document.documentElement.scrollWidth - innerWidth, title:document.title, hasAI:!!document.querySelector(".owui-layout")})`);
    invariant(result.hasBody,path+" empty body");
    invariant(result.rtl,path+" missing Arabic RTL root");
    invariant(result.overflow <= 3,path+" horizontal overflow "+result.overflow);
    if(path==="/ai") invariant(result.hasAI,"AI workspace missing");
    if(path==="/quran"){
      const reader=await evaluate('!!document.querySelector(".aura-quran-reading")');
      invariant(reader,"Quran reader UI missing");
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
  await verifyQuranControls();
  console.log(`Noata browser QA PASS: ${checks} public-browser assertions; 12 responsive screenshots.`);
  console.log("Authenticated student/teacher/admin E2E: NOT RUN (requires disposable credentials and protected preview access).");
}
let failure = null;
try { await main(); }
catch(error) { failure = error; console.error(error); }
finally {
  socket?.close();
  if(chrome) chrome.kill("SIGTERM");
  if(app) app.kill("SIGTERM");
  // pnpm/Next can leave inherited pipe handles open after child termination.
  // Exit explicitly AFTER reporting the actual pass/fail result to CI.
  process.exit(failure ? 1 : 0);
}
