"use client";

import {FormEvent,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Mode="signin"|"signup"|"forgot";

export default function LoginPage(){
  const [mode,setMode]=useState<Mode>("signin");
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);

  async function submit(e:FormEvent){
    e.preventDefault();setBusy(true);setError("");setMessage("");
    const supabase=createClient();

    if(mode==="forgot"){
      const {error}=await supabase.auth.resetPasswordForEmail(email,{
        redirectTo:window.location.origin+"/auth/update-password"
      });
      setBusy(false);
      if(error){setError(error.message);return;}
      setMessage("لو الإيميل موجود، هتوصلك رسالة استعادة كلمة المرور.");
      return;
    }

    if(mode==="signin"){
      const {error}=await supabase.auth.signInWithPassword({email,password});
      if(error){setError(error.message);setBusy(false);return;}
      window.location.href="/";
      return;
    }

    if(password.length<8){
      setError("استخدم كلمة مرور 8 حروف على الأقل.");
      setBusy(false);return;
    }

    const {data,error}=await supabase.auth.signUp({
      email,password,
      options:{
        data:{display_name:name.trim()},
        emailRedirectTo:window.location.origin+"/auth/callback"
      }
    });
    if(error){setError(error.message);setBusy(false);return;}
    if(data.session){
      window.location.href="/";
      return;
    }
    setMessage("الحساب اتعمل. افتح رسالة التأكيد في الإيميل وبعدها Noata هيكمّل تسجيل الدخول.");
    setBusy(false);
  }

  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:20}}>
    <section className="panel" style={{width:"min(460px,100%)",padding:30}}>
      <div className="brand" style={{padding:0,marginBottom:24,color:"var(--ink)"}}>
        <div className="brand-mark">N</div>
        <div className="brand-copy"><strong>Noata</strong><span style={{color:"var(--muted)"}}>Learn • Grow • Achieve</span></div>
      </div>

      {mode!=="forgot"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,padding:5,borderRadius:14,background:"rgba(120,140,165,.10)",marginBottom:20}}>
        <button type="button" onClick={()=>setMode("signin")} style={{border:0,borderRadius:10,padding:9,fontWeight:800,background:mode==="signin"?"var(--surface)":"transparent",color:"var(--ink)"}}>دخول</button>
        <button type="button" onClick={()=>setMode("signup")} style={{border:0,borderRadius:10,padding:9,fontWeight:800,background:mode==="signup"?"var(--surface)":"transparent",color:"var(--ink)"}}>حساب جديد</button>
      </div>}

      <div className="eyebrow" style={{color:"#2f7cff"}}>{mode==="signin"?"WELCOME BACK":mode==="signup"?"START YOUR JOURNEY":"RECOVER ACCOUNT"}</div>
      <h1 style={{margin:"6px 0 8px"}}>{mode==="signin"?"كمّل رحلتك":mode==="signup"?"ابدأ Noata":"استعادة كلمة المرور"}</h1>
      <p style={{color:"var(--muted)",lineHeight:1.7}}>{mode==="signin"
        ?"تقدمك، الـ mastery، المكافآت، ومحادثات Noata AI محفوظة مع حسابك."
        :mode==="signup"
          ?"حساب الطالب يبدأ بصلاحيات طالب فقط. Teacher/Admin بيتمنحوا من الإدارة."
          :"اكتب الإيميل المرتبط بحسابك، وهنبعت رابط آمن لتغيير كلمة المرور."}</p>

      <form onSubmit={submit} style={{display:"grid",gap:12,marginTop:20}}>
        {mode==="signup"&&<input className="search" style={{width:"100%"}} required value={name} onChange={e=>setName(e.target.value)} placeholder="الاسم"/>}
        <input className="search" style={{width:"100%"}} type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/>
        {mode!=="forgot"&&<input className="search" style={{width:"100%"}} type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/>}
        {error&&<div style={{color:"#e35757",fontSize:12}}>{error}</div>}
        {message&&<div style={{color:"#158456",fontSize:12,lineHeight:1.6}}>{message}</div>}
        <button disabled={busy} className="btn" style={{background:"#102b52",color:"#fff"}}>
          {busy?"جارٍ التنفيذ…":mode==="signin"?"دخول":mode==="signup"?"إنشاء الحساب":"إرسال رابط الاستعادة"}
        </button>
      </form>

      {mode==="signin"&&<button type="button" onClick={()=>{setMode("forgot");setError("");setMessage("");}} style={{display:"block",margin:"14px auto 0",border:0,background:"transparent",color:"#2f7cff",fontWeight:700}}>نسيت كلمة المرور؟</button>}
      {mode==="forgot"&&<button type="button" onClick={()=>{setMode("signin");setError("");setMessage("");}} style={{display:"block",margin:"14px auto 0",border:0,background:"transparent",color:"#2f7cff",fontWeight:700}}>رجوع للدخول</button>}
      <a href="/" style={{display:"block",marginTop:16,textAlign:"center",fontSize:12,color:"var(--muted)"}}>استكشف Noata بدون حساب</a>
    </section>
  </main>;
}
