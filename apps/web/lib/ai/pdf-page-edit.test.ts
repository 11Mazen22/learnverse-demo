import test from "node:test";
import assert from "node:assert/strict";
import {PDFDocument,StandardFonts,PDFName,PDFDict} from "pdf-lib";
import {execFileSync} from "node:child_process";
import {mkdtemp,writeFile,readFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {revisePdfPages,pdfPageOrder} from "./pdf-page-edit.ts";
async function fixture(){
 const doc=await PDFDocument.create();doc.setTitle("Original metadata");doc.setAuthor("Fixture author");
 const font=await doc.embedFont(StandardFonts.Helvetica);
 for(let i=1;i<=3;i++){const page=doc.addPage([300+i*10,400+i*10]);page.drawText("Original page "+i,{x:30,y:200,font,size:20});page.drawRectangle({x:30,y:40,width:70+i*10,height:30});}
 return doc.save({useObjectStreams:false});
}
test("PDF reordering/rotation retains original content streams, page resources, sizes and metadata",async()=>{
 const bytes=await fixture(),original=bytes.slice(),before=await PDFDocument.load(bytes,{updateMetadata:false});
 const output=await revisePdfPages(bytes,{order:[3,1,2],rotatePage:2,rotation:90});
 const after=await PDFDocument.load(output,{updateMetadata:false});
 assert.deepEqual(bytes,original);assert.equal(after.getTitle(),before.getTitle());assert.equal(after.getAuthor(),before.getAuthor());
 for(const [position,source] of [3,1,2].entries()){
  const a=before.getPage(source-1),b=after.getPage(position);
  assert.deepEqual(b.getSize(),a.getSize());assert.equal(b.node.get(PDFName.of("Contents"))?.toString(),a.node.get(PDFName.of("Contents"))?.toString());
  assert.equal(b.node.get(PDFName.of("Resources"))?.toString(),a.node.get(PDFName.of("Resources"))?.toString());
  assert.equal(b.getRotation().angle,source===2?90:0);
 }
});
test("untouched PDF pages retain identical Poppler raster pixels after a real rewrite",async()=>{
 const directory=await mkdtemp(join(tmpdir(),"noata-pdf-pages-"));
 try{
  const bytes=await fixture(),output=await revisePdfPages(bytes,{order:[3,1,2],rotatePage:2,rotation:90});
  const a=join(directory,"original.pdf"),b=join(directory,"revised.pdf");await writeFile(a,bytes);await writeFile(b,output);
  execFileSync("pdftoppm",["-f","1","-singlefile","-scale-to","600","-png",a,join(directory,"before")]);
  execFileSync("pdftoppm",["-f","2","-singlefile","-scale-to","600","-png",b,join(directory,"after")]);
  assert.deepEqual(await readFile(join(directory,"before.png")),await readFile(join(directory,"after.png")));
 }finally{await rm(directory,{recursive:true,force:true});}
});
test("PDF plans require every page exactly once and reject invalid rotations",async()=>{
 const bytes=await fixture();assert.deepEqual(pdfPageOrder("3، 1, 2",3),[3,1,2]);
 for(const order of [[1,1,2],[1,2],[1,2,4]])await assert.rejects(revisePdfPages(bytes,{order}),/pdf_page_order_invalid/);
 await assert.rejects(revisePdfPages(bytes,{order:[1,2,3],rotatePage:8,rotation:90}),/pdf_rotation_invalid/);
});
test("signed, form-bearing, nested active-action and malformed PDFs fail closed",async()=>{
 for(const kind of ["signature","form","action"]){
  const doc=await PDFDocument.load(await fixture());
  if(kind==="signature")doc.context.register(doc.context.obj({FT:"Sig",ByteRange:[0,1,2,3]}));
  if(kind==="form")doc.getForm().createTextField("Example field");
  if(kind==="action")doc.getPage(0).node.set(PDFName.of("A"),doc.context.obj({S:"Launch",F:"file.exe"}) as PDFDict);
  await assert.rejects(revisePdfPages(await doc.save(),{order:[1,2,3]}),/pdf_edit_unsupported/);
 }
 await assert.rejects(revisePdfPages(new Uint8Array([1,2,3]),{order:[1]}),/pdf_source_invalid/);
});
