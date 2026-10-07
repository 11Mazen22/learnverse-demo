"use client";

import {useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

export function StaffNav({active}:{active:string}){
  const supabase=useMemo(()=>createClient(),[]);
  const [role,setRole]=useState<"student"|"teacher"|"admin">("student");

  useEffect(()=>{
    void (async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user)return;
      const {data}=await supabase.from("profiles").select("role").eq("id",user.id).single();
      if(data?.role)setRole(data.role);
    })();
  },[supabase]);

  if(role==="student")return null;
  const items=role==="admin"
    ?[["Teacher","/teacher","◫"],["Studio","/admin","▣"]]
    :[["Teacher","/teacher","◫"]];

  return <div className="nav-group">
    <div className="nav-title">Workspace</div>
    {items.map(([label,href,icon])=><a className={"nav-link "+(active===href?"active":"")} href={href} key={href}><span>{icon}</span>{label}</a>)}
  </div>;
}
