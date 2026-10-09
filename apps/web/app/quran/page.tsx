import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { QuranReader } from "@/components/quran/quran-reader";
export const metadata: Metadata = {
 title: "القرآن الكريم · قراءة وتلاوة",
 description: "المصحف بالرسم العثماني، البحث والعلامات، وتلاوات السور والآيات من مصادرها المعلنة.",
};
export default function QuranPage(){
 return <AppShell active="/quran"><QuranReader/></AppShell>;
}
