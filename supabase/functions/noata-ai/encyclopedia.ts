/** Wikipedia background lookup. NOT a freshness/news or general-web-search substitute.
 * Uses one fixed Wikimedia REST endpoint, no user-supplied URLs, no credentials.
 * All snippets are untrusted context and must be cited with their source URLs.
 */
import type {SearchPlan,Research,ResearchSource,ResearchActivity} from "./research.ts";
const API="https://en.wikipedia.org/w/rest.php/v1/search/page";
const AR_API="https://ar.wikipedia.org/w/rest.php/v1/search/page";
function excerptText(raw:unknown){
 if(typeof raw!=="string")return "";
 return raw.replace(/<[^>]*>/g,"").replace(/&amp;/g,"&").replace(/&quot;/g,'"')
  .replace(/&#0?39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">")
  .replace(/[\x00-\x1f\x7f]/g," ").replace(/\s+/g," ").trim().slice(0,650);
}
export function backgroundQuery(plan:SearchPlan):string{
 return plan.query.replace(/^(?:(?:ok(?:ay)?|please)\s+)?(?:search|browse|research|find sources|look up|verify sources)\s+(?:the\s+web\s+)?(?:for\s+)?/i,"")
   .replace(/^(?:ابحث|دور|بحث)\s+(?:عن|على|في)?\s*/,"").trim().slice(0,180);
}
export function encyclopediaSources(data:unknown,lang:"ar"|"en",now=new Date().toISOString()):ResearchSource[]{
 const pages=(data as {pages?:unknown})?.pages;
 if(!Array.isArray(pages))return [];
 const result:ResearchSource[]=[],keys=new Set<string>();
 const domain=lang==="ar"?"ar.wikipedia.org":"en.wikipedia.org";
 for(const item of pages.slice(0,8)){
  if(!item||typeof item!=="object")continue;
  const row=item as Record<string,unknown>;
  if(typeof row.key!=="string"||!row.key||row.key.length>160||/[/\\?#\x00-\x1f]/.test(row.key))continue;
  const url="https://"+domain+"/wiki/"+encodeURIComponent(row.key.replace(/ /g,"_"));
  if(keys.has(url))continue;
  const title=excerptText(row.title).slice(0,140),snippet=excerptText(row.excerpt);
  const description=excerptText(row.description);
  const excerpt=(description?description+(snippet?". ":""):"")+snippet;
  if(!title||!excerpt)continue;
  keys.add(url);
  result.push({id:result.length+1,title,url,domain,excerpt:excerpt.slice(0,800),retrievedAt:now});
  if(result.length===4)break;
 }
 return result;
}
export async function searchEncyclopedia(plan:SearchPlan,opts:{
 signal:AbortSignal;fetcher?:typeof fetch;onStatus?:(status:"searching"|"reviewing")=>void
}):Promise<Research>{
 const started=Date.now(),stamp=()=>new Date().toISOString(),activity:ResearchActivity[]=[];
 const result=(status:Research["status"],reason:string,sources:ResearchSource[]=[]):Research=>({
  version:1,status,reason,query:plan.query,sources,elapsedMs:Date.now()-started,
  activity:[...activity,{stage:status,at:stamp(),...(status==="complete"?{resultCount:sources.length}:{})}]
 });
 // Never imply a fresh/current/official source search was completed using Wikipedia.
 if(!plan.needed||plan.fresh||plan.reason==="private"||plan.reason==="opt_out")
  return result("unavailable","encyclopedia_not_applicable");
 const q=backgroundQuery(plan);
 if(q.length<3||q.length>180)return result("unavailable","invalid_background_query");
 const lang=/[\u0600-\u06ff]/.test(q)?"ar":"en";
 const url=new URL(lang==="ar"?AR_API:API);
 url.searchParams.set("q",q);url.searchParams.set("limit","4");
 try{
  activity.push({stage:"searching",at:stamp()});opts.onStatus?.("searching");
  const response=await(opts.fetcher??fetch)(url.toString(),{
   method:"GET",redirect:"error",headers:{"Accept":"application/json","Api-User-Agent":"NoataAI/1.0 (https://github.com/11Mazen22/learnverse-demo; educational reference lookup)"},
   signal:AbortSignal.any([opts.signal,AbortSignal.timeout(9000)])
  });
  if(!response.ok||!response.headers.get("content-type")?.includes("application/json")||!response.body)
   return result("failed","encyclopedia_provider_error");
  const reader=response.body.getReader(),decoder=new TextDecoder();let buffer="",size=0;
  try{
   for(;;){
    const part=await reader.read();if(part.done)break;
    size+=part.value.byteLength;if(size>140000)throw Error("ENCYCLOPEDIA_RESPONSE_LIMIT");
    buffer+=decoder.decode(part.value,{stream:true});
   }
   buffer+=decoder.decode();
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  activity.push({stage:"reviewing",at:stamp()});opts.onStatus?.("reviewing");
  const sources=encyclopediaSources(JSON.parse(buffer),lang);
  return sources.length?result("complete","encyclopedia_background",sources):result("failed","no_encyclopedia_sources");
 }catch{opts.signal.throwIfAborted();return result("failed","encyclopedia_provider_unavailable");}
}
