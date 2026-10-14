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
