"use client";
import {useEffect,useState} from "react";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import {
  MOTION_PREFERENCE_EVENT,
  applyAndPersistMotionPreference,
  readScopedMotionPreference,
  readServerReducedMotionFlag,
  safeMotionMode,
  syncMotionDomAttributes,
  type MotionPreferenceMode,
} from "@/lib/appearance/device-preferences";

export type MotionMode = MotionPreferenceMode;
export const validMotion = safeMotionMode;

/** Apply saved device preference when the workspace mounts, before Settings is opened. */
export function useNoataMotionPreference(){
 const [mode,setMode]=useState<MotionMode>("system");
 useEffect(()=>{
  const update=()=>{
    const value=readScopedMotionPreference();
    setMode(value);
    syncMotionDomAttributes({
      mode:value,
      serverReducedMotion:readServerReducedMotionFlag(),
    });
  };
  update();window.addEventListener("storage",update);window.addEventListener(MOTION_PREFERENCE_EVENT,update);
  return()=>{window.removeEventListener("storage",update);window.removeEventListener(MOTION_PREFERENCE_EVENT,update);};
 },[]);
 function choose(next:MotionMode){
  setMode(next);
  applyAndPersistMotionPreference(next,{
    serverReducedMotion:readServerReducedMotionFlag(),
  });
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
