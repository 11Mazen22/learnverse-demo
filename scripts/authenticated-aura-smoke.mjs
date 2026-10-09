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
import {spawnSync} from "node:child_process";
import {launchQaBrowser,findQaChrome,diagnosticError} from "./lib/qa-browser.mjs";
import {setTimeout as delay} from "node:timers/promises";
import {mkdir,writeFile} from "node:fs/promises";

const origin=process.env.AURA_STAGING_ORIGIN??"";
const email=process.env.AURA_QA_EMAIL??"";
const password=process.env.AURA_QA_PASSWORD??"";
const ref=process.env.AURA_STAGING_DB_REF??"";
if(process.env.AURA_ALLOW_QA_RUN!=="YES"||!email||!password||ref!=="vpfpjvhafkmygetjkfcp"){
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
const binary=findQaChrome();
let browser;let checks=0;
function assert(value,reason){if(!value)throw Error("QA assertion: "+reason);checks++;}
async function retry(fn,label,ms=25000){
  const until=Date.now()+ms;
  while(Date.now()<until){try{const result=await fn();if(result)return result;}catch{}await delay(270);}
  throw Error("QA timed out: "+label);
}
function send(method,params={}){return browser.command(method,params);}
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
  browser=await launchQaBrowser({executablePath:binary,artifactsDir:'artifacts/noata-authenticated',commandTimeoutMs:15000});
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

  // Explicit opt-in: one real, quota-bearing Fanar request and verified
  // persistence. No mock data, no production host, no secrets logged.
  if(process.env.AURA_QA_TEST_DESIGN_STUDIO==="YES"){
    await navigate("/settings");
    await retry(()=>evalJS('!!document.querySelector("#noata-ai-design-prompt")'),"Design Studio form");
    const before=await evalJS('document.querySelectorAll(".noata-design-saved-card").length');
    assert(before<8,"Staging design collection has room");
    function fillDesign(id,value){
      return "(()=>{const el=document.querySelector("+JSON.stringify(id)+");const set=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;set.call(el,"+JSON.stringify(value)+");el.dispatchEvent(new Event('input',{bubbles:true}));})()";
    }
    await evalJS(fillDesign("#noata-ai-design-prompt","Luxury ocean learning colors: dark navy, legible cool blue, pale silver and white for accessibility."));
    await retry(()=>evalJS('!document.querySelector(".noata-design-primary")?.disabled'),"design generation enabled");
    await evalJS('document.querySelector(".noata-design-primary").click()');
    const first=await retry(()=>evalJS('(()=>{const e=document.querySelector(".noata-design-error")?.textContent;return e?{error:e}:document.querySelector(".noata-design-preview-card")?{ready:true}:null})()'),"live Fanar palette",95000);
    assert(first.ready&&!first.error,"Fanar produced validated palette");
    await evalJS(fillDesign("#noata-ai-design-refinement","Keep navy dark and make the secondary blue less saturated."));
    await evalJS('document.querySelector(".noata-design-primary").click()');
    const refined=await retry(()=>evalJS('(()=>{const e=document.querySelector(".noata-design-error")?.textContent;if(e)return {error:e};return document.querySelector(".noata-design-notice")?.textContent.includes("جهّز Fanar")?{ready:true}:null})()'),"live Fanar refinement",95000);
    assert(refined.ready&&!refined.error,"Fanar refinement returned valid tokens");
    await evalJS('Array.from(document.querySelectorAll(".noata-design-result-actions button")).find(b=>b.textContent.includes("حفظ"))?.click()');
    await retry(()=>evalJS('document.querySelectorAll(".noata-design-saved-card").length>'+before),"server-confirmed design save");
    assert(await evalJS('document.documentElement.dataset.palette==="custom"'),"AI design active");
    await navigate("/settings");
    await retry(()=>evalJS('document.querySelectorAll(".noata-design-saved-card").length>'+before),"saved palette survives navigation");
    await evalJS('document.querySelector(".noata-design-saved-card .noata-design-saved-actions button:nth-child(3)")?.click()');
    await retry(()=>evalJS('document.querySelector(".noata-design-notice")?.textContent.includes("إخفاء")'),"hide persisted");
    await evalJS('document.querySelector(".noata-design-saved-card .noata-design-saved-actions button:nth-child(3)")?.click()');
    await retry(()=>evalJS('document.querySelector(".noata-design-notice")?.textContent.includes("ظاهر")'),"unhide persisted");
    await evalJS('window.confirm=()=>true;document.querySelector(".noata-design-saved-card .noata-design-saved-actions button:last-child")?.click()');
    await retry(()=>evalJS('document.querySelectorAll(".noata-design-saved-card").length==='+before),"QA design cleanup confirmed");
    console.log("PASS: real Fanar design generation, refinement, contrast validation, account persistence and cleanup.");
  }
  console.log("Authenticated staging QA: login, completed provider reply, persistence and native PDF passed; no credentials logged.");
  // Test flow deliberately leaves cleanup to dedicated QA accounts or a reviewed DELETE path.
  console.log("Authenticated QA checks:",checks);
}
let failure;
try{await main();}catch(error){failure=error;console.error(error);}
finally{
  try{await browser?.close();}catch(error){failure??=error;console.error(error);}
  await mkdir('artifacts/noata-authenticated',{recursive:true});
  await writeFile('artifacts/noata-authenticated/outcome.json',JSON.stringify({revision:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),passed:!failure,checks,scope:'partial smoke: login, real reply, persistence, PDF; full release matrix remains required',failure:diagnosticError(failure),chrome:browser?.diagnostics??failure?.diagnostics??null},null,2));
}
if(failure)process.exitCode=1;
