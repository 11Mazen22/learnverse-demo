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
});

test('malformed unstructured output is safely treated as final content', () => {
  const deltas = [];
  const router = createVisibleReasoningRouter((delta) => deltas.push(delta));
  router.push('A normal answer without protocol tags.');
  assert.equal(router.finish().content, 'A normal answer without protocol tags.');
  assert.equal(deltas[0].kind, 'content');
});
