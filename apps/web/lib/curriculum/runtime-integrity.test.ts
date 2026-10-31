import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const component = (path: string) =>
  readFile(new URL(`../../components/${path}`, import.meta.url), "utf8");

test("curriculum failures never become hardcoded published lessons or progress", async () => {
  const [learn, lesson, dashboard] = await Promise.all([
    component("learn/learn-live.tsx"),
    component("learn/lesson-live.tsx"),
    component("dashboard/dashboard-live.tsx"),
  ]);
  assert.doesNotMatch(learn, /CANONICAL_(?:UNITS|LESSONS)/);
  assert.match(learn, /publication_status: "pending_source"/);
  assert.match(learn, /no substitute lessons or assumed progress are shown/);
  assert.doesNotMatch(lesson, /getCanonicalLesson|setQuestionCount\(4\)|Accredited Unit/);
  assert.match(dashboard, /lessons: 0/);
  assert.match(dashboard, /nextLesson: null/);
  assert.doesNotMatch(dashboard, /noata_daily_targets_|4x more|4 أضعاف/);
});

test("curriculum content language is independent from interface locale", async () => {
  const files = await Promise.all([
    component("learn/learn-live.tsx"),
    component("learn/lesson-live.tsx"),
    component("missions/mission-live.tsx"),
    component("review/review-live.tsx"),
    component("boss/boss-live.tsx"),
  ]);
  for (const source of files) {
    assert.match(source, /contentLanguage|content_language/);
  }
  assert.doesNotMatch(files[0], /content_language === "en" \|\| locale === "en"/);
});

test("translated track questions remain usable without exposing retry variants as roots", async () => {
  const [mission, review, boss] = await Promise.all([
    component("missions/mission-live.tsx"),
    component("review/review-live.tsx"),
    component("boss/boss-live.tsx"),
  ]);
  for (const source of [mission, review, boss]) {
    assert.doesNotMatch(source, /\.is\("variant_of", null\)/);
    assert.match(source, /metadata\.translation_track === true/);
  }
});
