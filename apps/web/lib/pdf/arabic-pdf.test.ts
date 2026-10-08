import test from "node:test";
import assert from "node:assert/strict";
import {
  generateArabicPdf, parseMarkdown, parseInlines, latexToUnicode, toArabicIndic, PDF_MAX_CHARACTERS,
} from "./arabic-pdf.ts";
import { extractPdfDocument } from "../ai/pdf-ingest.ts";

function shimDomMatrix() {
  if (!("DOMMatrix" in globalThis)) {
    Object.defineProperty(globalThis, "DOMMatrix", {
      configurable: true,
      value: class DOMMatrix {
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
        multiplySelf() { return this; } preMultiplySelf() { return this; }
        translateSelf() { return this; } scaleSelf() { return this; } invertSelf() { return this; }
      },
    });
  }
}
const letters = (s: string) => s.replace(/[^\p{L}\p{Nd}]/gu, "");
async function extract(bytes: Uint8Array) {
  shimDomMatrix();
  return extractPdfDocument({ name: "out.pdf", type: "application/pdf", size: bytes.length, arrayBuffer: async () => Uint8Array.from(bytes).buffer });
}

const SAMPLE = `# ملخص الوحدة الثالثة: الجهاز التنفسي

الجهاز التنفسي مسؤول عن تبادل الغازات بين الجسم والبيئة. يدخل **الأكسجين** عبر الأنف إلى الرئتين (alveoli).

## أجزاء الجهاز التنفسي

- الأنف والتجويف الأنفي
- الرئتان والحويصلات الهوائية

1. ينقبض الحجاب الحاجز.
2. يدخل الهواء إلى الرئتين.

| العضو | الوظيفة | Example |
|---|---|---|
| الرئتان | تبادل الغازات | Lungs |
| القصبة الهوائية | ممر الهواء | Trachea |

الله أكبر. مرحبًا بكم في منصة نوتة. لا إله إلا الله.
`;

test("markdown parser recognises Arabic document structure", () => {
  const blocks = parseMarkdown(SAMPLE);
  assert.deepEqual(blocks.map((b) => b.kind), ["heading", "paragraph", "heading", "list", "list", "table", "paragraph"]);
  const list = blocks[4];
  assert.ok(list.kind === "list" && list.ordered && list.items.length === 2);
  const table = blocks[5];
  assert.ok(table.kind === "table" && table.header.length === 3 && table.rows.length === 2);
});
test("inline parser handles bold, code and math without eating plain text", () => {
  const runs = parseInlines("نص **غامق** و `code` و $x^2 \\leq \\pi$ ونهاية");
  assert.equal(runs.filter((r) => r.bold).length, 1);
  assert.equal(runs.filter((r) => r.code).length, 1);
  assert.equal(runs.find((r) => r.math)?.text, "x² ≤ π");
});
test("LaTeX subset renders to readable Unicode and Arabic-Indic numerals", () => {
  assert.equal(latexToUnicode("\\frac{a}{b}"), "(a)/(b)");
  assert.equal(latexToUnicode("\\sqrt{x^2}"), "√(x²)");
  assert.equal(toArabicIndic(2026), "٢٠٢٦");
});

test("generated PDF is a valid, paginated, font-embedded file with correct metadata", async () => {
  const filler = "هذه فقرة طويلة لاختبار تقسيم الصفحات والتفاف الأسطر في المستندات العربية. ".repeat(160);
  const result = await generateArabicPdf({ title: "ملخص الجهاز التنفسي", markdown: SAMPLE + "\n" + filler, date: new Date("2026-10-08T00:00:00Z") });
  const head = Buffer.from(result.bytes.slice(0, 8)).toString("latin1");
  assert.match(head, /^%PDF-1\./);
  assert.ok(result.pageCount >= 3, "long documents paginate (got " + result.pageCount + ")");
  const text = Buffer.from(result.bytes).toString("latin1");
  assert.match(text, /\/Lang \(ar\)/);
  assert.match(text, /CIDFontType2/);
  assert.equal((text.match(/\/Type \/Page\b/g) ?? []).length, result.pageCount);
});

test("PDF.js reads back the real Arabic words in logical order from the generated file", async () => {
  const result = await generateArabicPdf({ title: "ملخص الجهاز التنفسي", markdown: SAMPLE, date: new Date("2026-10-08T00:00:00Z") });
  const parsed = await extract(result.bytes);
  assert.equal(parsed.totalPages, result.pageCount);
  const page = parsed.pages[0].text;
  const flat = letters(page);
  for (const phrase of [
    "ملخص الوحدة الثالثة الجهاز التنفسي",
    "الجهاز التنفسي مسؤول عن تبادل الغازات بين الجسم والبيئة",
    "يدخل الأكسجين عبر الأنف إلى الرئتين",
    "أجزاء الجهاز التنفسي",
    "الأنف والتجويف الأنفي",
    "ينقبض الحجاب الحاجز",
    "الله أكبر مرحبًا بكم في منصة نوتة لا إله إلا الله".replace("مرحبًا", "مرحبا"),
  ]) {
    assert.ok(flat.includes(letters(phrase.normalize("NFC"))) || flat.includes(letters(phrase.replace(/[ً-ٟ]/g, ""))), "missing in extraction: " + phrase + "\n" + page);
  }
  assert.ok(flat.includes("alveoli"), "Latin words are preserved");
  assert.ok(/صفحة/.test(page) && flat.includes(letters(toArabicIndic(1))), "page numbering text is extractable");
});

test("ligatures (lam-alef, Allah) and hamza forms survive extraction", async () => {
  const result = await generateArabicPdf({ title: "اختبار", markdown: "الله لا إله إلا الله أإؤئآ ءاية", date: new Date(0) });
  const flat = letters((await extract(result.bytes)).pages[0].text);
  assert.ok(flat.includes("اللهلاإلهإلااللهأإؤئآءاية"), flat);
});

test("mixed English/Arabic and numbers keep their reading order", async () => {
  const result = await generateArabicPdf({ title: "اختبار", markdown: "تم تحديث الإصدار 2026 من Noata AI بنجاح (100%).", date: new Date(0) });
  const text = (await extract(result.bytes)).pages[0].text;
  const flat = text.replace(/\s+/g, "");
  assert.ok(flat.includes("تمتحديثالإصدار2026منNoataAIبنجاح"), text);
});

test("input limits are enforced with Arabic error messages", async () => {
  await assert.rejects(generateArabicPdf({ title: "x", markdown: "   " }), /لا يوجد محتوى/);
  await assert.rejects(generateArabicPdf({ title: "x", markdown: "ا".repeat(PDF_MAX_CHARACTERS + 1) }), /أطول من الحد/);
});

test("very long unbreakable tokens are hard-wrapped instead of overflowing the page", async () => {
  const result = await generateArabicPdf({ title: "url", markdown: "https://example.com/" + "a".repeat(400), date: new Date(0) });
  const text = (await extract(result.bytes)).pages[0].text;
  assert.ok(letters(text).includes("a".repeat(100)));
});
