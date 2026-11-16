import type { Metadata } from "next";
import "./quran.css";
import "./mushaf-renaissance.css";
import { AppShell } from "@/components/app-shell";
export const metadata: Metadata = {
  title: "القرآن الكريم · Qur'an Reader",
  description:
    "المصحف بالرسم العثماني مع فهرس السور والبحث في الآيات وعلامات القراءة وتلاوات تسعة قرّاء. / The Noble Qur'an in Uthmani script with surah index, ayah search, reading marks, and recitations by nine reciters.",
  alternates: { canonical: "/quran" },
};
import { QuranReader } from "@/components/quran/quran-reader";
export default function QuranPage(){
 return <AppShell active="/quran"><QuranReader/></AppShell>;
}
