"use client";
import {useId,useState} from "react";
import {useTranslation} from "@/lib/i18n/locale";
import {quadraticValues,type ResponseUi} from "../../../../supabase/functions/noata-ai/response-ui.ts";
import {validatedResearch} from "../../../../supabase/functions/noata-ai/research.ts";

function Quadratic({data}:{data:Extract<ResponseUi,{type:"quadratic"}>}){
 const t=useTranslation(),id=useId();
 const [coefficients,setCoefficients]=useState([data.a,data.b,data.c]);
 const [a,b,c]=coefficients,result=quadraticValues(a,b,c);
 const display=(n:number)=>Number(n.toFixed(4)).toString();
 const points=Array.from({length:121},(_,i)=>{const x=-6+i/10,y=a*x*x+b*x+c;return `${(x+6)*40},${160-y*8}`;}).join(" ");
 return <>
  <div className="noata-coefficients" dir="ltr">{["a","b","c"].map((label,index)=><label key={label}>{label}<input aria-label={`${t("المعامل","Coefficient")} ${label}`} type="range" min="-20" max="20" step="0.5" value={coefficients[index]} onChange={e=>setCoefficients(old=>old.map((n,i)=>i===index?Number(e.target.value):n))}/><output>{coefficients[index]}</output></label>)}</div>
  <p dir="ltr" className="noata-equation">y = {a}x² + ({b})x + ({c})</p>
  <svg className="noata-function-graph" viewBox="0 0 480 320" role="img" aria-labelledby={id+"-title "+id+"-desc"}>
   <title id={id+"-title"}>{t("رسم الدالة","Function graph")}</title><desc id={id+"-desc"}>{t("غيّر المعاملات لاكتشاف الجذور. نطاق س من سالب 6 إلى 6، وص من سالب 20 إلى 20.","Change coefficients to explore the roots. x ranges from −6 to 6; y ranges from −20 to 20.")}</desc>
   <defs><clipPath id={id+"-clip"}><rect width="480" height="320"/></clipPath></defs>
   <g className="noata-graph-grid">{[80,160,240,320,400].map(x=><line key={"x"+x} x1={x} y1="0" x2={x} y2="320"/>)}{[80,160,240].map(y=><line key={"y"+y} x1="0" y1={y} x2="480" y2={y}/>)}</g>
   <path className="noata-graph-axis" d="M0 160H480M240 0V320"/><polyline className="noata-graph-curve" points={points} clipPath={`url(#${id}-clip)`}/>
   <text x="455" y="154">x</text><text x="247" y="18">y</text><text x="5" y="178">−6</text><text x="466" y="178">6</text>
  </svg>
  <div aria-live="polite" className="noata-calculation"><p>{t("المميّز","Discriminant")}: <bdi>{result.discriminant===null?t("معادلة غير تربيعية","Not quadratic"):display(result.discriminant)}</bdi></p><p>{result.roots.length?t("الجذور الحقيقية","Real roots")+": "+result.roots.map(display).join(", "):result.kind==="identity"?t("كل قيم س تحقق المعادلة.","Every x satisfies the equation."):t("لا توجد جذور حقيقية.","No real roots.")}</p></div>
 </>;
}
function Flashcards({data}:{data:Extract<ResponseUi,{type:"flashcards"}>}){
 const t=useTranslation();const [index,setIndex]=useState(0),[back,setBack]=useState(false),card=data.cards[index];
 return <><button type="button" className="noata-flashcard" aria-label={t("اقلب البطاقة","Flip card")} aria-pressed={back} onClick={()=>setBack(!back)}><span>{back?card.back:card.front}</span><small>{t("اضغط لإظهار الوجه الآخر","Select to reveal the other side")}</small></button><div className="noata-widget-controls"><button type="button" disabled={index===0} onClick={()=>{setIndex(index-1);setBack(false);}}>{t("السابق","Previous")}</button><span>{index+1} / {data.cards.length}</span><button type="button" disabled={index===data.cards.length-1} onClick={()=>{setIndex(index+1);setBack(false);}}>{t("التالي","Next")}</button></div></>;
}
function Quiz({data}:{data:Extract<ResponseUi,{type:"quiz"}>}){
 const t=useTranslation(),id=useId();const [answers,setAnswers]=useState<Record<number,number>>({}),[checked,setChecked]=useState(false);
 return <><p className="noata-widget-note">{t("تدريب يولّده الذكاء الاصطناعي. راجع المعلومات المهمة؛ لا يؤثر على الدرجات أو المكافآت.","AI-generated practice. Check important facts; this does not affect grades or rewards.")}</p>{data.questions.map((q,i)=><fieldset className="noata-quiz-question" key={i}><legend>{i+1}. {q.prompt}</legend>{q.choices.map((choice,j)=><label key={j}><input type="radio" name={`${id}-${i}`} checked={answers[i]===j} onChange={()=>{setAnswers(old=>({...old,[i]:j}));setChecked(false);}}/>{choice}</label>)}{checked&&<p className="noata-practice-feedback">{answers[i]===q.answer?t("صحيح","Correct"):t("راجع إجابتك","Review your answer")}: {q.explanation}</p>}</fieldset>)}<div className="noata-widget-controls"><button type="button" disabled={Object.keys(answers).length!==data.questions.length} onClick={()=>setChecked(true)}>{t("تحقق من الإجابات","Check answers")}</button><button type="button" onClick={()=>{setAnswers({});setChecked(false);}}>{t("ابدأ مجددًا","Start again")}</button></div>{checked&&<p role="status">{t("إجابات صحيحة","Correct answers")}: {data.questions.filter((q,i)=>answers[i]===q.answer).length} / {data.questions.length}</p>}</>;
}
/** Native allowlist; generated payloads cannot import components or invoke actions. */
export function ResponseComponent({data}:{data:ResponseUi}){
 return <section className="noata-response-component" dir="auto" aria-label={data.title}><h3>{data.title}</h3>
  {data.type==="quadratic"?<Quadratic data={data}/>:data.type==="flashcards"?<Flashcards data={data}/>:data.type==="quiz"?<Quiz data={data}/>:data.type==="steps"?<ol className="noata-guided-steps">{data.steps.map((step,i)=><li key={i}><details><summary>{step.title}</summary><p>{step.body}</p></details></li>)}</ol>:data.type==="timeline"?<ol className="noata-timeline">{data.events.map((event,i)=><li key={i}><span>{event.date}</span><h4>{event.title}</h4><p>{event.body}</p></li>)}</ol>:<div className="noata-comparison-scroll" tabIndex={0}><table><caption>{data.title}</caption><thead><tr>{data.columns.map((column,i)=><th scope="col" key={i}>{column}</th>)}</tr></thead><tbody>{data.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}
  <details className="noata-widget-fallback"><summary><FallbackLabel/></summary><p>{data.fallback}</p></details>
 </section>;
}
function FallbackLabel(){const t=useTranslation();return <>{t("شرح نصي","Text explanation")}</>;}
export function ResearchSources({research}:{research:unknown}){
 const t=useTranslation(),data=validatedResearch(research);if(!data)return null;
 if(data.status!=="complete")return <p className="noata-research-note">{t("البحث المباشر غير متاح لهذا الرد. المعلومات الحالية لم يتم التحقق منها.","Live research was unavailable for this answer. Current information has not been verified.")}</p>;
 return <details className="noata-source-collection"><summary>{t("المصادر المسترجعة","Retrieved sources")} ({data.sources.length})</summary><ol>{data.sources.map(source=><li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"><bdi>[{source.id}] {source.title}</bdi></a><small><bdi>{source.domain}</bdi>{source.published?" · "+source.published:""}</small><p>{source.excerpt}</p></li>)}</ol><p>{t("المقاطع مسترجعة من الويب؛ وجود المصدر لا يعني أن كل ادعاء في الرد مثبت.","These excerpts were retrieved from the web. A listed source does not establish every claim in the answer.")}</p></details>;
}
