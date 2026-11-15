import test from "node:test";
import assert from "node:assert/strict";
import {
  CHAT_MODEL_CARDS,
  applyPedagogyPreset,
  describeSmartAutoRoute,
  isConfiguredChatModel,
  normalizeModelChoice,
  normalizeSubjectParam,
  resolveSuggestedModel,
  validateRegistry,
} from "./model-routing.ts";
import {
  detectSubjectHint,
  resolveAutoRoute,
} from "../../../../supabase/functions/noata-ai/routing.ts";
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


test("Smart Auto classifies Sec. 1 subjects, cognitive difficulty, and pedagogical mode", () => {
  const mathStep = resolveAutoRoute("حل المعادلة س²=4");
  assert.equal(mathStep.subjectHint, "mathematics");
  assert.equal(mathStep.difficulty, "standard");
  assert.equal(mathStep.pedagogicalMode, "step_by_step");

  const deepProof = resolveAutoRoute("برهن المسألة الصعبة في الأعداد المركبة");
  assert.equal(deepProof.model, "Fanar-C-2-27B");
  assert.equal(deepProof.difficulty, "advanced");
  assert.equal(deepProof.subjectHint, "mathematics");
  assert.equal(deepProof.pedagogicalMode, "deep_proof");

  const scienceVision = describeSmartAutoRoute("Why does water reach max density at 4°C?", true, "en");
  assert.equal(scienceVision.model, "Fanar-Oryx-IVU-2");
  assert.equal(scienceVision.subjectHint, "integrated-science");
  assert.equal(scienceVision.pedagogicalMode, "vision");
  assert.equal(scienceVision.subjectLabel, "Integrated Science");

  assert.equal(detectSubjectHint("ما دور الأوستراكا كمصدر أولي في الحضارة المصرية؟"), "history");
  assert.equal(detectSubjectHint("قارن بين القضايا الكلية A و E في مربع أرسطو"), "philosophy-logic");
  assert.equal(detectSubjectHint("أعرب الفاعل والمبتدأ في الجملة الاسمية"), "arabic-language");
  assert.equal(detectSubjectHint("Explain Second Conditional with examples"), "english");
});

test("subject URL normalization and pedagogy preset helpers preserve track language", () => {
  assert.equal(normalizeSubjectParam("integrated-science-ar"), "integrated-science");
  assert.equal(normalizeSubjectParam("mathematics-en"), "mathematics");
  assert.equal(normalizeSubjectParam("philosophy-logic"), "philosophy-logic");
  assert.equal(normalizeSubjectParam("unknown"), "all");

  const arabicPrompt = applyPedagogyPreset("المعرب والمبني", "simplify", "arabic-language", "en");
  assert.match(arabicPrompt, /اشرحلي ببساطة بالمصري/);

  const englishPrompt = applyPedagogyPreset("", "quiz", "english", "ar");
  assert.match(englishPrompt, /Sec\. 1 English/);
  assert.match(englishPrompt, /Quiz me/i);
});
