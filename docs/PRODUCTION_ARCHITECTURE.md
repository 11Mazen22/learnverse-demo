# Noata production architecture

## Product direction

Noata is an Arabic-first, bilingual, AI-native gamified learning platform. The existing MVP domain rules are preserved as proven product logic while the runtime architecture moves away from a single-process JSON store and demo authentication.

## Stack

- Web/PWA: Next.js 16.4 + React 19.3 + TypeScript
- Styling: Tailwind CSS 4.3 + Noata design tokens
- Data/Auth/Storage/Realtime: Supabase
- AI server boundary: Supabase Edge Functions
- AI provider: Fanar
- Source/CI: GitHub
- Domain target: noata.enterpriseworkhub.online

## Product surfaces

Student:
- dashboard
- curriculum map
- adaptive missions
- lesson player
- Unit Boss
- review queue
- progress/mastery
- rewards/character/shop
- Noata AI

Teacher:
- classes
- mastery heatmaps
- assignments
- intervention insights
- content feedback

Admin:
- content studio
- review/publish workflow
- user/role operations
- economy configuration
- audit/events

## AI architecture

Client -> authenticated Noata Edge Function -> policy/context router -> Fanar capability -> sanitizer -> persistence -> client.

The Fanar key is never shipped to the browser.

### Capability routing

General chat uses Fanar, low-latency flows use Fanar-S-1-7B, reasoning uses C models, Islamic questions use Sadiq, image understanding uses Oryx IVU, image generation uses Oryx IG, speech uses Aura/Sadiq TTS/STT, safety uses Guard, translation uses Shaheen and poetry uses Diwan.

### Output hygiene

Every generated text path removes provider control markers such as quran/hadith wrapper tags and hidden reasoning tags before content reaches a learner. Quran/Hadith wrappers are converted into readable quotations instead of raw XML-like markup.

## Learning invariants migrated from the MVP

- mastery is separate from XP/Coins
- assisted answers receive discounted evidence
- review scheduling is evidence-driven
- retries prefer reviewed parallel variants
- Unit Boss is escalating and recoverable
- XP is non-spendable
- Coins use append-only ledger semantics
- purchase/reward effects must be idempotent
- assessment policy can disable answer-giving AI help
- content review status is separate from publication status
- AI never writes mastery, scores, or wallets directly

## Security baseline

- Supabase Auth, secure sessions and RLS
- no service-role token in browser
- Edge Function authentication required
- all student-owned rows scoped to auth.uid()
- server-enforced idempotency
- storage access policies
- AI rate limits and quota-aware routing
- audit events for privileged content/admin actions
- no hidden reasoning exposed to users

## Migration strategy

The master branch remains the historical demonstration MVP. The noata-v1-rebuild branch is the production rewrite. Domain rules and tests are migrated deliberately; UI/runtime demo shortcuts are not.
