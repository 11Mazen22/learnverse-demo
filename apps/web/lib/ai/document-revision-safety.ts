export type DocumentRevisionMode = "preview" | "edit" | "compare" | "targeted" | "pages" | "annotate";

/** True when rebuilding a revision depends on text extracted from the source. */
export function revisionRequiresExtractedDraft(mode: DocumentRevisionMode): boolean {
  return mode !== "pages" && mode !== "targeted" && mode !== "annotate";
}

/** Partial text must be acknowledged before a reconstructed revision can be created. */
export function requiresPartialExtractionAcknowledgement(
  partial: boolean,
  mode: DocumentRevisionMode,
): boolean {
  return partial && revisionRequiresExtractedDraft(mode);
}

export function canCreateExtractedRevision(
  partial: boolean,
  acknowledged: boolean,
  mode: DocumentRevisionMode,
): boolean {
  return !requiresPartialExtractionAcknowledgement(partial, mode) || acknowledged;
}
