# Noäta 2.0 — Stage 02 Report: Role-Aware Application Shell, Sidebar, Top Bar, Mobile Navigation & Command Center

- **Status**: Complete & Verified
- **Artifacts**: `artifacts/stage-02-shell/shell-{ar,en}-{1440,390,320}.png`

## 1. Delivered Architecture & Changes

1. **Zero-FOUC Pre-Hydration Boot & Mode Ordering**
   - [`apps/web/app/layout.tsx`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/app/layout.tsx): Inline synchronous `<head>` boot script restores `data-palette`, `data-mode-constraint`, `data-theme`, and `document.documentElement.style.colorScheme` before first paint (locking dark-only palettes such as `midnight`).
   - [`apps/web/components/preferences/experience-boot.tsx`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/components/preferences/experience-boot.tsx): Applies palette metadata prior to `resolveAppearance(...)` so dark-only constraints hold deterministically on hydration.

2. **Typed Role-Aware Navigation & Universal Command Center (`⌘K` / `Ctrl+K`)**
   - [`apps/web/lib/shell/navigation.ts`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/lib/shell/navigation.ts) & [`navigation.test.ts`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/lib/shell/navigation.test.ts): Centralized role-aware route definitions, workspace labels, `CORE_CURRICULUM_SUBJECTS` (6 subjects including bilingual tracks), `getMobileDockRoutes`, `buildCommandActions`, and `pushRecentDestination` deduplication. Wired into root `modern:test` via [`package.json`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/package.json).
   - [`apps/web/components/shell/command-palette.tsx`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/components/shell/command-palette.tsx): Combobox/listbox `<Dialog>` command palette with grouped categories, IME `isComposing` guard, `ArrowDown`/`ArrowUp`/`Home`/`End`/`Enter` keyboard navigation, `aria-controls` synced to visible listbox, keyboard-scrollable `.nk-cmd-scroll` (`tabIndex={0}`), instant theme/locale switching via `useToast().push`, and focus restoration on close.

3. **Shell Layout, Top Bar, Mobile Navigation & Menu Enhancements**
   - [`apps/web/components/app-shell.tsx`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/components/app-shell.tsx): Responsive `.shell-topbar` with workspace breadcrumb + `<Badge>`, command trigger, mobile trigger focus restoration, role-aware bottom `.mobile-nav`, recent route history tracking, IME/input-safe `⌘K`/`Ctrl+K`, and Tier 3 `<Drawer side="start" className="nk-drawer-mobile-nav">`.
   - [`apps/web/components/sidebar/sidebar-curriculum.tsx`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/components/sidebar/sidebar-curriculum.tsx): Activated query-param track highlight via `useSearchParams()` inside `<Suspense fallback={null}>` with `aria-current="page"`.
   - [`apps/web/components/sidebar/sidebar-header.tsx`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/components/sidebar/sidebar-header.tsx) & [`sidebar.tsx`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/components/sidebar/sidebar.tsx): Preserved `.sidebar-brand` / `.noata-sidebar` selector contracts, guarded `Ctrl+B`/`⌘B` against inputs/IME, and updated copy to Smart Study Studio (`استوديو المذاكرة الذكي وبطاقات 3D`).
   - [`apps/web/components/auth/user-menu.tsx`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/components/auth/user-menu.tsx): Added bilingual language switcher item inside account dropdown syncing to `user_settings`.
   - Removed dead files `apps/web/components/mobile-nav.tsx` and `apps/web/components/sidebar/sidebar-types.ts`.

4. **CSS Cascade Cleanup & Mobile Mushaf Focus Fix**
   - [`apps/web/app/sidebar-rebirth.css`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/app/sidebar-rebirth.css) & [`apps/web/app/quran/mushaf-renaissance.css`](file:///C:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/app/quran/mushaf-renaissance.css): Stripped redundant `!important` overrides (retaining `position: fixed !important` on `.mobile-nav` at `<= 767px` required by `sidebar.test.ts`), resolved `.mushaf-focused` mobile dock visibility collision, replaced hardcoded badge hex values with `--on-accent`, `--warning-soft`, and `--warning`, and normalized tablet `768px–1180px` & compact `<= 420px` rules.

## 2. Verification Results

- **Static & Unit Suites** (executed after final source edit to `command-palette.tsx`):
  - `pnpm check:text`: **PASS** (`666 tracked UTF-8 text files; no replacement glyphs or bidi controls`).
  - `pnpm typecheck`: **PASS** (`packages/core` and `@noata/web`).
  - `pnpm modern:test`: **606 PASS, 0 FAIL, 2 SKIP** (608 tests; skipped 2 PDF raster tests in `pdf-page-edit.test.ts` due to missing `pdftoppm` binary on host).
  - `pnpm legacy:check`: **695 PASS, 0 FAIL, 9 SKIP** (704 tests; skipped `pdftoppm` and Python-dependent `office-preservation.test.ts` tests unavailable on Windows host).
  - `pnpm --filter @noata/web build`: **PASS** (42 routes compiled & typechecked cleanly).
- **Headless Chrome E2E & Accessibility (`stage02_verify.mjs`)**:
  - Pre-hydration FOUC & `colorScheme`: **PASS** (`{ pal: 'ocean', theme: 'dark', cs: 'dark' }`).
  - 12 responsive/bilingual checks (`1920, 1440, 1024, 768, 390, 320` in `ar` and `en`): **PASS** (`0` clipped controls, `0` horizontal overflow).
  - Subject query active detection (`/learn?subject=mathematics`): **PASS** (`aria-current="page"`).
  - Command Center keyboard/filter/focus flow: **PASS** (`countAll: 22`, filtered math query `filteredLen: 1`, `focusRestored: true`).
  - Mobile `<Drawer side="start">` & `.mushaf-focused@390px`: **PASS** (`{ before: 'flex', during: 'none', after: 'flex' }`).
  - `axe-core` WCAG 2.2 AA (`wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`) on desktop, open Command Center, and mobile `390px`: **0 violations**.
- **Environment Constraints**: Docker and Deno remain unavailable on this Windows host; PostgreSQL live-migration rehearsal and Deno Edge checks remain CI-gated and were not run locally.
