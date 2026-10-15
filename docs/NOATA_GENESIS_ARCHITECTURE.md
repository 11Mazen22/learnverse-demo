# Genesis implemented architecture

## Request and evidence flow

The existing authenticated Supabase Edge Function remains the AI entry point. Its request receipts, quotas, conversation/memory ownership and Fanar model selection remain in use. This change does not replace it with a new SDK or introduce another model provider.

`research-policy.ts` derives source-domain, official-source, time-window and deep-request constraints from the human request before model-assisted query rewriting. Explicit source URLs become search scope, never fetch destinations. Official NASA requests accept only `nasa.gov` and its subdomains. Other named authorities without a supplied domain are not automatically attested as official.

`search-provider.ts` encapsulates the existing fixed Brave LLM Context POST endpoint. `NOATA_SEARCH_PROVIDER=brave` is the only supported live provider. Disabled/unknown providers or missing credentials fail closed. It bounds time, JSON bytes and redirects. `research.ts` coordinates up to three sequential query variants only when explicitly configured and requested. Default: one call. Each actual call claims the existing user quota. Ambiguous failed calls are not retried. A later failure retains earlier evidence and marks the result partial.

Source records carry stable request-local IDs, actual URLs, derived domains, bounded excerpts, retrieval time and publication date only when provided. Query receipts identify actual returned source IDs. Persisted input is reconstructed through an allowlist rather than spreading arbitrary fields into model/UI context. Citation checks reject unknown IDs and unretrieved URL destinations. This is syntactic provenance plus model review, not a proof of semantic entailment or absence of contradictions.

When one request asks for several file formats, the first answer supplies shared content. Each additional format is generated from that answer with a bounded conversion prompt that opts out of another web search and forbids adding facts, values, citations or URLs. This avoids duplicate search quota use and keeps requested outputs aligned; the initial validated research record still supplies citations to each export.

Wikipedia remains an explicitly labelled optional background path for non-current, non-official, non-source-specific requests. It cannot satisfy an official/current research request.

## Artifact paths

Existing PDF/DOCX/XLSX/PPTX generation, private artifact rows, storage paths, version lineage and per-format compensation remain. Actual research references now enter PPTX reference slides and XLSX reference worksheets as well as PDF/DOCX. Eight-sheet workbooks cannot append a ninth reference sheet; their evidence remains in the conversation. This limit is not full export provenance acceptance.

The private library loads projects in stable, bounded pages and exposes a load-more control; the former 50-project creation cap is removed. Project traversal reuses the library's deduplicating page merge and aborts stale requests when the owner or view changes.

Multi-format deliverables beyond the first are reformatted from the shared answer rather than rerunning the original request. Workbook conversions must use only existing values and fail honestly when they cannot produce a useful table without inventing data.

`office-preservation.ts` adds original-package edits for DOCX paragraphs, PPTX paragraphs, and XLSX inline strings/numeric cells. It keeps untouched compressed local ZIP records exactly, rewrites only the selected XML part and updates central-directory offsets/CRCs. Numeric changes also request full workbook recalculation. It never extracts paths to disk, executes macros, fetches relationships or accepts model-authored XML.

The contextual file viewer has a targeted-edit mode with original/replacement text, download and owner-authenticated save. New rows retain parent/source identity. It does not create a competing tools application. Full extracted-content rewriting remains a separate existing mode. Shared-string/formula cells, complex fields, signatures, encryption and unsupported archives fail closed. Changed paragraphs inherit the first run's style; longer text can overflow and requires Office review.

`pdf-page-edit.ts` operates on original PDF page objects using pinned `pdf-lib@1.17.1`. It supports complete page permutations and additional quarter-turn rotation of one original page. No page deletion, redaction, splitting, arbitrary text replacement or merge is claimed. Forms, signatures, encryption and active actions are excluded. Output count, object/content/resource identity and an independent unchanged-page raster comparison are tested.

## Execution boundaries

These are bounded in-request operations, not a universal durable job engine. The existing artifact driver compensates failed storage/row attachment steps; best-effort cleanup is not a distributed transaction. Provider acceptance, authenticated Storage lifecycle, real role isolation and cross-account cancellation require isolated staging identities.

Production remains on the supplied release. Preview branch configuration is pinned to approved staging, with inherited administrator/database credentials blanked and retained-original/QA bootstrap flags disabled. No production schema, secrets, billing or domains change.
