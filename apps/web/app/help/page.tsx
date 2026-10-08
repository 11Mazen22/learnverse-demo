import {AppShell} from "@/components/app-shell";
import {HelpCenter} from "@/components/help/help-center";
export const metadata={title:"مركز المساعدة | Noata Aura"};
export default function Help(){
 return <AppShell active="/help"><HelpCenter/></AppShell>;
}
