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

  const routes=["/","/ai","/learn","/missions","/review","/boss","/progress","/rewards","/assignments","/settings","/help"];
  await command("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  await command("Emulation.setEmulatedMedia",{features:[{name:"prefers-color-scheme",value:"light"}]});
  for(const path of routes) {
    await navigate(path);
    const result=await evaluate(`({hasBody: !!document.body, rtl:document.documentElement.dir==="rtl", overflow:document.documentElement.scrollWidth - innerWidth, title:document.title, hasAI:!!document.querySelector(".owui-layout")})`);
    invariant(result.hasBody,path+" empty body");
    invariant(result.rtl,path+" missing Arabic RTL root");
    invariant(result.overflow <= 3,path+" horizontal overflow "+result.overflow);
    if(path==="/ai") invariant(result.hasAI,"AI workspace missing");
  }
  for(const [width,height,mobile] of [[1440,900,false],[768,1024,true],[390,844,true],[320,700,true]]) {
    await command("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile});
    for(const theme of ["light","dark"]) {
      await command("Emulation.setEmulatedMedia",{features:[{name:"prefers-color-scheme",value:theme}]});
      await navigate("/ai");
      const r=await evaluate(`({
        overflow:document.documentElement.scrollWidth-innerWidth,
        input:!!document.querySelector(".owui-composer textarea"),
        side:!!document.querySelector(".owui-layout"),
        visible:!!document.querySelector(".owui-model-trigger"),
        direction:document.documentElement.dir
      })`);
      invariant(r.overflow <= 3,`/ai ${width} ${theme} overflow ${r.overflow}`);
      invariant(r.input&&r.side&&r.visible,`/ai ${width} ${theme} missing controls`);
      invariant(r.direction==="rtl",`/ai ${width} ${theme} RTL`);
      await screenshot(`artifacts/noata-browser/ai-${width}-${theme}.png`);
    }
  }
  console.log(`Noata browser QA PASS: ${checks} public-browser assertions; 8 responsive screenshots.`);
  console.log("Authenticated student/teacher/admin E2E: NOT RUN (requires disposable credentials and protected preview access).");
}
try { await main(); }
finally {
  socket?.close();
  if(chrome) chrome.kill("SIGTERM");
  if(app) app.kill("SIGTERM");
}
