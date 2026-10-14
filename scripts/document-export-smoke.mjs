// Real Chromium PDF rendering, PDF.js readback and downloadable fixtures.
import {mkdir, writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
import {renderNoataPdf} from "../apps/web/lib/ai/pdf-renderer.ts";
import {generateArabicPdf} from "../apps/web/lib/pdf/arabic-pdf.ts";
import {createNoataDocx} from "../apps/web/lib/ai/docx-export.ts";
import {documentWithResearch} from "../apps/web/lib/ai/research-document.ts";
import {pdfTextLines} from "../apps/web/lib/ai/pdf-text.ts";
import {extractDocxDocument} from "../apps/web/lib/ai/docx-ingest.ts";
import {createRequire} from "node:module";
import {spawnSync} from "node:child_process";
const require=createRequire(new URL("../apps/web/package.json",import.meta.url));
const {getDocument,OPS}=await import(require.resolve("pdfjs-dist/legacy/build/pdf.mjs"));
const testedRevision=spawnSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).stdout.trim();
const initiallyDirty=!!spawnSync("git",["status","--porcelain"],{encoding:"utf8"}).stdout.trim();
const dir="artifacts/noata-documents";
await mkdir(dir,{recursive:true});
const text=`# تجربة تعلّم عربية\n\nهذه فقرة عربية متصلة لاختبار تشكيل الحروف واتجاه القراءة. Mixed English: Noata Learning 2026.\n\n6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂\n\nSymbols: → ← ≤ ≥ ∑ √ ∞\n\nالرموز: → ← ≤ ≥ ∑ √ ∞\n\n## جدول المفاهيم\n\n| المفهوم | التعريف | مثال |\n|---|---|---|\n| الطاقة | القدرة على بذل شغل | الشمس |\n| السرعة | المسافة على الزمن | 12 m/s |\n\n1. اقرأ الدرس بتركيز.\n2. اشرح الفكرة بأسلوبك.\n3. راجع بعد يومين.\n\n$$x^2 + y^2 = z^2$$\n\n`+
  Array.from({length:38},(_,i)=>`## القسم ${i+1}\n\n${"التعلّم رحلة نبني فيها الفهم بخطوات صغيرة. توضح هذه الفقرة اتصال الحروف والحدود بين صفحات المستند دون قطع العناوين أو تداخل النص. ".repeat(3)}\n\nEnglish reference ${i+1}: Learning should be clear and accessible.\n\n`).join("");
await writeFile(`${dir}/arabic-longform.md`,text);
const bytes=await renderNoataPdf(text,"خطة التعلّم · Noata",`${dir}/arabic-layout.png`);
assert.equal(Buffer.from(bytes).subarray(0,5).toString(),"%PDF-");
await writeFile(`${dir}/arabic-longform.pdf`,bytes);
if(spawnSync("which",["pdftoppm"],{stdio:"ignore"}).status===0){
 for(const page of [1,6,11]){
  const raster=spawnSync("pdftoppm",["-f",String(page),"-singlefile","-scale-to","1100","-png",`${dir}/arabic-longform.pdf`,`${dir}/pdf-page-${page}`],{encoding:"utf8"});
  assert.equal(raster.status,0,"Actual PDF page rasterization");
 }
}
const document=await getDocument({data:Uint8Array.from(bytes),isEvalSupported:false}).promise;
assert.ok(document.numPages>=5,"Long Arabic document should paginate");
const pages=[];
for(let number=1;number<=document.numPages;number++) {
  const page=await document.getPage(number);const {items}=await page.getTextContent();
  const text=pdfTextLines(items).join("\n");
  assert.ok(text.length>50,`Page ${number} should not be empty`);
  assert.ok(text.includes("خطة التعلّم"),`Page ${number} preserves the Arabic document title`);
  assert.ok(text.trim().endsWith(String(number)),`Page ${number} has its exact footer number`);
  const outside=items.filter(x=>"str" in x && x.str.trim() && (x.transform[4]<0 || x.transform[5]<0 || x.transform[4]>page.view[2] || x.transform[5]>page.view[3]));
  assert.equal(outside.length,0,`Page ${number} has text outside page boundaries`);
  pages.push({page:number,text});
}
const extracted=pages.map(x=>x.text).join("\n");
assert.ok(extracted.includes("هذه فقرة عربية متصلة لاختبار تشكيل الحروف واتجاه القراءة"),"Complete Arabic sentence and multi-letter clusters must survive extraction");
for(const symbol of ["→","←","≤","≥","∑","√","∞"])assert.ok(extracted.includes(symbol),"PDF symbol must survive real readback: "+symbol);
assert.ok(!extracted.includes("\u0000"),"PDF readback must not replace an unsupported glyph with NUL");
const logical=extracted.replace(/\s+/g," ");
assert.ok(logical.includes("الرموز: → ← ≤ ≥ ∑ √ ∞"),"RTL source must preserve the exact order and meaning of inequality symbols");
for(const fragment of ["المفهوم التعريف مثال","الطاقة القدرة على بذل شغل الشمس","السرعة المسافة على الزمن","اقرأ الدرس بتركيز","اشرح الفكرة بأسلوبك","راجع بعد يومين","التعلّم رحلة نبني فيها الفهم بخطوات صغيرة","توضح هذه الفقرة اتصال الحروف والحدود بين صفحات المستند دون قطع العناوين أو تداخل النص"])
 assert.ok(logical.includes(fragment),"Source phrase preserved: "+fragment);
assert.ok(extracted.includes("Noata"));assert.ok(/التعلّم|التعلم|تجربة/.test(extracted),"Arabic text extraction");
assert.ok(extracted.includes("English reference 38"),"End of long document must survive");
await writeFile(`${dir}/pdf-readback.json`,JSON.stringify({revision:testedRevision,dirty:initiallyDirty||!!spawnSync("git",["status","--porcelain"],{encoding:"utf8"}).stdout.trim(),pages:pages.length,bytes:bytes.length,checks:"Arabic sentences/clusters/diacritics, scientific symbols, tables/lists, every title/footer, final section, all page bounds",content:pages},null,2));
await document.destroy();
for(const [name,body] of Object.entries({"source.txt":"مصدر فعلي: سرعة الضوء ثابتة في الفراغ.","source.md":"# ملاحظات دراسية\n\nمحتوى Markdown كامل.","source.csv":"المفهوم,القيمة\nالسرعة,12\n","source.json":JSON.stringify({title:"محتوى JSON حقيقي",values:[1,2,3]})}))await writeFile(`${dir}/${name}`,body);
const docx=createNoataDocx(text);
await writeFile(`${dir}/arabic-longform.docx`,docx);
const ingested=await extractDocxDocument({name:"fixture.docx",type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",size:docx.length,arrayBuffer:async()=>Uint8Array.from(docx).buffer});
assert.ok(ingested.excerpt.includes("تجربة تعلّم عربية"));
console.log(`PASS: actual ${pages.length}-page Arabic PDF and DOCX roundtrip; fixtures in ${dir}`);

// The optional native engine is verified independently; existing Chromium output stays authoritative.
const native = await generateArabicPdf({title:"خطة التعلّم · Noata", markdown:text, date:new Date("2026-10-10T00:00:00Z")});
await writeFile(`${dir}/arabic-native.pdf`,native.bytes);
const nativeDocument = await getDocument({data:Uint8Array.from(native.bytes),isEvalSupported:false}).promise;
assert.equal(nativeDocument.numPages,native.pageCount);
assert.ok(native.pageCount>=5);
const nativePages=[];
for(let number=1;number<=nativeDocument.numPages;number++) {
  const page=await nativeDocument.getPage(number);const {items}=await page.getTextContent();
  const readback=pdfTextLines(items).join("\n");
  assert.ok(readback.length>50,`Native page ${number} should not be empty`);
  const outside=items.filter(x=>"str" in x && x.str.trim() && (x.transform[4]<0 || x.transform[5]<0 || x.transform[4]+x.width>page.view[2]+1 || x.transform[5]>page.view[3]));
  assert.equal(outside.length,0,`Native page ${number} has text outside page boundaries`);
  assert.ok(readback.includes("صفحة"),`Native page ${number} has an Arabic footer`);
  nativePages.push({page:number,text:readback});
}
const nativeText=nativePages.map(x=>x.text).join(" ").replace(/\s+/g,"");
for(const fragment of ["هذه فقرة عربية متصلة لاختبار تشكيل الحروف واتجاه القراءة","الطاقة القدرة على بذل شغل الشمس","English reference 38"])
  assert.ok(nativeText.includes(fragment.replace(/\s+/g,"")),"Native source phrase preserved: "+fragment);
await writeFile(`${dir}/native-pdf-readback.json`,JSON.stringify({revision:testedRevision,dirty:initiallyDirty||!!spawnSync("git",["status","--porcelain"],{encoding:"utf8"}).stdout.trim(),pages:native.pageCount,bytes:native.bytes.length,checks:"Arabic/mixed source phrases, final section, all page bounds, Arabic footers",content:nativePages},null,2));
if(spawnSync("which",["pdftoppm"],{stdio:"ignore"}).status===0) {
  for(const page of [1,Math.ceil(native.pageCount/2),native.pageCount]) {
    const raster=spawnSync("pdftoppm",["-f",String(page),"-singlefile","-scale-to","1100","-png",`${dir}/arabic-native.pdf`,`${dir}/native-pdf-page-${page}`],{encoding:"utf8"});
    assert.equal(raster.status,0,"Native PDF page rasterization");
  }
}
await nativeDocument.destroy();
console.log(`PASS: native ${native.pageCount}-page Arabic PDF roundtrip and page bounds`);

// A generated research report must retain its prose alongside the chart.
const reportSource="# Practice report\n\nREPORT_PROSE_PRESERVATION_CHECK: These are explicitly synthetic observations for an export regression, not live climate measurements.";
const chart={version:1,id:"report-check",type:"line_chart",title:"Practice observations",fallback:"Two practice observations",xLabel:"Sample",yLabel:"Value",points:[{label:"First",value:2},{label:"Second",value:4}]};
const reportBytes=await renderNoataPdf(reportSource,"Practice report",undefined,chart);
const chartDocument=await getDocument({data:Uint8Array.from(reportBytes),isEvalSupported:false}).promise;
let chartReadback="";
for(let page=1;page<=chartDocument.numPages;page++){
 const value=await chartDocument.getPage(page);
 chartReadback+=pdfTextLines((await value.getTextContent()).items).join(" ");
}
assert.ok(chartReadback.includes("REPORT_PROSE_PRESERVATION_CHECK"),"Chart export must preserve the requested report prose");
assert.ok(chartReadback.includes("Practice observations"),"Actual chart title appears alongside prose");
await writeFile(`${dir}/report-with-chart.pdf`,reportBytes);
await writeFile(`${dir}/report-chart-readback.json`,JSON.stringify({revision:testedRevision,dirty:initiallyDirty,passed:true,bytes:reportBytes.length,text:chartReadback},null,2));
await chartDocument.destroy();
console.log("PASS: real report prose and numeric chart survive the same PDF");


// Observed PDF regressions: one main title, real math and embedded font choices.
const scientificSource="# Photosynthesis Guide\n\n## Introduction to Photosynthesis\nPlants transform light energy into chemical energy. Chlorophyll absorbs light in chloroplasts.\n\n\\[\n6\\text{CO}_2+6\\text{H}_2\\text{O}\\xrightarrow{\\text{light}}\\text{C}_6\\text{H}_{12}\\text{O}_6+6\\text{O}_2\n\\]\n\n## Energy and products\nCarbon dioxide and water produce glucose and oxygen. The light reactions and Calvin cycle perform different roles.\n";
const referenceUrl="https://en.wikipedia.org/wiki/Photosynthesis";
const citedScientificSource=documentWithResearch(scientificSource+"\n\nBackground reading [1].",{version:1,status:"complete",reason:"encyclopedia_background",elapsedMs:1,sources:[{id:1,title:"Photosynthesis",url:referenceUrl,domain:"en.wikipedia.org",excerpt:"PDF reference preservation fixture.",retrievedAt:"2026-10-14T00:00:00Z"}]},"en","pdf");
const fontChecks=[];
for(const [font,expectedFont] of [["editorial","Lora"],["mono","RobotoMono"]]){
 const bytes=await renderNoataPdf(citedScientificSource,"Photosynthesis Guide",dir+"/photosynthesis-"+font+".png",undefined,"forest",font);
 await writeFile(dir+"/photosynthesis-"+font+".pdf",bytes);
 const parsed=await getDocument({data:Uint8Array.from(bytes),isEvalSupported:false,fontExtraProperties:true}).promise;
 let visible="",fonts=[];
 const page=await parsed.getPage(1),content=await page.getTextContent();
 visible=pdfTextLines(content.items).join(" ");
 const operators=await page.getOperatorList();
 for(const dependency of operators.fnArray.map((fn,i)=>fn===OPS.dependency?operators.argsArray[i]:null).filter(Boolean).flat()){
  try{const face=page.commonObjs.get(dependency);if(face?.name)fonts.push(face.name);}catch{}
 }
 assert.ok(visible.includes("Plants transform light energy"));
 assert.ok(visible.replace(/\s+/g,"").includes(referenceUrl),"The complete source URL survives actual PDF rendering and readback");
 assert.ok(visible.includes("do not verify news or current claims"),"Research limitations survive actual export");
 assert.ok(!visible.includes("\\text")&&!visible.includes("\\xrightarrow"),"LaTeX is visibly typeset");
 assert.ok(!visible.includes("\u0000"),"Chemical expressions have no missing glyph NUL");
 assert.equal(pdfTextLines(content.items.filter(x=>"str" in x&&Math.abs(x.transform[0])>20)).filter(line=>line==="Photosynthesis Guide").length,1,"Exactly one large document title");
 assert.ok(fonts.some(name=>name.toLowerCase().replace(/[^a-z]/g,"").includes(expectedFont.toLowerCase())),"The selected font is embedded in the actual PDF: "+expectedFont);
 fontChecks.push({font,bytes:bytes.length,pages:parsed.numPages,embeddedFonts:fonts,titleCount:1,mathTypeset:true});
 await parsed.destroy();
}
await writeFile(dir+"/typography-readback.json",JSON.stringify({revision:testedRevision,dirty:initiallyDirty,passed:true,scope:"Actual Chromium-rendered font/PDF bytes and PDF.js readback; not an authenticated browser or provider test.",checks:fontChecks},null,2));
console.log("PASS: embedded Lora and Roboto Mono PDFs, chemical typesetting and one large title");

// A native styled XY chart must survive export and later canonical-text revisions.
const xy={version:1,id:"xy_export_qa",type:"xy_chart",title:"Styled XY QA",fallback:"Three actual supplied test coordinates per series.",xLabel:"Time (s)",yLabel:"Distance (m)",dataOrigin:"provided",series:[
 {name:"Sample A",color:"red",dash:"dashed",kind:"line",points:[{x:0,y:0},{x:1,y:2},{x:10,y:5}]},
 {name:"Sample B",color:"green",dash:"dotted",kind:"line",points:[{x:0,y:1},{x:1,y:3},{x:10,y:7}]}
]};
const nativeFence=String.fromCharCode(96).repeat(3);
const xySource="# XY revision fixture\n\nQA_CHART_PREFIX remains unchanged.\n\n"+nativeFence+"noata-ui\n"+JSON.stringify(xy)+"\n"+nativeFence+"\n\nQA_CHART_SUFFIX remains unchanged.";
const xyChecks=[];
for(const [name,source] of [["original",xySource],["revised",xySource.replace("XY revision fixture","Revised XY fixture")]]){
 const output=await renderNoataPdf(source,"Styled XY QA",dir+"/xy-"+name+".png",undefined,"forest","editorial");
 await writeFile(dir+"/xy-"+name+".pdf",output);
 const parsed=await getDocument({data:Uint8Array.from(output),isEvalSupported:false,fontExtraProperties:true}).promise;
 let readback="",dashPatterns=[],pathCount=0,fonts=[];
 for(let number=1;number<=parsed.numPages;number++){
  const page=await parsed.getPage(number),content=await page.getTextContent(),ops=await page.getOperatorList();
  readback+=pdfTextLines(content.items).join(" ");
  for(let i=0;i<ops.fnArray.length;i++){
   if(ops.fnArray[i]===OPS.setDash)dashPatterns.push(ops.argsArray[i][0]);
   if(ops.fnArray[i]===OPS.constructPath)pathCount++;
   if(ops.fnArray[i]===OPS.dependency)for(const key of ops.argsArray[i]){
    try{const face=page.commonObjs.get(key);if(face?.name)fonts.push(face.name);}catch{}
   }
  }
  assert.equal(content.items.filter(x=>"str" in x&&x.str.trim()&&(x.transform[4]<0||x.transform[5]<0||x.transform[4]+x.width>page.view[2]+1||x.transform[5]>page.view[3])).length,0,"XY PDF text remains inside each page");
 }
 for(const text of ["QA_CHART_PREFIX","QA_CHART_SUFFIX","Sample A","Sample B","Time (s)","Distance (m)"])assert.ok(readback.includes(text),"XY revision preserves "+text);
 assert.ok(!readback.includes("noata-ui")&&!readback.includes('"series"'),"Chart protocol is not exposed as raw code");
 assert.ok(pathCount>6,"Actual vector graph marks survive PDF rendering");
 assert.ok(dashPatterns.some(x=>x.length&&x[0]>=8)&&dashPatterns.some(x=>x.length&&x[0]<=3),"Dashed and dotted line patterns survive the actual PDF");
 assert.ok(fonts.some(x=>x.toLowerCase().includes("lora")),"Selected editorial font survives chart export");
 xyChecks.push({name,bytes:output.length,pages:parsed.numPages,pathCount,dashPatterns,checks:"Canonical graph, supplied values, vector marks, line styles, page bounds and fonts"});
 await parsed.destroy();
}
await writeFile(dir+"/xy-chart-readback.json",JSON.stringify({revision:testedRevision,dirty:initiallyDirty,passed:true,scope:"Actual generated PDF roundtrip and controlled canonical-source revision; not a real provider or signed-in app test.",checks:xyChecks},null,2));
console.log("PASS: real styled XY charts survive original and revised PDF rendering");
