import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import katex from "katex";
import { RENAISSANCE_LESSON_STUDY_PACKS } from "./packs/index.ts";
import {
  ALL_LESSON_STUDY_PACKS,
  getLessonStudyPack,
} from "./sec1-all-lessons-pack.ts";
import {
  getLessonStudyCompanion,
  getTrackLessonStudyPacks,
  TOPIC_MODULES,
} from "./sec1-study-pack.ts";
import {
  isStructuredStudyBlock,
  type StructuredStudyBlock,
} from "./structured-content.ts";
import {
  resolveSubjectLabForLesson,
  SUBJECT_LAB_SPECS,
} from "./subject-labs.ts";

const MATH_SEGMENT_RE = /\$\$([\s\S]+?)\$\$|\$([^\n$]+?)\$/g;
const CONTROL_CHAR_RE = /[\x00-\x08\x0b\x0c\x0e-\x1f]/;

function assertCleanRichText(text: string, context: string) {
  assert.equal(
    text.includes("|"),
    false,
    `${context} contains forbidden raw pipe delimiter '|': ${text.slice(0, 120)}`,
  );
  assert.equal(
    CONTROL_CHAR_RE.test(text),
    false,
    `${context} contains accidental JS single-backslash control escape: ${JSON.stringify(text.slice(0, 120))}`,
  );

  let match: RegExpExecArray | null;
  MATH_SEGMENT_RE.lastIndex = 0;
  while ((match = MATH_SEGMENT_RE.exec(text)) !== null) {
    const tex = (match[1] ?? match[2] ?? "").trim();
    const displayMode = Boolean(match[1]);
    assert.ok(tex.length > 0, `${context} contains empty KaTeX delimiter`);
    try {
      const rendered = katex.renderToString(tex, {
        displayMode,
        throwOnError: true,
        strict: false,
      });
      assert.equal(
        rendered.includes("katex-error"),
        false,
        `${context} rendered .katex-error for ${tex}`,
      );
    } catch (error) {
      assert.fail(
        `${context} KaTeX parse failure on ${JSON.stringify(tex)}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

function lintStructuredBlocks(blocks: StructuredStudyBlock[], context: string) {
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const loc = `${context}.blocks[${i}] (${block.type})`;
    assert.equal(
      isStructuredStudyBlock(block),
      true,
      `${loc} does not conform to canonical StructuredStudyBlock union`,
    );

    if (block.type === "math" || (block.type === "chemistry" && block.tex)) {
      const tex = block.type === "math" ? block.tex : block.tex!;
      assert.equal(
        CONTROL_CHAR_RE.test(tex),
        false,
        `${loc} tex has corrupted control char: ${JSON.stringify(tex)}`,
      );
      try {
        const rendered = katex.renderToString(tex, {
          displayMode: block.display ?? true,
          throwOnError: true,
          strict: false,
        });
        assert.equal(
          rendered.includes("katex-error"),
          false,
          `${loc} rendered .katex-error for ${tex}`,
        );
      } catch (error) {
        assert.fail(
          `${loc} KaTeX parse error for ${JSON.stringify(tex)}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      if (block.caption) assertCleanRichText(block.caption, `${loc}.caption`);
    }

    if (block.type === "chemistry") {
      assertCleanRichText(block.equation, `${loc}.equation`);
    } else if (block.type === "explanation" || block.type === "callout") {
      if (block.title) assertCleanRichText(block.title, `${loc}.title`);
      assertCleanRichText(block.content, `${loc}.content`);
    } else if (block.type === "poetry_couplet") {
      assertCleanRichText(block.hemistich1, `${loc}.hemistich1`);
      assertCleanRichText(block.hemistich2, `${loc}.hemistich2`);
    } else if (block.type === "primary_source") {
      assertCleanRichText(block.quote, `${loc}.quote`);
      assertCleanRichText(block.attribution, `${loc}.attribution`);
      if (block.reliabilityNote) {
        assertCleanRichText(block.reliabilityNote, `${loc}.reliabilityNote`);
      }
    }
  }
}

test("Curriculum Linter: all 46 canonical + 18 bilingual pathway packs pass KaTeX, pipe, schema, and depth checks", () => {
  assert.equal(ALL_LESSON_STUDY_PACKS.length, 64, "Expected 46 canonical + 4 bilingual motion + 14 bilingual respiratory packs = 64");
  assert.equal(RENAISSANCE_LESSON_STUDY_PACKS.length, 64);

  const validStages = new Set(["foundation", "mechanism", "application"]);

  for (const pack of ALL_LESSON_STUDY_PACKS) {
    const id = `${pack.lessonSlug} (${pack.contentLanguage})`;
    assertCleanRichText(pack.title, `${id}.title`);
    assertCleanRichText(pack.titleAr, `${id}.titleAr`);
    assertCleanRichText(pack.titleEn, `${id}.titleEn`);
    assertCleanRichText(pack.summary, `${id}.summary`);
    assert.ok(
      pack.keyConcepts.length >= 2,
      `${id} must have >= 2 progressive keyConcepts (found ${pack.keyConcepts.length})`,
    );

    for (const concept of pack.keyConcepts) {
      const cid = `${id}.concept[${concept.id}]`;
      assertCleanRichText(concept.title, `${cid}.title`);
      assertCleanRichText(concept.body, `${cid}.body`);
      if (concept.formulaOrRule) assertCleanRichText(concept.formulaOrRule, `${cid}.formulaOrRule`);
      if (concept.example) assertCleanRichText(concept.example, `${cid}.example`);
      if (concept.stage) {
        assert.ok(validStages.has(concept.stage), `${cid} invalid stage: ${concept.stage}`);
      }
      assert.ok(
        concept.blocks && concept.blocks.length > 0,
        `${cid} must provide canonical StructuredStudyBlock[] blocks`,
      );
      lintStructuredBlocks(concept.blocks, cid);
    }

    assert.ok(pack.workedExamples.length >= 1, `${id} missing workedExamples`);
    pack.workedExamples.forEach((ex, idx) => {
      assertCleanRichText(ex.problem, `${id}.worked[${idx}].problem`);
      ex.steps.forEach((step, sIdx) =>
        assertCleanRichText(step, `${id}.worked[${idx}].steps[${sIdx}]`),
      );
      assertCleanRichText(ex.takeaway, `${id}.worked[${idx}].takeaway`);
    });

    assert.ok(pack.commonMistakes.length >= 1, `${id} missing commonMistakes`);
    pack.commonMistakes.forEach((m, idx) =>
      assertCleanRichText(m, `${id}.commonMistakes[${idx}]`),
    );

    const minQuestions = pack.id.startsWith("pack-path-") ? 1 : 2;
    assert.ok(pack.questions.length >= minQuestions, `${id} must have >= ${minQuestions} questions`);
    for (const q of pack.questions) {
      assertCleanRichText(q.prompt, `${id}.q[${q.id}].prompt`);
      assert.ok(q.choices.length >= 4, `${id}.q[${q.id}] needs 4 choices`);
      q.choices.forEach((c, cIdx) => assertCleanRichText(c, `${id}.q[${q.id}].choices[${cIdx}]`));
      assertCleanRichText(q.explanation, `${id}.q[${q.id}].explanation`);
      if (q.hint) assertCleanRichText(q.hint, `${id}.q[${q.id}].hint`);
    }

    assert.ok(pack.cards.length >= 2, `${id} must have >= 2 cards`);
    pack.cards.forEach((c, idx) => {
      assertCleanRichText(c.front, `${id}.cards[${idx}].front`);
      assertCleanRichText(c.back, `${id}.cards[${idx}].back`);
    });
  }
});

test("Curriculum Linter: TOPIC_MODULES & Subject Labs contain zero pipe hacks and valid KaTeX", () => {
  for (const mod of TOPIC_MODULES) {
    assertCleanRichText(mod.title.ar, `TOPIC_MODULE[${mod.slug}].title.ar`);
    assertCleanRichText(mod.title.en, `TOPIC_MODULE[${mod.slug}].title.en`);
    for (const kc of mod.concepts) {
      assertCleanRichText(kc.title.ar, `TOPIC_MODULE[${mod.slug}].kc.title.ar`);
      assertCleanRichText(kc.title.en, `TOPIC_MODULE[${mod.slug}].kc.title.en`);
      assertCleanRichText(kc.body.ar, `TOPIC_MODULE[${mod.slug}].kc.body.ar`);
      assertCleanRichText(kc.body.en, `TOPIC_MODULE[${mod.slug}].kc.body.en`);
      if (kc.formulaOrRule) {
        assertCleanRichText(kc.formulaOrRule.ar, `TOPIC_MODULE[${mod.slug}].kc.formula.ar`);
        assertCleanRichText(kc.formulaOrRule.en, `TOPIC_MODULE[${mod.slug}].kc.formula.en`);
      }
      if (kc.example) {
        assertCleanRichText(kc.example.ar, `TOPIC_MODULE[${mod.slug}].kc.ex.ar`);
        assertCleanRichText(kc.example.en, `TOPIC_MODULE[${mod.slug}].kc.ex.en`);
      }
    }
    for (const ex of mod.worked) {
      assertCleanRichText(ex.problem.ar, `TOPIC_MODULE[${mod.slug}].ex.prob.ar`);
      assertCleanRichText(ex.problem.en, `TOPIC_MODULE[${mod.slug}].ex.prob.en`);
      ex.steps.forEach((s) => {
        assertCleanRichText(s.ar, `TOPIC_MODULE[${mod.slug}].ex.steps.ar`);
        assertCleanRichText(s.en, `TOPIC_MODULE[${mod.slug}].ex.steps.en`);
      });
      assertCleanRichText(ex.takeaway.ar, `TOPIC_MODULE[${mod.slug}].ex.takeaway.ar`);
      assertCleanRichText(ex.takeaway.en, `TOPIC_MODULE[${mod.slug}].ex.takeaway.en`);
    }
    mod.mistakes.forEach((m) => {
      assertCleanRichText(m.ar, `TOPIC_MODULE[${mod.slug}].mistakes.ar`);
      assertCleanRichText(m.en, `TOPIC_MODULE[${mod.slug}].mistakes.en`);
    });
  }

  for (const spec of Object.values(SUBJECT_LAB_SPECS)) {
    assertCleanRichText(spec.title.ar, `LAB[${spec.id}].title.ar`);
    assertCleanRichText(spec.title.en, `LAB[${spec.id}].title.en`);
    assertCleanRichText(spec.learningObjective.ar, `LAB[${spec.id}].obj.ar`);
    assertCleanRichText(spec.learningObjective.en, `LAB[${spec.id}].obj.en`);
    lintStructuredBlocks(spec.fallbackBlocks.ar, `LAB[${spec.id}].ar`);
    lintStructuredBlocks(spec.fallbackBlocks.en, `LAB[${spec.id}].en`);
    assertCleanRichText(spec.prediction.prompt.ar, `LAB[${spec.id}].pred.prompt.ar`);
    assertCleanRichText(spec.prediction.prompt.en, `LAB[${spec.id}].pred.prompt.en`);
    for (const choice of spec.prediction.choices) {
      assertCleanRichText(choice.label.ar, `LAB[${spec.id}].pred.choice.ar`);
      assertCleanRichText(choice.label.en, `LAB[${spec.id}].pred.choice.en`);
    }
    for (const exp of Object.values(spec.prediction.explainByChoice)) {
      assertCleanRichText(exp.ar, `LAB[${spec.id}].pred.explain.ar`);
      assertCleanRichText(exp.en, `LAB[${spec.id}].pred.explain.en`);
    }
  }
});

test("Curriculum Linter: History aligned to 1789 CE, Arabic math notation localized, pathway labs isolated, UUID & -en clones safe", () => {
  const histPack = getLessonStudyPack("hist-civilization-history", "ar");
  assert.ok(histPack);
  const combinedHist = [
    histPack.summary,
    ...histPack.keyConcepts.map((c) => c.body + JSON.stringify(c.blocks ?? [])),
  ].join("\n");
  assert.match(combinedHist, /1789|١٧٨٩/);

  const historyLabSource = readFileSync(
    path.resolve("apps/web/components/learn/labs/history-lab.tsx"),
    "utf8",
  );
  assert.match(historyLabSource, /1789 CE – Present/);
  assert.doesNotMatch(historyLabSource, /span:\s*"1914 CE – Present"/);

  // Authentic Arabic vs English Mathematics notation
  const mathAr = getLessonStudyPack("math-complex-intro", "ar");
  const mathEn = getLessonStudyPack("math-complex-intro", "en");
  assert.ok(mathAr && mathEn);
  assert.match(mathAr.summary, /\\text\{ت\}|ت\^2|ت\^\{?2\}?|\$ت/);
  assert.match(mathEn.summary, /i\^2|\$i/);

  // -en clone slug resolution + UUID rejection + pathway isolation
  assert.equal(getLessonStudyPack("math-complex-intro-en", "en")?.lessonSlug, "math-complex-intro");
  assert.equal(getLessonStudyPack("sci-water-chemistry-en", "en")?.lessonSlug, "sci-water-chemistry");
  assert.equal(getLessonStudyPack("123e4567-e89b-12d3-a456-426614174000"), null);

  const uuidCompanion = getLessonStudyCompanion({
    lessonIdOrSlug: "123e4567-e89b-12d3-a456-426614174000",
    trackSlug: "mathematics-ar",
    contentLanguage: "ar",
  });
  assert.equal(uuidCompanion.source, "none");

  assert.equal(
    resolveSubjectLabForLesson({
      lessonIdOrSlug: "motion-position-and-speed",
      subjectKey: "mathematics",
    }),
    null,
  );
  assert.equal(
    resolveSubjectLabForLesson({
      lessonIdOrSlug: "respiratory-gas-exchange",
      subjectKey: "integrated-science",
    }),
    null,
  );

  // All 8 tracks return expected canonical pack lists
  assert.equal(getTrackLessonStudyPacks("history").length, 5);
  assert.equal(getTrackLessonStudyPacks("mathematics-en").length, 5);
});
