import { AppShell } from "@/components/app-shell";
import { QuranReader } from "@/components/quran/quran-reader";
export default function QuranPage(){
 return <AppShell active="/quran"><QuranReader/></AppShell>;
}
