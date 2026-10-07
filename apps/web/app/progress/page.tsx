import {AppShell} from "@/components/app-shell";

const skills=[
 ["المعادلات الخطية",91,"Mastered"],
 ["الدوال",82,"Mixed"],
 ["التشابه",73,"Supported"],
 ["الأعداد المركبة",58,"Reteach"],
 ["الحركة",88,"Provisional"]
];

export default function ProgressPage(){
 return <AppShell active="/progress">
  <header className="topbar"><div><div className="eyebrow" style={{color:"#2f7cff"}}>MASTERY</div><h1 style={{margin:"6px 0 0"}}>تقدمك الحقيقي</h1></div><span className="pill">Evidence-based</span></header>
  <section className="grid-4">
   <article className="metric-card"><span>Mastery score</span><strong>78%</strong><small>+6% هذا الشهر</small></article>
   <article className="metric-card"><span>Review queue</span><strong>5</strong><small>2 مستحقين اليوم</small></article>
   <article className="metric-card"><span>Independent wins</span><strong>34</strong><small>بدون مساعدة</small></article>
   <article className="metric-card"><span>Assisted wins</span><strong>11</strong><small>وزن evidence أقل</small></article>
  </section>
  <section className="panel" style={{marginTop:18}}><div className="panel-head"><h2>خريطة المهارات</h2><span className="pill">Explainable</span></div>
   <div className="quest-list">{skills.map(([name,score,state])=><div className="quest" key={String(name)}><div className="quest-icon">{String(score)}</div><div><h3>{name}</h3><p>{state}</p><div className="progress"><i style={{width:String(score)+"%"}}/></div></div><b>{score}%</b></div>)}</div>
  </section>
 </AppShell>;
}
