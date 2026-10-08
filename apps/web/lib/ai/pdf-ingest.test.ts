import test from "node:test";
import assert from "node:assert/strict";
import {isPdfDocument,pdfExcerpt,MAX_PDF_CONTEXT,MAX_PDF_PAGES} from "./pdf-ingest.ts";
test("only actual PDF MIME/name pairs are accepted",()=>{
 assert.equal(isPdfDocument({name:"lesson.pdf",type:"application/pdf"}),true);
 assert.equal(isPdfDocument({name:"lesson.exe",type:"application/pdf"}),false);
 assert.equal(isPdfDocument({name:"lesson.pdf",type:"text/html"}),false);
});
test("PDF text includes page citations and stays bounded",()=>{
 const pages=Array.from({length:MAX_PDF_PAGES},(_,i)=>({page:i+1,text:"اختبار ".repeat(800),characters:5000}));
 const excerpt=pdfExcerpt(pages);
 assert.ok(excerpt.length<=MAX_PDF_CONTEXT+MAX_PDF_PAGES*2);
 assert.match(excerpt,/صفحة 1/);
 assert.ok(excerpt.indexOf("صفحة 1")<excerpt.indexOf("صفحة 2"));
});
