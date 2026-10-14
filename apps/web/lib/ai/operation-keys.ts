/** Reuse the same transaction key while the mounted workspace has an unknown result. */
export function createOperationKeys(makeKey = () => crypto.randomUUID()) {
  const keys = new Map<string, string>();
  return {
    get(identity: string) {
      let key = keys.get(identity);
      if (!key) {
        key = makeKey();
        keys.set(identity, key);
      }
      return key;
    },
    confirmed(identity: string) {
      keys.delete(identity);
    },
    clear() {
      keys.clear();
    },
  };
}
