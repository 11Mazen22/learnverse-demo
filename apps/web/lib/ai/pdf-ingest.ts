/** Browser-local, page-aware PDF text extraction via Mozilla PDF.js. */
export const MAX_PDF_BYTES=8*1024*1024;
export const MAX_PDF_PAGES=30;
export const MAX_PDF_CONTEXT=18000;
export type PdfPage={page:number;text:string;characters:number};
export type ExtractedPdf={pages:PdfPage[];excerpt:string;totalPages:number;scannedPages:number[];truncated:boolean};
export function isPdfDocument(file:{name:string;type:string}):boolean {
 return /\.pdf$/i.test(file.name)&&(file.type==="application/pdf"||file.type==="");
}
export function pdfExcerpt(pages:readonly PdfPage[],max=MAX_PDF_CONTEXT):string {
 let left=max;
 const parts:string[]=[];
 for(const page of pages){
  const label="صفحة "+page.page+":\n";
  if(left<=label.length)break;
  const body=page.text.slice(0,Math.min(3200,left-label.length));
  if(body.trim()){parts.push(label+body);left-=label.length+body.length;}
 }
 return parts.join("\n\n");
}
export async function extractPdfDocument(file:{
 name:string;type:string;size:number;arrayBuffer():Promise<ArrayBuffer>;
}):Promise<ExtractedPdf>{
 if(!isPdfDocument(file))throw Error("Unsupported PDF format");
 if(file.size<1||file.size>MAX_PDF_BYTES)throw Error("PDF must be smaller than 8 MiB");
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(bytes.length!==file.size)throw Error("PDF file size changed");
 // Dynamic import keeps parser out of the initial Noata bundle.
 const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");
 if(typeof window!=="undefined"){
  pdfjs.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs",import.meta.url).toString();
 }
 const task=pdfjs.getDocument({
  data:bytes,
  isEvalSupported:false,
  disableFontFace:true,
  useSystemFonts:true,
  stopAtErrors:false,
  disableAutoFetch:true,
  disableStream:true,
 });
 const pages:PdfPage[]=[];
 const scannedPages:number[]=[];
 let totalPages=0;
 let truncated=false;
 try{
  const document=await task.promise;
  totalPages=document.numPages;
  if(totalPages<1||totalPages>300)throw Error("PDF page count exceeds safe limits");
  const limit=Math.min(totalPages,MAX_PDF_PAGES);
  for(let number=1;number<=limit;number++){
   const page=await document.getPage(number);
   const text=await page.getTextContent({includeMarkedContent:false});
   const lines:string[]=[];
   let line="",prevY: number|null=null;
   for(const item of text.items){
    if(!("str" in item))continue;
    const value=item.str;
    const y=item.transform?.[5]??0;
    if(prevY!==null && Math.abs(prevY-y)>4){
      if(line.trim())lines.push(line.trim());
      line="";
    }
    line+=(line&&value&&!/^\s/.test(value)?" ":"")+value;
    prevY=y;
    if(lines.join("\n").length>4000)break;
   }
   if(line.trim())lines.push(line.trim());
   const pageText=lines.join("\n").slice(0,4000);
   if(!pageText.trim())scannedPages.push(number);
   pages.push({page:number,text:pageText,characters:pageText.length});
   page.cleanup();
   if(pdfExcerpt(pages).length>=MAX_PDF_CONTEXT){
     truncated=true;break;
   }
  }
  if(totalPages>limit)truncated=true;
 }finally{await task.destroy();}
 const excerpt=pdfExcerpt(pages);
 if(!excerpt.trim()){
  throw Error("لم يمكن استخراج نص من ملف PDF. يبدو أنه ممسوح ضوئيًا؛ OCR غير متاح حاليًا.");
 }
 return {pages,excerpt,totalPages,scannedPages,truncated};
}
