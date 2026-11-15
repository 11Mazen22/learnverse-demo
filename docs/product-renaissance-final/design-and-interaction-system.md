# Design, Dashboard & Interaction System Audit (Phase 0 Baseline)

**Scope:** Dashboard (`/` & `/dashboard`), Tier 1–4 Component & CSS Adoption, Palette Contrast Matrix, and Unified Micro-Interactions.

---

## 1. Dashboard Usability & Metric Grounding Audit (`dashboard-live.tsx`)

Both `/` and `/dashboard` render `<AppShell active="/"><DashboardLive /></AppShell>`. Current UX & telemetry defects verified in Phase 0:

1. **Hierarchy Confusion & Duplicate CTAs**:
   - Hero left utility bar (`dashboard-live.tsx:1492-1510`) and right `.nk-home-next-card` (`1557-1566`) render the **identical** primary CTA (`recommended.href` / `recommended.ctaAr/En`), while `quick_launcher` (`1318-1381`) repeats `/ai` and `/study` a second time.
2. **Broken Next-Action Link & Track Switch Desync**:
   - `apps/web/lib/dashboard/next-action.ts:124` and `dashboard-live.tsx:817` link students with due flashcards (`dueFlashcards >= dueSkills`) to **`/study?mode=due`**.
   - `study-live.tsx:723-734` ignores `mode` unless `tab=review` is present and only matches `spaced|cram|speed_match|mistake_hub` — landing students on the Generator tab instead of Spaced Review!
   - Switching active subject tracks (`handleSelectTrack`, `dashboard-live.tsx:507-539`) writes `curriculum_enrollments` without recomputing `state.nextLesson` or gating on `useConfirmedMutation` / `account.revision`.
3. **Hidden `account.error` & Unsorted/Incomplete Weak-Skill Radar**:
   - `dashboard-live.tsx:186` defines `signedIn = Boolean(account.user) && !account.loading && !account.error`, while `1405` gates error banners behind `{signedIn && (account.error || error)}`. When `account.error` is truthy, **`signedIn` is false and no error banner can ever render**.
   - `weak_radar` (`391-409`) checks non-existent `"review"` enum (`mastery_state` is `'new'|'reteach'|'supported'|'mixed'|'provisional_mastery'|'mastered'`), misses `"supported"` (`60..69`), slices `0..4` unsorted by score, and `"Drill"` links to `/review?mode=topic&track=...` without passing `skill_id`.
   - `allLessons` query (`200-230, 441-445`) orders only by `lessons.position` without joining `units.position`, corrupting Next Lesson resolution across multi-unit tracks.
   - `assignments.limit(10)` (`352-356`) truncates before filtering out submitted assignments, hiding a 11th pending assignment.
4. **Ungrounded Goal & Layout Quirk**:
   - `dailyMinutesTarget` (`955-960`) displays a static goal caption despite **zero tracked study-minute duration** in Postgres or `activityEvents`. Should either be replaced/annotated honestly until timer telemetry exists or removed from active KPI bars.
   - `next_steps` and `weak_radar` (`1573-1583`) pair into `.db-two-col` only when adjacent in `visibleOrder`, unexpectedly stretching full-width if reordered independently.
   - `buildConsistencyHeatmap` queries `.limit(200)` on `attempts` / `flashcard_reviews` and `.limit(12)` on `study_tasks`.

### Dashboard Redesign Plan (Phase 3)
- Transform the Home workspace into a crisp **4-question cockpit**: *Where am I?* (compact welcome + verified streak & active track bar) -> *What should I do next?* (single authoritative Priority Next Action card linking validly to `/lesson/[slug]`, `/study?tab=review&mode=spaced`, `/review?skill=...`, or `/assignments?focus=...`) -> *What needs attention?* (Weak-Skill Radar + Urgent Assignments & Open Tasks) -> *Progress & Explore* (Subject Grid + 14-day Consistency & Weekly Cards/Lessons goals).
- Adopt canonical Tier 4 `BentoGrid`, `StatTile`, and `PageHeader` geometry across widgets cleanly while preserving all `[data-tour="*"]` and `.noata-logo-vector .noata-mark-ribbon` selectors.

---

## 2. Visual & Tier 1–4 Design System Inconsistency Register

1. **Dark-Mode WCAG Contrast Failure (`design-rebirth.css`)**:
   - Lines `971` and `1352` hardcode `color: #047857 !important` instead of `var(--success)`, failing WCAG 2.2 AA (`4.5:1`) on dark `--surface` in **all 7 palettes** (`ocean: 2.38:1`, `forest: 2.56:1`, `sunset: 2.56:1`, `rose: 2.68:1`, `midnight: 2.83:1`, `aura: 2.93:1`, `classic: 3.06:1`).
2. **Dark Mobile Dock Palette Override (`aura-finish.css:494-522`)**:
   - `@layer sections` hardcodes `#0d1d38` / `#173c61` for `html[data-theme="dark"] .mobile-nav` at `<= 900px`, beating `@layer shell` and breaking `aura`, `ocean`, `forest`, `sunset`, `rose`, and `midnight` mobile bars.
3. **Silent `@layer theme` Dark Overwrite (`globals.css:95-108`)**:
   - `globals.css` loads after `tokens.css` inside `@layer theme` and overwrites `--success`, `--warning`, `--danger` with legacy hexes (`design-system.test.ts` doesn't parse `globals.css`).
4. **Unlayered CSS Modules (`noata-one.module.css`, `research-panel.module.css`)**:
   - Lack `@layer`, beating `@layer components` / `@layer utilities` rules (including reduced-motion rules unless explicitly duplicated inside each module).
5. **Blanket Tag Selectors & `!important` Sprawl**:
   - `1,069` `!important` declarations remain (`design-rebirth.css`: `571`, `palette.css`: `350` caused by `globals.css:3829` `.aura-theme-menu button span`).
   - `.nk-*` helper classes leaked outside `ui.css`/`patterns.css` into `dashboard-renaissance.css`, `study-experience.css`, `sidebar-rebirth.css`, `ai-flow.css`.
6. **Low Tier 3 & Tier 4 Adoption & Split `/help` UI**:
   - Tier 4 `PageHeader`, `BentoGrid`, `StatTile`, `SplitReaderShell`, `FilterToolbar`, `StaffConsoleSection` have **0 external imports**.
   - `ChoiceCardGroup` exists in `components/ui/` but is **omitted from `components/ui/index.ts`**.
   - `495` TSX lines still use legacy `.btn`/`.panel`/`.metric-card`/`.topbar`/`.aura-load-error` and `601` inline `style={{` overrides exist (heaviest in `lesson-live` 74, `study-live` 51, `admin-live` 48, `teacher-live` 41).
   - `curriculum-manager.tsx:667-668` hardcodes light `#fff3e8`/`#e9f7f0`; `app/help/page.tsx` renders legacy `HelpCenter` stacked on top of modern `HelpCenterLive`; marketing routes hardcode dark Tailwind hexes (`#030712`, `#0c1322`).
7. **Broken Directional Icons & Split Reduced-Motion State**:
   - `Icon` (`icon.tsx:3-88`) renders `"arrow"` pointing **left** and falls back unknown icon names silently to `ai` sparkles (`L119`). Callers use `"arrow"` unmirrored for "Next" / "Go" across Settings, Command Palette, Launchpad, Coach, Quran. Add dedicated directional `arrow-start` / `arrow-end` / `chevron-start` / `chevron-end` or consistent logical mirroring.
   - `data-reduced-motion` (Settings) vs `data-noata-motion` (AI Studio `localStorage["noata-ai-motion-v1"]`) are disconnected — unify so app Settings motion preference governs everywhere (`ui`, `ai`, `quran`, `help`, `marketing`) respecting `prefers-reduced-motion`.
