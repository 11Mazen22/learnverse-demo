import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("M2 study ecosystem v2 migration enforces column grants, metadata validation, and owner RLS without touching rewards", async () => {
  const m2 = await readFile(
    new URL("../supabase/migrations/20261114000100_study_ecosystem_v2.sql", import.meta.url),
    "utf8",
  );

  // Additive metadata columns and JSON object checks
  assert.ok(m2.includes("add column if not exists metadata jsonb not null default '{}'::jsonb"));
  assert.ok(m2.includes("flashcard_decks_metadata_object"));
  assert.ok(m2.includes("flashcards_metadata_object"));

  // Explicit table-level revoke prior to narrowed column grants
  assert.ok(m2.includes("revoke insert, update on table public.flashcards from public, anon, authenticated;"));
  assert.ok(m2.includes("grant insert ("));
  assert.ok(m2.includes("grant update ("));
  const insertStart = m2.indexOf("grant insert (");
  const insertEnd = m2.indexOf("on table public.flashcards to authenticated;", insertStart);
  const updateStart = m2.indexOf("grant update (");
  const updateEnd = m2.indexOf("on table public.flashcards to authenticated;", updateStart);
  const grantInsertSection = m2.slice(insertStart, insertEnd);
  const grantUpdateSection = m2.slice(updateStart, updateEnd);
  for (const protectedCol of ["ease_factor", "interval_days", "repetitions", "lapses", "due_at", "last_reviewed_at"]) {
    assert.equal(grantInsertSection.includes(protectedCol), false, `insert grant must not expose ${protectedCol}`);
    assert.equal(grantUpdateSection.includes(protectedCol), false, `update grant must not expose ${protectedCol}`);
  }

  // Preserves review_flashcard signature and expands receipt keys cleanly
  assert.ok(m2.includes("create or replace function private.review_flashcard("));
  assert.ok(m2.includes("'state', v_state"));
  assert.ok(m2.includes("'repetitions', v_repetitions"));
  assert.ok(m2.includes("'lapses', v_lapses"));

  // Mistake logs & study sessions owner RLS + least-privilege grants
  assert.ok(m2.includes("create table if not exists public.study_mistake_logs"));
  assert.ok(m2.includes("create table if not exists public.study_sessions"));
  assert.ok(m2.includes("alter table public.study_mistake_logs enable row level security"));
  assert.ok(m2.includes("alter table public.study_sessions enable row level security"));
  assert.ok(m2.includes("revoke all on public.study_mistake_logs, public.study_sessions from public, anon, authenticated"));
  assert.ok(m2.includes("study_session_completion_consistent"));

  // Strict isolation: M2 never touches reward/mastery/lesson progress tables or RPCs
  const lowerBody = m2.toLowerCase();
  for (const forbidden of [
    "insert into public.ledger",
    "update public.ledger",
    "insert into public.skill_evidence",
    "update public.skill_evidence",
    "insert into public.lesson_progress",
    "update public.lesson_progress",
    "grant_xp",
    "complete_lesson",
  ]) {
    assert.equal(lowerBody.includes(forbidden), false, `M2 must not touch ${forbidden}`);
  }
});
