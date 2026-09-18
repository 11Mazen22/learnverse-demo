import http from 'node:http';
import { createReadStream } from 'node:fs';
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { activeBossQuestionIds, appendLedgerEntry, balanceFor, deriveChatTitle, deriveMastery, pickVariant, purchaseItem, recommendationFor, scoreQuestion, transitionQuestion, xpProgress, XP_RULES } from './lib/domain.mjs';
import { releaseGenerationLock, tryAcquireGenerationLock } from './lib/generationLock.mjs';
import { JsonStore } from './lib/store.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 3000);
const store = new JsonStore(process.env.DATA_FILE || path.join(ROOT, 'data', 'app.json'));
const CHAT_ATTACHMENTS_DIR = process.env.DATA_FILE
  ? path.join(path.dirname(process.env.DATA_FILE), 'chat-attachments')
  : path.join(ROOT, 'data', 'chat-attachments');
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
const TUTOR_TIMEOUT_MS = 70_000;

// AI Chat page: a separate, general-purpose multi-conversation study assistant (see docs/DECISIONS.md).
// Shares the same Ollama instance and the same generation lock as the tutor widget above, but is not
// grounded to one lesson and is student-only.
const CHAT_MESSAGE_BODY_MAX = 8_000_000; // accommodates a client-resized (~1600px, JPEG) image plus JSON overhead
const CHAT_ATTACHMENT_MAX_BASE64 = 6_000_000; // defense-in-depth backstop; the client resize is the primary control
const MAX_TEXT_ATTACHMENT_CHARS = 20_000; // matches the client-side truncation cap for text-file attachments and OCR text
const CHAT_HISTORY_WINDOW = 12; // last N stored messages sent to Ollama per generation — a latency control on
// CPU-only inference, not a model context-window limit (the model's real window is far larger)
const CHAT_NUM_PREDICT = 600; // fuller answers than the tutor widget's 200 (tuned for 1-3-sentence hints)
const CHAT_NUM_PREDICT_THINKING = 1600; // reasoning + answer share this budget — a verbose reasoning
// pass can otherwise eat the whole cap and leave zero room for the actual final answer
const CHAT_TIMEOUT_MS_THINKING = 110_000; // thinking mode is a deliberate slow path on CPU-only
// inference; timing out at the same budget as a quick reply would defeat the point of offering it

// Cached at boot by probeThinkingSupport(): whether the deployed model/Ollama build genuinely keeps
// reasoning in a separate `message.thinking` field instead of leaking it into `message.content`. The
// Chat page's Thinking/Normal toggle only renders when this is true — self-detecting, never hardcoded.
const aiCapabilities = { thinkingSupported: false };

async function probeThinkingSupport() {
  if (!OLLAMA_URL) return;
  const log = (message) => { if (process.env.NODE_ENV !== 'test') console.log(message); };
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL, stream: false, think: true, options: { num_predict: 300 },
        messages: [{ role: 'user', content: 'What is 17 plus 26? Answer with just the number.' }],
      }),
    });
    if (!response.ok) { log(`Thinking-mode probe failed: HTTP ${response.status}`); return; }
    const payload = await response.json();
    const thinking = payload?.message?.thinking || '';
    const content = payload?.message?.content || '';
    const leaked = /<think|<\/think>|^\s*(okay|let me|first,? i|i need to)/i.test(content);
    aiCapabilities.thinkingSupported = thinking.length > 0 && !leaked;
    log(`Thinking-mode probe: ${aiCapabilities.thinkingSupported ? 'supported (clean separation)' : 'not supported (leaked or empty)'}`);
  } catch (error) {
    log(`Thinking-mode probe failed: ${error.message}`);
  }
}

// Flips any assistant message a prior process left mid-generation (e.g. a Railway restart) to a
// clearly-labelled stopped state, so a conversation never shows a phantom "generating…" forever.
// Safe to run unconditionally at boot: a fresh process's generation lock is always empty at this
// point, so nothing can genuinely still be mid-generation when this runs.
async function sweepStaleGeneratingMessages() {
  try {
    await store.transact((draft) => {
      draft.chatConversations ||= [];
      for (const conversation of draft.chatConversations) {
        for (const message of conversation.messages) {
          if (message.status === 'generating') { message.status = 'stopped'; message.stopped = true; message.unavailable = true; }
        }
      }
    });
  } catch { /* best-effort */ }
}

function chatSystemPrompt(language, think) {
  const lines = [
    'You are the AI study assistant inside a demonstration Arabic-first learning app for secondary-level students.',
    'Help the student understand ideas, work through problems, and study effectively. You may discuss any study topic they ask about, not only one specific lesson.',
    'Be encouraging, clear, and age-appropriate. Never claim to be a human teacher, and never claim to have graded or scored anything.',
    'If asked to simply do a student\'s graded assignment for them, offer to explain the underlying concept instead of just giving the final answer.',
    // This runs on CPU-only inference, where every extra sentence is real, felt latency — brevity is
    // a genuine performance lever here, not just a style preference. Thinking mode is the deliberate
    // slow/thorough path (see CHAT_NUM_PREDICT_THINKING), so this constraint is relaxed there.
    think
      ? 'Reason through the problem as thoroughly as you need to, then give a clear, well-organized final answer.'
      : 'Keep your answer tight and efficient: get straight to the point in a few clear sentences or a short structured list, with one worked example only if it genuinely helps — avoid restating the question, padding, or unnecessary preamble.',
    language === 'en'
      ? 'Respond in English by default, including your internal thinking/reasoning steps, not only your final answer. If the student writes their question in Arabic instead, switch entirely to Arabic for both your thinking and your answer.'
      : 'فكّر وأجب باللغة العربية الفصحى المبسطة افتراضيًا — يشمل ذلك خطوات تفكيرك الداخلي، وليس فقط إجابتك النهائية. إذا كتب الطالب سؤاله بلغة أخرى مثل الإنجليزية، فاستخدم تلك اللغة نفسها بدلاً من العربية.',
  ];
  // Reasoning models (this one included) have a strong learned default toward thinking in English
  // inside their <think> block regardless of an answer-language instruction stated earlier — put a
  // second, maximally explicit instruction naming that block directly as the LAST line for the
  // strongest recency weight, since this is the one channel most resistant to steering. Not
  // guaranteed to be fully obeyed (an inherent model bias, not something a prompt can force with
  // certainty), but this is the strongest available lever without a model swap.
  if (think) {
    lines.push(
      language === 'en'
        ? 'IMPORTANT: write everything inside your <think> block in English too — do not let your reasoning default to any other language even if it feels more natural there.'
        : 'مهم جدًا: اكتب كل ما بداخل خانة تفكيرك <think> باللغة العربية فقط، وليس بالإنجليزية. حتى تفكيرك الداخلي الخاص يجب أن يكون بالعربية الفصحى، لا يوجد أي استثناء لهذا ما لم يكتب الطالب سؤاله بلغة أخرى.',
    );
  }
  return lines.join('\n');
}

// Builds the Ollama messages array for one generation: the system prompt plus the last
// CHAT_HISTORY_WINDOW stored messages (a latency control, see above). The deployed model has no
// vision capability, so image attachments are never sent as image bytes to Ollama — instead, the
// client runs real OCR (Tesseract.js) on the image before sending, and the extracted text is folded
// into the user turn's content here, clearly labelled as OCR output rather than the student's own
// words. Text-file attachments (py/txt/json/etc.) are folded in the same way. Attachments age out of
// context naturally once their message scrolls out of the CHAT_HISTORY_WINDOW, like any other turn.
function buildChatOllamaMessages(conversation, user, think) {
  const recent = conversation.messages.slice(-CHAT_HISTORY_WINDOW).filter((message) => message.status !== 'generating');
  const messages = [{ role: 'system', content: chatSystemPrompt(user.language, think) }];
  for (const message of recent) {
    if (message.role === 'user') {
      let content = message.content || '';
      const attachment = message.attachment;
      if (attachment?.kind === 'text' && attachment.content) {
        const label = user.language === 'en' ? `Attached file "${attachment.name}":` : `الملف المرفق "${attachment.name}":`;
        content = `${content}\n\n${label}\n${attachment.content}`.trim();
      } else if (attachment?.kind === 'image' && attachment.ocrText) {
        const label = user.language === 'en' ? `Text extracted via OCR from an attached image ("${attachment.name}"):` : `نص مستخرج بتقنية OCR من صورة مرفقة ("${attachment.name}"):`;
        content = `${content}\n\n${label}\n${attachment.ocrText}`.trim();
      } else if (attachment?.kind === 'image') {
        const note = user.language === 'en' ? '[The student attached an image, but no readable text was found in it.]' : '[أرفق الطالب صورة، لكن لم يُعثر على نص مقروء بداخلها.]';
        content = `${content}\n\n${note}`.trim();
      }
      messages.push({ role: 'user', content });
    } else if (message.role === 'assistant' && message.content) {
      messages.push({ role: 'assistant', content: message.content });
    }
  }
  return messages;
}

// Real token streaming: parses Ollama's own newline-delimited JSON as it arrives and re-emits each
// content/thinking delta immediately via onDelta — no artificial batching or pacing.
async function streamOllamaChat({ messages, think }, { signal, onDelta }) {
  // Thinking mode needs materially more budget than the plain-answer case: num_predict caps the
  // COMBINED reasoning-plus-answer token count, and a verbose reasoning pass can otherwise consume
  // the entire budget before any final-answer content is produced at all — the model then technically
  // "succeeds" but content comes back empty, which reads as a false "unavailable" fallback.
  const numPredict = think ? CHAT_NUM_PREDICT_THINKING : CHAT_NUM_PREDICT;
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, stream: true, think, options: { num_predict: numPredict }, messages }),
    signal,
  });
  if (!response.ok || !response.body) throw new Error(`Ollama HTTP ${response.status}`);
  let content = '';
  let thinking = '';
  let buffer = '';
  for await (const chunk of response.body) {
    // response.body yields Uint8Array chunks (not Node Buffer) from the built-in fetch — Buffer.from
    // correctly decodes either; a bare Buffer.isBuffer(chunk) check would be false for a Uint8Array
    // and silently fall through to string-concatenating raw bytes into garbage.
    buffer += Buffer.from(chunk).toString('utf8');
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line) continue;
      let parsed;
      try { parsed = JSON.parse(line); } catch { continue; }
      const deltaContent = parsed?.message?.content || '';
      const deltaThinking = parsed?.message?.thinking || '';
      if (deltaContent) { content += deltaContent; onDelta({ kind: 'content', text: deltaContent }); }
      if (deltaThinking) { thinking += deltaThinking; onDelta({ kind: 'thinking', text: deltaThinking }); }
      if (parsed?.done) return { content, thinking };
    }
  }
  return { content, thinking };
}

function tutorSystemPrompt(lesson, question, language) {
  const lines = [
    'You are a friendly, patient study helper inside a demonstration Arabic-first learning app for a secondary-level physics unit on motion.',
    'Only help the student reason about the specific lesson/question content given below. If asked about anything else, gently steer back to this lesson.',
    'Never state the final answer to the current checkpoint question outright — guide their reasoning with a hint or a leading question instead, unless they say they already answered it and just want the idea explained.',
    'Keep it very short: one to three sentences, no more. Be encouraging, age-appropriate, and never claim to be a teacher or to have graded anything.',
    language === 'en' ? 'Respond only in English. Do not mix in Arabic or any other script.' : 'أجب فقط باللغة العربية الفصحى المبسطة. لا تخلط أي حروف صينية أو إنجليزية أو أي لغة أخرى في ردك، واستخدم كلمات عربية صحيحة ومفهومة فقط.',
  ];
  if (lesson) lines.push(`Lesson: ${lesson.titleAr} / ${lesson.titleEn}. Summary: ${lesson.summaryAr} ${lesson.summaryEn}`);
  if (question) lines.push(`Current checkpoint question: ${question.promptAr || ''} / ${question.promptEn || ''}`);
  return lines.join('\n');
}

// Ollama images don't reliably honor a custom start command on Railway, so instead of trying to
// make the container pull its model at boot, we ask the already-running server to pull it over
// its own HTTP API. Fire-and-forget: the first real chats will just hit the graceful fallback
// (see askTutor) until this finishes, which is fine for a background study helper.
async function ensureTutorModelPulled() {
  if (!OLLAMA_URL) return;
  const log = (message) => { if (process.env.NODE_ENV !== 'test') console.log(message); };
  try {
    // Ollama never deletes a model just because a different one is now configured — old and new
    // simply coexist on disk. On a small demo-sized volume that silently eats the space a fresh
    // pull needs, so remove anything that isn't the currently configured model first.
    const tagsResponse = await fetch(`${OLLAMA_URL}/api/tags`);
    if (tagsResponse.ok) {
      const { models = [] } = await tagsResponse.json();
      for (const model of models) {
        if (model.name === OLLAMA_MODEL || model.model === OLLAMA_MODEL) continue;
        const deleted = await fetch(`${OLLAMA_URL}/api/delete`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: model.name || model.model }) });
        log(deleted.ok ? `Study helper: removed superseded model ${model.name || model.model}` : `Study helper: failed to remove ${model.name || model.model} (HTTP ${deleted.status})`);
      }
    }
    const response = await fetch(`${OLLAMA_URL}/api/pull`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: OLLAMA_MODEL, stream: false }) });
    log(response.ok ? `Study helper model ready: ${OLLAMA_MODEL}` : `Study helper model pull failed: HTTP ${response.status}`);
  } catch (error) {
    log(`Study helper model pull failed: ${error.message}`);
  }
}

async function askTutor(system, message) {
  if (!OLLAMA_URL) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TUTOR_TIMEOUT_MS);
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // think:false skips Qwen3's internal reasoning pass — on slow CPU inference that pass alone
      // could eat the whole timeout before any visible reply is produced. num_predict caps a reply
      // that ignores the "keep it short" instruction from running long enough to time out anyway.
      body: JSON.stringify({ model: OLLAMA_MODEL, stream: false, think: false, options: { num_predict: 200 }, messages: [{ role: 'system', content: system }, { role: 'user', content: message }] }),
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

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm' };
const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(body));
};
const fail = (res, status, message, code = 'REQUEST_FAILED') => json(res, status, { error: { code, message } });
const readBody = async (req, maxLength = 100_000) => {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > maxLength) throw new Error('Request body is too large');
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
    // A lesson's questionIds can outlive an individual question's publication status (e.g. an admin
    // retires or unpublishes one after it was already wired into a lesson) — findQuestion only resolves
    // currently 'published-demo' questions, so a stale id must be skipped here rather than crash the
    // whole bootstrap response for every student.
    lesson.questions = lesson.questionIds.map((id) => findQuestion(data, id)).filter(Boolean).map((question) => safeQuestion(question, language));
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
    return json(res, 200, { unitId: unit.id, questions: activeBossQuestionIds(data.bossAttempts, unit, user.id).map((id) => findQuestion(data, id)).filter(Boolean).map((question) => safeQuestion(question, user.language)) });
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
    // Shares one generation slot with the AI Chat page's endpoint below (same CPU-only Ollama
    // instance) — if it's busy, this keeps its existing 200-plus-labelled-fallback contract exactly
    // as before, so the widget's client code needs zero changes.
    if (!tryAcquireGenerationLock()) {
      return json(res, 200, {
        reply: user.language === 'en' ? 'The study helper is busy right now — try again in a moment.' : 'المساعد مشغول دلوقتي — جرّب تاني بعد لحظات.',
        aiGenerated: false, unavailable: true,
      });
    }
    try {
      const reply = await askTutor(tutorSystemPrompt(lesson, question, user.language), message);
      if (reply) return json(res, 200, { reply, aiGenerated: true });
      return json(res, 200, {
        reply: user.language === 'en' ? 'The study helper is warming up or busy right now — try again in a moment, or ask your teacher.' : 'المساعد بيجهّز نفسه أو مشغول دلوقتي — جرّب تاني بعد لحظات، أو اسأل معلمك.',
        aiGenerated: false, unavailable: true,
      });
    } finally {
      releaseGenerationLock();
    }
  }

  // ---- AI Chat page: a separate, general-purpose multi-conversation study assistant. ----
  // Student-only. Shares the tutor widget's Ollama instance and generation lock (see above), but is
  // not grounded to one lesson. See docs/DECISIONS.md for the streaming/persistence design.

  const chatOwnedConversation = (userId, conversationId) =>
    (data.chatConversations || []).find((item) => item.id === conversationId && item.userId === userId) || null;

  const chatConversationSummary = (conversation) => {
    const last = conversation.messages[conversation.messages.length - 1];
    return {
      id: conversation.id, title: conversation.title, pinned: conversation.pinned, archived: conversation.archived,
      createdAt: conversation.createdAt, updatedAt: conversation.updatedAt,
      preview: last ? String(last.content || '').slice(0, 120) : '',
    };
  };

  if (req.method === 'GET' && url.pathname === '/api/chat/conversations') {
    const user = requireRole(req, res, data, ['student']);
    if (!user) return;
    const conversations = (data.chatConversations || [])
      .filter((item) => item.userId === user.id)
      .sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || b.updatedAt.localeCompare(a.updatedAt))
      .map(chatConversationSummary);
    return json(res, 200, {
      conversations,
      aiCapabilities: { chatAvailable: Boolean(OLLAMA_URL), thinkingSupported: aiCapabilities.thinkingSupported },
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/chat/conversations') {
    const user = requireRole(req, res, data, ['student']);
    if (!user) return;
    const conversation = await store.transact((draft) => {
      draft.chatConversations ||= [];
      const created = {
        id: crypto.randomUUID(), userId: user.id, title: null, pinned: false, archived: false,
        messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      draft.chatConversations.push(created);
      return created;
    });
    return json(res, 201, { conversation });
  }

  const chatConvoMatch = url.pathname.match(/^\/api\/chat\/conversations\/([^/]+)$/);
  if (req.method === 'GET' && chatConvoMatch) {
    const user = requireRole(req, res, data, ['student']);
    if (!user) return;
    const conversation = chatOwnedConversation(user.id, chatConvoMatch[1]);
    if (!conversation) return fail(res, 404, 'Conversation is unavailable.', 'NOT_FOUND');
    return json(res, 200, { conversation });
  }

  if (req.method === 'PATCH' && chatConvoMatch) {
    const user = requireRole(req, res, data, ['student']);
    if (!user) return;
    if (!chatOwnedConversation(user.id, chatConvoMatch[1])) return fail(res, 404, 'Conversation is unavailable.', 'NOT_FOUND');
    const body = await readBody(req);
    const conversation = await store.transact((draft) => {
      const target = (draft.chatConversations || []).find((item) => item.id === chatConvoMatch[1] && item.userId === user.id);
      if (!target) throw new Error('Conversation is unavailable');
      if (typeof body.title === 'string' && body.title.trim()) target.title = body.title.trim().slice(0, 80);
      if (typeof body.pinned === 'boolean') target.pinned = body.pinned;
      if (typeof body.archived === 'boolean') target.archived = body.archived;
      target.updatedAt = new Date().toISOString();
      return target;
    });
    return json(res, 200, { conversation });
  }

  if (req.method === 'DELETE' && chatConvoMatch) {
    const user = requireRole(req, res, data, ['student']);
    if (!user) return;
    const existing = chatOwnedConversation(user.id, chatConvoMatch[1]);
    if (!existing) return fail(res, 404, 'Conversation is unavailable.', 'NOT_FOUND');
    await store.transact((draft) => {
      draft.chatConversations = (draft.chatConversations || []).filter((item) => !(item.id === chatConvoMatch[1] && item.userId === user.id));
    });
    for (const message of existing.messages) {
      if (message.attachment?.attachmentId) unlink(path.join(CHAT_ATTACHMENTS_DIR, `${message.attachment.attachmentId}.jpg`)).catch(() => {});
    }
    return json(res, 200, { ok: true });
  }

  const chatAttachmentMatch = url.pathname.match(/^\/api\/chat\/attachments\/([0-9a-f-]{36})$/i);
  if (req.method === 'GET' && chatAttachmentMatch) {
    const user = requireRole(req, res, data, ['student']);
    if (!user) return;
    const attachmentId = chatAttachmentMatch[1];
    const owns = (data.chatConversations || []).some((conversation) =>
      conversation.userId === user.id && conversation.messages.some((message) => message.attachment?.attachmentId === attachmentId));
    if (!owns) return fail(res, 404, 'Attachment is unavailable.', 'NOT_FOUND');
    const filePath = path.join(CHAT_ATTACHMENTS_DIR, `${attachmentId}.jpg`);
    try {
      await stat(filePath);
    } catch {
      return fail(res, 404, 'Attachment is unavailable.', 'NOT_FOUND');
    }
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=86400', 'X-Content-Type-Options': 'nosniff' });
    createReadStream(filePath).pipe(res);
    return;
  }

  const chatMessagesMatch = url.pathname.match(/^\/api\/chat\/conversations\/([^/]+)\/messages$/);
  if (req.method === 'POST' && chatMessagesMatch) {
    const user = requireRole(req, res, data, ['student']);
    if (!user) return;
    if (rateLimited(`chat:${user.id}`, 20, 10 * 60_000)) return fail(res, 429, 'You have sent a lot of messages — take a short break and try again soon.', 'RATE_LIMITED');
    const conversationId = chatMessagesMatch[1];
    if (!chatOwnedConversation(user.id, conversationId)) return fail(res, 404, 'Conversation is unavailable.', 'NOT_FOUND');

    const body = await readBody(req, CHAT_MESSAGE_BODY_MAX);
    const idempotencyKey = String(body.idempotencyKey || '');
    if (!idempotencyKey) return fail(res, 400, 'A request key is required.', 'VALIDATION');
    const content = String(body.content || '').trim().slice(0, 4000);
    const isRegenerate = Boolean(body.regenerate);
    const editFromMessageId = body.editFromMessageId ? String(body.editFromMessageId) : null;
    const requestStartedAt = Date.now();

    let attachment = null;
    if (body.attachment) {
      if (body.attachment.kind === 'text') {
        const { name, content } = body.attachment;
        if (typeof content !== 'string' || !content) return fail(res, 400, 'The file has no readable text.', 'ATTACHMENT_EMPTY');
        if (content.length > MAX_TEXT_ATTACHMENT_CHARS) return fail(res, 413, 'The file is too large.', 'ATTACHMENT_TOO_LARGE');
        attachment = { kind: 'text', name: String(name || 'file.txt').slice(0, 120), content, size: content.length };
      } else {
        const { name, type, dataBase64, ocrText } = body.attachment;
        if (typeof type !== 'string' || !type.startsWith('image/')) return fail(res, 413, 'Only image attachments are supported.', 'ATTACHMENT_UNSUPPORTED');
        if (typeof dataBase64 !== 'string' || !dataBase64 || dataBase64.length > CHAT_ATTACHMENT_MAX_BASE64) return fail(res, 413, 'The image is too large.', 'ATTACHMENT_TOO_LARGE');
        attachment = {
          kind: 'image', name: String(name || 'image').slice(0, 120), type, size: Math.round(dataBase64.length * 0.75), dataBase64,
          ocrText: typeof ocrText === 'string' ? ocrText.slice(0, MAX_TEXT_ATTACHMENT_CHARS) : '',
        };
      }
    }
    if (!isRegenerate && !content && !attachment) return fail(res, 400, 'Write a message first.', 'VALIDATION');

    if (!tryAcquireGenerationLock()) return fail(res, 429, 'The assistant is busy with another request — try again in a moment.', 'ASSISTANT_BUSY');
    let released = false;
    const release = () => { if (!released) { released = true; releaseGenerationLock(); } };

    // Phase 1 — fast transact: compute the message-array prefix (append / truncate-at-edit /
    // drop-last-assistant-for-regenerate), append the new turn(s), persist a "generating" placeholder
    // so a crash here leaves durable evidence (see sweepStaleGeneratingMessages at boot).
    let phase1;
    try {
      phase1 = await store.transact((draft) => {
        draft.chatConversations ||= [];
        const conversation = draft.chatConversations.find((item) => item.id === conversationId && item.userId === user.id);
        if (!conversation) throw new Error('Conversation is unavailable');

        const duplicateAssistant = conversation.messages.find((message) => message.role === 'assistant' && message.replyToIdempotencyKey === idempotencyKey);
        if (duplicateAssistant) return { conversation, duplicate: true, assistantMessage: duplicateAssistant };

        if (editFromMessageId) {
          const cutIndex = conversation.messages.findIndex((message) => message.id === editFromMessageId);
          if (cutIndex < 0) throw new Error('Message is unavailable');
          conversation.messages = conversation.messages.slice(0, cutIndex);
        } else if (isRegenerate) {
          const lastIndex = conversation.messages.length - 1;
          if (lastIndex >= 0 && conversation.messages[lastIndex].role === 'assistant') conversation.messages = conversation.messages.slice(0, lastIndex);
        }

        let userMessage = null;
        if (!isRegenerate) {
          userMessage = {
            id: crypto.randomUUID(), role: 'user', content, idempotencyKey,
            attachment: attachment
              ? (attachment.kind === 'text'
                ? { kind: 'text', name: attachment.name, size: attachment.size, content: attachment.content }
                : { kind: 'image', name: attachment.name, type: attachment.type, size: attachment.size, attachmentId: crypto.randomUUID(), ocrText: attachment.ocrText })
              : null,
            createdAt: new Date().toISOString(),
          };
          conversation.messages.push(userMessage);
          if (!conversation.title) {
            const attachmentTitle = attachment && (attachment.kind === 'text' ? (user.language === 'en' ? 'File' : 'ملف') : (user.language === 'en' ? 'Image' : 'صورة'));
            conversation.title = deriveChatTitle(content) || attachmentTitle || null;
          }
        }

        const assistantMessage = {
          id: crypto.randomUUID(), role: 'assistant', content: '', thinking: '', status: 'generating',
          aiGenerated: false, unavailable: false, stopped: false, replyToIdempotencyKey: idempotencyKey,
          createdAt: new Date().toISOString(),
        };
        conversation.messages.push(assistantMessage);
        conversation.updatedAt = new Date().toISOString();
        return { conversation, duplicate: false, userMessage, assistantMessage };
      });
    } catch {
      release();
      return fail(res, 404, 'Conversation is unavailable.', 'NOT_FOUND');
    }

    // From here on, the request is accepted: headers switch to streaming NDJSON, and any later
    // failure must be absorbed inside this handler (never rethrown to the top-level catch-all in
    // createServer, which would try to writeHead again and crash with ERR_HTTP_HEADERS_SENT).
    // X-Accel-Buffering:no asks any reverse proxy in front of this app (Railway's edge included) not
    // to buffer the response — without it, a proxy can hold the entire chunked body until the stream
    // ends and deliver it to the browser as one burst, even though Node is genuinely writing it
    // token-by-token the whole time (confirmed via direct curl, which bypasses browser-side proxying
    // quirks and always saw real incremental lines). setNoDelay disables Nagle's algorithm on this
    // socket so small writes go out immediately instead of waiting to coalesce.
    res.socket?.setNoDelay(true);
    res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Accel-Buffering': 'no' });
    const writeLine = (payload) => { try { res.write(`${JSON.stringify(payload)}\n`); } catch { /* client already gone */ } };
    let firstResponseAt = null;
    const writeDelta = (delta) => {
      if (firstResponseAt === null) firstResponseAt = Date.now();
      writeLine({ type: 'delta', kind: delta.kind, text: delta.text });
    };

    if (phase1.duplicate) {
      writeLine({ type: 'meta', conversationId, userMessageId: null, assistantMessageId: phase1.assistantMessage.id, title: phase1.conversation.title });
      writeDelta({ kind: 'content', text: phase1.assistantMessage.content || '' });
      writeLine({ type: 'done', aiGenerated: Boolean(phase1.assistantMessage.aiGenerated), unavailable: Boolean(phase1.assistantMessage.unavailable), stopped: Boolean(phase1.assistantMessage.stopped), timing: phase1.assistantMessage.timing || null });
      res.end();
      release();
      return;
    }

    writeLine({ type: 'meta', conversationId, userMessageId: phase1.userMessage?.id || null, assistantMessageId: phase1.assistantMessage.id, title: phase1.conversation.title });

    if (attachment && attachment.kind === 'image' && phase1.userMessage?.attachment?.attachmentId) {
      try {
        await mkdir(CHAT_ATTACHMENTS_DIR, { recursive: true });
        await writeFile(path.join(CHAT_ATTACHMENTS_DIR, `${phase1.userMessage.attachment.attachmentId}.jpg`), Buffer.from(attachment.dataBase64, 'base64'));
      } catch { /* non-fatal: the turn still works, just without a redisplayable image later */ }
    }

    // Phase 2 — outside any store.transact, so one user's slow generation never blocks the
    // server-wide write queue that every other request (including every other student) shares.
    let finalContent = '', finalThinking = '', stopped = false, aiGenerated = false, unavailable = false;
    if (!OLLAMA_URL) {
      finalContent = user.language === 'en' ? 'The AI Chat assistant is not set up on this deployment yet.' : 'مساعد الدردشة الذكي غير مفعّل على هذه النسخة بعد.';
      unavailable = true;
      writeDelta({ kind: 'content', text: finalContent });
    } else {
      const think = Boolean(body.thinking) && aiCapabilities.thinkingSupported;
      const upstreamController = new AbortController();
      const timer = setTimeout(() => upstreamController.abort(), think ? CHAT_TIMEOUT_MS_THINKING : TUTOR_TIMEOUT_MS);
      let clientClosed = false;
      const onClose = () => { clientClosed = true; upstreamController.abort(); };
      res.on('close', onClose);
      try {
        const messages = await buildChatOllamaMessages(phase1.conversation, user, think);
        const result = await streamOllamaChat(
          { messages, think },
          { signal: upstreamController.signal, onDelta: writeDelta },
        );
        finalContent = result.content;
        finalThinking = result.thinking;
        aiGenerated = finalContent.length > 0;
        unavailable = !aiGenerated;
        if (!aiGenerated) {
          finalContent = user.language === 'en' ? 'The assistant is warming up or busy right now — try again in a moment.' : 'المساعد بيجهّز نفسه أو مشغول دلوقتي — جرّب تاني بعد لحظات.';
          writeDelta({ kind: 'content', text: finalContent });
        }
      } catch (streamError) {
        if (clientClosed) {
          stopped = true;
        } else {
          unavailable = true;
          if (process.env.NODE_ENV !== 'test') console.error(`AI Chat generation failed: ${streamError.message}`);
          finalContent = user.language === 'en' ? 'The assistant is warming up or busy right now — try again in a moment.' : 'المساعد بيجهّز نفسه أو مشغول دلوقتي — جرّب تاني بعد لحظات.';
          writeDelta({ kind: 'content', text: finalContent });
        }
      } finally {
        clearTimeout(timer);
        res.removeListener('close', onClose);
      }
    }

    // Phase 3 — fast transact, always runs: persist whatever text was produced, however the
    // generation ended (completed, stopped, timed out, or the model was unavailable).
    const timing = {
      firstResponseMs: firstResponseAt === null ? null : firstResponseAt - requestStartedAt,
      totalMs: Date.now() - requestStartedAt,
    };
    await store.transact((draft) => {
      const conversation = (draft.chatConversations || []).find((item) => item.id === conversationId && item.userId === user.id);
      const assistantMessage = conversation?.messages.find((message) => message.id === phase1.assistantMessage.id);
      if (!assistantMessage) return;
      assistantMessage.content = finalContent;
      assistantMessage.thinking = finalThinking;
      assistantMessage.status = stopped ? 'stopped' : 'complete';
      assistantMessage.aiGenerated = aiGenerated;
      assistantMessage.unavailable = unavailable;
      assistantMessage.stopped = stopped;
      assistantMessage.timing = timing;
      conversation.updatedAt = new Date().toISOString();
    }).catch(() => {});

    release();
    if (!stopped) { writeLine({ type: 'done', aiGenerated, unavailable, stopped, timing }); res.end(); }
    return;
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
    // script-src includes 'wasm-unsafe-eval' and worker-src/connect-src allow blob:/data: for the
    // client-side OCR engine (Tesseract.js, vendored under /vendor/tesseract): it wraps its worker
    // script in a blob: URL before instantiating the Worker, and that worker in turn fetches its WASM
    // core via blob:/data: URIs it constructs itself — each was confirmed necessary via a live CSP
    // violation report (worker-src, then connect-src) rather than assumed upfront.
    res.writeHead(200, { 'Content-Type': MIME[path.extname(resolved)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; img-src 'self' data: blob:; connect-src 'self' blob: data:" });
    createReadStream(resolved).pipe(res);
  } catch {
    if (!path.extname(requested)) return serveStatic(req, res, new URL('/index.html', url));
    return fail(res, 404, 'File not found', 'NOT_FOUND');
  }
}

export async function createServer(options = {}) {
  await store.init({ reset: options.reset });
  await sweepStaleGeneratingMessages();
  await mkdir(CHAT_ATTACHMENTS_DIR, { recursive: true }).catch(() => {});
  ensureTutorModelPulled().then(() => probeThinkingSupport());
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
