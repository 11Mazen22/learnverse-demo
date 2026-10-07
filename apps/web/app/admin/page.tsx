import {AppShell} from "@/components/app-shell";

export default function AdminPage(){
 return <AppShell active="/admin" role="admin">
  <header className="topbar"><div><div className="eyebrow" style={{color:"#2f7cff"}}>CONTENT STUDIO</div><h1 style={{margin:"6px 0 0"}}>Build, review, publish</h1></div><button className="btn" style={{background:"#102b52",color:"white"}}>＋ New content</button></header>
  <section className="grid-4"><article className="metric-card"><span>Drafts</span><strong>18</strong><small>6 changed today</small></article><article className="metric-card"><span>In review</span><strong>7</strong><small>needs approval</small></article><article className="metric-card"><span>Published</span><strong>143</strong><small>approved content</small></article><article className="metric-card"><span>Audit events</span><strong>52</strong><small>last 7 days</small></article></section>
  <section className="panel" style={{marginTop:18}}><div className="panel-head"><h2>Review queue</h2><span className="pill">Draft → Review → Approve → Publish</span></div>
   <div className="quest-list">{["Question variant: Energy transfer","Lesson: Similarity intuition","Boss item: Complex numbers"].map((x,i)=><div className="quest" key={x}><div className="quest-icon">{i+1}</div><div><h3>{x}</h3><p>Original content · provenance attached · automated checks passed</p></div><button className="btn" style={{background:"#eef4ff",color:"#286ee7"}}>Review</button></div>)}</div>
  </section>
 </AppShell>;
}
