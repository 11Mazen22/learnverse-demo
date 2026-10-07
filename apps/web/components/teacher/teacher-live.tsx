"use client";

import {useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

export function TeacherLive(){
  const supabase=useMemo(()=>createClient(),[]);
  const [stats,setStats]=useState({classes:0,students:0,assignments:0,submissions:0});
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    void (async()=>{
      const [{data:classes},{data:members},{data:assignments},{data:submissions}]=await Promise.all([
        supabase.from("classes").select("id"),
        supabase.from("class_memberships").select("student_id"),
        supabase.from("assignments").select("id"),
        supabase.from("assignment_submissions").select("id")
      ]);
      setStats({
        classes:classes?.length??0,
        students:new Set((members??[]).map(x=>x.student_id)).size,
        assignments:assignments?.length??0,
        submissions:submissions?.length??0
      });
      setLoading(false);
    })();
  },[supabase]);

  return <>
    <header className="topbar" style={{marginBottom:18}}>
      <div><div className="eyebrow" style={{color:"#2f7cff"}}>TEACHER WORKSPACE</div><h1 style={{margin:"6px 0 0"}}>Class intelligence</h1></div>
      <span className="pill">Evidence, not surveillance</span>
    </header>
    <section className="grid-4">
      <article className="metric-card"><span>Classes</span><strong>{loading?"—":stats.classes}</strong><small>scoped access</small></article>
      <article className="metric-card"><span>Students</span><strong>{loading?"—":stats.students}</strong><small>across your classes</small></article>
      <article className="metric-card"><span>Assignments</span><strong>{loading?"—":stats.assignments}</strong><small>visible to you</small></article>
      <article className="metric-card"><span>Submissions</span><strong>{loading?"—":stats.submissions}</strong><small>RLS scoped</small></article>
    </section>
    <section className="content-grid">
      <article className="panel">
        <div className="panel-head"><h2>Learning evidence</h2><span className="pill">Live Supabase</span></div>
        <p style={{color:"#6b7b92",lineHeight:1.8}}>هنا هتظهر mastery heatmaps، due reviews، assisted dependency، ومحاولات الاسترجاع — وكلها evidence قابلة للتفسير بدل تصنيفات غامضة للطلاب.</p>
      </article>
      <aside className="panel">
        <div className="panel-head"><h2>Privacy rule</h2></div>
        <p style={{color:"#6b7b92",lineHeight:1.8}}>المعلم يشوف فقط الفصول الممنوحة له من قاعدة البيانات. مفيش client-side role spoofing ولا access لمجرد تغيير URL.</p>
      </aside>
    </section>
  </>;
}
