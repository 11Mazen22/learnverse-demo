export type StaffSearchLocale = "ar" | "en";

const ARABIC_DIGITS = /[\u0660-\u0669]/gu;
const EXTENDED_ARABIC_DIGITS = /[\u06F0-\u06F9]/gu;

/**
 * Normalize user-entered search text without mutating the records being searched.
 * Arabic users often type the same word with or without diacritics, hamza forms,
 * ta marbuta, tatweel or Arabic-Indic digits; all of those should find the same row.
 * Latin accents and zero-width/bidi control characters are folded for the same reason.
 */
export function normalizeStaffSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/[\u0640\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/gu, "")
    .replace(/[\u0622\u0623\u0625\u0671]/gu, "\u0627")
    .replace(/\u0624/gu, "\u0648")
    .replace(/\u0626/gu, "\u064A")
    .replace(/\u0649/gu, "\u064A")
    .replace(/\u0629/gu, "\u0647")
    .replace(/\u06A9/gu, "\u0643")
    .replace(/\u06CC/gu, "\u064A")
    .replace(ARABIC_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(EXTENDED_ARABIC_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .trim();
}

/**
 * Case-insensitive, locale-aware search shared by the admin and teacher workspaces.
 * Every whitespace-separated term must appear in the row, in any order, so users can
 * search by student and assignment without remembering the column order. The original
 * records are returned unchanged; only the search representation is normalized.
 */
export function matchesStaffSearch(
  query: string,
  fields: readonly (string | null | undefined)[],
  locale: StaffSearchLocale,
): boolean {
  void locale;
  const needle = normalizeStaffSearchText(query);
  if (!needle) return true;
  const haystack = normalizeStaffSearchText(
    fields
      .filter((field): field is string => typeof field === "string" && field.length > 0)
      .join(" "),
  );
  return needle.split(" ").every((term) => haystack.includes(term));
}

export function filterStaffSearch<T>(
  items: readonly T[],
  query: string,
  locale: StaffSearchLocale,
  getFields: (item: T) => readonly (string | null | undefined)[],
): T[] {
  return items.filter((item) => matchesStaffSearch(query, getFields(item), locale));
}

export interface StaffPagination<T> {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
  start: number;
  end: number;
}

/** Clamp page and page size so stale filters never produce an out-of-range screen. */
export function paginateStaffItems<T>(
  items: readonly T[],
  requestedPage: number,
  requestedPageSize = 20,
): StaffPagination<T> {
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.max(1, Math.floor(requestedPageSize))
    : 20;
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const normalizedPage = Number.isFinite(requestedPage)
    ? Math.min(pageCount - 1, Math.max(0, Math.floor(requestedPage)))
    : 0;
  const start = total === 0 ? 0 : normalizedPage * pageSize + 1;
  const end = Math.min(total, (normalizedPage + 1) * pageSize);
  return {
    items: items.slice(normalizedPage * pageSize, (normalizedPage + 1) * pageSize),
    page: normalizedPage,
    pageCount,
    total,
    start,
    end,
  };
}

export interface StudentProgressEntry {
  completed_at: string | null;
  best_score: number;
  updated_at: string;
}

export interface StudentProgressSummary {
  trackedLessons: number;
  completedLessons: number;
  averageBestScore: number | null;
  lastUpdated: string | null;
}

export function summarizeStudentProgress(
  entries: readonly StudentProgressEntry[],
): StudentProgressSummary {
  const validScores = entries
    .map((entry) => entry.best_score)
    .filter((score) => Number.isFinite(score));
  const lastUpdated = entries.reduce<string | null>((latest, entry) => {
    if (!entry.updated_at || !Number.isFinite(Date.parse(entry.updated_at))) return latest;
    return latest === null || Date.parse(entry.updated_at) > Date.parse(latest)
      ? entry.updated_at
      : latest;
  }, null);
  return {
    trackedLessons: entries.length,
    completedLessons: entries.filter((entry) => entry.completed_at !== null).length,
    averageBestScore: validScores.length
      ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length)
      : null,
    lastUpdated,
  };
}
