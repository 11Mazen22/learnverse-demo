import test from "node:test";
import assert from "node:assert/strict";
import {sanitizeFanarText} from "./sanitize.ts";
import {chooseFanarModel} from "./router.ts";

test("Fanar sanitizer removes leaked Quran and reasoning control markers",()=>{
  const input="مقدمة\n<quran_start>قُلْ هُوَ ٱللَّهُ أَحَدٌ<quran_end>\n<think>hidden</think>\n<tool_start>secret<tool_end>";
  const output=sanitizeFanarText(input);
  assert.equal(output.includes("<quran_start>"),false);
  assert.equal(output.includes("<think>"),false);
  assert.equal(output.includes("<tool_start>"),false);
  assert.equal(output.includes("hidden"),true);
  assert.match(output,/> قُلْ هُوَ ٱللَّهُ أَحَدٌ/);
});

test("Fanar sanitizer removes generic start/end wrappers without deleting visible text",()=>{
  const output=sanitizeFanarText("A<custom_start>visible<custom_end>B");
  assert.equal(output,"AvisibleB");
});

test("smart router prioritizes vision and Islamic routing",()=>{
  assert.equal(chooseFanarModel({hasImage:true,islamic:true,complexity:"high"}),"Fanar-Oryx-IVU-2");
  assert.equal(chooseFanarModel({islamic:true}),"Fanar-Sadiq-2");
});

test("smart router selects the intended reasoning tiers",()=>{
  assert.equal(chooseFanarModel({complexity:"low"}),"Fanar-S-1-7B");
  assert.equal(chooseFanarModel({complexity:"medium"}),"Fanar-C-1-8.7B");
  assert.equal(chooseFanarModel({complexity:"high"}),"Fanar-C-2-27B");
  assert.equal(chooseFanarModel({}),"Fanar");
});

test("specialized intents map to specialized Fanar capabilities",()=>{
  assert.equal(chooseFanarModel({intent:"translation"}),"Fanar-Shaheen-MT-1");
  assert.equal(chooseFanarModel({intent:"moderation"}),"Fanar-Guard-2");
  assert.equal(chooseFanarModel({intent:"poetry"}),"Fanar-Diwan");
});
