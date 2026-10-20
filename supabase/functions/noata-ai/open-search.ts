/** Open scholarly metadata search (Crossref REST API). Key-free and open.
 * One fixed host and path, no credentials, no user-supplied URLs, bounded
 * responses. Records are bibliographic metadata, never live/current news, and
 * must be presented as such.
 */
import {publicSourceUrl,type Research,type ResearchSource,type ResearchActivity} from "./research.ts";
const API="https://api.crossref.org/works";
const USER_AGENT="NoataAI/1.0 (https://github.com/11Mazen22/learnverse-demo; educational reference lookup)";
const plain=(value:unknown,max:number)=>typeof value==="string"?value.replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"')
 .replace(/&#0?39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/[\x00-\x1f\x7f]/g," ").replace(/\s+/g," ").trim().slice(0,max):"";
const year=(value:unknown):string|undefined=>{
 const parts=(value as {["date-parts"]?:number[][]})?.["date-parts"]?.[0];
 return Array.isArray(parts)&&Number.isInteger(parts[0])&&parts[0]>1400&&parts[0]<2100?String(parts[0]):undefined;
};
/** A record must actually discuss the requested subject. */
export function relevantScholarlySource(query:string,source:Pick<ResearchSource,"title"|"excerpt">):boolean{
 const normalize=(text:string)=>text.normalize("NFKC").toLowerCase().replace(/[\u064b-\u065f\u0670\u0640]/g,"").replace(/[أإآ]/g,"ا");
 const strip=(word:string)=>word.replace(/^[وفبك]ال/,"").replace(/^ال/,"");
 const ignored=new Set(["the","and","for","with","from","about","into","that","this","during","over","على","من","في","عن","مع","خلال","حول","التي","الذي"]);
 const tokens=(text:string)=>(normalize(text).match(/[\p{L}\p{N}]+/gu)??[]).filter(w=>w.length>=3&&!ignored.has(w)).map(strip);
 const terms=[...new Set(tokens(query))];
 if(!terms.length)return false;
 const titleTokens=new Set(tokens(source.title)),actual=new Set(tokens(source.title+" "+source.excerpt));
 const matched=terms.filter(term=>actual.has(term)).length;
 // Common subject words must not make an unrelated record look on-topic.
 const generic=new Set(["life","daily","main","cities","city","period","state","time","people","society","social","economic","culture","education","religion","history","حياة","يومية","مدن","رئيسية","دولة","دول","عصر","زمن","ناس","مجتمع","تاريخ"]);
 const specific=terms.filter(term=>!generic.has(term));
 if(specific.length){
  // A record must name the specific subject the request is about.
  const specificMatched=specific.filter(term=>actual.has(term)).length;
  if(!specificMatched)return false;
  const titleSpecific=specific.filter(term=>titleTokens.has(term)).length;
  return titleSpecific>0||specificMatched>=2||matched>=3;
 }
 if(matched>=Math.min(3,Math.max(1,Math.ceil(terms.length*0.35))))return true;
 const titleMatched=terms.filter(term=>titleTokens.has(term)).length;
 return titleMatched>0&&(matched>=2||terms.length<=3);
}
export function scholarlySources(data:unknown,now=new Date().toISOString()):ResearchSource[]{
 const items=(data as {message?:{items?:unknown}})?.message?.items;
 if(!Array.isArray(items))return [];
 const result:ResearchSource[]=[],seen=new Set<string>();
 for(const item of items.slice(0,10)){
  if(!item||typeof item!=="object")continue;
  const row=item as Record<string,unknown>;
  const doi=typeof row.DOI==="string"?row.DOI.trim():"";
  const title=plain(Array.isArray(row.title)?row.title[0]:row.title,220);
  if(!doi||!title||seen.has(doi))continue;
  const url=publicSourceUrl("https://doi.org/"+doi);
  if(!url)continue;
  const container=plain(Array.isArray(row["container-title"])?row["container-title"][0]:row["container-title"],140);
  const abstract=plain(row.abstract,1400);
  const publisher=plain(row.publisher,80);
  const excerpt=[abstract,container?("Published in: "+container):"",publisher?("Publisher: "+publisher):""].filter(Boolean).join("\n");
  if(!excerpt)continue;
  seen.add(doi);
  const published=year(row.issued);
  result.push({id:result.length+1,title,url,domain:"doi.org",excerpt:excerpt.slice(0,1600),retrievedAt:now,
   ...(published?{published:published+"-01-01"}:{})});
  if(result.length===5)break;
 }
 return result;
}
export async function searchOpenScholarly(plan:{needed:boolean;fresh:boolean;reason:string;query:string},opts:{
 signal:AbortSignal;fetcher?:typeof fetch;onStatus?:(status:"searching"|"reviewing")=>void
}):Promise<Research>{
 const started=Date.now(),stamp=()=>new Date().toISOString(),activity:ResearchActivity[]=[];
 const result=(status:Research["status"],reason:string,sources:ResearchSource[]=[]):Research=>({
  version:1,status,reason,query:plan.query,sources,elapsedMs:Date.now()-started,
  activity:[...activity,{stage:status,at:stamp(),...(status==="complete"?{resultCount:sources.length}:{})}]
 });
 // Bibliographic metadata never verifies breaking news or current claims.
 if(!plan.needed||plan.fresh||plan.reason==="private"||plan.reason==="opt_out")
  return result("unavailable","open_scholarly_not_applicable");
 const query=plan.query.replace(/\s+/g," ").trim().slice(0,300);
 if(query.length<3)return result("unavailable","invalid_open_scholarly_query");
 const url=new URL(API);
 url.searchParams.set("query",query);url.searchParams.set("rows","8");
 url.searchParams.set("select","DOI,title,abstract,container-title,publisher,issued,type");
 try{
  activity.push({stage:"searching",at:stamp()});opts.onStatus?.("searching");
  const response=await(opts.fetcher??fetch)(url.toString(),{
   method:"GET",redirect:"error",headers:{Accept:"application/json","User-Agent":USER_AGENT},
   signal:AbortSignal.any([opts.signal,AbortSignal.timeout(9000)])
  });
  if(!response.ok||!response.body||!response.headers.get("content-type")?.includes("application/json"))
   return result("failed","open_scholarly_provider_error");
  const reader=response.body.getReader(),decoder=new TextDecoder();let buffer="",size=0;
  try{
   for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>220000)throw Error("OPEN_SCHOLARLY_LIMIT");buffer+=decoder.decode(part.value,{stream:true});}
   buffer+=decoder.decode();
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  activity.push({stage:"reviewing",at:stamp()});opts.onStatus?.("reviewing");
  const sources=scholarlySources(JSON.parse(buffer)).filter(source=>relevantScholarlySource(query,source)).map((source,index)=>({...source,id:index+1}));
  return sources.length?result("complete","open_scholarly",sources):result("failed","no_relevant_scholarly_sources");
 }catch{opts.signal.throwIfAborted();return result("failed","open_scholarly_provider_unavailable");}
}
