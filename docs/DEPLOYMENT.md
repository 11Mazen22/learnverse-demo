# Candidate deployment

Project: noata, prj_UwZa56LUkn8ELou8gWfEd6B371RM, team_JAfADczhFscVrYQAPyLi41SS. Web root: apps/web. Node 24. Branch: noata-v2-total-redesign. Use a Preview target; do not move the production domain during validation.

1. Install with pnpm 10.17.1 and the committed lockfile.
2. Run pnpm typecheck, pnpm modern:test, Deno check, pnpm build and pnpm legacy:check.
3. Apply only reviewed additive migrations. Receipt and admin usage migrations were already applied to jdkfqdzgphzqbbzmerzr; do not recreate them under different names.
4. Deploy supabase/functions/noata-ai as the explicit candidate name noata-ai-v2 with verify_jwt=true. Keep noata-ai intact.
5. Build a Vercel preview from the exact branch commit. Verify environment scope, build logs, /health, security headers, auth redirect allowlist, and TESTING.md. apps/web/vercel.json pins the build command so the PDF.js worker is generated before `next build`; the Vercel dashboard build command runs `next build` directly and would otherwise skip the package pre-build script.
6. Complete live provider and browser matrix before promotion. A green build is insufficient.

Deployment Protection remains enabled. Use the connected Vercel protected-fetch capability or an authorized short-lived access path. Do not expose bypass links/tokens in git or disable protection for convenience.

## Production promotion and the live domain

The live site is `https://noata.enterpriseworkhub.online` (DNS on Cloudflare, domain assigned to the Vercel project `noata`). A push to `master` creates a Vercel production deployment, but a deployment is **not** the live site until it is promoted and the custom domain points at it. A merge that only builds is invisible to customers, so promotion is a required step, not an optional one.

- Verify the live domain against the merge commit: `node scripts/verify-production.mjs <sha>`. The same check runs in CI on every push to `master` (`production-revision` job) and fails when the live domain still serves an older build.
- Promote the newest production deployment: `npx vercel promote <deployment-url> --scope noata`.
- The project setting `autoAssignCustomDomains` must stay enabled so new production deployments receive the custom domain automatically. It was off on 2026-10-20, which is why merges appeared to have no effect.
- Do not verify a release against a deployment URL such as `noata-<hash>-noata.vercel.app`. That URL always serves the newest build, even when the live domain is stale. Verify `https://noata.enterpriseworkhub.online/health` and read its `revision`.
