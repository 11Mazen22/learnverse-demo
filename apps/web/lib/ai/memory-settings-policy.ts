/** Temporary chats must not read, display, export or mutate persistent memories. */
export function canReadSavedMemory(temporary: boolean): boolean {
  return temporary === false;
}

export function canMutateSavedMemory(temporary: boolean): boolean {
  return canReadSavedMemory(temporary);
}

/** Defensive render guard: never surface rows belonging to another active owner. */
export function memoryRowsForOwner<T extends {user_id:string}>(owner:string|null,rows:readonly T[]):T[] {
  return owner ? rows.filter(row=>row.user_id===owner) : [];
}
