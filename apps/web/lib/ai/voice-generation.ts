/**
 * Guards asynchronous voice generation against cross-conversation playback.
 * Every request receives a token; switching chats, closing the player,
 * deleting a message, or unmounting invalidates older tokens.
 */
export function createVoiceGenerationGuard() {
  let current = 0;
  return {
    begin() {
      return ++current;
    },
    invalidate() {
      ++current;
    },
    isCurrent(token: number) {
      return token === current;
    },
  };
}
