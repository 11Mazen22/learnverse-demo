import type { Metadata } from "next";
import "./quran.css";
import { AppShell } from "@/components/app-shell";
export const metadata: Metadata = { title: "القرآن الكريم · قراءة وتلاوة", description: "المصحف بالرسم العثماني، فهرس السور، البحث في الآيات، علامات القراءة، وتلاوات تسعة قرّاء في مساحة هادئة ومتاحة للجميع." };
import { QuranReader } from "@/components/quran/quran-reader";
export default function QuranPage(){
 return <AppShell active="/quran"><QuranReader/></AppShell>;
}
