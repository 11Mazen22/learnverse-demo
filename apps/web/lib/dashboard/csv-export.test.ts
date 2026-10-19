import { test } from "node:test";
import assert from "node:assert/strict";
import { serializeCsv } from "./csv-export.ts";

test("CSV exports preserve Arabic text and provide a UTF-8 BOM for spreadsheet compatibility", () => {
  const csv = serializeCsv(["Question", "Status"], [["الجهاز التنفسي", "منشور"]]);
  assert.ok(csv.startsWith("\\uFEFF"));
  assert.match(csv, /الجهاز التنفسي/);
  assert.match(csv, /منشور/);
  assert.ok(csv.endsWith("\\r\\n"));
});

test("CSV quotes commas, embedded quotes and multiline cells correctly", () => {
  const csv = serializeCsv(["Name", "Notes"], [['A, "B"', "first line\\nsecond line"]]);
  assert.ok(csv.includes('"A, ""B"""'));
  assert.ok(csv.includes('"first line\\nsecond line"'));
});

test("CSV neutralizes formula-like text without changing numeric values", () => {
  const csv = serializeCsv(["Name", "Score"], [["=HYPERLINK(\"https://example.invalid\")", "+SUM(A1:A2)", "@command", "-not a grade"], [-4, 92]]);
  assert.ok(csv.includes("'=HYPERLINK"));
  assert.ok(csv.includes("'+SUM"));
  assert.ok(csv.includes("'@command"));
  assert.ok(csv.includes("'-not a grade"));
  assert.ok(csv.includes("-4,92"));
});

test("CSV always emits the header and stable CRLF line endings", () => {
  assert.equal(serializeCsv(["A", "B"], [[1, 2], [3, 4]]), "\\uFEFFA,B\\r\\n1,2\\r\\n3,4\\r\\n");
});
