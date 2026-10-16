# Renaissance 2.0 — Implementation Status

## Current production baseline

- **Web production master:** `0acc764361be456f3ee53b2138cab319cf24ef99`.
- **AI Edge Function:** `noata-ai-v2` ACTIVE version 10; JWT verification remains enabled; bundle hash `9de6a245650addf6cd8c04b3c5cd6acadc1e02f080b9ff2eb4c024e082a6ea3e` matches staging version 41.
- The deployed Edge Function contains 23 files matching the tracked `supabase/functions/noata-ai/` source. This release corrects capability-registry drift without changing provider settings, schema or secrets.
- Noata is operational for the verified HTTP routes, but this is a **partial implementation of the broader Renaissance 2.0 specification**, not a declaration that every requested feature is complete.

## Implemented and released slices

- **Streaming and answer integrity:** incremental SSE parsing/cumulative content, one typing caret with reduced-motion support, bounded JSON fallback responses and rejection of incomplete final-review answers.
- **Suggestion privacy/correctness:** state scoped to owner, locale, conversation context, temporary mode, personalization and active new-chat epoch.
- **Saved memory controls:** explicit consent, owner-scoped CRUD, temporary-chat exclusion from reading/displaying/mutating/exporting saved memories, account-scoped rendering and a user-triggered JSON export without account IDs/internal keys.
- **Office files:** targeted OOXML text/cell replacements for supported structures, staged multi-edit revisions and preflight validation for unsupported control characters, length and numeric-cell content. Original/unaffected package records are preserved where supported.
- **PDF files:** export/extraction, native page reorder/rotation, support for scanned/image-only PDFs in those native page operations, complete page-permutation validation and explicit acknowledgement where text reconstruction may be incomplete. Arbitrary PDF text/layout replacement remains unsupported.
- **Capability honesty:** inpainting/background removal are planned, not represented as active. Native PDF page editing and targeted Office editing are distinct operations; the universal-editor claim is not made.
- **Release/security hygiene:** production dependency hardening; RLS/ownership regression checks; 48-section/961-item requirement traceability; health/route smoke; production Edge Function code/source parity.

## Verification summary

- Noata CI #1312 passed on the PR #32 head: the 33-step `verify` job and 15-step intentional-tooltip/browser job completed successfully. This includes typecheck, modern/legacy tests, build, database authorization checks, artifact fixtures, RTL/responsive browser smoke, HTTP smoke and exact-revision evidence.
- Production `/health` reports `0acc764361be456f3ee53b2138cab319cf24ef99`. `/ai`, `/login`, `/signup`, `/quran`, `/privacy` and `/terms` returned HTTP 200; Arabic RTL and security headers were present.
- Supabase production `noata-ai-v2` version 10 and staging version 41 share bundle hash `9de6a245650addf6cd8c04b3c5cd6acadc1e02f080b9ff2eb4c024e082a6ea3e`; all 23 deployed files were compared to tracked source after the capability registry was synced.
- The post-deploy Supabase log query found no matching error/failure messages in the selected 8-minute window. This is a bounded observation.
- Real export smoke previously passed Arabic PDF/DOCX round-trip, native multi-page PDF round-trip, prose/chart rendering and alternate fonts. PR #30 page-order fixtures passed 7/7 and CI #1302.

## Remaining major work / blockers

- Authorized live Fanar chat/image generation, Brave Search results/metadata and STT/TTS round-trip.
- Two-account authenticated staging acceptance for account switching, locale, personalization, temporary chats, memory consent/export and server-side ownership.
- Complete bilingual/six-palette audit, required responsive widths and low-end performance profiling.
- True generative inpainting/background removal.
- Arbitrary PDF text/layout replacement; built-in native operations are page reorder/rotation.
- Durable long-running tasks, connected-app read/write actions and complete AI Projects/artifact lifecycle acceptance.

## Release boundaries

No Supabase plan upgrade, paid provider activation, production secret rotation or schema migration is implied. Run provider checks only with explicitly authorized disposable staging identities. Keep the separately restricted Renaissance PR #3 restricted until approval.
