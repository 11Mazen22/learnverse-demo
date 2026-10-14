import {interactiveResponseSegments,validateResponseUi,type ResponseUi} from "./response-ui.ts";
export function graphRequested(request:string):boolean{
 const q=request.split(/Verified extracted original document content:|المحتوى الأصلي للملف:/)[0];
 if(/\b(?:do not|don't|without)\b.{0,35}\b(?:graph|chart|plot)\b|بدون رسم|من غير رسم/i.test(q))return false;
 return /\b(?:draw|plot|render|show|make|create|build|generate|display)\b[\s\S]{0,100}\b(?:graph|chart|plot)\b|\bplot\s+(?:y\s*=|points|the|these)|ارسم|رسم بياني|رسم الدالة/i.test(q);
}
export function hasActualGraph(content:string):boolean{
 return interactiveResponseSegments(content,false).some(s=>s.type==="interactive"&&["quadratic","line_chart","xy_chart"].includes(s.data.type));
}
export function resolveGraphFollowup(request:string,messages:readonly {role:string;content:unknown}[]):string{
 if(graphRequested(request))return request;
 if(!/^(?:i (?:don'?t|cannot|can'?t) see (?:it|the graph|the chart)|where (?:is|s) (?:it|the graph|the chart)|show it|لا أرى (?:الرسم|المخطط)|مش شايف(?:ه| الرسم)?)[.?!؟\s]*$/i.test(request.trim()))return request;
 const prior=messages.slice(0,-1).findLast(m=>m.role==="user"&&typeof m.content==="string"&&graphRequested(m.content));
 return prior?request+"\n\nEarlier graph request: "+String(prior.content).slice(0,5000):request;
}
/** Recovery uses only explicitly supplied coordinate pairs, never guessed measurements. */
export function literalGraph(request:string,language:"ar"|"en"):ResponseUi|null{
 if(!graphRequested(request)||!/\bpoints?\b|نقاط|النقط/i.test(request))return null;
 const pairs=[...request.matchAll(/\(\s*([+-]?\d+(?:\.\d+)?)\s*[,،]\s*([+-]?\d+(?:\.\d+)?)\s*\)/g)];
 if(pairs.length<2||pairs.length>120)return null;
 const colors=[["red","أحمر"],["green","أخضر"],["blue","أزرق"],["purple","بنفسجي"],["amber","برتقالي"],["teal","فيروزي"]] as const;
 const chosen=colors.filter(([en,ar])=>new RegExp("\\b"+en+"\\b|"+ar,"i").test(request));if(chosen.length>1)return null;
 const color=chosen[0]?.[0]??"blue";
 const dash=/dashed|متقطع/i.test(request)?"dashed":/dotted|منقط|منقّط/i.test(request)?"dotted":"solid";
 const data={version:1,id:"provided_xy_points",type:"xy_chart",title:language==="ar"?"النقاط المُقدّمة":"Supplied points",fallback:language==="ar"?"الرسم يستخدم الإحداثيات المُقدّمة كما هي.":"The chart uses the supplied coordinates exactly.",xLabel:"x",yLabel:"y",dataOrigin:"provided",series:[{name:language==="ar"?"النقاط":"Points",color,dash,kind:"line",points:pairs.map(p=>({x:Number(p[1]),y:Number(p[2])}))}]};
 return validateResponseUi(data);
}
export function graphRecoveryReply(request:string,language:"ar"|"en"):string{
 const graph=literalGraph(request,language),fence=String.fromCharCode(96).repeat(3);
 if(graph)return (language==="ar"?"هذا رسم فعلي للإحداثيات التي قدّمتها.":"Here is the chart of your supplied coordinates.")+"\n\n"+fence+"noata-ui\n"+JSON.stringify(graph)+"\n"+fence;
 return language==="ar"?"لم يتم إنشاء رسم فعلي من هذا الرد. أرسل قيم س وص أو المعادلة، وحدد أسماء المحاور ووحداتها؛ لن نعرض مخططًا بقيم مختلقة.":"No chart was created from this reply. Provide the x/y values or equation, with axis names and units; a chart will not be filled with invented measurements.";
}
