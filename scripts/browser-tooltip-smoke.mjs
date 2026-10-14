// Focused real Chrome QA for shared Noata tooltips, without credentials.
import {spawn} from "node:child_process";
import {mkdir,writeFile} from "node:fs/promises";
import {setTimeout as sleep} from "node:timers/promises";
import {launchQaBrowser,findQaChrome} from "./lib/qa-browser.mjs";

const port=Number(process.env.NOATA_QA_PORT??"3000"),base="http://127.0.0.1:"+port;
let app,browser,log="";
const assert=(v,label)=>{if(!v)throw Error("Tooltip QA FAIL: "+label)};
const evaluate=async expression=>{
 const response=await browser.command("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true},12000);
 if(response.exceptionDetails)throw Error(response.exceptionDetails.text);
 return response.result?.value;
};
async function waitFor(fn,label,timeout=14000){
 const limit=Date.now()+timeout;
 while(Date.now()<limit){try{if(await fn())return}catch{}await sleep(180)}
 throw Error("Timeout waiting for "+label);
}
async function navigate(path){
 await browser.command("Page.navigate",{url:base+path});
 await waitFor(()=>evaluate("document.readyState==='complete'&&location.pathname==="+JSON.stringify(path)),path);
 await waitFor(()=>evaluate("!!document.querySelector('button')"),"hydrated buttons");
}
async function capture(name){
 const v=await browser.command("Page.captureScreenshot",{format:"png"});
 await writeFile("artifacts/noata-tooltip/"+name+".png",Buffer.from(v.data,"base64"));
}
async function run(){
 await mkdir("artifacts/noata-tooltip",{recursive:true});
 app=spawn("pnpm",["--filter","@noata/web","start"],{stdio:"pipe",detached:true,env:{...process.env,PORT:String(port)}});
 app.stdout.on("data",x=>log+=String(x));app.stderr.on("data",x=>log+=String(x));
 await waitFor(async()=>{try{return (await fetch(base+"/health")).ok}catch{return false}},"Next health",30000);
 browser=await launchQaBrowser({executablePath:findQaChrome(),artifactsDir:"artifacts/noata-tooltip"});
 await browser.command("Page.enable");await browser.command("Runtime.enable");
 await browser.command("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await navigate("/ai");
 await waitFor(()=>evaluate('!!document.querySelector(".owui-layout>.noata-organized-sidebar")'),"expanded sidebar");
 await evaluate('document.querySelector(".noata-organized-sidebar .owui-sidebar-top>button").click()');
 await waitFor(()=>evaluate('document.querySelector(".noata-compact-rail")?.getBoundingClientRect().width<=80'),"collapsed rail transition",9000);
 const point=await evaluate('(()=>{const r=document.querySelector(".noata-compact-rail .owui-rail-primary").getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()');
 await browser.command("Input.dispatchMouseEvent",{type:"mouseMoved",x:point.x,y:point.y});
 await waitFor(()=>evaluate('document.querySelector("#noata-global-tooltip")?.textContent==="محادثة جديدة"'),"Arabic pointer tooltip");
 const rtl=await evaluate('(()=>{const t=document.getElementById("noata-global-tooltip"),r=t.getBoundingClientRect();return {side:t.dataset.side,ptr:getComputedStyle(t).pointerEvents,x:r.x,right:r.right,width:innerWidth}})()');
 assert(rtl.side==="left"&&rtl.ptr==="none"&&rtl.x>=0&&rtl.right<=rtl.width,"RTL sidebar tooltip "+JSON.stringify(rtl));
 await capture("rtl-rail-hover");
 // A pointer click MUST dismiss the caption even if focus is moved to the
 // button by the browser. Remaining stationary must never reopen it.
 await browser.command("Input.dispatchMouseEvent",{type:"mousePressed",x:point.x,y:point.y,button:"left",clickCount:1});
 await browser.command("Input.dispatchMouseEvent",{type:"mouseReleased",x:point.x,y:point.y,button:"left",clickCount:1});
 await sleep(600);
 assert(await evaluate('!document.querySelector("#noata-global-tooltip")'),"No tooltip on pointer click or click-induced focus");
 await capture("rtl-click-does-not-show-tooltip");

 await browser.command("Input.dispatchMouseEvent",{type:"mouseMoved",x:500,y:450});
 await waitFor(()=>evaluate('!document.getElementById("noata-global-tooltip")'),"pointer tooltip disappears");
 await evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Tab",bubbles:true}));document.querySelector(".noata-compact-rail .owui-rail-toggle").focus()');
 await waitFor(()=>evaluate('document.querySelector("#noata-global-tooltip")?.textContent==="توسيع القائمة"'),"Arabic keyboard focus");
 assert(await evaluate('document.querySelector(".noata-compact-rail .owui-rail-toggle").getAttribute("aria-describedby")?.includes("noata-global-tooltip")'),"focus announced for accessibility");
 await capture("rtl-rail-focus");
 await evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}))');
 await waitFor(()=>evaluate('!document.getElementById("noata-global-tooltip")'),"Escape closes tooltip");
 await evaluate('document.cookie="noata_locale=en;path=/;SameSite=Lax"');
 await navigate("/ai");
 await waitFor(()=>evaluate('document.documentElement.dir==="ltr"'),"English direction");
 await waitFor(()=>evaluate('!!document.querySelector(".noata-organized-sidebar")'),"English sidebar");
 await waitFor(()=>evaluate('(()=>{const e=document.querySelector(".noata-organized-sidebar .owui-sidebar-top>button");return !!e&&Object.keys(e).some(k=>k.startsWith("__reactFiber$"))})()'),"English sidebar hydration");
 await sleep(350);
 await evaluate('document.querySelector(".noata-organized-sidebar .owui-sidebar-top>button").click()');
 await waitFor(()=>evaluate('!!document.querySelector(".noata-compact-rail")'),"LTR sidebar toggled",16000);
 await waitFor(()=>evaluate('document.querySelector(".noata-compact-rail")?.getBoundingClientRect().width<=80'),"LTR rail transition",16000);
 await evaluate('document.body.setAttribute("tabindex","-1");document.body.focus()');
 await browser.command("Input.dispatchKeyEvent",{type:"keyDown",key:"Tab",code:"Tab",windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});
 await browser.command("Input.dispatchKeyEvent",{type:"keyUp",key:"Tab",code:"Tab",windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});
 await evaluate('document.body.focus();document.querySelector(".noata-compact-rail .owui-rail-primary").focus()');
 await waitFor(()=>evaluate('!!document.querySelector("#noata-global-tooltip")'),"English keyboard focus",9000);
 const englishTip=await evaluate('(()=>{const e=document.getElementById("noata-global-tooltip");return {label:e.textContent,lang:document.documentElement.lang,direction:document.documentElement.dir}})()');
 assert(englishTip.label==="New chat","English label must match locale "+JSON.stringify(englishTip));
 assert(await evaluate('document.getElementById("noata-global-tooltip").dataset.side==="right"'),"LTR tooltip on content side");
 await capture("ltr-rail-focus");
 // User-reported regression: appearance choice auto-focus after opening by
 // mouse must not display a long duplicated caption.
 await evaluate('document.querySelector(".noata-compact-rail .owui-rail-toggle").click()');
 await waitFor(()=>evaluate('!!document.querySelector(".noata-organized-sidebar")'),"sidebar opened");
 const theme=await evaluate('(()=>{const b=document.querySelector(".owui-navbar .aura-theme-picker .top-icon");if(!b)return null;const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()');
 assert(!!theme,"Theme button exists");
 await browser.command("Input.dispatchMouseEvent",{type:"mouseMoved",x:theme.x,y:theme.y});
 await browser.command("Input.dispatchMouseEvent",{type:"mousePressed",x:theme.x,y:theme.y,button:"left",clickCount:1});
 await browser.command("Input.dispatchMouseEvent",{type:"mouseReleased",x:theme.x,y:theme.y,button:"left",clickCount:1});
 await waitFor(()=>evaluate('!!document.querySelector(".aura-theme-menu")'),"appearance menu opened");
 await sleep(650);
 assert(await evaluate('!document.querySelector("#noata-global-tooltip")'),"Click-opened appearance menu cannot leave floating tooltip");
 const selected=await evaluate('(()=>{const b=document.querySelector(".aura-theme-menu button[aria-pressed=true]");if(!b)return null;const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()');
 assert(!!selected,"Theme choice exists");
 await browser.command("Input.dispatchMouseEvent",{type:"mouseMoved",x:selected.x,y:selected.y});
 await sleep(650);
 assert(await evaluate('!document.querySelector("#noata-global-tooltip")'),"Text-labelled appearance choice needs no redundant tooltip");
 await capture("appearance-no-stale-tooltip");

 await browser.command("Emulation.setDeviceMetricsOverride",{width:320,height:700,deviceScaleFactor:1,mobile:true});
 await navigate("/login");
 await waitFor(()=>evaluate('!!document.querySelector(".auth-password button")'),"password button");
 await evaluate('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Tab",bubbles:true}));document.querySelector(".auth-password button").focus()');
 await waitFor(()=>evaluate('!!document.getElementById("noata-global-tooltip")'),"password focus caption");
 const mobile=await evaluate('(()=>{const r=document.getElementById("noata-global-tooltip").getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,width:innerWidth,height:innerHeight}})()');
 assert(mobile.x>=0&&mobile.right<=mobile.width&&mobile.y>=0&&mobile.bottom<=mobile.height,"mobile tooltip fits "+JSON.stringify(mobile));
 await capture("mobile-password-focus");
 console.log("Tooltip Chrome QA PASS: RTL hover, keyboard focus, English, dismissal and 320px viewport");
}
let failed=false;
try{await run()}catch(e){failed=true;console.error(e);await writeFile("artifacts/noata-tooltip/error.txt",String(e)+"\n"+log).catch(()=>{})}
finally{try{await browser?.close()}catch{};if(app){try{process.kill(-app.pid,"SIGTERM")}catch{app.kill("SIGTERM")}}}
process.exit(failed?1:0);
