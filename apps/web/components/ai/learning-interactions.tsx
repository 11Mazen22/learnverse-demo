"use client";
import {useId,useState} from "react";
import {useTranslation} from "@/lib/i18n/locale";
import type {ResponseUi} from "../../../../supabase/functions/noata-ai/response-ui.ts";
import {lineChartGeometry} from "@/lib/ai/line-chart";
type Cards=Extract<ResponseUi,{type:"flashcards"}>;
type Series=Extract<ResponseUi,{type:"line_chart"}>;
export function StudyDeck({data}:{data:Cards}){
 const t=useTranslation(),[order,setOrder]=useState(()=>data.cards.map((_,i)=>i)),[position,setPosition]=useState(0);
 const [revealed,setRevealed]=useState(false),[mastered,setMastered]=useState<number[]>([]),[reviewed,setReviewed]=useState<number[]>([]);
 const index=order[position],card=data.cards[index];
 function go(i:number){setPosition(Math.max(0,Math.min(i,order.length-1)));setRevealed(false);}
 function mark(known:boolean){
  setMastered(a=>known?[...new Set([...a,index])]:a.filter(x=>x!==index));
  setReviewed(a=>[...new Set([...a,index])]);
  if(position<order.length-1)go(position+1);
 }
 function shuffle(){
  const items=[...order];for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}
  setOrder(items);setPosition(0);setRevealed(false);
 }
 return <div className="noata-study-deck">
  <div className="noata-study-meta"><span>{t("البطاقة","Card")} {position+1}/{order.length}</span>
   <span>{t("أتقنت","Mastered")} {mastered.length} · {t("راجعت","Reviewed")} {reviewed.length}</span></div>
  <div className="noata-study-track" role="progressbar" aria-label={t("تقدم المراجعة","Review progress")} aria-valuenow={reviewed.length} aria-valuemin={0} aria-valuemax={order.length}>
   <span style={{width:100*reviewed.length/order.length+"%"}}/></div>
  <button type="button" className={"noata-flashcard noata-flip-card"+(revealed?" revealed":"")} aria-label={t("اقلب البطاقة","Flip card")}
   aria-pressed={revealed} onClick={()=>setRevealed(x=>!x)}>
    <small>{revealed?t("الإجابة","Answer"):t("السؤال","Question")}</small>
    <strong dir="auto">{revealed?card.back:card.front}</strong>
    <small>{revealed?t("اضغط لرؤية السؤال","Tap to see question"):t("اضغط لكشف الإجابة","Tap to reveal answer")}</small>
  </button>
  <div className="noata-study-review">
   <button type="button" disabled={!revealed} onClick={()=>mark(false)}>{t("أحتاج مراجعة","Review again")}</button>
   <button type="button" disabled={!revealed} className="noata-study-success" onClick={()=>mark(true)}>{t("عرفتها ✓","I knew it ✓")}</button>
  </div>
  <div className="noata-study-navigation">
   <button type="button" disabled={position===0} onClick={()=>go(position-1)}>{t("السابق","Previous")}</button>
   <button type="button" onClick={shuffle}>{t("خلط","Shuffle")}</button>
   <button type="button" disabled={position===order.length-1} onClick={()=>go(position+1)}>{t("التالي","Next")}</button>
  </div>
  {reviewed.length===order.length&&<p className="noata-study-finished" role="status">{t("أكملت الجولة","Round complete")} · {mastered.length}/{order.length} {t("متقنة","mastered")} <button type="button" onClick={()=>{setReviewed([]);setMastered([]);go(0);}}>{t("ابدأ مجددًا","Start again")}</button></p>}
  <p className="noata-widget-note">{t("تدريب غير مُقيَّم. تحقق من صحة الإجابات؛ لا تُمنح مكافآت تلقائيًا.","Ungraded practice. Verify AI answers; no automatic rewards.")}</p>
 </div>;
}
export function LineChart({data}:{data:Series}){
 const t=useTranslation(),id=useId(),[count,setCount]=useState(data.points.length),[selected,setSelected]=useState(data.points.length-1);
 const [table,setTable]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState("");
 const chart={...data,points:data.points.slice(-count)},geom=lineChartGeometry(chart),active=data.points[selected];
 const tick=Math.max(1,Math.ceil(count/7));
 async function download(){
  setBusy(true);setStatus(t("جارٍ إنشاء PDF…","Generating PDF…"));
  try{
   const response=await fetch("/api/ai/chart-pdf",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({chart:data})});
   if(!response.ok)throw Error("PDF endpoint "+response.status);
   const blob=await response.blob();
   if(blob.type!=="application/pdf"||blob.size<100)throw Error("Invalid PDF");
   const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="noata-line-chart.pdf";
   document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
   setStatus(t("تم تجهيز ملف PDF بالرسم والبيانات.","PDF generated with chart and data."));
  }catch{setStatus(t("فشل إنشاء PDF ولم يتم تجهيز ملف. حاول مرة أخرى.","PDF could not be generated; no file was created. Please retry."));}
  finally{setBusy(false);}
 }
 return <div className="noata-series">
  <div className="noata-series-insights">
   <div><small>{t("نقطة محددة","Selected point")}</small><strong>{active.value.toLocaleString()} <small>{data.yLabel}</small></strong><small>{active.label}</small></div>
   <div><small>{t("التغير الكلي","Total change")}</small><strong>{Number((data.points.at(-1)!.value-data.points[0].value).toFixed(3))}</strong></div>
  </div>
  <svg viewBox="0 0 720 350" className="noata-series-graph" role="img" aria-labelledby={id+"-title"}>
   <title id={id+"-title"}>{data.title}</title>
   <defs><linearGradient id={id+"-gradient"} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity=".22"/><stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/></linearGradient></defs>
   {Array.from({length:5},(_,i)=>{const y=geom.top+geom.height*i/4;return <g key={i}>
    <line x1={geom.left} x2={geom.left+geom.width} y1={y} y2={y} stroke="var(--line)"/>
    <text x={geom.left-8} y={y+4} textAnchor="end">{Number((geom.max-(geom.max-geom.min)*i/4).toFixed(2))}</text></g>})}
   <path d={geom.path+" L"+(geom.left+geom.width)+" "+(geom.top+geom.height)+" L"+geom.left+" "+(geom.top+geom.height)+" Z"} fill={"url(#"+id+"-gradient)"} stroke="none"/>
   <path d={geom.path} fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinejoin="round"/>
   {geom.points.map((p,i)=><g key={i}>
    {(i%tick===0||i===count-1)&&<text x={p.x} y={geom.top+geom.height+23} textAnchor="middle">{p.label}</text>}
    <circle cx={p.x} cy={p.y} r={selected===data.points.length-count+i?7:4} fill="var(--accent)" stroke="var(--surface)" strokeWidth="2"/>
   </g>)}
  </svg>
  <label className="noata-series-slider">{t("استكشف النقاط","Explore data points")}
   <input type="range" min={0} max={data.points.length-1} step={1} value={selected} onChange={e=>setSelected(Number(e.target.value))}/>
  </label>
  <div className="noata-series-actions">
   <label>{t("آخر","Last")} <select value={count} onChange={e=>setCount(Number(e.target.value))}>
    {Array.from(new Set([2,5,10,data.points.length].filter(n=>n<=data.points.length))).sort((a,b)=>a-b).map(n=><option key={n} value={n}>{n}</option>)}
   </select> {t("قياسات","points")}</label>
   <button type="button" aria-expanded={table} onClick={()=>setTable(v=>!v)}>{table?t("إخفاء الجدول","Hide table"):t("عرض البيانات","View data")}</button>
   <button type="button" disabled={busy} className="noata-chart-download" onClick={()=>void download()}>{busy?t("جارٍ إنشاء PDF…","Creating PDF…"):t("تنزيل PDF فعلي","Download PDF")}</button>
  </div>
  {table&&<div className="noata-series-table"><table><thead><tr><th>{data.xLabel}</th><th>{data.yLabel}</th></tr></thead>
   <tbody>{data.points.map((p,i)=><tr key={i}><td>{p.label}</td><td>{p.value}</td></tr>)}</tbody></table></div>}
  {status&&<p role="status" className="noata-widget-note">{status}</p>}
 </div>;
}
