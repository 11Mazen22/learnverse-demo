"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";

type Theme = "light" | "dark" | "system";
const choices: {value:Theme;label:string;description:string;icon:string}[] = [
  {value:"light",label:"نهاري",description:"إضاءة مريحة وواضحة",icon:"sun"},
  {value:"dark",label:"ليلي",description:"ألوان هادئة ومساحة أغمق",icon:"moon"},
  {value:"system",label:"تلقائي",description:"اتبع مظهر جهازك",icon:"screen"},
];
function isTheme(value:unknown):value is Theme {
  return value==="light" || value==="dark" || value==="system";
}
function apply(theme:Theme) {
  document.documentElement.dataset.theme =
    theme==="system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : theme;
}
export function ThemeControl() {
  const supabase=useMemo(()=>createClient(),[]);
  const [theme,setTheme]=useState<Theme>("system");
  const [open,setOpen]=useState(false);
  const [notice,setNotice]=useState("");
  const menu=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    let active=true;
    const stored=localStorage.getItem("noata-theme");
    const initial:isThemeGuard = isTheme(stored) ? stored : "system";
    setTheme(initial);
    apply(initial);
    const media=window.matchMedia("(prefers-color-scheme: dark)");
    const osChanged=()=>{
      const current=localStorage.getItem("noata-theme");
      if(!isTheme(current)||current==="system") apply("system");
    };
    media.addEventListener("change",osChanged);
    const outside=(event:PointerEvent)=>{
      if(!menu.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown",outside);
    void (async()=>{
      try{
        const {data:{user}}=await supabase.auth.getUser();
        if(!user||!active)return;
        const {data}=await supabase.from("user_settings")
          .select("theme").eq("user_id",user.id).maybeSingle();
        if(!active||!isTheme(data?.theme))return;
        setTheme(data.theme);
        localStorage.setItem("noata-theme",data.theme);
        apply(data.theme);
      }catch{
        // Device preference stays functional offline.
      }
    })();
    return ()=>{
      active=false;
      media.removeEventListener("change",osChanged);
      document.removeEventListener("pointerdown",outside);
    };
  },[supabase]);
  useEffect(()=>{
    if(!open)return;
    const onEscape=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();setOpen(false);}
    };
    document.addEventListener("keydown",onEscape);
    return ()=>document.removeEventListener("keydown",onEscape);
  },[open]);

  async function choose(next:Theme) {
    setTheme(next);
    setOpen(false);
    setNotice("");
    localStorage.setItem("noata-theme",next);
    apply(next);
    try{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user)return;
      const {error}=await supabase.from("user_settings")
        .upsert({user_id:user.id,theme:next},{onConflict:"user_id"});
      if(error) setNotice("تم حفظ المظهر على هذا الجهاز فقط.");
    }catch{
      setNotice("تم حفظ المظهر على هذا الجهاز فقط.");
    }
  }
  const activeChoice=choices.find(x=>x.value===theme)??choices[2];
  return (
    <div className="aura-theme-picker" ref={menu}>
      <button
        type="button"
        className="top-icon"
        onClick={()=>setOpen(x=>!x)}
        aria-label={"تغيير المظهر: "+activeChoice.label}
        aria-haspopup="true"
        aria-expanded={open}
        title={"المظهر: "+activeChoice.label}
      >
        <Icon name={activeChoice.icon} size={19}/>
      </button>
      {open && (
        <div className="aura-theme-menu" role="group" aria-label="اختيار المظهر">
          <strong>المظهر</strong>
          {choices.map(choice=>(
            <button type="button" key={choice.value}
              onClick={()=>void choose(choice.value)}
              aria-pressed={theme===choice.value}
              className={theme===choice.value?"selected":""}
            >
              <Icon name={choice.icon} size={18}/>
              <span><b>{choice.label}</b><small>{choice.description}</small></span>
              {theme===choice.value && <Icon name="check" size={15}/>}
            </button>
          ))}
        </div>
      )}
      {notice && <span className="aura-theme-notice" role="status">{notice}</span>}
    </div>
  );
}
type isThemeGuard = Theme;
