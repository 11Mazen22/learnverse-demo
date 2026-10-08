import test from "node:test";
import assert from "node:assert/strict";
import { canonicalSurah, canonicalIndex, recitationLink } from "./source.ts";
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
