import test from "node:test";
import assert from "node:assert/strict";
import {PDFDocument,PDFArray,PDFDict,PDFHexString,PDFName} from "pdf-lib";
import {annotatePdfNotes,MAX_PDF_TEXT_NOTES,type PdfTextNote} from "./pdf-annotations.ts";

async function fixture(){
 const doc=await PDFDocument.create();
 doc.setTitle("Original PDF");doc.setAuthor("Original author");
 const a=doc.addPage([420,520]),b=doc.addPage([560,740]);
 a.drawText("Original page one",{x:36,y:250});b.drawText("Original page two",{x:36,y:350});
 return doc.save({useObjectStreams:false});
}
function annotationsFrom(doc:PDFDocument,pageNumber:number){
 const page=doc.getPage(pageNumber-1),reference=page.node.get(PDFName.of("Annots"));
 if(!reference)return [] as PDFDict[];
 const array=reference instanceof PDFArray?reference:doc.context.lookup(reference as never,PDFArray);
 return array.asArray().map(item=>item instanceof PDFDict?item:doc.context.lookup(item as never,PDFDict))
  .filter(item=>item.get(PDFName.of("Subtype"))?.toString()==="/Text");
}
test("PDF annotations add portable Arabic and English sticky notes while preserving page content and metadata",async()=>{
 const source=await fixture(),original=source.slice(),before=await PDFDocument.load(source,{updateMetadata:false});
 const contentBefore=before.getPage(0).node.get(PDFName.of("Contents"))?.toString(),resourcesBefore=before.getPage(0).node.get(PDFName.of("Resources"))?.toString();
 const created=new Date("2026-10-16T10:30:00.000Z");
 const notes:PdfTextNote[]=[
  {page:1,text:"راجع هذه الفقرة العربية",position:"top-right"},
  {page:1,text:"Check this value",position:"bottom-left"},
  {page:2,text:"This remains a note, not rewritten page text.",position:"top-left"},
 ];
 const output=await annotatePdfNotes(source,notes,"Mazen",created);
 assert.deepEqual(source,original);
 const result=await PDFDocument.load(output,{updateMetadata:false});
 assert.equal(result.getPageCount(),2);assert.equal(result.getTitle(),"Original PDF");assert.equal(result.getAuthor(),"Original author");
 assert.equal(result.getPage(0).node.get(PDFName.of("Contents"))?.toString(),contentBefore);
 assert.equal(result.getPage(0).node.get(PDFName.of("Resources"))?.toString(),resourcesBefore);
 assert.equal(annotationsFrom(result,1).length,2);assert.equal(annotationsFrom(result,2).length,1);
 const arabic=annotationsFrom(result,1).map(dict=>dict.get(PDFName.of("Contents"))).find(value=>value instanceof PDFHexString) as PDFHexString;
 assert.equal(arabic.decodeText(),"راجع هذه الفقرة العربية");
 assert.ok(output.length>source.length);
});

test("PDF note annotations reject invalid page, text, position, author, note count and source",async()=>{
 const source=await fixture();
 await assert.rejects(annotatePdfNotes(source,[{page:0,text:"invalid page",position:"top-left"}]),/pdf_annotation_page_invalid/);
 await assert.rejects(annotatePdfNotes(source,[{page:1,text:"",position:"top-left"}]),/pdf_annotation_text_invalid/);
 await assert.rejects(annotatePdfNotes(source,[{page:1,text:"note",position:"center" as never}]),/pdf_annotation_position_invalid/);
 await assert.rejects(annotatePdfNotes(source,[{page:1,text:"x".repeat(1001),position:"top-left"}]),/pdf_annotation_text_invalid/);
 await assert.rejects(annotatePdfNotes(source,Array.from({length:MAX_PDF_TEXT_NOTES+1},()=>({page:1,text:"note",position:"top-left" as const}))),/pdf_annotation_plan_invalid/);
 await assert.rejects(annotatePdfNotes(source,[{page:1,text:"note",position:"top-left"}],"\u0000"),/pdf_annotation_author_invalid/);
 await assert.rejects(annotatePdfNotes(new Uint8Array([1,2,3]),[{page:1,text:"note",position:"top-left"}]),/pdf_source_invalid/);
});

test("signature-bearing, form-bearing or active-action PDFs remain excluded from annotation",async()=>{
 for(const kind of ["signature","form","action"] as const){
  const doc=await PDFDocument.load(await fixture());
  if(kind==="signature")doc.context.register(doc.context.obj({FT:"Sig",ByteRange:[0,1,2,3]}));
  if(kind==="form")doc.getForm().createTextField("Example field");
  if(kind==="action")doc.getPage(0).node.set(PDFName.of("A"),doc.context.obj({S:"Launch",F:"file.exe"}) as PDFDict);
  await assert.rejects(annotatePdfNotes(await doc.save(),[{page:1,text:"new note",position:"top-left"}]),/pdf_edit_unsupported/);
 }
});
