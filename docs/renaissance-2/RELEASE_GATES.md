# Renaissance 2.0 — Release Gates

PR #3 MUST remain Draft and unmerged. No production deployments, production database writes, credentials rotation, official-domain modification, destructive SQL, paid upgrades or use of unrelated Supabase environments.

Before release: exact commit build and typecheck; unit and integration tests; staging RLS/authorization; real provider tests; representative AR/EN and six-palette E2E; artifact readback; backup/restore and migration compatibility; owner authorization for production.

Production remains blocked pending separately documented release gates.
