export type SuggestionScopeInput = {
  owner: string | null;
  locale: "ar" | "en";
  temporary: boolean;
  personalized: boolean;
  signature: string;
  epoch?: number;
};

export type ScopedSuggestions<T> = {
  scope: string;
  items: readonly T[];
};

/** Canonical context key used to decide whether suggestion state is still displayable. */
export function suggestionScopeKey(input: SuggestionScopeInput): string {
  return JSON.stringify([
    input.owner ?? "guest",
    input.locale,
    input.temporary,
    input.personalized,
    input.signature,
    input.epoch ?? null,
  ]);
}

/**
 * A response fetched for an earlier account, locale, mode, or conversation
 * must not be rendered for the new context while effects are still pending.
 */
export function scopedSuggestions<T>(
  state: ScopedSuggestions<T> | null,
  currentScope: string,
  fallback: readonly T[],
): T[] {
  return state?.scope === currentScope ? [...state.items] : [...fallback];
}
