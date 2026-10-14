# Noata Aura — AI Design Studio staging acceptance

**Scope:** branch `noata-aura-platform-overhaul-20261008` / Draft PR #3; Supabase staging `vpfpjvhafkmygetjkfcp`. No production schema change was requested.

The additive migration `noata_user_theme_design_studio` was applied to staging and verified. The source SQL is recorded at `supabase/migrations/20261009225000_noata_user_theme_design_studio.sql` for future environments; it is idempotent for an already-applied table/policy.

## Architecture

- Fanar integration: authenticated existing `noata-ai-v2` Edge Function chat request with explicit bounded design prompt. No fake AI-generated color suggestion, and any provider failure is displayed.
- Model output: parsed JSON with name, description, three HEX colors. Validate size and WCAG contrast. Free-form HTML/CSS/JS is never applied.
- Preview: root-scoped CSS tokens only, visually reversible without server writes. Cancel or leave studio to restore prior theme. Users explicitly approve a design before storing.
- Persistence: 8 maximum saved designs per account, owner-only Row Level Security for read/create/update/delete; `user_settings.active_design_id` stores the active account design.
- Selector: visible saved designs appear beneath built-in themes; built-in palette selection clears active custom id; Midnight always resolves dark irrespective of requested light mode.
- Editing: edit an existing account-owned design via a further Fanar request; selecting/hiding/deleting requires an actual confirmed Supabase mutation.
- Account isolation: no palette rows queried or written without an authenticated user; user IDs enforced by database policies. No raw student content in URL.

## Verification gates not yet certified

1. Authenticate against staging with authorized Student A; create a theme via a genuinely successful Fanar response and confirm the database insert and account activation.
2. Use Student B and prove it cannot access Student A's design by direct fetch/update/deletion attempt; verify RLS.
3. Test saved-theme selection across two browsers, and Midnight + light preference, plus light/dark/system separately.
4. Verify browser screenshot and keyboard, screen reader, touch, RTL/LTR, 320–1920 widths, reduced motion, WCAG 2.2 AA contrast and SVG recoloring.
5. Ensure the exact GitHub HEAD workflows are green; Vercel preview must resolve to that HEAD before release. Protect production and keep PR #3 Draft.

**Current status:** database schema and code exist, but the real Fanar design generation/account crossover scenarios above are not proven; do not label this release-ready.
