# Demonstration content authoring guide

Every question needs a stable ID and immutable version, skill tag, difficulty (`core`, `application`, or `transfer`), supported answer type, answer key, useful explanation, provenance, review state, and publication state.

Supported scoring in this MVP:

- Multiple choice with one stable answer index.
- Numeric answer with an explicit tolerance and displayed unit.

Lifecycle for real content:

1. Draft original material and record source/rights.
2. Review factual accuracy, language, age suitability, distractors, units, tolerance, and accessibility.
3. Approve with a named authorized reviewer and timestamp.
4. Publish a frozen version. Attempts always retain that version number.
5. Revise by creating a new version; retire instead of silently changing prior meaning.

Do not infer redistribution rights from public availability. AI-produced material remains a draft until human review. Never change an answer key on a published version; publish a corrected version and retain the old attempt record.

## Lifecycle is enforced server-side, not just documented

`reviewStatus` (`draft → in-review → approved`, or back to `draft`) and `publicationStatus` (`draft → published-demo → retired`) are separate fields with an explicit transition table in `lib/domain.mjs:transitionQuestion`. Only an `admin` may call `PATCH /api/admin/questions/:id/status` with `{ action }`, where `action` is one of `submit-review`, `approve`, `return-to-draft`, `publish`, `retire`. Every transition records the acting reviewer/publisher and timestamp, and is written to the audit log. An out-of-order transition (e.g. publishing a draft that was never approved) is rejected with a clear error, not silently coerced.

## Parallel-pool variants (`variantOf`)

A question may set `variantOf: '<original-question-id>'` to mark itself as a reviewed alternate of that question — same skill, same difficulty, same type, different surface numbers/wording. The server uses this to avoid ever repeating the literal same question on a retry:

- A wrong lesson-question answer offers the question's variant (if one exists and is published) as the next attempt for that checkpoint slot.
- A Unit Boss retried after a non-3/3 score serves the unit's `bossVariantQuestionIds` set instead of `bossQuestionIds`, until the student scores 3/3, after which the primary set returns.

A variant still needs its own full review/approval/publication — `variantOf` only records lineage, it does not imply the variant inherits its original's review state. Currently each question has one variant; a deeper pool (several variants) is a straightforward extension of the same field, just more authored content.
