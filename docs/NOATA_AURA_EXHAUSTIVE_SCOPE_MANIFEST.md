# NOATA AURA — EXHAUSTIVE REPOSITORY-WIDE COVERAGE MANIFEST
**Discovery:** noata-aura-platform-overhaul-20261008 at 2026-10-09. **Source tree at initial audit:** 367 tracked entries including 281 file blobs. Current candidate coverage is checked exhaustively by `pnpm scope:check`; additions are listed below. **Status:** scope only; listings are NOT certification of function.

## The literal no-exceptions rule
EVERY current file, user-visible route, nested state, dialog, role, backend contract, migration, helper, email, theme, worker, export, service integration, historical MVP path, test and operational instruction is within investigation scope. The list below documents the entire branch tree, not a claim each file needs rewritten. Keep correct code; change defective or inconsistent code. Any new/renamed/deleted file updates this manifest. No milestone is complete based on only the example modules (Quran, Missions, Review, Boss, AI).

For EACH page/module enforce: functional data; responsive 320/360/390/430/768/1024/1280/1440/1920; Arabic RTL and English LTR; role+RLS; loading/success/empty/error/offline/timeouts; meaningful motion and reduced-motion; cross-theme contrast; keyboard/touch/reader accessibility; real persisted backend; negative cases; screenshot E2E and exact-commit evidence. For user-facing actions, prove each button/menu/shortcut/anchor leads to a working authorized backend or meaningful local behavior, never dead or fake UI.

## Every modern route (full enumeration)
| Route | Mandatory transformation focus | Acceptance state |
|---|---|---|
| `/admin` | Admin roles, content studio and operations | Not certified; audit + implement + test |
| `/ai` | Fanar AI, Workshop, files/voice/multiturn/artifacts | Not certified; audit + implement + test |
| `/assignments` | Student assignment journey/submissions | Not certified; audit + implement + test |
| `/auth/callback` | OAuth/PKCE/email one-time callback handler | Not certified; audit + implement + test |
| `/auth/check-email` | Confirmation and resend status | Not certified; audit + implement + test |
| `/auth/complete` | Post-verification completion | Not certified; audit + implement + test |
| `/auth/error` | Auth error and safe recovery | Not certified; audit + implement + test |
| `/auth/forgot-password` | Recovery request and email delivery | Not certified; audit + implement + test |
| `/auth/update-password` | Reset token proof/new password | Not certified; audit + implement + test |
| `/boss` | Unit challenge and mystery box award | Not certified; audit + implement + test |
| `/help` | Honest contextual support and topic navigation | Not certified; audit + implement + test |
| `/learn` | Catalog, courses/units, prerequisites/search | Not certified; audit + implement + test |
| `/lesson/[id]` | Lesson player, checkpoints, evidence, real rewards | Not certified; audit + implement + test |
| `/login` | Account sign-in/password/Google provider | Not certified; audit + implement + test |
| `/missions` | Validated mission and three-question flow | Not certified; audit + implement + test |
| `/notifications` | Scoped delivery, inbox and read state | Not certified; audit + implement + test |
| `/` | Landing, signed-in dashboard and guest states | Not certified; audit + implement + test |
| `/privacy` | Public detailed bilingual privacy disclosure | Not certified; audit + implement + test |
| `/progress` | Evidenced progress/skills/analytics | Not certified; audit + implement + test |
| `/quran` | Sacred text, source, navigation, search and recitation | Not certified; audit + implement + test |
| `/review` | Mastery-based due skill review | Not certified; audit + implement + test |
| `/rewards` | XP/Coins/Gems, shop, inventory, gifts and receipts | Not certified; audit + implement + test |
| `/settings` | Profile, preferences, themes, access and data requests | Not certified; audit + implement + test |
| `/signup` | Account creation and cross-entry links | Not certified; audit + implement + test |
| `/teacher` | Class scopes, grading and teacher tools | Not certified; audit + implement + test |
| `/terms` | Public bilingual terms/educational policies | Not certified; audit + implement + test |

In addition, inspect framework error/not-found/loading/layout, route metadata, 404s, redirects, PWA/manifest, API handlers, route parameters, query strings and every overlay/modal/popover/sidebar bottom nav. A route can contain dozens of subviews; all subviews inherit the same acceptance obligation.

## Legacy Node / original browser platform — DO NOT IGNORE
The repository still contains a separate legacy JSON/Ollama browser app (`server.mjs`, `public/*`, `lib/*`), including sessions, local API, chat attachments, tutor, attempts, grading, content state machine, rewards and standalone browser UI. Audit against the modern Next/Supabase version to classify: maintained, historical regression/reference, intentionally retired. **Do not silently remove or publish legacy endpoints.**
- `POST /api/auth/login` — determine production exposure, role policy, compatibility, state safety and tests.
- `POST /api/auth/logout` — determine production exposure, role policy, compatibility, state safety and tests.
- `GET /api/bootstrap` — determine production exposure, role policy, compatibility, state safety and tests.
- `POST /api/attempts` — determine production exposure, role policy, compatibility, state safety and tests.
- `POST /api/boss/:id` — determine production exposure, role policy, compatibility, state safety and tests.
- `GET /api/units/:id/boss` — determine production exposure, role policy, compatibility, state safety and tests.
- `POST /api/shop/purchase` — determine production exposure, role policy, compatibility, state safety and tests.
- `PATCH /api/profile` — determine production exposure, role policy, compatibility, state safety and tests.
- `POST /api/assignments` — determine production exposure, role policy, compatibility, state safety and tests.
- `PATCH /api/admin/questions/:id/status` — determine production exposure, role policy, compatibility, state safety and tests.
- `POST /api/tutor/ask` — determine production exposure, role policy, compatibility, state safety and tests.
- `GET/POST /api/chat/conversations` — determine production exposure, role policy, compatibility, state safety and tests.
- `GET/PATCH/DELETE /api/chat/conversations/:id` — determine production exposure, role policy, compatibility, state safety and tests.
- `GET /api/chat/attachments/:uuid` — determine production exposure, role policy, compatibility, state safety and tests.
- `POST /api/chat/conversations/:id/messages` — determine production exposure, role policy, compatibility, state safety and tests.
- `GET /api/health` — determine production exposure, role policy, compatibility, state safety and tests.

## Authenticated and external subsystem inventory
- Supabase Auth: email signup/login/confirm/recover/reset/Google/PKCE/session/refresh/logout/delete; strict canonical origins.
- Supabase database: migrations, constraints, triggers, RLS, SECURITY DEFINER RPCs, roles, user settings, learning/grading tables, attempts, mastery, ledger, inventory, reward boxes, logs and receipts.
- Supabase Storage: access boundaries, media, AI source files, retention, expiration and deletion; nonpublic object access.
- AI Edge Function / Fanar: provider credentials in secrets, hosted readiness, model routing, live conversation, voice/STT/TTS, vision, translation and guarded specialist tools only where supported; real request and usage receipts.
- Document processing: parser by format, reading-quality limits, source references, scanned PDF warnings, export PDF/DOCX with correct Arabic, previews, file authorization and cleanup.
- Curriculum: author→review→approve→publish→version→retire, teacher/adolescent class scope, safe question keys, permissions.
- Economy: independent mastery and XP/COIN/GEM; server-derived work receipts, unique grants, honest wallet/shop/gifts, audit, replay and fraud tests.
- Quran source/audio: canonical text integrity; reciter/rights, local bookmarks, accurate search, listening; no generated verse.
- Notifications and settings: read-state, deep link, locale/palette/motion, account preference persistence; PWA and caches.
- CI/deployment: exact SHA workflow and branch alias, no-merge/no-prod guard, performance/accessibility/security suites and visual snapshots.

## File-by-file discovery list — do not skip any file
### Next.js public and authenticated pages (26 files)
- [ ] `apps/web/app/admin/page.tsx`
- [ ] `apps/web/app/ai/page.tsx`
- [ ] `apps/web/app/assignments/page.tsx`
- [ ] `apps/web/app/auth/callback/page.tsx`
- [ ] `apps/web/app/auth/check-email/page.tsx`
- [ ] `apps/web/app/auth/complete/page.tsx`
- [ ] `apps/web/app/auth/error/page.tsx`
- [ ] `apps/web/app/auth/forgot-password/page.tsx`
- [ ] `apps/web/app/auth/update-password/page.tsx`
- [ ] `apps/web/app/boss/page.tsx`
- [ ] `apps/web/app/help/page.tsx`
- [ ] `apps/web/app/learn/page.tsx`
- [ ] `apps/web/app/lesson/[id]/page.tsx`
- [ ] `apps/web/app/login/page.tsx`
- [ ] `apps/web/app/missions/page.tsx`
- [ ] `apps/web/app/notifications/page.tsx`
- [ ] `apps/web/app/page.tsx`
- [ ] `apps/web/app/privacy/page.tsx`
- [ ] `apps/web/app/progress/page.tsx`
- [ ] `apps/web/app/quran/page.tsx`
- [ ] `apps/web/app/review/page.tsx`
- [ ] `apps/web/app/rewards/page.tsx`
- [ ] `apps/web/app/settings/page.tsx`
- [ ] `apps/web/app/signup/page.tsx`
- [ ] `apps/web/app/teacher/page.tsx`
- [ ] `apps/web/app/terms/page.tsx`

### Next.js route handlers and runtime shell (15 files)
- [ ] `apps/web/app/api/documents/pdf/route.ts`
- [ ] `apps/web/app/api/documents/route.ts`
- [ ] `apps/web/app/api/qa-target/route.ts`
- [ ] `apps/web/app/api/quran/route.ts`
- [ ] `apps/web/app/aura-finish.css`
- [ ] `apps/web/app/auth-ux.css`
- [ ] `apps/web/app/error.tsx`
- [ ] `apps/web/app/globals.css`
- [ ] `apps/web/app/health/route.ts`
- [ ] `apps/web/app/layout.tsx`
- [ ] `apps/web/app/loading.tsx`
- [ ] `apps/web/app/not-found.tsx`
- [ ] `apps/web/app/palette.css`
- [ ] `apps/web/app/robots.ts`
- [ ] `apps/web/app/sitemap.ts`

### Shared and domain-specific UI components (45 files)
- [ ] `apps/web/components/admin/admin-live.tsx`
- [ ] `apps/web/components/admin/curriculum-manager.tsx`
- [ ] `apps/web/components/admin/operations-live.tsx`
- [ ] `apps/web/components/ai/attachment-message.tsx`
- [ ] `apps/web/components/ai/conversation-history.tsx`
- [ ] `apps/web/components/ai/document-sources-message.tsx`
- [ ] `apps/web/components/ai/education-panel.tsx`
- [ ] `apps/web/components/ai/noata-ai-client.tsx`
- [ ] `apps/web/components/ai/original-document-preview.tsx`
- [ ] `apps/web/components/ai/response-audio-player.tsx`
- [ ] `apps/web/components/ai/rich-message.tsx`
- [ ] `apps/web/components/ai/use-ai-workspace.ts`
- [ ] `apps/web/components/ai/writing-studio.tsx`
- [ ] `apps/web/components/app-shell.tsx`
- [ ] `apps/web/components/assignments/assignments-live.tsx`
- [ ] `apps/web/components/auth/auth-journey.tsx`
- [ ] `apps/web/components/auth/role-gate.tsx`
- [ ] `apps/web/components/auth/staff-nav.tsx`
- [ ] `apps/web/components/auth/user-menu.tsx`
- [ ] `apps/web/components/boss/boss-live.tsx`
- [ ] `apps/web/components/dashboard/dashboard-live.tsx`
- [ ] `apps/web/components/help/help-center.tsx`
- [ ] `apps/web/components/learn/learn-live.tsx`
- [ ] `apps/web/components/learn/lesson-live.tsx`
- [ ] `apps/web/components/legal/legal-page.tsx`
- [ ] `apps/web/components/legal/legal-pages.css`
- [ ] `apps/web/components/missions/mission-live.tsx`
- [ ] `apps/web/components/mobile-nav.tsx`
- [ ] `apps/web/components/notifications/notification-bell.tsx`
- [ ] `apps/web/components/notifications/notifications-live.tsx`
- [ ] `apps/web/components/preferences/experience-boot.tsx`
- [ ] `apps/web/components/preferences/palette-gallery.tsx`
- [ ] `apps/web/components/preferences/theme-control.tsx`
- [ ] `apps/web/components/progress/progress-live.tsx`
- [ ] `apps/web/components/pwa-register.tsx`
- [ ] `apps/web/components/quran/quran-reader.tsx`
- [ ] `apps/web/components/quran/quran-navigator.tsx`
- [ ] `apps/web/components/quran/quran-verses.tsx`
- [ ] `apps/web/components/quran/reciter-picker.tsx`
- [ ] `apps/web/components/quran/recitation-player.tsx`
- [ ] `apps/web/components/quran/verse-recitation.tsx`
- [ ] `apps/web/app/quran/quran.css`
- [ ] `apps/web/public/fonts/amiri-quran.ttf`
- [ ] `apps/web/public/fonts/OFL-AmiriQuran.txt`
- [ ] `apps/web/components/review/review-live.tsx`
- [ ] `apps/web/components/rewards/rewards-live.tsx`
- [ ] `apps/web/components/settings/settings-live.tsx`
- [ ] `apps/web/components/teacher/teacher-live.tsx`
- [ ] `apps/web/components/ui/confirm-dialog.tsx`
- [ ] `apps/web/components/ui/dialog.tsx`
- [ ] `apps/web/components/ui/icon.tsx`
- [ ] `apps/web/components/ui/module-welcome.tsx`
- [ ] `apps/web/components/ui/noata-logo.tsx`

### Modern auth, AI, Quran, Supabase and domain library (61 files)
- [ ] `apps/web/lib/ai/ai.test.ts`
- [ ] `apps/web/lib/ai/catalog.ts`
- [ ] `apps/web/lib/ai/context-budget.test.ts`
- [ ] `apps/web/lib/ai/context-budget.ts`
- [ ] `apps/web/lib/ai/document-retrieval.test.ts`
- [ ] `apps/web/lib/ai/document-retrieval.ts`
- [ ] `apps/web/lib/ai/document-storage.test.ts`
- [ ] `apps/web/lib/ai/document-storage.ts`
- [ ] `apps/web/lib/ai/document-text.test.ts`
- [ ] `apps/web/lib/ai/document-text.ts`
- [ ] `apps/web/lib/ai/docx-export.test.ts`
- [ ] `apps/web/lib/ai/docx-export.ts`
- [ ] `apps/web/lib/ai/docx-ingest.test.ts`
- [ ] `apps/web/lib/ai/docx-ingest.ts`
- [ ] `apps/web/lib/ai/education-flows.test.ts`
- [ ] `apps/web/lib/ai/education-flows.ts`
- [ ] `apps/web/lib/ai/model-routing.test.ts`
- [ ] `apps/web/lib/ai/model-routing.ts`
- [ ] `apps/web/lib/ai/multi-document.test.ts`
- [ ] `apps/web/lib/ai/multi-document.ts`
- [ ] `apps/web/lib/ai/operation-keys.test.ts`
- [ ] `apps/web/lib/ai/operation-keys.ts`
- [ ] `apps/web/lib/ai/original-documents.ts`
- [ ] `apps/web/lib/ai/pdf-export.test.ts`
- [ ] `apps/web/lib/ai/pdf-export.ts`
- [ ] `apps/web/lib/ai/pdf-ingest.test.ts`
- [ ] `apps/web/lib/ai/pdf-ingest.ts`
- [ ] `apps/web/lib/ai/pdf-renderer.ts`
- [ ] `apps/web/lib/ai/pdf-text.test.ts`
- [ ] `apps/web/lib/ai/pdf-text.ts`
- [ ] `apps/web/lib/ai/prompts.ts`
- [ ] `apps/web/lib/ai/request-origin.test.ts`
- [ ] `apps/web/lib/ai/request-origin.ts`
- [ ] `apps/web/lib/ai/router.ts`
- [ ] `apps/web/lib/ai/sanitize.ts`
- [ ] `apps/web/lib/ai/session-work.test.ts`
- [ ] `apps/web/lib/ai/session-work.ts`
- [ ] `apps/web/lib/ai/tool-output.test.ts`
- [ ] `apps/web/lib/ai/tool-output.ts`
- [ ] `apps/web/lib/ai/voice-generation.test.ts`
- [ ] `apps/web/lib/ai/voice-generation.ts`
- [ ] `apps/web/lib/ai/workspace.test.ts`
- [ ] `apps/web/lib/ai/workspace.ts`
- [ ] `apps/web/lib/auth/canonical-origin.test.ts`
- [ ] `apps/web/lib/auth/canonical-origin.ts`
- [ ] `apps/web/lib/auth/flows.test.ts`
- [ ] `apps/web/lib/auth/flows.ts`
- [ ] `apps/web/lib/i18n/auth-errors.ts`
- [ ] `apps/web/lib/quran/reciters.ts`
- [ ] `apps/web/lib/quran/reciters.test.ts`
- [ ] `apps/web/lib/quran/source.test.ts`
- [ ] `apps/web/lib/quran/source.ts`
- [ ] `apps/web/lib/supabase/client.ts`
- [ ] `apps/web/lib/supabase/config.ts`
- [ ] `apps/web/lib/supabase/database.types.ts`
- [ ] `apps/web/lib/supabase/network-policy.test.ts`
- [ ] `apps/web/lib/supabase/network-policy.ts`
- [ ] `apps/web/lib/supabase/proxy.ts`
- [ ] `apps/web/lib/supabase/server.ts`
- [ ] `apps/web/lib/supabase/transport.test.ts`
- [ ] `apps/web/lib/supabase/use-confirmed-mutation.ts`
- [ ] `apps/web/lib/supabase/use-verified-account.ts`
- [ ] `apps/web/lib/use-unsaved-work.ts`

### Core learning/economy package (7 files)
- [ ] `packages/core/package.json`
- [ ] `packages/core/src/content.ts`
- [ ] `packages/core/src/core.test.ts`
- [ ] `packages/core/src/economy.ts`
- [ ] `packages/core/src/index.ts`
- [ ] `packages/core/src/mastery.ts`
- [ ] `packages/core/tsconfig.json`

### Supabase database migrations and email templates (26 files)
- [ ] `supabase/email-templates/README.md`
- [ ] `supabase/email-templates/change-email.html`
- [ ] `supabase/email-templates/confirm-signup.html`
- [ ] `supabase/email-templates/invite.html`
- [ ] `supabase/email-templates/magic-link.html`
- [ ] `supabase/email-templates/recovery.html`
- [ ] `supabase/migrations/0001_noata_core.sql`
- [ ] `supabase/migrations/0002_ai_usage.sql`
- [ ] `supabase/migrations/0003_learning_transactions.sql`
- [ ] `supabase/migrations/0004_classroom_gamification.sql`
- [ ] `supabase/migrations/0005_storage.sql`
- [ ] `supabase/migrations/0006_core_hardening.sql`
- [ ] `supabase/migrations/0007_transactions_classroom_hardening.sql`
- [ ] `supabase/migrations/0008_content_model_refinement.sql`
- [ ] `supabase/migrations/0009_demo_content_seed.sql`
- [ ] `supabase/migrations/0010_product_completion_workflows.sql`
- [ ] `supabase/migrations/0011_product_completion_performance_cleanup.sql`
- [ ] `supabase/migrations/0012_assignment_visibility_hardening.sql`
- [ ] `supabase/migrations/0013_staff_content_and_notifications.sql`
- [ ] `supabase/migrations/0014_account_lifecycle_completion.sql`
- [ ] `supabase/migrations/0015_curriculum_authoring_policies.sql`
- [ ] `supabase/migrations/20261007144203_noata_ai_request_idempotency.sql`
- [ ] `supabase/migrations/20261007201149_noata_admin_ai_usage_summary.sql`
- [ ] `supabase/migrations/20261007215014_fix_ai_quota_private_schema_execution.sql`
- [ ] `supabase/migrations/20261008150000_private_ai_documents.sql`
- [ ] `supabase/migrations/20261008170000_learning_authorization_hardening.sql`

### Supabase Edge Functions (3 files)
- [ ] `supabase/functions/noata-ai/deno.json`
- [ ] `supabase/functions/noata-ai/deno.lock`
- [ ] `supabase/functions/noata-ai/index.ts`

### Legacy Node server and domain logic (7 files)
- [ ] `lib/chat-continuation.mjs`
- [ ] `lib/chat-reasoning.mjs`
- [ ] `lib/domain.mjs`
- [ ] `lib/generationLock.mjs`
- [ ] `lib/seed.mjs`
- [ ] `lib/store.mjs`
- [ ] `server.mjs`

### Legacy browser, assets and service worker (18 files)
- [ ] `public/app.js`
- [ ] `public/chat.js`
- [ ] `public/favicon.svg`
- [ ] `public/index.html`
- [ ] `public/langdetect.js`
- [ ] `public/manifest.webmanifest`
- [ ] `public/markdown.js`
- [ ] `public/styles.css`
- [ ] `public/sw.js`
- [ ] `public/vendor/fonts/cairo/cairo-arabic.woff2`
- [ ] `public/vendor/fonts/cairo/cairo-latin-ext.woff2`
- [ ] `public/vendor/fonts/cairo/cairo-latin.woff2`
- [ ] `public/vendor/tesseract/ara.traineddata.gz`
- [ ] `public/vendor/tesseract/eng.traineddata.gz`
- [ ] `public/vendor/tesseract/tesseract-core-simd.wasm`
- [ ] `public/vendor/tesseract/tesseract-core-simd.wasm.js`
- [ ] `public/vendor/tesseract/tesseract.min.js`
- [ ] `public/vendor/tesseract/worker.min.js`

### QA runners, SQL fixtures and automation (25 files)
- [ ] `.github/workflows/noata-ci.yml`
- [ ] `scripts/authenticated-aura-smoke.mjs`
- [ ] `scripts/browser-aura-smoke.mjs`
- [ ] `scripts/browser-launch-smoke.mjs`
- [ ] `scripts/cleanup-staging-documents.mjs`
- [ ] `scripts/configure-noata-staging-auth.mjs`
- [ ] `scripts/configure-noata-staging-auth.test.mjs`
- [ ] `scripts/database-migrations-smoke.mjs`
- [ ] `scripts/document-export-smoke.mjs`
- [ ] `scripts/email-templates.test.mjs`
- [ ] `scripts/install-qa-chrome.mjs`
- [ ] `scripts/lib/public-curriculum-fixture.mjs`
- [ ] `scripts/lib/qa-browser.mjs`
- [ ] `scripts/lib/ui-account-fixture.mjs`
- [ ] `scripts/qa-browser.test.mjs`
- [ ] `scripts/report-qa-diagnostics.mjs`
- [ ] `scripts/sql/local-supabase-fixture.sql`
- [ ] `scripts/sql/security-regressions.sql`
- [ ] `test/api.test.mjs`
- [ ] `test/chat-continuation.test.mjs`
- [ ] `test/chat-reasoning.test.mjs`
- [ ] `test/domain.test.mjs`
- [ ] `test/generationLock.test.mjs`
- [ ] `test/langdetect.test.mjs`
- [ ] `test/markdown.test.mjs`

### Docs and operational runbooks (25 files)
- [ ] `docs/AI_ARCHITECTURE.md`
- [ ] `docs/AI_CAPABILITY_MATRIX.md`
- [ ] `docs/CONTENT_GUIDE.md`
- [ ] `docs/DECISIONS.md`
- [ ] `docs/DEPLOYMENT.md`
- [ ] `docs/DESIGN_SYSTEM.md`
- [ ] `docs/ENVIRONMENT_VARIABLES.md`
- [ ] `docs/IMPLEMENTATION_STATUS.md`
- [ ] `docs/LAUNCH_CHECKLIST.md`
- [ ] `docs/NOATA_AURA_AUDIT.md`
- [ ] `docs/NOATA_AURA_FINAL_RELEASE_GATES.md`
- [ ] `docs/NOATA_AURA_PHASE4_MATRIX.md`
- [ ] `docs/NOATA_AURA_PHASE5_MATRIX.md`
- [ ] `docs/NOATA_AURA_RENAISSANCE_MASTER_PLAN.md`
- [ ] `docs/NOATA_CI_BROWSER_INCIDENT.md`
- [ ] `docs/NOATA_CONNECTED_STAGING_VERIFICATION_20261008.md`
- [ ] `docs/NOATA_STAGING_AUTH_SETUP.md`
- [ ] `docs/NOATA_STAGING_MIGRATION_REVIEW.md`
- [ ] `docs/NOATA_STAGING_PROPOSAL.md`
- [ ] `docs/OPEN_WEBUI_LICENSE_NOTES.md`
- [ ] `docs/OPERATIONS.md`
- [ ] `docs/PRODUCTION_ARCHITECTURE.md`
- [ ] `docs/ROLLBACK.md`
- [ ] `docs/TESTING.md`
- [ ] `docs/THIRD_PARTY_NOTICES.md`

### Repository root and other configuration (7 files)
- [ ] `.claude/launch.json`
- [ ] `.env.example`
- [ ] `.gitignore`
- [ ] `README.md`
- [ ] `package.json`
- [ ] `pnpm-lock.yaml`
- [ ] `pnpm-workspace.yaml`

### Unclassified paths
- [ ] `apps/web/AGENTS.md`
- [ ] `apps/web/next.config.ts`
- [ ] `apps/web/package.json`
- [ ] `apps/web/postcss.config.mjs`
- [ ] `apps/web/proxy.ts`
- [ ] `apps/web/public/fonts/OFL-NotoSansArabic.txt`
- [ ] `apps/web/public/fonts/cairo-arabic.woff2`
- [ ] `apps/web/public/fonts/cairo-latin.woff2`
- [ ] `apps/web/public/fonts/noto-sans-arabic.woff2`
- [ ] `apps/web/public/icon.svg`
- [ ] `apps/web/public/manifest.webmanifest`
- [ ] `apps/web/public/noata-mark-light.svg`
- [ ] `apps/web/public/noata-mark.svg`
- [ ] `apps/web/public/offline.html`
- [ ] `apps/web/public/sw.js`
- [ ] `apps/web/tsconfig.json`
## Executable discovery and current acceptance ledger

Run `pnpm scope:check`. The checker reconciles every tracked/nonignored candidate file with this manifest, hashes source contents, discovers every Next page/handler and follows static component imports to enumerate controls and backend operations. Missing, stale or duplicate entries fail CI. `artifacts/noata-scope/outcome.json` is **static discovery only**, not authenticated, live schema or functional certification. Dynamic and delegated interactions require manual completion; [the current acceptance ledger](NOATA_AURA_ACCEPTANCE_LEDGER.md) identifies the full route/system worklist and outstanding real-world gates.

- [ ] `docs/NOATA_AURA_EXHAUSTIVE_SCOPE_MANIFEST.md`
- [ ] `docs/NOATA_AURA_ACCEPTANCE_LEDGER.md`
- [ ] `apps/web/lib/preferences/palette.ts`
- [ ] `apps/web/lib/preferences/palette.test.ts`
- [ ] `scripts/renaissance-scope.mjs`
- [ ] `scripts/renaissance-scope.test.mjs`
- [ ] `scripts/palette-aura-smoke.mjs`
- [ ] `scripts/pwa-cache.test.mjs`
- [ ] `apps/web/lib/dashboard/visibility.ts`
- [ ] `apps/web/lib/dashboard/visibility.test.ts`

## Acceptance ledger format — mandatory per user action
| Field | Required proof |
|---|---|
| User action, route, role and starting state | Recorded scenario and exact page/fragment |
| Backend operation, RPC, table, data owner and expected write | Schema/policy link and verified request/receipt |
| Arabic and English UI result | Screenshots/screenshare with correct labels, RTL/LTR and states |
| Success, error, retry, offline, duplicate, timeout, account switch | Automated and human assertions |
| Theme, screen size, keyboard, touch, low motion | Visual/accessibility evidence |
| Deployed SHA, CI run and environment identity | Exact-head evidence and reviewed failures |
| Status | Verified / Implemented-unverified / Not started / Blocked / Failed |

## Hard stop conditions
A task cannot be declared complete if even one currently advertised route or service has dead UI, misdirected auth, unsaved work presented as saved, forged points, broken permissions, exposed private data, fake AI provider response, broken Quran provenance, unacceptable contrast on any supported theme, or a deployment pointing at an older commit. Risk-based exceptions must be disclosed and explicitly approved by the owner rather than concealed.

**Next step:** Re-audit this entire manifest when project files change, then implement verified end-to-end vertical slices. PR #3 stays draft; staging only, no destructive or production changes without approval.
