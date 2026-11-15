/**
 * Account-isolated local preference storage and unified reduced-motion synchronization.
 * Ensures sign-out and account switching never leak theme, palette, locale, motion,
 * or Quran reader device settings across accounts while maintaining zero-FOUC prehydration.
 */

export const ACTIVE_ACCOUNT_SCOPE_KEY = "noata:active-account-scope";
export const MOTION_PREFERENCE_EVENT = "noata:motion-preference";

export const PALETTE_PREF_PREFIX = "noata:palette:";
export const THEME_PREF_PREFIX = "noata:theme:";
export const LOCALE_PREF_PREFIX = "noata:locale:";
export const MOTION_PREF_PREFIX = "noata:motion:";
export const SERVER_REDUCED_MOTION_PREFIX = "noata:server-reduced-motion:";
export const QURAN_BOOKMARKS_PREFIX = "noata:quran-bookmarks:";
export const QURAN_READING_SIZE_PREFIX = "noata:quran-reading-percent:";

export const LEGACY_DEVICE_PREFERENCE_KEYS = [
  "noata-palette",
  "noata-theme",
  "noata-locale",
  "noata-ai-motion-v1",
  "noata-quran-bookmarks-v1",
  "noata-quran-reading-percent-v2",
] as const;

const SCOPED_PREFIXES = [
  PALETTE_PREF_PREFIX,
  THEME_PREF_PREFIX,
  LOCALE_PREF_PREFIX,
  MOTION_PREF_PREFIX,
  SERVER_REDUCED_MOTION_PREFIX,
  QURAN_BOOKMARKS_PREFIX,
  QURAN_READING_SIZE_PREFIX,
] as const;

export type MotionPreferenceMode = "system" | "full" | "reduce" | "off";

type MinimalStorage = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

function resolveStorage(explicit?: MinimalStorage | null): MinimalStorage | null {
  if (explicit) return explicit;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function normalizeAccountScope(userId: string | null | undefined): string {
  return typeof userId === "string" && userId.trim().length > 0 ? userId.trim() : "guest";
}

export function scopedPreferenceKey(prefix: string, userId?: string | null): string {
  return `${prefix}${normalizeAccountScope(userId)}`;
}

export function getActiveAccountScope(storage?: MinimalStorage | null): string {
  const store = resolveStorage(storage);
  if (!store) return "guest";
  try {
    return normalizeAccountScope(store.getItem(ACTIVE_ACCOUNT_SCOPE_KEY));
  } catch {
    return "guest";
  }
}

export function setActiveAccountScope(
  userId: string | null | undefined,
  storage?: MinimalStorage | null,
): string {
  const scope = normalizeAccountScope(userId);
  const store = resolveStorage(storage);
  if (!store) return scope;
  try {
    store.setItem(ACTIVE_ACCOUNT_SCOPE_KEY, scope);
  } catch {
    /* Optional browser storage */
  }
  return scope;
}

function resolveTargetScope(
  explicitUserId?: string | null,
  storage?: MinimalStorage | null,
): string {
  if (explicitUserId !== undefined) {
    return normalizeAccountScope(explicitUserId);
  }
  return getActiveAccountScope(storage);
}

/**
 * Read a preference scoped to `explicitUserId` (or the current active account scope).
 * Only migrates legacy unscoped keys when reading for the `"guest"` scope with no foreign
 * signed-in account active, preventing cross-account preference inheritance.
 */
export function readScopedDevicePreference(
  prefix: string,
  options: {
    userId?: string | null;
    legacyKey?: string;
    storage?: MinimalStorage | null;
  } = {},
): string | null {
  const store = resolveStorage(options.storage);
  if (!store) return null;
  const scope = resolveTargetScope(options.userId, store);
  try {
    const direct = store.getItem(`${prefix}${scope}`);
    if (direct !== null) return direct;
    if (options.legacyKey && scope === "guest") {
      const recordedScope = store.getItem(ACTIVE_ACCOUNT_SCOPE_KEY);
      if (!recordedScope || recordedScope === "guest") {
        return store.getItem(options.legacyKey);
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist a preference exclusively under the resolved account's scoped key.
 */
export function writeScopedDevicePreference(
  prefix: string,
  value: string,
  options: {
    userId?: string | null;
    storage?: MinimalStorage | null;
  } = {},
): boolean {
  const store = resolveStorage(options.storage);
  if (!store) return false;
  const scope = resolveTargetScope(options.userId, store);
  try {
    store.setItem(`${prefix}${scope}`, value);
    if (options.userId !== undefined) {
      store.setItem(ACTIVE_ACCOUNT_SCOPE_KEY, scope);
    }
    return true;
  } catch {
    return false;
  }
}

export function safeMotionMode(raw: unknown): MotionPreferenceMode {
  return raw === "full" || raw === "reduce" || raw === "off" ? raw : "system";
}

export function readScopedMotionPreference(
  userId?: string | null,
  storage?: MinimalStorage | null,
): MotionPreferenceMode {
  return safeMotionMode(
    readScopedDevicePreference(MOTION_PREF_PREFIX, {
      userId,
      legacyKey: "noata-ai-motion-v1",
      storage,
    }),
  );
}

export function readServerReducedMotionFlag(
  userId?: string | null,
  storage?: MinimalStorage | null,
): boolean | undefined {
  const raw = readScopedDevicePreference(SERVER_REDUCED_MOTION_PREFIX, {
    userId,
    storage,
  });
  if (raw === "true") return true;
  if (raw === "false") return false;
  return undefined;
}

/**
 * Synchronize `html[data-noata-motion]` and `html[data-reduced-motion]` as one unified pair
 * so CSS selectors and JS checks never disagree regardless of whether a user configured
 * motion via Settings (`reduced_motion`) or the AI Studio floating `MotionControl`.
 */
export function syncMotionDomAttributes(
  options: {
    mode?: MotionPreferenceMode;
    serverReducedMotion?: boolean;
    root?: HTMLElement | null;
  } = {},
): void {
  const root =
    options.root ?? (typeof document !== "undefined" ? document.documentElement : null);
  if (!root) return;

  const mode = options.mode ?? "system";
  if (mode === "off") {
    root.dataset.noataMotion = "off";
    root.dataset.reducedMotion = "true";
    return;
  }

  if (mode === "reduce" || (mode === "system" && options.serverReducedMotion === true)) {
    root.dataset.noataMotion = "reduce";
    root.dataset.reducedMotion = "true";
    return;
  }

  if (mode === "full") {
    root.dataset.noataMotion = "full";
    root.dataset.reducedMotion = options.serverReducedMotion === true ? "true" : "false";
    return;
  }

  root.removeAttribute("data-noata-motion");
  if (typeof options.serverReducedMotion === "boolean") {
    root.dataset.reducedMotion = options.serverReducedMotion ? "true" : "false";
  } else {
    root.removeAttribute("data-reduced-motion");
  }
}

/**
 * Persist and immediately apply reduced-motion state across both DOM attributes.
 */
export function applyAndPersistMotionPreference(
  mode: MotionPreferenceMode,
  options: {
    userId?: string | null;
    serverReducedMotion?: boolean;
    storage?: MinimalStorage | null;
    root?: HTMLElement | null;
  } = {},
): void {
  const normalized = safeMotionMode(mode);
  const store = resolveStorage(options.storage);
  writeScopedDevicePreference(MOTION_PREF_PREFIX, normalized, {
    userId: options.userId,
    storage: store,
  });
  if (typeof options.serverReducedMotion === "boolean") {
    writeScopedDevicePreference(
      SERVER_REDUCED_MOTION_PREFIX,
      options.serverReducedMotion ? "true" : "false",
      { userId: options.userId, storage: store },
    );
  }
  syncMotionDomAttributes({
    mode: normalized,
    serverReducedMotion: options.serverReducedMotion,
    root: options.root,
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MOTION_PREFERENCE_EVENT));
  }
}

/**
 * Unified runtime check honoring system reduced-motion as well as both Noäta DOM flags.
 */
export function isReducedMotionActive(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const root = document.documentElement;
  if (root.dataset.reducedMotion === "true") return true;
  if (root.dataset.noataMotion === "reduce" || root.dataset.noataMotion === "off") {
    return true;
  }
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

/**
 * Purge legacy unscoped keys and any account-scoped preference keys that do not match
 * `activeUserId`. When signed out (`null`), only `"guest"` keys survive (never prior user keys).
 */
export function purgeForeignOrSignedOutDevicePreferences(
  activeUserId: string | null,
  storage?: MinimalStorage | null,
): number {
  const store = resolveStorage(storage);
  if (!store) return 0;

  const keepScope = normalizeAccountScope(activeUserId);
  const toDelete: string[] = [];

  for (let i = 0; i < store.length; i += 1) {
    const key = store.key(i);
    if (!key) continue;

    if ((LEGACY_DEVICE_PREFERENCE_KEYS as readonly string[]).includes(key)) {
      toDelete.push(key);
      continue;
    }

    for (const prefix of SCOPED_PREFIXES) {
      if (key.startsWith(prefix)) {
        const suffix = key.slice(prefix.length);
        if (suffix !== keepScope) {
          toDelete.push(key);
        }
        break;
      }
    }
  }

  for (const key of toDelete) {
    try {
      store.removeItem(key);
    } catch {
      /* Ignore storage removal errors */
    }
  }

  setActiveAccountScope(activeUserId, store);
  return toDelete.length;
}
