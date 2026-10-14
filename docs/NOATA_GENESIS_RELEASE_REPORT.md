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

Preview-only overrides for this branch target approved staging `vpfpjvhafkmygetjkfcp` and disable inherited unrelated administrator/database credentials. Retained-original storage and QA bootstrap remain disabled. No production settings change.

`BRAVE_SEARCH_API_KEY` and `NOATA_SEARCH_ENABLED=true` are required in the **staging Edge Function secrets** for real research. Optional `NOATA_SEARCH_PROVIDER=brave` and `NOATA_RESEARCH_MAX_QUERIES=1..3` control the adapter/budget. Default budget remains one; no paid service was provisioned. Web environment values do not configure Edge Function secrets.

See the capability audit, architecture, security review, test matrix and recovery runbook beside this report for exact limits. This is a meaningful development candidate, **not completion of the whole Genesis acceptance contract**. Live role/OAuth/provider/storage, generative editing, full artifact fidelity and real recovery remain required. Do not promote it merely because a build passes.

## Reproduce and rollback

Use Node 24 and pnpm 10.17.1. Run frozen install, `pnpm check:text`, `pnpm typecheck`, `pnpm modern:test`, Deno handler check, `pnpm build`, document/browser fixtures and `pnpm legacy:check`. Run live acceptance only with authorized isolated identities/configuration. Preserve failed results; no disabled assertions or silent skips.

Production rollback is unnecessary because no promotion occurred. For candidate rollback, revert the branch changes while keeping the current production revision. Staging function deployment must preserve and identify its preceding source version before replacement. Final PR/CI/preview status must be obtained for the actual committed revision, never inferred from this document.

## Connected staging evidence

Draft PR [#15](https://github.com/11Mazen22/learnverse-demo/pull/15). Initial source `ebf4eb54a1018983f9b17e05556a483596c188e7` has a READY preview `dpl_6T1esSog2FWnhhSWNVfCBCgMDrxo`; `/health` reports that revision with security headers and QA endpoint 404. Staging AI v38 is ACTIVE/JWT protected; its 23 retrieved source files match, bundle `72b499fe70de74b026c59651b7a957e6cc41c1fa90080ecaab29939659e32995`. Production remains unchanged. Fresh read-only SQL confirms 33 migrations/38 public tables/all RLS in both projects.

Initial PR compatibility run [38646227194](https://github.com/11Mazen22/learnverse-demo/actions/runs/38646227194) tested merge revision `fe26f1fde2e53d60c8a17d8d3e4c0bf02c41d39a`. It passed dependencies, TypeScript, 405 modern tests, Deno, database/recovery fixtures, document rendering, builds, Chrome startup and manual PNG transforms, then failed the new 390px editor geometry assertion. The real downloaded DOCX and readback had passed. The candidate now constrains the editor grid tracks, waits for finite resize transitions and records actual geometry/screenshots before the unchanged fit assertion. A subsequent full run is required; this failed run is not release acceptance.
