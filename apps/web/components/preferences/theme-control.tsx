"use client";

import {useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type Theme="light"|"dark"|"system";

function resolved(theme:Theme){
  if(theme!=="system")return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
}

export function ThemeControl(){
  const supabase=useMemo(()=>createClient(),[]);
  const [theme,setTheme]=useState<Theme>("system");

  useEffect(()=>{
    void (async()=>{
      const local=(localStorage.getItem("noata-theme") as Theme|null)??"system";
      setTheme(local);
      document.documentElement.dataset.theme=resolved(local);

      const {data:{user}}=await supabase.auth.getUser();
      if(!user)return;
      const {data}=await supabase.from("user_settings").select("theme").eq("user_id",user.id).maybeSingle();
      if(data?.theme){
        const next=data.theme as Theme;
        setTheme(next);
        localStorage.setItem("noata-theme",next);
        document.documentElement.dataset.theme=resolved(next);
      }
    })();
  },[supabase]);

  async function cycle(){
    const next:Theme=theme==="system"?"light":theme==="light"?"dark":"system";
    setTheme(next);
    localStorage.setItem("noata-theme",next);
    document.documentElement.dataset.theme=resolved(next);

    const {data:{user}}=await supabase.auth.getUser();
    if(user){
      await supabase.from("user_settings").upsert({user_id:user.id,theme:next},{onConflict:"user_id"});
    }
  }

  const icon=theme==="dark"?"☾":theme==="light"?"☀":"◐";
  return <button type="button" className="top-icon" title={"Theme: "+theme} onClick={()=>void cycle()} aria-label={"Theme: "+theme}>{icon}</button>;
}
