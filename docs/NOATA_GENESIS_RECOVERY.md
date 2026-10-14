# Genesis recovery boundary and runbook

## Current evidence

The attached release brief reports preserved production recovery material in `qa-recovery-private`, 68 table fingerprints, and four private objects without byte-level backups. Those materials and object manifests are not present in this clean Git checkout. No production dump, private Storage bytes, Auth records or encryption keys were retrieved or committed during this work.

Production metadata and the deployed AI v6 bundle hash were rechecked. A production read-only SQL inventory did not execute because automatic approval review hit a usage limit. Its reported migration/table counts are attributed checkpoint evidence only. No database migration is included in this candidate.

`scripts/database-recovery-rehearsal.mjs` and the existing isolated SQL harness remain the synthetic fixture procedure. Local PostgreSQL/Docker are unavailable in this runtime; full CI is responsible for rerunning those source fixtures. They cannot certify hosted Auth, Storage object bytes, ICU/collation behavior or production disaster recovery.

## Required authorized recovery completion

1. Retrieve the approved private recovery manifest through its authorized store. Confirm the exact production project and encrypted-backup access before downloading anything. Never store recovery secrets or real records in the repository/CI artifacts.
2. Locate the four missing objects by immutable bucket/path/object identity. Read bytes through an owner-approved authenticated Storage path, with bounded requests; compare length and SHA-256 with metadata.
3. Encrypt each byte backup using the existing recovery encryption/key-management method. Record object identity, byte count, hash, encryption envelope/key version and authorized restoration location in the private manifest. Keep keys separate. Do not invent a new key or call encryption complete without a successful decrypt/checksum rehearsal.
4. Restore the database to a disposable isolated PostgreSQL target with external jobs/webhooks disabled. Compare actual versions/extensions/collations, row counts/fingerprints, sequence positions, ownership, RLS, grants and XP/Coin/Gem ledger/profile totals. Inspect real ICU/version differences before rebuilding indexes or changing collation settings.
5. Verify hosted Auth recovery separately, including session/signing-key and OAuth/mail configuration boundaries. Logical table restoration alone is not hosted Auth equivalence.
6. Restore object bytes and private ownership metadata to an isolated Storage environment. Test allowed and cross-owner denied reads. Document hosted-service limitations, measured recovery duration and the actual data-loss window.

## Candidate rollback

No production rollback is needed for this branch: production was not promoted. Revert the candidate source changes to the verified baseline and retain the current production deployment/domain assignments. Preview configuration and any staging function version are separate from production. A staging Edge Function change must preserve its previous source before deployment and use that pinned source for rollback, with JWT verification retained.

Never reuse an exposed credential as rollback material. The older credential-rotation document is historical; this task does not authorize a production password reset.
