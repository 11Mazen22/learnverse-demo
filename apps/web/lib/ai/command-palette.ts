import { normalizeStaffSearchText } from "../dashboard/staff-search.ts";

/**
 * Pure decision logic for the Aura command palette (Noäta AI launcher).
 * The component only renders; matching, ordering and selection math live here
 * so they can be exercised without a DOM and stay deterministic.
 */

export type PaletteLocale = "ar" | "en";

export type PaletteGroup = "quick" | "workspace" | "conversations";

export type PaletteCommand = {
  id: string;
  group: PaletteGroup;
  labelAr: string;
  labelEn: string;
  hintAr?: string;
  hintEn?: string;
  /** Extra folded search terms beyond the label, e.g. alternate spellings. */
  keywords?: string;
  /** Literal keyboard string shown verbatim (never translated). */
  shortcut?: string;
  /** Disabled commands stay visible but cannot run. */
  disabled?: boolean;
};

export const PALETTE_MAX_RESULTS = 30;

export const PALETTE_QUERY_MAX_LENGTH = 120;

/** Conversations promoted into the palette; the history search covers the rest. */
export const PALETTE_CONVERSATION_LIMIT = 12;

const GROUP_ORDER: Record<PaletteGroup, number> = {
  quick: 0,
  workspace: 1,
  conversations: 2,
};

export function groupOrder(group: PaletteGroup): number {
  return GROUP_ORDER[group] ?? 9;
}

/** Shared Arabic/Latin text folding rules with one hard length bound. */
export function normalizePaletteQuery(value: string): string {
  return normalizeStaffSearchText(value).slice(0, PALETTE_QUERY_MAX_LENGTH);
}

function commandHaystack(command: PaletteCommand): string {
  return normalizeStaffSearchText(
    [command.labelAr, command.labelEn, command.hintAr, command.hintEn, command.keywords]
      .filter((field): field is string => typeof field === "string" && field.length > 0)
      .join(" "),
  );
}

function commandLabelHaystack(command: PaletteCommand, locale: PaletteLocale): string {
  return normalizeStaffSearchText(locale === "ar" ? command.labelAr : command.labelEn);
}

/**
 * Filter and rank palette commands. Every query term must appear in the folded
 * label/hint/keyword text (any order). Commands whose localized label starts
 * with the query rank first, then those containing it, then keyword-only hits;
 * ties keep the authored order. Empty and overlong queries stay safe.
 */
export function matchPaletteCommands(
  query: string,
  commands: readonly PaletteCommand[],
  locale: PaletteLocale,
): PaletteCommand[] {
  const candidates = commands.filter((command) => !command.disabled);
  const needle = normalizePaletteQuery(query);
  if (!needle) return candidates;

  const terms = needle.split(" ").filter(Boolean);
  const ranked: Array<{ command: PaletteCommand; index: number; score: number }> = [];
  candidates.forEach((command, index) => {
    const haystack = commandHaystack(command);
    if (!terms.every((term) => haystack.includes(term))) return;
    const labelHay = commandLabelHaystack(command, locale);
    const score = labelHay.startsWith(needle) ? 0 : labelHay.includes(needle) ? 1 : 2;
    ranked.push({ command, index, score });
  });

  return ranked
    .sort(
      (first, second) =>
        first.score - second.score ||
        groupOrder(first.command.group) - groupOrder(second.command.group) ||
        first.index - second.index,
    )
    .slice(0, PALETTE_MAX_RESULTS)
    .map((entry) => entry.command);
}

/** Circular selection movement; a non-positive list length resolves to 0. */
export function movePaletteIndex(index: number, delta: number, count: number): number {
  if (count <= 0) return 0;
  // Double modulo keeps every remainder a non-negative integer, including the
  // `-0` that `(1 - 4) % 3` produces in JavaScript.
  return (((index + delta) % count) + count) % count;
}

/** Stable option DOM ids for aria-activedescendant wiring. */
export function paletteOptionId(index: number): string {
  return `nk-palette-option-${Math.max(0, Math.floor(index))}`;
}
