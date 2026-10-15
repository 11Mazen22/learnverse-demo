"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import {serializeMemoryExport} from "@/lib/ai/memory-export";
import {canMutateSavedMemory} from "@/lib/ai/memory-settings-policy";

type MemoryRow={id:string;user_id:string;content:string;created_at:string;updated_at:string};
type Props={owner:string|null;open:boolean;temporary:boolean};
export function NoataMemorySettings({owner,open,temporary}:Props){
 const t=useTranslation(),locale=useLocale(),supabase=useMemo(()=>createClient(),[]);
 const [enabled,setEnabled]=useState(false),[items,setItems]=useState<MemoryRow[]>([]);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const [draft,setDraft]=useState(""),[editing,setEditing]=useState<string|null>(null),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const ownerRef=useRef(owner);ownerRef.current=owner;
 useEffect(()=>{
  let active=true;
  setItems([]);setEnabled(false);setError("");setNotice("");setDraft("");setEditing(null);
  setLoading(Boolean(open&&owner));
  if(!open||!owner)return;
  void (async()=>{
   try{
    const [consent,memories]=await Promise.all([
     supabase.from("ai_memory_consent").select("enabled").eq("user_id",owner).maybeSingle(),
     supabase.from("ai_user_memories").select("id,user_id,content,created_at,updated_at").eq("user_id",owner).order("updated_at",{ascending:false}).limit(50)
    ]);
    if(!active||ownerRef.current!==owner)return;
    if(consent.error)throw consent.error;
    if(memories.error)throw memories.error;
    setEnabled(consent.data?.enabled===true);setItems(memories.data??[]);
   }catch{
    if(active&&ownerRef.current===owner)setError(t("تعذّر تحميل الذاكرة. لم تُغيَّر أي إعدادات.","Could not load memory. No settings were changed."));
   }finally{if(active&&ownerRef.current===owner)setLoading(false);}
  })();
  return ()=>{active=false;};
 },[open,owner,supabase,locale]);
 async function run(action:()=>Promise<void>){
  if(!owner||!canMutateSavedMemory(temporary)||busy||loading)return;
  setBusy(true);setError("");setNotice("");
  try{await action();}catch{
   if(ownerRef.current===owner)setError(t("تعذّر حفظ التغيير. حاول مرة أخرى.","Could not save the change. Please try again."));
  }finally{if(ownerRef.current===owner)setBusy(false);}
 }
 async function changeConsent(){
  if(!owner||!canMutateSavedMemory(temporary))return;
  const next=!enabled;
  await run(async()=>{
   const {error}=await supabase.from("ai_memory_consent").upsert({user_id:owner,enabled:next,updated_at:new Date().toISOString()},{onConflict:"user_id"});
   if(error)throw error;
   if(ownerRef.current===owner){setEnabled(next);setNotice(next?t("تم تفعيل الذاكرة بموافقتك.","Memory enabled with your consent."):t("تم إيقاف استخدام الذاكرة في الردود.","Memory will not be used in responses."));}
  });
 }
 async function save(){
  if(!owner||!canMutateSavedMemory(temporary))return;
  const content=draft.trim().replace(/\s+/g," ");
  if(content.length<8||content.length>500){setError(t("اكتب ذاكرة من ٨ إلى ٥٠٠ حرف.","Enter a memory between 8 and 500 characters."));return;}
  if(!editing&&items.length>=50){setError(t("وصلت للحد الحالي (٥٠ ذاكرة). احذف واحدة أولًا.","You reached the current 50-memory limit. Delete one first."));return;}
  await run(async()=>{
   if(editing){
    const {data,error}=await supabase.from("ai_user_memories").update({content,updated_at:new Date().toISOString()}).eq("id",editing).eq("user_id",owner).select("id,user_id,content,created_at,updated_at").single();
    if(error)throw error;
    if(ownerRef.current===owner)setItems(old=>old.map(item=>item.id===editing?data:item));
   }else{
    const {data,error}=await supabase.from("ai_user_memories").insert({user_id:owner,content,source:"manual"}).select("id,user_id,content,created_at,updated_at").single();
    if(error)throw error;
    if(ownerRef.current===owner)setItems(old=>[data,...old]);
   }
   if(ownerRef.current===owner){setDraft("");setEditing(null);setNotice(t("تم حفظ الذاكرة.","Memory saved."));}
  });
 }
 async function remove(id:string){
  if(!owner||!canMutateSavedMemory(temporary))return;
  if(!window.confirm(t("هل تريد حذف هذه الذاكرة نهائيًا؟","Permanently delete this memory?")))return;
  await run(async()=>{
   const {error}=await supabase.from("ai_user_memories").delete().eq("id",id).eq("user_id",owner);
   if(error)throw error;
   if(ownerRef.current===owner){setItems(old=>old.filter(x=>x.id!==id));setNotice(t("تم حذف الذاكرة.","Memory deleted."));}
  });
 }
 async function clearAll(){
  if(!owner||!canMutateSavedMemory(temporary)||!items.length)return;
  if(!window.confirm(t("هل تريد حذف كل الذكريات المحفوظة نهائيًا؟","Permanently delete all saved memories?")))return;
  await run(async()=>{
   const {error}=await supabase.from("ai_user_memories").delete().eq("user_id",owner);
   if(error)throw error;
   if(ownerRef.current===owner){setItems([]);setNotice(t("تم حذف كل الذكريات المحفوظة.","All saved memories deleted."));}
  });
 }
 async function exportMemories(){
  if(!owner||loading||busy||items.length===0)return;
  try{
   const exportedAt=new Date().toISOString();
   const contents=serializeMemoryExport(items,enabled,exportedAt);
   const url=URL.createObjectURL(new Blob([contents],{type:"application/json;charset=utf-8"}));
   const link=document.createElement("a");
   link.href=url;
   link.download="noata-memory-"+exportedAt.slice(0,10)+".json";
   document.body.append(link);link.click();link.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),15000);
   setError("");setNotice(t("تم تنزيل نسخة JSON من ذكرياتك المحفوظة.","Downloaded a JSON export of your saved memories."));
  }catch{
   setError(t("تعذّر تجهيز ملف التصدير. لم يتم تغيير ذكرياتك.","Could not prepare the export file. Your memories were not changed."));
  }
 }
 return <section className="noata-memory-panel" aria-label={t("الذاكرة","Memory")}>
  <h3>{t("الذاكرة والتحكم في الخصوصية","Memory and privacy controls")}</h3>
  <p className="noata-memory-note">{t("الذاكرة اختيارية. عند تفعيلها، يمكن لـ Noata استخدام الذكريات المعتمدة للإجابات، وقراءة آخر سؤال في محادثة سابقة عند سؤالك عنها صراحةً. المحادثات المؤقتة مستبعدة.","Memory is optional. When enabled, Noata may use your approved notes in answers and retrieve your last question from an earlier non-temporary chat when you explicitly ask. Temporary chats remain excluded.")}</p>
  <p>{t("اختيارية ومغلقة افتراضيًا. يمكنك إضافة معلومات تريد أن يتذكرها Noata وتعديلها وحذفها. لا ينشئ النظام ذكريات تلقائيًا.","Optional and off by default. Add, edit or delete facts you'd like Noata to remember. No memories are created automatically.")}</p>
  {!owner?<p role="status">{t("سجّل الدخول لإدارة الذاكرة.","Sign in to manage memory.")}</p>:<>
   <button type="button" className="noata-memory-consent" aria-pressed={enabled} disabled={temporary||busy||loading} onClick={()=>void changeConsent()}>
    <span><strong>{t("استخدام ذكرياتي في الردود","Use my memories in answers")}</strong>
     <small>{enabled?t("مفعّل بموافقتك. يمكنك إيقافه متى شئت.","Enabled with your consent. Disable any time."):t("مغلق؛ لن تُرسل ذكرياتك إلى النموذج.","Off; your memories will not be sent to the model.")}</small></span>
    <span aria-hidden="true" className={"noata-memory-switch "+(enabled?"enabled":"")}>{enabled?"✓":"○"}</span>
   </button>
   {temporary&&<p className="noata-memory-note">{t("المحادثة المؤقتة لا تستخدم الذكريات المحفوظة ولا تغيّر إعداداتها. انتقل إلى محادثة عادية لإضافة الذكريات أو تعديلها أو حذفها أو تغيير الموافقة.","Temporary chats do not use saved memories or change persistent memory settings. Switch to a regular chat to add, edit or delete memories, or change consent.")}</p>}
   {loading?<p role="status">{t("بنحمّل إعداداتك…","Loading your settings…")}</p>:<>
    <form onSubmit={e=>{e.preventDefault();void save();}} className="noata-memory-form">
     <label htmlFor="noata-memory-input">{editing?t("تعديل الذاكرة","Edit memory"):t("أضف ذاكرة بموافقتك","Add an approved memory")}</label>
     <textarea id="noata-memory-input" dir="auto" rows={3} maxLength={500} value={draft} disabled={temporary||busy||loading} onChange={e=>setDraft(e.target.value)}
      placeholder={t("مثال: أفضل شرح الرياضيات باللغة العربية وبخطوات واضحة.","Example: I prefer math explanations in Arabic with clear steps.")}/>
     <div className="noata-memory-controls"><span>{draft.length}/500</span>
      {editing&&<button type="button" onClick={()=>{setEditing(null);setDraft("");}}>{t("إلغاء التعديل","Cancel edit")}</button>}
      <button type="submit" disabled={temporary||busy||loading||!draft.trim()}>{editing?t("حفظ التعديل","Save edit"):t("حفظ الذاكرة","Save memory")}</button>
     </div>
    </form>
    <div className="noata-memory-list-title"><strong>{t("الذكريات المحفوظة","Saved memories")} ({items.length})</strong>
     <div className="noata-memory-list-actions">
      {items.length>0&&<button type="button" className="noata-memory-export" disabled={busy||loading} onClick={exportMemories}>{t("تنزيل نسخة JSON","Export JSON")}</button>}
      {items.length>0&&<button type="button" className="danger" disabled={temporary||busy||loading} onClick={()=>void clearAll()}>{t("حذف الكل","Delete all")}</button>}
     </div>
    </div>
    {items.length===0?<p className="noata-memory-note">{t("لا توجد ذكريات محفوظة بعد.","No saved memories yet.")}</p>:
     <ul className="noata-memory-list">{items.map(item=><li key={item.id}><p dir="auto">{item.content}</p><div>
       <button type="button" disabled={temporary||busy||loading} onClick={()=>{setEditing(item.id);setDraft(item.content);}}> {t("تعديل","Edit")}</button>
       <button type="button" disabled={temporary||busy||loading} className="danger" onClick={()=>void remove(item.id)}> {t("حذف","Delete")}</button>
      </div></li>)}</ul>}
   </>}
   {error&&<p role="alert" className="noata-memory-error">{error}</p>}
   {notice&&<p role="status" className="noata-memory-note">{notice}</p>}
  </>}
 </section>;
}
