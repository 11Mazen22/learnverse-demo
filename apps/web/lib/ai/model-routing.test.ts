import test from "node:test";
import assert from "node:assert/strict";
import {CHAT_MODEL_CARDS,isConfiguredChatModel,resolveSuggestedModel,validateRegistry} from "./model-routing.ts";
test("model picker lists the backend configured chat routes, not specialized tools",()=>{
  assert.equal(validateRegistry(),true);
  assert.equal(isConfiguredChatModel("Fanar"),true);
  assert.equal(isConfiguredChatModel("Fanar-Diwan"),false);
  assert.ok(CHAT_MODEL_CARDS.every(x=>x.features.length&&x.subtitle));
});
test("Noata Auto routes varied Arabic requests by their actual request category",()=>{
  assert.equal(resolveSuggestedModel("حل المعادلة س²=4"),"Fanar-C-1-8.7B");
  assert.equal(resolveSuggestedModel("ما معنى آية قرآنية؟"),"Fanar-Sadiq-2");
  assert.equal(resolveSuggestedModel("مرحبا"),"Fanar-S-1-7B");
  assert.equal(resolveSuggestedModel("اقرأ الصورة",true),"Fanar-Oryx-IVU-2");
  assert.equal(resolveSuggestedModel("برهن المسألة الصعبة"),"Fanar-C-2-27B");
});
