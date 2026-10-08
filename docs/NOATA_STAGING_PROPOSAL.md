# Noata isolated staging provisioning proposal

Prepared 2026-10-08. **CREATION APPROVED: Free only, $0 additional monthly ceiling. No resource created by this cloud agent; execution is blocked by the unavailable management connection.**

| Setting | Proposed value |
| --- | --- |
| Organization | Noata |
| Organization ID | `sbvcxdwcawkddndptsuh` |
| New project | `noata-staging` |
| Region | `eu-west-2` — London |
| Plan | Free (`tier_free`) |
| Additional monthly subscription | $0 |
| Maximum additional authorized spend | $0; no paid add-ons or upgrade |
| Existing production project | `jdkfqdzgphzqbbzmerzr` — excluded from QA and changes |

The user independently checked the connected Supabase account and its project-cost API: one accessible organization, one active/healthy Free project, one of two active Free-project slots used, and a quoted creation estimate of **$0/month**. The user also checked official region support and the account-wide active Free-project limit. This is attributed user-provided API evidence, not a connector response obtained by this agent. Connector tools are unavailable in this cloud session.

Before executing an approved creation, recheck eligibility and the $0 estimate. Abort if capacity, quotas or plan changes require an upgrade, paid add-on or nonzero charge. Never accept a pricing change automatically. Set the database password through secure settings; do not place credentials in this document, chat, repository, screenshots or logs. Creating a project is the only action proposed for approval here; production, domains, billing and PR merging remain excluded.

## Reviewable follow-on setup

1. Record the returned **new** project reference and assert it differs from `jdkfqdzgphzqbbzmerzr`. Keep it isolated; do not copy production conversations, student records or credentials.
2. Review/test repository migrations in disposable staging before enabling features. `20261008150000_private_ai_documents.sql` remains **unapplied**. Neither this proposal nor the local implementation applies it anywhere.
3. Configure a branch-specific Vercel **preview** with the new public URL/key at build time. Keep provider/service credentials in staging-only secure settings. Do not alter Production environment values, official domains, preview protection or billing. A READY preview using the existing backend is not an authorized authenticated QA target.
4. Enable `/api/qa-target` only for this separate reference with `NOATA_STAGING_QA_ENABLED=true` and matching `AURA_STAGING_DB_REF`. Leave `NOATA_DOCUMENT_STORAGE_ENABLED` off until private bucket/RLS/lifecycle checks pass.
5. Prepare disposable student A/B, teacher A/B and admin fixtures using ordinary authentication. Exercise the full role/storage/provider matrix in `TESTING.md` and `AI_CAPABILITY_MATRIX.md`; the current opt-in authenticated smoke is only a subset. Apply no migration or fixture mutation to production.
6. Validate real byte cleanup, 30-day expiry, owner/conversation quotas, revoked access, short signed-link lifetimes and scheduler behavior before advertising retained-document storage.

## Recorded approval and next action

The user approved creation of **only** `noata-staging` in organization `sbvcxdwcawkddndptsuh`, region `eu-west-2`, on Free with a $0 additional monthly ceiling. The approval satisfies the earlier user instruction: **“Do not create the project or accept any paid upgrade until I explicitly approve.”** Execution still needs an authorized callable Supabase connection; this session currently has none.


The user additionally authorized safe staging configuration and authenticated testing after creation, while keeping production untouched and PR #3 draft. Recheck the $0 quote before executing; stop if payment is required. This session has no callable Supabase connector or management credential. Return the **new** public reference/status through the connected session; store keys/passwords only in secure staging settings. The private-document migration remains unapplied and retention stays off. An approved creation is not evidence that a project exists or that authenticated QA passed.
