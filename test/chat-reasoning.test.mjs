import test from 'node:test';
import assert from 'node:assert/strict';
import { createVisibleReasoningRouter } from '../lib/chat-reasoning.mjs';

function route(chunks) {
  const deltas = [];
  const router = createVisibleReasoningRouter((delta) => deltas.push(delta));
  for (const chunk of chunks) router.push(chunk);
  return { result: router.finish(), deltas };
}

test('localized reasoning tags are removed and routed to separate streaming channels', () => {
  const { result, deltas } = route([
    '<rea', 'soning>نحل المسألة مع إبقاء API كما هي.</rea',
    'soning><answer>الإجابة العربية.</ans', 'wer>',
  ]);
  assert.equal(result.thinking, 'نحل المسألة مع إبقاء API كما هي.');
  assert.equal(result.content, 'الإجابة العربية.');
  assert.equal(result.structured, true);
  assert.ok(deltas.some((delta) => delta.kind === 'thinking'));
  assert.ok(deltas.some((delta) => delta.kind === 'content'));
  assert.ok(deltas.every((delta) => !delta.text.includes('<reasoning>') && !delta.text.includes('<answer>')));
});

test('English reasoning and answer use the same routing contract', () => {
  const { result } = route(['<reasoning>Compare the values.</reasoning>', '<answer>The result is 42.</answer>']);
  assert.equal(result.thinking, 'Compare the values.');
  assert.equal(result.content, 'The result is 42.');
});

test('a malformed unstructured response is held and becomes final content without tag leakage', () => {
  const { result, deltas } = route(['A plain ', 'fallback answer.']);
  assert.equal(result.structured, false);
  assert.equal(result.content, 'A plain fallback answer.');
  assert.equal(result.thinking, '');
  assert.deepEqual(deltas, [{ kind: 'content', text: 'A plain fallback answer.' }]);
});
