import test from "node:test";
import assert from "node:assert/strict";
import { toolOutputText } from "./tool-output.ts";
test("missing and empty tool payloads are failures, never an 'undefined' AI reply", () => {
  for (const value of [undefined, null, "", {}, []])
    assert.throws(() => toolOutputText(value), /Empty tool output/);
  assert.equal(toolOutputText({ translation: "ترجمة فعلية" }), "ترجمة فعلية");
  assert.match(toolOutputText({ flagged: false }), /^```json/);
  assert.equal(
    toolOutputText("النص المرسل من المزوّد"),
    "النص المرسل من المزوّد",
  );
});
