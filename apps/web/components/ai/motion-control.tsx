"use client";
import {useEffect,useState} from "react";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
export type MotionMode="system"|"full"|"reduce"|"off";
const KEY="noata-ai-motion-v1",EVENT="noata:motion-preference";
export const validMotion=(v:unknown):MotionMode=>v==="full"||v==="reduce"||v==="off"?v:"system";
function readMotion(){try{return validMotion(localStorage.getItem(KEY));}catch{return "system" as const;}}
function applyMotion(mode:MotionMode){
 if(mode==="system")document.documentElement.removeAttribute("data-noata-motion");
 else document.documentElement.setAttribute("data-noata-motion",mode);
}
/** Apply saved device preference when the workspace mounts, before Settings is opened. */
export function useNoataMotionPreference(){
 const [mode,setMode]=useState<MotionMode>("system");
 useEffect(()=>{
  const update=()=>{const value=readMotion();setMode(value);applyMotion(value);};
  update();window.addEventListener("storage",update);window.addEventListener(EVENT,update);
  return()=>{window.removeEventListener("storage",update);window.removeEventListener(EVENT,update);};
 },[]);
 function choose(next:MotionMode){
  setMode(next);applyMotion(next);
  try{localStorage.setItem(KEY,next);window.dispatchEvent(new Event(EVENT));}catch{/* Session-only preference remains applied. */}
 }
 return {mode,choose};
}
export function NoataMotionControl(){
 const locale=useLocale(),t=useTranslation(),{mode,choose}=useNoataMotionPreference();
 const items: {id:MotionMode;ar:string;en:string}[]=[
  {id:"system",ar:"تلقائي",en:"System"},{id:"full",ar:"حركة ناعمة",en:"Full"},
  {id:"reduce",ar:"حركة أقل",en:"Reduced"},{id:"off",ar:"بدون حركة",en:"Off"}
 ];
 return <fieldset className="noata-motion-field">
  <legend>{t("حركة واجهة Noäta","Noäta interface motion")}</legend>
  <p>{t("إعداد محفوظ على هذا الجهاز. يظل تفضيل النظام لتقليل الحركة أولوية.","Saved on this device. Your system's reduced-motion preference takes priority.")}</p>
  <div className="noata-motion-options" dir={locale==="en"?"ltr":"rtl"}>
   {items.map(x=><label className={mode===x.id?"active":""} key={x.id}>
    <input type="radio" name="noata-motion-mode" value={x.id} checked={mode===x.id} onChange={()=>choose(x.id)}/>
    <span>{locale==="en"?x.en:x.ar}</span>
   </label>)}
  </div>
 </fieldset>;
}
