"use client";

import {useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

export function RoleGate({allow,children}:{allow:("teacher"|"admin")[];children:React.ReactNode}){
  const supabase=useMemo(()=>createClient(),[]);
  const [state,setState]=useState<"loading"|"allowed"|"denied"|"signed-out">("loading");

  useEffect(()=>{
    void (async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){setState("signed-out");return;}
      const {data}=await supabase.from("profiles").select("role").eq("id",user.id).single();
      setState(data&&allow.includes(data.role as "teacher"|"admin")?"allowed":"denied");
    })();
  },[allow,supabase]);

  if(state==="loading")return <section className="panel"><p>Loading workspace…</p></section>;
  if(state==="signed-out")return <section className="panel" style={{textAlign:"center",padding:30}}><h2>سجّل الدخول أولًا</h2><a className="btn" style={{background:"#102b52",color:"white"}} href="/login">دخول</a></section>;
  if(state==="denied")return <section className="panel" style={{textAlign:"center",padding:30}}><h2>المساحة دي مش متاحة لحسابك.</h2><p style={{color:"#6b7b92"}}>Teacher/Admin access بيتحدد من Noata roles، مش من الواجهة.</p><a className="btn" style={{background:"#eef4ff",color:"#286ee7"}} href="/">رجوع</a></section>;
  return <>{children}</>;
}
