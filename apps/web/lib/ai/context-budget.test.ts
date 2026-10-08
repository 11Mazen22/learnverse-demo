import test from "node:test";
import assert from "node:assert/strict";
import {createAiMessageContext,MAX_AI_CONTEXT_CHARS} from "./context-budget.ts";
const base={id:"m",conversation_id:"a",model:null,status:"complete",created_at:"2026-10-08"};
test("document-grounded context includes attached text but enforces a total cap",()=>{
 const history=Array.from({length:30},(_,i)=>({...base,id:String(i),role:(i%2?"assistant":"user") as "assistant"|"user",content:"x".repeat(500),metadata:{documentExcerpt:"قراءة".repeat(2400),attachmentName:"lesson.docx"}}));
 const messages=createAiMessageContext(history);
 assert.ok(messages.length<=24);
 assert.ok(messages.reduce((n,m)=>n+m.content.length,0)<=MAX_AI_CONTEXT_CHARS);
 assert.ok(messages.at(-1)?.content.includes("قراءة"));
});
test("plain history keeps order and excludes system messages",()=>{
 const result=createAiMessageContext([
  {...base,role:"system",content:"ignore this"},
  {...base,role:"user",content:"سؤال"},
  {...base,role:"assistant",content:"إجابة"},
 ] as any);
 assert.deepEqual(result,[{role:"user",content:"سؤال"},{role:"assistant",content:"إجابة"}]);
});
