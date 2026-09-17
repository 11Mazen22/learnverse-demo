# Decisions and assumptions

## Confirmed from the brief

- Neutral configurable name: “Learning Platform / منصة التعلّم”.
- Arabic-first with English parity and true direction switching.
- XP is kept separate conceptually; Coins are the only spendable MVP currency. Gems and competitive features are deferred.
- Mastery evidence is independent from cosmetic rewards.
- Demo content is never labeled as official or syllabus-aligned.

## Reversible implementation choices

- **No external dependencies.** An empty workspace and a runnable vertical slice favored Node’s standard library. This reduces supply-chain/setup friction but is not a recommendation for the final production identity stack.
- **Single-node JSON store.** Transactions are serialized and persisted through atomic file replacement. This provides real persistence and deterministic local tests, but is not appropriate for multi-instance deployment or a school pilot.
- **In-memory bearer sessions.** Sessions intentionally expire when the server restarts. Demo passwords are seeded in plain text and clearly limited to local demonstration use.
- **Demonstration audience/content.** The included motion material is generic secondary-level science and explicitly not curriculum-approved.
- **Mastery rule `mvp-1`.** Most recent eight non-repeat attempts; at least three distinct independent questions; assisted correct answers receive 0.55 weight; difficulty weights are core 0.9, application 1.0, transfer 1.08. Thresholds are hypotheses: below 50 reteach, 50–69 supported, 70–84 mixed, and 85+ provisionally mastered.
- **Review rule.** Next checks use 1/3/7 days based on recent independent success. An incorrect response schedules recovery.
- **Economy rule `economy-mvp-1`.** One-time lesson completion grants 25 Coins; first 3/3 Boss completion grants 60; starter demo balance is 160. All are configurable demonstration values.
- **XP rule `xp-mvp-1`.** XP is a separate, non-spendable ledger currency: 10 XP on a question's first-ever correct attempt, 15 XP one-time on lesson completion, 40 XP one-time on a Boss's first 3/3. Level is `floor(xp / 100) + 1`. This mirrors the Coins ledger mechanically (same append-only, idempotent entries) but is never spendable and never gates content — it is pure progression, per the brief's separation of XP from Coins/Mastery.
- **Parallel question pools.** Each MVP question has exactly one reviewed variant (`variantOf` field), used only on retry: a wrong lesson answer offers the variant next; a Unit Boss retried after a non-perfect score serves its variant trio, returning to the primary trio once the student has ever scored 3/3. This is a deliberately small first implementation of "reviewed parallel pool," not a large item bank — expanding the pool per question is future content-authoring work, not an architecture change.
- **Content lifecycle is admin-only in the MVP.** `reviewStatus` (draft → in-review → approved, or back to draft) and `publicationStatus` (draft → published-demo → retired) are separate fields with an explicit, server-enforced transition table (`lib/domain.mjs:transitionQuestion`). Only `admin` may call the transition endpoint; every transition is audited with actor and timestamp. A full multi-reviewer workflow (named reviewer roles, flagged-content triage) is future staff-tooling work.
- **Character equip is slot-based, not a single avatar swap.** A student can independently equip one owned item per cosmetic type (avatar/outfit/companion/background); the server rejects equipping an unowned item or one of the wrong type for that slot. This directly implements the brief's "personal character space" without introducing a new currency.
- **Offline queue covers practice, not assessment or money.** Lesson-question attempts made offline are queued (idempotent, localStorage-backed) and clearly marked pending until a real server response arrives — never shown as correct/incorrect before that. Unit Boss and Shop purchases are blocked outright while offline instead of queued, because silently queuing either would let a client claim an assessment result or a currency-affecting purchase before the server had a chance to validate it.
- **Static asset caching uses `no-cache`, not a long `max-age`.** This app has no build/content-hashing step, so a long max-age would leave already-open tabs running stale client code for up to that long after every deploy. `no-cache` (must-revalidate) plus a manually-bumped `?v=` query string on the script/style tags is the interim mitigation until a real build pipeline exists.

## Known limitations

- No claim of official curriculum approval, learning efficacy, production security, deployment, backup restoration, or pilot validation.
- Each question has exactly one reviewed variant; after that single retry the pool is exhausted and the primary question repeats. A deeper pool needs more authored content, not more code.
- Rate limiting is a basic in-memory per-IP fixed window — real DDoS/brute-force protection needs a production WAF/rate-limit layer in front of this.
- The content lifecycle supports draft→review→approve→publish→retire but not yet "revise" (publishing a corrected new version of already-published content); a retire-and-replace is the current workaround.
