# Genesis recovery boundary and runbook

## Current evidence

Previously authorized encrypted recovery artifacts and restore records exist outside Git in the protected `qa-recovery-private` area. They were reviewed in place; no new Production data or key was fetched during this acceptance turn, and none of these files is committed or attached to CI.

The v3 snapshot manifest records 71 tables, 885,367 plaintext bytes, and SHA-256 `b86f2ac79aa1c94548465adc2b160c681d56e497ec8c3706d1e4813d9c481b77`; the restore report records the same snapshot hash. The native encrypted archive is 134,042 bytes. Its actual SHA-256 `be8a7ebe95ad96aab62f497562801f53ece015cf794a2b9e3d92f33190256767` matches the private native-archive manifest. The rehearsal report records a fresh native-archive restore pass, all original table data and catalog checks, 71 tables/530 rows restored, 71 table-data byte matches, zero data mismatches, 75 expected policies, 264 constraints, and 75 expected functions.

The rehearsal record covers 14 migrations. It reports Production ICU `153.121` versus local `153.14`; its status is explicitly partial, so full collation/index equivalence is unresolved. Binary Storage backup remains `pending`; the four previously identified private objects still have no verified byte-level backup/checksum. A local database restore does not restore hosted Auth or Storage HTTP services, signing/session behavior, or OAuth/mail configuration. Candidate source adds no database migration. The prior 33-migration/38-public-table/RLS inventory is historical evidence; the direct live SQL acceptance attempt for this release was blocked by the automatic approval usage limit and was not retried.

`scripts/database-recovery-rehearsal.mjs` and the existing isolated SQL harness remain useful synthetic regression fixtures. They cannot certify hosted Auth, missing Storage bytes, ICU/collation equivalence or Production disaster recovery.

## Required authorized recovery completion

1. Reconfirm the private snapshot's Production project identity, encryption envelope/key version, and manifest-to-archive checksums through the authorized private store. Do not copy the existing sensitive artifacts into Git or CI.
2. Locate the four missing objects by immutable bucket/path/object identity. Read bytes through an owner-approved authenticated Storage path, with bounded requests; compare length and SHA-256 with metadata.
3. Encrypt each byte backup using the existing recovery encryption/key-management method. Record object identity, byte count, hash, encryption envelope/key version and authorized restoration location in the private manifest. Keep keys separate. Do not invent a new key or call encryption complete without a successful decrypt/checksum rehearsal.
4. Resolve the measured ICU/collation difference before claiming full equivalence. Restore the database to a disposable isolated PostgreSQL target with external jobs/webhooks disabled. Compare actual versions/extensions/collations, row counts/fingerprints, sequence positions, ownership, RLS, grants and XP/Coin/Gem ledger/profile totals. Inspect real ICU/version differences before rebuilding indexes or changing collation settings.
5. Verify hosted Auth recovery separately, including session/signing-key and OAuth/mail configuration boundaries. Logical table restoration alone is not hosted Auth equivalence.
6. Restore object bytes and private ownership metadata to an isolated Storage environment. Test allowed and cross-owner denied reads. Document hosted-service limitations, measured recovery duration and the actual data-loss window.

## Candidate rollback

No production rollback is needed for this branch: production was not promoted. Revert the candidate source changes to the verified baseline and retain the current production deployment/domain assignments. Preview configuration and any staging function version are separate from production. A staging Edge Function change must preserve its previous source before deployment and use that pinned source for rollback, with JWT verification retained.

Never reuse an exposed credential as rollback material. The older credential-rotation document is historical; this task does not authorize a production password reset.

Staging runtime rollback checkpoint: preserved v37 source (20 files), bundle `a4a9edb99ce7bbcab1fa0b881dd75164320d088536e4229f07c19351a5d00f1b`, matches the baseline runtime. Genesis v38 is ACTIVE, JWT protected, bundle `72b499fe70de74b026c59651b7a957e6cc41c1fa90080ecaab29939659e32995`; all 23 retrieved files match reviewed source. Staging unauthenticated readiness returns 401. The source-only rollback bundle is kept outside committed artifacts.
