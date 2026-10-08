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
import {mkdtemp,mkdir,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";

const origin=process.env.AURA_STAGING_ORIGIN??"";
const email=process.env.AURA_QA_EMAIL??"";
const password=process.env.AURA_QA_PASSWORD??"";
const ref=process.env.AURA_STAGING_DB_REF??"";
if(process.env.AURA_ALLOW_QA_RUN!=="YES"||!email||!password||!ref||ref==="jdkfqdzgphzqbbzmerzr"||!/^[a-z0-9]{20}$/.test(ref)){
  console.error("QA not executed: opt-in, separate Supabase staging ref and dedicated QA credentials are required.");
  process.exit(2);
}
let url;
try{url=new URL(origin);}catch{throw Error("Invalid staging origin");}
if(url.protocol!=="https:"||!url.hostname.endsWith(".vercel.app")||
    url.hostname==="noata.vercel.app"||/noata\.enterpriseworkhub\.online/i.test(origin)){
  throw Error("Refusing authenticated E2E outside a protected preview hostname");
}
// Verify the isolated backend BEFORE entering any QA credentials.
const preflight=await fetch(origin+"/api/qa-target",{signal:AbortSignal.timeout(10000)});
if(!preflight.ok)throw Error("Staging QA preflight is not enabled or preview access is unavailable; no credentials submitted");
const target=await preflight.json();
if(target.enabled!==true || target.supabaseOrigin!==`https://${ref}.supabase.co`)throw Error("QA target does not match the authorized staging project; no credentials submitted");
const browser=process.env.NOATA_CHROMIUM_PATH||["google-chrome","chromium","google-chrome-stable"].find(x=>spawnSync("which",[x],{stdio:"ignore"}).status===0);
if(!browser)throw Error("Chrome is required");
let chrome,ws,id=0;const pending=new Map();let checks=0;
const profile=await mkdtemp(join(tmpdir(),"noata-staging-"));
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
  await retry(async()=>await evalJS('document.readyState==="complete" && location.pathname==='+JSON.stringify(new URL(path,origin).pathname)),path);
}
async function main(){
  chrome=spawn(browser,["--headless=new","--no-sandbox","--single-process","--no-zygote","--disable-dev-shm-usage","--user-data-dir="+profile,"--remote-debugging-port=9231","--remote-allow-origins=*","about:blank"],{stdio:"ignore"});
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
  const response=await retry(async()=>await evalJS('document.querySelectorAll(".owui-message.assistant:not(.streaming)").length>0 && !document.querySelector(".owui-message.streaming") && !document.querySelector(".owui-error")'),"completed actual AI response",90000);
  assert(response,"Fanar response received");
  const texts=await evalJS('[...document.querySelectorAll(".owui-message.assistant .ai-rich-message")].map(x=>x.innerText).join(" ").slice(0,300)');
  assert(Boolean(texts?.trim()),"Fanar response content not empty");
  const conversationUrl=await evalJS('location.pathname+location.search');
  assert(conversationUrl.includes('chat='),'QA account must enable persistent conversations');
  await navigate(conversationUrl);
  await retry(async()=>await evalJS('document.querySelectorAll(".owui-message.assistant:not(.streaming) .ai-rich-message").length>0'),"persisted conversation reload");
  assert(await evalJS('[...document.querySelectorAll(".owui-message.user")].some(x=>x.innerText.includes('+JSON.stringify(question)+'))'),"user message persisted");
  const pdf=await evalJS(`fetch('/api/documents/pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'اختبار بيئة معزولة',text:'## مستند اختبار\\n\\nنص عربي وEnglish.'})}).then(async r=>({status:r.status,type:r.headers.get('Content-Type'),signature:r.ok?new TextDecoder().decode(new Uint8Array(await r.arrayBuffer()).slice(0,5)):''}))`);
  assert(pdf.status===200&&pdf.type?.includes('application/pdf')&&pdf.signature==='%PDF-',"authenticated native PDF endpoint");
  console.log("Authenticated staging QA: login, completed provider reply, persistence and native PDF passed; no credentials logged.");
  // Test flow deliberately leaves cleanup to dedicated QA accounts or a reviewed DELETE path.
  console.log("Authenticated QA checks:",checks);
}
let failure;
try{await main();}catch(error){failure=error;throw error;}
finally{
  await mkdir('artifacts/noata-authenticated',{recursive:true});
  await writeFile('artifacts/noata-authenticated/outcome.json',JSON.stringify({revision:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),passed:!failure,checks,scope:'partial smoke: login, real reply, persistence, PDF; full release matrix remains required',failure:failure?.message??null},null,2));
  ws?.close();chrome?.kill("SIGTERM");await rm(profile,{recursive:true,force:true});
}
