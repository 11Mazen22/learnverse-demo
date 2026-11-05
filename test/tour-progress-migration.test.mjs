import assert from "node:assert/strict";
import test from "node:test";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrations = join(root, "supabase", "migrations");

async function migration() {
  const filename = (await readdir(migrations)).find((name) =>
    name.endsWith("_role_aware_tour_progress.sql"),
  );
  assert.ok(filename, "role-aware tour migration is missing");
  return readFile(join(migrations, filename), "utf8");
}

test("tour progress is owner-scoped, role-aware, and explicitly exposed", async () => {
  const sql = await migration();
  assert.match(sql, /create table public\.user_tour_progress/);
  assert.match(sql, /primary key \(user_id, role, tour_id\)/);
  assert.match(sql, /alter table public\.user_tour_progress enable row level security/);
  assert.match(sql, /\(select auth\.uid\(\)\) = user_id/);
  assert.match(sql, /role = \(\s*select profile\.role/s);
  assert.match(sql, /revoke all on public\.user_tour_progress from anon, authenticated/);
  assert.match(sql, /grant select, insert, update, delete on public\.user_tour_progress to authenticated/);
});

test("tour progress stores no page content or learner answers", async () => {
  const sql = await migration();
  assert.doesNotMatch(sql, /answer_text|page_content|prompt_content|message_content/i);
  assert.match(sql, /Stores no page content, prompts, or learner answers/i);
});

test("tour completion timestamps cannot claim unfinished tours are complete", async () => {
  const sql = await migration();
  assert.match(sql, /user_tour_progress_completion_consistent/);
  assert.match(sql, /status = 'completed' and completed_at is not null/);
  assert.match(sql, /status <> 'completed' and completed_at is null/);
});
