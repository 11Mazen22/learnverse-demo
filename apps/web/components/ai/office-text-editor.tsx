"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import {createClient} from "@/lib/supabase/client";
import {officeTextTargets,reviseOfficeText,type OfficeFormat,type OfficeTextTarget} from "@/lib/ai/office-preservation";
import {artifactFilename} from "@/lib/ai/artifact-filename";
import {inspectOfficeArtifact} from "@/lib/ai/studio-file-inspect";
import type {CreatedArtifact} from "@/lib/ai/artifact-runner";
const mime:Record<OfficeFormat,string>={docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"};
export function OfficeTextEditor({source,format,name,owner,parentId,documentId,onSaved}:{source:Blob;format:OfficeFormat;name:string;owner:string|null;parentId?:string;documentId?:string;onSaved?:()=>void}){
 const t=useTranslation(),locale=useLocale(),client=useMemo(()=>createClient(),[]);
 const [targets,setTargets]=useState<OfficeTextTarget[]>([]),[selected,setSelected]=useState(0),[replacement,setReplacement]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[status,setStatus]=useState("");
 const [ready,setReady]=useState(false);
 const identity=useRef({source,owner});if(identity.current.source!==source||identity.current.owner!==owner)identity.current={source,owner};
 const lock=useRef(false);
 const generation=useRef(0);
 useEffect(()=>{
  generation.current++;
  let alive=true;setReady(false);setTargets([]);setSelected(0);setReplacement("");setError("");setStatus("");setBusy(false);lock.current=false;
  void source.arrayBuffer().then(data=>officeTextTargets(new Uint8Array(data),format)).then(items=>{
   if(alive){setReady(true);setTargets(items);setReplacement(items[0]?.text??"");}
  }).catch(()=>{if(alive)setError(t("هذا الملف لا يدعم التعديل المحدد. يمكنك تنزيل الأصل أو إنشاء نسخة من المحتوى المستخرج.","Targeted editing is unavailable for this package. Download the original or create a revision from extracted content."));});
  return()=>{alive=false;generation.current++;};
 },[source,format,owner,locale]);
 async function deliver(save:boolean){
  const target=targets[selected];if(lock.current||!target||target.text===replacement)return;
  lock.current=true;setBusy(true);setError("");setStatus("");
  const ticket=identity.current,epoch=generation.current,active=()=>identity.current===ticket&&generation.current===epoch;let path="",uploaded=false,recorded=false;
  try{
   const result=await reviseOfficeText(new Uint8Array(await source.arrayBuffer()),format,[{...target,replacement}]);
   if(!active())return;
   const filename=artifactFilename({format,title:name,content:replacement,locale,revision:true});
   if(save){
    const who=await client.auth.getUser();if(!active())return;
    if(!owner||who.error||who.data.user?.id!==owner)throw Error("auth_expired");
    const id=crypto.randomUUID();path=owner+"/"+id+"/noata-"+id.slice(0,8)+"."+format;
    const upload=await client.storage.from("noata-ai-artifacts").upload(path,new Blob([Uint8Array.from(result.bytes)],{type:mime[format]}),{contentType:mime[format],upsert:false});
    if(upload.error)throw upload.error;uploaded=true;
    if(!active())throw Error("cancelled");
    const view=await inspectOfficeArtifact(result.bytes,format);
    const artifact:CreatedArtifact={id,format,filename,storagePath:path,mimeType:mime[format],byteSize:result.bytes.length};
    const row=await client.from("ai_artifacts").insert({id:artifact.id,user_id:owner,filename,mime_type:artifact.mimeType,storage_path:path,byte_size:artifact.byteSize,source_content:view.editableText,
     ...(parentId?{parent_artifact_id:parentId}:documentId?{source_document_id:documentId}:{})}).select("id").single();
    if(row.error||row.data?.id!==id)throw Error("save_failed");recorded=true;
    if(active()){onSaved?.();setStatus(t("تم حفظ التعديل في نسخة خاصة جديدة.","The edited copy was saved privately."));}
   }else{
    const url=URL.createObjectURL(new Blob([Uint8Array.from(result.bytes)],{type:mime[format]})),link=document.createElement("a");
    link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    setStatus(t("تم تنزيل نسخة معدّلة مع الحفاظ على أجزاء الملف الأخرى.","An edited copy was downloaded with the other package parts preserved."));
   }
  }catch{
   if(uploaded&&!recorded)await client.storage.from("noata-ai-artifacts").remove([path]).catch(()=>{});
   if(active())setError(t("تعذّر تطبيق التعديل أو حفظه. راجع القيمة وحاول مجددًا.","The edit or save failed. Check the replacement value and try again."));
  }finally{if(active()){lock.current=false;setBusy(false);}}
 }
 return <section className="noata-creative-editor noata-office-editor" aria-label={t("تعديل محدد يحافظ على الملف","Targeted edit preserving the file")}>
  <p>{t("اختر فقرة أو خلية وعدّلها داخل الملف الأصلي. نحافظ على الأجزاء الأخرى، ومنها الصور والتنسيقات والشرائح والصيغ.","Choose a paragraph or cell to revise inside the original package. Other parts, including images, styles, slides and formulas, are retained.")}</p>
  <p>{t("النص الجديد يأخذ تنسيق أول جزء من الفقرة. الحقول المعقدة والخلايا ذات الصيغ أو النصوص المشتركة غير قابلة للتعديل هنا. قد يحتاج النص الأطول إلى ضبط التخطيط في Office.","Replacement text inherits the paragraph's first text run style. Complex fields, formula cells and shared-string cells are excluded. Longer text may need layout adjustment in Office.")}</p>
  {format==="xlsx"&&<p>{t("بعد تعديل الأرقام، افتح النسخة في Excel وأعد حساب الصيغ؛ النتائج المحفوظة قد تكون قديمة.","After numeric changes, open the copy in Excel and recalculate formulas; cached results may be outdated.")}</p>}
  {error&&<p role="alert">{error}</p>}
  {targets.length>0&&<>
   <label>{t("الفقرة أو الخلية","Paragraph or cell")}<select disabled={busy} value={selected} onChange={e=>{const i=Number(e.target.value);setSelected(i);setReplacement(targets[i].text);setStatus("");}}>{targets.map((target,i)=><option key={target.part+":"+target.index} value={i}>{format==="pptx"?t("شريحة ","Slide ")+(target.part.match(/slide(\d+)/)?.[1]??""):format==="xlsx"?t("ورقة ","Sheet ")+(target.part.match(/sheet(\d+)/)?.[1]??""):t("فقرة","Paragraph")} · {target.index+1} · {target.text.slice(0,70)}</option>)}</select></label>
   <label>{t("النص الأصلي","Original text")}<textarea readOnly dir="auto" rows={2} value={targets[selected]?.text??""}/></label>
   <label>{t("النص البديل","Replacement text")}<textarea disabled={busy} dir="auto" rows={3} maxLength={5000} value={replacement} onChange={e=>{setReplacement(e.target.value);setStatus("");}}/></label>
   <div className="noata-creative-buttons"><button type="button" disabled={busy||replacement===targets[selected]?.text} onClick={()=>void deliver(false)}>{t("تنزيل التعديل المحدد","Download targeted revision")}</button><button type="button" disabled={busy||!owner||replacement===targets[selected]?.text} onClick={()=>void deliver(true)}>{t("حفظ التعديل المحدد","Save targeted revision")}</button></div>
  </>}
  {!targets.length&&!error&&<p role="status">{ready?t("لا توجد فقرات أو خلايا تدعم التعديل المحدد في هذا الملف.","This file has no paragraphs or cells supported by targeted editing."):t("نفحص الفقرات والخلايا القابلة للتعديل…","Inspecting editable paragraphs and cells…")}</p>}
  {status&&<p role="status">{status}</p>}
 </section>;
}
