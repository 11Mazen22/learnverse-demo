import test from "node:test";
import assert from "node:assert/strict";
import {
  parseStreamFrames,
  validateAttachment,
  safeHref,
  safeStorageLink,
  titleFrom,
  aiResponseFailure,
  friendlyError,
} from "./workspace.ts";
import { sanitizeFanarText } from "./sanitize.ts";
test("SSE parser preserves incomplete events and accepts CRLF", () => {
  const a = parseStreamFrames('data: {"content":"أهلا"}\r\n\r\ndata: {"do');
  assert.deepEqual(a.data, ['{"content":"أهلا"}']);
  assert.equal(a.rest, 'data: {"do');
  const b = parseStreamFrames(a.rest + 'ne":true}\n\n');
  assert.deepEqual(b.data, ['{"done":true}']);
  assert.equal(b.rest, "");
});
test("uploads reject zero bytes, oversized files, and active formats", () => {
  assert.ok(
    validateAttachment({ name: "x.svg", type: "image/svg+xml", size: 400 }),
  );
  assert.ok(validateAttachment({ name: "x.png", type: "image/png", size: 0 }));
  assert.ok(
    validateAttachment({
      name: "x.png",
      type: "image/png",
      size: 11 * 1024 * 1024,
    }),
  );
  assert.equal(
    validateAttachment({
      name: "voice.webm",
      type: "audio/webm;codecs=opus",
      size: 500,
    }),
    "",
  );
});
test("notification destinations reject javascript, protocol-relative and backslash URLs", () => {
  for (const href of [
    "javascript:alert(1)",
    "//evil.test",
    "/\\evil.test",
    "https://evil.test",
  ])
    assert.equal(safeHref(href), "/notifications");
  assert.equal(safeHref("/assignments?x=1"), "/assignments?x=1");
});
test("sanitizer removes reasoning and tool payloads including unfinished chunks", () => {
  assert.equal(sanitizeFanarText("Visible<think>private"), "Visible");
  assert.equal(sanitizeFanarText("A<analysis>secret</analysis>B"), "AB");
  assert.equal(sanitizeFanarText("A<tool_start>secret<tool_end>B"), "AB");
  assert.equal(sanitizeFanarText("A<thi"), "A");
});
test("conversation titles are bounded and normalize whitespace", () => {
  assert.equal(titleFrom("  one\n two "), "one two");
  assert.ok(titleFrom("a".repeat(100)).length <= 49);
});

test("image-preview links must target our private Supabase upload bucket", () => {
  const origin = "https://example.supabase.co";
  assert.equal(safeStorageLink("javascript:alert(1)", origin), null);
  assert.equal(
    safeStorageLink("https://untrusted.test/file.png", origin),
    null,
  );
  assert.equal(
    safeStorageLink(
      "https://example.supabase.co/storage/v1/object/public/other/a.png",
      origin,
    ),
    null,
  );
  const signed =
    origin +
    "/storage/v1/object/sign/noata-uploads/user/chat/picture.png?token=opaque";
  assert.equal(safeStorageLink(signed, origin), signed);
});

test("text document attachments have their own safe MIME and size limits", () => {
  assert.equal(
    validateAttachment({ name: "reading.txt", type: "text/plain", size: 620 }),
    "",
  );
  assert.equal(
    validateAttachment({
      name: "revision.md",
      type: "text/markdown",
      size: 620,
    }),
    "",
  );
  assert.equal(
    validateAttachment({ name: "grades.csv", type: "text/csv", size: 620 }),
    "",
  );
  assert.equal(
    validateAttachment({
      name: "notes.json",
      type: "application/json",
      size: 620,
    }),
    "",
  );
  assert.ok(
    validateAttachment({ name: "evil.html", type: "text/html", size: 620 }),
  );
  assert.equal(
    validateAttachment({
      name: "reading.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 620,
    }),
    "",
  );
  assert.equal(
    validateAttachment({
      name: "lecture.pdf",
      type: "application/pdf",
      size: 620,
    }),
    "",
  );
  assert.ok(
    validateAttachment({
      name: "unsupported.xlsx",
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 620,
    }),
  );
  assert.ok(
    validateAttachment({
      name: "oversize.txt",
      type: "text/plain",
      size: 600000,
    }),
  );
});

test("notification destinations cannot become external after browser control-character normalization", () => {
  for (const href of [
    "/\n/evil.example",
    "/\r/evil.example",
    "/\t/evil.example",
    "/path\u0000other",
    "/\\evil.example",
    "//evil.example",
  ]) {
    assert.equal(safeHref(href), "/notifications");
  }
  assert.equal(safeHref("/ai?chat=owned-id"), "/ai?chat=owned-id");
});

test("Fanar configuration failures remain distinguishable from upstream outages", () => {
  assert.equal(
    aiResponseFailure(503, { code: "FANAR_NOT_CONFIGURED", error: "AI backend is not configured" }),
    "FANAR_NOT_CONFIGURED",
  );
  assert.equal(aiResponseFailure(503, { error: "Service Unavailable" }), "FANAR_UNAVAILABLE");
  assert.equal(aiResponseFailure(401, { error: "Unauthorized" }), "401");
  assert.match(friendlyError(new Error("FANAR_NOT_CONFIGURED")), /Fanar.*لم يكتمل/);
  assert.match(friendlyError(new Error("FANAR_UNAVAILABLE")), /غير متاحة مؤقتًا/);
  assert.match(friendlyError(new Error("401")), /الجلسة انتهت/);
});
