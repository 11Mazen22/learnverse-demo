import test from "node:test";
import assert from "node:assert/strict";
import {continueChat} from "./continuation.ts";
test("long answers continue with the selected model and preserve earlier text",async()=>{
 const calls:{prefix:string;model:string|undefined}[]=[];
 const result=await continueChat(async(prefix,model,pass)=>{
  calls.push({prefix,model});return {content:pass?"Second section":"First section",model:"Fanar-C-2-27B",finishReason:pass?"stop":"length"};
 },new AbortController().signal);
 assert.equal(result.content,"First section\n\nSecond section");assert.equal(result.incomplete,false);
 assert.equal(calls[1].model,"Fanar-C-2-27B");assert.equal(calls[1].prefix,"First section");
});
test("automatic continuation is bounded and clearly marks an unfinished answer",async()=>{
 let calls=0;const result=await continueChat(async()=>{calls++;return {content:"Section",model:"Fanar",finishReason:"length"}},new AbortController().signal);
 assert.equal(calls,3);assert.equal(result.incomplete,true);assert.equal(result.content.split("Section").length,4);
});
test("Stop prevents any further continuation request",async()=>{
 const abort=new AbortController();let calls=0;
 await assert.rejects(()=>continueChat(async()=>{calls++;abort.abort();return {content:"Partial",model:"Fanar",finishReason:"length"}},abort.signal),{name:"AbortError"});
 assert.equal(calls,1);
});
