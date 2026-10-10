import test from "node:test";
import assert from "node:assert/strict";
import {documentHtml, validatePdfInput, MAX_PDF_EXPORT_CHARS} from "./pdf-export.ts";

test("PDF export preserves Arabic, tables, lists and mixed-direction mathematical content",async()=>{
  const html=await documentHtml("## مقدمة\nالعربية مع English\n\n| مفهوم | نتيجة |\n|---|---|\n| سرعة | ٣ |\n\n1. خطوة أولى\n2. خطوة ثانية\n\n$$x^2 + y^2 = z^2$$","درس عربي",{arabic:"",latin:""});
  for(const marker of ['dir="rtl"','<h2>','<table>','<ol>','<math','العربية مع English']) assert.ok(html.includes(marker),marker);
  assert.ok(html.includes("table-header-group"));
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
