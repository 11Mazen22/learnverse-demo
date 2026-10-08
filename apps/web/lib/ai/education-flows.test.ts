import test from "node:test";
import assert from "node:assert/strict";
import { EDUCATION_FLOWS, buildEducationPrompt } from "./education-flows.ts";
test("every advertised education flow creates a meaningful real chat prompt",()=>{
 assert.equal(EDUCATION_FLOWS.length,6);
 for(const flow of EDUCATION_FLOWS){
  const prompt=buildEducationPrompt(flow.id,"التشابه الهندسي");
  assert.match(prompt,/التشابه الهندسي/);
  assert.match(prompt,/العربية/);
 }
});
test("education tools reject blank, oversized or invalid topics",()=>{
 assert.throws(()=>buildEducationPrompt("quiz",""));
 assert.throws(()=>buildEducationPrompt("summary","z".repeat(1300)));
});
