# Noäta 2.0 · Operations, Security & Recovery Runbook

## 1. Production Architecture Overview

- **Web Frontend & API Layer (`apps/web`)**: Next.js 16.4.1 (Turbopack) hosted on Vercel (`reactStrictMode: true`, `poweredByHeader: false`, security headers enforcing `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, and `Strict-Transport-Security`).
- **Database & Auth (`supabase/`)**: Supabase PostgreSQL governed by additive migrations (`55` files under `supabase/migrations/`, including Noäta 2.0 additive batches `M1` `20261114000000_user_settings_dashboard_preferences.sql`, `M2` `20261114000100_study_ecosystem_v2.sql`, and `M3` `20261114000200_school_operations_v2.sql`), Row-Level Security (`(select auth.uid())` owner checks, `can_manage_class()`, `is_admin()`), and server-authoritative RPCs (`review_flashcard`, `grade_assignment_submission`, `set_user_role`, `admin_ai_usage_summary`).
- **AI Edge Runtime (`supabase/functions/noata-ai`)**: Deno v2 Edge Function handling structured AI tutors, curriculum grounding, quiz/flashcard synthesis, quota receipts (`ai_request_receipts`), and model fallback routing.

---

## 2. Health Probes, Observability & Alert Thresholds

### Primary Health Check (`GET /health`)
- Endpoint: `apps/web/app/health/route.ts` (`force-dynamic`, `Cache-Control: no-store`).
- Expected response: HTTP `200`, JSON `{ "ok": true, "service": "noata-web", "version": "1", "revision": "<git-sha>", "timestamp": "<iso>" }`.
- Smoke check:
  - Verify `GET /health` returns `200` and `"ok":true`.
  - Verify `GET /api/qa-target` returns `404` in production (`NOATA_STAGING_QA_ENABLED !== "true"`).
  - Verify `POST /api/documents/pdf` rejects cross-origin `Origin` (`403`) and unauthenticated callers (`401`).

### Structured Telemetry & Admin Console (`/admin`)
- All structured telemetry and request logs MUST emit correlation `request_id`, route/action name, HTTP/RPC status, and latency — strictly **zero raw student answers, credentials, OAuth/JWT tokens, or unnecessary PII**.
- Workspace resilience guards: `<ErrorBoundary>` wraps `AppShell` (`apps/web/components/app-shell.tsx`) and `/ai` (`apps/web/app/ai/page.tsx`) with `role="alert"` bilingual recovery paths; `boundedRead` enforces `10000ms` timeouts alongside the `12000ms` `VerifiedAccountProvider` watchdog so network drops never strand views in infinite spinners.
- Monitor `/admin` Operations dashboard for:
  - `admin_ai_usage_summary` quota consumption and sudden per-user/school spikes.
  - Recent `audit_events` for admin governance actions (`set_user_role`, term activation, feature flag switches).
  - `support_tickets` triage queues and delivery status.

### Support Ticket Delivery
- Public support identity is `support@enterpriseworkhub.online`; the domain has live MX records and a published Resend DKIM key. Never route support to `noata.app` — that domain is unregistered and cannot receive mail.
- Tickets are persisted before delivery is attempted. Without `RESEND_API_KEY`, rows remain `queued_no_provider` and the API reports the missing variable truthfully; guest submissions are still captured.
- To activate email delivery: add `RESEND_API_KEY` as a sensitive Vercel production variable, keep `SUPPORT_SENDER_EMAIL="Noäta Support <notifications@enterpriseworkhub.online>"` on the verified domain, redeploy, submit one disposable ticket, confirm status `sent`, then delete the row.
- Triage requires an account with `profiles.role = 'admin'`; the admin console is `/admin`.

### Incident Alert Thresholds & Response
| Signal | Escalation Threshold | Immediate Triage Action |
| :--- | :--- | :--- |
| `/health` probe or `/` 5xx | Any consecutive 5xx (> 1 min) | Inspect Vercel deployment logs, run HTTP probe on `/health` and security headers; roll back Vercel alias if build-related (`docs/ROLLBACK.md`). |
| `/api/*` or `noata-ai` 5xx rate | `> 2%` over 5 min window | Check Supabase Edge Function logs and upstream AI provider status; switch candidate function via `NEXT_PUBLIC_NOATA_AI_FUNCTION=noata-ai` if Edge regression suspected. |
| AI quota spike / `429` burst | Sustained `429` surge or budget anomaly | Inspect `/admin` Operations AI summary (`admin_ai_usage_summary`) and `ai_request_receipts` idempotency logs. |
| Auth / Session stall | Elevated timeout reports (`Session read timed out`) | Confirm Supabase Auth latency, verify `M1–M3` grants remain intact, and verify client browser `wipeAllStudyDrafts` executes on `SIGNED_OUT`. |
| Postgres slow query / FK stall | p95 > 500ms on dashboard/study reads | Run `supabase db advisors` / `EXPLAIN ANALYZE`; verify `20261105130000_performance_fk_covering_indexes.sql` and `M1–M3` covering indexes are present. |

---

## 3. Security, Privacy & Cache Hygiene

- **PWA & Service Worker (`apps/web/public/sw.js`, verified by `scripts/pwa-cache.test.mjs`)**:
  - Authentication endpoints, `/api/*`, `/auth/*`, `no-store`/reload requests, mutations (`POST`/`PATCH`/`DELETE`), and foreign Supabase origins MUST stay outside the static PWA cache.
  - Verify worker activation evicts obsolete static caches and `useVerifiedAccount` triggers `wipeAllStudyDrafts` on `SIGNED_OUT` (`noata:study-draft:*`, non-guest `noata:dashboard-prefs:*`, `noata-ai-draft*`).
- **Least-Privilege Grants & Private Study Isolation**:
  - `flashcards` and `flashcard_decks` expose column-scoped client edits only (`state`, `ease_factor`, `interval_days`, `repetitions`, `lapses`, `last_reviewed_at`, `due_at` remain un-writable by `authenticated`; `review_flashcard` RPC is sole SM-2 authority).
  - Personal `study_sessions`, `study_mistake_logs`, `flashcards`, and `ai_*` records remain strictly owner-RLS (`(select auth.uid()) = user_id`) with zero teacher/admin bypass.

---

## 4. Legacy Local Store & Baseline Operational Notes (Preserved)

- **Atomic Local Store (legacy dev/demo scripts)**: `lib/store.mjs` writes `data/app.json` via temporary file and atomic rename with single-instance serialized queue chaining (prior rejected transactions no longer poison subsequent queue operations).
- **Backup & Restore**: Stop writes before copying state; for Supabase production, rely exclusively on encrypted PostgreSQL PITR / verified pg_dump backups, running `scripts/database-migrations-smoke.mjs` and `scripts/database-recovery-rehearsal.mjs` on staging prior to promotion.
- **Rate Limiting Note**: In-memory per-IP rate limits (`/api/auth/login` 20 req/5m; `/api/*` 600 req/m; `/api/documents/pdf` 3 req/min per user) supplement but do not replace upstream Vercel WAF/edge rate limiting.
