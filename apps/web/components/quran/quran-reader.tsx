"use client";
import Link from "next/link";
import { useEffect,useRef,useState } from "react";
import { Icon } from "@/components/ui/icon";

type Chapter={number:number;name:string;englishName:string;numberOfAyahs:number};
type Verse={number:number;globalNumber:number;text:string;audio:string|null};
type Source={name:string;edition:string;reference:string;terms:string;audioEdition:string};
const LOCAL_KEY="noata-quran-bookmarks-v1";
const INITIAL:Chapter={number:1,name:"الفاتحة",englishName:"Al-Faatiha",numberOfAyahs:7};
function bookmarksRead():string[] {
  try{
    const value=JSON.parse(localStorage.getItem(LOCAL_KEY)??"[]");
    return Array.isArray(value)?value.filter(x=>typeof x==="string"&&/^\d{1,3}:\d{1,3}$/.test(x)).slice(0,300):[];
  }catch{return [];}
}
export function QuranReader(){
  const [chapters,setChapters]=useState<Chapter[]>([]);
  const [selected,setSelected]=useState(1);
  const [verses,setVerses]=useState<Verse[]>([]);
  const [chapter,setChapter]=useState<Chapter>(INITIAL);
  const [source,setSource]=useState<Source|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [query,setQuery]=useState("");
  const [searching,setSearching]=useState(false);
  const [matches,setMatches]=useState<{surah:number;surahName:string;number:number;text:string}[]>([]);
  const [bookmarks,setBookmarks]=useState<string[]>([]);
  const [activeAudio,setActiveAudio]=useState<number|null>(null);
  const [readerSize,setReaderSize]=useState(1);
  const audio=useRef<HTMLAudioElement|null>(null);
  const currentRequest=useRef(0);
  useEffect(()=>{
    setBookmarks(bookmarksRead());
    void (async()=>{
      try{
        const r=await fetch("/api/quran?list=1",{cache:"no-store"});
        if(!r.ok)throw Error("source unavailable");
        const data=await r.json();
        if(Array.isArray(data.surahs))setChapters(data.surahs);
      }catch{ /* Individual Surah access remains available. */ }
    })();
    return ()=>{audio.current?.pause();audio.current?.removeAttribute("src");};
  },[]);
  useEffect(()=>{
    const controller=new AbortController();
    const request=++currentRequest.current;
    audio.current?.pause();
    if(audio.current){audio.current.removeAttribute("src");audio.current.load();}
    setActiveAudio(null);
    setVerses([]);setLoading(true);setError("");
    void (async()=>{
      try{
        const r=await fetch("/api/quran?surah="+selected,{signal:controller.signal});
        if(!r.ok)throw Error("source unavailable");
        const data=await r.json();
        if(request!==currentRequest.current)return;
        if(!Array.isArray(data.verses)||data.verses.length<1)throw Error("missing verses");
        setVerses(data.verses);setChapter(data.surah);setSource(data.source);
      }catch(e){
        if(!controller.signal.aborted)setError("تعذّر تحميل نص السورة من المصدر. راجع الاتصال وحاول مرة أخرى.");
      }finally{
        if(request===currentRequest.current)setLoading(false);
      }
    })();
    return ()=>controller.abort();
  },[selected]);
  function toggleBookmark(number:number){
    const key=selected+":"+number;
    setBookmarks(old=>{
      const next=old.includes(key)?old.filter(x=>x!==key):[...old,key].slice(-300);
      try{localStorage.setItem(LOCAL_KEY,JSON.stringify(next));}catch{}
      return next;
    });
  }
  function stopAudio(){
    if(audio.current){audio.current.pause();audio.current.removeAttribute("src");audio.current.load();}
    setActiveAudio(null);
  }
  function playVerse(verse:Verse) {
    if(!verse.audio)return;
    if(activeAudio===verse.number){stopAudio();return;}
    if(!audio.current)return;
    audio.current.pause();
    audio.current.src=verse.audio;
    setActiveAudio(verse.number);
    void audio.current.play().catch(()=>setActiveAudio(null));
  }
  async function search(event:React.FormEvent) {
    event.preventDefault();
    const q=query.trim();if(q.length<2||q.length>50)return;
    setSearching(true);setError("");setMatches([]);
    try{
      const r=await fetch("/api/quran?search="+encodeURIComponent(q));
      if(!r.ok)throw Error("search failed");
      const data=await r.json();
      setMatches(Array.isArray(data.results)?data.results:[]);
    }catch{setError("البحث غير متاح حاليًا. استخدم اختيار السورة أو حاول لاحقًا.");}
    finally{setSearching(false);}
  }
  function focusVerse(id:string){
    const parts=id.split(":").map(Number);
    if(parts.length!==2)return;
    if(selected!==parts[0])setSelected(parts[0]);
    setTimeout(()=>document.getElementById("ayah-"+id.replace(":","-"))?.scrollIntoView({behavior:"smooth",block:"center"}),600);
  }
  return (
    <div className="aura-quran">
      <header className="aura-quran-header">
        <div>
          <span className="eyebrow">المصحف · نص موثّق مستقل عن الذكاء الاصطناعي</span>
          <h1>اقرأ بتأنٍّ. واحفظ موضعك.</h1>
          <p>آيات القرآن تُحمّل من طبعة Uthmani المعلنة في المصدر، وليست نصوصًا ينشئها Noata AI.</p>
        </div>
        <Link className="aura-quran-ai-link" href="/ai?prompt=%D8%B3%D8%A7%D8%B9%D8%AF%D9%86%D9%8A%20%D8%A3%D9%81%D9%87%D9%85%20%D9%85%D8%B9%D9%86%D9%89%20%D8%A2%D9%8A%D8%A9%20%D9%85%D9%86%20%D8%A7%D9%84%D9%82%D8%B1%D8%A2%D9%86">
          اسأل Noata عن الشرح <Icon name="arrow" size={17}/>
        </Link>
      </header>
      <div className="aura-quran-toolbar">
        <label>
          <span>السورة</span>
          <select value={selected} onChange={e=>setSelected(Number(e.target.value))} aria-label="اختيار سورة">
            {(chapters.length?chapters:[INITIAL]).map(s=><option value={s.number} key={s.number}>{s.number}. {s.name}</option>)}
          </select>
        </label>
        <div className="aura-quran-font">
          <span>حجم القراءة</span>
          <button type="button" onClick={()=>setReaderSize(x=>Math.max(.85,x-.1))} aria-label="تصغير خط القرآن">−</button>
          <button type="button" onClick={()=>setReaderSize(1)} aria-label="إعادة حجم خط القرآن">١٠٠٪</button>
          <button type="button" onClick={()=>setReaderSize(x=>Math.min(1.6,x+.1))} aria-label="تكبير خط القرآن">+</button>
        </div>
        <form className="aura-quran-search" onSubmit={search}>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث عن كلمة في القرآن…" aria-label="البحث في القرآن" maxLength={50}/>
          <button type="submit" disabled={query.trim().length<2||searching} aria-label="ابحث"><Icon name="search" size={18}/></button>
        </form>
      </div>
      {!!matches.length && <section className="aura-quran-search-results" aria-label="نتائج البحث">
        <div className="panel-head"><h2>نتائج البحث</h2><button type="button" onClick={()=>setMatches([])}>إغلاق النتائج</button></div>
        {matches.map((m,i)=><button key={i} type="button" onClick={()=>focusVerse(m.surah+":"+m.number)}>
          <strong>{m.surahName} · {m.number}</strong>
          <span dir="rtl">{m.text}</span>
        </button>)}
      </section>}
      {bookmarks.length>0&&<div className="aura-quran-bookmarks">
        <strong>مواضعك المحفوظة على هذا الجهاز</strong>
        {bookmarks.slice(-8).reverse().map(id=><button type="button" key={id} onClick={()=>focusVerse(id)}>{id}</button>)}
      </div>}
      <section className="aura-quran-reading" aria-busy={loading}>
        <div className="aura-quran-chapter">
          <span>سورة</span><h2>{chapter.name}</h2>
          <p>{chapter.englishName} · {chapter.numberOfAyahs} آيات</p>
        </div>
        {loading&&<p role="status" className="aura-quran-state">جارٍ جلب النص القرآني من مصدره…</p>}
        {error&&<div className="error-banner" role="alert">{error}<button type="button" onClick={()=>setSelected(x=>x===114?113:x+1)}>جرّب سورة أخرى</button></div>}
        {!loading&&!error&&verses.map(v=>{
          const key=selected+":"+v.number;
          return <article id={"ayah-"+selected+"-"+v.number} className="aura-quran-ayah" key={v.number}>
            <div className="aura-quran-ayah-actions">
              <span className="aura-ayah-number">{v.number.toLocaleString("ar-EG")}</span>
              <button type="button" onClick={()=>toggleBookmark(v.number)} aria-pressed={bookmarks.includes(key)} aria-label={bookmarks.includes(key)?"إزالة العلامة":"حفظ موضع الآية"}>
                <Icon name="pin" size={17}/>
              </button>
              {v.audio&&<button type="button" onClick={()=>playVerse(v)} aria-pressed={activeAudio===v.number} aria-label={activeAudio===v.number?"إيقاف التلاوة":"استمع لتلاوة الآية"}>
                <Icon name={activeAudio===v.number?"close":"volume"} size={17}/>
              </button>}
            </div>
            <p className="aura-quran-verse" dir="rtl" lang="ar" style={{fontSize:"clamp("+Math.round(24*readerSize)+"px,3vw,"+Math.round(34*readerSize)+"px)"}}>{v.text}<span className="aura-quran-verse-number"> ﴿{v.number.toLocaleString("ar-EG")}﴾</span></p>
          </article>;
        })}
      </section>
      <audio ref={audio} preload="none" onEnded={()=>setActiveAudio(null)} onError={()=>setActiveAudio(null)} aria-label="مشغل تلاوة الآيات" />
      <footer className="aura-quran-attribution">
        المصدر: <a href={source?.reference??"https://alquran.cloud/api"} target="_blank" rel="noopener noreferrer">AlQuran Cloud</a> · النص: {source?.edition??"quran-uthmani"} · التلاوة، عند توفرها: {source?.audioEdition??"ar.alafasy"}.
        <a href="https://alquran.cloud/terms-and-conditions" target="_blank" rel="noopener noreferrer">حقوق الاستخدام والتلاوات</a>.
        الشروح التي يقدمها الذكاء الاصطناعي منفصلة ولا تُعتبر آيات قرآنية.
      </footer>
    </div>
  );
}
