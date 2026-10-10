"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {Icon} from "@/components/ui/icon";
import {createClient} from "@/lib/supabase/client";
import {useVerifiedAccount} from "@/lib/supabase/use-verified-account";
import {DESIGN_STUDIO_INSTRUCTION,DESIGN_STUDIO_INSTRUCTION_EN,applyCustomDesign,isDesignRecord,parseDesignSuggestion,validateTokens,type CustomDesign,type DesignTokens} from "@/lib/appearance/theme";
import {applyPalette,syncBrowserThemeColor} from "@/components/preferences/palette-gallery";
import {resolveAppearance,safeAppearance} from "@/lib/appearance/mode";
import {onlyOwnedRecords} from "@/lib/appearance/account-scope";
import {localized,useLocale} from "@/lib/i18n/locale";

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
  const locale=useLocale(),t=useCallback((ar:string,en:string)=>localized(locale,ar,en),[locale]);
  return <div className="noata-design-swatches" aria-label={t("درجات الألوان المقترحة","Suggested colors")}>
   <span style={{backgroundColor:tokens.deep}} title={t("الخلفية الداكنة","Dark background")}/>
   <span style={{backgroundColor:tokens.accent}} title={t("اللون الأساسي","Primary color")}/>
   <span style={{backgroundColor:tokens.bright}} title={t("اللون المساعد","Supporting color")}/>
   <span style={{backgroundColor:"#ffffff"}} title={t("خلفية النهار","Light background")}/>
 </div>;
}
/** Real Fanar-driven suggestions. No free-form CSS or HTML from the model. */
export function DesignStudio(){
  const supabase=useMemo(()=>createClient(),[]),account=useVerifiedAccount();
  const locale=useLocale(),t=useCallback((ar:string,en:string)=>localized(locale,ar,en),[locale]);
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
   if(loadError){setError(t("تعذّر قراءة تصاميم حسابك من الخادم. جرّب لاحقًا.","Could not load your saved designs. Please try again later."));return;}
  setSaved((data??[]).filter(isDesignRecord));
  setActiveId(settings?.active_design_id??null);
  },[supabase,account.user,t]);
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
    setNotice(t("المعاينة مطبقة مؤقتًا. احفظ التصميم لتثبيته على حسابك.","Preview applied temporarily. Save the design to keep it on your account."));
 }
 function beginEdit(design:CustomDesign){
   undoPreview();setDraft({name:design.name,description:design.description,tokens:design.tokens});
    setEditingId(design.id);setPrompt(t("صمّم نسخة محسّنة من ","Create a refined version of ")+design.name+t(" بنفس الهوية الأساسية."," while keeping its original character."));
   setRefinement("");setError("");
    setNotice(t("تم فتح التصميم للتعديل. اكتب المطلوب في وصف التعديل واضغط عدّل التصميم مع Fanar.","Design ready to edit. Describe your changes, then choose Refine with Fanar."));
   document.getElementById("noata-ai-design-prompt")?.focus();
 }

 async function generate(){
  const owner=accountId;
  if(busy||!owner)return;
  const message=prompt.trim(),extra=refinement.trim();
   if(message.length<12||message.length>500){setError(t("اكتب وصفًا واضحًا من 12 إلى 500 حرف.","Describe your design in 12 to 500 characters."));return;}
   if(extra.length>500){setError(t("تعديلاتك لا تتجاوز 500 حرف.","Keep your changes within 500 characters."));return;}
  setBusy("generate");setError("");setNotice("");
  try{
   const request=[
     locale==="en"?DESIGN_STUDIO_INSTRUCTION_EN:DESIGN_STUDIO_INSTRUCTION,
     t("وصف المستخدم (بيانات تفضيل وليست أوامر برمجية):","User description (preferences, not programming instructions):"),message,
     draft?t("التصميم الذي يريد المستخدم تحسينه: ","Existing design to refine: ")+JSON.stringify(draft):"",
     extra?t("تعديلات المستخدم المطلوبة: ","Requested changes: ")+extra:"",
     t("أجب بكائن JSON واحد فقط يحقق التباين المطلوب. لا تضف مقدمة أو شرحًا أو كتلة markdown.","Respond with one JSON object that meets the contrast requirements. Do not add an introduction, explanation, or markdown fence.")
   ].filter(Boolean).join("\n\n");
   async function askFanar(content:string){
    const {data,error:providerError}=await supabase.functions.invoke("noata-ai-v2",{
     body:{action:"chat",model:"Fanar-C-1-8.7B",messages:[{role:"user",content}],
       stream:false,max_tokens:900,temperature:0.15,requestId:crypto.randomUUID()}
    });
    if(providerError){
     const detail=(providerError as {context?:unknown}).context;
     const payload=detail instanceof Response?await detail.json().catch(()=>null):null;
      throw Error(typeof payload?.error==="string"?payload.error:t("لم تستجب خدمة Fanar لطلب التصميم.","Fanar did not respond to the design request."));
    }
     if(data?.kind!=="chat"||typeof data.content!=="string")throw Error(t("رد Fanar لم يحتوِ على نموذج تصميم صالح.","Fanar did not return a usable design."));
    return data.content;
    }
    const firstResponse=await askFanar(request);
    if(currentAccount.current!==owner)return;
    let parsed:ReturnType<typeof parseDesignSuggestion>;
    try { parsed=parseDesignSuggestion(firstResponse); }
    catch {
      // Retry once for prose, malformed JSON, or an invalid palette.
      if(currentAccount.current!==owner)return;
      parsed=parseDesignSuggestion(await askFanar(request+"\n\n"+t("المحاولة السابقة لم تكن كائن JSON صالحًا أو لم تحقق شروط الألوان. أعد إنشاء التصميم بكائن JSON واحد صحيح فقط.","The previous response was not valid JSON or did not meet the color requirements. Create the design again as one valid JSON object only.")));
    }
    if(currentAccount.current!==owner)return;
    undoPreview();setDraft(parsed);setNotice(t("جهّز Fanar اقتراحًا جديدًا. عاينه وعدّله قبل الحفظ؛ لم يُطبّق بعد.","Fanar created a new suggestion. Preview and refine it before saving; nothing has been applied yet."));
   }catch(e){if(currentAccount.current===owner)setError(e instanceof Error?e.message:t("تعذّر إنشاء التصميم. حاول مرة أخرى.","Could not create the design. Please try again."));}
   finally{if(currentAccount.current===owner)setBusy("");}
  }
  async function save(){
   const owner=accountId;
   if(busy||!draft||!owner)return;
   if(!editingId&&saved.length>=MAX_DESIGNS){setError(t("وصلت إلى الحد الأقصى: 8 تصاميم. احذف تصميمًا قبل حفظ غيره.","You have reached the limit of 8 designs. Delete one before saving another."));return;}
  setBusy("save");setError("");setNotice("");
  try{
   const tokens=validateTokens(draft.tokens);
   const builder=editingId
     ? supabase.from("user_theme_designs").update({name:draft.name,description:draft.description,tokens,updated_at:new Date().toISOString()}).eq("id",editingId).eq("user_id",owner)
     : supabase.from("user_theme_designs").insert({user_id:owner,name:draft.name,description:draft.description,tokens,visible:true});
   const {data,error:saveError}=await builder.select("id,user_id,name,description,tokens,visible").single();
    if(currentAccount.current!==owner)return;
    if(saveError||!isDesignRecord(data)||data.user_id!==owner)throw Error(t("تعذّر تأكيد حفظ تصميمك في حسابك.","Could not confirm that your design was saved to your account."));
   setSaved(old=>editingId?old.map(x=>x.id===data.id?data:x):[data,...old]);
   setDraft(null);setEditingId(null);setPreview(false);
   previewSession.current={active:false,previous:null};
   const {data:preference,error:prefError}=await supabase.from("user_settings")
     .upsert({user_id:owner,active_design_id:data.id,updated_at:new Date().toISOString()},{onConflict:"user_id"})
     .select("active_design_id").single();
   if(currentAccount.current!==owner)return;
   if(prefError||preference?.active_design_id!==data.id){
      setNotice(t("اتحفظ التصميم في حسابك، لكن تفعيله على باقي الأجهزة غير مؤكد. يمكنك اختياره من القائمة.","The design was saved, but activation on other devices could not be confirmed. You can select it from the list."));
   }else{
     setActiveId(data.id);renderCustom(data.tokens);
      setNotice(t("اتحفظ التصميم واتفعّل على حسابك بعد تأكيد الخادم.","Your design was saved and activated on your account."));
   }
   }catch(e){if(currentAccount.current===owner)setError(e instanceof Error?e.message:t("تعذّر الحفظ.","Could not save the design."));}
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
    if(writeError||data?.active_design_id!==design.id)throw Error(t("لم يؤكد الخادم تفعيل هذا التصميم.","The server did not confirm design activation."));
    setActiveId(design.id);previewSession.current={active:false,previous:null};renderCustom(validateTokens(design.tokens));setPreview(false);
    setNotice(t("التصميم نشط الآن ومتزامن مع حسابك.","The design is active and synced with your account."));
   }catch(e){if(currentAccount.current===owner)setError(e instanceof Error?e.message:t("لم يتأكد اختيار التصميم.","Could not confirm your design selection."));}
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
    if(writeError||data?.visible===design.visible)throw Error(t("تعذّر تأكيد حالة ظهور التصميم.","Could not confirm the design visibility setting."));
    setSaved(rows=>rows.map(row=>row.id===design.id?{...row,visible:!design.visible}:row));
    window.dispatchEvent(new Event("noata-custom-theme-change"));
    setNotice(design.visible?t("تم إخفاء التصميم من قائمة الاختيار دون حذفه.","The design is hidden from the selection list but remains saved."):t("التصميم ظاهر في قائمة الاختيار.","The design is visible in the selection list."));
   }catch(e){if(currentAccount.current===owner)setError(e instanceof Error?e.message:t("تعذّر تعديل الظهور.","Could not update visibility."));}
   finally{if(currentAccount.current===owner)setBusy("");}
  }
  async function remove(design:CustomDesign){
   const owner=accountId;
   if(busy||!owner)return;
   if(!window.confirm(t("حذف التصميم «","Permanently delete “")+design.name+t("» نهائيًا من حسابك؟","” from your account?")))return;
   setBusy("delete");setError("");setNotice("");
   try{
    const {data,error:deleteError}=await supabase.from("user_theme_designs")
      .delete().eq("id",design.id).eq("user_id",owner).select("id").single();
    if(currentAccount.current!==owner)return;
    if(deleteError||data?.id!==design.id)throw Error(t("تعذّر تأكيد حذف التصميم.","Could not confirm design deletion."));
    setSaved(rows=>rows.filter(row=>row.id!==design.id));
    window.dispatchEvent(new Event("noata-custom-theme-change"));
    if(activeId===design.id){setActiveId(null);previewSession.current={active:false,previous:null};restoreStock();}
    setNotice(t("تم حذف التصميم وتأكيد العملية من الخادم.","The design was deleted and confirmed by the server."));
   }catch(e){if(currentAccount.current===owner)setError(e instanceof Error?e.message:t("تعذّر الحذف.","Could not delete the design."));}
   finally{if(currentAccount.current===owner)setBusy("");}
 }
  return <section id="noata-ai-design-studio" className="noata-design-studio" aria-label={t("استوديو صناعة التصاميم بالذكاء الاصطناعي","AI Design Studio")}>
  <div className="noata-design-studio-header">
   <span className="noata-design-studio-crest"><Icon name="sparkles" size={25}/></span>
   <div><p className="noata-design-kicker">NOATA · AI DESIGN STUDIO</p>
     <h2>{t("صمّم عالمك. خليه شبهك.","Design a space that feels like you.")}</h2>
     <p>{t("احكي لـNoata AI الألوان والجو اللي بتحبه. شاهد معاينة حقيقية، عدّل بالوصف، وبعد رضاك احفظ التصميم على حسابك.","Tell Noata AI which colors and mood you like. Preview the result, refine it in words, and save it to your account when you are happy with it.")}</p>
   </div>
  </div>
  <div className="noata-design-studio-layout">
   <div className="noata-design-compose">
      <label htmlFor="noata-ai-design-prompt">{t("وصف التصميم الجديد","Describe your new design")}</label>
     <textarea id="noata-ai-design-prompt" rows={4} maxLength={500}
        placeholder={t("مثلاً: تصميم أبيض هادئ بحدود زرقاء كأنها زجاج، ولمسات سماوية لامعة بدون مبالغة…","For example: a calm white design with glasslike blue borders and subtle sky-blue accents…")}
       value={prompt} onChange={e=>setPrompt(e.target.value)} />
      <label htmlFor="noata-ai-design-refinement">{t("تعديل التصميم الحالي (اختياري)","Refine the current design (optional)")}</label>
     <textarea id="noata-ai-design-refinement" rows={2} maxLength={500}
        placeholder={t("مثلاً: خلي الأزرق أعمق واللون المساعد أدفأ…","For example: deepen the blue and warm up the supporting color…")}
       value={refinement} onChange={e=>setRefinement(e.target.value)} />
      <p className="noata-design-small">{t("Fanar بيقترح ألوانًا منظمة؛ التطبيق بيراجع صيغة الألوان والتباين. مش بينفذ كود أو CSS يكتبه النموذج.","Fanar suggests structured colors. Noata checks their format and contrast and does not run model-generated code or CSS.")}</p>
      {!account.user&&<p className="noata-design-login-note">{t("إنشاء التصميم بالذكاء الاصطناعي وحفظه يتطلب ","To create and save an AI design, ")}<Link href="/login?next=/settings">{t("تسجيل الدخول","sign in")}</Link>.</p>}
     <button type="button" className="noata-design-primary" disabled={busy!==""||!account.user||prompt.trim().length<12}
        onClick={()=>void generate()}><Icon name="ai" size={18}/>{busy==="generate"?t("Fanar بيبتكر التصميم…","Fanar is creating your design…"):draft?t("عدّل التصميم مع Fanar","Refine with Fanar"):t("ولّد تصميمًا جديدًا","Create a new design")}</button>
   </div>
   <div className="noata-design-preview-zone" aria-live="polite">
     {draft?<div className="noata-design-result">
       <div className="noata-design-preview-card" style={{borderColor:draft.tokens.accent}}>
         <div className="noata-design-preview-top" style={{background:"linear-gradient(120deg,"+draft.tokens.deep+","+draft.tokens.bright+")"}}>
            <span>{t("معاينة تصميم NOATA","NOATA DESIGN PREVIEW")}</span><strong>{draft.name}</strong>
           <div className="noata-design-preview-dots"><span/><span/><span/></div>
         </div>
         <div className="noata-design-preview-bottom"><DesignSwatches tokens={draft.tokens}/>
           <strong>{draft.name}</strong><p>{draft.description||t("نظام ألوان بتوقيعك","A color palette of your own")}</p>
           <span className="noata-design-preview-button" style={{backgroundColor:draft.tokens.accent}}>{t("تجربة الزر","Button preview")}</span>
         </div>
       </div>
       <div className="noata-design-result-actions">
         <button type="button" disabled={busy!==""} onClick={()=>previewDesign(draft.tokens)}>{t("معاينة على المنصة","Preview on Noata")}</button>
         <button type="button" disabled={busy!==""} onClick={()=>void save()}>{editingId?t("حفظ التعديلات وتفعيل","Save changes and activate"):t("حفظ وتفعيل","Save and activate")}</button>
         <button type="button" disabled={busy!==""} onClick={()=>{undoPreview();setDraft(null);setEditingId(null);setNotice(t("تم إلغاء المسودة دون حفظ.","Draft discarded without saving."));}}>{t("إلغاء المسودة","Discard draft")}</button>
       </div>
      </div>:<div className="noata-design-blank"><Icon name="sparkles" size={38}/>
          <strong>{t("هنا بتظهر فكرة تصميمك","Your design idea appears here")}</strong><p>{t("اكتب وصفًا، شوف النتيجة، وقرّر أنت قبل تطبيق أي تغيير.","Describe your idea, see the result, and decide before applying any change.")}</p>
      </div>}
   </div>
  </div>
   {preview&&<p className="noata-design-preview-disclaimer" role="status">{t("دي معاينة مؤقتة؛ لسه ما اتحفظتش على حسابك. تقدر تعدّلها أو تحفظها أو تلغيها.","This is a temporary preview. It has not been saved to your account. You can refine, save, or cancel it.")}</p>}
  {notice&&<p className="noata-design-notice" role="status">{notice}</p>}
  {error&&<p className="noata-design-error" role="alert">{error}</p>}
   <div className="noata-design-collection-header"><div><h3>{t("تصميماتي","My designs")}</h3><p>{t("اختار، أخفِ من القائمة، أو احذف التصاميم اللي مش محتاجها.","Select a design, hide it from the list, or delete designs you no longer need.")}</p></div><small>{saved.length} / {MAX_DESIGNS}</small></div>
   {account.user && saved.length===0?<p className="noata-design-empty">{t("لسه ما حفظتش أي تصميم. أول تصميم هتعمله هيظهر هنا.","You have not saved a design yet. Your first design will appear here.")}</p>:null}
  <div className="noata-design-saved-list">{saved.map(design=><article key={design.id} className="noata-design-saved-card">
     <DesignSwatches tokens={design.tokens}/>
     <strong>{design.name}</strong><small>{design.description}</small>
     <div className="noata-design-saved-actions">
       <button type="button" disabled={busy!==""||activeId===design.id} onClick={()=>void activate(design)}>{activeId===design.id?t("مفعّل","Active"):t("تفعيل","Activate")}</button>
       <button type="button" disabled={busy!==""} onClick={()=>beginEdit(design)}>{t("تعديل بـAI","Refine with AI")}</button>
       <button type="button" disabled={busy!==""} onClick={()=>void visibility(design)}>{design.visible?t("إخفاء من القائمة","Hide from list"):t("إظهار في القائمة","Show in list")}</button>
       <button type="button" disabled={busy!==""} onClick={()=>void remove(design)}>{t("حذف","Delete")}</button>
     </div>
   </article>)}</div>
 </section>;
}
export function SavedDesignChoices(){
  const account=useVerifiedAccount(),supabase=useMemo(()=>createClient(),[]);
  const locale=useLocale(),t=useCallback((ar:string,en:string)=>localized(locale,ar,en),[locale]);
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
        if(a.error||b.error){setError(t("تعذّر مزامنة تصاميم الحساب؛ أعد فتح القائمة.","Could not sync your designs. Reopen the list and try again."));return;}
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
  },[supabase,account.user,t]);
 async function choose(design:CustomDesign){
   const owner=accountId;
   if(!owner)return;
   setError("");
   try{
    const {data,error:saveError}=await supabase.from("user_settings").upsert({
      user_id:owner,active_design_id:design.id
    },{onConflict:"user_id"}).select("active_design_id").single();
     if(currentAccount.current!==owner)return;
     if(saveError||data?.active_design_id!==design.id)throw Error(t("الخادم لم يؤكد تفعيل التصميم.","The server did not confirm design activation."));
     setActive(design.id);renderCustom(design.tokens);
    }catch(e){if(currentAccount.current===owner)setError(e instanceof Error?e.message:t("تعذّر التفعيل.","Could not activate the design."));}
  }
  const visibleItems=onlyOwnedRecords(items,accountId);
  if(!visibleItems.length)return null;
  return <div className="noata-custom-theme-choices"><strong>{t("تصميماتي المخصصة","My custom designs")}</strong>
    {visibleItems.map(design=><button type="button" key={design.id} aria-pressed={active===design.id}
    onClick={()=>void choose(design)}><DesignSwatches tokens={design.tokens}/><span>{design.name}</span>{active===design.id?<Icon name="check" size={15}/>:null}</button>)}
   {error?<small role="alert">{error}</small>:null}
  </div>;
}
