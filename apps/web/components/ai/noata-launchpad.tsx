"use client";
import {useTranslation,useLocale} from "@/lib/i18n/locale";
import {launchItems,type LaunchAction,launchActionEnabled} from "@/lib/ai/launch-actions";
import {Icon} from "@/components/ui/icon";
export function NoataLaunchpad({signedIn,disabled,onSelect}:{signedIn:boolean;disabled:boolean;onSelect:(id:LaunchAction)=>void}){
 const locale=useLocale(),t=useTranslation();
 return <section className="noata-launchpad" aria-label={t("مساحات Noäta AI","Noäta AI workspaces")}>
  <div className="noata-launchpad-heading"><div><span className="noata-launchpad-overline">NOATA · INTELLIGENCE STUDIO</span>
   <h2>{t("من الفكرة إلى النتيجة","From idea to something real")}</h2>
   <p>{t("اختار مساحة عمل حقيقية. الأدوات التي تحتاج خدمة خارجية تظهر حالتها بوضوح؛ لن نعرض قدرات وهمية.","Choose a real workspace. Provider-dependent tools disclose their availability instead of pretending to work.")}</p>
  </div><span className="noata-launchpad-mark" aria-hidden="true">✦</span></div>
  <div className="noata-launchpad-grid">
   {launchItems.map((item,i)=><button type="button" key={item.id} className={"noata-launch-tile noata-launch-"+item.id}
    disabled={disabled||!launchActionEnabled(item.id,signedIn)} style={{animationDelay:i*35+"ms"}}
    onClick={()=>onSelect(item.id)}>
    <span className="noata-launch-symbol" aria-hidden="true">{item.symbol}</span>
    <span className="noata-launch-copy"><strong>{locale==="ar"?item.titleAr:item.titleEn}</strong>
     <small>{!signedIn&&!launchActionEnabled(item.id,signedIn)?t("يتطلب تسجيل الدخول","Sign-in required"):
       locale==="ar"?item.descriptionAr:item.descriptionEn}</small></span>
    <Icon name="arrow" size={17}/>
   </button>)}
  </div>
 </section>;
}
