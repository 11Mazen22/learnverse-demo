# Genesis capability audit — 15 October 2026

Baseline: `9d5d2a1bd3c3783e1b7b89f85906299651489492`. This audit supersedes historical capability descriptions, not historical evidence. Development branch: `noata-genesis-capabilities-20261015`. Production promotion requires separate authorization.

## Fresh evidence

- Clean Git checkout matches the supplied master checkpoint. GitHub reports no open PRs.
- Vercel deployment `dpl_8E4v2T7Em8r12NLEfbkWiNwr7QQh` is READY, production target, revision `c43726d5237fa209740f9f0e9e425c310547142e`.
- Supabase production metadata reports ACTIVE_HEALTHY, PostgreSQL 17.11. AI function `noata-ai-v2` is ACTIVE v6, JWT verification enabled, bundle SHA-256 matches the brief. Branch inventory is empty.
- Baseline local modern suite: 383 passed, zero failed/skipped. Baseline TypeScript passed. These are source checks, not live-provider acceptance.
- Fresh read-only SQL was NOT executed: automatic approval review failed because of a usage limit. No alternative database transport was used to bypass that check. The supplied 33 migrations/38 RLS tables remain attributed release evidence, not independently refreshed SQL evidence.

## Source-grounded inventory

| Capability | Status at baseline | Evidence and gap |
|---|---|---|
| Password/PKCE/OAuth/recovery UI | Implemented but not fully verified | `apps/web/lib/auth/flows.ts`, auth routes and `scripts/authenticated-aura-smoke.mjs`; disposable real-role/OAuth/mailbox tests remain required |
| Role and reward enforcement | Implemented but not fully verified | Supabase migrations and `scripts/sql/security-regressions.sql`; simulated local claims do not verify hosted identities |
| Persisted conversations and optional memory | Implemented but not fully verified | `use-ai-workspace.ts`, backend `memory.ts`/`memory-actions.ts`; consent and ownership contracts exist |
| Live research | Blocked by configuration or credentials | `research.ts` calls fixed Brave LLM Context endpoint; release evidence reports missing configuration. One query, no official-domain enforcement; non-fresh failures can become Wikipedia background |
| Citation integrity | Partially implemented | `answer-quality.ts` checks numeric IDs, not arbitrary invented external Markdown URLs; `validatedResearch` trusts several incoming fields |
| Multi-output orchestration | Partially implemented | Semantic format plan, per-format generation and rollback in `artifact-runner.ts` and `use-ai-workspace.ts`; not a general durable job executor |
| PDF creation/readback | Implemented but not fully verified | Authenticated server renderer, PDFKit fallback, Arabic extraction and real fixtures; full deployed identity chain still unverified |
| PDF page/object editing | Not implemented | Existing editor reconstructs extracted content |
| DOCX/XLSX/PPTX creation | Implemented but not fully verified | Actual OOXML writers and ZIP/readback tests; historical three-file download evidence exists but is not current candidate acceptance |
| Existing Office preservation | Partially implemented | `creative-studio.tsx` rebuilds files from text; images, charts, themes and untouched XML are not preserved by that path |
| Raster image generation | Implemented but not fully verified | Existing authenticated Fanar action; historical blue-bird output is bounded evidence, not a current live test |
| Generative image editing | Blocked by configuration or credentials | No verified configured editing endpoint. Manual crop/rotate/caption is real, but does not satisfy inpainting/removal |
| Arabic/English and responsive UI | Partially implemented | Translation infrastructure and extensive synthetic browser checks; some raw English load errors and full real-account journeys remain |
| Quran/Mushaf | Implemented but not fully verified | Existing validated text/audio protocol, dedicated browser suites and historical provider tests; preserve design |
| Disaster recovery | Partially implemented | Isolated SQL fixture harness exists. Four private object byte backups and hosted recovery equivalence are not demonstrated in this checkout |

## Implementation order

1. Preserve baseline and enforce honest provider configuration, source scope and bounded multi-query research. Keep outbound requests on the existing fixed endpoint; no arbitrary URL fetcher.
2. Reject fabricated citation destinations and harden persisted research validation. Preserve provenance in exports.
3. Add targeted original-package Office text editing, with explicit limits, version lineage and byte preservation of unrelated ZIP entries. Retain existing reconstruction for intentional full-document rewriting.
4. Run regression, structural/readback, browser and build checks. Prepare a PR and exact evidence. Leave unavailable live Auth/provider/Storage/recovery gates BLOCKED.

No new paid provider, account, production migration, secret change, production release or arbitrary student fixture is authorized by this implementation.
