# Noata Aura — repository-wide acceptance ledger

## Evidence boundary

This ledger supplements both mandatory specifications. It does **not** certify the whole platform or replace historical evidence. Start of this work session: `v0/approved-staging-guard` at `209c51900a48ce661248f68d942b5b73eacc7061`; authoritative branch work was preserved by a clean fast-forward to `ec1534be81855916a19e9c6ba8fcdf785bdef45a`. PR #3 was OPEN/DRAFT, with that authoritative head, against `master`.

`pnpm scope:check` discovers every tracked/nonignored candidate file, hashes its contents, resolves static local imports, enumerates all Next pages/handlers, and records JSX controls, backend operations and SQL declarations in `artifacts/noata-scope/outcome.json`. It fails for omitted, stale or duplicated manifest entries. Unknown and legacy files remain in scope. Each newly discovered action is **NOT_STARTED for acceptance review**, not a claim that its existing implementation is absent. Dynamic controls/imports, delegated legacy events and runtime authorization require manual trace completion; a static import graph is not a complete runtime interaction audit.

Each action record has source/line, control, handler-event kinds, target link, required failure/interaction states, route linkage and dependency operations. All files are **DISCOVERED_NOT_VERIFIED** until an evidence-bearing audit changes that assessment. Source SQL declarations are never labeled as live schema evidence. The artifact includes source revision and dirty state; dirty artifacts cannot be final exact-commit evidence.

## Complete route worklist

Backend names below are **source contracts**, not a fresh live schema snapshot. No new table/RPC dependency was introduced in this slice. The full acceptance of each private workflow remains blocked on approved staging access and disposable role accounts. Prior source/unit/synthetic evidence is preserved in the release-gate document, rather than upgraded to real authentication evidence.

| Route | User actions and dependent sources | Backend/provider contract | Current acceptance |
|---|---|---|---|
| `/` | Guest entry; dashboard, evidence-based recommendation and wallet links | Dashboard component; existing profiles, lessons/progress, evidence, notifications projections unchanged | Visibility/revision unit contracts VERIFIED; real mobile blocked-backend/retry rendering VERIFIED; synthetic account-switch browser checks IMPLEMENTED BUT LOCALLY BLOCKED; genuine account/RLS acceptance BLOCKED |
| `/login` | Password/Google entry, errors, deep-link return | Auth client/origin/PKCE contracts, configured Supabase providers | BLOCKED for genuine Google/email/account QA |
| `/signup` | Register, confirmation and resend navigation | Supabase Auth, profile trigger, configured sender | BLOCKED for actual email delivery/confirmation |
| `/auth/check-email` | Signup/recovery instructions and resend | Auth flow and sender | BLOCKED for real delivery/link redemption |
| `/auth/callback` | OAuth/email code exchange, cancel/error/next | PKCE and canonical origin guard | BLOCKED for actual Google/confirmation sessions |
| `/auth/complete` | Verified flow result and safe return | Auth journey and session proof | IMPLEMENTED BUT UNVERIFIED with genuine sessions |
| `/auth/error` | Expired/invalid links and recovery | Auth journey | IMPLEMENTED BUT UNVERIFIED across required combinations |
| `/auth/forgot-password` | Recovery request, retry, disclosure | Auth reset and configured email delivery | BLOCKED for actual mailbox QA |
| `/auth/update-password` | Recovery proof, change password, session reset | Auth session/update contract | BLOCKED for actual fresh token/session QA |
| `/learn` | Curriculum filtering and published/prerequisite links | courses, units, lessons, lesson_progress; RLS | BLOCKED for live learner/published-data QA |
| `/lesson/[id]` | Read lesson, progress, enter assessment | lesson source and lesson_progress; completion through mission RPC | BLOCKED for live progress/receipts; full teaching tool expansion NOT STARTED |
| `/missions` | Answer/retry/variant/finish; result and receipts | questions, submit_attempt, complete_lesson | BLOCKED live; resumable dedicated mission and difficulty ramp NOT STARTED |
| `/review` | Due skill, answer, explanation and next question | skill_evidence, questions, submit_attempt | BLOCKED live; full adaptive/confidence/calendar expansion NOT STARTED |
| `/boss` | Unit challenge, retry, confirmed box claim | submit_attempt, complete_unit_boss, claim_reward_box | BLOCKED live/concurrency/receipt QA |
| `/progress` | Mastery, evidence and next action | skill_evidence and authorized learning data | BLOCKED live; advanced history/goals expansion NOT STARTED |
| `/rewards` | Wallet, shop purchase/equip, box claim | profiles, shop_items, inventory, cosmetics, reward_boxes and transactional RPCs | BLOCKED live; GEM model NOT STARTED, not advertised as active |
| `/ai` | Conversations, workshop, attachments, streaming, voice and exports | Owner-scoped AI/storage/Edge Function; document/PDF services | BLOCKED real Fanar/voice/vision and authenticated export; OCR/XLSX/PPTX NOT STARTED |
| `/quran` | Canonical text/search, reading controls/bookmark and recitation | Quran API/source and audio; device bookmark preference | Prior endpoint evidence only; actual playback/source review and sync UNVERIFIED |
| `/assignments` | Read, draft, submit once, feedback | assignments/items/submissions and RLS | BLOCKED real student/teacher/foreign-account workflows |
| `/teacher` | Scoped class/roster, assignment draft/publication and grade | classes, assignments/items/submissions, profiles; role/RLS | BLOCKED Teacher A/B and student isolation QA |
| `/admin` | Curriculum review/publication, roles and operations | Curriculum/admin components; staff RPCs and audit/usage sources | BLOCKED live role/RLS/admin negative tests |
| `/notifications` | Filters, unread/read, target navigation and retry | notifications and owner-scoped confirmed write | BLOCKED real event delivery and cross-account denial |
| `/settings` | Profile, locale/mode/motion, palette and security paths | profiles/user_settings; palette currently explicitly device-local | Palette fault/layout slice only; account and cross-device palettes BLOCKED |
| `/help` | Search topics, useful feature/recovery links | Existing honest local knowledge center | IMPLEMENTED BUT UNVERIFIED full bilingual/topic coverage |
| `/privacy` | Public bilingual document and topic navigation | Legal page component; operator disclosure/approval | Public rendering only; legal/operator approval BLOCKED |
| `/terms` | Public bilingual rules and topic navigation | Legal page component; operator approval | Public rendering only; legal/operator approval BLOCKED |

## Supporting systems — no silent omissions

| System | Acceptance obligations | Evidence/state |
|---|---|---|
| Shared shell/layout/error/loading/404, menus, dialogs and account panel | Focus/return, safe deep links, mobile/zoom, guest/account-switch/loading/error/offline | Inventoried individually; existing regressions retained; full acceptance UNVERIFIED |
| Seven palettes, both modes and OS mode | Semantic contrast, square swatches, persistence failures, Escape focus, nine requested widths | This slice adds targeted semantic and real-browser gates; cross-device sync remains BLOCKED |
| `/api/quran` | Correct canonical protocol, source/count/order, audio isolation/error | Prior protocol/endpoint evidence; complete sacred text/source/playback approval UNVERIFIED |
| `/api/documents`, `/api/documents/pdf` | Auth, origin, bounds, ownership, Arabic fidelity, concurrency and actual artifact | Existing unit/binary evidence retained; authenticated hosted flow BLOCKED |
| `/api/qa-target`, `/health` | Explicit preview-only opt-in; no credential submission to unknown target; healthy response | Existing guards preserved; final hosted source identity UNVERIFIED |
| All Supabase migrations/RLS/RPCs/storage/triggers/Edge Functions | Reconcile live migration history first, role matrix, replay, concurrent rewards/spending, cleanup, retention | Approved staging MCP read denied; no migration, deployment or bucket mutation performed |
| Legacy server/browser/Ollama/API/data storage | Classify maintained/reference/retired; test existing endpoints; never silently publish/remove | Every source/asset is inventoried; complete exposure/classification acceptance NOT STARTED |
| PWA/cache/offline/assets/fonts/logos | No private cache, truthful offline, versioned assets, licensed fonts and correct branding | Existing implementation preserved; complete lifecycle/device acceptance UNVERIFIED |
| Email/auth sender/Google/owner-controlled domain | Real delivery/link expiry/cancellation and provider configuration; keys never in source | Secure external configuration and role-account access BLOCKED |
| CI/preview/deployment identity | Frozen lockfile, exact revision and clean artifacts, draft PR; no production promotion | Scope and appearance artifacts now join the clean exact-revision gate; candidate hosted QA pending |
| Legal/child privacy/retention/backups/restore/manual accessibility/physical IME/load | Owner review and real operational/manual evidence | BLOCKED/NOT STARTED where no evidence exists; no compliance claim |

## Cross-system receipts and negative tests still required

Lesson → attempt/evidence → due review → confirmed learning completion → wallet/achievement/dashboard; mission → boss eligibility → box/inventory; teacher assignment → permitted student submission → grading/feedback → notification; authorized lesson/files → actual Fanar context and export; auth change → private cache/editor/wallet/staff eviction; locale/mode/motion → every route. All require source IDs, server timestamps, permission rule, persisted readback, ambiguous-failure retry and duplicate/concurrent/cross-account denial. They are **BLOCKED for live acceptance**, not validated by the static graph or public screenshots.

## Current external blocker and next slice

The connected Supabase binding targets `qvfywwpoktmbjsunqizr`, not the only approved `vpfpjvhafkmygetjkfcp`. Integration schema discovery errored; an explicit read-only approved-project metadata request returned permission denied. No unapproved database was read or changed. Do not reinitialize staging from outdated historical “empty” notes. Once the connection grants approved staging access and secure Student A/B, Teacher A/B/Admin QA configuration is available, re-read live schema/migration/role metadata, then execute the real account and learning-receipt slice before adding dependent schema features.

Rollback of these slices is source-only; there are no database/provider/production mutations. Complete platform transformation and owner acceptance remain outstanding.

## Dashboard reliability continuation — 2026-10-09

Candidate source started clean at `55426f89d2c6b8c98acbb975ea4c6998ffab6530` on `v0/approved-staging-guard`. PR #3 was freshly confirmed OPEN/DRAFT, still pointing at authoritative `ec1534be81855916a19e9c6ba8fcdf785bdef45a`; candidate work has not been merged or promoted into it. The working branch had no CI run because it was absent from the workflow push filter. This slice explicitly adds only that branch to the existing gate.

Implemented: bind dashboard reads to verified owner and auth revision; reject late responses on account transitions; suppress default wallet/level/progress/notification claims for guests, missing profiles, loading and errors; preserve independently confirmed indicators when an optional source fails; gate personal lesson/review links on corresponding evidence; make retry clear stale evidence immediately; label lesson totals as aggregates across available lessons rather than a single course. No query projection, RPC, schema, policy, auth provider or configured origin changed. Existing dashboard fetching architecture and comprehensive curriculum/prerequisite/range/timeout/bilingual acceptance remain outstanding, not silently certified.

**VERIFIED on the candidate worktree (dirty/pre-commit, not final exact-commit release evidence):** 8 new visibility/recommendation tests; 144 modern tests; 23 explicit scope/PWA/email/browser-launch fault tests; 239 regression tests (overlapping suites, not additive counts); frozen offline lockfile install; type checks; static scope coverage (291 files, 26 pages, 5 handlers, no omitted/stale/duplicate entries); isolated-fixture production build. Actual `agent-browser` dev-preview inspection at 390 × 844 confirmed four unknown metrics, no progressbar, zero horizontal overflow and a working retry returning the honest backend failure. Screenshot: `/tmp/agent-browser/dashboard-blocked-390.png`; device/account palette persisted a dark appearance, so this screenshot is not seven-palette or light-mode certification.

**IMPLEMENTED BUT LOCALLY BLOCKED:** the existing network-isolated browser fixture now covers independent notification/progress failure, absent profile, active-account wallet, pending reads, account switch, sign-out/late response and recovery. `NOATA_DASHBOARD_QA_ONLY=1` produces separately labelled `artifacts/noata-dashboard/` evidence; it cannot overwrite or substitute for the full release-suite artifact. Its first run stopped at missing full Chrome. One targeted pinned-browser installation attempt failed because the replayed Chrome cache directory exists without its executable. No successful browser-fixture assertion is claimed. CI still runs the complete default suite with its pinned Chrome installation, and must pass at the final saved revision.

**BLOCKED live:** refreshed integration inventory reports Supabase connected but schema discovery errors; public and server URL hostnames still target unapproved `qvfywwpoktmbjsunqizr`, while `AURA_STAGING_DB_REF` is absent in the sandbox's env-file copy. The approved-project connection, schema and genuine Student A/B, Teacher A/B/Admin access must be resolved securely before live backend acceptance. No unapproved database was accessed. Exact-final-commit CI and hosted candidate identity remain pending until Git synchronization and remote verification; the old authoritative preview is not candidate evidence.
