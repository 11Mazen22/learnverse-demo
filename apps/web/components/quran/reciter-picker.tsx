"use client";
import { useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { REQUESTED_RECITERS, type Reciter, type ReciterId } from "@/lib/quran/reciters";
export function ReciterPicker({ reciters, selected, onSelect, loading, error, retry }: { reciters: Reciter[]; selected: ReciterId; onSelect: (id: ReciterId) => void; loading: boolean; error: boolean; retry: () => void }) {
  const disclosure = useRef<HTMLDetailsElement>(null);
  const active = REQUESTED_RECITERS.find(r => r.id === selected)!;
  return <details className="mushaf-reciters" ref={disclosure}>
    <summary><span className="mushaf-reciter-avatar">{active.initials}</span><span className="mushaf-reciter-summary"><small>صوت يرافق قراءتك</small><strong>{active.name}</strong><span>تغيير القارئ · ٩ أصوات</span></span><Icon name="chevron" size={20}/></summary>
    <div className="mushaf-reciter-directory">
      <div className="mushaf-reciter-directory-head"><div><h2>أصوات تُحبّها</h2><p>اختيارك يخصّ السورة والآيات. نوضّح التسجيلات غير المتاحة دون تبديل القارئ.</p></div><button type="button" aria-label="إغلاق اختيار القارئ" onClick={() => { disclosure.current?.removeAttribute("open"); disclosure.current?.querySelector("summary")?.focus(); }}><Icon name="close" size={18}/></button></div>
      {loading && <p role="status" className="mushaf-device-note">جارٍ التحقق من التلاوات المتاحة…</p>}
      {error && <p role="status" className="mushaf-device-note">تعذّر الاتصال بمصدر التلاوات. القراءة ما زالت متاحة. <button type="button" onClick={retry}>إعادة المحاولة</button></p>}
      <div className="mushaf-reciter-grid">
        {REQUESTED_RECITERS.map((r, index) => { const available = reciters.find(item => item.id === r.id); return <button type="button" className="mushaf-reciter-card" key={r.id} aria-pressed={r.id === selected} onClick={() => onSelect(r.id)}>
          <span className="mushaf-reciter-card-top"><span className="mushaf-reciter-avatar">{r.initials}</span><span className="mushaf-reciter-order" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{r.id === selected && <span className="mushaf-reciter-selected"><Icon name="check" size={13}/></span>}</span>
          <strong>{r.name}</strong><small>{available?.server ? available.style : loading ? "جارٍ التحقق من المصدر" : "التلاوة غير متاحة حاليًا"}</small>
        </button>; })}
      </div>
      <p className="mushaf-reciter-source">السور: <a href="https://mp3quran.net/ar" target="_blank" rel="noopener noreferrer">MP3Quran</a> · الآيات: <a href="https://everyayah.com/" target="_blank" rel="noopener noreferrer">EveryAyah</a>، تسجيل مستقل قد يختلف عن تسجيل السورة. أرشيف مصطفى إسماعيل جزئي؛ لم نتحقق من مصدر آيات لحسن صالح. لا نُنشئ أو نقلّد أصوات القرّاء.</p>
    </div>
  </details>;
}
