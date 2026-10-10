import test from "node:test";
import assert from "node:assert/strict";
import { pdfTextLines, reconstructPdfLine } from "./pdf-text.ts";
test("shaped Arabic glyph runs reconstruct logical readable text without invented spaces", () => {
  const items = [..."ﺔﻴﺑﺮﻋ"].map((str, i) => ({
    str,
    dir: "rtl",
    transform: [1, 0, 0, 1, i * 10, 100],
  }));
  assert.equal(reconstructPdfLine(items), "عربية");
  assert.deepEqual(
    pdfTextLines([
      ...items,
      { str: "English reference", transform: [1, 0, 0, 1, 0, 50] },
    ]),
    ["عربية", "English reference"],
  );
});
test("normal multi-character PDF text runs keep their existing logical order", () => {
  assert.equal(
    reconstructPdfLine([
      { str: "نص عربي", dir: "rtl", transform: [] },
      { str: "English", dir: "ltr", transform: [] },
    ]),
    "نص عربي English",
  );
});

test("PDF.js logical Arabic clusters preserve letters when surrounded by shaped glyphs", () => {
  const visual = [
    "اءة",
    "ﺮ",
    "ﻘ",
    "ﻟ",
    "ا",
    " ",
    "ه",
    "ﺎ",
    "ﺠ",
    "ﺗ",
    "وا",
    " ",
    "وف",
    "ﺮ",
    "ﺤ",
    "ﻟ",
    "ا",
  ];
  const items = visual.map((str, i) => ({
    str,
    dir: "rtl",
    transform: [1, 0, 0, 1, i * 10, 100],
  }));
  assert.equal(reconstructPdfLine(items), "الحروف واتجاه القراءة");
});

test("fragmented Arabic lines retain punctuation and numeral order", () => {
  const visual = [".", "ﺔ", "ﻴ", "ﺑ", "ﺮ", "ﻋ", " ", "1", " ", "ﺺ", "ﻧ"];
  const items = visual.map((str, i) => ({
    str,
    transform: [1, 0, 0, 1, i * 10, 100],
  }));
  assert.equal(reconstructPdfLine(items), "نص 1 عربية.");
});

test("floating Arabic diacritics remain attached to their glyph after position sorting", () => {
  const items = [
    { str: "ﻢ", transform: [1, 0, 0, 1, 0, 100], width: 5 },
    { str: "ّ", transform: [1, 0, 0, 1, 6, 104], width: 0 },
    { str: " ", transform: [1, 0, 0, 1, 5, 100], width: 0.00004 },
    { str: "ﻠ", transform: [1, 0, 0, 1, 5, 100], width: 5 },
    { str: "ﻌ", transform: [1, 0, 0, 1, 10, 100], width: 5 },
    { str: "ﺘ", transform: [1, 0, 0, 1, 15, 100], width: 5 },
    { str: "ﻟ", transform: [1, 0, 0, 1, 20, 100], width: 5 },
    { str: "ا", transform: [1, 0, 0, 1, 25, 100], width: 5 },
  ];
  assert.equal(reconstructPdfLine(items), "التعلّم");
});
