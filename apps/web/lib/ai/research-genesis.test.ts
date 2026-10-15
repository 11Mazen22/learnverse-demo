import test from "node:test";
import assert from "node:assert/strict";
import {searchPlan,runResearch,validatedResearch,researchContext} from "../../../../supabase/functions/noata-ai/research.ts";
import {researchScope,encyclopediaFallbackAllowed} from "../../../../supabase/functions/noata-ai/research-policy.ts";
import {answerReviewIssue} from "../../../../supabase/functions/noata-ai/answer-quality.ts";
import {citationClaims,citationDestination} from "../../../../supabase/functions/noata-ai/citations.ts";
const payload=(url="https://science.nasa.gov/mission/artemis/",text="Retrieved mission evidence.")=>({grounding:{generic:[{url,title:"Mission update",snippets:[text]}]}});
const options={key:"test-only",enabled:true,signal:new AbortController().signal};
test("official NASA requests keep authority scope across model query rewriting",async()=>{
 const plan=searchPlan("Find the latest official NASA information about an active mission and cite sources");
 assert.deepEqual(plan.scope?.domains,["nasa.gov"]);
 const result=await runResearch({...plan,query:"Artemis mission updates"},{...options,fetcher:async(_url,init)=>{
  assert.match(JSON.parse(String(init?.body)).q,/site:nasa.gov/);
  return Response.json({grounding:{generic:[...payload().grounding.generic,...payload("https://nasa.gov.evil.org/update").grounding.generic]}});
 }});
 assert.equal(result.sources.length,1);assert.equal(result.sources[0].domain,"science.nasa.gov");
 assert.equal(encyclopediaFallbackAllowed(plan),false);
});
test("no official-domain evidence fails without replacing it with Wikipedia",async()=>{
 const result=await runResearch(searchPlan("Research official NASA findings"),{...options,fetcher:async()=>Response.json(payload("https://en.wikipedia.org/wiki/Moon"))});
 assert.equal(result.status,"failed");assert.equal(result.reason,"official_sources_not_found");assert.deepEqual(result.sources,[]);
 for(const text of ["Research NASA official sources","Cite https://www.nasa.gov/","Search today's NASA news"])
  assert.equal(encyclopediaFallbackAllowed(searchPlan(text)),false);
});
test("bounded sequential research retains sources and truthful partial failure",async()=>{
 let calls=0,claims=0;
 const result=await runResearch(searchPlan("Deep research official NASA mission evidence"),{...options,maxQueries:3,beforeQuery:async()=>{claims++;},fetcher:async()=>{
  calls++;return calls===1?Response.json(payload()):new Response("unavailable",{status:503});
 }});
 assert.equal(calls,2);assert.equal(claims,2);assert.equal(result.status,"complete");assert.equal(result.partial,true);
 assert.deepEqual(result.queries?.map(q=>q.status),["complete","failed"]);
 assert.match(researchContext(result),/partial evidence/);assert.equal(validatedResearch(result)?.partial,true);
});
test("deep requests use bounded follow-up searches; unknown provider and disabled config never call",async()=>{
 let calls=0;const fetcher:typeof fetch=async()=>{calls++;return Response.json(payload());};
 const deep=await runResearch(searchPlan("Deep research Mars"),{...options,fetcher});assert.equal(calls,3);assert.equal(deep.queries?.length,3);
 for(const config of [{provider:"other"},{enabled:false},{key:""}]){
  const result=await runResearch(searchPlan("Research Mars"),{...options,...config,fetcher});assert.equal(result.status,"unavailable");
 }
 assert.equal(calls,3);
});
test("quota rejection does not call a provider and cancellation is never a success",async()=>{
 let calls=0;
 const result=await runResearch(searchPlan("Research Mars"),{...options,beforeQuery:async()=>{throw Error("quota");},fetcher:async()=>{calls++;return Response.json(payload());}});
 assert.equal(calls,0);assert.equal(result.status,"failed");
 const controller=new AbortController();controller.abort();
 await assert.rejects(runResearch(searchPlan("Research Mars"),{...options,signal:controller.signal}));
});
test("source-specific searches and freshness use human scope; no request URL is fetched",async()=>{
 const scope=researchScope("Research https://science.nasa.gov/mission/ this week");assert.equal(scope.freshness,"pw");
 const result=await runResearch({...searchPlan("Research this week's NASA mission"),scope},{...options,fetcher:async(url,init)=>{
  assert.equal(url,"https://api.search.brave.com/res/v1/llm/context");
  assert.equal(JSON.parse(String(init?.body)).freshness,"pw");assert.equal(init?.redirect,"error");
  return Response.json(payload());
 }});assert.equal(result.status,"complete");
});
test("persisted evidence rejects duplicate identities, spoofed domains, missing dates and arbitrary fields",async()=>{
 const research=await runResearch(searchPlan("Research Mars"),{...options,fetcher:async()=>Response.json(payload())});
 const source=research.sources[0];
 const result=validatedResearch({...research,secret:"never copy",sources:[{...source,domain:"evil.org",extra:"private"},source,{...source,id:2,retrievedAt:"not a date"}]});
 assert.equal(result?.sources.length,1);assert.equal(result?.sources[0].domain,"science.nasa.gov");
 assert.equal("extra" in result!.sources[0],false);assert.equal("secret" in result!,false);
 assert.equal(validatedResearch({...research,sources:[]}),undefined);
});
test("a valid numeric citation cannot legitimize an invented Markdown destination",async()=>{
 const research=await runResearch(searchPlan("Research Mars"),{...options,fetcher:async()=>Response.json(payload())});
 assert.equal(answerReviewIssue("Research Mars","Evidence [1]. See [paper](https://invented.org/study).",research),"research_evidence");
 assert.equal(citationDestination("https://invented.org/study",research),null);
 assert.ok(citationDestination(research.sources[0].url,research));
 assert.equal(answerReviewIssue("Research Mars","Retrieved mission evidence [1].",research),null);
 assert.deepEqual(citationClaims("Claim [1].\n\nAnother claim [1] [2].").map(c=>c.sourceIds),[[1],[1,2]]);
});

