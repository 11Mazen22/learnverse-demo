import test from "node:test";
import assert from "node:assert/strict";
import {searchPlan} from "../../../../supabase/functions/noata-ai/research.ts";
import {artifactDerivativeHistory,artifactDerivativePrompt} from "./artifact-derivative.ts";

test("additional requested formats reuse the answer without repeating web research",()=>{
 for(const kind of ["pdf","docx","xlsx","pptx"] as const){
  const prompt=artifactDerivativePrompt(kind);
  const plan=searchPlan(prompt);
  assert.equal(plan.needed,false,kind);
  assert.equal(plan.reason,"opt_out",kind);
  assert.match(prompt,/sole source for factual claims and data/);
  assert.match(prompt,/numbers, caveats, uncertainty, and citation IDs/);
  assert.match(prompt,/do not browse, search the web, or call tools again/i);
  assert.match(prompt,/complete finished content/i);
 }
});

test("workbook conversion cannot invent missing numeric data",()=>{
 assert.match(artifactDerivativePrompt("xlsx"),/without inventing values/i);
 assert.doesNotMatch(artifactDerivativePrompt("docx"),/inventing values/i);
});

test("multi-format delivery puts the researched answer before a no-search format request",()=>{
 const history=[{id:"request",conversation_id:"conversation",role:"user" as const,content:"Research the topic and create a PDF plus an Excel workbook.",model:null,status:"complete",created_at:"2026-10-15T10:00:00Z"}];
 const next=artifactDerivativeHistory(history,"Answer with citations [1].", "xlsx","conversation","operation","2026-10-15T10:00:01Z");
 assert.equal(next.at(-2)?.role,"assistant");assert.equal(next.at(-2)?.content,"Answer with citations [1].");
 const latest=next.at(-1);
 assert.equal(latest?.role,"user");assert.equal(searchPlan(latest?.content??"").needed,false);
 assert.equal(next[0].content,history[0].content,"the actual request remains in context");
});
