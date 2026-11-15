# Persistence, Saving Integrity & Database Contract Audit

**Scope:** 52 migrations (`supabase/migrations/*`), client account/mutation guards (`apps/web/lib/supabase/*`), scoped storage (`draft-storage.ts`), and persistence across every learning/preference workflow.

---

## 1. Confirmed Database Contract & Security Baseline

- **Authoritative Server RPCs (`SECURITY DEFINER`, `authenticated`-only, `pg_advisory_xact_lock`)**:
  - `public.submit_attempt(...)`: Validates active course, unlocked unit, published question, and `idempotency_key`; grades via `question_keys`; inserts `attempts`; updates `skill_evidence` & awards `+10 XP` on first non-repeat correct answer (`p_practice_repeat = false`).
  - `public.complete_lesson(p_lesson_id, p_score)`: Recomputes `v_score` server-side across all base questions; writes `lesson_progress` & first-completion `ledger` XP/Coins.
  - `private.award_verified_lesson_gems()`: Trigger on `lesson_progress` awarding idempotent `+5 GEM` (`>= 90%`) and `+3 GEM` (`100%`) when all base questions were solved unassisted (`assisted = false`, `practice_repeat = false`).
  - `public.complete_unit_boss(...)` & `public.claim_reward_box(...)`: Server-verified 3/3 boss run -> `boss_runs`, `+40 XP`, `+60 COIN`, `reward_boxes`.
  - `public.review_flashcard(p_card_id, p_rating, p_idempotency_key)`: Idempotent SM-2 scheduling with zero XP/mastery leakage (table writes exclude `state, ease_factor, interval_days, repetitions, lapses, last_reviewed_at, due_at`).
- **Owner-Only Preferences (`user_settings`)**:
  - `M1` (`20261114000000_user_settings_dashboard_preferences.sql`) adds `dashboard_preferences jsonb NOT NULL DEFAULT '{}'::jsonb` (`check (jsonb_typeof(dashboard_preferences) = 'object')`), `REVOKE ALL FROM public, anon; GRANT SELECT, INSERT, UPDATE TO authenticated`.
- **Personal Study Notebook Confirmation**: Verified `study_notes` has **0 tables, 0 columns, 0 policies, and 0 RPCs** across all 52 SQL migrations and `database.types.ts` — remains deferred per governance.

---

## 2. Persistence & Recovery Audit Matrix

| Workflow | Server Persistence | Local Draft / Storage | Phase 0 Reliability Gaps & Fixes Required |
| :--- | :--- | :--- | :--- |
| **Lesson Completion** | `lesson_progress` via `complete_lesson` RPC in `mission-live.tsx` (`useConfirmedMutation`) | None | Preserve as-is; keep lesson completion connected clearly from `/lesson/[id]` Stage 6 -> `/missions` (`lesson-live` should also reflect live completion status accurately). |
| **Lesson Stage, Worked Reveal & Practice Resume** | Quick checks call `submit_attempt` (`p_practice_repeat: true`) for DB Qs | **None** | **Data Loss + Race Bugs:** Refreshing loses `activeStage`, `revealedStepsByExample`, `practiceIndex`, `hintVisible`, and curated `answerStates`. Switching route `id` forgets `setActiveStage(0)` (`lesson-live.tsx:183-203`). Quick check (`L542-658`) uses `AttemptIdempotencyController.getAttemptKey` **without `runExclusive`, `useConfirmedMutation`, or `account.revision` guard**! Add scoped local checkpoint resume (`draft-storage.ts`, 24h TTL) + `useConfirmedMutation` guard. |
| **Active Assignment Progress & Submit** | Checked DB items -> `attempts`; submit -> `assignment_submissions` (`23505` conflict recovery) | **None** | **High Risk Loss:** `progress` Map (`assignments-live.tsx:137-146`) lives only in React ref memory; refresh clears position/checked state without rehydrating `attempts`. `useUnsavedWork` (`L207`) misses unsaved progress if current item's input is empty after answering previous questions. Migrate writes to `useConfirmedMutation` + scoped assignment draft checkpoint (`draft-storage.ts`) cleared cleanly on confirmed submission! |
| **Missions & Unit Boss Runs** | `submit_attempt`, `complete_lesson`, `complete_unit_boss`, `claim_reward_box` via `useConfirmedMutation` | **None** | `mission_runs` table (`0004:54-66`) is **unused** (`0` references in `mission-live.tsx`); refreshing mid-run drops shields/question index. Evaluate scoped draft checkpoint recovery (cleared on `complete_lesson`/`complete_unit_boss`) or `mission_runs` sync while preserving exact RPC completion guarantees. |
| **Study Studio Quizzes (`study-live.tsx`, `interactive-quiz-runner.tsx`)** | `study_sessions` + `study_mistake_logs` | Scoped 24h `quiz_${bundle.id}` | **Stale Draft Bug:** `handleFinishQuiz` (`221-244`) never clears `quiz_${bundle.id}` draft, restoring finished answers on reopen. **Swallowed Errors:** `recordStudySession` (`843`), `handleLogMistake` (`917`), `handleUpdateSavedQuizScore` (`1170`), `handleDeleteSavedQuiz` (`1201`), `MistakeHub` (`3082, 3091, 3098`) **ignore Supabase `.error`**! Wrap in `useConfirmedMutation` & surface real error + retry. |
| **Flashcards & Decks (`study-live.tsx`)** | `flashcard_decks`, `flashcards`, `review_flashcard` RPC | Scoped guest workspace | `reviewCard` (`1397-1445`) shares single `busy` boolean without `useConfirmedMutation` or `account.revision` check; `saveCardsToNewDeck` (`1027-1061`) creates deck before cards without error rollback/guidance if card insert fails. |
| **Review Queue (`review-live.tsx`)** | DB items -> `submit_attempt` (`useConfirmedMutation`) | None | Curated offline items remain client-only (explicitly label as practice-only if unauthenticated/curated, never fake mastery save). |
| **Dashboard Tasks & Prefs (`dashboard-live.tsx`)** | `study_tasks`, `user_settings.dashboard_preferences`, `curriculum_enrollments` | `noata:dashboard-prefs:${userId\|\|"guest"}` | **Premature Local Write (`L602-635`):** writes `localStorage` BEFORE `user_settings.upsert`, leaving `localStorage` dirty on DB error rollback. Task toggle (`L553-574`) doesn't revert `activityEvents` on failure. Track select (`L507-539`) lacks `useConfirmedMutation`. Fix: show explicit `"Saving..."` -> persist DB first -> commit `localStorage` + show `"Saved"` only after server confirm! |
| **Settings & Theme Controls** | `user_settings`, `profiles`, `user_theme_designs` | `noata-theme`, `noata-palette`, `noata-locale` (UNSCOPED!) | **Account Isolation Bug + Premature Write:** `noata-theme`, `noata-palette`, `noata-locale`, and `noata_sidebar_collapsed` are unscoped in `localStorage` (leak from Account A -> Account B / post-logout). `settings-live.tsx` (`L108, 127, 1106`) writes `localStorage` on click before "Save"; `locale-control.tsx:22-31` fires unawaited `upsert` without checking error. Fix with account-scoped keys (`account.userId \|\| "guest"`), `SIGNED_OUT` purge in `draft-storage.ts`, and confirmed save states. |
| **Quran Bookmarks (`quran-reader.tsx`)** | None | **Unscoped** `noata-quran-bookmarks-v1` | Leaks across accounts sharing a browser. Scope key per `account.userId \|\| "guest"` and include in sign-out foreign-account purge! |
| **Help Support Form** | `POST /api/support/ticket` | React state | Fix initial `useState(account.user)` race (`help-center-live.tsx:23-24`) so authenticated profile pre-fills cleanly when `account.loading` finishes. |
