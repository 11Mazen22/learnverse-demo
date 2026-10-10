import test from "node:test";import assert from "node:assert/strict";
import {retrieveDocumentContext} from "./document-retrieval.ts";
test("retrieval finds material after the old prefix cap and discloses partial coverage",()=>{
 const text="مقدمة\n\n"+"معلومات عامة لا تخص السؤال. ".repeat(500)+"\n\nصفحة 12:\nالتفاعلات الكيميائية تتأثر بدرجة الحرارة والتركيز.\n\nخاتمة";
 const result=retrieveDocumentContext(text,"ما أثر الحرارة على التفاعلات الكيميائية؟",3000);
 assert.ok(result.excerpt.includes("تتأثر بدرجة الحرارة"));assert.ok(result.excerpt.includes("صفحة 12"));
 assert.ok(result.excerpt.includes("مقاطع منتقاة"));assert.ok(result.excerpt.length<=3000);assert.equal(result.truncated,true);
});
test("short documents retain all content without a truncation claim",()=>{
 assert.deepEqual(retrieveDocumentContext("محتوى قصير","قارن",500),{excerpt:"محتوى قصير",truncated:false});
});
