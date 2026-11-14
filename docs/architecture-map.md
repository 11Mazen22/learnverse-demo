# Noäta 2.0 · Stage 00 Architecture Intelligence Map & Baseline Report

**Captured At**: `2026-11-13`  
**Baseline Git Commit (`HEAD`)**: `2826da1a887a2e6b219243df07ce50f9e7f4f49a` (`git status --short`: clean before deliverable write)  
**Audit Scope**: Read-only discovery across `apps/web`, `packages/core`, `supabase/migrations`, `supabase/functions/noata-ai`, `scripts`, `test`, and `.github/workflows`. Zero workspace application source files or database schemas were modified during Stage 00.

---

## 1. Environment & Toolchain Baseline

- **Host Runtime**: Windows (`win32 x64`), Node.js `v24.18.1`, `pnpm@10.17.1`, Next.js `16.4.1` (Turbopack), React `19.3.1`, `@supabase/ssr@0.10.3`, `@supabase/supabase-js@2.117.3`.
- **Available Local QA Binaries**: Google Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`), Microsoft Edge (`msedge.exe`), Playwright Chromium cache (`%LOCALAPPDATA%\ms-playwright\chromium-1248`), Python (verified via passing `office-preservation.test.ts`).
- **Missing Local Binaries (CI-Only Locally)**: `docker` (cannot execute local Postgres `database-migrations-smoke.mjs` / `database-recovery-rehearsal.mjs` locally), `deno` (cannot execute `deno check` locally), and `pdftoppm` (`poppler-utils`, causing `2` expected skips in `pdf-page-edit.test.ts`).
- **Local Env Posture**: Neither `.env` nor `apps/web/.env.local` exists locally; browser baseline tests ran against a clean local Next production build using the repository's staging network-isolation fixture (`NEXT_PUBLIC_SUPABASE_URL=https://vpfpjvhafkmygetjkfcp.supabase.co`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_network_isolation_fixture_only`, `NEXT_PUBLIC_NOATA_DEPLOYMENT_ENV=preview`).

---

## 2. Route, API, Proxy & Edge Function Inventory

### A. App Router Pages (`33` `page.tsx` routes + `not-found.tsx` + `error.tsx` + `loading.tsx`)

| Route | Source | Rendering | Wrapper / Shell | Access Gate | Primary Component |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `apps/web/app/page.tsx:1-19` | SSR (`searchParams`) | Standalone if `view==="marketing" \|\| mode==="landing"`, else `AppShell active="/"` | Public | `<HomeMarketing />` / `<DashboardLive />` |
| `/dashboard` | `apps/web/app/dashboard/page.tsx:1-15` | SSR | `AppShell active="/"` | Public shell | `<DashboardLive />` |
| `/learn` | `apps/web/app/learn/page.tsx:1-10` | SSR | `AppShell active="/learn"` | Public | `<LearnLive />` |
| `/lesson/[id]` | `apps/web/app/lesson/[id]/page.tsx:1-15` | SSR (`params`) | `AppShell active="/learn"` | Public | `<LessonLive id={id} />` |
| `/study` | `apps/web/app/study/page.tsx:1-10` | SSR | `AppShell active="/study"` | Public shell (locks on `account.error`) | `<StudyLive />` |
| `/missions` | `apps/web/app/missions/page.tsx:1-10` | SSR | `AppShell active="/missions"` | Public | `<MissionLive />` |
| `/review` | `apps/web/app/review/page.tsx:1-9` | SSR | `AppShell active="/review"` | Public | `<ReviewLive />` |
| `/boss` | `apps/web/app/boss/page.tsx:1-9` | SSR | `AppShell active="/boss"` | Public | `<BossLive />` |
| `/ai` | `apps/web/app/ai/page.tsx:1-5` | SSR | Standalone (custom `.owui-layout`) | Public shell | `<NoataAIClient />` |
| `/quran` | `apps/web/app/quran/page.tsx:1-9` | SSR | `AppShell active="/quran"` (+ `quran.css`, `mushaf-renaissance.css`) | Public | `<QuranReader />` |
| `/progress` | `apps/web/app/progress/page.tsx:1-9` | SSR | `AppShell active="/progress"` | Public shell | `<ProgressLive />` |
| `/rewards` | `apps/web/app/rewards/page.tsx:1-9` | SSR | `AppShell active="/rewards"` | Public shell | `<RewardsLive />` |
| `/assignments` | `apps/web/app/assignments/page.tsx:1-9` | SSR | `AppShell active="/assignments"` | Public shell (`ModuleWelcome`) | `<AssignmentsLive />` |
| `/notifications` | `apps/web/app/notifications/page.tsx:1-9` | SSR | `AppShell active="/notifications"` | Public shell (`ModuleWelcome`) | `<NotificationsLive />` |
| `/help` | `apps/web/app/help/page.tsx:1-18` | SSR | `AppShell active="/help"` | Public | `<HelpCenter />` + `<HelpCenterLive />` |
| `/settings` | `apps/web/app/settings/page.tsx:1-9` | SSR | `AppShell active="/settings"` | Public shell (locks on `account.error`) | `<SettingsLive />` |
| `/teacher` | `apps/web/app/teacher/page.tsx:1-13` | SSR | `AppShell active="/teacher" role="teacher"` | `<RoleGate allow={["teacher","admin"]}>` | `<TeacherLive />` |
| `/admin` | `apps/web/app/admin/page.tsx:1-13` | SSR | `AppShell active="/admin" role="admin"` | `<RoleGate allow={["admin"]}>` | `<AdminLive />` |
| `/landing`, `/about`, `/curriculum`, `/features`, `/how`, `/faq` | `apps/web/app/*/page.tsx` | SSR | Standalone `MarketingShell` | Public | Marketing components |
| `/privacy`, `/terms` | `apps/web/app/{privacy,terms}/page.tsx` | SSR | Standalone `LegalPage` | Public | `<LegalPage />` |
| `/signup` | `apps/web/app/signup/page.tsx:1-6` | SSR | `redirect("/login?mode=signup")` | Public | Redirect only (strips query params) |
| `/login` | `apps/web/app/login/page.tsx:1-352` | Client | Standalone | Public | Auth login/signup form |
| `/auth/callback`, `/auth/check-email`, `/auth/complete`, `/auth/error`, `/auth/forgot-password`, `/auth/update-password` | `apps/web/app/auth/*/page.tsx` | Client | Standalone | Auth flow / recovery grant check on `update-password` & `complete` | Auth flow views |
| System files (`layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `robots.ts`, `sitemap.ts`, `proxy.ts`) | `apps/web/app/*`, `apps/web/proxy.ts` | Mixed | `RootLayout` imports `29` CSS files + `katex.min.css` | — | Global shell providers & Next 16 `proxy()` |

### B. Next.js Route Handlers (`8` endpoints)

| Endpoint | File | Methods | Auth Check | CSRF / Origin Guard | External / DB Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/health` | `apps/web/app/health/route.ts` | `GET` | None | None | Returns `{ ok, service, version, revision, timestamp }` (`no-store`) |
| `/api/qa-target` | `apps/web/app/api/qa-target/route.ts` | `GET` | None | None | Returns `404` unless `NOATA_STAGING_QA_ENABLED==="true"` & non-prod `AURA_STAGING_DB_REF` |
| `/api/ai/chart-pdf` | `apps/web/app/api/ai/chart-pdf/route.ts` | `POST` | `auth.getUser()` (`401`) | Strict `isSameOriginMutation` (`403`) + `application/json` (`415`) | Puppeteer (`renderNoataPdf`, external network aborted); rate-limited `3/60s` + concurrency `2` |
| `/api/documents` | `apps/web/app/api/documents/route.ts` | `GET, POST, DELETE` | `auth.getUser()` (`401`, except `?capabilities`) | `POST`/`DELETE`: `isSameOriginMutation` (`403`) | `ai_document_files`, `ai_conversations`, Storage bucket `noata-documents`; gated by `NOATA_DOCUMENT_STORAGE_ENABLED` |
| `/api/documents/pdf` | `apps/web/app/api/documents/pdf/route.ts` | `POST` | `auth.getUser()` (`401`) | Strict `isSameOriginMutation` (`403`) + `application/json` (`415`) | Puppeteer (`renderNoataPdf`); max `800 KB` JSON / `100k` chars |
| `/api/pdf` | `apps/web/app/api/pdf/route.ts` | `POST` | `auth.getUser()` (`401`) | Strict `isSameOriginMutation` (`403`) + `application/json` (`415`) | Local fonts + `pdf-lib` (`generateArabicPdf`), zero HTTP calls; rejects PDF `> 15 MiB` |
| `/api/quran` | `apps/web/app/api/quran/route.ts` | `GET` | Public | None | `api.alquran.cloud`, `everyayah.com` (`24h` memory cache, `8 MiB` stream cap), `mp3quran.net` |
| `/api/support/ticket` | `apps/web/app/api/support/ticket/route.ts` | `POST` | Optional `auth.getUser()` | **Checks `Origin` only if header is present (`:52`)** | Inserts `support_tickets`, calls RPC `record_support_ticket_delivery`, sends via `api.resend.com` |

### C. Edge Function `supabase/functions/noata-ai/index.ts` (Deployed as `noata-ai` / candidate `noata-ai-v2`)

- **Auth & Isolation**: `POST` only (`OPTIONS` -> `204`); validates JWT via `client.auth.getUser()` (`401`); uses `SUPABASE_SECRET_KEY` service client for `claim_ai_quota`, `ai_request_receipts`, `ai_memory_consent`, `ai_user_memories`, `ai_conversations`, `ai_messages`, `noata_provider_secret`, and Storage buckets `noata-uploads` (`10 MiB` cap, strict `<userId>/` path check -> `403`) & `noata-generated` (`3600s` signed URLs).
- **Supported `action` Values**:
  - `?action=stt` (multipart `FormData`, bypasses receipt table)
  - Side-effect-free JSON actions: `"readiness"`, `"capabilities"`
  - Receipt-deduplicated & quota-enforced JSON actions: `"chat"` (default; streaming SSE or JSON; routes across `Fanar`, `Fanar-S-1-7B`, `Fanar-C-1-8.7B`, `Fanar-C-2-27B`, `Fanar-Sadiq`, `Fanar-Sadiq-2` [gated by `NOATA_SADIQ_2_ENABLED`], `Fanar-Oryx-IVU-2`, `Fanar-Guard-2`, `Fanar-Diwan`), `"plan"`, `"document"`, `"suggestions"`, `"capability_execute"`, `"translate"` (`Fanar-Shaheen-MT-1`), `"poem"` (`Fanar-Diwan`), `"moderate"` (`Fanar-Guard-2`), `"image"` (`Fanar-Oryx-IG-2`), `"tts"` (`Fanar-Sadiq-TTS-1` / `Fanar-Aura-TTS-2`), `"transcribe_storage"`, `"sadiq_validate"`, `"sadiq_research"`.

---

## 3. Component → Hook → Service → Data Dependency Graph

### A. Root Provider Tree & Global DOM Contracts (`apps/web/app/layout.tsx:72-86`)
`<html lang dir suppressHydrationWarning>` → `LocaleProvider` → `VerifiedAccountProvider` (`useVerifiedAccount`) → `AuraTourProvider` (`TourEngine`) → `{ LocalizedSkipLink, PwaRegister, ExperienceBoot, children, ConfirmHost, TooltipHost }`.
- **Root `<html>` attributes**: `data-theme` (`light|dark`), `data-palette` (`classic|aura|ocean|forest|sunset|rose|midnight|custom`), `data-mode-constraint` (`dark|light|none`), `data-reduced-motion` (`true|false`), `data-noata-motion` (`reduce|off`). (`data-theme-mode` does not exist.)
- **Global Overlay Contracts**: `ConfirmHost` (`dialog.noata-confirm`), `TooltipHost` (`#noata-global-tooltip` portal at `z-index: 2147483000`), `TourEngine` (`.aura-tour-backdrop` at `z-index: 9998-10000`), **no global `ToastProvider`** exists (only a demo element in `settings-live.tsx:550`).
- **Custom Window Events**: `noata-palette-change`, `noata-custom-theme-change`, `noata-notifications-updated`, `noata-locale-change`, `noata:motion-preference`, `noata-feature-seen`, `noata-quran-playback-start`, `storage`.

### B. Client Module → Supabase / API / Edge Dependency Matrix

| Module | Tables Queried / Mutated | RPCs / Edge / API |
| :--- | :--- | :--- |
| **Dashboard (`dashboard-live.tsx`)** | `lessons`, `curriculum_tracks`, `subjects`, `units`, `profiles`, `skill_evidence`, `skills`, `lesson_progress`, `notifications`, `curriculum_enrollments` (`select/upsert`), `study_tasks` | None |
| **Study (`study-live.tsx`, `interactive-quiz-runner.tsx`, `flashcard-review-studio.tsx`, `quizgecko-engine.ts`)** | `study_tasks`, `flashcard_decks`, `flashcards` | RPC `review_flashcard`; Edge `noata-ai-v2` (`quizgecko-engine.ts:477` broken `{ action: "chat", message }` payload) |
| **Learn (`learn-live.tsx`, `lesson-live.tsx`)** | `curriculum_tracks`, `subjects`, `units`, `lessons`, `lesson_progress`, `curriculum_enrollments`, `questions` (`lesson-live`) | None |
| **Missions (`mission-live.tsx`)** | `lessons`, `units`, `curriculum_enrollments`, `curriculum_tracks`, `questions`, `ledger` | RPCs `submit_attempt`, `complete_lesson` |
| **Review (`review-live.tsx`)** | `skill_evidence`, `skills`, `curriculum_tracks`, `questions`, `attempts` | RPC `submit_attempt` |
| **Boss (`boss-live.tsx`)** | `curriculum_enrollments`, `curriculum_tracks`, `units`, `questions` | RPCs `submit_attempt`, `complete_unit_boss`, `claim_reward_box` |
| **Noäta AI (`noata-ai-client.tsx`, `use-ai-workspace.ts`)** | `ai_conversations`, `ai_messages`, `ai_attachments`, `ai_artifacts`, `ai_document_files`, `ai_projects`, `ai_memory_consent`, `ai_user_memories`, `user_settings`, `flashcard_decks`, `flashcards` | Storage `noata-uploads`, `noata-generated`, `noata-ai-artifacts`, `noata-documents`; Edge `noata-ai-v2` (all active actions); APIs `/api/documents`, `/api/documents/pdf`, `/api/pdf`, `/api/ai/chart-pdf`, `/api/quran` |
| **Quran (`quran-reader.tsx`)** | None | `GET /api/quran` via `useSWR` |
| **Progress (`progress-live.tsx`)** | `skill_evidence`, `skills` | Writes `sessionStorage["noata-ai-pending-context-v1"]` |
| **Rewards (`rewards-live.tsx`)** | `shop_items`, `profiles`, `inventory`, `equipped_cosmetics`, `reward_boxes`, `ledger` | RPCs `purchase_shop_item`, `equip_cosmetic`, `claim_reward_box` |
| **Assignments (`assignments-live.tsx`)** | `assignments`, `classes`, `assignment_submissions` (`select/insert`), `assignment_items`, `questions` | RPC `submit_attempt` |
| **Notifications (`notifications-live.tsx`, `notification-bell.tsx`)** | `notifications` (`select`, `update read_at`) | Dispatches `noata-notifications-updated` |
| **Help (`help-center-live.tsx`)** | None directly | `POST /api/support/ticket` |
| **Teacher (`teacher-live.tsx`)** | `classes`, `assignments`, `assignment_items`, `questions`, `assignment_submissions`, `profiles`, `class_memberships`, `lesson_progress` *(never queries/writes `notifications`)* | `useConfirmedMutation` |
| **Admin (`admin-live.tsx`, `curriculum-*.tsx`, `support-*.tsx`, `operations-live.tsx`)** | `questions`, `profiles`, `classes`, `class_memberships`, `teacher_class_access`, `lessons`, `skills`, `subjects`, `curriculum_tracks`, `courses`, `units`, `audit_events`, `support_tickets` | RPCs `transition_question`, `create_question_draft`, `set_user_role`, `admin_ai_usage_summary` |
| **Settings & Preferences (`settings-live.tsx`, `design-studio.tsx`, `palette-gallery.tsx`)** | `profiles`, `user_settings`, `user_theme_designs` | `auth.updateUser`, `auth.signOut`, Edge `noata-ai-v2` (`design-studio.tsx:291` valid `messages[]`) |
| **Tour (`tour-engine.tsx`)** | `user_tour_progress` | None |

### C. Browser Storage Surface (`4` `sessionStorage` + `11` `localStorage` keys)

- **`sessionStorage`** *(none cleared automatically on `auth.signOut()`)*: `noata-auth-recovery-v1` (owner-checked, 15m TTL), `noata-auth-completion-v1` (owner-checked, 10m TTL), `noata-ai-pending-context-v1` (owner-checked, 120s TTL), `noata-ai-suggestions-v1:welcome:${userId}:${locale}:${yes|no}` (5m TTL).
- **`localStorage`** *(none cleared on `auth.signOut()`)*:
  - **Device-wide / Unscoped**: `noata-theme`, `noata-palette`, `noata-locale`, `noata-ai-motion-v1`, `noata-ai-typography`, `noata-quran-reading-percent-v2`, `noata-quran-bookmarks-v1`, `noata_sidebar_collapsed`.
  - **User-scoped (`userId` key/prefix)**: `noata-ai-suggestions-v1:personalize:${userId}`, `noata_tour_state_v2:${userId}:${role}`, `noata:seen:${userId ?? "guest"}:${feature}:${version}`.

---

## 4. Supabase Schema, PostgreSQL Grants, Helpers & RLS Audit

- **Migration Count & CI Rehearsal Drift**: There are **`49` `.sql` files** in `supabase/migrations/` (`18` files `< '20261008150000'`, **`31` files `>= '20261008150000'`**). `scripts/database-recovery-rehearsal.mjs:17-21` still asserts `before.length === 18` and `delta.length === 28`, representing a pre-existing **`+3` migration assertion drift** from November 2026 migrations.
- **Database Objects**: **`0` SQL views**; **`4` enums** (`noata_role`, `mastery_state`, `question_review_status`, `question_publication_status`); **`47` `public` tables** (all `47` have `ENABLE ROW LEVEL SECURITY`); `private` schema hosts `SECURITY DEFINER` helpers and internal RPC backends. Custom themes live in **`public.user_theme_designs`** (there is no `user_themes` table).
- **Table Classification (`47` tables)**:
  - *PII / Private User & Personal Study (`16`)*: `profiles`, `user_settings`, `user_theme_designs`, `user_tour_progress`, `notifications`, `support_tickets`, `ai_conversations`, `ai_messages`, `ai_attachments`, `ai_document_files`, `ai_memory_consent`, `ai_user_memories`, `ai_projects`, `ai_artifacts`, `flashcard_decks`, `flashcards`.
  - *Academic, Class, Economy & Recall Logs (`19`)*: `attempts`, `skill_evidence`, `lesson_progress`, `boss_runs`, `ledger`, `inventory`, `equipped_cosmetics`, `purchases`, `mission_runs`, `reward_boxes`, `classes`, `class_memberships`, `teacher_class_access`, `assignments`, `assignment_items`, `assignment_submissions`, `curriculum_enrollments`, `study_tasks`, `flashcard_reviews`. *(Schema confirmed **single-institution**: `classes` has no `school_id` column.)*
  - *Curriculum Catalog, Storefront & Internal (`12`)*: `subjects`, `curriculum_tracks`, `courses`, `units`, `lessons`, `skills`, `questions`, `question_keys`, `shop_items`, `audit_events`, `ai_usage_events`, `ai_request_receipts`.

### Critical PostgreSQL Grant & RPC Verification Findings

| Target | Verified Grant / RLS Posture | Stage 04 / Stage 08 / Stage 10 Action Needed |
| :--- | :--- | :--- |
| **`public.flashcards`** (`20261029124338:144-152`) | `REVOKE ALL` from `anon, authenticated`; table-level `SELECT, DELETE` to `authenticated`; column-level `INSERT (deck_id, user_id, card_type, front, back, cloze_text, position, suspended)` and `UPDATE (card_type, front, back, cloze_text, position, suspended)` — `state`, `ease_factor`, `interval_days`, `repetitions`, `lapses`, `last_reviewed_at`, `due_at` excluded. | `M2` must keep explicit `REVOKE INSERT, UPDATE ON TABLE public.flashcards FROM authenticated` prior to re-granting content columns + `metadata`, verified via negative PostgREST tamper tests in `security-regressions.sql`. |
| **`public.review_flashcard`** (`20261029124338:155-289`) | Signature `(uuid, int, text) returns jsonb`. **Fresh branch returns `7` keys**: `{ card_id, rating, interval_days, ease_factor, due_at, state, duplicate: false }`. **Idempotent replay branch returns `6` keys (omits `state`)**. Neither branch returns `repetitions` or `lapses`. | Never change SQL return type in place with `CREATE OR REPLACE`. Preserve `jsonb` return keys cleanly (and align duplicate branch / `repetitions`/`lapses` or version as `review_flashcard_v2` in `M2`). |
| **`user_settings`, `assignments`, `assignment_submissions`, `audit_events`** | **Zero explicit `GRANT`/`REVOKE` statements in any migration** (rely solely on legacy schema defaults + RLS; newer tables in Supabase require explicit grants). | Explicitly audit `information_schema.table_privileges` and issue least-privilege `REVOKE`/`GRANT` statements in `M1`/`M3`. |
| **`public.attempts`** (`0007:96`) | `REVOKE INSERT, UPDATE, DELETE` from `authenticated`, **no explicit `REVOKE FROM anon`** (relies on RLS). | Add `REVOKE ALL ON public.attempts FROM anon` in hardening pass. |
| **`public.questions` & `public.question_keys`** | `0006` defined `is_staff()` write RLS policies, while `20261008170000:6-7` revoked write table grants from `anon, authenticated`. | Confirm write access happens strictly via `create_question_draft` & `transition_question` RPCs. |
| **`public.profiles`, `attempts`, `skill_evidence`, `lesson_progress`, `boss_runs`** | Protected by `private.can_read_student(uuid)` (`20261008170000:225-245`), already scoping teachers to assigned `teacher_class_access` + `class_memberships` rather than broad `is_staff()`. | Retain strict `can_read_student` / `can_manage_class` boundaries and verify cross-teacher isolation in SQL tests. |

---

## 5. Auth & Session Revision Flow Trace

1. **Request Middleware (`apps/web/proxy.ts` → `lib/supabase/proxy.ts`)**: Calls `supabase.auth.getClaims()` to refresh Supabase cookies on SSR requests. Performs **zero route protection or redirects**.
2. **Client Verification (`apps/web/lib/supabase/use-verified-account.tsx`)**: Guards against stale async auth reads with a monotonic `revision.current` counter, a `10s` `boundedRead` cap, a `12s` watchdog timer, and `onAuthStateChange` invalidation; queries `profiles(display_name, role)` validated against `["student","teacher","admin"]`.
3. **Host Origin Pinning (`apps/web/lib/auth/canonical-origin.ts`)**: Prevents PKCE state mismatch on preview subdomains when `NEXT_PUBLIC_AUTH_CANONICAL_ORIGIN` matches `NOATA_STAGING_AUTH_HOST`.
4. **Role UI Gate (`components/auth/role-gate.tsx`)**: Fails closed (`error`, `!user`, or disallowed `role`) on `/teacher` and `/admin`.
5. **Confirmed Gaps**:
   - Sign-out in `user-menu.tsx` and `settings-live.tsx` only clears AI RAM (`use-ai-workspace.ts:285-289`) and leaves all `localStorage` and `sessionStorage` entries behind on shared devices.
   - `StudyLive` and `SettingsLive` treat `account.error` (e.g., offline / network failure) as a full-screen fatal lock, blocking guest study and theme settings access (visually verified in Stage 00 screenshots).

---

## 6. Exhaustive Defect, Security, Dead-Code & CSS Conflict Register

### A. Functional Bugs, Contracts & Type Gaps
1. **Broken Study AI Generator (`apps/web/lib/study/quizgecko-engine.ts:477`)**: Invokes `noata-ai-v2` with `{ action: "chat", message: prompt }` reading `data?.response`, failing HTTP `400` because `noata-ai` requires `messages: [...]` and returns `{ content }`.
2. **Flashcard Auto-Advance on Unthrown Error (`components/study/flashcard-review-studio.tsx:68,73-77`)**: Advances `currentIndex` even when `reviewCard` fails without throwing.
3. **Broken 3D Card Sizing (`app/study-experience.css:407-443`)**: `.noata-3d-face { position: absolute; inset: 0; }` detaches front/back faces from intrinsic height inside `min-height: 380px`, clipping long/KaTeX cards.
4. **Password Policy Mismatch**: `/login` enforces `newPasswordProblem` (`12–128` chars + entropy, `lib/auth/password-policy.ts:6-15`), whereas `components/settings/settings-live.tsx:768,1088` only rejects `password.length < 8`.
5. **Signup Query Strip**: `app/signup/page.tsx:5` drops `?subject=`, `?track=`, `?feature=ai` when redirecting to `/login?mode=signup`.
6. **Help Form Bugs (`components/help/help-center-live.tsx:22-23,82`)**: Pre-hydration `useState` capture misses hydrated auth session, and error handling reads `data.error` instead of `data.errorEn`.
7. **Unconditional False Condition (`components/sidebar/sidebar-curriculum.tsx:139`)**: `active === "/learn" && false` prevents active track highlighting.
8. **Misrouted Study Link (`components/study/study-live.tsx:709`)**: Links to marketing `/curriculum` instead of `/learn`.
9. **Support API Origin Inconsistency (`app/api/support/ticket/route.ts:52`)**: Skips origin validation when `Origin` header is absent (unlike `/api/documents*`, `/api/pdf`, `/api/ai/chart-pdf`).
10. **Native Browser Dialogs (`2` `alert` + `8` `window.confirm`)**: `study-live.tsx:394,470,937,1162`, `interactive-quiz-runner.tsx:150`, `design-studio.tsx:513`, `memory-settings.tsx:77,86`, `project-library.tsx:110,132`.
11. **Unsafe Type Casts**: `(supabase.from as any)("support_tickets")` in `support-manager-admin.tsx:34,83`, `p_unit_id: null as unknown as string` in `admin-live.tsx:249`, `setView(tab as any)` in `study-live.tsx:179`.

### B. Dead / Unreferenced Code & Duplicated Logic
- **Unused Components / Exports**: `components/mobile-nav.tsx`, `components/sidebar/sidebar-types.ts`, `components/ai/answer-exports.tsx`, `components/ai/noata-launchpad.tsx` + `lib/ai/launch-actions.ts`, `components/quran/chapter-recitations.tsx`, `lib/ai/prompts.ts`, deprecated exports in `lib/curriculum/catalog.ts`, unused `reciterDisplayName` imports in `quran-navigator.tsx:2` & `quran-search.tsx:2`, dead `"verify"`/`"forgot"` branches in `app/login/page.tsx`, dead `!attempted.has(current.id)` guard in `mission-live.tsx:257`.
- **Duplicated Utilities**: `sanitizeBrandName` (`quizgecko-engine.ts` & `design-studio.tsx`), `crc32` (`docx-export.ts` & `office-preservation.ts`), `u16`/`u32` (3 AI files), `escapeHtml` (`pdf-export.ts` & `email-dispatcher.ts`), `refreshMessage` (3 admin/teacher components).

### C. CSS Cascade, Theme Contrast Leaks & Copy Integrity Defects
- **Zero CSS `@layer` Architecture**: `layout.tsx:14-43` loads `katex.min.css` + **`29` local CSS files totaling `14,012` lines and `1,622` `!important` declarations** (`design-rebirth.css`: `587`, `sidebar-rebirth.css`: `456`, `palette.css`: `357`), plus `5` route/module CSS files and colliding hardcoded `z-index` bands (`40` → `2147483000`). `.noata-sidebar-aura { overflow: hidden !important }` clips non-portaled menus.
- **Light/Dark Visual Leaks**:
  - `.db-spotlight` (`dashboard-renaissance.css:133-272`) renders a pitch-black card on Classic Light and Aura Light home pages (confirmed visually in Stage 00 screenshots).
  - `components/help/help-center-live.tsx:107-448` applies dark-only classes (`bg-[#0b1120]`, `bg-[#0c1427]`, `text-white`, `text-[#cbd5e1]`) inside light `<AppShell>`.
  - `palette.css` & `sidebar-rebirth.css` hardcode `color: #ffffff !important` on accent pills instead of `var(--on-accent)`.
  - `dashboard-live.tsx`, `interactive-quiz-runner.tsx`, `rewards-live.tsx`, `curriculum-manager.tsx`, and `admin-live.tsx` contain inline hardcoded dark/light hex colors.
- **Bilingual Text / Integrity Bugs**:
  - **Korean Hangul leak** inside Arabic copy: `components/admin/curriculum-catalog-admin.tsx:256` (`"ومسار 학습 ودروسه"` — missed by `check-text-integrity.mjs`).
  - **Mixed string & typo**: `curriculum-manager.tsx:718` (`"mastery المهارات"`), plus missing spaces in 11 JSX files (`help-center.tsx`, `quran-*`, `review-live.tsx`, `writing-studio.tsx`, etc.).
  - **Arabic QuizGecko branding**: Sidebar still labels Study Studio subtitle `"مولد كويزجيكو الذكي"`.
  - **Contradictory Support SLA**: `faq-marketing.tsx:270-271` promises `"within 24 working hours"` in EN while rejecting SLAs in AR; `marketing-shell.tsx:248` displays static `"All Systems Operational · 99.9% Uptime"`; personal Gmail `mazenshazly011@gmail.com` hardcoded in 7 files.

---

## 7. Pre-Redesign Baseline Metrics & Visual Evidence

### A. Static, Unit & Build Baseline
- `pnpm check:text`: **PASS** (`668` tracked UTF-8 files).
- `pnpm typecheck`: **PASS** (`@noata/web` `next typegen && tsc --noEmit`, `@noata/core` `tsc --noEmit`).
- `pnpm --filter @noata/web lint`: **No `lint` script configured** in `@noata/web/package.json`.
- `pnpm modern:test`: **`593` tests → `591` pass, `0` fail, `2` skipped** (`pdf-page-edit.test.ts` missing `pdftoppm`). *Note*: `apps/web/lib/ui/tooltip-position.test.ts` (`4` tests) is omitted from `modern:test`.
- `pnpm legacy:check`: **`693` tests → `684` pass, `0` fail, `9` skipped** (`2` `pdftoppm` + `7` Linux CI process/shebang tests in `qa-browser.test.mjs`).
- `pnpm --filter @noata/web build`: **PASS** (`Next.js 16.4.1`, `42/42` generated targets; `pdf.worker.min.mjs` `1,103,947` B; `.next/static/` total **`72` JS/CSS files = `4,186,707` B (~`4.0 MiB`) raw JS + `641,184` B (~`626 KiB`) raw CSS**; top 3 raw JS chunks: `905.5 KB`, `445.8 KB`, `419.4 KB`).

### B. Headless Chromium Baseline Metrics & Screenshots (`artifacts/stage-00-baseline/`)
Captured locally via CDP against production `next start` (`127.0.0.1:3099`) using Chrome. **`0` console errors / `0` uncaught exceptions** across all `16` captures, **`<= 0px` positive horizontal overflow**, and significant baseline Core Web Vitals bottlenecks identified:

| Route | Viewport / Theme / Locale | Overflow | FCP (ms) | LCP (ms) | CLS | Notable Baseline Finding |
| :--- | :--- | ---: | ---: | ---: | ---: | :--- |
| `/` | `1440px` `classic/light` `ar` (cold) | `-15px` | — | — | `0.0315` | `830,428` B cold transfer; 3 stacked top heroes + dark `.db-spotlight` leak on light background |
| `/` | `1440px` `midnight/dark` `ar` | `-15px` | `2976` | `3876` | `0.0044` | LCP `> 2.5s` budget |
| `/` | `390px` `classic/light` `ar` | `0px` | `3300` | `3864` | **`0.1060`** | Exceeds `CLS <= 0.10`; topbar wraps `"إعادة التحقق من الحساب"` onto extra row; hero obscures first action above fold |
| `/` | `320px` `classic/light` `ar` | `0px` | `2312` | `2312` | `0.0000` | Fits horizontally without positive overflow |
| `/dashboard` | `1440px` `aura/light` `en` | `-15px` | `3508` | **`5040`** | `0.0129` | Sidebar truncates `"Integrated ..."`; LCP `5.04s`; dark spotlight leaks on Aura Light |
| `/learn` | `1440px` `classic/light` `ar` | `-15px` | `3284` | `3668` | `0.0000` | LCP `> 2.5s` |
| `/study` | `1440px` `classic/light` `ar` | `0px` | `5328` | **`5328`** | `0.0000` | Blocked on `account.error` retry banner instead of graceful guest studio; LCP `5.33s` |
| `/study` | `390px` `aura/dark` `en` | `0px` | `7040` | **`7356`** | `0.0000` | LCP `7.36s` |
| `/ai` | `1440px` `classic/light` `ar` | `0px` | `5064` | **`6976`** | `0.0026` | Clean `.owui-*` rendering in guest mode; LCP `6.98s` |
| `/quran` | `1440px` `classic/light` `ar` | `-15px` | `2328` | `2328` | `0.0146` | Clean Mushaf rendering in guest mode |
| `/settings` | `1440px` `classic/light` `ar` | `0px` | `4572` | **`4572`** | `0.0000` | `853,372` B transfer; blocked on `account.error` retry banner instead of showing Design System / Theme controls |
| `/settings` | `768px` `midnight/dark` `en` | `0px` | `2868` | `3552` | `0.0000` | LCP `> 2.5s` |
| `/login` | `1440px` `classic/light` `ar` | `-15px` | `2460` | `3512` | `0.0209` | Clean split card layout |
| `/teacher` | `1440px` `classic/light` `ar` | `0px` | `1364` | `2280` | `0.0000` | `RoleGate` fails closed appropriately (`تعذّر التحقق من الصلاحيات`) |
| `/admin` | `1440px` `classic/light` `ar` | `0px` | `1872` | `2988` | `0.0000` | `RoleGate` fails closed appropriately |
| `/landing` | `1440px` `classic/light` `en` | `-15px` | `3916` | `3916` | **`0.9163`** | Severe `0.9163` layout shift + ignores light theme (`Classic` renders forced dark canvas) |

Raw metrics JSON and all 16 baseline PNG screenshots reside in `.gitignore`d `artifacts/stage-00-baseline/`.

---

## Stage 00 Gate & Next Authorization
- [x] Full Route, API, Proxy & Edge Function inventory verified against live files.
- [x] Full Component → Hook → Service → Supabase & Browser Storage graph verified.
- [x] Complete `49`-migration / `47`-table / grant / RLS / RPC audit recorded.
- [x] Dead code, bugs, CSS cascade (`1,622` `!important`), contrast leaks & bilingual integrity defects logged.
- [x] Baseline static checks, build chunks, Chrome metrics & screenshots captured cleanly (`git status` untouched outside this report).
- [ ] **Awaiting user sign-off of `docs/architecture-map.md` to authorize Stage 01 (4-Tier Design System & CSS `@layer` Architecture).**
