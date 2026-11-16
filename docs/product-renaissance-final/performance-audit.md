# Performance, Bundle & Core Web Vitals Audit

**Initiative:** Noäta 2.0 — Ultimate Learning Experience & Platform Renaissance  
**Phase:** Phase 0 (Audit & Planning Baseline)  
**Baseline Commit:** `f5a059a` (`master`)  
**Status:** Baseline Recorded; Optimization Execution Scheduled Across Phases 1–4; `[Phase 5 Re-Measurement Pending]`

---

## 1. Executive Summary

Noäta currently delivers healthy CLS and acceptable baseline LCP on audited Stage 10 routes (`/` LCP `1952ms`, CLS `0.0062`; `/ai` LCP `1968ms`, CLS `0.0033`), largely because server rendering and font/shell geometry are already disciplined. However, **client JavaScript weight and global stylesheet eagerly-loaded overhead are significantly above target**:

1. **`0` uses of `next/dynamic`** across the entire `apps/web/components/` tree.
2. **Initial gzipped route JS ranges from `362.4 KB` (`/login`) to `648.4 KB` (`/ai`)**, exceeding the `250 KB` aspirational ceiling noted in Stage 11 release telemetry (`rootMainFiles`: `129.3 KB` gz).
3. **33 global stylesheets** are eagerly imported in `apps/web/app/layout.tsx:15-47`, including monolithic stylesheets (`globals.css` 4,601 lines, `lesson-experience.css` 2,512 lines, `study-experience.css` 2,085 lines, `design-rebirth.css` 1,677 lines, `palette.css` 578 lines).
4. **Heavy client dependencies** (`katex`, `react-markdown`, `remark-math`, `rehype-katex`, `rehype-highlight`, document exporters, interactive Subject Labs, and AI Creative/Image/Writing studios) are statically bundled into routes that do not immediately use all of them on first paint.
5. `apps/web/next.config.ts:1-38` currently defines neither an `images` optimization configuration nor `experimental.optimizePackageImports`.

This audit documents the verified Phase 0 baseline, maps every high-impact static bottleneck, defines phase-gated optimization targets (without breaking lesson KaTeX rendering or AI streaming UX), and establishes the mandatory Phase 5 Core Web Vitals re-measurement gate.

---

## 2. Verified Stage 10 / Phase 0 Baseline Telemetry

Source: `docs/reports/stage-11-final-release-readiness.md:70-74` (Stage 10 production-build browser measurements prior to Renaissance edits):

| Metric | Observed Value | Target / Threshold | Status |
|---|---|---|---|
| Page total transfer size (audited routes) | `64.8 KB` – `793.8 KB` | `< 2.0 MiB` | Within ceiling |
| `rootMainFiles` (shared root JS, gzipped) | `129.3 KB` | `< 110 KB` (Renaissance target) | Needs trim |
| Initial route JS, smallest (`/login`, gzipped) | `362.4 KB` | `<= 250 KB` aspirational ceiling | Over ceiling |
| Initial route JS, largest (`/ai`, gzipped) | `648.4 KB` | `<= 250 KB` aspirational ceiling (`<= 350 KB` rich AI workspace) | Over ceiling |
| Focus interaction latency | `0.3 ms` | `INP <= 200 ms` | Healthy baseline |
| Dashboard `/` LCP | `1952 ms` | `LCP <= 2500 ms` (`< 2000 ms` preferred) | Passing (`548 ms` headroom) |
| Dashboard `/` CLS | `0.0062` | `CLS <= 0.1` (`<= 0.05` preferred) | Passing |
| Tutor `/ai` LCP | `1968 ms` | `LCP <= 2500 ms` | Passing |
| Tutor `/ai` CLS | `0.0033` | `CLS <= 0.1` | Passing |
| `/lesson/[id]`, `/study`, `/learn`, `/review`, `/assignments` CWV | `[Not separately captured in Stage 10 telemetry]` | `LCP <= 2.5s`, `INP <= 200ms`, `CLS <= 0.1` | `[Phase 5 Measurement Required]` |

> **Important Scope Note:** Stage 10 telemetry was collected before Phase 1–4 changes (including expanded Lesson KaTeX blocks, Subject Labs, Resizable Sidebar script/styles, and Dashboard widgets). All routes must be freshly re-measured on a clean production build in **Phase 5**.

---

## 3. Dependency & Bundle Footprint Inventory

Verified in `apps/web/package.json:1-51`:

| Package | Version | Client vs Server Impact | Notes |
|---|---|---|---|
| `next` / `react` | `16.4.1` / `19.3.1` | Core framework | App Router; supports `next/dynamic` & `optimizePackageImports` |
| `katex` + `rehype-katex` | `0.19.0` / `7.0.1` | Heavy client + CSS if eagerly loaded on non-math routes | Must stay snappy on `/lesson/[id]` & `/ai`; lazy-load on non-math panels or pre-split chunks |
| `react-markdown` + `rehype-highlight` | `^10.1.0` / `7.0.2` | Significant client AST/syntax highlighter weight | Currently pulled statically across multiple client islands |
| `pdfjs-dist` / `pdfkit` / `pdf-lib` | `5.4.394` / `0.17.2` / `1.17.1` | Very heavy PDF parsing & generation | Must never leak into general student initial bundles; lazy/server-isolate |
| `swr` | `2.5.1` | Lightweight client caching | Retained |
| `lucide-react` / `xlsx` | **Not installed** | N/A | Do not assume these packages exist; document exporters use repo modules (`docx-export`, `xlsx-export`, `pptx-export`) |

---

## 4. Verified Static-Import Bottlenecks (Code Audit)

### 4.1 Zero Dynamic Code Splitting (`0` `next/dynamic` calls)
Across all client modules in `apps/web/components/`, **`next/dynamic` is currently used `0` times**. Every modal studio, exporter, markdown/syntax renderer, and interactive subject lab is evaluated in the route's initial chunk graph.

### 4.2 High-Cost Static Import Call Sites

| Area | Verified File & Line(s) | Static Imports Pulled Into Initial Bundle | Routes Impacted | Phase 4 Optimization Action |
|---|---|---|---|---|
| **Rich Text & Math Renderer** | `apps/web/components/study/study-rich-text.tsx:4-7`, `apps/web/lib/curriculum/structured-content.ts:1` | `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, `katex` | `/learn`, `/lesson/[id]`, `/study`, `/review`, `/missions`, `/boss`, `/assignments`, `apps/web/components/teacher/teacher-live.tsx:14`, `apps/web/components/admin/admin-live.tsx:18` | Keep lightweight fast path for plain text; lazy-load KaTeX/markdown heavy AST plugins on demand or split into an async client chunk with SSR/skeleton fallback (`CLS = 0`) |
| **Interactive Subject Labs (6x)** | `apps/web/components/learn/labs/subject-lab-router.tsx:5-10` | All 6 Subject Lab components imported synchronously (`Math`, `Science`, `Arabic`, `History`, `Philosophy`, `English`) | `/lesson/[id]` (every lesson downloads labs for the other 5 subjects too) | Convert `subject-lab-router.tsx` to `next/dynamic` per-subject map (`Math` lesson only loads `Math` lab chunk on stage demand) |
| **Noäta AI Studios & Exporters** | `apps/web/components/ai/noata-ai-client.tsx:27,30,34,43`, `apps/web/components/ai/writing-studio.tsx:7-9`, `apps/web/components/ai/project-library.tsx:4-6` | `docx-export`, `NoataCreativeStudio`, `WritingStudio` (pulls `docx-export`, `xlsx-export`, `pptx-export`), `RichMessage` (`rehype-highlight`, `rehype-katex`), `NoataImageStudio` | `/ai` (`648.4 KB` initial gz JS!) and AI project library | Load `NoataCreativeStudio`, `NoataImageStudio`, `WritingStudio`, and `docx`/`xlsx`/`pptx` exporters via `next/dynamic` / dynamic `import()` only when user opens studio or clicks export |
| **Teacher & Admin Live Workspaces** | `apps/web/components/teacher/teacher-live.tsx:14`, `apps/web/components/admin/admin-live.tsx:18` | Statically pulls `StudyRichText` + full markdown/KaTeX stack | `/teacher`, `/admin` | Defer heavy markdown previewer and analytics/export modals via `next/dynamic` |

### 4.3 Global CSS Loading & Specificity Overhead
- `apps/web/app/layout.tsx:15-47` eagerly imports **33 global CSS files** on every route (including marketing, login, admin, lesson, and Quran views).
- Verified file sizes among the largest stylesheets:
  - `globals.css`: `4,601` lines
  - `lesson-experience.css`: `2,512` lines
  - `study-experience.css`: `2,085` lines
  - `design-rebirth.css`: `1,677` lines (high `!important` density causing cascade fights)
  - `palette.css`: `578` lines (high `!important` density)
- **Risk:** Unused route CSS increases parse/style-recalculation work on low-end mobile devices and causes cross-surface cascade collisions (e.g., `.mobile-nav` bottom-dock override, unlayered module styles escaping `@layer`).
- **Action (Phases 1 & 4):**
  - Keep canonical `@layer` order in `apps/web/app/styles/` intact while moving unlayered section CSS and CSS modules cleanly inside appropriate layers or scoped route imports where safe.
  - Eliminate fragile `!important` overrides where layer ordering handles precedence (while preserving the `sidebar.test.ts` regex-guarded lock rules).

### 4.4 Next.js Configuration (`apps/web/next.config.ts:1-38`)
- Currently lacks `images` configuration and `experimental.optimizePackageImports`.
- **Action (Phase 4):** Evaluate `experimental.optimizePackageImports` for large multi-export internal/vendor packages where supported without altering SSR behavior, and configure clean `images` handling if optimized local/static assets are added.

---

## 5. Performance Guardrails for New Renaissance Features

The Renaissance initiative adds substantive capabilities in Phases 1–3. Each addition must obey strict runtime and CWV budgets so performance improves net of features:

| New Feature | Phase | Performance & CLS Guardrail |
|---|---|---|
| **Resizable Desktop Sidebar** (`288px` default, `248–420px`) | Phase 1 | Pre-hydration inline `<head>` boot script sets `--sidebar-user-w` and `data-sidebar-collapsed` before first paint (`CLS = 0`, zero FOUC). Drag resize mutates CSS custom property via `requestAnimationFrame` on the shell container (`0` React re-renders of inner route tree per `mousemove` frame); persist to storage/DB only on `pointerup` or `keydown` settle. |
| **Multi-Concept Blocks & Steppers** | Phase 2 | Worked example steppers reserve or smoothly transition heights with `data-reduced-motion` compliance; avoid fetching heavy lab bundles until Stage 3 / interactive tab interaction or idle prefetch. |
| **KaTeX Typography on All Math/Science Lessons** | Phase 2 | Wrap math blocks in stable block/inline containers (`study-math-block`, `katex-display`) with explicit vertical rhythm so font swap / math layout never pushes surrounding stage navigation controls. |
| **Dashboard Action Center & Weak Radar** | Phase 3 | Derive Next Action & Weak Radar from existing fetched server/session state without waterfall round-trips; keep heatmap rendering pure CSS grid/SVG without charting bloat. |

---

## 6. Optimization Execution Plan & Target Budgets

### Phase-by-Phase Performance Milestones
1. **Phase 1 (Shell & CSS Foundation):** Zero-FOUC sidebar boot script; `rAF`-throttled resize without full-tree React re-renders; clean `@layer` cascade to remove redundant dark-mode/contrast style overrides.
2. **Phase 2 (Lesson & Labs):** Route all 6 Subject Labs in `subject-lab-router.tsx` through `next/dynamic` so each lesson only fetches its own subject's interactive lab. Preload or render active stage content cleanly without mounting hidden heavy stages simultaneously.
3. **Phase 4 (Code Splitting & Assets):**
   - Split `NoataCreativeStudio`, `NoataImageStudio`, `WritingStudio`, and `docx`/`xlsx`/`pptx` exporters behind `next/dynamic` and click-time `import()` on `/ai` and `/projects`.
   - Split `StudyRichText` heavy markdown/KaTeX pipeline cleanly from plain-text fast path where safe.
   - Audit route-scoped stylesheets vs global 33-file import list in `apps/web/app/layout.tsx` without breaking any canonical tokens or test locks.
   - Add `experimental.optimizePackageImports` / clean `next.config.ts` configuration where verified by build output.
4. **Phase 5 (Production Build Re-Measurement Gate):**
   - Re-measure `/` and `/ai` plus newly added coverage for `/lesson/[id]`, `/study`, `/learn`, and `/landing` on clean production build (`next build` + Chrome DevTools / Performance trace + `verify-final-release.mjs`).
   - Targets (`[Phase 5 Re-Measurement Pending]`):
     - `LCP <= 2.5s` (target `< 2.0s` on desktop & throttled mobile)
     - `INP <= 200ms` (including sidebar drag, lesson stage transitions, ChoiceCard selection)
     - `CLS <= 0.1` (target `<= 0.02` across all viewports `320px–1920px`)
     - Substantial reduction in `/ai` initial gz JS from `648.4 KB` baseline and per-lesson bundle weight via per-subject `next/dynamic` splitting.

---

## 7. Phase 4 / Phase 5 Measured Results (Post-Edit, Production Build)

**Status:** `[Phase 5 Re-Measurement Complete]` — measured on a clean production build
(`next build` + `next start -p 3100`) on the Windows host, in English UI, 1440×960.

### 7.1 Core Web Vitals (isolated tab per route)

Each route was measured in a brand-new tab. An earlier sweep reused one tab across
12 routes and produced impossible CLS values (0.28–0.50); the cause was measurement
state carried across navigations, not the pages. The isolated run below is the
authoritative figure.

| Route | LCP | CLS | INP (event timing) | Verdict |
|---|---|---|---|---|
| `/` | 2524 ms | 0.0180 | 56 ms | LCP at ceiling (cold first load), CLS/INP pass |
| `/learn` | 1176 ms | 0.0018 | 0 ms | Pass |
| `/lesson/sci-1-1` | 1356 ms | 0.0006 | 56 ms | Pass |
| `/study` | 1252 ms | 0.0000 | 32 ms | Pass |
| `/review` | 1068 ms | 0.0000 | 24 ms | Pass |
| `/assignments` | 296 ms | 0.0018 | 24 ms | Pass |
| `/ai` | 1068 ms | 0.0008 | 24 ms | Pass |
| `/settings` | 1036 ms | 0.0279 | 24 ms | Pass |
| `/teacher` | 712 ms | 0.0000 | 24 ms | Pass |
| `/admin` | 576 ms | 0.0000 | 24 ms | Pass |
| `/landing` | 644 ms | 0.0097 | 56 ms | Pass |
| `/help` | 644 ms | 0.0018 | 16 ms | Pass |
| `/quran` | 1192 ms | 0.0012 | 24 ms | Pass |

- **LCP**: `<= 2.5 s` on 13/13 routes; the single at-ceiling value is `/` at 2524 ms
  on a cold, uncached first load. No route exceeds budget, but `/` has no headroom.
- **CLS**: `<= 0.1` on 13/13 routes; the worst is `/settings` at `0.0279`.
  The `data-noata-motion`, palette and theme preferences were applied before load,
  which is the strictest realistic case.
- **INP proxy**: max `56 ms` (`<= 200 ms` budget), sampled from real `Tab`
  interactions via the Event Timing API.

### 7.2 Initial Route JavaScript (gzipped, document-referenced scripts)

`next start` on this host returns **uncompressed** JS (no `Content-Encoding` header),
and the Next 16 Turbopack build does not print a per-route "First Load JS" table.
To stay comparable with the Phase 0 baseline, the figures below gzip the exact
script files referenced by each route's own HTML.

| Route | gz JS | Phase 0 baseline | Delta |
|---|---|---|---|
| `/login` | 368.3 KB | 362.4 KB | **+5.9 KB** |
| `/` | 412.3 KB | — | — |
| `/landing` | 383.8 KB | — | — |
| `/settings` | 384.3 KB | — | — |
| `/quran` | 388.3 KB | — | — |
| `/learn` | 396.4 KB | — | — |
| `/assignments` | 577.1 KB | — | — |
| `/teacher` | 577.0 KB | — | — |
| `/help` | 575.1 KB | — | — |
| `/admin` | 585.4 KB | — | — |
| `/ai` | 672.9 KB | 648.4 KB | **+24.5 KB (+3.8 %)** |
| `/review` | 776.5 KB | — | — |
| `/lesson/[id]` | 805.6 KB | — | — |
| `/study` | 808.6 KB | — | — |

**Honest conclusion — no reduction achieved.** The target was a significant drop
from the `648.4 KB` `/ai` baseline. It did not happen: `/ai` is `+24.5 KB` and
`/login` is `+5.9 KB` versus Phase 0. The Phase 4 splitting work is real and
verified (see 7.3), but the platform features added in Phases 1–3 (resizable shell
boot, tour engine, Action Center, dashboards) consume more than the split removed.
`/lesson/[id]`, `/study`, `/review` at `776–809 KB` are now the heaviest routes and
the clearest next optimization target. Treat 7.3 as "the mechanism is in place",
not as a performance win.

### 7.3 Code splitting actually shipped in Phase 4

| Change | File | Verified |
|---|---|---|
| `NoataCreativeStudio` behind `next/dynamic` (closed-mount, `loading: () => null`) | `apps/web/components/ai/noata-ai-client.tsx` | no static import remains; separate chunk emitted |
| `WritingStudio` behind `next/dynamic` | same | same |
| `RichMessage` (Markdown/KaTeX/highlight renderer) behind `next/dynamic` with a one-line skeleton | same | `owui-message-skeleton` in `app/ai-flow.css` |
| Conversation DOCX export loaded at click time | same (`exportConversation`, now `async`) | `await import("@/lib/ai/docx-export")` |
| Writing-studio DOCX/XLSX/PPTX exporters loaded at export time | `apps/web/components/ai/writing-studio.tsx` | all three `import()` call sites |
| Plain-prose fast path skips the remark/rehype AST | `apps/web/components/study/study-rich-text.tsx` | `MARKDOWN_SYNTAX` guard; math/markdown still full pipeline |
| `optimizePackageImports` for `@supabase/supabase-js` | `apps/web/next.config.ts` | production build passes |
| `images` config | not added | no `next/image` usage anywhere in `app/` or `components/`; nothing to configure |

### 7.4 Reproducible measurement scripts

- `node scripts/phase4-vitals.mjs` → `artifacts/phase4/vitals-report.json`
- `node scripts/phase4-bundle-weight.mjs` → `artifacts/phase4/bundle-weight-report.json`
- `node scripts/phase4-platform-sweep.mjs` → `artifacts/phase4/sweep-report.json` + screenshots
- `node scripts/phase4-cls-sources.mjs` → CLS culprit attribution
