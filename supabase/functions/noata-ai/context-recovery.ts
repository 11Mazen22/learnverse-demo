type Message={role:string;content:unknown};
type Body=Record<string,unknown>;
/** A conservative application retry budget, not a claim about a provider's token window. */
export const RECOVERY_CONTEXT_CHARS=20000;
export function reducedContextRequest(body:Body,protectedMessages:readonly Message[]=[]):Body|null{
 if(!Array.isArray(body.messages)||body.messages.some(m=>typeof m?.content!=="string"))return null;
 const messages=body.messages as Message[],lastUser=messages.findLastIndex(m=>m.role==="user"||m.role==="thinking_user");
 if(lastUser<0)return null;
 const required=new Set<number>([lastUser]);
 messages.forEach((m,i)=>{if(m.role==="system"||m.role==="thinking"||protectedMessages.some(p=>p===m||p.content===m.content))required.add(i);});
 let size=[...required].reduce((n,i)=>n+(messages[i].content as string).length,0);
 // Preserve current requests, original-file source and actual evidence in full.
 if(size>RECOVERY_CONTEXT_CHARS)return null;
 const previous=messages.findLastIndex((m,i)=>i<lastUser&&m.role==="assistant"&&(m.content as string).length>=300);
 const fallback=previous>=0?previous:messages.findLastIndex((m,i)=>i<lastUser&&m.role==="assistant");
 if(fallback>=0){
  let user=fallback-1;while(user>=0&&messages[user].role!=="user")user--;
  const related=[...(user>=0?[user]:[]),fallback].filter(i=>!required.has(i));
  const extra=related.reduce((n,i)=>n+(messages[i].content as string).length,0);
  if(size+extra<=RECOVERY_CONTEXT_CHARS){for(const i of related)required.add(i);size+=extra;}
 }
 const result={...body,messages:messages.filter((_,i)=>required.has(i)),max_tokens:Math.min(Math.max(Number(body.max_tokens)||2048,64),2048)};
 return JSON.stringify(result)===JSON.stringify(body)?null:result;
}
export async function requestWithContextRecovery(body:Body,send:(body:Body)=>Promise<Response>,protectedMessages:readonly Message[]=[],onRecovery?:()=>void):Promise<Response>{
 const response=await send(body);
 if(response.status!==413)return response;
 const reduced=reducedContextRequest(body,protectedMessages);
 if(!reduced)return response;
 await response.body?.cancel().catch(()=>{});
 onRecovery?.();
 // Exactly one retry. Provider errors and incomplete replies remain errors.
 return send(reduced);
}
