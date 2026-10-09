"use client";
import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { Icon } from "@/components/ui/icon";
import { quranFetcher } from "@/lib/quran/reciters";
import { highlightedParts, type SearchVerse } from "@/lib/quran/search";
export function QuranSearch({ selected, onOpen }: { selected: number; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [within, setWithin] = useState(false);
  const [request, setRequest] = useState<{ term: string; selected: number; within: boolean } | null>(null);
  const key = request ? `/api/quran?search=${encodeURIComponent(request.term)}&selected=${request.selected}${request.within ? `&within=${request.selected}` : ""}` : null;
  const search = useSWR<{ results: SearchVerse[]; total: number }>(key, quranFetcher, { revalidateOnFocus: false, shouldRetryOnError: false });
  function submit(event: FormEvent) {
    event.preventDefault(); const term = query.trim();
    if (!term || term.length > 80) return;
    if (request?.term === term && request.within === within && request.selected === selected) void search.mutate();
    else setRequest({ term, selected, within });
  }
  return <section className="mushaf-search-section" aria-label="البحث الموثق في الآيات">
    <form className="aura-quran-search mushaf-global-search" onSubmit={submit}>
      <Icon name="search" size={20}/><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault(); }} placeholder="كلمة، عبارة، أو مرجع مثل ١٨:١٠…" aria-label="البحث في القرآن" maxLength={80}/><button type="submit" disabled={!query.trim() || search.isLoading}>{search.isLoading ? "جارٍ البحث…" : "بحث في الآيات"}<Icon name="arrow" size={16}/></button>
    </form>
    <div className="mushaf-search-help"><span>بحث في النص الأصلي · مع التشكيل أو بدونه</span><label><input type="checkbox" checked={within} onChange={e => setWithin(e.target.checked)}/>داخل السورة الحالية فقط</label></div>
    {request && <section className="aura-quran-search-results" aria-label="نتائج البحث"><div className="panel-head"><h2>نتائج البحث {search.data ? `· ${search.data.total.toLocaleString("ar-EG")}` : ""}</h2><button type="button" onClick={() => setRequest(null)}>إغلاق النتائج</button></div>
      {search.isLoading && <p role="status">جارٍ البحث في الفهرس الموثق…</p>}
      {search.error && <div role="alert">تعذّر تحميل فهرس المصحف. <button type="button" onClick={() => void search.mutate()}>إعادة المحاولة</button></div>}
      {search.data?.results.length === 0 && <p role="status">لا توجد آية مطابقة. جرّب عبارة أقصر أو تحقّق من المرجع.</p>}
      {search.data?.results.map(result => <button type="button" key={`${result.surah}:${result.number}`} onClick={() => { onOpen(`${result.surah}:${result.number}`); setRequest(null); }}><strong>{result.surahName} · الآية {result.number.toLocaleString("ar-EG")} <bdi>{result.surah}:{result.number}</bdi></strong><span dir="rtl" lang="ar">{highlightedParts(result.text, request.term).map((part, i) => part.matched ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>)}</span></button>)}
      {search.data && search.data.total > 50 && <p>تُعرض أول ٥٠ نتيجة؛ استخدم عبارة أدق أو قيّد البحث بسورة.</p>}
    </section>}
  </section>;
}
