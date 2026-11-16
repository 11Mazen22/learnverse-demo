/**
 * Request-scoped locale resolution for API routes.
 *
 * Mutating and export endpoints must answer in the caller's language instead of
 * forcing Arabic onto English requests. The UI sends its active locale through
 * `Accept-Language`, so API errors follow the same switch as the interface.
 */
export type RequestLocale = "ar" | "en";

export function requestLocale(headers: Headers): RequestLocale {
  const accept = headers.get("accept-language") ?? "";
  const primary = accept.split(",")[0]?.trim().toLowerCase() ?? "";
  return primary.startsWith("en") ? "en" : "ar";
}

/** Picks the message for the request locale. */
export function localizedMessage(locale: RequestLocale, arabic: string, english: string): string {
  return locale === "en" ? english : arabic;
}
