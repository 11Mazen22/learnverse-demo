/** Existing Brave integration, behind an explicit server-only adapter boundary.
 * No caller-supplied endpoint, redirects, retry billing or unbounded response bodies.
 * API contract checked against Brave's LLM Context POST reference on 2026-10-15.
 */
export type SearchProviderOptions = {
 key:string; enabled:boolean; provider?:string; signal:AbortSignal; fetcher?:typeof fetch;
};
export function searchProviderConfigured(options:Pick<SearchProviderOptions,"key"|"enabled"|"provider">):boolean {
 return options.enabled && !!options.key.trim() && (options.provider??"brave")==="brave";
}
export async function braveContext(query:string,freshness:string|undefined,options:SearchProviderOptions):Promise<unknown> {
 if(!searchProviderConfigured(options))throw Error("not_configured");
 const signal=AbortSignal.any([options.signal,AbortSignal.timeout(12_000)]);
 signal.throwIfAborted();
 const response=await (options.fetcher??fetch)("https://api.search.brave.com/res/v1/llm/context",{
  method:"POST",redirect:"error",headers:{"X-Subscription-Token":options.key,"Content-Type":"application/json",Accept:"application/json"},
  body:JSON.stringify({q:query,count:8,maximum_number_of_urls:5,maximum_number_of_tokens:2048,
   maximum_number_of_tokens_per_url:512,maximum_number_of_snippets:12,safesearch:"strict",
   enable_local:false,enable_source_metadata:true,context_threshold_mode:"strict",...(freshness?{freshness}:{})}),signal
 });
 if(!response.ok||!response.body||!response.headers.get("content-type")?.includes("application/json")){
  await response.body?.cancel().catch(()=>{});throw Error("provider_unavailable");
 }
 const reader=response.body.getReader(),decoder=new TextDecoder();let text="",bytes=0;
 // Cancelling the reader also bounds a response body that stalls after headers.
 const abort=()=>void reader.cancel().catch(()=>{});
 signal.addEventListener("abort",abort,{once:true});
 try{
  for(;;){signal.throwIfAborted();const part=await reader.read();signal.throwIfAborted();if(part.done)break;
   bytes+=part.value.byteLength;if(bytes>256_000)throw Error("response_limit");text+=decoder.decode(part.value,{stream:true});}
  return JSON.parse(text+decoder.decode());
 }finally{signal.removeEventListener("abort",abort);await reader.cancel().catch(()=>{});reader.releaseLock();}
}
