"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import type { RefObject } from "react";
import { Icon } from "@/components/ui/icon";
import { mediaTime, type Chapter } from "@/lib/quran/reciters";
import type { PlaybackState, QuranAudioEngine } from "@/lib/quran/audio-engine";

export function RecitationPlayer({ chapter, reciterName, unavailable, onChapter, onFull, onVerse, canPrevious, canNext, sequence, onSequence, audioRef, engine, state, verseProvider, verseNote }: {
  chapter: Chapter; reciterName: string; unavailable: string; onChapter: (number: number) => void; onFull: () => void; onVerse: (number: number) => void;
  canPrevious: boolean; canNext: boolean; sequence: boolean; onSequence: (enabled: boolean) => void; audioRef: RefObject<HTMLAudioElement | null>;
  engine: QuranAudioEngine; state: PlaybackState; verseProvider: string; verseNote: string;
}) {
 const t=useTranslation(),locale=useLocale();
  const verse = state.track?.mode === "ayah" ? state.track.ayah : undefined;
  const busy = state.status === "loading" || state.status === "buffering";
  const playing = state.status === "playing";
  const available = !!state.track?.url;
  const status = (state.error ? t(state.error,/وقتًا/.test(state.error)?"Audio loading took too long. Press Play to retry.":"Could not play this recording. Retry or check your connection. Your reciter has not been changed.") : "") || (!available ? unavailable : state.status === "buffering" ? t("جارٍ تخزين الصوت مؤقتًا…","Buffering audio…") : busy ? t("جارٍ بدء التلاوة…","Starting playback…") : playing ? t("تُشغّل الآن · إضاءة الآية تتبع الصوت الفعلي","Playing · Verse highlighting follows the audio") : state.status === "ended" ? t("انتهت التلاوة","Playback finished") : state.status === "paused" ? t("التلاوة متوقفة مؤقتًا · تابع من الموضع نفسه","Paused · Resume from the same place") : t("اختر التشغيل للاستماع · لا يبدأ الصوت تلقائيًا","Press Play to listen"));
  return <section className="mushaf-player" aria-label={t("مشغل التلاوة","Recitation player")} data-mode={verse ? "ayah" : "surah"} data-status={state.status}>
    <div className="mushaf-player-heading"><span className="mushaf-audio-emblem" aria-hidden="true"><Icon name="volume" size={27}/></span><div><span className="mushaf-player-eyebrow">{verse ? `${t("آية بآية · الآية","Verse by verse · Verse")} ${verse.toLocaleString(locale==="en"?"en":"ar-EG")}` : t("تلاوة السورة كاملة","Full surah recitation")}</span><strong>{locale==="en"?chapter.englishName:chapter.name}</strong><span>{reciterName}</span></div><span className="mushaf-player-tag">{verse ? verseProvider : "MP3Quran"}</span></div>
    <div className="mushaf-player-timeline"><input aria-label={t("موضع التلاوة","Playback position")} aria-valuetext={`${mediaTime(state.elapsed)} ${t("من","of")} ${mediaTime(state.duration)}`} type="range" min={0} max={state.duration || 1} step={0.1} value={Math.min(state.elapsed, state.duration || 1)} disabled={!state.duration || !available} dir="ltr" onChange={e => engine.seek(Number(e.target.value))}/><div dir="ltr"><time>{mediaTime(state.elapsed)}</time><time>{state.duration ? mediaTime(state.duration) : "—:—"}</time></div></div>
    <div className="mushaf-player-controls">
      <button type="button" aria-label={verse ? t("تكرار الآية","Repeat verse") : t("تكرار السورة","Repeat surah")} aria-pressed={state.repeat} onClick={() => engine.setRepeat(!state.repeat)}><Icon name="review" size={19}/></button>
      <button type="button" aria-label={verse ? t("الآية السابقة في المشغل","Previous verse") : t("السورة السابقة في المشغل","Previous surah")} disabled={verse ? !canPrevious : chapter.number <= 1} onClick={() => verse ? onVerse(verse - 1) : onChapter(chapter.number - 1)}><Icon name="arrow" size={19} style={{ transform: "rotate(180deg)" }}/></button>
      <button type="button" className="mushaf-player-play" disabled={!available} aria-label={busy ? t("إلغاء تحميل التلاوة","Cancel loading") : playing ? t("إيقاف التلاوة مؤقتًا","Pause recitation") : verse ? t("تشغيل تلاوة الآية","Play verse") : t("تشغيل تلاوة السورة","Play surah")} onClick={() => engine.toggle()}><Icon name={busy ? "stop" : playing ? "pause" : "play"} size={25}/></button>
      <button type="button" aria-label={verse ? t("الآية التالية في المشغل","Next verse") : t("السورة التالية في المشغل","Next surah")} disabled={verse ? !canNext : chapter.number >= 114} onClick={() => verse ? onVerse(verse + 1) : onChapter(chapter.number + 1)}><Icon name="arrow" size={19}/></button>
      <label><span className="sr-only">{t("سرعة التلاوة","Playback speed")}</span><select aria-label={t("سرعة التلاوة","Playback speed")} value={state.speed} onChange={e => engine.setSpeed(Number(e.target.value))}>{[0.75, 1, 1.25, 1.5].map(n => <option value={n} key={n}>{n}×</option>)}</select></label>
    </div>
    <p className="mushaf-player-status" role={state.error ? "alert" : "status"}>{status}</p>
    <div className="mushaf-player-options">{verse && <button type="button" onClick={onFull}><Icon name="book" size={15}/>{t("العودة إلى مشغل السورة","Return to surah player")}</button>}<label><input type="checkbox" checked={sequence} onChange={e => onSequence(e.target.checked)}/>{t("متابعة الآية التالية","Continue to next verse")}</label></div>
    <p className="mushaf-recording-note">{verseNote}</p>
    <audio ref={audioRef} preload="none" aria-label={t("التلاوة المختارة","Selected recitation")}/>
  </section>;
}
