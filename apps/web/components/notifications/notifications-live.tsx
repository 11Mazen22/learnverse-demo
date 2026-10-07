"use client";

import {useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Notice={id:string;type:string;title:string;body:string;href:string|null;read_at:string|null;created_at:string};

export function NotificationsLive(){
  const supabase=useMemo(()=>createClient(),[]);
  const [rows,setRows]=useState<Notice[]>([]);
  const [signedIn,setSignedIn]=useState<boolean|null>(null);

  async function load(){
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setSignedIn(false);return;}
    setSignedIn(true);
    const {data}=await supabase.from("notifications").select("id,type,title,body,href,read_at,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(100);
    setRows((data??[]) as Notice[]);
  }

  useEffect(()=>{void load();},[]);

  async function mark(id:string){
    await supabase.from("notifications").update({read_at:new Date().toISOString()}).eq("id",id);
    setRows(r=>r.map(x=>x.id===id?{...x,read_at:new Date().toISOString()}:x));
  }

  async function markAll(){
    const unread=rows.filter(x=>!x.read_at).map(x=>x.id);
    if(!unread.length)return;
    await supabase.from("notifications").update({read_at:new Date().toISOString()}).in("id",unread);
    setRows(r=>r.map(x=>({...x,read_at:x.read_at??new Date().toISOString()})));
  }

  if(signedIn===false)return <section className="panel" style={{textAlign:"center",padding:32}}><h2>سجّل الدخول لعرض إشعاراتك.</h2><a className="btn" href="/login" style={{background:"#102b52",color:"white"}}>دخول</a></section>;

  return <>
    <header className="topbar" style={{marginBottom:18}}><div><div className="eyebrow" style={{color:"#2f7cff"}}>INBOX</div><h1 style={{margin:"6px 0 0"}}>الإشعارات</h1></div><button className="btn" onClick={()=>void markAll()} style={{background:"#eef4ff",color:"#286ee7"}}>Mark all read</button></header>
    <section className="panel">
      <div className="quest-list">
        {rows.map(row=><a href={row.href??"#"} onClick={()=>void mark(row.id)} key={row.id} className="quest" style={{opacity:row.read_at?.72:1}}>
          <div className="quest-icon">{row.read_at?"✓":"•"}</div>
          <div><h3>{row.title}</h3><p>{row.body}</p><small style={{color:"#91a0b4"}}>{new Date(row.created_at).toLocaleString()}</small></div>
          <span className="pill">{row.type}</span>
        </a>)}
        {!rows.length&&<div style={{padding:28,textAlign:"center",color:"#6b7b92"}}>كل شيء هادي هنا — مفيش إشعارات جديدة.</div>}
      </div>
    </section>
  </>;
}
