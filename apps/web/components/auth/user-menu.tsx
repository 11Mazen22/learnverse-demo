"use client";

import {useEffect,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Profile={display_name:string;role:"student"|"teacher"|"admin";xp:number;coins:number};

export function UserMenu(){
  const [profile,setProfile]=useState<Profile|null>(null);
  const [email,setEmail]=useState<string|null>(null);

  useEffect(()=>{
    const supabase=createClient();
    void (async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user)return;
      setEmail(user.email??null);
      const {data}=await supabase.from("profiles")
        .select("display_name,role,xp,coins")
        .eq("id",user.id)
        .single();
      if(data)setProfile(data as Profile);
    })();
  },[]);

  if(!email){
    return <a className="btn" style={{background:"#eef4ff",color:"#286ee7",minHeight:40}} href="/login">دخول</a>;
  }

  async function logout(){
    const supabase=createClient();
    await supabase.auth.signOut();
    window.location.href="/login";
  }

  const name=profile?.display_name?.trim()||email.split("@")[0];
  return <div style={{display:"flex",alignItems:"center",gap:10}}>
    <div style={{textAlign:"end"}}>
      <div style={{fontSize:12,fontWeight:800}}>{name}</div>
      <div style={{fontSize:10,color:"#7b8ca4"}}>{profile?.role??"student"} · {profile?.coins??0} Coins</div>
    </div>
    <button onClick={logout} title="Sign out" className="avatar" style={{border:0}}>{name.slice(0,1).toUpperCase()}</button>
  </div>;
}
