"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {Dialog} from "@/components/ui/dialog";
import {Icon} from "@/components/ui/icon";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import {createClient} from "@/lib/supabase/client";
import {inspectOfficeArtifact,type StudioInspection} from "@/lib/ai/studio-file-inspect";
import {originalDocument} from "@/lib/ai/original-documents";
import type {CreatedArtifact} from "@/lib/ai/artifact-runner";
import type {RenderTask,PDFDocumentLoadingTask} from "pdfjs-dist/legacy/build/pdf.mjs";
type Format=CreatedArtifact["format"];
function downloadBytes(bytes:Uint8Array,name:string,mime:string){
 const link=document.createElement("a"),url=URL.createObjectURL(new Blob([Uint8Array.from(bytes)],{type:mime}));
 link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function PdfPage({file,page,onPages}:{file:Blob;page:number;onPages:(n:number)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),t=useTranslation(),[error,setError]=useState("");
 useEffect(()=>{
  let alive=true;let task:PDFDocumentLoadingTask|undefined,render:RenderTask|undefined;
  void(async()=>{
   try{
    const pdf=await import("pdfjs-dist/legacy/build/pdf.mjs");
    if(!alive)return;
    pdf.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs",import.meta.url).toString();
    task=pdf.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});
    const doc=await task.promise;if(!alive)return;
    onPages(doc.numPages);
    const selected=await doc.getPage(Math.max(1,Math.min(page,doc.numPages)));
    if(!alive||!canvas.current)return;
    const view=selected.getViewport({scale:1.25});
    canvas.current.width=view.width;canvas.current.height=view.height;
    render=selected.render({canvas:canvas.current,viewport:view});await render.promise;
   }catch(e){if(alive)setError(e instanceof Error?e.message:"PDF preview unavailable");}
  })();
  return()=>{alive=false;render?.cancel();void task?.destroy();};
 },[file,page,onPages]);
 return <div className="noata-creative-pdf">{error&&<p role="alert">{error}</p>}
  <canvas ref={canvas} role="img" aria-label={t("صفحة PDF","PDF page")+" "+page}/></div>;
}
export function NoataCreativeStudio({file,localSource,owner,onClose,onAskAI}:{
 file:CreatedArtifact|null;
 localSource?:{name:string;localId:string;format:"pdf"|"docx"|"text"}|null;
 owner:string|null;onClose:()=>void;onAskAI?:(prompt:string)=>void;
}){
 const t=useTranslation(),locale=useLocale(),supabase=useMemo(()=>createClient(),[]);
 const [loaded,setLoaded]=useState<Blob|null>(null),[inspection,setInspection]=useState<StudioInspection|null>(null);
 const [draft,setDraft]=useState(""),[mode,setMode]=useState<"preview"|"edit">("preview");
 const [page,setPage]=useState(1),[pageCount,setPageCount]=useState(1),[instruction,setInstruction]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[status,setStatus]=useState("");
 const onPages=useCallback((n:number)=>setPageCount(old=>old===n?old:n),[]);
 const activeFormat=file?.format??(localSource?.format==="text"?"docx":localSource?.format);
 const activeName=file?.filename??localSource?.name??"Noata document";
 useEffect(()=>{
  let live=true;setLoaded(null);setInspection(null);setDraft("");setError("");setStatus("");setPage(1);setPageCount(1);setMode("preview");
  if(!file&&!localSource)return;
  void(async()=>{
   try{
    let loadedFile:Blob;
    if(file){
     if(!owner)throw Error("Sign in to open your saved document");
     const row=await supabase.from("ai_artifacts").select("id,user_id,storage_path,mime_type,filename").eq("id",file.id).eq("user_id",owner).single();
     if(row.error||!row.data||row.data.storage_path!==file.storagePath||row.data.filename!==file.filename)throw Error("This file is not available for your account");
     const download=await supabase.storage.from("noata-ai-artifacts").download(file.storagePath);
     if(download.error||!download.data)throw Error("Could not retrieve the saved file");
     loadedFile=download.data;
    }else{
     const original=originalDocument(localSource?.localId);
     if(!original)throw Error("This upload is no longer available. Attach it again");
     loadedFile=original;
    }
    if(loadedFile.size>12*1024*1024)throw Error("File exceeds studio preview limit");
    if(!live)return;setLoaded(loadedFile);
    let view:StudioInspection;
    if(activeFormat==="pdf"){
     const {extractPdfDocument}=await import("@/lib/ai/pdf-ingest");
     const parsed=await extractPdfDocument(new File([loadedFile],activeName,{type:"application/pdf"}));
     view={pages:parsed.pages.map(p=>({title:"Page "+p.page,lines:p.text.split("\n").filter(Boolean)})),
       editableText:parsed.pages.map(p=>"# Page "+p.page+"\n"+p.text).join("\n\n"),
       partial:parsed.truncated||parsed.scannedPages.length>0};
    }else if(localSource?.format==="text"){
      const text=await loadedFile.text();
      view={pages:[{title:activeName,lines:text.slice(0,150000).split("\n")}],editableText:text.slice(0,150000),partial:text.length>150000};
    }else view=await inspectOfficeArtifact(new Uint8Array(await loadedFile.arrayBuffer()),activeFormat==="docx"?"docx":activeFormat==="pptx"?"pptx":"xlsx");
    if(live){setInspection(view);setDraft(view.editableText);}
   }catch(e){if(live)setError(e instanceof Error?e.message:"File preview unavailable");}
  })();
  return()=>{live=false;};
 },[file?.id,localSource?.localId,owner,supabase]);
 const mime:Record<Format,string>={pdf:"application/pdf",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation"};
 async function buildRevision(kind:Format):Promise<Uint8Array>{
  let bytes:Uint8Array;
  if(kind==="pdf"){
   const response=await fetch("/api/documents/pdf",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json","Accept-Language":locale},body:JSON.stringify({text:draft,title:file?.filename??"Noata Creative Studio"})});
   if(!response.ok)throw Error("PDF generation unavailable ("+response.status+")");
   bytes=new Uint8Array(await response.arrayBuffer());
  }else if(kind==="docx")bytes=(await import("@/lib/ai/docx-export")).createNoataDocx(draft);
  else if(kind==="xlsx")bytes=(await import("@/lib/ai/xlsx-export")).createNoataXlsx(draft);
  else bytes=(await import("@/lib/ai/pptx-export")).createNoataPptx(draft);
  if(bytes.byteLength<150||bytes.byteLength>12*1024*1024)throw Error("Invalid or oversized generated document");
  const {validArtifactBytes}=await import("@/lib/ai/artifact-intent");
  if(!validArtifactBytes(kind,bytes))throw Error("Generated document failed format validation");
  return bytes;
 }
 async function downloadOriginal(){
  if(!loaded||busy)return;
  setBusy(true);setError("");
  try{
   // The source download is byte-for-byte the original File/Blob.
   // Generating a revision must never silently replace or mutate this file.
   const bytes=new Uint8Array(await loaded.arrayBuffer());
   if(!bytes.byteLength||bytes.byteLength>12*1024*1024)throw Error("Original file is unavailable");
   const originalMime=loaded.type||"application/octet-stream";
   downloadBytes(bytes,activeName,originalMime);
  }catch(e){setError(e instanceof Error?e.message:t("تعذّر تنزيل الأصل","Could not download the original file"));}
  finally{setBusy(false);}
 }
 async function exportVersion(kind:Format){
  if(!draft.trim()||busy)return;
  setBusy(true);setError("");setStatus("");
  try{
   const bytes=await buildRevision(kind);
   downloadBytes(bytes,"noata-revision-"+Date.now()+"."+kind,mime[kind]);
   setStatus(t("تم تجهيز نسخة جديدة قابلة للتنزيل. الملف الأصلي لم يتغير.","A downloadable revision was created. The original saved file is unchanged."));
  }catch(e){setError(e instanceof Error?e.message:t("تعذّر تصدير التعديل","Could not export revision"));}
  finally{setBusy(false);}
 }
 async function saveRevision(){
  if(!owner||!activeFormat||busy||!draft.trim())return;
  setBusy(true);setStatus("");setError("");
  let path="",uploaded=false;
  try{
   const who=await supabase.auth.getUser();
   if(who.error||who.data.user?.id!==owner)throw Error("Please sign in as the file owner");
   const bytes=await buildRevision(activeFormat),id=crypto.randomUUID();
   const filename="noata-"+id.slice(0,8)+"."+activeFormat;
   path=owner+"/"+id+"/"+filename;
   const upload=await supabase.storage.from("noata-ai-artifacts")
     .upload(path,new Blob([Uint8Array.from(bytes)],{type:mime[activeFormat]}),{contentType:mime[activeFormat],upsert:false});
   if(upload.error)throw upload.error;uploaded=true;
   const row=await supabase.from("ai_artifacts").insert({
    id,user_id:owner,filename,mime_type:mime[activeFormat],
    storage_path:path,byte_size:bytes.byteLength
   }).select("id").single();
   if(row.error||row.data?.id!==id)throw row.error??Error("File metadata could not be saved");
   setStatus(t("تم حفظ نسخة جديدة في مكتبتك الخاصة. الملف الأصلي لم يتغير.","A new revision was saved in your private library. The original remains unchanged."));
  }catch(e){
   if(uploaded)await supabase.storage.from("noata-ai-artifacts").remove([path]).catch(()=>{});
   setError(e instanceof Error?e.message:t("تعذّر حفظ النسخة","Could not save the revision"));
  }finally{setBusy(false);}
 }
 function askAI(){
  if(!onAskAI||!instruction.trim()||!draft.trim())return;
  const prefix=locale==="ar"?"حسّن هذا المستند بناءً على التعليمات التالية. أنشئ ملف ":"Improve and recreate this document as a ";
  const next=prefix+(activeFormat?.toUpperCase()??"PDF")+
   (locale==="ar"?" قابل للتنزيل. المطلوب: ":" file with real downloadable output. Required improvements: ")+instruction.trim()+
   "\n\n"+(locale==="ar"?"المحتوى الأصلي للملف:":"Verified extracted original document content:")+"\n"+draft.slice(0,14000);
  onClose();onAskAI(next);
 }
 const pageInfo=inspection?.pages[page-1];const isPdf=activeFormat==="pdf";
 return <Dialog open={Boolean(file||localSource)} onClose={onClose} variant="studio" title={t("Noata Creative Studio · معاينة وتحرير","Noata Creative Studio · Preview & edit")}>
  <div className="noata-creative-studio" dir={locale==="ar"?"rtl":"ltr"}>
   <header className="noata-creative-header"><span className="noata-creative-symbol"><Icon name="file" size={21}/></span>
    <div><strong dir="auto">{activeName}</strong><p>{t("مساحة واحدة للمعاينة، التعديل، تحسين الذكاء الاصطناعي والتصدير.","One workspace for real previews, editable drafts, AI improvements and exports.")}</p></div></header>
   {error&&<p role="alert" className="noata-creative-error">{error}</p>}
   {!loaded&&!error&&<p role="status">{t("بنفتح الملف الأصلي من مكتبتك الخاصة…","Opening the original from your private library…")}</p>}
   {loaded&&<div className="noata-creative-tabs" role="group" aria-label={t("وضع الاستوديو","Studio mode")}>
    <button type="button" aria-pressed={mode==="preview"} onClick={()=>setMode("preview")}>{t("معاينة حقيقية","Real preview")}</button>
    <button type="button" aria-pressed={mode==="edit"} onClick={()=>setMode("edit")}>{t("تعديل نسخة","Edit a revision")}</button>
   </div>}
   {loaded&&inspection&&mode==="preview"&&<section className="noata-creative-preview" aria-label={t("محتويات الملف الأصلي","Original file contents")}>
    <div className="noata-creative-pages"><button type="button" disabled={page<=1} onClick={()=>setPage(x=>x-1)}>{t("السابق","Previous")}</button>
     <span>{page} / {isPdf?pageCount:inspection.pages.length}</span>
     <button type="button" disabled={page>=(isPdf?pageCount:inspection.pages.length)} onClick={()=>setPage(x=>x+1)}>{t("التالي","Next")}</button></div>
    {isPdf?<PdfPage file={loaded} page={page} onPages={onPages}/>:
     <article className="noata-creative-page" dir="auto"><h2>{pageInfo?.title}</h2>
      {pageInfo?.table?<div className="noata-creative-table"><table><tbody>{pageInfo.table.map((row,i)=><tr key={i}>{row.map((cell,j)=>i===0?<th key={j} scope="col">{cell}</th>:<td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>:
       pageInfo?.lines.map((line,i)=><p key={i}>{line}</p>)}
     </article>}
    {inspection.partial&&<p role="status">{t("المعاينة جزئية: قد توجد صفحات أو صور أو تنسيقات لا يمكن تحريرها من النص المستخرج.","Partial preview: some pages, pictures or formatting cannot be reconstructed from extracted text.")}</p>}
   </section>}
   {loaded&&inspection&&mode==="edit"&&<div className="noata-creative-editor">
    <p>{t("التعديل ينشئ نسخة جديدة من المحتوى المستخرج، ولا يغيّر تنسيق الملف الأصلي مباشرةً.","Editing creates a new version from extracted content; it does not modify the original file's layout in place.")}</p>
    <textarea aria-label={t("محتوى النسخة القابلة للتعديل","Editable revision content")} dir="auto" value={draft} onChange={e=>setDraft(e.target.value)}/>
   </div>}
   {loaded&&inspection&&<div className="noata-creative-actions">
    <label className="noata-creative-instruction">{t("اطلب تحسينًا من Noata AI","Ask Noata AI to improve this file")}
     <textarea rows={2} dir="auto" placeholder={t("مثلاً: حسّن التنسيق، أضف أمثلة، وصحح الأخطاء","For example: Improve the structure, add examples, and fix errors")} value={instruction} onChange={e=>setInstruction(e.target.value)} maxLength={1200}/>
    </label>
    <div className="noata-creative-buttons">
     <button type="button" className="noata-download-original" disabled={busy||!loaded} onClick={()=>void downloadOriginal()}>
      <Icon name="download" size={15}/>{t("تنزيل الملف الأصلي","Download original")}
     </button>
     <button type="button" disabled={!onAskAI||!instruction.trim()||!draft.trim()} onClick={askAI}><Icon name="sparkles" size={15}/>{t("تحسين بالذكاء الاصطناعي","Improve with AI")}</button>
     <button type="button" disabled={busy||!draft.trim()} onClick={()=>void exportVersion(activeFormat!)}><Icon name="download" size={15}/>{busy?t("جارٍ التصدير…","Exporting…"):t("تنزيل النسخة المعدّلة","Export revised file")}</button>
     <button type="button" disabled={busy||!owner||!draft.trim()} onClick={()=>void saveRevision()}><Icon name="archive" size={15}/>{busy?t("جارٍ التنفيذ…","Working…"):t("حفظ نسخة جديدة في المكتبة","Save revision to library")}</button>
    </div>
   </div>}
   {status&&<p role="status">{status}</p>}
  </div>
 </Dialog>;
}
