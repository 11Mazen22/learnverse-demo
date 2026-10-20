"use client";
import {useId,useState} from "react";
import {Icon} from "@/components/ui/icon";
import researchStyles from "./research-panel.module.css";
import {useTranslation} from "@/lib/i18n/locale";
import {quadraticValues,type ResponseUi} from "../../../../supabase/functions/noata-ai/response-ui.ts";
import {validatedResearch} from "../../../../supabase/functions/noata-ai/research.ts";
import {quadraticChartData} from "@/lib/ai/xy-chart";
import {CartesianChart} from "./cartesian-chart";
import {StudyDeck,LineChart} from "./learning-interactions";

function Quadratic({data}:{data:Extract<ResponseUi,{type:"quadratic"}>}){
 const t=useTranslation();
 const [coefficients,setCoefficients]=useState([data.a,data.b,data.c]);
 const [a,b,c]=coefficients,result=quadraticValues(a,b,c);
 const display=(n:number)=>Number(n.toFixed(4)).toString();
 return <>
  <div className="noata-coefficients" dir="ltr">{["a","b","c"].map((label,index)=><label key={label}>{label}<input aria-label={`${t("المعامل","Coefficient")} ${label}`} type="range" min="-20" max="20" step="0.5" value={coefficients[index]} onChange={e=>setCoefficients(old=>old.map((n,i)=>i===index?Number(e.target.value):n))}/><output>{coefficients[index]}</output></label>)}</div>
  <p dir="ltr" className="noata-equation">y = {a}x² + ({b})x + ({c})</p>
  <CartesianChart calculator data={quadraticChartData(a,b,c,t("منحنى الدالة","Function curve"))}/>
  <div aria-live="polite" className="noata-calculation"><p>{t("المميّز","Discriminant")}: <bdi>{result.discriminant===null?t("معادلة غير تربيعية","Not quadratic"):display(result.discriminant)}</bdi></p><p>{result.roots.length?t("الجذور الحقيقية","Real roots")+": "+result.roots.map(display).join(", "):result.kind==="identity"?t("كل قيم س تحقق المعادلة.","Every x satisfies the equation."):t("لا توجد جذور حقيقية.","No real roots.")}</p></div>
 </>;
}
function Quiz({data}:{data:Extract<ResponseUi,{type:"quiz"}>}){
 const t=useTranslation(),id=useId();const [answers,setAnswers]=useState<Record<number,number>>({}),[checked,setChecked]=useState(false);
 return <><p className="noata-widget-note">{t("تدريب يولّده الذكاء الاصطناعي. راجع المعلومات المهمة؛ لا يؤثر على الدرجات أو المكافآت.","AI-generated practice. Check important facts; this does not affect grades or rewards.")}</p>{data.questions.map((q,i)=><fieldset className="noata-quiz-question" key={i}><legend>{i+1}. {q.prompt}</legend>{q.choices.map((choice,j)=><label key={j}><input type="radio" name={`${id}-${i}`} checked={answers[i]===j} onChange={()=>{setAnswers(old=>({...old,[i]:j}));setChecked(false);}}/>{choice}</label>)}{checked&&<p className="noata-practice-feedback">{answers[i]===q.answer?t("صحيح","Correct"):t("راجع إجابتك","Review your answer")}: {q.explanation}</p>}</fieldset>)}<div className="noata-widget-controls"><button type="button" disabled={Object.keys(answers).length!==data.questions.length} onClick={()=>setChecked(true)}>{t("تحقق من الإجابات","Check answers")}</button><button type="button" onClick={()=>{setAnswers({});setChecked(false);}}>{t("ابدأ مجددًا","Start again")}</button></div>{checked&&<p role="status">{t("إجابات صحيحة","Correct answers")}: {data.questions.filter((q,i)=>answers[i]===q.answer).length} / {data.questions.length}</p>}</>;
}
/** Native allowlist; generated payloads cannot import components or invoke actions. */
export function ResponseComponent({data}:{data:ResponseUi}){
 return <section className="noata-response-component" dir="auto" aria-label={data.title}><h3>{data.title}</h3>
  {data.type==="xy_chart"?<CartesianChart data={data}/>:data.type==="quadratic"?<Quadratic data={data}/>:data.type==="flashcards"?<StudyDeck data={data}/>:data.type==="quiz"?<Quiz data={data}/>:data.type==="line_chart"?<LineChart data={data}/>:data.type==="steps"?<ol className="noata-guided-steps">{data.steps.map((step,i)=><li key={i}><details><summary>{step.title}</summary><p>{step.body}</p></details></li>)}</ol>:data.type==="timeline"?<ol className="noata-timeline">{data.events.map((event,i)=><li key={i}><span>{event.date}</span><h4>{event.title}</h4><p>{event.body}</p></li>)}</ol>:<div className="noata-comparison-scroll" tabIndex={0}><table><caption>{data.title}</caption><thead><tr>{data.columns.map((column,i)=><th scope="col" key={i}>{column}</th>)}</tr></thead><tbody>{data.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}
  <details className="noata-widget-fallback"><summary><FallbackLabel/></summary><p>{data.fallback}</p></details>
 </section>;
}
function FallbackLabel(){const t=useTranslation();return <>{t("شرح نصي","Text explanation")}</>;}
export function ResearchSources({research}:{research:unknown}){
 const t=useTranslation(),data=validatedResearch(research);
 if(!data)return null;
 if(data.status!=="complete"){
  const reasons:Record<string,string>={
   not_configured:t("البحث على الويب غير متصل بهذه المساحة حاليًا.","Web search is not connected to this workspace."),
   temporarily_busy:t("خدمة البحث مشغولة مؤقتًا. جرّب بعد قليل.","Search is temporarily busy. Try again shortly."),
   no_sources:t("لم تُرجع الخدمة مقتطفات مصادر يمكن التحقق منها.","No verifiable source excerpts were returned."),
   provider_unavailable:t("تعذّر الوصول إلى خدمة البحث أو رفضت الطلب.","The search provider could not be reached or rejected the request."),
   quota_or_service:t("تعذّر البحث بسبب الحصة أو إتاحة الخدمة.","Search could not run because of quota or service availability.")
   ,official_sources_not_found:t("لم تُرجع الخدمة أدلة من نطاق المصدر المطلوب.","The provider returned no evidence from the requested source domain.")
  };
  return <details className={`noata-research-trace ${researchStyles.panel}`}>
   <summary className="noata-research-summary"><span className="noata-research-indicator" aria-hidden="true"><Icon name="search" size={20}/></span><span>{t("البحث غير متاح","Research unavailable")}</span><span className="noata-research-chevron"><Icon name="chevron" size={16}/></span></summary>
   <div className="noata-research-detail">
    <p role="status">{reasons[data.reason??""]??t("تعذّر استرجاع مصادر مباشرة لهذا الطلب.","Live sources could not be retrieved for this request.")}</p>
    <p>{t("لم نتحقق من المعلومات الحالية ولم ننشئ بيانات أو مراجع وهمية.","Current claims have not been verified; no data or citations were invented.")}</p>
   </div>
  </details>;
 }
 const labels:Record<string,string>={
  searching:t("بحث عن المصادر","Searched for sources"),
  reviewing:t("راجع نتائج البحث","Reviewed search excerpts"),
  complete:t("اكتمل البحث","Research completed"),
  unavailable:t("البحث غير متاح","Research unavailable"),
  failed:t("تعذّر البحث","Research failed")
 };
 return <details className={`noata-research-trace ${researchStyles.panel}`}>
  <summary className="noata-research-summary"><span className="noata-research-indicator" aria-hidden="true"><Icon name="search" size={20}/></span>
   <span>{data.reason==="encyclopedia_background"
      ?t("مراجع موسوعية من ويكيبيديا","Wikipedia background sources")
      :data.reason==="open_scholarly"
      ?t("سجلات علمية مفتوحة","Open scholarly records")
      :t("تم البحث على الويب","Searched the web")} · {data.sources.length} {t("مصادر","sources")}</span>
   <span className="noata-research-expand">{t("التفاصيل","Details")}</span><span className="noata-research-chevron"><Icon name="chevron" size={16}/></span>
  </summary>
  <div className="noata-research-detail">
   {data.query&&<div className="noata-research-query"><strong>{t("عبارة البحث","Search query")}</strong><p dir="auto">{data.query}</p></div>}
   {data.queries&&data.queries.length>1&&<div className="noata-research-query"><strong>{t("عمليات البحث المنفّذة","Executed searches")}</strong><ol>{data.queries.map((q,i)=><li key={i}><bdi>{q.query}</bdi> · {q.status==="complete"?t("تم الاسترجاع","Retrieved"):t("تعذّر الاسترجاع","Failed")}</li>)}</ol></div>}
   {data.partial&&<p role="status">{t("تعذّر استكمال بعض عمليات البحث. هذه أدلة جزئية.","Some follow-up searches failed. This evidence is partial.")}</p>}
   {data.activity&&data.activity.length>0&&<ol className="noata-research-activity" aria-label={t("مراحل البحث المسجلة","Recorded research stages")}>
    {data.activity.map((item,i)=><li key={item.stage+":"+i} style={{animationDelay:`${Math.min(i,4)*35}ms`}}>
     <span className="noata-research-stage-icon" aria-hidden="true"><Icon name={item.stage==="searching"?"search":item.stage==="reviewing"?"book":item.stage==="complete"?"check":"help"} size={15}/></span><span>{labels[item.stage]??item.stage}</span>
     {item.resultCount!==undefined&&<small>{item.resultCount} {t("مصادر","sources")}</small>}
    </li>)}
   </ol>}
   <strong className="noata-research-source-heading">{t("المصادر المسترجعة","Retrieved sources")}</strong>
   <ol className="noata-research-links">{data.sources.map(source=><li key={source.id}>
    <a href={source.url} aria-label={"["+source.id+"] "+source.title} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"><span className="noata-source-number" aria-hidden="true">{source.id}</span><bdi>{source.title}</bdi><span className="noata-source-link-icon" aria-hidden="true"><Icon name="arrow" size={15}/></span></a>
    <small><bdi>{source.domain}</bdi>{source.published?" · "+source.published:""}</small>
    <p>{source.excerpt}</p>
   </li>)}</ol>
   <p className="noata-research-disclaimer"><Icon name="help" size={16}/><span>{data.reason==="encyclopedia_background"
     ?t("هذه مقاطع من ويكيبيديا للمعلومات العامة، وليست بحثًا حديثًا أو تحققًا من الأخبار.","These are Wikipedia background excerpts, not live news or verification of current claims.")
     :data.reason==="open_scholarly"
     ?t("سجلات علمية مفتوحة (بيانات ببليوغرافية). لا تتحقق من الأخبار أو الأحداث الجارية.","Open scholarly records (bibliographic metadata). They do not verify news or current events.")
     :t("المصادر المسترجعة لا تثبت تلقائيًا كل معلومة في الإجابة. تحقّق من الادعاءات المهمة.","Retrieved sources do not automatically verify every claim. Check important conclusions.")}</span></p>
  </div>
 </details>;
}
