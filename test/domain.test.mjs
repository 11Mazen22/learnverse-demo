import test from 'node:test';
import assert from 'node:assert/strict';
import { appendLedgerEntry, balanceFor, deriveMastery, purchaseItem, recommendationFor, scoreQuestion } from '../lib/domain.mjs';
import { createSeed } from '../lib/seed.mjs';

test('multiple-choice and numeric scoring are deterministic', () => {
  const data = createSeed();
  const choice = data.questions.find((item) => item.id === 'q-speed-1');
  const numeric = data.questions.find((item) => item.id === 'q-speed-2');
  assert.equal(scoreQuestion(choice, '1').correct, true);
  assert.equal(scoreQuestion(choice, '0').correct, false);
  assert.equal(scoreQuestion(numeric, '8.009').correct, true);
  assert.equal(scoreQuestion(numeric, '8.02').correct, false);
  assert.equal(scoreQuestion(numeric, 'not-a-number').normalizedAnswer, null);
});

test('mastery requires three distinct independent questions', () => {
  const base = { correct: true, skillId: 'skill-speed', difficulty: 'core', assisted: false, createdAt: new Date().toISOString() };
  const repeated = [
    { ...base, questionId: 'q1', practiceRepeat: false },
    { ...base, questionId: 'q1', practiceRepeat: true },
    { ...base, questionId: 'q1', practiceRepeat: true },
  ];
  const limited = deriveMastery(repeated);
  assert.equal(limited.state, 'insufficient');
  assert.equal(limited.independentQuestionCount, 1);

  const varied = ['q1', 'q2', 'q3'].map((questionId, index) => ({ ...base, questionId, difficulty: index === 2 ? 'transfer' : 'core', practiceRepeat: false }));
  const mastered = deriveMastery(varied);
  assert.equal(mastered.state, 'mastered-provisional');
  assert.equal(mastered.independentQuestionCount, 3);
});

test('assisted success is discounted and cannot establish independent evidence', () => {
  const attempts = ['q1', 'q2', 'q3'].map((questionId) => ({ questionId, correct: true, difficulty: 'core', assisted: true, practiceRepeat: false, createdAt: new Date().toISOString() }));
  const result = deriveMastery(attempts);
  assert.equal(result.state, 'insufficient');
  assert.equal(result.independentQuestionCount, 0);
  assert.ok(result.score < 70);
});

test('ledger grants are idempotent and never allow a negative balance', () => {
  const data = createSeed();
  const first = appendLedgerEntry(data, { userId: 'student-1', amount: 25, currency: 'COIN', reason: 'TEST', reference: 'lesson', idempotencyKey: 'test-grant' });
  const duplicate = appendLedgerEntry(data, { userId: 'student-1', amount: 25, currency: 'COIN', reason: 'TEST', reference: 'lesson', idempotencyKey: 'test-grant' });
  assert.equal(first.duplicate, false);
  assert.equal(duplicate.duplicate, true);
  assert.equal(balanceFor(data.ledger, 'student-1'), 185);
  assert.throws(() => appendLedgerEntry(data, { userId: 'student-1', amount: -999, currency: 'COIN', reason: 'TEST', reference: 'x', idempotencyKey: 'too-much' }), /Insufficient/);
});

test('purchase atomically deducts and grants inventory once', () => {
  const data = createSeed();
  const first = purchaseItem(data, { userId: 'student-1', itemId: 'outfit-orbit', idempotencyKey: 'purchase-1' });
  const duplicate = purchaseItem(data, { userId: 'student-1', itemId: 'outfit-orbit', idempotencyKey: 'purchase-1' });
  assert.equal(first.duplicate, false);
  assert.equal(duplicate.duplicate, true);
  assert.equal(balanceFor(data.ledger, 'student-1'), 40);
  assert.equal(data.inventory.filter((item) => item.itemId === 'outfit-orbit').length, 1);
});

test('recommendations preserve curriculum order when evidence is equally absent', () => {
  const data = createSeed();
  const recommendation = recommendationFor([], data.curriculum);
  assert.equal(recommendation.lessonId, 'lesson-motion-basics');
  assert.equal(recommendation.reason, 'start-learning');
});
