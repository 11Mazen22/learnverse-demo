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
