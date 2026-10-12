# Noata ONE migration ledger

## Scope and evidence

Baseline: `16c98683cc9c50f8fe7f77eaad82b2ddcca5d02e`, branch `noata-aura-platform-overhaul-20261008`, Draft PR #3.
This ledger describes the first shell migration; the full ONE mission remains PARTIAL.
All edits are made through remote GitHub APIs. Production resources are outside this change.

## Inventory of existing capability paths

| Existing surface | Working implementation to preserve | ONE destination / state |
|---|---|---|
| AI welcome / launchpad | Four contextual suggestions, verified identity and locale | Single welcome + central shared composer; unused launchpad is not mounted |
| Chat / history | Search, pin, archive, rename, delete, temporary chat, account/session guards | Retained in the sidebar; projects/files opens the existing private library |
| Composer | Multiple document selection, image/audio, paste/drop, recording, cancellation, drafts | Same real composer for first and subsequent turns; attachment menu stays contextual |
| Per-answer format menu | PDF/DOCX/XLSX/PPTX export engines | Generic per-answer format menu removed; conversation generation and contextual document editor retained |
| Writing Studio | Editable draft, Markdown preview, real exports, unsaved guard, private save | Contextual “Edit text”; no separate destination is required |
| Creative Studio | Authorized original-file load, PDF rendering, Office inspection, revisions, download, AI instruction | Contextual “Preview & edit” on an existing file; underlying inspection preserved |
| Study workshop | Nine learning prompts, direct send | Retained under conversation options pending deeper semantic orchestration |
| Settings | Models, voice, appearance, privacy, memory, projects, capability status | Compact common settings layout; each existing control preserved |
| Motion | System/full/reduced/off preference | Loaded on workspace mount; system accessibility preference takes priority |
| Generated artifacts | Authenticated storage, byte validation, message attachment, signed download | Existing native file card, contextual preview/edit; no false file-ready placeholder |
| Research | Real Brave adapter + fail-closed unavailable path | Preserved; successful live retrieval still needs authorized configuration |
| Native responses | Validated allowlisted components, deterministic graph calculations | Preserved; previous Arabic quiz generation issue needs a fresh provider test |
| Memory / projects | Existing authorized persistence and user controls | Code preserved; two-account privacy and complete continuity need real acceptance tests |

## First transformation

The welcome, composer, suggestions, sidebar, menus, messages and compact settings share a scoped CSS module.
The original Noata logo and semantic palette tokens are retained. No animation library was added.
The previous compact stylesheet's shell overrides were removed; only the actual worksheet preview rules remain there.
A small welcome component separates initial presentation from conversation orchestration.
Header utilities use one accessible native disclosure, preserving study controls on narrow screens.
The universal answer-format menu was removed without deleting the generation engines.
Old component filenames remain as compatibility implementation details; user-facing Studio branding is removed from these conversation entry points.

Animations use finite opacity/position transitions. Content is never artificially typed after completion.
The existing SSE transport, cancellation, provider routing, storage and authorization remain unchanged.
Motion preference is now applied before opening Settings and synchronized between mounted controls.
Complete reduction of legacy global styles, all nested editor layouts and measured device performance remain open.

## Capability boundary

The current planner is deterministic and regex-based. It is not the model-assisted semantic planner required by ONE.
Natural-language generation currently supports one detected PDF/DOCX/XLSX/PPTX request at a time.
Multi-output orchestration, controlled model-planned filenames, stable version references, image editing,
new safe vector generation, ZIP/code bundles and all-format previews are not delivered by this shell change.
Image generation and other external tools require successful actual provider tests before being classified VERIFIED.

## Verification plan

Remote CI retains type checking, unit tests, database fixtures, document structure checks, real Chrome,
accessibility, palette regressions and exact-revision evidence.
The new shell checks cover one composer, four usable starters, greeting/composer/suggestion order,
English and Arabic, widths 320/375/390/768/1024/1440/1920, and saved motion-off before Settings opens.
Synthetic browser checks do not prove live Fanar, real account isolation or production recovery.

Record final CI and exact Preview SHA in the milestone report after completion. Do not label queued checks passed.
Production release remains gated by the pre-existing backup/restore, migration, environment and authenticated E2E gates.

## Next implementation

1. Replace deterministic request selection with bounded model-assisted plans validated against executable capability contracts.
2. Move document revision semantics and preview state into native conversation artifact objects.
3. Add meaningful safe display filenames independent from internal storage identifiers.
4. Prove generation, retrieval, edits and account isolation using authorized Staging accounts and real providers.

## Observed defects and repairs

Initial shell candidate: `16a467047ba3bb4a8e58fc32775b20c42fd31351`.
Remote type checks, unit tests, Deno check, database fixtures, document fixtures and production-mode build passed.
Chrome caught attachment-button foreground/background interpolation at only 1.17:1 during a theme switch.
Its colors now change atomically; only press movement transitions. The required contrast gate is retained.

Live read-only inspection found a historical PDF attached to a clarification reply about chocolate.
The new transaction rejects untitled clarification replies before rendering/uploading.
A regression test uses the observed reply; titled educational questions remain accepted.
Historical files are preserved; no existing user artifact is silently rewritten or deleted.

New generated downloads use a bounded sanitized content title, with English/Arabic fallbacks.
Names reject paths, reserved Windows names, controls, secret-like labels, addresses and long identifiers.
Internal UUID storage paths remain separate from display names and keep the existing ownership format.
Downloads use Supabase's signed-download filename option.
This is a safe naming foundation, not complete model-assisted title planning or stable artifact versioning.

The duplicate nested main element and duplicate skip-target ID are removed.
The browser contracts now require exactly one main landmark.

Three concurrent corrections were inspected and preserved: fa22e545 (mobile model gallery), 295a18e6 (theme-switch action contrast), f110a351 (new-chat shortcut contrast). The next transaction is based on f110a351 rather than overwriting these changes.
