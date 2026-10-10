/** One source of truth for the selected appearance.
 * Midnight is an intentional always-dark world. All other palettes respect
 * light/dark/system; switching back restores the user's prior preference.
 */
export type AppearanceMode = "light" | "dark" | "system";
export function resolveAppearance(mode: AppearanceMode, palette: string | null | undefined, systemDark: boolean): "light" | "dark" {
  if (palette === "midnight") return "dark";
  if (mode === "system") return systemDark ? "dark" : "light";
  return mode;
}
export function safeAppearance(value: unknown): AppearanceMode {
  return value === "light" || value === "dark" ? value : "system";
}
