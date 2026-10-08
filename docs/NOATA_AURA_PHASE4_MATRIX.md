# Noata Aura — Phase 4 Implementation & Verification Matrix

Historical snapshot. Current implementation and release gates are in [the Phase 5 matrix](NOATA_AURA_PHASE5_MATRIX.md); previous states and CI runs below do not certify today's commit.

Last update: 2026-10-08. Working branch: `noata-aura-platform-overhaul-20261008`.

**Allowed states:** Not started / Implemented, unverified / Verified / Blocked / Failed.

**Release discipline:** This is an isolated PR candidate. GitHub CI and Vercel preview checks do NOT imply authenticated behavior or production release approval. No merge, production domain changes, or destructive production DB actions were performed.

| Area | State | Evidence and qualification |
| --- | --- | --- |
| Baseline `cc9053b6` | Verified | GitHub Actions 37708116722, 103 tests, 72 browser assertions, ready preview |
| Prior exact PDF+multi-document head `07792dd1` | Verified | GitHub Actions 37710478104: 109 tests passed, 93 browser assertions, 12 screenshots; real PDF.js binary text extraction passed |
| Current HEAD TypeScript, test, preview | Implemented, unverified | **Always verify the actual new HEAD** after new commits; never carry over prior CI as evidence |
| Multi-document composer | Implemented, unverified | Four TXT/MD/CSV/JSON/DOCX/PDF files per message and one image; pending selected-file tray and source viewer in `noata-ai-client.tsx` |
| Text / Markdown / CSV / JSON parsing | Verified | Unit tests validate extraction bounds and inclusion in AI context |
| DOCX paragraph/heading/table extraction | Verified | OOXML ZIP tests and real DOCX readback tests |
| PDF page-aware text ingestion | Verified | PDF.js 5.4.394 test decoded a real generated PDF binary; bounded pages/bytes and source-page labels |
| Scanned PDF OCR | Blocked | No approved OCR provider/service or isolated staging validation; scanned-only PDFs show an explicit unsupported error |
| XLSX/PPTX document ingestion | Not started | Not present in picker; no false support claims |
| Multi-document source citation labels | Verified | Tests exercise separate text/DOCX sources and total context budget; language-model **citation fidelity** not authenticated E2E tested |
| Client-side file previews | Implemented, unverified | Message-specific extracted source preview UI; signed images supported; original PDF/DOCX raw files not retained |
| Original private document retention/download | Not started | Current Supabase Storage bucket only allows images/audio; text/PDF/DOCX extraction occurs browser-side, excerpts are persisted in RLS-protected message metadata |
| Generated Arabic DOCX | Verified | Real ZIP/OOXML output tests and archive integrity checks; complex layouts require further QA |
| Native Arabic PDF generation | Not started | Writing Studio offers browser print-to-PDF, not an automatic native PDF file renderer |
| Streamed chat & model Auto routing | Implemented, unverified | Edge Function has real per-request routing and streaming support; authenticated current-preview model/provider E2E not run |
| Fanar model catalog | Verified | Deployed `noata-ai-v2` source matched repository, unit tests check configured picker IDs; provider health per model not certified |
| Fanar tools, STT, TTS, vision | Implemented, unverified | Backend routes exist; each live authenticated capability requires separate positive/negative QA |
| Six education workflows | Verified | Unit tests validate constrained grounded Arabic prompt templates; real scored educational outcomes remain to be tested |
| Open WebUI-derived chat controls | Implemented, unverified | Previous workspace work; full keyboard/mobile/accessibility acceptance outstanding |
| Quran source API | Verified | Preview returned 114 Surahs, Al-Fatihah text and audio URLs, search results; canonical text sourced separately from AI |
| Quran bookmarks/navigation/search/size | Verified | Headless Chrome interactions executed with explicit **test-only fixture**, not provider-backed live session |
| Quran live recitation & audio lifecycle | Implemented, unverified | Audio elements and cleanup exist; actual playback/rights audit pending |
| Learning homepage & routes | Implemented, unverified | Existing modules; full route-specific redesign and authenticated acceptance pending |
| Progress page redesign | Implemented, unverified | Real skill evidence, review-first actions, filtering, accessible meters, error/empty states; requires exact-head CI and authenticated visual test |
| Full 320/390/768/1024/1440/1920 responsive checks | Verified | Previous PDF candidate CI produced 12 screenshots and 93 assertions; newest changes must rerun |
| WCAG 2.2 AA audit | Not started | Automation catches some keyboard/overflow issues, not a complete screen-reader/color-contrast evaluation |
| Performance measurements & budgets | Not started | Build and smoke checks are not substitutes for Core Web Vitals field data |
| Authenticated staging E2E | Blocked | Separate Supabase staging project, authorized disposable accounts and protected preview browser access required; opt-in test runner exists but not executed |
| Cross-user storage/RLS/role access | Implemented, unverified | Existing RLS infrastructure; latest branch needs complete isolated cross-account verification |
| Production release | Blocked | Explicit user instruction forbids merge, production alias modification or destructive production DB updates |

## Phase 4 implementation inventory

- `apps/web/lib/ai/pdf-ingest.ts`, `pdf-ingest.test.ts`: page-aware PDF.js extraction, size/page ceilings, scanned-page disclosure.
- `apps/web/lib/ai/multi-document.ts`, `multi-document.test.ts`: per-file source labels, filename sanitation, mixed TXT/DOCX/PDF extraction, bounded metadata.
- `apps/web/lib/ai/context-budget.ts`: 48K total chat context with actual file excerpts and source separation.
- `apps/web/components/ai/use-ai-workspace.ts`: multi-file staging, error handling and persistence.
- `apps/web/components/ai/noata-ai-client.tsx`, `document-sources-message.tsx`, `apps/web/app/globals.css`: pending-file UI, file-specific previews, responsive layout.
- `apps/web/components/progress/progress-live.tsx`: purpose-built skill mastery explorer and relevant review actions.
- `scripts/browser-aura-smoke.mjs`: 6 viewport widths, light/dark captures and fixture-driven Quran UI tests.
- `apps/web/package.json`, `pnpm-lock.yaml`: pinned Mozilla PDF.js dependency.

## Remaining Phase 4 engineering milestones

1. Fully automated authenticated QA on **isolated** staging accounts, including real Fanar responses, image understanding and audio lifecycle.
2. OCR provider authorization and scanned-page extraction pipeline, with provenance and explicit user consent where needed.
3. Safe original-document retention and downloads using owner-scoped Storage rules and expiry/lifecycle validation, in a reviewed migration applied to staging first.
4. Professional PDF generation with embedded Arabic fonts and actual visual rendering tests.
5. XLSX and presentation parser support if warranted by product requirements, independent of text/PDF/DOCX.
6. Deep route-specific UX and accessibility reviews for every page and nested workflow, including responsive screenshots and verified interaction behavior.
7. Evidence-based model/provider health and graceful fallback policies, after authorized provider E2E.
8. Security/performance release audit, separate approval gate, and protected production rollback contract.

No capability is considered “Verified” based solely on a successful TypeScript build.
