# Noata isolated staging provisioning proposal

Updated 2026-10-08. **PROVISIONED BY THE USER: `vpfpjvhafkmygetjkfcp`, ACTIVE_HEALTHY, Free, eu-west-2. No migration applied by this cloud agent. Staging configuration/testing is blocked by unavailable connections and secure bindings.**

| Setting | Proposed value |
| --- | --- |
| Organization | Noata |
| Organization ID | `sbvcxdwcawkddndptsuh` |
| New project | `noata-staging` — `vpfpjvhafkmygetjkfcp` |
| Region | `eu-west-2` — London |
| Plan | Free (`tier_free`) |
| Additional monthly subscription | $0 |
| Maximum additional authorized spend | $0; no paid add-ons or upgrade |
| Existing production project | `jdkfqdzgphzqbbzmerzr` — excluded from QA and changes |

The user independently checked the connected Supabase account and its project-cost API before creation: one remaining Free slot and **$0/month**. The user then created and independently verified the separate staging project. A subsequent connected inspection confirmed **zero public application tables, migrations, Auth users and Edge Functions**. These are attributed user API results. Connectors are available only in the separate connected session, not this cloud session. No staging bindings are verified; the new endpoint returns proxy CONNECT 403 here.

Creation is complete. Before any additional provisioning, recheck the $0 ceiling. Abort if capacity, quotas or plan changes require an upgrade, paid add-on or nonzero charge. Never accept a pricing change automatically. Set the database password through secure settings; do not place credentials in this document, chat, repository, screenshots or logs. Nondestructive isolated staging configuration and QA are already authorized; production, domains, billing and PR merging remain excluded.

## Reviewable follow-on setup

1. Record the returned **new** project reference and assert it differs from `jdkfqdzgphzqbbzmerzr`. Keep it isolated; do not copy production conversations, student records or credentials.
2. Review/test repository migrations in disposable staging before enabling features. `20261008150000_private_ai_documents.sql` remains **unapplied**. Neither this proposal nor the local implementation applies it anywhere.
3. Configure a branch-specific Vercel **preview** with the new public URL/key at build time. Keep provider/service credentials in staging-only secure settings. Do not alter Production environment values, official domains, preview protection or billing. A READY preview using the existing backend is not an authorized authenticated QA target.
4. Enable `/api/qa-target` only for this separate reference with `NOATA_STAGING_QA_ENABLED=true` and matching `AURA_STAGING_DB_REF`. Leave `NOATA_DOCUMENT_STORAGE_ENABLED` off until private bucket/RLS/lifecycle checks pass.
5. Prepare disposable student A/B, teacher A/B and admin fixtures using ordinary authentication. Exercise the full role/storage/provider matrix in `TESTING.md` and `AI_CAPABILITY_MATRIX.md`; the current opt-in authenticated smoke is only a subset. Apply no migration or fixture mutation to production.
6. Validate real byte cleanup, 30-day expiry, owner/conversation quotas, revoked access, short signed-link lifetimes and scheduler behavior before advertising retained-document storage.

## Recorded approval and next action

Creation approval was executed by the user for **only** `noata-staging` in organization `sbvcxdwcawkddndptsuh`, region `eu-west-2`, Free, $0. Subsequent non-destructive staging configuration, base migrations and disposable QA are authorized. Every operation must target `vpfpjvhafkmygetjkfcp`; production is excluded.


This session has no callable management connector or staging credentials. Secure settings must supply the connections/bindings; keys/passwords must never enter chat or Git. A guarded 19-file base initialization bundle (18 original migrations plus authorization hardening) and SHA-256 manifest are prepared under `/workspace/noata-staging/`, explicitly targeted to the new reference and refusing an existing Noata schema. No request was sent. Inspect actual migration history before execution and do not reset/replay existing data. The new private-document migration remains excluded and unapplied; retention stays off. A healthy empty project does not establish authentication, provider or RLS correctness.

The complete source review, initialization syntax repair and additional SQL authorization corrections are documented in [the migration review](NOATA_STAGING_MIGRATION_REVIEW.md). Local PostgreSQL results do not initialize or verify hosted Supabase. Rebuild the bundle from the final candidate and inspect migration history before applying it.
