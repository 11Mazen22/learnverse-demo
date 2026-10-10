/** Private work stays in bounded RAM, never in browser storage or another account. */
export function createSessionGuard() {
  let revision = 0;
  let owner: string | null = null;
  return {
    owner: () => owner,
    capture: () => revision,
    isCurrent: (token: number) => token === revision,
    reset(nextOwner: string | null) {
      owner = nextOwner;
      return ++revision;
    },
  };
}

export function createDraftCache<T>(
  sizeOf: (value: T) => number,
  maxBytes = 2 * 1024 * 1024,
  maxEntries = 8,
  now = Date.now,
) {
  const values = new Map<string, { value: T; at: number; bytes: number }>();
  let expiryTimer: ReturnType<typeof setTimeout> | undefined;
  function scheduleExpiry() {
    clearTimeout(expiryTimer);
    expiryTimer = undefined;
    if (!values.size) return;
    const next = Math.min(
      ...[...values.values()].map((item) => item.at + 30 * 60 * 1000),
    );
    expiryTimer = setTimeout(prune, Math.max(1, next - now()));
    // Server-side rendering and Node unit tests must not retain a process handle.
    if (typeof expiryTimer === "object") expiryTimer.unref?.();
  }
  function prune() {
    for (const [key, item] of values)
      if (now() - item.at >= 30 * 60 * 1000) values.delete(key);
    let bytes = [...values.values()].reduce(
      (total, item) => total + item.bytes,
      0,
    );
    for (const [key, item] of values) {
      if (bytes <= maxBytes && values.size <= maxEntries) break;
      values.delete(key);
      bytes -= item.bytes;
    }
    scheduleExpiry();
  }
  return {
    get(key: string): T | undefined {
      prune();
      return values.get(key)?.value;
    },
    set(key: string, value: T): boolean {
      const bytes = sizeOf(value);
      if (!Number.isFinite(bytes) || bytes < 0 || bytes > maxBytes)
        return false;
      values.delete(key);
      values.set(key, { value, at: now(), bytes });
      prune();
      return values.has(key);
    },
    delete(key: string) {
      values.delete(key);
      scheduleExpiry();
    },
    clear() {
      values.clear();
      clearTimeout(expiryTimer);
      expiryTimer = undefined;
    },
  };
}

export const writingDrafts = createDraftCache<{
  text: string;
  title: string;
  source: string;
}>((d) => 2 * (d.text.length + d.title.length + d.source.length));
export const composerDrafts = createDraftCache<{
  text: string;
  documents: File[];
  attachment: File | null;
}>(
  (d) =>
    2 * d.text.length +
    d.documents.reduce((n, f) => n + f.size, 0) +
    (d.attachment?.size ?? 0),
  32 * 1024 * 1024,
  20,
);
export function clearSessionWork() {
  writingDrafts.clear();
  composerDrafts.clear();
}

let cacheOwner: string | null | undefined;
export function synchronizeSessionWork(owner: string | null) {
  const changed = cacheOwner !== owner;
  if (changed) {
    clearSessionWork();
    cacheOwner = owner;
  }
  return changed;
}
