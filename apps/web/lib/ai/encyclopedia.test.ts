import test from "node:test";
import assert from "node:assert/strict";
import {searchEncyclopedia,backgroundQuery,encyclopediaSources,relevantBackgroundSource} from "../../../../supabase/functions/noata-ai/encyclopedia.ts";
import {searchPlan} from "../../../../supabase/functions/noata-ai/research.ts";
test("Background search uses the official fixed Wikipedia REST API and real citations",async()=>{
 const stages:string[]=[];
 const research=await searchEncyclopedia(searchPlan("search for astronomy"),{
  signal:new AbortController().signal,onStatus:x=>stages.push(x),
  fetcher:async(url,options)=>{
   if(String(url).includes("/api/rest_v1/page/summary/"))return Response.json({type:"standard",lang:"en",extract:"Astronomy studies celestial objects using observation and physics. ".repeat(4),content_urls:{desktop:{page:"https://en.wikipedia.org/wiki/Astronomy"}}});
   assert.match(String(url),/^https:\/\/en\.wikipedia\.org\/w\/rest\.php\/v1\/search\/page\?/);
   assert.equal(options?.redirect,"error");
   return Response.json({pages:[{key:"Astronomy",title:"Astronomy",description:"Study of celestial objects",excerpt:"<span class='searchmatch'>Astronomy</span> examines planets"}]});
  }
 });
 assert.equal(research.status,"complete");
 assert.equal(research.reason,"encyclopedia_background");
 assert.equal(research.sources[0].url,"https://en.wikipedia.org/wiki/Astronomy");
 assert.match(research.sources[0].excerpt,/celestial objects/);
 assert.deepEqual(stages,["searching","reviewing"]);
 assert.equal(backgroundQuery(searchPlan("search for astronomy")),"astronomy");
});
test("Wikipedia fallback must not claim to verify breaking news, secret queries or unsafe URLs",async()=>{
 let calls=0;
 const fetcher:typeof fetch=async()=>{calls++;throw Error("should not search");};
 const fresh=await searchEncyclopedia(searchPlan("latest Mars news"),{signal:new AbortController().signal,fetcher});
 assert.equal(fresh.status,"unavailable");assert.equal(calls,0);
 const sources=encyclopediaSources({pages:[{key:"../secret",title:"Leak",excerpt:"Bad"},{key:"safe",title:"Safe",excerpt:"A &amp; B"}]},"en");
 assert.equal(sources.length,1);assert.equal(sources[0].url,"https://en.wikipedia.org/wiki/safe");assert.equal(sources[0].excerpt,"A & B");
});

test("Unrelated disambiguation results and changed canonical pages do not contaminate evidence",async()=>{
 const pages={pages:[{key:"Photosynthesis_(disambiguation)",title:"Photosynthesis (disambiguation)",excerpt:"A song"},
 {key:"Photosynthesis",title:"Photosynthesis",excerpt:"Verified search snippet"}]};
 const sources=encyclopediaSources(pages,"en");assert.equal(sources.length,1);
 const r=await searchEncyclopedia(searchPlan("search photosynthesis"),{signal:new AbortController().signal,fetcher:async(url)=>{
  if(String(url).includes("/summary/"))return Response.json({type:"standard",lang:"en",extract:"wrong source ".repeat(100),content_urls:{desktop:{page:"https://en.wikipedia.org/wiki/Unrelated"}}});
  return Response.json(pages);
 }});
 assert.equal(r.sources[0].excerpt,"Verified search snippet");
});

test("The observed report wording cannot turn photosynthesis into unrelated chemical-element evidence",async()=>{
 assert.equal(backgroundQuery({...searchPlan("research photosynthesis"),query:"photosynthesis using retrieved background sources"}),"photosynthesis");
 assert.equal(relevantBackgroundSource("photosynthesis",{title:"Sulfur",excerpt:"A chemical element with atomic number 16."}),false);
 assert.equal(relevantBackgroundSource("photosynthesis",{title:"Chlorophyll",excerpt:"A pigment used in photosynthesis."}),true);
 assert.equal(relevantBackgroundSource("البناء الضوئي",{title:"الكلوروفيل",excerpt:"صبغة ضرورية للبناء الضوئي."}),true);
 const result=await searchEncyclopedia(searchPlan("research photosynthesis"),{signal:new AbortController().signal,fetcher:async(url)=>{
  if(String(url).includes("/summary/"))return Response.json({});
  return Response.json({pages:[{key:"Sulfur",title:"Sulfur",excerpt:"A chemical element"},{key:"Lead",title:"Lead",excerpt:"A dense metal"}]});
 }});
 assert.equal(result.status,"failed");assert.equal(result.sources.length,0);assert.equal(result.reason,"no_relevant_encyclopedia_sources");
});

test("Detailed background retrieves an actual bounded article without redirecting to arbitrary source URLs",async()=>{
 const body="Photosynthesis converts light energy. Chloroplasts contain chlorophyll. ".repeat(90);
 let articleReads=0;
 const result=await searchEncyclopedia(searchPlan("search photosynthesis"),{signal:new AbortController().signal,fetcher:async(url,options)=>{
  const address=new URL(String(url));assert.equal(address.hostname,"en.wikipedia.org");assert.equal(options?.redirect,"error");
  if(address.pathname==="/w/api.php"){articleReads++;assert.equal(address.searchParams.get("titles"),"Photosynthesis");return Response.json({query:{pages:[{title:"Photosynthesis",extract:body}]}});}
  if(address.pathname.includes("/summary/"))return Response.json({});
  return Response.json({pages:[{key:"Photosynthesis",title:"Photosynthesis",excerpt:"Photosynthesis converts light energy."}]});
 }});
 assert.equal(articleReads,1);assert.equal(result.status,"complete");assert.ok(result.sources[0].excerpt.length>2000);assert.ok(result.sources[0].excerpt.length<=10000);assert.match(result.sources[0].excerpt,/Chloroplasts/);
});
