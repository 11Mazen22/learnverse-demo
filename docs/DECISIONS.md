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

## Known limitations

- No claim of official curriculum approval, learning efficacy, production security, deployment, backup restoration, or pilot validation.
- The fixed Boss set is reused on retry; a reviewed parallel pool is required before assessment use.
- Static assets can work offline, but answers are not queued. The interface truthfully says unsent answers wait; it does not claim they were saved.
- XP/levels are modeled as future progression, not exposed as a misleading nonfunctional feature.
