import test from "node:test";import assert from "node:assert/strict";
import {specialistRequest,specialistReply} from "../../../../supabase/functions/noata-ai/specialists.ts";
test("Selected specialists use their actual documented endpoints, never chat completion aliases",()=>{
 assert.deepEqual(specialistRequest("Fanar-Diwan","Write a poem about the sea",undefined),{path:"/poems/generations",body:{model:"Fanar-Diwan",prompt:"Write a poem about the sea"}});
 assert.deepEqual(specialistRequest("Fanar-Guard-2","A gentle explanation.","Explain tides."),{path:"/moderations",body:{model:"Fanar-Guard-2",prompt:"Explain tides.",response:"A gentle explanation."}});
 assert.throws(()=>specialistRequest("Fanar-Diwan","",null));assert.throws(()=>specialistRequest("Fanar-Guard-2","text","x".repeat(2001)));
});
test("Guard reports only actual finite scores and never invents a safety threshold or factual verdict",()=>{
 const result=specialistReply("Fanar-Guard-2",{safety:0.9,cultural_awareness:0.8},"en");
 assert.match(result,/\| Safety \| 0.9 \|/);assert.match(result,/not a factual accuracy check/);
 for(const data of [{safety:NaN,cultural_awareness:0},{safety:"0.9",cultural_awareness:0},{}])assert.throws(()=>specialistReply("Fanar-Guard-2",data,"en"));
});
test("Diwan preserves verse breaks and identifies generated poetry honestly",()=>{
 const poem=specialistReply("Fanar-Diwan",{poem:"A light upon the sea,\nA dream that carries me."},"en");
 assert.match(poem,/sea,  \nA dream/);assert.match(poem,/Review wording and attribution/);assert.doesNotMatch(poem,/Original poem|not a quotation/);
 assert.throws(()=>specialistReply("Fanar-Diwan",{poem:""},"ar"));
});

test("Observed Guard scores render readably without adding an invented range",()=>{const value=specialistReply("Fanar-Guard-2",{safety:4.506101608276367,cultural_awareness:3.8109819889068604},"en");assert.ok(value.includes("| Safety | 4.51 |"));assert.ok(value.includes("| Cultural awareness | 3.81 |"));});
