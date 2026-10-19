import test from "node:test";
import assert from "node:assert/strict";
import {CAPABILITIES,getCapabilityAvailability,validateCapabilityExecution,capabilitySystemContext} from "../../../../supabase/functions/noata-ai/capabilities.ts";
test("capabilities are unique, have explicit permissions and do not promise unsupported tools",()=>{
 assert.equal(new Set(CAPABILITIES.map(x=>x.id)).size,CAPABILITIES.length);
 assert.ok(CAPABILITIES.every(x=>x.requiresAuth));
 const list=getCapabilityAvailability({fanar:false,brave:false,memorySchema:false});
 assert.equal(list.find(x=>x.id==="chat")?.status,"unavailable");
 assert.equal(list.find(x=>x.id==="artifact.xlsx")?.status,"local");
 assert.equal(list.find(x=>x.id==="document.pdf.page_edit")?.status,"local");
 assert.equal(list.find(x=>x.id==="document.pdf.annotate")?.status,"local");
 assert.equal(list.find(x=>x.id==="document.office.targeted_edit")?.status,"local");
 assert.equal(list.find(x=>x.id==="image.inpaint")?.status,"planned");
 assert.equal(list.find(x=>x.id==="image.background_remove")?.status,"planned");
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

test("Capability prompt lists real application operations without pretending configuration is live verification",()=>{
 const enabled=capabilitySystemContext({fanar:true,brave:true,memorySchema:true});
 assert.match(enabled,/PDF, DOCX, XLSX, and PPTX/);
 assert.match(enabled,/credential configured/);
 assert.match(enabled,/not yet preserved/);
 assert.match(enabled,/native page reorder\/rotation and portable page-level sticky-note annotations/);
 assert.match(enabled,/Annotation is not text replacement or redaction/);
 assert.match(enabled,/Arbitrary PDF text or layout replacement is NOT implemented/);
 assert.match(enabled,/targeted single-paragraph or single-cell edits/);
 assert.match(enabled,/Generative image inpainting and background removal are NOT implemented/);
 const disabled=capabilitySystemContext({fanar:false,brave:false,memorySchema:false});
 assert.match(disabled,/NOT configured/);
 assert.match(disabled,/provider unavailable/);
 assert.doesNotMatch(disabled,/Bearer |sk-/);
});
