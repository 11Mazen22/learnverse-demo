/** Fanar rejects oversized request bodies with HTTP 413, and the Edge
 * Function streams the provider error straight to the learner. Every request
 * is therefore fitted to an explicit character budget before it is sent.
 *
 * The trim order is deliberate: the learner's current request and the
 * retrieved evidence matter more than earlier conversation turns, so history
 * is dropped first, evidence excerpts are shortened next, and the current
 * message is shortened only as a last resort. */

export const MODEL_REQUEST_BUDGET=20000;
export const MIN_USER_MESSAGE_CHARS=1500;
export const MIN_EVIDENCE_CHARS=600;

export type BudgetMessage={role:string;content:unknown};

const textOf=(message:BudgetMessage)=>typeof message.content==="string"?message.content:"";

export function totalChars(messages:readonly BudgetMessage[]):number{
  return messages.reduce((total,message)=>total+textOf(message).length,0);
}

/** Shorten a long message while keeping its beginning and its end, which is
 * where the request and the conclusion live. */
export function trimMessage(content:string,max:number):string{
  if(content.length<=max)return content;
  if(max<=MIN_USER_MESSAGE_CHARS)return content.slice(0,Math.max(0,max));
  const head=Math.max(500,Math.floor(max*0.6));
  const tail=Math.max(200,max-head-40);
  return content.slice(0,head)+"\n…\n"+content.slice(content.length-tail);
}

export type FittedMessages={messages:BudgetMessage[];trimmed:boolean};

/** Fit a provider request to the budget.
 * `protectedContents` are the retrieved-evidence messages that must survive
 * the reduction, identified by their exact content. */
export function fitMessages(
  messages:readonly BudgetMessage[],
  protectedContents:readonly string[]=[],
  budget:number=MODEL_REQUEST_BUDGET,
):FittedMessages{
  const list=messages.map(message=>({...message}));
  const protectedSet=new Set(protectedContents);
  const lastUser=list.findLastIndex(message=>message.role==="user");
  const isProtected=(message:BudgetMessage)=>typeof message.content==="string"&&protectedSet.has(message.content);
  const required=new Set<number>();
  list.forEach((message,index)=>{
    if(message.role==="system"||isProtected(message)||index===lastUser)required.add(index);
  });

  let size=[...required].reduce((total,index)=>total+textOf(list[index]).length,0);
  let trimmed=false;

  if(size>budget){
    // The current request and the policy are fixed; the retrieved evidence and
    // the earlier turns are what give way. The evidence is shortened first,
    // because its structure (ids, titles, links) must stay intact.
    const fixed=[...required]
      .filter(index=>index!==lastUser&&!isProtected(list[index]))
      .reduce((total,index)=>total+textOf(list[index]).length,0);
    const currentChars=lastUser>=0?textOf(list[lastUser]).length:0;
    const evidenceIndexes=[...required].filter(index=>isProtected(list[index]));
    if(evidenceIndexes.length){
      const room=Math.max(MIN_EVIDENCE_CHARS*evidenceIndexes.length,budget-fixed-currentChars);
      const per=Math.max(MIN_EVIDENCE_CHARS,Math.floor(room/evidenceIndexes.length));
      for(const index of evidenceIndexes){
        const content=textOf(list[index]);
        if(content.length>per){
          // The evidence is a JSON payload, so it is cut at the front only:
          // a head-and-tail cut would corrupt the JSON structure.
          list[index]={...list[index],content:content.slice(0,per)+"\n[evidence truncated]"};
          trimmed=true;
        }
      }
      size=[...required].reduce((total,index)=>total+textOf(list[index]).length,0);
    }
    if(size>budget&&lastUser>=0){
      // The current request is the last thing to lose content.
      const other=[...required].filter(index=>index!==lastUser).reduce((total,index)=>total+textOf(list[index]).length,0);
      const room=Math.max(MIN_USER_MESSAGE_CHARS,budget-other);
      const content=textOf(list[lastUser]);
      if(content.length>room){
        list[lastUser]={...list[lastUser],content:trimMessage(content,room)};
        trimmed=true;
        size=other+textOf(list[lastUser]).length;
      }
    }
  }

  // Fill the remaining budget with the most recent earlier turns.
  const keep=new Set(required);
  let sizeNow=[...keep].reduce((total,index)=>total+textOf(list[index]).length,0);
  for(let index=lastUser-1;index>=0;index--){
    if(keep.has(index))continue;
    const length=textOf(list[index]).length;
    if(sizeNow+length>budget)continue;
    keep.add(index);
    sizeNow+=length;
  }

  const result=list.filter((_,index)=>keep.has(index));
  return {messages:result,trimmed:trimmed||result.length!==messages.length};
}

/** Fit a provider request body to the budget without changing anything when
 * the request already fits. */
export function fitRequestBody(body:Record<string,unknown>,protectedMessages:readonly BudgetMessage[]=[]):Record<string,unknown>{
  const messages=body.messages;
  if(!Array.isArray(messages))return body;
  const list=messages as BudgetMessage[];
  const protectedContents=protectedMessages
    .map(message=>typeof message.content==="string"?message.content:"")
    .filter(content=>content.length>0);
  const fitted=fitMessages(list,protectedContents);
  if(!fitted.trimmed)return body;
  return {...body,messages:fitted.messages};
}

/** The smallest request that can still answer: the system prompt and the
 * current user message. Used as the last retry when the provider still
 * rejects the request as too large. */
export function minimalMessages(messages:readonly BudgetMessage[],budget:number=MODEL_REQUEST_BUDGET):BudgetMessage[]{
  const system=messages.filter(message=>message.role==="system");
  const lastUser=[...messages].reverse().find(message=>message.role==="user");
  const minimal=[...system];
  if(lastUser){
    const used=minimal.reduce((total,message)=>total+textOf(message).length,0);
    const room=Math.max(MIN_USER_MESSAGE_CHARS,budget-used);
    minimal.push({...lastUser,content:trimMessage(textOf(lastUser),room)});
  }
  return minimal;
}
