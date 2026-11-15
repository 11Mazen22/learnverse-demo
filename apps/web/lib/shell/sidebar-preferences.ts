import {
  parseDashboardPreferences,
  serializeDashboardPreferences,
} from "../dashboard/preferences.ts";
import {
  clampSidebarWidth,
  SIDEBAR_DEFAULT_WIDTH,
} from "./sidebar-config.ts";

export const SHELL_PREFS_PREFIX = "noata:shell-prefs:";
export const LEGACY_SIDEBAR_COLLAPSED_KEY = "noata_sidebar_collapsed";
export const ACTIVE_ACCOUNT_SCOPE_KEY = "noata:active-account-scope";
export const SIDEBAR_PREFS_EVENT = "noata:shell-prefs-change";

const MAX_GROUP_ENTRIES = 12;
const SAFE_GROUP_KEY = /^[a-z0-9_-]{1,32}$/;

export interface ShellSidebarPreferences {
  version: 1;
  widthPx: number;
  collapsed: boolean;
  openGroups: Record<string, boolean>;
}

export const DEFAULT_SHELL_SIDEBAR_PREFERENCES: ShellSidebarPreferences = {
  version: 1,
  widthPx: SIDEBAR_DEFAULT_WIDTH,
  collapsed: false,
  openGroups: {},
};

/**
 * Resolve the account-isolated localStorage key for shell sidebar preferences.
 */
export function scopedShellPrefsKey(userId: string | null): string {
  const scope = userId && userId.trim().length > 0 ? userId.trim() : "guest";
  return `${SHELL_PREFS_PREFIX}${scope}`;
}

/**
 * Sanitize accordion group-state map so only bounded boolean entries survive storage corruption.
 */
export function normalizeOpenGroups(raw: unknown): Record<string, boolean> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const out: Record<string, boolean> = {};
  let count = 0;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (count >= MAX_GROUP_ENTRIES) break;
    if (SAFE_GROUP_KEY.test(key) && typeof value === "boolean") {
      out[key] = value;
      count += 1;
    }
  }
  return out;
}

/**
 * Normalize an arbitrary untrusted payload (localStorage JSON or Supabase JSONB `.shell`)
 * into a safe, clamped `ShellSidebarPreferences` record.
 */
export function parseShellPreferences(raw: unknown): ShellSidebarPreferences {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_SHELL_SIDEBAR_PREFERENCES, openGroups: {} };
  }
  const obj = raw as Record<string, unknown>;
  const widthCandidate =
    typeof obj.widthPx === "number"
      ? obj.widthPx
      : typeof obj.width === "number"
        ? obj.width
        : SIDEBAR_DEFAULT_WIDTH;

  return {
    version: 1,
    widthPx: clampSidebarWidth(widthCandidate),
    collapsed: obj.collapsed === true,
    openGroups: normalizeOpenGroups(obj.openGroups),
  };
}

/**
 * Serialize shell sidebar preferences cleanly for storage and Supabase JSONB merging.
 */
export function serializeShellPreferences(
  prefs: ShellSidebarPreferences,
): ShellSidebarPreferences {
  const normalized = parseShellPreferences(prefs);
  return {
    version: 1,
    widthPx: normalized.widthPx,
    collapsed: normalized.collapsed,
    openGroups: { ...normalized.openGroups },
  };
}

/**
 * Extract normalized shell preferences stored inside `user_settings.dashboard_preferences.shell`.
 * Returns `null` when the payload has never stored a `.shell` block.
 */
export function extractShellPreferencesFromDashboard(
  rawDashboardPrefs: unknown,
): ShellSidebarPreferences | null {
  if (!rawDashboardPrefs || typeof rawDashboardPrefs !== "object" || Array.isArray(rawDashboardPrefs)) {
    return null;
  }
  const record = rawDashboardPrefs as Record<string, unknown>;
  if (!record.shell || typeof record.shell !== "object" || Array.isArray(record.shell)) {
    return null;
  }
  return parseShellPreferences(record.shell);
}

/**
 * Merge shell sidebar preferences into `user_settings.dashboard_preferences` without clobbering
 * existing dashboard widget order, hidden widgets, goals, or future metadata keys.
 */
export function mergeShellIntoDashboardPreferences(
  existingDashboardPrefs: unknown,
  shellPrefs: ShellSidebarPreferences,
): Record<string, unknown> {
  const baseObj =
    existingDashboardPrefs &&
    typeof existingDashboardPrefs === "object" &&
    !Array.isArray(existingDashboardPrefs)
      ? (existingDashboardPrefs as Record<string, unknown>)
      : serializeDashboardPreferences(parseDashboardPreferences(null));

  const normalizedDash = serializeDashboardPreferences(
    parseDashboardPreferences(baseObj),
  );

  return {
    ...baseObj,
    ...normalizedDash,
    shell: serializeShellPreferences(shellPrefs),
  };
}

/**
 * Preserve any `.shell` configuration (and unrelated keys) when dashboard customizer
 * or Settings writes `dashboard_preferences`.
 */
export function mergeDashboardIntoExistingPreferences(
  existingDashboardPrefs: unknown,
  nextDashboardSerialized: Record<string, unknown>,
): Record<string, unknown> {
  if (
    !existingDashboardPrefs ||
    typeof existingDashboardPrefs !== "object" ||
    Array.isArray(existingDashboardPrefs)
  ) {
    return { ...nextDashboardSerialized };
  }
  const existingObj = existingDashboardPrefs as Record<string, unknown>;
  const preservedShell = extractShellPreferencesFromDashboard(existingObj);
  if (!preservedShell) {
    return { ...existingObj, ...nextDashboardSerialized };
  }
  return {
    ...existingObj,
    ...nextDashboardSerialized,
    shell: preservedShell,
  };
}

/**
 * Read account-scoped shell preferences from Web Storage safely.
 */
export function readScopedShellPreferences(
  storage: Pick<Storage, "getItem"> | null | undefined,
  userId: string | null,
): ShellSidebarPreferences | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(scopedShellPrefsKey(userId));
    if (!raw) return null;
    return parseShellPreferences(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Write account-scoped shell preferences to Web Storage safely.
 */
export function writeScopedShellPreferences(
  storage: Pick<Storage, "setItem"> | null | undefined,
  userId: string | null,
  prefs: ShellSidebarPreferences,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(
      scopedShellPrefsKey(userId),
      JSON.stringify(serializeShellPreferences(prefs)),
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove legacy unscoped sidebar keys and any scoped keys that do not belong to `activeUserId`.
 * When `activeUserId` is `null` (signed out), all non-guest scoped keys are purged so a subsequent
 * user or guest cannot inherit a previous account's layout state.
 */
export function purgeForeignOrSignedOutShellPreferences(
  storage: Pick<Storage, "length" | "key" | "removeItem"> | null | undefined,
  activeUserId: string | null,
): number {
  if (!storage) return 0;
  const keepKey = activeUserId ? scopedShellPrefsKey(activeUserId) : scopedShellPrefsKey(null);
  const toDelete: string[] = [];

  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (!key) continue;
    if (key === LEGACY_SIDEBAR_COLLAPSED_KEY) {
      toDelete.push(key);
      continue;
    }
    if (key.startsWith(SHELL_PREFS_PREFIX)) {
      if (key !== keepKey) {
        toDelete.push(key);
      }
    }
  }

  for (const key of toDelete) {
    try {
      storage.removeItem(key);
    } catch {
      /* Ignore storage quota/security errors during cleanup */
    }
  }
  return toDelete.length;
}
