import test from "node:test";
import assert from "node:assert/strict";
import { QuranAudioEngine, type AudioTrack } from "./audio-engine.ts";
class AudioFixture extends EventTarget {
  src = ""; currentSrc = ""; paused = true; ended = false; error: { code: number } | null = null;
  currentTime = 0; duration = 60; playbackRate = 1; loop = false;
  rejection: ((error: Error) => void) | null = null;
  play() { this.paused = false; return new Promise<void>((_, reject) => { this.rejection = reject; }); }
  pause() { this.paused = true; this.dispatchEvent(new Event("pause")); }
  load() { this.currentSrc = this.src; this.currentTime = 0; this.ended = false; this.error = null; }
  removeAttribute() { this.src = ""; }
  event(name: string) { this.dispatchEvent(new Event(name)); }
}
const chapter: AudioTrack = { url: "https://example.test/chapter.mp3", mode: "surah", surah: 1, reciter: "minshawi", title: "Protocol fixture", artist: "Fixture" };
const ayah: AudioTrack = { ...chapter, url: "https://example.test/001002.mp3", mode: "ayah", ayah: 2 };
function setup() { const engine = new QuranAudioEngine(), audio = new AudioFixture(); const detach = engine.attach(audio as unknown as HTMLAudioElement); return { engine, audio, detach }; }

test("one player is silent on selection; only an actual playing event illuminates a verse", () => {
  const { engine, audio, detach } = setup();
  try {
    engine.select(chapter); assert.equal(audio.paused, true); assert.equal(engine.getSnapshot().status, "idle");
    engine.toggle(ayah); assert.equal(engine.getSnapshot().status, "loading"); assert.equal(audio.src, ayah.url);
    audio.event("playing"); assert.equal(engine.getSnapshot().status, "playing");
    engine.toggle(ayah); assert.equal(audio.paused, true); assert.equal(engine.getSnapshot().status, "paused");
    audio.event("playing"); assert.equal(engine.getSnapshot().status, "paused");
    engine.toggle(ayah); audio.event("playing"); assert.equal(engine.getSnapshot().status, "playing");
  } finally { detach(); }
});
test("late rejection from an old track cannot fail or resurrect the new recording", async () => {
  const { engine, audio, detach } = setup();
  try {
    engine.play(chapter); const rejectOld = audio.rejection!;
    engine.play(ayah); audio.event("playing"); rejectOld(Error("aborted old media")); await Promise.resolve();
    assert.equal(engine.getSnapshot().track?.url, ayah.url); assert.equal(engine.getSnapshot().status, "playing");
    engine.pause(); audio.rejection!(Error("aborted current media")); await Promise.resolve();
    assert.equal(engine.getSnapshot().status, "paused"); assert.equal(engine.getSnapshot().error, "");
  } finally { detach(); }
});
test("buffering removes playing state; timeout stops playback and retry keeps the exact source", t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { engine, audio, detach } = setup();
  try {
    engine.play(ayah); audio.event("playing"); audio.event("waiting");
    assert.equal(engine.getSnapshot().status, "buffering");
    t.mock.timers.tick(15001); assert.equal(engine.getSnapshot().status, "error"); assert.equal(audio.paused, true);
    engine.toggle(); assert.equal(audio.src, ayah.url); audio.event("playing"); assert.equal(engine.getSnapshot().error, "");
  } finally { detach(); t.mock.timers.reset(); }
});
test("controls clamp seeking, validate speed, loop real media and clear on disposal", () => {
  const { engine, audio, detach } = setup();
  engine.select(chapter); audio.event("durationchange");
  engine.seek(99); assert.equal(audio.currentTime, 60); engine.seek(-3); assert.equal(audio.currentTime, 0);
  engine.setSpeed(1.25); engine.setSpeed(9); assert.equal(audio.playbackRate, 1.25);
  engine.setRepeat(true); assert.equal(audio.loop, true);
  engine.play(); audio.event("playing"); detach(); assert.equal(audio.paused, true); assert.equal(audio.src, "");
  audio.event("ended"); assert.equal(engine.getSnapshot().status, "playing", "detached events have no consumers");
});
test("ended callbacks require an actual ended track; errors clear the playing state without fallback", () => {
  const { engine, audio, detach } = setup(); const ended: AudioTrack[] = [];
  try {
    engine.onEnded = track => ended.push(track); engine.play(ayah); audio.event("playing");
    audio.event("ended"); assert.equal(ended.length, 0);
    audio.ended = true; audio.event("ended"); assert.deepEqual(ended, [ayah]); assert.equal(engine.getSnapshot().status, "ended");
    engine.play(); audio.error = { code: 4 }; audio.event("error");
    assert.equal(engine.getSnapshot().status, "error"); assert.equal(engine.getSnapshot().track?.reciter, "minshawi"); assert.equal(audio.paused, true);
  } finally { detach(); }
});
