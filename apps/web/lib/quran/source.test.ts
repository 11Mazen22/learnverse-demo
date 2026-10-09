import test from "node:test";
import assert from "node:assert/strict";
import { canonicalSurah, canonicalIndex, canonicalCorpus, recitationLink, isQuranReciter, audioEditionCandidates, normalizedQuranLookup, matchingSurahs } from "./source.ts";

test("whole-Quran corpus validates edition, independent counts and contiguous global IDs", () => {
  let global = 0;
  const metadata = Array.from({ length: 114 }, (_, i) => ({ number: i + 1, name: `CI CHAPTER ${i + 1}`, numberOfAyahs: i === 0 ? 21 : 55 }));
  const corpus = { edition: { identifier: "quran-uthmani" }, surahs: metadata.map(chapter => ({ number: chapter.number, ayahs: Array.from({ length: chapter.numberOfAyahs }, (_, i) => ({ number: ++global, numberInSurah: i + 1, text: `CI SYNTHETIC TEXT ${global}` })) })) };
  const rows = canonicalCorpus(corpus, metadata);
  assert.equal(rows.length, 6236);
  assert.equal(rows[0].text, corpus.surahs[0].ayahs[0].text);
  assert.throws(() => canonicalCorpus({ ...corpus, edition: { identifier: "another-edition" } }, metadata));
  assert.throws(() => canonicalCorpus(corpus, metadata.map((chapter, i) => i === 0 ? { ...chapter, numberOfAyahs: 22 } : chapter)));
  const broken = structuredClone(corpus); broken.surahs[1].ayahs[0].number = 1;
  assert.throws(() => canonicalCorpus(broken, metadata));
});
// Deliberately synthetic labels: protocol fixtures are not canonical text verification.
const fixture = {
  number: 1,
  numberOfAyahs: 2,
  ayahs: [
    { numberInSurah: 1, number: 1, text: "CI TEST VERSE ONE" },
    { numberInSurah: 2, number: 2, text: "CI TEST VERSE TWO" },
  ],
};
test("source normalization preserves text byte-for-byte and rejects duplicate, missing, or unordered verses", () => {
  assert.equal(canonicalSurah(fixture, 1)[0].text, fixture.ayahs[0].text);
  assert.throws(() => canonicalSurah(fixture, 2));
  assert.throws(() => canonicalSurah({ ...fixture, numberOfAyahs: 3 }, 1));
  assert.throws(() =>
    canonicalSurah(
      { ...fixture, ayahs: [fixture.ayahs[0], fixture.ayahs[0]] },
      1,
    ),
  );
  assert.throws(() =>
    canonicalSurah(
      { ...fixture, ayahs: [fixture.ayahs[1], fixture.ayahs[0]] },
      1,
    ),
  );
  assert.throws(() =>
    canonicalSurah(
      {
        ...fixture,
        ayahs: [fixture.ayahs[0], { ...fixture.ayahs[1], number: 4 }],
      },
      1,
    ),
  );
});
test("a Quran index must contain all 114 unique ordered chapters", () => {
  const index = Array.from({ length: 114 }, (_, i) => ({
    number: i + 1,
    name: `CI CHAPTER ${i + 1}`,
    numberOfAyahs: 2,
  }));
  assert.equal(canonicalIndex(index).length, 114);
  assert.throws(() => canonicalIndex(index.slice(0, 113)));
  assert.throws(() => canonicalIndex([...index.slice(0, 113), index[0]]));
});
test("recitation URLs are confined to HTTPS canonical-source hosts", () => {
  assert.equal(
    recitationLink(
      "https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3",
    ),
    "https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3",
  );
  for (const value of [
    "http://cdn.islamic.network/a.mp3",
    "https://evil.example/a.mp3",
    "https://cdn.islamic.network.evil.example/a.mp3",
    "https://user:password@cdn.islamic.network/a.mp3",
  ])
    assert.equal(recitationLink(value), null);
});

test("reciter catalog rejects unrecognized and arbitrary external identifiers",()=>{
 assert.equal(isQuranReciter("ar.alafasy"),true);
 assert.equal(isQuranReciter("ar.husary"),true);
 assert.equal(isQuranReciter("ar.minshawi"),true);
 assert.equal(isQuranReciter("ar.sudais"),true);
 assert.equal(isQuranReciter("https://evil.invalid/x.mp3"),false);
 assert.equal(isQuranReciter("ar.unchecked"),false);
});
test("Arabic search normalization is lookup-only and ranks exact Surah above partial",()=>{
 const ayah="سُورَةُ ٱلْكَهْف";
 assert.equal(normalizedQuranLookup(ayah),"الكهف");
 const index=[{number:18,name:ayah,englishName:"Al-Kahf",numberOfAyahs:110,revelationType:"Meccan"},{number:19,name:"سورة مريم",englishName:"Maryam",numberOfAyahs:98,revelationType:"Meccan"}];
 assert.equal(matchingSurahs(index,"الكهف")[0].number,18);
 assert.equal(matchingSurahs(index,"al kahf")[0].number,18);
});

test("Sudais resolves only authentic Sudais identifiers, without replacing the Sheikh",()=>{
  assert.deepEqual(audioEditionCandidates("ar.sudais"),[
    "ar.abdurrahmaansudais","ar.sudais"
  ]);
  for(const edition of ["ar.alafasy","ar.husary","ar.minshawi"] as const)
    assert.deepEqual(audioEditionCandidates(edition),[edition]);
  assert.equal(isQuranReciter("ar.abdurrahmaansudais"),false,
    "internal provider edition must not silently create a second visible reciter");
});
test("Sudais media links use exactly the provider CDN URL and require HTTPS",()=>{
  const url="https://cdn.islamic.network/quran/audio/128/ar.abdurrahmaansudais/1.mp3";
  assert.equal(recitationLink(url),url);
  assert.equal(recitationLink("http://cdn.islamic.network/quran/audio/192/ar.sudais/1.mp3"),null);
});
