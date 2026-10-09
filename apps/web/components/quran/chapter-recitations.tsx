"use client";

import { useEffect, useRef, useState } from "react";
import { chapterRecitation, REQUESTED_RECITERS, type Reciter, type ReciterId } from "@/lib/quran/reciters";

/** Full recordings complement the independently verified verse-by-verse source. */
export function ChapterRecitations({ surah, name }: { surah: number; name: string }) {
  const [catalogue, setCatalogue] = useState<Reciter[]>([]);
  const [selected, setSelected] = useState<ReciterId>("sudais");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [mediaError, setMediaError] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const response = await fetch("/api/quran?reciters=1", {signal: controller.signal});
        if (!response.ok) throw Error("Catalogue unavailable");
        const data = await response.json();
        if (!Array.isArray(data.reciters)) throw Error("Invalid catalogue");
        if (!controller.signal.aborted) setCatalogue(data.reciters);
      } catch {
        if (!controller.signal.aborted) {
          setCatalogue([]);
          setError("تعذّر تحميل دليل التلاوات. يمكنك متابعة القراءة أو استخدام مشغل الآيات والمحاولة لاحقًا.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    setMediaError(false);
    const player = audio.current;
    player?.pause();
    return () => player?.pause();
  }, [selected, surah]);
  useEffect(() => {
    const stop = (event: Event) => {
      if ((event as CustomEvent).detail !== "chapter") audio.current?.pause();
    };
    window.addEventListener("noata-quran-playback-start", stop);
    return () => window.removeEventListener("noata-quran-playback-start", stop);
  }, []);
  const reciter = catalogue.find(item => item.id === selected);
  const url = chapterRecitation(reciter, surah);
  return <section className="noata-chapter-recitations" aria-label="تلاوات السورة بتسعة قرّاء" aria-busy={loading}>
    <div><span className="eyebrow">تلاوة السورة كاملة</span><h2>استمع بصوت تحبّه</h2>
      <p>تسجيل كامل للسورة من MP3Quran. اختر القارئ، ثم ابدأ الاستماع؛ يمكنك الإيقاف والتقديم من المشغل.</p></div>
    <label htmlFor="noata-chapter-reciter">قارئ السورة
      <select id="noata-chapter-reciter" value={selected} disabled={loading} onChange={event => {
        const id = event.target.value;
        if (REQUESTED_RECITERS.some(item => item.id === id)) setSelected(id as ReciterId);
      }}>{REQUESTED_RECITERS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    </label>
    <strong>{name} · {REQUESTED_RECITERS.find(item => item.id === selected)?.name}</strong>
    {loading ? <p role="status">جارٍ تحميل مصادر التلاوة…</p> : error ? <div role="status">
      <p>{error}</p><button type="button" className="btn" onClick={() => setRetry(value => value + 1)}>إعادة تحميل التلاوات</button>
    </div> : url ? <>
      <audio key={selected + ":" + surah} ref={audio} src={url} controls preload="none"
        aria-label={"تلاوة " + name + " بصوت " + reciter?.name}
        onPlay={() => window.dispatchEvent(new CustomEvent("noata-quran-playback-start", {detail: "chapter"}))}
        onError={() => setMediaError(true)} />
      {mediaError && <p role="status">تعذّر تشغيل تسجيل هذا القارئ. أعد المحاولة من المشغل أو اختر قارئًا آخر بنفسك.</p>}
    </> : <p role="status">لم يؤكّد دليل المصدر وجود تسجيل لهذه السورة بصوت القارئ المختار. اختر قارئًا آخر بنفسك.</p>}
    <small>المصدر: <a href="https://www.mp3quran.net/ar" target="_blank" rel="noopener noreferrer">MP3Quran</a> · حفص عن عاصم · مرتّل</small>
  </section>;
}
