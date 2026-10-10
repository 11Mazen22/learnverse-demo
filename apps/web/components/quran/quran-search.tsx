"use client";
import {reciterDisplayName} from "@/lib/i18n/quran-labels";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { Icon } from "@/components/ui/icon";
import { quranFetcher } from "@/lib/quran/reciters";
import { highlightedParts, type SearchVerse } from "@/lib/quran/search";
export function QuranSearch({ selected, onOpen }: { selected: number; onOpen: (id: string) => void }) {
 const t=useTranslation(),locale=useLocale();
  const [query, setQuery] = useState("");
  const [within, setWithin] = useState(false);
  const [request, setRequest] = useState<{ term: string; selected: number; within: boolean } | null>(null);
  const key = request ? `/api/quran?search=${encodeURIComponent(request.term)}&selected=${request.selected}${request.within ? `&within=${request.selected}` : ""}` : null;
  const search = useSWR<{ results: SearchVerse[]; total: number; partial?: boolean; surahs?: {number: number; name: string}[] }>(key, quranFetcher, { revalidateOnFocus: false, shouldRetryOnError: false });
  function submit(event: FormEvent) {
    event.preventDefault(); const term = query.trim();
    if (!term || term.length > 50) return;
    if (request?.term === term && request.within === within && request.selected === selected) void search.mutate();
    else setRequest({ term, selected, within });
  }
  return <section className="mushaf-search-section" aria-label={t("البحث الموثق في الآيات","Search sourced verses")}>
    <form className="aura-quran-search mushaf-global-search" onSubmit={submit}>
      <Icon name="search" size={20}/><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault(); }} placeholder={t("كلمة، عبارة، أو مرجع مثل ١٨:١٠…","Arabic word, phrase, or reference such as 18:10…")} aria-label={t("البحث في القرآن","Search Quran")} maxLength={50}/><button type="submit" disabled={!query.trim() || search.isLoading}>{search.isLoading ? t("جارٍ البحث…","Searching…") : t("بحث في الآيات","Search verses")}<Icon name="arrow" size={16}/></button>
    </form>
    <div className="mushaf-search-help"><span>{t("بحث في النص الأصلي · مع التشكيل أو بدونه","Search the original Arabic text, with or without diacritics")}</span><label><input type="checkbox" checked={within} onChange={e => setWithin(e.target.checked)}/>{t("داخل السورة الحالية فقط","Current surah only")}</label></div>
    {request && <section className="aura-quran-search-results" aria-label={t("نتائج البحث","Search results")}><div className="panel-head"><h2>{t("نتائج البحث","Search results")}{search.data ? `· ${search.data.total.toLocaleString(locale==="en"?"en":"ar-EG")}` : ""}</h2><button type="button" onClick={() => setRequest(null)}>{t("إغلاق النتائج","Close results")}</button></div>
      {search.isLoading && <p role="status">{t("جارٍ البحث في الفهرس الموثق…","Searching the sourced index…")}</p>}
      {search.error && <div role="alert">{t("تعذّر تحميل فهرس المصحف.","Could not load the Quran index.")}<button type="button" onClick={() => void search.mutate()}>{t("إعادة المحاولة","Try again")}</button></div>}
      {search.data?.partial && <p role="status">{t("البحث داخل الآيات متوقف مؤقتًا؛ نتائج أسماء السور متاحة.","Verse search is temporarily unavailable. Surah name results are available.")}</p>}
      {search.data?.surahs?.map(surah => <button key={surah.number} type="button" onClick={() => { onOpen(`${surah.number}:1`); setRequest(null); }}><strong>{surah.name}</strong><span>{t("افتح السورة","Open surah")}</span></button>)}
      {search.data?.results.length === 0 && <p role="status">{t("لا توجد آية مطابقة. جرّب عبارة أقصر أو تحقّق من المرجع.","No matching verse. Try a shorter phrase or check the reference.")}</p>}
      {search.data?.results.map(result => <button type="button" key={`${result.surah}:${result.number}`} onClick={() => { onOpen(`${result.surah}:${result.number}`); setRequest(null); }}><strong>{result.surahName}{t("· الآية","· Verse")}{result.number.toLocaleString(locale==="en"?"en":"ar-EG")} <bdi>{result.surah}:{result.number}</bdi></strong><span dir="rtl" lang="ar">{highlightedParts(result.text, request.term).map((part, i) => part.matched ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>)}</span></button>)}
      {search.data && search.data.total > 50 && <p>{t("تُعرض أول ٥٠ نتيجة؛ استخدم عبارة أدق أو قيّد البحث بسورة.","Showing the first 50 results. Refine the phrase or limit the search to a surah.")}</p>}
    </section>}
  </section>;
}
