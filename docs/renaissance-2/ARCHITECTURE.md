# Renaissance 2.0 — Current Architecture and Next Boundaries

## Present AI path

Next.js React workspace → authenticated Supabase client → `noata-ai` Edge Function → Fanar model routing / optional Brave Search → SSE response and validated UI metadata → Supabase conversation persistence.

## Added suggestion path

1. Authenticated browser invokes Edge action `suggestions`.
2. Backend rate-limits and restricts optional recent-chat context to owner-scoped conversation titles only.
3. Fanar returns JSON, parsed by strict validator.
4. Four local fallback starters render instantly. Valid generated starters are cached per account/locale in sessionStorage with a 20-minute freshness window.
5. Follow-ups appear only when a completed assistant message has a valid provider result; failures stay hidden without invented AI content.

Personalized recent-chat titles are explicitly opt-in, device-scoped, and disabled in temporary chats. This is **not yet a full Noata Memory implementation**.

## Research path

Brave Search result → sanitized source normalization → actual search stages and query metadata → persisted assistant message → collapsible source/activity display.

## Architectural next steps

- Separate provider adapters from tool orchestration.
- Implement user-owned memory with explicit consent and verifiable deletion.
- Implement secure artifact jobs and real format validation.
- Replace lengthy AI client component incrementally without losing RLS and session isolation.
- Add authenticated staging browser and live-provider acceptance coverage.
