# Noata launch checklist

Production application URL: https://noata.enterpriseworkhub.online

## Current automated state

- Supabase project: active and healthy
- Database migrations: applied
- Row Level Security: enabled on all product tables
- Supabase Security Advisor: zero findings
- `noata-ai` Edge Function: ACTIVE, JWT verification enabled
- Demo curriculum: seeded as explicitly non-official demonstration content
- Hidden answer keys: isolated in staff-only table
- GitHub CI: TypeScript, Deno, Next production build, legacy regression suite
- Fanar capability router: all 17 known capabilities represented
- Noata AI: chat history, files, vision, STT, TTS, images, translation, Diwan, Guard, Sadiq specialist tools

## One-time Supabase dashboard configuration

### 1. Fanar secret

Never put the Fanar key in browser code or GitHub.

Supabase Dashboard -> Project Settings / Edge Functions -> Secrets

Create:

- FANAR_API_KEY = the newly rotated Fanar API key

The function already defaults FANAR_BASE_URL to https://api.fanar.qa/v1.

### 2. Auth URL configuration

Supabase Dashboard -> Authentication -> URL Configuration

Set:

- Site URL: https://noata.enterpriseworkhub.online
- Redirect URL: https://noata.enterpriseworkhub.online/**
Keep localhost redirect URLs only for development.

## Frontend deployment

Deploy GitHub repository `11Mazen22/learnverse-demo` from branch `noata-v1-rebuild`.

Recommended Vercel monorepo settings:

- Repository: 11Mazen22/learnverse-demo
- Production branch: noata-v1-rebuild
- Framework Preset: Next.js
- Root Directory: apps/web
- Install Command: pnpm install
- Build Command: next build
- Output Directory: .next
- Node.js: 24.x
- Production domain: noata.enterpriseworkhub.online

The repository is a pnpm workspace, so Vercel should keep monorepo dependency access enabled when apps/web is selected as the project Root Directory.

The browser-safe Supabase URL/publishable key are already bound in the source as safe fallbacks. No service-role or Fanar secret belongs in frontend hosting.

## Domain

At the frontend hosting provider:

1. Add noata.enterpriseworkhub.online
2. Copy the DNS records the provider gives you into the domain DNS manager
3. Wait for SSL to become active
4. Recheck Supabase Auth URL configuration against the final hostname

## First real account

1. Sign up through /login.
2. Confirm email if email confirmation is enabled.
3. Verify a row appears in public.profiles with role=student.
4. Do not allow the browser to assign teacher/admin roles.
5. Promote the intended owner/admin directly in the database only after the real account exists.

## Automated deployment smoke

CI starts the built Next.js production server and verifies:
- /health returns ok=true
- /, /learn, /ai, /login, /privacy and /terms return successfully
- X-Frame-Options is DENY
- X-Content-Type-Options is nosniff

## Production smoke test

- https://noata.enterpriseworkhub.online/health returns ok=true
- Public course loads while signed out
- Draft content is hidden while signed out
- Question answer keys cannot be selected as anon/student
- Sign-up creates profile
- Mission submission grades through RPC
- Wrong answer can rotate to a reviewed parallel variant
- Correct first answer grants XP only once
- Lesson completion grants one-time XP/Coins
- Shop purchase is idempotent and cannot create negative balance
- Progress/mastery updates
- AI conversation persists
- Fanar output contains no internal Quran/thinking tags
- Image attachment reaches vision
- STT, TTS, generated image, translation, Guard, Diwan and Sadiq tools work
- Teacher/Admin routes reject a student account
- Mobile RTL and desktop layouts are checked
