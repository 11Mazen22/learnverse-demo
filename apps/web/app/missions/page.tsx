import {AppShell} from "@/components/app-shell";

export default function MissionsPage(){
 const stages=[
  {level:"1",tag:"Warm-up",title:"افهم الفكرة",desc:"سؤال مباشر يثبت إن الأساس واضح.",reward:"+10 XP"},
  {level:"2",tag:"Apply",title:"طبّقها",desc:"غيّر السياق واستخدم نفس المهارة.",reward:"+15 XP"},
  {level:"3",tag:"Challenge",title:"انقل الفهم",desc:"مسألة أصعب تحتاج اختيار الخطوة الصح.",reward:"+25 XP"}
 ];
 return <AppShell active="/missions">
  <header className="topbar"><div><div className="eyebrow" style={{color:"#2f7cff"}}>ADAPTIVE MISSION</div><h1 style={{margin:"6px 0 0"}}>Mission: الطاقة والحركة</h1></div><span className="pill">3-step progression</span></header>
  <section className="hero" style={{padding:28}}>
   <div className="eyebrow">CURRENT OBJECTIVE</div><h2 style={{fontSize:30,margin:"8px 0"}}>حوّل الفهم إلى قدرة حقيقية على الحل.</h2><p>كل مرحلة أصعب شوية. لو غلطت، Noata يحدد نقطة الضعف ويقدم Hint بدل ما يرمي عليك الإجابة.</p>
  </section>
  <section style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:16,marginTop:18}}>
   {stages.map((s,i)=><article className="panel" key={s.level} style={{position:"relative",overflow:"hidden"}}>
    <div className="quest-icon">{s.level}</div><span className="pill" style={{display:"inline-block",marginTop:16}}>{s.tag}</span>
    <h2>{s.title}</h2><p style={{color:"#6b7b92",lineHeight:1.7}}>{s.desc}</p><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:24}}><b>{s.reward}</b><button className="btn" style={{background:i===0?"#102b52":"#eef3f9",color:i===0?"#fff":"#77879c"}}>{i===0?"ابدأ":"Locked"}</button></div>
   </article>)}
  </section>
  <section className="panel" style={{marginTop:18}}><div className="panel-head"><h2>Unit Boss</h2><span className="pill">Final checkpoint</span></div><p style={{color:"#6b7b92"}}>ثلاث أسئلة متدرجة، مكافأة مرة واحدة، ومحاولة استرجاع ذكية لو النتيجة مش كاملة.</p></section>
 </AppShell>;
}
