"use client";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { normalizeQuranQuery as normalize, type Chapter } from "@/lib/quran/reciters";
export function QuranNavigator({ chapters, selected, onSelect, bookmarks, onBookmark, loading, error, retry }: {
  chapters: Chapter[]; selected: number; onSelect: (number: number) => void; bookmarks: string[]; onBookmark: (id: string) => void; loading: boolean; error: boolean; retry: () => void;
}) {
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<"surahs" | "saved">("surahs");
  const filtered = useMemo(() => chapters.filter(s => normalize(`${s.name} ${s.englishName} ${s.number}`).includes(normalize(filter.trim()))), [chapters, filter]);
  return <aside className="mushaf-navigator" aria-label="فهرس المصحف">
    <div className="mushaf-section-heading"><span className="mushaf-icon"><Icon name="book" size={20}/></span><div><h2>رحلتك مع القرآن</h2><p>اختر السورة، وخذ وقتك.</p></div></div>
    <div className="mushaf-segmented" aria-label="عرض الفهرس">
      <button type="button" aria-pressed={tab === "surahs"} onClick={() => setTab("surahs")}>السور <span>١١٤</span></button>
      <button type="button" aria-pressed={tab === "saved"} onClick={() => setTab("saved")}>العلامات <span>{bookmarks.length.toLocaleString("ar-EG")}</span></button>
    </div>
    {tab === "surahs" ? <>
      <label className="mushaf-index-search"><Icon name="search" size={17}/><input value={filter} onChange={e => setFilter(e.target.value)} placeholder="اسم السورة أو رقمها" aria-label="تصفية السور" /></label>
      <div className="mushaf-surah-list">
        {loading && <p role="status" className="mushaf-empty">جارٍ تحميل الفهرس…</p>}
        {error && <div className="mushaf-empty" role="status">تعذّر تحميل الفهرس.<button type="button" onClick={retry}>إعادة المحاولة</button></div>}
        {!loading && !error && !filtered.length && <p className="mushaf-empty">لا توجد سورة بهذا الاسم.</p>}
        {filtered.map(s => <button className="mushaf-surah-item" type="button" key={s.number} aria-current={selected === s.number ? "true" : undefined} onClick={() => onSelect(s.number)}>
          <span className="mushaf-surah-number">{s.number.toLocaleString("ar-EG")}</span><span><strong>{s.name}</strong><small>{s.numberOfAyahs.toLocaleString("ar-EG")} آيات · {s.revelationType === "Meccan" ? "مكية" : s.revelationType === "Medinan" ? "مدنية" : s.englishName}</small></span><Icon name={selected === s.number ? "check" : "arrow"} size={16}/>
        </button>)}
      </div>
    </> : <div className="mushaf-saved-list">
      <p className="mushaf-device-note"><Icon name="pin" size={15}/> علامات محفوظة على هذا الجهاز فقط، لا تتزامن مع حسابك.</p>
      {!bookmarks.length && <div className="mushaf-empty"><Icon name="pin" size={28}/><h3>موضعك ينتظرك هنا</h3><p>اضغط علامة الحفظ بجوار أي آية لتعود إليها بسهولة.</p></div>}
      {[...bookmarks].reverse().map(id => { const [surah, ayah] = id.split(":").map(Number); const name = chapters.find(s => s.number === surah)?.name; return <button className="mushaf-saved-item" type="button" key={id} onClick={() => onBookmark(id)}><Icon name="pin" size={17}/><span><strong>{name ?? `السورة ${surah.toLocaleString("ar-EG")}`}</strong><small>الآية {ayah.toLocaleString("ar-EG")}</small></span><Icon name="arrow" size={16}/></button>; })}
    </div>}
    <div className="mushaf-index-foot"><Icon name="check" size={14}/><span>النص القرآني مستقل عن Noata AI</span></div>
  </aside>;
}
