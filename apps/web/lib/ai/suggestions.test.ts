import test from "node:test";
import assert from "node:assert/strict";
import {parseSuggestions,suggestionContext,welcomeDefaults,validateSuggestionResult} from "../../../../supabase/functions/noata-ai/suggestions.ts";
test("four complete bilingual welcome actions",()=>{
 for(const locale of ["ar","en"] as const){const a=welcomeDefaults(locale);assert.equal(a.length,4);assert.equal(new Set(a.map(x=>x.title)).size,4);assert.ok(a.every(x=>x.prompt.length>=12));}
});
test("strict model suggestion validation",()=>{
 const a=[1,2,3,4].map(i=>({title:"Topic "+i,prompt:"Please explain relevant topic number "+i}));
 assert.equal(parseSuggestions(JSON.stringify({suggestions:a}),"welcome").length,4);
 assert.equal(parseSuggestions(JSON.stringify(a.slice(0,3)),"welcome").length,0);
 assert.equal(parseSuggestions(JSON.stringify(a.slice(0,3)),"followup").length,3);
 assert.equal(parseSuggestions(JSON.stringify([a[0],a[0],a[2],a[3]]),"welcome").length,0);
 assert.equal(parseSuggestions("invalid","welcome").length,0);
 assert.equal(validateSuggestionResult({suggestions:a},"welcome").length,4);
});
test("context removes sensitive strings",()=>{
 const value=suggestionContext("Look at https://test.example and user@example.com api_key:example-secret sk-privatekey123456",500);
 for(const x of ["test.example","user@example.com","example-secret","privatekey123456"])assert.ok(!value.includes(x));
});
