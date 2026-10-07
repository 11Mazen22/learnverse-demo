# Environment variables

| Variable | Scope | Purpose |
| --- | --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | Web build | Supabase public project URL |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Web build | Public client key; RLS still required |
| NEXT_PUBLIC_NOATA_AI_FUNCTION | Web build | Candidate defaults to noata-ai-v2; noata-ai for legacy fallback |
| SUPABASE_URL | Edge runtime | Server project URL |
| SUPABASE_SERVICE_ROLE_KEY | Edge secrets only | Quota/receipts/private media operations |
| FANAR_API_KEY | Edge secrets only | Fanar authentication |
| FANAR_BASE_URL | Edge runtime, if configured | Provider endpoint; inspect server constant for fallback |

Never commit .env.local, access/refresh tokens, Vercel protection tokens, service-role or Fanar keys. Public Supabase keys are not privileged server keys. No existing production secret was printed or changed during the rebuild. Auth callback URLs must explicitly include the accepted preview origin before signup/recovery QA.
