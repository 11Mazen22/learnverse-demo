import test from "node:test";
import assert from "node:assert/strict";
import {documentHtml, validatePdfInput, MAX_PDF_EXPORT_CHARS} from "./pdf-export.ts";
import {documentDirection} from "./document-direction.ts";

test("English documents use LTR while Arabic documents retain RTL", async () => {
  assert.equal(documentDirection("## 123 English heading"), "ltr");
  assert.equal(documentDirection("## 123 عنوان عربي"), "rtl");
  const html = await documentHtml("# English lesson\nThis is readable English.", "Lesson", {arabic:"",latin:""});
  assert.ok(html.includes('<html lang="en" dir="ltr">'));
});

test("PDF export preserves Arabic, tables, lists and mixed-direction mathematical content",async()=>{
  const html=await documentHtml("## مقدمة\nالعربية مع English\n\n| مفهوم | نتيجة |\n|---|---|\n| سرعة | ٣ |\n\n1. خطوة أولى\n2. خطوة ثانية\n\n$$x^2 + y^2 = z^2$$","درس عربي",{arabic:"",latin:""});
  for(const marker of ['dir="rtl"','<h2>','<table>','<ol>','<math','العربية مع English']) assert.ok(html.includes(marker),marker);
  assert.ok(html.includes("table-header-group"));
});
test("PDF export does not repeat a generated Arabic title as the opening heading",async()=>{
  const title="تاريخ الشوكولاتة: رحلة عبر الزمن";
  const html=await documentHtml(`# ${title}\n\n## المقدمة\nتروي هذه الوثيقة قصة الشوكولاتة عبر الزمن.`,title,{arabic:"",latin:""});
  const body=html.split("<main>")[1]?.split("</main>")[0]??"";
  assert.equal((body.match(/تاريخ الشوكولاتة/g)??[]).length,0);
  assert.equal((body.match(/<h1/g)??[]).length,0);
  assert.equal((body.match(/<h2/g)??[]).length,1);
});
test("PDF exporter excludes raw HTML, hostile links and remote resources",async()=>{
  const html=await documentHtml('<script>alert(1)</script>\n\n[click](javascript:alert(1))\n\n![secret](https://internal.invalid/secret)',"<img onerror='x'>",{arabic:"",latin:""});
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('src="https://'));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(html.includes("&lt;img"));
});
test("PDF bounds reject empty, oversized and invalid documents",()=>{
  for(const v of [null,{}, {text:" "}, {text:"a".repeat(MAX_PDF_EXPORT_CHARS+1)}, {text:"a",title:123}]) assert.equal(validatePdfInput(v),false);
  assert.equal(validatePdfInput({text:"نص"}),true);
});

test("Observed photosynthesis LaTeX prints as math and matching titles appear once",async()=>{
 const source="# Photosynthesis Guide\n\n## Introduction to Photosynthesis\nPlants convert light into chemical energy.\n\n\\[\n6\\text{CO}_2+6\\text{H}_2\\text{O}\\xrightarrow{\\text{light}}\\text{C}_6\\text{H}_{12}\\text{O}_6+6\\text{O}_2\n\\]";
 const html=await documentHtml(source,"Photosynthesis Guide",{arabic:"",latin:""});
 assert.equal((html.match(/<h1/g)??[]).length,1);
 assert.ok(html.includes("<math"));
 assert.ok(html.includes("<msub>"));
 assert.ok(!html.replace(/<annotation[\s\S]*?<\/annotation>/g,"").includes("\\xrightarrow"));
 assert.ok(html.includes("Introduction to Photosynthesis"));
});
test("PDF styles are finite presets and cannot inject CSS or remote resources",async()=>{
 assert.equal(validatePdfInput({text:"content",style:"https://attacker.invalid"}),false);
 const html=await documentHtml("# Scientific report\nActual facts.","Scientific report",{arabic:"",latin:""},"forest");
 assert.ok(html.includes("#22654C"));
});

test("PDF font selection embeds the selected face and rejects arbitrary font input",async()=>{assert.equal(validatePdfInput({text:"source",font:"remote-css"}),false);const html=await documentHtml("# Font check\nReadable text.","Font check",{arabic:"",latin:"",extra:"fixture-font-bytes"},"editorial","editorial");assert.ok(html.includes("font-family:NoataEditorial"));assert.ok(html.includes("src:url(data:font/ttf;base64,fixture-font-bytes)"));assert.ok(!html.includes("https://fonts."));});
