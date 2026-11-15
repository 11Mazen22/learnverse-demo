import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hasExplicitMathDelimiters,
  inferTextDirection,
  isStructuredStudyBlock,
  MAX_KATEX_INPUT_LENGTH,
  normalizeStructuredBlocks,
  renderSafeKatexHtml,
  SAFE_KATEX_OPTIONS,
} from "./structured-content.ts";

test("SAFE_KATEX_OPTIONS enforces hardened untrusted math limits", () => {
  assert.equal(SAFE_KATEX_OPTIONS.trust, false);
  assert.equal(SAFE_KATEX_OPTIONS.maxExpand, 100);
  assert.equal(SAFE_KATEX_OPTIONS.throwOnError, false);
});

test("renderSafeKatexHtml renders valid formulas with MathML and HTML", () => {
  const res = renderSafeKatexHtml("i^7 = -i", { displayMode: false });
  assert.equal(res.ok, true);
  assert.equal(res.errorProtected, false);
  assert.match(res.html, /katex/);
  assert.match(res.html, /<math/);
});

test("renderSafeKatexHtml blocks trust-violating macros like \\href{javascript:...} and \\htmlClass", () => {
  const hrefRes = renderSafeKatexHtml("\\href{javascript:alert(1)}{click}");
  assert.equal(hrefRes.ok, false);
  assert.equal(hrefRes.errorProtected, true);
  assert.equal(hrefRes.html.includes("javascript:alert"), false);
  assert.equal(hrefRes.html.includes("<a "), false);

  const htmlClassRes = renderSafeKatexHtml("\\htmlClass{evil}{x}");
  assert.equal(htmlClassRes.ok, false);
  assert.equal(htmlClassRes.errorProtected, true);
  assert.equal(htmlClassRes.html.includes('class="evil"'), false);
});

test("renderSafeKatexHtml stops \\def macro expansion bombs via maxExpand: 100", () => {
  const res = renderSafeKatexHtml("\\def\\a{\\a\\a}\\a");
  assert.equal(res.ok, false);
  assert.equal(res.errorProtected, true);
  assert.equal(res.fallbackText, "\\def\\a{\\a\\a}\\a");
});

test("renderSafeKatexHtml rejects empty and oversized TeX inputs cleanly", () => {
  const empty = renderSafeKatexHtml("   ");
  assert.equal(empty.ok, false);
  assert.equal(empty.reason, "empty");

  const oversized = renderSafeKatexHtml("x+".repeat(MAX_KATEX_INPUT_LENGTH));
  assert.equal(oversized.ok, false);
  assert.equal(oversized.reason, "too_long");
});

test("hasExplicitMathDelimiters ignores plain prose ratios a/b, H2O, and currency $50", () => {
  assert.equal(hasExplicitMathDelimiters("Divide numerator by denominator a/b."), false);
  assert.equal(hasExplicitMathDelimiters("الماء صيغته H₂O والصفحة 1/2"), false);
  assert.equal(hasExplicitMathDelimiters("The textbook costs $50 today."), false);
  assert.equal(hasExplicitMathDelimiters("When $5 is added to $10 the fee rises."), false);

  assert.equal(hasExplicitMathDelimiters("The value is $i^2 = -1$."), true);
  assert.equal(hasExplicitMathDelimiters("Solve:\n$$\nx^2 + 1 = 0\n$$"), true);
});

test("inferTextDirection picks rtl for Arabic-first text and ltr for English-first text", () => {
  assert.equal(inferTextDirection("مجموع قياسات زوايا المثلث = $180^\\circ$"), "rtl");
  assert.equal(inferTextDirection("Complex conjugate of $z = a + bi$"), "ltr");
});

test("normalizeStructuredBlocks preserves deferred Study Notebook anchor metadata without UI coupling", () => {
  const normalized = normalizeStructuredBlocks([
    {
      type: "math",
      tex: "i^4 = 1",
      display: true,
      blockId: "math-blk-01",
      conceptId: "powers-of-i",
    },
    {
      type: "poetry_couplet",
      hemistich1: "إذا غامرت في شرف مروم",
      hemistich2: "فلا تقنع بما دون النجوم",
      poet: "المتنبي",
      blockId: "poetry-01",
    },
    { type: "unknown_unsafe_block", content: "<script>alert(1)</script>" },
  ]);

  assert.equal(normalized.length, 2);
  assert.equal(isStructuredStudyBlock(normalized[0]), true);
  assert.equal(normalized[0].blockId, "math-blk-01");
  assert.equal(normalized[0].conceptId, "powers-of-i");
  assert.equal(normalized[1].type, "poetry_couplet");
});
