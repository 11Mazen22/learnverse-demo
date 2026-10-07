"use client";

import {useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

export function AdminLive(){
  const supabase=useMemo(()=>createClient(),[]);
  const [counts,setCounts]=useState({draft:0,review:0,approved:0,published:0});
  const [items,setItems]=useState<{id:string;prompt_ar:string;review_status:string;publication_status:string}[]>([]);

  useEffect(()=>{
    void (async()=>{
      const {data}=await supabase.from("questions")
        .select("id,prompt_ar,review_status,publication_status")
        .order("created_at",{ascending:false});
      const rows=data??[];
      setItems(rows.slice(0,8));
      setCounts({
        draft:rows.filter(x=>x.review_status==="draft").length,
        review:rows.filter(x=>x.review_status==="in_review").length,
        approved:rows.filter(x=>x.review_status==="approved").length,
        published:rows.filter(x=>x.publication_status==="published"||x.publication_status==="published_demo").length
      });
    })();
  },[supabase]);

  return <>
    <header className="topbar" style={{marginBottom:18}}>
      <div><div className="eyebrow" style={{color:"#2f7cff"}}>CONTENT STUDIO</div><h1 style={{margin:"6px 0 0"}}>Build, review, publish</h1></div>
      <span className="pill">Admin scoped</span>
    </header>
    <section className="grid-4">
      <article className="metric-card"><span>Drafts</span><strong>{counts.draft}</strong><small>not visible to students</small></article>
      <article className="metric-card"><span>In review</span><strong>{counts.review}</strong><small>awaiting review</small></article>
      <article className="metric-card"><span>Approved</span><strong>{counts.approved}</strong><small>review passed</small></article>
      <article className="metric-card"><span>Published</span><strong>{counts.published}</strong><small>demo + production</small></article>
    </section>
    <section className="panel" style={{marginTop:18}}>
      <div className="panel-head"><h2>Content queue</h2><span className="pill">Draft → Review → Approve → Publish</span></div>
      <div className="quest-list">
        {items.map((item,i)=><div className="quest" key={item.id}>
          <div className="quest-icon">{i+1}</div>
          <div><h3>{item.prompt_ar}</h3><p>{item.review_status} · {item.publication_status}</p></div>
          <span className="pill">{item.review_status}</span>
        </div>)}
      </div>
    </section>
  </>;
}
