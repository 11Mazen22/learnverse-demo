"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
type Project={id:string;user_id:string;name:string;instructions:string;created_at:string;updated_at:string};
type Artifact={id:string;user_id:string;project_id:string|null;filename:string;mime_type:string;storage_path:string;byte_size:number;created_at:string};
export function NoataProjectLibrary({owner,open}:{owner:string|null;open:boolean}){
 const t=useTranslation(),locale=useLocale(),supabase=useMemo(()=>createClient(),[]);
 const [projects,setProjects]=useState<Project[]>([]),[artifacts,setArtifacts]=useState<Artifact[]>([]);
 const [selected,setSelected]=useState("all"),[name,setName]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const current=useRef(owner);current.current=owner;
 useEffect(()=>{
  let active=true;setProjects([]);setArtifacts([]);setSelected("all");setName("");setError("");setNotice("");setLoading(Boolean(owner&&open));
  if(!owner||!open)return;
  void (async()=>{
   try{
    const [projects,artifacts]=await Promise.all([
     supabase.from("ai_projects").select("*").eq("user_id",owner).order("updated_at",{ascending:false}).limit(50),
     supabase.from("ai_artifacts").select("*").eq("user_id",owner).order("created_at",{ascending:false}).limit(100)
    ]);
    if(!active||current.current!==owner)return;
    if(projects.error)throw projects.error;if(artifacts.error)throw artifacts.error;
    setProjects(projects.data??[]);setArtifacts(artifacts.data??[]);
   }catch{if(active&&current.current===owner)setError(t("تعذّر تحميل مساحة العمل.","Could not load the workspace."));}
   finally{if(active&&current.current===owner)setLoading(false);}
  })();
  return ()=>{active=false;};
 },[owner,open,supabase,locale]);
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
  if(!owner||busy)return;
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
 return <section className="noata-library" aria-label={t("مشروعات ومكتبة Noata","Noata projects and library")}>
  <h3>{t("المشروعات والملفات","Projects and files")}</h3>
  <p>{t("ملفاتك المحفوظة من المحادثات والمسودات، في مكان واحد خاص بك.","Your saved conversation files and drafts, together in your private library.")}</p>
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
    <div><strong dir="auto">{a.filename}</strong><small>{Math.ceil(a.byte_size/1024)} KB · {new Date(a.created_at).toLocaleDateString(locale==="ar"?"ar-EG":"en-US")}</small></div>
    <button type="button" disabled={busy} onClick={()=>void download(a)}>{t("تنزيل","Download")}</button>
    <button type="button" className="danger" disabled={busy} onClick={()=>void deleteArtifact(a)}>{t("حذف","Delete")}</button>
   </li>)}</ul>}
  </>}
  {error&&<p role="alert" className="noata-library-error">{error}</p>}
  {notice&&<p role="status">{notice}</p>}
 </section>;
}
