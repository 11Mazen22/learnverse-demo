# Noata

**Noata** is an Arabic-first, bilingual, AI-native gamified learning platform.

Production target: **https://noata.enterpriseworkhub.online**

The historical JSON/Ollama MVP remains on the `master` branch as a reference. The production rewrite lives on `noata-v1-rebuild`.

## Production stack

- Next.js 16 + React 19 + TypeScript
- Supabase Auth, PostgreSQL, Row Level Security, Storage and Edge Functions
- Fanar AI through a private server-side Edge Function
- GitHub Actions CI
- Arabic-first RTL with English/LTR support
- Progressive Web App support

## Product surfaces

Students:
- dashboard
- curriculum map
- lesson player
- adaptive three-stage Missions
- Unit Boss
- spaced Review Queue
- explainable mastery/progress
- XP, Coins, cosmetics and Mystery Boxes
- assignments and notifications
- profile/settings
- Noata AI

Teachers:
- scoped classes
- student evidence
- assignment workflows
- grading
- intervention insights

Administrators:
- Content Studio
- curriculum authoring
- question review/publish lifecycle
- role management
- audit events

## Noata AI

The browser never receives the Fanar API key.

The flow is:

`Noata web -> authenticated Supabase Edge Function -> policy/quota router -> Fanar -> sanitizer -> Noata`

The AI layer includes general chat, reasoning, Sadiq, vision, TTS, STT, image generation, translation, Guard, Diwan and the specialized Sadiq workflows.

Provider control markup such as `<quran_start>`, `<think>` and generic `*_start/*_end` wrappers is sanitized before learner-facing rendering.

## Learning integrity

Noata treats learning state and rewards as separate systems:

- mastery is evidence-based
- assisted work receives discounted evidence
- practice repeats cannot inflate mastery
- retries prefer reviewed parallel variants
- answer keys are stored separately and hidden by RLS
- XP is non-spendable progress
- Coins are cosmetic currency only
- rewards/purchases are server-side and idempotent
- AI cannot directly write scores, mastery or wallets

## Demo content

The seeded Science material is **original demonstration content only**.

It is not an approved school syllabus and must not be represented as one.

## Local development

Requirements:
- Node.js 24
- pnpm 10.17.1
- Deno 2.x for Edge Function checking

Run:

```bash
pnpm install
pnpm dev
```

The browser-safe Supabase project configuration is already wired into the application. Never place the Fanar API key or a Supabase secret/service key in frontend code.

## Verification

Run the production verification gate:

```bash
pnpm verify
```

CI verifies:
- TypeScript
- modern AI/domain regression tests
- Supabase Edge Function type checking
- Next.js production build
- historical MVP regression tests

## Supabase

All production database changes live in `supabase/migrations/`.

The current project uses RLS on product tables, protected server-side RPCs for scoring/economy, private answer keys, role-scoped teacher/admin policies, and a JWT-protected `noata-ai` Edge Function.

See:
- `docs/PRODUCTION_ARCHITECTURE.md`
- `docs/LAUNCH_CHECKLIST.md`
- `docs/IMPLEMENTATION_STATUS.md`

## Branch policy

- `master`: historical MVP / regression oracle
- `noata-v1-rebuild`: production Noata

Do not merge production changes into `master` until the public deployment has passed final end-to-end QA.
