import test from "node:test";
import assert from "node:assert/strict";
import { EDUCATION_FLOWS, EDUCATION_DEPTHS, buildEducationPrompt } from "./education-flows.ts";
test("every advertised education flow creates a meaningful real chat prompt",()=>{
 assert.equal(EDUCATION_FLOWS.length,9);
 for(const flow of EDUCATION_FLOWS){
  const prompt=buildEducationPrompt(flow.id,"التشابه الهندسي");
  assert.match(prompt,/التشابه الهندسي/);
  assert.match(prompt,/العربية/);
  assert.match(prompt,new RegExp(flow.title));
  assert.ok(flow.outcome.length>10);
 }
});
test("level and depth options shape the prompt",()=>{
 const prompt=buildEducationPrompt("quiz","الكسور",{level:"primary",depth:"deep"});
 assert.match(prompt,/ابتدائي/);
 assert.match(prompt,new RegExp(String(EDUCATION_DEPTHS[2].count)));
});
test("education tools reject blank, oversized or invalid topics",()=>{
 assert.throws(()=>buildEducationPrompt("quiz",""));
 assert.throws(()=>buildEducationPrompt("summary","z".repeat(1300)));
});

test("Quran workshop never asks Fanar to invent revelation",()=>{
 const prompt=buildEducationPrompt("quran","سورة الفاتحة الآية 1");
 assert.match(prompt,/لا تولّد آية/);
 assert.match(prompt,/مصدر تفسير موثوق/);
});
test("workshop note organization stays grounded in the learner's source",()=>{
 const prompt=buildEducationPrompt("notes","نقاط درس الطاقة",{level:"middle",depth:"brief"});
 assert.match(prompt,/نظّم الملاحظات/);
 assert.match(prompt,/إعدادي/);
 assert.match(prompt,/لا تضف حقائق غير مدعومة/);
});
