import { NextRequest, NextResponse } from "next/server";

const ORIGIN = "https://api.alquran.cloud/v1";
const ALLOWED_AUDIO_HOSTS = new Set(["cdn.islamic.network","api.alquran.cloud","alquran.api.islamic.network"]);
type RawVerse={numberInSurah?:number;number?:number;text?:string;audio?:string};
function normalizeVerse(item:RawVerse){
  return {
    number: Number(item.numberInSurah ?? 0),
    globalNumber:Number(item.number ?? 0),
    text: typeof item.text==="string" ? item.text : "",
  };
}
async function remote(path:string) {
  const response=await fetch(ORIGIN+path,{headers:{"Accept":"application/json"},
    signal:AbortSignal.timeout(9500),next:{revalidate:3600}});
  if(!response.ok) throw new Error("Quran source temporarily unavailable ("+response.status+")");
  const data=await response.json();
  if(data?.code!==200||!data.data)throw new Error("Quran source returned unexpected data");
  return data.data;
}
function safeAudio(value:unknown):string|null {
  if(typeof value!=="string")return null;
  try {
    const url=new URL(value);
    return url.protocol==="https:"&&ALLOWED_AUDIO_HOSTS.has(url.hostname)?url.href:null;
  }catch{return null;}
}
const SOURCE={name:"AlQuran Cloud",edition:"quran-uthmani",reference:"https://alquran.cloud/api",
 terms:"https://alquran.cloud/terms-and-conditions",audioEdition:"ar.alafasy"};
export async function GET(request:NextRequest) {
  const query=request.nextUrl.searchParams;
  try {
    if(query.get("list")==="1"){
      const data=await remote("/surah");
      const surahs=Array.isArray(data)?data.map((s:any)=>({
        number:Number(s.number),name:String(s.name??""),englishName:String(s.englishName??""),
        numberOfAyahs:Number(s.numberOfAyahs??0),revelationType:String(s.revelationType??""),
      })).filter((x:any)=>x.number>=1&&x.number<=114):[];
      if(surahs.length!==114)throw Error("Source returned incomplete Surah index");
      return NextResponse.json({surahs,source:SOURCE});
    }
    const search=query.get("search");
    if(search!==null){
      const term=search.trim();
      if(term.length<2||term.length>50)return NextResponse.json({error:"Search needs 2–50 characters"}, {status:400});
      const data=await remote("/search/"+encodeURIComponent(term)+"/all/quran-uthmani");
      const items=Array.isArray(data?.matches)?data.matches.slice(0,50).map((m:any)=>({
        surah:Number(m.surah?.number??0),surahName:String(m.surah?.name??""),
        number:Number(m.numberInSurah??0),text:String(m.text??""),
      })):[];
      return NextResponse.json({results:items,total:Number(data?.count??0),source:SOURCE});
    }
    const surah=Number(query.get("surah")??1);
    if(!Number.isInteger(surah)||surah<1||surah>114) return NextResponse.json({error:"Surah must be 1–114"}, {status:400});
    const text=await remote("/surah/"+surah+"/quran-uthmani");
    if(!Array.isArray(text.ayahs)||!text.ayahs.length)throw Error("No Quran text available");
    const verses=text.ayahs.map(normalizeVerse).filter((v:ReturnType<typeof normalizeVerse>)=>v.number>0 && v.text.length>0);
    if(!verses.length||verses.length!==Number(text.numberOfAyahs)) throw Error("Incomplete Quran source response");
    let recitation:Record<number,string>={};
    try {
      const audio=await remote("/surah/"+surah+"/ar.alafasy");
      if(Array.isArray(audio.ayahs)){
        for(const v of audio.ayahs as RawVerse[]){
          const n=Number(v.numberInSurah);
          const safe=safeAudio(v.audio);
          if(Number.isInteger(n)&&n>0&&safe)recitation[n]=safe;
        }
      }
    }catch{
      // Audio is optional; never hide canonical reading text when the media service is unavailable.
    }
    return NextResponse.json({
      surah:{number:surah,name:String(text.name),englishName:String(text.englishName??""),numberOfAyahs:verses.length},
      verses:verses.map((v:ReturnType<typeof normalizeVerse>)=>({...v,audio:recitation[v.number]??null})),
      source:SOURCE,
    });
  }catch{
    return NextResponse.json({error:"تعذّر تحميل مصدر المصحف الموثوق حاليًا. حاول لاحقًا."},{status:503});
  }
}
