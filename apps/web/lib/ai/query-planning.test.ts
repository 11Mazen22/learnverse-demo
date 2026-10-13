import test from "node:test";import assert from "node:assert/strict";
import {researchPlanningInput,plannedResearchQuery,refersToConversation} from "../../../../supabase/functions/noata-ai/query-planning.ts";
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
