"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import { resolveAppearance, safeAppearance } from "@/lib/appearance/mode";
import {clearCustomDesign} from "@/lib/appearance/theme";
import {SavedDesignChoices} from "@/components/preferences/design-studio";
import {localized,useLocale} from "@/lib/i18n/locale";

type Palette = "classic" | "aura" | "ocean" | "forest" | "sunset" | "rose" | "midnight";
const PRESETS: { id: Palette; ar: string; en: string; swatch: string }[] = [
  { id: "classic", ar: "Noata الأصلي", en: "Classic", swatch: "#0065b5" },
  { id: "aura", ar: "أورا", en: "Aura", swatch: "#6551bd" },
  { id: "ocean", ar: "المحيط", en: "Ocean", swatch: "#06738b" },
  { id: "forest", ar: "الغابة", en: "Forest", swatch: "#18694e" },
  { id: "sunset", ar: "الغروب", en: "Sunset", swatch: "#9b4626" },
  { id: "rose", ar: "الورد", en: "Rose", swatch: "#a03065" },
  { id: "midnight", ar: "منتصف الليل", en: "Midnight", swatch: "#8da6ff" },
];
const KEY = "noata-palette";
function valid(p: string | null | undefined): p is Palette {
  return PRESETS.some((item) => item.id === p);
}
/** Keep browser/PWA chrome aligned with the selected page palette where supported. */
export function syncBrowserThemeColor() {
  const color = getComputedStyle(document.documentElement).getPropertyValue("--surface-soft").trim();
  if (!color) return;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = color;
  });
}
export function applyPalette(value: string | null) {
  const palette = valid(value) ? value : "classic";
  clearCustomDesign();
  document.documentElement.dataset.palette = palette;
  let wanted: string | null = null;
  try { wanted = localStorage.getItem("noata-theme"); } catch { /* private device */ }
  document.documentElement.dataset.theme = resolveAppearance(safeAppearance(wanted),palette,window.matchMedia("(prefers-color-scheme: dark)").matches);
  syncBrowserThemeColor();
}
function storedPalette(): Palette {
  try {
    const value = localStorage.getItem(KEY);
    return valid(value) ? value : "classic";
  } catch {
    return "classic";
  }
}

export function PaletteGallery({ compact = false }: { compact?: boolean }) {
  const locale=useLocale(),t=(ar:string,en:string)=>localized(locale,ar,en);
  const [selected, setSelected] = useState<Palette | null>("classic");
  const [notice, setNotice] = useState("");
  const account = useVerifiedAccount();
  const supabase = useMemo(() => createClient(), []);
  const saveSequence = useRef(0);
  useEffect(() => {
    const update = () => {
      if(document.documentElement.dataset.palette==="custom"){setSelected(null);return;}
      const value = storedPalette();
      setSelected(value);
      applyPalette(value);
    };
    update();
    window.addEventListener("storage", update);
    window.addEventListener("noata-palette-change", update);
    window.addEventListener("noata-custom-theme-change", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("noata-palette-change", update);
      window.removeEventListener("noata-custom-theme-change", update);
    };
  }, []);
  useEffect(() => {
    if (account.loading) return;
    const seq = ++saveSequence.current;
    if (!account.user) return;
    let alive = true;
    void (async () => {
      try {
        const { data } = await supabase.from("user_settings")
          .select("palette,active_design_id").eq("user_id", account.user!.id).maybeSingle();
        if(data?.active_design_id)return;
        if (!alive || seq !== saveSequence.current || !valid(data?.palette)) return;
        setSelected(data.palette);
        applyPalette(data.palette);
        try { localStorage.setItem(KEY, data.palette); } catch { /* session preference still works */ }
        window.dispatchEvent(new Event("noata-palette-change"));
      } catch {
        /* Device preference is the safe fallback if the account is offline. */
      }
    })();
    return () => { alive = false; };
  }, [account.loading, account.user, supabase]);
  async function choose(value: Palette) {
    setSelected(value);
    applyPalette(value);
    try {
      localStorage.setItem(KEY, value);
       setNotice(t("تم حفظ الطابع على هذا الجهاز","Palette saved on this device"));
    } catch {
       setNotice(t("الطابع يعمل لهذه الجلسة فقط","Palette active for this session only"));
    }
    window.dispatchEvent(new Event("noata-palette-change"));
    const user = account.user;
    const seq = ++saveSequence.current;
    if (!user) return;
     setNotice(t("جارٍ مزامنة الطابع مع حسابك…","Syncing the palette with your account…"));
    try {
      const {data,error}=await supabase.from("user_settings")
        .upsert({user_id:user.id,palette:value,active_design_id:null,updated_at:new Date().toISOString()},
          {onConflict:"user_id"})
        .select("palette").single();
      if (seq !== saveSequence.current) return;
      if (error || data?.palette !== value) {
         setNotice(t("الطابع يعمل على هذا الجهاز، لكن لم تتأكد مزامنته مع حسابك. حاول مجددًا.","The palette is active on this device, but account sync could not be confirmed. Please try again."));
      } else {
         setNotice(t("تم حفظ الطابع على حسابك وتأكيده من الخادم.","The palette was saved to your account and confirmed by the server."));
      }
    } catch {
      if (seq === saveSequence.current)
         setNotice(t("الطابع محفوظ على الجهاز؛ المزامنة غير متاحة حاليًا.","The palette is saved on this device. Sync is currently unavailable."));
    }
  }
  return (
     <div className={compact ? "noata-palette-gallery compact" : "noata-palette-gallery"} role="group" aria-label={t("تصاميم Noata","Noata themes")}>
       <div className="noata-palette-heading"><b>{t("عالَم Noata","Noata worlds")}</b><small>{t("اختار ألوان رحلتك","Choose your journey's colors")}</small></div>
      <div className="noata-palette-grid">
        {PRESETS.map((item) => (
          <button key={item.id} type="button" aria-pressed={selected === item.id}
             aria-label={locale==="ar"?item.ar + " — " + item.en:item.en} onClick={() => choose(item.id)}>
            <span className="noata-palette-swatch" style={{ backgroundColor: item.swatch, color: item.id === "midnight" ? "#0d1530" : "#fff" }} aria-hidden="true">✦</span>
             <span><b>{t(item.ar,item.en)}</b>{locale==="ar"&&<small lang="en">{item.en}</small>}</span>
            {selected === item.id && <i aria-hidden="true">✓</i>}
          </button>
        ))}
      </div>
      {compact&&<SavedDesignChoices/>}
      {notice && <small role="status" className="noata-palette-notice">{notice}</small>}
       <small className="noata-palette-local">{account.user ? t("اختيارك يتزامن مع حسابك عند تأكيد الاتصال؛ الجهاز يحتفظ بنسخته المحلية.","Your choice syncs with your account when confirmed. This device keeps a local copy.") : t("اختيارك محفوظ على هذا الجهاز؛ سجّل الدخول لتفعيل مزامنة الحساب.","Your choice is saved on this device. Sign in to sync it with your account.")}</small>
    </div>
  );
}
