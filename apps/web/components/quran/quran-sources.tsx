import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { QuranSource } from "@/lib/quran/reciters";
export function QuranSources({ source, reciterName, verseProvider }: { source?: QuranSource; reciterName: string; verseProvider: "AlQuran Cloud" | "EveryAyah" }) {
 const t=useTranslation(),locale=useLocale();
  return <footer className="aura-quran-attribution mushaf-attribution">
    <div className="mushaf-source-heading"><Icon name="check" size={18}/><h2>{t("المصادر، بكل وضوح","Sources, clearly identified")}</h2></div>
    <dl className="mushaf-sources-grid">
      <div><dt>{t("النص القرآني","Quran text")}</dt><dd><a href="https://alquran.cloud/api" target="_blank" rel="noopener noreferrer">AlQuran Cloud</a><span><bdi>{source?.edition ?? "quran-uthmani"}</bdi>{t("· محفوظ دون تعديل","· Preserved without modification")}</span></dd></div>
      <div><dt>{t("تلاوة السورة","Surah recording")}</dt><dd><a href="https://mp3quran.net/ar" target="_blank" rel="noopener noreferrer">MP3Quran</a><span>{reciterName}{t("· حفص عن عاصم، مرتل","· Hafs from Asim, Murattal")}</span></dd></div>
      <div><dt>{t("تلاوة الآيات","Verse recordings")}</dt><dd><a href={verseProvider === "AlQuran Cloud" ? "https://alquran.cloud/api" : "https://everyayah.com/"} target="_blank" rel="noopener noreferrer">{verseProvider}</a><span>{t("أرشيف مستقل؛ الإتاحة حسب القارئ والآية. ليس اقتطاعًا من ملف السورة.","A separate archive. Availability depends on the reciter and verse. Audio is not cut from the surah recording.")}</span></dd></div>
    </dl>
    <p>{t("لا يُعرض هنا تفسير أو ترجمة موثقة. أي شرح مولّد خارج المصحف ليس نصًا قرآنيًا، ولا تفسيرًا معتمدًا دون مصادر قابلة للتحقق.","No verified tafsir or translation is displayed here. AI explanations outside the reader are separate from scripture and require verifiable sources.")}</p>
    <nav aria-label={t("حقوق المصحف والمساعدة","Quran source rights and help")}><a href="https://alquran.cloud/terms-and-conditions" target="_blank" rel="noopener noreferrer">{t("شروط مصدر النص","Text source terms")}</a><a href="https://everyayah.com/data/recitations.js" target="_blank" rel="noopener noreferrer">{t("دليل تسجيلات الآيات","Verse recording catalogue")}</a><Link href="/privacy">{t("الخصوصية","Privacy")}</Link><Link href="/help">{t("المساعدة","Help")}</Link></nav>
  </footer>;
}
"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
