# Stage 10 Report — Security Hardening, Accessibility (`200%` Zoom), Bundle Audit & CWV

**Status:** Complete & Verified (local production Next.js build + HTTP/security endpoint probes + headless Chrome CDP telemetry, reflow, and `axe-core` WCAG 2.2 AA sweep; live/remote Supabase database untouched)

---

## 1. Engineering Deliverables

1. **Workspace Error Boundary (`apps/web/components/ui/error-boundary.tsx`, `apps/web/components/ui/index.ts`)**
   - Added accessible React `ErrorBoundary` class component rendering `role="alert"` bilingual Arabic/English recovery copy, reset (`إعادة المحاولة / Try again`), and home navigation fallback (`الرئيسية / Home`) without throwing nested unhandled UI crashes.
   - Exported `ErrorBoundary` and `ErrorBoundaryProps` through the Tier 3 `@/components/ui` barrel.
   - Wired `<ErrorBoundary>` around `<main id="noata-main">` `{children}` in `apps/web/components/app-shell.tsx` and `<NoataAIClient />` in `apps/web/app/ai/page.tsx`.
   - Added automated boundary lifecycle, barrel export, `getDerivedStateFromError`, `role="alert"`, and `setState({ hasError: false })` assertions in `apps/web/lib/ui/design-system.test.ts`.

2. **Cross-Account & Sign-Out Storage Isolation (`apps/web/lib/study/draft-storage.ts`)**
   - Extended `purgeForeignOrExpiredStudyDrafts(storage, activeUserId, activeEpoch, now)` to also delete foreign `noata:dashboard-prefs:<otherUser>` keys (preserving `noata:dashboard-prefs:guest` and the active user scope) and stale/foreign temporary AI draft keys (`noata-ai-draft*` not scoped to the active user).
   - Extended `wipeAllStudyDrafts(storage)` (invoked on `SIGNED_OUT`) to purge every `noata:study-draft:*`, `noata-ai-draft*`, and non-guest `noata:dashboard-prefs:*` entry on the shared browser.

3. **Dark-Mode WCAG Badge Contrast Fix (`apps/web/app/design-rebirth.css`)**
   - Fixed `.noata-pill-check-icon` from using `background: currentColor` (which rendered dark-on-dark inside dark/Midnight mode badges) to high-contrast light/dark surfaces (`#065f46` with `#ffffff` ink in light mode; `#6ee7b7` with `#07101e` ink in dark/Midnight mode).

4. **Home LCP Stabilization (`apps/web/components/dashboard/dashboard-live.tsx`, `apps/web/app/dashboard-renaissance.css`)**
   - Decoupled dynamic user greeting text from `<h1 className="nk-home-title">` into `.nk-home-greeting` with a fixed `min-block-size: 1.5rem` reservation so async profile resolution after SSR paint does not mutate the primary `<h1>` text node or trigger late LCP invalidation or layout shift (`Home LCP: 1952ms`, `CLS: 0.0062`).

---

## 2. Verification Results

### Static Analysis, Unit Suites & Production Build
- `pnpm check:text` (`task-4088`, post-edit): **PASS** — `666` tracked UTF-8 text files verified, zero replacement glyphs or bidi controls.
- `pnpm typecheck` (`task-4088`, post-edit): **PASS** — `@noata/core` and `@noata/web` (`next typegen && tsc --noEmit`) passed with zero errors.
- `pnpm modern:test` (`task-3930`, prior to LCP stabilization edit; full post-Stage-11 final rerun follows in Stage 11): `tests 653`, `pass 651`, `fail 0`, `skipped 2` (includes new `ErrorBoundary` test in `apps/web/lib/ui/design-system.test.ts`).
- `node --test scripts/pwa-cache.test.mjs` (`task-3930`): `tests 5`, `pass 5`, `fail 0`.
- `pnpm --filter @noata/web build` (`task-4088`, clean `.next` post-final Stage 10 edit): **PASS** — Next.js 16.4.1 (Turbopack) generated `42/42` static targets and `44` app routes cleanly with isolated synthetic Supabase env vars.

### HTTP Hardening, Security Headers & Prod Route Guards (`stage10_verify.mjs`, `task-4094`)
Executed against production `next start -p 3110`:
- `GET /health`: HTTP `200`, JSON `ok: true`, `Cache-Control: no-store`.
- `GET /`: Security headers confirmed (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).
- `POST /api/documents/pdf` with `Origin: https://evil.example`: HTTP `403`.
- `POST /api/documents/pdf` same-origin without auth cookie: HTTP `401`.
- `GET /api/qa-target`: HTTP `404` (production isolation guard active).

### Core Web Vitals, Bundle Footprint & Reflow Telemetry (`stage10_verify.mjs`, `task-4094`)
- **Core Web Vitals**:
  - `/`: `LCP = 1952ms` (`< 2500ms`), `CLS = 0.0062` (`< 0.05`), interactive focus latency = `0.3ms` (`< 200ms`).
  - `/ai`: `LCP = 1968ms` (`< 2500ms`), `CLS = 0.0033` (`< 0.05`).
- **Bundle & Page Transfer Footprint (measured from built `.next/static/chunks/*.js` loaded per route via `zlib.gzipSync`)**:
  - Total `.next/static/chunks` on disk: `63` JS chunks (`4369.6 KB` raw, `1421.2 KB` gzipped total; `rootMainFiles` = `129.3 KB` gzipped).
  - Per-route loaded initial script sets:
    - `/login`: `14` scripts, `362.4 KB` gzipped (`1187.2 KB` raw), `793.8 KB` total page transfer.
    - `/`: `16` scripts, `399.9 KB` gzipped (`1309.9 KB` raw), `130.7 KB` document/subresource transfer.
    - `/learn`: `15` scripts, `366.5 KB` gzipped (`1197.6 KB` raw).
    - `/settings`: `15` scripts, `375.9 KB` gzipped (`1230.8 KB` raw).
    - `/quran`: `15` scripts, `382.2 KB` gzipped (`1245.5 KB` raw).
    - `/study`: `16` scripts, `518.8 KB` gzipped (`1715.7 KB` raw; adds `highlight`/`markdown`/`remark`/`rehype`/`katex` chunk).
    - `/ai`: `17` scripts, `648.4 KB` gzipped (`2131.1 KB` raw; adds `ai` workspace + `markdown`/`katex`).
  - **Budget Variance Disclosure**: All routes stay well below the `< 2.0 MiB` total page transfer budget (`64.8–793.8 KB`), and live CWV passes (`< 2.0s` LCP, `< 0.01` CLS), whereas compressed initial route JS (`362.4–648.4 KB` gzipped) exceeds the blueprint's `250 KB` aspirational ceiling because React 19 + Next.js 16 runtime (`129.3 KB` gzipped) plus root-layout auth/shell/Supabase client providers baseline at `~362 KB` even on `/login`.
- **`200%` Browser Zoom (`640x480`) & `320px` Reflow Sweep (`19/19` checks)**:
  - Tested `/login`, `/`, `/learn`, `/study`, `/ai`, `/quran`, `/settings` in RTL (`640x480` and `320x640`) plus `/` and `/settings` in English LTR (`640x480` and `320x640`).
  - Maximum horizontal overflow across all `19` checks: `0px` (`<= 2px` target).
- **Accessibility (`axe-core@4.11.1` WCAG 2.2 AA, `7/7` routes)**:
  - `/login`, `/`, `/ai`, `/settings#appearance` (dark mode), `/learn`, `/study`, `/quran`: `0` total violations (`0` serious/critical), `26–32` rule passes per route.
  - Console runtime errors & uncaught exceptions: `0`.

### Visual Inspection (`artifacts/stage-10-hardening/`)
All 6 PNGs inspected directly:
- `01-home-desktop.png`: `.nk-home-greeting` renders cleanly above `<h1>` with balanced RTL Arabic typography and zero overlap.
- `02-settings-dark-pills.png`: Verified `.noata-pill-check-icon` renders high-contrast light green pill + dark icon against dark/Midnight surfaces cleanly.
- `03-home-zoom-640x480.png`: Clean 200% zoom reflow with compact mobile topbar and bottom navigation.
- `04-study-320px.png`, `05-ai-desktop.png`, `06-login-320px.png`: Zero horizontal clipping or text collision at `320px` and desktop viewports.

### Modern Web Guidance
- Applied `min-block-size` intrinsic reservation for async greeting updates (zero CLS) alongside deterministic LCP element stability.
- Applied logical box reflow design across `640x480` (`200%` zoom) and `320px` mobile widths without horizontal scrolling.
- Preserved native semantic landmarks, `role="alert"` error recovery boundaries, and high-contrast light/dark theme tokens.
