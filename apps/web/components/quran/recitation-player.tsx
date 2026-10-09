"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { mediaTime, type Chapter } from "@/lib/quran/reciters";
export function RecitationPlayer({ url, chapter, reciterName, unavailable, onChapter }: { url: string | null; chapter: Chapter; reciterName: string; unavailable: string; onChapter: (number: number) => void }) {
  const audio = useRef<HTMLAudioElement>(null);
  const request = useRef(0);
  const playbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [repeat, setRepeat] = useState(false);
  const [failure, setFailure] = useState("");
  useEffect(() => {
    const element = audio.current;
    if (element && url) element.src = url;
    return () => { ++request.current; if (playbackTimeout.current) clearTimeout(playbackTimeout.current); element?.pause(); element?.removeAttribute("src"); element?.load(); };
  }, [url]);
  async function toggle() {
    const element = audio.current;
    if (!element || !url) return;
    if (!element.paused || pending) { ++request.current; if (playbackTimeout.current) clearTimeout(playbackTimeout.current); element.pause(); setPending(false); setPlaying(false); return; }
    const sequence = ++request.current;
    setFailure(""); setPending(true);
    playbackTimeout.current = setTimeout(() => {
      if (sequence !== request.current) return;
      ++request.current; element.pause(); setPending(false); setPlaying(false);
      setFailure("استغرق تحميل التلاوة وقتًا طويلًا. أعد المحاولة أو اختر قارئًا آخر.");
    }, 15000);
    try { if (element.error) element.load(); element.playbackRate = speed; await element.play(); }
    catch { if (sequence === request.current) setFailure("تعذّر تشغيل التلاوة. أعد المحاولة؛ يمكنك متابعة القراءة."); }
    finally { if (sequence === request.current) { if (playbackTimeout.current) clearTimeout(playbackTimeout.current); setPending(false); } }
  }
  return <section className="mushaf-player" aria-label="مشغل التلاوة">
    <div className="mushaf-player-heading"><span className={`mushaf-sound-mark ${playing ? "is-playing" : ""}`} aria-hidden="true"><i/><i/><i/><i/><i/></span><div><strong>{chapter.name}</strong><span>{reciterName} · تلاوة السورة كاملة</span></div><span className="mushaf-player-tag">الاستماع</span></div>
    <div className="mushaf-player-timeline"><input aria-label="موضع التلاوة" type="range" min={0} max={duration || 1} step={1} value={Math.min(elapsed, duration || 1)} disabled={!duration || !url} dir="ltr" onChange={e => { if (audio.current) { audio.current.currentTime = Number(e.target.value); setElapsed(Number(e.target.value)); } }}/><div dir="ltr"><time>{mediaTime(elapsed)}</time><time>{mediaTime(duration)}</time></div></div>
    <div className="mushaf-player-controls">
      <button type="button" aria-label="تكرار السورة" aria-pressed={repeat} onClick={() => setRepeat(v => !v)}><Icon name="review" size={19}/></button>
      <button type="button" aria-label="السورة السابقة في المشغل" disabled={chapter.number <= 1} onClick={() => onChapter(chapter.number - 1)}><Icon name="arrow" size={19} style={{ transform: "rotate(180deg)" }}/></button>
      <button type="button" className="mushaf-player-play" disabled={!url} aria-label={pending ? "إلغاء تحميل التلاوة" : playing ? "إيقاف التلاوة مؤقتًا" : "تشغيل تلاوة السورة"} onClick={() => void toggle()}><Icon name={pending ? "stop" : playing ? "pause" : "play"} size={23}/></button>
      <button type="button" aria-label="السورة التالية في المشغل" disabled={chapter.number >= 114} onClick={() => onChapter(chapter.number + 1)}><Icon name="arrow" size={19}/></button>
      <label><span className="sr-only">سرعة التلاوة</span><select aria-label="سرعة التلاوة" value={speed} onChange={e => { const value = Number(e.target.value); setSpeed(value); if (audio.current) audio.current.playbackRate = value; }}>{[0.75, 1, 1.25, 1.5].map(n => <option value={n} key={n}>{n}×</option>)}</select></label>
    </div>
    <p className="mushaf-player-status" role="status">{failure || (!url ? unavailable : pending ? "جارٍ بدء التلاوة…" : playing ? "تُشغّل الآن · يمكنك متابعة القراءة" : "اضغط التشغيل للاستماع · لا يوجد تشغيل تلقائي")}</p>
    <audio ref={audio} src={url ?? undefined} preload="none" loop={repeat} onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onTimeUpdate={e => setElapsed(e.currentTarget.currentTime)} onDurationChange={e => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)} onError={() => { setPlaying(false); setPending(false); setFailure("ملف التلاوة غير متاح حاليًا. القراءة متاحة؛ أعد المحاولة أو اختر قارئًا آخر."); }} aria-label="تلاوة السورة"/>
  </section>;
}
