export type AudioTrack = { url: string | null; mode: "surah" | "ayah"; surah: number; ayah?: number; reciter: string; title: string; artist: string };
export type PlaybackStatus = "idle" | "loading" | "playing" | "paused" | "buffering" | "ended" | "error";
export type PlaybackState = { track: AudioTrack | null; status: PlaybackStatus; elapsed: number; duration: number; speed: number; repeat: boolean; error: string };
type AudioPort = Pick<HTMLAudioElement, "src" | "currentSrc" | "paused" | "ended" | "error" | "currentTime" | "duration" | "playbackRate" | "loop" | "play" | "pause" | "load" | "removeAttribute" | "addEventListener" | "removeEventListener">;
const INITIAL: PlaybackState = { track: null, status: "idle", elapsed: 0, duration: 0, speed: 1, repeat: false, error: "" };

export class QuranAudioEngine {
  private element: AudioPort | null = null;
  private state: PlaybackState = INITIAL;
  private listeners = new Set<() => void>();
  private cleanups: (() => void)[] = [];
  private request = 0;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  onEnded?: (track: AudioTrack) => void;
  getSnapshot = () => this.state;
  getServerSnapshot = () => INITIAL;
  subscribe = (callback: () => void) => { this.listeners.add(callback); return () => { this.listeners.delete(callback); }; };
  private update(patch: Partial<PlaybackState>) { this.state = { ...this.state, ...patch }; this.listeners.forEach(callback => callback()); }
  private clearTimer() { if (this.timeout) clearTimeout(this.timeout); this.timeout = null; }
  private fail(message: string) { ++this.request; this.clearTimer(); this.element?.pause(); this.update({ status: "error", error: message }); }
  private watch() {
    this.clearTimer();
    const request = this.request;
    this.timeout = setTimeout(() => {
      if (request === this.request) this.fail("استغرق تحميل التلاوة وقتًا طويلًا. اضغط التشغيل للمحاولة مجددًا.");
    }, 15000);
  }
  attach(element: AudioPort) {
    this.element = element;
    const listen = (name: string, handler: () => void) => {
      element.addEventListener(name, handler);
      this.cleanups.push(() => element.removeEventListener(name, handler));
    };
    const current = () => !!this.state.track?.url && element.currentSrc === this.state.track.url;
    listen("playing", () => { if (current() && !element.paused) { this.clearTimer(); this.update({ status: "playing", error: "" }); } });
    listen("pause", () => {
      if (element.paused && ["playing", "buffering"].includes(this.state.status)) { this.clearTimer(); this.update({ status: "paused" }); }
    });
    for (const event of ["waiting", "stalled"]) listen(event, () => {
      if (current() && !element.paused && ["playing", "loading", "buffering"].includes(this.state.status)) { this.update({ status: "buffering" }); this.watch(); }
    });
    listen("timeupdate", () => { if (current()) this.update({ elapsed: Number.isFinite(element.currentTime) ? element.currentTime : 0 }); });
    listen("durationchange", () => { if (current()) this.update({ duration: Number.isFinite(element.duration) ? Math.max(0, element.duration) : 0 }); });
    listen("error", () => { if (current() && element.error) this.fail("ملف التلاوة غير متاح أو تعذّر فك صوته. أعد المحاولة؛ لن نستبدل القارئ أو الآية."); });
    listen("ended", () => {
      if (!current() || !element.ended || !this.state.track) return;
      this.clearTimer(); this.update({ status: "ended" }); this.onEnded?.(this.state.track);
    });
    if (this.state.track) this.select(this.state.track);
    return () => {
      ++this.request; this.clearTimer(); this.cleanups.splice(0).forEach(fn => fn());
      element.pause(); element.removeAttribute("src"); element.load(); this.element = null;
    };
  }
  select(track: AudioTrack) {
    ++this.request; this.clearTimer();
    const element = this.element;
    element?.pause();
    this.update({ track, status: "idle", elapsed: 0, duration: 0, error: "" });
    if (element) {
      if (track.url) element.src = track.url; else element.removeAttribute("src");
      element.playbackRate = this.state.speed; element.loop = this.state.repeat; element.load();
    }
  }
  play(track?: AudioTrack) {
    if (track && (track.url !== this.state.track?.url || track.mode !== this.state.track?.mode)) this.select(track);
    const element = this.element;
    if (!element || !this.state.track?.url) return;
    if (element.error) element.load();
    if (element.ended) element.currentTime = 0;
    const request = ++this.request;
    this.update({ status: "loading", error: "" }); this.watch();
    element.playbackRate = this.state.speed;
    void element.play().catch(() => {
      if (request === this.request) this.fail("تعذّر بدء الصوت. اضغط التشغيل للمحاولة مجددًا أو تحقّق من الاتصال.");
    });
  }
  toggle(track?: AudioTrack) {
    if (track && (track.url !== this.state.track?.url || track.mode !== this.state.track?.mode)) { this.play(track); return; }
    if (["playing", "loading", "buffering"].includes(this.state.status)) this.pause(); else this.play(track);
  }
  pause = () => { ++this.request; this.clearTimer(); this.element?.pause(); this.update({ status: "paused" }); };
  stop = () => { this.pause(); if (this.element) this.element.currentTime = 0; this.update({ status: "idle", elapsed: 0 }); };
  seek = (value: number) => {
    if (!this.element || !Number.isFinite(value) || !this.state.duration) return;
    const elapsed = Math.max(0, Math.min(value, this.state.duration)); this.element.currentTime = elapsed; this.update({ elapsed });
  };
  setSpeed = (speed: number) => {
    if (![0.75, 1, 1.25, 1.5].includes(speed)) return;
    if (this.element) this.element.playbackRate = speed; this.update({ speed });
  };
  setRepeat = (repeat: boolean) => { if (this.element) this.element.loop = repeat; this.update({ repeat }); };
}
