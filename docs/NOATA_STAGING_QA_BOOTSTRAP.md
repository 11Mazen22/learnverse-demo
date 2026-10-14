# Noata Aura — Staging QA account bootstrap and Auth security

**Scope:** `vpfpjvhafkmygetjkfcp` (Noata Staging) only. Draft PR #3; no Production operations.

## Actual checked status — 9 October 2026

- Staging has two existing student accounts and zero specially tagged QA identities. Existing user accounts are deliberately NEVER assigned staff privileges.
- Available Supabase MCP permissions include reading projects, SQL and migrations, but **not** GoTrue Auth Admin account creation or Auth project config updates.
- Supabase organization `Noata` is on the Free plan. Supabase's built-in *Leaked Password Protection* is Pro-and-above only. It **cannot** be enabled by SQL or a frontend workaround on this plan. Source: https://supabase.com/docs/guides/auth/password-security
- The signup and password-recovery interfaces now require at least 12 characters and reject some obvious guessable strings. **This is client-side defense in depth, NOT backend leak detection.** To also enforce a 12-character minimum in Auth itself, set it in Dashboard → Authentication → Passwords (if enabled on the current plan).

## Official Staging QA identities (dedicated accounts, not existing students)

Utility: `apps/web/scripts/provision-staging-qa.mjs`. Runs against only `https://vpfpjvhafkmygetjkfcp.supabase.co`; calls Supabase Auth Admin `createUser`, confirms the protected QA marker, sets `profiles.role` with an authorized service key, and verifies real email/password login and the owner-visible role.

Run in a **private approved environment** with these variables; set the values in a secret manager, NEVER in Git, PR descriptions or ChatGPT:

```text
AURA_STAGING_DB_REF=vpfpjvhafkmygetjkfcp
NOATA_STAGING_SERVICE_ROLE_KEY=[STAGING SERVICE ROLE ONLY, SECRET]
NOATA_STAGING_PUBLISHABLE_KEY=[STAGING PUBLISHABLE KEY]
NOATA_QA_EMAIL_DOMAIN=[YOUR VERIFIED TEST MAIL DOMAIN]
NOATA_QA_STUDENT_EMAIL=[CONTROLLED MAILBOX]
NOATA_QA_STUDENT_PASSWORD=[UNIQUE 18+ CHAR STRONG PASSWORD]
NOATA_QA_TEACHER_EMAIL=[CONTROLLED MAILBOX]
NOATA_QA_TEACHER_PASSWORD=[DIFFERENT STRONG PASSWORD]
NOATA_QA_ADMIN_EMAIL=[CONTROLLED MAILBOX]
NOATA_QA_ADMIN_PASSWORD=[DIFFERENT STRONG PASSWORD]
NOATA_QA_ENABLE_PROVISION=YES
NOATA_QA_CONTROLLED_EMAILS=YES
```

The provisioning tool does not print credentials. It refuses reuse of an existing account unless that account carries the **server-controlled** staging QA marker with exactly the matching role. Role changes are verified on the database; authenticated login and owner-visible role are verified through Supabase using the publishable key.

Run dry:

```bash
pnpm --filter @noata/web exec node scripts/provision-staging-qa.mjs
```

Run only in your secured local/CI environment after setting secret variables and approving this reviewed branch:

```bash
pnpm --filter @noata/web exec node scripts/provision-staging-qa.mjs --apply
```

`--apply` without ALL protected guards refuses to run. Owner-controlled mailboxes are necessary for account recovery. Never enter service role keys in a browser; avoid exposing credentials as debug artifacts. Avoid putting admin secrets in ordinary PR runs.

## CI / end-to-end limits

- `node --test apps/web/scripts/staging-qa-config.test.mjs` verifies staging refusal, role uniqueness, password strength, controlled domain, and explicit authorization **without connecting to Supabase**.
- `pnpm modern:test` includes new-password form validations.
- Real three-role login cannot be declared PASS until the private provisioning run succeeds and the existing authenticated browser E2E is extended with those credentials.
- Separate staging-only role journeys must verify assignment, teacher access, admin controls, logout, session refresh, RLS and cross-account isolation.
- Google Cloud configuration remains owner-managed as requested.
- Do not merge PR #3 or release to Production until all required live gates pass.
