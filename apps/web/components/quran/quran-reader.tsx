"use client";
import { useEffect, useState, type FormEvent } from "react";
import useSWR from "swr";
import { Icon } from "@/components/ui/icon";
import { QuranNavigator } from "./quran-navigator";
import { ReciterPicker } from "./reciter-picker";
import { RecitationPlayer } from "./recitation-player";
import { QuranVerses } from "./quran-verses";
import { QuranSearch } from "./quran-search";
import { QuranSources } from "./quran-sources";
import { useQuranAudio } from "./use-quran-audio";
import { chapterRecitation, normalizeQuranQuery, quranFetcher, REQUESTED_RECITERS, type Chapter, type ChapterResponse, type Reciter, type ReciterId } from "@/lib/quran/reciters";
import { AYAH_RECORDINGS, verseRecitation, type VerseAvailability } from "@/lib/quran/verse-audio";
import type { AudioTrack } from "@/lib/quran/audio-engine";

const LOCAL_KEY = "noata-quran-bookmarks-v1";
const READING_SIZE_KEY = "noata-quran-reading-percent-v2";
const INITIAL: Chapter = { number: 1, name: "الفاتحة", englishName: "Al-Faatiha", numberOfAyahs: 7 };
const boundSize = (n: number) => Number.isFinite(n) ? Math.round(Math.max(80, Math.min(160, n)) / 10) * 10 : 100;
const options = { revalidateOnFocus: false, shouldRetryOnError: false };

export function QuranReader() {
  const [selected, setSelected] = useState(1);
  const [reciterId, setReciterId] = useState<ReciterId>("minshawi");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [readerSize, setReaderSize] = useState(100);
  const [notice, setNotice] = useState("");
  const [focused, setFocused] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [sequence, setSequence] = useState(false);
  const [mode, setMode] = useState<"verses" | "flow">("verses");
  const [targetAyah, setTargetAyah] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [jump, setJump] = useState("");
  const [jumpError, setJumpError] = useState("");
  const { engine, state: playback, audioRef } = useQuranAudio();
  const index = useSWR<{ surahs: Chapter[] }>("/api/quran?list=1", quranFetcher, options);
  const reading = useSWR<ChapterResponse>(`/api/quran?surah=${selected}&text=1`, quranFetcher, options);
  const catalogue = useSWR<{ reciters: Reciter[] }>("/api/quran?reciters=1", quranFetcher, options);
  const availability = useSWR<VerseAvailability>(reciterId === "sudais" ? `/api/quran?reciter=ar.sudais&surah=${selected}` : `/api/quran?verseReciter=${reciterId}&surah=${selected}`, async (url: string) => {
    if (url.includes("reciter=ar.sudais")) {
      const data = await quranFetcher<ChapterResponse & { source: { reciterName: string } }>(url);
      const audioVerses = (data.verses ?? []).filter((v): v is typeof v & { audio: string } => typeof v.audio === "string" && !!v.audio);
      return { reciter: "sudais", surah: data.surah.number, verses: audioVerses.map((v: { number: number }) => v.number), media: Object.fromEntries(audioVerses.map((v: { number: number; audio: string }) => [v.number, v.audio])), label: data.source.reciterName, provider: "AlQuran Cloud" };
    }
    return { ...await quranFetcher<VerseAvailability>(url), provider: "EveryAyah" };
  }, options);
  const chapters = index.data?.surahs ?? [];
  const chapter = reading.data?.surah ?? chapters.find(s => s.number === selected) ?? (selected === 1 ? INITIAL : { ...INITIAL, number: selected, name: `السورة ${selected.toLocaleString("ar-EG")}`, numberOfAyahs: 0, englishName: "" });
  const verses = reading.data?.verses ?? [];
  const reciters = catalogue.data?.reciters ?? [];
  const reciter = reciters.find(r => r.id === reciterId);
  const identity = REQUESTED_RECITERS.find(r => r.id === reciterId)!;
  const audioUrl = chapterRecitation(reciter, selected);
  const matchingTrack = playback.track?.surah === selected && playback.track.reciter === reciterId;
  const activeVerse = matchingTrack && playback.track?.mode === "ayah" ? playback.track.ayah ?? null : null;
  const playingVerse = playback.status === "playing" ? activeVerse : null;
  const pendingVerse = ["loading", "buffering"].includes(playback.status) ? activeVerse : null;
  const availableVerses = availability.data?.reciter === reciterId && availability.data.surah === selected ? availability.data.verses.filter(n => verses.some(v => v.number === n)) : [];
  const fullTrack: AudioTrack = { url: audioUrl, mode: "surah", surah: selected, reciter: reciterId, title: chapter.name, artist: identity.name };
  const verseNote = !AYAH_RECORDINGS[reciterId] ? "لم نتحقق من مصدر لتلاوة الآيات بصوت حسن صالح. يمكنك الاستماع للسورة كاملة أو اختيار قارئ آخر بنفسك."
    : availability.error ? "تعذّر التحقق من أرشيف الآيات؛ لا نفترض إتاحتها. تلاوة السورة مستقلة عن هذا الأرشيف."
    : availability.isLoading ? "جارٍ التحقق من الآيات المتاحة بصوت القارئ المختار…"
    : `الآيات: ${availability.data?.label ?? identity.name} · تسجيل ${reciterId === "sudais" ? "AlQuran Cloud" : "EveryAyah"} مستقل عن تسجيل السورة. ${availableVerses.length.toLocaleString("ar-EG")} من ${verses.length.toLocaleString("ar-EG")} آيات متاحة في دليل المصدر.`;

  useEffect(() => { engine.select(fullTrack); }, [engine, selected, reciterId, audioUrl, chapter.name, identity.name]);
  useEffect(() => {
    engine.onEnded = track => {
      if (!sequence || playback.repeat || track.mode !== "ayah" || track.surah !== selected || track.reciter !== reciterId || !track.ayah || track.ayah >= verses.length) return;
      const next = track.ayah + 1;
      const url = verseRecitation(reciterId, selected, next, availability.data);
      if (!url) { setNotice("توقفت المتابعة: تسجيل الآية التالية غير متاح لهذا القارئ. لم نتجاوز الآية أو نغيّر القارئ."); return; }
      if (next > 5) setExpanded(true);
      engine.play({ ...track, url, ayah: next, title: `${chapter.name} · الآية ${next}` });
    };
    return () => { engine.onEnded = undefined; };
  }, [engine, sequence, playback.repeat, selected, reciterId, verses.length, availability.data, chapter.name]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(READING_SIZE_KEY);
      if (saved && /^\d{2,3}$/.test(saved)) setReaderSize(boundSize(Number(saved)));
      const stored: unknown = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
      if (Array.isArray(stored)) setBookmarks(stored.filter((id): id is string => typeof id === "string" && /^\d{1,3}:\d{1,3}$/.test(id) && Number(id.split(":")[0]) >= 1 && Number(id.split(":")[0]) <= 114 && Number(id.split(":")[1]) >= 1 && Number(id.split(":")[1]) <= 286).slice(-300));
    } catch { /* Preserve the existing explicitly device-local preference fallback. */ }
    const restoreReference = () => {
      const params = new URLSearchParams(window.location.search);
      const surah = Number(params.get("surah") ?? 1), ayah = Number(params.get("ayah"));
      if (!Number.isInteger(surah) || surah < 1 || surah > 114) return;
      engine.stop(); setSelected(surah); setHighlighted(null);
      const valid = Number.isInteger(ayah) && ayah >= 1 && ayah <= 286;
      setExpanded(valid && ayah > 5); setTargetAyah(valid ? `${surah}:${ayah}` : null);
    };
    restoreReference(); window.addEventListener("popstate", restoreReference);
    return () => window.removeEventListener("popstate", restoreReference);
  }, [engine]);
  useEffect(() => {
    if (!targetAyah || reading.isLoading || reading.error || reading.data?.surah.number !== selected) return;
    const number = Number(targetAyah.split(":")[1]);
    if (number > 5 && !expanded && verses.some(v => v.number === number)) { setExpanded(true); return; }
    const element = document.getElementById(`ayah-${targetAyah.replace(":", "-")}`);
    if (!element) { setNotice("هذا المرجع ليس ضمن آيات السورة المتاحة."); setTargetAyah(null); return; }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.reducedMotion === "true";
    element.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "center" }); element.focus({ preventScroll: true });
    setHighlighted(targetAyah); setTargetAyah(null);
  }, [targetAyah, selected, expanded, verses, reading.isLoading, reading.error, reading.data]);
  function updateReference(surah: number, ayah?: number) {
    const url = new URL(window.location.href); url.searchParams.set("surah", String(surah));
    if (ayah) url.searchParams.set("ayah", String(ayah)); else url.searchParams.delete("ayah");
    window.history.pushState(null, "", url);
  }
  function selectChapter(number: number) {
    engine.stop(); setSelected(number); setExpanded(false); setHighlighted(null); setTargetAyah(null); setJump(""); setJumpError(""); setExplorerOpen(false); updateReference(number);
  }
  function focusVerse(id: string) {
    const [surah, ayah] = id.split(":").map(Number);
    if (!Number.isInteger(surah) || surah < 1 || surah > 114 || !Number.isInteger(ayah) || ayah < 1 || ayah > 286) return;
    if (surah !== selected) engine.stop();
    setSelected(surah); setExpanded(ayah > 5); setTargetAyah(id); setExplorerOpen(false); updateReference(surah, ayah);
  }
  function playVerse(number: number) {
    const url = verseRecitation(reciterId, selected, number, availability.data);
    if (!url || !verses.some(v => v.number === number)) return;
    if (number > 5) setExpanded(true);
    engine.toggle({ ...fullTrack, mode: "ayah", ayah: number, url, title: `${chapter.name} · الآية ${number}` });
  }
  function changeReadingSize(next: number) {
    const percent = boundSize(next); setReaderSize(percent);
    try { localStorage.setItem(READING_SIZE_KEY, String(percent)); }
    catch { setNotice("حجم الخط متاح لهذه الجلسة فقط؛ تعذّر حفظه على الجهاز."); }
  }
  function toggleBookmark(number: number) {
    const id = `${selected}:${number}`; const removing = bookmarks.includes(id);
    const next = removing ? bookmarks.filter(item => item !== id) : [...bookmarks, id].slice(-300); setBookmarks(next);
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); setNotice(removing ? "أُزيلت علامة الآية." : "حُفظ موضع الآية على هذا الجهاز فقط."); }
    catch { setNotice("العلامة متاحة خلال هذه الجلسة فقط؛ تعذّر حفظها على الجهاز."); }
  }
  function submitJump(event: FormEvent) {
    event.preventDefault(); const number = Number(normalizeQuranQuery(jump));
    if (!Number.isInteger(number) || number < 1 || number > verses.length) { setJumpError(`اختر آية بين ١ و${verses.length.toLocaleString("ar-EG")}.`); return; }
    setJumpError(""); focusVerse(`${selected}:${number}`);
  }
  function collapse() {
    setExpanded(false);
    document.querySelector<HTMLButtonElement>(".mushaf-expand button")?.focus({ preventScroll: true });
  }
  return <div className={`aura-quran mushaf ${focused ? "mushaf-focused" : ""}`} dir="rtl" lang="ar">
    <header className="mushaf-hero">
      <div className="mushaf-hero-copy"><span className="mushaf-eyebrow"><span/> مساحة للقراءة والتلاوة</span><h1>القرآن الكريم<span>لحظة سكينة، في يومك.</span></h1><p>اقرأ بتأنٍّ، واستمع بصوت تُحبّه، وعد إلى موضعك بسهولة.</p><div className="mushaf-hero-facts"><span><Icon name="book" size={15}/> ١١٤ سورة</span><span><Icon name="volume" size={15}/> ٩ قرّاء</span><span><Icon name="check" size={15}/> نص بالرسم العثماني</span></div></div>
      <div className="mushaf-hero-seal" aria-hidden="true"><Icon name="book" size={46}/><span>المصحف</span><small>قراءة · استماع · تدبّر</small></div>
    </header>
    <QuranSearch selected={selected} onOpen={focusVerse}/>
    {notice && <div className="mushaf-notice" role="status"><Icon name="pin" size={16}/><span>{notice}</span><button type="button" aria-label="إغلاق التنبيه" onClick={() => setNotice("")}><Icon name="close" size={16}/></button></div>}
    <div className="mushaf-workspace">
      {!focused && <div className={`mushaf-side ${explorerOpen ? "is-open" : ""}`}><button className="mushaf-explorer-toggle" type="button" aria-expanded={explorerOpen} aria-controls="mushaf-explorer" onClick={() => setExplorerOpen(v => !v)}><Icon name="book" size={19}/><span>استكشف السور والعلامات</span><Icon name="chevron" size={17}/></button><div id="mushaf-explorer"><QuranNavigator chapters={chapters} selected={selected} onSelect={selectChapter} bookmarks={bookmarks} onBookmark={focusVerse} loading={index.isLoading} error={!!index.error} retry={() => void index.mutate()}/></div><div className="mushaf-source-note"><Icon name="check" size={18}/><div><strong>قراءة من مصدرها</strong><p>نص الآيات من AlQuran Cloud، لا يولّده الذكاء الاصطناعي.</p></div></div></div>}
      <div className="mushaf-main">
        <ReciterPicker reciters={reciters} selected={reciterId} onSelect={id => { if (id !== reciterId) { engine.stop(); setReciterId(id); } }} loading={catalogue.isLoading} error={!!catalogue.error} retry={() => void catalogue.mutate()}/>
        <RecitationPlayer chapter={chapter} reciterName={identity.name} onChapter={selectChapter} onFull={() => engine.select(fullTrack)} onVerse={playVerse} canPrevious={!!activeVerse && availableVerses.includes(activeVerse - 1)} canNext={!!activeVerse && availableVerses.includes(activeVerse + 1)} sequence={sequence} onSequence={setSequence} audioRef={audioRef} engine={engine} state={playback} verseProvider={reciterId === "sudais" ? "AlQuran Cloud" : "EveryAyah"} verseNote={verseNote} unavailable={catalogue.isLoading ? "جارٍ تحميل مصدر التلاوة…" : catalogue.error ? "تعذّر تحميل مصدر تلاوة السورة. أعد المحاولة من اختيار القارئ." : "تلاوة هذه السورة غير متاحة لهذا القارئ حاليًا."}/>
        {availability.error && <button type="button" className="mushaf-availability-retry" onClick={() => void availability.mutate()}>إعادة التحقق من تسجيلات الآيات</button>}
        <section className="aura-quran-reading mushaf-reading" aria-busy={reading.isLoading} aria-label="قراءة السورة">
          <div className="mushaf-reading-tools"><label className="mushaf-surah-select"><span className="sr-only">السورة</span><select value={selected} onChange={e => selectChapter(Number(e.target.value))} aria-label="اختيار سورة">{(chapters.length ? chapters : [chapter]).map(s => <option key={s.number} value={s.number}>{s.number.toLocaleString("ar-EG")}. {s.name}</option>)}</select></label><button className="mushaf-focus-button" type="button" aria-pressed={focused} onClick={() => setFocused(v => !v)}><Icon name="screen" size={16}/>{focused ? "إظهار الفهرس" : "قراءة مركزة"}</button></div>
          <header className="aura-quran-chapter mushaf-chapter"><span className="mushaf-chapter-kicker">المصحف الشريف · السورة {selected.toLocaleString("ar-EG")}</span><h2>{chapter.name}</h2><p>{chapter.numberOfAyahs > 0 ? `${chapter.numberOfAyahs.toLocaleString("ar-EG")} آيات` : "جارٍ تحميل السورة"}{chapter.revelationType === "Meccan" ? " · مكية" : chapter.revelationType === "Medinan" ? " · مدنية" : ""}</p><span className="mushaf-chapter-rule" aria-hidden="true"/></header>
          <div className="mushaf-reader-controls"><div className="mushaf-segmented" aria-label="طريقة القراءة"><button type="button" aria-pressed={mode === "verses"} onClick={() => setMode("verses")}>آية بآية</button><button type="button" aria-pressed={mode === "flow"} onClick={() => setMode("flow")}>قراءة متصلة</button></div><div className="aura-quran-font"><span className="sr-only">حجم القراءة</span><button type="button" onClick={() => changeReadingSize(readerSize - 10)} disabled={readerSize <= 80} aria-label="تصغير خط القرآن">−</button><button type="button" onClick={() => changeReadingSize(100)} aria-label={`حجم القراءة ${readerSize}%، إعادة الضبط إلى ١٠٠٪`}>{readerSize.toLocaleString("ar-EG")}٪</button><button type="button" onClick={() => changeReadingSize(readerSize + 10)} disabled={readerSize >= 160} aria-label="تكبير خط القرآن">+</button></div></div>
          <div className="mushaf-jump"><form onSubmit={submitJump}><label htmlFor="mushaf-jump">انتقل إلى آية</label><input id="mushaf-jump" inputMode="numeric" maxLength={3} value={jump} onChange={e => setJump(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault(); }} aria-invalid={!!jumpError} aria-describedby={jumpError ? "mushaf-jump-error" : undefined}/><button type="submit" disabled={!verses.length || !jump}>انتقال<Icon name="arrow" size={15}/></button></form>{jumpError && <p id="mushaf-jump-error" role="alert">{jumpError}</p>}</div>
          {reading.isLoading && <div className="mushaf-loading" role="status"><span/><span/><span/><p>جارٍ جلب النص القرآني من مصدره…</p></div>}
          {reading.error && <div className="mushaf-reading-error" role="alert"><Icon name="book" size={30}/><h3>تعذّر تحميل السورة</h3><p>راجع الاتصال وحاول مرة أخرى. لا نعرض نصًا بديلًا عن المصدر.</p><button type="button" onClick={() => void reading.mutate()}>إعادة تحميل السورة</button></div>}
          {!reading.isLoading && !reading.error && <QuranVerses verses={expanded ? verses : verses.slice(0, 5)} surah={selected} bookmarks={bookmarks} size={readerSize} mode={mode} highlighted={highlighted} onBookmark={toggleBookmark} onPlayVerse={playVerse} playingVerse={playingVerse} pendingVerse={pendingVerse} reciterName={identity.name} availableVerses={availableVerses}/>}
          {!reading.error && verses.length > 5 && <div className="mushaf-expand"><span>{expanded ? `تقرأ السورة كاملة · ${verses.length.toLocaleString("ar-EG")} آيات` : `بداية السورة · أول ٥ آيات من ${verses.length.toLocaleString("ar-EG")}`}</span><button type="button" aria-expanded={expanded} aria-controls="mushaf-verse-list" onClick={() => expanded ? collapse() : setExpanded(true)}><Icon name="book" size={18}/>{expanded ? "طي السورة" : "عرض السورة كاملة"}<Icon name="chevron" size={17} style={{ transform: expanded ? "rotate(180deg)" : undefined }}/></button>{!expanded && activeVerse && activeVerse > 5 && <button type="button" onClick={() => focusVerse(`${selected}:${activeVerse}`)}>العودة إلى الآية المختارة {activeVerse.toLocaleString("ar-EG")}</button>}</div>}
          <nav className="aura-quran-chapter-nav mushaf-chapter-nav" aria-label="التنقل بين السور"><button type="button" disabled={selected <= 1} onClick={() => selectChapter(selected - 1)}>السورة السابقة</button><span>{selected.toLocaleString("ar-EG")} / ١١٤</span><button type="button" disabled={selected >= 114} onClick={() => selectChapter(selected + 1)}>السورة التالية</button></nav>
        </section>
        <QuranSources source={reading.data?.source} reciterName={identity.name} verseProvider={reciterId === "sudais" ? "AlQuran Cloud" : "EveryAyah"}/>
      </div>
    </div>
  </div>;
}
