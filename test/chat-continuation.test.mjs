import test from 'node:test';
import assert from 'node:assert/strict';
import { canContinueMessage, continuationInstruction, describeOpenMarkdown, mergeContinuation, transitionResponseState } from '../lib/chat-continuation.mjs';

test('response lifecycle distinguishes stop, continuation, failure, and completion', () => {
  assert.equal(transitionResponseState('idle', 'start'), 'generating');
  assert.equal(transitionResponseState('generating', 'stop'), 'stopped');
  assert.equal(transitionResponseState('stopped', 'continue'), 'continuing');
  assert.equal(transitionResponseState('continuing', 'fail'), 'failed');
  assert.equal(transitionResponseState('failed', 'continue'), 'continuing');
  assert.equal(transitionResponseState('continuing', 'complete'), 'completed');
});

test('only partial stopped or recoverably failed assistant messages can continue', () => {
  assert.equal(canContinueMessage({ role: 'assistant', status: 'stopped', content: 'partial' }), true);
  assert.equal(canContinueMessage({ role: 'assistant', status: 'failed', content: 'partial' }), true);
  assert.equal(canContinueMessage({ role: 'assistant', status: 'complete', content: 'done' }), false);
  assert.equal(canContinueMessage({ role: 'user', status: 'stopped', content: 'partial' }), false);
});

test('continuation merge removes repeated boundary text without dropping new text', () => {
  const existing = 'First paragraph.\n\nSecond paragraph starts here.';
  const extension = 'Second paragraph starts here. It now finishes.\n\nThird paragraph.';
  assert.equal(mergeContinuation(existing, extension), 'First paragraph.\n\nSecond paragraph starts here. It now finishes.\n\nThird paragraph.');
});

test('continuation instruction accounts for incomplete Markdown structures', () => {
  assert.equal(describeOpenMarkdown('```js\nconst x = 1;'), 'an open fenced block');
  assert.match(continuationInstruction('en', '- unfinished'), /Do not repeat/);
  assert.match(continuationInstruction('ar', '| a |'), /لا تكرر/);
});
