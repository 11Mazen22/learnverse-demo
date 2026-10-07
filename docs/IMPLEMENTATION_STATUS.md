# Noata 2.0 candidate status

Release gate: **not yet approved for production**. This document supersedes the v1 verification labels on this branch. Last updated 2026-10-07.

## Implemented and locally verified

- Shared Arabic-first light/dark tokens, self-hosted Cairo, responsive navigation, command palette, accessible dialogs, reduced motion.
- New data-backed dashboard; curriculum search/progress filters; contextual lesson-to-AI links.
- Shared visual treatment across missions, Boss, review, progress, rewards, assignments, notifications, settings, auth, teacher and admin. Existing learning/economy rules retained.
- Teacher workflow tabs, draft-before-publish assignment creation, nonempty grade validation. Admin user search, role confirmation, audit/usage views.
- Native AI workspace: history, pin/archive/rename/delete, temporary mode, explicit edit confirmation, streaming/cancel, regeneration, continuation, Markdown/GFM/code/math, image attachments, STT/TTS controls, specialized tools.
- Provider and browser sanitization remove hidden reasoning contents. Service-only request receipts reject duplicate inference attempts.
- Private generated image paths stored in message metadata; signed links refreshed when conversations open.
- PWA navigation uses network/offline fallback, avoiding cached authenticated HTML.

## Evidence

- TypeScript: pass.
- Modern tests: 16/16 pass.
- Legacy command: 84/84 pass (includes the modern tests; counts are not additive).
- Next production build: pass, 23 generated pages.
- Local production HTTP smoke: 18 routes returned 200; DENY frame and nosniff headers present. A rendered shell is not proof of an authenticated workflow.
- Supabase candidate noata-ai-v2 deployed with JWT verification enabled. Existing noata-ai left intact.
- Anonymous candidate request returned 401.
- Two additive migrations applied: inference receipts and admin-only aggregated AI usage. No account data migration or DNS change.

## Outstanding release gates

Authenticated Browser → Supabase → Fanar → UI → persistence testing; every capability's actual output; student/teacher/admin role journeys; browser viewport/theme/keyboard/voice checks; PWA offline/update check; production runtime log review; cross-user RLS tests. See TESTING.md and AI_CAPABILITY_MATRIX.md for explicit pending states.

Local Playwright browser download was blocked by execution network policy. Local Deno checking was blocked fetching the JSR manifest. Neither is a pass. CI and a deployed browser are the next verification paths.

Historical Railway/Open WebUI archives were not present among the supplied files or repository snapshot. None were modified. Archive hashes/import inspection remain blocked on availability.

## Known scope limits

- No new full English translation: Arabic-first UI remains, with direction/language preferences preserved.
- History currently loads at most 200 conversations and 500 messages per conversation; older pagination remains work.
- No automatic deletion of Storage objects when deleting a conversation; privacy text discloses this.
- Receipt cleanup runs during usage, not on a guaranteed retention schedule.
- Realtime notification delivery and full role/browser QA are not certified.
- Existing teacher visibility uses private.is_staff() on several learning tables; class isolation needs explicit regression testing before launch.
- Admin usage is a last-500-attempt aggregate, not provider health, cost, latency, or success telemetry.
- Demo science curriculum remains reference content, not an approved syllabus.
