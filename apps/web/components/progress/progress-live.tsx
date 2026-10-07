"use client";

import {useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Row={
  mastery_score:number;
  state:string;
  independent_distinct_count:number;
  next_review_at:string|null;
  skills:{title_ar:string;title_en:string}|null;
};

export function ProgressLive(){
  const supabase=useMemo(()=>createClient(),[]);
  const [rows,setRows]=useState<Row[]>([]);
  const [signedIn,setSignedIn]=useState<boolean|null>(null);

  useEffect(()=>{
    void (async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){setSignedIn(false);return;}
      setSignedIn(true);
      const {data}=await supabase.from("skill_evidence")
        .select("mastery_score,state,independent_distinct_count,next_review_at,skills(title_ar,title_en)")
        .eq("user_id",user.id)
        .order("mastery_score",{ascending:true});
      setRows((data??[]) as Row[]);
    })();
  },[supabase]);

  if(signedIn===false){
    return <section className="panel" style={{padding:32,textAlign:"center"}}>
      <h1>تقدّمك بيتبني من أدائك الحقيقي.</h1>
      <p style={{color:"#6b7b92"}}>سجّل الدخول علشان Noata يحفظ الـ mastery والمراجعات ويفصلها عن XP والمكافآت.</p>
      <a className="btn" style={{background:"#102b52",color:"white"}} href="/login">سجّل الدخول</a>
    </section>;
  }

  const avg=rows.length?Math.round(rows.reduce((s,x)=>s+Number(x.mastery_score),0)/rows.length):0;
  const due=rows.filter(x=>x.next_review_at&&new Date(x.next_review_at)<=new Date()).length;
  const mastered=rows.filter(x=>x.state==="mastered"||x.state==="provisional_mastery").length;
  const evidence=rows.reduce((s,x)=>s+Number(x.independent_distinct_count),0);

  return <>
    <header className="topbar" style={{marginBottom:18}}>
      <div><div className="eyebrow" style={{color:"#2f7cff"}}>MASTERY</div><h1 style={{margin:"6px 0 0"}}>تقدمك الحقيقي</h1></div>
      <span className="pill">Evidence-based</span>
    </header>
    <section className="grid-4">
      <article className="metric-card"><span>Mastery score</span><strong>{avg}%</strong><small>across tracked skills</small></article>
      <article className="metric-card"><span>Review queue</span><strong>{due}</strong><small>مستحق الآن</small></article>
      <article className="metric-card"><span>Strong skills</span><strong>{mastered}</strong><small>provisional/mastered</small></article>
      <article className="metric-card"><span>Independent evidence</span><strong>{evidence}</strong><small>distinct questions</small></article>
    </section>
    <section className="panel" style={{marginTop:18}}>
      <div className="panel-head"><h2>خريطة المهارات</h2><span className="pill">Explainable mastery</span></div>
      <div className="quest-list">
        {rows.map((row,i)=><div className="quest" key={(row.skills?.title_ar??"skill")+i}>
          <div className="quest-icon">{Math.round(Number(row.mastery_score))}</div>
          <div><h3>{row.skills?.title_ar??"مهارة"}</h3><p>{row.state.replaceAll("_"," ")} · {row.independent_distinct_count} independent</p><div className="progress"><i style={{width:Number(row.mastery_score)+"%"}}/></div></div>
          <b>{Math.round(Number(row.mastery_score))}%</b>
        </div>)}
        {!rows.length&&<div style={{padding:18,color:"#6b7b92"}}>لسه مفيش evidence كفاية. ابدأ أول Mission علشان Noata يبني خريطة إتقانك.</div>}
      </div>
    </section>
  </>;
}
