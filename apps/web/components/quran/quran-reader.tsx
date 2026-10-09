"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { QURAN_RECITERS, isQuranReciter, type QuranReciter } from "@/lib/quran/source";

type Chapter = {
  number: number;
  name: string;
  englishName: string;
  numberOfAyahs: number;
};
type Verse = {
  number: number;
  globalNumber: number;
  text: string;
  audio: string | null;
};
type Source = {
  name: string;
  edition: string;
  reference: string;
  terms: string;
  audioEdition: string | null;
  requestedAudioEdition?: string;
  reciterName?: string;
};
const LOCAL_KEY = "noata-quran-bookmarks-v1";
const RECITER_KEY = "noata-quran-reciter-v1";
const READING_SIZE_KEY = "noata-quran-reading-percent-v2";
const MIN_READING_PERCENT = 80;
const MAX_READING_PERCENT = 160;
function boundedReadingPercent(value: number) {
  return Number.isFinite(value) ? Math.round(Math.max(MIN_READING_PERCENT, Math.min(MAX_READING_PERCENT, value)) / 10) * 10 : 100;
}
const INITIAL: Chapter = {
  number: 1,
  name: "الفاتحة",
  englishName: "Al-Faatiha",
  numberOfAyahs: 7,
};
function bookmarksRead(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
    return Array.isArray(value)
      ? value
          .filter((x) => typeof x === "string" && /^\d{1,3}:\d{1,3}$/.test(x))
          .slice(0, 300)
      : [];
  } catch {
    return [];
  }
}
export function QuranReader() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selected, setSelected] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [expanded,setExpanded]=useState(false);
  const [chapter, setChapter] = useState<Chapter>(INITIAL);
  const [source, setSource] = useState<Source | null>(null);
  const [audioAvailability, setAudioAvailability] = useState<{available: boolean; reason: string | null}>({available:false,reason:null});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [searchError, setSearchError] = useState("");
  const searchRequest = useRef<AbortController | null>(null),
    audioSequence = useRef(0);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<
    { surah: number; surahName: string; number: number; text: string }[]
  >([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [activeAudio, setActiveAudio] = useState<number | null>(null);
  const [reciter,setReciter]=useState<QuranReciter>("ar.alafasy");
  const [surahMatches,setSurahMatches]=useState<{number:number;name:string;englishName:string;numberOfAyahs:number}[]>([]);
  const playbackMode=useRef<"single"|"surah">("single");
  const [targetAyah, setTargetAyah] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [readerSize, setReaderSize] = useState(100);
  function changeReadingSize(next: number) {
    const percent = boundedReadingPercent(next);
    setReaderSize(percent);
    try { localStorage.setItem(READING_SIZE_KEY, String(percent)); } catch { /* Device storage may be disabled. */ }
  }
  const audio = useRef<HTMLAudioElement | null>(null);
  const currentRequest = useRef(0);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(READING_SIZE_KEY);
      if (saved !== null && /^\d{2,3}$/.test(saved)) setReaderSize(boundedReadingPercent(Number(saved)));
    } catch { /* Private browsing may disable storage. */ }
    setBookmarks(bookmarksRead());
    try {const stored=localStorage.getItem(RECITER_KEY);if(isQuranReciter(stored))setReciter(stored);} catch {}
    void (async () => {
      try {
        const r = await fetch("/api/quran?list=1", { cache: "no-store" });
        if (!r.ok) throw Error("source unavailable");
        const data = await r.json();
        if (Array.isArray(data.surahs)) setChapters(data.surahs);
      } catch {
        /* Individual Surah access remains available. */
      }
    })();
    return () => {
      ++audioSequence.current;
      searchRequest.current?.abort();
      audio.current?.pause();
      audio.current?.removeAttribute("src");
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const request = ++currentRequest.current;
    ++audioSequence.current;
    audio.current?.pause();
    if (audio.current) {
      audio.current.removeAttribute("src");
      audio.current.load();
    }
    setActiveAudio(null);
    playbackMode.current="single";
    setVerses([]);
    setAudioAvailability({available:false,reason:null});
    setExpanded(Boolean(targetAyah?.startsWith(selected+":") && Number(targetAyah.split(":")[1])>5));
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const r = await fetch("/api/quran?surah=" + selected + "&reciter=" + encodeURIComponent(reciter), {
          signal: controller.signal,
        });
        if (!r.ok) throw Error("source unavailable");
        const data = await r.json();
        if (request !== currentRequest.current) return;
        if (!Array.isArray(data.verses) || data.verses.length < 1)
          throw Error("missing verses");
        setVerses(data.verses);
        setChapter(data.surah);
        setSource(data.source);
        setAudioAvailability({available: Boolean(data.audioAvailable),reason: typeof data.audioUnavailableReason==="string" ? data.audioUnavailableReason : null});
      } catch (e) {
        if (!controller.signal.aborted)
          setError(
            "تعذّر تحميل نص السورة من المصدر. راجع الاتصال وحاول مرة أخرى.",
          );
      } finally {
        if (request === currentRequest.current) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [selected, retryKey, reciter]);
  useEffect(() => {
    if (!targetAyah || loading || error) return;
    const targetNumber=Number(targetAyah.split(":")[1]);
    if(targetNumber>5&&!expanded){setExpanded(true);return;}
    const target = document.getElementById(
      "ayah-" + targetAyah.replace(":", "-"),
    );
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setTargetAyah(null);
    }
  }, [targetAyah, loading, error, verses, expanded]);
  function toggleBookmark(number: number) {
    const key = selected + ":" + number;
    setBookmarks((old) => {
      const next = old.includes(key)
        ? old.filter((x) => x !== key)
        : [...old, key].slice(-300);
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
        setNotice("تم حفظ موضع الآية على هذا الجهاز.");
      } catch {
        setNotice("العلامة متاحة خلال هذه الجلسة فقط؛ تعذّر حفظها على الجهاز.");
      }
      return next;
    });
  }
  function stopAudio() {
    playbackMode.current="single";
    ++audioSequence.current;
    if (audio.current) {
      audio.current.pause();
      audio.current.removeAttribute("src");
      audio.current.load();
    }
    setActiveAudio(null);
  }
  function playVerse(verse: Verse,mode:"single"|"surah"="single") {
    if (!verse.audio) return;
    if (activeAudio === verse.number && mode === "single") {
      stopAudio();
      return;
    }
    if (!audio.current) return;
    const sequence = ++audioSequence.current;
    playbackMode.current=mode;
    setNotice("");
    audio.current.pause();
    audio.current.src = verse.audio;
    void audio.current
      .play()
      .then(() => {
        if (sequence === audioSequence.current) setActiveAudio(verse.number);
      })
      .catch(() => {
        if (sequence === audioSequence.current) {
          setActiveAudio(null);
          setNotice(
            "تعذّر تشغيل التلاوة. جرّب آية أخرى أو أعد المحاولة عند عودة الاتصال.",
          );
        }
      });
  }
  function toggleSurahAudio(){
    if(playbackMode.current==="surah" && activeAudio!==null){stopAudio();return;}
    if(!verses.length || !verses[0]?.audio){
      setNotice("التلاوة الكاملة غير متاحة لهذا القارئ حاليًا؛ لا نبدّل إلى قارئ آخر دون اختيارك.");
      return;
    }
    playVerse(verses[0],"surah");
  }
  function continueSurahAudio(){
    if(playbackMode.current!=="surah" || activeAudio===null){
      setActiveAudio(null);return;
    }
    const next=verses.find(v=>v.number===activeAudio+1);
    if(!next){stopAudio();return;}
    if(!next.audio){
      stopAudio();
      setNotice("التسجيل التالي غير متاح لدى القارئ المحدد؛ توقفت التلاوة دون تبديل القارئ.");
      return;
    }
    playVerse(next,"surah");
  }
  async function search(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (q.length < 2 || q.length > 50) return;
    searchRequest.current?.abort();
    const controller = new AbortController();
    searchRequest.current = controller;
    setSearching(true);
    setSearchError("");
    setMatches([]);
    setSurahMatches([]);
    try {
      const r = await fetch("/api/quran?search=" + encodeURIComponent(q), {
        signal: controller.signal,
      });
      if (!r.ok) throw Error("search failed");
      const data = await r.json();
      if (!controller.signal.aborted){
        setMatches(Array.isArray(data.results) ? data.results : []);
        setSurahMatches(Array.isArray(data.surahs) ? data.surahs : []);
        if(data.partial)setSearchError("البحث داخل الآيات متوقف مؤقتًا؛ نتائج أسماء السور متاحة.");
      }
    } catch {
      if (!controller.signal.aborted)
        setSearchError(
          "البحث غير متاح حاليًا. استخدم اختيار السورة أو حاول لاحقًا.",
        );
    } finally {
      if (searchRequest.current === controller) setSearching(false);
    }
  }
  function focusVerse(id: string) {
    const parts = id.split(":").map(Number);
    if (parts.length !== 2) return;
    setTargetAyah(id);
    if(parts[1]>5)setExpanded(true);
    if (selected !== parts[0]) setSelected(parts[0]);
  }
  return (
    <div className="aura-quran">
      <header className="aura-quran-header">
        <div>
          <span className="eyebrow">
            المصحف · نص موثّق مستقل عن الذكاء الاصطناعي
          </span>
          <h1>اقرأ بتأنٍّ. واحفظ موضعك.</h1>
          <p>
            آيات القرآن تُحمّل من طبعة Uthmani المعلنة في المصدر، وليست نصوصًا
            ينشئها Noata AI.
          </p>
        </div>
        <Link
          className="aura-quran-ai-link"
          href="/ai?prompt=%D8%B3%D8%A7%D8%B9%D8%AF%D9%86%D9%8A%20%D8%A3%D9%81%D9%87%D9%85%20%D9%85%D8%B9%D9%86%D9%89%20%D8%A2%D9%8A%D8%A9%20%D9%85%D9%86%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86"
        >
          اسأل Noata عن الشرح <Icon name="arrow" size={17} />
        </Link>
      </header>
      {notice && (
        <p role="status" className="aura-quran-notice">
          {notice}
        </p>
      )}
      {searchError && (
        <p role="alert" className="error-banner">
          {searchError}
        </p>
      )}
      <nav className="aura-quran-chapter-nav" aria-label="التنقل بين السور">
        <button
          type="button"
          disabled={selected <= 1}
          onClick={() => setSelected((n) => Math.max(1, n - 1))}
        >
          السورة السابقة
        </button>
        <span>السورة {selected.toLocaleString("ar-EG")} من ١١٤</span>
        <button
          type="button"
          disabled={selected >= 114}
          onClick={() => setSelected((n) => Math.min(114, n + 1))}
        >
          السورة التالية
        </button>
      </nav>
      <section className="noata-quran-audio-dock" aria-label="مشغل تلاوة السورة">
        <div><strong>مشغل التلاوة</strong><span>{source?.reciterName ?? QURAN_RECITERS.find(x=>x.id===reciter)?.name} · {chapter.name}</span></div>
        <label>الشيخ
          <select value={reciter} onChange={e=>{
            const next=e.target.value;
            if(!isQuranReciter(next))return;
            setReciter(next);
            try{localStorage.setItem(RECITER_KEY,next);}catch{}
          }} aria-label="اختيار الشيخ للتلاوة">
            {QURAN_RECITERS.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </label>
        <button type="button" className="btn" onClick={toggleSurahAudio} disabled={loading||!!error||!verses.length}>
          <Icon name={playbackMode.current==="surah"&&activeAudio!==null?"close":"volume"} size={18}/>
          {playbackMode.current==="surah"&&activeAudio!==null?"إيقاف السورة":"استمع للسورة كاملة"}
        </button>
        <small aria-live="polite">{activeAudio===null?"التشغيل يبدأ باختيارك؛ لا تشغيل تلقائي": "تُتلى الآية "+activeAudio.toLocaleString("ar-EG")+" · "+(playbackMode.current==="surah"?"تلاوة متتابعة":"آية واحدة")}</small>
        {!loading && !error && !audioAvailability.available && audioAvailability.reason && <small role="status" className="noata-quran-audio-unavailable">{audioAvailability.reason}</small>}
      </section>
      <div className="aura-quran-toolbar">
        <label>
          <span>السورة</span>
          <select
            value={selected}
            onChange={(e) => setSelected(Number(e.target.value))}
            aria-label="اختيار سورة"
          >
            {(chapters.length ? chapters : [INITIAL]).map((s) => (
              <option value={s.number} key={s.number}>
                {s.number}. {s.name}
              </option>
            ))}
          </select>
        </label>
        <div className="aura-quran-font">
          <span>حجم القراءة</span>
          <button
            type="button"
            onClick={() => changeReadingSize(readerSize - 10)}
            disabled={readerSize <= MIN_READING_PERCENT}
            aria-label="تصغير خط القرآن"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => changeReadingSize(100)}
            aria-label={`حجم القراءة ${readerSize}%، إعادة الضبط إلى ١٠٠٪`}
            aria-live="polite"
          >
            {readerSize.toLocaleString("ar-EG")}٪
          </button>
          <button
            type="button"
            onClick={() => changeReadingSize(readerSize + 10)}
            disabled={readerSize >= MAX_READING_PERCENT}
            aria-label="تكبير خط القرآن"
          >
            +
          </button>
        </div>
        <form className="aura-quran-search" onSubmit={search}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن كلمة في القرآن…"
            aria-label="البحث في القرآن"
            maxLength={50}
          />
          <button
            type="submit"
            disabled={query.trim().length < 2 || searching}
            aria-label="ابحث"
          >
            <Icon name="search" size={18} />
          </button>
        </form>
      </div>
      {!!surahMatches.length && <section className="noata-quran-surah-matches" aria-label="سور مطابقة للبحث">
        <strong>سور مطابقة</strong>
        <div>{surahMatches.map(s=><button type="button" key={s.number}
          onClick={()=>{setSelected(s.number);setMatches([]);setSurahMatches([]);}}>
          {s.name} <small>{s.englishName} · {s.numberOfAyahs.toLocaleString("ar-EG")} آية</small>
        </button>)}</div>
      </section>}
      {!!matches.length && (
        <section className="aura-quran-search-results" aria-label="نتائج البحث">
          <div className="panel-head">
            <h2>نتائج البحث</h2>
            <button type="button" onClick={() => {setMatches([]);setSurahMatches([]);}}>
              إغلاق النتائج
            </button>
          </div>
          {matches.map((m, i) => (
            <button
              key={i}
              type="button"
              onClick={() => focusVerse(m.surah + ":" + m.number)}
            >
              <strong>
                {m.surahName} · {m.number}
              </strong>
              <span dir="rtl">{m.text}</span>
            </button>
          ))}
        </section>
      )}
      {bookmarks.length > 0 && (
        <div className="aura-quran-bookmarks">
          <strong>مواضعك المحفوظة على هذا الجهاز</strong>
          {bookmarks
            .slice(-8)
            .reverse()
            .map((id) => (
              <button type="button" key={id} onClick={() => focusVerse(id)}>
                {id}
              </button>
            ))}
        </div>
      )}
      <section id="noata-quran-verses" className="aura-quran-reading" aria-busy={loading}>
        <div className="aura-quran-chapter">
          <span>سورة</span>
          <h2>{chapter.name}</h2>
          <p>
            {chapter.englishName} · {chapter.numberOfAyahs} آيات
          </p>
        </div>
        {loading && (
          <p role="status" className="aura-quran-state">
            جارٍ جلب النص القرآني من مصدره…
          </p>
        )}
        {error && (
          <div className="error-banner" role="alert">
            {error}
            <button type="button" onClick={() => setRetryKey((x) => x + 1)}>
              إعادة تحميل السورة
            </button>
          </div>
        )}
        {!loading &&
          !error &&
          (expanded ? verses : verses.slice(0,5)).map((v) => {
            const key = selected + ":" + v.number;
            return (
              <article
                id={"ayah-" + selected + "-" + v.number}
                className="aura-quran-ayah"
                data-playing={activeAudio === v.number}
                key={v.number}
              >
                <div className="aura-quran-ayah-actions">
                  <span className="aura-ayah-number">
                    {v.number.toLocaleString("ar-EG")}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleBookmark(v.number)}
                    aria-pressed={bookmarks.includes(key)}
                    aria-label={
                      bookmarks.includes(key)
                        ? "إزالة العلامة"
                        : "حفظ موضع الآية"
                    }
                  >
                    <Icon name="pin" size={17} />
                  </button>
                  {v.audio && (
                    <button
                      type="button"
                      onClick={() => playVerse(v)}
                      aria-pressed={activeAudio === v.number}
                      aria-label={
                        activeAudio === v.number
                          ? "إيقاف التلاوة"
                          : "استمع لتلاوة الآية"
                      }
                    >
                      <Icon
                        name={activeAudio === v.number ? "close" : "volume"}
                        size={17}
                      />
                    </button>
                  )}
                </div>
                <p
                  className="aura-quran-verse"
                  dir="rtl"
                  lang="ar"
                  style={{
                    fontSize:
                      `${(32 * readerSize / 100).toFixed(1)}px`,
                  }}
                >
                  {v.text}
                  <span className="aura-quran-verse-number">
                    {" "}
                    ﴿{v.number.toLocaleString("ar-EG")}﴾
                  </span>
                </p>
              </article>
            );
          })}
        {!loading && !error && verses.length > 5 && (
          <div className="noata-quran-preview-toggle">
            <div>
              <strong>{expanded ? "أنت تقرأ السورة كاملة" : "أول خمس آيات للقراءة السريعة"}</strong>
              <p>{expanded ? "تقدر ترجع للعرض المختصر في أي وقت." : "باقي " + (verses.length - 5).toLocaleString("ar-EG") + " آية مخفية حتى تختار عرض السورة كاملة. البحث والعلامات هيفتحوا الآية المطلوبة تلقائيًا."}</p>
            </div>
            <button type="button" aria-expanded={expanded} aria-controls="noata-quran-verses" onClick={()=>{
              if(expanded && activeAudio!==null && activeAudio>5)stopAudio();
              setExpanded(v=>!v);
            }}>{expanded ? "طي السورة إلى خمس آيات" : "عرض السورة كاملة"}
              <Icon name="chevron" size={17}/>
            </button>
          </div>
        )}
      </section>
      <audio
        ref={audio}
        preload="none"
        onEnded={continueSurahAudio}
        onError={() => {
          stopAudio();
          setNotice("ملف التلاوة المحدد غير متاح حاليًا؛ يمكنك متابعة القراءة أو تغيير القارئ.");
        }}
        aria-label="مشغل تلاوة الآيات"
      />
      <footer className="aura-quran-attribution">
        المصدر:{" "}
        <a
          href={source?.reference ?? "https://alquran.cloud/api"}
          target="_blank"
          rel="noopener noreferrer"
        >
          AlQuran Cloud
        </a>{" "}
        · النص: {source?.edition ?? "quran-uthmani"} · التلاوة، عند توفرها:{" "}
        {source?.audioEdition ?? reciter}.
        <a
          href="https://alquran.cloud/terms-and-conditions"
          target="_blank"
          rel="noopener noreferrer"
        >
          حقوق الاستخدام والتلاوات
        </a>
        . الشروح التي يقدمها الذكاء الاصطناعي منفصلة ولا تُعتبر آيات قرآنية.
      </footer>
    </div>
  );
}
