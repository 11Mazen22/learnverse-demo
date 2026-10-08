# Noata Aura — connected staging initialization and release checkpoint

Date: 2026-10-08. Evidence obtained directly from connected Supabase, Vercel, and GitHub APIs in the authorized user's session.

## Scope and protection

- **STAGING ONLY**: Supabase project `vpfpjvhafkmygetjkfcp` (`noata-staging`, `eu-west-2`, Free).
- **Production excluded**: `jdkfqdzgphzqbbzmerzr`; it was not targeted by any of the operations reported here.
- No production domain changes, paid upgrades, PR merge, or changes to production Supabase.
- This document contains no authentication credentials or secrets.

## Completed direct actions

1. Verified staging was ACTIVE_HEALTHY with zero app tables, zero applied migrations, and zero Auth users before initialization.
2. Inspected all 19 base-schema SQL migration files at the pinned commit `14c3d6322aeba2454032c26d7bd62d445f9785fc`. The PostgreSQL CI suite previously passed for this candidate. Specifically excluded `20261008150000_private_ai_documents.sql` from live staging execution.
3. Applied the 19 base migrations **sequentially to staging only** through Supabase's migration API; all returned `success:true`.
4. Queried the deployed staging schema: **19 registered migrations**, **32 public tables**, **70 public RLS policies**, **0 Auth users**, and **2 storage buckets**. The `noata-uploads` bucket is present; the `noata-ai-documents` retention bucket is absent, as required.
5. Deployed `supabase/functions/noata-ai/index.ts` plus its `deno.json` from pinned commit `14c3d632...` **to staging only** with `verify_jwt=true`. Supabase reported function `noata-ai`, version `1`, state `ACTIVE`. This is a deployment check, *not* a successful Fanar provider request or an authenticated E2E test.
6. Created and verified three Vercel environment entries **scoped exclusively to preview branch** `noata-aura-platform-overhaul-20261008`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `AURA_STAGING_DB_REF`. All point to staging. No production environment values, provider secrets, or service-role keys were changed.

## Migration reconciliation warning

The migrations API registered names `noata_0001_noata_core` through `noata_20261008170000_learning_authorization_hardening`, mirroring the 19 repository migration files in lexicographic order.

**Do not blindly rerun or synchronize the repository migration directory against this staging database.** A future CLI invocation may see different migration version identifiers than the migration API; reconcile migration history and compare schema before any further migration. No private-document retention migration was applied.

The staged migration names (in order):

```text
noata_0001_noata_core
noata_0002_ai_usage
noata_0003_learning_transactions
noata_0004_classroom_gamification
noata_0005_storage
noata_0006_core_hardening
noata_0007_transactions_classroom_hardening
noata_0008_content_model_refinement
noata_0009_demo_content_seed
noata_0010_product_completion_workflows
noata_0011_product_completion_performance_cleanup
noata_0012_assignment_visibility_hardening
noata_0013_staff_content_and_notifications
noata_0014_account_lifecycle_completion
noata_0015_curriculum_authoring_policies
noata_20261007144203_noata_ai_request_idempotency
noata_20261007201149_noata_admin_ai_usage_summary
noata_20261007215014_fix_ai_quota_private_schema_execution
noata_20261008170000_learning_authorization_hardening
```

## Security advisory review to finish

The staging Supabase database advisor reported:

- `public.ai_request_receipts` has RLS enabled with zero policies. This appears intentional for service-only access but needs explicit negative/positive integration tests.
- `public.admin_ai_usage_summary()` is a SECURITY DEFINER RPC callable by authenticated users. Its SQL contains a `private.is_admin()` permission check; verify with real non-admin/admin staging identities. Do not dismiss the advisory without role tests.

## Incomplete mandatory release gates

- **Real accounts:** no disposable student A/B, teacher A/B or admin identities exist. Create only with authorized test credentials, and verify real JWT/role/RLS boundaries.
- **AI/provider:** Fanar credentials and live Fanar/vision/tool calls not verified. Function ACTIVE does not establish functional responses.
- **Audio:** STT/TTS/provider/live-browser playback tests not run.
- **Document retention:** feature disabled; private storage migration not applied; ownership, TTL and deletion tests pending.
- **Hosted preview:** prove exact-source-SHA READY on the current branch after authorized Git identity deployment; a blocked/older preview does not pass.
- **Security/performance:** required manual accessibility, physical-device and load tests remain pending.
- **PR #3:** keep open/draft. No merge into `master` until all mandatory release gates pass and explicit release approval is confirmed.

## Repo branch reconciliation

The `noata-v1-rebuild` and `noata-v2-total-redesign` branches are ancestors of the active Aura branch (zero exclusive commits). A separate `claude/pdfkit-alternative` branch has one exclusive commit introducing a distinct PDFKit implementation, new dependencies/font files, and a second PDF endpoint. It has not been merged because the current PDF renderer already passes binary/RTL verification, and the alternative must undergo comparative security/build/visual regression tests first. Preserve it for further controlled review.

## Verification convention

Distinguish **CONNECTED-STAGING-VERIFIED** (schema, migrations, Edge Function ACTIVE, preview-only environment metadata) from **NOT RUN** (authenticated workflows, Fanar, Storage RLS user isolation, live TTS, device QA). These are not interchangeable.

Continue code review, CI verification, and staging-only tests without changing production or claiming final release readiness.
