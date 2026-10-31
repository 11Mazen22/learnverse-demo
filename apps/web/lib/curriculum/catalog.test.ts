import test from "node:test";
import assert from "node:assert/strict";
import {
  SUBJECT_CATALOG,
  TRACK_CATALOG,
  contentLanguageLabel,
  defaultTrackForSubject,
  subjectDefinition,
  trackDefinition,
  tracksForSubject,
} from "./catalog.ts";

test("the catalog exposes exactly the six core subject families", () => {
  assert.equal(SUBJECT_CATALOG.length, 6);
  assert.deepEqual(
    SUBJECT_CATALOG.map((subject) => subject.key).sort(),
    [
      "arabic-language",
      "english",
      "history",
      "integrated-science",
      "mathematics",
      "philosophy-logic",
    ],
  );
});

test("Integrated Science and Mathematics each expose an Arabic and an English track", () => {
  for (const key of ["integrated-science", "mathematics"]) {
    const tracks = tracksForSubject(key);
    assert.equal(tracks.length, 2, `${key} must expose exactly two tracks`);
    assert.deepEqual(
      tracks.map((track) => track.contentLanguage).sort(),
      ["ar", "en"],
      `${key} must expose one Arabic and one English track`,
    );
    assert.equal(new Set(tracks.map((track) => track.slug)).size, 2);
  }
});

test("History, Arabic Language, English and Philosophy & Logic stay single subjects", () => {
  for (const key of ["history", "arabic-language", "english", "philosophy-logic"]) {
    const tracks = tracksForSubject(key);
    assert.equal(tracks.length, 1, `${key} must not be duplicated into language tracks`);
    const subject = subjectDefinition(key);
    assert.ok(subject);
    assert.equal(subject.dualLanguage, false);
    assert.equal(tracks[0].contentLanguage, subject.contentLanguage);
  }
});

test("eight tracks exist in total and every slug is unique and mapped to one subject", () => {
  assert.equal(TRACK_CATALOG.length, 8);
  const slugs = TRACK_CATALOG.map((track) => track.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const track of TRACK_CATALOG) {
    assert.ok(subjectDefinition(track.subject), `${track.slug} needs a subject`);
    assert.equal(trackDefinition(track.slug), track);
  }
});

test("track slugs never cross subjects and always name their content language", () => {
  for (const track of TRACK_CATALOG) {
    assert.ok(
      track.slug.endsWith(track.contentLanguage === "ar" ? "-ar" : "-en"),
      `${track.slug} must end with its content language`,
    );
    assert.ok(track.slug.startsWith(track.subject), `${track.slug} must be namespaced by subject`);
  }
});

test("the default track of a dual-language subject is the interface-neutral one", () => {
  assert.equal(defaultTrackForSubject("integrated-science")?.slug, "integrated-science-ar");
  assert.equal(defaultTrackForSubject("mathematics")?.slug, "mathematics-ar");
  assert.equal(defaultTrackForSubject("english")?.slug, "english-en");
  assert.equal(defaultTrackForSubject("history")?.slug, "history-ar");
  assert.equal(defaultTrackForSubject("unknown-subject"), null);
});

test("content language labels read naturally in both interface languages", () => {
  assert.equal(contentLanguageLabel("ar", "ar"), "بالعربية");
  assert.equal(contentLanguageLabel("en", "ar"), "بالإنجليزية");
  assert.equal(contentLanguageLabel("ar", "en"), "Arabic");
  assert.equal(contentLanguageLabel("en", "en"), "English");
});
