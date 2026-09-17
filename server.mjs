import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { activeBossQuestionIds, appendLedgerEntry, balanceFor, deriveMastery, pickVariant, purchaseItem, recommendationFor, scoreQuestion, transitionQuestion, xpProgress, XP_RULES } from './lib/domain.mjs';
import { JsonStore } from './lib/store.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 3000);
const store = new JsonStore(process.env.DATA_FILE || path.join(ROOT, 'data', 'app.json'));
const sessions = new Map();

const rateBuckets = new Map();
function rateLimited(key, limit, windowMs) {
  const now = Date.now();
  if (rateBuckets.size > 5000) for (const [bucketKey, bucket] of rateBuckets) if (now - bucket.start > windowMs) rateBuckets.delete(bucketKey);
  let bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.start > windowMs) { bucket = { start: now, count: 0 }; rateBuckets.set(key, bucket); }
  bucket.count += 1;
  return bucket.count > limit;
}

// AI study helper: self-hosted (Ollama), optional — the app works fully without it.
// Guardrails per the brief's AI-assistance section: grounded to the current lesson/question only,
// rate-limited, timed out with a deterministic fallback, always labelled, and structurally unable
// to touch scores/wallet/mastery since this handler never calls store.transact.
const OLLAMA_URL = process.env.OLLAMA_URL || '';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const TUTOR_TIMEOUT_MS = 30_000;

function tutorSystemPrompt(lesson, question, language) {
  const lines = [
    'You are a friendly, patient study helper inside a demonstration Arabic-first learning app for a secondary-level physics unit on motion.',
    'Only help the student reason about the specific lesson/question content given below. If asked about anything else, gently steer back to this lesson.',
    'Never state the final answer to the current checkpoint question outright — guide their reasoning with a hint or a leading question instead, unless they say they already answered it and just want the idea explained.',
    'Keep it short: two to five sentences. Be encouraging, age-appropriate, and never claim to be a teacher or to have graded anything.',
    language === 'en' ? 'Respond in English.' : 'أجب باللغة العربية الفصحى المبسطة.',
  ];
  if (lesson) lines.push(`Lesson: ${lesson.titleAr} / ${lesson.titleEn}. Summary: ${lesson.summaryAr} ${lesson.summaryEn}`);
  if (question) lines.push(`Current checkpoint question: ${question.promptAr || ''} / ${question.promptEn || ''}`);
  return lines.join('\n');
}

async function askTutor(system, message) {
  if (!OLLAMA_URL) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TUTOR_TIMEOUT_MS);
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, stream: false, messages: [{ role: 'system', content: system }, { role: 'user', content: message }] }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.message?.content?.trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json' };
const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(body));
};
const fail = (res, status, message, code = 'REQUEST_FAILED') => json(res, status, { error: { code, message } });
const readBody = async (req) => {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100_000) throw new Error('Request body is too large');
  }
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw new Error('Invalid JSON'); }
};
const publicUser = ({ password, ...user }) => user;
const findQuestion = (data, id) => data.questions.find((question) => question.id === id && question.publicationStatus === 'published-demo');

function authenticate(req, data) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const userId = token && sessions.get(token);
  return data.users.find((user) => user.id === userId) || null;
}

function requireRole(req, res, data, roles) {
  const user = authenticate(req, data);
  if (!user) { fail(res, 401, 'Please sign in again.', 'AUTH_REQUIRED'); return null; }
  if (!roles.includes(user.role)) { fail(res, 403, 'You do not have access to this action.', 'FORBIDDEN'); return null; }
  return user;
}

function safeQuestion(question, language = 'ar') {
  const suffix = language === 'en' ? 'En' : 'Ar';
  return {
    id: question.id, version: question.version, type: question.type, difficulty: question.difficulty,
    skillId: question.skillId, prompt: question[`prompt${suffix}`], choices: question[`choices${suffix}`] || null,
    unit: question[`unit${suffix}`] || null,
  };
}

function studentPayload(data, user) {
  const language = user.language || 'ar';
  const attempts = data.attempts.filter((item) => item.userId === user.id);
  const mastery = data.mastery.filter((item) => item.userId === user.id);
  const curriculum = structuredClone(data.curriculum);
  curriculum.units.forEach((unit) => unit.lessons.forEach((lesson) => {
    lesson.questions = lesson.questionIds.map((id) => safeQuestion(findQuestion(data, id), language));
  }));
  return {
    user: publicUser(user), curriculum, skills: data.skills,
    progress: {
      attempts: attempts.map(({ answer, ...attempt }) => attempt), mastery,
      completedLessons: data.lessonCompletions.filter((item) => item.userId === user.id),
      bossAttempts: data.bossAttempts.filter((item) => item.userId === user.id),
      recommendation: recommendationFor(mastery, data.curriculum),
      reviews: data.reviews.filter((item) => item.userId === user.id),
    },
    wallet: { coins: balanceFor(data.ledger, user.id), ...xpProgress(balanceFor(data.ledger, user.id, 'XP')) },
    shopItems: data.shopItems.filter((item) => item.active),
    inventory: data.inventory.filter((item) => item.userId === user.id),
    assignments: data.assignments.filter((assignment) => data.enrollments.some((e) => e.studentId === user.id && e.classId === assignment.classId)),
    demo: true,
  };
}

function teacherPayload(data, user) {
  const classes = data.classes.filter((item) => item.teacherId === user.id).map((item) => ({
    ...item,
    students: data.enrollments.filter((e) => e.classId === item.id).map((e) => {
      const student = data.users.find((candidate) => candidate.id === e.studentId);
      return {
        ...publicUser(student),
        attempts: data.attempts.filter((a) => a.userId === student.id).length,
        mastery: data.mastery.filter((m) => m.userId === student.id),
        lastActiveAt: data.attempts.filter((a) => a.userId === student.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]?.createdAt || null,
      };
    }),
  }));
  return { user: publicUser(user), classes, skills: data.skills, assignments: data.assignments.filter((a) => a.teacherId === user.id), curriculum: data.curriculum, demo: true };
}

function adminPayload(data, user) {
  return {
    user: publicUser(user),
    content: data.questions.map((question) => ({
      id: question.id, version: question.version, skillId: question.skillId, difficulty: question.difficulty,
      promptAr: question.promptAr, variantOf: question.variantOf || null,
      reviewStatus: question.reviewStatus, publicationStatus: question.publicationStatus, provenance: question.provenance,
      reviewedBy: question.reviewedBy || null, reviewedAt: question.reviewedAt || null,
      publishedBy: question.publishedBy || null, publishedAt: question.publishedAt || null,
    })),
    audit: data.audit.slice(-30).reverse(),
    configuration: { masteryRuleVersion: 'mvp-1', economyRuleVersion: 'economy-mvp-1', curriculumStatus: data.curriculum.status },
    demo: true,
  };
}

async function handleApi(req, res, url) {
  const ip = req.socket.remoteAddress || 'unknown';
  if (rateLimited(`api:${ip}`, 600, 60_000)) return fail(res, 429, 'Too many requests. Please slow down.', 'RATE_LIMITED');
  const data = store.snapshot();

  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    if (rateLimited(`login:${ip}`, 20, 5 * 60_000)) return fail(res, 429, 'Too many sign-in attempts. Try again in a few minutes.', 'RATE_LIMITED');
    const body = await readBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const user = data.users.find((candidate) => candidate.email === email && candidate.password === body.password);
    if (!user) return fail(res, 401, 'Email or password is incorrect.', 'INVALID_CREDENTIALS');
    const token = crypto.randomUUID();
    sessions.set(token, user.id);
    return json(res, 200, { token, user: publicUser(user) });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (token) sessions.delete(token);
    return json(res, 200, { ok: true });
  }

  if (req.method === 'GET' && url.pathname === '/api/bootstrap') {
    const user = requireRole(req, res, data, ['student', 'teacher', 'admin']);
    if (!user) return;
    if (user.role === 'student') return json(res, 200, studentPayload(data, user));
    if (user.role === 'teacher') return json(res, 200, teacherPayload(data, user));
    return json(res, 200, adminPayload(data, user));
  }

  if (req.method === 'POST' && url.pathname === '/api/attempts') {
    const user = requireRole(req, res, data, ['student']);
    if (!user) return;
    const body = await readBody(req);
    if (!body.idempotencyKey || !body.questionId) return fail(res, 400, 'Question and request key are required.', 'VALIDATION');
    const result = await store.transact((draft) => {
      const duplicate = draft.attempts.find((item) => item.idempotencyKey === body.idempotencyKey && item.userId === user.id);
      if (duplicate) return { attempt: duplicate, duplicate: true };
      const question = findQuestion(draft, body.questionId);
      if (!question || !question.lessonId) throw new Error('Question is unavailable');
      const scored = scoreQuestion(question, body.answer);
      const previous = draft.attempts.filter((item) => item.userId === user.id && item.questionId === question.id);
      const attempt = {
        id: crypto.randomUUID(), userId: user.id, questionId: question.id, questionVersion: question.version,
        slotId: question.variantOf || question.id,
        lessonId: question.lessonId, skillId: question.skillId, difficulty: question.difficulty,
        answer: scored.normalizedAnswer, correct: scored.correct, assisted: Boolean(body.assisted),
        practiceRepeat: previous.length > 0, idempotencyKey: body.idempotencyKey, createdAt: new Date().toISOString(),
      };
      draft.attempts.push(attempt);
      if (scored.correct && previous.length === 0) {
        appendLedgerEntry(draft, { userId: user.id, amount: XP_RULES.correctFirstAttempt, currency: 'XP', reason: 'CORRECT_FIRST_ATTEMPT', reference: question.id, idempotencyKey: `xp-attempt:${user.id}:${body.idempotencyKey}` });
      }
      const retryQuestion = !scored.correct ? pickVariant(draft.questions, question.variantOf || question.id, [question.id]) : null;
      const skillAttempts = draft.attempts.filter((item) => item.userId === user.id && item.skillId === question.skillId);
      const derived = deriveMastery(skillAttempts);
      const mastery = { userId: user.id, skillId: question.skillId, ...derived, updatedAt: new Date().toISOString(), ruleVersion: 'mvp-1' };
      const oldIndex = draft.mastery.findIndex((item) => item.userId === user.id && item.skillId === question.skillId);
      if (oldIndex >= 0) draft.mastery[oldIndex] = mastery; else draft.mastery.push(mastery);
      const reviewIndex = draft.reviews.findIndex((item) => item.userId === user.id && item.skillId === question.skillId);
      const review = { userId: user.id, skillId: question.skillId, dueAt: mastery.nextReviewAt, reason: scored.correct ? 'retention-check' : 'recovery', updatedAt: mastery.updatedAt };
      if (reviewIndex >= 0) draft.reviews[reviewIndex] = review; else draft.reviews.push(review);

      const lesson = draft.curriculum.units.flatMap((unit) => unit.lessons).find((item) => item.id === question.lessonId);
      const answeredCorrectly = new Set(draft.attempts.filter((item) => item.userId === user.id && item.lessonId === lesson.id && item.correct).map((item) => item.slotId));
      let completion = draft.lessonCompletions.find((item) => item.userId === user.id && item.lessonId === lesson.id);
      if (!completion && lesson.questionIds.every((id) => answeredCorrectly.has(id))) {
        completion = { userId: user.id, lessonId: lesson.id, completedAt: new Date().toISOString(), rewardGranted: true };
        draft.lessonCompletions.push(completion);
        appendLedgerEntry(draft, { userId: user.id, amount: 25, currency: 'COIN', reason: 'LESSON_COMPLETION', reference: lesson.id, idempotencyKey: `lesson:${user.id}:${lesson.id}` });
        appendLedgerEntry(draft, { userId: user.id, amount: XP_RULES.lessonCompletion, currency: 'XP', reason: 'LESSON_COMPLETION', reference: lesson.id, idempotencyKey: `xp-lesson:${user.id}:${lesson.id}` });
      }
      return {
        attempt,
        correct: scored.correct,
        feedback: user.language === 'en'
          ? question.explanationEn
          : (scored.correct ? question.explanationAr : scored.feedback || question.explanationAr),
        retryQuestion: retryQuestion ? safeQuestion(retryQuestion, user.language) : null,
        mastery,
        completion,
        duplicate: false,
      };
    });
    return json(res, 200, result);
  }

  const bossMatch = url.pathname.match(/^\/api\/boss\/([^/]+)$/);
  if (req.method === 'POST' && bossMatch) {
    const user = requireRole(req, res, data, ['student']);
    if (!user) return;
    const body = await readBody(req);
    if (!body.idempotencyKey || !Array.isArray(body.answers)) return fail(res, 400, 'Three answers and request key are required.', 'VALIDATION');
    const result = await store.transact((draft) => {
      const duplicate = draft.bossAttempts.find((item) => item.userId === user.id && item.idempotencyKey === body.idempotencyKey);
      if (duplicate) return { ...duplicate, duplicate: true };
      const unit = draft.curriculum.units.find((item) => item.id === bossMatch[1]);
      if (!unit || unit.locked || unit.bossQuestionIds.length !== 3) throw new Error('Challenge is unavailable');
      const activeIds = activeBossQuestionIds(draft.bossAttempts, unit, user.id);
      const details = activeIds.map((questionId) => {
        const question = findQuestion(draft, questionId);
        const supplied = body.answers.find((answer) => answer.questionId === questionId);
        const scored = scoreQuestion(question, supplied?.answer);
        const isFirstAttempt = !draft.attempts.some((a) => a.userId === user.id && a.questionId === questionId);
        draft.attempts.push({ id: crypto.randomUUID(), userId: user.id, questionId, questionVersion: question.version, lessonId: null, unitId: unit.id, skillId: question.skillId, difficulty: question.difficulty, answer: scored.normalizedAnswer, correct: scored.correct, assisted: false, practiceRepeat: !isFirstAttempt, idempotencyKey: `${body.idempotencyKey}:${questionId}`, createdAt: new Date().toISOString() });
        if (scored.correct && isFirstAttempt) {
          appendLedgerEntry(draft, { userId: user.id, amount: XP_RULES.correctFirstAttempt, currency: 'XP', reason: 'CORRECT_FIRST_ATTEMPT', reference: questionId, idempotencyKey: `xp-attempt:${user.id}:${body.idempotencyKey}:${questionId}` });
        }
        return { questionId, correct: scored.correct, feedback: user.language === 'en' ? question.explanationEn : question.explanationAr };
      });
      const score = details.filter((item) => item.correct).length;
      const outcome = score === 3 ? 'complete' : score === 2 ? 'recovery' : 'supported-practice';
      const priorCompleted = draft.bossAttempts.some((item) => item.userId === user.id && item.unitId === unit.id && item.score === 3);
      const rewardGranted = score === 3 && !priorCompleted;
      if (rewardGranted) {
        appendLedgerEntry(draft, { userId: user.id, amount: 60, currency: 'COIN', reason: 'BOSS_FIRST_COMPLETION', reference: unit.id, idempotencyKey: `boss:${user.id}:${unit.id}` });
        appendLedgerEntry(draft, { userId: user.id, amount: XP_RULES.bossFirstCompletion, currency: 'XP', reason: 'BOSS_FIRST_COMPLETION', reference: unit.id, idempotencyKey: `xp-boss:${user.id}:${unit.id}` });
      }
      const attempt = { id: crypto.randomUUID(), userId: user.id, unitId: unit.id, score, outcome, details, rewardGranted, idempotencyKey: body.idempotencyKey, createdAt: new Date().toISOString() };
      draft.bossAttempts.push(attempt);
      return attempt;
    });
    return json(res, 200, result);
  }

  const unitMatch = url.pathname.match(/^\/api\/units\/([^/]+)\/boss$/);
  if (req.method === 'GET' && unitMatch) {
    const user = requireRole(req, res, data, ['student']);
    if (!user) return;
    const unit = data.curriculum.units.find((item) => item.id === unitMatch[1]);
    if (!unit || unit.locked) return fail(res, 404, 'Challenge is unavailable.', 'NOT_FOUND');
    return json(res, 200, { unitId: unit.id, questions: activeBossQuestionIds(data.bossAttempts, unit, user.id).map((id) => safeQuestion(findQuestion(data, id), user.language)) });
  }

  if (req.method === 'POST' && url.pathname === '/api/shop/purchase') {
    const user = requireRole(req, res, data, ['student']);
    if (!user) return;
    const body = await readBody(req);
    if (!body.itemId || !body.idempotencyKey) return fail(res, 400, 'Item and request key are required.', 'VALIDATION');
    const result = await store.transact((draft) => purchaseItem(draft, { userId: user.id, itemId: body.itemId, idempotencyKey: body.idempotencyKey }));
    return json(res, 200, result);
  }

  if (req.method === 'PATCH' && url.pathname === '/api/profile') {
    const user = requireRole(req, res, data, ['student', 'teacher', 'admin']);
    if (!user) return;
    const body = await readBody(req);
    const result = await store.transact((draft) => {
      const target = draft.users.find((item) => item.id === user.id);
      if (['ar', 'en'].includes(body.language)) target.language = body.language;
      const equipSlots = { avatarItemId: 'avatar', outfitItemId: 'outfit', companionItemId: 'companion', backgroundItemId: 'background' };
      for (const [field, type] of Object.entries(equipSlots)) {
        if (!body[field]) continue;
        const owned = draft.inventory.some((item) => item.userId === user.id && item.itemId === body[field]);
        const item = draft.shopItems.find((candidate) => candidate.id === body[field]);
        if (owned && item?.type === type) target[field] = body[field];
      }
      draft.audit.push({ id: crypto.randomUUID(), actorId: user.id, action: 'PROFILE_UPDATED', targetId: user.id, at: new Date().toISOString() });
      return publicUser(target);
    });
    return json(res, 200, { user: result });
  }

  if (req.method === 'POST' && url.pathname === '/api/assignments') {
    const user = requireRole(req, res, data, ['teacher']);
    if (!user) return;
    const body = await readBody(req);
    const result = await store.transact((draft) => {
      const classItem = draft.classes.find((item) => item.id === body.classId && item.teacherId === user.id);
      const lesson = draft.curriculum.units.flatMap((unit) => unit.lessons).find((item) => item.id === body.lessonId);
      if (!classItem || !lesson) throw new Error('Class or lesson is unavailable');
      const assignment = { id: crypto.randomUUID(), classId: classItem.id, teacherId: user.id, lessonId: lesson.id, titleAr: String(body.titleAr || lesson.titleAr), titleEn: String(body.titleEn || lesson.titleEn), dueAt: body.dueAt || null, createdAt: new Date().toISOString() };
      draft.assignments.push(assignment);
      draft.audit.push({ id: crypto.randomUUID(), actorId: user.id, action: 'ASSIGNMENT_CREATED', targetId: assignment.id, at: assignment.createdAt });
      return assignment;
    });
    return json(res, 201, { assignment: result });
  }

  const reviewMatch = url.pathname.match(/^\/api\/admin\/questions\/([^/]+)\/status$/);
  if (req.method === 'PATCH' && reviewMatch) {
    const user = requireRole(req, res, data, ['admin']);
    if (!user) return;
    const body = await readBody(req);
    const result = await store.transact((draft) => {
      const index = draft.questions.findIndex((item) => item.id === reviewMatch[1]);
      if (index < 0) throw new Error('Content item is unavailable');
      const updated = transitionQuestion(draft.questions[index], body.action, user.id);
      draft.questions[index] = updated;
      draft.audit.push({ id: crypto.randomUUID(), actorId: user.id, action: `QUESTION_${String(body.action).toUpperCase().replace(/-/g, '_')}`, targetId: updated.id, at: new Date().toISOString() });
      return updated;
    });
    return json(res, 200, {
      id: result.id, version: result.version, skillId: result.skillId, difficulty: result.difficulty, promptAr: result.promptAr, variantOf: result.variantOf || null,
      reviewStatus: result.reviewStatus, publicationStatus: result.publicationStatus, provenance: result.provenance,
      reviewedBy: result.reviewedBy || null, reviewedAt: result.reviewedAt || null, publishedBy: result.publishedBy || null, publishedAt: result.publishedAt || null,
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/tutor/ask') {
    const user = requireRole(req, res, data, ['student', 'teacher', 'admin']);
    if (!user) return;
    if (rateLimited(`tutor:${user.id}`, 15, 10 * 60_000)) return fail(res, 429, 'You have asked a lot of questions — take a short break and try again soon.', 'RATE_LIMITED');
    const body = await readBody(req);
    const message = String(body.message || '').trim().slice(0, 500);
    if (!message) return fail(res, 400, 'Write a question first.', 'VALIDATION');
    if (!OLLAMA_URL) return json(res, 200, { reply: user.language === 'en' ? 'The study helper is not set up on this deployment yet.' : 'المساعد الدراسي غير مفعّل على هذه النسخة بعد.', aiGenerated: false, unavailable: true });
    const lesson = body.lessonId ? data.curriculum.units.flatMap((unit) => unit.lessons).find((item) => item.id === body.lessonId) : null;
    const question = body.questionId ? findQuestion(data, body.questionId) : null;
    const reply = await askTutor(tutorSystemPrompt(lesson, question, user.language), message);
    if (reply) return json(res, 200, { reply, aiGenerated: true });
    return json(res, 200, {
      reply: user.language === 'en' ? 'The study helper is warming up or busy right now — try again in a moment, or ask your teacher.' : 'المساعد بيجهّز نفسه أو مشغول دلوقتي — جرّب تاني بعد لحظات، أو اسأل معلمك.',
      aiGenerated: false, unavailable: true,
    });
  }

  if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, schemaVersion: data.meta.schemaVersion });
  return fail(res, 404, 'This endpoint does not exist.', 'NOT_FOUND');
}

async function serveStatic(req, res, url) {
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const resolved = path.resolve(PUBLIC, `.${requested}`);
  if (!resolved.startsWith(PUBLIC)) return fail(res, 403, 'Forbidden', 'FORBIDDEN');
  try {
    const info = await stat(resolved);
    if (!info.isFile()) throw new Error('Not a file');
    // no-cache (not no-store): browsers may keep a copy but must revalidate with the server first.
    // A long max-age here would let an already-open tab silently run stale app.js/styles.css for up
    // to that long after every deploy, since this app has no content-hashed filenames to bust on.
    res.writeHead(200, { 'Content-Type': MIME[path.extname(resolved)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; img-src 'self' data:; connect-src 'self'" });
    createReadStream(resolved).pipe(res);
  } catch {
    if (!path.extname(requested)) return serveStatic(req, res, new URL('/index.html', url));
    return fail(res, 404, 'File not found', 'NOT_FOUND');
  }
}

export async function createServer(options = {}) {
  await store.init({ reset: options.reset });
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    try {
      if (url.pathname.startsWith('/api/')) await handleApi(req, res, url);
      else await serveStatic(req, res, url);
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') console.error(error);
      fail(res, error.message === 'Insufficient balance' ? 409 : 400, error.message, 'BUSINESS_RULE');
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = await createServer();
  server.listen(PORT, () => console.log(`Learning Platform running at http://localhost:${PORT}`));
}
