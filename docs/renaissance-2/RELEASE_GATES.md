# Renaissance 2.0 — Release Gates

PR #3 MUST remain Draft and unmerged. No production deployments, production database writes, credentials rotation, official-domain modification, destructive SQL, paid upgrades or use of unrelated Supabase environments.

Before release: exact commit build and typecheck; unit and integration tests; staging RLS/authorization; real provider tests; representative AR/EN and six-palette E2E; artifact readback; backup/restore and migration compatibility; owner authorization for production.

Production remains blocked pending separately documented release gates.

## Status updates

- **2026-10-19 — production database reconciliation completed (owner-authorized).** With a verified logical backup and a read-only preflight (project identity, migration ledger, data-loss analysis, table-shape check), the two pending migrations were applied to production in order (`respiratory_system_learning_pathway`, then `submission_grading_integrity`) and verified (curriculum counts, constraint, tightened update policy, RLS on all 38 public tables, advisor parity). Full record: `PRODUCTION_RECONCILIATION_20261019.md`. This does not relax any other gate: the working PR (#37) remains Draft; production deployment, credential rotation, official-domain changes and paid upgrades remain blocked pending the remaining gates.
