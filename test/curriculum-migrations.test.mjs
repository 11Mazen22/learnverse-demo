// Structural validation for the First Secondary Term 1 curriculum migrations.
// These checks run without a database: they verify the migration files parse
// sanely, every jsonb payload is valid JSON, choice indexes stay in range,
// every question insert is guarded (idempotent re-import), and the Philosophy
// official-lesson distinction is preserved. Full SQL execution is covered by
// scripts/database-migrations-smoke.mjs where Docker/PostgreSQL is available.
import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "supabase", "migrations");
const PREFIX = "20261025";
const SOURCE_SHA = "2b7fc53252e02b1885df3c1d3141d163bb038eb6cb4d917c0d0c29addcfb5c28";

async function curriculumMigrations() {
  const files = (await readdir(migrationsDir)).filter((name) => name.startsWith(PREFIX)).sort();
  return Promise.all(
    files.map(async (name) => ({ name, text: await readFile(join(migrationsDir, name), "utf8") })),
  );
}

/** Single-quote parity per line proves no unterminated SQL string literal. */
function assertQuoteParity({ name, text }) {
  const offending = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const code = line.replace(/^(?=.*--) (.*?)--.*$/, "$1");
    const withoutInlineComment = code.split("--")[0] === code ? code : code.slice(0, code.indexOf("--"));
    const subject = line.trimStart().startsWith("--") ? "" : withoutInlineComment;
    if ((subject.match(/'/g) ?? []).length % 2 === 1) offending.push(`line ${index + 1}`);
  }
  assert.deepEqual(offending, [], `${name}: unbalanced single quotes on lines ${offending.join(", ")}`);
}

/** Pull every '…'::jsonb literal (global scan, multiple per line allowed) and verify it parses. */
function jsonbPayloads({ name, text }) {
  const payloads = [];
  const pattern = /'((?:[^']|'')*)'::jsonb/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const raw = match[1].replace(/''/g, "'");
    try {
      payloads.push(JSON.parse(raw));
    } catch (error) {
      assert.fail(`${name}: invalid jsonb literal "${raw.slice(0, 80)}…" — ${error.message}`);
    }
  }
  return payloads;
}

test("the seven curriculum migration files exist in a stable order", async () => {
  const files = await curriculumMigrations();
  assert.equal(files.length, 7, "expected manifest + six subject migrations");
  assert.match(files[0].name, /manifest/);
  assert.match(files[1].name, /philosophy/);
  assert.match(files[2].name, /science/);
  assert.match(files[3].name, /mathematics/);
  assert.match(files[4].name, /arabic/);
  assert.match(files[5].name, /english/);
  assert.match(files[6].name, /history/);
});

test("every migration is a single guarded do-block with balanced dollar quotes", async () => {
  for (const file of await curriculumMigrations()) {
    assert.equal((file.text.match(/\$\$/g) ?? []).length, 2, `${file.name}: $$ must appear exactly twice`);
    assert.equal((file.text.match(/do \$\$/g) ?? []).length, 1, `${file.name}: exactly one do $$ block`);
    assert.equal(file.text.includes("create table"), false, `${file.name}: migrations must not create tables`);
    assert.equal(file.text.includes("alter table"), false, `${file.name}: migrations must not alter tables`);
    assertQuoteParity(file);
  }
});

test("provenance metadata and source hash are preserved in every subject migration", async () => {
  for (const file of (await curriculumMigrations()).slice(1)) {
    assert.ok(file.text.includes(SOURCE_SHA), `${file.name}: source sha256 missing`);
    assert.ok(file.text.includes("first_secondary_term1_first_lessons_study_pack_2026_2027.txt"), `${file.name}: source document missing`);
    assert.ok(file.text.includes("provenance_ar"), `${file.name}: Arabic provenance missing`);
    assert.ok(file.text.includes("provenance_en"), `${file.name}: English provenance missing`);
  }
});

test("every jsonb payload parses and answer indexes stay within the choices", async () => {
  const files = await curriculumMigrations();
  const subjectFiles = files.slice(1);
  let multipleChoice = 0;
  let numeric = 0;
  let bossQuestions = 0;
  for (const file of subjectFiles) {
    const payloads = jsonbPayloads(file);
    assert.ok(payloads.length > 0, `${file.name}: no jsonb payloads found`);
    for (const payload of payloads) {
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        if (payload.type === "multiple-choice") {
          multipleChoice += 1;
          const index = Number(payload.correctAnswer);
          assert.ok(Number.isInteger(index) && index >= 0 && index <= 3, `${file.name}: multiple-choice correctAnswer out of range`);
        } else if (payload.type === "numeric") {
          numeric += 1;
          assert.ok(typeof payload.correctAnswer === "number", `${file.name}: numeric correctAnswer must be a number`);
          assert.ok(typeof payload.tolerance === "number" && payload.tolerance >= 0, `${file.name}: numeric tolerance must be >= 0`);
        }
        if (payload.boss === true) bossQuestions += 1;
      }
    }
    // choices arrays for questions are validated below against the answer specs
  }
  assert.ok(multipleChoice >= 100, `expected at least 100 multiple-choice specs, found ${multipleChoice}`);
  assert.ok(numeric >= 6, `expected at least 6 numeric specs, found ${numeric}`);
  assert.equal(bossQuestions, 18, "each of the six subject units contributes exactly three boss questions");
});

test("choice arrays pair with question types and every question insert is guarded", async () => {
  const subjectFiles = (await curriculumMigrations()).slice(1);
  for (const file of subjectFiles) {
    const pattern = /'((?:[^']|'')*)'::jsonb/g;
    const choicesArrays = [];
    let match;
    while ((match = pattern.exec(file.text)) !== null) {
      const raw = match[1].replace(/''/g, "'");
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) choicesArrays.push(parsed);
      } catch { /* non-array jsonb payloads already validated */ }
    }
    const fourChoice = choicesArrays.filter((array) => array.length === 4).length;
    const emptyChoice = choicesArrays.filter((array) => array.length === 0).length;
    assert.equal(fourChoice % 2, 0, `${file.name}: choice arrays must come in Arabic/English pairs of four`);
    assert.equal(emptyChoice % 2, 0, `${file.name}: numeric questions carry empty Arabic/English choice pairs`);
    const questionInserts = (file.text.match(/insert into public\.questions/g) ?? []).length;
    const questionGuards = (file.text.match(/from public\.questions where/g) ?? []).length;
    assert.ok(
      questionGuards >= questionInserts,
      `${file.name}: every question insert needs a natural-key guard (${questionGuards} guards for ${questionInserts} inserts)`,
    );
    const keyInserts = (file.text.match(/insert into public\.question_keys/g) ?? []).length;
    const keyDeletes = (file.text.match(/delete from public\.question_keys where question_id/g) ?? []).length;
    assert.equal(keyInserts, keyDeletes, `${file.name}: each key insert must be preceded by its refresh delete`);
    assert.ok(fourChoice / 2 + emptyChoice / 2 === keyInserts, `${file.name}: choice pairs (${fourChoice / 2 + emptyChoice / 2}) should equal question count (${keyInserts})`);
  }
});

test("lesson upserts are idempotent and target only their own unit", async () => {
  const subjectFiles = (await curriculumMigrations()).slice(1);
  for (const file of subjectFiles) {
    const lessonUpserts = (file.text.match(/insert into public\.lessons/g) ?? []).length;
    const lessonConflicts = (file.text.match(/on conflict \(unit_id, slug\) do update/g) ?? []).length;
    assert.equal(lessonUpserts, lessonConflicts, `${file.name}: lesson inserts must conflict-update on (unit_id, slug)`);
    assert.equal(file.text.includes("insert into public.units"), false, `${file.name}: units come from the manifest, not subject migrations`);
    assert.equal(file.text.includes("insert into public.courses"), false, `${file.name}: courses come from the manifest, not subject migrations`);
  }
});

test("Philosophy keeps four official lessons and one clearly non-official review", async () => {
  const philosophy = (await curriculumMigrations()).find((file) => file.name.includes("philosophy"));
  assert.ok(philosophy, "philosophy migration missing");
  assert.equal((philosophy.text.match(/'official_lesson', true/g) ?? []).length, 4, "exactly four official lessons");
  assert.equal((philosophy.text.match(/'official_lesson', false/g) ?? []).length, 1, "exactly one non-official review module");
  assert.ok(philosophy.text.includes("مراجعة إضافية — ليست درسًا رسميًا"), "the review lesson title must keep the not-official label");
  assert.ok(philosophy.text.includes("Not an Official Lesson"), "English title must keep the not-official label");
});

test("the study-pack caveat stays visible across subjects", async () => {
  for (const file of (await curriculumMigrations()).slice(1)) {
    assert.ok(
      file.text.includes("دليل مذاكرة أصلي") || file.text.includes("original detailed study guide"),
      `${file.name}: the original-study-guide provenance caveat is missing`,
    );
  }
});
