# Noata AI architecture

Browser session → JWT-protected noata-ai-v2 → user validation → request receipt → quota/router → Fanar → sanitized SSE/JSON → browser → owner-scoped messages.

The original deployed noata-ai remains the production fallback. The branch defaults NEXT_PUBLIC_NOATA_AI_FUNCTION to noata-ai-v2; an environment override can select the legacy function. No Fanar or service-role key belongs in NEXT_PUBLIC variables.

UI modules: noata-ai-client (view), use-ai-workspace (state and orchestration), conversation-history, rich-message. Shared protocol helpers and attachment validation live in lib/ai/workspace.ts. The server remains supabase/functions/noata-ai/index.ts and is deployed under the candidate name explicitly.

A per-client mutex prevents duplicate clicks. Durable service-only receipts bind (user, request UUID) to a SHA256 payload hash, return completed cached JSON, reject conflicting/pending/failed reuse, and retain failed states. Manual retry is a new inference request and may consume quota. Interrupted streams preserve visible partial text but do not claim it was saved. Completion persistence failures show an explicit copy-before-leaving notice.

Images and audio use private buckets with user-ID path prefixes, bounded upload types and size, and short-lived signed URLs. Generated image metadata carries the private path so history reopening refreshes access. Temporary chats skip ai_conversations/ai_messages, but request receipts and stored media remain; see privacy page.

Provider markup sanitization strips hidden reasoning content and internal wrappers before display. ReactMarkdown disables raw HTML. Code highlighting and KaTeX do not execute model-generated JavaScript.

Streaming stop cancels the chat fetch; specialized JSON operations may continue server-side after the client aborts. Receipt cleanup is opportunistic. These limits are not a guarantee of immediate provider cancellation or scheduled retention.
