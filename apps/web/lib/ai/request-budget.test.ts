import test from "node:test";
import assert from "node:assert/strict";
import {
  MODEL_REQUEST_BUDGET,
  MIN_USER_MESSAGE_CHARS,
  fitMessages,
  fitRequestBody,
  minimalMessages,
  totalChars,
  trimMessage,
} from "../../../../supabase/functions/noata-ai/request-budget.ts";
import {
  RESEARCH_EVIDENCE_BUDGET,
  budgetedResearchSources,
  researchContext,
  type Research,
  type ResearchSource,
} from "../../../../supabase/functions/noata-ai/research.ts";

const researchSource = (id: number, excerpt: string): ResearchSource => ({
  id,
  title: `Source ${id} with a descriptive title`,
  url: `https://example.org/page-${id}`,
  domain: "example.org",
  excerpt,
  retrievedAt: "2026-10-20T10:00:00.000Z",
});

const liveResearch = (): Research => ({
  version: 1,
  status: "complete",
  reason: "live_web",
  query: "topic",
  provider: "langsearch",
  elapsedMs: 5,
  sources: Array.from({ length: 5 }, (_, index) => researchSource(index + 1, "e".repeat(2000))),
});

test("retrieved evidence is budgeted while every source keeps its id, title and link", () => {
  const sources = Array.from({ length: 5 }, (_, index) => researchSource(index + 1, "e".repeat(2000)));
  const { sources: bounded, trimmed } = budgetedResearchSources(sources);
  assert.equal(bounded.length, 5);
  assert.equal(trimmed, true);
  bounded.forEach((source, index) => {
    assert.equal(source.id, sources[index].id);
    assert.equal(source.title, sources[index].title);
    assert.equal(source.url, sources[index].url);
    assert.ok(source.excerpt.length < sources[index].excerpt.length);
  });
});

test("research context stays inside the evidence budget and admits that excerpts were shortened", () => {
  const context = researchContext(liveResearch());
  assert.ok(context.length <= RESEARCH_EVIDENCE_BUDGET, `evidence was ${context.length} characters`);
  assert.match(context, /shortened/);
  assert.match(context, /\[1\]/);
});

test("a search request is fitted to the provider budget without losing the current request or the evidence", () => {
  // The production system message is about 13.4k characters.
  const system = { role: "system", content: "s".repeat(13412) };
  const evidence = { role: "user", content: researchContext(liveResearch()) };
  const history = Array.from({ length: 20 }, (_, index) => ({
    role: index % 2 ? "assistant" : "user",
    content: `history turn ${index} ` + "h".repeat(3000),
  }));
  const current = { role: "user", content: "ابحث عن المنتجات" };
  const messages = [system, ...history, evidence, current];
  assert.ok(totalChars(messages) > MODEL_REQUEST_BUDGET);

  const body = fitRequestBody({ model: "Fanar", stream: true, messages }, [evidence]);
  const fitted = body.messages as { role: string; content: unknown }[];
  assert.ok(totalChars(fitted) <= MODEL_REQUEST_BUDGET, `fitted request was ${totalChars(fitted)} characters`);
  assert.equal(fitted.at(-1)?.content, current.content);
  assert.ok(fitted.some((message) => message.content === evidence.content), "retrieved evidence survives whole");
  assert.ok(fitted.length < messages.length, "older turns are dropped first");
});

test("an oversized current request is shortened but keeps its beginning and its end", () => {
  const current = { role: "user", content: "START" + "x".repeat(30000) + "END" };
  const fitted = fitMessages([{ role: "system", content: "policy" }, current]);
  const content = fitted.messages.at(-1)?.content as string;
  assert.ok(content.length < current.content.length);
  assert.ok(content.startsWith("START"));
  assert.ok(content.endsWith("END"));
  assert.ok(content.length >= MIN_USER_MESSAGE_CHARS);
});

test("trimMessage keeps the head and the tail of a long message", () => {
  const trimmed = trimMessage("a".repeat(5000) + "END", 2000);
  assert.ok(trimmed.length <= 2000);
  assert.ok(trimmed.endsWith("END"));
});

test("the minimal request keeps the policy and the current request only", () => {
  const minimal = minimalMessages([
    { role: "system", content: "policy" },
    { role: "assistant", content: "old answer" },
    { role: "user", content: "current question" },
  ]);
  assert.equal(minimal.length, 2);
  assert.equal(minimal[0]?.role, "system");
  assert.equal(minimal[1]?.content, "current question");
});
