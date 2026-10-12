# ChatGPT public benchmark and Noata execution evidence

Research date: 2026-10-12. Baseline: `a5c64c4aca453acdd5c900f7f41e9638415f9349`.
Sources below are official public documentation that was searched and opened.
This is a capability comparison and implementation record, not a claim that Noata has ChatGPT's private backend or model weights.

## Capabilities and current Noata boundary

| Public capability / pattern | Source | Noata state and required proof |
|---|---|---|
| Reasoning, context gathering, tools, finished outcomes and iterative feedback | [Use ChatGPT](https://learn.chatgpt.com/docs/use-chatgpt) | Fanar conversation exists; ONE semantic multi-step planner is not yet implemented or evaluated |
| Documents, slides, workbooks and PDFs reviewed with the conversation | [Work with files](https://learn.chatgpt.com/docs/artifacts-viewer) | Four generators and private artifact cards exist; real newly generated file + download + revision tests required |
| Web search with recorded tool activity | [Web search](https://learn.chatgpt.com/docs/web-search) | Brave adapter and background encyclopedia path exist; encyclopedia knowledge is not proof of current web research |
| Image creation and editing from a request/reference | [Image generation](https://learn.chatgpt.com/docs/image-generation) | Fanar image-generation path exists; editing, assured transparency and SVG output need a supported provider/engine and actual validation |
| Spoken interaction that can steer work | [Voice](https://learn.chatgpt.com/docs/features/voice) | Recording, transcription and speech routes exist; this does not establish realtime conversational voice parity |
| Related chats, files, instructions and sources in projects | [Projects](https://learn.chatgpt.com/docs/projects) | Projects/file-library code exists; complete retrieval and two-account privacy acceptance remain open |
| Useful recall across conversations | [Memories](https://learn.chatgpt.com/docs/customization/memories) | Owner-scoped optional memory exists; sensitive profiling is excluded and full cross-account acceptance remains open |
| Charts, diagrams, calculators and simulations that clarify an answer | [Visualizations](https://learn.chatgpt.com/docs/visualizations) | Allowlisted native responses exist; deterministic graph controls had earlier live evidence; other types need generation/interaction tests |
| Plugins, browser/computer actions and scheduled work | [Feature index](https://learn.chatgpt.com/docs/features) | These are separate execution capabilities; they are not operational in Noata merely because a chat model can describe them |
| Validated UI widgets and action events within a conversation | [ChatKit integrations](https://developers.openai.com/api/docs/guides/custom-chatkit) | Noata uses its own typed native registry and SSE; no new ChatKit dependency or provider is introduced |
| Model selects a tool; the application executes it and returns the real result | [Function calling](https://developers.openai.com/api/docs/guides/function-calling) | Current Noata request selection is deterministic; bounded model-assisted selection remains required |

ChatGPT features vary with account, platform, rollout and settings. “Everything ChatGPT can do” is therefore not a fixed universal entitlement.
Inference: reproducing observable interaction patterns is feasible; equivalent model performance requires an actual suitable model/provider, tools, evaluation and access. Visual styling alone cannot establish that equivalence.

## How the public intelligent UI pattern informs this change

[OpenAI's public UI guidelines](https://developers.openai.com/plugins/concepts/ui-guidelines) use lightweight inline surfaces for useful structured results and expanded views for more involved interaction.
They emphasize contextual actions, restrained metadata, limited primary controls and continuity with the conversation.
These are product-design principles, not evidence of ChatGPT's undisclosed implementation.

Noata applies these principles with its original logo, semantic palettes and existing trusted React components:
- A response identifies the actual recognized model instead of showing a raw generic “Model” placeholder.
- Unsupported historical model identifiers do not become a misleading badge.
- A saved file opens its actual preview within the conversation rather than taking over the page with a separate Studio destination.
- Native preview, text editing, original download and revision export/save remain tied to an existing owner-checked artifact.
- The inline preview has no second AI prompt box. “Improve through chat” prepares a bounded revision request in the existing composer for user review.
- Large extracted sources disclose the 14,000-character limit. A reconstructed revision is not described as an in-place layout-preserving edit.
- File operations discard stale UI/download results after owner or artifact changes.
- Artifact reveals are short and finite; system reduced motion and device Off/Reduced settings disable them.

## Evidence and remaining limitations

The prior candidate `a5c64c4` passed both exact-head CI runs and had a READY matching Preview.
Its automated tests included 1,289 browser assertions and actual document readbacks; these are fixture results.
Live browser access recovered in this session and an existing PDF rendered from the authorized private file path.
That historical file had been incorrectly generated from clarification content, already guarded against in `a5c64c4`; existing user files are preserved.

The selected Supabase plugin advertises SQL/project tools but actual calls return MCP “Unknown tool”.
No SQL query executed, no credential was requested, and no database change was made.
This connector failure does not establish that the authorized Staging service itself is down.
Minimum owner action for management work: reconnect the Supabase plugin and reload its authenticated tools; never send passwords in chat.

New candidate CI and live file-generation/revision results must be reported after execution.
Unimplemented semantic planning, multi-file jobs, deeper memory/project retrieval, image editing, successful live search, genuine role/privacy flows and Production recovery remain separate requirements.
PR #3 stays Draft/unmerged. Production and local computer files are outside this remote-only change.

## Live results during this milestone

At `50a5b6f485f25c9651f5c8b4c4026c80b1584ed0`, the real authenticated Preview showed:
- Actual recognized answer model “Fanar”, replacing the raw generic label.
- A historical private PDF fetched and rendered as a native canvas inside the conversation.
- Exactly one chat composer, zero open modal dialogs and zero horizontal page overflow during inline inspection.
- “Improve through chat” populated and focused the existing composer with the extracted source. It did not send a request automatically.
- A fresh English Fanar request produced complete lesson content and a persisted 129 KB artifact named “QA Photosynthesis Study Guide.pdf”.
These results prove this bounded path. They do not establish factual perfection, all formats, semantic orchestration or two-account privacy.

Closing inline inspection left focus on BODY. The follow-up correction returns focus to the preview trigger.

## Additional live Arabic findings and follow-up source corrections

The authenticated `50a5b6f` Preview generated a real Arabic PDF, “مراجعة البناء الضوئي.pdf”, with a one-page joined-Arabic canvas, one composer, no dialog and no horizontal overflow. The actual downloaded bytes were 151,872 bytes with a `%PDF-` signature. The English download was 131,141 bytes with a `%PDF-` signature and a readable name.

The Arabic download filename was percent-encoded by the cross-origin signed download. The artifact card now fetches the owner-checked original bytes through private Storage, validates length/signature and uses the same Blob download as the inline editor. The actual-byte and stale-owner checks remain mandatory. Final live verification is still required.

The generated PDF title incorrectly used the conversation prompt, and its reaction arrow rendered/read back as an unreadable glyph. Source commit `815fbec831d392dc03145255933e0c418a1d0445` uses a sanitized descriptive artifact title, accepts the observed bold-wrapped Markdown heading, rejects request-text filename fallbacks, embeds the existing licensed symbol font and extends actual PDF readback with seven scientific symbols and a no-NUL assertion. Unreadable extracted control bytes are removed from revision prompts with a visible disclosure. Old saved files are preserved.

“Improve through chat” was exercised with the actual Arabic source, explicit science corrections and a request for a new PDF. Fanar produced and saved a separate 162 KB file; the original remained. This establishes a basic reconstruction path, not stable artifact identity/version history or formatting preservation. The provider corrected the chloroplast location but introduced an incorrect expansion of G3P. **Scientific answer accuracy is FAIL for this sample**. This needs model/provider evaluation and grounded response checks; successful file creation does not establish intelligence parity or release readiness.

The keyboard-focus follow-up `d28f05f80ccad0eac281c1507faac565285177b0` passed both source and PR CI. Its exact Preview was not present in the deployment inventory. Automatic approval review rejected the documented Preview request twice over omitted-target environment ambiguity; the owner elected to deploy Preview manually. No Production deployment, merge, database/environment/credential write or paid upgrade was performed.
