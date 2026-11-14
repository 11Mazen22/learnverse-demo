import assert from "node:assert/strict";
import test from "node:test";
import { parseBulkImportCards, parseCardMetadata, parseDeckMetadata, serializeCardMetadata } from "./metadata.ts";

test("parseCardMetadata enforces bounded schema defaults and valid fields", () => {
  const clean = parseCardMetadata({
    hint: "  Check mitochondria  ",
    matching_mode: "fuzzy",
    accepted_answers: ["ATP", "", "  cellular currency  "],
    difficulty: "hard",
    source: { lesson_id: "lesson-1" },
  });
  assert.equal(clean.version, 1);
  assert.equal(clean.matching_mode, "fuzzy");
  assert.deepEqual(clean.accepted_answers, ["ATP", "cellular currency"]);
  assert.equal(clean.difficulty, "hard");
  assert.equal(clean.source?.lesson_id, "lesson-1");

  const fallback = parseCardMetadata({ matching_mode: "bogus", accepted_answers: [123] });
  assert.equal(fallback.matching_mode, "normalized");
  assert.equal(fallback.accepted_answers, undefined);

  const deck = parseDeckMetadata({ subject_slug: "mathematics", is_template: true, share_scope: "class" });
  assert.equal(deck.subject_slug, "mathematics");
  assert.equal(deck.share_scope, "class");

  const roundtrip = serializeCardMetadata({ hint: "test", normalize_alef: true });
  assert.equal(roundtrip.normalize_alef, true);
});

test("parseBulkImportCards parses TSV, CSV, Markdown, and Cloze lines accurately", () => {
  const input = [
    "#separator:tab",
    "#html:true",
    "Term A\tDefinition A\tHint A",
    `"Term, B","Definition, B"`,
    "- **Newton 2nd Law** :: F = m * a",
    "Energy is stored in {{c1::ATP::currency}} molecules.",
  ].join("\n");

  const cards = parseBulkImportCards(input);
  assert.equal(cards.length, 4);
  assert.equal(cards[0].front, "Term A");
  assert.equal(cards[0].metadata.hint, "Hint A");
  assert.equal(cards[1].front, "Term, B");
  assert.equal(cards[2].card_type, "term_definition");
  assert.equal(cards[2].front, "Newton 2nd Law");
  assert.equal(cards[3].card_type, "cloze");
  assert.ok(cards[3].cloze_text?.includes("{{c1::ATP::currency}}"));
});
