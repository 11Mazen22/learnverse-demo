# Renaissance 2.0 — Next Execution

## Current production release

- **Production revision:** `c2111eb286dd44d5382b960fd3e5a0dd4524b848` at [noata.enterpriseworkhub.online](https://noata.enterpriseworkhub.online).
- **Verified live smoke:** `/health` reports the exact revision; `/ai`, `/login`, `/signup`, `/quran`, `/privacy` and `/terms` return HTTP 200. Arabic pages contain `lang="ar" dir="rtl"`; `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY` are present.
- **Runtime monitoring snapshot:** Vercel reported no runtime errors for the checked 30-minute window. This is a time-bounded check, not a guarantee that no errors ever occur.
- **Recent merged production work:** dependency hardening (#19); atomic acceptance traceability (#20); saved-memory JSON export (#21); single reduced-motion typing caret (#22); temporary-chat memory guards (#23); bounded buffered-provider responses (#24); stale-suggestion scope isolation (#25); Office replacement preflight (#26); partial/scanned-PDF revision safety (#27); complete final-review response validation (#28); evidence matrix refresh (#29); and PDF page-order validation (#30).
- **Not full completion:** authenticated provider integrations and cross-account workflows remain unverified because no authorized disposable staging credentials were available in this execution.

## Next gates (in order)

1. Use explicitly authorized disposable staging accounts to test account switching, locale switching, temporary chats, disabled personalization, memory consent/CRUD/export and suggestion clicks. Verify both visible state and server-side ownership.
2. Verify live Fanar chat/image generation, JSON/SSE responses, STT/TTS and Brave Search result/source metadata against real authorized staging providers. Do not infer success from configured credentials or mocks.
3. Run the document-fixture matrix on the current revision: DOCX/XLSX/PPTX targeted edits, invalid replacements, saved revision persistence, PDF reorder/rotation on text and scanned PDFs, and explicit limitations for arbitrary PDF text/layout replacement.
4. Finish the original feature acceptance matrix: full bilingual/palette audit, all required browser widths, image inpainting/background removal, durable tasks and connected-app actions. Do not describe unimplemented features as complete.
5. Keep the atomic requirement matrix and test evidence synchronized with the current production SHA after each release.

## Safety gates

- Keep the separately restricted Renaissance PR #3 unmerged/unpromoted until its required approval. Ordinary reviewed production fixes described in the release evidence are separate from that candidate.
- No Supabase plan upgrades, production schema migrations, secret rotations or paid provider probes without explicit authorization.
- A READY Vercel deployment or HTTP 200 page does not prove authenticated application behavior or provider availability.
