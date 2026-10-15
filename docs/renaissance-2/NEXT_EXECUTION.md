# Renaissance 2.0 — Next Execution

## Current release

- **Production:** \`a029a9e82b763b3466ae72fa3f32788eed97b915\` at \`https://noata.enterpriseworkhub.online\`.
- **Verified smoke:** \`/health\`, \`/ai\`, \`/login\`, \`/signup\`, \`/quran\`, \`/privacy\` and \`/terms\` returned HTTP 200; health reported the exact revision; Arabic markup and security headers were present; no Vercel runtime errors were reported in the checked 30-minute window.
- **Recent merged work:** temporary-chat memory privacy, user memory JSON export, single typing caret, bounded provider output, final-review completion validation, context-scoped suggestions, Office edit preflight, and partial/scanned-PDF revision safety.
- **Not full completion:** provider integrations and authenticated cross-account workflows remain unverified because no authorized disposable staging credentials were available.

## Next gates (in order)

1. Use explicitly authorized disposable staging accounts to test account switching, locale switching, temporary chats, disabled personalization, memory consent/CRUD/export and suggestion clicks. Verify visible state and server-side ownership.
2. Verify Fanar chat and image generation, buffered/SSE responses, STT/TTS and Brave Search metadata against real authorized staging providers. Do not infer success from configured credentials or mocks.
3. Run the document-fixture matrix on the latest revision: DOCX/XLSX/PPTX targeted edits, invalid replacements, saved revision persistence, PDF page reorder/rotation on text and scanned PDFs, and explicit warnings for unsupported arbitrary PDF text/layout editing.
4. Finish the original feature acceptance matrix: full bilingual/palette audit, all required browser widths, image inpainting/background removal, durable tasks and connected-app actions. Do not represent unimplemented features as complete.
5. Keep the atomic requirement matrix and test evidence synchronized with the current production SHA after each release.

## Safety gates

- Keep the separately restricted Renaissance PR #3 unmerged/unpromoted until the required approval.
- No Supabase plan upgrades, production schema migrations, secret rotations or paid provider probes without explicit authorization.
- A READY Vercel deployment or HTTP 200 page does not prove authenticated application behavior or provider availability.
