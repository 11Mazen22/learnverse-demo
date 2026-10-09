import type { ReciterId } from "./reciters";

export const AYAH_RECORDINGS: Record<ReciterId, { folder: string; label: string } | null> = {
  minshawi: { folder: "Minshawy_Murattal_128kbps", label: "المنشاوي · مرتل · 128kbps" },
  husary: { folder: "Husary_128kbps", label: "الحصري · 128kbps" },
  mustafa: { folder: "Mustafa_Ismail_48kbps", label: "مصطفى إسماعيل · أرشيف جزئي · 48kbps" },
  naina: { folder: "Ahmed_Neana_128kbps", label: "أحمد نعينع · 128kbps" },
  saleh: null,
  dosari: { folder: "Yasser_Ad-Dussary_128kbps", label: "ياسر الدوسري · 128kbps" },
  jaber: { folder: "Ali_Jaber_64kbps", label: "علي جابر · 64kbps" },
  sudais: { folder: "Abdurrahmaan_As-Sudais_192kbps", label: "السديس · 192kbps" },
  maher: { folder: "MaherAlMuaiqly128kbps", label: "ماهر المعيقلي · 128kbps" },
};
export type VerseAvailability = { reciter: ReciterId; surah: number; verses: number[]; label: string | null };
export function verseDirectory(reciter: ReciterId): string | null {
  const recording = AYAH_RECORDINGS[reciter];
  return recording ? `https://everyayah.com/data/${recording.folder}/` : null;
}
export function listedRecordings(html: string, reciter: ReciterId): Record<number, number[]> {
  const recording = AYAH_RECORDINGS[reciter];
  if (!recording) return {};
  const prefix = `/data/${recording.folder}/`;
  const results = new Map<number, Set<number>>();
  for (const match of html.matchAll(/href="([^"<>]+)"/g)) {
    if (!match[1].startsWith(prefix)) continue;
    const suffix = match[1].slice(prefix.length);
    if (/^\d{6}\.mp3$/.test(suffix)) {
      const surah = Number(suffix.slice(0, 3)), ayah = Number(suffix.slice(3, 6));
      if (surah < 1 || surah > 114 || ayah < 1 || ayah > 286) continue;
      if (!results.has(surah)) results.set(surah, new Set());
      results.get(surah)!.add(ayah);
    }
  }
  return Object.fromEntries([...results].map(([surah, ayahs]) => [surah, [...ayahs].sort((a, b) => a - b)]));
}
export function listedAyahs(html: string, reciter: ReciterId, surah: number): number[] {
  return listedRecordings(html, reciter)[surah] ?? [];
}
export function verseRecitation(reciter: ReciterId, surah: number, ayah: number, available?: VerseAvailability): string | null {
  if (!Number.isInteger(surah) || surah < 1 || surah > 114 || !Number.isInteger(ayah) || ayah < 1 || ayah > 286) return null;
  if (available?.reciter !== reciter || available.surah !== surah || !available.verses.includes(ayah)) return null;
  const directory = verseDirectory(reciter);
  return directory ? `${directory}${String(surah).padStart(3, "0")}${String(ayah).padStart(3, "0")}.mp3` : null;
}
