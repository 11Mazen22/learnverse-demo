import Link from "next/link";
import {Icon} from "./icon";
export function ModuleWelcome({title,description,icon,route,eyebrow,steps}:{title:string;description:string;icon:string;route:string;eyebrow:string;steps:readonly string[]}){
 return <section className="aura-module-welcome">
  <div className="aura-module-intro"><span className="aura-module-symbol"><Icon name={icon} size={32}/></span><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p><div className="hero-actions"><Link href={"/login?next="+route} className="btn btn-primary">سجّل الدخول وابدأ <Icon name="arrow" size={17}/></Link><Link href="/learn" className="btn btn-secondary">استكشف رحلة التعلّم</Link></div></div>
  <ol className="aura-module-steps" aria-label="كيف تعمل هذه المساحة">{steps.map((step,i)=><li key={step}><span>{String(i+1).padStart(2,"0")}</span><strong>{step}</strong><Icon name="check" size={17}/></li>)}</ol>
 </section>;
}
