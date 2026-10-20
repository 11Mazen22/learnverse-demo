/** LangSearch web search adapter. One fixed HTTPS endpoint, no redirects, bounded
 * bodies and a server-only credential. Results are treated as untrusted evidence.
 * Contract: https://docs.langsearch.com/reference/search-api-guide-for-coding-agents
 */
import {publicSourceUrl,type ResearchSource} from "./research.ts";

export type LangSearchOptions={
 key:string;enabled:boolean;signal:AbortSignal;fetcher?:typeof fetch;
};

const ENDPOINT="https://api.langsearch.com/v1/web-search";
const MAX_BYTES=320_000;

const plain=(value:unknown,max:number)=>typeof value==="string"
 ?value.replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"')
  .replace(/&#0?39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">")
  .replace(/[\x00-\x1f\x7f]/g," ").replace(/\s+/g," ").trim().slice(0,max)
 :"";

export function langSearchConfigured(options:Pick<LangSearchOptions,"key"|"enabled">):boolean{
 return options.enabled&&!!options.key.trim();
}
/** Brave freshness codes map onto LangSearch's documented values. */
export function langSearchFreshness(value:string|undefined):string|undefined{
 return value==="pd"?"oneDay":value==="pw"?"oneWeek":value==="pm"?"oneMonth":value==="py"?"oneYear":undefined;
}
function publishedDate(value:unknown):string|undefined{
 if(typeof value!=="string")return undefined;
 const date=new Date(value);
 return Number.isFinite(date.getTime())?date.toISOString().slice(0,10):undefined;
}
/** Validate and normalize a LangSearch payload before it can reach the model. */
export function langSearchSources(data:unknown,now=new Date().toISOString()):ResearchSource[]{
 const pages=(data as {data?:{webPages?:{value?:unknown}}})?.data?.webPages?.value;
 if(!Array.isArray(pages))return [];
 const results:ResearchSource[]=[],seen=new Set<string>();
 for(const item of pages.slice(0,10)){
  if(!item||typeof item!=="object")continue;
  const row=item as Record<string,unknown>;
  const url=publicSourceUrl(row.url);
  if(!url||seen.has(url))continue;
  const host=new URL(url).hostname;
  const title=plain(row.name,180)||host;
  const excerpt=plain(row.text??row.snippet,1800);
  if(!excerpt)continue;
  seen.add(url);
  const published=publishedDate(row.datePublished);
  results.push({id:results.length+1,title,url,domain:host,excerpt,retrievedAt:now,...(published?{published}:{})});
  if(results.length===5)break;
 }
 return results;
}
/** Perform one bounded search. The caller owns provider selection, quota and scope. */
export async function searchLangSearch(query:string,freshness:string|undefined,options:LangSearchOptions):Promise<ResearchSource[]>{
 if(!langSearchConfigured(options))throw Error("not_configured");
 const signal=AbortSignal.any([options.signal,AbortSignal.timeout(12_000)]);
 signal.throwIfAborted();
 const response=await (options.fetcher??fetch)(ENDPOINT,{
  method:"POST",redirect:"error",
  headers:{Authorization:"Bearer "+options.key,"Content-Type":"application/json",Accept:"application/json"},
  body:JSON.stringify({
   query:query.slice(0,400),count:6,
   ...(langSearchFreshness(freshness)?{freshness:langSearchFreshness(freshness)}:{}),
   contents:{text:{max_characters:1600}}
  }),signal
 });
 if(!response.ok||!response.body||!response.headers.get("content-type")?.includes("application/json")){
  await response.body?.cancel().catch(()=>{});throw Error("provider_unavailable");
 }
 const reader=response.body.getReader(),decoder=new TextDecoder();
 let text="",bytes=0;
 const abort=()=>void reader.cancel().catch(()=>{});
 signal.addEventListener("abort",abort,{once:true});
 try{
  for(;;){
   signal.throwIfAborted();
   const part=await reader.read();signal.throwIfAborted();
   if(part.done)break;
   bytes+=part.value.byteLength;
   if(bytes>MAX_BYTES)throw Error("response_limit");
   text+=decoder.decode(part.value,{stream:true});
  }
  return langSearchSources(JSON.parse(text+decoder.decode()));
 }finally{
  signal.removeEventListener("abort",abort);
  await reader.cancel().catch(()=>{});
  reader.releaseLock();
 }
}
