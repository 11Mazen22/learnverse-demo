import {UserMenu} from "@/components/auth/user-menu";
import {ThemeControl} from "@/components/preferences/theme-control";
import {NotificationBell} from "@/components/notifications/notification-bell";
import {MobileNav} from "@/components/mobile-nav";
import {StaffNav} from "@/components/auth/staff-nav";

const primary=[
  ["Overview","/","◈"],
  ["Learn","/learn","▤"],
  ["Missions","/missions","◎"],
  ["Review","/review","↻"],
  ["Unit Boss","/boss","◆"],
  ["Noata AI","/ai","✦"],
  ["Progress","/progress","↗"],
  ["Rewards","/rewards","◇"],
  ["Assignments","/assignments","✓"]
];

export function AppShell({children,active,role="student"}:{children:React.ReactNode;active:string;role?:"student"|"teacher"|"admin"}){
  return <main className="noata-shell">
    <aside className="noata-sidebar">
      <div className="brand">
        <div className="brand-mark">N</div>
        <div className="brand-copy"><strong>Noata</strong><span>Learn • Grow • Achieve</span></div>
      </div>

      <div className="nav-group">
        <div className="nav-title">Learning OS</div>
        {primary.map(([label,href,icon])=><a className={"nav-link "+(active===href?"active":"")} href={href} key={href}><span>{icon}</span>{label}</a>)}
      </div>

      <StaffNav active={active}/>

      <div className="nav-group" style={{marginTop:"auto"}}>
        <a className={"nav-link "+(active==="/settings"?"active":"")} href="/settings"><span>⚙</span>Settings</a>
      </div>

      <div className="sidebar-foot">Noata v1<br/>AI-native learning system<br/><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></div>
    </aside>

    <section className="noata-main" id="noata-main" tabIndex={-1}>
      <header className="topbar">
        <div>
          <a href="/" className="top-brand">Noata</a>
          <span className="top-subtitle">AI-native learning</span>
        </div>
        <div className="top-actions">
          <ThemeControl/>
          <NotificationBell/>
          <UserMenu/>
        </div>
      </header>
      {children}
    </section>

    <MobileNav active={active}/>
  </main>;
}
