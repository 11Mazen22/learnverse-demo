# Noata ONE — Staging inspection, 13 October 2026
## Boundary
PR #3 remains Draft and unmerged. Production is read-only; no deployment, database write, environment change, credential rotation or paid upgrade was authorized in this phase.
Implementation uses remote GitHub APIs; local repository files are not edited.

## Verified access and actual schema
Supabase MCP now executes successfully. Authorized Staging `vpfpjvhafkmygetjkfcp` and Production `jdkfqdzgphzqbbzmerzr` both return ACTIVE_HEALTHY.
The general connector is write-capable (`transaction_read_only=off` on the minimal Staging query); Production inspection explicitly uses `BEGIN READ ONLY`.
Production retains 18 recorded migrations. Staging had 27 before this milestone, so the earlier five-difference estimate is obsolete.
Actual schema inspection found five Staging-only tables: ai_artifacts, ai_memory_consent, ai_projects, ai_user_memories and user_theme_designs. Additional columns include profile gems, settings palette and active_design_id.
All observed public tables in both projects have RLS enabled. This is structural evidence, not complete multi-account privacy acceptance.
Production XP/COIN profile balances match the actual uppercase ledger currency totals: zero mismatches. An initial lowercase diagnostic was corrected after inspecting the real currency values and trigger definition.

## Authorized Staging repairs
The reviewed source migration `20261008150000_private_ai_documents.sql` was absent from Staging. Applied there as `noata_private_ai_documents`.
Verified the new metadata table is empty, RLS enabled, three owner policies, no anonymous SELECT and no authenticated UPDATE.
Verified `noata-documents` is private with an 8 MiB cap.
Applied reviewed `20261012234000_private_xlsx_source_uploads.sql` as `noata_private_xlsx_source_uploads`; verified the existing cap/privacy are retained and XLSX MIME is enabled.
Set `NOATA_DOCUMENT_STORAGE_ENABLED=true` only for branch Preview `noata-aura-platform-overhaul-20261008`.
No Production migration was applied.

## Environment audit
Branch Preview public URL points to authorized Staging.
Shared public URL, server URL and legacy service-role JWT project claim reference the unrelated third project.
Only identity classification was inspected; no credential value was displayed or used to authenticate to that project.
Shared Production settings remain unchanged. Environment alignment is a FAILED release gate until the owner authorizes and verifies correct Production configuration.
A branch URL override does not make unrelated inherited administrator credentials safe for QA.
Matching Staging Auth Admin credentials are still unavailable through the configured Vercel secrets. Actual Auth inventory has two users: one Teacher and one Admin, no Student.

## Provider configuration and recovery limits
Staging `noata-ai-v2` was version 24 before this milestone. Candidate source has newer fixes.
The observed NASA request returned `not_configured`: search disabled or no usable Brave key. An authenticated readiness diagnostic now distinguishes those non-secret booleans.
Supabase MCP exposes no secret-setting or backup-download operation. The dashboard is signed out; owner sign-in was requested.
No genuine Production backup has been downloaded/restored. No isolated recovery branch exists according to the branch-list read.
The organization is Free. Official backup guidance recommends manual logical dumps for Free projects; this does not prove whether an owner-held backup exists.
Synthetic CI recovery remains insufficient for the genuine recovery gate.

## Security advisors
Both projects report server-only ai_request_receipts RLS without policies (deliberate deny by default).
The authenticated SECURITY DEFINER admin_ai_usage_summary advisory was reviewed: the real function checks private.is_admin() and rejects non-admin callers.
Leaked-password protection is disabled; no paid service was enabled.
Advisors do not replace actual role/privacy/OAuth tests.

## New engineering candidate
Model-assisted file proposals are validated against four allowlisted formats and bounded contracts. Models cannot propose URLs, code, SQL, privileges or new tools.
Multiple requested formats have distinct generation/persistence receipts and independent contextual cards.
Each failure retains any completed output and reports missing formats instead of claiming the whole job succeeded.
Chart-containing PDF requests preserve report prose alongside the validated numeric chart.
Document API and original-file errors follow English/Arabic UI selection.
Tests and live results must be recorded on PR #3 after they actually execute; this document does not assert that queued checks passed.

## Open gates
- Genuine Production-compatible backup restore, data/storage recovery and rollback rehearsal.
- Reconciliation and isolated rehearsal of current Production schema differences.
- Authorized matching Staging Auth Admin access; real Student/Teacher/Admin, OAuth, rewards and cross-account privacy acceptance.
- Live configured search/citations, image creation/editing, Sadiq 2 provider entitlement and full model-quality acceptance.
- Controlled artifact revisions/versioning, deeper project retrieval, remaining formats and complete ONE acceptance.
