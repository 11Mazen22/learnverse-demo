# NOATA AURA — THE COMPLETE PLATFORM RENAISSANCE
## Master execution prompt, systems blueprint, route-by-route transformation plan & release acceptance contract
**Revision:** 2.0 — 9 October 2026
**Status:** Engineering specification and implementation backlog, NOT a claim that the platform is complete.

> **Mission:** Transform Noata Aura into an unusually beautiful, fast, reliable, bilingual, Arabic-first, deeply interactive educational platform. It must feel like a cohesive, sophisticated product — not a collection of attractive mockups. Upgrade EVERY CURRENT ROUTE, BACKEND WORKFLOW, ROLE, STATE, AND CROSS-PLATFORM INTERACTION. Deliver authentic learning, real services, accountable rewards, excellent accessibility, and flawless-looking but restrained motion. No placeholders presented as real functionality; no “finished” claims without evidence.

# 0. OPERATING INSTRUCTIONS TO THE IMPLEMENTING ENGINEERING AGENT

You are acting as principal product designer, design-systems architect, senior full-stack engineer, Supabase/Auth/RLS specialist, educational experience designer, AI systems engineer, accessibility specialist, quality engineer, and release lead for Noata Aura. Work in the EXISTING repository and preserve all sound functionality.

- GitHub repository: 11Mazen22/learnverse-demo.
- Authorized branch: noata-aura-platform-overhaul-20261008.
- Pull Request #3 remains OPEN and DRAFT. DO NOT merge or enable auto-merge.
- Only explicitly approved isolated Supabase staging project: vpfpjvhafkmygetjkfcp. Never assume another project is authorized.
- No destructive production database action; no production-domain change; no production deployment/promotion; no changes to billing or paid-service subscriptions without explicit owner authorization.
- Keep the stable Vercel branch preview URL as the development review entry point when possible. Confirm the branch alias actually serves each final tested Git SHA; READY for an older deployment is not acceptance of new code.
- Credentials belong in secure Vercel, Supabase, and Google provider settings, not code, commits, chats, screenshots, or test artifacts.
- Favor small reviewable commits by cohesive milestone; do not flood CI with meaningless work-in-progress commits. Inspect existing work and dependencies first.
- Do not restart from scratch, replace the backend, delete user data, introduce fake content or balances, or pretend unsupported integrations work.
- Treat suggestions in this document as requirements to INVESTIGATE AND IMPLEMENT SAFELY, not assertions about current deployment. Preserve existing correct behaviors and migration history.
- Produce working code, tests, migration review, screenshots, architecture notes and evidence; a design write-up by itself is not completion.
- Do not ask the owner to do anything achievable by authorized tooling. Clearly identify unavoidable external actions (e.g. Google Search Console domain verification or service secrets).

# 1. ACTUAL PROJECT INVENTORY AND FUNCTIONAL AUDIT

Before any major design rewrite, inspect the current branch HEAD, PR changes, workflow checks, Vercel deployment revision, staging schema, RLS, functions, configuration, logs and user-facing state. Record a “Verified / Implemented-unverified / Not started / Failed / Externally blocked” matrix for every route and service.

### Known Next.js routes that MUST be audited
- / — public guest view and authenticated personal dashboard.
- /login, /signup — account creation and access.
- /auth/check-email, /auth/callback, /auth/complete, /auth/error, /auth/forgot-password, /auth/update-password — entire lifecycle.
- /learn — courses, units, filtering and entry into lessons.
- /lesson/[id] — lesson player and progress checkpoints.
- /missions — 3-question mission system and work verification.
- /review — skill-targeted spaced review.
- /boss — unit boss challenges, score and reward boxes.
- /progress — mastery evidence, goals and progress.
- /rewards — wallets, catalog, inventory, equip, shop, gifts, boxes.
- /ai — Noata AI and Workshop workspaces.
- /assignments — student assignments and submissions.
- /teacher — teacher dashboard and class workflows.
- /admin — administration, curriculum, users and operations.
- /quran — verified Quran reading, listening, searching and bookmarks.
- /notifications — inbox, unread state and alert behavior.
- /settings — identity, locale, themes, motion, AI/privacy/security.
- /help — searchable, genuinely useful contextual support.
- /privacy, /terms — public bilingual legal documentation.
- Error/404/loading, manifest/PWA/offline paths, global layouts, header, sidebar, mobile navigation, command/search, account menu and all nested dialogs.
- Server routes: /api/quran, /api/documents, /api/documents/pdf, /api/qa-target, /health, Supabase Edge Functions and RPCs.
- Any newly discovered routes or hidden feature modules also belong to the scope.

### Existing building blocks to study and PRESERVE when correct
- Typed Next.js/React web app; existing semantic CSS design tokens, app shell and role gates.
- Supabase Auth, Postgres with RLS, idempotent server mutations, migration history and Edge Functions.
- Existing XP/COIN ledger, shop items, inventory, equipped cosmetics, reward boxes, learning skill evidence.
- Curriculum authoring status/review/publish transitions and student/teacher/admin access boundaries.
- Fanar-backed AI pipeline and document/audio utilities, document preview/export.
- Quran text and audio routes with cached/noncached source handling, reading-size and bookmark controls.
- Newly introduced bilingual public legal layout, auth visual treatment and device-local named palettes. Their visual/security quality still needs verification, and palette persistence is NOT yet cross-device.
- Responsive/axe/browser automation and document binary checks where present.

Deliverable: a verified inventory spreadsheet-like Markdown matrix by route and a dependency map linking every user action to frontend, Auth, RPC, data tables, permissions, provider, receipts and tests.

# 2. PRODUCT VISION, INFORMATION ARCHITECTURE AND QUALITY BAR

Noata is a calm, brilliant learning companion whose depth appears naturally. The student should always know:
1. What can I learn right now?
2. Where am I, what did I genuinely complete, and what is next?
3. Why did I earn this amount and where is the receipt?
4. What is Noata AI doing with my content?
5. How can I recover from an error without losing work?
6. How do I change language/theme without my learning context breaking?

Organize navigation into meaningful groups: My Learning (Home/Learn/Lessons), Practice (Missions/Review/Boss/Assignments), Growth (Progress/Rewards), Tools (Noata AI/Workshop/Quran), and Account (Notifications/Settings/Help). Role-specific Teacher and Admin navigation must be shown only to authorized users. Never let generic navigation create dead ends. Enable deep links, breadcrumbs where useful, resumable sessions, global Ctrl/Cmd+K quick navigation, contextual search and clear mobile navigation. No nested-scroll traps.

Create a holistic premium system: disciplined spacing, refined Arabic typography, coherent icon language, custom purposeful empty states, layered but restrained depth, editorial headings, crisp touch targets, readable charts, excellent small-screen ergonomics, purposeful visual personality. Use legitimate Noata supplied logo, lockups, favicons and email assets consistently; do not replace identity with a generic “N”.

# 3. DESIGN SYSTEM AND THEME UNIVERSE

### Seven palette presets and color-mode behavior
Maintain Classic Noata plus six strong palette identities:
- Aura: luminous indigo, violet and ethereal accents.
- Ocean: navy, aqua, cyan and fluid calm depth.
- Forest: emerald, sage and warm botanical restraint.
- Sunset: amber, coral and sophisticated warm neutrals.
- Rose: plum, rose and understated luxurious highlights.
- Midnight: indigo night, moonlit outlines and nuanced luminous contrasts.
- Classic: original verified Noata identity.
Each should have distinctive illustration language, surfaces, gradients, progress indicators, chart palette and sensible shadow treatment, not just an accent recolor.

Separately support readable light, dark and OS-adaptive modes (subject to palette-specific contrast). Theme palette and color-mode selections must be stored distinctly; the current settings table may constrain theme to light/dark/system. Extend schema only with reviewed migration in STAGING; support backwards compatibility, existing account settings, device-local fallback, logout/account switching and cross-device synchronization. No uncontrolled flashing of incorrect theme on hydration.

Use semantic tokens for background, elevated card, modal, typography, muted text, error/success/warning, borders, focus, gradients, graphs, nav, surfaces, skeletons and celebration particles. Audit any old hard-coded text/background pairs per palette and both modes. Establish design tokens for density, typography scale, touch targets, radii, spacing, shadow, focus and safe-area paddings.

### Typography and graphics
- Arabic-first premium typography with correctly loaded local Arabic font and resilient fallback; separate English optical settings, language-appropriate numerals and punctuation.
- Headings have hierarchy, reading text has comfortable line height, Arabic shaping must not break in button labels, charts, PDF exports or emails.
- Authentic logo, curated iconography, micro-illustrations and custom empty states; no fake screenshot previews or unlicensed graphics.
- Meaningful delight should reflect achievement, understanding, and progress — not visual noise.

### Motion system
Implement an accessible motion language across ALL routes and interactions:
- 100–160ms feedback for press, hover, focus and toggles.
- 180–260ms menus, tabs, accordion disclosure, tooltips, sheet motions.
- 250–420ms context/page transitions with actual navigation continuity.
- 350–650ms carefully bounded level-up, earned XP, Gems, coins, mastery and reward-box reveals.
- Micro-animations on progress charts, gentle themed ambient scenes and guided scroll reveals ONLY when they aid comprehension.
- Prefer compositor-friendly transform/opacity; avoid expensive blur-heavy or layout-triggering animation. No perpetual animations that obscure studying or Quran reading; no autoplay sound.
- Respect OS prefers-reduced-motion AND Noata account-level motion choice, pause/stop controls where needed, focus restoration on dialogs, keyboard navigation and vestibular sensitivities.
- Motion should be non-blocking and not delay error reporting, navigation, submitting work, or screen-reader announcements.

# 4. GLOBAL EXPERIENCE / EVERY SCREEN

All routes require:
- Functional loading/skeleton, empty, success, partial, offline/reconnect, permission-denied, error, retry, long-running and account-switch states.
- Strong inline validation, non-destructive toasts, confirmation for dangerous actions, unsaved-draft safety and immutable server receipts for high-stakes writes.
- Responsive layouts across 320, 360, 390, 430, 768, 1024, 1280, 1440, 1920px and zoom up to 400%; safe areas, landscape tablet, low-end Android, mobile Chrome/Safari, desktop keyboard/touch.
- Arabic RTL and English LTR full parity. Direction affects layout and navigation, but content such as email, code, math and Quran reading must use correct writing direction.
- Clear current-location indication, back navigation, screen-reader labels and keyboard focus.
- Real available data; no random placeholder charts, unread counts, XP gains, mock classrooms or unauthorized records.
- Stable scroll-restoration, no unexpectedly resetting work during tab/menu changes.
- Respect privacy and educational accessibility at every step.

# 5. PUBLIC HOMEPAGE AND FIRST IMPRESSION (/ AND GUEST ROUTES)

Build a real, beautiful public introduction that explains what Noata does with clear honest capability statements, sample learning journey and working sign-up/sign-in entry points. Google OAuth verification demands an actual accessible homepage, not forced redirection to forgot-password, account-only content or a Vercel-protected preview. Link visible Terms, Privacy and functional operator contact route; support public accessibility and SEO/canonical/OG.

For authenticated students: a responsive mission-control dashboard with:
- Personal greeting, real progress and current level/wallet snapshot.
- Resume learning CTA based on last legitimate checkpoint.
- Today’s recommended lesson, due review, ongoing mission, next assignment, and “continue where you left off.”
- Skill rings, weekly progress trends, completion evidence and an honest activity timeline.
- Contextual Noata AI support, accessible Quran shortcut, a sensible rewards teaser, soft achievement moments.
- Smart priority ordering (due work > unfinished study > new content), user-controlled card prominence, never fabricated urgency.
- Graceful empty states for a brand-new account and a disconnected provider.

# 6. AUTHENTICATION / ACCOUNT / ONBOARDING

Entire lifecycle must be production-quality:
- Gorgeous lightweight sign-in/sign-up layout on mobile and desktop; correct brand, sensible tabs, password strength/visibility, validation, disabled states, caps-lock hint when useful and safe error copy.
- Email/password signup, confirmation/resend, sign-in, persistent refresh, expired-token handling, password recovery, update-password, explicit sign-out and predictable deep-link “next”.
- Real Google OAuth through approved staging Supabase provider and Google Cloud client with proper PKCE/canonical host. User cancellation and duplicate-provider email handling tested. No spoofed success.
- Prevent forced /auth/forgot-password redirect on unrelated routes; eliminate canonical-host loops, race conditions and consumed-link misdirection.
- Branded bilingual transactional email templates with actual tests of delivery and fresh link redemption on desktop/mobile/cross-device.
- Roles are server-enforced: Student by default; Teacher/Admin assigned only by authorized backend workflow. Test role changes, session refresh, deleted/revoked account, unverified email, credential errors, account switching.
- Onboarding: optional learning level, subjects, goal, daily pace, preferences, language, accessibility options. Do not claim a teacher is assigned or progress exists until saved.
- Account management: profile edit, avatar with safe upload, security/access sessions where supported, data export/deletion request path, privacy settings and account lifecycle cleanup.

Google brand verification separate gate: Vercel’s verified project domain is NOT proof of Google Search Console ownership. Use an owner-controlled domain/homepage for OAuth brand review, ensure matching privacy/terms and verified contact identity, handle minors appropriately. Never expose client secret.

# 7. LEARN CATALOG (/learn)

Reinvent Learn as an organized curriculum discovery experience, not a list of old cards:
- Subject/school-level/course → unit → lesson structure with breadcrumb and rich filters.
- Search, difficulty, duration, mastery/started/completed, favorite, recently used and recommended (recommendations explain their rationale).
- Display actual publication state, counts and prerequisites; previews for published material only.
- Syllabus road map with meaningful level/timeline and progress nodes; animated affordances with low-motion fallback.
- Locked states clearly explain prerequisite, not marketing pressure. Accessible list/grid modes.
- Content localization and fallback; empty curriculum state must say nothing is available, not invent lessons.

# 8. LESSON PLAYER (/lesson/[id])

A focused, deeply usable teaching environment:
- Lesson overview, objectives, estimated duration, approved sources, unit context, progress, completion status, resume from actual last stable checkpoint.
- Structured explanation, supported diagrams/examples, accessible tables and rendered mathematics; intentional Arabic layout and mobile readability.
- Interactive worked examples, checkpoints, hints, first-attempt evidence and answer explanations. Reveal the reason behind a mistake rather than only “wrong”.
- Student notes/bookmarks, optional accessible flashcards, glossary, related skills and a “Ask Noata AI about this lesson” action that sends only authorized scoped context.
- Validate actual grading server-side; transactional first-completion rewards and proficiency evidence, idempotent reattempts, no double earning.
- Full keyboard use, screen-reader descriptions for illustrations/math, save-before-navigation, truthful autosave status.
- End-of-lesson learning report: what was completed, what changed in mastery, which source earned XP/Coins/Gems, review due when relevant, next good action.

# 9. MISSIONS (/missions) — THE THREE-QUESTION ADVENTURE

Keep the 3-question progression but make it consequential and pedagogically meaningful:
- Mission types: daily practice, unit journey, adaptive skill repair, cross-topic challenge and optional timed practice (no punitive defaults).
- Exactly 3 assessed questions per mission by default; difficulty progression easy → applied → challenging, with robust pool selection and age-appropriate content.
- Question presentation that supports choices, numeric tolerances, math, keyboard selection, progress 1/3→3/3, well-explained hints and review.
- One question submission at a time using server-signed/authorized attempt receipts; error and retry must not lose responses or create duplicate rewards.
- First-attempt correctness vs final completion tracked separately, perfect-mission bonus applied only once and based on validated evidence.
- Accessible animated progress between rounds; resilient pause/resume, explicit exit confirmation, no surprise lost work.
- Results screen: mastery evidence, explanations, areas to revisit, XP/Coins/Gems verified receipt, recommended review/lesson.
- Daily/weekly mission board, unique badge collections, fair anti-grind controls; no deceptive streak penalties.
- Edge cases: zero published questions, question retired mid-run, connectivity loss, invalid answer, duplicates, replay and account switching.

# 10. INTELLIGENT REVIEW (/review)

Upgrade into a meaningful spaced-practice assistant:
- Due today / Learning / Strong / Mastered / At-risk filters based on real skill_evidence and teacher-reviewed evidence.
- Explain why each skill is due, the misconception detected and recommended short intervention.
- Adaptive selection based on verified errors, elapsed time, previous mastery and varied reviewed question pool; no repeated exact-answer exploitation.
- Compact focused review session, accessible feedback and explanations, optional mnemonic and AI-assisted explanation only if real provider available.
- Correctness and confidence are distinct; “I’m unsure” is a supported choice without shaming.
- Mastery updates are backend-authoritative; reward only qualified review sessions with capped idempotent grants.
- Friendly progress comparisons, review calendar and teacher-visible insights limited to authorized scope.
- Load, no due skills, missing pool, offline, partially submitted and failure state coverage.

# 11. UNIT BOSS (/boss)

Create a distinctive, satisfying skill challenge without gambling-style pressure:
- Preflight panel of unit objectives, eligibility, question count, time expectation and how scoring/rewards work.
- Challenge arena with elegant difficulty ramp, accessible timer only if pedagogically justified, question variant handling, deterministic record/replay protection.
- Per-question evidence, end-of-run real score, actionable explanations, retry variants, skill impact and first-win reward.
- Mystery Box eligibility belongs to first verified completion, not button clicks; Box opens via server RPC exactly once. Transparent possible virtual reward categories; no pay-to-win.
- Celebration that never blocks grade/result access; accessible silent/reduced-motion alternative.
- Handle direct URL with no unit, insufficient published questions, double submit and interrupted session.

# 12. MASTER PROGRESS & LEARNING ANALYTICS (/progress)

Make progress a truthful, student-understandable growth story:
- Skill mastery map by subject/unit, current level/XP track, completed lessons, review queue, assignment evidence, missions, boss attempts and verified achievements.
- Daily/weekly/monthly history with accessible graph tables and local-time accuracy; distinguish learning activity from raw app usage.
- Goals and plans users can modify; weekly reflection, “where I improved” and “recommended next step” with explainable rules.
- Growth visualization using sparklines, rings, timelines, competency heatmaps and meaningful empty states; no fabricated proficiency or predictive claims.
- Privacy-preserving shareable summaries optional and OFF by default for minors. A teacher sees only permitted students.
- Data export as correctly labeled accessible document or CSV where genuinely supported.

# 13. NOATA ECONOMY — XP, COINS, GEMS, BADGES, ACHIEVEMENTS, REWARDS

Current source ledger supports XP and COIN; future GEM must be introduced through reviewed staging migration. Never let a client mint currency.

### Three distinct values
- XP = non-spendable progress/level evidence.
- Coins = common in-platform virtual cosmetic currency.
- Gems = rare earned virtual currency for verified significant accomplishments; NOT real money, cryptocurrency or a cash prize.
- Skill mastery stays independent from wallet values.

### Backend transaction architecture
- Server determines earned quantity from rule_version, work_type, validated work_id, difficulty and completion evidence.
- Append-only, immutable ledger/event receipt with user_id, currency, delta, reason, source, authorized actor, rule version, idempotency key, timestamp and reconciliation method.
- Transactionally update derived balances and badge eligibility. Unique qualified-work rules prevent double credit after replay, optimistic updates, tab races or retry.
- Defense against submitted client scores, altered rewards, multi-account abuse and wallet manipulation. Rate/cap rules fair and auditable. Refund/reversal as separate ledger event, not silent edits.
- Existing COIN/XP grants must be reconciled before adding bonuses; no duplicate reward on a legacy first-completion.
- Clearly documented economy rulebook and experience preview of “eligible reward after successful completion,” followed by “actually earned” only once confirmed.

### Proposed design values — NOT currently active
| Qualified work | XP | Coins | Gems |
| --- | ---: | ---: | ---: |
| First correct eligible answer | 10 | 2 | 0 |
| First lesson completion | 15 | 12 | 1 |
| Complete 3-question mission | 20 | 20 | 1 |
| Perfect mission bonus | 10 | 8 | 1 |
| First verified unit boss | 40 | 60 | 3 |
| Fully mastered unit | 30 | 35 | 5 |
| Teacher-approved graded assignment | 25 | 20 | 1 |
| Valid due-skill review | 5 | 3 | 0 |
Protect against daily farming; make the final rule table versioned and configurable after reviewing current migrations.

### The Rewards world (/rewards)
- Hero showing REAL XP level, Coins/Gems balances and next milestone.
- Wallet activity with transaction receipts and filters; inspect each reward’s source.
- Achievements museum with collected badges, locked criteria and progress toward earning; no fraudulent percentages.
- Reward-box inventory, opening sequence and already-claimed history; if none exist, meaningful activity links.
- Cosmetics shop with avatar, outfits, backgrounds and companions — preview before buy; affordable/cannot afford, owned/equipped, error/retry and server-confirmed purchase.
- Gem vault and sensible scarce unlocks; never paid/gambling mechanics targeted at children. No currency purchase unless separately approved and reviewed.
- Seasonal goals and milestones are optional, fair and age-appropriate; skip coercive retention patterns and intrusive alerts.
- Dedicated success receipt modal and gentle particle animation for verified rewards with aria-live announcement and reduced-motion fallback.
- Cross-app balance updates via trusted subscription/refetch, carefully handle stale data and account switching.

### QA
Replay, concurrency, out-of-order submissions, forged payload, insufficient balance, negative/overflow, simultaneous spending, box double claim, delayed readback, RLS cross-user denial, role abuse, migration compatibility and reconciliation assertions.

# 14. AL-QURAN AL-KARIM / المصحف (/quran)

Treat the Quran experience as a calm, respectful reading and listening space whose text/source integrity takes precedence over visual effects. Never use AI-generated Quran verses or silently substitute text. Keep verified canonical original verse text separate from optional translations/tafsir.

- Beautiful Quran-focused layout with Surah navigator, 114-Surah indexed list, search by name/Arabic verse, Juz/Hizb/Page jumps only if grounded in a verified edition.
- Arabic script with excellent glyph shaping, configurable font size/line spacing and comfortable reading mode, day/night/sepia-like *reading presentation* that passes contrast independently of global theme.
- Bismillah placement and numbering must reflect verified source conventions; avoid false guarantees about mushaf page boundaries. If exact Madinah layout not supported, DO NOT simulate as canonical.
- Real verse recitation: trusted audio source/reciter identification and rights; play/pause, seek, next/previous verse, repeat verse/surah, optional speed if permissible, volume, track loading/failed media and mobile media-session controls where supported.
- Reading bookmarks, last Surah/verse, favorites, local persistence plus optional authenticated cross-device sync with explicit privacy settings and no accidental overwrites.
- Separate translation/tafsir and AI explanation panes only if source verified and clearly attributed; never represent model explanation as sacred original text.
- Search accepts normalized Arabic variations without changing displayed canonical verses. Show source attribution and results within accessible context.
- Keyboard, screen reader, touch, scroll to selected Ayah without losing user context, RTL-only verse text independent of app locale.
- Deep-link into Surah/verse, honor reduced motion and maintain respectful quiet design. No noisy level-up over Quran reading, and never reward worship with coercive points. Optional self-directed memorization/study tracker is separate and consent-based.
- QA verified Surah/verse index/count/order, Fatiha/Baqarah/Nas integrity, Arabic search, bookmarks, offline/error fallback, audio HTTP range/actual playback and per-device media cleanup; never infer source correctness from one endpoint response.

# 15. NOATA AI, THE WORKSHOP & EDUCATIONAL INTELLIGENCE (/ai)

Create a serious, distinctive AI product inside Noata, not a visually disguised generic chat app. Real provider behavior must back every advertised tool.

### Interaction
- Dual-purpose workspace: conversation/learning co-pilot and a focused Workshop for notes, quiz drafts, structured explanations, plans, writing and documents.
- Elegant conversation list, search/archive/pin/rename/delete when supported, full conversation persistence, drafts and unread/error state.
- Composer supporting Arabic/English, rich math, attachments, paste/drop, multiple documents and clearly communicated input capabilities/limits.
- Strong streaming interaction with stop, retry, regenerate and edit when backed by real safe state. Prevent duplicate charges/calls and late response bleed across conversations/accounts.
- Model selector with honest capability cards; disabled actions show real reason and alternatives, not fake providers.
- Memory preference, session-only temporary chats, per-message sources and source provenance, quota estimate, request status and privacy explanation.
- Instructional modes: explain-step-by-step, quiz-me (real grading separately), Socratic hinting, compare examples, flashcards/lesson plan and concept map where functional.
- AI cannot freely award XP/Gems for chatting; only a verified assessed learning outcome may trigger a reward event.

### Fanar provider
- Verify deployed function and secret presence via approved safe means; do not print keys. Test actual authenticated Arabic multi-turn streaming on staging; provider errors, timeouts, quota, refusal, cancellation, fallback and model entitlement.
- Voice: genuine STT/TTS availability and browser playback/cleanup, mic permission, accessible transcripts, no microphone background behavior.
- Vision: real image input if current provider supports it and entitlement verified; no claims otherwise.
- File reasoning: TXT/MD/CSV/JSON/DOCX/PDF ingestion with exact size/page/source limits, citation fidelity, no leakage between users, truthful scanned-PDF/OCR warnings and retrieval scope disclosure.
- Exports: real DOCX/PDF binaries, with Arabic shaping, page breaks and right-to-left testing. XLSX/PPTX/OCR only advertised after implemented.
- Appropriate privacy and consent around student files. Private source bytes must follow explicit Storage lifecycle; no feature enabled without reviewed owner-only RLS and scheduled cleanup.
- Structured educational evaluation, grounded answer checks and moderation/risk awareness; model confidence must not be presented as verified fact.

### AI workshop artifact features
- A deliberate canvas-like drafting pane for actual editable artifacts, internal tabs/preview/versions, export/open, copy, revisions, source attribution and unsaved-change recovery.
- Document creation begins with a preview of the actual result. Exports must preserve titles, Arabic direction, fonts and tables when supported.
- Distinguish unsupported action, local-only preview and successful server artifact; no inert buttons.

# 16. ASSIGNMENTS (/assignments)

- Student dashboard: upcoming, in-progress, submitted, graded, overdue, archived. Due dates timezone-correct and clear.
- Assignment details with teacher/course/class association, questions, instructions, rubric, submission limits, available attachments only if secure and supported.
- Save draft, resume, validate, submit exactly once, and show immutable receipt. Prevent overwriting graded submission and duplicate hand-ins.
- Grading/feedback timeline, privacy-respecting class context, guided link to review targeted skills and teacher-approved reward eligibility only if policy allows.
- Offline state cannot claim server submission; queue/reconcile only with explicit safe design.

# 17. TEACHER WORKSPACE (/teacher)

Rebuild into a useful daily professional control center:
- Authorized roster, classes, timetable/assignment calendar when real data exists, learning overview and actionable alerts without exposing irrelevant students.
- Create assignments from approved question bank, configurable due dates/rubrics/draft/publish, edit allowed fields and publish with confirmation.
- Review actual submissions, grade with clear rubric, comments, save/confirm feedback and audit every grade change. Handle disagreements/returns according to policy.
- Identify skill-level misconceptions at class level only from authorized evidence; suggest remediation and differentiated assignments.
- Question suggestions are DRAFTS until reviewed; AI does not silently publish curriculum or grade high-stakes work without human oversight.
- Accessible data table/grid, search, filtering, mobile compact view, privacy-safe exports and secure permissions for every RPC/table.

# 18. ADMIN / CONTENT STUDIO / OPERATIONS (/admin)

Reorganize the administrator area as a clearly structured suite rather than an oversized everything-page:
- Overview: real active students/teachers/classes, content review queue, failed operations, abuse notices, provider/service health and audited trends. No fabricated revenue/usage metrics.
- Curriculum Studio: subject/course/unit/lesson/skill tree, question editor with Arabic/English and math, multiple-choice and numeric/tolerance validation, supporting source provenance and answer-key secrecy.
- Content lifecycle: DRAFT → IN REVIEW → APPROVED → PUBLISHED / RETIRED with named reviewer, frozen question version and immutable attempt-version provenance. Safeguard reapproval when content changes.
- Students/teachers: role assignment/revocation with step-up confirmation where appropriate, class membership, teacher access, account lifecycle and least privilege.
- Assignments and moderation oversight, legitimate reward fraud audit/ledger reconciliation, error/usage logs, AI quotas and system notifications.
- Provider status and feature flags, environment identity clearly marked STAGING; operations must not offer unsafe production actions from a staging interface.
- Pagination, bulk action review, reversible/confirmed operations, audit trail, permission error clarity and inclusive mobile/tablet design.
- Test attempts to directly call each administrative RPC and query each protected data table as student/teacher/guest. UI hiding alone is not security.

# 19. NOTIFICATIONS, INBOX AND REMINDERS (/notifications)

- Real event-driven relevant alerts for assignments, teacher feedback, eligible rewards, badges, account changes and service status (where appropriate).
- Unread/read state scoped per user, optimistic mark-read only with readback, deep links into real target items and deleted-target fallback.
- Filter by topic, quiet hours preference, read-all with confirmation where needed, pagination; no phantom notification counts.
- Email/push only after explicit delivery infrastructure, consent and minors-focused privacy requirements are reviewed. Browser notifications permission must not be requested at first page load.

# 20. SETTINGS, PROFILE, SECURITY AND PERSONALIZATION (/settings)

Group into Identity, Appearance, Learning preferences, Notifications, AI, Privacy & Data, Security and About:
- Editable display name, avatar (secure owner-only Storage and moderation/size checks), language/locale, reading and accessibility preferences.
- The six named palettes + Classic, independent light/dark/system, preview before apply, per-device fallback and verified account persistence/migration.
- Reduced motion, low-visual-intensity, data-saving mode and sound off by default, where implemented.
- Real AI model preference and memory/temporary-chat policy. No fabricated option for unavailable provider.
- Password change, recovery help, explicit sign-out, provider linking status when supported, data download/deletion request flow, transparent retention limitations.
- Account-switch race protection; protect unsaved edits; confirmation and canonical server readback after updates.

# 21. HELP CENTER, LEARNER SUPPORT AND LEGAL (/help /privacy /terms)

- Help topics that accurately correspond to supported features, deep links to routes, search/filter, bilingual technical descriptions, actionable troubleshooting and provider outage guidance.
- Smart contextual help from all major modules; never claim OCR, native exporters, Google login, wallets or AI generation are supported without verified evidence.
- Public bilingual Privacy Policy and Terms, accessible without login. Cover exact categories of account, student, learning, teacher/classroom, notifications, AI files, voice, Google identity, rewards and device settings.
- Explain data processing parties, retention differences, temporary chat receipts, user requests, minors/guardian consent context, account/file deletion limits, and real help/privacy contact channel. Legal owner review is mandatory; do not invent a company/address/contact or claim regulatory compliance without evidence.
- Google OAuth verification: owner-controlled public verified homepage/domain, consistent branding and links, true Google permission scopes, Search Console proof and approved provider settings. Vercel project-domain verification is insufficient by itself.

# 22. CROSS-SYSTEM EDUCATIONAL INTELLIGENCE

Create coherent data-backed interactions between systems:
- Lesson incorrect answer → evidence event → skill review queue → timely review recommendation.
- Lesson complete → confirmed XP/Coins/Gems → reward receipt → home/progress/wallet sync.
- Mission completed → boss eligibility when appropriate → next-unit recommendation, not unearned unlock.
- Teacher grading → assignment record → mastery evidence only if pedagogically justified → qualified wallet event, user notification.
- User asks Noata AI about a lesson → authorized lesson context, original source link, optional return to assessment; chatting alone is not assessment.
- Quran bookmark → latest reading position with privacy-respecting local/device sync, no irrelevant gamification.
- Auth/session change → immediately clear private data caches, AI drafts, reward snapshots and teacher/admin information belonging to previous user.
- Theme/locale/motion settings → consistent experience across all routes, email assets where applicable and future exports.
- Every cross-feature event must have a source record, server time, permission rule, retry behavior and test.

# 23. DATABASE, AUTH, SECURITY AND PRIVACY MODEL

- Inspect exact staging migration count/history before adding anything; no blind full reinitialization.
- Use reviewed additive migrations with compatible backfills and explicit rollback strategy where feasible; prepare GEM ledger extension and theme palette persistence separately.
- Full RLS policy matrix: Guest, Student A, Student B, Teacher A, Teacher B and Admin. Deny across-user history, wallets, attachments, assignments, answer keys, class data, teacher controls and admin RPCs.
- SECURITY DEFINER calls must explicitly verify role, ownership, search_path and execute grants. A linter warning is a review task, not proof of exploit or harmlessness.
- Reconcile profile balances with append-only ledger; serialize transaction-sensitive purchases/rewards. Never trust client XP, scores or costs.
- Authentication and network policies must fail closed for incorrect Supabase project/origin; stage and prod strictly isolated.
- Document/media Storage owner-only path rules, signed URL limits, retention/cleanup jobs, account deletion, orphan cleanup and explicit failure handling.
- Least-privilege keys, audited logging without sensitive payload leakage, quota/rate limits, CSRF/origin validation as applicable, sanitization, file type/size validation, content and prompt-injection boundaries.
- Account children/privacy and educational content rights review before public rollout.
- Investigate and resolve actual staging advisor notices, including leaked-password protection and intentionally exposed SECURITY DEFINER endpoints after full code review.
- Security incident playbook and backup/restore rehearsals without impacting production.

# 24. CONTENT QUALITY AND CURRICULUM PIPELINE

- Every exercise has stable ID, version, subject/lesson/skill, difficulty, solution, explanation, provenance, rights, review state and publication state.
- Arabic and English authoring quality: spelling, terminology, units, number direction, meaningful distractors and accessible equations.
- Curate variants for retries that test the same competency without simply changing displayed decoration.
- No AI-suggested lesson or answer key publishes without authorized human review. Never alter published keys retroactively; create a new version.
- Explicit demo labels for sample content and no unlicensed external redistribution.
- Tests for all published numeric tolerances, question completeness, duplicate answers, right-to-left math and grade-boundary behavior.

# 25. MOBILE, TABLET, DESKTOP, PWA & OFFLINE BEHAVIOR

- Design mobile-first but also use spacious editorial desktop compositions; don't shrink desktop grids onto phones.
- Small devices: one-handed bottom navigation, reachable CTAs, collapsible secondary detail, keyboard-open layout stability, safe-area insets, 44px+ touch targets where feasible.
- Tablets: split-pane appropriately; desktop: navigational rail, focused max-width, keyboard shortcuts and resizable workspaces only if reliable.
- PWA install icon/manifest, offline shell, cached public assets and permitted Quran offline feature only if licensing/storage supports it. Do not cache private account data or copyrighted recitations indiscriminately.
- Test unstable mobile data, reconnect after a mutation timeout, service worker upgrades, stale cache invalidation, dark-mode flashes, Arabic font fallback and screen rotation.
- Avoid heavy animation, excessive third-party JS, expensive charts, animation-triggered layout shifts and unreadable color blends.

# 26. ACCESSIBILITY AND INTERNATIONALIZATION ACCEPTANCE

- Target WCAG 2.2 AA in every interactive state; axe automated checks are necessary but not sufficient. Verify screen readers manually.
- Color contrast for ALL palette/mode/error combinations. Test focus visible, dialog focus trap/return, skip link, form error association, live region timing, hit areas and touch gestures with keyboard alternative.
- Math rendered with accessible text; Quran verses with consistent Arabic semantics and correct reading order; charts with text/table alternatives.
- Correct RTL/LTR switching for bilingual pages, date/number formatting, Arabic typography and mixed technical strings. Zero accidentally untranslated controls or broken placeholders.
- 200–400% zoom, large text, reduced motion and low-bandwidth accommodation.
- No animation that automatically obscures a question or starts an audio recitation.

# 27. PERFORMANCE AND OBSERVABILITY

Define performance budgets and measure on representative devices and cold/warm conditions; aspirational Core Web Vitals at p75: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1. Make regression budgets explicit, not misrepresent local traces as field data.
- Route-level bundle analysis, lazy code splitting for AI/Quran/PDF, memoized heavy calculations, pagination/virtualization for long logs, font preload where appropriate, image optimization and reduced hydration work.
- Measure interaction-to-next-screen, mutation confirm time, backend/AI first-token latency, TTS availability, failed API rates and memory use.
- Correlate client errors and server operations via scrubbed request IDs; no student content/credentials in analytics traces.
- Error boundaries and retry actions. Prevent unbounded loading, duplicate RPCs and stale React effects. Evaluate Edge Function cold starts and regional database latency.
- Test low-end Android, real/browser cloud devices and throttled network, not only headless desktop.

# 28. PROOF OF WORK: AUTOMATED AND HUMAN TESTS

### Test classes
A. Static/type/format/manifest/license checks and clean reproducible lockfile install.
B. Unit tests for reward engine rules, mastery, question grading, auth origin/callbacks, palette validation, translation fallbacks, PDF/DOCX generation and Quran source normalization.
C. Integration tests with an isolated transaction-safe database, real RLS, role matrix, wallet idempotency, purchase/box claim, notification states and account lifecycle.
D. Authenticated staging E2E: Student A/B, Teacher A/B, Admin; real signup/confirm/Google recovery (with safe test credentials), assignment → graded → wallet; lesson → mission → review → boss → reward.
E. Real Fanar tests with authorized staged provider keys: Arabic/English, multi-turn, image, files, audio, model fallback, quota, cancellation and errors, with capability gating.
F. UI screenshot / Playwright visual regression for every route and ALL palettes in representative light/dark/RTL/LTR and breakpoint combinations. Add dynamic interactive states, not only empty public pages.
G. Accessibility automated axe and manual keyboard/screen reader checks; reduce-motion and 400% zoom.
H. Security negative tests: unauthorized REST/RPC calls, horizontal and vertical escalation, session fixation, replay/double rewards, manipulated client totals, file leakage, compromised password warnings.
I. PDF/document binary and Arabic fidelity tests; canonical Quran text counts and actual audio playback; account/provider email link tests.
J. Usability review with real student/teacher journeys, content readability and 5-minute first-task success.

### Required acceptance path
1. Guest opens public landing, understands service and sees verified legal/support links.
2. Student signs up, receives correct email, confirms, signs in, returns after refresh.
3. Student opens Learn, resumes lesson, completes real checkpoint and sees single verified XP/Coins/Gems grant.
4. Student completes three-question mission, reviews weaknesses and earns eligible confirmed reward once.
5. Student completes boss and opens mystery box once; inventory and wallets reconcile after refresh.
6. Student uses Quran read/search/bookmark/recitation; sources remain correct and audio plays/stops.
7. Student asks Fanar real Arabic questions and attaches a document; provider output really arrives and privacy rules hold.
8. Teacher posts and grades assignment for authorized class; unrelated student/teacher cannot view/write it.
9. Admin reviews/publishes content and manages permissions; students cannot call those functions directly.
10. Student changes Ocean→Forest→Aura palette, locale and motion; refresh/account switch works, contrast remains readable.
11. Student can inspect rewards transaction history and delete/export/request data where support actually exists.
12. Each simulated failure has truthful error, no lost submitted data and no duplicate server event.

### Revision discipline
Tests, browser screenshots, accessibility artifacts and provider smoke must store exact Git SHA and deployment ID. Never credit newer code with an older CI run or a READY alias pointing to older code. CI “passed” does not mean authenticated, hosted or provider QA passed. Track open blockers and owner decisions explicitly.

# 29. EXECUTION PHASES — FINISH REAL VERTICAL SLICES

**Phase 0 — Truthful discovery:** exact HEAD, environment, route inventory, screenshot baseline, cross-feature trace, regression list, priority risk matrix and blocked external dependencies. No destructive actions.

**Phase 1 — Foundation and identity:** semantic tokens, typography, authentic brand, route shell/mobile navigation, bilingual state system, motion accessibility, all palettes visually audited, stable canonical domains.

**Phase 2 — Auth and legal trust:** complete provider/email flows, public landing/privacy/terms/support, Google domain-ownership workstream; test real staging sessions before more private features.

**Phase 3 — Verified learning transactions:** Learn/lesson/mission/review/boss connected end-to-end to backend work receipts and mastery; guard existing rewards logic.

**Phase 4 — Unified wallet and rewards:** migration-reviewed GEM, server-authoritative reward rules, streaks/badges, gift boxes, store/skins and synced receipts. Do not apply new schema until reviewed on staging.

**Phase 5 — Noata AI and documents:** deployed provider proof, streaming/model/voice/vision as entitled, Workshop, attachments, privacy retention and binary exports, honest capability gating.

**Phase 6 — Quran excellence:** verified source integrity, recitation availability/rights, reading controls, accessible bookmarks and calm typography.

**Phase 7 — Teacher/admin/assignments:** role-complete day-to-day workflows, curriculum studio, content lifecycle, notifications, audit and security.

**Phase 8 — Global product polish:** cross-route navigation, progress and dashboard, mobile responsive detail, all themes, meaningful animation and offline/resilience.

**Phase 9 — Release certification:** full staging-backed end-to-end test matrix, WCAG/manual checks, load/performance evidence, secure migration rehearsals, legal/operator signoff, Google verification.

**Phase 10 — Owner acceptance only:** present staged evidence and unresolved blockers. DO NOT merge draft PR, change production URLs, deploy to production or migrate production until explicit owner authorization and reviewed rollback plan.

Prioritize by security and end-user functioning, not by easiest colorful screenshot. A phase is not done merely because a button exists.

# 30. EVERY WORK SESSION MUST REPORT THE SAME FACTUAL OUTPUT

- Exact Git branch and SHA at start and end, draft PR status.
- Exact pages and systems inspected, identified root causes, changes and migrations proposed/applied (project ID).
- Verification classification for each feature, including screenshots and real authenticated/provider evidence.
- CI workflow IDs/conclusions and whether they tested exact final SHA.
- Vercel stable-alias target SHA and deployment state; caution if older.
- Staging schema/provider/Google credential state without leaking secrets.
- Known problems / blocked dependencies with actionable next owner input.
- What was NOT done and why; never convert intentions into “done”.
- Proposed next vertical slice, safe rollback and acceptance criteria.

# 31. RELEASE DEFINITION OF DONE — THE NON-NEGOTIABLE CONTRACT

Noata Aura is ready only when:
- Its advertised features are genuinely functional and verified in a fresh isolated-staging run.
- Student, teacher and admin can complete their core journeys without broken links, fake data, confusing errors, forced auth loops or lost work.
- All rewards are fairly calculated server-side, traceable, nonduplicating, synchronized and authorized.
- Quran text is verifiable, its audio provenance/rights are documented and relevant playback works.
- Fanar features advertised in UI work with real provider responses; unsupported features are transparently unavailable.
- The whole platform shares one authentic brand and motion language, a polished 7-palette system and accessible readable RTL/LTR interfaces across devices.
- Google OAuth brand/homepage ownership, privacy and terms have passed their appropriate reviews where applicable; auth recovery and delivery work.
- Security, RLS, privacy, retention, accessibility, legal review, core performance and migration gates are satisfied.
- The exact committed code is built/tested and hosted on the exact accepted preview, with honest reports.
- The owner has reviewed and explicitly approved release; no automatic merge or production mutation.

**Primary command to implementation agent:** Execute this plan against the existing Noata Aura repository. Start with an evidence-backed gap matrix and P0 broken functionality. Implement real end-to-end improvements in coherent tested vertical slices. Preserve what is already correct. Show only VERIFIED status for evidence matching the exact source SHA and deployed environment. DO NOT stop at a pretty prototype, redesign alone, or synthetic UI tests. Do not call the system “completed” until the entire release contract is satisfied.
