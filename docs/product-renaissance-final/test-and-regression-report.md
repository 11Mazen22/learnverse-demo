# Test, Verification & Regression Strategy Report

**Initiative:** Noäta 2.0 — Ultimate Learning Experience & Platform Renaissance  
**Phase:** Phase 0 (Audit & Planning Baseline)  
**Baseline Commit:** `f5a059a` (`master`)  
**Status:** Pre-Phase-1 Baseline Recorded; Phase 1–5 Verification Pending Implementation

---

## 1. Pre-Phase-1 Baseline Verification Snapshot

All checks below reflect the **last observed pre-Phase-1 run** (taken on the ChoiceCardGroup / inline `StudyRichText` baseline prior to writing the Phase 0 `docs/product-renaissance-final/` audit files and prior to any Phase 1–4 edits). Because Phases 1–4 will modify application, style, test, and potentially migration files, every gate must be re-executed after its changes and again in Phase 5.

| Check Command / Harness | Scope & Conditions | Observed Result | Skipped / Unavailable Items (Explicit) |
|---|---|---|---|
| `pnpm check:text` | Tracked repository UTF-8 & bidi character hygiene | **PASS** (`744` tracked files) | None *(re-run required after adding Phase 0 docs)* |
| `pnpm typecheck` | `packages/core` and `apps/web` TypeScript strict check | **PASS** (`0` errors) | None |
| `pnpm --filter @noata/web build` | Next.js production build using offline QA Supabase fixture env | **PASS** (`42/42` routes) | Mocked/fixture env; live Vercel build verified later |
| `pnpm modern:test` | Modern unit & integration suite (`704` tests) | **702 pass, 0 fail** | **`2` skipped** (`pdftoppm` not installed on Windows) |
| `pnpm legacy:check` | Legacy QA + contract checks (`800` tests) | **791 pass, 0 fail** | **`9` skipped** (`2` `pdftoppm` + `7` Linux CI Chrome fault-fixture tests in `qa-browser.test.mjs`) |
| `verify-final-release.mjs` | Headless Chrome + `axe-core` audit across `13` screens (`mocked Supabase fetch`) | **21/21 pass, 0 WCAG 2.2 AA violations** | Uses mocked Supabase `fetch`; does not cover live DB round-trips or newly broken routes (`/admin` Korean, `/help` split UI, UUID-disabled packs) |

### Local Environment Constraints (Windows Workstation)
The following verification suites are **unavailable locally on Windows** and are **CI-gated / Docker-required** (must be clearly reported as unavailable locally until executed in Linux CI or staging Docker):
1. **Docker Postgres migration & recovery replay:** `database-migrations-smoke.mjs`, `database-recovery-rehearsal.mjs`, and `security-regressions.sql` (asserts `before.length === 18` and `delta.length === 34` across the `52` SQL migrations).
2. **Supabase Edge Functions Deno check:** `deno check supabase/functions/noata-ai`.
3. **PDF image rasterization tests:** `2` tests requiring Poppler `pdftoppm`.
4. **Linux CI Chrome fault fixtures:** `7` tests in `qa-browser.test.mjs`.

---

## 2. Preserved Regression Contracts (Must Never Regress)

The Renaissance work must keep existing test assertions and DOM/CSS contracts green unless a deliberate specification explicitly evolves them alongside test updates:

1. **Sidebar CSS & Responsive Locks (`sidebar.test.ts`):**
   - Preserves `@media (min-width: 768px) and (max-width: 1180px)` tablet breakpoint contract.
   - Preserves `@media (max-width: 767px)` mobile breakpoint contract.
   - Preserves `.mobile-nav { position: fixed !important }` mobile navigation lock and `.mushaf-focused` Quran lock.
2. **Design System & Runtime Integrity (`design-system.test.ts`, `runtime-integrity.test.ts`):**
   - Preserves canonical 4-tier `@layer` ordering (`reset, vendor, tokens, theme, base, components, shell, patterns, sections, study, staff, utilities`).
   - Preserves existing interactive smoke hooks tested by `browser-aura-smoke.mjs` and `browser-tooltip-smoke.mjs`.
3. **Dashboard Preferences Schema v1 (`apps/web/lib/dashboard/preferences.test.ts`, `test/dashboard-preferences-migration.test.mjs`):**
   - `parseDashboardPreferences` & `serializeDashboardPreferences` round-trip equality (`assert.deepEqual(roundTrip, reordered)`) must remain backward-compatible; sidebar/motion shell preferences either merge cleanly without breaking v1 tests or live alongside in non-breaking fields within `user_settings.dashboard_preferences`.
4. **Database Recovery Rehearsal (`scripts/database-recovery-rehearsal.mjs`):**
   - Currently asserts `before.length === 18` and `delta.length === 34` (`52` SQL migrations total). If Phase 2 adds an additive `M4` staging-first curriculum fix migration (`53` total), `delta.length` expectation in this rehearsal script must be updated explicitly to `35` in the same PR.

---

## 3. Critical Blind Spots Identified in Existing Pre-Renaissance Tests

Phase 0 discovered why broken student experiences slipped past `21/21` Chrome and `702/704` unit passes:
- `lesson-live.tsx:209` omitted `slug` from its Supabase query, so `/lesson/[id]` fell back to `TOPIC_MODULES` and passed schema/build tests while silently bypassing all **46 canonical lesson packs**. Existing tests did not assert `getLessonStudyPack(lesson.slug)` hits a pack on `/lesson/[id]`.
- `mocked Supabase fetch` in `verify-final-release.mjs` masked real persistence gaps (`/study?mode=due` unhandled filter, invisible `account.error` banner, `units.position` ordering, `weak_radar` `supported` sorting).
- Contrast/hover failures on `.btn-secondary` (`#047857 !important`), invalid HTML nesting inside buttons/labels, broken `#noata-main` skip link target, `/admin` Korean string `학습`, `/help` personal Gmail PII, and `1440px` Arabic/Math UX breakdowns were outside the `13` mocked smoke assertions.

Phase 1–5 tests will close every one of these verification gaps.

---

## 4. Phase 1–5 Acceptance Test Matrix & Mandatory Journeys

### 4.1 Mandatory End-to-End Student & Staff Journeys
Every phase adds or extends automated Playwright/Chrome + Node tests covering these **4 core journeys**:

| Journey ID | User Flow | Critical Assertions | Target Phase |
|---|---|---|---|
| **Journey A: Core Subject Lesson Learning** | Login / Student session -> `/learn` (Units ordered by `units.position`) -> Select Complex Numbers (Math AR/EN), Hydrosphere/Respiratory (Science), I'rab/Poetry (Arabic), Sources of Civilizations (History `1789 CE`), Logic (Philosophy), Grammar (English) | `lessons.slug` loaded & resolved (`46/46` pack hit rate, `0` unintended fallback); **0** pipe-delimited plain formula blocks; clean KaTeX rendering; stage stepper hides spoilers on Stage 3 by default; Interactive Lab loads dynamically and responds to user input; stage completion persists to DB and survives reload. | Phase 2 + Phase 3 |
| **Journey B: Dashboard -> Action Center -> Spaced Review -> Mastery** | Dashboard `/` -> Inspect Action Center (no ungrounded targets; real `units`/weak-skill ranking; error banner visible when fetch fails) -> Click due review CTA -> `/study?mode=due` + `/review` -> Complete review items & return to `/` | `/study?mode=due` filters strictly to due items; mistake remediation links via valid `skill_id`; Coins/XP/review timestamps persist server-verified in Supabase and reflect cleanly on `/` after hard refresh. | Phase 3 |
| **Journey C: Public Discovery -> Auth -> Support -> Staff Workspace** | `/landing` (pricing/SLA consistent, no dead controls) -> `/login` / `/auth` -> Signed-in `<LocaleControl>` visible -> `/help` (unified UI, no prefill race, no personal PII) -> `/teacher` & `/admin` (clean AR/EN localization, zero Korean `학습` or `"3mastery"`, no unrendered markdown raw chars) | All routes render canonical design tokens, valid landmark hierarchy (`#noata-main` skip link moves focus), clean metadata/sitemap, and zero console/hydration errors. | Phase 1 + Phase 4 |
| **Sidebar Journey: Resizable Shell & Zero-FOUC** | Desktop (`1280px` / `1440px` / `1920px`): Drag `role="separator"` handle (`248–420px`) & use keyboard Arrow/Home/End keys in both LTR (`en`) & RTL (`ar`); collapse/expand (`72px`); hard-reload page; sign out & sign in as a second account | Pre-hydration inline `<head>` script restores width/collapse before first paint (`CLS < 0.01`, zero layout snap); RTL drag direction inverts properly; width persists via `user_settings.dashboard_preferences` + account-scoped `noata:shell-prefs:${userId}`; sign-out clears shell cache so second account starts clean. | Phase 1 |

### 4.2 Cross-Matrix Verification Grids (Phase 5 Final Gate)

#### A. 4-Way Locale × Curriculum Track Matrix
All lesson, lab, dashboard, and assessment screens must pass visual, directional, and pedagogical checks across all 4 quadrants:

| Quadrant | UI Locale (`dir`) | Curriculum Track | Key Verification Focus |
|---|---|---|---|
| **Q1 (`ar` × `ar`)** | Arabic (`rtl`) | Arabic Track (`ar`) | Egyptian Arabic AI / MSA UI consistency; authentic Arabic math notation decision; clipped pill prevention; proper RTL separator drag & directional icons (`ArrowLeft`/`ArrowRight` mirrored properly). |
| **Q2 (`ar` × `en`)** | Arabic (`rtl`) | English Track (`en`) | Mixed-directionality hygiene: English formulas/terms isolated with `dir="ltr"` / KaTeX inline inside RTL cards (`ChoiceCardGroup` alignment & no broken bidi parenthesis flips). |
| **Q3 (`en` × `ar`)** | English (`ltr`) | Arabic Track (`ar`) | Arabic literary excerpts & I'rab lab isolated properly with `dir="rtl"` & readable Arabic webfont inside LTR shell. |
| **Q4 (`en` × `en`)** | English (`ltr`) | English Track (`en`) | Zero leftover Arabic hardcoded strings in buttons/breadcrumbs; clean English math/science formatting. |

#### B. Responsive Viewport Matrix (`320px` to `1920px`) & Themes
Every audited route must pass with **`0` horizontal page overflow** (`documentElement.scrollWidth <= window.innerWidth`), legible contrast (`>= 4.5:1` text, `>= 3:1` UI components) across **Light** and **Dark / Midnight** themes, and **`0` WCAG 2.2 AA violations**:

| Viewport Width | Form Factor | Shell Layout Expectation |
|---|---|---|
| `320px` | Small mobile | Mobile header + fixed `.mobile-nav` bottom bar; zero sidebar leakage; stacked cards; KaTeX/tables scroll locally inside containers, never widen `<body>`. |
| `375px` | Standard mobile | Touch targets `>= 44x44px` (`>= 24x24px` WCAG 2.2 SC 2.5.8 minimum exceeded); stage stepper & ChoiceCards comfortable with thumb. |
| `768px` | Tablet portrait | `@media (min-width: 768px) and (max-width: 1180px)` shell layout; collapsed or drawer rail intact; no overlap with lesson content. |
| `1024px` | Small desktop / landscape tablet | Collapsed/compact rail fits comfortably alongside lesson rail + Interactive Lab without squeezing content below readable line width. |
| `1280px` | Standard laptop | Full resizable sidebar (`288px` default, `248–420px` range); dual-column lesson hero/stage rail aligns cleanly. |
| `1440px` | Desktop widescreen | Balanced max-width containers (`noata_stage` readable line length `60–75ch`); dark & light contrast crisp. |
| `1920px` | Large monitor | Content does not over-stretch or float disconnected; custom sidebar width scales gracefully. |

---

## 5. Gate Exit Criteria Summary

| Gate | Required Automated & Manual Evidence |
|---|---|
| **Phase 1 Exit** | `pnpm check:text`, `pnpm typecheck`, `pnpm modern:test` (incl. updated `sidebar.test.ts` & keyboard resize tests), `pnpm legacy:check`, `@noata/web build`, Chrome `axe-core` WCAG 2.2 AA across Light/Dark & AR/EN (`320/768/1440`). |
| **Phase 2 Exit** | All Phase 1 checks + `46/46` pack resolution test (`slug` fix verified), automated pack/lab content linter (`0` pipe formulas, `0` malformed KaTeX, aligned History dates & Math symbols), all `6` Subject Labs interactive smoke checks, **Journey A** pass. *(If `M4` SQL migration added: staging dry-run + rehearsal update).* |
| **Phase 3 Exit** | All Phase 1–2 checks + persistence round-trip tests (lesson stages, `/study?mode=due`, assignments, quizzes, missions, account-scoped shell/Quran/theme storage, error banner visibility), **Journey B** pass. |
| **Phase 4 Exit** | All Phase 1–3 checks + `/help`, `/admin`, `/teacher`, `/landing`, `/how`, `/faq`, notifications/legal/auth 4-way i18n/contrast/metadata/sitemap tests, bundle chunk split verification, **Journey C** pass. |
| **Phase 5 Final Sign-Off** | Full clean build + complete 4-Way Matrix + `320–1920px` sweep + CWV re-measurement (`LCP <= 2.5s`, `INP <= 200ms`, `CLS <= 0.1`) + honest report of CI/Docker-only suites before asking explicit user approval to deploy. |
