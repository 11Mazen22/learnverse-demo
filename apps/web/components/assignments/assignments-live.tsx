"use client";

import {FormEvent,useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Assignment={
  id:string;title:string;instructions:string;due_at:string|null;published_at:string|null;
  classes:{name:string}|null;
};
type Submission={assignment_id:string;submitted_at:string|null;score:number|null;metadata:unknown};
type Item={
  assignment_id:string;position:number;question_id:string;
  questions:{id:string;question_type:string;prompt_ar:string;choices_ar:unknown}|null;
};
type Grade={correct?:boolean;explanation_ar?:string};

const choices=(value:unknown)=>Array.isArray(value)?value.map(String):[];

export function AssignmentsLive(){
  const supabase=useMemo(()=>createClient(),[]);
  const [signedIn,setSignedIn]=useState<boolean|null>(null);
  const [userId,setUserId]=useState("");
  const [rows,setRows]=useState<Assignment[]>([]);
  const [submissions,setSubmissions]=useState<Submission[]>([]);
  const [selected,setSelected]=useState<string|null>(null);
  const [items,setItems]=useState<Item[]>([]);
  const [idx,setIdx]=useState(0);
  const [answer,setAnswer]=useState("");
  const [grade,setGrade]=useState<Grade|null>(null);
  const [results,setResults]=useState<Record<string,boolean>>({});
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function load(){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setSignedIn(false);return;}
    setSignedIn(true);setUserId(user.id);
    const [{data:a},{data:s}]=await Promise.all([
      supabase.from("assignments").select("id,title,instructions,due_at,published_at,classes(name)").order("due_at",{ascending:true}),
      supabase.from("assignment_submissions").select("assignment_id,submitted_at,score,metadata").eq("student_id",user.id)
    ]);
    setRows((a??[]) as Assignment[]);
    setSubmissions((s??[]) as Submission[]);
  }

  useEffect(()=>{void load();},[]);

  async function openAssignment(id:string){
    setSelected(id);setIdx(0);setAnswer("");setGrade(null);setResults({});setError("");
    const {data,error}=await supabase.from("assignment_items")
      .select("assignment_id,position,question_id,questions(id,question_type,prompt_ar,choices_ar)")
      .eq("assignment_id",id).order("position");
    if(error){setError(error.message);return;}
    setItems((data??[]) as Item[]);
  }

  const current=items[idx]?.questions;
  const selectedAssignment=rows.find(x=>x.id===selected);
  const existing=submissions.find(x=>x.assignment_id===selected);

  async function check(e:FormEvent){
    e.preventDefault();
    if(!current||!answer||busy)return;
    setBusy(true);setError("");
    const {data,error}=await supabase.rpc("submit_attempt",{
      p_question_id:current.id,
      p_response:{value:answer},
      p_assisted:false,
      p_idempotency_key:crypto.randomUUID(),
      p_practice_repeat:false
    });
    if(error){setError(error.message);setBusy(false);return;}
    const row=(data??{}) as Grade;
    setGrade(row);
    setResults(r=>({...r,[current.id]:Boolean(row.correct)}));
    setBusy(false);
  }

  async function next(){
    if(idx<items.length-1){setIdx(x=>x+1);setAnswer("");setGrade(null);return;}
    if(!selected||!userId)return;
    setBusy(true);setError("");
    const correct=Object.values(results).filter(Boolean).length+(grade?.correct&&!results[current?.id??""]?1:0);
    const metadata={question_count:items.length,correct_count:correct,client_completed:true};
    const {error}=await supabase.from("assignment_submissions").upsert({
      assignment_id:selected,
      student_id:userId,
      submitted_at:new Date().toISOString(),
      metadata,
      score:null
    },{onConflict:"assignment_id,student_id"});
    if(error){setError(error.message);setBusy(false);return;}
    await load();
    setBusy(false);
  }

  if(signedIn===false)return <section className="panel" style={{textAlign:"center",padding:32}}><h2>Assignments مرتبطة بحسابك وفصلك.</h2><a className="btn" href="/login" style={{background:"#102b52",color:"white"}}>دخول</a></section>;

  if(selected){
    if(existing?.submitted_at)return <section className="panel" style={{padding:34,textAlign:"center"}}>
      <div className="quest-icon" style={{margin:"0 auto"}}>✓</div>
      <h1>تم التسليم</h1>
      <p style={{color:"#6b7b92"}}>{selectedAssignment?.title}</p>
      <p>{existing.score==null?"في انتظار تقييم المعلم":"النتيجة: "+existing.score+"%"}</p>
      <button className="btn" onClick={()=>setSelected(null)} style={{background:"#102b52",color:"white"}}>رجوع للواجبات</button>
    </section>;

    return <>
      <header className="topbar" style={{marginBottom:18}}>
        <div><div className="eyebrow" style={{color:"#2f7cff"}}>ASSIGNMENT</div><h1 style={{margin:"6px 0 0"}}>{selectedAssignment?.title}</h1></div>
        <span className="pill">{idx+1}/{items.length||1}</span>
      </header>
      <section className="panel" style={{padding:28}}>
        {!current?<p>Loading assignment…</p>:<form onSubmit={check}>
          <h2 style={{lineHeight:1.6}}>{current.prompt_ar}</h2>
          {current.question_type==="multiple-choice"
            ?<div style={{display:"grid",gap:10}}>{choices(current.choices_ar).map((x,i)=><button type="button" disabled={Boolean(grade)} key={x} onClick={()=>setAnswer(String(i))} style={{textAlign:"start",padding:14,borderRadius:14,border:"1px solid "+(answer===String(i)?"#2f7cff":"var(--line)"),background:answer===String(i)?"rgba(47,124,255,.08)":"var(--surface)",color:"var(--ink)"}}>{String.fromCharCode(65+i)}. {x}</button>)}</div>
            :<input className="search" style={{width:"100%"}} value={answer} disabled={Boolean(grade)} onChange={e=>setAnswer(e.target.value)} inputMode="decimal" placeholder="الإجابة…"/>}
          {grade&&<div style={{marginTop:16,padding:16,borderRadius:15,background:grade.correct?"rgba(24,166,106,.09)":"rgba(227,87,87,.08)"}}><b>{grade.correct?"صح":"راجع الفكرة"}</b><p>{grade.explanation_ar}</p></div>}
          {error&&<p style={{color:"#e35757"}}>{error}</p>}
          <div style={{display:"flex",justifyContent:"space-between",gap:10,marginTop:18}}>
            <button type="button" className="btn" onClick={()=>setSelected(null)} style={{background:"#eef4ff",color:"#286ee7"}}>خروج</button>
            {!grade?<button disabled={!answer||busy} className="btn" style={{background:"#102b52",color:"white"}}>تحقق</button>:<button type="button" disabled={busy} onClick={()=>void next()} className="btn" style={{background:"#102b52",color:"white"}}>{idx===items.length-1?"تسليم الواجب":"التالي"}</button>}
          </div>
        </form>}
      </section>
    </>;
  }

  return <>
    <header className="topbar" style={{marginBottom:18}}><div><div className="eyebrow" style={{color:"#2f7cff"}}>ASSIGNMENTS</div><h1 style={{margin:"6px 0 0"}}>واجباتك</h1></div><span className="pill">{rows.length} available</span></header>
    <section className="quest-list">
      {rows.map(row=>{
        const sub=submissions.find(x=>x.assignment_id===row.id);
        const overdue=row.due_at&&new Date(row.due_at)<new Date()&&!sub?.submitted_at;
        return <article className="panel" key={row.id} style={{padding:18}}>
          <div className="panel-head">
            <div><h2>{row.title}</h2><p style={{color:"#6b7b92",margin:"5px 0"}}>{row.classes?.name??"Class"} · {row.instructions}</p></div>
            <span className="pill">{sub?.submitted_at?(sub.score==null?"Submitted":"Score "+sub.score+"%"):overdue?"Overdue":"Open"}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}>
            <small style={{color:"#7b8ca4"}}>{row.due_at?"Due "+new Date(row.due_at).toLocaleString():"No due date"}</small>
            <button className="btn" onClick={()=>void openAssignment(row.id)} style={{background:"#102b52",color:"white"}}>{sub?.submitted_at?"View":"Start"}</button>
          </div>
        </article>;
      })}
      {!rows.length&&<section className="panel" style={{padding:30,textAlign:"center",color:"#6b7b92"}}>مفيش واجبات منشورة ليك حاليًا.</section>}
    </section>
  </>;
}
