# Accessibility, 4-Way Localization & Platform Alignment Audit

**Compliance Targets:** WCAG 2.2 AA (`axe-core@4.11.1`), Responsive `320px–1920px`, and 4-Way Locale Matrix (`{AR UI, EN UI} × {AR Content, EN Content}`).

---

## 1. Systemic Accessibility Defects (Phase 0 Baseline)

1. **Broken `#noata-main` Skip Link on 9 Routes (`localized-skip-link.tsx:7`)**:
   - `MarketingShell` (`marketing-shell.tsx:182`) sets `<main id="mk-main">` (`/landing`, `/about`, `/features`, `/how`, `/faq`, `/curriculum`), and `app/error.tsx:20` + `app/loading.tsx:3` omit `id` on `<main>`, making the root Skip-to-Content link a dead anchor.
2. **Removed Keyboard Focus Indicator (`premium-home.css:297, 304-306`)**:
   - `.km-node-btn:focus-visible { outline: none; }` suppresses focus visibility on Hero KnowledgeMap SVG nodes without replacing it (fix with high-contrast stroke/outline).
3. **Invalid DOM Nesting (`<StudyRichText>` block elements inside phrasing/interactive elements)**:
   - Previously fixed in `ChoiceCardGroup` (`inline` prop added), **still active in**:
     - `subject-lab-frame.tsx:188-194` (block `StudyRichText` inside `<h4>`) & `:215-234` (block `StudyRichText` inside `<button role="radio">`; `radiogroup` also lacks ArrowLeft/ArrowRight roving focus)
     - `study-speed-match.tsx:298-300, 319-321` (block `StudyRichText` inside `<button className="noata-speed-tile">`)
     - `study-mistake-hub.tsx:478, 482` (block inside flex/inline label context)
     - `teacher-live.tsx:639-641` (block inside `<span>` inside `<label>`)
     - `admin-live.tsx:766-768` (block inside `<div role="heading">`)
     - `lesson-live.tsx`, `mission-live.tsx`, `boss-live.tsx`, `review-live.tsx`, `pre-lesson-diagnostic.tsx`
4. **Clickable `<div>`s & Keyboard Trap/Scroll Issues**:
   - `user-menu.tsx:133-146`, `how-marketing.tsx:160`, `knowledge-map.tsx:533-586`, `flashcard-review-studio.tsx:548` (combined with global window Space/Enter handler!), `noata-ai-client.tsx:718`.
   - `settings-live.tsx:218` (`GrandThemeGrid`) handles Space without `e.preventDefault()`, scrolling the page on selection.
   - `faq-marketing.tsx:179-181` search `<input>` lacks accessible `<label>`/`aria-label`; `curriculum-marketing.tsx:318` table lacks `tabIndex={0}` scroll focus + `<caption>`.
   - `admin-live.tsx:481-510` tabs use `aria-pressed` instead of WAI-ARIA `<Tabs>`; `login/page.tsx:254-256` tablist lacks `aria-controls` & Arrow navigation; `login/page.tsx:343` primary `<button>` lacks `type="submit"`; delete triggers in `admin-live.tsx:1137, 1172` and filter buttons in `notifications-live.tsx` / `teacher-live.tsx` omit `type="button"` or fail `44px` hit target.
   - `sidebar-footer.tsx:58` creates nested `role="contentinfo"` inside `<aside>`.
5. **Split Reduced-Motion State**:
   - Settings writes `html[data-reduced-motion]`; AI Studio reads/writes `localStorage["noata-ai-motion-v1"]` -> `html[data-noata-motion]`. `quran-reader.tsx:107` misses `data-noata-motion`; AI CSS misses `data-reduced-motion`. Must be unified on a single preference source with CSS honoring both `@media (prefers-reduced-motion: reduce)` and root attribute.
6. **Dark Contrast Violation (`design-rebirth.css:971, 1352`)**: `#047857 !important` fails AA (`2.38:1`–`3.06:1`) across all 7 palettes in dark mode.

---

## 2. 4-Way Localization, Copy Hygiene & Whole-Site Parity Register

| Matrix Area | Defect Verified in Phase 0 | Fix Assigned |
| :--- | :--- | :--- |
| **Signed-in Locale Switching** | `app-shell.tsx:213` hides `<LocaleControl />` when `account.user` exists. | Expose accessible `<LocaleControl>` in header/shell for signed-in users too (Phase 1). |
| **Admin Critical Copy Corruption** | `curriculum-catalog-admin.tsx:256` has Korean **`학습`** in Arabic string; `curriculum-manager.tsx:718` shows **`"3mastery المهارات"`**; raw enums (`published`, `draft`, `pending_source`); English CSV exports (`school-governance-panels.tsx:388`). | Phase 4 admin cleanup & proper AR/EN mapping. |
| **Marketing EN Leaks & Dead Controls** | `/landing` AI buttons (`home-marketing.tsx:531, 534`) have **no `onClick`**; `/how` (`269-329`) hardcodes Arabic panels in EN; `knowledge-map.tsx:843-851` hardcodes AR time labels in EN; `/faq` (`270` vs `271`) contradicts SLA policy between AR and EN; Arabic-only `metadata` on `/how`, `/curriculum`, `/quran`; mixed-script metadata on `/about`, `/features`. | Phase 4 marketing & metadata repair (dynamic/bilingual metadata & localized previews). |
| **Arabic Colloquial vs MSA UI Consistency** | Platform UI across Dashboard, Learn, Lesson, Study, Review, Missions, Boss, Progress, Rewards, Assignments, Notifications, Settings, Help (`HelpCenter`), RoleGate, Legal (`legal-page.tsx:90`), Login (`224-225`), Auth (`check-email`, `complete`, `error`), `error.tsx`, and `not-found.tsx` mixes Egyptian colloquial (`"مش رقم"`, `"علشان"`, `"دلوقتي"`, `"اتحفظ"`, `"مفيش"`, `"حصل خطأ"`) inside formal Arabic UI controls (note: Noäta **AI tutor conversation voice** intentionally stays warm Egyptian Arabic per user preference, whereas UI chrome, error messages, legal text, and forms should be clean, consistent standard Arabic). | Phase 3 & Phase 4 localization sweep across UI chrome/legal/errors, while preserving Egyptian AI persona in `/ai`. |
| **Split `/help` UI & Personal PII Leak** | `app/help/page.tsx` renders legacy `HelpCenter` stacked on modern `HelpCenterLive`. Personal email `mazenshazly011@gmail.com` exposed in `help-center-live.tsx:331,400`, `faq-marketing.tsx:276`, `marketing-shell.tsx:207`, `support-manager-admin.tsx:238`, and `api/support/ticket/route.ts:204`! | Unify `/help` onto `HelpCenterLive`; replace hardcoded personal Gmail with official support contact/ticket flow (`support@noata...` or config env) without exposing personal Gmail in public HTML/JSON. |
| **Arabic API & Pluralization Defects** | `/api/documents/pdf` & `/api/support/ticket` return Arabic-only JSON validation errors to EN callers. `quran-reader.tsx`, `noata-ai-client.tsx`, `teacher-live.tsx`, `notifications-live.tsx` use unpluralized counts (`"4 آيات"`, `"100 إشعارات"`); `learning`, `dashboard`, `teacher`, `lesson` use physical `"←"`/`"→"` arrows & unmirrored `<Icon name="arrow">`; `"نقطة"` / `"Noata"` vs `"Noäta"` drift across `/study`, `/settings`, `/quran`. | Phase 1 (Icon direction + CSS logical properties) & Phase 4 (bilingual API errors + `Intl.PluralRules` / proper Arabic plural forms + canonical `"Noäta"` brand). |
