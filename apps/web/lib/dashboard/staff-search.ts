export type StaffSearchLocale = "ar" | "en";

/**
 * Case-insensitive, locale-aware search shared by the admin and teacher workspaces.
 * Returns the original records unchanged; only the search representation is normalized.
 */
export function matchesStaffSearch(
  query: string,
  fields: readonly (string | null | undefined)[],
  locale: StaffSearchLocale,
): boolean {
  const needle = query.trim().toLocaleLowerCase(locale);
  if (!needle) return true;
  const haystack = fields
    .filter((field): field is string => typeof field === "string" && field.length > 0)
    .join(" ")
    .toLocaleLowerCase(locale);
  return haystack.includes(needle);
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
