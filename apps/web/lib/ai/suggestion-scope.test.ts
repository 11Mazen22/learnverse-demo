import test from "node:test";
import assert from "node:assert/strict";
import {scopedSuggestions,suggestionScopeKey,type ScopedSuggestions} from "./suggestion-scope.ts";

const base={
 owner:"account-a",
 locale:"ar" as const,
 temporary:false,
 personalized:true,
 signature:"conversation-signature",
 epoch:2,
};

test("suggestion state is returned only for the exact account and conversation scope",()=>{
 const scope=suggestionScopeKey(base);
 const saved:ScopedSuggestions<string>={scope,items:["personalized A action"]};
 assert.deepEqual(scopedSuggestions(saved,scope,["safe default"]),["personalized A action"]);
 assert.deepEqual(scopedSuggestions(saved,suggestionScopeKey({...base,owner:"account-b"}),["safe default"]),["safe default"]);
 assert.deepEqual(scopedSuggestions(saved,suggestionScopeKey({...base,signature:"new conversation"}),["safe default"]),["safe default"]);
});

test("suggestion scope changes immediately on language, temporary-mode, personalization and new-chat changes",()=>{
 const saved:ScopedSuggestions<string>={scope:suggestionScopeKey(base),items:["previous suggestion"]};
 for(const changed of [
  {...base,locale:"en" as const},
  {...base,temporary:true},
  {...base,personalized:false},
  {...base,epoch:3},
 ]){
  assert.deepEqual(scopedSuggestions(saved,suggestionScopeKey(changed),["fallback"]),["fallback"]);
 }
});

test("a missing or stale suggestion snapshot always yields fresh fallback content",()=>{
 assert.deepEqual(scopedSuggestions(null,suggestionScopeKey(base),["one","two"]),["one","two"]);
 assert.deepEqual(scopedSuggestions({scope:"stale",items:["do not show"]},suggestionScopeKey(base),[]),[]);
});
