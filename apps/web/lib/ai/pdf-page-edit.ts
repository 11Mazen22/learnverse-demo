/** Page order/rotation on the original PDF objects; never raster reconstruction.
 * A full permutation is required: this is not redaction, splitting or deletion.
 */
import {PDFDocument,PDFDict,PDFArray,PDFStream,PDFName,degrees} from "pdf-lib";
export type PdfPagePlan={order:number[];rotatePage?:number;rotation?:0|90|180|270};
export function pdfPageOrder(text:string,count:number):number[]{
 if(text.length>1200||!Number.isInteger(count)||count<1||count>200)throw Error("pdf_page_order_invalid");
 const parts=text.trim().split(/[,،\s]+/).filter(Boolean);
 const order=parts.map(x=>/^\d+$/.test(x)?Number(x):NaN);
 if(order.length!==count||new Set(order).size!==count||order.some(n=>!Number.isInteger(n)||n<1||n>count))throw Error("pdf_page_order_invalid");
 return order;
}
async function load(bytes:Uint8Array){
 if(bytes.length<20||bytes.length>12*1024*1024||new TextDecoder().decode(bytes.subarray(0,5))!=="%PDF-")throw Error("pdf_source_invalid");
 const doc=await PDFDocument.load(Uint8Array.from(bytes),{updateMetadata:false,throwOnInvalidObject:true});
 if(doc.isEncrypted||doc.getPageCount()>200||doc.context.enumerateIndirectObjects().length>30000)throw Error("pdf_edit_unsupported");
 // Changing signed or interactive/action-bearing files can invalidate trust or
 // preserve unexpected active content. Exclude them instead of quietly rewriting.
 const pending=doc.context.enumerateIndirectObjects().map(([,o])=>o),seen=new Set<unknown>();
 while(pending.length){
  const object=pending.pop()!;if(seen.has(object))continue;seen.add(object);if(seen.size>100000)throw Error("pdf_edit_unsupported");
  if(object instanceof PDFStream)pending.push(object.dict);
  if(object instanceof PDFArray)pending.push(...object.asArray());
  if(object instanceof PDFDict){
   if(["ByteRange","AcroForm","JavaScript","JS","OpenAction","AA","XFA","EmbeddedFiles"].some(key=>object.has(PDFName.of(key)))||object.get(PDFName.of("FT"))===PDFName.of("Sig")||["JavaScript","Launch","GoToR","SubmitForm","ImportData"].some(name=>object.get(PDFName.of("S"))===PDFName.of(name)))throw Error("pdf_edit_unsupported");
   pending.push(...object.values());
  }
 }
 return doc;
}
export async function revisePdfPages(bytes:Uint8Array,plan:PdfPagePlan):Promise<Uint8Array>{
 if(!Array.isArray(plan.order))throw Error("pdf_page_order_invalid");
 const doc=await load(bytes),count=doc.getPageCount(),pages=doc.getPages();
 const order=pdfPageOrder(plan.order.join(","),count);
 const rotation=plan.rotation??0;
 if(![0,90,180,270].includes(rotation)||rotation&&(!Number.isInteger(plan.rotatePage)||Number(plan.rotatePage)<1||Number(plan.rotatePage)>count))throw Error("pdf_rotation_invalid");
 if(rotation){const page=pages[plan.rotatePage!-1];page.setRotation(degrees((page.getRotation().angle+rotation)%360));}
 // Mutate only the page tree and the explicitly selected page's Rotate entry.
 // Existing page resource/content objects, fonts, sizes and metadata remain.
 for(let i=count-1;i>=0;i--)doc.removePage(i);
 for(const n of order)doc.addPage(pages[n-1]);
 const output=await doc.save({useObjectStreams:false,updateFieldAppearances:false,addDefaultPage:false});
 if(output.length>12*1024*1024)throw Error("pdf_output_limit");
 const verified=await PDFDocument.load(output,{updateMetadata:false});
 if(verified.getPageCount()!==count)throw Error("pdf_page_verification_failed");
 return output;
}
