"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import useSWR from "swr";
import { Icon } from "@/components/ui/icon";
import { QuranNavigator } from "./quran-navigator";
import { ReciterPicker } from "./reciter-picker";
import { RecitationPlayer } from "./recitation-player";
import { QuranVerses } from "./quran-verses";
import { VerseRecitation } from "./verse-recitation";
import { chapterRecitation, quranFetcher, REQUESTED_RECITERS, type Chapter, type ChapterResponse, type Reciter, type ReciterId } from "@/lib/quran/reciters";

const LOCAL_KEY = "noata-quran-bookmarks-v1";
const READING_SIZE_KEY = "noata-quran-reading-percent-v2";
const INITIAL: Chapter = { number: 1, name: "الفاتحة", englishName: "Al-Faatiha", numberOfAyahs: 7 };
const boundSize = (n: number) => Number.isFinite(n) ? Math.round(Math.max(80, Math.min(160, n)) / 10) * 10 : 100;
type SearchResponse = { results: { surah: number; surahName: string; number: number; text: string }[]; total: number };
const options = { revalidateOnFocus: false, shouldRetryOnError: false };

export function QuranReader() {
  const [selected, setSelected] = useState(1);
  const [reciterId, setReciterId] = useState<ReciterId>("minshawi");
  const [playingVerse, setPlayingVerse] = useState<number | null>(null);
  const [pauseSignal, setPauseSignal] = useState(0);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [readerSize, setReaderSize] = useState(100);
  const [notice, setNotice] = useState("");
  const [focused, setFocused] = useState(false);
  const [mode, setMode] = useState<"verses" | "flow">("verses");
  const [targetAyah, setTargetAyah] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [jump, setJump] = useState("");
  const [jumpError, setJumpError] = useState("");
  const index = useSWR<{ surahs: Chapter[] }>("/api/quran?list=1", quranFetcher, options);
  const reading = useSWR<ChapterResponse>(`/api/quran?surah=${selected}&text=1`, quranFetcher, options);
  const catalogue = useSWR<{ reciters: Reciter[] }>("/api/quran?reciters=1", quranFetcher, options);
  const search = useSWR<SearchResponse>(searchTerm ? `/api/quran?search=${encodeURIComponent(searchTerm)}` : null, quranFetcher, options);
  const chapters = index.data?.surahs ?? [];
  const chapter = reading.data?.surah ?? chapters.find(s => s.number === selected) ?? (selected === 1 ? INITIAL : { ...INITIAL, number: selected, name: `السورة ${selected.toLocaleString("ar-EG")}`, numberOfAyahs: 0, englishName: "" });
  const verses = reading.data?.verses ?? [];
  const reciters = catalogue.data?.reciters ?? [];
  const reciter = reciters.find(r => r.id === reciterId);
  const identity = REQUESTED_RECITERS.find(r => r.id === reciterId)!;
  const audioUrl = chapterRecitation(reciter, selected);
  const source = reading.data?.source;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(READING_SIZE_KEY);
      if (saved && /^\d{2,3}$/.test(saved)) setReaderSize(boundSize(Number(saved)));
      const stored: unknown = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
      if (Array.isArray(stored)) setBookmarks(stored.filter((id): id is string => typeof id === "string" && /^\d{1,3}:\d{1,3}$/.test(id) && Number(id.split(":")[0]) >= 1 && Number(id.split(":")[0]) <= 114 && Number(id.split(":")[1]) >= 1 && Number(id.split(":")[1]) <= 286).slice(-300));
    } catch { /* Preserve the existing explicitly device-local preference fallback. */ }
  }, []);
  useEffect(() => {
    if (!targetAyah || reading.isLoading || reading.error || !reading.data) return;
    const element = document.getElementById(`ayah-${targetAyah.replace(":", "-")}`);
    if (!element) { setNotice("هذه العلامة ليست ضمن آيات السورة المتاحة."); setTargetAyah(null); return; }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.reducedMotion === "true";
    element.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "center" });
    element.focus({ preventScroll: true });
    setHighlighted(targetAyah); setTargetAyah(null);
  }, [targetAyah, reading.isLoading, reading.error, reading.data]);
  function selectChapter(number: number) {
    setSelected(number); setPlayingVerse(null); setHighlighted(null); setTargetAyah(null); setJump(""); setJumpError("");
  }
  function focusVerse(id: string) {
    const [surah, ayah] = id.split(":").map(Number);
    if (!Number.isInteger(surah) || surah < 1 || surah > 114 || !Number.isInteger(ayah) || ayah < 1 || ayah > 286) return;
    setSelected(surah); setPlayingVerse(null); setTargetAyah(id); setSearchTerm("");
  }
  function playVerse(number: number) {
    if (playingVerse === number) { setPlayingVerse(null); return; }
    setPauseSignal(value => value + 1); setPlayingVerse(number);
  }
  function changeReadingSize(next: number) {
    const percent = boundSize(next); setReaderSize(percent);
    try { localStorage.setItem(READING_SIZE_KEY, String(percent)); }
    catch { setNotice("حجم الخط متاح لهذه الجلسة فقط؛ تعذّر حفظه على الجهاز."); }
  }
  function toggleBookmark(number: number) {
    const id = `${selected}:${number}`;
    const removing = bookmarks.includes(id);
    const next = removing ? bookmarks.filter(item => item !== id) : [...bookmarks, id].slice(-300);
    setBookmarks(next);
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); setNotice(removing ? "أُزيلت علامة الآية." : "حُفظ موضع الآية على هذا الجهاز فقط."); }
    catch { setNotice("العلامة متاحة خلال هذه الجلسة فقط؛ تعذّر حفظها على الجهاز."); }
  }
  function submitSearch(event: FormEvent) {
    event.preventDefault(); const term = query.trim();
    if (term.length >= 2 && term.length <= 50) { if (term === searchTerm) void search.mutate(); else setSearchTerm(term); }
  }
  function submitJump(event: FormEvent) {
    event.preventDefault(); const number = Number(jump);
    if (!Number.isInteger(number) || number < 1 || number > verses.length) { setJumpError(`اختر آية بين ١ و${verses.length.toLocaleString("ar-EG")}.`); return; }
    setJumpError(""); focusVerse(`${selected}:${number}`);
  }
  return <div className={`aura-quran mushaf ${focused ? "mushaf-focused" : ""}`} dir="rtl" lang="ar">
    <header className="mushaf-hero">
      <div className="mushaf-hero-copy"><span className="mushaf-eyebrow"><span/> مساحة للقراءة والتلاوة</span><h1>القرآن الكريم<span>لحظة سكينة، في يومك.</span></h1><p>اقرأ بتأنٍّ، واستمع بصوت تُحبّه، وعد إلى موضعك بسهولة.</p><div className="mushaf-hero-facts"><span><Icon name="book" size={15}/> ١١٤ سورة</span><span><Icon name="volume" size={15}/> ٩ قرّاء</span><span><Icon name="check" size={15}/> نص بالرسم العثماني</span></div></div>
      <div className="mushaf-hero-seal" aria-hidden="true"><Icon name="book" size={46}/><span>المصحف</span><small>قراءة · استماع · تدبّر</small></div>
    </header>
    <form className="aura-quran-search mushaf-global-search" onSubmit={submitSearch}>
      <Icon name="search" size={20}/><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault(); }} placeholder="ابحث عن كلمة أو عبارة في القرآن الكريم…" aria-label="البحث في القرآن" maxLength={50}/><button type="submit" disabled={query.trim().length < 2 || search.isLoading}>{search.isLoading ? "جارٍ البحث…" : "بحث في الآيات"}<Icon name="arrow" size={16}/></button>
    </form>
    {notice && <div className="mushaf-notice" role="status"><Icon name="pin" size={16}/><span>{notice}</span><button type="button" aria-label="إغلاق التنبيه" onClick={() => setNotice("")}><Icon name="close" size={16}/></button></div>}
    {searchTerm && <section className="aura-quran-search-results" aria-label="نتائج البحث"><div className="panel-head"><h2>نتائج البحث {search.data ? `· ${search.data.total?.toLocaleString("ar-EG") ?? search.data.results.length.toLocaleString("ar-EG")}` : ""}</h2><button type="button" onClick={() => setSearchTerm("")}>إغلاق النتائج</button></div>{search.isLoading && <p role="status">جارٍ البحث في المصدر…</p>}{search.error && <div role="alert">تعذّر البحث حاليًا. <button type="button" onClick={() => void search.mutate()}>إعادة المحاولة</button></div>}{search.data?.results.length === 0 && <p role="status">لا توجد نتائج. جرّب كلمة أخرى دون تشكيل.</p>}{search.data?.results.map(m => <button type="button" key={`${m.surah}:${m.number}`} onClick={() => focusVerse(`${m.surah}:${m.number}`)}><strong>{m.surahName} · الآية {m.number.toLocaleString("ar-EG")}</strong><span dir="rtl">{m.text}</span></button>)}{search.data && search.data.total > 50 && <p>تُعرض أول ٥٠ نتيجة؛ استخدم عبارة أدق لتضييق البحث.</p>}</section>}
    <div className="mushaf-workspace">
      {!focused && <div className="mushaf-side"><QuranNavigator chapters={chapters} selected={selected} onSelect={selectChapter} bookmarks={bookmarks} onBookmark={focusVerse} loading={index.isLoading} error={!!index.error} retry={() => void index.mutate()}/><div className="mushaf-source-note"><Icon name="check" size={18}/><div><strong>قراءة من مصدرها</strong><p>نص الآيات من AlQuran Cloud، لا يولّده الذكاء الاصطناعي.</p></div></div></div>}
      <div className="mushaf-main">
        <ReciterPicker reciters={reciters} selected={reciterId} onSelect={id => { setPlayingVerse(null); setReciterId(id); }} loading={catalogue.isLoading} error={!!catalogue.error} retry={() => void catalogue.mutate()}/>
        <section className="aura-quran-reading mushaf-reading" aria-busy={reading.isLoading} aria-label="قراءة السورة">
          <div className="mushaf-reading-tools"><label className="mushaf-surah-select"><span className="sr-only">السورة</span><select value={selected} onChange={e => selectChapter(Number(e.target.value))} aria-label="اختيار سورة">{(chapters.length ? chapters : [chapter]).map(s => <option key={s.number} value={s.number}>{s.number.toLocaleString("ar-EG")}. {s.name}</option>)}</select></label><button className="mushaf-focus-button" type="button" aria-pressed={focused} onClick={() => setFocused(v => !v)}><Icon name="screen" size={16}/>{focused ? "إظهار الفهرس" : "قراءة مركزة"}</button></div>
          <header className="aura-quran-chapter mushaf-chapter"><span className="mushaf-chapter-kicker">المصحف الشريف · السورة {selected.toLocaleString("ar-EG")}</span><h2>{chapter.name}</h2><p>{chapter.numberOfAyahs > 0 ? `${chapter.numberOfAyahs.toLocaleString("ar-EG")} آيات` : "جارٍ تحميل السورة"}{chapter.revelationType === "Meccan" ? " · مكية" : chapter.revelationType === "Medinan" ? " · مدنية" : ""}</p><span className="mushaf-chapter-rule" aria-hidden="true"/></header>
          <div className="mushaf-reader-controls"><div className="mushaf-segmented" aria-label="طريقة القراءة"><button type="button" aria-pressed={mode === "verses"} onClick={() => setMode("verses")}>آية بآية</button><button type="button" aria-pressed={mode === "flow"} onClick={() => setMode("flow")}>قراءة متصلة</button></div><div className="aura-quran-font"><span className="sr-only">حجم القراءة</span><button type="button" onClick={() => changeReadingSize(readerSize - 10)} disabled={readerSize <= 80} aria-label="تصغير خط القرآن">−</button><button type="button" onClick={() => changeReadingSize(100)} aria-label={`حجم القراءة ${readerSize}%، إعادة الضبط إلى ١٠٠٪`}>{readerSize.toLocaleString("ar-EG")}٪</button><button type="button" onClick={() => changeReadingSize(readerSize + 10)} disabled={readerSize >= 160} aria-label="تكبير خط القرآن">+</button></div></div>
          {reading.isLoading && <div className="mushaf-loading" role="status"><span/><span/><span/><p>جارٍ جلب النص القرآني من مصدره…</p></div>}
          {reading.error && <div className="mushaf-reading-error" role="alert"><Icon name="book" size={30}/><h3>تعذّر تحميل السورة</h3><p>راجع الاتصال وحاول مرة أخرى. لا نعرض نصًا بديلًا عن المصدر.</p><button type="button" onClick={() => void reading.mutate()}>إعادة تحميل السورة</button></div>}
          {!reading.isLoading && !reading.error && <QuranVerses verses={verses} surah={selected} bookmarks={bookmarks} size={readerSize} mode={mode} highlighted={highlighted} onBookmark={toggleBookmark} onPlayVerse={playVerse} playingVerse={playingVerse}/>}
          <div className="mushaf-jump"><form onSubmit={submitJump}><label htmlFor="mushaf-jump">انتقل إلى آية</label><input id="mushaf-jump" type="number" min={1} max={verses.length || 286} inputMode="numeric" value={jump} onChange={e => setJump(e.target.value)} aria-invalid={!!jumpError} aria-describedby={jumpError ? "mushaf-jump-error" : undefined}/><button type="submit" disabled={!verses.length || !jump}>انتقال<Icon name="arrow" size={15}/></button></form>{jumpError && <p id="mushaf-jump-error" role="alert">{jumpError}</p>}</div>
          <nav className="aura-quran-chapter-nav mushaf-chapter-nav" aria-label="التنقل بين السور"><button type="button" disabled={selected <= 1} onClick={() => selectChapter(selected - 1)}>السورة السابقة</button><span>{selected.toLocaleString("ar-EG")} / ١١٤</span><button type="button" disabled={selected >= 114} onClick={() => selectChapter(selected + 1)}>السورة التالية</button></nav>
        </section>
        {playingVerse !== null && <VerseRecitation key={`${selected}:${playingVerse}`} surah={selected} verse={playingVerse} onClose={() => setPlayingVerse(null)}/>}
        <RecitationPlayer key={`${selected}:${reciterId}:${audioUrl}`} url={audioUrl} chapter={chapter} reciterName={identity.name} onChapter={selectChapter} onStart={() => setPlayingVerse(null)} pauseSignal={pauseSignal} unavailable={catalogue.isLoading ? "جارٍ تحميل مصدر التلاوة…" : catalogue.error ? "تعذّر تحميل مصدر التلاوة. أعد المحاولة من اختيار القارئ." : "تلاوة هذه السورة غير متاحة لهذا القارئ حاليًا."}/>
        <footer className="aura-quran-attribution mushaf-attribution"><p><Icon name="check" size={15}/><span>النص: <a href={source?.reference ?? "https://alquran.cloud/api"} target="_blank" rel="noopener noreferrer">AlQuran Cloud</a> · <bdi>{source?.edition ?? "quran-uthmani"}</bdi> · <a href="https://alquran.cloud/terms-and-conditions" target="_blank" rel="noopener noreferrer">حقوق الاستخدام</a>. التلاوة: <a href="https://mp3quran.net/ar" target="_blank" rel="noopener noreferrer">MP3Quran</a>.</span></p><p>الشروح منفصلة عن نص المصحف، وقد يخطئ الذكاء الاصطناعي. راجع أهل العلم في التفسير والأحكام.</p><Link href="/ai?prompt=%D8%B3%D8%A7%D8%B9%D8%AF%D9%86%D9%8A%20%D8%A3%D9%81%D9%87%D9%85%20%D9%85%D8%B9%D9%86%D9%89%20%D8%A2%D9%8A%D8%A9">انتقل إلى Noata AI للشرح <Icon name="arrow" size={15}/></Link></footer>
      </div>
    </div>
  </div>;
}
