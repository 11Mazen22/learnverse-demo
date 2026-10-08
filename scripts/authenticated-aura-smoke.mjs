/**
 * Authenticated staging smoke for Noata Aura.
 * Intentionally opt-in only: never executes against production URL or DB.
 * Required QA config:
 *   AURA_STAGING_ORIGIN=https://...-preview.vercel.app
 *   AURA_QA_EMAIL=<dedicated disposable staging student>
 *   AURA_QA_PASSWORD=<staging-only secret>
 *   AURA_STAGING_DB_REF=<separate QA Supabase project ref>
 *   AURA_ALLOW_QA_RUN=YES
 * Protected Vercel previews additionally need browser-authorized access.
 * No credentials are output to CI logs.
 */
import {spawn,spawnSync} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";

const origin=process.env.AURA_STAGING_ORIGIN??"";
const email=process.env.AURA_QA_EMAIL??"";
const password=process.env.AURA_QA_PASSWORD??"";
const ref=process.env.AURA_STAGING_DB_REF??"";
if(process.env.AURA_ALLOW_QA_RUN!=="YES"||!email||!password||!ref||!/^[a-z0-9]{20}$/.test(ref)){
  console.error("QA not executed: opt-in, separate Supabase staging ref and dedicated QA credentials are required.");
  process.exit(2);
}
let url;
try{url=new URL(origin);}catch{throw Error("Invalid staging origin");}
if(url.protocol!=="https:"||!url.hostname.endsWith(".vercel.app")||
    url.hostname==="noata.vercel.app"||/noata\.enterpriseworkhub\.online/i.test(origin)){
  throw Error("Refusing authenticated E2E outside a protected preview hostname");
}
const browser=["google-chrome","chromium","google-chrome-stable"].find(x=>spawnSync("which",[x],{stdio:"ignore"}).status===0);
if(!browser)throw Error("Chrome is required");
let chrome,ws,id=0;const pending=new Map();let checks=0;
function assert(value,reason){if(!value)throw Error("QA assertion: "+reason);checks++;}
async function retry(fn,label,ms=25000){
  const until=Date.now()+ms;
  while(Date.now()<until){try{const result=await fn();if(result)return result;}catch{}await delay(270);}
  throw Error("QA timed out: "+label);
}
function send(method,params={}){
  return new Promise((resolve,reject)=>{
    const n=++id;
    const timeout=setTimeout(()=>{pending.delete(n);reject(Error("CDP timeout: "+method));},15000);
    pending.set(n,{resolve:value=>{clearTimeout(timeout);resolve(value);},reject:e=>{clearTimeout(timeout);reject(e);}});
    ws.send(JSON.stringify({id:n,method,params}));
  });
}
async function evalJS(expression){
  const result=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error("QA browser JavaScript exception");
  return result.result.value;
}
async function navigate(path){
  await send("Page.navigate",{url:origin+path});
  await retry(async()=>await evalJS('document.readyState==="complete" && location.pathname==='+JSON.stringify(path)),path);
}
async function main(){
  chrome=spawn(browser,["--headless=new","--no-sandbox","--disable-dev-shm-usage","--remote-debugging-port=9231","--remote-allow-origins=*","about:blank"],{stdio:"ignore"});
  const tab=await retry(async()=>{const response=await fetch("http://127.0.0.1:9231/json");return (await response.json()).find(t=>t.type==="page"&&t.webSocketDebuggerUrl);},"Chrome debugger");
  ws=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true});});
  ws.addEventListener("message",event=>{
    const result=JSON.parse(String(event.data)); const cb=pending.get(result.id);
    if(!cb)return;pending.delete(result.id);
    if(result.error)cb.reject(Error(result.error.message));else cb.resolve(result.result);
  });
  await send("Page.enable");await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride",{width:1280,height:880,deviceScaleFactor:1,mobile:false});
  await navigate("/login?next=/ai");
  const login=await retry(()=>evalJS('!!document.querySelector("input[type=email]")'),"login form");
  assert(login,"staging auth form missing");
  // Set values via native setter + input events so React controlled inputs update.
  const fill = (selector,value)=>`(()=>{const el=document.querySelector(${JSON.stringify(selector)});const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;setter.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event("input",{bubbles:true}));})()`;
  await evalJS(fill('input[type=email]',email));
  await evalJS(fill('input[type=password]',password));
  await evalJS('document.querySelector("form button[type=submit],form button:not([type])")?.click()');
  const verifiedRef=await retry(async()=>{
    const resources=await evalJS("performance.getEntriesByType('resource').map(x=>x.name).filter(x=>x.includes('.supabase.co'))");
    return resources?.some(x=>x.includes(ref+".supabase.co")) ? true : null;
  },"confirm isolated Supabase project reference",12000);
  assert(verifiedRef,"Browser did not connect to the authorized staging Supabase project");
  const logged=await retry(async()=>await evalJS('location.pathname==="/ai"'),"staging student login",35000);
  assert(logged,"staging login");
  await retry(async()=>await evalJS('!!document.querySelector(".owui-composer textarea")'),"AI chat composer");
  // Real provider request only in isolated QA project.
  const question="اختبار آلي خاص بالبيئة التجريبية: أجب بكلمة واحدة فقط (تم) ثم توقف.";
  await evalJS(`(()=>{const el=document.querySelector(".owui-composer textarea");const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set;setter.call(el,${JSON.stringify(question)});el.dispatchEvent(new Event("input",{bubbles:true}));})()`);
  const enabled=await retry(async()=>await evalJS('!!document.querySelector(".owui-composer textarea")?.value'),"React composer input");
  assert(enabled,"typing in composer");
  await evalJS('document.querySelector(".owui-send")?.click()');
  const response=await retry(async()=>await evalJS('document.querySelectorAll(".owui-message.assistant").length>0'),"actual AI response",90000);
  assert(response,"Fanar response received");
  const texts=await evalJS('[...document.querySelectorAll(".owui-message.assistant")].map(x=>x.innerText).join(" ").slice(0,300)');
  assert(Boolean(texts),"Fanar response not empty");
  console.log("Authenticated staging QA: login and conversation reply passed; no credentials logged.");
  // Test flow deliberately leaves cleanup to dedicated QA accounts or a reviewed DELETE path.
  console.log("Authenticated QA checks:",checks);
}
try{await main();}
finally{ws?.close();chrome?.kill("SIGTERM");}
