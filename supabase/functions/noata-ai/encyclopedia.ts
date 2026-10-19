/** Wikipedia background lookup. NOT a freshness/news or general-web-search substitute.
 * Uses one fixed Wikimedia REST endpoint, no user-supplied URLs, no credentials.
 * All snippets are untrusted context and must be cited with their source URLs.
 */
import {conciseResearchSubject} from "./query-planning.ts";
import type {SearchPlan,Research,ResearchSource,ResearchActivity} from "./research.ts";
const API="https://en.wikipedia.org/w/rest.php/v1/search/page";
const AR_API="https://ar.wikipedia.org/w/rest.php/v1/search/page";
// Wikimedia rejects clients without an identifying User-Agent (HTTP 429/HTML),
// even when Api-User-Agent is present. Keep one descriptive UA on every call.
const WIKI_USER_AGENT="NoataAI/1.0 (https://github.com/11Mazen22/learnverse-demo; educational reference lookup)";
function excerptText(raw:unknown,max=650){
 if(typeof raw!=="string")return "";
 return raw.replace(/<[^>]*>/g,"").replace(/&amp;/g,"&").replace(/&quot;/g,'"')
  .replace(/&#0?39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">")
  .replace(/[\x00-\x1f\x7f]/g," ").replace(/\s+/g," ").trim().slice(0,max);
}
export function backgroundQuery(plan:SearchPlan):string{
 return conciseResearchSubject(plan.query).replace(/^(?:(?:ok(?:ay)?|please)\s+)?(?:search|browse|research|find sources|look up|verify sources)\s+(?:the\s+web\s+)?(?:for\s+)?/i,"")
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
  if(/\(disambiguation\)|صفحة توضيح|disambiguation page|Wikimedia disambiguation/i.test(String(row.title)+" "+String(row.description)))continue;
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
/** A returned page must discuss the actual search subject, not just retrieval wording. */
export function relevantBackgroundSource(query:string,source:Pick<ResearchSource,"title"|"excerpt">):boolean{
 const normalize=(text:string)=>text.normalize("NFKC").toLowerCase().replace(/[\u064b-\u065f\u0670\u0640]/g,"").replace(/[أإآ]/g,"ا");
 const ignored=new Set(["the","and","for","with","using","from","about","into","that","this","sources","source","research","background","retrieved","evidence","references","على","من","في","عن","مع","مصادر","مراجع","ابحث","بحث"]);
 // Arabic searches attach conjunctions/prepositions to "ال" (والمدن، بالحياة).
 const stripPrefix=(word:string)=>word.replace(/^[وفبك]ال/,"").replace(/^ال/,"");
 const tokens=(text:string)=>(normalize(text).match(/[\p{L}\p{N}]+/gu)??[]).filter(w=>w.length>=3&&!ignored.has(w)).map(stripPrefix);
 const terms=[...new Set(tokens(conciseResearchSubject(query)))];
 if(!terms.length)return false;
 const titleTokens=new Set(tokens(source.title));
 const actual=new Set(tokens(source.title+" "+source.excerpt));
 const matched=terms.filter(term=>actual.has(term)).length;
 const required=Math.min(3,Math.max(1,Math.ceil(terms.length*0.35)));
 if(matched>=required)return true;
 // A result whose title names the subject is relevant even when a short snippet
 // does not repeat every word of a long request. Two matched terms (or a short
 // query) are still required so unrelated pages sharing one common word fail.
 const titleMatched=terms.filter(term=>titleTokens.has(term)).length;
 return titleMatched>0&&(matched>=2||terms.length<=3);
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
 url.searchParams.set("q",q);url.searchParams.set("limit","8");
 try{
  activity.push({stage:"searching",at:stamp()});opts.onStatus?.("searching");
  const response=await(opts.fetcher??fetch)(url.toString(),{
   method:"GET",redirect:"error",headers:{"Accept":"application/json","User-Agent":WIKI_USER_AGENT,"Api-User-Agent":WIKI_USER_AGENT},
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
  // Read actual lead summaries, not only search snippets. Fixed host and API
  // path, encoded canonical page key, redirects disabled, bounded responses.
  await Promise.all(sources.map(async(source)=>{
   try{
    const key=new URL(source.url).pathname.slice("/wiki/".length);
    const response=await(opts.fetcher??fetch)("https://"+source.domain+"/api/rest_v1/page/summary/"+key,{
     method:"GET",redirect:"error",headers:{Accept:"application/json","User-Agent":WIKI_USER_AGENT,"Api-User-Agent":WIKI_USER_AGENT},
     signal:AbortSignal.any([opts.signal,AbortSignal.timeout(4500)])
    });
    if(!response.ok||!response.body||!response.headers.get("content-type")?.includes("application/json"))return;
    const reader=response.body.getReader(),decoder=new TextDecoder();let body="",size=0;
    try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>64000)throw Error("SUMMARY_LIMIT");body+=decoder.decode(part.value,{stream:true});}body+=decoder.decode();}
    finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
    const summary=JSON.parse(body);
    if(summary.type!=="standard"||summary.lang!==lang)return;
    const canonical=summary.content_urls?.desktop?.page;
    if(typeof canonical!=="string"||new URL(canonical).hostname!==source.domain||decodeURIComponent(new URL(canonical).pathname)!==decodeURIComponent(new URL(source.url).pathname))return;
    const lead=excerptText(summary.extract,2000);
    if(lead.length>source.excerpt.length){source.excerpt=lead;source.retrievedAt=stamp();}
   }catch{opts.signal.throwIfAborted();/* Preserve the actual search excerpt if a lead cannot be read. */}
  }));

  // Read a bounded article extract for the leading relevant topic. A lead alone
  // cannot support a detailed mechanism, balanced equation or worked explanation.
  const leading=sources.find(source=>relevantBackgroundSource(q,source));
  if(leading)try{
   const title=decodeURIComponent(new URL(leading.url).pathname.slice("/wiki/".length)).replaceAll("_"," ");
   const articleUrl=new URL("https://"+leading.domain+"/w/api.php");
   for(const [key,value] of Object.entries({action:"query",prop:"extracts",titles:title,format:"json",formatversion:"2",explaintext:"1",exchars:"10000"}))articleUrl.searchParams.set(key,value);
   const response=await(opts.fetcher??fetch)(articleUrl.toString(),{method:"GET",redirect:"error",headers:{Accept:"application/json","User-Agent":WIKI_USER_AGENT,"Api-User-Agent":WIKI_USER_AGENT},signal:AbortSignal.any([opts.signal,AbortSignal.timeout(6000)])});
   if(response.ok&&response.body&&response.headers.get("content-type")?.includes("application/json")){
    const reader=response.body.getReader(),decoder=new TextDecoder();let body="",size=0;
    try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>96000)throw Error("ARTICLE_LIMIT");body+=decoder.decode(part.value,{stream:true});}body+=decoder.decode();}
    finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
    const pages=JSON.parse(body)?.query?.pages;
    const page=Array.isArray(pages)&&pages.length===1?pages[0]:null;
    if(page&&page.missing!==true&&typeof page.title==="string"&&page.title.replaceAll("_"," ")===title){
     const extract=excerptText(page.extract,10000);
     if(extract.length>leading.excerpt.length){leading.excerpt=extract;leading.retrievedAt=stamp();}
    }
   }
  }catch{opts.signal.throwIfAborted();/* Keep actual lead evidence; never invent missing article text. */}
  const relevant=sources.filter(source=>relevantBackgroundSource(q,source)).map((source,index)=>({...source,id:index+1}));
  return relevant.length?result("complete","encyclopedia_background",relevant):result("failed","no_relevant_encyclopedia_sources");
 }catch{opts.signal.throwIfAborted();return result("failed","encyclopedia_provider_unavailable");}
}
