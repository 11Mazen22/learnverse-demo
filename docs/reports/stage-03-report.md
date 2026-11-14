# Noäta 2.0 — Stage 03 Report: Intelligent Home, Student Dashboard & `M1` Persistence

- **Status**: Complete & Verified
- **Artifacts**:
  - `artifacts/stage-03-dashboard/dash-classic-light-ar-1440.png`
  - `artifacts/stage-03-dashboard/dash-midnight-dark-ar-1440.png`
  - `artifacts/stage-03-dashboard/dash-classic-light-en-390.png`

## 1. Delivered Architecture & Changes

1. **Additive Migration `M1` & Contract Sync (`user_settings.dashboard_preferences`)**
   - [`supabase/migrations/20261114000000_user_settings_dashboard_preferences.sql`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/supabase/migrations/20261114000000_user_settings_dashboard_preferences.sql): Added `public.user_settings.dashboard_preferences jsonb NOT NULL DEFAULT '{}'::jsonb` with `check (jsonb_typeof(dashboard_preferences) = 'object')` and strict least-privilege grants (`REVOKE ALL FROM public, anon; GRANT SELECT, INSERT, UPDATE TO authenticated;`).
   - [`apps/web/lib/supabase/database.types.ts`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/lib/supabase/database.types.ts): Added `dashboard_preferences: Json` on `user_settings` `Row`, `Insert`, and `Update` definitions.
   - [`scripts/database-recovery-rehearsal.mjs`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/scripts/database-recovery-rehearsal.mjs): Synchronized delta migration count expectation (`assert.equal(delta.length, 32)`).
   - [`test/dashboard-preferences-migration.test.mjs`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/test/dashboard-preferences-migration.test.mjs) & [`package.json`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/package.json): Added `M1` SQL/privilege unit verification and wired it into `modern:test`.

2. **Deterministic Priority, Activity & Preferences Engines**
   - [`apps/web/lib/dashboard/next-action.ts`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/lib/dashboard/next-action.ts) & [`next-action.test.ts`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/lib/dashboard/next-action.test.ts): Deterministic `computeNextAction()` priority evaluator (Urgent Due/Overdue Assignments within 24h -> Retention Backlog (`skill_evidence` / `flashcards` due) -> First Incomplete Enrolled Lesson -> Honest Preview/Starter CTA with zero fake counts).
   - [`apps/web/lib/dashboard/activity.ts`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/lib/dashboard/activity.ts) & [`activity.test.ts`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/lib/dashboard/activity.test.ts): Pure 14-day study consistency heatmap builder (`buildConsistencyHeatmap`) aggregating verified `attempts`, `flashcard_reviews`, and `lesson_progress.completed_at` timestamps with truthful empty states.
   - [`apps/web/lib/dashboard/preferences.ts`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/lib/dashboard/preferences.ts) & [`preferences.test.ts`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/lib/dashboard/preferences.test.ts): Canonical v1 `dashboard_preferences` parser/serializer (`parseDashboardPreferences`, `serializeDashboardPreferences`, `toggleWidgetVisibility`, `moveWidgetOrder`, `scopedDashboardPreferencesKey`).

3. **Redesigned Cockpit UI, Widget Customizer & Theme Parity**
   - [`apps/web/components/dashboard/customize-drawer.tsx`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/components/dashboard/customize-drawer.tsx): Tier 3 `<Drawer>` UI for toggling dashboard widgets, accessible keyboard up/down reordering, tuning weekly goals (`weeklyCardsTarget` `5..500`, `weeklyLessonsTarget` `1..50`, `dailyMinutesTarget` `10..240`), and resetting defaults.
   - [`apps/web/components/dashboard/dashboard-live.tsx`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/components/dashboard/dashboard-live.tsx): Consolidated the 3 stacked blocks into `.dashboard-hero.nk-home-hero`, integrated `computeNextAction` (`[data-tour="next-action"]`), 14-day consistency heatmap, weekly goal bars, inline optimistic `study_tasks` completion/rollback preserving `completed_at` CHECK integrity, strict visual & computational separation between XP/Level and Skill Mastery (`[data-tour="learning-evidence"]`), full preservation of tour/brand selectors (`.noata-logo-vector .noata-mark-ribbon`, `dashboard-welcome`, `study-plan`, `curriculum-tracks`, `learning-tools`), zero legacy third-party brand strings (`QuizGecko` removed), and decoupled UI layout customization state from offline `account.error` while keeping learner evidence strictly server-verified.
   - [`apps/web/app/dashboard-renaissance.css`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/app/dashboard-renaissance.css): Pure `@layer sections` styling using Tier 1/2 semantic tokens with zero `!important`, zero hardcoded dark `#091222` light leaks, higher-specificity `.db-cockpit` hero framing, and full-opacity high-contrast heatmap day labels (`color-mix(in srgb, var(--ink) 80%, var(--muted))`).

## 2. Verification Results

- **Static, Unit & Build Suite** (executed sequentially in `task-1663` after final CSS contrast fix):
  - `pnpm check:text`: **PASS** (`666 tracked UTF-8 text files; no replacement glyphs or bidi controls`).
  - `pnpm typecheck`: **PASS** (`packages/core` and `@noata/web`).
  - `pnpm modern:test`: **615 PASS, 0 FAIL, 2 SKIP** (`617` total tests; 2 PDF raster tests in `pdf-page-edit.test.ts` skipped due to missing `pdftoppm` on Windows host).
  - `pnpm legacy:check`: **704 PASS, 0 FAIL, 9 SKIP** (`713` total tests; skipped `pdftoppm` and Python-dependent `office-preservation.test.ts` tests unavailable locally).
  - `pnpm --filter @noata/web build`: **PASS** (`42` App Router routes compiled & typechecked cleanly).
- **Headless Chrome E2E & Accessibility (`stage03_verify.mjs`)**:
  - **Contracts & DOM Structure**: All 6 `[data-tour="*"]` targets present, hero logo `.noata-logo-vector .noata-mark-ribbon` present with gradient `backgroundImage`, `hasQuizGecko: false`, `heatCells: 14`, `subjectCards: 6`, `nextBg: rgb(244, 247, 252)` (light polarity clean), desktop horizontal overflow `<= 0`.
  - **Widget Customizer Persistence & Reset**: Toggle widget visibility, save to scoped storage, reload to verify persistence, reset defaults — **PASS**.
  - **Full Palette × Mode Matrix (`axe-core` WCAG 2.2 AA)**: All **13** valid combinations (`classic`, `aura`, `ocean`, `forest`, `sunset`, `rose` × `light`/`dark` + `midnight` `dark`) tested with **0 violations**.
  - **Mobile `390px` EN LTR**: Horizontal overflow `<= 0`, **0 `axe-core` WCAG 2.2 AA violations**, screenshots visually inspected.
- **Environment Constraints**: Docker and Deno remain unavailable on this Windows host; live Postgres `M1` migration execution and Deno checks remain CI-gated and were not run locally.
