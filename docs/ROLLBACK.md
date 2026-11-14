# Noäta 2.0 · Rollback & Forward-Fix Recovery Playbook

## 1. Verified Production Baseline & Isolation Policy

- **Pre-redesign Production Baseline**: `master` commit `5c7f6a42cdb3f05b4564d906a75f7178c8b966a5`; Vercel deployment `dpl_62FCt1LyMDCSYCN2i56h9Fp3c96c` (`noata-np61x9gc2-noata.vercel.app`). Verify the active production alias (`scripts/verify-production.mjs`) before executing any change — never assume production has not advanced.
- **Staging/Preview Isolation**: All redesign validation runs on isolated feature branches and Vercel Preview deployments backed by non-production Supabase refs (`qa-target` returns `404` when `NOATA_STAGING_QA_ENABLED !== "true"` or when pointing at the production ref `jdkfqdzgphzqbbzmerzr`). No production alias promotion, DNS cutover, or live DB mutation occurs without explicit sign-off.

---

## 2. Frontend Application Rollback (Vercel Instant Promote)

1. Confirm regression via `/health` (`GET /health` HTTP status), Vercel runtime logs, or `/admin` Operations telemetry.
2. In Vercel Dashboard (or authenticated CI promote step), **promote the previous known-good immutable deployment** to production immediately (`vercel rollback` / Deployment Promote).
3. Verify the rolled-back build is live:
   - `node scripts/verify-production.mjs "<target-commit-sha>"`
   - Confirm `GET /health` returns HTTP `200` (`"ok":true`), `GET /api/qa-target` returns `404`, and security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`) remain present.

---

## 3. AI Edge Function Fallback (`noata-ai`)

- If an AI candidate Edge Function deployment degrades or elevates `5xx`/`429` error rates:
  1. Keep legacy/stable `noata-ai` deployed (candidate deployments must not overwrite the fallback function alias).
  2. Set `NEXT_PUBLIC_NOATA_AI_FUNCTION=noata-ai` in Vercel environment variables and redeploy/re-promote the web build cleanly.
  3. Inspect `ai_request_receipts` and `admin_ai_usage_summary` before pruning or modifying any quota rows.

---

## 4. Database Backward Compatibility (`M1–M3`) & Forward-Fix Recovery

> [!IMPORTANT]
> **Vercel rollback NEVER reverts PostgreSQL migrations.** All Noäta 2.0 schema additions are strictly **additive** and remain backward-compatible with the `N-1` web build.

| Batch | Migration File | Rollback Compatibility (`N-1` Web Build) |
| :--- | :--- | :--- |
| **`M1`** | `20261114000000_user_settings_dashboard_preferences.sql` | Additive `user_settings.dashboard_preferences jsonb NOT NULL DEFAULT '{}'::jsonb`; ignored safely by older clients. |
| **`M2`** | `20261114000100_study_ecosystem_v2.sql` | Additive `metadata jsonb`, owner-scoped `study_mistake_logs` / `study_sessions`, column grants, and preserved `review_flashcard` return signature. |
| **`M3`** | `20261114000200_school_operations_v2.sql` | Additive school governance tables (`academic_terms`, `feature_flags`, `class_attendance`, `class_announcements`, rubric columns) + scoped RLS/indexes. |
| **Pre-existing AI & Learning** | `ai_request_receipts`, `admin_ai_usage_summary`, `ledger`, `skill_evidence`, `lesson_progress` | Strictly preserved and never overwritten or dropped during rollback. |

### Schema Recovery Procedure (Forward-Fix Only)
1. **NEVER run destructive `DROP TABLE` / `DROP COLUMN`** statements or delete user data during an incident rollback.
2. Author a compensating **forward-only additive migration** (`ALTER TABLE` / trigger adjustment / `CREATE OR REPLACE VIEW` or additive `*_v2` RPC / backfill script).
3. Test the complete migration sequence from baseline through the compensating migration in clean Postgres using:
   - `node scripts/database-migrations-smoke.mjs`
   - `node scripts/database-recovery-rehearsal.mjs`
   - `scripts/sql/security-regressions.sql`
4. Apply the verified compensating migration to staging first, re-run `pnpm modern:test` and `pnpm legacy:check`, and schedule production PITR checkpoint before promoting.
5. Note on legacy external archive references: Keep original historical Open WebUI/Railway archives untouched and hashed externally if referenced — never restore them blindly over Supabase.
