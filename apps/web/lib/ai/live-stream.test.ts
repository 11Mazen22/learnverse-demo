import test from "node:test";
import assert from "node:assert/strict";
import { createFanarStream,readFanarTextResponse } from "../../../../supabase/functions/noata-ai/streaming.ts";
import { resolveAutoRoute, requestLanguage } from "../../../../supabase/functions/noata-ai/routing.ts";
import { parseStreamFrames } from "./workspace.ts";

function upstream() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({start(c){controller=c}});
  const encoder = new TextEncoder();
  return { response:new Response(stream,{headers:{"content-type":"text/event-stream"}}),
    write(value:string){controller.enqueue(encoder.encode(value))},close(){controller.close()} };
}
const clean = (value:string)=>value.trim();
test("the final answer stream survives split SSE frames and emits exact cumulative text",async()=>{
 const provider=upstream(),seen:string[]=[];
 const response=readFanarTextResponse(provider.response,text=>seen.push(text));
 provider.write('data: {"choices":[{"delta":{"content":"## Fi');
 provider.write('nal"}}]}\r\n\r\ndata: {"choices":[{"delta":{"content":" answer"},"finish_reason":"stop"}]}\r\n\r\n');
 provider.close();
 const final=await response;
 assert.deepEqual(seen,["## Final","## Final answer"]);
 assert.deepEqual(final,{content:"## Final answer",finishReason:"stop"});
});
test("buffered provider responses require bounded string content before emission or persistence",async()=>{
 const invalid=[null, {unexpected:"object"}, "x".repeat(500_001)];
 for(const content of invalid){
  const persisted:{result:unknown;status?:string}[]=[];
  const stream=createFanarStream({
   model:"Fanar",clean,request:async()=>new Response(JSON.stringify({choices:[{message:{content}}]}),{headers:{"content-type":"application/json"}}),
   persist:async(result,status)=>{persisted.push({result,status});}
  });
  const frames=parseStreamFrames(await new Response(stream).text()).data.map(frame=>JSON.parse(frame));
  assert.equal(frames.some(frame=>typeof frame.content==="string"),false);
  assert.equal(frames.at(-1).error,"PROVIDER_STREAM_INTERRUPTED");
  assert.deepEqual(persisted,[{result:null,status:"failed"}]);
 }
});

test("a valid buffered provider response produces one bounded completed answer",async()=>{
 let saved:any;
 const stream=createFanarStream({
  model:"Fanar",clean,
  request:async()=>new Response(JSON.stringify({choices:[{message:{content:"Buffered but valid answer"},finish_reason:"stop"}]}),{headers:{"content-type":"application/json"}}),
  persist:async(result)=>{saved=result;}
 });
 const frames=parseStreamFrames(await new Response(stream).text()).data.map(frame=>JSON.parse(frame));
 assert.equal(saved.content,"Buffered but valid answer");
 assert.equal(frames.some(frame=>frame.content==="Buffered but valid answer"),true);
 assert.equal(frames.at(-1).done,true);
 assert.equal(frames.at(-1).incomplete,false);
});

test("the answer-review reader rejects a stream that ends without an explicit completion signal",async()=>{
 const provider=upstream();
 const response=readFanarTextResponse(provider.response,()=>{});
 provider.write('data: {"choices":[{"delta":{"content":"Looks complete, but is truncated"}}]}\r\n\r\n');
 provider.close();
 await assert.rejects(response,/ended before completion/);
});

test("the answer-review reader rejects provider output truncated by token limit or content filtering",async()=>{
 for(const finishReason of ["length","content_filter"]){
  const provider=upstream();
  const response=readFanarTextResponse(provider.response,()=>{});
  provider.write(`data: {"choices":[{"delta":{"content":"Partial review"},"finish_reason":"${finishReason}"}]}\r\n\r\n`);
  provider.close();
  await assert.rejects(response,/ended before completion/);
 }
});

test("the answer-review reader accepts an explicit final finish reason or DONE marker",async()=>{
 const withFinish=upstream();
 const finished=readFanarTextResponse(withFinish.response,()=>{});
 withFinish.write('data: {"choices":[{"delta":{"content":"Final review"},"finish_reason":"stop"}]}\r\n\r\n');
 withFinish.close();
 assert.deepEqual(await finished,{content:"Final review",finishReason:"stop"});
 const withDone=upstream();
 const done=readFanarTextResponse(withDone.response,()=>{});
 withDone.write('data: {"choices":[{"delta":{"content":"Final review via DONE"}}]}\r\n\r\ndata: [DONE]\r\n\r\n');
 withDone.close();
 assert.deepEqual(await done,{content:"Final review via DONE",finishReason:"stop"});
});
test("the answer-review JSON fallback rejects truncation, empty content and non-final reasons",async()=>{
 for(const finishReason of ["length","content_filter","tool_calls"]){
  const seen:string[]=[];
  const response=Response.json({choices:[{message:{content:"Partial review"},finish_reason:finishReason}]});
  await assert.rejects(readFanarTextResponse(response,text=>seen.push(text)),/incomplete answer review/);
  assert.deepEqual(seen,[]);
 }
 for(const content of ["","   "]){
  const seen:string[]=[];
  const response=Response.json({choices:[{message:{content},finish_reason:"stop"}]});
  await assert.rejects(readFanarTextResponse(response,text=>seen.push(text)),/incomplete answer review/);
  assert.deepEqual(seen,[]);
 }
});

test("the answer-review JSON fallback accepts a valid completed answer",async()=>{
 const seen:string[]=[];
 const response=Response.json({choices:[{message:{content:"Completed JSON review"},finish_reason:"stop"}]});
 assert.deepEqual(await readFanarTextResponse(response,text=>seen.push(text)),{content:"Completed JSON review",finishReason:"stop"});
 assert.deepEqual(seen,["Completed JSON review"]);
});
test("the browser receives ready and partial text before upstream generation finishes",async()=>{
  const provider = upstream(); let completed = false;
  const stream = createFanarStream({model:"Fanar",clean,request:async()=>provider.response,persist:async()=>{completed=true}});
  const reader=stream.getReader(),decode=new TextDecoder();
  assert.match(decode.decode((await reader.read()).value),/"ready":true/);
  provider.write('data: {"choices":[{"delta":{"content":"Hello"}}]}\r\n\r\n');
  const partial=decode.decode((await reader.read()).value);
  assert.match(partial,/"content":"Hello"/);assert.equal(completed,false);
  provider.write('data: {"choices":[{"delta":{"content":" world"},"finish_reason":"stop"}]}\n\ndata: [DONE]');provider.close();
  let output=partial;
  for(;;){const chunk=await reader.read();if(chunk.done)break;output+=decode.decode(chunk.value)}
  const frames=parseStreamFrames(output).data.map(frame=>JSON.parse(frame));
  assert.equal(frames.at(-1).content,"Hello world");assert.equal(frames.at(-1).done,true);assert.equal(completed,true);
});
test("a bounded generation window preserves partial text and marks it for continuation",async()=>{
  const provider=upstream();let stored:any;
  const stream=createFanarStream({model:"Fanar",clean,windowMs:30,heartbeatMs:1000,
    request:async(signal)=>{signal.addEventListener("abort",()=>provider.close(),{once:true});return provider.response},
    persist:async(result)=>{stored=result}});
  const reader=stream.getReader(),decode=new TextDecoder();await reader.read();
  provider.write('data: {"choices":[{"delta":{"content":"A useful partial answer"}}]}\n\n');
  let text="";for(;;){const chunk=await reader.read();if(chunk.done)break;text+=decode.decode(chunk.value)}
  assert.equal(stored.incomplete,true);assert.equal(stored.finishReason,"timeout");assert.match(text,/"done":true/);
});
test("cancel aborts the upstream and never reports a complete answer",async()=>{
  const provider=upstream();let signal!:AbortSignal;const statuses:string[]=[];
  const stream=createFanarStream({model:"Fanar",clean,request:async(s)=>{signal=s;return provider.response},persist:async(_,status)=>{statuses.push(status??"complete")}});
  const reader=stream.getReader();await reader.read();await reader.cancel();
  assert.equal(signal.aborted,true);assert.ok(statuses.every(status=>status==="failed"));
});
test("finish_reason completes an answer even if the provider keeps its connection open",async()=>{
  const provider=upstream();let saved=false;
  const stream=createFanarStream({model:"Fanar",clean,windowMs:1000,request:async()=>provider.response,persist:async()=>{saved=true}});
  const reader=stream.getReader();await reader.read();
  provider.write('data: {"choices":[{"delta":{"content":"Complete"},"finish_reason":"stop"}]}\n\n');
  while(!(await reader.read()).done){}
  assert.equal(saved,true);
});
test("Auto uses task intent and language while image routing takes precedence",()=>{
  assert.equal(resolveAutoRoute("Prove this complex mathematical identity").model,"Fanar-C-2-27B");
  assert.equal(resolveAutoRoute("Write a detailed study guide of 1,500 words on photosynthesis").model,"Fanar-C-1-8.7B");
  assert.equal(resolveAutoRoute("Summarize this document\n"+"source material ".repeat(150)).model,"Fanar");
  assert.equal(resolveAutoRoute("Hello").model,"Fanar");
  assert.equal(resolveAutoRoute("ساعدني أكتب خطة مذاكرة").model,"Fanar");
  assert.equal(resolveAutoRoute("في العصر الحديث").model,"Fanar");
  assert.equal(resolveAutoRoute("Explain Quran",true).model,"Fanar-Oryx-IVU-2");
  assert.equal(requestLanguage("Explain this paragraph\nنص عربي طويل"),"en");
});
test("research state and timing evidence arrive through the same stream and persist with the answer",async()=>{
 let saved:any;
 const stream=createFanarStream({model:"Fanar",clean,prepare:async(_,emit)=>{emit({status:"searching"});return {version:1,status:"unavailable",reason:"not_configured",sources:[],elapsedMs:0};},request:async()=>Response.json({choices:[{message:{content:"Research is unavailable."},finish_reason:"stop"}]}),persist:async(result)=>{saved=result;}});
 const frames=parseStreamFrames(await new Response(stream).text()).data.map(frame=>JSON.parse(frame));
 assert.ok(frames.some(frame=>frame.status==="searching"));assert.equal(saved.research.status,"unavailable");assert.equal(saved.delivery,"buffered");assert.ok(saved.timings.firstContentMs!==null);assert.ok(saved.timings.totalMs>=saved.timings.firstContentMs);
});
test("specialist access denial is sanitized without exposing the provider body",async()=>{
 const stream=createFanarStream({model:"Fanar-Sadiq-2",clean,request:async()=>Response.json({detail:"Additional authorization required: not allowed",private:"secret-test-only"},{status:422}),persist:async()=>{}});
 const text=await new Response(stream).text();assert.match(text,/PROVIDER_MODEL_ACCESS_DENIED/);assert.ok(!text.includes("secret-test-only"));assert.ok(!text.includes("Additional authorization"));
});

test("failed retrieval cannot invoke a provider to invent current research",async()=>{
 let invoked=false,saved:any;const stream=createFanarStream({model:"Fanar",clean,prepare:async()=>({version:1,status:"unavailable",sources:[],elapsedMs:0}),unavailableContent:()=>"Live research is unavailable.",request:async()=>{invoked=true;return Response.json({});},persist:async(result)=>{saved=result;}});
 const frames=parseStreamFrames(await new Response(stream).text()).data.map(x=>JSON.parse(x));
 assert.equal(invoked,false);assert.equal(saved.model,"Noata");assert.equal(saved.finishReason,"research_unavailable");assert.equal(saved.research.status,"unavailable");assert.equal(frames.at(-1).done,true);
});

test("One completed-draft review replaces the content in the same stream and persisted row",async()=>{
 let calls=0,saved:any;
 const stream=createFanarStream({model:"Fanar",clean,request:async()=>Response.json({choices:[{message:{content:"Draft"},finish_reason:"stop"}]}),
 review:async(result,signal,emit)=>{calls++;assert.equal(result.content,"Draft");assert.equal(signal.aborted,false);emit({status:"organizing"});return "## Reviewed answer\nSource-backed content [1].";},persist:async(r)=>{saved=r;}});
 const frames=parseStreamFrames(await new Response(stream).text()).data.map(x=>JSON.parse(x));
 assert.equal(calls,1);assert.equal(saved.content,"## Reviewed answer\nSource-backed content [1].");
 assert.equal(frames.filter(x=>x.done).length,1);assert.ok(frames.some(x=>x.status==="organizing"));
});
test("review-required requests stream only the final writer's cumulative content",async()=>{
 const stream=createFanarStream({model:"Fanar",clean,deferContentUntilReview:true,
  request:async()=>Response.json({choices:[{message:{content:"Provisional draft must stay hidden."},finish_reason:"stop"}]}),
  review:async(_,__,emit)=>{emit({status:"organizing"});emit({content:"## Final"});emit({content:"## Final answer"});return "## Final answer";},
  persist:async()=>{}});
 const frames=parseStreamFrames(await new Response(stream).text()).data.map(frame=>JSON.parse(frame));
 const content=frames.filter(frame=>typeof frame.content==="string").map(frame=>frame.content);
 assert.ok(content.length>=2);
 assert.ok(content.every(text=>!text.includes("Provisional draft")));
 assert.equal(content[0],"## Final");
 assert.equal(content.at(-1),"## Final answer");
 assert.equal(frames.at(-1).done,true);
});
test("a deferred request with no applicable review restores its original answer",async()=>{
 let saved:any;
 const stream=createFanarStream({model:"Fanar",clean,deferContentUntilReview:true,
  request:async()=>Response.json({choices:[{message:{content:"Original answer"},finish_reason:"stop"}]}),
  review:async()=>undefined,persist:async(result)=>{saved=result;}});
 const frames=parseStreamFrames(await new Response(stream).text()).data.map(frame=>JSON.parse(frame));
 assert.equal(saved.content,"Original answer");
 assert.equal(frames.at(-1).content,"Original answer");
});
test("A truncated provider draft is preserved for continuation without a quality rewrite",async()=>{
 let calls=0;
 const stream=createFanarStream({model:"Fanar",clean,request:async()=>Response.json({choices:[{message:{content:"Partial draft"},finish_reason:"length"}]}),
 review:async()=>{calls++;return "replacement";},persist:async()=>{}});
 const frames=parseStreamFrames(await new Response(stream).text()).data.map(x=>JSON.parse(x));
 assert.equal(calls,0);assert.equal(frames.at(-1).incomplete,true);assert.equal(frames.at(-1).content,"Partial draft");
});

import {requestWithContextRecovery} from "../../../../supabase/functions/noata-ai/context-recovery.ts";
test("Context recovery produces one real completed streamed reply after a provider 413",async()=>{
 let calls=0,persists=0,saved:any;
 const body={messages:[{role:"user",content:"Current topic"}],max_tokens:4096};
 const stream=createFanarStream({model:"Fanar-C-1-8.7B",clean,
  request:async(signal,emit)=>requestWithContextRecovery(body,async()=>++calls===1?new Response(null,{status:413}):Response.json({choices:[{message:{content:"Actual answer from the recovered provider request."},finish_reason:"stop"}]}),[],()=>emit({status:"context_recovery"})),
  persist:async(value)=>{persists++;saved=value;}});
 const frames=parseStreamFrames(await new Response(stream).text()).data.map(x=>JSON.parse(x));
 assert.equal(calls,2);assert.equal(persists,1);assert.equal(saved.incomplete,false);
 assert.match(saved.content,/Actual answer/);assert.equal(frames.filter(x=>x.done).length,1);assert.ok(frames.some(x=>x.status==="context_recovery"));
});
