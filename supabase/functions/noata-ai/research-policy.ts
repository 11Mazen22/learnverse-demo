export type ResearchScope={domains:string[];official:boolean;deep:boolean;freshness?:"pd"|"pw"|"pm"|"py"};
/** Scope is derived from the human request before query rewriting, never page instructions. */
export function researchScope(text:string):ResearchScope {
 const official=/\b(?:official|primary sources?)\b|مصادر رسمية|المصادر الرسمية|رسمي/i.test(text);
 const domains:string[]=[];
 for(const match of text.matchAll(/https:\/\/[^\s<>"']+/g))try{
  const url=new URL(match[0]);
  if(!url.username&&!url.password&&!url.port&&/^[a-z][a-z0-9.-]*\.[a-z]{2,}$/i.test(url.hostname))domains.push(url.hostname.toLowerCase());
 }catch{/* Malformed source reference is not a fetch target. */}
 if(/\bNASA\b|ناسا/i.test(text)&&official&&!domains.length)domains.push("nasa.gov");
 const freshness=/\btoday\b|اليوم/i.test(text)?"pd":/this week|هذا الأسبوع/i.test(text)?"pw":/this year|هذا العام/i.test(text)?"py":undefined;
 return {domains:[...new Set(domains)].slice(0,3),official,deep:/\b(?:deep research|in.depth research|multiple sources|compare.+sources)\b|بحث (?:عميق|شامل)|مصادر متعددة/i.test(text),...(freshness?{freshness}:{})};
}
export function sourceMatchesScope(url:string,scope?:ResearchScope):boolean {
 if(!scope?.domains.length)return true;
 const host=new URL(url).hostname;
 return scope.domains.some(domain=>host===domain||host.endsWith("."+domain));
}
export function researchQueries(query:string,scope:ResearchScope|undefined,maxQueries:number):string[]{
 const budget=scope?.deep?Math.max(1,Math.min(3,Math.floor(maxQueries)||1)):1;
 // Remove existing site operators before applying the independently derived scope.
 const subject=query.replace(/\bsite:\S+/gi,"").trim().slice(0,400);
 const site=scope?.domains.length?" "+scope.domains.map(d=>"site:"+d).join(" OR "):"";
 const suffixes=[""," primary evidence findings"," limitations conflicting evidence"];
 return suffixes.slice(0,budget).map(suffix=>(subject+suffix+site).slice(0,600));
}
export function encyclopediaFallbackAllowed(plan:{fresh:boolean;reason:string;scope?:ResearchScope}):boolean {
 return !plan.fresh && !["private","opt_out","source"].includes(plan.reason) && !plan.scope?.official && !plan.scope?.domains.length;
}
