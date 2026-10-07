const items=[
  ["/","◈","Home"],
  ["/learn","▤","Learn"],
  ["/ai","✦","AI"],
  ["/progress","↗","Progress"],
  ["/rewards","◇","Rewards"]
];

export function MobileNav({active}:{active:string}){
  return <nav className="mobile-nav" aria-label="Mobile navigation">
    {items.map(([href,icon,label])=><a key={href} href={href} className={active===href?"active":""}><span>{icon}</span><small>{label}</small></a>)}
  </nav>;
}
