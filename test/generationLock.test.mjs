import test from 'node:test';
import assert from 'node:assert/strict';
import { isGenerationLocked, releaseGenerationLock, tryAcquireGenerationLock } from '../lib/generationLock.mjs';

test('generation lock is single-flight: second acquire fails while held, succeeds after release', () => {
  assert.equal(isGenerationLocked(), false);
  assert.equal(tryAcquireGenerationLock(), true);
  assert.equal(isGenerationLocked(), true);
  assert.equal(tryAcquireGenerationLock(), false, 'a second acquire must fail while the lock is held');
  releaseGenerationLock();
  assert.equal(isGenerationLocked(), false);
  assert.equal(tryAcquireGenerationLock(), true, 'acquire must succeed again after release');
  releaseGenerationLock();
});
