"use client";
import {reciterDisplayName} from "@/lib/i18n/quran-labels";
import {useLocale,useTranslation} from "@/lib/i18n/locale";

import { useEffect, useRef, useState } from "react";
import { chapterRecitation, REQUESTED_RECITERS, type Reciter, type ReciterId } from "@/lib/quran/reciters";

/** Full recordings complement the independently verified verse-by-verse source. */
export function ChapterRecitations({ surah, name }: { surah: number; name: string }) {
 const t=useTranslation(),locale=useLocale();
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
          setError(t("تعذّر تحميل دليل التلاوات. يمكنك متابعة القراءة أو استخدام مشغل الآيات والمحاولة لاحقًا.","Could not load the recording catalogue. Continue reading or use the verse player, then retry later."));
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
  return <section className="noata-chapter-recitations" aria-label={t("تلاوات السورة بتسعة قرّاء","Surah recordings by nine reciters")} aria-busy={loading}>
    <div><span className="eyebrow">{t("تلاوة السورة كاملة","Full surah recitation")}</span><h2>{t("استمع بصوت تحبّه","Listen to your chosen reciter")}</h2>
      <p>{t("تسجيل كامل للسورة من MP3Quran. اختر القارئ، ثم ابدأ الاستماع؛ يمكنك الإيقاف والتقديم من المشغل.","Full recordings from MP3Quran. Choose a reciter, then start playback. Pause or seek using the player.")}</p></div>
    <label htmlFor="noata-chapter-reciter">{t("قارئ السورة","Surah reciter")}<select id="noata-chapter-reciter" value={selected} disabled={loading} onChange={event => {
        const id = event.target.value;
        if (REQUESTED_RECITERS.some(item => item.id === id)) setSelected(id as ReciterId);
      }}>{REQUESTED_RECITERS.map(item => <option key={item.id} value={item.id}>{reciterDisplayName(item.name,locale)}</option>)}</select>
    </label>
    <strong>{name} · {reciterDisplayName(REQUESTED_RECITERS.find(item => item.id === selected)?.name??"",locale)}</strong>
    {loading ? <p role="status">{t("جارٍ تحميل مصادر التلاوة…","Loading recording sources…")}</p> : error ? <div role="status">
      <p>{error}</p><button type="button" className="btn" onClick={() => setRetry(value => value + 1)}>{t("إعادة تحميل التلاوات","Reload recordings")}</button>
    </div> : url ? <>
      <audio key={selected + ":" + surah} ref={audio} src={url} controls preload="none"
        aria-label={t("تلاوة ","Recitation ") + name + t(" بصوت "," by ") + reciterDisplayName(reciter?.name??"",locale)}
        onPlay={() => window.dispatchEvent(new CustomEvent("noata-quran-playback-start", {detail: "chapter"}))}
        onError={() => setMediaError(true)} />
      {mediaError && <p role="status">{t("تعذّر تشغيل تسجيل هذا القارئ. أعد المحاولة من المشغل أو اختر قارئًا آخر بنفسك.","Could not play this recording. Retry or choose another reciter.")}</p>}
    </> : <p role="status">{t("لم يؤكّد دليل المصدر وجود تسجيل لهذه السورة بصوت القارئ المختار. اختر قارئًا آخر بنفسك.","The source catalogue does not confirm this surah for the selected reciter. Choose another reciter.")}</p>}
    <small>{t("المصدر:","Source:")}<a href="https://www.mp3quran.net/ar" target="_blank" rel="noopener noreferrer">MP3Quran</a>{t("· حفص عن عاصم · مرتّل","· Hafs from Asim · Murattal")}</small>
  </section>;
}
