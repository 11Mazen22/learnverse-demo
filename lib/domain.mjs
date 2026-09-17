export const MASTERY_RULES = Object.freeze({
  version: 'mvp-1',
  windowSize: 8,
  minimumIndependentQuestions: 3,
  intervalsDays: [1, 3, 7],
  thresholds: { reteach: 50, supported: 70, mixed: 85 },
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function scoreQuestion(question, answer) {
  if (question.type === 'multiple-choice') {
    const correct = String(answer) === String(question.correctAnswer);
    return {
      correct,
      normalizedAnswer: String(answer ?? ''),
      feedback: correct
        ? question.explanation
        : question.distractorFeedback?.[String(answer)] || question.explanation,
    };
  }

  if (question.type === 'numeric') {
    const numeric = Number(String(answer).replace(',', '.').trim());
    const target = Number(question.correctAnswer);
    const tolerance = Number(question.tolerance ?? 0);
    const correct = Number.isFinite(numeric) && Math.abs(numeric - target) <= tolerance;
    return {
      correct,
      normalizedAnswer: Number.isFinite(numeric) ? numeric : null,
      feedback: correct ? question.explanation : question.numericFeedback || question.explanation,
    };
  }

  throw new Error(`Unsupported question type: ${question.type}`);
}

export function deriveMastery(attempts, now = new Date()) {
  const ordered = [...attempts]
    .filter((attempt) => !attempt.practiceRepeat)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, MASTERY_RULES.windowSize);

  const distinctIndependent = new Set(
    ordered.filter((attempt) => !attempt.assisted).map((attempt) => attempt.questionId),
  );
  const independent = ordered.filter((attempt) => !attempt.assisted);
  const enoughEvidence = distinctIndependent.size >= MASTERY_RULES.minimumIndependentQuestions;

  if (!ordered.length) {
    return {
      score: null,
      state: 'insufficient',
      evidenceCount: 0,
      independentQuestionCount: 0,
      confidence: 'none',
      nextReviewAt: null,
    };
  }

  const weighted = ordered.map((attempt) => {
    const difficultyWeight = { core: 0.9, application: 1, transfer: 1.08 }[attempt.difficulty] || 1;
    const assistanceWeight = attempt.assisted ? 0.55 : 1;
    return { earned: attempt.correct ? difficultyWeight * assistanceWeight : 0, possible: difficultyWeight };
  });
  const score = Math.round(
    (weighted.reduce((sum, item) => sum + item.earned, 0) /
      weighted.reduce((sum, item) => sum + item.possible, 0)) *
      100,
  );

  let state = 'insufficient';
  if (enoughEvidence) {
    if (score < MASTERY_RULES.thresholds.reteach) state = 'reteach';
    else if (score < MASTERY_RULES.thresholds.supported) state = 'supported';
    else if (score < MASTERY_RULES.thresholds.mixed) state = 'mixed';
    else state = 'mastered-provisional';
  }

  const recentCorrect = independent.slice(0, 3).filter((item) => item.correct).length;
  const intervalIndex = clamp(recentCorrect - 1, 0, MASTERY_RULES.intervalsDays.length - 1);
  const interval = MASTERY_RULES.intervalsDays[intervalIndex];
  const nextReviewAt = new Date(now.getTime() + interval * 86400000).toISOString();

  return {
    score,
    state,
    evidenceCount: ordered.length,
    independentQuestionCount: distinctIndependent.size,
    confidence: enoughEvidence ? 'developing' : 'limited',
    nextReviewAt,
  };
}

export function balanceFor(ledger, userId, currency = 'COIN') {
  return ledger
    .filter((entry) => entry.userId === userId && entry.currency === currency)
    .reduce((sum, entry) => sum + entry.amount, 0);
}

export function appendLedgerEntry(data, entry) {
  const duplicate = data.ledger.find((item) => item.idempotencyKey === entry.idempotencyKey);
  if (duplicate) return { entry: duplicate, duplicate: true };
  if (!Number.isInteger(entry.amount) || entry.amount === 0) throw new Error('Ledger amount must be a non-zero integer');

  const nextBalance = balanceFor(data.ledger, entry.userId, entry.currency) + entry.amount;
  if (nextBalance < 0) throw new Error('Insufficient balance');

  const created = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ruleVersion: 'economy-mvp-1',
    ...entry,
  };
  data.ledger.push(created);
  return { entry: created, duplicate: false };
}

export function purchaseItem(data, { userId, itemId, idempotencyKey }) {
  const existing = data.purchases.find((purchase) => purchase.idempotencyKey === idempotencyKey);
  if (existing) return { purchase: existing, duplicate: true };

  const item = data.shopItems.find((candidate) => candidate.id === itemId && candidate.active);
  if (!item) throw new Error('Item is unavailable');
  if (data.inventory.some((owned) => owned.userId === userId && owned.itemId === itemId)) {
    throw new Error('Item is already owned');
  }

  appendLedgerEntry(data, {
    userId,
    amount: -item.price,
    currency: 'COIN',
    reason: 'SHOP_PURCHASE',
    reference: item.id,
    idempotencyKey: `purchase-ledger:${idempotencyKey}`,
  });

  const purchase = {
    id: crypto.randomUUID(),
    userId,
    itemId,
    amount: item.price,
    currency: 'COIN',
    idempotencyKey,
    createdAt: new Date().toISOString(),
  };
  data.purchases.push(purchase);
  data.inventory.push({ userId, itemId, acquiredAt: purchase.createdAt, source: 'purchase' });
  return { purchase, duplicate: false };
}

export function recommendationFor(masteryRows, curriculum) {
  const skills = curriculum.units.flatMap((unit) => unit.lessons.flatMap((lesson) => lesson.skills));
  const byUrgency = skills
    .map((skillId) => ({
      skillId,
      mastery: masteryRows.find((row) => row.skillId === skillId),
    }))
    .sort((a, b) => {
      if (!a.mastery && !b.mastery) return 0;
      if (!a.mastery) return -1;
      if (!b.mastery) return 1;
      return (a.mastery.score ?? -1) - (b.mastery.score ?? -1);
    });
  const target = byUrgency[0];
  if (!target) return null;
  const lesson = curriculum.units.flatMap((unit) => unit.lessons).find((item) => item.skills.includes(target.skillId));
  return {
    skillId: target.skillId,
    lessonId: lesson.id,
    reason: target.mastery
      ? target.mastery.state === 'insufficient'
        ? 'gather-evidence'
        : 'strengthen-skill'
      : 'start-learning',
  };
}
