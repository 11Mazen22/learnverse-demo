# Operations, recovery, and security notes

## Local data

The server writes `data/app.json` using a temporary file and atomic rename. All mutations are serialized. Keep the process single-instance.

For a local backup, stop writes and copy `data/app.json` to a dated, access-controlled location. A restore means stopping the server, preserving the current file, replacing it with a validated backup of the same schema version, and running `npm run check` before reopening access. This procedure is documented but **has not been recovery-drill verified**.

## Production/pilot gate

Do not deploy this demonstration build with real student data. Before an authorized pilot:

- Use PostgreSQL migrations, foreign keys, unique idempotency constraints, and database transactions.
- Use a production identity service or salted password hashes, expiring secure HTTP-only sessions, CSRF protection, rate limits, and credential recovery.
- Define school tenancy and enforce row-level ownership in every query.
- Encrypt transport and backups; set retention/deletion rules and test restoration.
- Add structured security/audit logs without answers, credentials, tokens, or unnecessary student data.
- Review CSP, dependency posture, privacy requirements, incident response, and authorized exports.
- Verify service-worker cache clearing on account changes and keep staff/API responses out of caches.

## Rollback

Application rollback should deploy the previous immutable application artifact without rolling data backward. Schema changes need tested forward and compensating migrations. Economy corrections must be compensating ledger entries; never edit historical entries.
