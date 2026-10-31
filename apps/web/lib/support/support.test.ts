import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSupportEmailHtml,
  buildSupportEmailText,
  dispatchSupportTicketEmail,
  REQUIRED_SUPPORT_EMAIL,
} from "./email-dispatcher.ts";
import type { SupportTicketRecord } from "./types.ts";
import { HELP_ARTICLES } from "./knowledge-base.ts";

const mockTicket: SupportTicketRecord = {
  id: "test-uuid-1234",
  ticket_code: "NOATA-TEST01",
  user_id: null,
  name: "طالب نقطة <script>alert(1)</script>",
  email: "student@example.com",
  subject: "استفسار عن منهج العلوم & الرياضيات",
  category: "curriculum",
  message: "هل يمكنني التبديل بين المسار العربي والإنجليزي؟ <iframe src='evil.com'></iframe>",
  status: "open",
  email_delivery_status: "pending",
  email_destination: REQUIRED_SUPPORT_EMAIL,
  created_at: "2026-10-28T12:00:00Z",
  updated_at: "2026-10-28T12:00:00Z",
};

test("support email destination is strictly configured to mazenshazly011@gmail.com", () => {
  assert.equal(REQUIRED_SUPPORT_EMAIL, "mazenshazly011@gmail.com");
  assert.equal(mockTicket.email_destination, "mazenshazly011@gmail.com");
});

test("support email html template sanitizes dangerous scripts and preserves ticket details", () => {
  const html = buildSupportEmailHtml(mockTicket);
  assert.ok(!html.includes("<script>"), "HTML should not contain unescaped script tag");
  assert.ok(!html.includes("<iframe>"), "HTML should not contain unescaped iframe tag");
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), "Name should be escaped");
  assert.ok(html.includes("NOATA-TEST01"), "HTML must include ticket code");
  assert.ok(html.includes("mazenshazly011@gmail.com"), "HTML must reference required recipient");
  assert.ok(html.includes("student@example.com"), "HTML must include sender email");
});

test("support email plaintext template formats correctly", () => {
  const text = buildSupportEmailText(mockTicket);
  assert.ok(text.includes("#NOATA-TEST01"));
  assert.ok(text.includes("mazenshazly011@gmail.com"));
  assert.ok(text.includes("student@example.com"));
});

test("dispatchSupportTicketEmail reports truthful queued status when RESEND_API_KEY is not set", async () => {
  const originalKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;

  try {
    const result = await dispatchSupportTicketEmail(mockTicket);
    assert.equal(result.delivered, false, "Must not claim delivered when provider key is missing");
    assert.equal(result.status, "queued_no_provider");
    assert.equal(result.destination, "mazenshazly011@gmail.com");
    assert.deepEqual(result.missingEnv, ["RESEND_API_KEY"]);
    assert.ok(result.note.includes("RESEND_API_KEY"));
  } finally {
    if (originalKey) process.env.RESEND_API_KEY = originalKey;
  }
});

test("knowledge base contains articles for all required subject and workflow categories", () => {
  assert.ok(HELP_ARTICLES.length >= 6);
  const categories = new Set(HELP_ARTICLES.map((a) => a.category));
  assert.ok(categories.has("curriculum"));
  assert.ok(categories.has("tracks"));
  assert.ok(categories.has("ai"));
  assert.ok(categories.has("lessons"));
  assert.ok(categories.has("account"));
  assert.ok(categories.has("bug"));
});
