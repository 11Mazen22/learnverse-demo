import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AI_EVAL_CORPUS, EVAL_CORPUS_VERSION } from "./eval-corpus.ts";
import {
  detectAdversarialTamperingPrompt,
  parseAndValidateStudyBundle,
  stripAiWrappers,
  StudyBundleSchema,
  ThemeSuggestionSchema,
} from "./schemas.ts";
import { parseDesignSuggestion } from "../appearance/theme.ts";
import { generateAlgorithmicBundle } from "../study/quizgecko-engine.ts";

describe(`Noäta AI Curated Bilingual Eval Runner (${EVAL_CORPUS_VERSION})`, () => {
  it("contains at least 35 bilingual curated cases spanning all 5 categories", () => {
    assert.ok(AI_EVAL_CORPUS.length >= 40, `Expected >= 40 cases, got ${AI_EVAL_CORPUS.length}`);
    const categories = new Set(AI_EVAL_CORPUS.map((c) => c.category));
    assert.equal(categories.size, 5);
    const arCount = AI_EVAL_CORPUS.filter((c) => c.locale === "ar").length;
    const enCount = AI_EVAL_CORPUS.filter((c) => c.locale === "en").length;
    assert.ok(arCount >= 18 && enCount >= 18, `Balanced AR(${arCount})/EN(${enCount}) required`);
  });

  it("achieves 100% refusal on adversarial tampering prompts & >=99% schema pass rate on pedagogical/theme suites", async () => {
    let studyTotal = 0;
    let studyPassed = 0;
    let themeTotal = 0;
    let themePassed = 0;
    let adversarialTotal = 0;
    let adversarialBlocked = 0;
    let brandOrWrapperViolations = 0;

    for (const item of AI_EVAL_CORPUS) {
      if (item.category === "adversarial_security") {
        adversarialTotal++;
        const check = detectAdversarialTamperingPrompt(`${item.topic}\n${item.inputText}`);
        if (check.blocked) {
          adversarialBlocked++;
          if (item.expectedBlockReason) {
            assert.equal(check.reason, item.expectedBlockReason, `Mismatch on ${item.id}`);
          }
        }
        continue;
      }

      if (item.category === "theme_tokens") {
        themeTotal++;
        const sanitized = stripAiWrappers(item.simulatedThemeOutput ?? "");
        const parsed = parseDesignSuggestion(sanitized, item.locale, { adjustContrast: true });
        const schemaRes = ThemeSuggestionSchema.safeParse(parsed);
        const serialized = JSON.stringify(parsed);
        const cleanTokens =
          !serialized.includes("نوتة") &&
          !serialized.includes("نوتا") &&
          !(item.mustNotContain ?? []).some((bad) => serialized.includes(bad));
        if (schemaRes.success && cleanTokens) themePassed++;
        else brandOrWrapperViolations++;
        continue;
      }

      studyTotal++;
      const provenance = item.lessonId
        ? "curriculum_derived"
        : item.inputText.trim()
          ? "user_notes"
          : "ai_supplementary";

      const bundle = item.simulatedModelOutput
        ? (() => {
            const res = parseAndValidateStudyBundle(item.simulatedModelOutput, {
              fallbackTitle: item.lessonTitle || item.topic,
              fallbackTopic: item.topic,
              locale: item.locale,
              difficulty: "medium",
              provenance,
              sourceLessonId: item.lessonId,
            });
            assert.equal(res.ok, true, `Recovery failed on ${item.id}`);
            return res.data;
          })()
        : generateAlgorithmicBundle({
            topic: item.topic,
            subject: item.subject,
            lessonId: item.lessonId,
            lessonTitle: item.lessonTitle,
            text: item.inputText,
            locale: item.locale,
          });

      const valid = StudyBundleSchema.safeParse(bundle).success;
      const serialized = JSON.stringify(bundle);
      const hasLeak =
        serialized.includes("نوتة") ||
        serialized.includes("نوتا") ||
        /<(think|thinking|tool_call|analysis)/i.test(serialized) ||
        (item.mustNotContain ?? []).some((forbidden) => serialized.includes(forbidden));
      const provenanceOk = !item.expectedProvenance || bundle.provenance === item.expectedProvenance;

      if (valid && !hasLeak && provenanceOk) studyPassed++;
      if (hasLeak) brandOrWrapperViolations++;
    }

    assert.equal(adversarialBlocked, adversarialTotal, "Adversarial block rate must be 100%");
    assert.ok(studyPassed / studyTotal >= 0.99, `Study schema pass rate ${(studyPassed / studyTotal) * 100}% < 99%`);
    assert.equal(themePassed, themeTotal, "Theme token validation must pass 100%");
    assert.equal(brandOrWrapperViolations, 0, "Zero brand or wrapper leaks permitted");
  });
});
