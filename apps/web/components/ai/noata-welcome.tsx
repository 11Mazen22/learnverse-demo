"use client";
import Link from "next/link";
import {NoataLogo} from "@/components/ui/noata-logo";
import {useTranslation} from "@/lib/i18n/locale";
import {NoataPowerStrip} from "./noata-power-strip";

/** The same composer handles the first message and every later turn. */
export function NoataWelcome({signedIn,owner}:{signedIn:boolean|null;owner?:string|null}){
 const t=useTranslation();
 return <div className="owui-welcome">
  <div className="owui-welcome-logo" aria-hidden="true"><NoataLogo size={42}/></div>
  <span className="noata-one-eyebrow">Noata AI</span>
  <h1>{t("نبدأ بفكرتك.","Start with your idea.")}</h1>
  <p>{t("اسأل، تعلّم، أو اصنع شيئًا يستحق المشاركة.","Ask, learn, or make something worth sharing.")}</p>
  <NoataPowerStrip owner={owner??null}/>
  {signedIn===false&&<Link className="noata-one-signin" href="/login?next=/ai">{t("سجّل الدخول للبدء","Sign in to get started")}</Link>}
 </div>;
}
