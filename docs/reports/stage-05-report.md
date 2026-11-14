# Stage 05 Verification Report — Noäta Intelligence Infrastructure, Grounding & AI Evaluation

**Date**: 2026-11-14
**Milestone**: Stage 05 (`P0` / `P1` — Unify Edge/Client Orchestration, Curriculum Grounding, Security Boundaries, & Curated Bilingual Eval Suite)

## 1. Root Causes Fixed & Architecture Upgrades

1. **Edge Chat Contract Alignment (`apps/web/lib/study/quizgecko-engine.ts`)**:
   - Fixed the broken `functions.invoke("noata-ai-v2", { body: { action: "chat", message: prompt } })` invocation that read non-existent `data?.response`.
   - Aligned `generateQuizGeckoBundle` to invoke `AI_FUNCTION` (`noata-ai-v2`) with `{ action: "chat", model: "auto", stream: false, responseLanguage, max_tokens: 2400, temperature: 0.2, requestId, messages: [{ role: "user", content: prompt }] }` and read `data?.content ?? data?.choices?.[0]?.message?.content ?? data?.response`.
   - Aligned `apps/web/components/preferences/design-studio.tsx` to use configured `AI_FUNCTION`, `responseLanguage`, `frameUntrustedStudyInput`, `stripAiWrappers`, `ThemeSuggestionSchema`, and `classifyAiError`.

2. **Strict Zod Schemas, Deterministic Repair & Unified Error Taxonomy (`apps/web/lib/ai/schemas.ts`)**:
   - Authored `ProvenanceSchema`, `QuizItemSchema` (strict `correctIndex < options.length` check), `QuizFlashcardSchema`, `StudyBundleSchema`, and `ThemeSuggestionSchema`.
   - Implemented `stripAiWrappers`, `extractBalancedJsonObject`, and `parseAndValidateStudyBundle` (deterministically repairs safe defects such as `"نوتة"`->`"نقطة"`, invalid `type`, missing explanations, empty cards array, or out-of-range `correctIndex`).
   - Added `classifyAiError` unified error taxonomy (`FANAR_NOT_CONFIGURED`, `AI_QUOTA_EXCEEDED`, `AI_RATE_LIMITED`, `AI_UPSTREAM_TIMEOUT`, `AI_UPSTREAM_UNAVAILABLE`, `AI_INVALID_REQUEST`, `AI_SCHEMA_INVALID`, `AI_SECURITY_POLICY_REFUSAL`, `AI_UNKNOWN_ERROR`) so quota exhaustion (`429`) and transient upstream outages (`502`/`503`/`504`) degrade cleanly into local synthesis with non-destructive warning banners in `study-live.tsx`.

3. **Curriculum Grounding, Provenance Badges & Security Isolation (`supabase/functions/noata-ai/index.ts`, `study-live.tsx`)**:
   - Added explicit provenance tagging (`curriculum_derived`, `user_notes`, `ai_supplementary`) in `QuizGeckoBundle`, `QuizFlashcard`, and visible badges in `apps/web/components/study/study-live.tsx`.
   - Added bilingual `detectAdversarialTamperingPrompt` + `frameUntrustedStudyInput` (`<untrusted_study_input>`) blocking prompt-injection overrides, XP/Coin/mastery tampering, cross-student/staff privilege escalation, and XSS payloads before Fanar Edge invocation.
   - Updated `supabase/functions/noata-ai/index.ts` system prompt rules against `<untrusted_study_input>` / wallet tampering and emitted standardized error `code` alongside existing `error` and `quota` JSON fields in `catch`.
   - Verified `supabase/functions/noata-ai/learner-context.ts` enforces `.eq("user_id", userId)` across all learner-specific reads (`profiles`, `lesson_progress`, `skill_evidence`, `curriculum_enrollments`) without reading staff or other students' rows.

## 2. Verification Results

| Check | Result | Notes |
| --- | --- | --- |
| `node --test` Stage 05 targeted (`schemas`, `eval-runner`, `quizgecko-engine`, `learner-context`) | **22 / 22 PASS** | `0` failed, `0` skipped (`task-2209`) |
| `pnpm check:text` | **PASS** | `666` UTF-8 tracked files; zero replacement glyphs or bidi controls (`task-2209`) |
| `pnpm typecheck` | **PASS** | `apps/web` + `packages/core` cleanly typed (`task-2209`) |
| `pnpm modern:test` | **641 / 643 PASS** | `0` failed; `2` skipped (`pdftoppm` binary unavailable on Windows host) (`task-2216`) |
| `pnpm legacy:check` | **730 / 739 PASS** | `0` failed; `9` skipped (`pdftoppm` & Python unavailable on Windows host) (`task-2216`) |
| `pnpm --filter @noata/web build` | **PASS** | Clean build (`apps/web/.next` deleted prior); `42/42` routes compiled (`task-2216`) |
| Live Fanar inference / Edge deploy | **NOT EXECUTED LOCALLY** | Docker & Deno unavailable locally; client/server contract and error taxonomy verified via deterministic mocks |

## 3. Baseline Evaluation Artifact

See [`docs/reports/ai-eval-baseline.md`](./ai-eval-baseline.md) for the 40-prompt bilingual evaluation baseline.
