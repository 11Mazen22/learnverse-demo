# Genesis development handoff

Branch: `noata-genesis-capabilities-20261015`, based on verified master `9d5d2a1bd3c3783e1b7b89f85906299651489492`. Production deployment remains `dpl_8E4v2T7Em8r12NLEfbkWiNwr7QQh` at `c43726d5237fa209740f9f0e9e425c310547142e`.

## Implemented

- Server-only Brave adapter, independently retained official/source scope, configurable bounded sequential retrieval, actual query/source receipts, partial-failure reporting and strict persisted evidence validation.
- Citation ID/destination checks and researched-link restrictions. Actual retrieved references propagate into Office exports as well as PDF/DOCX.
- Targeted DOCX/PPTX/XLSX original-package edits with explicit limitations, original/new text comparison, download and owner-scoped version save. Independent fixtures verify preservation of unrelated compressed media/chart/theme/note/formula parts.
- Original-object PDF page reordering/quarter-turn rotation, contextual download/private save and rejection of active/signed/form/encrypted inputs. Poppler pixel comparison verifies an untouched page in the bounded fixture.
- Responsive contextual editing controls and new regression/CI coverage. Existing Quran/Mushaf and model picker are preserved.

New runtime dependency: exact `pdf-lib@1.17.1`; lockfile generated with pinned pnpm 10.17.1. CI installs Poppler for independent raster checks. No database migration.

## Configuration and release gate

The current branch-scoped Preview `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` both resolve to approved Staging `vpfpjvhafkmygetjkfcp`, not Production `jdkfqdzgphzqbbzmerzr`. The web app's Supabase client uses the public publishable key. Vercel metadata also lists administrator/database variable names scoped to this Preview branch; their values were not decrypted or inspected, so this report does not claim they are empty or Staging-specific. `NOATA_STAGING_QA_ENABLED` and `NOATA_DOCUMENT_STORAGE_ENABLED` are false. No Production setting changed.

`BRAVE_SEARCH_API_KEY` and `NOATA_SEARCH_ENABLED=true` are required in the **staging Edge Function secrets** for real research. Optional `NOATA_SEARCH_PROVIDER=brave` and `NOATA_RESEARCH_MAX_QUERIES=1..3` control the adapter/budget. Default budget remains one; no paid service was provisioned. Web environment values do not configure Edge Function secrets.

See the capability audit, architecture, security review, test matrix and recovery runbook beside this report for exact limits. This is a meaningful development candidate, **not completion of the whole Genesis acceptance contract**. Live role/OAuth/provider/storage, generative editing, full artifact fidelity and real recovery remain required. Do not promote it merely because a build passes.

## Reproduce and rollback

Use Node 24 and pnpm 10.17.1. Run frozen install, `pnpm check:text`, `pnpm typecheck`, `pnpm modern:test`, Deno handler check, `pnpm build`, document/browser fixtures and `pnpm legacy:check`. Run live acceptance only with authorized isolated identities/configuration. Preserve failed results; no disabled assertions or silent skips.

Production rollback is unnecessary because no promotion occurred. For candidate rollback, revert the branch changes while keeping the current production revision. Staging function deployment must preserve and identify its preceding source version before replacement. Final PR/CI/preview status must be obtained for the actual committed revision, never inferred from this document.

## Connected staging evidence

Draft PR [#15](https://github.com/11Mazen22/learnverse-demo/pull/15). Historical initial source `ebf4eb54a1018983f9b17e05556a483596c188e7` had a READY preview. The prior database inventory recorded 33 migrations and 38 public tables/all RLS in both projects; the latest direct live SQL acceptance attempt was blocked by the automatic approval usage limit and is not claimed as rechecked here.

Historical PR compatibility run [38646227194](https://github.com/11Mazen22/learnverse-demo/actions/runs/38646227194) tested merge revision `fe26f1fde2e53d60c8a17d8d3e4c0bf02c41d39a` and found a 390px editor-geometry failure. That was fixed and followed by successful exact-head CI; see the refreshed evidence below.

## Final Staging acceptance attempt — 2026-10-15

- PR #15 remains open and Draft, base `master`, head `9d12cfd78aa2f6e6f24dd5a3d931e660aeb06c29`; it is not merged.
- Vercel project `noata` deployed the candidate branch at READY deployment `dpl_DoYdFrEFRTH28JwCc6GnFc5JXD6Q`. Git metadata names the exact branch and commit; GitHub labels the alias as Preview. `/health` returned the same commit at `2026-10-15T03:30:08Z`.
- The Preview selects `noata-ai-v2`. Staging `noata-ai-v2` v38 is ACTIVE with JWT verification enabled. All 23 files returned by the Supabase function-source endpoint hash-match the local candidate after normalizing line endings; bundle hash is `72b499fe70de74b026c59651b7a957e6cc41c1fa90080ecaab29939659e32995`.
- Branch-scoped public/server Supabase URLs match Staging and not Production. The Supabase Edge Function secret inventory is unavailable through the connected Supabase tools; no Brave secret was read or changed. No live Brave query occurred.
- Preview `/api/qa-target` returned 404 `{"enabled":false}`. `/api/documents?capabilities=1` returned `{"retention":false,"library":true}`. There was no authenticated Noata QA session open, so role, cross-account, upload, download, and unauthorized-mutation checks were not attempted.
- Existing encrypted recovery evidence is partial: archive integrity, database fixture restore and data checks passed, while binary Storage backup remains pending for four objects and Production/local ICU versions differ. Hosted Auth/Storage recovery is not established. See `NOATA_GENESIS_RECOVERY.md`.
- Exact-head CI [38672293164](https://github.com/11Mazen22/learnverse-demo/actions/runs/38672293164) succeeded on this commit: 408 modern tests, TypeScript, Deno, build, 125 local PostgreSQL authorization assertions, recovery fixtures, Arabic PDF/DOCX, image-edit PNG readback, 1,304 browser assertions/301 screenshots, Production HTTP smoke and aggregate legacy suite. These checks are not the blocked live acceptance gates. See `NOATA_GENESIS_TEST_MATRIX.md`.
- No Production schema/data/function/secret/environment/deployment changed. Live Brave, authenticated cross-account, fresh direct SQL, missing Storage-byte recovery and full collation/hosted-service recovery remain release blockers. Keep the PR in Draft.
