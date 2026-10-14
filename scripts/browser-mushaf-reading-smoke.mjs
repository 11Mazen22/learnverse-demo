// Real-browser Mushaf checks: layout, RTL, controls and responsive views.
// If external Quran API is unavailable, report an explicit partial check.
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {setTimeout as sleep} from "node:timers/promises";
import {launchQaBrowser,findQaChrome} from "./lib/qa-browser.mjs";
const port=Number(process.env.NOATA_QA_PORT??"3000"),base="http://127.0.0.1:"+port;
let app,browser,log="",live=0;
const assert=(v,msg)=>{if(!v)throw Error("MUSHAF QA FAIL: "+msg)};
async function evaluate(expression){
 const r=await browser.command("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true},15000);
 if(r.exceptionDetails)throw Error(r.exceptionDetails.text);
 return r.result?.value;
}
async function waitFor(fn,label,ms=16000){
 const stop=Date.now()+ms;while(Date.now()<stop){try{if(await fn())return}catch{}await sleep(170)}
 throw Error("Timed out: "+label);
}
const fallback=[
 '(()=>{if(document.querySelector(".mushaf-flow-script"))return "live";',
 'const panel=document.querySelector(".mushaf-reading");if(!panel)return "missing";',
 'document.querySelector("#mushaf-qa-test")?.remove();',
 'const fixture=document.createElement("div");fixture.className="mushaf-verses mushaf-flow";fixture.id="mushaf-qa-test";',
 'const text=document.createElement("div");text.className="mushaf-flow-script";text.lang="ar";text.dir="rtl";text.style.fontSize="32px";',
 'const sample=["عبارة عربية تجريبية للتحقق من المسافات لا من المصحف ","عبارة ثانية للاختبار البصري فقط "];',
 'for(const [i,number] of ["١","٢","٣","١٠"].entries()){',
 'const verse=document.createElement("span");verse.className="mushaf-flow-verse";',
 'const words=document.createElement("span");words.className="mushaf-flow-words";words.textContent=sample[i%2];',
 'const marker=document.createElement("button");marker.className="mushaf-flow-marker";marker.type="button";marker.setAttribute("aria-label","Fixture "+number);',
 'const seal=document.createElement("span");seal.className="noata-quran-verse-number";seal.setAttribute("aria-hidden","true");',
 'const icon=document.createElementNS("http://www.w3.org/2000/svg","svg");icon.setAttribute("class","noata-quran-verse-seal");icon.setAttribute("viewBox","0 0 56 56");',
 'const center=document.createElementNS("http://www.w3.org/2000/svg","circle");center.setAttribute("class","noata-quran-seal-center");center.setAttribute("cx","28");center.setAttribute("cy","28");center.setAttribute("r","18");icon.append(center);',
 'const digit=document.createElement("span");digit.className="noata-quran-verse-digits";digit.textContent=number;seal.append(icon,digit);marker.append(seal);',
 'verse.append(words,document.createTextNode("\\u2060"),marker,document.createTextNode(" "));text.append(verse);',
 '}fixture.append(text);const nav=panel.querySelector(".mushaf-chapter-nav");nav?panel.insertBefore(fixture,nav):panel.append(fixture);return "fixture";})()'
].join("");
const measure=[
'(()=>{const p=document.querySelector(".mushaf-reading"),r=p.getBoundingClientRect(),flow=p.querySelector(".mushaf-flow-script"),markers=[...flow.querySelectorAll(".mushaf-flow-marker")];return {',
'width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,left:r.left,right:r.right,size:r.width,',
'chapter:document.querySelector(".mushaf-chapter")?.getBoundingClientRect().width,toolbar:document.querySelector(".mushaf-reading-toolbar")?.getBoundingClientRect().width,',
'jump:document.querySelector(".mushaf-jump")?.getBoundingClientRect().width,extras:flow.querySelectorAll("button:not(.mushaf-flow-marker)").length,',
'marks:markers.slice(0,6).map(m=>{const a=m.getBoundingClientRect();return {x:a.left,right:a.right,w:a.width}})};})()'
].join("");
async function run(){
 await mkdir("artifacts/noata-mushaf",{recursive:true});
 app=spawn("pnpm",["--filter","@noata/web","start"],{stdio:"pipe",detached:true,env:{...process.env,PORT:String(port)}});
 app.stdout.on("data",x=>log+=String(x));app.stderr.on("data",x=>log+=String(x));
 await waitFor(async()=>{try{return (await fetch(base+"/health",{signal:AbortSignal.timeout(1100)})).ok}catch{return false}},"Next",35000);
 browser=await launchQaBrowser({executablePath:findQaChrome(),artifactsDir:"artifacts/noata-mushaf"});
 await browser.command("Page.enable");await browser.command("Runtime.enable");
 for(const width of [1440,768,390,320]){
  await browser.command("Emulation.setDeviceMetricsOverride",{width,height:890,deviceScaleFactor:1,mobile:width<=768});
  await browser.command("Page.navigate",{url:base+"/quran"});
  await waitFor(()=>evaluate('document.readyState==="complete"&&!!document.querySelector(".mushaf-reading")'),"Mushaf");
  await sleep(900);
  for(const theme of ["light","dark"]){
   await evaluate("document.documentElement.dataset.theme="+JSON.stringify(theme));
   const source=await evaluate(fallback);
   assert(source!=="missing","reading section must render");if(source==="live")live++;
   const m=await evaluate(measure);
   assert(m.size>200&&m.size<=width+2&&m.left>=-2&&m.right<=width+2,"Mushaf clipping "+JSON.stringify(m));
   assert(m.overflow<=4,"Page horizontal overflow "+JSON.stringify(m));

   const hero=await evaluate('(()=>{const seal=document.querySelector("[data-testid=mushaf-hero-insignia]"),panel=document.querySelector(".mushaf-hero"),copy=document.querySelector(".mushaf-hero-copy"),heading=seal?.querySelector(".mushaf-insignia-arabic"),caption=seal?.querySelector(".mushaf-insignia-caption"),art=seal?.querySelector(".mushaf-insignia-frame");if(!seal||!heading||!caption||!art)return null;const s=seal.getBoundingClientRect(),p=panel.getBoundingClientRect(),c=copy.getBoundingClientRect(),h=heading.getBoundingClientRect(),t=caption.getBoundingClientRect();return {width:s.width,height:s.height,left:s.left,right:s.right,top:s.top,bottom:s.bottom,heroLeft:p.left,heroRight:p.right,copyLeft:c.left,copyRight:c.right,copyBottom:c.bottom,headingLeft:h.left,headingRight:h.right,headingText:heading.textContent,captionBottom:t.bottom,captionText:caption.textContent,paths:art.querySelectorAll("path").length,visibility:getComputedStyle(seal).visibility}})()');
   assert(hero&&hero.paths>=4&&hero.headingText.includes("القرآن")&&hero.captionText.length>0,"Decorative Quran insignia rendered "+JSON.stringify(hero));
   assert(hero.width>=145&&hero.width<=245&&hero.height>=150&&hero.height<=260&&hero.visibility==="visible","Insignia responsive dimensions "+JSON.stringify(hero));
   assert(hero.left>=-2&&hero.right<=width+2&&hero.headingLeft>=hero.left-2&&hero.headingRight<=hero.right+2&&hero.captionBottom<=hero.bottom+2,"Insignia content fits viewport and arch "+JSON.stringify(hero));
   if(width<=390)assert(hero.top>=hero.copyBottom-4,"Mobile emblem follows rather than overlays hero text "+JSON.stringify(hero));

   const composition=await evaluate('(()=>{const seal=document.querySelector("[data-testid=mushaf-hero-insignia]");const names=[".mushaf-insignia-halo",".mushaf-insignia-arabic",".mushaf-insignia-divider",".mushaf-insignia-caption",".mushaf-insignia-content"];const rects=names.map(s=>{const e=seal.querySelector(s);const b=e.getBoundingClientRect();return {name:s,top:b.top,bottom:b.bottom,left:b.left,right:b.right,width:b.width,height:b.height,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}});const box=seal.getBoundingClientRect();return {box:{top:box.top,bottom:box.bottom,left:box.left,right:box.right,height:box.height},rects}})()');
   const [book,title,divider,caption,content]=composition.rects;
   assert(book.bottom+1<=title.top && title.bottom<=divider.top+1 && divider.bottom+1<=caption.top,
     "Mushaf emblem title/divider/tagline must not collide: "+JSON.stringify(composition));
   assert(title.left>=composition.box.left-1&&title.right<=composition.box.right+1 &&
     caption.left>=composition.box.left-1&&caption.right<=composition.box.right+1,
     "Mushaf emblem text must stay inside the arch: "+JSON.stringify(composition));
   assert(caption.bottom<=composition.box.top+composition.box.height*.83,
     "Mushaf emblem tagline must clear the lower arch ornament: "+JSON.stringify(composition));
   const midpoint=(r)=>(r.left+r.right)/2;
   const archMidpoint=(composition.box.left+composition.box.right)/2;
   assert(Math.abs(midpoint(book)-archMidpoint)<3 && Math.abs(midpoint(title)-archMidpoint)<3 &&
     Math.abs(midpoint(caption)-archMidpoint)<3,
     "All three emblem zones must share a single exact optical center: "+JSON.stringify(composition));
   assert(title.scrollWidth<=title.clientWidth+1 && caption.scrollWidth<=caption.clientWidth+1,
     "Arabic heading and translated subtitle must never be truncated: "+JSON.stringify(composition));
   assert(title.width < composition.box.right-composition.box.left-20 &&
     caption.width < composition.box.right-composition.box.left-20,
     "Wordmark must have breathable horizontal margins: "+JSON.stringify(composition));
   assert(caption.bottom<=composition.box.top+composition.box.height*.79,
     "Subtitle must sit above the bottom decorative flourish: "+JSON.stringify(composition));
   assert(content.top>=composition.box.top+composition.box.height*.15 &&
     content.bottom<=composition.box.bottom-composition.box.height*.12,
     "Mushaf emblem composition must keep ornamental margins: "+JSON.stringify(composition));


   assert(m.chapter>0&&m.toolbar>0&&m.jump>0,"Chapter, reading mode and jump controls visible");
   assert(m.marks.length>0&&m.extras===0,"Continuous reading must not repeat audio icons for each verse");
   for(const marker of m.marks)assert(marker.w>=25&&marker.x>=-2&&marker.right<=width+2,"Verse marker clipping "+JSON.stringify(marker));
   if(source==="live"&&width===1440&&theme==="light"){
     await evaluate('document.querySelector(".mushaf-flow-marker").click()');
     await waitFor(()=>evaluate('!!document.querySelector(".mushaf-selection-toolbar .mushaf-verse-action")'),"contextual verse actions");
     assert(await evaluate('document.querySelectorAll(".mushaf-selection-toolbar .mushaf-verse-action").length===2'),"single, focused Bookmark/Listen toolbar");
     await evaluate('document.querySelector(".mushaf-reader-controls .mushaf-segmented button:first-child").click()');
     await waitFor(()=>evaluate('!!document.querySelector(".mushaf-study-card")'),"study card mode");
     assert(await evaluate('document.querySelectorAll(".mushaf-study-card").length>=5'),"compact verse study is populated");
     await evaluate('document.querySelector(".mushaf-reader-controls .mushaf-segmented button:last-child").click()');
     await waitFor(()=>evaluate('!!document.querySelector(".mushaf-flow-script")'),"continuous reader restored");
   }
   const shot=await browser.command("Page.captureScreenshot",{format:"png"});
   await writeFile("artifacts/noata-mushaf/mushaf-"+width+"-"+theme+"-"+source+".png",Buffer.from(shot.data,"base64"));
  }
 }
 console.log("MUSHAF QA PASS; responsive page and continuous layout. Live source views "+live+"/8 (other checks use explicit synthetic fixture)");
}
let failure=false;
try{await run()}catch(e){failure=true;console.error(e);await writeFile("artifacts/noata-mushaf/error.txt",String(e)+"\n"+log).catch(()=>{})}
finally{try{await browser?.close()}catch{}if(app){try{process.kill(-app.pid,"SIGTERM")}catch{app.kill("SIGTERM")}}}
process.exit(failure?1:0);
