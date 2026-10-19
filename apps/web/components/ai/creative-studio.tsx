"use client";
import {documentSections,scopedRevision} from "@/lib/ai/scoped-revision";
import type {LibrarySource} from "@/lib/ai/library-source";
import {safeStorageLink} from "@/lib/ai/workspace";
import {SUPABASE_URL,supabaseFetch} from "@/lib/supabase/config";
import {revisionMayLoseContent} from "@/lib/ai/revision-quality";
import {canCreateExtractedRevision,requiresPartialExtractionAcknowledgement,revisionRequiresExtractedDraft} from "@/lib/ai/document-revision-safety";
import {artifactRevisionPrompt} from "@/lib/ai/artifact-revision-prompt";
import {artifactFilename} from "@/lib/ai/artifact-filename";
import {isPdfPageOrderValid} from "@/lib/ai/pdf-page-order";
import type {PdfTextNote,PdfNotePosition} from "@/lib/ai/pdf-annotations";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {Dialog} from "@/components/ui/dialog";
import {Icon} from "@/components/ui/icon";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import {createClient} from "@/lib/supabase/client";
import {inspectOfficeArtifact,type StudioInspection} from "@/lib/ai/studio-file-inspect";
import {originalDocument} from "@/lib/ai/original-documents";
import type {CreatedArtifact} from "@/lib/ai/artifact-runner";
import type {RenderTask,PDFDocumentLoadingTask} from "pdfjs-dist/legacy/build/pdf.mjs";
import type {DocumentStyle} from "@/lib/ai/document-style";
import {readDocumentSource,storedDocumentSource} from "@/lib/ai/document-presentation";
import {OfficeTextEditor} from "./office-text-editor";
type Format=CreatedArtifact["format"];
export function downloadBytes(bytes:Uint8Array,name:string,mime:string){
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
export function NoataCreativeStudio({file,localSource,owner,onClose,onAskAI,onPrepareEdit,onRevisionSaved,inline=false,initialMode="preview"}:{
 file:CreatedArtifact|null;
 localSource?:{name:string;localId?:string;documentId?:string;format:"pdf"|"docx"|"xlsx"|"pptx"|"text"}|null;
 owner:string|null;onClose:()=>void;onAskAI?:(prompt:string,source?:LibrarySource)=>void;
 onRevisionSaved?:()=>void;
 inline?:boolean;onPrepareEdit?:(prompt:string,source?:LibrarySource)=>void;initialMode?:"preview"|"edit"|"pages"|"annotate";
}){
 const t=useTranslation(),locale=useLocale(),supabase=useMemo(()=>createClient(),[]);
 const [loaded,setLoaded]=useState<Blob|null>(null),[inspection,setInspection]=useState<StudioInspection|null>(null);
 const [draft,setDraft]=useState(""),[mode,setMode]=useState<"preview"|"edit"|"compare"|"targeted"|"pages"|"annotate">("preview");
 const [partialRevisionAcknowledged,setPartialRevisionAcknowledged]=useState(false);
 const [pageOrder,setPageOrder]=useState(""),[rotatePage,setRotatePage]=useState(1),[rotation,setRotation]=useState(0);
 const [pdfNotes,setPdfNotes]=useState<PdfTextNote[]>([]),[noteText,setNoteText]=useState(""),[notePage,setNotePage]=useState(1),[notePosition,setNotePosition]=useState<PdfNotePosition>("top-right");
 const [originalText,setOriginalText]=useState("");
 const [sectionStart,setSectionStart]=useState("whole");
 const sections=useMemo(()=>documentSections(draft),[draft]);
 const [font,setFont]=useState<"noata"|"editorial"|"mono">("noata");
 const [style,setStyle]=useState<DocumentStyle>("classic");
 const [outputFormat,setOutputFormat]=useState<Format>("pdf");
 const [page,setPage]=useState(1),[pageCount,setPageCount]=useState(1),[instruction,setInstruction]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[status,setStatus]=useState("");
 const operation=useRef("");operation.current=owner+":"+(file?.id??localSource?.documentId??localSource?.localId??"");
 const onPages=useCallback((n:number)=>setPageCount(old=>old===n?old:n),[]);
 const activeFormat=file?.format??(localSource?.format==="text"?"docx":localSource?.format);
 const activeName=file?.filename??localSource?.name??"Noata document";
 const pageOrderValid=activeFormat==="pdf"&&isPdfPageOrderValid(pageOrder,pageCount);
 useEffect(()=>{
  let live=true;setLoaded(null);setInspection(null);setDraft("");setError("");setStatus("");setBusy(false);setPage(1);setPageCount(1);setPageOrder("");setRotatePage(1);setRotation(0);setPdfNotes([]);setNoteText("");setNotePage(1);setNotePosition("top-right");setMode(initialMode);setPartialRevisionAcknowledged(false);setOriginalText("");setInstruction("");setSectionStart("whole");
  setOutputFormat(activeFormat??"pdf");setStyle("classic");setFont("noata");
  if(!file&&!localSource)return;
  void(async()=>{
   try{
    let loadedFile:Blob;let canonical="",parentSource="";
    if(file){
     if(!owner)throw Error("Sign in to open your saved document");
     const row=await supabase.from("ai_artifacts").select("id,user_id,storage_path,mime_type,filename,source_content,parent_artifact_id").eq("id",file.id).eq("user_id",owner).single();
     if(row.error||!row.data||row.data.storage_path!==file.storagePath||row.data.filename!==file.filename)throw Error("This file is not available for your account");
     const download=await supabase.storage.from("noata-ai-artifacts").download(file.storagePath);
     if(download.error||!download.data)throw Error("Could not retrieve the saved file");
     loadedFile=download.data;const saved=readDocumentSource(row.data.source_content);canonical=saved.text;
     if(live){setStyle(saved.presentation.style);setFont(saved.presentation.font);}
     if(row.data.parent_artifact_id){const parent=await supabase.from("ai_artifacts").select("source_content").eq("id",row.data.parent_artifact_id).eq("user_id",owner).maybeSingle();parentSource=readDocumentSource(parent.data?.source_content).text;}
     if(!canonical){
      const legacy=await supabase.from("ai_messages").select("content,metadata").eq("role","assistant").eq("status","complete").contains("metadata",{generatedArtifact:{id:file.id}}).limit(1).maybeSingle();
      if(legacy.data?.content)canonical=legacy.data.content;
     }
    }else if(localSource?.documentId){
     const response=await fetch("/api/documents?id="+encodeURIComponent(localSource.documentId));
     const data=await response.json();if(!response.ok)throw Error(data.error??"Could not open saved upload");
     const url=safeStorageLink(data.url,SUPABASE_URL,"noata-documents");if(!url)throw Error("Invalid private source link");
     const download=await supabaseFetch(url);if(!download.ok)throw Error("Source download failed");
     loadedFile=new File([await download.blob()],data.name,{type:data.mime});
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
     try{
      const parsed=await extractPdfDocument(new File([loadedFile],activeName,{type:"application/pdf"}));
      if(live){setPageCount(parsed.totalPages);setPageOrder(Array.from({length:parsed.totalPages},(_,i)=>i+1).join(", "));}
      view={pages:parsed.pages.map(p=>({title:"Page "+p.page,lines:p.text.split("\n").filter(Boolean)})),
       editableText:parsed.pages.map(p=>"# Page "+p.page+"\n"+p.text).join("\n\n"),
       partial:parsed.truncated||parsed.scannedPages.length>0};
     }catch(pdfError){
      if(!(pdfError instanceof Error)||!pdfError.message.includes("OCR غير متاح حاليًا"))throw pdfError;
      const {PDFDocument}=await import("pdf-lib");
      const nativePdf=await PDFDocument.load(new Uint8Array(await loadedFile.arrayBuffer()),{updateMetadata:false});
      const totalPages=nativePdf.getPageCount();
      if(totalPages<1||totalPages>300)throw Error("PDF page count exceeds safe limits");
      if(live){setPageCount(totalPages);setPageOrder(Array.from({length:totalPages},(_,i)=>i+1).join(", "));}
      view={pages:Array.from({length:totalPages},(_,i)=>({title:"Page "+(i+1),lines:[]})),editableText:"",partial:true};
     }
    }else if(localSource?.format==="text"){
      const text=await loadedFile.text();
      view={pages:[{title:activeName,lines:text.slice(0,150000).split("\n")}],editableText:text.slice(0,150000),partial:text.length>150000};
    }else view=await inspectOfficeArtifact(new Uint8Array(await loadedFile.arrayBuffer()),activeFormat==="docx"?"docx":activeFormat==="pptx"?"pptx":"xlsx");
    if(live){setInspection(view);setOriginalText(parentSource||canonical||view.editableText);setDraft(canonical||view.editableText);}
   }catch(e){if(live)setError(e instanceof Error?e.message:"File preview unavailable");}
  })();
  return()=>{live=false;};
 },[file?.id,localSource?.localId,localSource?.documentId,owner,supabase,locale,initialMode]);
 const mime:Record<Format,string>={pdf:"application/pdf",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation"};
 async function buildRevision(kind:Format):Promise<Uint8Array>{
  let bytes:Uint8Array;
  if(kind==="pdf"&&mode==="annotate"&&loaded){
   if(!pdfNotes.length)throw Error("pdf_annotation_plan_invalid");
   const {annotatePdfNotes}=await import("@/lib/ai/pdf-annotations");
   bytes=await annotatePdfNotes(new Uint8Array(await loaded.arrayBuffer()),pdfNotes);
  }else if(kind==="pdf"&&mode==="pages"&&loaded){
   const {pdfPageOrder,revisePdfPages}=await import("@/lib/ai/pdf-page-edit");
   if(!pageOrderValid)throw Error("pdf_page_order_invalid");
   bytes=await revisePdfPages(new Uint8Array(await loaded.arrayBuffer()),{order:pdfPageOrder(pageOrder,pageCount),rotatePage,rotation:rotation as 0|90|180|270});
  }else if(kind==="pdf"){
   const response=await fetch("/api/documents/pdf",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json","Accept-Language":locale},body:JSON.stringify({text:draft,title:activeName.replace(/\.(pdf|docx|xlsx|pptx)$/i,"").slice(0,120),style,font})});
   if(!response.ok)throw Error("PDF generation unavailable ("+response.status+")");
   bytes=new Uint8Array(await response.arrayBuffer());
  }else if(kind==="docx")bytes=(await import("@/lib/ai/docx-export")).createNoataDocx(draft,style);
  else if(kind==="xlsx")bytes=(await import("@/lib/ai/xlsx-export")).createNoataXlsx(draft);
  else bytes=(await import("@/lib/ai/pptx-export")).createNoataPptx(draft,style);
  if(bytes.byteLength<150||bytes.byteLength>12*1024*1024)throw Error("Invalid or oversized generated document");
  const {validArtifactBytes}=await import("@/lib/ai/artifact-intent");
  if(!validArtifactBytes(kind,bytes))throw Error("Generated document failed format validation");
  return bytes;
 }
 function queuePdfNote(){
  const text=noteText.trim();
  if(!loaded||activeFormat!=="pdf"){setError(t("افتح ملف PDF أولًا.","Open a PDF first."));return;}
  if(pdfNotes.length>=20){setError(t("يمكنك إضافة 20 ملاحظة كحد أقصى في كل نسخة.","A revision can contain at most 20 notes."));return;}
  if(!Number.isInteger(notePage)||notePage<1||notePage>pageCount){setError(t("اختر رقم صفحة صالحًا.","Choose a valid page number."));return;}
  if(!text||text.length>1000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)){setError(t("اكتب ملاحظة صالحة حتى 1000 حرف.","Enter a valid note of up to 1,000 characters."));return;}
  setPdfNotes(items=>[...items,{page:notePage,text,position:notePosition}]);setNoteText("");setError("");setStatus(t("أُضيفت الملاحظة إلى قائمة النسخة الجديدة.","The note was added to the new-revision queue."));
 }
 function removePdfNote(index:number){setPdfNotes(items=>items.filter((_,i)=>i!==index));setError("");setStatus("");}
 async function downloadOriginal(){
  if(!loaded||busy)return;
  const ticket=operation.current;
  setBusy(true);setError("");
  try{
   // The source download is byte-for-byte the original File/Blob.
   // Generating a revision must never silently replace or mutate this file.
   const bytes=new Uint8Array(await loaded.arrayBuffer());
   if(!bytes.byteLength||bytes.byteLength>12*1024*1024)throw Error("Original file is unavailable");
   if(operation.current!==ticket)return;
   const originalMime=loaded.type||"application/octet-stream";
   downloadBytes(bytes,activeName,originalMime);
  }catch(e){if(operation.current===ticket)setError(e instanceof Error?e.message:t("تعذّر تنزيل الأصل","Could not download the original file"));}
  finally{if(operation.current===ticket)setBusy(false);}
 }
 async function exportVersion(kind:Format){
  if((revisionRequiresExtractedDraft(mode)&&!draft.trim())||busy)return;
  if(!canCreateExtractedRevision(Boolean(inspection?.partial),partialRevisionAcknowledged,mode)){setError(t("استخراج النص غير مكتمل. راجع التحذير وأكّد أنك تقبل احتمال فقد المحتوى غير المستخرج قبل التصدير.","Text extraction is incomplete. Review the warning and acknowledge the risk of omitting unextracted content before exporting."));return;}
  const ticket=operation.current;
  setBusy(true);setError("");setStatus("");
  try{
   const bytes=await buildRevision(kind);
   if(operation.current!==ticket)return;
   downloadBytes(bytes,artifactFilename({format:kind,title:activeName,content:draft,locale,revision:true}),mime[kind]);
   setStatus(t("تم تجهيز نسخة جديدة قابلة للتنزيل. الملف الأصلي لم يتغير.","A downloadable revision was created. The original saved file is unchanged."));
  }catch(e){if(operation.current===ticket)setError(e instanceof Error?e.message:t("تعذّر تصدير التعديل","Could not export revision"));}
  finally{if(operation.current===ticket)setBusy(false);}
 }
 async function saveRevision(){
  if(!owner||!outputFormat||busy||(revisionRequiresExtractedDraft(mode)&&!draft.trim()))return;
  if(!canCreateExtractedRevision(Boolean(inspection?.partial),partialRevisionAcknowledged,mode)){setError(t("استخراج النص غير مكتمل. راجع التحذير وأكّد أنك تقبل احتمال فقد المحتوى غير المستخرج قبل الحفظ.","Text extraction is incomplete. Review the warning and acknowledge the risk of omitting unextracted content before saving."));return;}
  const ticket=operation.current;
  setBusy(true);setStatus("");setError("");
  let path="",uploaded=false;
  try{
   const who=await supabase.auth.getUser();
   if(operation.current!==ticket)throw Error("Operation cancelled");
   if(who.error||who.data.user?.id!==owner)throw Error("Please sign in as the file owner");
   const bytes=await buildRevision(outputFormat),id=crypto.randomUUID();
   if(operation.current!==ticket)throw Error("Operation cancelled");
   const filename=artifactFilename({format:outputFormat,title:activeName,content:draft,locale,revision:true});
   path=owner+"/"+id+"/noata-"+id.slice(0,8)+"."+outputFormat;
   const upload=await supabase.storage.from("noata-ai-artifacts")
     .upload(path,new Blob([Uint8Array.from(bytes)],{type:mime[outputFormat]}),{contentType:mime[outputFormat],upsert:false});
   if(upload.error)throw upload.error;uploaded=true;
   if(operation.current!==ticket)throw Error("Operation cancelled");
   let revisionText=draft;
   if(mode==="pages"||mode==="annotate"){
    const {extractPdfDocument}=await import("@/lib/ai/pdf-ingest");
    const {nativePdfRevisionRecord,pdfRevisionExtractionNotice}=await import("@/lib/ai/pdf-revision-source");
    let nativeRecord:string;
    if(mode==="pages"){
     const {pdfPageOrder}=await import("@/lib/ai/pdf-page-edit");
     nativeRecord=nativePdfRevisionRecord({mode:"pages",pageCount,order:pdfPageOrder(pageOrder,pageCount),rotatePage,rotation:rotation as 0|90|180|270});
    }else{
     nativeRecord=nativePdfRevisionRecord({mode:"annotate",pageCount,notes:pdfNotes});
    }
    try{
     const parsed=await extractPdfDocument(new File([Uint8Array.from(bytes)],filename,{type:"application/pdf"}));
     revisionText=parsed.pages.map(p=>"# Page "+p.page+"\n"+p.text).join("\n\n")+"\n\n"+nativeRecord;
     const extractionNotice=pdfRevisionExtractionNotice(parsed);
     if(extractionNotice)revisionText+="\n\n"+extractionNotice;
    }catch(extractionError){
     if(!(extractionError instanceof Error)||!extractionError.message.includes("OCR غير متاح حاليًا"))throw extractionError;
     revisionText=nativeRecord;
    }
    if(mode==="annotate")revisionText+="\n\n# PDF annotations\n"+pdfNotes.map(note=>"- Page "+note.page+" ("+note.position+"): "+note.text).join("\n");
    if(operation.current!==ticket)throw Error("Operation cancelled");
   }
   const row=await supabase.from("ai_artifacts").insert({
    id,user_id:owner,filename,mime_type:mime[outputFormat],
    storage_path:path,byte_size:bytes.byteLength,source_content:storedDocumentSource(revisionText,{style,font}),
    ...(file?{parent_artifact_id:file.id}:localSource?.documentId?{source_document_id:localSource.documentId}:{})
   }).select("id,version").single();
   if(row.error||row.data?.id!==id)throw row.error??Error("File metadata could not be saved");
   if(operation.current===ticket){onRevisionSaved?.();setStatus(t("تم حفظ نسخة جديدة في مكتبتك الخاصة. الملف الأصلي لم يتغير.","A new revision was saved in your private library. The original remains unchanged.")+" · "+t("نسخة ","Version ")+row.data.version);}
  }catch(e){
   if(uploaded)await supabase.storage.from("noata-ai-artifacts").remove([path]).catch(()=>{});
   if(operation.current===ticket)setError(e instanceof Error?e.message:t("تعذّر حفظ النسخة","Could not save the revision"));
  }finally{if(operation.current===ticket)setBusy(false);}
 }
 function prepareAI(){
  if(!draft.trim())return;
  if(!canCreateExtractedRevision(Boolean(inspection?.partial),partialRevisionAcknowledged,mode)){setError(t("استخراج النص غير مكتمل. أكّد أنك تفهم أن النسخة الناتجة قد لا تتضمن الأجزاء غير المستخرجة.","Text extraction is incomplete. Acknowledge that the resulting revision may omit unextracted parts."));return;}
  const selected=sectionStart==="whole"?null:sections.find(s=>s.start===Number(sectionStart));
  if(sectionStart!=="whole"&&!selected){setError(t("تغيّر موضع القسم بعد تعديل النص. اختر القسم من جديد.","The section moved after your text edit. Select the section again."));return;}
  let scope:ReturnType<typeof scopedRevision>|undefined;
  try{if(selected)scope=scopedRevision(draft,selected);}catch{setError(t("هذا القسم يتجاوز حد التعديل. اختر قسمًا أصغر أو حرّره يدويًا.","This section exceeds the revision limit. Choose a smaller section or edit it manually."));return;}
  if(!scope&&draft.length>14000){setError(t("اختر قسمًا للتعديل بالذكاء الاصطناعي، أو حرّر المستند كاملًا هنا. لن نختصر المصدر.","Choose a section for the AI revision, or edit the full document here. The source will not be shortened."));return;}
  const selectedText=scope?.before??draft;
  const base=artifactRevisionPrompt(outputFormat,selectedText,locale);
  const selectionInstruction=scope?(locale==="ar"
   ?"\nأعد نص هذا القسم فقط، مع عنوان Markdown بنفس المستوى ("+scope.level+"). لا تكتب باقي المستند أو ملاحظات التسليم. سيُعاد إدراج التعديل في المستند كاملًا."
   :"\nReturn ONLY this selected section, beginning with a Markdown heading at level "+scope.level+". Do not write the rest of the document or delivery notes. The app will reinsert the revision into the complete document."):"";
  const prompt=(instruction.trim()?instruction.trim()+"\n\n":"")+selectionInstruction+"\n"+base;
  const source:LibrarySource={name:activeName,format:outputFormat,presentation:{style,font},...(scope?{scope}:{}),...(file?{artifactId:file.id}:localSource?.documentId?{documentId:localSource.documentId}:{})};
  if(onPrepareEdit)onPrepareEdit(prompt,source);else if(onAskAI)onAskAI(prompt,source);
 }
 const pageInfo=inspection?.pages[page-1];const isPdf=activeFormat==="pdf";
 const revisionAllowed=canCreateExtractedRevision(Boolean(inspection?.partial),partialRevisionAcknowledged,mode);
 const content=<>
  {inline&&<div className="noata-artifact-inline-heading"><strong>{t("معاينة الملف وتحريره","Preview & edit file")}</strong><button type="button" onClick={onClose} aria-label={t("إغلاق معاينة الملف","Close file preview")}><Icon name="close" size={16}/></button></div>}
  <div className="noata-creative-studio" dir={locale==="ar"?"rtl":"ltr"}>
   <header className="noata-creative-header"><span className="noata-creative-symbol"><Icon name="file" size={21}/></span>
    <div><strong dir="auto">{activeName}</strong><p>{t("مساحة واحدة للمعاينة، التعديل، تحسين الذكاء الاصطناعي والتصدير.","One workspace for real previews, editable drafts, AI improvements and exports.")}</p></div></header>
   {error&&<p role="alert" className="noata-creative-error">{error}</p>}
   {originalText&&revisionMayLoseContent(originalText,draft,instruction)&&<p role="status" className="noata-creative-error">{t("هذه النسخة أقصر بكثير من الأصل. قارن المحتوى قبل الحفظ للتأكد من بقاء التفاصيل.","This revision is substantially shorter than the original. Compare the content before saving to check that details remain.")}</p>}
   {!loaded&&!error&&<p role="status">{t("بنفتح الملف الأصلي من مكتبتك الخاصة…","Opening the original from your private library…")}</p>}
   {loaded&&<div className="noata-creative-tabs" role="group" aria-label={t("عرض الملف","File view")}>
    <button type="button" aria-pressed={mode==="preview"} onClick={()=>setMode("preview")}>{t("معاينة حقيقية","Real preview")}</button>
    <button type="button" aria-pressed={mode==="edit"} onClick={()=>setMode("edit")}>{t("تعديل نسخة","Edit a revision")}</button>
    <button type="button" aria-pressed={mode==="compare"} onClick={()=>setMode("compare")}>{t("مقارنة النسختين","Compare versions")}</button>
    {(activeFormat==="docx"||activeFormat==="pptx"||activeFormat==="xlsx")&&<button type="button" aria-pressed={mode==="targeted"} onClick={()=>setMode("targeted")}>{t("تعديل محدد مع حفظ التنسيق","Targeted edit preserving format")}</button>}
    {activeFormat==="pdf"&&<button type="button" aria-pressed={mode==="pages"} onClick={()=>{setMode("pages");setOutputFormat("pdf");}}>{t("ترتيب الصفحات وتدويرها","Reorder & rotate pages")}</button>}
     {activeFormat==="pdf"&&<button type="button" aria-pressed={mode==="annotate"} onClick={()=>{setMode("annotate");setOutputFormat("pdf");}}>{t("إضافة ملاحظات PDF","Add PDF notes")}</button>}
   </div>}
   {loaded&&mode==="targeted"&&(activeFormat==="docx"||activeFormat==="pptx"||activeFormat==="xlsx")&&<OfficeTextEditor source={loaded} format={activeFormat} name={activeName} owner={owner} parentId={file?.id} documentId={localSource?.documentId} onSaved={onRevisionSaved}/>}
   {loaded&&mode==="pages"&&<section className="noata-creative-editor noata-office-editor" aria-label={t("تعديل صفحات PDF","Edit PDF pages")}>
    <p>{t("غيّر ترتيب الصفحات أو دوّر صفحة مع الحفاظ على محتواها الأصلي. اكتب رقم كل صفحة مرة واحدة. هذه العملية لا تحذف معلومات ولا تخفيها.","Reorder pages or rotate a page while retaining its original content. Enter each page number exactly once. This operation does not delete or redact information.")}</p>
     {inspection?.partial&&<p role="status" className="noata-memory-note">{t("قد يحتوي الملف صفحات ممسوحة ضوئيًا أو يكون استخراج النص جزئيًا. لا يتوفر OCR هنا؛ سيجري ترتيب الصفحات أو تدويرها مباشرةً مع الحفاظ على محتواها الأصلي.","This PDF may contain scanned pages or partial text extraction. OCR is unavailable here; pages will be reordered or rotated directly while preserving their original content.")}</p>}
    <p className="noata-pdf-page-count">{t("عدد صفحات الملف الأصلي:","Original PDF page count:")} <strong>{pageCount}</strong></p>
    <label>{t("ترتيب الصفحات","Page order")}<input dir="ltr" aria-invalid={Boolean(pageOrder.trim())&&!pageOrderValid} aria-describedby="noata-pdf-order-hint" maxLength={1200} value={pageOrder} onChange={e=>setPageOrder(e.target.value)} disabled={busy} placeholder="3, 1, 2"/></label>
    <p id="noata-pdf-order-hint" className={Boolean(pageOrder.trim())&&!pageOrderValid?"noata-creative-error":"noata-memory-note"} role={Boolean(pageOrder.trim())&&!pageOrderValid?"alert":"note"}>{pageCount>200?t("تدعم هذه المساحة ترتيب ملفات PDF حتى 200 صفحة فقط. الملف الأصلي لم يتغير.","This workspace supports PDF page reordering up to 200 pages. The original file remains unchanged."):<>{t("أدخل كل رقم صفحة من 1 إلى ","Enter every page number from 1 to ")}{pageCount}{t(" مرة واحدة، دون تكرار أو صفحات ناقصة."," exactly once, with no duplicates or omitted pages.")}</>}</p>
        <label>{t("رقم الصفحة الأصلية المراد تدويرها","Original page number to rotate")}<input type="number" min={1} max={pageCount} value={rotatePage} onChange={e=>setRotatePage(Number(e.target.value))} disabled={busy}/></label>
    <label>{t("تدوير إضافي","Additional rotation")}<select value={rotation} disabled={busy} onChange={e=>setRotation(Number(e.target.value))}>{[0,90,180,270].map(n=><option key={n} value={n}>{n}°</option>)}</select></label>
    <p>{t("الملفات الموقّعة أو المشفّرة أو ذات النماذج والإجراءات التفاعلية لا تدعم هذه العملية.","Signed, encrypted, form-bearing or active-action PDFs are excluded from this operation.")}</p>
    <div className="noata-creative-buttons"><button type="button" disabled={busy||!pageOrderValid} onClick={()=>void exportVersion("pdf")}>{t("تنزيل PDF المعدّل","Download edited PDF")}</button><button type="button" disabled={busy||!owner||!pageOrderValid} onClick={()=>void saveRevision()}>{t("حفظ نسخة PDF","Save PDF revision")}</button></div>
   </section>}
   {loaded&&inspection&&mode==="annotate"&&activeFormat==="pdf"&&<section className="noata-creative-editor noata-office-editor noata-pdf-annotations" aria-label={t("إضافة ملاحظات إلى PDF","Add annotations to PDF")}>
    <p>{t("أضف تعليقات لاصقة إلى صفحات PDF مع الحفاظ على النص والتخطيط الأصليين. هذه ملاحظات وليست استبدالًا للنص أو إخفاءً للمحتوى، ويمكن فتحها في قارئات PDF المتوافقة.","Add sticky-note comments to PDF pages while preserving the original text and layout. These notes are not text replacement or redaction, and can be opened in compatible PDF readers.")}</p>
     {inspection?.partial&&<p role="status" className="noata-memory-note">{t("قد يحتوي الملف صفحات ممسوحة ضوئيًا أو يكون استخراج النص جزئيًا. لا يتوفر OCR هنا؛ ستُضاف الملاحظات إلى ملف PDF الأصلي دون إعادة بناء صفحاته.","This PDF may contain scanned pages or partial text extraction. OCR is unavailable here; notes will be added to the original PDF without rebuilding its pages.")}</p>}
    <p className="noata-pdf-page-count">{t("عدد الصفحات:","Page count:")} <strong>{pageCount}</strong> · {t("الملاحظات في هذه النسخة:","Notes in this revision:")} <strong>{pdfNotes.length}/20</strong></p>
    <label>{t("صفحة الملاحظة","Note page")}<input type="number" min={1} max={pageCount} value={notePage} disabled={busy} onChange={e=>setNotePage(Number(e.target.value))}/></label>
    <label>{t("موضع أيقونة الملاحظة","Note marker position")}<select value={notePosition} disabled={busy} onChange={e=>setNotePosition(e.target.value as PdfNotePosition)}>
     <option value="top-right">{t("أعلى اليمين","Top right")}</option><option value="top-left">{t("أعلى اليسار","Top left")}</option>
     <option value="bottom-right">{t("أسفل اليمين","Bottom right")}</option><option value="bottom-left">{t("أسفل اليسار","Bottom left")}</option>
    </select></label>
    <label>{t("نص الملاحظة","Note text")}<textarea rows={3} dir="auto" value={noteText} maxLength={1000} disabled={busy} onChange={e=>{setNoteText(e.target.value);setError("");}} placeholder={t("اكتب تعليقًا بالعربية أو الإنجليزية…","Write a note in Arabic or English…")}/></label>
    <div className="noata-creative-buttons"><button type="button" disabled={busy||!noteText.trim()||noteText.length>1000||pdfNotes.length>=20||notePage<1||notePage>pageCount} onClick={queuePdfNote}>{t("إضافة إلى القائمة","Queue note")}</button></div>
    {pdfNotes.length>0&&<div className="noata-pdf-annotation-queue" role="region" aria-label={t("قائمة ملاحظات النسخة","Revision note queue")}>
     <strong>{t("الملاحظات التي ستُضاف","Notes to include")} ({pdfNotes.length}/20)</strong>
     <ol>{pdfNotes.map((note,index)=><li key={index}><div><strong>{t("صفحة ","Page ")}{note.page} · {t(note.position==="top-left"?"أعلى اليسار":note.position==="top-right"?"أعلى اليمين":note.position==="bottom-left"?"أسفل اليسار":"أسفل اليمين",note.position.replace("-"," "))}</strong><p dir="auto">{note.text}</p></div>
      <button type="button" disabled={busy} onClick={()=>removePdfNote(index)}>{t("إزالة","Remove")}</button>
     </li>)}</ol>
    </div>}
    <p className="noata-memory-note">{t("المعاينة أدناه تعرض الصفحة الأصلية؛ ستُضاف علامات التعليقات إلى ملف PDF الناتج. الملف الأصلي لن يتغير.","The preview below shows the original page; note markers are added to the resulting PDF. The original remains unchanged.")}</p>
    <div className="noata-creative-preview noata-pdf-annotation-page"><PdfPage file={loaded} page={Math.max(1,Math.min(notePage,pageCount))} onPages={onPages}/></div>
    <div className="noata-creative-buttons"><button type="button" disabled={busy||pdfNotes.length===0} onClick={()=>void exportVersion("pdf")}>{t("تنزيل PDF بالملاحظات","Download annotated PDF")}</button><button type="button" disabled={busy||!owner||pdfNotes.length===0} onClick={()=>void saveRevision()}>{t("حفظ نسخة خاصة","Save private revision")}</button></div>
   </section>}
   {loaded&&inspection&&mode==="preview"&&<section className="noata-creative-preview" aria-label={t("محتويات الملف الأصلي","Original file contents")}>
    <div className="noata-creative-pages"><button type="button" disabled={page<=1} onClick={()=>setPage(x=>x-1)}>{t("السابق","Previous")}</button>
     <span>{page} / {isPdf?pageCount:inspection.pages.length}</span>
     <button type="button" disabled={page>=(isPdf?pageCount:inspection.pages.length)} onClick={()=>setPage(x=>x+1)}>{t("التالي","Next")}</button></div>
    {isPdf?<PdfPage file={loaded} page={page} onPages={onPages}/>:
     <article className="noata-creative-page" dir="auto"><h2>{pageInfo?.title}</h2>
      {pageInfo?.table?<div className="noata-creative-table"><table><tbody>{pageInfo.table.map((row,i)=><tr key={i}>{row.map((cell,j)=>i===0?<th key={j} scope="col">{cell}</th>:<td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>:
       pageInfo?.lines.map((line,i)=><p key={i}>{line}</p>)}
     </article>}
    {inspection?.partial&&<p role="status">{t("المعاينة جزئية: قد توجد صفحات أو صور أو تنسيقات لا يمكن تحريرها من النص المستخرج.","Partial preview: some pages, pictures or formatting cannot be reconstructed from extracted text.")}</p>}
   </section>}
   {loaded&&inspection&&mode==="edit"&&<div className="noata-creative-editor">
    <p>{t("التعديل ينشئ نسخة جديدة من المحتوى المستخرج، ولا يغيّر تنسيق الملف الأصلي مباشرةً.","Editing creates a new version from extracted content; it does not modify the original file's layout in place.")}</p>
    <textarea aria-label={t("محتوى النسخة القابلة للتعديل","Editable revision content")} dir="auto" value={draft} onChange={e=>setDraft(e.target.value)}/>
   </div>}
   {loaded&&inspection&&mode==="compare"&&<div className="noata-revision-compare"><section><h4>{t("المحتوى الأصلي","Original content")}</h4><pre dir="auto">{originalText}</pre></section><section><h4>{t("التعديل المقترح","Proposed revision")}</h4><pre dir="auto">{draft}</pre></section></div>}
   {loaded&&inspection&&mode!=="targeted"&&mode!=="pages"&&mode!=="annotate"&&<div className="noata-creative-actions">
    {requiresPartialExtractionAcknowledgement(Boolean(inspection.partial),mode)&&<div className="noata-creative-error noata-creative-partial-warning" role="group" aria-label={t("تأكيد الاستخراج الجزئي","Partial extraction acknowledgement")}>
     <p role="alert">{t("تحذير: استخراج النص غير مكتمل أو توجد صفحات ممسوحة ضوئيًا. النسخة المعاد إنشاؤها من النص قد تفقد هذه الأجزاء، بينما يبقى الملف الأصلي دون تغيير.","Warning: text extraction is incomplete or scanned pages were detected. A revision rebuilt from text may omit those parts; the original file remains unchanged.")}</p>
     <label><input type="checkbox" checked={partialRevisionAcknowledged} onChange={e=>{setPartialRevisionAcknowledged(e.target.checked);setError("");}}/> {t("أفهم أن النسخة الجديدة قد لا تتضمن محتوى لم يتم استخراجه.","I understand the new revision may omit content that was not extracted.")}</label>
    </div>}
    {sections.length>0&&<label className="noata-creative-instruction">{t("نطاق التعديل بالذكاء الاصطناعي","AI revision scope")}<select value={sectionStart} onChange={e=>setSectionStart(e.target.value)}><option value="whole">{t("المستند كاملًا","Entire document")}</option>{sections.map(s=><option key={s.start} value={s.start} disabled={s.end-s.start>14000}>{s.label}{s.end-s.start>14000?" · "+t("اختر قسمًا فرعيًا","Choose a subsection"):""}</option>)}</select></label>}
    {sectionStart!=="whole"&&<p>{t("سنعدّل القسم المحدد ونجمعه مع بقية المصدر في نسخة كاملة جديدة.","The selected section will be revised and reassembled with the surrounding source into a complete new version.")}</p>}
    {<label className="noata-creative-instruction">{t("اطلب تحسينًا من Noata AI","Ask Noata AI to improve this file")}
     <textarea rows={2} dir="auto" placeholder={t("مثلاً: حسّن التنسيق، أضف أمثلة، وصحح الأخطاء","For example: Improve the structure, add examples, and fix errors")} value={instruction} onChange={e=>setInstruction(e.target.value)} maxLength={1200}/>
    </label>}
    <label className="noata-creative-instruction">{t("صيغة النسخة الجديدة","New version format")}<select value={outputFormat} onChange={e=>setOutputFormat(e.target.value as Format)}>{(["pdf","docx","xlsx","pptx"] as const).map(kind=><option key={kind} value={kind}>{kind.toUpperCase()}</option>)}</select></label>
    {outputFormat!=="xlsx"&&<label className="noata-creative-instruction">{t("مظهر المستند","Document style")}<select value={style} onChange={e=>setStyle(e.target.value as DocumentStyle)}><option value="classic">{t("كلاسيكي","Classic")}</option><option value="editorial">{t("تحريري دافئ","Warm editorial")}</option><option value="forest">{t("غابة هادئة","Calm forest")}</option></select></label>}
    {outputFormat==="pdf"&&<label className="noata-creative-instruction">{t("خط PDF المضمّن","Embedded PDF font")}<select value={font} onChange={e=>setFont(e.target.value as "noata"|"editorial"|"mono")}><option value="noata">Noata · Cairo</option><option value="editorial">Lora · Serif</option><option value="mono">Roboto Mono</option></select></label>}
    <div className="noata-creative-buttons">
     <button type="button" className="noata-download-original" disabled={busy||!loaded} onClick={()=>void downloadOriginal()}>
      <Icon name="download" size={15}/>{t("تنزيل الملف الأصلي","Download original")}
     </button>
     <button type="button" disabled={busy||(!onPrepareEdit&&!onAskAI)||!draft.trim()||!revisionAllowed} onClick={prepareAI}><Icon name="sparkles" size={15}/>{t("تحضير طلب تحسين","Prepare AI revision")}</button>
     <button type="button" disabled={busy||!draft.trim()||!revisionAllowed} onClick={()=>void exportVersion(outputFormat)}><Icon name="download" size={15}/>{busy?t("جارٍ التصدير…","Exporting…"):t("تنزيل النسخة المعدّلة","Export revised file")}</button>
     <button type="button" disabled={busy||!owner||!draft.trim()||!revisionAllowed} onClick={()=>void saveRevision()}><Icon name="archive" size={15}/>{busy?t("جارٍ التنفيذ…","Working…"):t("حفظ نسخة جديدة في المكتبة","Save revision to library")}</button>
    </div>
   </div>}
   {status&&<p role="status">{status}</p>}
  </div>
 </>;
 if(inline)return file||localSource?<section className="noata-artifact-inline" aria-label={t("معاينة الملف","File preview")}>{content}</section>:null;
 return <Dialog open={Boolean(file||localSource)} onClose={onClose} variant="studio" title={t("معاينة الملف وتحريره","Preview & edit file")}>{content}</Dialog>;
}
