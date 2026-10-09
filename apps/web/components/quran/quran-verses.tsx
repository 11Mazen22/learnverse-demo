"use client";
import { Icon } from "@/components/ui/icon";
import type { Verse } from "@/lib/quran/reciters";
export function QuranVerses({ verses, surah, bookmarks, size, mode, highlighted, onBookmark }: { verses: Verse[]; surah: number; bookmarks: string[]; size: number; mode: "verses" | "flow"; highlighted: string | null; onBookmark: (number: number) => void }) {
  return <div className={`mushaf-verses ${mode === "flow" ? "mushaf-flow" : ""}`}>
    {verses.map(v => { const id = `${surah}:${v.number}`; const saved = bookmarks.includes(id); return <article id={`ayah-${surah}-${v.number}`} tabIndex={-1} className={`aura-quran-ayah ${highlighted === id ? "mushaf-highlighted" : ""}`} key={id} aria-label={`الآية ${v.number.toLocaleString("ar-EG")}`}>
      {mode === "verses" && <div className="aura-quran-ayah-actions"><span className="aura-ayah-number">{v.number.toLocaleString("ar-EG")}</span><button type="button" onClick={() => onBookmark(v.number)} aria-pressed={saved} aria-label={saved ? "إزالة العلامة" : "حفظ موضع الآية"}><Icon name="pin" size={16}/></button></div>}
      <p className="aura-quran-verse" dir="rtl" lang="ar" style={{ fontSize: `${(32 * size / 100).toFixed(1)}px` }}>{v.text}{mode === "flow" ? <button className="mushaf-verse-bookmark aura-quran-verse-number" type="button" aria-pressed={saved} aria-label={`${saved ? "إزالة علامة" : "حفظ موضع"} الآية ${v.number.toLocaleString("ar-EG")}`} onClick={() => onBookmark(v.number)}> ﴿{v.number.toLocaleString("ar-EG")}﴾</button> : <span className="aura-quran-verse-number"> ﴿{v.number.toLocaleString("ar-EG")}﴾</span>}</p>
    </article>; })}
  </div>;
}
