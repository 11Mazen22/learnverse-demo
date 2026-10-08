// Real Chromium PDF rendering, PDF.js readback and downloadable fixtures.
import {mkdir, writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
import {renderNoataPdf} from "../apps/web/lib/ai/pdf-renderer.ts";
import {createNoataDocx} from "../apps/web/lib/ai/docx-export.ts";
import {pdfTextLines} from "../apps/web/lib/ai/pdf-text.ts";
import {extractDocxDocument} from "../apps/web/lib/ai/docx-ingest.ts";
import {createRequire} from "node:module";
import {spawnSync} from "node:child_process";
const require=createRequire(new URL("../apps/web/package.json",import.meta.url));
const {getDocument}=await import(require.resolve("pdfjs-dist/legacy/build/pdf.mjs"));
const dir="artifacts/noata-documents";
await mkdir(dir,{recursive:true});
const text=`# تجربة تعلّم عربية\n\nهذه فقرة عربية متصلة لاختبار تشكيل الحروف واتجاه القراءة. Mixed English: Noata Learning 2026.\n\n## جدول المفاهيم\n\n| المفهوم | التعريف | مثال |\n|---|---|---|\n| الطاقة | القدرة على بذل شغل | الشمس |\n| السرعة | المسافة على الزمن | 12 m/s |\n\n1. اقرأ الدرس بتركيز.\n2. اشرح الفكرة بأسلوبك.\n3. راجع بعد يومين.\n\n$$x^2 + y^2 = z^2$$\n\n`+
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
  assert.ok(text.includes(String(number)),`Page ${number} has a page number`);
  const outside=items.filter(x=>"str" in x && x.str.trim() && (x.transform[4]<0 || x.transform[5]<0 || x.transform[4]>page.view[2] || x.transform[5]>page.view[3]));
  assert.equal(outside.length,0,`Page ${number} has text outside page boundaries`);
  pages.push({page:number,text});
}
const extracted=pages.map(x=>x.text).join("\n");
assert.ok(extracted.includes("Noata"));assert.ok(/التعلّم|التعلم|تجربة/.test(extracted),"Arabic text extraction");
assert.ok(extracted.includes("English reference 38"),"End of long document must survive");
await writeFile(`${dir}/pdf-readback.json`,JSON.stringify({revision:spawnSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).stdout.trim(),pages:pages.length,bytes:bytes.length,checks:"Arabic text, final section, pagination, all page bounds",content:pages},null,2));
await document.destroy();
for(const [name,body] of Object.entries({"source.txt":"مصدر فعلي: سرعة الضوء ثابتة في الفراغ.","source.md":"# ملاحظات دراسية\n\nمحتوى Markdown كامل.","source.csv":"المفهوم,القيمة\nالسرعة,12\n","source.json":JSON.stringify({title:"محتوى JSON حقيقي",values:[1,2,3]})}))await writeFile(`${dir}/${name}`,body);
const docx=createNoataDocx(text);
await writeFile(`${dir}/arabic-longform.docx`,docx);
const ingested=await extractDocxDocument({name:"fixture.docx",type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",size:docx.length,arrayBuffer:async()=>Uint8Array.from(docx).buffer});
assert.ok(ingested.excerpt.includes("تجربة تعلّم عربية"));
console.log(`PASS: actual ${pages.length}-page Arabic PDF and DOCX roundtrip; fixtures in ${dir}`);
