"use client";
import {useEffect,useMemo,useState,useId} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
import {Icon} from "@/components/ui/icon";
import {Dialog} from "@/components/ui/dialog";
import {coachForRoute,validatedCoachPrompt} from "@/lib/ai/contextual-coach";
import {useLocale,useTranslation} from "@/lib/i18n/locale";

/** Same AI workspace, different pedagogical jobs per route; no simulated tools. */
export function ContextualCoach({active}:{active:string}){
   const locale=useLocale(),t=useTranslation();
  const router=useRouter(),supabase=useMemo(()=>createClient(),[]);
  const context=coachForRoute(active,locale),fieldId=useId();
  const [open,setOpen]=useState(false);
  const [selected,setSelected]=useState(context.actions[0].id);
  const [draft,setDraft]=useState(context.actions[0].prompt);
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  useEffect(()=>{
    setSelected(context.actions[0].id);
    setDraft(context.actions[0].prompt);
    setOpen(false);
    setBusy(false);
    setError("");
  },[active,context]);
  if(active==="/ai")return null;
  function pick(id:string){
    const action=context.actions.find(a=>a.id===id);
    if(!action)return;
    setSelected(id);
    setDraft(action.prompt);
    setError("");
  }
  async function prepare(){
    if(busy)return;
    const prompt=validatedCoachPrompt(draft);
    if(!prompt){setError(t("اكتب طلبًا واضحًا بين 15 و1800 حرف.","Write a clear request between 15 and 1,800 characters."));return;}
    setBusy(true);setError("");
    try{
      const {data,error:authError}=await supabase.auth.getUser();
       if(authError||!data.user){setError(t("سجّل الدخول أولًا لفتح مساعد Noata AI. لن تُرسل أي بيانات تلقائيًا.","Sign in to open Noata AI. Nothing is sent automatically."));return;}
      const handoff={owner:data.user.id,prompt,createdAt:Date.now()};
      sessionStorage.setItem("noata-ai-pending-context-v1",JSON.stringify(handoff));
      setOpen(false);
      router.push("/ai");
    }catch{
       setError(t("تعذّر تحضير الطلب بأمان. يمكنك فتح Noata AI مباشرة وكتابة طلبك هناك.","Could not prepare your request securely. You can open Noata AI and write it there."));
    }finally{setBusy(false);}
  }
  return (<>
    <button type="button" className="noata-context-coach-trigger" onClick={()=>setOpen(true)}
      aria-label={t("اطلب مساعدة Noata AI في ","Ask Noata AI for help with ")+context.heading}>
      <Icon name="sparkles" size={18}/><span>{t("مساعد الصفحة","Page assistant")}</span>
    </button>
    <Dialog open={open} onClose={()=>{if(!busy)setOpen(false)}} title={context.heading}>
      <div className="noata-context-coach">
        <div className="noata-context-coach-heading"><span className="noata-context-coach-symbol"><Icon name="ai" size={24}/></span><p>{context.intro}</p></div>
        <div className="noata-context-coach-options" role="group" aria-label={t("اختار نوع المساعدة","Choose a type of help")}>
          {context.actions.map(action=><button key={action.id} type="button"
            aria-pressed={selected===action.id} onClick={()=>pick(action.id)}>
            <strong>{action.label}</strong><small>{action.description}</small>
          </button>)}
        </div>
        <label htmlFor={fieldId}>{t("راجع طلبك وعدّله قبل الانتقال إلى المحادثة","Review and edit your request before opening the conversation")}</label>
        <textarea id={fieldId} rows={4} maxLength={1800} value={draft}
          onChange={event=>{setDraft(event.target.value);setError("");}}
          placeholder={t("اكتب ماذا تريد أن تتعلم أو تنظم…","Describe what you want to learn or organize…")}/>
        <div className="noata-context-coach-meta"><small>{t("الرسالة مش هتتبعت تلقائيًا، ومساعد Noata ما يغيّرش درجات أو مكافآت أو إعدادات من نفسه.","This message is not sent automatically. Noata AI cannot change grades, rewards or settings on its own.")}</small><span dir="ltr">{draft.length}/1800</span></div>
        {error&&<p className="noata-context-coach-error" role="alert">{error} <a href="/ai">{t("افتح المحادثة","Open the conversation")}</a></p>}
        <button className="noata-context-coach-submit" type="button" disabled={busy||!validatedCoachPrompt(draft)}
          onClick={()=>void prepare()}>{busy?t("بنجهّز الطلب…","Preparing your request…"):t("افتح الطلب في Noata AI","Open in Noata AI")}<Icon name="arrow" size={17}/></button>
      </div>
    </Dialog>
  </>);
}
