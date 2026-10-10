import test from "node:test";
import assert from "node:assert/strict";
import { AI_INTRO_VERSION, featureSeenKey, hasSeenFeature, markFeatureSeen } from "./feature-seen.ts";

test("new indicators persist per account and only return for a new version", () => {
  const values = new Map<string, string>();
  const previousStorage = globalThis.localStorage;
  const previousWindow = globalThis.window;
  Object.assign(globalThis, {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    },
    window: { dispatchEvent: () => true },
  });
  try {
    assert.equal(hasSeenFeature("ai", AI_INTRO_VERSION, "student-a"), false);
    markFeatureSeen("ai", AI_INTRO_VERSION, "student-a");
    assert.equal(values.get(featureSeenKey("ai", AI_INTRO_VERSION, "student-a")), "1");
    assert.equal(hasSeenFeature("ai", AI_INTRO_VERSION, "student-a"), true);
    assert.equal(hasSeenFeature("ai", AI_INTRO_VERSION, "student-b"), false);
    assert.equal(hasSeenFeature("ai", "2", "student-a"), false);
  } finally {
    Object.assign(globalThis, { localStorage: previousStorage, window: previousWindow });
  }
});
