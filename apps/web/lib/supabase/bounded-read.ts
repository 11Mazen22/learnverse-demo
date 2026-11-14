/** Races a session or profile lookup against a bounded timeout so stalled clients fail closed. */
export async function boundedRead<T>(
  work: PromiseLike<T>,
  milliseconds = 10000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(work),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(Error("Session read timed out")),
          milliseconds,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
