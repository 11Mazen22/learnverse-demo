"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {LIBRARY_COLUMNS,LIBRARY_PAGE_SIZE,libraryPage,librarySearchPattern,mergeLibraryPage} from "@/lib/ai/library-query";
import {NoataCreativeStudio} from "./creative-studio";
import {NoataImageStudio} from "./image-studio";
import {downloadBytes} from "./creative-studio";
import type {CreatedArtifact} from "@/lib/ai/artifact-runner";
import type {LibrarySource} from "@/lib/ai/library-source";
import {createClient} from "@/lib/supabase/client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
type Project={id:string;user_id:string;name:string;instructions:string;created_at:string;updated_at:string};
type Artifact={id:string;user_id:string;project_id:string|null;filename:string;mime_type:string;storage_path:string;byte_size:number;created_at:string;version:number;parent_artifact_id?:string|null;source_document_id?:string|null};
type Upload={id:string;name:string;storage_path:string;mime_type:string;size_bytes:number;created_at:string;kind:"document"|"media";expires_at?:string;library_saved?:boolean};
export function NoataProjectLibrary({owner,open,onPrepareEdit,onUseUpload}:{owner:string|null;open:boolean;onPrepareEdit?:(prompt:string,source?:LibrarySource)=>void;onUseUpload?:(file:File)=>void}){
 const t=useTranslation(),locale=useLocale(),supabase=useMemo(()=>createClient(),[]);
 const [projects,setProjects]=useState<Project[]>([]),[artifacts,setArtifacts]=useState<Artifact[]>([]);
 const [uploads,setUploads]=useState<Upload[]>([]),[revision,setRevision]=useState(0);
 const [editing,setEditing]=useState<CreatedArtifact|null>(null),[original,setOriginal]=useState<{name:string;documentId:string;format:"pdf"|"docx"|"xlsx"|"pptx"|"text";initialMode:"preview"|"edit"|"pages"}|null>(null);
 const [media,setMedia]=useState<{url:string;item:Upload}|null>(null);
 useEffect(()=>()=>{if(media)URL.revokeObjectURL(media.url);},[media]);
 const [query,setQuery]=useState(""),[serverQuery,setServerQuery]=useState(""),[page,setPage]=useState(0),[hasMore,setHasMore]=useState(false);
 const [projectPage,setProjectPage]=useState(0),[hasMoreProjects,setHasMoreProjects]=useState(false),[projectsLoading,setProjectsLoading]=useState(false);
 const loadedView=useRef("");
 useEffect(()=>{const timer=setTimeout(()=>{setServerQuery(query);setPage(0);},250);return()=>clearTimeout(timer);},[query]);
 const previewHeading=useRef<HTMLHeadingElement>(null),searchInput=useRef<HTMLInputElement>(null),wasPreviewing=useRef(false);
 const [selected,setSelected]=useState("all"),[name,setName]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const current=useRef(owner);current.current=owner;
 const viewOwner=useRef(owner);const ownerReady=viewOwner.current===owner;
 useEffect(()=>{
  viewOwner.current=owner;
  setProjects([]);setArtifacts([]);setUploads([]);setEditing(null);setOriginal(null);setMedia(null);
  setSelected("all");setQuery("");setServerQuery("");setPage(0);setProjectPage(0);setHasMoreProjects(false);setProjectsLoading(false);setName("");setError("");setNotice("");loadedView.current="";
 },[owner,open,locale]);
 useEffect(()=>{
  if(!owner||!open){setProjectsLoading(false);return;}
  let active=true;const controller=new AbortController();let deadline:ReturnType<typeof setTimeout>|undefined;const {from,to}=libraryPage(projectPage);
  setProjectsLoading(true);
  const request=supabase.from("ai_projects").select(LIBRARY_COLUMNS.projects).eq("user_id",owner)
   .order("updated_at",{ascending:false}).order("id",{ascending:false}).range(from,to).abortSignal(controller.signal);
  void Promise.race([request,new Promise<never>((_,reject)=>{deadline=setTimeout(()=>{controller.abort();reject(Error("project_timeout"));},20000);})])
   .then(({data,error})=>{
    if(!active||current.current!==owner)return;
    if(error)throw error;
    const rows=(data??[]) as unknown as Project[];
    setProjects(old=>mergeLibraryPage(old,rows,projectPage===0));setHasMoreProjects(rows.length===LIBRARY_PAGE_SIZE);
   })
   .catch(()=>{if(active&&current.current===owner)setError(t("\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639.","Could not load projects."));})
   .finally(()=>{clearTimeout(deadline);if(active&&current.current===owner)setProjectsLoading(false);});
  return()=>{active=false;clearTimeout(deadline);controller.abort();};
 },[owner,open,supabase,projectPage,revision,locale]);
 useEffect(()=>{
  let active=true;setLoading(Boolean(owner&&open));setError("");
  if(!owner||!open)return;
  const controller=new AbortController();let deadline:ReturnType<typeof setTimeout>|undefined;
  const view=owner+":"+serverQuery+":"+selected+":"+revision;
  const replace=loadedView.current!==view||page===0;
  if(replace){setArtifacts([]);setUploads([]);setHasMore(false);}
  void(async()=>{
   try{
    const {from,to}=libraryPage(page),pattern=librarySearchPattern(serverQuery);
    let files=supabase.from("ai_artifacts").select(LIBRARY_COLUMNS.artifacts).eq("user_id",owner);
    if(serverQuery.trim())files=files.ilike("filename",pattern);
    if(selected==="none")files=files.is("project_id",null);else if(selected!=="all")files=files.eq("project_id",selected);
    let documents=supabase.from("ai_document_files").select(LIBRARY_COLUMNS.documents).eq("user_id",owner)
      .or("library_saved.eq.true,expires_at.gt."+new Date().toISOString());
    let attachments=supabase.from("ai_attachments").select(LIBRARY_COLUMNS.media).eq("user_id",owner).or("library_saved.eq.true,conversation_id.not.is.null");
    if(serverQuery.trim()){documents=documents.ilike("name",pattern);attachments=attachments.ilike("filename",pattern);}
    const [artifactResult,documentResult,attachmentResult]=await Promise.race([Promise.all([
     files.order("created_at",{ascending:false}).order("id",{ascending:false}).range(from,to).abortSignal(controller.signal),
     documents.order("created_at",{ascending:false}).order("id",{ascending:false}).range(from,to).abortSignal(controller.signal),
     attachments.order("created_at",{ascending:false}).order("id",{ascending:false}).range(from,to).abortSignal(controller.signal)
    ]),new Promise<never>((_,reject)=>{deadline=setTimeout(()=>{controller.abort();reject(Error("workspace_timeout"));},20000);})]);
    if(!active||current.current!==owner)return;
    for(const result of [artifactResult,documentResult,attachmentResult])if(result.error)throw result.error;
    const artifactRows=(artifactResult.data??[]) as unknown as Artifact[];
    const documentRows=(documentResult.data??[]) as unknown as Omit<Upload,"kind">[];
    const mediaRows=(attachmentResult.data??[]) as unknown as (Omit<Upload,"kind"|"name">&{filename?:string|null})[];
    setArtifacts(rows=>mergeLibraryPage(rows,artifactRows,replace));
    const uploadRows:Upload[]=[...documentRows.map(d=>({...d,kind:"document" as const})),...mediaRows.map(a=>({...a,name:a.filename??a.storage_path.split("/").at(-1)??"Upload",kind:"media" as const}))];
    setUploads(rows=>mergeLibraryPage(rows,uploadRows,replace).sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.id.localeCompare(a.id)));
    setHasMore(artifactRows.length===LIBRARY_PAGE_SIZE||((selected==="all"||selected==="none")&&(documentRows.length===LIBRARY_PAGE_SIZE||mediaRows.length===LIBRARY_PAGE_SIZE)));
    loadedView.current=view;
   }catch{if(active&&current.current===owner)setError(t("تعذّر تحميل مساحة العمل.","Could not load the workspace."));}
   finally{clearTimeout(deadline);if(active&&current.current===owner)setLoading(false);}
  })();
  return()=>{active=false;clearTimeout(deadline);controller.abort();};
 },[owner,open,supabase,locale,revision,serverQuery,selected,page]);
 const filtered=artifacts;
 const visibleUploads=uploads;
 const search=serverQuery.trim();
 const previewing=Boolean(editing||original||media);
 useEffect(()=>{
  if(previewing)previewHeading.current?.focus();
  else if(wasPreviewing.current)searchInput.current?.focus();
  wasPreviewing.current=previewing;
 },[previewing,editing?.id,original?.documentId,media?.item.id]);
 function closePreview(){setEditing(null);setOriginal(null);setMedia(null);}
 async function createProject(){
  if(!owner||busy||name.trim().length<2||name.length>80)return;
  setBusy(true);setError("");setNotice("");
  try{
   const {data,error}=await supabase.from("ai_projects").insert({user_id:owner,name:name.trim()}).select("*").single();
   if(error)throw error;
   if(current.current===owner){setProjects([]);setProjectPage(0);setHasMoreProjects(false);setRevision(n=>n+1);setName("");setNotice(t("تم إنشاء المشروع.","Project created."));}
  }catch{if(current.current===owner)setError(t("تعذّر إنشاء المشروع.","Could not create project."));}
  finally{if(current.current===owner)setBusy(false);}
 }
 async function deleteProject(project:Project){
  if(!owner||busy||!window.confirm(t("حذف هذا المشروع؟ ستبقى ملفاته في المكتبة دون مشروع.","Delete this project? Its files remain unfiled in the library.")))return;
  setBusy(true);setError("");
  try{
   const {error}=await supabase.from("ai_projects").delete().eq("id",project.id).eq("user_id",owner);
   if(error)throw error;
   if(current.current===owner){setProjects([]);setProjectPage(0);setHasMoreProjects(false);setRevision(n=>n+1);setArtifacts(a=>a.map(x=>x.project_id===project.id?{...x,project_id:null}:x));setSelected("all");setPage(0);}
  }catch{if(current.current===owner)setError(t("تعذّر حذف المشروع.","Could not delete project."));}
  finally{if(current.current===owner)setBusy(false);}
 }
 async function download(item:Artifact){
  if(!owner||busy||!item.storage_path.startsWith(owner+"/"))return;
  setBusy(true);setError("");
  try{
   const {data,error}=await supabase.storage.from("noata-ai-artifacts").createSignedUrl(item.storage_path,120,{download:item.filename});
   if(error||!data?.signedUrl)throw error??Error("signed link missing");
   if(current.current!==owner)return;
   const a=document.createElement("a");a.href=data.signedUrl;a.target="_blank";a.rel="noopener noreferrer";a.download=item.filename;
   document.body.append(a);a.click();a.remove();
  }catch{if(current.current===owner)setError(t("تعذّر تنزيل الملف. جرّب مرة أخرى.","Could not download file. Try again."));}
  finally{if(current.current===owner)setBusy(false);}
 }
 async function deleteArtifact(item:Artifact){
  if(!owner||busy||!window.confirm(t("حذف الملف المحفوظ نهائيًا؟","Permanently delete this saved file?")))return;
  setBusy(true);setError("");
  try{
   const storage=await supabase.storage.from("noata-ai-artifacts").remove([item.storage_path]);
   if(storage.error)throw storage.error;
   const {error}=await supabase.from("ai_artifacts").delete().eq("id",item.id).eq("user_id",owner);
   if(error)throw error;
   if(current.current===owner)setArtifacts(a=>a.filter(x=>x.id!==item.id));
  }catch{if(current.current===owner)setError(t("تعذّر الحذف الكامل. قد يحتاج الملف إلى إعادة المحاولة.","Could not finish deletion; the file may need a retry."));}
  finally{if(current.current===owner)setBusy(false);}
 }
 function openArtifact(item:Artifact){
  const format=item.filename.split(".").at(-1)?.toLowerCase();
  if(!["pdf","docx","xlsx","pptx"].includes(format??""))return;
  setEditing({id:item.id,format:format as CreatedArtifact["format"],filename:item.filename,storagePath:item.storage_path,mimeType:item.mime_type,byteSize:item.byte_size});setOriginal(null);setMedia(null);
 }
 async function retrieve(item:Upload,action:"preview"|"download"|"reuse"){
  if(!owner||busy||!item.storage_path.startsWith(owner+"/"))return;
  setBusy(true);setError("");
  try{
   const result=await supabase.storage.from(item.kind==="document"?"noata-documents":"noata-uploads").download(item.storage_path);
   if(result.error||!result.data||result.data.size!==Number(item.size_bytes)||result.data.size>10*1024*1024)throw Error("source unavailable");
   if(current.current!==owner)return;
   if(action==="download")downloadBytes(new Uint8Array(await result.data.arrayBuffer()),item.name,item.mime_type);
   else if(action==="reuse")onUseUpload?.(new File([result.data],item.name,{type:item.mime_type}));
   else setMedia({url:URL.createObjectURL(result.data),item});
  }catch{if(current.current===owner)setError(t("تعذّر فتح الأصل. أعد المحاولة.","Could not open the original. Try again."));}
  finally{if(current.current===owner)setBusy(false);}
 }
 function openUpload(item:Upload){
  if(item.kind==="media"){void retrieve(item,"preview");setEditing(null);setOriginal(null);return;}
  const ext=item.name.split(".").at(-1)?.toLowerCase();
  setEditing(null);setMedia(null);
  setOriginal({name:item.name,documentId:item.id,format:["pdf","docx","xlsx","pptx"].includes(ext??"")?ext as "pdf"|"docx"|"xlsx"|"pptx":"text",initialMode:ext==="pdf"?"pages":"preview"});
 }
 async function organize(item:Artifact,project:string){
  if(!owner||busy)return;setBusy(true);setError("");
  try{
   const r=await supabase.from("ai_artifacts").update({project_id:project||null}).eq("id",item.id).eq("user_id",owner).select("id").single();
   if(r.error||!r.data)throw r.error;
   if(current.current===owner)setArtifacts(rows=>rows.map(x=>x.id===item.id?{...x,project_id:project||null}:x));
  }catch{if(current.current===owner)setError(t("تعذّر نقل الملف للمشروع.","Could not move the file to that project."));}
  finally{if(current.current===owner)setBusy(false);}
 }
 return <section className="noata-library" aria-label={t("مشروعات ومكتبة Noata","Noata projects and library")}>
  <h3>{t("المشروعات والملفات","Projects and files")}</h3>
  <p>{t("الملفات المرفوعة والأصول والنسخ الجديدة في مكتبتك الخاصة. المحادثات المؤقتة لا تُحفظ هنا.","Uploads, original documents and generated versions in your private library. Temporary chats are excluded.")}</p>
  {!owner?<p role="status">{t("سجّل الدخول للوصول إلى الملفات.","Sign in to access files.")}</p>:!ownerReady?<p role="status">{t("جارٍ التحميل…","Loading…")}</p>:<>
   {previewing?<>
    <div className="noata-library-preview-heading"><button type="button" onClick={closePreview}>{t("العودة إلى المكتبة","Back to library")}</button><h4 ref={previewHeading} tabIndex={-1} dir="auto">{editing?.filename??original?.name??media?.item.name}</h4></div>
   {media&&<section className="noata-library-media" aria-label={t("معاينة المرفق","Upload preview")}><strong dir="auto">{media.item.name}</strong>{media.item.mime_type.startsWith("image/")?<NoataImageStudio url={media.url} name={media.item.name} sourceId={media.item.id} owner={owner} onSaved={()=>{setPage(0);setRevision(n=>n+1);}} onUse={onUseUpload}/>:<audio src={media.url} controls/>}<button type="button" onClick={()=>setMedia(null)}>{t("إغلاق المعاينة","Close preview")}</button></section>}
   {(editing||original)&&<NoataCreativeStudio inline file={editing} localSource={original} initialMode={original?.initialMode??(editing?.format==="pdf"?"pages":"preview")} owner={owner} onClose={closePreview} onPrepareEdit={onPrepareEdit} onRevisionSaved={()=>{setPage(0);setRevision(n=>n+1);}}/>}
   </>:<>
   <form className="noata-library-create" onSubmit={e=>{e.preventDefault();void createProject();}}>
    <label htmlFor="noata-project-name">{t("مشروع جديد","New project")}</label>
    <input id="noata-project-name" maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder={t("مثال: مذاكرة العلوم","Example: Science revision")}/>
    <button type="submit" disabled={busy||name.trim().length<2}>{t("إنشاء","Create")}</button>
   </form>
   {projects.length>0&&<div className="noata-library-projects">{projects.map(p=><div key={p.id}>
    <strong dir="auto">{p.name}</strong><button type="button" disabled={busy} onClick={()=>void deleteProject(p)}>{t("حذف المشروع","Delete project")}</button>
   </div>)}</div>}
   {projectsLoading&&<p role="status">{t("جاري تحميل المشاريع…","Loading projects…")}</p>}
   {hasMoreProjects&&<button type="button" className="noata-library-more" disabled={projectsLoading||busy} onClick={()=>setProjectPage(n=>n+1)}>{t("عرض المزيد من المشاريع","Load more projects")}</button>}
   <label className="noata-library-filter">{t("ابحث في ملفاتك","Search files")}<input ref={searchInput} type="search" dir="auto" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("ابحث باسم الملف…","Search by filename…")} maxLength={120}/></label>
   <label className="noata-library-filter">{t("تصفية المكتبة","Filter library")}
    <select value={selected} onChange={e=>{setSelected(e.target.value);setPage(0);}}>
     <option value="all">{t("جميع الملفات","All files")}</option><option value="none">{t("بدون مشروع","Unfiled")}</option>
     {projects.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}
    </select>
   </label>
   {loading&&<p role="status">{t("جارٍ البحث في مكتبتك…","Searching your library…")}</p>}
   {!filtered.length&&!loading?<p className="noata-library-empty">{t("لا توجد ملفات محفوظة في هذا القسم.","No saved files match this view.")}</p>:
   <ul className="noata-library-files">{filtered.map(a=><li key={a.id}>
    <div><strong dir="auto">{a.filename}</strong><small>{t("نسخة ","Version ")}{a.version??1}{a.parent_artifact_id||a.source_document_id?t(" · تعديل محفوظ"," · Saved revision"):""} · {Math.ceil(a.byte_size/1024)} KB · {new Date(a.created_at).toLocaleDateString(locale==="ar"?"ar-EG":"en-US")}</small></div>
    <label className="noata-file-project"><span>{t("المشروع","Project")}</span><select aria-label={t("مشروع الملف ","Project for ")+a.filename} disabled={busy} value={a.project_id??""} onChange={e=>void organize(a,e.target.value)}><option value="">{t("بدون مشروع","Unfiled")}</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <button type="button" disabled={busy} onClick={()=>openArtifact(a)}>{t("فتح وتحرير","Open & edit")}</button>
    <button type="button" disabled={busy} onClick={()=>void download(a)}>{t("تنزيل","Download")}</button>
    <button type="button" className="danger" disabled={busy} onClick={()=>void deleteArtifact(a)}>{t("حذف","Delete")}</button>
   </li>)}</ul>}
   {(selected==="all"||selected==="none")&&<><h4>{t("ملفاتك المرفوعة","Your uploads")}</h4>
    {!visibleUploads.length?<p>{search?t("لا توجد ملفات مرفوعة بهذا الاسم.","No uploads match this filename."):t("أرسل ملفًا في محادثة عادية ليظهر هنا.","Send a file in a regular conversation to keep it here.")}</p>:<ul className="noata-library-files">{visibleUploads.map(item=><li key={item.kind+item.id}><div><strong dir="auto">{item.name}</strong><small>{t("الملف الأصلي","Original upload")} · {Math.ceil(Number(item.size_bytes)/1024)} KB{item.kind==="document"&&!item.library_saved?" · "+t("متاح حتى ","Available until ")+new Date(item.expires_at!).toLocaleDateString(locale==="ar"?"ar-EG":"en-US"):""}</small></div><button disabled={busy} type="button" onClick={()=>openUpload(item)}>{item.kind==="document"?t("فتح وتحرير","Open & edit"):t("معاينة","Preview")}</button><button disabled={busy} type="button" onClick={()=>void retrieve(item,"reuse")}>{t("استخدام في المحادثة","Use in conversation")}</button><button disabled={busy} type="button" onClick={()=>void retrieve(item,"download")}>{t("تنزيل الأصل","Download original")}</button></li>)}</ul>}
   </>}
   {hasMore&&<button type="button" className="noata-library-more" disabled={loading||busy} onClick={()=>setPage(n=>n+1)}>{loading?t("جارٍ التحميل…","Loading…"):t("عرض المزيد من الملفات","Load more files")}</button>}
   {!loading&&(filtered.length>0||visibleUploads.length>0)&&<p role="status">{t("الملفات المعروضة: ","Files shown: ")}{filtered.length+((selected==="all"||selected==="none")?visibleUploads.length:0)}</p>}
   </>}
  </>}
  {error&&<div><p role="alert" className="noata-library-error">{error}</p><button type="button" disabled={busy||loading} onClick={()=>{setPage(0);setRevision(n=>n+1);}}>{t("إعادة تحميل المكتبة","Reload library")}</button></div>}
  {notice&&<p role="status">{notice}</p>}
 </section>;
}
