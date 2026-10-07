import {AppShell} from "@/components/app-shell";

const units=[
  {n:"01",title:"الحركة والقوى",progress:76,state:"Continue",skills:["السرعة","العجلة","القوى"]},
  {n:"02",title:"الطاقة والشغل",progress:44,state:"Continue",skills:["الشغل","الطاقة","القدرة"]},
  {n:"03",title:"المادة وتركيبها",progress:12,state:"Start",skills:["الذرة","الروابط","الخواص"]},
  {n:"04",title:"الأنظمة البيئية",progress:0,state:"Locked",skills:["السلاسل","التوازن","التنوع"]}
];

export default function LearnPage(){
 return <AppShell active="/learn">
  <header className="topbar"><div><div className="eyebrow" style={{color:"#2f7cff"}}>CURRICULUM MAP</div><h1 style={{margin:"6px 0 0"}}>رحلة التعلّم</h1></div><span className="pill">Integrated Science</span></header>
  <section className="panel">
    <div className="panel-head"><div><h2>الوحدة الحالية</h2><p style={{margin:"5px 0 0",color:"#6b7b92"}}>التقدم مبني على الإتقان، مش مجرد إنهاء الصفحات.</p></div><b>46%</b></div>
    <div className="progress"><i style={{width:"46%"}}/></div>
  </section>
  <section style={{display:"grid",gap:14,marginTop:18}}>
   {units.map(u=><article className="panel" key={u.n} style={{display:"grid",gridTemplateColumns:"58px 1fr auto",gap:16,alignItems:"center",opacity:u.state==="Locked"?.58:1}}>
    <div className="quest-icon">{u.n}</div>
    <div><h2 style={{margin:"0 0 5px",fontSize:17}}>{u.title}</h2><p style={{margin:0,color:"#6b7b92",fontSize:12}}>{u.skills.join(" · ")}</p><div className="progress"><i style={{width:u.progress+"%"}}/></div></div>
    <a className="btn" style={{background:u.state==="Locked"?"#eef2f7":"#102b52",color:u.state==="Locked"?"#8290a4":"white"}} href={u.state==="Locked"?"#":"/missions"}>{u.state}</a>
   </article>)}
  </section>
 </AppShell>;
}
