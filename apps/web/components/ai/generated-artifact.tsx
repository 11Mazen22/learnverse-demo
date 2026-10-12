"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {useTranslation} from "@/lib/i18n/locale";
import {Icon} from "@/components/ui/icon";
import {NoataCreativeStudio} from "./creative-studio";
import type {CreatedArtifact} from "@/lib/ai/artifact-runner";
const allowed=["pdf","docx","xlsx","pptx"];
function valid(value:unknown,owner:string|null):CreatedArtifact|null{
 if(!owner||!value||typeof value!=="object")return null;
 const x=value as Record<string,unknown>;
 if(typeof x.id!=="string"||!/^[0-9a-f-]{36}$/i.test(x.id)||
    typeof x.format!=="string"||!allowed.includes(x.format)||
    typeof x.filename!=="string"||x.filename.length>100||
    typeof x.storagePath!=="string"||!x.storagePath.startsWith(owner+"/")||
    !/^[a-z0-9-]+\/[a-z0-9-]+\/noata-[a-z0-9-]+\.(pdf|docx|xlsx|pptx)$/i.test(x.storagePath)||
    typeof x.byteSize!=="number"||x.byteSize<=0||x.byteSize>12582912||
    typeof x.mimeType!=="string")return null;
 return x as unknown as CreatedArtifact;
}
export function NoataGeneratedArtifact({value,owner,onAskAI,onPrepareEdit}:{value:unknown;owner:string|null;onAskAI?:(prompt:string)=>void;onPrepareEdit?:(prompt:string)=>void}){
 const t=useTranslation(),supabase=useMemo(()=>createClient(),[]);
 const file=valid(value,owner),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [studioOpen,setStudioOpen]=useState(false);
 const current=useRef("");current.current=owner+":"+file?.id;
 useEffect(()=>{setStudioOpen(false);setError("");setBusy(false);},[owner,file?.id]);
 if(!file)return null;
 async function open(download:boolean){
  if(!file||!owner||busy)return;
  const ticket=current.current;
  setBusy(true);setError("");
  try{
   const {data,error}=await supabase.from("ai_artifacts").select("id,storage_path,filename").eq("id",file.id).eq("user_id",owner).single();
   if(error||!data||data.storage_path!==file.storagePath||data.filename!==file.filename)throw Error("Not found");
   const signed=await supabase.storage.from("noata-ai-artifacts").createSignedUrl(file.storagePath,120,{download:download?file.filename:false});
   if(signed.error||!signed.data?.signedUrl)throw Error("Download unavailable");
   if(current.current!==ticket)return;
   const link=document.createElement("a");link.href=signed.data.signedUrl;link.rel="noopener noreferrer";
   link.target="_blank";if(download)link.download=file.filename;
   document.body.append(link);link.click();link.remove();
  }catch{if(current.current===ticket)setError(t("لم نتمكن من فتح الملف؛ ربما حُذف أو انتهت صلاحية الجلسة.","The saved file could not be opened; it may have been deleted or the session expired."));}
  finally{if(current.current===ticket)setBusy(false);}
 }
 return <section className="noata-generated-file" aria-label={t("ملف تم إنشاؤه","Generated file")}>
  <div className="noata-generated-file-symbol" aria-hidden="true"><Icon name="file" size={22}/></div>
  <div className="noata-generated-file-info"><strong dir="auto">{file.filename}</strong>
   <small>{file.format.toUpperCase()} · {Math.ceil(file.byteSize/1024)} KB · {t("محفوظ في مكتبتك الخاصة","Saved in your private library")}</small></div>
  <div className="noata-generated-file-actions">
   <button type="button" disabled={busy} aria-expanded={studioOpen} onClick={()=>setStudioOpen(x=>!x)}><Icon name="edit" size={14}/>{t("معاينة وتحرير","Preview & edit")}</button>
   <button type="button" disabled={busy} onClick={()=>void open(true)}><Icon name="download" size={14}/>{busy?t("جارٍ الفتح","Opening"):t("تنزيل","Download")}</button>
  </div>
  {error&&<p role="alert">{error}</p>}
  <NoataCreativeStudio inline file={studioOpen?file:null} owner={owner} onClose={()=>setStudioOpen(false)} onAskAI={onAskAI} onPrepareEdit={onPrepareEdit}/>
 </section>;
}
