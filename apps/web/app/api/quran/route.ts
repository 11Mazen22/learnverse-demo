import { NextRequest, NextResponse } from "next/server";
import {
  canonicalSurah,
  canonicalIndex,
  recitationLink,
  QURAN_RECITERS,
  isQuranReciter,
  audioEditionCandidates,
  matchingSurahs,
} from "@/lib/quran/source";
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
    next: { revalidate: 3600 },
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
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  try {
    if (query.get("list") === "1") {
      const data = await remote("/surah");
      const surahs = canonicalIndex(data);
      return NextResponse.json({ surahs, source: SOURCE });
    }
    const search = query.get("search");
    if (search !== null) {
      const term = search.trim();
      if (term.length < 2 || term.length > 50)
        return NextResponse.json(
          { error: "اكتب عبارة بحث بين حرفين و٥٠ حرفًا." },
          { status: 400 },
        );
      const [indexResult,verseResult]=await Promise.allSettled([
        remote("/surah"),
        remote("/search/" + encodeURIComponent(term) + "/all/quran-uthmani"),
      ]);
      const surahMatches=indexResult.status==="fulfilled"
        ? matchingSurahs(canonicalIndex(indexResult.value),term)
        : [];
      if(verseResult.status==="rejected" && !surahMatches.length)throw Error("Search providers unavailable");
      const data=verseResult.status==="fulfilled"?verseResult.value:null;
      const items = Array.isArray(data?.matches)
        ? data.matches.slice(0, 50).map((m: any) => ({
            surah: Number(m.surah?.number ?? 0),
            surahName: String(m.surah?.name ?? ""),
            number: Number(m.numberInSurah ?? 0),
            text: String(m.text ?? ""),
          })).filter((m:{surah:number;number:number;text:string})=>m.surah>=1&&m.surah<=114&&m.number>=1&&m.number<=286&&m.text.length>0)
        : [];
      return NextResponse.json({
        results:items,surahs:surahMatches,
        total:Number(data?.count??0),
        partial:verseResult.status==="rejected",
        source: SOURCE,
      });
    }
    const surah = Number(query.get("surah") ?? 1);
    if (!Number.isInteger(surah) || surah < 1 || surah > 114)
      return NextResponse.json(
        { error: "رقم السورة يجب أن يكون بين ١ و١١٤." },
        { status: 400 },
      );
    const requested=query.get("reciter")??"ar.alafasy";
    if(!isQuranReciter(requested))
      return NextResponse.json({error:"قارئ غير مدعوم"},{status:400});
    const text = await remote("/surah/" + surah + "/quran-uthmani");
    const verses = canonicalSurah(text, surah);
    let recitation: Record<number, string> = {};
    let usedAudioEdition: string | null = null;
    // Alternative editions are only permitted when they belong to the same
    // requested Sheikh. A successful Quran-text response must never mask a
    // silent switch to a different Sheikh when audio is missing.
    for (const edition of audioEditionCandidates(requested)) {
      try {
        const audio = await remote("/surah/" + surah + "/" + edition);
        const identifier = audio?.edition?.identifier;
        if (typeof identifier === "string" && identifier !== edition)
          throw Error("Unexpected reciter edition");
        const audioVerses = canonicalSurah(audio, surah);
        if (audioVerses.some((v, i) => v.globalNumber !== verses[i]?.globalNumber))
          throw Error("Recitation does not match the requested chapter");
        const validated: Record<number, string> = {};
        if (Array.isArray(audio.ayahs)) {
          for (const v of audio.ayahs as RawVerse[]) {
            const n = Number(v.numberInSurah);
            const safe = recitationLink(v.audio);
            if (Number.isInteger(n) && n >= 1 && n <= verses.length && safe)
              validated[n] = safe;
          }
        }
        if (Object.keys(validated).length > 0) {
          recitation = validated;
          usedAudioEdition = edition;
          break;
        }
      } catch {
        // Unavailable edition: try the next edition of THIS SAME reciter.
      }
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
      source: {
        ...SOURCE,
        audioEdition:usedAudioEdition,
        requestedAudioEdition:requested,
        reciterName:QURAN_RECITERS.find(r=>r.id===requested)?.name??requested,
      },
      audioAvailable:Object.keys(recitation).length>0,
      audioUnavailableReason: usedAudioEdition === null
        ? "لا يوجد تسجيل متاح من المصدر للشيخ المحدد حاليًا. اختر شيخًا آخر بنفسك أو حاول لاحقًا."
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: "تعذّر تحميل مصدر المصحف الموثوق حاليًا. حاول لاحقًا." },
      { status: 503 },
    );
  }
}
