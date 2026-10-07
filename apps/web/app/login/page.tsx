"use client";

import {FormEvent,useState} from "react";
import {createClient} from "@/lib/supabase/client";

export default function LoginPage(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  async function submit(e:FormEvent){
    e.preventDefault();setBusy(true);setError("");
    const supabase=createClient();
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error){setError(error.message);setBusy(false);return;}
    window.location.href="/";
  }

  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:20}}>
    <section className="panel" style={{width:"min(440px,100%)",padding:28}}>
      <div className="brand" style={{padding:0,marginBottom:24,color:"#10213a"}}><div className="brand-mark">N</div><div className="brand-copy"><strong>Noata</strong><span style={{color:"#6b7b92"}}>Learn • Grow • Achieve</span></div></div>
      <div className="eyebrow" style={{color:"#2f7cff"}}>WELCOME BACK</div><h1 style={{margin:"6px 0 8px"}}>كمّل رحلتك</h1><p style={{color:"#6b7b92",lineHeight:1.7}}>سجّل دخولك علشان تقدّمك، الـ mastery، المكافآت، ومحادثات Noata AI تفضل محفوظة.</p>
      <form onSubmit={submit} style={{display:"grid",gap:12,marginTop:20}}>
        <input className="search" style={{width:"100%"}} type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/>
        <input className="search" style={{width:"100%"}} type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/>
        {error&&<div style={{color:"#e35757",fontSize:12}}>{error}</div>}
        <button disabled={busy} className="btn" style={{background:"#102b52",color:"#fff"}}>{busy?"جارٍ الدخول…":"دخول"}</button>
      </form>
    </section>
  </main>;
}
