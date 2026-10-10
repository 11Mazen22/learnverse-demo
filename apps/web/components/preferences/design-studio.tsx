"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {Icon} from "@/components/ui/icon";
import {createClient} from "@/lib/supabase/client";
import {useVerifiedAccount} from "@/lib/supabase/use-verified-account";
import {DESIGN_STUDIO_INSTRUCTION,applyCustomDesign,isDesignRecord,parseDesignSuggestion,validateTokens,type CustomDesign,type DesignTokens} from "@/lib/appearance/theme";
import {applyPalette,syncBrowserThemeColor} from "@/components/preferences/palette-gallery";
import {resolveAppearance,safeAppearance} from "@/lib/appearance/mode";
import {onlyOwnedRecords} from "@/lib/appearance/account-scope";

const MAX_DESIGNS=8;
function effectiveMode() {
 let saved:string|null=null;
 try{saved=localStorage.getItem("noata-theme");}catch{}
 document.documentElement.dataset.theme=resolveAppearance(safeAppearance(saved),document.documentElement.dataset.palette,window.matchMedia("(prefers-color-scheme: dark)").matches);
 syncBrowserThemeColor();
}
function renderCustom(tokens:DesignTokens) {
 applyCustomDesign(tokens);
 effectiveMode();
 window.dispatchEvent(new Event("noata-custom-theme-change"));
}
function restoreStock() {
 let palette:string|null=null;
 try{palette=localStorage.getItem("noata-palette");}catch{}
 applyPalette(palette);
 window.dispatchEvent(new Event("noata-custom-theme-change"));
}
function DesignSwatches({tokens}:{tokens:DesignTokens}){
 return <div className="noata-design-swatches" aria-label="درجات الألوان المقترحة">
  <span style={{backgroundColor:tokens.deep}} title="الخلفية الداكنة"/>
  <span style={{backgroundColor:tokens.accent}} title="اللون الأساسي"/>
  <span style={{backgroundColor:tokens.bright}} title="اللون المساعد"/>
  <span style={{backgroundColor:"#ffffff"}} title="خلفية النهار"/>
 </div>;
}
/** Real Fanar-driven suggestions. No free-form CSS or HTML from the model. */
export function DesignStudio(){
 const supabase=useMemo(()=>createClient(),[]),account=useVerifiedAccount();
 const [prompt,setPrompt]=useState(""),[refinement,setRefinement]=useState("");
 const accountId=account.user?.id??null;
 const currentAccount=useRef(accountId);
 currentAccount.current=accountId;
 const [draftRecord,setDraftRecord]=useState<{owner:string;value:{name:string;description:string;tokens:DesignTokens}}|null>(null);
 const draft=draftRecord?.owner===accountId?draftRecord.value:null;
 function setDraft(value:{name:string;description:string;tokens:DesignTokens}|null){
   setDraftRecord(value&&accountId?{owner:accountId,value}:null);
 }
 const [storedDesigns,setSaved]=useState<CustomDesign[]>([]);
 const saved=onlyOwnedRecords(storedDesigns,accountId);
 const [activeId,setActiveId]=useState<string|null>(null);
 const [editingId,setEditingId]=useState<string|null>(null);
 const previewSession=useRef<{previous:DesignTokens|null;active:boolean}>({previous:null,active:false});
 const [preview,setPreview]=useState(false),[busy,setBusy]=useState(""),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const load=useCallback(async()=>{
  const user=account.user;
  if(!user){setSaved([]);setActiveId(null);return;}
  const [{data,error:loadError},{data:settings}]=await Promise.all([
   supabase.from("user_theme_designs").select("id,user_id,name,description,tokens,visible")
    .eq("user_id",user.id).order("created_at",{ascending:false}).limit(MAX_DESIGNS+1),
   supabase.from("user_settings").select("active_design_id").eq("user_id",user.id).maybeSingle()
  ]);
  if(currentAccount.current!==user.id)return;
  if(loadError){setError("تعذّر قراءة تصاميم حسابك من الخادم. جرّب لاحقًا.");return;}
  setSaved((data??[]).filter(isDesignRecord));
  setActiveId(settings?.active_design_id??null);
 },[supabase,account.user]);
 useEffect(()=>{void load();},[load]);
 // Clear drafts, stale status and previews when authentication changes.
 // The render also filters records by owner to avoid a one-frame leak before effects run.
 useEffect(()=>{
   setSaved([]);setActiveId(null);setDraft(null);setEditingId(null);
   setPrompt("");setRefinement("");setError("");setNotice("");setBusy("");
   if(previewSession.current.active)restoreStock();
   previewSession.current={previous:null,active:false};
   setPreview(false);
 },[accountId]);
 function undoPreview(){
   if(!previewSession.current.active)return;
   const previous=previewSession.current.previous;
   previewSession.current={previous:null,active:false};
   if(previous)renderCustom(previous);else restoreStock();
   setPreview(false);
 }
 useEffect(()=>{
   return ()=>{
     const state=previewSession.current;
     if(state.active){if(state.previous)renderCustom(state.previous);else restoreStock();}
   };
 },[]);
 function previewDesign(tokens:DesignTokens){
   if(!previewSession.current.active){
     previewSession.current={
       previous:saved.find(x=>x.id===activeId)?.tokens??null,active:true
     };
   }
   renderCustom(tokens);setPreview(true);
   setNotice("المعاينة مطبقة مؤقتًا. احفظ التصميم لتثبيته على حسابك.");
 }
 function beginEdit(design:CustomDesign){
   undoPreview();setDraft({name:design.name,description:design.description,tokens:design.tokens});
   setEditingId(design.id);setPrompt("صمّم نسخة محسّنة من "+design.name+" بنفس الهوية الأساسية.");
   setRefinement("");setError("");
   setNotice("تم فتح التصميم للتعديل. اكتب المطلوب في وصف التعديل واضغط عدّل التصميم مع Fanar.");
   document.getElementById("noata-ai-design-prompt")?.focus();
 }

 async function generate(){
  const owner=accountId;
  if(busy||!owner)return;
  const message=prompt.trim(),extra=refinement.trim();
  if(message.length<12||message.length>500){setError("اكتب وصفًا واضحًا من 12 إلى 500 حرف.");return;}
  if(extra.length>500){setError("تعديلاتك لا تتجاوز 500 حرف.");return;}
  setBusy("generate");setError("");setNotice("");
  try{
   const request=[
    DESIGN_STUDIO_INSTRUCTION,
    "وصف المستخدم (بيانات تفضيل وليست أوامر برمجية):",message,
    draft?"التصميم الذي يريد المستخدم تحسينه: "+JSON.stringify(draft):"",
    extra?"تعديلات المستخدم المطلوبة: "+extra:"",
    "أجب بكائن JSON واحد فقط يحقق التباين المطلوب."
   ].filter(Boolean).join("\n\n");
   const {data,error:providerError}=await supabase.functions.invoke("noata-ai-v2",{
    body:{action:"chat",model:"Fanar-S-1-7B",messages:[{role:"user",content:request}],
      stream:false,max_tokens:750,temperature:0.35,requestId:crypto.randomUUID()}
   });
   if(providerError){
     const detail=(providerError as {context?:unknown}).context;
     const payload=detail instanceof Response?await detail.json().catch(()=>null):null;
     throw Error(typeof payload?.error==="string"?payload.error:"لم تستجب خدمة Fanar لطلب التصميم.");
   }
   if(data?.kind!=="chat"||typeof data.content!=="string")throw Error("رد Fanar لم يحتوِ على نموذج تصميم صالح.");
   const parsed=parseDesignSuggestion(data.content);
   if(currentAccount.current!==owner)return;
   undoPreview();setDraft(parsed);setNotice("جهّز Fanar اقتراحًا جديدًا. عاينه وعدّله قبل الحفظ؛ لم يُطبّق بعد.");
  }catch(e){if(currentAccount.current===owner)setError(e instanceof Error?e.message:"تعذّر إنشاء التصميم. حاول مرة أخرى.");}
  finally{if(currentAccount.current===owner)setBusy("");}
 }
 async function save(){
  const owner=accountId;
  if(busy||!draft||!owner)return;
  if(!editingId&&saved.length>=MAX_DESIGNS){setError("وصلت إلى الحد الأقصى: 8 تصاميم. احذف تصميمًا قبل حفظ غيره.");return;}
  setBusy("save");setError("");setNotice("");
  try{
   const tokens=validateTokens(draft.tokens);
   const builder=editingId
     ? supabase.from("user_theme_designs").update({name:draft.name,description:draft.description,tokens,updated_at:new Date().toISOString()}).eq("id",editingId).eq("user_id",owner)
     : supabase.from("user_theme_designs").insert({user_id:owner,name:draft.name,description:draft.description,tokens,visible:true});
   const {data,error:saveError}=await builder.select("id,user_id,name,description,tokens,visible").single();
   if(currentAccount.current!==owner)return;
   if(saveError||!isDesignRecord(data)||data.user_id!==owner)throw Error("تعذّر تأكيد حفظ تصميمك في حسابك.");
   setSaved(old=>editingId?old.map(x=>x.id===data.id?data:x):[data,...old]);
   setDraft(null);setEditingId(null);setPreview(false);
   previewSession.current={active:false,previous:null};
   const {data:preference,error:prefError}=await supabase.from("user_settings")
     .upsert({user_id:owner,active_design_id:data.id,updated_at:new Date().toISOString()},{onConflict:"user_id"})
     .select("active_design_id").single();
   if(currentAccount.current!==owner)return;
   if(prefError||preference?.active_design_id!==data.id){
     setNotice("اتحفظ التصميم في حسابك، لكن تفعيله على باقي الأجهزة غير مؤكد. يمكنك اختياره من القائمة.");
   }else{
     setActiveId(data.id);renderCustom(data.tokens);
     setNotice("اتحفظ التصميم واتفعّل على حسابك بعد تأكيد الخادم.");
   }
  }catch(e){if(currentAccount.current===owner)setError(e instanceof Error?e.message:"تعذّر الحفظ.");}
  finally{if(currentAccount.current===owner)setBusy("");}
 }
 async function activate(design:CustomDesign){
  const owner=accountId;
  if(busy||!owner)return;
  setBusy("activate");setError("");setNotice("");
  try{
   const {data,error:writeError}=await supabase.from("user_settings")
     .upsert({user_id:owner,active_design_id:design.id},{onConflict:"user_id"})
     .select("active_design_id").single();
   if(currentAccount.current!==owner)return;
   if(writeError||data?.active_design_id!==design.id)throw Error("لم يؤكد الخادم تفعيل هذا التصميم.");
   setActiveId(design.id);previewSession.current={active:false,previous:null};renderCustom(validateTokens(design.tokens));setPreview(false);
   setNotice("التصميم نشط الآن ومتزامن مع حسابك.");
  }catch(e){if(currentAccount.current===owner)setError(e instanceof Error?e.message:"لم يتأكد اختيار التصميم.");}
  finally{if(currentAccount.current===owner)setBusy("");}
 }
 async function visibility(design:CustomDesign){
  const owner=accountId;
  if(busy||!owner)return;
  setBusy("visible");setError("");setNotice("");
  try{
   const {data,error:writeError}=await supabase.from("user_theme_designs")
     .update({visible:!design.visible,updated_at:new Date().toISOString()})
     .eq("id",design.id).eq("user_id",owner).select("id,visible").single();
   if(currentAccount.current!==owner)return;
   if(writeError||data?.visible===design.visible)throw Error("تعذّر تأكيد حالة ظهور التصميم.");
   setSaved(rows=>rows.map(row=>row.id===design.id?{...row,visible:!design.visible}:row));
   window.dispatchEvent(new Event("noata-custom-theme-change"));
   setNotice(design.visible?"تم إخفاء التصميم من قائمة الاختيار دون حذفه.":"التصميم ظاهر في قائمة الاختيار.");
  }catch(e){if(currentAccount.current===owner)setError(e instanceof Error?e.message:"تعذّر تعديل الظهور.");}
  finally{if(currentAccount.current===owner)setBusy("");}
 }
 async function remove(design:CustomDesign){
  const owner=accountId;
  if(busy||!owner)return;
  if(!window.confirm("حذف التصميم «"+design.name+"» نهائيًا من حسابك؟"))return;
  setBusy("delete");setError("");setNotice("");
  try{
   const {data,error:deleteError}=await supabase.from("user_theme_designs")
     .delete().eq("id",design.id).eq("user_id",owner).select("id").single();
   if(currentAccount.current!==owner)return;
   if(deleteError||data?.id!==design.id)throw Error("تعذّر تأكيد حذف التصميم.");
   setSaved(rows=>rows.filter(row=>row.id!==design.id));
   window.dispatchEvent(new Event("noata-custom-theme-change"));
   if(activeId===design.id){setActiveId(null);previewSession.current={active:false,previous:null};restoreStock();}
   setNotice("تم حذف التصميم وتأكيد العملية من الخادم.");
  }catch(e){if(currentAccount.current===owner)setError(e instanceof Error?e.message:"تعذّر الحذف.");}
  finally{if(currentAccount.current===owner)setBusy("");}
 }
 return <section id="noata-ai-design-studio" className="noata-design-studio" aria-label="استوديو صناعة التصاميم بالذكاء الاصطناعي">
  <div className="noata-design-studio-header">
   <span className="noata-design-studio-crest"><Icon name="sparkles" size={25}/></span>
   <div><p className="noata-design-kicker">NOATA · AI DESIGN STUDIO</p>
    <h2>صمّم عالمك. خليه شبهك.</h2>
    <p>احكي لـNoata AI الألوان والجو اللي بتحبه. شاهد معاينة حقيقية، عدّل بالوصف، وبعد رضاك احفظ التصميم على حسابك.</p>
   </div>
  </div>
  <div className="noata-design-studio-layout">
   <div className="noata-design-compose">
     <label htmlFor="noata-ai-design-prompt">وصف التصميم الجديد</label>
     <textarea id="noata-ai-design-prompt" rows={4} maxLength={500}
       placeholder="مثلاً: تصميم أبيض هادئ بحدود زرقاء كأنها زجاج، ولمسات سماوية لامعة بدون مبالغة…"
       value={prompt} onChange={e=>setPrompt(e.target.value)} />
     <label htmlFor="noata-ai-design-refinement">تعديل التصميم الحالي (اختياري)</label>
     <textarea id="noata-ai-design-refinement" rows={2} maxLength={500}
       placeholder="مثلاً: خلي الأزرق أعمق واللون المساعد أدفأ…"
       value={refinement} onChange={e=>setRefinement(e.target.value)} />
     <p className="noata-design-small">Fanar بيقترح ألوانًا منظمة؛ التطبيق بيراجع صيغة الألوان والتباين. مش بينفذ كود أو CSS يكتبه النموذج.</p>
     {!account.user&&<p className="noata-design-login-note">إنشاء التصميم بالذكاء الاصطناعي وحفظه يتطلب <Link href="/login?next=/settings">تسجيل الدخول</Link>.</p>}
     <button type="button" className="noata-design-primary" disabled={busy!==""||!account.user||prompt.trim().length<12}
       onClick={()=>void generate()}><Icon name="ai" size={18}/>{busy==="generate"?"Fanar بيبتكر التصميم…":draft?"عدّل التصميم مع Fanar":"ولّد تصميمًا جديدًا"}</button>
   </div>
   <div className="noata-design-preview-zone" aria-live="polite">
     {draft?<div className="noata-design-result">
       <div className="noata-design-preview-card" style={{borderColor:draft.tokens.accent}}>
         <div className="noata-design-preview-top" style={{background:"linear-gradient(120deg,"+draft.tokens.deep+","+draft.tokens.bright+")"}}>
           <span>NOATA DESIGN PREVIEW</span><strong>{draft.name}</strong>
           <div className="noata-design-preview-dots"><span/><span/><span/></div>
         </div>
         <div className="noata-design-preview-bottom"><DesignSwatches tokens={draft.tokens}/>
          <strong>{draft.name}</strong><p>{draft.description||"نظام ألوان بتوقيعك"}</p>
          <span className="noata-design-preview-button" style={{backgroundColor:draft.tokens.accent}}>تجربة الزر</span>
         </div>
       </div>
       <div className="noata-design-result-actions">
        <button type="button" disabled={busy!==""} onClick={()=>previewDesign(draft.tokens)}>معاينة على المنصة</button>
        <button type="button" disabled={busy!==""} onClick={()=>void save()}>{editingId?"حفظ التعديلات وتفعيل":"حفظ وتفعيل"}</button>
        <button type="button" disabled={busy!==""} onClick={()=>{undoPreview();setDraft(null);setEditingId(null);setNotice("تم إلغاء المسودة دون حفظ.");}}>إلغاء المسودة</button>
       </div>
      </div>:<div className="noata-design-blank"><Icon name="sparkles" size={38}/>
         <strong>هنا بتظهر فكرة تصميمك</strong><p>اكتب وصفًا، شوف النتيجة، وقرّر أنت قبل تطبيق أي تغيير.</p>
      </div>}
   </div>
  </div>
  {preview&&<p className="noata-design-preview-disclaimer" role="status">دي معاينة مؤقتة؛ لسه ما اتحفظتش على حسابك. تقدر تعدّلها أو تحفظها أو تلغيها.</p>}
  {notice&&<p className="noata-design-notice" role="status">{notice}</p>}
  {error&&<p className="noata-design-error" role="alert">{error}</p>}
  <div className="noata-design-collection-header"><div><h3>تصميماتي</h3><p>اختار، أخفِ من القائمة، أو احذف التصاميم اللي مش محتاجها.</p></div><small>{saved.length} / {MAX_DESIGNS}</small></div>
  {account.user && saved.length===0?<p className="noata-design-empty">لسه ما حفظتش أي تصميم. أول تصميم هتعمله هيظهر هنا.</p>:null}
  <div className="noata-design-saved-list">{saved.map(design=><article key={design.id} className="noata-design-saved-card">
     <DesignSwatches tokens={design.tokens}/>
     <strong>{design.name}</strong><small>{design.description}</small>
     <div className="noata-design-saved-actions">
      <button type="button" disabled={busy!==""||activeId===design.id} onClick={()=>void activate(design)}>{activeId===design.id?"مفعّل":"تفعيل"}</button>
      <button type="button" disabled={busy!==""} onClick={()=>beginEdit(design)}>تعديل بـAI</button>
      <button type="button" disabled={busy!==""} onClick={()=>void visibility(design)}>{design.visible?"إخفاء من القائمة":"إظهار في القائمة"}</button>
      <button type="button" disabled={busy!==""} onClick={()=>void remove(design)}>حذف</button>
     </div>
   </article>)}</div>
 </section>;
}
export function SavedDesignChoices(){
 const account=useVerifiedAccount(),supabase=useMemo(()=>createClient(),[]);
 const accountId=account.user?.id??null;
 const currentAccount=useRef(accountId);
 currentAccount.current=accountId;
 const [items,setItems]=useState<CustomDesign[]>([]),[active,setActive]=useState<string|null>(null),[error,setError]=useState("");
 useEffect(()=>{
   let live=true;
   let latest=0;
   if(!account.user){setItems([]);setActive(null);return;}
   const user=account.user;
   const refresh=()=>{
     const request=++latest;
     void (async()=>{
       const [a,b]=await Promise.all([
         supabase.from("user_theme_designs").select("id,user_id,name,description,tokens,visible")
          .eq("user_id",user.id).eq("visible",true).order("created_at",{ascending:false}).limit(MAX_DESIGNS),
         supabase.from("user_settings").select("active_design_id").eq("user_id",user.id).maybeSingle()
       ]);
       if(!live||request!==latest)return;
       if(a.error||b.error){setError("تعذّر مزامنة تصاميم الحساب؛ أعد فتح القائمة.");return;}
       setItems((a.data??[]).filter(isDesignRecord));
       setActive(b.data?.active_design_id??null);
     })();
   };
   refresh();
   window.addEventListener("noata-custom-theme-change",refresh);
   window.addEventListener("noata-palette-change",refresh);
   return()=>{
     live=false;
     window.removeEventListener("noata-custom-theme-change",refresh);
     window.removeEventListener("noata-palette-change",refresh);
   };
 },[supabase,account.user]);
 async function choose(design:CustomDesign){
   const owner=accountId;
   if(!owner)return;
   setError("");
   try{
    const {data,error:saveError}=await supabase.from("user_settings").upsert({
      user_id:owner,active_design_id:design.id
    },{onConflict:"user_id"}).select("active_design_id").single();
    if(currentAccount.current!==owner)return;
    if(saveError||data?.active_design_id!==design.id)throw Error("الخادم لم يؤكد تفعيل التصميم.");
    setActive(design.id);renderCustom(design.tokens);
   }catch(e){if(currentAccount.current===owner)setError(e instanceof Error?e.message:"تعذّر التفعيل.");}
 }
 const visibleItems=onlyOwnedRecords(items,accountId);
 if(!visibleItems.length)return null;
 return <div className="noata-custom-theme-choices"><strong>تصميماتي المخصصة</strong>
   {visibleItems.map(design=><button type="button" key={design.id} aria-pressed={active===design.id}
    onClick={()=>void choose(design)}><DesignSwatches tokens={design.tokens}/><span>{design.name}</span>{active===design.id?<Icon name="check" size={15}/>:null}</button>)}
   {error?<small role="alert">{error}</small>:null}
  </div>;
}
