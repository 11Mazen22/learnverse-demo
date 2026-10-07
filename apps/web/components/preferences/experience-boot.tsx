"use client";

import {useEffect,useMemo} from "react";
import {createClient} from "@/lib/supabase/client";

export function ExperienceBoot(){
  const supabase=useMemo(()=>createClient(),[]);

  useEffect(()=>{
    const localTheme=localStorage.getItem("noata-theme");
    if(localTheme==="light"||localTheme==="dark"){
      document.documentElement.dataset.theme=localTheme;
    }else{
      document.documentElement.dataset.theme=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
    }

    const localLocale=localStorage.getItem("noata-locale");
    if(localLocale==="ar"||localLocale==="en"){
      document.documentElement.lang=localLocale;
      document.documentElement.dir=localLocale==="ar"?"rtl":"ltr";
    }

    void (async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user)return;
      const {data}=await supabase.from("user_settings").select("theme,locale,reduced_motion").eq("user_id",user.id).maybeSingle();
      if(!data)return;

      localStorage.setItem("noata-theme",data.theme);
      localStorage.setItem("noata-locale",data.locale);

      const resolved=data.theme==="system"
        ?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")
        :data.theme;
      document.documentElement.dataset.theme=resolved;
      document.documentElement.lang=data.locale;
      document.documentElement.dir=data.locale==="ar"?"rtl":"ltr";
      document.documentElement.dataset.reducedMotion=data.reduced_motion?"true":"false";
    })();
  },[supabase]);

  return null;
}
