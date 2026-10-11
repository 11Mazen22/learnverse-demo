"use client";
import {useEffect,useState} from "react";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
export type MotionMode="system"|"full"|"reduce"|"off";
const KEY="noata-ai-motion-v1";
export const validMotion=(v:unknown):MotionMode=>v==="full"||v==="reduce"||v==="off"?v:"system";
function applyMotion(mode:MotionMode){
 if(mode==="system")document.documentElement.removeAttribute("data-noata-motion");
 else document.documentElement.setAttribute("data-noata-motion",mode);
}
export function NoataMotionControl(){
 const locale=useLocale(),t=useTranslation();
 const [mode,setMode]=useState<MotionMode>("system");
 useEffect(()=>{
  let value:MotionMode="system";
  try{value=validMotion(localStorage.getItem(KEY));}catch{/* Restricted storage. */}
  setMode(value);applyMotion(value);
 },[]);
 function choose(next:MotionMode){
  setMode(next);applyMotion(next);
  try{localStorage.setItem(KEY,next);}catch{/* Session-only preference. */}
 }
 const items: {id:MotionMode;ar:string;en:string}[]=[
  {id:"system",ar:"تلقائي",en:"System"},
  {id:"full",ar:"حركة ناعمة",en:"Full"},
  {id:"reduce",ar:"حركة أقل",en:"Reduced"},
  {id:"off",ar:"بدون حركة",en:"Off"}
 ];
 return <fieldset className="noata-motion-field">
  <legend>{t("حركة واجهة Noata","Noata interface motion")}</legend>
  <p>{t("اختر درجة الحركة المناسبة لجهازك. نحترم إعدادات تقليل الحركة الخاصة بالنظام.","Choose the animation level for this device. System reduced-motion settings remain respected.")}</p>
  <div className="noata-motion-options" dir={locale==="en"?"ltr":"rtl"}>
   {items.map(x=><label className={mode===x.id?"active":""} key={x.id}>
    <input type="radio" name="noata-motion-mode" value={x.id} checked={mode===x.id} onChange={()=>choose(x.id)}/>
    <span>{locale==="en"?x.en:x.ar}</span>
   </label>)}
  </div>
 </fieldset>;
}
