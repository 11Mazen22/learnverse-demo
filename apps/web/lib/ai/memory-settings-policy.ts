/** Persistent memory mutations are disabled while a temporary chat is active. */
export function canMutateSavedMemory(temporary: boolean): boolean {
  return temporary === false;
}
