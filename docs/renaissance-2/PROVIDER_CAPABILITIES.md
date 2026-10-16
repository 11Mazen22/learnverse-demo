# Renaissance 2.0 — Provider and Feature Readiness

## Live deployment parity snapshot (2026-10-16)

- Web production revision: `0acc764361be456f3ee53b2138cab319cf24ef99`.
- Production Edge Function `noata-ai-v2`: ACTIVE version 10; `verify_jwt=true`; bundle hash `9de6a245650addf6cd8c04b3c5cd6acadc1e02f080b9ff2eb4c024e082a6ea3e`.
- Staging `noata-ai-v2`: ACTIVE version 41 with the same bundle hash.
- All 23 files in the deployed function match tracked source in `supabase/functions/noata-ai/`. The synchronized registry explicitly marks `image.inpaint` and `image.background_remove` as planned, `document.pdf.page_edit` as local native page operations, and `document.office.targeted_edit` as a limited local operation.
- Code/source parity does **not** prove credential readiness or successful provider inference. No authenticated readiness action or paid-provider request was made; real Fanar/Brave/STT/TTS acceptance remains open.


| Capability | Code integration | Current accepted state |
|---|---|---|
| Fanar chat / response review | Server-side Edge Function, SSE and JSON fallback, bounded content, completion validation | **Live provider E2E unverified**; authorized staging request required |
| Brave Search | Fixed-endpoint adapter, bounded research plan, source/activity UI | **Live results/metadata unverified** |
| Fanar image generation/editing | Existing image generation and manual image operations | **Basic code exists; live provider E2E and generative inpainting/background removal unverified** |
| Fanar STT/TTS | Existing handlers and client voice controls | **Live authenticated audio round-trip unverified** |
| Memory | Optional consent, owner-scoped manual CRUD, temporary-chat exclusion, JSON export | **Implementation + regression coverage exist; full authenticated ownership/retention E2E remains open** |
| PDF | Export, extraction, reorder/rotation, native page operations for scanned PDFs | **Partial**; arbitrary PDF text/layout replacement remains unsupported |
| DOCX/XLSX/PPTX | Generators, targeted OOXML editing for supported package structures, preflight validation | **Partial**; unsupported OOXML shapes and end-user fidelity need fixture-based acceptance |
| Writing Studio / artifacts | Editor/revision surfaces, artifact receipts and owner-scoped storage | **Partial**; universal artifact pipeline and complete fidelity acceptance remain open |
| Durable background tasks | No verified universal persistent task engine | **Not implemented / unverified** |
| Connected app actions | No complete external read/write action integration verified | **Not implemented / unverified** |
| AI Projects | Project/file library surface exists | **Partial**; full lifecycle/retention/authenticated workflow acceptance remains open |

Provider keys must remain in secure environment settings. No paid service or provider activation has been authorized. A build, key-presence check, mocked request or ready deployment is not proof of real provider success.
