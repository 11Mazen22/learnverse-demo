import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePaletteQuery,
  matchPaletteCommands,
  movePaletteIndex,
  PALETTE_MAX_RESULTS,
  PALETTE_QUERY_MAX_LENGTH,
} from "./command-palette.ts";
import type { PaletteCommand } from "./command-palette.ts";

function command(overrides: Partial<PaletteCommand>): PaletteCommand {
  return {
    id: "test.command",
    group: "quick",
    labelAr: "أمر",
    labelEn: "Command",
    ...overrides,
  };
}

test("palette query folding matches diacritic-free Arabic, hamza forms and digits", () => {
  // Diacritics, alef forms and ta marbuta all fold to their plain forms.
  assert.equal(normalizePaletteQuery("مُحادثة"), "محادثه");
  assert.equal(normalizePaletteQuery("ٱحْدَثُ"), "احدث");
  assert.equal(normalizePaletteQuery("ورشة"), "ورشه");
  // Query whitespace collapses; punctuation spelling variants stay verbatim.
  assert.equal(normalizePaletteQuery("  New   Chat "), "new chat");
  // Arabic-Indic digits become ASCII digits.
  assert.equal(normalizePaletteQuery("٦٥٤"), "654");
  // Hard length bound keeps runaway input safe.
  const long = normalizePaletteQuery("a".repeat(400));
  assert.equal(long.length, PALETTE_QUERY_MAX_LENGTH);
});

test("empty query keeps all enabled commands in authored order", () => {
  const commands = [
    command({ id: "a" }),
    command({ id: "b", disabled: true }),
    command({ id: "c" }),
  ];
  const shown = matchPaletteCommands("", commands, "ar");
  assert.deepEqual(shown.map((c) => c.id), ["a", "c"]);
});

test("every whitespace-separated term must match across label, hint and keywords", () => {
  const commands = [
    command({
      id: "study",
      labelAr: "ورشة المذاكرة",
      labelEn: "Study workshop",
      hintEn: "guided questions",
      keywords: "quiz drill socratic",
    }),
    command({ id: "other", labelEn: "Study", labelAr: "مذاكرة" }),
  ];
  const matched = matchPaletteCommands("socratic guided", commands, "en");
  assert.deepEqual(matched.map((c) => c.id), ["study"]);
  // Arabic folding makes "مذاكرة" hit both rows; the exact-label row ranks first.
  const arabicMatched = matchPaletteCommands("مذاكرة", commands, "ar");
  assert.deepEqual(arabicMatched.map((c) => c.id), ["other", "study"]);
});

test("label-prefix hits outrank keyword-only hits regardless of input order", () => {
  const commands = [
    command({ id: "kw", labelEn: "Focus composer", keywords: "typewriter" }),
    command({ id: "label", labelEn: "Typewriter focus" }),
  ];
  const shown = matchPaletteCommands("type", commands, "en");
  assert.equal(shown[0].id, "label");
  assert.equal(shown[1].id, "kw");
});

test("quick commands outrank conversations when equal scores tie", () => {
  const commands = [
    command({
      id: "conversation",
      group: "conversations",
      labelEn: "Favorite topic notes",
    }),
    command({ id: "quick", group: "quick", labelEn: "Favorite topic quick copy" }),
  ];
  const shown = matchPaletteCommands("top", commands, "en");
  assert.deepEqual(shown.map((c) => c.id), ["quick", "conversation"]);
});

test("results cap at the documented maximum", () => {
  const commands = Array.from({ length: PALETTE_MAX_RESULTS + 10 }, (_, index) =>
    command({ id: "hit" + index, labelEn: "hit " + index }),
  );
  assert.equal(matchPaletteCommands("hit", commands, "en").length, PALETTE_MAX_RESULTS);
});

test("selection movement wraps in both directions and skips a non-positive count", () => {
  assert.equal(movePaletteIndex(0, -1, 3), 2);
  assert.equal(movePaletteIndex(2, 1, 3), 0);
  assert.equal(movePaletteIndex(1, -4, 3), 0);
  assert.equal(movePaletteIndex(0, 1, 0), 0);
});
