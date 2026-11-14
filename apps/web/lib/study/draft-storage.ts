const DRAFT_PREFIX = "noata:study-draft:";
const DASHBOARD_PREFS_PREFIX = "noata:dashboard-prefs:";
const AI_DRAFT_PREFIX = "noata-ai-draft";
export const STUDY_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  readonly length: number;
  key(index: number): string | null;
};

type ScopedDraftEnvelope<T> = {
  version: 1;
  userId: string;
  epoch: number;
  expiresAt: number;
  payload: T;
};

export function scopedStudyDraftKey(
  userId: string | null | undefined,
  epoch: number,
  draftName: string,
): string {
  const scope = userId && userId.trim() ? userId.trim() : "guest";
  const safeName = draftName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
  return `${DRAFT_PREFIX}${scope}:e${Math.max(0, Math.floor(epoch))}:${safeName}`;
}

export function saveScopedStudyDraft<T>(
  storage: StorageLike | null | undefined,
  userId: string | null | undefined,
  epoch: number,
  draftName: string,
  payload: T,
  now = Date.now(),
): void {
  if (!storage) return;
  const scope = userId && userId.trim() ? userId.trim() : "guest";
  const envelope: ScopedDraftEnvelope<T> = {
    version: 1,
    userId: scope,
    epoch: Math.max(0, Math.floor(epoch)),
    expiresAt: now + STUDY_DRAFT_TTL_MS,
    payload,
  };
  try {
    storage.setItem(scopedStudyDraftKey(scope, epoch, draftName), JSON.stringify(envelope));
  } catch {
    // Ignore storage quota exceptions silently
  }
}

export function loadScopedStudyDraft<T>(
  storage: StorageLike | null | undefined,
  userId: string | null | undefined,
  epoch: number,
  draftName: string,
  now = Date.now(),
): T | null {
  if (!storage) return null;
  const key = scopedStudyDraftKey(userId, epoch, draftName);
  const scope = userId && userId.trim() ? userId.trim() : "guest";
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ScopedDraftEnvelope<T>>;
    if (
      parsed?.version !== 1 ||
      parsed.userId !== scope ||
      parsed.epoch !== Math.max(0, Math.floor(epoch)) ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= now
    ) {
      storage.removeItem(key);
      return null;
    }
    return parsed.payload ?? null;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

/**
 * Deletes every study draft belonging to a different user, previous epoch, or
 * expired past the 24-hour TTL ceiling.
 */
export function purgeForeignOrExpiredStudyDrafts(
  storage: StorageLike | null | undefined,
  activeUserId: string | null | undefined,
  activeEpoch: number,
  now = Date.now(),
): number {
  if (!storage) return 0;
  const scope = activeUserId && activeUserId.trim() ? activeUserId.trim() : "guest";
  const prefixExpected = `${DRAFT_PREFIX}${scope}:e${Math.max(0, Math.floor(activeEpoch))}:`;
  const toDelete: string[] = [];

  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key) continue;

    if (key.startsWith(DASHBOARD_PREFS_PREFIX)) {
      const expectedPrefKey = `${DASHBOARD_PREFS_PREFIX}${scope}`;
      const guestPrefKey = `${DASHBOARD_PREFS_PREFIX}guest`;
      if (key !== expectedPrefKey && key !== guestPrefKey) {
        toDelete.push(key);
      }
      continue;
    }

    if (key.startsWith(AI_DRAFT_PREFIX)) {
      if (!key.includes(scope)) {
        toDelete.push(key);
      }
      continue;
    }

    if (!key.startsWith(DRAFT_PREFIX)) continue;
    if (!key.startsWith(prefixExpected)) {
      toDelete.push(key);
      continue;
    }
    try {
      const parsed = JSON.parse(storage.getItem(key) ?? "") as Partial<ScopedDraftEnvelope<unknown>>;
      if (typeof parsed.expiresAt !== "number" || parsed.expiresAt <= now) {
        toDelete.push(key);
      }
    } catch {
      toDelete.push(key);
    }
  }

  for (const key of toDelete) {
    storage.removeItem(key);
  }
  return toDelete.length;
}

/** Immediately wipes every scoped study draft and user-scoped workspace draft (called on sign-out or account change). */
export function wipeAllStudyDrafts(storage: StorageLike | null | undefined): number {
  if (!storage) return 0;
  const toDelete: string[] = [];
  const guestPrefKey = `${DASHBOARD_PREFS_PREFIX}guest`;
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key) continue;
    if (
      key.startsWith(DRAFT_PREFIX) ||
      key.startsWith(AI_DRAFT_PREFIX) ||
      (key.startsWith(DASHBOARD_PREFS_PREFIX) && key !== guestPrefKey)
    ) {
      toDelete.push(key);
    }
  }
  for (const key of toDelete) storage.removeItem(key);
  return toDelete.length;
}
