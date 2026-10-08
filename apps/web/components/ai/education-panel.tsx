"use client";
import {useState} from "react";
import {EDUCATION_FLOWS,buildEducationPrompt,type EducationFlowId} from "@/lib/ai/education-flows";
import {Icon} from "@/components/ui/icon";

export function EducationPanel({onUse}:{onUse:(value:string)=>void}){
  const [selected,setSelected]=useState<EducationFlowId>("quiz");
  const [topic,setTopic]=useState("");
  const [error,setError]=useState("");
  function prepare(){
    try{const prompt=buildEducationPrompt(selected,topic);onUse(prompt);setError("");}
    catch(e){setError(e instanceof Error?e.message:"راجع موضوع النشاط");}
  }
  return (
    <section className="aura-education-panel" aria-label="أدوات المذاكرة">
      <div className="aura-education-title">
        <span className="aura-education-icon"><Icon name="book" size={21}/></span>
        <div><strong>ورشة مذاكرتك</strong><small>اختار نشاطًا حقيقيًا، ثم أرسله لنموذج Fanar</small></div>
      </div>
      <div className="aura-education-grid" role="group" aria-label="نوع النشاط">
        {EDUCATION_FLOWS.map(flow=>(
          <button key={flow.id} type="button" aria-pressed={selected===flow.id}
            onClick={()=>setSelected(flow.id)}>
            <Icon name={flow.icon} size={19}/>
            <span><strong>{flow.title}</strong><small>{flow.description}</small></span>
          </button>
        ))}
      </div>
      <label className="aura-education-topic">
        <span>اكتب الدرس أو النص الذي تريد العمل عليه</span>
        <textarea value={topic} onChange={e=>setTopic(e.target.value)} maxLength={1200}
          placeholder="مثلًا: قانون جيب التمام، أو الفقرة التي تريد تلخيصها…" rows={3}/>
      </label>
      {error&&<p className="aura-education-error" role="alert">{error}</p>}
      <button className="aura-education-prepare" type="button" onClick={prepare} disabled={topic.trim().length<2}>
        ضع الطلب في المحادثة <Icon name="arrow" size={17}/>
      </button>
      <p className="aura-education-note">هذه قوالب تعليمية تُرسل إلى AI Chat؛ لا تُعد أدوات تصحيح مستقل أو مصادر حقائق موثقة.</p>
    </section>
  );
}
