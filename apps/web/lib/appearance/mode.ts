/** One source of truth for the selected appearance.
 * Midnight is an intentional always-dark world.
 * Custom designs created by AI may also be dark-only or light-only.
 * All other palettes respect light/dark/system; switching back restores the user's prior preference.
 */
export type AppearanceMode = "light" | "dark" | "system";
export type PaletteModeConstraint = "both" | "dark-only" | "light-only";

export function getPaletteModeConstraint(
  palette: string | null | undefined,
  customModeConstraint?: PaletteModeConstraint | null
): PaletteModeConstraint {
  if (palette === "midnight") return "dark-only";
  if (palette === "custom" && customModeConstraint) return customModeConstraint;
  return "both";
}

export function isThemeModeAllowed(
  mode: AppearanceMode,
  palette: string | null | undefined,
  customModeConstraint?: PaletteModeConstraint | null
): boolean {
  const constraint = getPaletteModeConstraint(palette, customModeConstraint);
  if (constraint === "dark-only") {
    // Midnight and dark-only designs strictly lock to dark mode
    return mode === "dark";
  }
  if (constraint === "light-only") {
    // Light-only designs strictly lock to light mode
    return mode === "light";
  }
  return true;
}

export function resolveAppearance(
  mode: AppearanceMode,
  palette: string | null | undefined,
  systemDark: boolean,
  customModeConstraint?: PaletteModeConstraint | null
): "light" | "dark" {
  const constraint = getPaletteModeConstraint(palette, customModeConstraint);
  if (constraint === "dark-only") return "dark";
  if (constraint === "light-only") return "light";
  if (mode === "system") return systemDark ? "dark" : "light";
  return mode;
}

export function safeAppearance(value: unknown): AppearanceMode {
  return value === "light" || value === "dark" ? value : "system";
}

export function getActiveModeConstraint(): PaletteModeConstraint {
  if (typeof document === "undefined") return "both";
  const palette = document.documentElement.dataset.palette;
  if (palette === "midnight") return "dark-only";
  const custom = document.documentElement.dataset.modeConstraint;
  if (custom === "dark-only" || custom === "light-only") return custom;
  return "both";
}
