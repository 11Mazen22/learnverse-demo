import test from "node:test";
import assert from "node:assert/strict";
import {selectRelevantMemories,memorySystemContext} from "../../../../supabase/functions/noata-ai/memory.ts";
const data=[
 {id:"a",content:"I prefer mathematics explanations in Arabic.",updated_at:"2026-10-11"},
 {id:"b",content:"My science notes are organized by chapter.",updated_at:"2026-10-10"},
 {id:"c",content:"I am practicing React programming interfaces.",updated_at:"2026-10-09"}
];
test("Memory never dumps unrelated or overly long records",()=>{
 const found=selectRelevantMemories(data,"Explain mathematics concepts",6);
 assert.deepEqual(found.map(x=>x.id),["a"]);
 assert.ok(!memorySystemContext(data,"Explain mathematics").includes("science notes"));
 assert.equal(memorySystemContext(data,"Hello there"),"");
});
test("Memory is bounded and hostile formatting cannot become HTML",()=>{
 const source=Array.from({length:15},(_,i)=>({id:String(i),content:"Mathematics <script>content</script> "+i,updated_at:"2026-10-11"}));
 assert.ok(selectRelevantMemories(source,"Mathematics",8).length<=8);
 const ctx=memorySystemContext(source,"Mathematics");
 assert.ok(!ctx.includes("<script>"));
 assert.ok(ctx.includes("untrusted contextual data"));
});
