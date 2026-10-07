"use client";

import {FormEvent,useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {FANAR_CAPABILITIES} from "@/lib/ai/catalog";

type Settings={
  theme:string;
  locale:string;
  reduced_motion:boolean;
  default_ai_model:string;
  ai_memory_enabled:boolean;
};

export function SettingsLive(){
  const supabase=useMemo(()=>createClient(),[]);
  const [userId,setUserId]=useState("");
  const [email,setEmail]=useState("");
  const [name,setName]=useState("");
  const [settings,setSettings]=useState<Settings>({theme:"system",locale:"ar",reduced_motion:false,default_ai_model:"auto",ai_memory_enabled:true});
  const [password,setPassword]=useState("");
  const [status,setStatus]=useState("");

  useEffect(()=>{
    void (async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user)return;
      setUserId(user.id);setEmail(user.email??"");
      const [{data:profile},{data:row}]=await Promise.all([
        supabase.from("profiles").select("display_name,preferred_language").eq("id",user.id).single(),
        supabase.from("user_settings").select("theme,locale,reduced_motion,default_ai_model,ai_memory_enabled").eq("user_id",user.id).maybeSingle()
      ]);
      setName(profile?.display_name??"");
      if(row)setSettings(row as Settings);
      else await supabase.from("user_settings").upsert({user_id:user.id},{onConflict:"user_id"});
    })();
  },[supabase]);

  async function save(e:FormEvent){
    e.preventDefault();
    if(!userId)return;
    setStatus("Saving…");
    const [profileResult,settingsResult]=await Promise.all([
      supabase.from("profiles").update({display_name:name,preferred_language:settings.locale}).eq("id",userId),
      supabase.from("user_settings").upsert({user_id:userId,...settings},{onConflict:"user_id"})
    ]);
    if(profileResult.error||settingsResult.error){
      setStatus(profileResult.error?.message??settingsResult.error?.message??"Could not save");
      return;
    }
    localStorage.setItem("noata-theme",settings.theme);
    document.documentElement.lang=settings.locale;
    document.documentElement.dir=settings.locale==="ar"?"rtl":"ltr";
    if(settings.theme!=="system")document.documentElement.dataset.theme=settings.theme;
    else document.documentElement.dataset.theme=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
    setStatus("Saved ✓");
  }

  async function updatePassword(){
    if(password.length<8){setStatus("Password must be at least 8 characters.");return;}
    setStatus("Updating password…");
    const {error}=await supabase.auth.updateUser({password});
    setStatus(error?error.message:"Password updated ✓");
    if(!error)setPassword("");
  }

  if(!userId){
    return <section className="panel" style={{textAlign:"center",padding:32}}><h2>سجّل الدخول لإدارة إعداداتك.</h2><a className="btn" href="/login" style={{background:"#102b52",color:"white"}}>دخول</a></section>;
  }

  return <>
    <header className="topbar" style={{marginBottom:18}}>
      <div><div className="eyebrow" style={{color:"#2f7cff"}}>SETTINGS</div><h1 style={{margin:"6px 0 0"}}>حسابك وتجربتك</h1></div>
      <span className="pill">{email}</span>
    </header>

    <form onSubmit={save} className="content-grid">
      <section className="panel">
        <div className="panel-head"><h2>Profile</h2><span className="pill">Synced</span></div>
        <div style={{display:"grid",gap:12}}>
          <label><small>Display name</small><input className="search" style={{width:"100%",marginTop:6}} value={name} onChange={e=>setName(e.target.value)}/></label>
          <label><small>Language</small><select className="model-select" style={{width:"100%",marginTop:6}} value={settings.locale} onChange={e=>setSettings(s=>({...s,locale:e.target.value}))}><option value="ar">العربية</option><option value="en">English</option></select></label>
          <label><small>Theme</small><select className="model-select" style={{width:"100%",marginTop:6}} value={settings.theme} onChange={e=>setSettings(s=>({...s,theme:e.target.value}))}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
          <label style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><span><b>Reduced motion</b><small style={{display:"block",color:"#6b7b92"}}>قلّل الحركات والانتقالات.</small></span><input type="checkbox" checked={settings.reduced_motion} onChange={e=>setSettings(s=>({...s,reduced_motion:e.target.checked}))}/></label>
        </div>
      </section>

      <aside className="panel">
        <div className="panel-head"><h2>Noata AI</h2></div>
        <div style={{display:"grid",gap:12}}>
          <label><small>Default model</small><select className="model-select" style={{width:"100%",marginTop:6}} value={settings.default_ai_model} onChange={e=>setSettings(s=>({...s,default_ai_model:e.target.value}))}><option value="auto">Auto · Smart Router</option>{FANAR_CAPABILITIES.filter(x=>x.visibleInPicker).map(x=><option value={x.id} key={x.id}>{x.label}</option>)}</select></label>
          <label style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center"}}><span><b>AI conversation memory</b><small style={{display:"block",color:"#6b7b92"}}>احفظ محادثاتك في حسابك.</small></span><input type="checkbox" checked={settings.ai_memory_enabled} onChange={e=>setSettings(s=>({...s,ai_memory_enabled:e.target.checked}))}/></label>
        </div>
      </aside>

      <section className="panel">
        <div className="panel-head"><h2>Security</h2></div>
        <label><small>New password</small><input className="search" style={{width:"100%",marginTop:6}} type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="8+ characters"/></label>
        <button type="button" onClick={()=>void updatePassword()} disabled={!password} className="btn" style={{background:"#102b52",color:"white",marginTop:12}}>Update password</button>
      </section>

      <aside className="panel">
        <div className="panel-head"><h2>Save changes</h2></div>
        <p style={{color:"#6b7b92",lineHeight:1.7}}>الإعدادات دي مرتبطة بحسابك، وتكمل معاك على أي جهاز تسجّل منه.</p>
        <button className="btn" style={{background:"#102b52",color:"white",width:"100%"}}>Save settings</button>
        {status&&<small style={{display:"block",marginTop:10,color:status.includes("✓")?"#158456":"#6b7b92"}}>{status}</small>}
      </aside>
    </form>
  </>;
}
