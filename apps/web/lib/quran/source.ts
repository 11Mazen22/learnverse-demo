type RawVerse = { numberInSurah?: unknown; number?: unknown; text?: unknown };
/** Validate source structure and order; these checks do not invent or generate Quran text. */
export function canonicalSurah(value: unknown, expected: number) {
  if (!value || typeof value !== "object") throw Error("Missing Quran source");
  const data = value as Record<string, unknown>,
    total = Number(data.numberOfAyahs);
  if (
    Number(data.number) !== expected ||
    !Number.isInteger(total) ||
    total < 1 ||
    total > 286 ||
    !Array.isArray(data.ayahs) ||
    data.ayahs.length !== total
  )
    throw Error("Incomplete Quran source");
  let previousGlobal = 0;
  return (data.ayahs as RawVerse[]).map((verse, index) => {
    const number = Number(verse.numberInSurah),
      globalNumber = Number(verse.number);
    if (
      number !== index + 1 ||
      !Number.isInteger(globalNumber) ||
      globalNumber < 1 ||
      globalNumber > 6236 ||
      (previousGlobal && globalNumber !== previousGlobal + 1) ||
      typeof verse.text !== "string" ||
      !verse.text.trim() ||
      verse.text.length > 10000
    )
      throw Error("Invalid Quran verse sequence");
    previousGlobal = globalNumber;
    return { number, globalNumber, text: verse.text };
  });
}
export function canonicalIndex(value: unknown) {
  if (!Array.isArray(value) || value.length !== 114)
    throw Error("Incomplete Quran index");
  return value.map((surah, index) => {
    if (
      !surah ||
      Number(surah.number) !== index + 1 ||
      typeof surah.name !== "string" ||
      !surah.name.trim() ||
      !Number.isInteger(Number(surah.numberOfAyahs)) ||
      Number(surah.numberOfAyahs) < 1 ||
      Number(surah.numberOfAyahs) > 286
    )
      throw Error("Invalid Quran index sequence");
    return {
      number: Number(surah.number),
      name: surah.name,
      englishName: String(surah.englishName ?? ""),
      numberOfAyahs: Number(surah.numberOfAyahs),
      revelationType: String(surah.revelationType ?? ""),
    };
  });
}
export function recitationLink(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      [
        "cdn.islamic.network",
        "api.alquran.cloud",
        "alquran.api.islamic.network",
      ].includes(url.hostname)
      ? url.href
      : null;
  } catch {
    return null;
  }
}
