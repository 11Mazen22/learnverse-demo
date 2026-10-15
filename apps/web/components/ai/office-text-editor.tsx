"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import {createClient} from "@/lib/supabase/client";
import {MAX_OFFICE_TEXT_EDITS,mergeOfficeTextEdits,officeTextTargets,queueOfficeTextEdit,reviseOfficeText,type OfficeFormat,type OfficeTextEdit,type OfficeTextTarget} from "@/lib/ai/office-preservation";
import {artifactFilename} from "@/lib/ai/artifact-filename";
import {inspectOfficeArtifact} from "@/lib/ai/studio-file-inspect";
import type {CreatedArtifact} from "@/lib/ai/artifact-runner";
const mime:Record<OfficeFormat,string>={docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"};
export function OfficeTextEditor({source,format,name,owner,parentId,documentId,onSaved}:{source:Blob;format:OfficeFormat;name:string;owner:string|null;parentId?:string;documentId?:string;onSaved?:()=>void}){
 const t=useTranslation(),locale=useLocale(),client=useMemo(()=>createClient(),[]);
 const [targets,setTargets]=useState<OfficeTextTarget[]>([]),[selected,setSelected]=useState(0),[replacement,setReplacement]=useState(""),[queuedEdits,setQueuedEdits]=useState<OfficeTextEdit[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[status,setStatus]=useState("");
 const [ready,setReady]=useState(false);
 const identity=useRef({source,owner});if(identity.current.source!==source||identity.current.owner!==owner)identity.current={source,owner};
 const lock=useRef(false);
 const generation=useRef(0);
 useEffect(()=>{
  generation.current++;
  let alive=true;setReady(false);setTargets([]);setSelected(0);setReplacement("");setQueuedEdits([]);setError("");setStatus("");setBusy(false);lock.current=false;
  void source.arrayBuffer().then(data=>officeTextTargets(new Uint8Array(data),format)).then(items=>{
   if(alive){setReady(true);setTargets(items);setReplacement(items[0]?.text??"");}
  }).catch(()=>{if(alive)setError(t("هذا الملف لا يدعم التعديل المحدد. يمكنك تنزيل الأصل أو إنشاء نسخة من المحتوى المستخرج.","Targeted editing is unavailable for this package. Download the original or create a revision from extracted content."));});
  return()=>{alive=false;generation.current++;};
 },[source,format,owner,locale]);
 async function deliver(save:boolean){
  const planned=mergeOfficeTextEdits(queuedEdits,targets[selected],replacement);if(lock.current||!planned.length)return;if(planned.length>MAX_OFFICE_TEXT_EDITS){setError(t("يمكنك تطبيق 30 تعديلًا كحد أقصى في كل نسخة.","A revision can contain at most 30 changes."));return;}
  lock.current=true;setBusy(true);setError("");setStatus("");
  const ticket=identity.current,epoch=generation.current,active=()=>identity.current===ticket&&generation.current===epoch;let path="",uploaded=false,recorded=false;
  try{
   const result=await reviseOfficeText(new Uint8Array(await source.arrayBuffer()),format,planned);
   if(!active())return;
   const filename=artifactFilename({format,title:name,content:planned.map(edit=>edit.replacement).join("\n"),locale,revision:true});
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
    if(active()){setQueuedEdits([]);setReplacement(targets[selected]?.text??"");setStatus(planned.length===1?t("تم حفظ التعديل في نسخة خاصة جديدة.","The edited copy was saved privately."):t("تم حفظ "+planned.length+" تعديلات في نسخة خاصة جديدة.","Saved "+planned.length+" changes in a new private revision."));onSaved?.();}
   }else{
    const url=URL.createObjectURL(new Blob([Uint8Array.from(result.bytes)],{type:mime[format]})),link=document.createElement("a");
    link.href=url;link.download=filename;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    setStatus(planned.length===1?t("تم تنزيل نسخة معدّلة مع الحفاظ على أجزاء الملف الأخرى.","An edited copy was downloaded with the other package parts preserved."):t("تم تنزيل نسخة تتضمن "+planned.length+" تعديلات.","Downloaded a revision containing "+planned.length+" changes."));
   }
  }catch{
   if(uploaded&&!recorded)await client.storage.from("noata-ai-artifacts").remove([path]).catch(()=>{});
   if(active())setError(t("تعذّر تطبيق التعديل أو حفظه. راجع القيمة وحاول مجددًا.","The edit or save failed. Check the replacement value and try again."));
  }finally{if(active()){lock.current=false;setBusy(false);}}
 }
 const targetLabel=(target:OfficeTextTarget)=>{const number=target.part.match(/(?:slide|sheet)(\d+)/)?.[1]??"";const location=format==="pptx"?t("شريحة ","Slide ")+number:format==="xlsx"?t("ورقة ","Sheet ")+number:t("فقرة","Paragraph");return location+" · "+(target.index+1);};
 const activeTarget=targets[selected];
 const hasChanges=queuedEdits.length>0||Boolean(activeTarget&&replacement!==activeTarget.text);
 return <section className="noata-creative-editor noata-office-editor" aria-label={t("تعديل محدد يحافظ على الملف","Targeted edit preserving the file")}>
  <p>{t("اختر فقرة أو خلية وعدّلها داخل الملف الأصلي. نحافظ على الأجزاء الأخرى، ومنها الصور والتنسيقات والشرائح والصيغ.","Choose a paragraph or cell to revise inside the original package. Other parts, including images, styles, slides and formulas, are retained.")}</p>
  <p>{t("النص الجديد يأخذ تنسيق أول جزء من الفقرة. الحقول المعقدة والخلايا ذات الصيغ أو النصوص المشتركة غير قابلة للتعديل هنا. قد يحتاج النص الأطول إلى ضبط التخطيط في Office.","Replacement text inherits the paragraph's first text run style. Complex fields, formula cells and shared-string cells are excluded. Longer text may need layout adjustment in Office.")}</p>
  {format==="xlsx"&&<p>{t("بعد تعديل الأرقام، افتح النسخة في Excel وأعد حساب الصيغ؛ النتائج المحفوظة قد تكون قديمة.","After numeric changes, open the copy in Excel and recalculate formulas; cached results may be outdated.")}</p>}
  {error&&<p role="alert">{error}</p>}
  {targets.length>0&&<>
   <label>{t("الفقرة أو الخلية","Paragraph or cell")}<select disabled={busy} value={selected} onChange={e=>{const i=Number(e.target.value),target=targets[i];setSelected(i);setReplacement(queuedEdits.find(edit=>edit.part===target.part&&edit.index===target.index)?.replacement??target.text);setStatus("");}}>{targets.map((target,i)=><option key={target.part+":"+target.index} value={i}>{targetLabel(target)} · {target.text.slice(0,70)}</option>)}</select></label>
   <label>{t("النص الأصلي","Original text")}<textarea readOnly dir="auto" rows={2} value={targets[selected]?.text??""}/></label>
   <label>{t("النص البديل","Replacement text")}<textarea disabled={busy} dir="auto" rows={3} maxLength={5000} value={replacement} onChange={e=>{setReplacement(e.target.value);setStatus("");}}/></label>
   {queuedEdits.length>0&&<div className="noata-office-edit-queue">
    <p role="status">{t("تم تجهيز "+queuedEdits.length+" تعديلات لتطبيقها معًا.",queuedEdits.length+" changes queued for one revision.")}</p>
    <ul>{queuedEdits.map(edit=><li key={edit.part+":"+edit.index}><span><strong>{targetLabel(edit)}</strong><small dir="auto">{edit.replacement||t("نص فارغ","(empty text)")}</small></span><button type="button" disabled={busy} onClick={()=>{setQueuedEdits(current=>current.filter(item=>item.part!==edit.part||item.index!==edit.index));if(activeTarget?.part===edit.part&&activeTarget.index===edit.index)setReplacement(activeTarget.text);setStatus("");}}>{t("إزالة","Remove")}</button></li>)}</ul>
   </div>}
   <div className="noata-office-edit-queue-controls">
    <button type="button" disabled={busy||!activeTarget||replacement===activeTarget.text} onClick={()=>{if(!activeTarget)return;const exists=queuedEdits.some(edit=>edit.part===activeTarget.part&&edit.index===activeTarget.index);if(!exists&&queuedEdits.length>=MAX_OFFICE_TEXT_EDITS){setStatus(t("وصلت إلى الحد الأقصى وهو 30 تعديلًا للنسخة الواحدة.","This revision already has the maximum of 30 changes."));return;}setQueuedEdits(current=>queueOfficeTextEdit(current,activeTarget,replacement));setStatus(exists?t("تم تحديث التعديل في القائمة.","Updated the queued change."):t("تمت إضافة التعديل إلى القائمة؛ يمكنك اختيار فقرة أو خلية أخرى.","Change queued. You can select another paragraph or cell."));}}>{queuedEdits.some(edit=>edit.part===activeTarget?.part&&edit.index===activeTarget?.index)?t("تحديث التعديل في القائمة","Update queued change"):t("إضافة التعديل إلى القائمة","Queue this change")}</button>
    <div className="noata-creative-buttons"><button type="button" disabled={busy||!hasChanges} onClick={()=>void deliver(false)}>{t("تنزيل النسخة المعدّلة","Download edited copy")}</button><button type="button" disabled={busy||!owner||!hasChanges} onClick={()=>void deliver(true)}>{t("حفظ نسخة معدّلة","Save edited copy")}</button></div>
   </div>
  </>}
  {!targets.length&&!error&&<p role="status">{ready?t("لا توجد فقرات أو خلايا تدعم التعديل المحدد في هذا الملف.","This file has no paragraphs or cells supported by targeted editing."):t("نفحص الفقرات والخلايا القابلة للتعديل…","Inspecting editable paragraphs and cells…")}</p>}
  {status&&<p role="status">{status}</p>}
 </section>;
}
