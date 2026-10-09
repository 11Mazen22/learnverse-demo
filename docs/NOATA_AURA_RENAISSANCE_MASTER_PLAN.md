# Noata Aura — Renaissance implementation contract (9 October 2026)

> **Scope:** development branch `noata-aura-platform-overhaul-20261008`, PR #3 Draft, isolated `vpfpjvhafkmygetjkfcp` staging only. Never merge, use production envs, migrate production, promote a production deployment or change production domains without explicit owner approval.

## Objective

Deliver a trustworthy bilingual Arabic-first learning platform with fully tested Auth, relevant learning, real Fanar services, auditable XP/Coins/Gems, meaningful achievement moments, accessible multi-theme personalization, and usable legal disclosures. No fake services, scores, balances, promotions, or progress.

**Known at planning checkpoint:** PR source head `877ba90` and Vercel stable branch alias still pointed to READY deployment `d7df7a7`; those are not the same revision. Staging exists and is active. Google OAuth was previously confirmed disabled and must be independently reverified before claiming readiness. Existing ledger currencies are XP and COIN; there is no complete GEM economy or themes beyond light/dark/system. `/privacy` and `/terms` were formerly sparse. Google rejected an unverified `.vercel.app` homepage and insufficient privacy content. Never label CI as live Auth/AI QA.

## Definition of Done (nonnegotiable)

A feature is DONE only if:
1. Requirements and interaction/visual states are implemented, with Arabic/English parity.
2. Authentication, RLS, role boundaries, and server-side authorization pass where relevant.
3. Backend outcome is committed, read back and displayed truthfully; duplicate requests cannot double-credit.
4. Loading, retry, empty, offline, failure, latency and timeout states work without fabricated success.
5. Keyboard, touch, screen readers and reduced-motion behavior pass the relevant acceptance matrix.
6. Unit, integration, production build and end-to-end tests pass on the **same exact commit**.
7. A READY preview deployment is confirmed to host **that exact commit**, followed by manual browser QA.
8. Owner accepts the preview. The production release gate remains closed.

## Track 1 — Identity, sign-in and account lifecycle (P0)

- Public branded homepage (logged out) describing what Noata does, linking to the same published privacy policy and terms provided to Google. Must not redirect to a login-only or forgot-password URL.
- Keep canonical auth host stable. No mixing immutable preview hostname, branch alias and production origin in PKCE callbacks. Test callback query handling, same-origin anti-open-redirect rules, and consumed/expired/replayed tokens.
- One coherent, responsive, premium Auth journey: sign in, create account, verify, resend, recover, reset, Google, cancellations, provider errors, signed-in state, explicit sign-out, account lock/error recovery. Accessible password visibility and validation.
- Email template QA on *actual new* links with Arabic/English copy, consistent assets, redirects, and SMTP status. Test both same-browser and cross-device recovery without claiming success until checked.
- In the authorized staging Supabase project, configure Google provider with OAuth Web Client secrets via provider settings, never source/chat. Google redirect URI: `https://vpfpjvhafkmygetjkfcp.supabase.co/auth/v1/callback`; Noata redirect only to canonical approved app `/auth/callback`.
- **Google ownership blocker:** use an owned custom domain registered to Noata for the public homepage, verify DNS Domain Property in Search Console with the same Google account owning/editing Cloud project, and submit matching homepage/privacy/terms URLs. Keep the existing Vercel branch preview for staging/testing, not as unverified public OAuth brand homepage.
- Fix any data-rights contact gaps before resubmission: owner-verified privacy/support address, responsible operator identity and accurate data deletion channel. Human/legal review required for the actual underage-student audience.

Acceptance: email signup → link → live session → refresh; bad token → appropriate error; Google login/cancel/error; reset → new password login; sign-out invalidates access; student cannot reach staff; same origin and cross-browser cases; ownership/Google review separately verified.

## Track 2 — Authoritative Rewards Engine (P0/P1)

Existing state: `public.ledger` uses immutable currency values XP/COIN with `unique(user_id,currency,idempotency_key)`; profile balances are server-derived via migration/RPC logic. `claim_reward_box` already awards idempotent XP and Coins. Do not replace or duplicate it with client-side counters.

### Data model

- Introduce `GEM` as a third **virtual** currency with a reviewed, rollback-safe SQL migration. Consider a separate reward currency registry and safe balance snapshot before modifying constraints.
- Maintain an append-only event / transaction ledger containing `actor_user_id`, `work_type`, `work_id`, `rule_version`, `source_receipt`, `currency`, `delta`, `created_at`; keep composite uniqueness on qualified source/award. Use a single security-definer RPC with ownership checks, bounded grants, replay protection and server-derived eligibility (not client-supplied scores).
- Rewards for validated work only: correct first attempts, first lesson completion, verified 3-question missions, unit boss completion, teacher-reviewed assignment and useful spaced repetition. Never reward clicking, page loads, idle time, random chat spam or requests that failed to persist.
- Reflect each authorized event everywhere: home profile, progress, learning, missions, review, boss, assignments, rewards, notifications and optional AI study sessions with valid learning evidence. Client sync via verified receipts/realtime/subscription or refresh fallback; no optimistic currency commitment.

### Proposed economy rules (NOT active until implemented and QA'd)

| Validated event | XP | Coins | Gems | Conditions |
|---|---:|---:|---:|---|
| First correct answer | 10 | 2 | 0 | One receipt per eligible question context |
| Lesson completed | 15 | 12 | 1 | First completion only |
| Mission (3 questions) | 20 | 20 | 1 | Server-validated minimum completion threshold |
| Perfect mission bonus | 10 | 8 | 1 | All three first-attempt correct; same mission award idempotent |
| First unit boss completion | 40 | 60 | 3 | Preserve current source grant; gems new |
| Full unit mastery | 30 | 35 | 5 | Independently verified mastery, one-time |
| Teacher-confirmed assignment | 25 | 20 | 1 | Authorized graded submission, never self-approved |
| Review due skill | 5 | 3 | 0 | Correct qualified spaced repetition; capped per day |

These are **design candidates**, not existing reward values. Carefully reconcile with current legacy first-completion grants to prevent double awards; announce the final in-product rulebook with version history. Gems never redeemable for money. Use configurable soft caps and fraud monitoring before launch; no arbitrary retroactive confiscations without audit.

### Experience

- Reward receipt with source and amount, cross-page synced wallet and recent activity.
- Level track, XP-to-next-level, collectible badge gallery, gem vault, cosmetic store, tiered Mystery Boxes, seasonal chapters, streaks with forgiving recovery, challenge boards and skill mastery visuals **without conflating mastery and spendable currency**.
- Celebrations: 300–650 ms subtle spark/ripple, optional sound OFF by default, animation budget, no flashing, reduce motion/quiet mode respected.
- Fallback: if RPC succeeds but response times out, query by idempotency key rather than issuing a duplicate grant. If declined or pending, display no balance increase.

QA: concurrency/replay/failed step, cross-account RLS, forged score, negative/overflow, simultaneous redemption, mystery-box double claim, daily caps, latency, account switch, balance reconciliation.

## Track 3 — Fanar AI (P0)

Official provider surface includes `/v1/chat/completions`, `/v1/audio/speech`, `/v1/audio/transcriptions`, `/v1/images/generations` and translation endpoints, but availability depends on credential/model entitlement and quota. No capability may be advertised as live solely because an endpoint exists in public docs.

- Set staging provider keys in isolated Edge Function secrets and verify function revision; never expose tokens via browser.
- Test authenticated streaming Arabic multi-turn conversation, model routing, error/timeout/rate limits, retries with request receipts, persistence, source attribution for TXT/MD/CSV/JSON/DOCX/PDF and actual image understanding when supported.
- Test STT/TTS, voice player cleanup, actual audio file playback, content moderation, quota, model fallback (without silently changing capabilities), privacy and per-user access.
- Verify artifacts exported as actual DOCX/PDF binaries and accepted by downstream readers; scanned PDF OCR, XLSX and PPTX are not to be marketed until shipped and tested.
- Meaningful AI-assisted study tasks can **produce eligibility evidence** only after a real assessed learning action; chatting alone cannot mint Gems.

QA: live Arabic prompts, wrong/blank API key, unauthorized session, cross-account attempts, provider outage, quota exhaustion, cancelling stream, long context, malicious prompt/file and retry idempotency.

## Track 4 — Design system and six expressive themes (P1)

Retain official Noata brand mark/lockup; no generic single N and no counterfeit replacement. Keep color-constrained brand assets consistent on login, app chrome, email, PWA icons and document exports.

**Visual themes** (all beyond OS System):
1. **Aura** — luminous violet/indigo, airy gradients, iridescent skill rings.
2. **Ocean** — deep blue and teal, clean tidal gradients and calm depth.
3. **Forest** — emerald/moss, warm natural surfaces and organic progress.
4. **Sunset** — amber/coral, energetic but readable lesson milestones.
5. **Rose** — plum/rose-gold, editorial cards and soft highlights.
6. **Midnight** — deep blue/purple night palette, star-like restrained accents.
Existing light/dark may remain presets; OS System stays an adaptive option.

Implement a typed preset registry of semantic design tokens (background, surface, text, muted, primary, borders, focus, interactive states, graph palette, shadows). Use `data-palette` separately from underlying contrast mode when existing dark selectors need compatibility. Theme choices appear in sidebar quick switch, settings gallery, and on Auth where appropriate; persist to `user_settings` **only after** a matching DB constraint migration is approved/applied in staging. Cross-device persistence and sign-out/device preference rules must be explicit.

Motion principles: 160–250 ms hover/selection, 300–450 ms navigation and context transitions, 450–650 ms reward moments, transform/opacity preferred, page layout never blocked by intro. Scroll reveals only when they add meaning; virtualization/lazy-loading for long feeds. Respect `prefers-reduced-motion`, local reduced-motion, visible focus, keyboard controls and pause semantics. Do not animate every scroll event, large blur filter, or trigger layout thrashing.

QA: Arabic RTL and English LTR, 320/390/768/1024/1440/1920 widths, light/dark contrast, color-contrast WCAG 2.2 AA, axe+manual screen-reader, zoom 200%/400%, keyboard, OS reduce motion and low-end devices. Performance goals, subject to realistic conditions: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at p75.

## Track 5 — Route-by-route functional rebuild (P1)

- **Home:** actionable dashboard, real upcoming work, activity, cross-app resume, honest guest state.
- **Learn/lesson:** course > unit > lesson flow, prerequisites, progress evidence, retry and offline placeholders, skill gain summary.
- **Missions / Review / Boss:** clear question flow, score explanations, server submission receipts and coherent reward confirmation, no duplicate awards.
- **Rewards:** wallet, gem vault, shop/purchase/equip, gift boxes, purchase history, locked/empty states and real server balance checks.
- **AI/Workshop:** dedicated trustworthy assistant and artifact workspace with bilingual copy, voice and file capability gating.
- **Assignments / Teacher / Admin:** genuine assignment creation/grade/visibility, role scopes, operational errors and authorization.
- **Quran:** text provenance, stable recitation controls, bookmarks and accessibility/rights verification.
- **Settings / Progress / Notifications / Help:** consistent semantic tokens, real persistence, no phantom data, direct links and rich error recovery.
- **Legal:** full privacy and terms in Arabic and English, section index, mobile layout, Google data disclosures, minor/guardian expectations, retention/data rights; owner review and working contact still mandatory.

Each route must have an explicit UI state matrix: Guest / Loading / Success / Empty / Error / Offline / Partial / Forbidden and mobile RTL/LTR checks.

## Track 6 — Release evidence (P0)

1. Freeze exact Git HEAD and review all changed files and data migrations, plus installation/lockfile integrity.
2. Typecheck, test, build, Deno check, local authenticated/unit/browser assertions and six-theme contrast screenshot matrix.
3. Verify GitHub Push + PR CI **on the same exact head**; test artifacts track commit and dirty state.
4. Confirm Vercel is serving that exact SHA on the stable branch preview, not older immutable preview.
5. Staging-backed email/Google account, RLS, role, rewards, Fanar, file, notification, export, Quran and performance tests with disposable accounts.
6. Human legal/privacy approval, valid owned public-domain verification, OAuth brand approval and support contact.
7. Manual acceptance from owner. Only then create a separate production release proposal, data migration/rollback plan and explicit approval request; PR #3 remains Draft until approved.

## Current execution checkpoint

- Delivered to PR #3 branch: accessible bilingual legal-page shell, full privacy and terms content, auth/navigation refined CSS with reduced-motion support.
- No production changes. Legal copy is a technical **draft** requiring owner/legal review and a real privacy contact channel.
- **Not yet delivered**: verified Google ownership/provider settings, live Fanar credential test, GEM migration/RPC, 6-theme persistence, complete route rebuild and authenticated acceptance.
- Vercel branch-alias/CI must be checked **again** after new commits; the earlier READY alias was an older SHA and is not release evidence.

**Owner inputs required before Google resubmission:** controlled custom domain; verified Google Cloud owner/editor and Search Console DNS; functional support/privacy email; finalized organization/operator details; provider credentials only via secrets dashboards.
