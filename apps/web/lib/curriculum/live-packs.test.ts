import assert from "node:assert/strict";
import test from "node:test";
import {
  ALL_LESSON_STUDY_PACKS,
  getLessonStudyPack,
  getTrackLessonStudyPacks,
} from "./sec1-all-lessons-pack.ts";
import { PACK_INDEX, PACK_TRACK_COUNTS } from "./packs/index-map.ts";
import {
  indexEntriesForTrack,
  lessonIndexEntry,
  lessonPack,
  loadAllPacks,
  trackPackCount,
  trackPacks,
} from "./live-packs.ts";

test("the shipped index covers every pack exactly once", () => {
  assert.equal(PACK_INDEX.length, ALL_LESSON_STUDY_PACKS.length);
  const indexed = new Set(PACK_INDEX.map((row) => `${row.lessonSlug}::${row.contentLanguage}`));
  assert.equal(indexed.size, PACK_INDEX.length, "index has duplicate lesson/language pairs");
  for (const pack of ALL_LESSON_STUDY_PACKS) {
    assert.ok(
      indexed.has(`${pack.lessonSlug}::${pack.contentLanguage}`),
      `pack ${pack.id} is missing from the index`,
    );
  }
});

test("lazy per-track loading returns exactly what the eager module returns", async () => {
  await loadAllPacks();
  const tracks = new Set(ALL_LESSON_STUDY_PACKS.map((pack) => pack.trackSlug));
  for (const trackSlug of tracks) {
    assert.deepEqual(
      trackPacks(trackSlug).map((pack) => pack.id),
      getTrackLessonStudyPacks(trackSlug).map((pack) => pack.id),
      `track ${trackSlug} diverged between lazy and eager selection`,
    );
  }
});

test("lazy lesson lookup matches eager lookup for every indexed lesson", async () => {
  await loadAllPacks();
  for (const entry of PACK_INDEX) {
    assert.equal(
      lessonPack(entry.lessonSlug, entry.contentLanguage)?.id,
      getLessonStudyPack(entry.lessonSlug, entry.contentLanguage)?.id,
    );
  }
});

test("track counts and index lookups need no pack chunk", () => {
  for (const [trackSlug, count] of Object.entries(PACK_TRACK_COUNTS)) {
    assert.equal(trackPackCount(trackSlug), count);
    assert.equal(indexEntriesForTrack(trackSlug).length, count);
  }
  const first = PACK_INDEX[0];
  assert.equal(lessonIndexEntry(first.lessonSlug)?.trackSlug, first.trackSlug);
  assert.equal(trackPackCount("not-a-track"), 0);
});
