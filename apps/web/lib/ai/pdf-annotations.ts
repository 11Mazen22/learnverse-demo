import {PDFArray,PDFBool,PDFDict,PDFDocument,PDFHexString,PDFName,PDFRef,PDFString} from "pdf-lib";
import type {PDFPage} from "pdf-lib";
import {loadSafePdfForRevision} from "./pdf-page-edit.ts";

export type PdfNotePosition="top-left"|"top-right"|"bottom-left"|"bottom-right";
export type PdfTextNote={page:number;text:string;position:PdfNotePosition};
export const MAX_PDF_TEXT_NOTES=20;
export const MAX_PDF_NOTE_LENGTH=1000;
const positions=new Set<PdfNotePosition>(["top-left","top-right","bottom-left","bottom-right"]);
const annotsKey=PDFName.of("Annots");
type SafePdf=Awaited<ReturnType<typeof loadSafePdfForRevision>>;

function annotationArray(doc:SafePdf,page:PDFPage):PDFArray|undefined{
 const ref=page.node.get(annotsKey);
 if(!ref)return undefined;
 if(ref instanceof PDFArray)return ref;
 if(!(ref instanceof PDFRef))throw Error("pdf_annotation_unsupported");
 return doc.context.lookup(ref,PDFArray);
}
function pdfDate(date:Date):string{
 const pad=(value:number)=>String(value).padStart(2,"0");
 return "D:"+date.getUTCFullYear()+pad(date.getUTCMonth()+1)+pad(date.getUTCDate())+
  pad(date.getUTCHours())+pad(date.getUTCMinutes())+pad(date.getUTCSeconds())+"Z";
}
function validateNotes(notes:readonly PdfTextNote[],pageCount:number,author:string,createdAt:Date){
 if(!Array.isArray(notes)||notes.length<1||notes.length>MAX_PDF_TEXT_NOTES)throw Error("pdf_annotation_plan_invalid");
 if(typeof author!=="string"||!author.trim()||author.length>80||/[\u0000-\u001f\u007f]/.test(author))throw Error("pdf_annotation_author_invalid");
 if(!(createdAt instanceof Date)||!Number.isFinite(createdAt.getTime()))throw Error("pdf_annotation_date_invalid");
 for(const note of notes){
  if(!note||!Number.isInteger(note.page)||note.page<1||note.page>pageCount)throw Error("pdf_annotation_page_invalid");
  if(typeof note.text!=="string"||!note.text.trim()||note.text.length>MAX_PDF_NOTE_LENGTH||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(note.text))throw Error("pdf_annotation_text_invalid");
  if(!positions.has(note.position))throw Error("pdf_annotation_position_invalid");
 }
}
function textNoteCount(doc:SafePdf,annotations:PDFArray|undefined):number{
 if(!annotations)return 0;
 let count=0;
 for(const item of annotations.asArray()){
  const dictionary=item instanceof PDFDict?item:item instanceof PDFRef?doc.context.lookup(item,PDFDict):undefined;
  if(dictionary?.get(PDFName.of("Subtype"))?.toString()==="/Text")count++;
 }
 return count;
}
function noteRect(width:number,height:number,position:PdfNotePosition,stack:number):number[]{
 const size=22,margin=28,offset=margin+stack*(size+8);
 if(width<size+2*margin||height<size+2*margin||offset+size+margin>height)throw Error("pdf_annotation_location_invalid");
 const x=position.endsWith("left")?margin:width-margin-size;
 const y=position.startsWith("top")?height-margin-size-stack*(size+8):margin+stack*(size+8);
 if(![x,y].every(Number.isFinite)||x<0||y<0||x+size>width||y+size>height)throw Error("pdf_annotation_location_invalid");
 return [x,y,x+size,y+size];
}

/** Add real PDF /Text annotations; never replace page text, rebuild pages or redact content. */
export async function annotatePdfNotes(bytes:Uint8Array,notes:readonly PdfTextNote[],author="Noata AI",createdAt=new Date()):Promise<Uint8Array>{
 const doc=await loadSafePdfForRevision(bytes);
 const pages=doc.getPages();
 validateNotes(notes,pages.length,author,createdAt);
 const nextStack=new Map<number,number>(),ids:string[]=[];
 notes.forEach((note,index)=>{
  const page=pages[note.page-1],annotations=annotationArray(doc,page);
  const stack=nextStack.get(note.page)??textNoteCount(doc,annotations);
  const size=page.getSize(),id="noata-note-"+createdAt.getTime()+"-"+index+"-"+Math.random().toString(36).slice(2,8);
  const annotation=doc.context.obj({
   Type:"Annot",Subtype:"Text",Rect:noteRect(size.width,size.height,note.position,stack),
   Contents:PDFHexString.fromText(note.text.trim()),T:PDFHexString.fromText(author.trim()),
   Name:"Comment",NM:PDFHexString.fromText(id),C:[1,0.82,0.12],Open:PDFBool.False,F:4,
   M:PDFString.of(pdfDate(createdAt)),
  });
  const reference=doc.context.register(annotation);
  if(annotations)annotations.push(reference);
  else{
   const created=doc.context.obj([]) as PDFArray;
   created.push(reference);
   page.node.set(annotsKey,doc.context.register(created));
  }
  nextStack.set(note.page,stack+1);ids.push(id);
 });
 const output=await doc.save({useObjectStreams:false,updateFieldAppearances:false,addDefaultPage:false});
 if(output.length>12*1024*1024)throw Error("pdf_output_limit");
 const verified=await PDFDocument.load(output,{updateMetadata:false});
 if(verified.getPageCount()!==pages.length)throw Error("pdf_annotation_verification_failed");
 for(let index=0;index<notes.length;index++){
  const list=annotationArray(verified,verified.getPage(notes[index].page-1));
  const found=list?.asArray().some(item=>{
   const dict=item instanceof PDFDict?item:item instanceof PDFRef?verified.context.lookup(item,PDFDict):undefined;
   const subtype=dict?.get(PDFName.of("Subtype")),marker=dict?.get(PDFName.of("NM"));
   return subtype?.toString()==="/Text"&&marker instanceof PDFHexString&&marker.decodeText()===ids[index];
  });
  if(!found)throw Error("pdf_annotation_verification_failed");
 }
 return output;
}
