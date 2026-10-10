import { appendDocumentContext } from "./document-text.ts";
import { appendDocumentSources } from "./multi-document.ts";
import type { Message } from "./workspace.ts";

/**
 * Bounds user-provided and retrieved document material in Fanar chat context.
 * Keeps recent exchanges, but never sends an unbounded pile of old documents.
 */
export const MAX_AI_CONTEXT_CHARS=48000;
export const MAX_AI_MESSAGES=24;
export function createAiMessageContext(history:Message[]):{role:"user"|"assistant";content:string}[]{
 let budget=MAX_AI_CONTEXT_CHARS;
 const recent=history.filter((m):m is Message & {role:"user"|"assistant"}=>m.role==="user"||m.role==="assistant").slice(-MAX_AI_MESSAGES);
 const result:{role:"user"|"assistant";content:string}[]=[];
 for(let i=recent.length-1;i>=0;i--){
  const m=recent[i];
  const raw=appendDocumentSources(appendDocumentContext(m.content,m.metadata),m.metadata?.documentSources);
  if(!budget)break;
  const content=raw.slice(0,Math.min(budget,i===recent.length-1?MAX_AI_CONTEXT_CHARS:20000));
  if(!content)continue;
  budget-=content.length;
  result.push({role:m.role,content});
 }
 return result.reverse();
}
