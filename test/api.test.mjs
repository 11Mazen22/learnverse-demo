import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const temp = await mkdtemp(path.join(os.tmpdir(), 'learning-platform-'));
process.env.DATA_FILE = path.join(temp, 'test-data.json');
process.env.NODE_ENV = 'test';
const { createServer } = await import('../server.mjs');
const server = await createServer({ reset: true });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(temp, { recursive: true, force: true });
});

async function request(route, { token, body, method = body ? 'POST' : 'GET' } = {}) {
  const response = await fetch(`${base}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json() };
}

async function login(email) {
  const result = await request('/api/auth/login', { body: { email, password: 'demo123' } });
  assert.equal(result.status, 200);
  return result.body.token;
}

test('protected bootstrap rejects anonymous requests', async () => {
  const result = await request('/api/bootstrap');
  assert.equal(result.status, 401);
});

test('student completes a lesson, earns once, and duplicate purchase is safe', async () => {
  const token = await login('student@demo.local');
  const answers = [['q-speed-1', '1'], ['q-speed-2', '8'], ['q-speed-3', '1']];
  for (const [questionId, answer] of answers) {
    const result = await request('/api/attempts', { token, body: { questionId, answer, idempotencyKey: `flow:${questionId}` } });
    assert.equal(result.status, 200);
    assert.equal(result.body.correct, true);
  }
  const wrongWithFallback = await request('/api/attempts', { token, body: { questionId: 'q-graph-1', answer: '0', idempotencyKey: 'flow:wrong-feedback' } });
  assert.equal(wrongWithFallback.status, 200);
  assert.match(wrongWithFallback.body.feedback, /المسافة لا تتغير/);
  let bootstrap = await request('/api/bootstrap', { token });
  assert.equal(bootstrap.body.wallet.coins, 185);
  assert.equal(bootstrap.body.progress.completedLessons.length, 1);

  const duplicateAttempt = await request('/api/attempts', { token, body: { questionId: 'q-speed-3', answer: '1', idempotencyKey: 'flow:q-speed-3' } });
  assert.equal(duplicateAttempt.body.duplicate, true);
  bootstrap = await request('/api/bootstrap', { token });
  assert.equal(bootstrap.body.wallet.coins, 185);

  const purchaseBody = { itemId: 'outfit-orbit', idempotencyKey: 'flow:purchase' };
  const [purchaseA, purchaseB] = await Promise.all([
    request('/api/shop/purchase', { token, body: purchaseBody }),
    request('/api/shop/purchase', { token, body: purchaseBody }),
  ]);
  assert.equal(purchaseA.status, 200);
  assert.equal(purchaseB.status, 200);
  bootstrap = await request('/api/bootstrap', { token });
  assert.equal(bootstrap.body.wallet.coins, 65);
  assert.equal(bootstrap.body.inventory.filter((item) => item.itemId === 'outfit-orbit').length, 1);
});

test('boss reward is granted once across retries', async () => {
  const token = await login('student@demo.local');
  const answers = [
    { questionId: 'q-boss-1', answer: '5' },
    { questionId: 'q-boss-2', answer: '0' },
    { questionId: 'q-boss-3', answer: '1' },
  ];
  const first = await request('/api/boss/unit-motion', { token, body: { answers, idempotencyKey: 'boss:first' } });
  const retry = await request('/api/boss/unit-motion', { token, body: { answers, idempotencyKey: 'boss:retry' } });
  assert.equal(first.body.score, 3);
  assert.equal(first.body.rewardGranted, true);
  assert.equal(retry.body.score, 3);
  assert.equal(retry.body.rewardGranted, false);
  const bootstrap = await request('/api/bootstrap', { token });
  assert.equal(bootstrap.body.wallet.coins, 125);
});

test('role boundaries prevent teacher from purchasing and scope teacher data', async () => {
  const token = await login('teacher@demo.local');
  const bootstrap = await request('/api/bootstrap', { token });
  assert.equal(bootstrap.status, 200);
  assert.equal(bootstrap.body.classes.length, 1);
  assert.equal(bootstrap.body.classes[0].students.length, 1);
  assert.equal(bootstrap.body.classes[0].students[0].password, undefined);
  const forbidden = await request('/api/shop/purchase', { token, body: { itemId: 'outfit-orbit', idempotencyKey: 'teacher-buy' } });
  assert.equal(forbidden.status, 403);
});

test('teacher can assign only owned classes', async () => {
  const token = await login('teacher@demo.local');
  const allowed = await request('/api/assignments', { token, body: { classId: 'class-1', lessonId: 'lesson-graphs' } });
  assert.equal(allowed.status, 201);
  const denied = await request('/api/assignments', { token, body: { classId: 'other-class', lessonId: 'lesson-graphs' } });
  assert.equal(denied.status, 400);
});

test('a wrong answer offers a distinct parallel-pool variant instead of repeating the same question, and XP is granted once per question on first success', async () => {
  const token = await login('student@demo.local');
  const before = await request('/api/bootstrap', { token });
  const xpBefore = before.body.wallet.xp;

  const wrong = await request('/api/attempts', { token, body: { questionId: 'q-graph-2', answer: '0', idempotencyKey: 'variant-flow:wrong' } });
  assert.equal(wrong.body.correct, false);
  assert.equal(wrong.body.retryQuestion.id, 'q-graph-2-v2');
  assert.notEqual(wrong.body.retryQuestion.prompt, undefined);

  const variantCorrect = await request('/api/attempts', { token, body: { questionId: 'q-graph-2-v2', answer: '0', idempotencyKey: 'variant-flow:variant-correct' } });
  assert.equal(variantCorrect.body.correct, true);
  let bootstrap = await request('/api/bootstrap', { token });
  assert.equal(bootstrap.body.wallet.xp, xpBefore + 10);
  assert.equal(bootstrap.body.wallet.level, 1);

  // Repeating the now-answered variant must not grant XP again.
  await request('/api/attempts', { token, body: { questionId: 'q-graph-2-v2', answer: '0', idempotencyKey: 'variant-flow:variant-repeat' } });
  bootstrap = await request('/api/bootstrap', { token });
  assert.equal(bootstrap.body.wallet.xp, xpBefore + 10);

  // The variant counts as a genuinely distinct question and credits the same lesson slot as the original.
  const original = await request('/api/attempts', { token, body: { questionId: 'q-graph-3', answer: '0', idempotencyKey: 'variant-flow:original-correct' } });
  assert.equal(original.body.correct, true);
  assert.ok(original.body.mastery.independentQuestionCount >= 2);
});

test('once a Unit Boss has been fully mastered, later casual attempts keep serving the primary question set (recovery rotation itself is covered in test/domain.test.mjs)', async () => {
  const token = await login('student@demo.local');
  // This student already scored 3/3 on unit-motion in an earlier scenario in this file.
  const stillPrimary = await request('/api/units/unit-motion/boss', { token });
  assert.deepEqual(stillPrimary.body.questions.map((q) => q.id).sort(), ['q-boss-1', 'q-boss-2', 'q-boss-3']);
});

test('admin can move a question through the draft → review → approve → publish → retire lifecycle, and only admins may act', async () => {
  const teacherToken = await login('teacher@demo.local');
  const forbidden = await request('/api/admin/questions/q-speed-4-draft/status', { token: teacherToken, body: { action: 'submit-review' }, method: 'PATCH' });
  assert.equal(forbidden.status, 403);

  const adminToken = await login('admin@demo.local');
  const submitted = await request('/api/admin/questions/q-speed-4-draft/status', { token: adminToken, body: { action: 'submit-review' }, method: 'PATCH' });
  assert.equal(submitted.body.reviewStatus, 'in-review');
  const approved = await request('/api/admin/questions/q-speed-4-draft/status', { token: adminToken, body: { action: 'approve' }, method: 'PATCH' });
  assert.equal(approved.body.reviewStatus, 'approved');
  assert.equal(approved.body.reviewedBy, 'admin-1');
  const published = await request('/api/admin/questions/q-speed-4-draft/status', { token: adminToken, body: { action: 'publish' }, method: 'PATCH' });
  assert.equal(published.body.publicationStatus, 'published-demo');
  const retired = await request('/api/admin/questions/q-speed-4-draft/status', { token: adminToken, body: { action: 'retire' }, method: 'PATCH' });
  assert.equal(retired.body.publicationStatus, 'retired');

  const bootstrap = await request('/api/bootstrap', { token: adminToken });
  const events = bootstrap.body.audit.map((item) => item.action);
  assert.ok(events.includes('QUESTION_PUBLISH'));
});

test('equipping a cosmetic requires real ownership and a matching item type', async () => {
  const token = await login('student@demo.local');
  // outfit-orbit is owned by this student (purchased in an earlier scenario) but is the wrong type for the avatar slot.
  const wrongType = await request('/api/profile', { token, body: { avatarItemId: 'outfit-orbit' }, method: 'PATCH' });
  assert.notEqual(wrongType.body.user.avatarItemId, 'outfit-orbit');
  // background-lab is the right type for the background slot but has not been purchased.
  const notOwned = await request('/api/profile', { token, body: { backgroundItemId: 'background-lab' }, method: 'PATCH' });
  assert.notEqual(notOwned.body.user.backgroundItemId, 'background-lab');
  // avatar-explorer is the free starter item every student owns, and matches the avatar slot.
  const equipped = await request('/api/profile', { token, body: { avatarItemId: 'avatar-explorer' }, method: 'PATCH' });
  assert.equal(equipped.body.user.avatarItemId, 'avatar-explorer');
});

test('login is rate limited after repeated failed attempts from the same client', async () => {
  let lastStatus = 0;
  for (let i = 0; i < 25; i += 1) {
    const attempt = await request('/api/auth/login', { body: { email: 'student@demo.local', password: 'wrong' } });
    lastStatus = attempt.status;
  }
  assert.equal(lastStatus, 429);
});
