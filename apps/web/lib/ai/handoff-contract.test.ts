import assert from "node:assert/strict";
import test from "node:test";
import {
  buildStructuredAiHandoffHref,
  parseStructuredAiHandoff,
  sanitizeLessonIdParam,
} from "./handoff-contract.ts";

test("buildStructuredAiHandoffHref emits short allowlisted query parameters without full prompts", () => {
  const href = buildStructuredAiHandoffHref({
    source: "lesson",
    action: "explain_simply",
    subject: "mathematics-en",
    lessonId: "math-complex-intro",
    topic: "Powers of i",
  });
  const url = new URL(href, "https://noata.example");
  assert.equal(url.pathname, "/ai");
  assert.equal(url.searchParams.get("source"), "lesson");
  assert.equal(url.searchParams.get("action"), "explain_simply");
  assert.equal(url.searchParams.get("subject"), "mathematics");
  assert.equal(url.searchParams.get("lesson_id"), "math-complex-intro");
  assert.equal(url.searchParams.get("topic"), "Powers of i");
  assert.equal(url.searchParams.get("prompt"), null);
});

test("parseStructuredAiHandoff rejects unknown sources/actions and enriches valid lesson metadata", () => {
  const params = new URLSearchParams(
    "source=lesson&action=common_pitfalls&subject=integrated-science-ar&lesson_id=sci-water-chemistry",
  );
  const parsed = parseStructuredAiHandoff(params, "ar", (id) =>
    id === "sci-water-chemistry" ? { title: "الماء وخصائصه الحرارية", trackSlug: "integrated-science-ar" } : null,
  );
  assert.equal(parsed.structured, true);
  assert.equal(parsed.source, "lesson");
  assert.equal(parsed.action, "common_pitfalls");
  assert.equal(parsed.subject, "integrated-science");
  assert.match(parsed.prompt, /الماء وخصائصه الحرارية/);

  const unknown = parseStructuredAiHandoff(new URLSearchParams("source=evil&action=steal"), "en");
  assert.equal(unknown.source, null);
  assert.equal(unknown.action, null);
  assert.equal(unknown.prompt, "");
});

test("assignment source enforces hint_only guardrail even if URL requests exam_quiz or legacy prompt", () => {
  const href = buildStructuredAiHandoffHref({
    source: "assignment",
    action: "exam_quiz",
    subject: "mathematics-en",
    topic: "Quadratic Discriminant",
  });
  const parsed = parseStructuredAiHandoff(
    new URLSearchParams(`${href.split("?")[1]}&prompt=${encodeURIComponent("Solve question 1 = ?")}`),
    "en",
  );
  assert.equal(parsed.assignmentGuardrail, true);
  assert.equal(parsed.action, "hint_only");
  assert.match(parsed.prompt, /do NOT reveal direct answers/i);
  assert.doesNotMatch(parsed.prompt, /Solve question 1/);

  assert.equal(sanitizeLessonIdParam("../etc/passwd"), null);
  assert.equal(sanitizeLessonIdParam("math-complex-intro"), "math-complex-intro");
});
