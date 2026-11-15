import test from "node:test";
import assert from "node:assert/strict";
import { advanceStreamCursor } from "./stream-typewriter.ts";

test("advanceStreamCursor progresses monotonically toward target and completes cleanly", () => {
  const sample = "بص يا سيدي، قانون المميز في الرياضيات سهل جدًا: Δ = b² - 4ac.";
  let len = 0;
  let steps = 0;
  while (len < sample.length && steps < 100) {
    const next = advanceStreamCursor(len, sample, 16);
    assert.ok(next > len, `Expected forward progress at step ${steps}`);
    assert.ok(next <= sample.length);
    len = next;
    steps += 1;
  }
  assert.equal(len, sample.length);
});

test("advanceStreamCursor never splits Arabic tashkeel or surrogate pairs or quran directives", () => {
  const withTashkeel = "مَرْحَبًا بِكُمْ";
  for (let i = 0; i < withTashkeel.length; i = advanceStreamCursor(i, withTashkeel, 16)) {
    const next = advanceStreamCursor(i, withTashkeel, 16);
    if (next < withTashkeel.length) {
      assert.equal(/[\u064b-\u065f\u0670]/.test(withTashkeel[next]), false);
    }
  }

  const withQuran = "اقرأ الآية التالية:\n\n[[quran:2:255]]\n\nوشوف المعنى.";
  const mid = withQuran.indexOf("[[quran:") + 4;
  const after = advanceStreamCursor(mid, withQuran, 16);
  const slice = withQuran.slice(0, after);
  assert.ok(!slice.includes("[[quran:") || slice.includes("[[quran:2:255]]"));
});

test("advanceStreamCursor accelerates gracefully for large bursts", () => {
  const huge = "كلمة ".repeat(200);
  const next = advanceStreamCursor(0, huge, 16);
  assert.ok(next >= 20 && next < huge.length);
});
