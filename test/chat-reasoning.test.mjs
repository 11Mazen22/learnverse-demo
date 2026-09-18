import test from 'node:test';
import assert from 'node:assert/strict';
import { createVisibleReasoningRouter } from '../lib/chat-reasoning.mjs';

test('question-specific analysis and answer tags stay separate across split chunks', () => {
  const deltas = [];
  const router = createVisibleReasoningRouter((delta) => deltas.push(delta));
  for (const part of ['<rea', 'soning>Goal: explain React API flow.\nPlan: request, response, state.</rea', 'soning><answer>React calls the API with ', '`fetch`.</answer>']) router.push(part);
  const result = router.finish();
  assert.match(result.thinking, /React API flow/);
  assert.equal(result.content, 'React calls the API with `fetch`.');
  assert.ok(deltas.every((delta) => !delta.text.includes('<reasoning>') && !delta.text.includes('<answer>')));
  assert.ok(deltas.filter((delta) => delta.kind === 'thinking').length >= 2, 'analysis should stream progressively instead of arriving only at the closing tag');
});

test('a closing reasoning tag split across chunks never leaks while earlier analysis streams', () => {
  const deltas = [];
  const router = createVisibleReasoningRouter((delta) => deltas.push(delta));
  router.push('<reasoning>Goal: explain the actual request. Plan: use three steps.');
  assert.ok(deltas.some((delta) => delta.kind === 'thinking' && delta.text.includes('Goal:')));
  router.push('</rea');
  assert.ok(deltas.every((delta) => !delta.text.includes('</rea')));
  router.push('soning><answer>Final.</answer>');
  const result = router.finish();
  assert.equal(result.content, 'Final.');
  assert.ok(!result.thinking.includes('</reasoning>'));
});

test('malformed unstructured output is safely treated as final content', () => {
  const deltas = [];
  const router = createVisibleReasoningRouter((delta) => deltas.push(delta));
  router.push('A normal answer without protocol tags.');
  assert.equal(router.finish().content, 'A normal answer without protocol tags.');
  assert.equal(deltas[0].kind, 'content');
});
