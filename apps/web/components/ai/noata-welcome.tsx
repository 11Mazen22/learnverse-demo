"use client";
import Link from "next/link";
import {Icon} from "@/components/ui/icon";
import {useTranslation} from "@/lib/i18n/locale";
import {NoataPowerStrip} from "./noata-power-strip";

/** The same composer handles the first message and every later turn. The hero
 * turns real capabilities into starting points instead of decorating a blank box. */
export function NoataWelcome({signedIn,owner,onPrompt}:{signedIn:boolean|null;owner?:string|null;onPrompt?:(prompt:string)=>void}){
 const t=useTranslation();
 const modes=[
  {id:"research",icon:"search",label:t("بحث موثّق","Grounded research"),note:t("مصادر حقيقية وروابط","Real sources and links"),prompt:t("ابحث لي عن أحدث المعلومات الموثوقة حول ","Find current, reliable information about ")},
  {id:"document",icon:"file",label:t("مستند مصمّم","Designed document"),note:t("غلاف وفهرس وتنسيق","Cover, contents, layout"),prompt:t("صمّم تقرير PDF احترافيًا عن ","Design a polished PDF report about ")},
  {id:"learn",icon:"book",label:t("شرح تدريجي","Guided learning"),note:t("خطوات وأسئلة تحقّق","Steps and check questions"),prompt:t("اشرح لي خطوة بخطوة ","Explain step by step ")},
  {id:"create",icon:"sparkles",label:t("كتابة إبداعية","Creative writing"),note:t("مسودات قابلة للتعديل","Editable drafts"),prompt:t("اكتب لي قصة قصيرة عن ","Write a short story about ")},
 ];
 return <div className="owui-welcome noata-r2-welcome">
  <div className="r2-welcome-copy">
   <span className="noata-one-eyebrow r2-eyebrow"><i aria-hidden="true"/>Noata AI · {t("مساحة عمل ذكية","intelligent workspace")}</span>
   <h1>{t("فكّر.","Think.")}<br/><span>{t("اصنع.","Make.")}</span> {t("شارك.","Share.")}</h1>
   <p>{t("من سؤال عابر إلى بحث موثّق أو ملف مصمّم. مساحة واحدة للفهم والإنشاء والتقديم.","From a passing question to sourced research or a designed file. One workspace to understand, create and present.")}</p>
   <div className="r2-mode-grid" role="group" aria-label={t("طرق البدء","Ways to start")}>
    {modes.map(mode=><button key={mode.id} type="button" className="r2-mode" onClick={()=>onPrompt?.(mode.prompt)} disabled={!onPrompt}>
     <span className="r2-mode-icon" aria-hidden="true"><Icon name={mode.icon} size={18}/></span>
     <span className="r2-mode-copy"><strong>{mode.label}</strong><small>{mode.note}</small></span>
     <Icon name="arrow" size={15}/>
    </button>)}
   </div>
   <div className="r2-power"><NoataPowerStrip owner={owner??null}/></div>
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
    <div className="r2-page-top"><span>Noata document</span><b>01</b></div>
    <strong>{t("من السؤال إلى ملف جاهز.","From question to a finished file.")}</strong>
    <div className="r2-page-grid"><span>RESEARCH</span><span>STRUCTURE</span><span>DESIGN</span></div>
    <div className="r2-page-bars"><i/><i/><i/></div>
    <div className="r2-page-foot"><span>PDF</span><span>RTL · LTR</span></div>
   </div>
   <span className="r2-float r2-float-a"><Icon name="search" size={14}/>{t("مصادر حيّة","Live sources")}</span>
   <span className="r2-float r2-float-b"><Icon name="sparkles" size={14}/>{t("ملف مؤلّف بالذكاء الاصطناعي","AI-authored file")}</span>
   <span className="r2-art-caption">{t("فكرة → بحث → تصميم","Idea → research → design")}</span>
  </div>
 </div>;
}
