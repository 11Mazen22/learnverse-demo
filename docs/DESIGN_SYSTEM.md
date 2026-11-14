# Noäta Design System & CSS `@layer` Architecture

> Canonical source of truth: [layers.css](file:///apps/web/app/styles/layers.css), [tokens.css](file:///apps/web/app/styles/tokens.css), [ui.css](file:///apps/web/app/styles/ui.css), [patterns.css](file:///apps/web/app/styles/patterns.css), and [components/ui/index.ts](file:///apps/web/components/ui/index.ts).
> Stage 00 architecture baseline: [architecture-map.md](file:///docs/architecture-map.md). Historical Phase 5 matrix: [NOATA_AURA_PHASE5_MATRIX.md](file:///docs/NOATA_AURA_PHASE5_MATRIX.md).

Noäta (`نقطة`) implements a strict **4-Tier Design System** built on standard CSS Cascade Layers (`@layer`), logical CSS properties for seamless Arabic RTL (`dir="rtl"`) and English LTR (`dir="ltr"`) layouts, seven built-in palettes plus AI-generated custom themes, and native browser UI synchronization.

---

## 1. CSS Cascade Layer Order

Declared first in [layers.css](file:///apps/web/app/styles/layers.css) and imported ahead of all stylesheets in [layout.tsx](file:///apps/web/app/layout.tsx) and [globals.css](file:///apps/web/app/globals.css):

```css
@layer reset, vendor, tokens, theme, base, components, shell, patterns, sections, study, staff, utilities;
```

Layer precedence flows strictly left-to-right (lowest to highest priority). Normal hover transitions do **not** use `!important`, allowing `@layer utilities` reduced-motion rules to cleanly disable motion without Cascade Level 5 `!important` layer inversion.

### Stylesheet-to-Layer Map

| Stylesheet | Layers Used | Responsibility |
| --- | --- | --- |
| `app/styles/layers.css` | `@layer` order declaration | Establishes deterministic cascade order |
| `app/styles/tokens.css` | `tokens`, `theme` | Tier 1 foundation scales + Tier 2 semantic Light/Dark/Forced-Colors defaults |
| `katex/dist/katex.min.css` | `vendor` | Math typesetting CSS imported via `globals.css` `layer(vendor)` |
| `app/globals.css` | `reset`, `theme`, `base`, `components`, `shell`, `sections`, `study`, `staff`, `utilities` | Tailwind v4 `@import "tailwindcss"`, base reset/typography, core route/legacy rules |
| `app/palette.css` | `theme`, `components`, `study` | Built-in palettes (`aura`, `ocean`, `forest`, `sunset`, `rose`, `midnight`) & palette gallery |
| `app/brand-system.css` | `theme`, `components`, `shell`, `sections`, `study`, `utilities` | Hero palette tokens, brand mark, ledger sections |
| `app/design-rebirth.css` | `theme`, `components`, `sections`, `study`, `utilities` | `custom` AI palette tokens, Design Studio, device appearance controls |
| `app/sidebar-rebirth.css` | `tokens`, `shell`, `utilities` | App shell sidebar widths, sticky rail, mobile navigation contracts |
| `app/aura-finish.css` | `components`, `sections`, `utilities` | Study workshop modal, auth showcase, mobile nav light/dark stability |
| `app/contextual-coach.css` | `components`, `utilities` | Contextual AI launcher trigger and prompt dialog |
| `app/tooltip-system.css` | `components`, `utilities` | Global portal caption surface |
| `app/tour-system.css` | `components`, `utilities` | Role-aware guided product tour overlay |
| `app/auth-ux.css`, `app/auth-renaissance.css` | `sections`, `utilities` | Sign-in, sign-up, recovery, and verification layouts |
| `app/marketing.css`, `app/marketing-premium.css`, `app/premium-home.css` | `sections`, `utilities` | Public landing, dark-tone marketing shell, feature pages |
| `app/curriculum-hub.css`, `app/lesson-experience.css`, `app/dashboard-renaissance.css`, `components/legal/legal-pages.css` | `sections`, `utilities` | Curriculum overview, lesson flow, cockpit sections, legal prose |
| `app/study-experience.css`, `app/ai-*.css` (9 files), `app/quran/*.css` (2 files) | `study`, `utilities` | Flashcards/study studio, AI workspace panes, command palette, Quran Mushaf |
| `app/staff-studio.css` | `staff`, `utilities` | Teacher and admin console workspaces |
| `app/styles/ui.css` | `components`, `utilities` | Tier 3 `.nk-*` primitive styling, `<dialog>` scroll lock, `.visually-hidden` |
| `app/styles/patterns.css` | `patterns`, `utilities` | Tier 4 workspace layout patterns (`.nk-page-header`, `.nk-bento-grid`, `.nk-split-reader`, `.nk-study-stage`) |

> Note: `@font-face` declarations remain top-level outside `@layer` blocks in `globals.css`, `ai-library.css`, `ai-reading-renaissance.css`, and `quran/quran.css`. Component CSS Modules (`noata-one.module.css`, `research-panel.module.css`) remain module-scoped.

---

## 2. Tier 1: Foundation Tokens (`@layer tokens`)

Defined on `:root` in [tokens.css](file:///apps/web/app/styles/tokens.css) (plus sidebar layout variables in [sidebar-rebirth.css](file:///apps/web/app/sidebar-rebirth.css)):

- **Typography Families**:
  - `--font-ar` (`NoataArabic`, Cairo fallback), `--font-en` (`Cairo`, Segoe UI fallback), `--font-cairo`, `--font-quran` (`NoataVerseArabic`, Amiri), `--font-serif-latin`, `--font-mono`.
- **Rem & Fluid Scale**: `--text-2xs` (`0.6875rem`) through `--text-2xl` (`1.5rem`), fluid `--text-3xl`, `--text-display`, line-heights (`--leading-tight`, `--leading-snug`, `--leading-ar: 1.8`, `--leading-en: 1.62`, `--leading-quran: 2.35`), measure (`--measure-prose: 72ch`, `--measure-narrow: 48ch`).
- **Spacing & Layout**: `--space-1` (`0.25rem`) to `--space-16` (`4rem`), `--gutter-page`, `--gutter-card`, `--container-max: 1400px`.
- **Radii & Elevation**: `--radius-xs` (`8px`) through `--radius-xl` (`28px`) and `--radius-pill`; shadows `--shadow-xs`, `--shadow-sm`, `--shadow-soft`, `--shadow-md`, `--shadow-lg`, `--shadow-overlay`.
- **Interaction & Focus**: `--target-min: 44px`, `--target-coarse: 48px`, `--focus-width: 3px`, `--focus-offset: 3px`.
- **Motion & Z-Index**: `--dur-fast` (`140ms`), `--dur-base` (`220ms`), `--dur-slow` (`360ms`), `--ease`, `--ease-spring`; layered `--z-base` (`1`) -> `--z-sticky` (`20`) -> `--z-sidebar` (`40`) -> `--z-header` (`50`) -> `--z-dropdown` (`62`) -> `--z-mobile-nav` (`70`) -> `--z-popover` (`100`) -> `--z-drawer` (`200`) -> `--z-toast` (`400`) -> `--z-skip` (`1000`) -> `--z-tour` (`10000`) -> `--z-tooltip` (`2147483000`).

---

## 3. Tier 2: Semantic Tokens, Palettes & `color-scheme` Policy (`@layer theme`)

- **Semantic Surface, Ink & Status Tokens**:
  - `--bg`, `--surface`, `--surface-elevated`, `--surface-soft`, `--surface-subtle`
  - `--ink`, `--muted`, `--line`, `--line-strong`
  - `--accent`, `--accent-hover`, `--accent-soft`, `--on-accent`
  - `--success` / `--success-soft`, `--warning` / `--warning-soft`, `--danger` / `--danger-soft`, `--info` / `--info-soft`
  - `--hover-bg`, `--active-bg`, `--focus-ring`, `--focus-ring-soft`, `--backdrop-scrim`, `--table-header-bg`
- **7 Built-in Palettes + Custom AI Themes**:
  - Light & Dark capable (`both`): `classic`, `aura`, `ocean`, `forest`, `sunset`, `rose`, plus `custom` (respects `modeConstraint`: `"both" | "light-only" | "dark-only"`).
  - Always Dark (`dark-only`): `midnight`.
  - Contrast rule: Light palettes pair saturated `--accent` with `--on-accent: #ffffff`; dark palettes and `midnight` pair luminous accents with deep dark `--on-accent: #071327` (or custom dark ink `#101829`), preventing unreadable white-on-pastel pills.
- **Strict Theme-Aware Browser `color-scheme` Policy**:
  - **Prohibited**: Permanent unconditional `:root { color-scheme: light dark; }`.
  - **Enforced**: Light theme sets `color-scheme: light`; dark theme and `midnight` set `color-scheme: dark`. At runtime, `resolveBrowserColorScheme()` and `syncBrowserThemeColor()` synchronize `document.documentElement.style.colorScheme`, `<meta name="color-scheme">`, and `<meta name="theme-color">`, while `ExperienceBoot` listens to OS `prefers-color-scheme` changes when `mode === "system"`.
- **High Contrast (`forced-colors: active`)**: Maps surfaces, text, borders, and focus highlights to system keywords (`Canvas`, `CanvasText`, `GrayText`, `Highlight`, `HighlightText`).

---

## 4. Tier 3: Reusable UI Primitives (`apps/web/components/ui/` + `ui.css`)

Import from `@/components/ui`:

| Component | Accessibility & Interactive Guarantees |
| --- | --- |
| `Icon` | Centralized 24x24 SVG stroke sprite (`aria-hidden="true"`, safe fallback) |
| `Button`, `IconButton` | Variants (`primary`, `secondary`, `subtle`, `ghost`, `danger`), sizes (`sm` with 44px hit-area pseudo-element, `md`, `lg`), loading spinner, `IconButton` enforces `aria-label` |
| `Badge` | Status tones (`neutral`, `accent`, `success`, `warning`, `danger`) with paired high-contrast surfaces |
| `Card` | Surfaces (`default`, `elevated`, `soft`, `tinted`), logical padding scale, interactive elevation |
| `Field`, `Fieldset`, `Input`, `Select`, `Textarea` | Zoom-safe `font-size: max(1rem, 1em)`, `:user-invalid` + explicit `aria-invalid`, conditional `aria-describedby` (never referencing empty hidden nodes), inline `role="alert"` error |
| `Tabs` | Single non-wrapping scrollable `tablist`, RTL/LTR `ArrowLeft`/`ArrowRight`/`Home`/`End` keyboard nav, CSS border underline active indicator (Forced Colors safe) |
| `DataTable` | `role="region"` + `tabIndex={0}` keyboard scroll box, `tabular-nums`, `@container (width < 600px)` stacked mobile cards with `tbody th` + `data-label` |
| `Skeleton`, `SkeletonGroup` | Shimmer gated inside `@media (prefers-reduced-motion: no-preference)`, live `aria-busy="true"` status region |
| `EmptyState` | Honest zero-fabrication state card with icon, heading, description, CTA slot |
| `Dialog`, `Drawer`, `ConfirmHost` | Native top-layer `<dialog showModal()>`, `useId()` `aria-labelledby`, `overscroll-behavior: contain` (`::backdrop` lock), `PointerEvent` coordinate outside-click close fallback, RTL/LTR logical `side="start" \| "end"` on `Drawer` |
| `ToastProvider`, `useToast`, `pushToast` | App-wide non-blocking queue mounted in RootLayout with single `aria-live="polite"` region (`role="alert"` for `danger`) |
| `TooltipHost`, `LocalizedSkipLink`, `ModuleWelcome`, `NoataLogo` | Preserved shell/brand helpers exported alongside the kit |

---

## 5. Tier 4: Product Experience Patterns (`patterns.tsx` + `patterns.css`)

Reusable architectural layouts layered in `@layer patterns`:

- **`PageHeader`** (`.nk-page-header`): Eyebrow, fluid heading (`<h1>`), prose-constrained description, status badge row, action toolbar.
- **`BentoGrid` & `StatTile`** (`.nk-bento-grid`, `.nk-stat-tile`): Responsive multi-column KPI grid collapsing to 1 column cleanly at `320px`, `tabular-nums` stat values, optional link wrapper.
- **`SplitReaderShell`** (`.nk-split-reader`): Two-column content + sticky contextual rail (`railPosition="start" | "end"`), collapsing cleanly below `960px` for Lessons, AI Studio, and Quran Mushaf.
- **`StudyStageCanvas`** (`.nk-study-stage`): Focused stage container pairing header progress bar, central elevated surface, and footer controls for Flashcards and Quiz flows.
- **`FilterToolbar`** (`.nk-filter-toolbar`): Logical-wrapped search, filter controls, and sort/view actions.
- **`StaffConsoleSection`** (`.nk-staff-section`): Standardized panel header, action bar, and tabular content container for Teacher and Admin consoles.

---

## 6. Preserved Contracts & Reduced Motion

- **Root HTML Attributes**: `lang`, `dir` (`rtl`/`ltr`), `data-theme` (`light`/`dark`), `data-palette`, `data-mode-constraint`, `data-reduced-motion`, `data-noata-motion`.
- **Custom Window Events**: `noata-palette-change`, `noata-custom-theme-change`.
- **Reduced Motion**: Opt-in animations use `@media (prefers-reduced-motion: no-preference)`; suppression uses `animation: none; transition: none; scroll-behavior: auto;` in `@layer utilities` (never `0.01ms !important` or invalid `no-preference | reduce` media syntax).
- **Existing Layout & Selector Contracts**: `.mobile-nav` dock + breakpoints (`768px..1180px`, `<=767px`) in `sidebar-rebirth.css`, streaming cursor selector isolation in `noata-one.module.css`, and all tour/test contracts remain preserved.

---

## 7. Asset Provenance

- Noäta SVG assets are authored from the user's supplied brand references (`noata-mark.svg`, `noata-mark-light.svg`).
- Noto Sans Arabic: Google Fonts `ofl/notosansarabic/NotoSansArabic[wdth,wght].ttf`, retrieved 2026-10-08; repository HEAD observed as `5e8a3ba899557829a76cfdac30fa512bda91d7ca`. Converted to a local Arabic/Latin WOFF2 subset with FontTools/Brotli. Preserve `public/fonts/OFL-NotoSansArabic.txt` (SIL OFL 1.1).
- WOFF2 SHA-256: `7579ad5af7977d0147313ad71996886f5368024da213abfbd330d76f926fffc7`.
- Existing Cairo, Amiri Quran, Lora, Roboto Mono binaries and upstream attribution in `OPEN_WEBUI_LICENSE_NOTES.md` retain their package licenses.
