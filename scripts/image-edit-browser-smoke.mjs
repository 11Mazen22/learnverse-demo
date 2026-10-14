// Actual raster roundtrip in isolated full Chrome; no real accounts or provider calls.
import assert from "node:assert/strict";
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {stripTypeScriptTypes} from "node:module";
import {spawnSync} from "node:child_process";
import {launchQaBrowser} from "./lib/qa-browser.mjs";
const testedRevision=spawnSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).stdout.trim();
const initiallyDirty=Boolean(spawnSync("git",["status","--porcelain"],{encoding:"utf8"}).stdout.trim());
const folder="artifacts/noata-image-edit";await mkdir(folder,{recursive:true});
const source=stripTypeScriptTypes(await readFile("apps/web/lib/ai/image-edit.ts","utf8"),{mode:"strip"});
const moduleUrl="data:text/javascript;base64,"+Buffer.from(source).toString("base64");
let browser,failure,result;
try{
 browser=await launchQaBrowser({artifactsDir:folder});
 const evaluation=await browser.command("Runtime.evaluate",{awaitPromise:true,returnByValue:true,expression:
  "(async()=>{const api=await import("+JSON.stringify(moduleUrl)+");"+
  "const original=document.createElement('canvas');original.width=80;original.height=40;const c=original.getContext('2d');"+
  "c.fillStyle='#ff0000';c.fillRect(0,0,40,40);c.fillStyle='#0000ff';c.fillRect(40,0,40,40);"+
  "const before=original.toDataURL();const bitmap=await createImageBitmap(original);"+
  "const out=document.createElement('canvas');api.renderEditedImage(out,bitmap,{...api.initialImageEdit,crop:'square',cropX:100});"+
  "const cropped=[...out.getContext('2d').getImageData(20,20,1,1).data];"+
  "api.renderEditedImage(out,bitmap,{...api.initialImageEdit,rotation:90,saturation:0});"+
  "const png=await api.imageCanvasBlob(out),bytes=new Uint8Array(await png.arrayBuffer()),readback=await createImageBitmap(png);"+
  "const rotated=[...out.getContext('2d').getImageData(20,20,1,1).data];"+
  "const result={cropped,rotated,width:readback.width,height:readback.height,signature:[...bytes.slice(0,8)],size:bytes.length,originalUnchanged:before===original.toDataURL(),png:out.toDataURL()};bitmap.close();readback.close();return result;})()"
 });
 if(evaluation.exceptionDetails)throw Error(evaluation.exceptionDetails.text);
 result=evaluation.result.value;
 assert.deepEqual(result.cropped,[0,0,255,255],"Right crop must select the blue half");
 assert.equal(result.rotated[0],result.rotated[1]);assert.equal(result.rotated[1],result.rotated[2]);
 assert.equal(result.width,40);assert.equal(result.height,80);
 assert.deepEqual(result.signature,[137,80,78,71,13,10,26,10]);assert.equal(result.originalUnchanged,true);
 await writeFile(folder+"/rotated-grayscale.png",Buffer.from(result.png.split(",")[1],"base64"));delete result.png;
 console.log("PASS actual PNG: crop pixels, rotation dimensions, grayscale, signature, decoded readback and unchanged original");
}catch(error){failure=error;console.error(error);}
finally{
 await browser?.close();await writeFile(folder+"/outcome.json",JSON.stringify({revision:spawnSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).stdout.trim(),
  dirty:initiallyDirty||Boolean(spawnSync("git",["status","--porcelain"],{encoding:"utf8"}).stdout.trim()),endingRevision:spawnSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).stdout.trim(),
  passed:!failure&&testedRevision===spawnSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).stdout.trim(),result,error:failure?.message??null,scope:"Actual browser raster transforms; account/storage/provider acceptance is separate"},null,2));
}
if(failure)process.exitCode=1;
