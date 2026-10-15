# Genesis acceptance matrix

Baseline `9d5d2a1bd3c3783e1b7b89f85906299651489492`; candidate branch `noata-genesis-capabilities-20261015`. Test logs record the actual command/revision. Local worktree checks are development evidence, not clean committed-candidate CI evidence.

| Area | Result | Actual evidence / remaining gate |
|---|---|---|
| Baseline modern tests | PASS | 383/383, no skips |
| Candidate modern tests | PASS | 408/408 on exact source `33d06a9466a898eeb4532c4e13acbf1d3c98a4c5`, CI run `38671603459` |
| Multi-format research-to-file conversion | PASS | Additional formats reuse the first answer, preserve citation IDs/caveats, and make an explicit no-search request; XLSX conversion must not invent values. Covered by the 408-test CI suite |
| Large private-library project lists | PASS for bounded paging | Stable, ordered 24-row project pages, de-duplicated append, load-more state, removal of the former 50-project creation cap; shared page traversal tests plus exact-head TypeScript/build/CI pass. No large live-account dataset was queried |
| TypeScript and text integrity | PASS | Exact-head CI `38671603459`: text integrity and workspace TypeScript checks passed |
| Production build | PASS | Exact-head CI `38671603459` completed the production build successfully |
| Research provider adapter | PASS with deterministic responses | Fixed endpoint, missing/disabled/unknown config, authority suffix attack, scope retention, per-call quota, partial failure, cancellation and source allowlist |
| Official NASA current sources | BLOCKED | No authorized live Brave execution. No actual search-provider call occurred in these unit cases |
| Citation fidelity | PARTIAL | Unknown ID/destination checks and syntactic claim provenance pass. Human/real-provider semantic entailment not accepted |
| Research to PDF/DOCX/XLSX/PPTX | PARTIAL | Real local Office ZIP/readback tests preserve bibliography records; deployed authenticated full workflow unavailable |
| DOCX/PPTX/XLSX targeted edits | PASS for bounded fixtures | Independent ZIP/CRC/XML checks and identical untouched compressed records, including synthetic reference files authored by python-docx/openpyxl/python-pptx |
| Office visual layout/recalculation | BLOCKED | No actual Word/PowerPoint/Excel GUI acceptance; changed paragraphs can overflow, numeric formula caches require recalculation |
| PDF page order/rotation | PASS for bounded fixtures | Original page resources/content references/sizes/metadata retained; actual Poppler unchanged-page raster is identical |
| PDF arbitrary text/layout editing | NOT IMPLEMENTED | No general arbitrary-PDF edit, merge/split/redaction guarantee |
| Actual original-package browser interaction | BLOCKED locally | Browser suite now captures and reopens the real downloaded DOCX and checks 1440/390/320 layouts; runtime cannot start reachable Next/Chrome sockets |
| Local Chrome/PDF browser rendering | BLOCKED locally | Chrome process-singleton socket denied with EPERM; Next reports uv_interface_addresses system error. No passing browser claim |
| Full Deno handler check | PASS | Fresh npm fetch was refused; the full handler then passed using installed pinned SDK dependencies with `--node-modules-dir=manual` |
| Aggregate legacy suite | FAIL in current runtime | One unchanged `qa-browser.test.mjs` orphan-descendant process-group assertion fails; assertions were not weakened |
| Auth/Google OAuth/mail delivery/roles/classroom/rewards | BLOCKED | Disposable matching staging identities and actual provider/mailbox acceptance not executed; no production test fixtures |
| Generative images | PARTIAL / editing BLOCKED | Existing generation/manual transforms preserved. Current Fanar schema has no edit endpoint; no image provider acceptance performed |
| Real private-object recovery | BLOCKED | Four object byte backups and managed-service restoration are not demonstrated |
| Production acceptance/release | NOT PERFORMED | No production migration, function deploy, secret change or promotion |

Required live scenarios A–J from the brief remain tracked: A/B/C require real current search; D/F are bounded original-package edits only; E requires a supported generative editor; G requires real Arabic provider/PDF execution; H requires disposable roles; I has deterministic failure/partial-recovery coverage; J still requires live cross-owner denial tests.

## First connected CI result and follow-up


Exact latest head `33d06a9466a898eeb4532c4e13acbf1d3c98a4c5` passed CI run `38671603459`: 408 modern tests, typecheck, Deno, build, 125 local PostgreSQL authorization assertions, recovery fixtures, Arabic PDF/DOCX, image-edit PNG readback, 1,304 public-browser assertions across 301 screenshots, Production HTTP smoke, and the aggregate legacy suite. CI fixtures are not the blocked live SQL acceptance, authenticated account/provider acceptance, or a Production recovery rehearsal.
