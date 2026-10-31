import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const migration = new URL("../../../../supabase/migrations/20261028160000_support_tickets.sql", import.meta.url);
const route = new URL("../../app/api/support/ticket/route.ts", import.meta.url);

test("support ticket roles match Noata's real role enum and preserve audit history", async () => {
  const sql = await readFile(migration, "utf8");
  assert.doesNotMatch(sql, /role\s+in\s*\([^)]*'staff'/i);
  assert.match(sql, /profiles\.role = 'admin'/);
  assert.doesNotMatch(sql, /create policy "Staff can delete support tickets"/);
  assert.match(sql, /execute function private\.touch_updated_at\(\)/);
});

test("guest insertion is constrained and delivery updates require a short-lived secret", async () => {
  const sql = await readFile(migration, "utf8");
  assert.match(sql, /for insert\s+to anon, authenticated/i);
  assert.match(sql, /email_delivery_status = 'pending'/);
  assert.match(sql, /delivery_token_hash/);
  assert.match(sql, /created_at > now\(\) - interval '1 hour'/);
  assert.match(sql, /create function private\.record_support_ticket_delivery/);
  assert.match(sql, /create function public\.record_support_ticket_delivery/);
  assert.match(sql, /security invoker/);
  assert.match(sql, /revoke all on function public\.record_support_ticket_delivery[^;]+from public/s);
});

test("the API cannot report a saved ticket after persistence failure", async () => {
  const source = await readFile(route, "utf8");
  assert.match(source, /if \(persistence\.error\)/);
  assert.match(source, /saved: false/);
  assert.match(source, /saved: true/);
  assert.match(source, /record_support_ticket_delivery/);
  assert.doesNotMatch(source, /details:\s*msg/);
  assert.doesNotMatch(source, /insert skipped or unavailable/);
});
