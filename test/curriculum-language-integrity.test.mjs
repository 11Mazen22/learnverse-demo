import assert from "node:assert/strict";
import test from "node:test";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrations = join(root, "supabase", "migrations");

async function migration(suffix) {
  const filename = (await readdir(migrations)).find((name) => name.endsWith(suffix));
  assert.ok(filename, `migration matching ${suffix} is missing`);
  return readFile(join(migrations, filename), "utf8");
}

test("english-native track lessons declare their render language", async () => {
  const sql = await migration("_curriculum_language_integrity.sql");
  assert.match(sql, /jsonb_build_object\('render_language', 'en'\)/);
  // Only the English-native track is touched; the translated Science and
  // Mathematics English tracks are already correct and the Arabic tracks keep
  // their source-language baseline.
  assert.match(sql, /course\.metadata->>'track' = 'english-en'/);
  // The statement is a guarded, idempotent derivation.
  assert.match(sql, /is distinct from 'en'/);
  // No lesson identity, rewards, ordering, or copy is modified.
  assert.doesNotMatch(sql, /delete from|set title_|set xp_reward|set coin_reward|set position/i);
});

test("published questions can no longer exist unscoped", async () => {
  const sql = await migration("_curriculum_language_integrity.sql");
  assert.match(sql, /add constraint questions_published_scope_check/);
  assert.match(sql, /publication_status not in \('published_demo', 'published'\)/);
  assert.match(sql, /lesson_id is not null\s+or\s+unit_id is not null/s);
  // Constraint creation stays idempotent per house migration rules.
  assert.match(sql, /from pg_constraint/);
  // The demo-draft carve-out is documented, not silently special-cased.
  assert.match(sql, /review workflow/i);
});

test("every performance-advisor foreign key gains a covering index", async () => {
  const sql = await migration("_performance_fk_covering_indexes.sql");
  const expected = [
    ["ai_artifacts_document_owner_idx", "on public.ai_artifacts (source_document_id, user_id)"],
    ["ai_artifacts_own_project_idx", "on public.ai_artifacts (project_id, user_id)"],
    ["ai_artifacts_parent_owner_idx", "on public.ai_artifacts (parent_artifact_id, user_id)"],
    ["ai_document_files_user_recent_idx", "on public.ai_document_files (user_id, expires_at)"],
    ["curriculum_tracks_course_idx", "on public.curriculum_tracks (course_id)"],
    ["flashcards_owner_deck_idx", "on public.flashcards (deck_id, user_id)"],
    ["user_settings_active_design_idx", "on public.user_settings (active_design_id, user_id)"],
  ];
  for (const [indexName, columns] of expected) {
    const pattern = new RegExp(
      `create index if not exists ${indexName}\\s*\\n\\s*${columns
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/ /g, "\\s+")}`,
    );
    assert.match(sql, pattern, `missing covering index: ${indexName}`);
  }
  assert.doesNotMatch(sql, /drop index|drop table|alter table/i, "removes nothing");
});
