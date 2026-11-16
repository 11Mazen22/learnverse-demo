import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const M3_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20261114000200_school_operations_v2.sql",
);
const M2_PATH = path.join(
  process.cwd(),
  "supabase/migrations/20261114000100_study_ecosystem_v2.sql",
);
const REHEARSAL_PATH = path.join(process.cwd(), "scripts/database-recovery-rehearsal.mjs");
const REGRESSION_SQL_PATH = path.join(process.cwd(), "scripts/sql/security-regressions.sql");

const m3 = fs.readFileSync(M3_PATH, "utf8");
const m2 = fs.readFileSync(M2_PATH, "utf8");
const rehearsal = fs.readFileSync(REHEARSAL_PATH, "utf8");
const regressions = fs.readFileSync(REGRESSION_SQL_PATH, "utf8");

test("M3 school operations migration creates academic_terms, feature_flags, class_attendance, and class_announcements idempotently", () => {
  for (const table of [
    "public.academic_terms",
    "public.feature_flags",
    "public.class_attendance",
    "public.class_announcements",
  ]) {
    assert.match(m3, new RegExp(`create table if not exists ${table.replace(".", "\\.")}`));
    assert.match(m3, new RegExp(`alter table ${table.replace(".", "\\.")} enable row level security;`));
    assert.match(m3, new RegExp(`revoke all on table ${table.replace(".", "\\.")} from public, anon, authenticated;`));
  }
  assert.match(m3, /create unique index if not exists academic_terms_single_active_idx/);
  assert.match(m3, /constraint class_attendance_unique_day unique \(class_id, student_id, session_date\)/);
  assert.match(m3, /alter table public\.assignments[\s\S]*add column if not exists metadata jsonb not null default '\{\}'::jsonb/);
});

test("M3 enforces least-privilege cached RLS policies and covering foreign-key indexes", () => {
  assert.match(m3, /\(select private\.is_admin\(\)\)/);
  assert.match(m3, /\(select private\.can_manage_class\(class_id\)\)/);
  assert.match(m3, /\(select auth\.uid\(\)\)/);
  assert.match(m3, /create index if not exists class_attendance_class_date_idx/);
  assert.match(m3, /create index if not exists class_attendance_student_idx/);
  assert.match(m3, /create index if not exists class_announcements_class_idx/);
  assert.match(m3, /create index if not exists feature_flags_updated_by_idx/);
  assert.match(m3, /create or replace function public\.log_staff_export/);
  assert.match(m3, /grant execute on function public\.log_staff_export\(text, int, jsonb\) to authenticated;/);
});

test("M3 never grants staff/admin bypass onto owner-only private student study tables", () => {
  for (const priv of [
    "flashcard_decks",
    "flashcards",
    "study_tasks",
    "study_mistake_logs",
    "study_sessions",
  ]) {
    assert.doesNotMatch(
      m3,
      new RegExp(`on public\\.${priv}`, "i"),
      `M3 must not add staff RLS policy on private table ${priv}`,
    );
  }
  assert.match(m2, /create policy "study mistake logs owner select" on public\.study_mistake_logs/);
  assert.match(m2, /create policy "study sessions owner select" on public\.study_sessions/);
});

test("recovery rehearsal count and SQL regressions reflect M3 through M6", () => {
  assert.match(rehearsal, /assert\.equal\(delta\.length,37\)/);
  assert.match(regressions, /admin denied read on student private deck/);
  assert.match(regressions, /teacher denied feature flag mutation/);
  assert.match(regressions, /student denied log_staff_export RPC/);
});
