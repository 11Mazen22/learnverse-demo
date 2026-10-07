import {UserMenu} from "@/components/auth/user-menu";

const links=[
  ["Overview","/","◈"],
  ["Learn","/learn","▤"],
  ["Missions","/missions","◎"],
  ["Noata AI","/ai","✦"],
  ["Progress","/progress","↗"],
  ["Rewards","/rewards","◇"]
];

export function AppShell({children,active,role="student"}:{children:React.ReactNode;active:string;role?:"student"|"teacher"|"admin"}){
  const extra=role==="admin"
    ?[["Teacher","/teacher","◫"],["Studio","/admin","▣"]]
    :role==="teacher"
      ?[["Teacher","/teacher","◫"]]
      :[];

  return <main className="noata-shell">
    <aside className="noata-sidebar">
      <div className="brand"><div className="brand-mark">N</div><div className="brand-copy"><strong>Noata</strong><span>Learn • Grow • Achieve</span></div></div>
      <div className="nav-group"><div className="nav-title">Learning OS</div>
        {[...links,...extra].map(([label,href,icon])=><a className={"nav-link "+(active===href?"active":"")} href={href} key={href}><span>{icon}</span>{label}</a>)}
      </div>
      <div style={{marginTop:"auto",padding:"16px 12px",color:"#7990b3",fontSize:11,lineHeight:1.7}}>
        Noata v1<br/>AI-native learning system
      </div>
    </aside>
    <section className="noata-main">
      <header className="topbar">
        <a href="/learn" style={{fontWeight:900}}>Noata</a>
        <UserMenu/>
      </header>
      {children}
    </section>
  </main>;
}
