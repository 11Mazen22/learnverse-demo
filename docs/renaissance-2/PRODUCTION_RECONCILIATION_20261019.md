# Production Database Reconciliation — 2026-10-19

Owner-authorized production maintenance on the Noata production project (`jdkfqdzgphzqbbzmerzr`, `eu-west-2`), executed under the release-gate policy in `RELEASE_GATES.md` with the owner's explicit direction: verified logical backup first, read-only preflight second, ordered apply third, verification last. No paid Supabase development branch was created or used.

## Scope

Two repository migrations were pending in production relative to the codebase validated by CI:

| Repository file | Bytes | SHA-256 (working tree) |
| --- | --- | --- |
| `supabase/migrations/20261017175911_respiratory_system_learning_pathway.sql` | 136,327 | `77248ce7faf01675ab22ca34e85086f11e6cbec4a201f22135c179675c1ede95` |
| `supabase/migrations/20261019193000_submission_grading_integrity.sql` | 1,656 | `a4a6f093cdbb7506916c6c326913aafabe42e173fef77f7bf37751fa0fdae6c4` |

The applied SQL matched these exact bytes (byte-length and hash verified through the local transfer path used to submit them).

## Preflight (read-only, before any write)

- **Project identity:** the MCP server used is pinned to `project_ref=jdkfqdzgphzqbbzmerzr` (production). No other Supabase project was touched.
- **Migration ledger:** 33 entries ending at `20261014193707 noata_document_probe_privileges`; exactly the two migrations above were missing, in that order.
- **Data-loss analysis:**
  - `assignment_submissions` = 0 rows, `assignments` = 0, `classes` = 0 → the grading repair `UPDATE` matched 0 rows; `score is not null and submitted_at is null` = 0 → no invalid grades existed.
  - The respiratory migration is additive: 1 unit, 7 lessons, 3 skills, 48 questions + 48 keys. Its conditional repairs matched 0 rows (`motion-basics` Q1 was already `published_demo`, not `retired`).
  - No `DELETE`, `DROP TABLE` or destructive statement runs against existing user data.
- **Table-shape check:** every column and nullability the migrations write matches the CI-validated schema; `questions.unit_id` stays NULL for lesson questions by design (`CHECK` constraint forbids both `lesson_id` and `unit_id` on one row).

## Backup (created and verified)

- **Command:** `pg_dump --format=custom --no-owner --no-privileges` over the shared IPv4 session pooler using the PostgreSQL 17.7 client.
- **Artifact:** `noata-production-20261019-221808.dump`, 613,102 bytes, retained outside the repository on the operator machine (a second off-machine copy is recommended).
- **SHA-256:** `c51133d737def6a744c8469da9cc4fc7430d586a2179b732ee46ad1ceace684e`.
- **Verification:**
  - `pg_dump` exit code 0; `pg_restore --list` parsed the archive with 856 TOC entries and 0 parse errors.
  - Full restore into a throwaway local PostgreSQL 17.7 cluster: exit 0, 0 errors, all 38 `public` tables created; every non-zero table's row count matched production exactly (e.g. profiles 4, units 2, lessons 2, skills 2, questions 19, question_keys 19, attempts 11, ledger 12, ai_conversations 32, ai_messages 136, ai_usage_events 185, ai_request_receipts 77).
- No secret was written into the repository, CI or these documents.

## Applied migrations (in order, recorded in the production ledger)

| Version | Name |
| --- | --- |
| `20261019193028` | `respiratory_system_learning_pathway` |
| `20261019193030` | `submission_grading_integrity` |

Versions are apply-time timestamps; the ledger order above is the required apply order.

## Post-apply verification

- **Curriculum (respiratory pathway):** units 2 → 3, unit-3 lessons 7, skills 2 → 5, respiratory questions 48, respiratory keys 48; totals questions 19 → 67 and question_keys 19 → 67. All 48 new questions and 48 keys are present with `published_demo` publication status.
- **Grading integrity:** `assignment_submissions_score_requires_submission` CHECK constraint present; `submissions scoped update` policy now additionally requires `submitted_at is not null`; invalid grades remain 0.
- **Row-level security:** enabled on all 38 `public` tables (38/38).
- **Role-visibility check:**
  - `anon` / `authenticated` can read 9 lessons, 3 units, 5 skills and 66 of the 67 questions — the single hidden question is one pre-existing `draft` row, correctly excluded by RLS.
  - `anon` / `authenticated` read 0 `question_keys`; answer keys remain staff/service-role only.
- **Security advisors:** identical findings before and after (1 INFO `rls_enabled_no_policy` on `ai_request_receipts` by design, 2 WARN SECURITY DEFINER functions with internal guards, 1 WARN leaked-password protection). No new advisories were introduced.
- **CI at the applied revision:** `c00bd940a5e72e0e40ac7f3e8ef81427132659bd` passed run `39308483048` (`verify` job: migrations + authorization regressions, build, browser RTL/responsive smoke, HTTP smoke, release-evidence enforcement; plus the intentional-tooltip browser job).

## Guardrails preserved

- PR #37 remains Draft; no production deployment or domain change was made as part of this work.
- No credentials were added to the repository; the database credential used for the backup is stored outside the repository and should be rotated because it was shared in chat once.
- No Supabase plan change, paid provider activation or unrelated environment was used.

## Reproducing the backup (operator procedure)

1. Use a PostgreSQL client at least matching the server major version (17.x here); the portable EDB Windows binaries work without Docker.
2. Run `pg_dump --format=custom --no-owner --no-privileges --dbname "<session-pooler-URI>" --file noata-production-<stamp>.dump` against the IPv4 shared session pooler. Keep the connection string out of the repository and shell history.
3. Verify before trusting the archive: `pg_restore --list` must parse with no errors; record the SHA-256; restore into a throwaway cluster and compare `count(*)` per `public` table against production.
4. Retain the dump and its hash outside the repository; keep a second off-machine copy.
