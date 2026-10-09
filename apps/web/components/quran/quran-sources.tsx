import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { QuranSource } from "@/lib/quran/reciters";
export function QuranSources({ source, reciterName }: { source?: QuranSource; reciterName: string }) {
  return <footer className="aura-quran-attribution mushaf-attribution">
    <div className="mushaf-source-heading"><Icon name="check" size={18}/><h2>المصادر، بكل وضوح</h2></div>
    <dl className="mushaf-sources-grid">
      <div><dt>النص القرآني</dt><dd><a href="https://alquran.cloud/api" target="_blank" rel="noopener noreferrer">AlQuran Cloud</a><span><bdi>{source?.edition ?? "quran-uthmani"}</bdi> · محفوظ دون تعديل</span></dd></div>
      <div><dt>تلاوة السورة</dt><dd><a href="https://mp3quran.net/ar" target="_blank" rel="noopener noreferrer">MP3Quran</a><span>{reciterName} · حفص عن عاصم، مرتل</span></dd></div>
      <div><dt>تلاوة الآيات</dt><dd><a href="https://everyayah.com/" target="_blank" rel="noopener noreferrer">EveryAyah</a><span>أرشيف مستقل؛ الإتاحة حسب القارئ والآية. ليس اقتطاعًا من ملف السورة.</span></dd></div>
    </dl>
    <p>لا يُعرض هنا تفسير أو ترجمة موثقة. أي شرح مولّد خارج المصحف ليس نصًا قرآنيًا، ولا تفسيرًا معتمدًا دون مصادر قابلة للتحقق.</p>
    <nav aria-label="حقوق المصحف والمساعدة"><a href="https://alquran.cloud/terms-and-conditions" target="_blank" rel="noopener noreferrer">شروط مصدر النص</a><a href="https://everyayah.com/data/recitations.js" target="_blank" rel="noopener noreferrer">دليل تسجيلات الآيات</a><Link href="/privacy">الخصوصية</Link><Link href="/help">المساعدة</Link></nav>
  </footer>;
}
