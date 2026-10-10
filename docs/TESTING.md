# Verification and human QA

Current Phase 5 evidence and limitations are in [NOATA_AURA_PHASE5_MATRIX.md](NOATA_AURA_PHASE5_MATRIX.md). Earlier IMPLEMENTATION_STATUS.md inventory is historical. This is a release gate, not a claim that unchecked flows pass.

Automated commands: pnpm typecheck; pnpm modern:test; deno check --config supabase/functions/noata-ai/deno.json supabase/functions/noata-ai/index.ts; pnpm build; pnpm legacy:check. CI uses Node 24 and a frozen lockfile. Local production smoke passed 18 routes, frame denial and nosniff headers.

## Browser matrix (authenticated and manual gates pending)

Public route/theme, attachment, keyboard, automated accessibility and performance evidence now runs in `scripts/browser-aura-smoke.mjs`. It does not certify the authenticated workflows below.

Run each applicable flow on desktop 1440, tablet 768 and mobile 390, in light/dark, Arabic RTL and mixed-language text. Record browser, viewport, user role, exact commit, result and screenshot. Check keyboard-only navigation, dialog focus/Escape, screen-reader names, zoom200%, reduced motion, loading/empty/offline/error behavior and console/network errors.

| Journey | Required assertion | Status |
| --- | --- | --- |
| Login/signup/recovery/logout | session, redirect, friendly errors, logout clears private view | Pending authenticated browser |
| Dashboard/curriculum/lesson | real progress, filters, lesson resume, contextual AI | Pending browser |
| Mission/review/Boss | answer secrecy, state transitions, no duplicate rewards | Unit rules pass; live pending |
| Rewards | balance/ownership, retry idempotency, equip | Live pending |
| Assignment | teacher draft/publish, student visibility/submit, grade notification | Live pending |
| Notifications | unread count, filters, marking, safe destination | Utility test passes; live pending |
| Settings | persistence, theme/system, reduced motion, language | Live pending |
| AI | send/stream/stop, reopen, edit/regenerate/continue, archive/delete, failures | Protocol tests pass; live pending |
| Multimodal | upload preview, permission denial, STT, TTS, vision, generated media | Live pending |
| Teacher/admin | role restrictions, class isolation, authoring/audit | Live pending |
| PWA | install, offline fallback, update invalidates old caches | Browser pending |

## Database/security matrix

Inventory confirmed RLS enabled on all public tables, private storage buckets, owner policies for AI history, staff guards and service-only request receipts. Inventory alone is not cross-user verification. Test student A/B history read/write/delete, private objects, hidden answer keys, draft assignment visibility, teacher class A/B and admin aggregate denial for students. Use disposable fixtures and rollback/cleanup. Do not use real student content as test fixtures.

Security advisor reported leaked-password protection disabled (existing configuration); the receipt table has intentional RLS without client policies, so its informational advisory is expected. Never add public policies merely to silence the advisor.

## AI regression

Run every AI_CAPABILITY_MATRIX.md row with a real authenticated session. Assert output content/type, not only status. Cover Arabic/English, empty/invalid/oversize input, duplicate request ID, abort, interruption, quota denial and expired session. Never store keys, tokens or private user prompts in evidence.
