import test from "node:test";
import assert from "node:assert/strict";
import { createVoiceGenerationGuard } from "./voice-generation.ts";

test("voice results from a previous conversation are rejected", () => {
  const guard = createVoiceGenerationGuard();
  const chatA = guard.begin();
  guard.invalidate(); // user switches to another conversation
  const chatB = guard.begin();
  assert.equal(guard.isCurrent(chatA), false);
  assert.equal(guard.isCurrent(chatB), true);
});

test("closing playback and unmounting invalidate an in-flight generation", () => {
  const guard = createVoiceGenerationGuard();
  const pending = guard.begin();
  guard.invalidate(); // stop/close
  assert.equal(guard.isCurrent(pending), false);
  const later = guard.begin();
  guard.invalidate(); // unmount
  assert.equal(guard.isCurrent(later), false);
});

test("a newer voice request supersedes the previous one", () => {
  const guard = createVoiceGenerationGuard();
  const oldRequest = guard.begin();
  const newerRequest = guard.begin();
  assert.equal(guard.isCurrent(oldRequest), false);
  assert.equal(guard.isCurrent(newerRequest), true);
});
