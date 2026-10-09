"use client";
import type { RefObject } from "react";
import { Icon } from "@/components/ui/icon";
import { mediaTime, type Chapter } from "@/lib/quran/reciters";
import type { PlaybackState, QuranAudioEngine } from "@/lib/quran/audio-engine";

export function RecitationPlayer({ chapter, reciterName, unavailable, onChapter, onFull, onVerse, canPrevious, canNext, sequence, onSequence, audioRef, engine, state, verseNote }: {
  chapter: Chapter; reciterName: string; unavailable: string; onChapter: (number: number) => void; onFull: () => void; onVerse: (number: number) => void;
  canPrevious: boolean; canNext: boolean; sequence: boolean; onSequence: (enabled: boolean) => void; audioRef: RefObject<HTMLAudioElement | null>;
  engine: QuranAudioEngine; state: PlaybackState; verseNote: string;
}) {
  const verse = state.track?.mode === "ayah" ? state.track.ayah : undefined;
  const busy = state.status === "loading" || state.status === "buffering";
  const playing = state.status === "playing";
  const available = !!state.track?.url;
  const status = state.error || (!available ? unavailable : state.status === "buffering" ? "جارٍ تخزين الصوت مؤقتًا…" : busy ? "جارٍ بدء التلاوة…" : playing ? "تُشغّل الآن · إضاءة الآية تتبع الصوت الفعلي" : state.status === "ended" ? "انتهت التلاوة" : state.status === "paused" ? "التلاوة متوقفة مؤقتًا · تابع من الموضع نفسه" : "اختر التشغيل للاستماع · لا يبدأ الصوت تلقائيًا");
  return <section className="mushaf-player" aria-label="مشغل التلاوة" data-mode={verse ? "ayah" : "surah"} data-status={state.status}>
    <div className="mushaf-player-heading"><span className="mushaf-audio-emblem" aria-hidden="true"><Icon name="volume" size={27}/></span><div><span className="mushaf-player-eyebrow">{verse ? `آية بآية · الآية ${verse.toLocaleString("ar-EG")}` : "تلاوة السورة كاملة"}</span><strong>{chapter.name}</strong><span>{reciterName}</span></div><span className="mushaf-player-tag">{verse ? "EveryAyah" : "MP3Quran"}</span></div>
    <div className="mushaf-player-timeline"><input aria-label="موضع التلاوة" aria-valuetext={`${mediaTime(state.elapsed)} من ${mediaTime(state.duration)}`} type="range" min={0} max={state.duration || 1} step={0.1} value={Math.min(state.elapsed, state.duration || 1)} disabled={!state.duration || !available} dir="ltr" onChange={e => engine.seek(Number(e.target.value))}/><div dir="ltr"><time>{mediaTime(state.elapsed)}</time><time>{state.duration ? mediaTime(state.duration) : "—:—"}</time></div></div>
    <div className="mushaf-player-controls">
      <button type="button" aria-label={verse ? "تكرار الآية" : "تكرار السورة"} aria-pressed={state.repeat} onClick={() => engine.setRepeat(!state.repeat)}><Icon name="review" size={19}/></button>
      <button type="button" aria-label={verse ? "الآية السابقة في المشغل" : "السورة السابقة في المشغل"} disabled={verse ? !canPrevious : chapter.number <= 1} onClick={() => verse ? onVerse(verse - 1) : onChapter(chapter.number - 1)}><Icon name="arrow" size={19} style={{ transform: "rotate(180deg)" }}/></button>
      <button type="button" className="mushaf-player-play" disabled={!available} aria-label={busy ? "إلغاء تحميل التلاوة" : playing ? "إيقاف التلاوة مؤقتًا" : verse ? "تشغيل تلاوة الآية" : "تشغيل تلاوة السورة"} onClick={() => engine.toggle()}><Icon name={busy ? "stop" : playing ? "pause" : "play"} size={25}/></button>
      <button type="button" aria-label={verse ? "الآية التالية في المشغل" : "السورة التالية في المشغل"} disabled={verse ? !canNext : chapter.number >= 114} onClick={() => verse ? onVerse(verse + 1) : onChapter(chapter.number + 1)}><Icon name="arrow" size={19}/></button>
      <label><span className="sr-only">سرعة التلاوة</span><select aria-label="سرعة التلاوة" value={state.speed} onChange={e => engine.setSpeed(Number(e.target.value))}>{[0.75, 1, 1.25, 1.5].map(n => <option value={n} key={n}>{n}×</option>)}</select></label>
    </div>
    <p className="mushaf-player-status" role={state.error ? "alert" : "status"}>{status}</p>
    <div className="mushaf-player-options">{verse && <button type="button" onClick={onFull}><Icon name="book" size={15}/>العودة إلى مشغل السورة</button>}<label><input type="checkbox" checked={sequence} onChange={e => onSequence(e.target.checked)}/>متابعة الآية التالية</label></div>
    <p className="mushaf-recording-note">{verseNote}</p>
    <audio ref={audioRef} preload="none" aria-label="التلاوة المختارة"/>
  </section>;
}
