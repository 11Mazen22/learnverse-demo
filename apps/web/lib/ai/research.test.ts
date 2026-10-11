import test from "node:test";
import assert from "node:assert/strict";
import {searchPlan,runResearch,normalizeSources,publicSourceUrl,researchContext,validatedResearch} from "../../../../supabase/functions/noata-ai/research.ts";
test("automatic research respects freshness, opt-out, basic questions and private input",()=>{
 assert.equal(searchPlan("What are the latest scientific discoveries about Mars?").needed,true);
 assert.equal(searchPlan("ابحث عن أحدث اكتشافات المريخ").needed,true);
 for(const query of ["Hello","What is 2 + 2?","Explain photosynthesis step by step.","Don't search. Explain the latest idea from memory.","Search for my password: secret","Research private@example.com"])assert.equal(searchPlan(query).needed,false,query);
 assert.equal(searchPlan("Cite the official documentation for React").needed,true);
});
test("source normalization retains actual excerpts, deduplicates and rejects unsafe links",()=>{
 for(const url of ["http://nasa.gov","https://127.0.0.1/a","https://2130706433/a","https://[::1]/a","https://metadata.internal/a","https://user:secret@nasa.gov","https://nasa.gov:8443/a","javascript:alert(1)"])assert.equal(publicSourceUrl(url),null,url);
 const data={grounding:{generic:[{url:"https://science.nasa.gov/mars/",title:"<b>Mars</b>",snippets:["Actual retrieved finding."]},{url:"https://science.nasa.gov/mars/",title:"duplicate",snippets:["Duplicate"]},{url:"https://127.0.0.1/",snippets:["private"]}]},sources:{"https://science.nasa.gov/mars/":{age:["2026-10-09"]}}};
 const sources=normalizeSources(data,"2026-10-10T23:00:00Z");assert.equal(sources.length,1);assert.equal(sources[0].title,"Mars");assert.equal(sources[0].published,"2026-10-09");assert.equal(sources[0].excerpt,"Actual retrieved finding.");
});
test("missing search configuration performs no external request and cannot fabricate citations",async()=>{
 let calls=0;
 const research=await runResearch(searchPlan("Latest Mars news"),{key:"",enabled:false,signal:new AbortController().signal,fetcher:async()=>{calls++;throw Error("must not run");}});
 assert.equal(calls,0);assert.equal(research.status,"unavailable");assert.deepEqual(research.sources,[]);assert.match(researchContext(research),/Do not invent/);
});
test("research uses the fixed provider endpoint, real lifecycle events and bounded evidence",async()=>{
 const events:string[]=[];
 const research=await runResearch(searchPlan("Research Mars"),{key:"test-only",enabled:true,signal:new AbortController().signal,onStatus:status=>events.push(status),fetcher:async(url,options)=>{
  assert.equal(url,"https://api.search.brave.com/res/v1/llm/context");assert.equal(options?.redirect,"error");assert.equal(JSON.parse(String(options?.body)).maximum_number_of_urls,5);
  return Response.json({grounding:{generic:[{url:"https://science.nasa.gov/mars/",title:"Mars",snippets:["Retrieved text"]}]}});
 }});
 assert.equal(research.status,"complete");assert.deepEqual(events,["searching","reviewing"]);assert.equal(research.sources[0].domain,"science.nasa.gov");
});

test("research activity preserves recorded stages and exact search text",async()=>{
 const result=await runResearch(searchPlan("Research orbital mechanics"),{
  key:"test",enabled:true,signal:new AbortController().signal,
  fetcher:async()=>Response.json({grounding:{generic:[{url:"https://science.nasa.gov/mars/",title:"Mars",snippets:["Observed facts"]}]}})
 });
 assert.equal(result.status,"complete");
 assert.equal(result.query,"Research orbital mechanics");
 assert.deepEqual(result.activity?.map(a=>a.stage),["searching","reviewing","complete"]);
 const validated=validatedResearch(result);
 assert.equal(validated?.activity?.length,3);
 assert.equal(validated?.sources.length,1);
});
