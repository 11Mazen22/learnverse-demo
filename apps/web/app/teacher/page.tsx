import {AppShell} from "@/components/app-shell";

export default function TeacherPage(){
 return <AppShell active="/teacher" role="teacher">
  <header className="topbar"><div><div className="eyebrow" style={{color:"#2f7cff"}}>TEACHER WORKSPACE</div><h1 style={{margin:"6px 0 0"}}>Class intelligence</h1></div><span className="pill">Evidence, not surveillance</span></header>
  <section className="grid-4"><article className="metric-card"><span>Students</span><strong>31</strong><small>Class A6</small></article><article className="metric-card"><span>Need support</span><strong>7</strong><small>3 urgent reviews</small></article><article className="metric-card"><span>Mastered</span><strong>68%</strong><small>class average</small></article><article className="metric-card"><span>Assignments</span><strong>4</strong><small>2 active</small></article></section>
  <section className="content-grid"><article className="panel"><div className="panel-head"><h2>Mastery heatmap</h2><span className="pill">Live evidence</span></div><div className="quest-list">{["Linear equations","Similarity","Energy","Logic"].map((x,i)=><div className="quest" key={x}><div className="quest-icon">{i+1}</div><div><h3>{x}</h3><p>{[6,9,4,12][i]} students need review</p><div className="progress"><i style={{width:[78,66,84,59][i]+"%"}}/></div></div><b>{[78,66,84,59][i]}%</b></div>)}</div></article><aside className="panel"><div className="panel-head"><h2>Interventions</h2><span className="pill">Explainable</span></div><p style={{color:"#6b7b92",lineHeight:1.8}}>Noata only surfaces learning evidence: repeated misconception, due review, assisted dependency, and recovery trend. It never labels a learner from one answer.</p></aside></section>
 </AppShell>;
}
