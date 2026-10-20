# Noata AI architecture

Browser session → JWT-protected noata-ai-v2 → user validation → request receipt → quota/router → Fanar → sanitized SSE/JSON → browser → owner-scoped messages.

The original deployed noata-ai remains the production fallback. The branch defaults NEXT_PUBLIC_NOATA_AI_FUNCTION to noata-ai-v2; an environment override can select the legacy function. No Fanar or service-role key belongs in NEXT_PUBLIC variables.

UI modules: noata-ai-client (view), use-ai-workspace (state and orchestration), conversation-history, rich-message. Shared protocol helpers and attachment validation live in lib/ai/workspace.ts. The server remains supabase/functions/noata-ai/index.ts and is deployed under the candidate name explicitly.

A per-client mutex prevents duplicate clicks. Durable service-only receipts bind (user, request UUID) to a SHA256 payload hash, return completed cached JSON, reject conflicting/pending/failed reuse, and retain failed states. Manual retry is a new inference request and may consume quota. Interrupted streams preserve visible partial text but do not claim it was saved. Completion persistence failures show an explicit copy-before-leaving notice.

Images and audio use private buckets with user-ID path prefixes, bounded upload types and size, and short-lived signed URLs. Generated image metadata carries the private path so history reopening refreshes access. Temporary chats skip ai_conversations/ai_messages, but request receipts and stored media remain; see privacy page.

Provider markup sanitization strips hidden reasoning content and internal wrappers before display. ReactMarkdown disables raw HTML. Code highlighting and KaTeX do not execute model-generated JavaScript.

Streaming stop cancels the chat fetch; specialized JSON operations may continue server-side after the client aborts. Receipt cleanup is opportunistic. These limits are not a guarantee of immediate provider cancellation or scheduled retention.

## Designed documents

A PDF request is a two-step flow. The chat turn answers with a short design brief; a separate `action:"document"` inference writes the file itself as a designed source: `---noata` front matter (title, language, theme) plus a Markdown body with allowlisted blocks, a cover, contents and citations. The renderer prints the cover and the body separately, merges them with pdf-lib, and refuses to emit a PDF whose fonts failed to load. Legacy Markdown PDFs keep their title, so an H1-only draft never renders empty. Editing a designed file reuses its original front matter, and a research revision appends only the sources the document does not already cite.

## Search providers

Live web search is LangSearch when `LANGSEARCH_API_KEY` is available. The key is read through `public.noata_provider_secret(text)`, which only the service role may execute, and an environment variable wins over the stored secret. `NOATA_SEARCH_PROVIDER` selects a provider explicitly and fails closed for an unknown value; `NOATA_SEARCH_ENABLED=false` disables search entirely. Brave remains the configured fallback. Provider responses are bounded, redirects are refused, and every source is treated as untrusted evidence.

## PDF preview assets

The studio renders PDFs with PDF.js. The worker is generated from the installed `pdfjs-dist` build into `apps/web/public/pdf/pdf.worker.min.mjs` by `predev` and `prebuild` and served as a same-origin static asset; the file is generated and never committed. A failed worker load retries once from an in-memory module worker before the studio shows an explicit error with a retry action.
