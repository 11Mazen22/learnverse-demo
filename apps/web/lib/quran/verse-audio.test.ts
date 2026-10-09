import test from "node:test";
import assert from "node:assert/strict";
import { AYAH_RECORDINGS, listedAyahs, verseDirectory, verseRecitation } from "./verse-audio.ts";
import { REQUESTED_RECITERS } from "./reciters.ts";
test("eight explicit verse identities; no implicit Alafasy, Hasan Saleh or chapter-to-ayah substitution", () => {
  for (const reciter of REQUESTED_RECITERS) {
    const available = { reciter: reciter.id, surah: 18, verses: [1, 10], label: null };
    const url = verseRecitation(reciter.id, 18, 10, available);
    if (reciter.id === "saleh") { assert.equal(url, null); assert.equal(verseDirectory(reciter.id), null); }
    else { assert.equal(url, `https://everyayah.com/data/${AYAH_RECORDINGS[reciter.id]!.folder}/018010.mp3`); }
    assert.equal(verseRecitation(reciter.id, 18, 11, available), null);
    assert.equal(verseRecitation(reciter.id, 18, 10), null);
    assert.equal(verseRecitation(reciter.id, 19, 10, available), null);
  }
});
test("directory parsing respects exact reciter/chapter, excludes basmala, malformed and missing files", () => {
  const html = '<a href="/data/Mustafa_Ismail_48kbps/018001.mp3">1</a><a href="/data/Mustafa_Ismail_48kbps/018002.mp3">2</a><a href="/data/Mustafa_Ismail_48kbps/018001.mp3">duplicate</a><a href="/data/Other/018010.mp3">foreign</a><a href="/data/Mustafa_Ismail_48kbps/018000.mp3">basmala</a><a href="/data/Mustafa_Ismail_48kbps/019010.mp3">next chapter</a><a href="/data/Mustafa_Ismail_48kbps/018010.mp3?redirect=1">query</a>';
  assert.deepEqual(listedAyahs(html, "mustafa", 18), [1, 2]);
  assert.equal(verseRecitation("mustafa", 18, 10, { reciter: "mustafa", surah: 18, verses: listedAyahs(html, "mustafa", 18), label: null }), null);
  assert.deepEqual(listedAyahs(html, "minshawi", 18), []);
});
test("verse URL identifiers must be integers within chapter/ayah bounds and owned by the selected reciter", () => {
  const available = { reciter: "minshawi" as const, surah: 1, verses: [1], label: null };
  for (const value of [0, -1, NaN, 1.5, 287]) assert.equal(verseRecitation("minshawi", 1, value, available), null);
  assert.equal(verseRecitation("husary", 1, 1, available), null);
});
