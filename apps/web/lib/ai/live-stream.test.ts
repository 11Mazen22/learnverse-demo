import test from "node:test";
import assert from "node:assert/strict";
import { createFanarStream } from "../../../../supabase/functions/noata-ai/streaming.ts";
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
  assert.equal(resolveAutoRoute("Write a complete research report").model,"Fanar-C-2-27B");
  assert.equal(resolveAutoRoute("Hello").model,"Fanar");
  assert.equal(resolveAutoRoute("ساعدني أكتب خطة مذاكرة").model,"Fanar");
  assert.equal(resolveAutoRoute("في العصر الحديث").model,"Fanar");
  assert.equal(resolveAutoRoute("Explain Quran",true).model,"Fanar-Oryx-IVU-2");
  assert.equal(requestLanguage("Explain this paragraph\nنص عربي طويل"),"en");
});
