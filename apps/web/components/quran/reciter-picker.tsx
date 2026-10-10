"use client";
import {reciterDisplayName} from "@/lib/i18n/quran-labels";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import { useRef } from "react";
import { Icon } from "@/components/ui/icon";
import { REQUESTED_RECITERS, type Reciter, type ReciterId } from "@/lib/quran/reciters";
export function ReciterPicker({ reciters, selected, onSelect, loading, error, retry }: { reciters: Reciter[]; selected: ReciterId; onSelect: (id: ReciterId) => void; loading: boolean; error: boolean; retry: () => void }) {
 const t=useTranslation(),locale=useLocale();
  const disclosure = useRef<HTMLDetailsElement>(null);
  const active = REQUESTED_RECITERS.find(r => r.id === selected)!;
  return <details className="mushaf-reciters" ref={disclosure}>
    <summary><span className="mushaf-reciter-avatar">{locale==="en"?reciterDisplayName(active.name,locale).split(" ").filter(Boolean).slice(0,2).map(n=>n[0]).join(""):active.initials}</span><span className="mushaf-reciter-summary"><small>{t("صوت يرافق قراءتك","A voice for your reading")}</small><strong>{reciterDisplayName(active.name,locale)}</strong><span>{t("تغيير القارئ · ٩ أصوات","Change reciter · 9 voices")}</span></span><Icon name="chevron" size={20}/></summary>
    <div className="mushaf-reciter-directory">
      <div className="mushaf-reciter-directory-head"><div><h2>{t("أصوات تُحبّها","Choose your reciter")}</h2><p>{t("اختيارك يخصّ السورة والآيات. نوضّح التسجيلات غير المتاحة دون تبديل القارئ.","Your choice applies to surah and verse recordings. Unavailable recordings are identified without changing your reciter.")}</p></div><button type="button" aria-label={t("إغلاق اختيار القارئ","Close reciter selection")} onClick={() => { disclosure.current?.removeAttribute("open"); disclosure.current?.querySelector("summary")?.focus(); }}><Icon name="close" size={18}/></button></div>
      {loading && <p role="status" className="mushaf-device-note">{t("جارٍ التحقق من التلاوات المتاحة…","Checking available recordings…")}</p>}
      {error && <p role="status" className="mushaf-device-note">{t("تعذّر الاتصال بمصدر التلاوات. القراءة ما زالت متاحة.","Could not reach the recording source. Reading is still available.")}<button type="button" onClick={retry}>{t("إعادة المحاولة","Try again")}</button></p>}
      <div className="mushaf-reciter-grid">
        {REQUESTED_RECITERS.map((r, index) => { const available = reciters.find(item => item.id === r.id); return <button type="button" className="mushaf-reciter-card" key={r.id} aria-pressed={r.id === selected} onClick={() => onSelect(r.id)}>
          <span className="mushaf-reciter-card-top"><span className="mushaf-reciter-avatar">{locale==="en"?reciterDisplayName(r.name,locale).split(" ").filter(Boolean).slice(0,2).map(n=>n[0]).join(""):r.initials}</span><span className="mushaf-reciter-order" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{r.id === selected && <span className="mushaf-reciter-selected"><Icon name="check" size={13}/></span>}</span>
          <strong>{reciterDisplayName(r.name,locale)}</strong><small>{available?.server ? t(available.style,"Hafs from Asim · Murattal") : loading ? t("جارٍ التحقق من المصدر","Checking the source") : t("التلاوة غير متاحة حاليًا","Recording currently unavailable")}</small>
        </button>; })}
      </div>
      <p className="mushaf-reciter-source">{t("السور:","Surahs:")}<a href="https://mp3quran.net/ar" target="_blank" rel="noopener noreferrer">MP3Quran</a>{t("· آيات السديس:","· Sudais verses:")}<a href="https://alquran.cloud/api" target="_blank" rel="noopener noreferrer">AlQuran Cloud</a>{t("· بقية الآيات:","· Other verses:")}<a href="https://everyayah.com/" target="_blank" rel="noopener noreferrer">EveryAyah</a>{t("، تسجيل مستقل قد يختلف عن تسجيل السورة. أرشيف مصطفى إسماعيل جزئي؛ لم نتحقق من مصدر آيات لحسن صالح. لا نُنشئ أو نقلّد أصوات القرّاء.",". Verse recordings are separate from surah recordings. Mustafa Ismail’s archive is partial; a verse source for Hasan Saleh is unverified. Reciter voices are not generated or imitated.")}</p>
    </div>
  </details>;
}
