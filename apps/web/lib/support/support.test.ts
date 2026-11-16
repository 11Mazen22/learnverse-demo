import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildSupportEmailHtml,
  buildSupportEmailText,
  dispatchSupportTicketEmail,
  REQUIRED_SUPPORT_EMAIL,
} from "./email-dispatcher.ts";
import type { SupportTicketRecord } from "./types.ts";
import { HELP_ARTICLES } from "./knowledge-base.ts";
import { SUPPORT_EMAIL } from "./identity.ts";

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

test("support email destination uses the official Noäta identity, never a personal mailbox", () => {
  assert.equal(REQUIRED_SUPPORT_EMAIL, SUPPORT_EMAIL);
  assert.ok(REQUIRED_SUPPORT_EMAIL.endsWith("@enterpriseworkhub.online"), "support inbox must stay on the verified product domain");
  assert.equal(mockTicket.email_destination, SUPPORT_EMAIL);
});

test("support templates never leak a personal mailbox address", () => {
  const html = buildSupportEmailHtml(mockTicket);
  const text = buildSupportEmailText(mockTicket);
  for (const body of [html, text]) {
    assert.ok(!body.includes("gmail.com"), "templates must not expose a personal Gmail address");
    assert.ok(body.includes(SUPPORT_EMAIL), "templates must reference the official support inbox");
  }
});

test("support email html template sanitizes dangerous scripts and preserves ticket details", () => {
  const html = buildSupportEmailHtml(mockTicket);
  assert.ok(!html.includes("<script>"), "HTML should not contain unescaped script tag");
  assert.ok(!html.includes("<iframe>"), "HTML should not contain unescaped iframe tag");
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), "Name should be escaped");
  assert.ok(html.includes("NOATA-TEST01"), "HTML must include ticket code");
  assert.ok(html.includes(SUPPORT_EMAIL), "HTML must reference required recipient");
  assert.ok(html.includes("student@example.com"), "HTML must include sender email");
});

test("support email plaintext template formats correctly", () => {
  const text = buildSupportEmailText(mockTicket);
  assert.ok(text.includes("#NOATA-TEST01"));
  assert.ok(text.includes(SUPPORT_EMAIL));
  assert.ok(text.includes("student@example.com"));
});

test("dispatchSupportTicketEmail reports truthful queued status when RESEND_API_KEY is not set", async () => {
  const originalKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;

  try {
    const result = await dispatchSupportTicketEmail(mockTicket);
    assert.equal(result.delivered, false, "Must not claim delivered when provider key is missing");
    assert.equal(result.status, "queued_no_provider");
    assert.equal(result.destination, SUPPORT_EMAIL);
    assert.deepEqual(result.missingEnv, ["RESEND_API_KEY"]);
    assert.ok(result.note.includes("RESEND_API_KEY"));
  } finally {
    if (originalKey) process.env.RESEND_API_KEY = originalKey;
  }
});

function shippedSourceFiles(root: string, found: string[] = []): string[] {
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    if (statSync(full).isDirectory()) {
      shippedSourceFiles(full, found);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry)) continue;
    if (/\.test\.tsx?$/.test(entry)) continue;
    found.push(full);
  }
  return found;
}

test("no personal mailbox address is shipped in application source", () => {
  const webRoot = fileURLToPath(new URL("../..", import.meta.url));
  const files = ["app", "components", "lib"].flatMap((dir) =>
    shippedSourceFiles(join(webRoot, dir)),
  );
  assert.ok(files.length > 100, "expected to scan the shipped application tree");
  const offenders = files.filter((file) => /gmail\.com/i.test(readFileSync(file, "utf8")));
  assert.deepEqual(
    offenders.map((file) => file.slice(webRoot.length)),
    [],
    "public surfaces must reference the official support identity only",
  );
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
