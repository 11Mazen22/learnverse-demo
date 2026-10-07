# Candidate deployment

Project: noata, prj_UwZa56LUkn8ELou8gWfEd6B371RM, team_JAfADczhFscVrYQAPyLi41SS. Web root: apps/web. Node 24. Branch: noata-v2-total-redesign. Use a Preview target; do not move the production domain during validation.

1. Install with pnpm 10.17.1 and the committed lockfile.
2. Run pnpm typecheck, pnpm modern:test, Deno check, pnpm build and pnpm legacy:check.
3. Apply only reviewed additive migrations. Receipt and admin usage migrations were already applied to jdkfqdzgphzqbbzmerzr; do not recreate them under different names.
4. Deploy supabase/functions/noata-ai as the explicit candidate name noata-ai-v2 with verify_jwt=true. Keep noata-ai intact.
5. Build a Vercel preview from the exact branch commit. Verify environment scope, build logs, /health, security headers, auth redirect allowlist, and TESTING.md.
6. Complete live provider and browser matrix before promotion. A green build is insufficient.

Deployment Protection remains enabled. Use the connected Vercel protected-fetch capability or an authorized short-lived access path. Do not expose bypass links/tokens in git or disable protection for convenience.
