"use client";
import {useEffect,useRef,useState} from "react";
import {originalDocument} from "@/lib/ai/original-documents";
import {extractDocxDocument} from "@/lib/ai/docx-ingest";
import {safeStorageLink} from "@/lib/ai/workspace";
import {SUPABASE_URL} from "@/lib/supabase/config";
import type {RenderTask,PDFDocumentLoadingTask} from "pdfjs-dist/legacy/build/pdf.mjs";
import {Icon} from "@/components/ui/icon";

export function OriginalDocumentPreview({source}:{source:{name:string;format:string;localId?:string;documentId?:string}}){
 const [file,setFile]=useState<File|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 const [page,setPage]=useState(1),[pages,setPages]=useState(0),[text,setText]=useState(""),[url,setUrl]=useState("");
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  let alive=true;const controller=new AbortController();setLoading(true);setError("");
  void(async()=>{
   try{
    let original=originalDocument(source.localId);
    if(!original && source.documentId){
     const r=await fetch("/api/documents?id="+encodeURIComponent(source.documentId),{signal:controller.signal});const data=await r.json();
     if(!r.ok)throw Error(data.error || "تعذّر فتح المستند.");
     const signed=safeStorageLink(data.url,SUPABASE_URL,"noata-documents");if(!signed)throw Error("رابط المستند غير صالح.");
     const response=await fetch(signed,{signal:controller.signal});if(!response.ok)throw Error("انتهت صلاحية الرابط. أعد فتح المعاينة.");
     const blob=await response.blob();if(blob.size>8*1024*1024)throw Error("الملف كبير جدًا للمعاينة.");
     original=new File([blob],data.name,{type:data.mime});
    }
    if(!original)throw Error("النسخة الأصلية متاحة خلال جلسة الرفع فقط. أعد إرفاق الملف لعرضه كاملًا.");
    if(alive)setFile(original);
   }catch(error){if(alive)setError(error instanceof Error?error.message:"تعذّر فتح الملف.");}
   finally{if(alive)setLoading(false);}
  })();return()=>{alive=false;controller.abort();};
 },[source.localId,source.documentId]);
 useEffect(()=>{if(!file)return;const blob=URL.createObjectURL(file);setUrl(blob);return()=>URL.revokeObjectURL(blob);},[file]);
 useEffect(()=>{
  if(!file)return;let alive=true;let task:PDFDocumentLoadingTask|undefined;let render:RenderTask|undefined;
  void(async()=>{
   try{
    if(source.format==="pdf"){
     const pdf=await import("pdfjs-dist/legacy/build/pdf.mjs");if(!alive)return;
     pdf.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs",import.meta.url).toString();
     task=pdf.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});
     const doc=await task.promise;if(!alive)return;
     if(doc.numPages>300)throw Error("المعاينة تدعم حتى ٣٠٠ صفحة.");setPages(doc.numPages);
     const selected=await doc.getPage(Math.min(page,doc.numPages));if(!alive || !canvas.current)return;
     const viewport=selected.getViewport({scale:1.4});canvas.current.width=viewport.width;canvas.current.height=viewport.height;
     const job=selected.render({canvas:canvas.current,viewport});render=job;await job.promise;
    }else if(source.format==="docx"){
     const parsed=await extractDocxDocument(file,200_000);if(alive)setText(parsed.excerpt+(parsed.truncated?"\n\n[المستند طويل؛ نزّل الأصل لرؤية المحتوى المتبقي]":""));
    }else{const body=await file.text();if(alive)setText(body);}
   }catch(error){if(alive)setError(error instanceof Error?error.message:"تعذّر عرض المحتوى.");}
  })();return()=>{alive=false;render?.cancel();void task?.destroy();};
 },[file,page,source.format]);
 return <div className="aura-original-preview">
  {loading&&<p role="status">بنفتح النسخة الأصلية…</p>}{error&&<p role="status">{error}</p>}
  {file&&<>
   <div className="aura-document-toolbar"><strong>{source.format==="docx"?"نص ملف Word الأصلي":"الملف الأصلي"}</strong><a href={url} download={file.name}><Icon name="download" size={16}/> تنزيل الأصل</a></div>
   {source.format==="pdf"?<><div className="aura-pdf-pagination"><button type="button" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>السابق</button><span>صفحة {page} من {pages || "…"}</span><button type="button" disabled={!pages||page>=pages} onClick={()=>setPage(p=>p+1)}>التالي</button></div><canvas ref={canvas} aria-label={"صفحة PDF "+page} role="img"/></>:<pre dir="auto">{text}</pre>}
  </>}
 </div>;
}
