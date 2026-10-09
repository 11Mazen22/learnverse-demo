# Noata release reconciliation — 2026-10-10

## Release decision

Production remains blocked. The user has authorized reviewed integration and publication when compatibility, rollback and core real workflows are verified. This checkpoint records a safe staging candidate; it does not declare production acceptance.

Baseline: `a588e6ff9ebc9b60ee6a6d0b2386b53fb1e907dd` on `noata-aura-platform-overhaul-20261008`, PR #3 Draft. Source-push CI [38000721256](https://github.com/11Mazen22/learnverse-demo/actions/runs/38000721256) passed. PR CI [38000726193](https://github.com/11Mazen22/learnverse-demo/actions/runs/38000726193) tested GitHub's separate merge revision `9a2f830dee498535bd29f5d5b08298a0ef256c02`. Do not conflate them.

## Reviewed integration decisions

| Branch / PR | Decision |
| --- | --- |
| `master` (`73a17a1`), `noata-v1-rebuild`, `noata-v2-total-redesign` | Their histories are already ancestors of Aura. Preserve Aura's newer code. |
| PR #5 | Already merged into Aura (`7714d8a`); no second merge needed. |
| PR #6 / `v0/approved-staging-guard` (`22f1359398a8069e21df35009d979b26062b641d`) | Resolve integration selectively: carry dashboard evidence visibility, PWA exclusions/cleanup, palette contrast, mobile-menu fixes, verified nine-reciter full-Surah catalogue, Quran metadata and canonical corpus search. Retain Aura's current Auth, Gems, Design Studio, palette account sync, contextual assistance, branding, five-verse expansion and Sudais verse provider fallback. Native full-Surah controls and the verse player coordinate so only one plays. Keep the current architecture and avoid replacing it with the alternative SWR/EveryAyah implementation. |
| `v0/new-chat-2-4c6e8cef` (`e7ec440`) | Its unique generated `next-env.d.ts` import change is superseded by Aura's ignored, framework-generated file. |
| PR #4 (`7abe2ddd7abff3fdf9858e389dee67617160b78d`) | Hold the alternate `/api/pdf` implementation: its contract differs and it lacks the current route's origin check, bounded body reading and admission/concurrency controls. Preserve `/api/documents/pdf` and its Arabic document verification. PR remains open. |

The resulting tree deliberately keeps current functionality while incorporating reviewed improvements. Every imported runtime change is accompanied by the existing CI gates. Dashboard regressions cover account switching, auth revalidation, unknown profile/progress, independent notification failure and safe recommendation URLs. PWA tests cover request exclusions and ownership-limited cache cleanup.

## Verified baseline evidence and limits

- Exact-source CI: 135 modern tests, aggregate 223 tests, 23 local migrations and 85 local authorization assertions; 861 public/synthetic browser assertions and 268 screenshots. Real authenticated roles, provider/RLS workflows were explicitly not run by that browser suite.
- Sudais real provider CI [38000721217](https://github.com/11Mazen22/learnverse-demo/actions/runs/38000721217): canonical `ar.abdurrahmaansudais`, Fatiha first/last verses returned `206 audio/mpeg`, 1024-byte samples. Repeated locally with the same successful result.
- Live provider audit checked all four currently supported reciters on Surahs 1 and 114, canonical global verse alignment and first/last playable MP3 samples: all eight reciter/Surah cases passed. This is sampling, not exhaustive media verification of all 6,236 verses.
- MP3Quran's separate catalogue adds the nine requested full-Surah reciters from PR #6. Catalogue validation confines media to HTTPS MP3Quran hosts and confirmed Hafs/murattal chapter availability. Real full-recording samples on Surahs 1 and 114 are audited separately from the four AlQuran Cloud verse reciters. Native controls expose pause/seek; source switching never selects a different Sheikh automatically.
- Indexed lookup validates all 114 corpus chapters against independent source counts and contiguous global IDs 1–6,236. Arabic normalization only applies to lookup; returned Uthmani text is preserved. Search accepts Arabic, Persian and Latin verse references and retains Surah-name fallback on provider failure.
- Protected preview `dpl_Ax1jn4igEio96LVYST9zypqtDrxE`, [noata-ipwbkh0ec-noata.vercel.app](https://noata-ipwbkh0ec-noata.vercel.app), is READY at exact baseline `a588e6ff`. Browser testing followed the user's Vercel sign-in. Protection was retained; no temporary bypass link was created.
- Actual browser Sudais audio reached `readyState=4`, advanced through verse six during continuous Fatiha playback and retained the selected Sheikh. The user also confirmed working audio.
- Candidate local tests before commit: 143 modern tests passed; TypeScript passed after permitting installed dependencies to be read outside the Windows sandbox. Full CI and preview of the resulting commit must be verified independently; baseline success does not prove this new commit.

## Production gates requiring evidence

1. **Configuration mismatch:** shared Vercel Supabase URL and service-role metadata reference `qvfywwpoktmbjsunqizr`, a third project outside the approved production/staging pair. Approved production is `jdkfqdzgphzqbbzmerzr`; staging is `vpfpjvhafkmygetjkfcp`. The service-role credential was not used. No secret values are recorded here. Production requires independently scoped, matching approved credentials and the explicit network-policy production opt-in. Never promote the staging preview's public credentials.
2. **Schema mismatch:** production has 18 migrations / 32 public tables, staging has 23 / 33. Production lacks `profiles.gems`, `user_settings.palette`, `active_design_id`, and `user_theme_designs`. Review the authorization, palette, Design Studio, Gem ledger and theme-owner changes against the actual production schema; migration names/versions differ, so replaying the staging list is unsafe.
3. **Rollback:** no recent, verified production database backup/restore evidence or rehearsed application rollback was available. Preserve old deployment IDs and validate recovery before database changes or domain movement. A Vercel deployment list alone is not a database rollback plan.
4. **Real accounts and workflows:** staging has two confirmed student users, no verified QA teacher/admin accounts or staging QA markers. No authorized staging Auth Admin credential was available. Do not fabricate `auth.users` via SQL, use production/foreign credentials, or change existing user roles. Verify actual sign-in/recovery, role permissions, student/teacher/admin workflows, Fanar and Design Studio generation, durable Gems/XP/Coins and account isolation using authorized disposable QA users.
5. **OAuth:** complete and verify a real Google OAuth round trip and canonical callback/session handling. Synthetic Auth UI checks do not prove provider setup or delivery.
6. **Security and data:** all public tables have RLS in both projects. Staging theme ownership policies and composite owner FK are present; anon profile read returned zero rows, and anon theme table access was denied. The private AI receipt table intentionally has no client policies. Admin AI summary is role-guarded despite the advisor warning. Leaked-password protection is disabled; no paid plan was enabled. Private document-retention migration is unapplied in both projects and must remain disabled until separately accepted.

Five source migrations involved in the production delta:

- `20261008170000_learning_authorization_hardening.sql`
- `20261009221500_noata_palette_account_sync.sql`
- `20261009225000_noata_user_theme_design_studio.sql`
- `20261009230000_verified_gem_ledger.sql`
- `20261009231500_theme_owner_integrity.sql`

Production remains at `73a17a1595f30a4bd9c1665cdb32ee535183d3a6`, deployment `dpl_ZGfMpgjQf3pteK4z5XEuNjAXE77f`, with verified domains [noata.enterpriseworkhub.online](https://noata.enterpriseworkhub.online) and [noata.vercel.app](https://noata.vercel.app). No production ref, domain, credential or database change was performed for this candidate.
