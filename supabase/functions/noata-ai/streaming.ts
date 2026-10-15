import type {Research} from "./research.ts";
export const GENERATION_WINDOW_MS = 135_000;
export type StreamResult = { kind: "chat"; content: string; model: string; finishReason: string; incomplete: boolean; delivery: "streamed" | "buffered"; research?:Research;routeNote?:string; timings:{firstContentMs:number|null;totalMs:number} };
type Options = {
  model: string;
  clean: (text: string) => string;
  request: (signal: AbortSignal,emit:(data:unknown)=>void) => Promise<Response>;
  persist: (result: StreamResult | null, status?: string) => Promise<void>;
  windowMs?: number;
  heartbeatMs?: number;
  routeNote?:string;
  /** Hide a provisional draft when a final review pass will write the visible answer. */
  deferContentUntilReview?:boolean;
  unavailableContent?: (research:Research)=>string;
  prepare?: (signal:AbortSignal,emit:(data:unknown)=>void)=>Promise<Research|undefined>;
  review?: (result:StreamResult,signal:AbortSignal,emit:(data:unknown)=>void)=>Promise<string|undefined>;
};
/** Read a Fanar/OpenAI-compatible response and forward cumulative final-answer text. */
export async function readFanarTextResponse(response:Response,onContent:(content:string)=>void):Promise<{content:string;finishReason:string}>{
  if(!response.ok||!response.body)throw Error("Answer review response unavailable");
  if(!response.headers.get("content-type")?.includes("text/event-stream")){
    const data=await response.json(),content=data?.choices?.[0]?.message?.content;
    if(typeof content!=="string"||content.length>500000)throw Error("Invalid answer review response");
    onContent(content);
    return {content,finishReason:typeof data?.choices?.[0]?.finish_reason==="string"?data.choices[0].finish_reason:"stop"};
  }
  const reader=response.body.getReader(),decoder=new TextDecoder();
  let buffer="",content="",finishReason="stop",finished=false;
  const consume=(block:string)=>{
    const raw=block.split("\n").filter(line=>line.startsWith("data:")).map(line=>line.slice(5).trimStart()).join("\n").trim();
    if(!raw)return;
    if(raw==="[DONE]"){finished=true;return;}
    const data=JSON.parse(raw);
    if(data.error)throw Error("Answer review stream failed");
    const choice=data.choices?.[0];
    if(typeof choice?.delta?.content==="string"){
      content+=choice.delta.content;
      if(content.length>500000)throw Error("Answer review size limit");
      onContent(content);
    }
    if(typeof choice?.finish_reason==="string"){finishReason=choice.finish_reason;finished=true;}
  };
  try{
    while(true){
      const part=await reader.read();
      buffer+=(part.done?decoder.decode():decoder.decode(part.value,{stream:true})).replace(/\r\n?/g,"\n");
      let end:number;
      while((end=buffer.indexOf("\n\n"))>=0){consume(buffer.slice(0,end));buffer=buffer.slice(end+2);}
      if(finished)break;
      if(part.done){if(buffer.trim())consume(buffer);break;}
    }
    if(!finished||finishReason==="length"||finishReason==="content_filter"||!content.trim()){
      throw Error("Answer review stream ended before completion");
    }
    return {content,finishReason};
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
/** Return headers and a ready frame before waiting for upstream inference. */
export function createFanarStream(options: Options): ReadableStream<Uint8Array> {
  const abort = new AbortController();
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let cancelled = false;
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(), decoder = new TextDecoder();
      let output = "", buffer = "", finished = false, finishReason = "stop";
      let delivery: "streamed" | "buffered" = "streamed";
      const started=Date.now();let firstContentMs:number|null=null,research:Research|undefined,usedModel=options.model;
      const emit = (data: unknown) => { if (!cancelled) controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); };
      const result = (incomplete: boolean): StreamResult => ({ kind: "chat", content: options.clean(output), model: usedModel, finishReason, incomplete, delivery, ...(research?{research}:{}),...(options.routeNote?{routeNote:options.routeNote}:{}),timings:{firstContentMs,totalMs:Date.now()-started} });
      const deadline = setTimeout(() => abort.abort(new DOMException("Generation window elapsed", "TimeoutError")), options.windowMs ?? GENERATION_WINDOW_MS);
      const heartbeat = setInterval(() => emit({ heartbeat: true }), options.heartbeatMs ?? 10_000);
      try {
        emit({ ready: true, model: options.model,routeNote:options.routeNote });
        research=await options.prepare?.(abort.signal,emit);
        if(research)emit({research,status:"preparing"});
        if(research && research.status!=="complete" && options.unavailableContent){
          output=options.unavailableContent(research);usedModel="Noata";delivery="buffered";finished=true;finishReason="research_unavailable";firstContentMs=Date.now()-started;
          emit({content:output,model:usedModel,delivery});
        } else {
        const response = await options.request(abort.signal,emit);
        if (!response.ok || !response.body) {
          // Interpret provider failures without logging response bodies, prompts or keys.
          const rejected=await response.clone().json().catch(()=>null);
          const detail=typeof rejected?.detail==="string"?rejected.detail:typeof rejected?.error?.message==="string"?rejected.error.message:typeof rejected?.message==="string"?rejected.message:"";
          if (/not authorized|unauthorized|permission|not enabled|not allowed|access denied|additional authorization/i.test(detail))throw Error("PROVIDER_MODEL_ACCESS_DENIED");
          if (/stream/i.test(detail)&&/not support|unsupported|not available|cannot/i.test(detail))throw Error("PROVIDER_STREAM_UNSUPPORTED");
          if(Array.isArray(rejected?.detail))console.warn("Fanar validation fields",rejected.detail.flatMap((item:{loc?:unknown[]})=>(item.loc??[]).filter(x=>typeof x==="string"&&/^(body|messages|role|content|model|stream|temperature|max_tokens)$/.test(x))));
          throw Error(`PROVIDER_HTTP_${response.status}`);
        }
        if (!response.headers.get("content-type")?.includes("text/event-stream")) {
          delivery = "buffered";
          const data = await response.json();
          const candidate = data?.choices?.[0]?.message?.content;
          if (typeof candidate !== "string" || candidate.length > 500_000) {
            throw Error("Invalid buffered provider response");
          }
          output = candidate;
          const candidateFinishReason = data?.choices?.[0]?.finish_reason;
          finishReason = typeof candidateFinishReason === "string" ? candidateFinishReason : "stop";
          finished = true;
          if(output&&!options.deferContentUntilReview)firstContentMs=Date.now()-started;
          if(!options.deferContentUntilReview)emit({ content: options.clean(output), model: options.model, delivery });
        } else {
          reader = response.body.getReader();
          const frame = (block: string) => {
            const raw = block.split("\n").filter(line => line.startsWith("data:")).map(line => line.slice(5).trimStart()).join("\n").trim();
            if (!raw) return;
            if (raw === "[DONE]") { finished = true; return; }
            const data = JSON.parse(raw);
            if (data.error) throw Error("Provider stream failed");
            const choice = data.choices?.[0];
            if (typeof choice?.delta?.content === "string") {
              output += choice.delta.content;
              if(!options.deferContentUntilReview&&firstContentMs===null&&options.clean(output))firstContentMs=Date.now()-started;
              if (output.length > 500_000) throw Error("Response size limit");
              if(!options.deferContentUntilReview)emit({ content: options.clean(output), model: options.model, delivery });
            }
            if (choice?.finish_reason) { finishReason = choice.finish_reason; finished = true; }
          };
          while (!cancelled) {
            const part = await reader.read();
            if (cancelled) return;
            buffer += part.done ? decoder.decode() : decoder.decode(part.value, { stream: true });
            buffer = buffer.replace(/\r\n/g, "\n");
            if (buffer.length > 1_048_576) throw Error("Provider frame size limit");
            let end;
             while ((end = buffer.indexOf("\n\n")) >= 0) { frame(buffer.slice(0,end)); buffer = buffer.slice(end+2); }
             if (finished) break;
            if (part.done) { if (buffer.trim()) frame(buffer); break; }
          }
        }
        }
        if (cancelled) return;
        if (!finished || !options.clean(output)) throw Error("Interrupted or empty response");
        // One optional bounded review after genuine provider completion. The
        // final frame replaces the streamed draft; no second assistant row is made.
        if(finishReason!=="length"&&options.review){
          await reader?.cancel().catch(()=>{});reader?.releaseLock();reader=undefined;
          const draft=result(false);
          if(options.deferContentUntilReview)output="";
          let reviewContentEmitted=false;
          const reviewEmit=(data:unknown)=>{
            if(data&&typeof data==="object"&&typeof (data as {content?:unknown}).content==="string"){
              reviewContentEmitted=true;
              delivery="streamed";
              if(firstContentMs===null&&options.clean(String((data as {content:string}).content)))firstContentMs=Date.now()-started;
            }
            emit(data);
          };
          const revised=await options.review(draft,abort.signal,reviewEmit);
          if(typeof revised==="string"&&revised.trim()&&revised.length<=500000){
            output=revised;
            if(!reviewContentEmitted)emit({content:options.clean(output),model:usedModel,delivery});
          }else if(options.deferContentUntilReview&&!reviewContentEmitted){
            output=draft.content;
            emit({content:options.clean(output),model:usedModel,delivery});
            if(firstContentMs===null)firstContentMs=Date.now()-started;
          }
        }
        const complete = result(finishReason === "length");
        await options.persist(complete);
        emit({ ...complete, done: true });
      } catch (error) {
        if (cancelled) return;
        if (abort.signal.aborted && options.clean(output)) {
          finishReason = "timeout";
          const partial = result(true);
          await options.persist(partial).catch(() => {});
          emit({ ...partial, done: true });
        } else {
          await options.persist(null, "failed").catch(() => {});
          const code=error instanceof Error && /^(PROVIDER_HTTP_[0-9]{3}|PROVIDER_MODEL_ACCESS_DENIED|PROVIDER_STREAM_UNSUPPORTED)$/.test(error.message)?error.message:"PROVIDER_STREAM_INTERRUPTED";
          console.warn("Fanar stream failure",code);
          emit({ error: code });
        }
      } finally {
        clearTimeout(deadline); clearInterval(heartbeat);
        abort.abort();
        await reader?.cancel().catch(() => {});
        reader?.releaseLock();
        if (!cancelled) controller.close();
      }
    },
    cancel() { cancelled = true; abort.abort(); void reader?.cancel().catch(() => {}); void options.persist(null,"failed").catch(() => {}); },
  });
}
