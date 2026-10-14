import test from "node:test";
import assert from "node:assert/strict";
import { REQUESTED_RECITERS, reciterCatalogue, safeRecitationServer, chapterRecitation, mediaTime, normalizeQuranQuery } from "./reciters.ts";
const fixture = { reciters: REQUESTED_RECITERS.map(r => ({ id: r.providerId, moshaf: [{ rewaya_id: 1, moshaf_type: 11, server: `https://cdn.mp3quran.net/audio/test-${r.id}/r1/`, surah_list: "1,2,114" }] })) };
test("all nine requested identities use the provider's Hafs murattal recording, never a different riwaya", () => {
  const catalogue = reciterCatalogue(fixture);
  assert.equal(catalogue.length, 9);
  assert.equal(new Set(catalogue.map(r => r.id)).size, 9);
  for (const r of catalogue) {
    assert.ok(r.server);
    assert.equal(chapterRecitation(r, 1), `${r.server}001.mp3`);
    assert.equal(chapterRecitation(r, 114), `${r.server}114.mp3`);
    assert.equal(chapterRecitation(r, 3), null);
  }
  const different = structuredClone(fixture); different.reciters[0].moshaf[0].rewaya_id = 2;
  assert.equal(reciterCatalogue(different)[0].server, null);
});
test("missing recordings stay unavailable instead of falling back to another reciter", () => {
  const catalogue = reciterCatalogue({ reciters: [] });
  assert.equal(catalogue.length, 9);
  assert.ok(catalogue.every(r => r.server === null && r.surahs.length === 0));
  assert.equal(chapterRecitation(undefined, 1), null);
  assert.throws(() => reciterCatalogue({}));
});
test("catalogue media is confined to secure MP3Quran servers and chapter availability", () => {
  for (const url of ["http://cdn.mp3quran.net/audio/", "https://mp3quran.net.evil.test/audio/", "https://cdn.mp3quran.net:8080/audio/", "https://user:pass@cdn.mp3quran.net/audio/", "https://evil.test/audio/", "https://cdn.mp3quran.net/audio/?redirect=x", "https://cdn.mp3quran.net/audio/#x"]) assert.equal(safeRecitationServer(url), null);
  assert.equal(safeRecitationServer("https://server10.mp3quran.net/test/"), "https://server10.mp3quran.net/test/");
  for (const list of ["1,1", "0,1", "1,115", "1,nope", ""]) {
    const invalid = structuredClone(fixture); invalid.reciters[0].moshaf[0].surah_list = list;
    assert.equal(reciterCatalogue(invalid)[0].server, null);
  }
  for (const number of [0, 115, 1.1, NaN]) assert.equal(chapterRecitation(reciterCatalogue(fixture)[0], number), null);
});
test("Surah filters accept unvowelled Arabic, alif wasla and Arabic or Persian digits without altering source text", () => {
  assert.equal(normalizeQuranQuery("ٱلْفَاتِحَةِ"), normalizeQuranQuery("الفاتحة"));
  assert.equal(normalizeQuranQuery("١١٤"), "114");
  assert.equal(normalizeQuranQuery("۱۱۴"), "114");
  assert.equal(normalizeQuranQuery("Al-Faatiha"), "al-faatiha");
});
test("player timestamps safely handle unknown duration and long surahs", () => {
  assert.equal(mediaTime(NaN), "0:00"); assert.equal(mediaTime(Infinity), "0:00");
  assert.equal(mediaTime(-2), "0:00"); assert.equal(mediaTime(65.8), "1:05"); assert.equal(mediaTime(7230), "120:30");
});
