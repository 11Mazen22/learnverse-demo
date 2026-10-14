import test from "node:test";
import assert from "node:assert/strict";
import {createPdfAdmission, readPdfInput, PdfRequestError} from "./pdf-request.ts";
import {acquirePdfSlot, PdfBusyError} from "./pdf-pressure.ts";

function request(body: BodyInit, headers: Record<string, string> = {}) {
  return new Request("https://noata.test/api/pdf", {method: "POST", body, headers, duplex: "half"} as RequestInit);
}
test("wire limit rejects chunked or falsely small bodies before JSON parsing and cancels the stream", async () => {
  for (const headers of [{}, {"content-length": "1"}] as Record<string, string>[]) {
    let canceled = false;
    const stream = new ReadableStream({
      pull(controller) { controller.enqueue(new Uint8Array(400_001)); },
      cancel() { canceled = true; },
    });
    await assert.rejects(readPdfInput(request(stream, headers)), e => e instanceof PdfRequestError && e.status === 413);
    assert.equal(canceled, true);
  }
});
test("both contracts retain exact text and validate null, title and character limits", async () => {
  const text = "نص عربي مع **تنسيق** و $x^2$.";
  for (const field of ["text", "markdown"] as const)
    assert.deepEqual(await readPdfInput(request(JSON.stringify({[field]: text, title: "عنوان"})), field), {text, title: "عنوان"});
  for (const raw of [null, [], {markdown: ""}, {markdown: "ا".repeat(100_001)}, {markdown: "نص", title: "ا".repeat(121)}, {markdown: 7}])
    await assert.rejects(readPdfInput(request(JSON.stringify(raw)), "markdown"), e => e instanceof PdfRequestError && e.status === 400);
  await assert.rejects(readPdfInput(request("{")), SyntaxError);
});
test("one account cannot bypass the three-per-minute budget by changing formats; accounts expire independently", () => {
  let clock = 0;
  const admit = createPdfAdmission(() => clock);
  assert.equal(admit("user-a"), true);
  assert.equal(admit("user-a"), true);
  assert.equal(admit("user-a"), true);
  assert.equal(admit("user-a"), false);
  assert.equal(admit("user-b"), true);
  clock = 60_000;
  assert.equal(admit("user-a"), true);
});
test("render pressure is bounded and releasing a slot twice cannot admit excess work", () => {
  const releaseA = acquirePdfSlot();
  const releaseB = acquirePdfSlot();
  assert.throws(acquirePdfSlot, PdfBusyError);
  releaseA(); releaseA();
  const releaseC = acquirePdfSlot();
  assert.throws(acquirePdfSlot, PdfBusyError);
  releaseB(); releaseC();
});
