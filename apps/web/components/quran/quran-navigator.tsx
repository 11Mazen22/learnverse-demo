"use client";
import {reciterDisplayName} from "@/lib/i18n/quran-labels";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import type { Chapter } from "@/lib/quran/reciters";
import { searchChapters } from "@/lib/quran/search";
export function QuranNavigator({ chapters, selected, onSelect, bookmarks, onBookmark, loading, error, retry }: {
  chapters: Chapter[]; selected: number; onSelect: (number: number) => void; bookmarks: string[]; onBookmark: (id: string) => void; loading: boolean; error: boolean; retry: () => void;
}) {
 const t=useTranslation(),locale=useLocale();
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<"surahs" | "saved">("surahs");
  const filtered = useMemo(() => searchChapters(chapters, filter), [chapters, filter]);
  return <aside className="mushaf-navigator" aria-label={t("فهرس المصحف","Quran index")}>
    <div className="mushaf-section-heading"><span className="mushaf-icon"><Icon name="book" size={20}/></span><div><h2>{t("رحلتك مع القرآن","Your Quran journey")}</h2><p>{t("اختر السورة، وخذ وقتك.","Choose a surah and take your time.")}</p></div></div>
    <div className="mushaf-segmented" aria-label={t("عرض الفهرس","Show index")}>
      <button type="button" aria-pressed={tab === "surahs"} onClick={() => setTab("surahs")}>{t("السور","Surahs")}<span>{t("١١٤","114")}</span></button>
      <button type="button" aria-pressed={tab === "saved"} onClick={() => setTab("saved")}>{t("العلامات","Bookmarks")}<span>{bookmarks.length.toLocaleString(locale==="en"?"en":"ar-EG")}</span></button>
    </div>
    {tab === "surahs" ? <>
      <label className="mushaf-index-search"><Icon name="search" size={17}/><input value={filter} maxLength={80} onChange={e => setFilter(e.target.value)} onKeyDown={e => { if (e.nativeEvent.isComposing || e.keyCode === 229) return; if (e.key === "Enter" && filtered[0]) { e.preventDefault(); onSelect(filtered[0].number); } if (e.key === "ArrowDown") { e.preventDefault(); e.currentTarget.closest("aside")?.querySelector<HTMLButtonElement>(".mushaf-surah-item")?.focus(); } }} placeholder={t("اسم السورة، رقمها، أو اسمها بالإنجليزية","Surah name or number")} aria-label={t("تصفية السور","Filter surahs")} /></label>
      <div className="mushaf-surah-list">
        {loading && <p role="status" className="mushaf-empty">{t("جارٍ تحميل الفهرس…","Loading the index…")}</p>}
        {error && <div className="mushaf-empty" role="status">{t("تعذّر تحميل الفهرس.","Could not load the index.")}<button type="button" onClick={retry}>{t("إعادة المحاولة","Try again")}</button></div>}
        {!loading && !error && !filtered.length && <p className="mushaf-empty">{t("لا توجد سورة بهذا الاسم.","No matching surah.")}</p>}
        {filtered.map(s => <button className="mushaf-surah-item" type="button" key={s.number} aria-current={selected === s.number ? "true" : undefined} onClick={() => onSelect(s.number)}>
          <span className="mushaf-surah-number">{s.number.toLocaleString(locale==="en"?"en":"ar-EG")}</span><span><strong>{locale==="en"?s.englishName:s.name}</strong><small>{s.numberOfAyahs.toLocaleString(locale==="en"?"en":"ar-EG")}{t("آيات ·","verses ·")}{s.revelationType === "Meccan" ? t("مكية","Meccan") : s.revelationType === "Medinan" ? t("مدنية","Medinan") : s.englishName}</small></span><Icon name={selected === s.number ? "check" : "arrow"} size={16}/>
        </button>)}
      </div>
    </> : <div className="mushaf-saved-list">
      <p className="mushaf-device-note"><Icon name="pin" size={15}/>{t("علامات محفوظة على هذا الجهاز فقط، لا تتزامن مع حسابك.","Bookmarks stay on this device and do not sync with your account.")}</p>
      {!bookmarks.length && <div className="mushaf-empty"><Icon name="pin" size={28}/><h3>{t("موضعك ينتظرك هنا","Your place is waiting here")}</h3><p>{t("اضغط علامة الحفظ بجوار أي آية لتعود إليها بسهولة.","Bookmark a verse to return to it easily.")}</p></div>}
      {[...bookmarks].reverse().map(id => { const [surah, ayah] = id.split(":").map(Number); const found=chapters.find(s=>s.number===surah);const name=locale==="en"?found?.englishName:found?.name; return <button className="mushaf-saved-item" type="button" key={id} onClick={() => onBookmark(id)}><Icon name="pin" size={17}/><span><strong>{name ?? `${t("السورة","Surah")} ${surah.toLocaleString(locale==="en"?"en":"ar-EG")}`}</strong><small>{t("الآية","Verse")}{ayah.toLocaleString(locale==="en"?"en":"ar-EG")}</small></span><Icon name="arrow" size={16}/></button>; })}
    </div>}
    <div className="mushaf-index-foot"><Icon name="check" size={14}/><span>{t("النص القرآني مستقل عن Noata AI","Scripture is separate from Noata AI")}</span></div>
  </aside>;
}
