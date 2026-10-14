import test from "node:test";
import assert from "node:assert/strict";
import {createNoataMultiSheetXlsx} from "./xlsx-multisheet.ts";
import {extractXlsxDocument,isXlsxDocument,MAX_XLSX_BYTES} from "./xlsx-ingest.ts";
import {extractDocumentBatch,validateDocumentBatch,appendDocumentSources} from "./multi-document.ts";
const mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
function uploaded(bytes:Uint8Array,name="grades.xlsx",type=mime){
 return {name,type,size:bytes.length,text:async()=>"",arrayBuffer:async()=>Uint8Array.from(bytes).buffer};
}
test("Read actual bilingual, multi-sheet Excel cells as quoted source content",async()=>{
 const bytes=createNoataMultiSheetXlsx([
  {name:"Scores",rows:[["Student","Score"],["Sara","91"],["Omar","86"]]},
  {name:"الدرجات",rows:[["المادة","الدرجة"],["العلوم","95"],["الرياضيات","90"]]}
 ]);
 const file=uploaded(bytes);
 assert.equal(isXlsxDocument(file),true);
 assert.equal(validateDocumentBatch([file],"en"),null);
 const extracted=await extractXlsxDocument(file);
 assert.match(extracted.excerpt,/Worksheet: Scores/);
 assert.match(extracted.excerpt,/Sara\s*\|\s*91/);
 assert.match(extracted.excerpt,/Worksheet: الدرجات/);
 assert.match(extracted.excerpt,/العلوم\s*\|\s*95/);
 assert.match(extracted.excerpt,/formulas were not recalculated/i);
 assert.match(extracted.excerpt,/Deterministic numeric summaries/);
 assert.match(extracted.excerpt,/Score: count=2, min=86, max=91, mean=88.5/);
 const context=await extractDocumentBatch([file],"scores");
 assert.equal(context[0].format,"xlsx");
 assert.match(appendDocumentSources("Analyze my grades",context),/grades.xlsx/);
});
test("Excel sources reject masquerading or oversized payloads",async()=>{
 assert.equal(isXlsxDocument({name:"invoice.xlsm",type:mime}),false);
 assert.equal(isXlsxDocument({name:"invoice.xlsx",type:"text/html"}),false);
 assert.match(validateDocumentBatch([{name:"fake.xls",type:"",size:200}],"en")??"",/Supported/);
 const forged=uploaded(new Uint8Array(200));
 await assert.rejects(()=>extractXlsxDocument(forged),/Office ZIP/);
 assert.match(validateDocumentBatch([{name:"huge.xlsx",type:mime,size:MAX_XLSX_BYTES+1}],"en")??"",/size limit/);
});
test("Workbook formula strings are never executed as JavaScript",async()=>{
 const bytes=createNoataMultiSheetXlsx([{name:"Data",rows:[["Count","Formula"],["20","=SUM(A2:A2)"]]},{name:"Notes",rows:[["Language"],["عربي"]]}]);
 const result=await extractXlsxDocument(uploaded(bytes));
 assert.match(result.excerpt,/SUM\(A2:A2\)/);
 assert.match(result.excerpt,/not recalculated/);
});
