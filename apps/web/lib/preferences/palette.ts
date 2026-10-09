export const PALETTES = [
  { id: "classic", ar: "Noata الأصلي", en: "Classic", swatch: "#0065b5" },
  { id: "aura", ar: "أورا", en: "Aura", swatch: "#6551bd" },
  { id: "ocean", ar: "المحيط", en: "Ocean", swatch: "#06738b" },
  { id: "forest", ar: "الغابة", en: "Forest", swatch: "#18694e" },
  { id: "sunset", ar: "الغروب", en: "Sunset", swatch: "#9b4626" },
  { id: "rose", ar: "الورد", en: "Rose", swatch: "#a03065" },
  { id: "midnight", ar: "منتصف الليل", en: "Midnight", swatch: "#465bb3" },
] as const;

export type Palette = (typeof PALETTES)[number]["id"];
export const PALETTE_STORAGE_KEY = "noata-palette";

export function isPalette(value: unknown): value is Palette {
  return typeof value === "string" && PALETTES.some(palette => palette.id === value);
}

export function resolvePalette(value: unknown): Palette {
  return isPalette(value) ? value : "classic";
}

export function paletteFromStorage(storage: Pick<Storage, "getItem">, fallback: unknown = "classic"): Palette {
  try {
    return resolvePalette(storage.getItem(PALETTE_STORAGE_KEY));
  } catch {
    return resolvePalette(fallback);
  }
}
