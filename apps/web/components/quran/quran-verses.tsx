"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { Icon } from "@/components/ui/icon";
import { QuranVerseMarker } from "@/components/ai/quran-verse-marker";
import { toArabicIndicVerseNumber } from "@/lib/quran/verse-number";
import type { Verse } from "@/lib/quran/reciters";

/** Two honest reader modes:
 *  - continuous Mushaf: untouched Uthmani text with a single selectable ayah seal,
 *    ONE contextual toolbar (not hundreds of overlapping audio/bookmark icons);
 *  - verse study: compact cards with a clearly separated, actionable tool row.
 */
export function QuranVerses({ verses, surah, bookmarks, size, mode, highlighted, onBookmark, onPlayVerse, playingVerse, pendingVerse, reciterName, availableVerses }: {
  verses: Verse[]; surah: number; bookmarks: string[]; size: number; mode: "verses" | "flow"; highlighted: string | null;
  onBookmark: (number: number) => void; onPlayVerse: (number: number) => void; playingVerse: number | null;
  pendingVerse: number | null; reciterName: string; availableVerses: number[];
}) {
  const t=useTranslation(),locale=useLocale();
  const [selectedVerse,setSelectedVerse]=useState<number|null>(null);
  useEffect(()=>setSelectedVerse(null),[surah,mode]);
  const arabicLabel=(n:number)=>t("الآية","Verse")+" "+toArabicIndicVerseNumber(n);
  const numberLabel=(n:number)=>n.toLocaleString(locale==="en"?"en":"ar-EG");
  const saved=(n:number)=>bookmarks.includes(surah+":"+n);
  const active=selectedVerse !== null && verses.some(v=>v.number===selectedVerse) ? selectedVerse : null;
  const verseFont={fontSize:(32*size/100).toFixed(1)+"px"};
  const BookmarkButton=({number}:{number:number})=><button type="button" className="mushaf-verse-action" aria-pressed={saved(number)}
      aria-label={(saved(number)?t("إزالة علامة الآية","Remove bookmark from verse"):t("حفظ علامة للآية","Bookmark verse"))+" "+numberLabel(number)}
      onClick={()=>onBookmark(number)}><Icon name="pin" size={17}/><span>{saved(number)?t("تم الحفظ","Bookmarked"):t("حفظ موضع","Bookmark")}</span></button>;
  const PlayButton=({number}:{number:number})=>{
    const playing=playingVerse===number,pending=pendingVerse===number,available=availableVerses.includes(number);
    return <button type="button" className="mushaf-verse-action" disabled={!available} aria-pressed={playing}
      aria-label={(pending?t("إلغاء تحميل تلاوة الآية","Cancel verse loading"):playing?t("إيقاف تلاوة الآية","Pause verse"):t("استمع للآية","Listen to verse"))+" "+numberLabel(number)+" "+t("بصوت","by")+" "+reciterName+(available?"":t(" · التسجيل غير متاح"," · Recording unavailable"))}
      onClick={()=>onPlayVerse(number)}><Icon name={pending?"stop":playing?"pause":"volume"} size={17}/><span>{pending?t("جارٍ التحميل","Loading"):playing?t("إيقاف","Pause"):t("استماع","Listen")}</span></button>;
  };
  if(mode==="flow")return <div id="mushaf-verse-list" className="mushaf-verses mushaf-flow">
    <div className="mushaf-flow-assist" role="note"><Icon name="book" size={16}/><span>{t("اضغط على زخرفة رقم الآية للحفظ أو الاستماع إليها.","Select a verse medallion to bookmark or listen to that verse.")}</span></div>
    {active!==null&&<div className="mushaf-selection-toolbar" role="group" aria-label={arabicLabel(active)}>
      <span className="mushaf-selection-label"><QuranVerseMarker decorative label={t("الآية","Verse")} number={active}/><strong>{arabicLabel(active)}</strong></span>
      <div className="mushaf-selection-actions"><BookmarkButton number={active}/><PlayButton number={active}/>
      <button type="button" className="mushaf-selection-close" onClick={()=>setSelectedVerse(null)} aria-label={t("إغلاق أدوات الآية","Close verse actions")}><Icon name="close" size={17}/></button></div>
    </div>}
    <div className="mushaf-flow-script" lang="ar" dir="rtl" style={verseFont} aria-label={t("الآيات بالرسم العثماني","Verses in Uthmani script")}>
      {verses.map(v=>{
        const id=surah+":"+v.number,selected=active===v.number;
        return <span key={id} id={`ayah-${surah}-${v.number}`} tabIndex={-1}
          className={["mushaf-flow-verse",highlighted===id?"mushaf-highlighted":"",playingVerse===v.number?"mushaf-playing":""].filter(Boolean).join(" ")}
          aria-label={arabicLabel(v.number)} aria-current={playingVerse===v.number?"true":undefined}>
          <span className="mushaf-flow-words">{v.text}</span>{"\u2060"}
          <button type="button" className="mushaf-flow-marker" aria-pressed={selected}
            aria-label={arabicLabel(v.number)+" · "+t("عرض أدوات الحفظ والاستماع","Show bookmark and recitation actions")}
            onClick={()=>setSelectedVerse(selected?null:v.number)}>
            <QuranVerseMarker number={v.number} decorative label={t("الآية","Verse")}/>
          </button>{" "}
        </span>;
      })}
    </div>
  </div>;
  return <div id="mushaf-verse-list" className="mushaf-verses mushaf-verse-cards" lang="ar" dir="rtl">
    {verses.map(v=>{
      const id=surah+":"+v.number;
      return <article key={id} id={`ayah-${surah}-${v.number}`} tabIndex={-1}
        className={["aura-quran-ayah","mushaf-study-card",highlighted===id?"mushaf-highlighted":"",playingVerse===v.number?"mushaf-playing":""].filter(Boolean).join(" ")}
        aria-label={arabicLabel(v.number)+(playingVerse===v.number?t(" · تُتلى الآن"," · Playing"):"")}
        aria-current={playingVerse===v.number?"true":undefined}>
        <div className="mushaf-study-heading"><span className="mushaf-study-index"><QuranVerseMarker number={v.number} decorative label={t("الآية","Verse")}/><span>{arabicLabel(v.number)}</span></span>
          <div className="mushaf-study-actions"><BookmarkButton number={v.number}/><PlayButton number={v.number}/></div>
        </div>
        <p className="aura-quran-verse mushaf-study-script" dir="rtl" lang="ar" style={verseFont}>{v.text}</p>
      </article>;
    })}
  </div>;
}
