export const REQUESTED_RECITERS = [
  { id: "minshawi", providerId: 112, name: "محمد صديق المنشاوي", shortName: "المنشاوي", initials: "م ص" },
  { id: "husary", providerId: 118, name: "محمود خليل الحصري", shortName: "الحصري", initials: "م خ" },
  { id: "mustafa", providerId: 125, name: "مصطفى إسماعيل", shortName: "مصطفى إسماعيل", initials: "م إ" },
  { id: "naina", providerId: 9, name: "أحمد نعينع", shortName: "أحمد نعينع", initials: "أ ن" },
  { id: "saleh", providerId: 286, name: "حسن صالح", shortName: "حسن صالح", initials: "ح ص" },
  { id: "dosari", providerId: 92, name: "ياسر الدوسري", shortName: "ياسر الدوسري", initials: "ي د" },
  { id: "jaber", providerId: 76, name: "علي جابر", shortName: "علي جابر", initials: "ع ج" },
  { id: "sudais", providerId: 54, name: "عبدالرحمن السديس", shortName: "السديس", initials: "ع س" },
  { id: "maher", providerId: 102, name: "ماهر المعيقلي", shortName: "ماهر المعيقلي", initials: "م م" },
] as const;
export type ReciterId = typeof REQUESTED_RECITERS[number]["id"];
export type Reciter = {
  id: ReciterId;
  name: string;
  shortName: string;
  initials: string;
  server: string | null;
  surahs: number[];
  style: string;
};
export function safeRecitationServer(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.port || url.username || url.password || url.search || url.hash || !/^(cdn|server\d+)\.mp3quran\.net$/.test(url.hostname) || !/^\/[a-zA-Z0-9/_-]*\/$/.test(url.pathname)) return null;
    return url.href;
  } catch { return null; }
}
export function reciterCatalogue(value: unknown): Reciter[] {
  if (!value || typeof value !== "object" || !Array.isArray((value as { reciters?: unknown }).reciters)) throw Error("Invalid reciter catalogue");
  const rows = (value as { reciters: Record<string, unknown>[] }).reciters;
  return REQUESTED_RECITERS.map(({ providerId, ...identity }) => {
    const row = rows.find(item => item && Number(item.id) === providerId);
    const recordings = Array.isArray(row?.moshaf) ? row.moshaf : [];
    const recording = recordings.find(item => item && typeof item === "object" && Number(item.moshaf_type) === 11 && Number(item.rewaya_id) === 1);
    const server = safeRecitationServer(recording?.server);
    const surahs: number[] = typeof recording?.surah_list === "string" ? recording.surah_list.split(",").map(Number) : [];
    const valid = surahs.length > 0 && surahs.every(n => Number.isInteger(n) && n >= 1 && n <= 114) && new Set(surahs).size === surahs.length;
    return { ...identity, server: server && valid ? server : null, surahs: server && valid ? surahs : [], style: "حفص عن عاصم · مرتل" };
  });
}
export function chapterRecitation(reciter: Reciter | undefined, chapter: number): string | null {
  if (!Number.isInteger(chapter) || !reciter?.surahs.includes(chapter)) return null;
  const server = safeRecitationServer(reciter.server);
  return server ? server + String(chapter).padStart(3, "0") + ".mp3" : null;
}
export function mediaTime(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}
export function normalizeQuranQuery(value: string): string {
  return value.normalize("NFD").replace(/[\u0610-\u061a\u0640\u064b-\u065f\u0670\u06d6-\u06ed]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 0x6f0)).toLowerCase();
}
export type Chapter = { number: number; name: string; englishName: string; numberOfAyahs: number; revelationType?: string };
export type Verse = { number: number; globalNumber: number; text: string; audio: string | null };
export type QuranSource = { name: string; edition: string; reference: string; terms?: string; audioEdition?: string | null };
export type ChapterResponse = { surah: Chapter; verses: Verse[]; source: QuranSource };
export async function quranFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw Error("Quran source unavailable");
  return response.json();
}
