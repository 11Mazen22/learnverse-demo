import test from "node:test";
import assert from "node:assert/strict";
import {CHAT_MODEL_CARDS,isConfiguredChatModel,resolveSuggestedModel,validateRegistry,normalizeModelChoice} from "./model-routing.ts";
test("model picker lists configured conversation and correctly routed specialist services",()=>{
  assert.equal(validateRegistry(),true);
  assert.equal(isConfiguredChatModel("Fanar"),true);
  assert.equal(isConfiguredChatModel("Fanar-Diwan"),true);
  assert.equal(isConfiguredChatModel("Fanar-Guard-2"),true);
  assert.equal(isConfiguredChatModel("Fanar-Sadiq-2"),false);
  assert.equal(normalizeModelChoice("Fanar-Sadiq-2"),"auto");
  assert.ok(CHAT_MODEL_CARDS.every(x=>x.features.length&&x.subtitle));
});
test("Noata Auto routes varied Arabic requests by their actual request category",()=>{
  assert.equal(resolveSuggestedModel("حل المعادلة س²=4"),"Fanar-C-1-8.7B");
  assert.equal(resolveSuggestedModel("ما معنى آية قرآنية؟"),"Fanar-Sadiq");
  assert.equal(resolveSuggestedModel("مرحبا"),"Fanar-S-1-7B");
  assert.equal(resolveSuggestedModel("اقرأ الصورة",true),"Fanar-Oryx-IVU-2");
  assert.equal(resolveSuggestedModel("برهن المسألة الصعبة"),"Fanar-C-2-27B");
});

test("native learning requests use the bilingual schema-following route",()=>{
 assert.equal(resolveSuggestedModel("Explain quadratic roots with an interactive graph"),"Fanar");
 assert.equal(resolveSuggestedModel("\u0627\u0634\u0631\u062d \u0628\u0631\u0633\u0645 \u062a\u0641\u0627\u0639\u0644\u064a"),"Fanar");
 assert.equal(resolveSuggestedModel("Create flashcards about cells"),"Fanar");
});
