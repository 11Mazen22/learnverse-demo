# Noata Aura: verified audit, recovery inventory, and release gates

Date: 2026-10-08. Workstream: `noata-aura-platform-overhaul-20261008`.

## Scope and data-handling rules

- This branch is an isolated candidate. No changes to the live custom domain, master, or production records are authorized by this document.
- The Open WebUI exports were inspected read-only using isolated temporary directories. They were **not** copied to Git, Vercel, Supabase, or public assets. No account identifiers, messages, secrets, or private archive values belong in this document.
- Neither archive is source code or model weights. Never claim an exact frontend port can be extracted from their databases.

## Open WebUI exports: non-sensitive structural observations

Both exports contain 43 application tables with matching table names and field layouts. Important categories include `chat`, `chat_message`, `folder`, `tag`, `model`, `tool`, `function`, `prompt`, `file`, `knowledge`, `memory`, `calendar`, `note`, `group`, `access_grant`, `user`, and `auth`.

| Structural metric | Public archive | Private archive |
| --- | ---: | ---: |
| App tables | 43 | 43 |
| Chats | 8 | 10 |
| Chat messages | 44 | 35 |
| Configuration records | 0 | 352 |
| Model/tool/function rows | 0 | 0 |
| Attached file database rows | 0 | 0 |

The archives contain historical account/authentication/chat data and must remain private. The private archive additionally includes media and an application note. Useful **concepts** are conversation organization, access grants, provider settings, structured tools, role-scoped configurations, and media ownership—not direct data imports.

## Confirmed codebase findings

- `apps/web/components/ai/noata-ai-client.tsx` and `use-ai-workspace.ts` implement a React/Next.js Noata AI workspace.
- `supabase/functions/noata-ai/index.ts` is a Fanar-based AI orchestration endpoint, with `noata-ai-v2` active separately in Supabase.
- Current upload validation accepts PNG/JPEG/WebP images and selected audio formats up to 10 MiB. It does **not** implement PDF/DOCX/PPTX/XLSX analysis or cross-format previews.
- The pre-fix AI voice player used a global signed `audioUrl`, rendered at thread bottom without owning-message or chat lifecycle state. This made stale playback possible when changing conversations.
- Several AI CSS labels were 7–11 px, compromising Arabic readability on normal screens.
- The original scope includes 17 Fanar capability registry entries; a configured UI route is not evidence that each service currently returns valid output.

## Implemented on this isolated candidate

- Message-owned audio player with close/stop, native seek/play/pause, playback speed, and compact responsive styling.
- A generation token guard that invalidates pending voice results on chat change, new chat, editing/removal of a playing message, close, and unmount.
- Correct cleanup of the active audio element on conversation navigation.
- Regression tests for stale speech results and cancellation.
- More readable Arabic UI font sizes across the existing AI workspace.
- Image uploads now precede user-message persistence; message metadata records the actual private storage path, filename and MIME type. The chat history refreshes private signed preview links when reopened. Standalone image analysis is enabled, and unsupported image+tool combinations explicitly fail rather than pretending to process a file.
- No new external AI provider, model capability, production database migration, or destructive action.

## Noata Aura milestone 2: functional AI, export and browser QA

The following implementation is on this branch:

- `apps/web/lib/ai/document-text.ts`: bounded (512 KiB file; 9000 text characters) TXT, MD, CSV and JSON extraction. Excerpts are actually included in the Fanar message context and preserved in private per-message metadata for later turns. Original text document bytes are **not** kept in Storage because the current production bucket allowlist only permits images/audio. This is deliberate; no live bucket settings were changed.
- `apps/web/components/ai/attachment-message.tsx`: accessible image and text-excerpt preview dialog with filename, authorized signed image links, truncation disclosure, and no fake binary-document preview.
- `apps/web/lib/ai/docx-export.ts`: genuine editable Word/OOXML ZIP export (UTF-8 paragraphs, Arabic RTL and basic heading styles). ZIP archive integrity is tested. Complex HTML-to-Word fidelity is **not** claimed.
- `apps/web/components/ai/writing-studio.tsx`: a real response editor with live Markdown preview, Word and Markdown export, plus print-to-PDF through the user's native browser dialog. Native PDF file generation is **not yet available**.
- `apps/web/components/ai/conversation-history.tsx`: keyboard/touch-accessible RTL conversation action menu.
- `apps/web/components/ai/noata-ai-client.tsx`: connected writing studio, document preview, text attachment picker, refined AI controls and a bounded composer.
- `apps/web/components/dashboard/dashboard-live.tsx`: a real recommended-next-step action from due reviews or the next incomplete lesson, not fabricated metrics.
- `apps/web/app/globals.css`: shared Noata Aura learning shell and AI workspace styling for Arabic typography, responsive navigation, cards, dialogs, reading width, interactions and reduced motion.
- `scripts/browser-aura-smoke.mjs` and `.github/workflows/noata-ci.yml`: actual headless Chrome CDP checks with screenshots, no Playwright dependency.

Independent successful browser CI evidence (commit `07527748`, workflow run `37706092602`): 58 public-browser assertions, 11 routes, desktop/tablet/mobile 320/390/768/1440, light/dark mode, 8 PNG screenshots. Overall CI completed successfully with 95 tests passed. Later commits require their own exact-head validation; do not treat earlier success as proof of their behavior.

### Remaining verification limits

Authenticated student/teacher/admin browser sessions, real positive Fanar inference with an authorized QA account, live TTS playback and image-understanding responses, attachment lifecycle deletion under RLS, fully automated PDF generation, binary document reading (PDF/DOCX/XLSX/PPTX), Quran canonical data and licensing integration, per-model provider-health checks, and genuinely complete route-by-route UI audit are not certified by this milestone.

We did not import historical Open WebUI private data or use old credentials. We did not merge the branch or change the official domain.

## Still required for the complete brief

1. Real end-to-end browser tests of audio playback/navigation, on desktop/mobile, with authenticated test accounts.
2. Secure multi-file/document ingestion, backend text extraction, previews, and actual model-context inclusion for each advertised file type.
3. Provider-backed model availability/health checks, timeout policy, honest usage metadata, and end-to-end Fanar verification for every capability.
4. Complete original Noata Aura design system and route-by-route accessible visual redesign, including typography, responsive tests, motion, settings and teacher/admin tools.
5. Genuine artifact generation and export (DOCX, PDF, PPTX, XLSX), research retrieval, and Quran dataset/recitation licensing checks.
6. Cross-account RLS, storage ownership, classroom isolation, session recovery and security hardening.
7. Actual performance, accessibility and keyboard QA.
8. Full preview verification and explicit release approval **before** considering production.

Do not label this workstream fully complete until the corresponding checks are supported by results. Existing production stays the rollback baseline.
