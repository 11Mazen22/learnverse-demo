# Noata v1 implementation status

Last production engineering pass: 2026-10-07.

Evidence labels used here:

- **LIVE + VERIFIED** — applied to the real Supabase project or passed automated CI.
- **IMPLEMENTED + BUILD VERIFIED** — production code exists and passes the build/type gates, but still needs public-browser QA.
- **HUMAN QA REQUIRED** — cannot be truthfully certified from repository/Supabase automation alone.

## Platform foundation

- Next.js/React/TypeScript production application: **LIVE + VERIFIED**
- Supabase production schema and migrations: **LIVE + VERIFIED**
- Row Level Security across product data: **LIVE + VERIFIED**
- Supabase Security Advisor: **LIVE + VERIFIED — zero security findings**
- JWT-protected Noata AI Edge Function: **LIVE + VERIFIED**
- private Fanar secret boundary: **LIVE + VERIFIED**
- Arabic RTL / English LTR experience layer: **IMPLEMENTED + BUILD VERIFIED**
- light/dark/system theme and reduced-motion preferences: **IMPLEMENTED + BUILD VERIFIED**
- PWA manifest, service worker and offline shell: **IMPLEMENTED + BUILD VERIFIED**

## Student learning

- sign up / sign in / password recovery / session handling: **IMPLEMENTED + BUILD VERIFIED**
- profile/settings: **IMPLEMENTED + BUILD VERIFIED**
- dashboard backed by real Supabase progress/economy data: **IMPLEMENTED + BUILD VERIFIED**
- curriculum map: **IMPLEMENTED + BUILD VERIFIED**
- lesson player: **IMPLEMENTED + BUILD VERIFIED**
- adaptive three-stage Mission: **IMPLEMENTED + BUILD VERIFIED**
- server-side grading with private answer keys: **LIVE + VERIFIED**
- reviewed parallel retry variants: **LIVE + VERIFIED**
- explainable mastery evidence: **LIVE + VERIFIED**
- spaced Review Queue: **IMPLEMENTED + BUILD VERIFIED**
- Unit Boss and one-time rewards: **LIVE + VERIFIED**
- Mystery Box claim flow: **LIVE + VERIFIED**
- XP and Coins separation: **LIVE + VERIFIED**
- shop purchasing and cosmetic ownership: **LIVE + VERIFIED**
- inventory/equip: **IMPLEMENTED + BUILD VERIFIED**
- assignments and notifications: **IMPLEMENTED + BUILD VERIFIED**

## Teacher and administrator

- role-scoped teacher/admin access enforced in RLS: **LIVE + VERIFIED**
- class membership model: **LIVE + VERIFIED**
- teacher class/evidence workspace: **IMPLEMENTED + BUILD VERIFIED**
- assignment authoring and student submission workflows: **IMPLEMENTED + BUILD VERIFIED**
- grade notifications: **LIVE + VERIFIED**
- Admin Content Studio: **IMPLEMENTED + BUILD VERIFIED**
- curriculum/course/unit/lesson/skill authoring policies: **LIVE + VERIFIED**
- question draft creation with hidden answer key: **LIVE + VERIFIED**
- draft -> review -> approve -> publish -> retire lifecycle: **LIVE + VERIFIED**
- admin user role changes with audit events: **LIVE + VERIFIED**

## Noata AI

- persistent conversation history: **IMPLEMENTED + BUILD VERIFIED**
- rename, pin, archive and delete conversations: **IMPLEMENTED + BUILD VERIFIED**
- edit/regenerate/continue: **IMPLEMENTED + BUILD VERIFIED**
- default model + memory preferences: **IMPLEMENTED + BUILD VERIFIED**
- automatic Fanar routing: **LIVE + VERIFIED by regression tests**
- Fanar response sanitizer: **LIVE + VERIFIED by regression tests**
- safe Markdown/GFM response rendering: **IMPLEMENTED + BUILD VERIFIED**
- image upload / vision: **IMPLEMENTED + BUILD VERIFIED**
- STT: **IMPLEMENTED + BUILD VERIFIED**
- TTS: **IMPLEMENTED + BUILD VERIFIED**
- Oryx image generation: **IMPLEMENTED + BUILD VERIFIED**
- Shaheen translation: **IMPLEMENTED + BUILD VERIFIED**
- Guard moderation: **IMPLEMENTED + BUILD VERIFIED**
- Diwan poetry: **IMPLEMENTED + BUILD VERIFIED**
- Sadiq validation and deep research: **IMPLEMENTED + BUILD VERIFIED**
- provider quota accounting: **LIVE + VERIFIED**

## Security checks already performed

- anonymous users can read intended published demo curriculum: **LIVE + VERIFIED**
- anonymous users cannot read hidden question keys: **LIVE + VERIFIED**
- draft questions remain hidden from anonymous users: **LIVE + VERIFIED**
- student-controlled profile updates cannot alter role/XP/Coins: **LIVE + VERIFIED**
- attempts/economy changes route through protected server operations: **LIVE + VERIFIED**
- teacher/admin data access is database-scoped, not merely hidden in UI: **LIVE + VERIFIED**

## Automated quality gate

Current CI covers:

1. TypeScript compilation
2. modern typed Noata AI/domain regression tests
3. Deno check for the Supabase Edge Function
4. Next.js production build
5. historical MVP regression tests

The branch is not considered ready for handoff if any of these are red.

## Content status

The seeded Science course is **demo/reference content only**.

It includes:
- 2 units
- 2 lessons
- 2 skills
- reviewed published demo questions
- hidden answer keys
- parallel retry variants
- Unit Boss questions
- an unpublished draft demonstrating Content Studio workflow
- starter cosmetics

Real school curriculum must be imported/reviewed separately before Noata is presented as curriculum-complete.

## Human QA still required at the final handoff

The user asked to test at the end, so these are intentionally left for the final public deployment pass rather than claiming false automated certainty:

- real-browser signup and email confirmation
- account recovery email round trip
- real Fanar responses using the production secret
- image/vision/STT/TTS on an actual browser/device
- final desktop/mobile visual pass
- physical touch keyboard/screen-reader testing
- DNS/SSL on `noata.enterpriseworkhub.online`
- end-to-end teacher/admin workflows with real accounts
- domain-level performance measurements

Everything above this section is either live-verified or build-verified; nothing in this document should be read as a claim that unperformed human QA has already happened.
