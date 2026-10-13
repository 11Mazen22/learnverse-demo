"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {NoataCreativeStudio} from "./creative-studio";
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
 const [editing,setEditing]=useState<CreatedArtifact|null>(null),[original,setOriginal]=useState<{name:string;documentId:string;format:"pdf"|"docx"|"xlsx"|"pptx"|"text"}|null>(null);
 const [media,setMedia]=useState<{url:string;item:Upload}|null>(null);
 useEffect(()=>()=>{if(media)URL.revokeObjectURL(media.url);},[media]);
 const [selected,setSelected]=useState("all"),[name,setName]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const current=useRef(owner);current.current=owner;
 useEffect(()=>{
  let active=true;setProjects([]);setArtifacts([]);setUploads([]);setEditing(null);setOriginal(null);setMedia(null);setSelected("all");setName("");setError("");setNotice("");setLoading(Boolean(owner&&open));
  if(!owner||!open)return;
  void (async()=>{
   try{
    const [projects,artifacts,documents,attachments]=await Promise.all([
     supabase.from("ai_projects").select("*").eq("user_id",owner).order("updated_at",{ascending:false}).limit(50),
     supabase.from("ai_artifacts").select("*").eq("user_id",owner).order("created_at",{ascending:false}).limit(100),
     supabase.from("ai_document_files").select("*").eq("user_id",owner).order("created_at",{ascending:false}).limit(100),
     supabase.from("ai_attachments").select("*").eq("user_id",owner).or("library_saved.eq.true,conversation_id.not.is.null").order("created_at",{ascending:false}).limit(100)
    ]);
    if(!active||current.current!==owner)return;
    if(projects.error)throw projects.error;if(artifacts.error)throw artifacts.error;if(documents.error)throw documents.error;if(attachments.error)throw attachments.error;
    setProjects(projects.data??[]);setArtifacts(artifacts.data??[]);
    setUploads([...(documents.data??[]).filter(d=>d.library_saved||Date.parse(d.expires_at)>Date.now()).map(d=>({...d,kind:"document" as const})),...(attachments.data??[]).map(a=>({...a,name:a.filename??a.storage_path.split("/").at(-1)??"Upload",kind:"media" as const}))].sort((a,b)=>b.created_at.localeCompare(a.created_at)));
   }catch{if(active&&current.current===owner)setError(t("تعذّر تحميل مساحة العمل.","Could not load the workspace."));}
   finally{if(active&&current.current===owner)setLoading(false);}
  })();
  return ()=>{active=false;};
 },[owner,open,supabase,locale,revision]);
 const filtered=artifacts.filter(x=>selected==="all"||(selected==="none"?x.project_id===null:x.project_id===selected));
 async function createProject(){
  if(!owner||busy||name.trim().length<2||name.length>80||projects.length>=50)return;
  setBusy(true);setError("");setNotice("");
  try{
   const {data,error}=await supabase.from("ai_projects").insert({user_id:owner,name:name.trim()}).select("*").single();
   if(error)throw error;
   if(current.current===owner){setProjects(p=>[data,...p]);setName("");setNotice(t("تم إنشاء المشروع.","Project created."));}
  }catch{if(current.current===owner)setError(t("تعذّر إنشاء المشروع.","Could not create project."));}
  finally{if(current.current===owner)setBusy(false);}
 }
 async function deleteProject(project:Project){
  if(!owner||busy||!window.confirm(t("حذف هذا المشروع؟ ستبقى ملفاته في المكتبة دون مشروع.","Delete this project? Its files remain unfiled in the library.")))return;
  setBusy(true);setError("");
  try{
   const {error}=await supabase.from("ai_projects").delete().eq("id",project.id).eq("user_id",owner);
   if(error)throw error;
   if(current.current===owner){setProjects(p=>p.filter(x=>x.id!==project.id));setArtifacts(a=>a.map(x=>x.project_id===project.id?{...x,project_id:null}:x));setSelected("all");}
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
  setOriginal({name:item.name,documentId:item.id,format:["pdf","docx","xlsx","pptx"].includes(ext??"")?ext as "pdf"|"docx"|"xlsx"|"pptx":"text"});
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
  {!owner?<p role="status">{t("سجّل الدخول للوصول إلى الملفات.","Sign in to access files.")}</p>:loading?<p role="status">{t("جارٍ التحميل…","Loading…")}</p>:<>
   <form className="noata-library-create" onSubmit={e=>{e.preventDefault();void createProject();}}>
    <label htmlFor="noata-project-name">{t("مشروع جديد","New project")}</label>
    <input id="noata-project-name" maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder={t("مثال: مذاكرة العلوم","Example: Science revision")}/>
    <button type="submit" disabled={busy||name.trim().length<2||projects.length>=50}>{t("إنشاء","Create")}</button>
   </form>
   {projects.length>0&&<div className="noata-library-projects">{projects.map(p=><div key={p.id}>
    <strong dir="auto">{p.name}</strong><button type="button" disabled={busy} onClick={()=>void deleteProject(p)}>{t("حذف المشروع","Delete project")}</button>
   </div>)}</div>}
   <label className="noata-library-filter">{t("تصفية المكتبة","Filter library")}
    <select value={selected} onChange={e=>setSelected(e.target.value)}>
     <option value="all">{t("جميع الملفات","All files")}</option><option value="none">{t("بدون مشروع","Unfiled")}</option>
     {projects.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}
    </select>
   </label>
   {!filtered.length?<p className="noata-library-empty">{t("لا توجد ملفات محفوظة في هذا القسم.","No saved files in this section.")}</p>:
   <ul className="noata-library-files">{filtered.map(a=><li key={a.id}>
    <div><strong dir="auto">{a.filename}</strong><small>{t("نسخة ","Version ")}{a.version??1}{a.parent_artifact_id||a.source_document_id?t(" · تعديل محفوظ"," · Saved revision"):""} · {Math.ceil(a.byte_size/1024)} KB · {new Date(a.created_at).toLocaleDateString(locale==="ar"?"ar-EG":"en-US")}</small></div>
    <label className="noata-file-project"><span>{t("المشروع","Project")}</span><select aria-label={t("مشروع الملف ","Project for ")+a.filename} disabled={busy} value={a.project_id??""} onChange={e=>void organize(a,e.target.value)}><option value="">{t("بدون مشروع","Unfiled")}</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <button type="button" disabled={busy} onClick={()=>openArtifact(a)}>{t("فتح وتحرير","Open & edit")}</button>
    <button type="button" disabled={busy} onClick={()=>void download(a)}>{t("تنزيل","Download")}</button>
    <button type="button" className="danger" disabled={busy} onClick={()=>void deleteArtifact(a)}>{t("حذف","Delete")}</button>
   </li>)}</ul>}
   {(selected==="all"||selected==="none")&&<><h4>{t("ملفاتك المرفوعة","Your uploads")}</h4>
    {!uploads.length?<p>{t("أرسل ملفًا في محادثة عادية ليظهر هنا.","Send a file in a regular conversation to keep it here.")}</p>:<ul className="noata-library-files">{uploads.map(item=><li key={item.kind+item.id}><div><strong dir="auto">{item.name}</strong><small>{t("الملف الأصلي","Original upload")} · {Math.ceil(Number(item.size_bytes)/1024)} KB{item.kind==="document"&&!item.library_saved?" · "+t("متاح حتى ","Available until ")+new Date(item.expires_at!).toLocaleDateString(locale==="ar"?"ar-EG":"en-US"):""}</small></div><button disabled={busy} type="button" onClick={()=>openUpload(item)}>{item.kind==="document"?t("فتح وتحرير","Open & edit"):t("معاينة","Preview")}</button><button disabled={busy} type="button" onClick={()=>void retrieve(item,"reuse")}>{t("استخدام في المحادثة","Use in conversation")}</button><button disabled={busy} type="button" onClick={()=>void retrieve(item,"download")}>{t("تنزيل الأصل","Download original")}</button></li>)}</ul>}
   </>}
   {(artifacts.length===100||uploads.length>=100)&&<p>{t("تظهر أحدث الملفات. استخدم تنزيل الأصل للاحتفاظ بنسخة.","Showing the latest files. Download an original to keep a copy.")}</p>}
   {media&&<section className="noata-library-media" aria-label={t("معاينة المرفق","Upload preview")}><strong dir="auto">{media.item.name}</strong>{media.item.mime_type.startsWith("image/")?<img src={media.url} alt={media.item.name}/>:<audio src={media.url} controls/>}<button type="button" onClick={()=>setMedia(null)}>{t("إغلاق المعاينة","Close preview")}</button></section>}
   {(editing||original)&&<NoataCreativeStudio inline file={editing} localSource={original} owner={owner} onClose={()=>{setEditing(null);setOriginal(null);}} onPrepareEdit={onPrepareEdit} onRevisionSaved={()=>setRevision(n=>n+1)}/>}
  </>}
  {error&&<p role="alert" className="noata-library-error">{error}</p>}
  {notice&&<p role="status">{notice}</p>}
 </section>;
}
