"use client";
import Link from "next/link";
import {Icon} from "@/components/ui/icon";
import {useTranslation} from "@/lib/i18n/locale";

/** The same composer handles the first message and every later turn. The hero
 * turns real capabilities into starting points instead of decorating a blank box. */
export function NoataWelcome({signedIn,owner,onPrompt}:{signedIn:boolean|null;owner?:string|null;onPrompt?:(prompt:string)=>void}){
 const t=useTranslation();
 return <div className="owui-welcome noata-r2-welcome">
  <div className="r2-welcome-copy">
   <span className="noata-one-eyebrow r2-eyebrow"><i aria-hidden="true"/>Noäta AI · {t("مساحة عمل ذكية","intelligent workspace")}</span>
   <h1>{t("فكّر.","Think.")}<br/><span>{t("اصنع.","Make.")}</span> {t("شارك.","Share.")}</h1>
   <p>{t("من سؤال عابر إلى بحث موثّق أو ملف مصمّم. مساحة واحدة للفهم والإنشاء والتقديم.","From a passing question to sourced research or a designed file. One workspace to understand, create and present.")}</p>
   {signedIn===false&&<Link className="noata-one-signin" href="/login?next=/ai">{t("سجّل الدخول للبدء","Sign in to get started")}</Link>}
  </div>
  <div className="r2-welcome-art" aria-hidden="true">
   <span className="r2-orbit r2-orbit-a"/>
   <span className="r2-orbit r2-orbit-b"/>
   <div className="r2-page r2-page-back">
    <i className="r2-page-rule"/>
    <span className="r2-page-back-line"/>
    <span className="r2-page-back-line short"/>
    <span className="r2-page-back-block"/>
   </div>
   <div className="r2-page r2-page-front">
    <div className="r2-page-top"><span>Noäta document</span><b>01</b></div>
    <strong>{t("من السؤال إلى ملف جاهز.","From question to a finished file.")}</strong>
    <div className="r2-page-grid"><span>RESEARCH</span><span>STRUCTURE</span><span>DESIGN</span></div>
    <div className="r2-page-bars"><i/><i/><i/></div>
    <div className="r2-page-foot"><span>PDF</span><span>RTL · LTR</span></div>
   </div>
   <span className="r2-art-caption">{t("فكرة → بحث → تصميم","Idea → research → design")}</span>
  </div>
 </div>;
}
