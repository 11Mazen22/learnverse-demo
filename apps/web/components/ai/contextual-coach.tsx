"use client";
import {useEffect,useMemo,useState,useId} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
import {Icon} from "@/components/ui/icon";
import {Dialog} from "@/components/ui/dialog";
import {coachForRoute,validatedCoachPrompt} from "@/lib/ai/contextual-coach";

/** Same AI workspace, different pedagogical jobs per route; no simulated tools. */
export function ContextualCoach({active}:{active:string}){
  const router=useRouter(),supabase=useMemo(()=>createClient(),[]);
  const context=coachForRoute(active),fieldId=useId();
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
    if(!prompt){setError("اكتب طلبًا واضحًا بين 15 و1800 حرف.");return;}
    setBusy(true);setError("");
    try{
      const {data,error:authError}=await supabase.auth.getUser();
      if(authError||!data.user){setError("سجّل الدخول أولًا لفتح مساعد Noata AI. لن تُرسل أي بيانات تلقائيًا.");return;}
      const handoff={owner:data.user.id,prompt,createdAt:Date.now()};
      sessionStorage.setItem("noata-ai-pending-context-v1",JSON.stringify(handoff));
      setOpen(false);
      router.push("/ai");
    }catch{
      setError("تعذّر تحضير الطلب بأمان. يمكنك فتح Noata AI مباشرة وكتابة طلبك هناك.");
    }finally{setBusy(false);}
  }
  return (<>
    <button type="button" className="noata-context-coach-trigger" onClick={()=>setOpen(true)}
      aria-label={"اطلب مساعدة Noata AI في "+context.heading}>
      <Icon name="sparkles" size={18}/><span>مساعد الصفحة</span>
    </button>
    <Dialog open={open} onClose={()=>{if(!busy)setOpen(false)}} title={context.heading}>
      <div className="noata-context-coach">
        <div className="noata-context-coach-heading"><span className="noata-context-coach-symbol"><Icon name="ai" size={24}/></span><p>{context.intro}</p></div>
        <div className="noata-context-coach-options" role="group" aria-label="اختار نوع المساعدة">
          {context.actions.map(action=><button key={action.id} type="button"
            aria-pressed={selected===action.id} onClick={()=>pick(action.id)}>
            <strong>{action.label}</strong><small>{action.description}</small>
          </button>)}
        </div>
        <label htmlFor={fieldId}>راجع طلبك وعدّله قبل الانتقال إلى المحادثة</label>
        <textarea id={fieldId} rows={4} maxLength={1800} value={draft}
          onChange={event=>{setDraft(event.target.value);setError("");}}
          placeholder="اكتب ماذا تريد أن تتعلم أو تنظم…"/>
        <div className="noata-context-coach-meta"><small>الرسالة مش هتتبعت تلقائيًا، ومساعد Noata ما يغيّرش درجات أو مكافآت أو إعدادات من نفسه.</small><span dir="ltr">{draft.length}/1800</span></div>
        {error&&<p className="noata-context-coach-error" role="alert">{error} <a href="/ai">افتح المحادثة</a></p>}
        <button className="noata-context-coach-submit" type="button" disabled={busy||!validatedCoachPrompt(draft)}
          onClick={()=>void prepare()}>{busy?"بنجهّز الطلب…":"افتح الطلب في Noata AI"}<Icon name="arrow" size={17}/></button>
      </div>
    </Dialog>
  </>);
}
