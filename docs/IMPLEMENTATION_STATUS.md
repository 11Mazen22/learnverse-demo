# Implementation status

Evidence labels: **AUTOMATED TEST VERIFIED**, **IMPLEMENTED, NOT VERIFIED**, and **DEFERRED**.

## Phase 0 — establish

- Arabic-first neutral product identity: **AUTOMATED TEST VERIFIED** (server/UI smoke and syntax)
- Versioned labeled demo curriculum and provenance: **IMPLEMENTED, NOT VERIFIED** by a curriculum reviewer
- Modular server, persistence, decision and operations docs: **AUTOMATED TEST VERIFIED**

## Phase 1 — learning vertical slice

- Login → curriculum → lesson → three questions → explanations → saved attempts → progress: **AUTOMATED TEST VERIFIED**
- Multiple choice and tolerant numeric scoring: **AUTOMATED TEST VERIFIED**
- Retry state and question-version capture: **AUTOMATED TEST VERIFIED**
- RTL/LTR responsive interface: **MANUAL WORKFLOW VERIFIED** in a desktop browser and 390×844 emulation; physical-device and assistive-technology verification remains open

## Phase 2 — adaptive learning

- Explainable skill evidence states, distinct-question minimum, assistance discount, 1/3/7-day review: **AUTOMATED TEST VERIFIED**
- Three-question escalating Unit Boss with recovery outcomes: **AUTOMATED TEST VERIFIED**
- Parallel-question retry pool: **DEFERRED**; the current demo explains the need but reuses the fixed set

## Phase 3 — rewards

- Append-only ledger, one-time lesson/Boss grants, idempotency, no-negative-balance rule: **AUTOMATED TEST VERIFIED**
- Atomic purchase and inventory grant, duplicate concurrent request handling: **AUTOMATED TEST VERIFIED**
- Cosmetic collection and balance-aware Shop: **AUTOMATED TEST VERIFIED** at API level; browser purchase confirmation UI is implemented but not purchase-click verified manually

## Phase 4 — staff workflows

- Teacher-scoped class roster, evidence summary, assignment creation: **AUTOMATED TEST VERIFIED**
- Admin content/provenance and audit view: **IMPLEMENTED, NOT VERIFIED** manually
- Full draft → review → approve → publish mutation workflow and reward corrections: **DEFERRED**

## Phase 5 — pilot readiness

- Static-asset-only service worker and offline warning: **IMPLEMENTED, NOT VERIFIED** under network throttling
- Arabic mistake → explanation → retry and English direction switch: **MANUAL WORKFLOW VERIFIED** in the browser with no console warnings/errors
- Production authentication, PostgreSQL migrations, rate limiting, backup restore drill, deployment: **DEFERRED**
- Physical mobile, keyboard, screen reader, Arabic copy, performance and security review: **DEFERRED**

## Prioritized next steps

1. Move persistence to PostgreSQL with migrations, row ownership constraints, password hashing, and expiring server sessions.
2. Add reviewed parallel question pools and content-review state transition endpoints.
3. Add an idempotent offline submission queue with visible pending/synced/failed states.
4. Run physical-device, keyboard, screen-reader, RTL/LTR, slow-network, and account-switch QA.
5. Complete threat modeling, rate limits, recovery drill, and authorized pilot content review.
