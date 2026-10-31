# The Noata curriculum catalog

This document is the reference for the six-subject / eight-track curriculum
model introduced by `supabase/migrations/20261026120000_curriculum_subject_catalog.sql`.

## 1. Shape

```
public.subjects                  the six canonical subject families
  └── public.curriculum_tracks   eight selectable tracks (Science and Mathematics
                                    each expose Arabic-medium and English-medium)
        └── courses              one course per track
              └── units
                    └── lessons
                          └── questions
public.curriculum_enrollments  the learner's own track selection (owner-scoped)
```

The six subjects are `integrated-science`, `mathematics`, `history`,
`arabic-language`, `english`, and `philosophy-logic`. The eight tracks:

- `integrated-science-ar`, `integrated-science-en`
- `mathematics-ar`, `mathematics-en`
- `history-ar`
- `arabic-language-ar`
- `english-en`
- `philosophy-logic-ar`

Science and Mathematics each expose two independently selectable tracks;
History, Arabic, English and Philosophy stay single-subject with one track.

## 2. Guarantees

- **Track isolation**: every track owns its course / units / lessons / questions /
  skills. Nothing is shared, so Arabic-track mastery never mixes with the
  English-track mastery for the same subject.
- **Persistent selection**: `curriculum_enrollments` is owner-scoped (RLS on
  `auth.uid() = user_id`). The `/learn` hub reads the latest enrollment and
  restores the track on load.
- **Interface independence**: the interface language (RTL/LTR) is a rendering
  setting; the track's `content_language` determines the curriculum content.
- **Admin control**: `subjects` and `curriculum_tracks` are public-read but
  writable only through `private.is_admin()`. Publication status
  (`published` / `pending_source` / `draft` / `retired`) is managed per track.

## 3. Provenance rules

- Source: `docs/first_secondary_term1_first_lessons_study_pack_2026_2027.txt`
  (sha256 `2b7fc532…5c28`). The study pack is an original detailed study guide —
  not a verbatim official textbook — and that caveat is preserved in
  `metadata` of every subject, track, course and unit.
- English-medium tracks (`integrated-science-en`, `mathematics-en`) are
  explicit English renderings of the same Arabic source (separate lesson
  rows with `variant_of` question links), labelled clearly as translations,
  never presented as an official English-medium curriculum.
- No fabricated content is added when a source is missing; the truth is
  shown in the UI (e.g. "Not published yet" / "Content is under review").

## 4. Data model details

- `subjects` (6): `slug` / `canonical_key` unique; `grade_level`, `term`,
  `position`, `accent` (UI color per family), `active` toggle.
- `curriculum_tracks` (8): `subject_id` FK + `slug` unique +
  `(subject_id, content_language)` unique; `course_id` links to the track's
  own course; `publication_status`; `metadata` for provenance.
- `curriculum_enrollments`: `user_id` / `track_id` unique; owner-scoped RLS;
  `status` (`active` / `paused` / `completed`).
- All three tables have RLS (public read for catalog, admin-write via
  `is_admin()`), `updated_at` triggers, and index coverage on population
  queries.

## 5. Verification (real Postgres, not claims)

PGlite (WASM Postgres) replayed the full migration sequence:
- 6 subjects, 8 tracks, 8 active track courses, 1 archived umbrella
- 11 units (8 track + 3 demo from 0009), 55 lessons (46 curriculum + 9 demo),
  256 questions (195 curriculum + 61 demo), 32 skills
- 0 shared lessons / 0 shared skills / 79 English `variant_of` questions /
  0 broken prerequisite links / 0 Arabic lessons incorrectly marked as
  translations / 12 RLS policies / catalog idempotent on second run.
- The `20261025113000_first_secondary_mathematics.sql` pre-existing
  `v_skill_solving` bug was fixed (added declaration) before replay.

## 6. What is blocked / truthful

- The new catalog migration (`20261026120000`) and the updated
  `noata-ai` edge function have **not** been applied to any reachable
  environment. The approved staging (`vpfpjvhafkmygetjkfcp`) is unreachable
  through the available Supabase MCP (only production `jdkfqdzgphzqbbzmerzr`
  and an unrelated pharmacy project `gntpxffonjvnvadjclpl` are visible),
  and production changes are prohibited.
- `pnpm modern:test` passes 521/521 for all non-environmental tests; the
  12 reported failures are only the two missing binaries (`pdftoppm`
  `ENOENT`; `python3` `EOF`) on the Windows host.
- `pnpm build` exits 0; `pnpm check:text` passes; `pnpm typecheck` passes.

Keep this file in `docs/` so the migration header reference stays true.
