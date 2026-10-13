import test from "node:test";import assert from "node:assert/strict";
import {reducedContextRequest,requestWithContextRecovery,RECOVERY_CONTEXT_CHARS} from "../../../../supabase/functions/noata-ai/context-recovery.ts";
test("413 recovery retains current request, actual evidence and relevant previous answer unchanged",()=>{
 const system={role:"system",content:"Server policy"},original={role:"user",content:"Explain photosynthesis"},answer={role:"assistant",content:"Photosynthesis facts. ".repeat(40)},evidence={role:"user",content:"Actual retrieved excerpts [1]."},latest={role:"user",content:"Search all of this"};
 const body={model:"Fanar-C-1-8.7B",stream:true,max_tokens:4096,messages:[system,{role:"user",content:"Older topic"},{role:"assistant",content:"Old reply".repeat(700)},original,answer,{role:"user",content:"Check it"},{role:"assistant",content:"Which topic?"},evidence,latest]};
 const reduced=reducedContextRequest(body,[evidence])!;
 assert.deepEqual(reduced.messages,[system,original,answer,evidence,latest]);assert.equal(reduced.max_tokens,2048);assert.equal(reduced.model,body.model);assert.equal(reduced.stream,true);
 assert.equal(body.messages.length,9,"Original request is not mutated");
});
test("Original-file requests and evidence are never silently shortened to satisfy a budget",()=>{
 const latest={role:"user",content:"Original file source: "+"x".repeat(RECOVERY_CONTEXT_CHARS)};
 assert.equal(reducedContextRequest({messages:[{role:"system",content:"Policy"},latest],max_tokens:4096}),null);
 assert.equal(reducedContextRequest({messages:[{role:"user",content:[{type:"image_url",image_url:{url:"data:image/png;base64,fixture"}}]}]}),null);
});
test("A provider 413 gets exactly one reduced retry, with no extra retry for another failure",async()=>{
 let calls=0,recoveries=0;const body={messages:[{role:"system",content:"Policy"},{role:"user",content:"Current request"}],max_tokens:4096};
 const result=await requestWithContextRecovery(body,async request=>{calls++;if(calls===2)assert.equal(request.max_tokens,2048);return Response.json({error:"too large"},{status:413});},[],()=>recoveries++);
 assert.equal(calls,2);assert.equal(recoveries,1);assert.equal(result.status,413);
 calls=0;const forbidden=await requestWithContextRecovery(body,async()=>{calls++;return new Response(null,{status:403});});
 assert.equal(calls,1);assert.equal(forbidden.status,403);
});
test("Successful reduced response remains genuine, and an already minimal request is not repeated",async()=>{
 let calls=0;const result=await requestWithContextRecovery({messages:[{role:"user",content:"Topic"}],max_tokens:4096},async()=>++calls===1?new Response(null,{status:413}):Response.json({choices:[{message:{content:"Actual answer"}}]}));
 assert.equal(calls,2);assert.equal((await result.json()).choices[0].message.content,"Actual answer");
 calls=0;await requestWithContextRecovery({messages:[{role:"user",content:"Topic"}],max_tokens:1000},async()=>{calls++;return new Response(null,{status:413});});assert.equal(calls,1);
});
