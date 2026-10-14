import test from "node:test";
import assert from "node:assert/strict";
import {
  createSessionGuard,
  createDraftCache,
  clearSessionWork,
  writingDrafts,
} from "./session-work.ts";

test("logout and account switching reject all earlier asynchronous results", () => {
  const scope = createSessionGuard();
  scope.reset("student-a");
  const pending = scope.capture();
  scope.reset(null);
  assert.equal(scope.isCurrent(pending), false);
  const signedOut = scope.capture();
  scope.reset("teacher-b");
  assert.equal(scope.isCurrent(signedOut), false);
  assert.equal(scope.owner(), "teacher-b");
  assert.equal(scope.isCurrent(scope.capture()), true);
});

test("drafts preserve independent work, enforce byte limits, and expire", () => {
  let clock = 0;
  const cache = createDraftCache<string>(
    (s) => s.length,
    10,
    2,
    () => clock,
  );
  assert.equal(cache.set("a", "one"), true);
  cache.set("b", "two");
  assert.equal(cache.get("a"), "one");
  assert.equal(cache.set("too-large", "12345678901"), false);
  assert.equal(cache.get("a"), "one");
  cache.set("c", "three");
  assert.equal(cache.get("a"), undefined);
  assert.equal(cache.get("b"), "two");
  clock = 30 * 60 * 1000;
  assert.equal(cache.get("c"), undefined);
});

test("clearing the session erases private writing drafts", () => {
  writingDrafts.set("private", {
    text: "private response",
    title: "draft",
    source: "source",
  });
  clearSessionWork();
  assert.equal(writingDrafts.get("private"), undefined);
});
