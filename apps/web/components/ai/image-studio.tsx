"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import {artifactFilename} from "@/lib/ai/artifact-filename";
import {initialImageEdit,imageGeometry,renderEditedImage,imageCanvasBlob,type ImageEdit} from "@/lib/ai/image-edit";
import {downloadBytes} from "./creative-studio";
export function NoataImageStudio({url,name,sourceId,owner,onSaved,onUse}:{url:string;name:string;sourceId:string;owner:string|null;onSaved?:()=>void;onUse?:(file:File)=>void}){
 const t=useTranslation(),locale=useLocale(),supabase=useMemo(()=>createClient(),[]);
 const [bitmap,setBitmap]=useState<ImageBitmap|null>(null),[edit,setEdit]=useState<ImageEdit>({...initialImageEdit});
 const [original,setOriginal]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[status,setStatus]=useState("");
 const canvas=useRef<HTMLCanvasElement>(null),ticket=useRef(""),locked=useRef(false);
 ticket.current=owner+":"+sourceId+":"+url;
 useEffect(()=>{
  let active=true,image:ImageBitmap|undefined;setBitmap(null);setEdit({...initialImageEdit});setOriginal(false);setBusy(false);locked.current=false;setError("");setStatus("");
  void(async()=>{
   try{
    if(!url.startsWith("blob:"))throw Error("invalid_image_source");
    const response=await fetch(url),blob=await response.blob();
    if(blob.size>10*1024*1024||!["image/png","image/jpeg","image/webp"].includes(blob.type))throw Error("unsupported_image");
    image=await createImageBitmap(blob);imageGeometry(image.width,image.height,initialImageEdit);
    if(active)setBitmap(image);else image.close();
   }catch{if(active)setError(t("تعذّر فتح الصورة. نستخدم PNG وJPEG وWebP حتى 10 ميغابايت.","Could not open this image. Use PNG, JPEG or WebP up to 10 MB."));}
  })();
  return()=>{active=false;ticket.current="";image?.close();};
 },[url,sourceId,owner,t]);
 useEffect(()=>{
  if(!bitmap||!canvas.current)return;
  let active=true;
  const timer=setTimeout(()=>{void(async()=>{
   try{
    const font=edit.font==="editorial"?"Noäta Image Lora":edit.font==="mono"?"Noäta Image Mono":"Noäta Image Cairo";
    if(edit.caption)await document.fonts.load('600 32px "'+font+'"');
    if(active&&canvas.current)renderEditedImage(canvas.current,bitmap,edit,1024);
   }catch{if(active)setError(t("تعذّر تحديث المعاينة.","Could not update the preview."));}
  })();},80);
  return()=>{active=false;clearTimeout(timer);};
 },[bitmap,edit,t,original]);
 function change<K extends keyof ImageEdit>(key:K,value:ImageEdit[K]){setEdit(old=>({...old,[key]:value}));setStatus("");}
 async function exportImage(action:"download"|"save"|"use"){
  if(!bitmap||locked.current||(!owner&&action==="save"))return;
  const operation=ticket.current;locked.current=true;setBusy(true);setError("");setStatus("");
  let path="",uploaded=false,recorded=false;
  const id=crypto.randomUUID();
  try{
   if(edit.caption){const font=edit.font==="editorial"?"Noäta Image Lora":edit.font==="mono"?"Noäta Image Mono":"Noäta Image Cairo";await document.fonts.load('600 32px "'+font+'"',edit.caption);await document.fonts.load('600 32px "Noäta Image Cairo"',edit.caption);}
   const output=document.createElement("canvas");
   renderEditedImage(output,bitmap,edit);
   const blob=await imageCanvasBlob(output);
   if(ticket.current!==operation)throw Error("cancelled");
   const filename=artifactFilename({format:"png",title:name,locale,revision:true});
   if(action==="download")downloadBytes(new Uint8Array(await blob.arrayBuffer()),filename,"image/png");
   else if(action==="use")onUse?.(new File([blob],filename,{type:"image/png"}));
   else{
    if(!owner)throw Error("sign_in_required");
    const verified=await supabase.auth.getUser();
    if(verified.error||verified.data.user?.id!==owner||ticket.current!==operation)throw Error("account_changed");
    path=owner+"/"+id+"/edited.png";
    const upload=await supabase.storage.from("noata-uploads").upload(path,blob,{contentType:"image/png",upsert:false});
    if(upload.error)throw upload.error;uploaded=true;
    if(ticket.current!==operation)throw Error("cancelled");
    const row=await supabase.from("ai_attachments").insert({id,user_id:owner,storage_path:path,mime_type:"image/png",
      size_bytes:blob.size,filename,library_saved:true}).select("id").single();
    if(row.error||row.data?.id!==id)throw row.error??Error("image_save_failed");recorded=true;
    if(ticket.current===operation){onSaved?.();setStatus(t("حُفظت نسخة معدّلة في المكتبة. الصورة الأصلية محفوظة كما هي.","Edited copy saved to your library. The original image remains unchanged."));}
   }
  }catch{
   if(uploaded&&!recorded)await supabase.storage.from("noata-uploads").remove([path]).catch(()=>{});
   if(ticket.current===operation)setError(t("تعذّر إنهاء العملية. الصورة الأصلية ما زالت محفوظة.","Could not finish this action. Your original image is still preserved."));
  }finally{locked.current=false;if(ticket.current===operation)setBusy(false);}
 }
 const g=bitmap?imageGeometry(bitmap.width,bitmap.height,edit):null;
 return <section className="noata-image-studio" aria-label={t("استوديو الصور","Image studio")}>
  <header><h4>{t("اصنع نسخة تناسب فكرتك","Shape an image for your idea")}</h4><p>{t("قصّ، تدوير، تحسين الألوان وإضافة نص. راجع النتيجة قبل حفظ نسخة جديدة.","Crop, rotate, adjust colors and add a caption. Preview the result before saving a new copy.")}</p></header>
  {error&&<p role="alert">{error}</p>}
  {!bitmap&&!error&&<p role="status">{t("جارٍ فتح الصورة…","Opening image…")}</p>}
  {bitmap&&<>
   <div className="noata-image-preview">{original?<img src={url} alt={t("الصورة الأصلية: ","Original: ")+name}/>:<canvas ref={canvas} role="img" aria-label={t("معاينة الصورة المعدّلة","Edited image preview")}/>}</div>
   <div className="noata-image-toolbar"><button type="button" aria-pressed={original} onClick={()=>setOriginal(x=>!x)}>{original?t("عرض التعديل","Show edit"):t("قارن بالأصل","Compare original")}</button><span dir="ltr">{g?.width} × {g?.height} px</span><button type="button" disabled={busy} onClick={()=>{setEdit({...initialImageEdit});setOriginal(false);setStatus("");}}>{t("إعادة الضبط","Reset edits")}</button></div>
   <fieldset disabled={busy} className="noata-image-controls"><legend>{t("التعديلات","Adjustments")}</legend>
    <label>{t("شكل القص","Crop shape")}<select value={edit.crop} onChange={e=>change("crop",e.target.value as ImageEdit["crop"])}><option value="original">{t("الأبعاد الأصلية","Original ratio")}</option><option value="square">{t("مربع","Square")}</option><option value="landscape">{t("عريض 16:9","Landscape 16:9")}</option><option value="portrait">{t("طولي 4:5","Portrait 4:5")}</option></select></label>
    <label>{t("التدوير","Rotation")}<select value={edit.rotation} onChange={e=>change("rotation",Number(e.target.value) as ImageEdit["rotation"])}>{[0,90,180,270].map(n=><option key={n} value={n}>{n}°</option>)}</select></label>
    <label className="noata-image-check"><input type="checkbox" checked={edit.flip} onChange={e=>change("flip",e.target.checked)}/>{t("انعكاس أفقي","Flip horizontally")}</label>
    {edit.crop!=="original"&&(["cropX","cropY"] as const).map(key=><label key={key}>{key==="cropX"?t("موضع القص الأفقي","Horizontal crop position"):t("موضع القص الرأسي","Vertical crop position")}<input type="range" min={0} max={100} value={edit[key]} onChange={e=>change(key,Number(e.target.value))}/></label>)}
    {(["brightness","contrast","saturation"] as const).map(key=><label key={key}>{key==="brightness"?t("الإضاءة","Brightness"):key==="contrast"?t("التباين","Contrast"):t("تشبع الألوان","Saturation")}<output>{Math.round(edit[key]*100)}%</output><input aria-label={key==="brightness"?t("الإضاءة","Brightness"):key==="contrast"?t("التباين","Contrast"):t("تشبع الألوان","Saturation")} type="range" min={key==="saturation"?0:0.5} max={key==="saturation"?2:1.5} step={0.05} value={edit[key]} onChange={e=>change(key,Number(e.target.value))}/></label>)}
    <label className="noata-image-caption">{t("نص على الصورة","Caption")}<input type="text" dir="auto" maxLength={120} value={edit.caption} onChange={e=>change("caption",e.target.value)} placeholder={t("أضف عنوانًا أو فكرة قصيرة…","Add a title or short thought…")}/></label>
    {edit.caption&&<><label>{t("الخط","Font")}<select value={edit.font} onChange={e=>change("font",e.target.value as ImageEdit["font"])}><option value="noata">Cairo</option><option value="editorial">Lora</option><option value="mono">Roboto Mono</option></select></label><label>{t("موضع النص","Caption position")}<select value={edit.captionPosition} onChange={e=>change("captionPosition",e.target.value as ImageEdit["captionPosition"])}><option value="top">{t("أعلى","Top")}</option><option value="bottom">{t("أسفل","Bottom")}</option></select></label><label>{t("لون النص","Caption color")}<input type="color" value={edit.captionColor} onChange={e=>change("captionColor",e.target.value)}/></label></>}
   </fieldset>
   <div className="noata-image-actions"><button type="button" disabled={busy} onClick={()=>void exportImage("download")}>{t("تنزيل PNG","Download PNG")}</button><button type="button" disabled={busy||!owner} onClick={()=>void exportImage("save")}>{busy?t("جارٍ الحفظ…","Saving…"):t("حفظ نسخة معدّلة","Save edited copy")}</button>{onUse&&<button type="button" disabled={busy} onClick={()=>void exportImage("use")}>{t("استخدم النسخة في المحادثة","Use edited copy in chat")}</button>}</div>
   {bitmap.width>4096||bitmap.height>4096?<p>{t("التصدير حتى 4096 بكسل؛ يمكنك تنزيل الأصل كاملًا من المكتبة.","Export is limited to 4096 pixels. Download the full original from the library.")}</p>:null}
  </>}
  {status&&<p role="status">{status}</p>}
 </section>;
}
