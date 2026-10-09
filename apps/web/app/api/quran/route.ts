import { NextRequest, NextResponse } from "next/server";
import {
  canonicalSurah,
  canonicalIndex,
  canonicalCorpus,
  recitationLink,
} from "@/lib/quran/source";
import { reciterCatalogue, REQUESTED_RECITERS, type ReciterId } from "@/lib/quran/reciters";
import { AYAH_RECORDINGS, listedRecordings, verseDirectory } from "@/lib/quran/verse-audio";
import { createVerseIndex, searchVerses } from "@/lib/quran/search";
type RawVerse = {
  numberInSurah?: number;
  number?: number;
  text?: string;
  audio?: string;
};

const ORIGIN = "https://api.alquran.cloud/v1";
async function remote(path: string) {
  const response = await fetch(ORIGIN + path, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(9500),
    cache: path === "/quran/quran-uthmani" ? "no-store" : undefined,
    next: path === "/quran/quran-uthmani" ? undefined : { revalidate: 3600 },
  });
  if (!response.ok)
    throw new Error(
      "Quran source temporarily unavailable (" + response.status + ")",
    );
  const data = await response.json();
  if (data?.code !== 200 || !data.data)
    throw new Error("Quran source returned unexpected data");
  return data.data;
}
const SOURCE = {
  name: "AlQuran Cloud",
  edition: "quran-uthmani",
  reference: "https://alquran.cloud/api",
  terms: "https://alquran.cloud/terms-and-conditions",
  audioEdition: "ar.alafasy",
};
const directories = new Map<ReciterId, { expires: number; result: Promise<Record<number, number[]>> }>();
function recordingDirectory(reciter: ReciterId, url: string) {
  const cached = directories.get(reciter);
  if (cached && cached.expires > Date.now()) return cached.result;
  const result = (async () => {
    // Provider HTML exceeds Next's 2 MB cache limit; retain only the compact filename index.
    const response = await fetch(url, { signal: AbortSignal.timeout(12000), cache: "no-store" });
    if (!response.ok) throw Error("Ayah recording catalogue unavailable");
    const html = await response.text();
    if (!html.includes(`/data/${AYAH_RECORDINGS[reciter]!.folder}/`)) throw Error("Unexpected recording directory");
    return listedRecordings(html, reciter);
  })().catch(error => { directories.delete(reciter); throw error; });
  directories.set(reciter, { expires: Date.now() + 86400_000, result });
  return result;
}
let indexed: Promise<ReturnType<typeof createVerseIndex>> | null = null;
let indexExpires = 0;
async function corpusIndex() {
  if (!indexed || Date.now() > indexExpires) {
    indexExpires = Date.now() + 3600_000;
    indexed = (async () => {
      const [corpus, metadata] = await Promise.all([remote("/quran/quran-uthmani"), remote("/surah")]);
      return createVerseIndex(canonicalCorpus(corpus, metadata));
    })().catch(error => { indexed = null; throw error; });
  }
  return indexed;
}
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  try {
    if (query.has("verseReciter")) {
      const reciter = query.get("verseReciter") as ReciterId;
      const surah = Number(query.get("surah"));
      if (!REQUESTED_RECITERS.some(item => item.id === reciter) || !Number.isInteger(surah) || surah < 1 || surah > 114) return NextResponse.json({ error: "Invalid reciter or Surah" }, { status: 400 });
      const directory = verseDirectory(reciter);
      if (!directory) return NextResponse.json({ reciter, surah, verses: [], label: null });
      const recordings = await recordingDirectory(reciter, directory);
      return NextResponse.json({ reciter, surah, verses: recordings[surah] ?? [], label: AYAH_RECORDINGS[reciter]!.label });
    }
    if (query.get("reciters") === "1") {
      const response = await fetch("https://mp3quran.net/api/v3/reciters?language=ar", {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(9500),
        next: { revalidate: 86400 },
      });
      if (!response.ok) throw Error("Reciter catalogue unavailable");
      return NextResponse.json({ reciters: reciterCatalogue(await response.json()), source: { name: "MP3Quran", reference: "https://mp3quran.net/ar" } });
    }
    if (query.get("list") === "1") {
      const data = await remote("/surah");
      const surahs = canonicalIndex(data);
      return NextResponse.json({ surahs, source: SOURCE });
    }
    const search = query.get("search");
    if (search !== null) {
      const term = search.trim();
      const selected = Number(query.get("selected") ?? 1);
      const within = query.has("within") ? Number(query.get("within")) : undefined;
      if (term.length < 1 || term.length > 80 || !Number.isInteger(selected) || selected < 1 || selected > 114 || (within !== undefined && (!Number.isInteger(within) || within < 1 || within > 114))) return NextResponse.json({ error: "عبارة أو مرجع بحث غير صالح." }, { status: 400 });
      const index = await corpusIndex();
      return NextResponse.json({ ...searchVerses(index, term, selected, within), source: { ...SOURCE, audioEdition: "none" } });
    }
    const surah = Number(query.get("surah") ?? 1);
    if (!Number.isInteger(surah) || surah < 1 || surah > 114)
      return NextResponse.json(
        { error: "رقم السورة يجب أن يكون بين ١ و١١٤." },
        { status: 400 },
      );
    const text = await remote("/surah/" + surah + "/quran-uthmani");
    const verses = canonicalSurah(text, surah);
    let recitation: Record<number, string> = {};
    try {
      if (query.get("text") === "1") return NextResponse.json({
        surah: { number: surah, name: String(text.name), englishName: String(text.englishName ?? ""), numberOfAyahs: verses.length, revelationType: String(text.revelationType ?? "") },
        verses: verses.map(v => ({ ...v, audio: null })),
        source: { ...SOURCE, audioEdition: "none" },
      });
      const audio = await remote("/surah/" + surah + "/ar.alafasy");
      const audioVerses = canonicalSurah(audio, surah);
      if (
        audioVerses.some((v, i) => v.globalNumber !== verses[i]?.globalNumber)
      )
        throw Error("Recitation does not match the requested chapter");
      if (Array.isArray(audio.ayahs)) {
        for (const v of audio.ayahs as RawVerse[]) {
          const n = Number(v.numberInSurah);
          const safe = recitationLink(v.audio);
          if (Number.isInteger(n) && n > 0 && safe) recitation[n] = safe;
        }
      }
    } catch {
      // Audio is optional; never hide canonical reading text when the media service is unavailable.
    }
    return NextResponse.json({
      surah: {
        number: surah,
        name: String(text.name),
        englishName: String(text.englishName ?? ""),
        numberOfAyahs: verses.length,
      },
      verses: verses.map((v: ReturnType<typeof canonicalSurah>[number]) => ({
        ...v,
        audio: recitation[v.number] ?? null,
      })),
      source: SOURCE,
    });
  } catch {
    return NextResponse.json(
      { error: "تعذّر تحميل مصدر المصحف الموثوق حاليًا. حاول لاحقًا." },
      { status: 503 },
    );
  }
}
