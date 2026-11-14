# Noäta 2.0 — Stage 04 Verification Report (Advanced Study & Flashcard Ecosystem + M2)

**Date**: 2026-11-14
**Scope**: Stage 04 (`/study` Rebuild, Domain Engines, Additive Migration `M2`, Security & Accessibility Audit)
**Status**: **COMPLETE — PASSED ALL VERIFICATION GATES**

---

## 1. Architecture & Implementation Summary

### Database Migration `M2` (`supabase/migrations/20261114000100_study_ecosystem_v2.sql`)
- Added JSONB object-checked `metadata` columns (`jsonb_typeof(metadata) = 'object'`) on `public.flashcard_decks` and `public.flashcards`.
- Executed explicit table-level `revoke insert, update on table public.flashcards from public, anon, authenticated;` prior to narrowed column grants on `(deck_id, user_id, card_type, front, back, cloze_text, position, suspended, metadata)` (`insert`) and `(card_type, front, back, cloze_text, position, suspended, metadata)` (`update`), ensuring SM-2 columns (`state`, `ease_factor`, `interval_days`, `repetitions`, `lapses`, `last_reviewed_at`, `due_at`) remain server-authoritative via `public.review_flashcard(uuid, int, text) -> jsonb`.
- Extended `review_flashcard` receipts with `state`, `repetitions`, and `lapses` without changing signature.
- Added owner-RLS tables `public.study_mistake_logs` and `public.study_sessions` strictly isolated from `ledger`, `skill_evidence`, and `lesson_progress`.
- Updated `apps/web/lib/supabase/database.types.ts`, `scripts/database-recovery-rehearsal.mjs` (delta assertion `33`), `scripts/sql/security-regressions.sql`, `test/smart-study-migration.test.mjs`, and added `test/study-ecosystem-migration.test.mjs`.

### Pure Domain Engines (`apps/web/lib/study/`)
- `scheduler.ts`: Deterministic SM-2 scheduler & interval preview helper (`sm2_exact_parity.test.ts`).
- `cloze.ts`: Multi-group `{{c1::answer::hint}}` parser, segment renderer, and markup stripper (`cloze.test.ts`).
- `answer-matcher.ts`: Normalization/strict/fuzzy matching engine stripping Arabic tashkeel/tatweel, strictly preserving Ta Marbuta (`ة`) vs Ha (`ه`), supporting opt-in Alef normalization, and surfacing close-match warnings (`answer-matcher.test.ts`).
- `metadata.ts`: Typed card/deck metadata parser & bulk importer supporting Anki TSV, CSV, Markdown (`Term :: Definition`), and multi-group Cloze lines (`metadata.test.ts`).
- `draft-storage.ts`: Scoped `userId:epoch` 24-hour TTL draft storage (`draft-storage.test.ts`), wiped immediately on sign-out and account switch via `use-verified-account.tsx` and `user-menu.tsx`.

### Modular UI & Styling (`apps/web/components/study/` & `apps/web/app/study-experience.css`)
- Rebuilt `@layer study` `apps/web/app/study-experience.css` with semantic Tier 1/2 tokens, zero `!important`, CSS Grid `.noata-3d-card` natural-height faces (no fixed-height clipping), reduced-motion crossfade, and `@media print` card sheet support.
- Created `study-rich-text.tsx` (GFM + KaTeX + strict `https?` link filter), `flashcard-review-studio.tsx` (SM-2 Spaced vs Free Cram, Multi-Group Cloze, Typed Recall, `Space`/`1`–`4` shortcuts, atomic RPC error guard), `interactive-quiz-runner.tsx` (Tutor vs Strict Exam mode locking Hints/50:50 until submission, Question Navigator, Flagging, Mistake Logging, `confirmAction`), `study-speed-match.tsx`, `study-import-export.tsx`, `study-mistake-hub.tsx`, and rebuilt `study-live.tsx` (5 tabs, full `data-tour` preservation, local interactive preview mode, zero legacy `"QuizGecko"` copy, zero `window.confirm`/`alert`).
- Updated `apps/web/app/styles/ui.css` so mobile `.nk-toast-region` stacks clear `.mobile-nav` at `max-width: 800px` (`target-size` WCAG 2.2 AA compliance).

---

## 2. Verification Results (Run Post-Final-Edit)

| Check | Outcome | Details |
| :--- | :---: | :--- |
| `pnpm check:text` | PASS | 666 tracked UTF-8 files verified cleanly; zero replacement glyphs or bidi controls. |
| `pnpm typecheck` | PASS | `packages/core` and `apps/web` (`next typegen && tsc --noEmit`) passed with 0 errors. |
| `pnpm modern:test` | PASS | 632 tests: 630 passed, 0 failed, 2 skipped (`pdftoppm` absent locally). |
| `pnpm legacy:check` | PASS | 728 tests: 719 passed, 0 failed, 9 skipped (`pdftoppm` and Python absent locally). |
| `pnpm --filter @noata/web build` | PASS | Clean `.next` build succeeded across all 42 static/worker routes. |
| Headless Chrome & `axe-core` WCAG 2.2 AA (`stage04_verify.mjs`) | PASS | Verified 5 tabs, Strict Exam hint/50:50 locking, CSS Grid `.noata-3d-card` fit, KaTeX, multi-group Cloze, Typed Recall mismatch vs match, Speed Match, Mistake Hub, Bulk Sample Import, Mobile EN 390px `0` overflow, and `0` WCAG 2.2 AA violations across Classic Light (1440px AR / 390px EN) and Midnight Dark (1440px AR). |

*(Note: Docker and Deno are unavailable in this Windows environment; SQL execution tests are staged and syntax-checked locally rather than run against a live container.)*

---

## 3. Visual Artifacts
- `artifacts/stage-04-study/study-quiz-ar-1440.png`
- `artifacts/stage-04-study/study-review-midnight-ar-1440.png`
- `artifacts/stage-04-study/study-decks-en-390.png`
