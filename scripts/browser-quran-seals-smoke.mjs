// Real-Chrome layout test. Uses synthetic Arabic fixture words only,
// not model-generated or unverified Quran passages.
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {setTimeout as sleep} from "node:timers/promises";
import {launchQaBrowser,findQaChrome} from "./lib/qa-browser.mjs";

const port=Number(process.env.NOATA_QA_PORT??"3000"),base="http://127.0.0.1:"+port;
let app,browser,log="";
const assert=(ok,message)=>{if(!ok)throw Error("Quran verse marker QA: "+message)};
async function evaluate(expression){
 const r=await browser.command("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true},12000);
 if(r.exceptionDetails)throw Error(r.exceptionDetails.text);
 return r.result.value;
}
async function waitFor(fn,message,limit=14000){
 const until=Date.now()+limit;
 while(Date.now()<until){try{if(await fn())return}catch{}await sleep(170)}
 throw Error("Wait timeout: "+message);
}
async function run(){
 await mkdir("artifacts/noata-quran-seals",{recursive:true});
 app=spawn("pnpm",["--filter","@noata/web","start"],{stdio:"pipe",detached:true,env:{...process.env,PORT:String(port)}});
 app.stdout.on("data",x=>log+=String(x));app.stderr.on("data",x=>log+=String(x));
 await waitFor(async()=>{try{return (await fetch(base+"/health",{signal:AbortSignal.timeout(1000)})).ok}catch{return false}},"Next server",30000);
 browser=await launchQaBrowser({executablePath:findQaChrome(),artifactsDir:"artifacts/noata-quran-seals"});
 await browser.command("Page.enable");await browser.command("Runtime.enable");
 const fixture=String.raw`(()=> {
   document.getElementById("noata-quran-marker-fixture")?.remove();
   const shell=document.querySelector(".owui-layout .owui-main") ?? document.querySelector(".owui-layout");
   const outer=document.createElement("div");outer.id="noata-quran-marker-fixture";
   outer.dir="rtl";outer.style.cssText="width:min(750px,calc(100% - 32px));margin:30px auto;position:relative;";
   const card=document.createElement("figure");card.className="noata-quran-passage";
   const prose=document.createElement("div");prose.className="noata-quran-text";
   for(const [number,arabic] of [[1,"١"],[2,"٢"],[5,"٥"],[10,"١٠"],[100,"١٠٠"],[255,"٢٥٥"],[286,"٢٨٦"]]){
     const span=document.createElement("span");span.className="noata-quran-verse";
     span.append(document.createTextNode("نص عربي تجريبي للتنسيق "));
     const marker=document.createElement("span");marker.className="noata-quran-verse-number";marker.setAttribute("role","img");
     marker.setAttribute("aria-label","الآية "+arabic);marker.dir="rtl";
     marker.innerHTML='<svg class="noata-quran-verse-seal" viewBox="0 0 56 56" fill="none" focusable="false" aria-hidden="true"><rect class="noata-quran-seal-petal" x="9.5" y="9.5" width="37" height="37" rx="9"/><rect class="noata-quran-seal-petal" x="9.5" y="9.5" width="37" height="37" rx="9" transform="rotate(45 28 28)"/><circle class="noata-quran-seal-center" cx="28" cy="28" r="18.4"/><circle class="noata-quran-seal-ring" cx="28" cy="28" r="15.8"/></svg>';
     const digit=document.createElement("span");digit.className="noata-quran-verse-digits";digit.textContent=arabic;digit.setAttribute("aria-hidden","true");
     marker.append(digit);span.append(marker,document.createTextNode(" "));prose.append(span);
   }
   card.append(prose);outer.append(card);shell.append(outer);outer.scrollIntoView({block:"center"});
 })()`;
 for(const width of [1440,768,390,320]){
   await browser.command("Emulation.setDeviceMetricsOverride",{width,height:850,deviceScaleFactor:1,mobile:width<=768});
   await browser.command("Page.navigate",{url:base+"/ai"});
   await waitFor(()=>evaluate("document.readyState==='complete'&&!!document.querySelector('.owui-layout')"),"AI shell");
   for(const theme of ["light","dark"]){
     await evaluate("document.documentElement.dataset.theme="+JSON.stringify(theme));
     await evaluate(fixture);
     const state=await evaluate('(()=>{const markers=[...document.querySelectorAll("#noata-quran-marker-fixture .noata-quran-verse-number")];return {width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,markers:markers.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e),svg=e.querySelector("svg").getBoundingClientRect(),number=e.querySelector(".noata-quran-verse-digits");return {number:number.textContent,layout:s.display,width:r.width,height:r.height,left:r.left,right:r.right,svgWidth:svg.width,font:getComputedStyle(number).fontFamily}})}})()');
     assert(state.markers.length===7,"expected seven markers");
     assert(state.overflow<=4,"no horizontal overflow at "+width+"/"+theme+" "+JSON.stringify(state));
     for(const item of state.markers){
       assert(/^[٠-٩]+$/u.test(item.number),"only Arabic-Indic digits "+JSON.stringify(item));
       assert(item.layout==="inline-grid"&&item.width>=28&&item.width<=55&&item.height>=28&&item.height<=55,"medallion geometry "+JSON.stringify(item));
       assert(item.left>=-2&&item.right<=width+2,"marker fits viewport "+JSON.stringify(item));
       assert(item.svgWidth>25&&item.font.includes("NoataArabic"),"SVG ornament and independent digit font "+JSON.stringify(item));
     }
     const shot=await browser.command("Page.captureScreenshot",{format:"png"});
     await writeFile("artifacts/noata-quran-seals/verse-seals-"+width+"-"+theme+".png",Buffer.from(shot.data,"base64"));
   }
 }
 console.log("QURAN MEDALLIONS PASS: desktop/mobile, light/dark, Arabic digits, baseline and no clipping");
}
let fail=false;
try{await run()}catch(e){fail=true;console.error(e);await writeFile("artifacts/noata-quran-seals/failure.txt",String(e)+"\n"+log).catch(()=>{})}
finally{try{await browser?.close()}catch{};if(app){try{process.kill(-app.pid,"SIGTERM")}catch{app.kill("SIGTERM")}}}
process.exit(fail?1:0);
