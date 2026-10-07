import {AppShell} from "@/components/app-shell";
import {LearnLive} from "@/components/learn/learn-live";

export default function LearnPage(){
  return <AppShell active="/learn"><LearnLive/></AppShell>;
}
