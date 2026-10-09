"use client";

import { useEffect, useState } from "react";

import { PALETTES, PALETTE_STORAGE_KEY, isPalette, paletteFromStorage, resolvePalette, type Palette } from "@/lib/preferences/palette";

export function applyPalette(value: unknown) {
  document.documentElement.dataset.palette = resolvePalette(value);
}
function storedPalette(): Palette {
  try {
    return paletteFromStorage(window.localStorage, document.documentElement.dataset.palette);
  } catch {
    return resolvePalette(document.documentElement.dataset.palette);
  }
}

export function PaletteGallery({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState<Palette>("classic");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const update = () => setSelected(resolvePalette(document.documentElement.dataset.palette));
    const storageChanged = (event: StorageEvent) => {
      if (event.key !== PALETTE_STORAGE_KEY && event.key !== null) return;
      applyPalette(event.newValue);
      update();
    };
    if (!isPalette(document.documentElement.dataset.palette)) applyPalette(storedPalette());
    update();
    window.addEventListener("storage", storageChanged);
    window.addEventListener("noata-palette-change", update);
    return () => {
      window.removeEventListener("storage", storageChanged);
      window.removeEventListener("noata-palette-change", update);
    };
  }, []);
  function choose(value: Palette) {
    setSelected(value);
    applyPalette(value);
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, value);
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
        {PALETTES.map((item) => (
          <button key={item.id} data-palette-option={item.id} type="button" aria-pressed={selected === item.id}
            aria-label={item.ar + " — " + item.en} onClick={() => choose(item.id)}>
            <span className="noata-palette-swatch" style={{ backgroundColor: item.swatch }} aria-hidden="true" />
            <span><b>{item.ar}</b><small lang="en">{item.en}</small></span>
            {selected === item.id && <i aria-hidden="true">✓</i>}
          </button>
        ))}
      </div>
      {notice && <small role="status" className="noata-palette-notice">{notice}</small>}
      <small className="noata-palette-local">يمكن حفظ الألوان على هذا الجهاز فقط؛ المزامنة بين الأجهزة غير متاحة حاليًا.</small>
    </div>
  );
}
