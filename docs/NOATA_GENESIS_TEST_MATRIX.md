# Genesis acceptance matrix

Evidence refreshed 2026-10-15 03:30–03:32 UTC for candidate `9d12cfd78aa2f6e6f24dd5a3d931e660aeb06c29` on `noata-genesis-capabilities-20261015`. Production was not changed. CI and live checks are reported separately.

| Area | Result | Actual evidence / remaining gate |
|---|---|---|
| Preview identity and isolation | PASS | Vercel project `noata`; READY branch deployment `dpl_DoYdFrEFRTH28JwCc6GnFc5JXD6Q`, alias `noata-git-noata-genesis-capabilities-20261015-noata.vercel.app`, branch and commit match this candidate. Preview `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` resolve to Staging `vpfpjvhafkmygetjkfcp`; neither resolves to Production `jdkfqdzgphzqbbzmerzr`. Both variables are scoped to this Preview branch. `/health` returned the exact candidate revision at 2026-10-15 03:30:08 UTC. |
| Callable Staging Edge Function | PASS | Preview configuration selects `noata-ai-v2`. Staging function v38 is ACTIVE with JWT verification enabled and bundle hash `72b499fe70de74b026c59651b7a957e6cc41c1fa90080ecaab29939659e32995`; all 23 files returned by Supabase match candidate source after line-ending normalization. `deno.lock` was not returned by the function-source API and is not counted as runtime evidence. |
| Baseline modern tests | PASS | 383/383, no skips |
| Candidate modern tests | PASS | 408 tests on exact source `9d12cfd78aa2f6e6f24dd5a3d931e660aeb06c29`, pull-request CI run [38672293164](https://github.com/11Mazen22/learnverse-demo/actions/runs/38672293164), workflow run #1254, Success, 5m 54s |
| Multi-format research-to-file conversion | PASS | Additional formats reuse the first answer, preserve citation IDs/caveats, and make an explicit no-search request; XLSX conversion must not invent values. Covered by the 408-test CI suite |
| Large private-library project lists | PASS for bounded paging | Stable, ordered 24-row project pages, de-duplicated append, load-more state, removal of the former 50-project creation cap; shared page traversal tests plus exact-head TypeScript/build/CI pass. No large live-account dataset was queried |
| TypeScript, Deno and text integrity | PASS | Exact-head CI `38672293164` completed text integrity, workspace TypeScript and Deno handler checks |
| Production build | PASS | Exact-head CI `38672293164` completed the production build successfully |
| Research provider adapter | PASS with deterministic responses | Fixed endpoint, missing/disabled/unknown config, authority suffix attack, scope retention, per-call quota, partial failure, cancellation and source allowlist |
| Staging Brave-secret presence | BLOCKED | The connected Supabase tools expose no Edge Function secret-list operation. The key was not retrieved, printed or changed. Vercel Preview variables do not establish Edge Function secret presence. |
| Official NASA current sources | BLOCKED | No authenticated QA session was available, and Staging Brave configuration presence could not be checked. No real Brave request occurred; no current NASA sources or citations were reviewed. |
| Citation fidelity | PARTIAL | Unknown ID/destination checks and syntactic claim provenance pass. Human/real-provider semantic entailment not accepted |
| Research to PDF/DOCX/XLSX/PPTX | PARTIAL | Real local Office ZIP/readback tests preserve bibliography records; deployed authenticated full workflow unavailable |
| DOCX/PPTX/XLSX targeted edits | PASS for bounded fixtures | Independent ZIP/CRC/XML checks and identical untouched compressed records, including synthetic reference files authored by python-docx/openpyxl/python-pptx |
| Office visual layout/recalculation | BLOCKED | No actual Word/PowerPoint/Excel GUI acceptance; changed paragraphs can overflow, numeric formula caches require recalculation |
| PDF page order/rotation | PASS for bounded fixtures | Original page resources/content references/sizes/metadata retained; actual Poppler unchanged-page raster is identical |
| PDF arbitrary text/layout editing | NOT IMPLEMENTED | No general arbitrary-PDF edit, merge/split/redaction guarantee |
| Actual original-package browser interaction | BLOCKED locally | Browser suite now captures and reopens the real downloaded DOCX and checks 1440/390/320 layouts; runtime cannot start reachable Next/Chrome sockets |
| Local Chrome/PDF browser rendering | BLOCKED locally | Chrome process-singleton socket denied with EPERM; Next reports uv_interface_addresses system error. No passing browser claim |
| Full Deno handler check | PASS | Fresh npm fetch was refused; the full handler then passed using installed pinned SDK dependencies with `--node-modules-dir=manual` |
| Aggregate legacy suite | PASS in exact-head CI | Run `38672293164` completed the aggregate suite. An earlier local-runtime process-group failure did not recur in the supported CI runner. |
| QA preflight and dedicated identities | BLOCKED | Preview `/api/qa-target` returned 404 `{"enabled":false}`. The branch-only `NOATA_STAGING_QA_ENABLED` setting is false. No authenticated Noata QA session was available and no account was created or used in this run. |
| Authenticated cross-account isolation | BLOCKED | Requires two dedicated Staging identities and real sessions. Project listing/assignment/revision, download, cross-owner reads, and unauthorized updates/deletes were not sent. Existing fixtures are not runtime authorization evidence. |
| Private document storage in Preview | BLOCKED | `/api/documents?capabilities=1` returned `{"retention":false,"library":true}`; `NOATA_DOCUMENT_STORAGE_ENABLED` is false for this Preview branch. Upload/download and cross-account Storage tests were not run. |
| Auth/Google OAuth/mail delivery/roles/classroom/rewards | BLOCKED | Dedicated authenticated role identities and provider/mailbox acceptance were not executed; no production test fixtures |
| Generative images | PARTIAL / editing BLOCKED | Existing generation/manual transforms preserved. Current Fanar schema has no edit endpoint; no image provider acceptance performed |
| Database backup/restore rehearsal | PARTIAL | Existing private recovery reports record 71 tables/530 rows restored, 71 table-data byte matches, zero data mismatches, and a fresh native-archive restore pass. The encrypted archive's actual SHA-256 matches its manifest. Report records 14 migrations, while Production/local ICU versions differ (`153.121` vs `153.14`); exact hosted collation equivalence remains unresolved. See `NOATA_GENESIS_RECOVERY.md`. |
| Private Storage-byte recovery | BLOCKED | Existing reports still mark binary Storage backup `pending`; four private objects previously identified as missing have no verified byte backups/checksums. Hosted Auth/Storage service restoration is not covered by the local database rehearsal. |
| Production acceptance/release | NOT PERFORMED | No production migration, function deploy, secret change or promotion |

Required live scenarios A–J from the brief remain tracked: A/B/C require real current search; D/F are bounded original-package edits only; E requires a supported generative editor; G requires real Arabic provider/PDF execution; H requires disposable roles; I has deterministic failure/partial-recovery coverage; J still requires live cross-owner denial tests.

## Historical CI result before the current exact-head run


Exact latest head `33d06a9466a898eeb4532c4e13acbf1d3c98a4c5` passed CI run `38671603459`: 408 modern tests, typecheck, Deno, build, 125 local PostgreSQL authorization assertions, recovery fixtures, Arabic PDF/DOCX, image-edit PNG readback, 1,304 public-browser assertions across 301 screenshots, Production HTTP smoke, and the aggregate legacy suite. CI fixtures are not the blocked live SQL acceptance, authenticated account/provider acceptance, or a Production recovery rehearsal.

## Current exact-head CI evidence

Run [38672293164](https://github.com/11Mazen22/learnverse-demo/actions/runs/38672293164) completed successfully on `9d12cfd78aa2f6e6f24dd5a3d931e660aeb06c29`: 408 modern tests, TypeScript, Deno, production build, 125 local PostgreSQL authorization assertions, recovery fixtures, Arabic PDF/DOCX roundtrips, image-edit PNG readback, 1,304 browser assertions across 301 screenshots, Production HTTP smoke, and the aggregate legacy suite. Release-evidence artifact SHA-256: `f06162ad2b13690a46a374eeaf2341e73d1ffd057590ef15a1f74cb7a80d9356`. CI fixtures do not replace live provider, authenticated account, SQL acceptance, private Storage-byte backup, or hosted-service recovery checks.

The direct live SQL acceptance call was not completed after the automatic approval review hit a usage limit. It was not retried through another path. PR #15 remains Draft until all essential live gates pass.
