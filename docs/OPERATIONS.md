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

## Deploying a client update

Static assets (`app.js`, `styles.css`) are served with `Cache-Control: no-cache` and referenced from `index.html` with a `?v=N` query string. Bump `N` in `public/index.html` on every deploy that changes either file — otherwise some browsers/CDNs may keep serving the previous version to already-open tabs for longer than intended. This is a manual interim step; a real build pipeline (content hashing) would remove the need for it.

## A fixed data-integrity bug worth knowing about

`lib/store.mjs`'s `JsonStore.transact` previously let a single failed transaction (e.g. a business-rule rejection such as insufficient balance) permanently poison its internal write queue: every subsequent transaction — from any user — would silently inherit that same stale failure until the process restarted. This has been fixed (the queue's internal chaining promise no longer rejects; each caller gets its own promise for its own outcome). If you ever see a wave of unrelated-looking `BUSINESS_RULE` errors following one real failure, that class of bug is what to suspect first — check `store.mjs` was not reverted.

## Rate limiting

The server applies basic in-memory, per-IP fixed-window limits: `/api/auth/login` at 20 requests/5 minutes, and all `/api/*` traffic at 600 requests/minute. This blunts casual brute-force and runaway clients but is not a substitute for a production rate-limiting/WAF layer, and the in-memory state does not survive a restart or scale across multiple instances.
