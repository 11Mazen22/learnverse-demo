import test from "node:test";import assert from "node:assert/strict";
import {searchOpenScholarly,scholarlySources,relevantScholarlySource} from "../../../../supabase/functions/noata-ai/open-search.ts";
import {deterministicSemanticPlan} from "../../../../supabase/functions/noata-ai/semantic-plan.ts";
import {withoutChatPreamble,withoutDuplicateDocumentTitle} from "./document-source.ts";

const now="2026-10-20T00:00:00.000Z";
test("Open scholarly metadata yields real citable records for the Arabic request",()=>{
 const sources=scholarlySources({message:{items:[
  {DOI:"10.1234/abc",title:["حركة الشعوبية زمن الدولة العباسية"],abstract:"<jats:p>دراسة حول الدولة العباسية.</jats:p>",["container-title"]:["مجلة"],publisher:"دار",issued:{"date-parts":[[2022,1]]}},
  {DOI:"10.1234/def",title:["Unrelated botany"],abstract:"Plants.",["container-title"]:["J"],publisher:"P",issued:{"date-parts":[[2020]]}},
 ]}},now);
 assert.equal(sources.length,2);
 assert.equal(sources[0].url,"https://doi.org/10.1234/abc");
 assert.equal(sources[0].domain,"doi.org");
 assert.equal(sources[0].published,"2022-01-01");
 assert.ok(!sources[0].excerpt.includes("<jats:p>"));
 assert.equal(sources[1].id,2);
});
test("An unrelated scholarly record never passes the relevance filter",()=>{
 const q="الحياة اليومية والمدن الرئيسية خلال الدولة العباسية";
 assert.equal(relevantScholarlySource(q,{title:"حركة الشعوبية زمن الدولة العباسية",excerpt:"دراسة حول الدولة العباسية"}),true);
 assert.equal(relevantScholarlySource(q,{title:"Unrelated botany",excerpt:"Plants and soil."}),false);
});
test("Open scholarly search never claims freshness and never sends an empty query",async()=>{
 const calls:string[]=[];
 const fetcher=async(input:RequestInfo|URL)=>{calls.push(String(input));return new Response(JSON.stringify({message:{items:[]}}),{headers:{"Content-Type":"application/json"}});};
 const fresh=await searchOpenScholarly({needed:true,fresh:true,reason:"freshness",query:"today news"},{signal:new AbortController().signal,fetcher:fetcher as typeof fetch});
 assert.equal(fresh.status,"unavailable");
 assert.equal(fresh.reason,"open_scholarly_not_applicable");
 assert.equal(calls.length,0);
 const empty=await searchOpenScholarly({needed:true,fresh:false,reason:"explicit",query:""},{signal:new AbortController().signal,fetcher:fetcher as typeof fetch});
 assert.equal(empty.status,"unavailable");
 assert.equal(calls.length,0);
 const scoped=await searchOpenScholarly({needed:true,fresh:false,reason:"explicit",query:"معلومات من https://example.com/page",scope:{domains:["example.com"]}},{signal:new AbortController().signal,fetcher:fetcher as typeof fetch});
 assert.equal(scoped.status,"unavailable");
 assert.equal(calls.length,0);
 const official=await searchOpenScholarly({needed:true,fresh:false,reason:"explicit",query:"مصادر رسمية",scope:{official:true}},{signal:new AbortController().signal,fetcher:fetcher as typeof fetch});
 assert.equal(official.status,"unavailable");
 assert.equal(calls.length,0);
});
test("A malformed planner reply degrades to a deterministic local plan instead of failing",()=>{
 assert.deepEqual(deterministicSemanticPlan("اعمل تقرير PDF كامل لذلك"),{version:1,kind:"files",formats:["pdf"],usePrevious:true});
 assert.deepEqual(deterministicSemanticPlan("make a PDF and an Excel sheet"),{version:1,kind:"files",formats:["pdf","xlsx"],usePrevious:false});
 assert.deepEqual(deterministicSemanticPlan("what is a PDF file?"),{version:1,kind:"chat"});
 assert.deepEqual(deterministicSemanticPlan("اشرح لي الدولة العباسية"),{version:1,kind:"chat"});
});
test("A chat lead-in never reaches the generated document",()=>{
 assert.equal(withoutChatPreamble("بالتأكيد! إليك التقرير المطلوب:\n\n# العنوان\n\nالمحتوى").startsWith("# العنوان"),true);
 assert.equal(withoutChatPreamble("Certainly! Here is the report:\n\n# Title\n\nBody").startsWith("# Title"),true);
 assert.equal(withoutChatPreamble("# العنوان\n\nالمحتوى").startsWith("# العنوان"),true);
});
test("The observed production artifact loses its preamble and its duplicated title",()=>{
 const stored='<!-- noata-document-presentation {"version":1,"style":"classic","font":"noata"} -->\n\nبالتأكيد! إليك التقرير المطلوب:\n\n# الحياة في بغداد العباسية\n\nبغداد، عاصمة الدولة العباسية.\n\n## الحياة اليومية في بغداد\n\nنص.\n\n## أهمية بغداد التاريخية\n\nنص.';
 const cleaned=withoutDuplicateDocumentTitle(withoutChatPreamble(stored),"الحياة في بغداد العباسية.pdf");
 assert.equal(cleaned.includes("بالتأكيد"),false);
 assert.equal(cleaned.includes("# الحياة في بغداد العباسية"),false);
 assert.ok(cleaned.includes("## الحياة اليومية في بغداد"));
 assert.ok(cleaned.includes("## أهمية بغداد التاريخية"));
});
