import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = join(
  root,
  "supabase",
  "migrations",
  "20261114000000_user_settings_dashboard_preferences.sql",
);

test("M1 dashboard preferences migration is additive, idempotent, and typed as a JSON object", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.ok(sql.includes("alter table public.user_settings"));
  assert.ok(sql.includes("add column if not exists dashboard_preferences jsonb not null default '{}'::jsonb"));
  assert.ok(sql.includes("user_settings_dashboard_preferences_object"));
  assert.ok(sql.includes("jsonb_typeof(dashboard_preferences) = 'object'"));
});

test("M1 enforces least-privilege table grants without exposing anon writes", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.ok(sql.includes("revoke all on table public.user_settings from public, anon"));
  assert.ok(sql.includes("grant select, insert, update on table public.user_settings to authenticated"));
  assert.doesNotMatch(sql, /\bgrant\s+delete\b/i);
  assert.doesNotMatch(sql, /insert\s+into\s+public\.(ledger|profiles)/i);
});
