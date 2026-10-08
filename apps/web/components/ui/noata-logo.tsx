/** Scalable rendering of the supplied Noata cap / N / open-book identity. */
export function NoataLogo({size=44,className=""}:{size?:number;className?:string}){
 return <span className={"noata-logo "+className} style={{width:size,height:size}} aria-hidden="true">
  <img className="noata-logo-day" src="/noata-mark.svg" width={size} height={size} alt=""/>
  <img className="noata-logo-night" src="/noata-mark-light.svg" width={size} height={size} alt=""/>
 </span>;
}

/** Consistent Noata lockup: mark + wordmark + optional Arabic tagline. */
export function NoataBrand({size=40,tagline="تعلّم · انمُ · أنجز",compact=false,className=""}:{size?:number;tagline?:string|null;compact?:boolean;className?:string}){
 return <span className={"noata-brand"+(compact?" is-compact":"")+(className?" "+className:"")}>
  <span className="noata-brand-mark"><NoataLogo size={size}/></span>
  <span className="noata-brand-copy">
   <strong lang="en" dir="ltr">Noata</strong>
   {tagline&&<small>{tagline}</small>}
  </span>
 </span>;
}
