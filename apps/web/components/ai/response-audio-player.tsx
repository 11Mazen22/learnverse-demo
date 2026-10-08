"use client";
import {useEffect,useRef,useState,type RefObject} from "react";
import {Icon} from "@/components/ui/icon";
const time=(n:number)=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,"0")}`;
export function ResponseAudioPlayer({url,audioRef,onClose,onError}:{url:string;audioRef:RefObject<HTMLAudioElement|null>;onClose:()=>void;onError:()=>void}){
 const element=useRef<HTMLAudioElement|null>(null);
 const [playing,setPlaying]=useState(false),[duration,setDuration]=useState(0),[position,setPosition]=useState(0),[rate,setRate]=useState(1);
 useEffect(()=>{
  const audio=element.current;audioRef.current=audio;
  return()=>{audio?.pause();audio?.removeAttribute("src");audio?.load();if(audioRef.current===audio)audioRef.current=null;};
 },[audioRef,url]);
 async function toggle(){try{const audio=element.current;if(!audio)return;if(audio.paused)await audio.play();else audio.pause();}catch{onError();}}
 return <div className="aura-response-player" role="group" aria-label="استمع إلى رد Noata">
  <div className="aura-player-heading"><Icon name="volume" size={18}/><strong>ردّك، بصوت Noata</strong><button type="button" onClick={onClose} aria-label="إيقاف وإغلاق الرد الصوتي"><Icon name="close" size={17}/></button></div>
  <div className="aura-player-timeline"><button type="button" onClick={()=>void toggle()} aria-label={playing?"إيقاف الصوت مؤقتًا":"تشغيل الرد الصوتي"} className="aura-player-play"><Icon name={playing?"pause":"play"} size={19}/></button><div><input type="range" min={0} max={duration||0} step={0.1} value={position} dir="ltr" aria-label="موضع تشغيل الرد" disabled={!duration} onChange={e=>{const next=Number(e.target.value);if(element.current)element.current.currentTime=next;setPosition(next);}}/><div className="aura-player-time" dir="ltr"><span>{time(position)}</span><span>{time(duration)}</span></div></div><label><span className="sr-only">سرعة التشغيل</span><select value={rate} aria-label="سرعة تشغيل الرد الصوتي" onChange={e=>{const next=Number(e.target.value);setRate(next);if(element.current)element.current.playbackRate=next;}}>{[.75,1,1.25,1.5,2].map(n=><option key={n} value={n}>{n}×</option>)}</select></label></div>
  <audio ref={element} src={url} preload="metadata" onLoadedMetadata={()=>setDuration(Number.isFinite(element.current?.duration)?element.current!.duration:0)} onTimeUpdate={()=>setPosition(element.current?.currentTime??0)} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)} onError={onError}/>
 </div>;
}
