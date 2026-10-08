/** Scalable rendering of the supplied Noata cap / N / open-book identity. */
export function NoataLogo({size=44,className=""}:{size?:number;className?:string}){
 return <span className={"noata-logo "+className} style={{width:size,height:size}} aria-hidden="true">
  <img className="noata-logo-day" src="/noata-mark.svg" width={size} height={size} alt=""/>
  <img className="noata-logo-night" src="/noata-mark-light.svg" width={size} height={size} alt=""/>
 </span>;
}
