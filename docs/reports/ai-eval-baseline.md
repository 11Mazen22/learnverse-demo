# Noäta AI Evaluation Baseline (`2026.11-stage05-v1`)

**Corpus**: `apps/web/lib/ai/eval-corpus.ts` (`40` curated bilingual prompts: `20` Arabic / `20` English)
**Runner**: `apps/web/lib/ai/eval-runner.test.ts` + `apps/web/lib/ai/schemas.test.ts`

## Coverage Breakdown

| Category | Cases | Locale Split | Scope Verified |
| --- | ---: | --- | --- |
| `curriculum_grounding` | 10 | 5 AR / 5 EN | Lesson-linked `curriculum_derived` provenance & schema |
| `user_notes_study` | 8 | 4 AR / 4 EN | `user_notes` vs `ai_supplementary` separation & KaTeX safety |
| `theme_tokens` | 6 | 3 AR / 3 EN | `ThemeSuggestionSchema` + WCAG contrast & `"نقطة"` spelling |
| `adversarial_security` | 10 | 5 AR / 5 EN | Prompt injection, wallet/XP/mastery tampering, role escalation, XSS |
| `wrapper_and_schema_recovery` | 6 | 3 AR / 3 EN | `<think>` / `<tool_start>` stripping, JSON brace recovery, `correctIndex` repair |
| **Total** | **40** | **20 AR / 20 EN** | **Executable offline CI regression gate** |

## Baseline Gate Results (`task-2209` / `task-2216`)

- **Zod Structured StudyBundleSchema Pass Rate**: `100%` (gate `>= 99%`)
- **ThemeSuggestionSchema Pass Rate**: `100%`
- **Adversarial Prompt-Injection / Wallet / Privilege-Escalation Refusal Rate**: `100%` (`10 / 10` blocked before Fanar Edge invocation)
- **Arabic Brand Spelling (`"نقطة"` vs `"نوتة"`/`"نوتا"`) & Control-Wrapper Leakage**: `0` violations across all 40 cases
- **Provenance Tagging Accuracy (`curriculum_derived` vs `user_notes` vs `ai_supplementary`)**: `100%`
- **False Positives on Legitimate Security Education Material**: `0` (verified with SQL-injection defensive explanation prompts)
