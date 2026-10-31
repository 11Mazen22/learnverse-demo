"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { Icon } from "@/components/ui/icon";
import { QuranVerseMarker } from "./quran-verse-marker";

type Verse = { number: number; text: string };
type State = { status: "loading" } | { status: "error" } | { status: "ready"; name: string; verses: Verse[] };

/** A chat never prints guessed sacred text. Verses come from Noäta's
 * existing server-validated canonical Uthmani Quran source. */
export function QuranPassage({ surah, start, end }: { surah: number; start: number; end: number }) {
  const t = useTranslation(), locale = useLocale();
  const [state, setState] = useState<State>({ status: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    fetch("/api/quran?surah=" + surah + "&text=1", { signal: controller.signal, headers: { Accept: "application/json" } })
      .then(async response => { if (!response.ok) throw Error("Quran source unavailable"); return response.json(); })
      .then(data => {
        if (Number(data?.surah?.number) !== surah || !Array.isArray(data?.verses)) throw Error("Invalid Quran data");
        const verses = (data.verses as Verse[]).filter(v => v.number >= start && v.number <= end);
        if (verses.length !== end-start+1 || verses.some((v, i) => v.number !== start+i || typeof v.text !== "string" || !v.text.trim())) throw Error("Missing verses");
        if (!controller.signal.aborted) setState({ status: "ready", name: String(data.surah.name), verses });
      })
      .catch(() => { if (!controller.signal.aborted) setState({ status: "error" }); });
    return () => controller.abort();
  }, [surah, start, end]);
  const digits = (n: number) => n.toLocaleString(locale === "en" ? "en" : "ar-EG");
  return <figure className="noata-quran-passage" lang="ar" dir="rtl" aria-busy={state.status === "loading"}>
    <figcaption className="noata-quran-heading">
      <span className="noata-quran-symbol" aria-hidden="true"><Icon name="book" size={18}/></span>
      <span><strong>{state.status === "ready" ? state.name : t("آيات من القرآن الكريم","Quran verses")}</strong>
        <small>{t("الآيات","Verses")} {digits(start)}{end !== start ? "–" + digits(end) : ""}</small></span>
      <Link href={"/quran?surah=" + surah} className="noata-quran-open">{t("افتح المصحف","Open Mushaf")} <Icon name="arrow" size={13}/></Link>
    </figcaption>
    {state.status === "loading" ? <div className="noata-quran-loading" role="status">{t("بنحمّل النص المعتمد من المصحف…","Loading the verified Uthmani text…")}</div> :
      state.status === "error" ? <p className="noata-quran-error" role="alert">{t("تعذّر التحقق من النص الآن، لذلك لن نعرض آيات غير موثّقة. افتح المصحف وحاول مرة أخرى.","The source could not be verified. Unverified verses will not be displayed. Open the Mushaf and try again.")}</p> :
      <div className="noata-quran-text" data-testid="noata-verified-quran-text">{state.verses.map(verse => <span key={verse.number} className="noata-quran-verse">{verse.text}{"\u2060"}<QuranVerseMarker number={verse.number} label={t("الآية","Verse")}/>{" "}</span>)}</div>}
    <div className="noata-quran-source">{t("النص: المصحف العثماني · المصدر: AlQuran Cloud","Uthmani text · Source: AlQuran Cloud")}</div>
  </figure>;
}
