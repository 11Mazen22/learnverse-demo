import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AttemptIdempotencyController,
  extractDistractorFeedback,
} from "./attempt-guard.ts";

describe("Stage 06 Curriculum Attempt Idempotency & Distractor Feedback", () => {
  it("prevents simultaneous double-clicks synchronously via runExclusive", async () => {
    const guard = new AttemptIdempotencyController();
    let rpcCount = 0;

    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const p1 = guard.runExclusive(async () => {
      rpcCount++;
      await gate;
      return "ok";
    });
    const p2 = guard.runExclusive(async () => {
      rpcCount++;
      return "duplicate";
    });

    const second = await p2;
    assert.equal(second.ran, false);
    assert.equal(rpcCount, 1);

    release();
    const first = await p1;
    assert.equal(first.ran, true);
    assert.equal(first.value, "ok");
    assert.equal(guard.isBusy(), false);
  });

  it("reuses identical idempotency key for transient retries of the same answer and rotates after advance", () => {
    const guard = new AttemptIdempotencyController();
    const key1 = guard.getAttemptKey("q-101", "2");
    const key2 = guard.getAttemptKey("q-101", "2");
    const key3 = guard.getAttemptKey("q-101", "3");

    assert.equal(key1, key2);
    assert.notEqual(key1, key3);

    guard.clearAttempt("q-101");
    const key4 = guard.getAttemptKey("q-101", "2");
    assert.notEqual(key1, key4);
  });

  it("tracks completed lesson/boss/reward claims idempotently", () => {
    const guard = new AttemptIdempotencyController();
    assert.equal(guard.hasCompleted("complete_lesson", "lesson-1"), false);
    guard.markCompleted("complete_lesson", "lesson-1");
    assert.equal(guard.hasCompleted("complete_lesson", "lesson-1"), true);
    guard.resetAll();
    assert.equal(guard.hasCompleted("complete_lesson", "lesson-1"), false);
  });

  it("extracts targeted bilingual distractor misconception feedback safely", () => {
    const meta = {
      distractor_explanations_en: { "1": "You inverted mass and acceleration." },
      distractor_explanations_ar: { "1": "عكست العلاقة بين الكتلة والتسارع." },
    };
    assert.equal(
      extractDistractorFeedback(meta, "1", "en"),
      "You inverted mass and acceleration.",
    );
    assert.equal(
      extractDistractorFeedback(meta, "1", "ar"),
      "عكست العلاقة بين الكتلة والتسارع.",
    );
    assert.equal(extractDistractorFeedback(meta, "0", "en"), "");
  });
});
