export type ChatPart = { content:string; model:string; finishReason?:string; incomplete?:boolean };
/** Bound long answers to three cancellable provider requests; retain all delivered text. */
export async function continueChat(
  request:(prefix:string,model:string|undefined,pass:number)=>Promise<ChatPart>,
  signal:AbortSignal,
):Promise<ChatPart> {
  let content="",model:string|undefined;
  for(let pass=0;pass<3;pass++){
    signal.throwIfAborted();
    const part=await request(content,model,pass);
    signal.throwIfAborted();
    if(!part.content.trim())throw Error("Empty response");
    content=content ? content+"\n\n"+part.content : part.content;
    model=part.model;
    const incomplete=part.incomplete===true||part.finishReason==="length"||part.finishReason==="timeout";
    if(!incomplete)return {...part,content,incomplete:false};
    if(pass===2)return {...part,content,incomplete:true};
  }
  throw Error("Continuation did not finish");
}
