"use client";
import {reciterDisplayName} from "@/lib/i18n/quran-labels";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import { useEffect, useState, type FormEvent } from "react";
import useSWR from "swr";
import { Icon } from "@/components/ui/icon";
import { QuranNavigator } from "./quran-navigator";
import { ReciterPicker } from "./reciter-picker";
import { RecitationPlayer } from "./recitation-player";
import { QuranVerses } from "./quran-verses";
import { MushafHeroInsignia } from "./mushaf-hero-insignia";
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
 const t=useTranslation(),locale=useLocale();
  const [selected, setSelected] = useState(1);
  const [reciterId, setReciterId] = useState<ReciterId>("minshawi");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [readerSize, setReaderSize] = useState(100);
  const [notice, setNotice] = useState("");
  const [focused, setFocused] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [sequence, setSequence] = useState(false);
  const [mode, setMode] = useState<"verses" | "flow">("flow");
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
  const chapter = reading.data?.surah ?? chapters.find(s => s.number === selected) ?? (selected === 1 ? INITIAL : { ...INITIAL, number: selected, name: `السورة ${selected.toLocaleString(locale==="en"?"en":"ar-EG")}`, numberOfAyahs: 0, englishName: `Surah ${selected}` });
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
  const verseNote = !AYAH_RECORDINGS[reciterId] ? t("لم نتحقق من مصدر لتلاوة الآيات بصوت حسن صالح. يمكنك الاستماع للسورة كاملة أو اختيار قارئ آخر بنفسك.","A verse recording source for Hasan Saleh has not been verified. Listen to the full surah or choose another reciter.")
    : availability.error ? t("تعذّر التحقق من أرشيف الآيات؛ لا نفترض إتاحتها. تلاوة السورة مستقلة عن هذا الأرشيف.","Could not verify the verse archive. Full surah recordings are separate.")
    : availability.isLoading ? t("جارٍ التحقق من الآيات المتاحة بصوت القارئ المختار…","Checking verses available for the selected reciter…")
    : locale==="en"?`Verses: ${reciterDisplayName(identity.name,locale)} · ${reciterId==="sudais"?"AlQuran Cloud":"EveryAyah"} verse recordings are separate from full surah recordings. ${availableVerses.length} of ${verses.length} verses are listed by the source.` : `الآيات: ${availability.data?.label ?? identity.name} · تسجيل ${reciterId === "sudais" ? "AlQuran Cloud" : "EveryAyah"} مستقل عن تسجيل السورة. ${availableVerses.length.toLocaleString("ar-EG")} من ${verses.length.toLocaleString("ar-EG")} آيات متاحة في دليل المصدر.`;

  useEffect(() => { engine.select(fullTrack); }, [engine, selected, reciterId, audioUrl, chapter.name, identity.name]);
  useEffect(() => {
    engine.onEnded = track => {
      if (!sequence || playback.repeat || track.mode !== "ayah" || track.surah !== selected || track.reciter !== reciterId || !track.ayah || track.ayah >= verses.length) return;
      const next = track.ayah + 1;
      const url = verseRecitation(reciterId, selected, next, availability.data);
      if (!url) { setNotice(t("توقفت المتابعة: تسجيل الآية التالية غير متاح لهذا القارئ. لم نتجاوز الآية أو نغيّر القارئ.","Playback stopped: the next verse is unavailable for this reciter. No verse was skipped and the reciter was not changed.")); return; }
      if (next > 5) setExpanded(true);
      engine.play({ ...track, url, ayah: next, title: `${locale==="en"?chapter.englishName:chapter.name} · ${t("الآية","Verse")} ${next}` });
    };
    return () => { engine.onEnded = undefined; };
  }, [engine, sequence, playback.repeat, selected, reciterId, verses.length, availability.data, chapter.name, chapter.englishName, locale, t]);
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
      setExpanded(true); setTargetAyah(valid ? `${surah}:${ayah}` : null);
    };
    restoreReference(); window.addEventListener("popstate", restoreReference);
    return () => window.removeEventListener("popstate", restoreReference);
  }, [engine]);
  useEffect(() => {
    if (!targetAyah || reading.isLoading || reading.error || reading.data?.surah.number !== selected) return;
    const number = Number(targetAyah.split(":")[1]);
    if (number > 5 && !expanded && verses.some(v => v.number === number)) { setExpanded(true); return; }
    const element = document.getElementById(`ayah-${targetAyah.replace(":", "-")}`);
    if (!element) { setNotice(t("هذا المرجع ليس ضمن آيات السورة المتاحة.","This reference is outside the available surah verses.")); setTargetAyah(null); return; }
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
    engine.stop(); setSelected(number); setExpanded(true); setHighlighted(null); setTargetAyah(null); setJump(""); setJumpError(""); setExplorerOpen(false); updateReference(number);
  }
  function focusVerse(id: string) {
    const [surah, ayah] = id.split(":").map(Number);
    if (!Number.isInteger(surah) || surah < 1 || surah > 114 || !Number.isInteger(ayah) || ayah < 1 || ayah > 286) return;
    if (surah !== selected) engine.stop();
    setSelected(surah); setExpanded(true); setTargetAyah(id); setExplorerOpen(false); updateReference(surah, ayah);
  }
  function playVerse(number: number) {
    const url = verseRecitation(reciterId, selected, number, availability.data);
    if (!url || !verses.some(v => v.number === number)) return;
    if (number > 5) setExpanded(true);
    engine.toggle({ ...fullTrack, mode: "ayah", ayah: number, url, title: `${locale==="en"?chapter.englishName:chapter.name} · ${t("الآية","Verse")} ${number}` });
  }
  function changeReadingSize(next: number) {
    const percent = boundSize(next); setReaderSize(percent);
    try { localStorage.setItem(READING_SIZE_KEY, String(percent)); }
    catch { setNotice(t("حجم الخط متاح لهذه الجلسة فقط؛ تعذّر حفظه على الجهاز.","Font size is set for this session. It could not be saved on your device.")); }
  }
  function toggleBookmark(number: number) {
    const id = `${selected}:${number}`; const removing = bookmarks.includes(id);
    const next = removing ? bookmarks.filter(item => item !== id) : [...bookmarks, id].slice(-300); setBookmarks(next);
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)); setNotice(removing ? t("أُزيلت علامة الآية.","Bookmark removed.") : t("حُفظ موضع الآية على هذا الجهاز فقط.","Verse bookmarked on this device.")); }
    catch { setNotice(t("العلامة متاحة خلال هذه الجلسة فقط؛ تعذّر حفظها على الجهاز.","Bookmark kept for this session. It could not be saved on your device.")); }
  }
  function submitJump(event: FormEvent) {
    event.preventDefault(); const number = Number(normalizeQuranQuery(jump));
    if (!Number.isInteger(number) || number < 1 || number > verses.length) { setJumpError(locale==="en"?`Choose a verse from 1 to ${verses.length}.`:`اختر آية بين ١ و${verses.length.toLocaleString("ar-EG")}.`); return; }
    setJumpError(""); focusVerse(`${selected}:${number}`);
  }
  function collapse() {
    setExpanded(false);
    document.querySelector<HTMLButtonElement>(".mushaf-expand button")?.focus({ preventScroll: true });
  }
  return <div className={`aura-quran mushaf ${focused ? "mushaf-focused" : ""}`} dir={locale==="en"?"ltr":"rtl"} lang={locale}>
    <header className="mushaf-hero">
      <div className="mushaf-hero-copy"><span className="mushaf-eyebrow"><span/>{t("مساحة للقراءة والتلاوة","A space for reading and recitation")}</span><h1>{t("القرآن الكريم","The Holy Quran")}<span>{t("لحظة سكينة، في يومك.","A moment of peace in your day.")}</span></h1><p>{t("اقرأ بتأنٍّ، واستمع بصوت تُحبّه، وعد إلى موضعك بسهولة.","Read thoughtfully, listen to your chosen reciter, and return to your place.")}</p><div className="mushaf-hero-facts"><span><Icon name="book" size={15}/>{t("١١٤ سورة","114 surahs")}</span><span><Icon name="volume" size={15}/>{t("٩ قرّاء","9 reciters")}</span><span><Icon name="check" size={15}/>{t("نص بالرسم العثماني","Uthmani scripture")}</span></div></div>
      <MushafHeroInsignia english={locale==="en"}/>
    </header>
    <QuranSearch selected={selected} onOpen={focusVerse}/>
    {notice && <div className="mushaf-notice" role="status"><Icon name="pin" size={16}/><span>{notice}</span><button type="button" aria-label={t("إغلاق التنبيه","Dismiss notice")} onClick={() => setNotice("")}><Icon name="close" size={16}/></button></div>}
    <div className="mushaf-workspace">
      {!focused && <div className={`mushaf-side ${explorerOpen ? "is-open" : ""}`}><button className="mushaf-explorer-toggle" type="button" aria-expanded={explorerOpen} aria-controls="mushaf-explorer" onClick={() => setExplorerOpen(v => !v)}><Icon name="book" size={19}/><span>{t("استكشف السور والعلامات","Explore surahs and bookmarks")}</span><Icon name="chevron" size={17}/></button><div id="mushaf-explorer"><QuranNavigator chapters={chapters} selected={selected} onSelect={selectChapter} bookmarks={bookmarks} onBookmark={focusVerse} loading={index.isLoading} error={!!index.error} retry={() => void index.mutate()}/></div><div className="mushaf-source-note"><Icon name="check" size={18}/><div><strong>{t("قراءة من مصدرها","Read from the source")}</strong><p>{t("نص الآيات من AlQuran Cloud، لا يولّده الذكاء الاصطناعي.","Verse text is sourced from AlQuran Cloud and is not generated by AI.")}</p></div></div></div>}
      <div className="mushaf-main">
        <section className="aura-quran-reading mushaf-reading" aria-busy={reading.isLoading} aria-label={t("قراءة السورة","Read surah")}>
          <div className="mushaf-reading-tools"><label className="mushaf-surah-select"><span className="sr-only">{t("السورة","Surah")}</span><select value={selected} onChange={e => selectChapter(Number(e.target.value))} aria-label={t("اختيار سورة","Choose a surah")}>{(chapters.length ? chapters : [chapter]).map(s => <option key={s.number} value={s.number}>{s.number.toLocaleString(locale==="en"?"en":"ar-EG")}. {locale==="en"?s.englishName:s.name}</option>)}</select></label><button className="mushaf-focus-button" type="button" aria-pressed={focused} onClick={() => setFocused(v => !v)}><Icon name="screen" size={16}/>{focused ? t("إظهار الفهرس","Show index") : t("قراءة مركزة","Focused reading")}</button><a className="mushaf-listen-link" href="#mushaf-recitation-dock"><Icon name="volume" size={16}/>{t("استمع للسورة","Listen")}</a></div>
          <header className="aura-quran-chapter mushaf-chapter"><span className="mushaf-chapter-kicker">{t("المصحف الشريف · السورة","The Holy Quran · Surah")}{selected.toLocaleString(locale==="en"?"en":"ar-EG")}</span><h2>{locale==="en"?chapter.englishName:chapter.name}</h2><p>{chapter.numberOfAyahs > 0 ? `${chapter.numberOfAyahs.toLocaleString(locale==="en"?"en":"ar-EG")} ${t("آيات","verses")}` : t("جارٍ تحميل السورة","Loading surah")}{chapter.revelationType === "Meccan" ? t(" · مكية"," · Meccan") : chapter.revelationType === "Medinan" ? t(" · مدنية"," · Medinan") : ""}</p><span className="mushaf-chapter-rule" aria-hidden="true"/></header>
          <div className="mushaf-reading-toolbar"><div className="mushaf-reader-controls"><div className="mushaf-segmented" aria-label={t("طريقة القراءة","Reading mode")}><button type="button" aria-pressed={mode === "verses"} onClick={() => setMode("verses")}>{t("آية بآية","Verse by verse")}</button><button type="button" aria-pressed={mode === "flow"} onClick={() => setMode("flow")}>{t("قراءة متصلة","Continuous reading")}</button></div><div className="aura-quran-font"><span className="sr-only">{t("حجم القراءة","Reading size")}</span><button type="button" onClick={() => changeReadingSize(readerSize - 10)} disabled={readerSize <= 80} aria-label={t("تصغير خط القرآن","Decrease scripture font size")}>−</button><button type="button" onClick={() => changeReadingSize(100)} aria-label={locale==="en"?`Reading size ${readerSize}%, reset to 100%`:`حجم القراءة ${readerSize}%، إعادة الضبط إلى ١٠٠٪`}>{readerSize.toLocaleString(locale==="en"?"en":"ar-EG")}{t("٪","%")}</button><button type="button" onClick={() => changeReadingSize(readerSize + 10)} disabled={readerSize >= 160} aria-label={t("تكبير خط القرآن","Increase scripture font size")}>+</button></div></div>
          <div className="mushaf-jump"><form onSubmit={submitJump}><label htmlFor="mushaf-jump">{t("انتقل إلى آية","Jump to a verse")}</label><input id="mushaf-jump" inputMode="numeric" maxLength={3} value={jump} onChange={e => setJump(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault(); }} aria-invalid={!!jumpError} aria-describedby={jumpError ? "mushaf-jump-error" : undefined}/><button type="submit" disabled={!verses.length || !jump}>{t("انتقال","Go")}<Icon name="arrow" size={15}/></button></form>{jumpError && <p id="mushaf-jump-error" role="alert">{jumpError}</p>}</div></div>
          {reading.isLoading && <div className="mushaf-loading" role="status"><span/><span/><span/><p>{t("جارٍ جلب النص القرآني من مصدره…","Loading Quran text from its source…")}</p></div>}
          {reading.error && <div className="mushaf-reading-error" role="alert"><Icon name="book" size={30}/><h3>{t("تعذّر تحميل السورة","Could not load the surah")}</h3><p>{t("راجع الاتصال وحاول مرة أخرى. لا نعرض نصًا بديلًا عن المصدر.","Check your connection and try again. No substitute scripture is displayed.")}</p><button type="button" onClick={() => void reading.mutate()}>{t("إعادة تحميل السورة","Reload surah")}</button></div>}
          {!reading.isLoading && !reading.error && <QuranVerses verses={expanded ? verses : verses.slice(0, 5)} surah={selected} bookmarks={bookmarks} size={readerSize} mode={mode} highlighted={highlighted} onBookmark={toggleBookmark} onPlayVerse={playVerse} playingVerse={playingVerse} pendingVerse={pendingVerse} reciterName={reciterDisplayName(identity.name,locale)} availableVerses={availableVerses}/>}
          {!reading.error && verses.length > 5 && <div className="mushaf-expand"><span>{expanded ? locale==="en"?`Full surah · ${verses.length} verses`:`تقرأ السورة كاملة · ${verses.length.toLocaleString("ar-EG")} آيات` : locale==="en"?`Opening · First 5 of ${verses.length} verses`:`بداية السورة · أول ٥ آيات من ${verses.length.toLocaleString("ar-EG")}`}</span><button type="button" aria-expanded={expanded} aria-controls="mushaf-verse-list" onClick={() => expanded ? collapse() : setExpanded(true)}><Icon name="book" size={18}/>{expanded ? t("طي السورة","Collapse surah") : t("عرض السورة كاملة","Show full surah")}<Icon name="chevron" size={17} style={{ transform: expanded ? "rotate(180deg)" : undefined }}/></button>{!expanded && activeVerse && activeVerse > 5 && <button type="button" onClick={() => focusVerse(`${selected}:${activeVerse}`)}>{t("العودة إلى الآية المختارة","Return to selected verse")}{activeVerse.toLocaleString(locale==="en"?"en":"ar-EG")}</button>}</div>}
          <nav className="aura-quran-chapter-nav mushaf-chapter-nav" aria-label={t("التنقل بين السور","Surah navigation")}><button type="button" disabled={selected <= 1} onClick={() => selectChapter(selected - 1)}>{t("السورة السابقة","Previous surah")}</button><span>{selected.toLocaleString(locale==="en"?"en":"ar-EG")}{t("/ ١١٤","/ 114")}</span><button type="button" disabled={selected >= 114} onClick={() => selectChapter(selected + 1)}>{t("السورة التالية","Next surah")}</button></nav>
        </section>
        <section className="mushaf-listening-studio" id="mushaf-recitation-dock" aria-label={t("ركن الاستماع","Listening studio")}>
          <div className="mushaf-studio-heading"><span className="mushaf-studio-icon"><Icon name="volume" size={19}/></span><div><strong>{t("ركن الاستماع","Listening studio")}</strong><span>{t("اختر القارئ ثم استمع للسورة أو لآية محددة","Choose a reciter and listen to a surah or verse")}</span></div></div>
        <ReciterPicker reciters={reciters} selected={reciterId} onSelect={id => { if (id !== reciterId) { engine.stop(); setReciterId(id); } }} loading={catalogue.isLoading} error={!!catalogue.error} retry={() => void catalogue.mutate()}/>
        <RecitationPlayer chapter={chapter} reciterName={reciterDisplayName(identity.name,locale)} onChapter={selectChapter} onFull={() => engine.select(fullTrack)} onVerse={playVerse} canPrevious={!!activeVerse && availableVerses.includes(activeVerse - 1)} canNext={!!activeVerse && availableVerses.includes(activeVerse + 1)} sequence={sequence} onSequence={setSequence} audioRef={audioRef} engine={engine} state={playback} verseProvider={reciterId === "sudais" ? "AlQuran Cloud" : "EveryAyah"} verseNote={verseNote} unavailable={catalogue.isLoading ? t("جارٍ تحميل مصدر التلاوة…","Loading the recitation source…") : catalogue.error ? t("تعذّر تحميل مصدر تلاوة السورة. أعد المحاولة من اختيار القارئ.","Could not load the surah recording source. Retry from the reciter selector.") : t("تلاوة هذه السورة غير متاحة لهذا القارئ حاليًا.","This surah is currently unavailable for this reciter.")}/>
        {availability.error && <button type="button" className="mushaf-availability-retry" onClick={() => void availability.mutate()}>{t("إعادة التحقق من تسجيلات الآيات","Check verse recordings again")}</button>}
        </section>
        <QuranSources source={reading.data?.source} reciterName={reciterDisplayName(identity.name,locale)} verseProvider={reciterId === "sudais" ? "AlQuran Cloud" : "EveryAyah"}/>
      </div>
    </div>
  </div>;
}
