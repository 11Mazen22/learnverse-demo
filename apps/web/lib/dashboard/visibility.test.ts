import { test } from "node:test";
import assert from "node:assert/strict";
import { dashboardRecommendation, dashboardVisibility } from "./visibility.ts";

const snapshot = {
  ownerId: "student-a", revision: 4, catalogReady: true, profileReady: true,
  evidenceReady: true, progressReady: true, notificationsReady: true,
};
const account = { userId: "student-a", revision: 4, loading: false, error: "" };
const lesson = { id: "lesson-a", title_ar: "درس الحساب الأول" };
const privateKeys = ["profile", "evidence", "progress", "notifications"] as const;

test("a confirmed snapshot exposes only its verified account's indicators", () => {
  const view = dashboardVisibility(snapshot, account, false);
  for (const key of privateKeys) assert.equal(view[key], true);
  assert.equal(view.catalog, true);
  assert.equal(view.waiting, false);
});

test("switching accounts hides old receipts before a replacement query finishes", () => {
  const view = dashboardVisibility(snapshot, { ...account, userId: "student-b" }, false);
  for (const key of privateKeys) assert.equal(view[key], false);
  assert.equal(view.catalog, false);
  assert.equal(dashboardRecommendation(view, 12, lesson).href, "/learn");
});

test("same-account revalidation cannot revive a snapshot from an earlier auth revision", () => {
  const view = dashboardVisibility(snapshot, { ...account, revision: 5 }, false);
  for (const key of privateKeys) assert.equal(view[key], false);
  assert.equal(view.current, false);
});

test("guest, failed auth and both loading states never expose personal statistics", () => {
  for (const [identity, loading] of [
    [{ ...account, userId: null }, false],
    [{ ...account, error: "Account verification failed" }, false],
    [{ ...account, loading: true }, false],
    [account, true],
  ] as const) {
    const view = dashboardVisibility(snapshot, identity, loading);
    for (const key of privateKeys) assert.equal(view[key], false);
    assert.equal(dashboardRecommendation(view, 2, lesson).href, "/learn");
  }
  assert.equal(dashboardVisibility(snapshot, { ...account, error: "Failed" }, true).waiting, false);
});

test("an absent profile is unknown, not a fabricated zero wallet or level one", () => {
  const view = dashboardVisibility({ ...snapshot, profileReady: false }, account, false);
  assert.equal(view.profile, false);
  assert.equal(view.evidence, true);
  assert.equal(view.progress, true);
});

test("notification failure does not suppress confirmed learning and balance evidence", () => {
  const view = dashboardVisibility({ ...snapshot, notificationsReady: false }, account, false);
  assert.equal(view.notifications, false);
  assert.equal(view.profile, true);
  assert.equal(view.evidence, true);
  assert.equal(view.progress, true);
});

test("unknown progress cannot advertise the first lesson as a resume point", () => {
  const view = dashboardVisibility({ ...snapshot, progressReady: false }, account, false);
  assert.equal(dashboardRecommendation(view, 0, lesson).href, "/learn");
  assert.equal(dashboardRecommendation(view, 2, lesson).href, "/review");
  const noEvidence = dashboardVisibility({ ...snapshot, evidenceReady: false }, account, false);
  assert.equal(dashboardRecommendation(noEvidence, 2, lesson).href, "/lesson/lesson-a");
});

test("a confirmed empty review queue permits a known next lesson, never an invented challenge", () => {
  const view = dashboardVisibility(snapshot, account, false);
  assert.equal(dashboardRecommendation(view, 0, lesson).href, "/lesson/lesson-a");
  assert.equal(dashboardRecommendation(view, 0, null).href, "/learn");
  assert.equal(dashboardRecommendation(view, 1, { ...lesson, id: "../private?token=value" }).href, "/review");
  assert.equal(dashboardRecommendation(view, 0, { ...lesson, id: "../private?token=value" }).href, "/lesson/..%2Fprivate%3Ftoken%3Dvalue");
});

test("English recommendations use the localized lesson title and action", () => {
  const view = dashboardVisibility(snapshot, account, false);
  const result = dashboardRecommendation(view, 0, { ...lesson, title_en: "First math lesson" }, "en");
  assert.match(result.description, /First math lesson/);
  assert.equal(result.action, "Open lesson");
});
