"use client";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Icon } from "@/components/ui/icon";
import { quranFetcher, type ChapterResponse } from "@/lib/quran/reciters";
import { recitationLink } from "@/lib/quran/source";

export function VerseRecitation({ surah, verse, onClose }: { surah: number; verse: number; onClose: () => void }) {
  const recording = useSWR<ChapterResponse>(`/api/quran?surah=${surah}`, quranFetcher, { revalidateOnFocus: false, shouldRetryOnError: false });
  const audio = useRef<HTMLAudioElement>(null);
  const [failed, setFailed] = useState(false);
  const url = recording.data?.surah.number === surah && recording.data.source.audioEdition === "ar.alafasy"
    ? recitationLink(recording.data.verses.find(item => item.number === verse)?.audio)
    : null;
  useEffect(() => {
    const element = audio.current;
    return () => { element?.pause(); element?.removeAttribute("src"); element?.load(); };
  }, [url]);
  return <section className="mushaf-verse-recitation" aria-label="تلاوة الآية المختارة">
    <div className="mushaf-verse-recitation-heading"><Icon name="volume" size={18}/><div><strong>الآية {verse.toLocaleString("ar-EG")} · مشاري العفاسي</strong><p>تلاوة الآية من AlQuran Cloud؛ اختيار القرّاء التسعة يخصّ تلاوة السورة كاملة.</p></div><button type="button" onClick={onClose} aria-label="إغلاق تلاوة الآية"><Icon name="close" size={16}/></button></div>
    {recording.isLoading ? <p role="status">جارٍ تحميل تلاوة الآية من مصدرها…</p> : recording.error || !url ? <div role="alert"><p>تلاوة الآية غير متاحة حاليًا. نص المصحف متاح دون تغيير.</p><button type="button" onClick={() => void recording.mutate()}>إعادة المحاولة</button></div> : <>
      <audio ref={audio} src={url} controls autoPlay preload="metadata" aria-label={`تلاوة الآية ${verse.toLocaleString("ar-EG")} بصوت مشاري العفاسي`} onError={() => setFailed(true)} onPlaying={() => setFailed(false)}/>
      {failed ? <div role="alert"><p>تعذّر تشغيل تلاوة الآية. يمكنك متابعة القراءة أو إعادة التحميل.</p><button type="button" onClick={() => { setFailed(false); audio.current?.load(); }}>إعادة تحميل التلاوة</button></div> : <p>إن لم يبدأ الصوت، اضغط التشغيل في المشغل. لا يبدأ الاستماع إلا بعد اختيارك لآية.</p>}
    </>}
  </section>;
}
