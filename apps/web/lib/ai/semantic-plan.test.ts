import test from "node:test";
import assert from "node:assert/strict";
import {validateSemanticPlan,parseSemanticPlan,needsSemanticPlan,FILE_CONTRACTS} from "../../../../supabase/functions/noata-ai/semantic-plan.ts";
test("Semantic proposal admits all distinct requested real formats, never arbitrary actions",()=>{
 assert.deepEqual(parseSemanticPlan('{"version":1,"kind":"files","formats":["pdf","pptx","xlsx"],"usePrevious":false}'),{version:1,kind:"files",formats:["pdf","pptx","xlsx"],usePrevious:false});
 for(const formats of [["pdf","pdf"],["exe"],[],["pdf","docx","pptx","xlsx","csv"]])
 assert.equal(validateSemanticPlan({version:1,kind:"files",formats,usePrevious:false}),null);
 assert.equal(validateSemanticPlan({version:1,kind:"files",formats:["pdf"],usePrevious:false,sql:"select secret"}),null);
 assert.equal(validateSemanticPlan({version:1,kind:"chat",execute:"anything"}),null);
 assert.equal(parseSemanticPlan("a promise, not JSON"),null);
});
test("Clarification is bounded data; greetings skip expensive planning",()=>{
 assert.deepEqual(parseSemanticPlan('```json\n{"version":1,"kind":"clarify","question":"Which file format would you like?"}\n```'),{version:1,kind:"clarify",question:"Which file format would you like?"});
 assert.equal(validateSemanticPlan({version:1,kind:"clarify",question:"<script>alert(1)</script>"}),null);
 assert.equal(needsSemanticPlan("Hello!"),false);
 assert.equal(needsSemanticPlan("Turn my notes into slides and a practice workbook"),true);
 assert.equal(needsSemanticPlan("حوّل الشرح إلى عرض تقديمي وملف مراجعة PDF"),true);
});
test("Every file contract bounds resources, persistence, cancellation and permissions",()=>{
 assert.equal(FILE_CONTRACTS.length,4);
 assert.ok(FILE_CONTRACTS.every(x=>x.requiresAuth&&x.maxBytes<=12582912&&x.retries===0&&x.persistence==="private_owner_scoped"));
});

import {detectArtifactIntents} from "./artifact-intent.ts";
test("Planner failure does not silently omit explicit supported deliverables",()=>{
 assert.deepEqual(detectArtifactIntents("Create a PDF guide, an English PowerPoint presentation and an Excel practice tracker").map(x=>x.kind),["pdf","pptx","xlsx"]);
 assert.deepEqual(detectArtifactIntents("Can you make PDF?"),[]);
 assert.deepEqual(detectArtifactIntents("Explain PDF and Excel formats"),[]);
});

test("A selected safety or poetry service avoids the unrelated file planner, while explicit exports remain available",()=>{assert.equal(needsSemanticPlan("اكتب قصيدة عن الصباح","Fanar-Diwan"),false);assert.equal(needsSemanticPlan("Review the safety of this explanation","Fanar-Guard-2"),false);assert.deepEqual(detectArtifactIntents("now make pdf").map(x=>x.kind),["pdf"]);assert.equal(needsSemanticPlan("Organize these notes into slides","auto"),true);});
