// Structural validation for the Noata curriculum subject catalog migration.
// It runs without a database: it checks the catalog shape (six subject families,
// eight selectable tracks), the language-track separation, and the ownership
// policies that keep a learner's track choice private to them.
import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "supabase", "migrations");
const FILE = "20261026120000_curriculum_subject_catalog.sql";

async function catalogMigration() {
  const files = await readdir(migrationsDir);
  assert.ok(files.includes(FILE), `catalog migration ${FILE} is missing`);
  return readFile(join(migrationsDir, FILE), "utf8");
}

/** Rows of a multi-row VALUES list, one per top-level tuple. */
function valueRows(text, marker, endMarker) {
  const start = text.indexOf(marker);
  assert.notEqual(start, -1, `marker not found: ${marker}`);
  const end = text.indexOf(endMarker, start);
  assert.notEqual(end, -1, `end marker not found: ${endMarker}`);
  const block = text.slice(start, end);
  return block
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("('"));
}

test("the catalog migration is a single guarded do-block", async () => {
  const text = await catalogMigration();
  assert.equal((text.match(/\$\$/g) ?? []).length, 2, "$$ must appear exactly twice");
  assert.equal((text.match(/do \$\$/g) ?? []).length, 1, "exactly one do $$ block");
});

test("the catalog creates the subject, track and enrollment tables with RLS", async () => {
  const text = await catalogMigration();
  for (const table of ["public.subjects", "public.curriculum_tracks", "public.curriculum_enrollments"]) {
    assert.ok(text.includes(`create table if not exists ${table}`), `${table} is not created`);
    assert.ok(text.includes(`alter table ${table} enable row level security`), `${table} has no RLS`);
  }
  assert.ok(
    text.includes("create policy \"enrollments own read\" on public.curriculum_enrollments"),
    "enrollment reads must be owner scoped",
  );
  assert.ok(
    text.includes("user_id = (select auth.uid())"),
    "enrollment policies must bind to the authenticated owner",
  );
  assert.ok(
    text.includes("(select private.is_admin())"),
    "catalog writes must stay behind the server-side admin check",
  );
  assert.ok(
    text.includes("grant select on public.subjects, public.curriculum_tracks to anon, authenticated"),
    "new catalog tables must be explicitly exposed through the Data API",
  );
  assert.ok(
    !text.includes('create policy "subjects admin delete"'),
    "browser roles must not delete canonical subject records",
  );
});

test("the catalog seeds exactly the six core subject families", async () => {
  const text = await catalogMigration();
  const rows = valueRows(text, "insert into public.subjects", "on conflict (slug) do update");
  assert.equal(rows.length, 6, "expected six subject families");
  const slugs = rows.map((row) => row.split(",")[0].replace(/[(']/g, ""));
  assert.deepEqual(slugs.sort(), [
    "arabic-language",
    "english",
    "history",
    "integrated-science",
    "mathematics",
    "philosophy-logic",
  ]);
});

test("the catalog seeds eight tracks: two for Science and Mathematics, one for the rest", async () => {
  const text = await catalogMigration();
  const rows = valueRows(
    text,
    "insert into public.curriculum_tracks",
    "on conflict (subject_id, content_language) do update",
  );
  assert.equal(rows.length, 8, "expected eight selectable tracks");
  const bySubject = new Map();
  for (const row of rows) {
    const [subjectSlug, trackSlug, language] = row
      .split(",")
      .map((part) => part.trim().replace(/[(')]/g, ""));
    const list = bySubject.get(subjectSlug) ?? [];
    list.push({ trackSlug, language });
    bySubject.set(subjectSlug, list);
  }
  assert.deepEqual(bySubject.get("integrated-science"), [
    { trackSlug: "integrated-science-ar", language: "ar" },
    { trackSlug: "integrated-science-en", language: "en" },
  ]);
  assert.deepEqual(bySubject.get("mathematics"), [
    { trackSlug: "mathematics-ar", language: "ar" },
    { trackSlug: "mathematics-en", language: "en" },
  ]);
  for (const subject of ["history", "arabic-language", "english", "philosophy-logic"]) {
    assert.equal(bySubject.get(subject).length, 1, `${subject} must not be duplicated into two tracks`);
  }
});

test("each track owns its own course, so lessons and progress never merge", async () => {
  const text = await catalogMigration();
  assert.ok(
    text.includes("'first-secondary-term1-' || t.slug"),
    "every track must get its own course",
  );
  assert.ok(
    text.includes("set course_id = v_course"),
    "published content must move into its own track course",
  );
  assert.ok(
    text.includes("update public.skills"),
    "track skills must move with their track so mastery stays isolated",
  );
});

test("the English-medium tracks are explicit renderings with their own rows", async () => {
  const text = await catalogMigration();
  assert.ok(text.includes("'translation_track', true"), "English tracks must be marked as translations");
  assert.ok(
    text.includes("An English rendering of the Arabic study notes; it is not an official English-medium textbook."),
    "the translation caveat must stay visible",
  );
  assert.ok(text.includes("s.slug || '-en'"), "English lessons get their own rows");
  assert.ok(text.includes("variant_of"), "English questions must link back to their Arabic variant");
  assert.ok(text.includes("s.id,"), "variant_of must point at the source question");
  assert.ok(
    text.includes("'render_language', 'en'"),
    "English lessons must declare their render language",
  );
});

test("the umbrella program course is archived, never deleted", async () => {
  const text = await catalogMigration();
  assert.ok(text.includes("set active = false"), "the umbrella course must stop being selectable");
  assert.ok(text.includes("'role', 'program'"), "the umbrella course must document why it was split");
  assert.ok(!text.includes("delete from public.courses"), "courses are never deleted");
  assert.ok(!text.includes("delete from public.lessons"), "lessons are never deleted");
});
