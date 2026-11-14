export type MatchingMode = "strict" | "normalized" | "fuzzy";

export type MatchOptions = {
  mode?: MatchingMode;
  /** Opt-in Alef unification (أ / إ / آ -> ا). Defaults to false to stay exact. */
  normalizeAlef?: boolean;
  /** Explicit accepted synonyms or alternative valid phrasings. */
  acceptedAnswers?: string[];
  /** Similarity ratio threshold in [0.5, 0.99] when mode === "fuzzy". */
  fuzzyThreshold?: number;
};

export type MatchResult = {
  matched: boolean;
  status: "exact" | "close" | "incorrect";
  matchedCandidate: string | null;
  similarity: number;
  requiresConfirmation: boolean;
};

const ARABIC_TASHKEEL = /[\u064B-\u065F\u0670]/g;
const ARABIC_TATWEEL = /\u0640/g;
const ARABIC_ALEF = /[أإآٱ]/g;

/**
 * Normalizes a string according to `mode`.
 *
 * Strictly preserves Arabic letter distinctions (`ة` vs `ه` is NEVER silently
 * merged, and `أ/إ/آ` is only normalized when `normalizeAlef: true` is opted in).
 */
export function normalizeForMatching(
  value: string,
  options: Pick<MatchOptions, "mode" | "normalizeAlef"> = {},
): string {
  const mode = options.mode ?? "normalized";
  let text = String(value ?? "").normalize("NFKC").trim();
  if (mode === "strict") {
    return text.replace(/\s+/g, " ");
  }

  // normalized and fuzzy modes: strip tashkeel & tatweel, normalize whitespace & case
  text = text
    .replace(ARABIC_TASHKEEL, "")
    .replace(ARABIC_TATWEEL, "")
    .replace(/\s+/g, " ")
    .toLowerCase();

  if (options.normalizeAlef) {
    text = text.replace(ARABIC_ALEF, "ا");
  }

  return text;
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const chA = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = chA === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

export function computeSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(a, b);
  return Number(Math.max(0, 1 - dist / maxLen).toFixed(4));
}

export function matchAnswer(
  submitted: string,
  expectedPrimary: string,
  options: MatchOptions = {},
): MatchResult {
  const mode = options.mode ?? "normalized";
  const threshold = Math.min(0.99, Math.max(0.5, options.fuzzyThreshold ?? 0.8));
  const candidates = [expectedPrimary, ...(options.acceptedAnswers ?? [])]
    .map((c) => String(c ?? "").trim())
    .filter((c) => c.length > 0);

  const normalizedSubmitted = normalizeForMatching(submitted, options);
  if (!normalizedSubmitted || candidates.length === 0) {
    return {
      matched: false,
      status: "incorrect",
      matchedCandidate: null,
      similarity: 0,
      requiresConfirmation: false,
    };
  }

  let bestCandidate: string | null = null;
  let bestSimilarity = 0;

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeForMatching(candidate, options);
    if (normalizedSubmitted === normalizedCandidate) {
      return {
        matched: true,
        status: "exact",
        matchedCandidate: candidate,
        similarity: 1,
        requiresConfirmation: false,
      };
    }

    const sim = computeSimilarity(normalizedSubmitted, normalizedCandidate);
    if (sim > bestSimilarity) {
      bestSimilarity = sim;
      bestCandidate = candidate;
    }
  }

  // Fuzzy mode emits an explicit close-match warning requiring verification
  // rather than silently grading a typo or altered Arabic orthography as exact.
  if (mode === "fuzzy" && bestSimilarity >= threshold) {
    return {
      matched: false,
      status: "close",
      matchedCandidate: bestCandidate,
      similarity: bestSimilarity,
      requiresConfirmation: true,
    };
  }

  return {
    matched: false,
    status: "incorrect",
    matchedCandidate: bestCandidate,
    similarity: bestSimilarity,
    requiresConfirmation: false,
  };
}
