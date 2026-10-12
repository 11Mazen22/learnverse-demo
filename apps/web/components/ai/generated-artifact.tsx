"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {useTranslation} from "@/lib/i18n/locale";
import {Icon} from "@/components/ui/icon";
import {NoataCreativeStudio,downloadBytes} from "./creative-studio";
import {validArtifactBytes} from "@/lib/ai/artifact-intent";
import type {ArtifactKind} from "@/lib/ai/artifact-intent";
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
 const previewTrigger=useRef<HTMLButtonElement>(null);
 const current=useRef("");current.current=owner+":"+file?.id;
 useEffect(()=>{setStudioOpen(false);setError("");setBusy(false);},[owner,file?.id]);
 if(!file)return null;
 async function downloadFile(){
  if(!file||!owner||busy)return;
  const ticket=current.current;
  setBusy(true);setError("");
  try{
   const {data,error}=await supabase.from("ai_artifacts").select("id,storage_path,filename").eq("id",file.id).eq("user_id",owner).single();
   if(error||!data||data.storage_path!==file.storagePath||data.filename!==file.filename)throw Error("Not found");
   // A same-origin Blob download preserves Unicode filenames; cross-origin
   // Content-Disposition can expose an encoded name and ignore link.download.
   const original=await supabase.storage.from("noata-ai-artifacts").download(file.storagePath);
   if(original.error||!original.data)throw Error("Download unavailable");
   if(current.current!==ticket)return;
   const bytes=new Uint8Array(await original.data.arrayBuffer());
   if(bytes.byteLength!==file.byteSize||!validArtifactBytes(file.format as ArtifactKind,bytes))throw Error("Saved file failed validation");
   if(current.current!==ticket)return;
   downloadBytes(bytes,file.filename,file.mimeType);
  }catch{if(current.current===ticket)setError(t("لم نتمكن من فتح الملف؛ ربما حُذف أو انتهت صلاحية الجلسة.","The saved file could not be opened; it may have been deleted or the session expired."));}
  finally{if(current.current===ticket)setBusy(false);}
 }
 return <section className="noata-generated-file" aria-label={t("ملف تم إنشاؤه","Generated file")}>
  <div className="noata-generated-file-symbol" aria-hidden="true"><Icon name="file" size={22}/></div>
  <div className="noata-generated-file-info"><strong dir="auto">{file.filename}</strong>
   <small>{file.format.toUpperCase()} · {Math.ceil(file.byteSize/1024)} KB · {t("محفوظ في مكتبتك الخاصة","Saved in your private library")}</small></div>
  <div className="noata-generated-file-actions">
   <button type="button" ref={previewTrigger} disabled={busy} aria-expanded={studioOpen} onClick={()=>setStudioOpen(x=>!x)}><Icon name="edit" size={14}/>{t("معاينة وتحرير","Preview & edit")}</button>
   <button type="button" disabled={busy} onClick={()=>void downloadFile()}><Icon name="download" size={14}/>{busy?t("جارٍ التنزيل","Downloading"):t("تنزيل","Download")}</button>
  </div>
  {error&&<p role="alert">{error}</p>}
  <NoataCreativeStudio inline file={studioOpen?file:null} owner={owner} onClose={()=>{setStudioOpen(false);previewTrigger.current?.focus();}} onAskAI={onAskAI} onPrepareEdit={onPrepareEdit}/>
 </section>;
}
