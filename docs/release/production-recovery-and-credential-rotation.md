# Noata release recovery and credential replacement plan

Status: review plan only. PR #3 remains Draft and unmerged. No Production database, environment variable, deployment, password, or API-key change is authorized in this phase.

## Approved targets and connection structure

| Item | Verified structure / scope |
| --- | --- |
| Production project | `jdkfqdzgphzqbbzmerzr` |
| Staging project | `vpfpjvhafkmygetjkfcp` |
| Production session pooler | `aws-0-eu-west-2.pooler.supabase.com`, TCP `5432` |
| Pooler login | `postgres.jdkfqdzgphzqbbzmerzr` |
| Database | `postgres` |
| TLS | `verify-full` with the owner-supplied Supabase server root certificate |

The pooler is reachable and TLS certificate verification succeeded. The supplied password was rejected; no production SQL executed. The password subsequently declared compromised must never be tried again, stored in this repository, logged, or reused. The temporary local credential file was removed. Project health and URL structure do not establish successful database authentication.

The owner subsequently reported a password reset. The replacement was also posted in chat and is therefore treated as exposed: it was not used, stored, or tested. This report does not independently verify the reset or authorize another agent-performed reset. Further access requires an independently replaced credential supplied through a secure secret store, with only its location communicated in chat.

## Dependency inventory

Fresh Vercel audit found 21 settings. Shared Production/Preview/Development Supabase URLs, legacy anon keys, service-role JWT and direct Postgres connection refer to unrelated project `qvfywwpoktmbjsunqizr`. Do not authenticate to it, reset its credentials, repoint it, or update its values as part of the approved Production password replacement. The Aura branch overrides its public URL/publishable key to approved Staging. No authorized staging Auth Admin secret is presently configured.

| Potential consumer | Secure settings to inspect | Known result / required owner action |
| --- | --- | --- |
| Vercel direct database integration | `POSTGRES_PASSWORD`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`; endpoint metadata `POSTGRES_HOST`, `POSTGRES_USER`, `POSTGRES_DATABASE` | Shared integration refers to unrelated project. Owner must identify any actual authorized Production consumer before making a coordinated replacement. |
| Noata web/API and Edge Functions using Supabase HTTP | `NEXT_PUBLIC_SUPABASE_URL`, public publishable/anon keys; server `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` | Project alignment is a separate release blocker. Database-password replacement does not establish HTTP API-key alignment; do not rotate API signing/API keys implicitly. |
| CI, migration runners, backup jobs, pgAdmin/psql | `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`, private `PGPASSWORD` or restricted `PGPASSFILE`; protected environment secrets | No matching authorized credential was found in the task environment or repository dotenv files. Inventory external runners/secret stores with their owners; never print values. |
| Disposable Staging account provisioner | `NOATA_STAGING_SERVICE_ROLE_KEY`, `NOATA_STAGING_PUBLISHABLE_KEY`, QA role emails/passwords; `AURA_STAGING_DB_REF`; `NOATA_STAGING_ADMIN_KEY_REF` for opaque keys | Entirely separate Staging credentials. Never use the compromised Production password or unrelated service-role key here. |
| Supabase-managed services | Supabase platform-managed connection settings | Do not edit managed internal passwords. Supabase documents dashboard password propagation to managed services; verify health after any approved reset. External consumers require coordinated manual updates. |

This is the known inventory, not a claim that all external dependents are discovered. GitHub secret names/values, external schedulers, off-site backups and other hosts remain unverified.

## Proposed rotation, awaiting explicit approval

1. Inventory current authorized Production consumers, owners, secret stores, connection pools and retry/restart behavior. Confirm recovery access and a maintenance/recovery window. Record only names, project attribution and secret version identifiers.
2. Obtain explicit owner approval specifically for resetting the Production `postgres` password and updating the identified dependent Production secret versions. Current release authorization is not that approval. No change to the unrelated project or Staging is included.
3. The owner performs the authorized password reset in the exact Production dashboard and stores a newly generated independent value directly in an approved secret store. Never enter it in chat, command arguments, repository files or CI artifacts. Keep URI percent encoding correct when a consumer uses a connection string.
4. Update only inventoried consumers of that Production database credential through their secure secret settings. Coordinate workers/pools/restarts so rejected old sessions cannot produce unbounded retries. Do not deploy the Aura candidate during rotation.
5. Establish a fresh certificate-verified read-only connection with the new secret and exact approved project. Confirm `transaction_read_only=on`, bounded timeouts, actual database version and TLS. Inspect provider backup availability read-only.
6. Verify managed-service health and actual dependent-service connectivity. Inspect authentication failures and access anomalies using authorized logs. Document the replacement secret version and affected consumer versions without storing its value.
7. If recovery is needed, use a new independent replacement credential and repair consumer configuration. Never roll back to the exposed password. A compromised credential is not a rollback asset.

## Backup and production-copy rehearsal, pending authenticated access

1. Inspect existing provider backup dates, status, retention, restore options and required extension/version prerequisites using read-only Management API/dashboard access. No paid upgrade or in-place restore.
2. Where an authorized logical export is needed, use a certificate-verified read-only session, a consistent snapshot, bounded locks/timeouts and private encrypted local/off-site storage. Record export timestamp, scope, SHA-256 and recovery point. Include schemas, data, policies, function definitions, grants and required roles/migration history; explicitly record provider-managed exclusions. Never upload real Auth records, user rows, secrets or production dumps to GitHub Actions artifacts. Storage object bytes require a separate authorized backup; database metadata alone does not restore them.
3. Restore to a disposable isolated PostgreSQL target with compatible version/extensions and network isolation. Disable external jobs, subscriptions and webhooks so restored data cannot contact users or services. Do not overwrite Production or live Staging.
4. Compare original row counts and stable fingerprints, Auth/application identities, sequence positions, ledger and profile totals, constraints, ownership, RLS, function grants and default privileges. Log aggregate evidence only.
5. Reconcile the five deltas against actual restored definitions and migration history. Apply them transactionally on the isolated copy; verify data preservation, role boundaries, balance preservation, grading/reward idempotency, custom-design ownership and all seven palette values. Run genuine app tests against an authorized isolated environment; simulated claims do not verify hosted Auth/OAuth.
6. Rehearse failure rollback before commit and full restoration of the isolated copy after migration. Measure recovery duration and data loss window. Confirm restoration of external Storage content and necessary managed integrations where applicable. Document both before any release decision.

## Source-fixture rehearsal included in CI

`scripts/database-recovery-rehearsal.mjs` is called only by the isolated PostgreSQL migration runner. It builds the 18-migration source baseline with synthetic users and balances, dumps/restores it, exercises the five deltas, injected transaction failure, row preservation, RLS/grants, public grading idempotency, design ownership and palette values, then restores the original fixture. CI records the exact clean commit and outcome in `artifacts/noata-recovery-fixture/`.

This verifies recovery tooling and source migrations. It is not a production backup, a production-compatible snapshot, a real Auth test, or a passed production disaster-recovery gate.

## Remaining real-account gates

Use only matching, securely configured Staging Auth Admin credentials to provision disposable distinct Student/Teacher/Admin accounts in an owner-controlled mail domain. Verify actual login/logout/recovery and OAuth, class/role isolation, assignment/learning workflows, real Fanar/Design Studio, durable XP/Coins/Gems, Quran playback and authenticated PDF/DOCX exports. Preserve the approved Quran UI and Sudais source constraints. Keep PR #3 Draft and Production unchanged until these gates are documented.

Official references: [password behavior and roles](https://supabase.com/docs/guides/database/postgres/roles), [certificate-verified connection](https://supabase.com/docs/guides/database/psql), [backup scope and restore](https://supabase.com/docs/guides/platform/backups).
