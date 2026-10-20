import test from "node:test";import assert from "node:assert/strict";
import {researchPlanningInput,plannedResearchQuery,refersToConversation,researchClarificationRequired} from "../../../../supabase/functions/noata-ai/query-planning.ts";
import {searchPlan} from "../../../../supabase/functions/noata-ai/research.ts";
test("Observed 'search all this' refers to the actual earlier subject",()=>{
 const request="Now can you search for all of this to be sure these are corrected data?";
 const context=researchPlanningInput(request,[{role:"user",content:"Talk along about Jessu"},{role:"assistant",content:"Jesus' life and teachings in Christianity."},{role:"user",content:request}]);
 assert.equal(context?.previousRequests[0],"Talk along about Jessu");
 assert.match(context?.previousAnswer??"",/Jesus/);
 const plan=plannedResearchQuery('{"query":"Jesus historical sources life teachings Christianity","needsClarification":false}',searchPlan(request));
 assert.equal(plan?.query,"Jesus historical sources life teachings Christianity");
 assert.equal(refersToConversation(request),true);
 assert.equal(plannedResearchQuery('{"query":"Now can you search all of this","needsClarification":false}',searchPlan(request)),null);
});
test("Contextual research never promotes private uploaded source text into a web query",()=>{
 assert.equal(researchPlanningInput("Search all of this",[{role:"user",content:"[FILE 1 | salaries.xlsx]\nprivate salary rows"},{role:"user",content:"Search all of this"}]),null);
 assert.equal(plannedResearchQuery('{"query":"password: secret","needsClarification":false}',searchPlan("Search")),null);
 assert.equal(plannedResearchQuery('{"query":"Jesus","needsClarification":true}',searchPlan("Search")),null);
});

import {explicitResearchQuery,contextualResearchQuery} from "../../../../supabase/functions/noata-ai/query-planning.ts";
test("Named topics survive a failed planner and relative clauses do not require previous chat context",()=>{
 const request="Search for Wikipedia background sources on photosynthesis, then create a cited PDF guide. Clearly separate claims from details that still need verification.";
 assert.equal(refersToConversation(request),false);
 assert.equal(explicitResearchQuery(request,searchPlan(request))?.query,"photosynthesis");
 assert.equal(researchPlanningInput(request,[{role:"user",content:request}])?.request,request);
 assert.equal(explicitResearchQuery("Search all of this",searchPlan("Search all of this")),null);
 assert.equal(explicitResearchQuery("Search password: private",searchPlan("Search password: private")),null);
});

test("A failed planner still resolves the live follow-up to the named previous explanation",()=>{
 const request="Now can you search for all of this to be sure these are correct data?";
 const context=researchPlanningInput(request,[{role:"user",content:"Give me a detailed English explanation of photosynthesis, about 700 words, with clear section headings."},{role:"assistant",content:"## Photosynthesis\nStudy details."},{role:"user",content:request}]);
 assert.equal(contextualResearchQuery(context,searchPlan(request))?.query,"photosynthesis");
});
test("Fallback context does not guess an older topic after an ambiguous subject change",()=>{
 const request="Search all of this";
 const context=researchPlanningInput(request,[{role:"user",content:"Explain photosynthesis"},{role:"user",content:"Now discuss a different topic"},{role:"assistant",content:"## Medical records"},{role:"user",content:request}]);
 assert.equal(contextualResearchQuery(context,searchPlan(request)),null);
 const privateContext=researchPlanningInput(request,[{role:"user",content:"Explain my uploaded patient records"},{role:"user",content:request}]);
 assert.equal(contextualResearchQuery(privateContext,searchPlan(request)),null);
 assert.equal(contextualResearchQuery(researchPlanningInput(request,[{role:"assistant",content:"## Photosynthesis"},{role:"user",content:request}]),searchPlan(request)),null);
});
test("Arabic named context and topic-preserving continuation remain bounded",()=>{
 const request="ابحث عن كل ده";
 const context=researchPlanningInput(request,[{role:"user",content:"اشرح لي البناء الضوئي بالتفصيل"},{role:"user",content:"كمل"},{role:"assistant",content:"شرح البناء الضوئي"},{role:"user",content:request}]);
 assert.equal(contextualResearchQuery(context,searchPlan(request))?.query,"البناء الضوئي");
});

test("Repeating a failed contextual verification keeps the named subject without broad guessing",()=>{
 const request="Now can you search for all of this to be sure these are correct data?";
 const context=researchPlanningInput(request,[{role:"user",content:"Give me a detailed English explanation of photosynthesis, about 700 words."},{role:"assistant",content:"## Photosynthesis"},{role:"user",content:request},{role:"assistant",content:"Which public topic should I verify?"},{role:"user",content:request}]);
 assert.equal(contextualResearchQuery(context,searchPlan(request))?.query,"photosynthesis");
 const privatePrevious=researchPlanningInput("Search all this",[{role:"user",content:"Search for my patient records"},{role:"user",content:"Search all this"}]);
 assert.equal(contextualResearchQuery(privatePrevious,searchPlan("Search all this")),null);
});

test("Research instructions are removed while the actual public topic is retained",()=>{
 const request="Research photosynthesis using retrieved background sources, then create both a PDF and an editable Word document.";
 const result=explicitResearchQuery(request,searchPlan(request));assert.equal(result?.query,"photosynthesis");
 const planned=plannedResearchQuery('{"query":"photosynthesis using reliable sources","needsClarification":false}',searchPlan(request));assert.equal(planned?.query,"photosynthesis");
});

test("common search phrasings reduce to the real topic for provider fallback",()=>{
 const cases=[
  ["Search for chocolate, then create a PDF","chocolate"],
  ["Can you look up the Ministry of Education, then make a PDF","the Ministry of Education"],
  ["Find information about cocoa production, then make a report","cocoa production"],
  ["Check online for the latest Ministry of Education updates","the latest Ministry of Education updates"],
 ] as const;
 for(const [request,expected] of cases){
  const base=searchPlan(request);
  assert.equal(base.needed,true,request);
  assert.equal(explicitResearchQuery(request,base)?.query,expected,request);
 }
});

test("A substantive Arabic research request is never replaced by a generic clarification",()=>{
 const request="تخيل أنك تعيش في زمن العباسي، كيف كانت الحياة؟ ما هي الأماكن التي كنت تزورها وماذا كان يحدث فيها؟ شارح لي عن أهمية هذه المدينة التاريخية، و ابحث لتأكد عن ذلك";
 assert.equal(searchPlan(request).needed,true);
 assert.equal(researchClarificationRequired(request),false);
 assert.equal(researchClarificationRequired("search this"),true);
 assert.equal(researchClarificationRequired("ابحث عن ذلك"),true);
});

test("A planner answer wrapped in prose or extra keys still resolves the search subject",()=>{
 const base=searchPlan("ابحث عن الشوكولاتة");
 assert.equal(plannedResearchQuery('Here is the plan: {"query":"chocolate production","needsClarification":false}',base)?.query,"chocolate production");
 assert.equal(plannedResearchQuery('{"query":"chocolate","needsClarification":false,"note":"extra"}',base)?.query,"chocolate");
 assert.equal(plannedResearchQuery('chocolate production',base)?.query,"chocolate production");
 assert.equal(plannedResearchQuery('{"query":"","needsClarification":true}',base),null);
});

test("A colloquial Arabic search keeps the topic the learner actually named",()=>{
 const request="انا قولت المنتجات الرسمى مش الورز ابحث كويس";
 const base=searchPlan(request);
 assert.equal(base.needed,true);
 assert.equal(explicitResearchQuery(request,base)?.query,"المنتجات الرسمى مش الورز");
 assert.equal(explicitResearchQuery("ابحث كويس",searchPlan("ابحث كويس")),null,"a bare command still asks for a topic");
});
