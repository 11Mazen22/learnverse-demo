import test from 'node:test';
import assert from 'node:assert/strict';
import { activeBossQuestionIds, appendLedgerEntry, balanceFor, deriveMastery, pickVariant, purchaseItem, recommendationFor, scoreQuestion, transitionQuestion, xpProgress } from '../lib/domain.mjs';
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

test('XP is separate from Coins and levels rise every 100 XP', () => {
  const data = createSeed();
  appendLedgerEntry(data, { userId: 'student-1', amount: 10, currency: 'XP', reason: 'TEST', reference: 'q', idempotencyKey: 'xp-1' });
  assert.equal(balanceFor(data.ledger, 'student-1', 'XP'), 10);
  assert.equal(balanceFor(data.ledger, 'student-1', 'COIN'), 160);
  assert.deepEqual(xpProgress(0), { xp: 0, level: 1, levelFloorXp: 0, levelCeilingXp: 100, levelPercent: 0 });
  assert.equal(xpProgress(250).level, 3);
  assert.equal(xpProgress(250).levelPercent, 50);
});

test('parallel question pool picks a distinct reviewed variant, never the same id', () => {
  const data = createSeed();
  const variant = pickVariant(data.questions, 'q-speed-1');
  assert.equal(variant.id, 'q-speed-1-v2');
  assert.equal(variant.skillId, 'skill-speed');
  assert.equal(pickVariant(data.questions, 'q-speed-1', [variant.id]), null);
  assert.equal(pickVariant(data.questions, 'no-such-question'), null);
});

test('content review lifecycle enforces valid transitions only', () => {
  const draft = { id: 'x', reviewStatus: 'draft', publicationStatus: 'draft' };
  const inReview = transitionQuestion(draft, 'submit-review', 'admin-1');
  assert.equal(inReview.reviewStatus, 'in-review');
  assert.throws(() => transitionQuestion(inReview, 'publish', 'admin-1'), /approved/);
  const approved = transitionQuestion(inReview, 'approve', 'admin-1');
  assert.equal(approved.reviewStatus, 'approved');
  assert.equal(approved.reviewedBy, 'admin-1');
  const published = transitionQuestion(approved, 'publish', 'admin-1');
  assert.equal(published.publicationStatus, 'published-demo');
  assert.throws(() => transitionQuestion(published, 'publish', 'admin-1'), /Already published/);
  const retired = transitionQuestion(published, 'retire', 'admin-1');
  assert.equal(retired.publicationStatus, 'retired');
  assert.throws(() => transitionQuestion(draft, 'approve', 'admin-1'), /in review/);
});

test('a Unit Boss rotates to its reviewed variant set while recovering from an imperfect score, then returns to the primary set after a 3/3 success', () => {
  const unit = { id: 'unit-motion', bossQuestionIds: ['a', 'b', 'c'], bossVariantQuestionIds: ['a2', 'b2', 'c2'] };
  assert.deepEqual(activeBossQuestionIds([], unit, 'student-1'), unit.bossQuestionIds, 'first attempt ever uses the primary set');

  const afterOneMiss = [{ userId: 'student-1', unitId: 'unit-motion', score: 2 }];
  assert.deepEqual(activeBossQuestionIds(afterOneMiss, unit, 'student-1'), unit.bossVariantQuestionIds, 'a retry after an imperfect score rotates to the variant set');

  const afterSuccess = [...afterOneMiss, { userId: 'student-1', unitId: 'unit-motion', score: 3 }];
  assert.deepEqual(activeBossQuestionIds(afterSuccess, unit, 'student-1'), unit.bossQuestionIds, 'once mastered, casual re-attempts return to the primary set');

  assert.deepEqual(activeBossQuestionIds(afterOneMiss, unit, 'other-student'), unit.bossQuestionIds, 'rotation is scoped to the requesting student only');

  const unitWithoutVariants = { id: 'unit-forces', bossQuestionIds: ['x', 'y', 'z'], bossVariantQuestionIds: [] };
  assert.deepEqual(activeBossQuestionIds(afterOneMiss.map((a) => ({ ...a, unitId: 'unit-forces' })), unitWithoutVariants, 'student-1'), unitWithoutVariants.bossQuestionIds, 'falls back to the primary set when no reviewed variant pool exists yet');
});
