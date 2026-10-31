import assert from "node:assert/strict";
import test from "node:test";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrations = join(root, "supabase", "migrations");

async function source() {
  const file = (await readdir(migrations)).find((name) =>
    name.endsWith("_smart_study_tasks_flashcards.sql"),
  );
  assert.ok(file, "smart study migration is missing");
  return readFile(join(migrations, file), "utf8");
}

test("study tasks and flashcard data are owner scoped with RLS and explicit grants", async () => {
  const sql = await source();
  for (const table of ["study_tasks", "flashcard_decks", "flashcards", "flashcard_reviews"]) {
    assert.match(sql, new RegExp(`create table public\\.${table}\\b`));
    assert.ok(sql.includes(`alter table public.${table} enable row level security`));
  }
  assert.ok(sql.includes("(select auth.uid()) = user_id"));
  assert.ok(sql.includes("from anon, authenticated"));
  assert.ok(sql.includes("grant select on public.flashcard_reviews to authenticated"));
  assert.ok(!/grant\s+insert[^;]+flashcard_reviews/si.test(sql), "reviews are RPC-only");
});

test("flashcard scheduling is server-authoritative and idempotent", async () => {
  const sql = await source();
  assert.ok(sql.includes("create function private.review_flashcard"));
  assert.ok(sql.includes("create function public.review_flashcard"));
  assert.ok(sql.includes("security invoker"));
  assert.ok(sql.includes("where user_id = v_user and idempotency_key = p_idempotency_key"));
  assert.ok(sql.includes("Idempotency key already belongs to another review"));
  assert.ok(sql.includes("where id = p_card_id and user_id = v_user and suspended = false"));
  assert.ok(sql.includes("for update"), "card scheduling must serialize concurrent reviews");
  assert.ok(sql.includes("interval '10 minutes'"));
  assert.ok(sql.includes("least(3650"));
  assert.ok(sql.includes("revoke all on function public.review_flashcard(uuid, int, text) from public, anon"));
});

test("study-only activity cannot mint rewards or mastery", async () => {
  const sql = await source();
  assert.doesNotMatch(sql, /insert\s+into\s+public\.(ledger|skill_evidence|lesson_progress)/i);
  assert.match(sql, /no rewards or mastery are granted/i);
});

test("task completion and deck-card ownership have database constraints", async () => {
  const sql = await source();
  assert.ok(sql.includes("constraint study_task_completion_consistent"));
  assert.ok(sql.includes("constraint flashcards_owner_deck_fkey"));
  assert.ok(sql.includes("references public.flashcard_decks(id, user_id) on delete cascade"));
});
