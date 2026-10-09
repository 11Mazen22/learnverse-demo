"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { QuranAudioEngine } from "@/lib/quran/audio-engine";

export function useQuranAudio() {
  const [engine] = useState(() => new QuranAudioEngine());
  const audioRef = useRef<HTMLAudioElement>(null);
  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getServerSnapshot);
  useEffect(() => { if (audioRef.current) return engine.attach(audioRef.current); }, [engine]);
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => engine.play()], ["pause", () => engine.pause()], ["stop", () => engine.stop()],
      ["seekto", details => { if (details.seekTime !== undefined) engine.seek(details.seekTime); }],
      ["seekbackward", details => engine.seek(engine.getSnapshot().elapsed - (details.seekOffset ?? 10))],
      ["seekforward", details => engine.seek(engine.getSnapshot().elapsed + (details.seekOffset ?? 10))],
    ];
    for (const [action, handler] of handlers) { try { session.setActionHandler(action, handler); } catch { /* Browser support differs per media action. */ } }
    return () => {
      for (const [action] of handlers) { try { session.setActionHandler(action, null); } catch { /* Unsupported action. */ } }
      session.metadata = null; session.playbackState = "none";
    };
  }, [engine]);
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    if (state.track && "MediaMetadata" in window) session.metadata = new MediaMetadata({ title: state.track.title, artist: state.track.artist, album: state.track.mode === "ayah" ? "EveryAyah" : "MP3Quran" });
    session.playbackState = state.status === "playing" ? "playing" : state.status === "paused" ? "paused" : "none";
    if (session.setPositionState && state.duration > 0) { try { session.setPositionState({ duration: state.duration, playbackRate: state.speed, position: Math.min(state.elapsed, state.duration) }); } catch { /* Live streams may not expose a seekable duration. */ } }
  }, [state]);
  return { engine, state, audioRef };
}
