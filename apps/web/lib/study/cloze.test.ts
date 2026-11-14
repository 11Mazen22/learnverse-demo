import assert from "node:assert/strict";
import test from "node:test";
import {
  formatClozePlainPrompt,
  getClozeAnswers,
  parseClozeGroups,
  renderClozeSegments,
  stripClozeMarkup,
} from "./cloze.ts";

test("parseClozeGroups handles multiple cloze indices with and without hints", () => {
  const source =
    "تنقسم الخلية إلى {{c1::النواة::مركز التحكم}} و{{c2::السيتوبلازم}} لإتمام {{c1::انقسامها}}.";
  const parsed = parseClozeGroups(source);

  assert.equal(parsed.hasCloze, true);
  assert.deepEqual(parsed.indices, [1, 2]);
  assert.deepEqual(getClozeAnswers(source, 1), [
    { answer: "النواة", hint: "مركز التحكم" },
    { answer: "انقسامها", hint: undefined },
  ]);
  assert.deepEqual(getClozeAnswers(source, 2), [
    { answer: "السيتوبلازم", hint: undefined },
  ]);
});

test("renderClozeSegments blanks only the active target group and reveals other groups cleanly", () => {
  const source = "Water is {{c1::H2O}} and table salt is {{c2::NaCl::ionic crystal}}.";

  const promptC1 = formatClozePlainPrompt(source, 1, false);
  assert.equal(promptC1, "Water is […] and table salt is NaCl.");

  const promptC2 = formatClozePlainPrompt(source, 2, false);
  assert.equal(promptC2, "Water is H2O and table salt is [ionic crystal].");

  const revealedC2 = renderClozeSegments(source, 2, true);
  assert.equal(
    revealedC2.some((s) => s.kind === "revealed-target" && s.groupIndex === 2 && s.text === "NaCl"),
    true,
  );
  assert.equal(stripClozeMarkup(source), "Water is H2O and table salt is NaCl.");
});

test("non-cloze text degrades cleanly without false blanks", () => {
  const plain = "Plain front card without cloze markers {{not cloze}}.";
  const parsed = parseClozeGroups(plain);
  assert.equal(parsed.hasCloze, false);
  assert.deepEqual(parsed.indices, []);
  assert.equal(stripClozeMarkup(plain), plain);
});
