# Implementation status

Evidence labels: **AUTOMATED TEST VERIFIED**, **MANUAL WORKFLOW VERIFIED**, **IMPLEMENTED, NOT VERIFIED**, and **DEFERRED**.

## Phase 0 — establish

- Arabic-first neutral product identity: **AUTOMATED TEST VERIFIED** (server/UI smoke and syntax)
- Versioned labeled demo curriculum and provenance: **IMPLEMENTED, NOT VERIFIED** by a curriculum reviewer
- Modular server, persistence, decision and operations docs: **AUTOMATED TEST VERIFIED**

## Phase 1 — learning vertical slice

- Login → curriculum → lesson → three questions → explanations → saved attempts → progress: **AUTOMATED TEST VERIFIED** and **MANUAL WORKFLOW VERIFIED** end to end in the browser (Arabic and English)
- Multiple choice and tolerant numeric scoring: **AUTOMATED TEST VERIFIED**
- Retry state and question-version capture: **AUTOMATED TEST VERIFIED**
- RTL/LTR responsive interface: **MANUAL WORKFLOW VERIFIED** in desktop and 375×812 mobile emulation, both directions, including true `dir`/`lang` attribute switching; physical-device and assistive-technology verification remains open

## Phase 2 — adaptive learning

- Explainable skill evidence states, distinct-question minimum, assistance discount, 1/3/7-day review: **AUTOMATED TEST VERIFIED**
- Three-question escalating Unit Boss with recovery outcomes: **AUTOMATED TEST VERIFIED** and **MANUAL WORKFLOW VERIFIED** (3/3 completion, one-time reward)
- Reviewed parallel-pool retry: **AUTOMATED TEST VERIFIED** and **MANUAL WORKFLOW VERIFIED**. A wrong lesson-question answer now offers a distinct reviewed variant on retry instead of literally repeating the same question (`lib/domain.mjs:pickVariant`); a Unit Boss retried after an imperfect score rotates to its reviewed variant set and returns to the primary set once mastered (`lib/domain.mjs:activeBossQuestionIds`). Currently one variant per question/Boss slot; a deeper pool is a future content-authoring task, not an architecture gap.

## Phase 3 — rewards

- Append-only ledger, one-time lesson/Boss grants, idempotency, no-negative-balance rule: **AUTOMATED TEST VERIFIED**
- Atomic purchase and inventory grant, duplicate concurrent request handling: **AUTOMATED TEST VERIFIED**
- Cosmetic collection and balance-aware Shop: **AUTOMATED TEST VERIFIED** and **MANUAL WORKFLOW VERIFIED** (purchase confirmation dialog, balance-gated disabled state, atomic deduction)
- XP and Levels: **AUTOMATED TEST VERIFIED** and **MANUAL WORKFLOW VERIFIED**. XP is a separate, non-spendable ledger currency (`currency: 'XP'`) awarded once per question on first-ever correct attempt, plus one-time lesson/Boss completion bonuses; level is `floor(xp / 100) + 1` (rule `xp-mvp-1`, thresholds are a configurable hypothesis, not validated).
- Character equip/collection: **AUTOMATED TEST VERIFIED** and **MANUAL WORKFLOW VERIFIED**. Students equip owned cosmetics per slot (avatar/outfit/companion/background) from a "My collection" panel; the server validates ownership and item-type match before equipping.

## Phase 4 — staff workflows

- Teacher-scoped class roster, evidence summary, assignment creation: **AUTOMATED TEST VERIFIED**
- Admin content/provenance and audit view: **MANUAL WORKFLOW VERIFIED**
- Draft → review → approve → publish → retire content workflow: **AUTOMATED TEST VERIFIED** and **MANUAL WORKFLOW VERIFIED** end to end in the Content Studio, including role enforcement (only `admin` may transition state), invalid-transition rejection, and audit logging of every step (`PATCH /api/admin/questions/:id/status`).

## Phase 5 — pilot readiness

- Static-asset-only service worker and offline warning: **IMPLEMENTED, NOT VERIFIED** under real network throttling (only simulated via `navigator.onLine` override)
- Idempotent offline submission queue with pending/synced/failed states: **MANUAL WORKFLOW VERIFIED**. Lesson-question attempts made while offline are queued client-side (localStorage-backed) with a visible "waiting for connection" state that makes no correctness claim; on reconnect they replay through the same idempotent `/api/attempts` endpoint and the real outcome (correct/incorrect, explanation, retry variant) is then shown. Unit Boss and Shop purchases are intentionally **not** queued — both are blocked outright while offline, since silently queuing an assessment result or a currency-affecting purchase would misrepresent an unvalidated action as complete.
- Basic rate limiting: **AUTOMATED TEST VERIFIED**. Per-IP fixed-window limits on `/api/auth/login` (20/5min) and all `/api/*` traffic (600/min) as a first line of defense; this is not a substitute for a production WAF/rate-limiting layer.
- Arabic mistake → explanation → retry and English direction switch: **MANUAL WORKFLOW VERIFIED** in the browser with no console errors
- Keyboard/focus accessibility: **MANUAL WORKFLOW VERIFIED**. Modals (purchase confirmation, celebration) and the study-helper panel now close on Escape with focus restored to the trigger, trap Tab within themselves while open, and dismiss on backdrop click. Fixed a real dead-control bug along the way: the Settings page's "reduce motion" toggle rendered but had no click handler at all — now it genuinely forces `animation:none`/`transition:none` (persisted per-browser), on top of the existing automatic `prefers-reduced-motion` support. Full screen-reader and physical-keyboard-only walkthroughs remain open.
- Production authentication, PostgreSQL migrations, backup restore drill, deployment: **DEFERRED**
- Physical mobile device, screen reader, and formal performance/security review: **DEFERRED**

## Phase 6 — AI assistance (brought forward from "later release" at the user's request)

- Self-hosted AI study helper (Ollama): **MANUAL WORKFLOW VERIFIED** end to end on the live deployment, in both Arabic and English, with properly-encoded test input (an earlier round of "broken Arabic" findings turned out to be partly caused by a flawed test harness — a Windows/Git-Bash `curl` invocation mangling inline Arabic UTF-8 — not the model; retesting with a real UTF-8 file gave materially better results). Grounded to the current lesson/question only (system prompt built server-side from the same published-content data the lesson uses); per-user rate limit (15/10min) plus a 45s timeout with a deterministic, clearly-labelled fallback when unavailable; every reply carries `aiGenerated`/`unavailable` flags the UI renders as an explicit "AI draft, verify with your teacher" notice; unavailable during the Unit Boss so it can never assist a formal assessment; structurally unable to touch scores/wallet/mastery since `/api/tutor/ask` never calls `store.transact`. Covered by an automated test for auth/validation/no-side-effects; AI-quality behavior itself can only be verified live, not in the automated suite.
- **Known quality limitation, honestly still present**: the model running (`qwen2.5:3b`) gives English replies that are consistently good, and Arabic replies that are *mostly* coherent but occasionally leak a stray foreign word mid-sentence (observed once each: a Chinese-character leak, a French word "Dessiner"). This is a real trait of this specific small model at this quantization, not fully fixed by prompt instructions. It was not upgraded because every larger/better-Arabic alternative tried failed for a specific, understood reason: `qwen2.5:7b` and `qwen3:8b` couldn't fit in the 5GB volume (Hobby plan doesn't expose self-serve volume resize — confirmed by inspecting the raw settings page, not a UI-navigation miss); `qwen3:4b` fit and pulled fine but its "thinking" reasoning pass could not be suppressed by either the documented `think:false` API flag or the model family's own `/no_think` inline convention, making replies too slow (40s+) and the visible output was raw reasoning text, not a final answer. See the `ollama_model_quality` memory for the full investigation trail if a future attempt is worth making (e.g. if Ollama or the specific GGUF build gets a fix for `think:false`, or if the plan is ever upgraded to Pro for volume resize).

## Fixes made during this pass (not features, but load-bearing corrections)

- **Critical**: `lib/store.mjs`'s transaction queue permanently wedged the entire server's write path after any single failed transaction (e.g., a student clicking "buy" without enough coins) — every subsequent request from every user would silently inherit that one stale rejection until restart. Root-caused and fixed; regression-covered by the full test suite (any failing test after a business-rule error would now surface this).
- Static assets (`app.js`, `styles.css`) were served with `Cache-Control: public, max-age=3600`, meaning an already-open browser tab would keep running old client code for up to an hour after any deploy. Changed to `no-cache` plus a version query string on the asset references in `index.html`; bump that version string on every deploy until a real build/content-hash pipeline exists.
- Boss sub-questions were not awarding the same per-question XP that lesson questions award on first correct attempt (only the milestone completion bonus fired) — now consistent between the two entry points.

## Prioritized next steps

1. Improve the study helper's Arabic reliability further — confirmed not solvable within current constraints (Hobby plan has no self-serve volume resize; `qwen3:4b`'s thinking mode can't be suppressed on this Ollama build). Worth revisiting if: Railway ships a Hobby-tier resize path, a fix for `think:false` lands upstream, or the plan is upgraded to Pro specifically for this.
2. Move persistence to PostgreSQL with migrations, row ownership constraints, password hashing, and expiring server sessions.
3. Author a second (and third) reviewed variant per question so the parallel pool doesn't exhaust after one retry.
4. Run physical-device, screen-reader, slow-network throttling, and account-switch QA (keyboard/focus itself is now handled; device-level assistive tech is not).
5. Complete threat modeling, a production-grade rate-limit/WAF layer, a recovery drill, and authorized pilot content review.
6. Build the "revise" step of content lifecycle (new version of a published question) — currently only draft→review→approve→publish→retire exists; revision requires deliberate versioning so past attempts keep meaning.
