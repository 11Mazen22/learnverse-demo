import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createSeed } from '../lib/seed.mjs';

const temp = await mkdtemp(path.join(os.tmpdir(), 'learning-platform-'));
process.env.DATA_FILE = path.join(temp, 'test-data.json');
process.env.NODE_ENV = 'test';

// Isolated test fixture for real ownership-isolation testing (a second student), instead of adding
// a permanent account to the shared production seed. JsonStore.init({reset:false}) reads an existing
// file if present and only falls back to createSeed() on ENOENT, so writing our own seed+extra-user
// JSON directly to the temp DATA_FILE here gives the server this exact fixture with zero production
// seed changes.
const fixtureSeed = createSeed();
fixtureSeed.users.push({ id: 'student-2', email: 'student2@demo.local', password: 'demo123', role: 'student', nameAr: 'سارة يوسف', nameEn: 'Sara Youssef', language: 'ar' });
await writeFile(process.env.DATA_FILE, `${JSON.stringify(fixtureSeed, null, 2)}\n`, 'utf8');

const { createServer } = await import('../server.mjs');
const server = await createServer({ reset: false });
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

// The chat messages endpoint responds with newline-delimited JSON, not a single JSON body — this
// reads the whole chunked response and parses it into an array of {type, ...} lines.
async function requestStream(route, { token, body, method = 'POST' } = {}) {
  const response = await fetch(`${base}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (response.status >= 400) return { status: response.status, body: JSON.parse(text) };
  const lines = text.trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
  return { status: response.status, lines };
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

test('the AI study helper requires auth, never affects scoring, and degrades to a clear labelled fallback when unavailable', async () => {
  const anonymous = await request('/api/tutor/ask', { body: { message: 'help' } });
  assert.equal(anonymous.status, 401);

  const token = await login('student@demo.local');
  const before = await request('/api/bootstrap', { token });
  const asked = await request('/api/tutor/ask', { token, body: { message: 'ما معنى السرعة؟', lessonId: 'lesson-motion-basics', questionId: 'q-speed-1' } });
  assert.equal(asked.status, 200);
  assert.equal(asked.body.aiGenerated, false);
  assert.equal(asked.body.unavailable, true);
  assert.ok(asked.body.reply.length > 0);
  const after = await request('/api/bootstrap', { token });
  assert.equal(after.body.wallet.coins, before.body.wallet.coins);
  assert.equal(after.body.wallet.xp, before.body.wallet.xp);

  const empty = await request('/api/tutor/ask', { token, body: { message: '' } });
  assert.equal(empty.status, 400);
});

test('AI Chat: full conversation CRUD, streaming fallback shape, and rename/pin/archive/delete', async () => {
  const anonymous = await request('/api/chat/conversations');
  assert.equal(anonymous.status, 401);

  const token = await login('student@demo.local');
  const created = await request('/api/chat/conversations', { token, body: {} });
  assert.equal(created.status, 201);
  const conversationId = created.body.conversation.id;

  const sent = await requestStream(`/api/chat/conversations/${conversationId}/messages`, {
    token, body: { idempotencyKey: 'chat:1', content: 'What is average speed?' },
  });
  assert.equal(sent.status, 200);
  assert.equal(sent.lines.length, 3, 'must be exactly [meta, delta, done] once OLLAMA_URL is unset');
  assert.equal(sent.lines[0].type, 'meta');
  assert.equal(sent.lines[0].conversationId, conversationId);
  assert.equal(sent.lines[1].type, 'delta');
  assert.ok(sent.lines[1].text.length > 0, 'the unconfigured-Ollama fallback must still send at least one delta line');
  assert.equal(sent.lines[2].type, 'done');
  assert.equal(sent.lines[2].aiGenerated, false);
  assert.equal(sent.lines[2].unavailable, true);

  const fetched = await request(`/api/chat/conversations/${conversationId}`, { token });
  assert.equal(fetched.body.conversation.messages.length, 2, 'one user message plus one assistant message');
  assert.equal(fetched.body.conversation.messages[0].role, 'user');
  assert.equal(fetched.body.conversation.messages[1].role, 'assistant');
  assert.equal(fetched.body.conversation.messages[1].status, 'complete');
  assert.ok(fetched.body.conversation.title, 'the first message should auto-derive a title');

  const renamed = await request(`/api/chat/conversations/${conversationId}`, { token, method: 'PATCH', body: { title: 'My renamed chat' } });
  assert.equal(renamed.body.conversation.title, 'My renamed chat');
  const pinned = await request(`/api/chat/conversations/${conversationId}`, { token, method: 'PATCH', body: { pinned: true } });
  assert.equal(pinned.body.conversation.pinned, true);

  const otherConversation = await request('/api/chat/conversations', { token, body: {} });
  const list = await request('/api/chat/conversations', { token });
  assert.equal(list.body.conversations[0].id, conversationId, 'the pinned conversation must sort first');
  assert.equal(list.body.conversations[0].pinned, true);

  const archived = await request(`/api/chat/conversations/${conversationId}`, { token, method: 'PATCH', body: { archived: true } });
  assert.equal(archived.body.conversation.archived, true);

  const deleted = await request(`/api/chat/conversations/${otherConversation.body.conversation.id}`, { token, method: 'DELETE' });
  assert.equal(deleted.status, 200);
  const afterDelete = await request(`/api/chat/conversations/${otherConversation.body.conversation.id}`, { token });
  assert.equal(afterDelete.status, 404);
});

test('AI Chat: ownership isolation between two different students', async () => {
  const tokenA = await login('student@demo.local');
  const tokenB = await login('student2@demo.local');
  const created = await request('/api/chat/conversations', { token: tokenA, body: {} });
  const conversationId = created.body.conversation.id;

  const readAttempt = await request(`/api/chat/conversations/${conversationId}`, { token: tokenB });
  assert.equal(readAttempt.status, 404, 'a peer must not be able to read another student\'s conversation by id');
  const renameAttempt = await request(`/api/chat/conversations/${conversationId}`, { token: tokenB, method: 'PATCH', body: { title: 'hijacked' } });
  assert.equal(renameAttempt.status, 404);
  const deleteAttempt = await request(`/api/chat/conversations/${conversationId}`, { token: tokenB, method: 'DELETE' });
  assert.equal(deleteAttempt.status, 404);
  const messageAttempt = await requestStream(`/api/chat/conversations/${conversationId}/messages`, { token: tokenB, body: { idempotencyKey: 'hijack:1', content: 'hi' } });
  assert.equal(messageAttempt.status, 404);
  assert.equal(messageAttempt.body.error.code, 'NOT_FOUND');

  // list must only ever return the requester's own conversations
  const listB = await request('/api/chat/conversations', { token: tokenB });
  assert.ok(!listB.body.conversations.some((item) => item.id === conversationId));
});

test('AI Chat: duplicate idempotency key replays without creating a second turn', async () => {
  const token = await login('student@demo.local');
  const created = await request('/api/chat/conversations', { token, body: {} });
  const conversationId = created.body.conversation.id;

  const first = await requestStream(`/api/chat/conversations/${conversationId}/messages`, { token, body: { idempotencyKey: 'dup:1', content: 'hello' } });
  const firstAssistantId = first.lines[0].assistantMessageId;
  const second = await requestStream(`/api/chat/conversations/${conversationId}/messages`, { token, body: { idempotencyKey: 'dup:1', content: 'hello' } });
  assert.equal(second.lines[0].assistantMessageId, firstAssistantId, 'the duplicate must replay the same assistant message, not create a new one');

  const fetched = await request(`/api/chat/conversations/${conversationId}`, { token });
  assert.equal(fetched.body.conversation.messages.length, 2, 'a duplicate request must not add any new messages');
});

test('AI Chat: regenerate replaces only the last assistant reply', async () => {
  const token = await login('student@demo.local');
  const created = await request('/api/chat/conversations', { token, body: {} });
  const conversationId = created.body.conversation.id;
  await requestStream(`/api/chat/conversations/${conversationId}/messages`, { token, body: { idempotencyKey: 'regen:1', content: 'first question' } });
  const before = await request(`/api/chat/conversations/${conversationId}`, { token });
  const oldAssistantId = before.body.conversation.messages[1].id;

  await requestStream(`/api/chat/conversations/${conversationId}/messages`, { token, body: { idempotencyKey: 'regen:2', regenerate: true } });
  const after = await request(`/api/chat/conversations/${conversationId}`, { token });
  assert.equal(after.body.conversation.messages.length, 2, 'regenerate must not add a new user turn');
  assert.equal(after.body.conversation.messages[0].content, 'first question', 'the user message must be unchanged');
  assert.notEqual(after.body.conversation.messages[1].id, oldAssistantId, 'the old assistant reply must be replaced, not kept alongside a new one');
});

test('AI Chat: edit-and-resubmit truncates everything from the edited message onward', async () => {
  const token = await login('student@demo.local');
  const created = await request('/api/chat/conversations', { token, body: {} });
  const conversationId = created.body.conversation.id;
  await requestStream(`/api/chat/conversations/${conversationId}/messages`, { token, body: { idempotencyKey: 'edit:1', content: 'first question' } });
  const firstTurn = await request(`/api/chat/conversations/${conversationId}`, { token });
  const firstUserMessageId = firstTurn.body.conversation.messages[0].id;
  await requestStream(`/api/chat/conversations/${conversationId}/messages`, { token, body: { idempotencyKey: 'edit:2', content: 'second question' } });

  await requestStream(`/api/chat/conversations/${conversationId}/messages`, {
    token, body: { idempotencyKey: 'edit:3', content: 'edited first question', editFromMessageId: firstUserMessageId },
  });
  const after = await request(`/api/chat/conversations/${conversationId}`, { token });
  assert.equal(after.body.conversation.messages.length, 2, 'everything from the edited message onward must be gone, replaced by exactly one fresh turn');
  assert.equal(after.body.conversation.messages[0].content, 'edited first question');
});

test('AI Chat: non-image and oversized attachments are rejected before any mutation, pre-accept errors are plain JSON', async () => {
  const token = await login('student@demo.local');
  const created = await request('/api/chat/conversations', { token, body: {} });
  const conversationId = created.body.conversation.id;

  const wrongType = await request(`/api/chat/conversations/${conversationId}/messages`, {
    token, body: { idempotencyKey: 'att:1', content: 'see attached', attachment: { name: 'notes.pdf', type: 'application/pdf', dataBase64: 'AAAA' } },
  });
  assert.equal(wrongType.status, 413);
  assert.equal(wrongType.body.error.code, 'ATTACHMENT_UNSUPPORTED');

  const oversized = await request(`/api/chat/conversations/${conversationId}/messages`, {
    token, body: { idempotencyKey: 'att:2', content: 'see attached', attachment: { name: 'big.jpg', type: 'image/jpeg', dataBase64: 'A'.repeat(6_000_001) } },
  });
  assert.equal(oversized.status, 413);
  assert.equal(oversized.body.error.code, 'ATTACHMENT_TOO_LARGE');

  const fetched = await request(`/api/chat/conversations/${conversationId}`, { token });
  assert.equal(fetched.body.conversation.messages.length, 0, 'a rejected attachment must not create any message');

  // 404 for a missing conversation is an ordinary single JSON body, never the NDJSON envelope.
  const missing = await request('/api/chat/conversations/does-not-exist/messages', { token, body: { idempotencyKey: 'x', content: 'hi' } });
  assert.equal(missing.status, 404);
  assert.equal(missing.body.error.code, 'NOT_FOUND');
});

test('AI Chat: attachment download is ownership-checked and 404s for an unknown id', async () => {
  const token = await login('student@demo.local');
  const missing = await request('/api/chat/attachments/00000000-0000-4000-8000-000000000000', { token });
  assert.equal(missing.status, 404);
});

test('login is rate limited after repeated failed attempts from the same client', async () => {
  let lastStatus = 0;
  for (let i = 0; i < 25; i += 1) {
    const attempt = await request('/api/auth/login', { body: { email: 'student@demo.local', password: 'wrong' } });
    lastStatus = attempt.status;
  }
  assert.equal(lastStatus, 429);
});
