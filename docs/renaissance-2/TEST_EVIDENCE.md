# Renaissance 2.0 — Test and Release Evidence

## Current production

- Revision: \`a029a9e82b763b3466ae72fa3f32788eed97b915\`.
- Production health returned the exact revision. \`/ai\`, \`/login\`, \`/signup\`, \`/quran\`, \`/privacy\` and \`/terms\` returned HTTP 200.
- Arabic routes contained RTL markup; \`X-Content-Type-Options: nosniff\` and \`X-Frame-Options: DENY\` were present.
- Vercel reported no runtime errors in the checked 30-minute window.
- The latest master deployment is READY. This proves deployment health, not authenticated provider availability.

## Merged CI evidence

- Typing-caret cleanup: run #1277 completed all 33 verify steps and all 15 tooltip/browser steps.
- Temporary-chat memory-settings guard: run #1281 completed all 33 verify steps and all 15 tooltip/browser steps.
- Buffered provider-response validation: run #1282 completed all 33 verify steps and all 15 tooltip/browser steps.
- Final-review completion validation (PR #28): run #1294 completed all 33 verify steps and all 15 tooltip/browser steps; focused streaming suite passed 21/21.
- Other merged master changes include context-scoped suggestions, Office replacement preflight, and partial/scanned-PDF revision safety.

## Latest local acceptance

- PDF page-order UI candidate (PR #30, not yet shipped): TypeScript passed; focused page editing/order fixtures passed 7/7; full \`pnpm verify\` passed 443 modern tests, build, 543 legacy tests and text-integrity.
- Do not mark this candidate as production-verified until its exact-head CI and browser gates pass and the resulting production revision is checked.

## Acceptance still required

No authorized live Fanar generation, Brave result/metadata call, authenticated account-switch test, all-role E2E, live STT/TTS round-trip, inpainting/background-removal run, arbitrary PDF text/layout replacement, durable-task test or connected-app action test is claimed here. Use disposable authorized staging identities; avoid paid or production-side probes without explicit approval.
