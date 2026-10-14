# Noata Aura — real staging email and Google OAuth activation

**Scope:** Approved Supabase staging only: `vpfpjvhafkmygetjkfcp`. Production is protected and must not be modified.

Latest Next.js UI and static email templates are NOT evidence that Supabase's live Auth providers or email templates are configured. The missing platform settings must be activated and verified separately.

## 1. Required Google OAuth credentials

Use [Google Auth Platform](https://console.cloud.google.com/auth/clients) to create a **Web application** OAuth client (the organization owner must authorize it). Enter the following **exact**, staging-only values:

- Authorized JavaScript origin: `https://noata-git-noata-aura-platform-overhaul-20261008-noata.vercel.app`
- Authorized redirect URI: `https://vpfpjvhafkmygetjkfcp.supabase.co/auth/v1/callback`

The Google application OAuth consent screen must be correctly configured. If its publishing status is **Testing**, add only approved QA accounts as test users. Neither Google Client Secret nor Supabase Management API token may be committed or pasted into chat. Configure these in a secure local environment.

## 2. Secure Supabase Management API activation

The repository includes `scripts/configure-noata-staging-auth.mjs`. The script's project ref is hardcoded to approved staging. It supports the Supabase `PATCH /v1/projects/{ref}/config/auth` API. Its default behavior is a **dry run**, and it only sends a PATCH with explicit `--apply`.

In a secure local terminal with Node.js 20+ and a **staging-scoped** Supabase Management API token (fine-grained `auth_config_read`, `auth_config_write` and `project_admin_write` permissions), first run:

```bash
node scripts/configure-noata-staging-auth.mjs
```

Then supply the credentials through environment variables in the *local secret manager or secure CI environment*, **not on a shell command line saved to history**:

- `NOATA_STAGING_MANAGEMENT_TOKEN` — Supabase Management API token scoped to this project
- `NOATA_GOOGLE_CLIENT_ID` — authorized Web client ID ending with `.apps.googleusercontent.com`
- `NOATA_GOOGLE_CLIENT_SECRET` — Google OAuth Client Secret

With those variables privately set, the authorized operator can run:

```bash
node scripts/configure-noata-staging-auth.mjs --apply --with-google
```

This publishes **all five real HTML email templates and their Arabic subjects**, fixes staging `site_url` and appends the branch callback allowlist, and configures the real Google provider; it never prints API credentials or provider secrets. Do **not** enable Google with placeholder credentials.

**Optional dedicated SMTP:** To use a transactional email provider, set all six secrets `NOATA_SMTP_HOST`, `NOATA_SMTP_PORT`, `NOATA_SMTP_USER`, `NOATA_SMTP_PASS`, `NOATA_SMTP_FROM_EMAIL`, `NOATA_SMTP_FROM_NAME`, then add `--with-smtp` on the same operator-managed run. Email delivery must be verified with an approved QA inbox; template upload alone is not delivery verification.

Alternatively, stage Auth settings manually under:
`https://supabase.com/dashboard/project/vpfpjvhafkmygetjkfcp/auth/url-configuration`
and the corresponding Email Templates and Google provider Dashboard sections. Never use the production project.

## 3. Required hands-on end-to-end QA

1. Verify sign-up with a disposable staging email and confirmation link; check that the verified user persists after a page refresh.
2. Start password recovery using a fresh email in the **same browser and origin**, follow the one-time callback to `/auth/update-password`, change the password, sign out and sign in with the new password.
3. Verify wrong/expired links and requests from other browsers return understandable error screens (not an infinite spinner), without logging secrets.
4. Test Google OAuth consent with an approved test user; verify Supabase Auth provider is enabled and session is available after callback.
5. Verify sign-out, navigation back to protected pages, user isolation and non-admin permissions.
6. Verify that no redirect uses `http://localhost:3000` on the staging domain, while local dev still works with explicit local config.
7. Verify production and `master` remain untouched.

## 4. External blockers

- Google credentials cannot be manufactured from the Noata codebase. A Google Cloud project owner must create them.
- This ChatGPT Supabase connector currently has no `get/update Auth service config` action. Read-only SQL access is **not equivalent** to permission to enable Google or SMTP.
- Supabase Auth settings, email sending, and real OAuth need credential-based live QA. Passing synthetic Chrome/TypeScript checks does not prove them.
- Vercel may reject new previews with `Deployment rate limited — retry in 24 hours`; do not mark a preview READY unless its source Git SHA matches the tested revision.
