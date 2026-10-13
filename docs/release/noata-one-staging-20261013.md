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

## Subsequent reproducible failures and corrections
The first live three-format request returned PLAN_INVALID and a provider file refusal; no file was falsely claimed.
The candidate now preserves every explicit supported format in request order when planning fails, while keeping bounded model-assisted interpretation for other requests.
Planner output budget increased from 220 to 600 tokens, with a concrete schema example and safe rejection diagnostics (codes/counts only; no prompt or output logging).
Fanar's official current OpenAPI schema does not declare response_format; no unsupported JSON-mode parameter was introduced.
The original-upload test found Storage AccessDenied. Actual policy inspection exposed d.storage_path=d.name due to an unqualified name column.
Official Storage uploader source shows contentLength during its permission probe and finalized size later.
Staging migrations 20261013020043 (metadata probe) and 20261013020202 (scope predicates) retain exact size, MIME, owner, conversation and expiry constraints, qualifying objects.name explicitly.
No extra privileged upload endpoint or broader Storage permissions were added.
The CI database/recovery fixtures now execute the previously skipped private-document migration and all follow-up source migrations. Storage probe/finalized metadata, different display/path names, cross-owner denial and cleanup order have real isolated SQL assertions.
Staging now has 31 recorded migrations; Production still has 18.
Backend version 26 files match the new candidate's function sources; JWT verification remains enabled.
The prior version 24 was confirmed to match the initial 1b82e3ff function source. Rollback is redeployment of that preserved pinned source, not an unverified credential change.
Cancellation and timeout handling now ends progress notices and bounds original-file network waits.
Actual final CI and browser outcomes are recorded in PR #3 after execution.

## Final engineering follow-up
Private original Storage upload/read/delete returned HTTP 200 after the policy fixes. A subsequent message insert still failed because the actual older QA PDF contained a missing glyph decoded as NUL ("O [missing] C").
PDF extraction now replaces only that unreadable control character with a visible replacement marker, records damaged page numbers and warns both the user and model not to guess its meaning. Original bytes are preserved.
The three-output live plan was genuinely produced by Fanar and validated as PDF/PPTX/XLSX. The first follow-up run saved PDF and a defective workbook but did not create PPTX; that sample remains FAILED, not retroactively passed.
The workbook defect was comma-bearing refusal prose treated as CSV. The parser now requires a rectangular real CSV/TSV header/data shape, and capability refusal detection covers "unable to directly create".
The presentation parser now accepts the provider's actual bold slide labels, including a bold label followed by an unbold title, while retaining real editable slide sections.
Each secondary format uses a dedicated content request, one bounded repair for an unfinished/refusal response, and the original user's selected response language.
Progress/errors are cleared correctly after cancellation and failures.

Preview environment hardening: branch-specific blank overrides disable inherited unrelated administrator, JWT and PostgreSQL credentials/configuration. The branch server URL is explicitly authorized Staging; its existing matching public key remains active.
These overrides target Preview and the authorized branch only. Shared Production settings were not changed.
They do not manufacture working administrator credentials: matching Staging Auth Admin access is still a genuine owner action for three-role QA.
Final results must be read from PR #3's exact-head report; neither queued tests nor partial outputs prove the full ONE mission.
