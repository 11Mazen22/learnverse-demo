# Renaissance 2.0 — Release Gates

PR #3 MUST remain Draft and unmerged. Its original constraints — no unapproved production deployments, production database writes, credentials rotation, official-domain modification, destructive SQL, paid upgrades or use of unrelated Supabase environments — remain in force. Owner-authorized production releases are recorded in the dated updates below.

Before release: exact commit build and typecheck; unit and integration tests; staging RLS/authorization; real provider tests; representative AR/EN and six-palette E2E; artifact readback; backup/restore and migration compatibility; owner authorization for production.

Production release status is recorded in the dated updates below; unverified areas are named explicitly and are not implied complete.

## Status updates

- **2026-10-19 — production database reconciliation completed (owner-authorized).** With a verified logical backup and a read-only preflight (project identity, migration ledger, data-loss analysis, table-shape check), the two pending migrations were applied to production in order (`respiratory_system_learning_pathway`, then `submission_grading_integrity`) and verified (curriculum counts, constraint, tightened update policy, RLS on all 38 public tables, advisor parity). Full record: `PRODUCTION_RECONCILIATION_20261019.md`. This did not relax any other gate at that time: PR #37 remained Draft, and production deployment, credential rotation, official-domain changes and paid upgrades remained blocked pending the remaining gates.

- **2026-10-19 — production application release completed (owner-authorized).** After the reconciliation above, the owner authorized completing the release. PR #37 passed CI run `39312615294` on head `012e1d9cc9f1d85c0dfc521e958b1056b8dba6f6`, was marked ready and merged as `9ef85d337e4d54698d28af311f9a4043e7b9ce25`; that merge revision passed CI run `39315647563`. Vercel production deployment `dpl_EnkPN7eLp4Yn7WX858Fdrdqjt3xK` reached READY and was promoted; both `noata.enterpriseworkhub.online` and `noata.vercel.app` then reported the merge revision from `/health`. Live smoke passed: `/`, `/ai`, `/login`, `/signup`, `/quran`, `/privacy`, `/terms` and `/health` returned HTTP 200; `/api/qa-target` returned 404; HSTS, `nosniff`, `X-Frame-Options: DENY`, referrer and permissions policies were present; Arabic RTL markup was present. This release does not claim the outstanding live provider tests (Fanar/Brave/STT/TTS/OAuth/SMTP) or authenticated staging E2E; those remain the next gates in `NEXT_EXECUTION.md`.
