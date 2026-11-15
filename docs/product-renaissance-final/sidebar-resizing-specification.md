# Sidebar Architecture, Resizing & Persistence Specification

**Baseline Inspected:** [`app-shell.tsx`](file:///c:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/components/app-shell.tsx), [`sidebar.tsx`](file:///c:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/components/sidebar/sidebar.tsx), `sidebar-{header,group,item,curriculum,footer}.tsx`, [`sidebar-rebirth.css`](file:///c:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/app/sidebar-rebirth.css), [`navigation.ts`](file:///c:/Users/mazen/OneDrive/Documents/Default%20Project/apps/web/lib/shell/navigation.ts).

---

## 1. Current Baseline & Confirmed Gaps

- **Current Dimensions**: `--sidebar-w-expanded: clamp(268px, 20vw, 304px)` desktop, `clamp(236px, 27vw, 276px)` tablet (`768px..1180px`), `--sidebar-w-collapsed: 78px` (`sidebar-rebirth.css:8-15, 1086`).
- **Missing Workspace Resize**: Zero drag or keyboard resize handle exists today.
- **Collapse Hydraulics & FOUC**: `sidebar.tsx:13, 46` reads unscoped `localStorage["noata_sidebar_collapsed"]` inside `useEffect`, causing expanded -> collapsed flicker on reload and **cross-account leakage** between users sharing a browser.
- **Dark Mobile Dock Bug**: `aura-finish.css:494-522` (`@layer sections` > `@layer shell`) hardcodes `#0d1d38` dark mobile dock styling on `<= 900px`, overriding palette semantic tokens.
- **Physical Direction Debt**: Hover nudges (`translateX`), `box-shadow: 2px 0 ...`, and `.noata-nav-indicator` radii use physical properties requiring manual RTL overrides instead of clean logical positioning.
- **Locked Test Contracts (Must Preserve)**:
  - `sidebar.test.ts:57-64`: `@media (min-width: 768px) and (max-width: 1180px)`, `@media (max-width: 767px)`, NO `@media (max-width: 1024px)`, `.mobile-nav { ... position: fixed !important }`, `.noata-main` `padding-bottom: calc(90px + env(safe-area-inset-bottom))`.
  - `.noata-compact-rail` settled width `<= 80px` (`72px` satisfies `64..80px`), `#noata-global-tooltip[data-side="left"|"right"]`, `.noata-shell:has(.mushaf-focused) > .mobile-nav { display: none }`.

---

## 2. Target Resizable Sidebar Specification

### 2.1 Centralized Configuration & CSS Tokens
Define canonical bounds in a single typed config module (e.g. `apps/web/lib/shell/sidebar-config.ts`) synchronized with `sidebar-rebirth.css`:
- `SIDEBAR_DEFAULT_WIDTH_PX = 288` (`--sidebar-w-default: 288px`)
- `SIDEBAR_MIN_WIDTH_PX = 248` (`--sidebar-w-min: 248px`)
- `SIDEBAR_MAX_WIDTH_PX = 420` (`--sidebar-w-max: 420px`)
- `SIDEBAR_COLLAPSED_WIDTH_PX = 72` (`--sidebar-w-collapsed: 72px`)
- Tablet (`768px..1180px`) effective expanded ceiling: `min(var(--sidebar-user-w, 272px), 340px)` (or clamped `236px..min(420px, 42vw)`) so `.noata-main` always retains usable workspace width.
- Update `--sidebar-current-w`:
  - Expanded: `clamp(var(--sidebar-w-min), var(--sidebar-user-w, var(--sidebar-w-default)), var(--sidebar-w-max))`
  - Collapsed (`.noata-shell[data-sidebar-collapsed="true"]`): `var(--sidebar-w-collapsed)` (`72px`)
- `.noata-shell[data-sidebar-resizing="true"]` and its `.noata-sidebar-aura`: `transition: none; user-select: none;` during active pointer drag so main workspace reflows at 60fps with zero flicker or text selection.

### 2.2 Drag-to-Resize Handle & Interaction Contract
Render a dedicated `<div role="separator">` handle (`id="noata-sidebar-resizer"`) flush along the content-facing edge (`inset-inline-end: -3px` / `width: 8px` hit target, subtle visual hairline indicator `2px` highlighting on hover/focus/active):
- **Pointer Capture**: On `pointerdown`, call `setPointerCapture(e.pointerId)`, record `startX` and `startWidth`, read `isRtl = getComputedStyle(shellEl).direction === "rtl"`, compute delta:
  `delta = isRtl ? startX - e.clientX : e.clientX - startX`
- **Clamping & Snap**: Clamp live width to `[248, 420]` (optionally if user intentionally drags far past collapse threshold `< 156px`, allow release snap-to-collapsed or clean clamp to `248px` — recommend smooth clamp `[248, 420]` + dedicated collapse button / double-click reset to `288px` for deterministic predictability).
- **Cursor & Cleanup**: Apply `cursor: col-resize`, cancel gracefully on `Escape` (restoring `startWidth`), commit state & persistence on `pointerup` / `pointercancel`, support `onDoubleClick` to reset to `288px`.

### 2.3 Keyboard Accessibility (`WAI-ARIA Window Splitter`)
- `role="separator"`
- `aria-orientation="vertical"`
- `aria-controls="noata-desktop-sidebar"`
- `aria-valuemin={248}`, `aria-valuemax={420}`, `aria-valuenow={isCollapsed ? 72 : widthPx}`
- `aria-label` (localized AR/EN: `"تغيير عرض الشريط الجانبي"` / `"Resize navigation sidebar"`) + live `aria-valuetext` announcing current px/state cleanly via a subtle polite live region on discrete keyboard changes.
- **Key Bindings (Direction-Aware)**:
  - In **LTR**: `ArrowRight` = `+16px`, `ArrowLeft` = `-16px`
  - In **RTL**: `ArrowLeft` = `+16px`, `ArrowRight` = `-16px`
  - `Shift + Arrow`: `±32px` step
  - `Home`: `248px`; `End`: `420px`
  - `Enter`: toggle collapse / reset `288px`

### 2.4 Account-Isolated Persistence & Zero-FOUC Restoration
- **Reuse Existing Schema (Zero Unnecessary Migration)**:
  Persist `{ sidebarWidthPx, sidebarCollapsed, openGroups }` inside `public.user_settings.dashboard_preferences` (`jsonb` column already validated by `M1`, preserving existing `hiddenWidgets`/`widgetOrder`/`goals` keys intact on merge in `lib/dashboard/preferences.ts` + new pure helper module `lib/shell/sidebar-preferences.ts`).
- **Client Scoped Storage & Cross-Account Purge**:
  - Replace unscoped `noata_sidebar_collapsed` with `scopedSidebarPrefsKey(userId)`:
    `noata:shell-prefs:${userId || "guest"}` + active account mirror pointer written ONLY by authenticated `VerifiedAccountProvider` (and cleared immediately on `SIGNED_OUT` via `wipeAllStudyDrafts` / `purgeForeignOrExpiredStudyDrafts` in `draft-storage.ts`, preventing Account A's width/collapse from bleeding into Account B or Guest!).
- **Pre-Hydration Boot (`layout.tsx` `NOATA_PREHYDRATION_BOOT_SCRIPT`)**:
  Read the scoped active-user/guest shell preference synchronously in `<head>` and apply `--sidebar-user-w` and `data-sidebar-collapsed` on `document.documentElement` immediately before first paint, mirrored by `Sidebar` initial state so desktop/tablet reload has zero width jump or CLS (`CLS <= 0.1`).

### 2.5 Visual Navigation Review & Cleanup
- Fix `aura-finish.css:494-522` hardcoded dark mobile dock override so `.mobile-nav` respects all 7 palette semantic tokens.
- Clean up `Sidebar`: remove duplicate `role="contentinfo"` inside `<aside>` (`sidebar-footer.tsx:58`), move collapsed-mode utility icon actions cleanly into accessible tooltipped items (`<= 72px`), tighten group headings & spacing, wire `data-accent` subtle indicator dots if appropriate without noise, and keep mobile drawer (`<= 767px`) strictly free of desktop splitter handles.
- Restore `<LocaleControl />` cleanly for signed-in users inside the utility header/footer without cluttering `.shell-topbar`.
