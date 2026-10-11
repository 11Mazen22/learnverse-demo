import test from "node:test";
import assert from "node:assert/strict";
import {CAPABILITIES,getCapabilityAvailability,validateCapabilityExecution} from "../../../../supabase/functions/noata-ai/capabilities.ts";
test("capabilities are unique, have explicit permissions and do not promise unsupported tools",()=>{
 assert.equal(new Set(CAPABILITIES.map(x=>x.id)).size,CAPABILITIES.length);
 assert.ok(CAPABILITIES.every(x=>x.requiresAuth));
 const list=getCapabilityAvailability({fanar:false,brave:false,memorySchema:false});
 assert.equal(list.find(x=>x.id==="chat")?.status,"unavailable");
 assert.equal(list.find(x=>x.id==="artifact.xlsx")?.status,"local");
 assert.equal(list.find(x=>x.id==="artifact.pptx")?.status,"local");
 assert.equal(list.find(x=>x.id==="memory.recall")?.status,"unavailable");
 assert.equal(getCapabilityAvailability({fanar:true,brave:true,memorySchema:true}).find(x=>x.id==="research.search")?.status,"configured");
});
test("typed execution rejects unsupported capabilities and invalid parameters",()=>{
 assert.equal(validateCapabilityExecution({id:"artifact.pptx",input:{prompt:"do something"}}).ok,false);
 assert.equal(validateCapabilityExecution({id:"text.translate",input:{text:"Hello",langpair:"en-ar"}}).ok,true);
 assert.equal(validateCapabilityExecution({id:"text.translate",input:{text:"x".repeat(5001),langpair:"en-ar"}}).ok,false);
 assert.equal(validateCapabilityExecution({id:"image.generate",input:{prompt:"Draw a simple tree"}}).ok,true);
 assert.equal(validateCapabilityExecution({id:"image.generate",input:{prompt:""}}).ok,false);
 assert.equal(validateCapabilityExecution({id:"image.generate",input:{prompt:"image",unsafe:true}}).ok,true);
});
