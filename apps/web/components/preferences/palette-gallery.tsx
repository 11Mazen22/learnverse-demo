"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";

type Palette = "classic" | "aura" | "ocean" | "forest" | "sunset" | "rose" | "midnight";
const PRESETS: { id: Palette; ar: string; en: string; swatch: string }[] = [
  { id: "classic", ar: "Noata الأصلي", en: "Classic", swatch: "#0065b5" },
  { id: "aura", ar: "أورا", en: "Aura", swatch: "#6551bd" },
  { id: "ocean", ar: "المحيط", en: "Ocean", swatch: "#06738b" },
  { id: "forest", ar: "الغابة", en: "Forest", swatch: "#18694e" },
  { id: "sunset", ar: "الغروب", en: "Sunset", swatch: "#ad5330" },
  { id: "rose", ar: "الورد", en: "Rose", swatch: "#a03065" },
  { id: "midnight", ar: "منتصف الليل", en: "Midnight", swatch: "#8da6ff" },
];
const KEY = "noata-palette";
function valid(p: string | null): p is Palette {
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
  document.documentElement.dataset.palette = valid(value) ? value : "classic";
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
  const [selected, setSelected] = useState<Palette>("classic");
  const [notice, setNotice] = useState("");
  const account = useVerifiedAccount();
  const supabase = useMemo(() => createClient(), []);
  const saveSequence = useRef(0);
  useEffect(() => {
    const update = () => {
      const value = storedPalette();
      setSelected(value);
      applyPalette(value);
    };
    update();
    window.addEventListener("storage", update);
    window.addEventListener("noata-palette-change", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("noata-palette-change", update);
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
          .select("palette").eq("user_id", account.user!.id).maybeSingle();
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
      setNotice("تم حفظ الطابع على هذا الجهاز");
    } catch {
      setNotice("الطابع يعمل لهذه الجلسة فقط");
    }
    window.dispatchEvent(new Event("noata-palette-change"));
    const user = account.user;
    const seq = ++saveSequence.current;
    if (!user) return;
    setNotice("جارٍ مزامنة الطابع مع حسابك…");
    try {
      const {data,error}=await supabase.from("user_settings")
        .upsert({user_id:user.id,palette:value,updated_at:new Date().toISOString()},
          {onConflict:"user_id"})
        .select("palette").single();
      if (seq !== saveSequence.current) return;
      if (error || data?.palette !== value) {
        setNotice("الطابع يعمل على هذا الجهاز، لكن لم تتأكد مزامنته مع حسابك. حاول مجددًا.");
      } else {
        setNotice("تم حفظ الطابع على حسابك وتأكيده من الخادم.");
      }
    } catch {
      if (seq === saveSequence.current)
        setNotice("الطابع محفوظ على الجهاز؛ المزامنة غير متاحة حاليًا.");
    }
  }
  return (
    <div className={compact ? "noata-palette-gallery compact" : "noata-palette-gallery"} role="group" aria-label="Noata themes">
      <div className="noata-palette-heading"><b>عالَم Noata</b><small>اختار ألوان رحلتك</small></div>
      <div className="noata-palette-grid">
        {PRESETS.map((item) => (
          <button key={item.id} type="button" aria-pressed={selected === item.id}
            aria-label={item.ar + " — " + item.en} onClick={() => choose(item.id)}>
            <span className="noata-palette-swatch" style={{ backgroundColor: item.swatch }} aria-hidden="true">✦</span>
            <span><b>{item.ar}</b><small lang="en">{item.en}</small></span>
            {selected === item.id && <i aria-hidden="true">✓</i>}
          </button>
        ))}
      </div>
      {notice && <small role="status" className="noata-palette-notice">{notice}</small>}
      <small className="noata-palette-local">{account.user ? "اختيارك يتزامن مع حسابك عند تأكيد الاتصال؛ الجهاز يحتفظ بنسخته المحلية." : "اختيارك محفوظ على هذا الجهاز؛ سجّل الدخول لتفعيل مزامنة الحساب."}</small>
    </div>
  );
}
