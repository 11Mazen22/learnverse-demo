import {publicSourceUrl,type Research} from "./research.ts";
export type CitationClaim={text:string;sourceIds:number[]};
/** Syntactic provenance only. Semantic entailment still requires evidence review. */
export function citationClaims(text:string):CitationClaim[]{
 return text.replace(/```[\s\S]*?```/g,"").split(/\n\s*\n/).flatMap(block=>{
  const sourceIds=[...new Set([...block.matchAll(/\[(\d{1,2})\]/g)].map(m=>Number(m[1])))];
  return sourceIds.length?[{text:block.slice(0,3000),sourceIds}]:[];
 }).slice(0,100);
}
export function citationDestination(href:unknown,research:Research):string|null {
 const url=publicSourceUrl(href);
 return url&&research.status==="complete"&&research.sources.some(s=>publicSourceUrl(s.url)===url)?url:null;
}
export function hasUnretrievedCitation(text:string,research:Research):boolean {
 const prose=text.replace(/```[\s\S]*?```/g,"").replace(/`[^`]*`/g,"");
 const ids=new Set(research.sources.map(s=>s.id));
 if(citationClaims(prose).some(c=>c.sourceIds.some(id=>!ids.has(id))))return true;
 // Inspect inline/autolink/bare destinations, including Markdown links with labels.
 for(const match of prose.matchAll(/https?:\/\/[^\s<>"\]]+/g)){
  let url=match[0].replace(/[.,;:!?]+$/,"");
  // A Markdown delimiter may follow a URL that itself contains parentheses.
  while(!citationDestination(url,research)&&url.endsWith(")"))url=url.slice(0,-1);
  if(!citationDestination(url,research))return true;
 }
 return false;
}
