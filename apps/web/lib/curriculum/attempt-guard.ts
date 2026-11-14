/**
 * Synchronous double-click lock + stable idempotency-key manager for curriculum
 * assessment RPCs (`submit_attempt`, `complete_lesson`, `complete_unit_boss`, `claim_reward_box`).
 */
export class AttemptIdempotencyController {
  private inFlight = false;
  private readonly keys = new Map<string, string>();
  private readonly completed = new Set<string>();

  private keyFactory(): string {
    if (
      typeof globalThis.crypto !== "undefined" &&
      typeof globalThis.crypto.randomUUID === "function"
    ) {
      return globalThis.crypto.randomUUID();
    }
    return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  /**
   * Returns a deterministic UUID key for the exact `(scope, targetId, response)` tuple
   * so transient network retries reuse the same idempotency key instead of double-charging
   * or double-grading on the server.
   */
  getAttemptKey(questionId: string, responseValue: string): string {
    const composite = `attempt::${questionId}::${responseValue.trim()}`;
    let existing = this.keys.get(composite);
    if (!existing) {
      existing = this.keyFactory();
      this.keys.set(composite, existing);
    }
    return existing;
  }

  clearAttempt(questionId?: string): void {
    if (!questionId) {
      this.keys.clear();
      return;
    }
    const prefix = `attempt::${questionId}::`;
    for (const k of [...this.keys.keys()]) {
      if (k.startsWith(prefix)) this.keys.delete(k);
    }
  }

  /** Prevents concurrent duplicate submissions synchronously before React re-renders. */
  async runExclusive<T>(work: () => Promise<T>): Promise<{ ran: boolean; value?: T }> {
    if (this.inFlight) return { ran: false };
    this.inFlight = true;
    try {
      const value = await work();
      return { ran: true, value };
    } finally {
      this.inFlight = false;
    }
  }

  isBusy(): boolean {
    return this.inFlight;
  }

  /** Marks a completion/claim operation (`complete_lesson`, `complete_unit_boss`, `claim_reward_box`) as completed locally so rapid repeat clicks cannot re-fire after acceptance. */
  markCompleted(action: string, targetId: string): void {
    this.completed.add(`${action}::${targetId}`);
  }

  hasCompleted(action: string, targetId: string): boolean {
    return this.completed.has(`${action}::${targetId}`);
  }

  resetAll(): void {
    this.inFlight = false;
    this.keys.clear();
    this.completed.clear();
  }
}

/**
 * Extracts distractor misconception note for a selected option index or explanation fallback.
 */
export function extractDistractorFeedback(
  metadata: unknown,
  selectedAnswer: string,
  locale: "ar" | "en",
): string {
  if (!metadata || typeof metadata !== "object") return "";
  const record = metadata as Record<string, unknown>;
  const map =
    (locale === "en" ? record.distractor_explanations_en : record.distractor_explanations_ar) ??
    record.distractor_explanations ??
    record.misconceptions;
  if (map && typeof map === "object" && !Array.isArray(map)) {
    const hit = (map as Record<string, unknown>)[selectedAnswer.trim()];
    if (typeof hit === "string" && hit.trim()) return hit.trim();
  }
  const common =
    locale === "en" ? record.misconception_en ?? record.misconception : record.misconception_ar ?? record.misconception;
  return typeof common === "string" ? common.trim() : "";
}
