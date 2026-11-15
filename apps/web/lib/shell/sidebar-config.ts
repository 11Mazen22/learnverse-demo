/**
 * Canonical sizing, keyboard-step, and breakpoint constants for the Noäta application sidebar.
 * Consumed synchronously by `<Sidebar />`, CSS layout tokens, and pre-hydration storage helpers.
 */

export const SIDEBAR_DEFAULT_WIDTH = 288;
export const SIDEBAR_MIN_WIDTH = 248;
export const SIDEBAR_MAX_WIDTH = 420;
export const SIDEBAR_COLLAPSED_WIDTH = 72;
export const SIDEBAR_KEYBOARD_STEP = 16;
export const SIDEBAR_KEYBOARD_SHIFT_STEP = 48;

/**
 * Clamp any candidate sidebar width into the supported desktop resize band (`248..420` px),
 * rounding fractional values to whole CSS pixels and falling back to `288` px for non-numeric input.
 */
export function clampSidebarWidth(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return SIDEBAR_DEFAULT_WIDTH;
  }
  const rounded = Math.round(raw);
  if (rounded < SIDEBAR_MIN_WIDTH) return SIDEBAR_MIN_WIDTH;
  if (rounded > SIDEBAR_MAX_WIDTH) return SIDEBAR_MAX_WIDTH;
  return rounded;
}
