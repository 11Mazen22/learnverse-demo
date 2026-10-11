"use client";
import {useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import type {Conversation,Message} from "@/lib/ai/workspace";
import {SUGGESTION_CACHE_MS,validateSuggestionResult,welcomeDefaults,type AISuggestion,type SuggestionLocale,type SuggestionKind} from "../../../../supabase/functions/noata-ai/suggestions.ts";

type Options={
 userId:string|null;locale:SuggestionLocale;welcomeVisible:boolean;welcomeEpoch:number;
 conversations:Conversation[];messages:Message[];busy:boolean;temporary:boolean;
};
type Stored={created:number;signature:string;suggestions:AISuggestion[]};
const prefix="noata-ai-suggestions-v1";
const preferenceKey=(id:string)=>prefix+":personalize:"+id;
function fingerprint(value:string){
 let hash=2166136261;
 for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return (hash>>>0).toString(36);
}
function readCache(key:string,signature:string):AISuggestion[] {
 try{
  const cached=JSON.parse(sessionStorage.getItem(key)??"null") as Stored|null;
  if(!cached||cached.signature!==signature||Date.now()-cached.created>SUGGESTION_CACHE_MS)return [];
  return validateSuggestionResult(cached,"welcome");
 }catch{return [];}
}
function storeCache(key:string,signature:string,suggestions:AISuggestion[]){
 try{sessionStorage.setItem(key,JSON.stringify({created:Date.now(),signature,suggestions} satisfies Stored));}catch{/* Private mode or quota. */}
}
/** Suggestions never block navigation, message rendering or sending. */
export function useAISuggestions({userId,locale,welcomeVisible,welcomeEpoch,conversations,messages,busy,temporary}:Options){
 const supabase=useMemo(()=>createClient(),[]);
 const [preference,setPreference]=useState<{owner:string;enabled:boolean}>({owner:"",enabled:false});
 const [welcome,setWelcome]=useState<AISuggestion[]>(()=>welcomeDefaults(locale));
 const [followups,setFollowups]=useState<AISuggestion[]>([]);
 const personalized=Boolean(userId&&preference.owner===userId&&preference.enabled&&!temporary);
 const preferenceReady=!userId||preference.owner===userId;
 const recentSignature=conversations.slice(0,6).map(c=>c.id+":"+c.title+":"+c.updated_at).join("|");
 const signature=fingerprint((personalized?recentSignature:"general")+":"+locale);
 const lastAssistant=messages.at(-1);
 const lastUser=[...messages].reverse().find(m=>m.role==="user");
 const assistantId=!busy&&lastAssistant?.role==="assistant"&&lastAssistant.status==="complete" ? lastAssistant.id:"";
 const answer=assistantId?lastAssistant?.content??"":"";
 const question=assistantId?lastUser?.content??"":"";

 useEffect(()=>{
  if(!userId){setPreference({owner:"",enabled:false});return;}
  let enabled=false;
  try{enabled=localStorage.getItem(preferenceKey(userId))==="enabled";}catch{/* Storage unavailable. */}
  setPreference({owner:userId,enabled});
 },[userId]);
 function changePersonalized(enabled:boolean){
  if(!userId)return;
  try{localStorage.setItem(preferenceKey(userId),enabled?"enabled":"disabled");}catch{/* Session remains usable. */}
  setPreference({owner:userId,enabled});
 }
 useEffect(()=>{
  let active=true;
  setWelcome(welcomeDefaults(locale));
  if(!welcomeVisible||!userId||!preferenceReady)return;
  const cacheKey=prefix+":welcome:"+userId+":"+locale+":"+(personalized?"yes":"no");
  const cached=readCache(cacheKey,signature);
  if(cached.length===4){setWelcome(cached);return;}
  const controller=new AbortController();
  void (async()=>{
   try{
    const {data,error}=await supabase.functions.invoke("noata-ai",{
     body:{action:"suggestions",kind:"welcome",locale,personalize:personalized,temporary},
     signal:controller.signal,
    });
    if(error||!active)return;
    const valid=validateSuggestionResult(data,"welcome");
    if(valid.length===4){setWelcome(valid);storeCache(cacheKey,signature,valid);}
   }catch{/* Preserve four instant local actions when the AI provider is unavailable. */}
  })();
  return ()=>{active=false;controller.abort();};
 },[locale,userId,preferenceReady,welcomeVisible,welcomeEpoch,personalized,temporary,signature,supabase]);
 useEffect(()=>{
  let active=true;
  setFollowups([]);
  if(!userId||!assistantId||!question||!answer||temporary)return;
  const controller=new AbortController();
  void (async()=>{
   try{
    const {data,error}=await supabase.functions.invoke("noata-ai",{
     body:{action:"suggestions",kind:"followup",locale,question:question.slice(0,300),answer:answer.slice(0,900)},
     signal:controller.signal,
    });
    if(error||!active)return;
    const valid=validateSuggestionResult(data,"followup");
    if(valid.length>=3)setFollowups(valid);
   }catch{/* No fabricated follow-up suggestions on provider failure. */}
  })();
  return ()=>{active=false;controller.abort();};
 },[userId,assistantId,question,answer,locale,temporary,supabase]);
 return {welcome,followups,personalized,changePersonalized};
}
export function SuggestedActions({kind,locale,items,disabled,onChoose}:{
 kind:SuggestionKind;locale:SuggestionLocale;items:AISuggestion[];disabled:boolean;onChoose:(prompt:string)=>void;
}){
 if(!items.length)return null;
 return <section className={"noata-suggested-actions "+kind} aria-label={kind==="welcome"?(locale==="ar"?"اقتراحات لبدء المحادثة":"Conversation starters"):(locale==="ar"?"اقتراحات للمتابعة":"Suggested next steps")}>
  {kind==="followup"&&<p className="noata-suggested-label">{locale==="ar"?"ممكن نكمّل بـ":"Explore next"}</p>}
  <div className="noata-suggested-grid">
   {items.map((item,index)=><button type="button" key={item.id+"-"+item.title} className="noata-suggested-item"
    style={{animationDelay:Math.min(index*45,180)+"ms"}} disabled={disabled}
    onClick={()=>onChoose(item.prompt)} title={item.prompt}>
    <span className="noata-suggested-spark" aria-hidden="true">✧</span>
    <span>{item.title}</span><span className="noata-suggested-arrow" aria-hidden="true">↗</span>
   </button>)}
  </div>
 </section>;
}
