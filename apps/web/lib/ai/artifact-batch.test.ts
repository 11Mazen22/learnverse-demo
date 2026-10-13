import test from "node:test";
import assert from "node:assert/strict";
import {createConversationalArtifact,type ArtifactDriver} from "./artifact-runner.ts";
const owner="11111111-1111-4111-8111-111111111111";
test("Real Office outputs have independent bytes and links; one failed upload preserves another result",async()=>{
 const attached:string[]=[],removed:string[]=[];
 const driver:ArtifactDriver={
  renderPdf:async()=>{throw Error("not used");},
  upload:async(path)=>{if(path.endsWith(".pptx"))throw Error("provider_storage_unavailable");},
  insert:async()=>{},attach:async file=>{attached.push(file.format);},
  remove:async path=>{removed.push(path);},removeRecord:async()=>{}
 };
 const content="# Budget\n\n| Item | Value |\n| --- | --- |\n| Books | 12 |\n| Travel | 8 |\n| Total | =SUM(B2:B3) |";
 const workbook=await createConversationalArtifact({intent:{kind:"xlsx",usePrevious:false},content,owner,id:"22222222-2222-4222-8222-222222222222",title:"Budget",signal:new AbortController().signal,driver});
 assert.equal(workbook.format,"xlsx");assert.ok(workbook.byteSize>150);
 await assert.rejects(createConversationalArtifact({intent:{kind:"pptx",usePrevious:false},content:"# Budget\n\n## Costs\n\n- Books: 12\n- Travel: 8",owner,id:"33333333-3333-4333-8333-333333333333",title:"Budget",signal:new AbortController().signal,driver}),/storage_unavailable/);
 assert.deepEqual(attached,["xlsx"]);assert.deepEqual(removed,[]);
});
