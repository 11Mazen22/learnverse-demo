# Renaissance 2.0 — Test and Release Evidence

## Current production

- **Revision:** `c2111eb286dd44d5382b960fd3e5a0dd4524b848` at [noata.enterpriseworkhub.online](https://noata.enterpriseworkhub.online).
- **Health/version:** `/health` returned HTTP 200 and reported the exact production revision.
- **Route smoke:** `/ai`, `/login`, `/signup`, `/quran`, `/privacy` and `/terms` all returned HTTP 200.
- **Markup/security:** Arabic application routes contained RTL markup; `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY` were present.
- **Runtime snapshot:** Vercel reported no runtime errors for the checked 30-minute window. This remains a bounded observation, not a guarantee of zero errors.

## Merged CI evidence

The following Noata CI runs completed successfully on their respective PR heads:

| PR | CI run | Merged change |
|---:|---:|---|
| #21 | #1272 | Portable JSON export of user-saved AI memories |
| #22 | #1277 | Remove duplicate typing caret while preserving reduced-motion handling |
| #23 | #1281 | Prevent persistent-memory mutations during temporary chats |
| #24 | #1282 | Validate bounded JSON/buffered AI provider responses |
| #25 | #1286 | Prevent suggestion state leaking across account, conversation, locale, mode and personalization changes |
| #26 | #1288 | Validate targeted Office text/cell edits before saving |
| #27 | #1291 | Guard revisions based on incomplete text extraction and support native page operations for scanned PDFs |
| #28 | #1294 | Reject incomplete final-review responses across SSE and JSON |
| #29 | #1298 | Refresh the 48-section/961-item acceptance evidence |
| #30 | #1302 | Validate complete PDF page order and page rotation before export |

For PRs #22, #23, #24, #28, #29 and #30, the workflow records show the full `verify` job (33 steps) and intentional tooltip/browser job (15 steps) completed successfully. All listed runs completed successfully; PR #30 is part of production.

## Document/export evidence

- The dependency hardening release removed vulnerable `extract-zip` and `basic-ftp` packages from the production dependency graph and pinned the nested KaTeX resolution; `pnpm audit --prod` reported no known vulnerabilities at that release.
- Real export smoke passed for Arabic PDF/DOCX round-trip, native multi-page PDF round-trip, prose/chart PDF rendering and alternate fonts.
- PR #30 local acceptance: PDF page-edit/order fixtures passed 7/7, TypeScript passed, and `pnpm verify` passed with 443 modern tests, production build, 543 legacy tests and text-integrity checks. Its exact-head CI #1302 also passed before merge and production release.
- Production PDF page editing remains intentionally scoped to page reorder/rotation. Arbitrary text/layout replacement is not represented as implemented.

## Acceptance still required

No authorized live Fanar generation, Brave result/metadata call, authenticated account-switch/disabled-personalization test, all-role E2E, live STT/TTS round-trip, generative inpainting/background-removal run, arbitrary PDF text/layout replacement, durable-task test or connected-app action test is claimed here. Use explicitly authorized disposable staging identities and avoid paid or production-side probes without approval.

## Release safety

Do not upgrade Supabase plans, alter production secrets, run production data mutations for QA, or trigger paid provider probes automatically. Provider verification requires explicit authorization and a disposable staging account. Do not merge/promote the separately restricted Renaissance PR #3 without its required approval.
