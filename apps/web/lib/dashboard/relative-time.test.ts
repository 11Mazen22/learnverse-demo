import test from "node:test";
import assert from "node:assert/strict";
import {
  absoluteTimeLabel,
  localizedTimestamp,
  relativeTimeLabel,
} from "./relative-time.ts";

// Fixed reference instant keeps every assertion deterministic.
const NOW = new Date("2026-11-05T12:00:00Z");

test("arabic relative labels obey number agreement and digits", () => {
  assert.equal(relativeTimeLabel("2026-11-05T11:55:00Z", "ar", NOW), "منذ ٥ دقائق");
  assert.equal(relativeTimeLabel("2026-11-05T11:59:15Z", "ar", NOW), "منذ دقيقة");
  assert.equal(relativeTimeLabel("2026-11-05T11:58:30Z", "ar", NOW), "منذ دقيقتين");
  assert.equal(relativeTimeLabel("2026-11-05T10:00:00Z", "ar", NOW), "منذ ساعتين");
  assert.equal(relativeTimeLabel("2026-11-03T12:00:00Z", "ar", NOW), "منذ يومين");
  assert.equal(relativeTimeLabel("2026-11-01T12:00:00Z", "ar", NOW), "منذ ٤ أيام");
});

test("future timestamps phrase ahead-of-time, not past", () => {
  assert.equal(relativeTimeLabel("2026-11-05T15:00:00Z", "ar", NOW), "في ٣ ساعات");
  assert.equal(relativeTimeLabel("2026-11-07T12:00:00Z", "en", NOW), "in 2 days");
  assert.equal(relativeTimeLabel("2026-11-05T11:59:00Z", "en", NOW), "1 minute ago");
  assert.equal(relativeTimeLabel("2026-11-05T11:58:00Z", "en", NOW), "2 minutes ago");
});

test("english labels pluralize and bound to a week", () => {
  assert.equal(relativeTimeLabel("2026-11-05T11:59:50Z", "en", NOW), "just now");
  assert.equal(relativeTimeLabel("2026-11-05T09:00:00Z", "en", NOW), "3 hours ago");
  assert.equal(relativeTimeLabel("2026-10-30T12:00:00Z", "en", NOW), "6 days ago");
  // Beyond a week the caller decides (absolute date); relative returns null.
  assert.equal(relativeTimeLabel("2026-10-20T12:00:00Z", "en", NOW), null);
});

test("unparseable or very old values fall back without throwing", () => {
  assert.equal(relativeTimeLabel("not-a-date", "ar", NOW), null);
  assert.equal(localizedTimestamp("not-a-date", "en", NOW), "not-a-date");
  const fallback = localizedTimestamp("2025-01-02T03:04:05Z", "ar", NOW);
  assert.equal(typeof fallback, "string");
  assert.ok(!fallback.includes("منذ"));
  const exported = absoluteTimeLabel("2026-11-05T11:55:00Z", "en");
  // en-US presentation; hour digits vary with the runner's timezone.
  assert.match(exported, /\d{1,2}\/\d{1,2}\/2026/);
});
