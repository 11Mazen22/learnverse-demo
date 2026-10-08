# Noata Aura — Phase 5 Implementation & Verification Matrix

Baseline: `6399773` on `noata-aura-platform-overhaul-20261008`, draft PR #3. GitHub Actions run 37711248460 ("Noata CI") succeeded for that exact SHA. Vercel status on that SHA: **failure — "Deployment rate limited — retry in 24 hours."** (external quota; no preview exists for later commits).

**Allowed states:** Not started / Implemented, unverified / Verified / Blocked / Failed.
A passing build never counts as verification of behaviour. CI success is not deployment readiness.

## Milestone 1 — Native Arabic PDF generation

| Area | State | Evidence and qualification |
| --- | --- | --- |
| Arabic PDF generator (`apps/web/lib/pdf/arabic-pdf.ts`) | Verified (local) | 9 new unit tests; fixture `docs/evidence/phase5/arabic-pdf-fixture.pdf` (4 pages) rasterized and inspected page by page: joined letters, RTL order, mixed Arabic/English, tables with repeated header row, lists, quote, code, math, header/footer, `صفحة ٢ من ٤` |
| Embedded fonts | Verified | Cairo 400/700 (OFL) plus Noto Sans Math, subset-embedded as CID TrueType (`pdffonts`: emb yes, sub yes, uni yes) |
| Text extraction fidelity | Verified (PDF.js, Poppler) | Own CID-per-glyph-cluster encoding fixes ToUnicode; PDF.js (the product's ingester `extractPdfDocument`) returns correct logical Arabic incl. lam-alef, Allah, hamza forms, Arabic-Indic digits and Latin words. pypdf returns visual-order glyphs, a known property of all visually-ordered RTL PDFs |
| Authenticated download route `/api/pdf` | Implemented, unverified | Unauthenticated → 401 and wrong content type → 415 verified against `next start`; authenticated generation through the route not run (no staging credentials) |
| Writing Studio "PDF عربي" button | Implemented, unverified | Wired to `/api/pdf`; browser click-through awaits authenticated staging |
| Known limits | Documented | No kashida justification (ragged right), no images, math is Unicode rendering of common LaTeX, 120k characters / 120 pages max |

## Carried over from Phase 4 (unchanged until re-verified on a newer SHA)

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

