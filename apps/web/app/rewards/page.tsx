import {AppShell} from "@/components/app-shell";

const items=[
 ["Nebula Avatar","Avatar",120],
 ["Scholar Hoodie","Outfit",180],
 ["Pixel Owl","Companion",260],
 ["Deep Space","Background",220]
];

export default function RewardsPage(){
 return <AppShell active="/rewards">
  <header className="topbar"><div><div className="eyebrow" style={{color:"#2f7cff"}}>REWARDS</div><h1 style={{margin:"6px 0 0"}}>شخصيتك ومكافآتك</h1></div><div style={{display:"flex",gap:8}}><span className="pill">Lv. 12</span><span className="pill">1,840 Coins</span></div></header>
  <section className="hero" style={{minHeight:240,display:"grid",gridTemplateColumns:"1fr 260px",alignItems:"center"}}>
   <div><div className="eyebrow">YOUR SPACE</div><h2 style={{fontSize:34,margin:"8px 0"}}>ابني شخصيتك من إنجازاتك.</h2><p>XP يعبّر عن التقدم. Coins بتتجمع من إنجازات حقيقية وتُصرف على cosmetics فقط — ولا واحدة منهم تغيّر الـ mastery.</p></div>
   <div style={{height:180,borderRadius:28,background:"linear-gradient(145deg,rgba(255,255,255,.14),rgba(255,255,255,.04))",display:"grid",placeItems:"center",fontSize:72}}>◈</div>
  </section>
  <section style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:14,marginTop:18}}>{items.map(([name,type,price])=><article className="panel" key={String(name)}><div style={{height:120,borderRadius:16,background:"linear-gradient(145deg,#edf5ff,#dfeaff)",display:"grid",placeItems:"center",fontSize:44}}>◇</div><h3>{name}</h3><p style={{color:"#6b7b92",fontSize:12}}>{type}</p><button className="btn" style={{width:"100%",background:"#102b52",color:"white"}}>{price} Coins</button></article>)}</section>
 </AppShell>;
}
