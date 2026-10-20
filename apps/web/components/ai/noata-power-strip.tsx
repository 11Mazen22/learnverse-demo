"use client";
import {useEffect,useMemo,useState} from "react";
import {useTranslation} from "@/lib/i18n/locale";
import {createClient} from "@/lib/supabase/client";
import {AI_FUNCTION} from "@/lib/ai/workspace";
import type {CapabilityAvailability} from "../../../../supabase/functions/noata-ai/capabilities.ts";

/** The four real product powers, read from the live capability registry.
 * Nothing here is a static promise: unavailable capabilities are not listed. */
const showcase:{id:string;ar:string;en:string}[]=[
 {id:"chat",ar:"محادثة وتعلّم",en:"Learn and explain"},
 {id:"research.scholarly",ar:"بحث بمصادر حقيقية",en:"Research with real sources"},
 {id:"document.pdf",ar:"تقرير PDF كامل",en:"Full PDF report"},
 {id:"document.docx",ar:"ملف Word وExcel",en:"Word and Excel files"},
];

export function NoataPowerStrip({owner}:{owner:string|null}){
 const t=useTranslation(),supabase=useMemo(()=>createClient(),[]);
 const [available,setAvailable]=useState<Set<string>|null>(null);
 useEffect(()=>{
  if(!owner){setAvailable(null);return;}
  let live=true;
  void (async()=>{
   try{
    const {data,error}=await supabase.functions.invoke(AI_FUNCTION,{body:{action:"capabilities"}});
    if(error||!data||!Array.isArray(data.capabilities))throw Error("unavailable");
    const ids=new Set<string>();
    for(const row of data.capabilities as CapabilityAvailability[]){
     if(row&&typeof row.id==="string"&&(row.status==="configured"||row.status==="local"))ids.add(row.id);
    }
    if(live)setAvailable(ids);
   }catch{if(live)setAvailable(new Set());}
  })();
  return()=>{live=false;};
 },[owner,supabase]);
 if(!owner||!available)return null;
 const shown=showcase.filter(item=>available.has(item.id));
 if(shown.length<2)return null;
 return <ul className="noata-power-strip" aria-label={t("قدرات Noata AI المتاحة الآن","Noata AI capabilities available now")}>
  {shown.map(item=><li key={item.id}><span className="noata-power-dot" aria-hidden="true"/><span>{t(item.ar,item.en)}</span></li>)}
 </ul>;
}
