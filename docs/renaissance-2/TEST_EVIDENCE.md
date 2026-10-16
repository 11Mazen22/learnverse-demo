# Renaissance 2.0 — Test and Release Evidence

## Production verification snapshot (2026-10-16, before this evidence-only PR)

- **Web revision observed during smoke:** `0acc764361be456f3ee53b2138cab319cf24ef99` at [noata.enterpriseworkhub.online](https://noata.enterpriseworkhub.online).
- **Health/version:** `/health` returned HTTP 200 and reported the exact revision.
- **Route smoke:** `/ai`, `/login`, `/signup`, `/quran`, `/privacy` and `/terms` all returned HTTP 200.
- **Markup/security:** Arabic app routes contained RTL markup; `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY` were present.
- **Runtime snapshots:** Vercel reported no runtime errors in the selected 30-minute window. After the Edge Function sync, the selected Supabase log query (2026-10-16 02:37–02:45 UTC) returned no matching error/failure events. These checks cover bounded windows only.

## Live Edge Function source parity

- Production `noata-ai-v2`: ACTIVE version **10**, `verify_jwt=true`, bundle hash `9de6a245650addf6cd8c04b3c5cd6acadc1e02f080b9ff2eb4c024e082a6ea3e`.
- Staging `noata-ai-v2`: ACTIVE version **41**, with the same hash.
- After comparing the deployed source to tracked repository files, the only original mismatch was `capabilities.ts`. Staging was updated first, then the exact same 23-file bundle was deployed to production. All 23 files now match `supabase/functions/noata-ai/` on master, including the truthful planned status for inpainting/background removal.
- This was a code synchronization, not a provider smoke test. No provider secrets or environment values were read/changed, no schema or plan changes were made, and no Fanar/Brave request was triggered. An authenticated readiness action and live provider tests remain pending an authorized disposable staging user.

## Merged CI evidence

The following Noata CI runs completed successfully on their respective PR heads:

| PR | CI run | Merged change |
|---:|---:|---|
| #21 | #1272 | Portable JSON export of user-saved AI memories |
| #22 | #1277 | Remove duplicate streaming caret while preserving reduced-motion handling |
| #23 | #1281 | Prevent persistent-memory mutations during temporary chats |
| #24 | #1282 | Validate bounded JSON/buffered AI provider responses |
| #25 | #1286 | Prevent suggestion state leaking across account, conversation, locale, mode and personalization |
| #26 | #1288 | Validate targeted Office text/cell edits before saving |
| #27 | #1291 | Guard revisions based on incomplete text extraction and support native page operations for scanned PDFs |
| #28 | #1294 | Reject incomplete final-review answers across SSE and JSON |
| #29 | #1298 | Refresh the requirements/evidence matrix |
| #30 | #1302 | Validate complete PDF page order and rotation before export |
| #32 | #1312 | Prevent temporary chats from reading/displaying/exporting or mutating saved memories |

For PR #32, both the 33-step `verify` job and 15-step intentional-tooltip/browser job completed successfully. The exact-head preview's seven key routes returned HTTP 200 before merge. The verified baseline deployment was READY during the route smoke; this evidence-only PR will create a later deployment SHA.

## Document/export evidence

- Dependency hardening removed vulnerable `extract-zip` and `basic-ftp` packages from the production dependency graph and pinned the nested KaTeX resolution; `pnpm audit --prod` reported no known vulnerabilities at that release.
- Real export smoke passed for Arabic PDF/DOCX round-trip, native multi-page PDF round-trip, prose/chart rendering and alternate fonts.
- PR #30 local acceptance: PDF page-edit/order fixtures passed 7/7, TypeScript passed, and `pnpm verify` passed with 443 modern tests, a successful production build, 543 legacy tests and text-integrity checks. Its exact-head CI #1302 passed before merge.

## Acceptance still required

No authorized live Fanar generation, Brave result/metadata call, authenticated account-switch/disabled-personalization test, all-role E2E, live STT/TTS round-trip, generative inpainting/background-removal run, arbitrary PDF text/layout replacement, durable-task test or connected-app action test is claimed here. Use explicitly authorized disposable staging identities and avoid paid or production-side probes without approval.

## Release safety

Do not upgrade Supabase plans, alter production secrets, run production data mutations for QA, or trigger paid provider probes. Do not merge/promote the separately restricted Renaissance PR #3 without its required approval.
