"use client";

import { useEffect, useState } from "react";

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
export function applyPalette(value: string | null) {
  document.documentElement.dataset.palette = valid(value) ? value : "classic";
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
  function choose(value: Palette) {
    setSelected(value);
    applyPalette(value);
    try {
      localStorage.setItem(KEY, value);
      setNotice("تم حفظ الطابع على هذا الجهاز");
    } catch {
      setNotice("الطابع يعمل لهذه الجلسة فقط");
    }
    window.dispatchEvent(new Event("noata-palette-change"));
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
      <small className="noata-palette-local">الألوان محفوظة على هذا الجهاز حاليًا، وليست متزامنة بين الأجهزة.</small>
    </div>
  );
}
