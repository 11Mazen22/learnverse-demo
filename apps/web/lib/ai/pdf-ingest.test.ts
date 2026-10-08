import test from "node:test";
import assert from "node:assert/strict";
import {isPdfDocument,pdfExcerpt,extractPdfDocument,MAX_PDF_CONTEXT,MAX_PDF_PAGES} from "./pdf-ingest.ts";
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


function buildOnePagePdf(body:string):Uint8Array{
 const encoder=new TextEncoder();
 const stream="BT /F1 14 Tf 60 700 Td ("+body+") Tj ET";
 const objects=[
   "<< /Type /Catalog /Pages 2 0 R >>",
   "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
   "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
   "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
   "<< /Length "+encoder.encode(stream).length+" >>\\nstream\\n"+stream+"\\nendstream",
 ];
 let output="%PDF-1.4\\n",positions=[0];
 for(let i=0;i<objects.length;i++){
   positions.push(encoder.encode(output).length);
   output+=(i+1)+" 0 obj\\n"+objects[i]+"\\nendobj\\n";
 }
 const pos=encoder.encode(output).length;
 output+="xref\\n0 "+(objects.length+1)+"\\n0000000000 65535 f \\n";
 for(const n of positions.slice(1))output+=String(n).padStart(10,"0")+" 00000 n \\n";
 output+="trailer\\n<< /Root 1 0 R /Size "+(objects.length+1)+" >>\\nstartxref\\n"+pos+"\\n%%EOF";
 return encoder.encode(output);
}
test("PDF.js extracts actual text from a real one-page PDF file",async()=>{
 const data=buildOnePagePdf("NOATA VERIFIED PDF");
 const result=await extractPdfDocument({
   name:"lesson.pdf",
   type:"application/pdf",
   size:data.length,
   arrayBuffer:async()=>Uint8Array.from(data).buffer,
 });
 assert.equal(result.totalPages,1);
 assert.equal(result.pages[0].page,1);
 assert.match(result.excerpt,/NOATA VERIFIED PDF/);
});
