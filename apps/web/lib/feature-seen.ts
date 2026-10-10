/** Bump the version only when the destination has genuinely new content. */
export const AI_INTRO_VERSION = "1";

export function featureSeenKey(feature: string, version: string, userId: string | null) {
  return `noata:seen:${userId ?? "guest"}:${feature}:${version}`;
}

const sessionSeen = new Set<string>();

export function hasSeenFeature(feature: string, version: string, userId: string | null) {
  const key = featureSeenKey(feature, version, userId);
  if (sessionSeen.has(key)) return true;
  try { return localStorage.getItem(key) === "1"; }
  catch { return false; }
}

export function markFeatureSeen(feature: string, version: string, userId: string | null) {
  const key = featureSeenKey(feature, version, userId);
  sessionSeen.add(key);
  try { localStorage.setItem(key, "1"); }
  catch { /* Keep the view state for this browser session. */ }
  window.dispatchEvent(new CustomEvent("noata-feature-seen", { detail: key }));
}
