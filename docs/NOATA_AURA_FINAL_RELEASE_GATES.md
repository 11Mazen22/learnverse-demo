# Noata Aura final candidate — release gates

Prepared 2026-10-08. **NOT READY FOR PRODUCTION.** PR [#3](https://github.com/11Mazen22/learnverse-demo/pull/3) remains draft; branch `noata-aura-platform-overhaul-20261008`. Production, billing, official domains and the existing database were not changed. The private-document storage migration remains unapplied.

## Revision and evidence contract

Baseline actually fetched from Git is `2b6c9b9b352a8cf1c74e30bfc679a109f68af839`. The user independently verified PR workflow [37728570750](https://github.com/11Mazen22/learnverse-demo/actions/runs/37728570750) SUCCESS, push workflow [37728567137](https://github.com/11Mazen22/learnverse-demo/actions/runs/37728567137) SUCCESS, and Vercel preview `dpl_HWfRU9pkW6yQv7MY3T5CJFtirEg4` READY at https://noata-cgdyh3tnu-noata.vercel.app. This is attributed user API evidence and certifies only that baseline. The older BLOCKED deployment's precise restriction is still unconfirmed; the later READY preview does not establish its cause.

For the new candidate, use `git rev-parse HEAD` and the revision/dirty fields in generated browser/PDF outcomes. A dirty-tree result is implementation evidence only, not final exact-head verification. GitHub/Vercel/Supabase connectors are not callable in this session; API requests are rejected by the environment proxy. Native Git transport works. New-head workflow/deployment results need an authorized connected read and must never be inferred from local tests or previous green runs.

## Completed independent engineering

- Private workspace ownership/revision guards clear messages, attachments, microphone/player state, open writing editors and bounded session-only drafts on logout or account change. Cached drafts are actively evicted after 30 minutes. Late history/provider continuations cannot restore another account's UI. Switching accounts removes the prior chat URL and history loading disables composer edits/sends. Partial AI replies retain their actual content and explicit stopped/failed state; retry retains relevant source attachments.
- Writing changes survive close/reopen in bounded RAM and require an explicit discard choice. Escape uses the same protection as the close button. Unsent work has a navigation/reload warning; session-only drafts are not durable storage.
- REST/auth/storage reads and writes have bounded waits. Role screens fail closed, hide account data while identity changes, distinguish unknown balances from zero, and expose meaningful read/retry errors.
- Learning and reward mutations serialize, validate receipts and retain idempotency keys across ambiguous failures. Assignment submission inserts cannot overwrite existing grades; duplicate conflicts require owner-scoped readback. Teacher creation checks draft, item count and publication receipts; grading and admin changes validate exact returned rows.
- Notifications show honest unread/read states and follow links only after confirmed read writes. Account preferences, theme saves and staff forms reject stale account continuations and protect unsaved work.
- Canonical Quran protocol validation checks chapter/verse ordering and global numbering without rewriting text. Recitation URLs and response sequences are validated separately; unavailable audio does not hide text. Chapter navigation remains available if the index fails.
- Arabic PDF extraction preserves logical clusters, floating diacritics, punctuation and separated table cells. PDF fonts retain contextual joining while problematic glyph-pair ligatures are disabled to preserve text mapping. Real Arabic PDF/DOCX rendering, input fixture previews, original-source attribution, responsive layout, accessibility and existing browser regression coverage are preserved. The full Chrome launcher retains dynamic ports, isolated profiles, multiprocess launch, full exit/WebSocket diagnostics and CDP timeout/crash recovery.

## Gate status

| Gate | Status | Evidence / remaining work |
| --- | --- | --- |
| TypeScript, production build and regression suite | VERIFIED locally | 64 modern tests and 138 aggregate tests pass, with no failures or skips; production build and TypeScript pass. Generated exact-head outcomes must match the committed candidate. |
| Deno backend dependency/type checking | VERIFIED locally | Standard Deno/Web APIs need no unused JSR runtime declaration; npm Supabase SDK pinned to 2.117.3 with committed lockfile. No backend deployed. |
| Real PDF/DOCX export and original previews | VERIFIED locally | 11-page Arabic PDF readback including complete source sentences, table rows, list phrases, diacritics, all page titles/footers, end marker, page bounds and actual raster pages 1/6/11; DOCX roundtrip and real input fixtures. Authenticated serverless PDF deployment remains unverified. |
| Browser startup/fault/timeout recovery | VERIFIED locally | Six fault regressions; three simultaneous native Chrome sessions, deliberate timeout recovery and crashed-browser propagation. Local Chromium 151 differs from CI's pinned Chrome 146. |
| Six-width, two-theme public UI and accessibility | VERIFIED locally when outcome is green | Complete suite requires 180 public and 48 synthetic views with no detected axe violations; incomplete findings retained. Progress guest, keyboard hints and dark admin tabs were corrected. Theme transitions are awaited before measurement. History labels have a semantic region role. Locked curriculum text/icons retain full opacity; Start links use a contrasting theme foreground. Published/locked catalog fixtures add twelve synthetic audits. Detailed incomplete findings remain for manual review. Final outcome must show the candidate revision and clean tree. |
| Account-switch/private UI client contracts | VERIFIED with synthetic fixtures only | Notification denial/readback, role UI denial, per-conversation drafts, editor clearing and late stream/logout rejection. Fake sessions exist only in JavaScript; request interception blocks real backend traffic. Synthetic staff/inbox screenshots and axe checks are clearly labeled. |
| Real authenticated workflows and role/RLS boundaries | BLOCKED | Isolated staging `vpfpjvhafkmygetjkfcp` is provisioned/healthy per user API verification but has zero application tables, migrations, Auth users and Edge Functions. Management connections and secure bindings are unavailable here; endpoint CONNECT 403. Synthetic UI fixtures are not authentication, provider or RLS evidence. Real student A/B, teacher A/B and admin checks are mandatory. |
| Private originals: Storage RLS, expiry/quotas and cleanup lifecycle | IMPLEMENTED—NOT YET VERIFIED | Feature remains off; migration unapplied. Real policy, cross-user, signed-link, metadata, quota-race, byte deletion and scheduler checks require staging. |
| Live models/tools, vision, citation fidelity, STT/TTS | BLOCKED | Real providers and staging credentials unavailable. Configured capabilities and unit tests are not provider-health evidence. |
| OCR / XLSX / PPTX | NOT IMPLEMENTED | Unsupported formats are not advertised as working. Scanned PDFs disclose unavailable extraction; no verified OCR provider. |
| Canonical Quran index/text and real recitation | BLOCKED for live verification | External API access returns proxy CONNECT 403. Protocol tests and explicitly synthetic UI fixtures do not certify canonical text or playback. |
| Manual screen reader/touch/IME, cold-device performance and load | IMPLEMENTED—NOT YET VERIFIED | Automated axe and local transfer/timing budgets provide partial evidence; manual and realistic device/load work remains. |
| New exact-head full GitHub workflow | BLOCKED pending connected verification | Push triggers the entire workflow, including pinned Chrome, PDFs, Deno, all browser checks, HTTP smoke and aggregate tests. Supply exact new SHA and successful run IDs; preserve failures/artifacts. |
| New exact-head READY Vercel preview | BLOCKED pending connected verification | Require deployment ID/URL and source SHA for the candidate. A preview built against the existing backend is public-review-only, not authorized staging. |
| Production release | BLOCKED | Keep PR draft and production unchanged until mandatory gates pass and explicit release approval is given. |

## Outstanding issues and severity

**P1 — release blocking:** missing initialized isolated staging and secure execution access prevent real auth, role/RLS, Storage lifecycle, provider/voice and authenticated serverless PDF verification. Canonical Quran/audio access is blocked by the network proxy. New-head GitHub/Vercel results require connected verification. Manual screen-reader/touch/IME and realistic device/load gates remain unexecuted. Previous green baseline CI does not remove any of these blockers.

**P2 — scope limitations:** OCR, XLSX and PPTX are not implemented and are not advertised as supported. Session-only writing/composer drafts survive navigation and reopening, but not page reload or session expiry; the interface discloses this. Distributed PDF quotas and a production cleanup scheduler are not implemented. Do not enable retained originals or claim production concurrency readiness before these lifecycle/scale requirements are satisfied.

## Reproduce

```bash
pnpm install --frozen-lockfile
pnpm verify
deno check --config supabase/functions/noata-ai/deno.json supabase/functions/noata-ai/index.ts
node scripts/document-export-smoke.mjs
node --test scripts/qa-browser.test.mjs
NOATA_CHROMIUM_PATH=/usr/bin/chromium node scripts/browser-launch-smoke.mjs
NOATA_CHROMIUM_PATH=/usr/bin/chromium node scripts/browser-aura-smoke.mjs
```

Use Node 24 / pnpm 10.17.1. CI installs full Chrome for Testing itself; local native Chrome is an explicit fallback when Google's download is blocked. Do not select the packaged serverless PDF executable for interactive browser QA. Artifacts under `artifacts/noata-browser/`, `artifacts/noata-browser-launch/` and `artifacts/noata-documents/` record actual outcomes and revision. Synthetic browser data is marked `synthetic-ui-only`; it never enters production or creates a real user.

The [$0 staging proposal](NOATA_STAGING_PROPOSAL.md) is concrete and eligible according to the user's Supabase cost check: Noata organization `sbvcxdwcawkddndptsuh`, `noata-staging`, `eu-west-2`, Free, one remaining active Free slot, $0/month estimate. **The user created and verified Free staging `vpfpjvhafkmygetjkfcp`, ACTIVE_HEALTHY, eu-west-2.** Non-destructive base setup and QA are authorized but blocked here by missing connections/secure bindings. The 18-file initialization bundle excludes private-document retention and has not been executed. Keep `jdkfqdzgphzqbbzmerzr` excluded. Follow the isolated staging contract in [the implementation matrix](NOATA_AURA_PHASE5_MATRIX.md), [TESTING](TESTING.md) and [AI capability matrix](AI_CAPABILITY_MATRIX.md).

## Most recent connected results before the curriculum correction

The user independently verified **a2572fb5dc3f809f78a594731874635d7bca5c37**: PR #3 OPEN/DRAFT/unmerged; [push 37769509536](https://github.com/11Mazen22/learnverse-demo/actions/runs/37769509536) and [PR 37769514581](https://github.com/11Mazen22/learnverse-demo/actions/runs/37769514581) **FAILURE** at real browser accessibility (`/learn` locked-unit icons in both themes and Start links in dark, 768/390/320). TypeScript, modern tests, Deno, startup, real document fixtures and build passed; HTTP/legacy steps were skipped. Local browser success at that same head did not load the external catalog and does not refute CI. Corrected styles and an isolated anonymous catalog fixture now cover those states, without suppressing assertions. A new exact-head run is mandatory.

That head's preview **dpl_D5PKLDsgppWfw3gfWwH9jWiDa2ss** is **BLOCKED**, https://noata-nv8jbobet-noata.vercel.app, source SHA confirmed by user. The response returned the [team-configuration link](https://vercel.com/docs/deployments/troubleshoot-project-collaboration#team-configuration) without an exact code. Detailed connected diagnostics remain required; do not infer billing, alter identities/membership or bypass limits.
