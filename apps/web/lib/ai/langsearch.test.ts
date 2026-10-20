import test from "node:test";
import assert from "node:assert/strict";
import {langSearchConfigured,langSearchFreshness,langSearchSources,searchLangSearch} from "../../../../supabase/functions/noata-ai/langsearch.ts";
import {runResearch,type SearchPlan} from "../../../../supabase/functions/noata-ai/research.ts";

const now="2026-10-20T10:00:00.000Z";
const payload={data:{webPages:{value:[
 {name:"<b>Abbasid daily life</b>",url:"https://example.org/abbasid",text:"<p>Households, markets and schools in Baghdad.</p>",datePublished:"2025-03-04T00:00:00Z"},
 {name:"Duplicate",url:"https://example.org/abbasid",text:"duplicate"},
 {name:"Unsafe",url:"http://127.0.0.1/private",text:"no"},
 {name:"",url:"https://history.example.net/baghdad",snippet:"Baghdad scholars and trade."}
]}}};

test("LangSearch normalizes only safe, unique, useful sources",()=>{
 const sources=langSearchSources(payload,now);
 assert.equal(sources.length,2);
 assert.equal(sources[0]?.title,"Abbasid daily life");
 assert.equal(sources[0]?.excerpt,"Households, markets and schools in Baghdad.");
 assert.equal(sources[0]?.published,"2025-03-04");
 assert.equal(sources[1]?.title,"history.example.net");
 assert.equal(sources[1]?.domain,"history.example.net");
 assert.equal(langSearchSources({data:{webPages:{value:[]}}},now).length,0);
});
test("LangSearch requires a key and explicit enablement",()=>{
 assert.equal(langSearchConfigured({key:"",enabled:true}),false);
 assert.equal(langSearchConfigured({key:"  ",enabled:true}),false);
 assert.equal(langSearchConfigured({key:"key",enabled:false}),false);
 assert.equal(langSearchConfigured({key:"key",enabled:true}),true);
});
test("LangSearch freshness uses documented values",()=>{
 assert.equal(langSearchFreshness("pd"),"oneDay");
 assert.equal(langSearchFreshness("pw"),"oneWeek");
 assert.equal(langSearchFreshness("pm"),"oneMonth");
 assert.equal(langSearchFreshness("py"),"oneYear");
 assert.equal(langSearchFreshness(undefined),undefined);
});
test("LangSearch request is fixed-host, authenticated and bounded",async()=>{
 let called="";
 const fetcher=(async(url:RequestInfo|URL,init?:RequestInit)=>{
  called=String(url);
  assert.equal(init?.redirect,"error");
  assert.equal((init?.headers as Record<string,string>).Authorization,"Bearer secret");
  const body=JSON.parse(String(init?.body));
  assert.equal(body.query,"Abbasid Baghdad");
  assert.equal(body.count,6);
  assert.equal(body.freshness,"oneWeek");
  assert.deepEqual(body.contents,{text:{max_characters:1600}});
  return new Response(JSON.stringify(payload),{status:200,headers:{"content-type":"application/json"}});
 }) as typeof fetch;
 const sources=await searchLangSearch("Abbasid Baghdad","pw",{key:"secret",enabled:true,signal:new AbortController().signal,fetcher});
 assert.equal(called,"https://api.langsearch.com/v1/web-search");
 assert.equal(sources.length,2);
});
test("LangSearch omits an unsupported freshness value",async()=>{
 const fetcher=(async(_url:RequestInfo|URL,init?:RequestInit)=>{
  const body=JSON.parse(String(init?.body));
  assert.equal("freshness" in body,false);
  return new Response(JSON.stringify(payload),{status:200,headers:{"content-type":"application/json"}});
 }) as typeof fetch;
 await searchLangSearch("topic",undefined,{key:"secret",enabled:true,signal:new AbortController().signal,fetcher});
});
test("LangSearch refuses non-JSON and non-ok responses",async()=>{
 const htmlFetcher=(async()=>new Response("<html>rate limited</html>",{status:200,headers:{"content-type":"text/html"}})) as typeof fetch;
 await assert.rejects(searchLangSearch("topic",undefined,{key:"secret",enabled:true,signal:new AbortController().signal,fetcher:htmlFetcher}),/provider_unavailable/);
 const denied=(async()=>new Response("{}",{status:401,headers:{"content-type":"application/json"}})) as typeof fetch;
 await assert.rejects(searchLangSearch("topic",undefined,{key:"secret",enabled:true,signal:new AbortController().signal,fetcher:denied}),/provider_unavailable/);
});
test("runResearch uses LangSearch and honours a source domain scope",async()=>{
 const plan:SearchPlan={needed:true,reason:"explicit",query:"Abbasid Baghdad",fresh:false,scope:{domains:["history.example.net"],official:false,deep:false}};
 let calls=0;
 const fetcher=(async(_url:RequestInfo|URL,init?:RequestInit)=>{
  calls++;
  assert.match(String(init?.body),/site:history\.example\.net/);
  return new Response(JSON.stringify(payload),{status:200,headers:{"content-type":"application/json"}});
 }) as typeof fetch;
 const research=await runResearch(plan,{key:"secret",enabled:true,provider:"langsearch",signal:new AbortController().signal,fetcher,beforeQuery:async()=>{}});
 assert.equal(research.status,"complete");
 assert.equal(research.provider,"langsearch");
 assert.deepEqual(research.sources.map(s=>s.url),["https://history.example.net/baghdad"]);
 assert.equal(calls,1);
});
