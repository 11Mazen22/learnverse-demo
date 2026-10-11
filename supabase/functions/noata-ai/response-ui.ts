export type UiBase={version:1;id:string;title:string;fallback:string};
export type ResponseUi=UiBase&(
 {type:"quadratic";a:number;b:number;c:number}|
 {type:"flashcards";cards:{front:string;back:string}[]}|
 {type:"quiz";questions:{prompt:string;choices:string[];answer:number;explanation:string}[]}|
 {type:"steps";steps:{title:string;body:string}[]}|
 {type:"timeline";events:{date:string;title:string;body:string}[]}|
 {type:"comparison";columns:string[];rows:string[][]}|
 {type:"line_chart";xLabel:string;yLabel:string;points:{label:string;value:number}[]}
);
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==="object"&&!Array.isArray(value);
const str=(value:unknown,max=1200):value is string=>typeof value==="string"&&value.trim().length>0&&value.length<=max;
const exact=(value:Record<string,unknown>,keys:string[])=>Object.keys(value).every(key=>keys.includes(key));
const array=(value:unknown,max:number):value is unknown[]=>Array.isArray(value)&&value.length>0&&value.length<=max;
export function validateResponseUi(value:unknown):ResponseUi|null{
 if(!object(value)||value.version!==1||!str(value.id,80)||!/^[a-zA-Z0-9_-]+$/.test(value.id)||!str(value.title,160)||!str(value.fallback,4000))return null;
 const keys=["version","id","type","title","fallback"];
 let valid=false;
 switch(value.type){
  case "quadratic":valid=exact(value,[...keys,"a","b","c"])&&[value.a,value.b,value.c].every(x=>typeof x==="number"&&Number.isFinite(x)&&Math.abs(x)<=20);break;
  case "line_chart":valid=exact(value,[...keys,"xLabel","yLabel","points"])&&str(value.xLabel,80)&&str(value.yLabel,80)&&array(value.points,30)&&value.points.length>=2&&value.points.every(x=>object(x)&&exact(x,["label","value"])&&str(x.label,80)&&typeof x.value==="number"&&Number.isFinite(x.value)&&Math.abs(x.value)<=1000000000);break;
  case "flashcards":valid=exact(value,[...keys,"cards"])&&array(value.cards,20)&&value.cards.every(x=>object(x)&&exact(x,["front","back"])&&str(x.front)&&str(x.back));break;
  case "quiz":valid=exact(value,[...keys,"questions"])&&array(value.questions,10)&&value.questions.every(x=>object(x)&&exact(x,["prompt","choices","answer","explanation"])&&str(x.prompt)&&str(x.explanation)&&array(x.choices,5)&&x.choices.length>=2&&x.choices.every(c=>str(c,500))&&Number.isInteger(x.answer)&&Number(x.answer)>=0&&Number(x.answer)<x.choices.length);break;
  case "steps":valid=exact(value,[...keys,"steps"])&&array(value.steps,12)&&value.steps.every(x=>object(x)&&exact(x,["title","body"])&&str(x.title,160)&&str(x.body));break;
  case "timeline":valid=exact(value,[...keys,"events"])&&array(value.events,12)&&value.events.every(x=>object(x)&&exact(x,["date","title","body"])&&str(x.date,80)&&str(x.title,160)&&str(x.body));break;
  case "comparison":valid=exact(value,[...keys,"columns","rows"])&&array(value.columns,5)&&value.columns.every(x=>str(x,160))&&array(value.rows,12)&&value.rows.every(x=>Array.isArray(x)&&x.length===(value.columns as unknown[]).length&&x.every(c=>str(c,500)));break;
 }
 return valid?value as ResponseUi:null;
}
export type ResponseSegment={type:"markdown";text:string}|{type:"interactive";data:ResponseUi}|{type:"pending"}|{type:"fallback";text:string};
/** Only closed, valid payloads reach the trusted native registry. No generated code runs. */
export function responseSegments(content:string):ResponseSegment[]{
 const output:ResponseSegment[]=[];const pattern=/^```noata-ui[^\n]*\n([\s\S]*?)^```\s*$/gm;let previous=0,match;
 while((match=pattern.exec(content))){
  if(match.index>previous)output.push({type:"markdown",text:content.slice(previous,match.index)});
  let parsed:unknown;try{if(match[1].length<=30000)parsed=JSON.parse(match[1]);}catch{}
  const data=validateResponseUi(parsed);
  output.push(data?{type:"interactive",data}:{type:"fallback",text:object(parsed)&&str(parsed.fallback,4000)?parsed.fallback:""});
  previous=pattern.lastIndex;
 }
 const remaining=content.slice(previous),pending=remaining.search(/^```noata-ui\b/m);
 if(pending>=0){if(pending)output.push({type:"markdown",text:remaining.slice(0,pending)});output.push({type:"pending"});}
 else if(remaining)output.push({type:"markdown",text:remaining});
 return output;
}

/** Recover a *completed* simple front/back list if a provider missed noata-ui.
 * Never interpret code or arbitrary paragraphs as flashcards. Rendering only;
 * originals remain intact for copy/export and no synthetic learning rewards.
 */
export function repairPlainFlashcards(content:string):{before:string;after:string;data:Extract<ResponseUi,{type:"flashcards"}>}|null {
 if(content.length>11000||/```/.test(content)||/<(?:script|style|iframe)/i.test(content))return null;
 const lines=content.replace(/\r\n?/g,"\n").split("\n");
 const front=/^(?:[-*]\s*)?(?:Front|Question|السؤال|وجه البطاقة|الوجه الأمامي)\s*:\s*(.{1,1200})$/i;
 const back=/^(?:[-*]\s*)?(?:Back|Answer|الإجابة|الجواب|الوجه الخلفي)\s*:\s*(.{1,1200})$/i;
 const normalize=(line:string)=>line.trim().replace(/\*\*/g,"").trim();
 const cards:{front:string;back:string}[]=[];
 let start=-1,end=-1;
 for(let i=0;i<lines.length;i++){
  const first=front.exec(normalize(lines[i]));
  if(!first)continue;
  const next=lines.findIndex((line,j)=>j>i&&j<=i+3&&Boolean(normalize(line)));
  if(next<0||next>i+3)return null;
  const second=back.exec(normalize(lines[next]));
  if(!second||!first[1].trim()||!second[1].trim())return null;
  if(start<0)start=i;
  cards.push({front:first[1].trim(),back:second[1].trim()});
  i=next;end=next+1;
  if(cards.length>20)return null;
 }
 if(cards.length<2||start<0)return null;
 const lang=/[\u0600-\u06FF]/.test(cards.map(x=>x.front+x.back).join(" "))?"ar":"en";
 return {before:lines.slice(0,start).join("\n").trim(),after:lines.slice(end).join("\n").trim(),
  data:{version:1,id:"repaired-flashcards",type:"flashcards",
   title:lang==="ar"?"بطاقات مراجعة تفاعلية":"Interactive study cards",
   fallback:cards.map(c=>"Front: "+c.front+" | Back: "+c.back).join("\n"),cards}};
}

/** Only a literal two-column Markdown table with factual numeric time-series data
 * can be recovered as a chart. Never infer or synthesize missing measurements.
 */
export function repairTabularSeries(content:string):{before:string;after:string;data:Extract<ResponseUi,{type:"line_chart"}>}|null {
 if(content.length>13000||/```/.test(content))return null;
 const rows=content.replace(/\r\n?/g,"\n").split("\n");
 const cells=(s:string)=>s.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(v=>v.trim());
 for(let start=0;start<rows.length-3;start++){
  if(!/^\s*\|.*\|\s*$/.test(rows[start]))continue;
  const header=cells(rows[start]);if(header.length!==2)continue;
  const numericAxis=/^(?:temperature|temp|degrees|degree|°c|°f|value|reading|الحرارة|درجة الحرارة|درجة|القيمة|القراءة)/i;
  const timeAxis=/^(?:time|hour|day|date|month|year|period|week|الوقت|الزمن|الساعة|اليوم|التاريخ|الشهر|السنة)/i;
  if(!timeAxis.test(header[0])||!numericAxis.test(header[1]))continue;
  const sep=cells(rows[start+1]);if(sep.length!==2||!sep.every(x=>/^:?-{3,}:?$/.test(x)))continue;
  const points:{label:string;value:number}[]=[];let end=start+2;
  for(;end<rows.length&&/^\s*\|.*\|\s*$/.test(rows[end]);end++){
   const row=cells(rows[end]);if(row.length!==2||!row[0]||row[0].length>80||!/^[-+]?\d{1,9}(?:\.\d{1,6})?$/.test(row[1]))return null;
   const value=Number(row[1]);if(!Number.isFinite(value)||Math.abs(value)>1e9)return null;
   points.push({label:row[0],value});if(points.length>30)return null;
  }
  if(points.length<2)continue;
  return {before:rows.slice(0,start).join("\n").trim(),after:rows.slice(end).join("\n").trim(),
   data:{version:1,id:"repaired-time-series",type:"line_chart",
    title:header[1]+" — "+header[0],xLabel:header[0],yLabel:header[1],points,
    fallback:points.map(x=>x.label+": "+x.value).join("; ")}};
 }
 return null;
}
/** Recovered cards are only shown when complete; streaming stays literal. */
export function interactiveResponseSegments(content:string,streaming=false):ResponseSegment[]{
 const result=responseSegments(content);
 if(streaming||result.some(x=>x.type!=="markdown"))return result;
 const repaired=repairPlainFlashcards(content)??repairTabularSeries(content);
 if(!repaired)return result;
 return [...(repaired.before?[{type:"markdown" as const,text:repaired.before}]:[]),
  {type:"interactive" as const,data:repaired.data},
  ...(repaired.after?[{type:"markdown" as const,text:repaired.after}]:[])];
}

/** Human-readable copy/export replaces native controls with their explanation. */
export function responseText(content:string):string{
 return responseSegments(content).map(segment=>segment.type==="interactive"?segment.data.fallback:segment.type==="pending"?"":segment.text).join("\n\n").trim();
}
export function sanitizeResponseUi(content:string):string{
 return content.replace(/^```noata-ui[^\n]*\n([\s\S]*?)^```\s*$/gm,(block,raw)=>{
  let parsed:unknown;try{if(raw.length<=30000)parsed=JSON.parse(raw);}catch{}
  return validateResponseUi(parsed)?block:object(parsed)&&str(parsed.fallback,4000)?parsed.fallback:"";
 });
}
export function quadraticValues(a:number,b:number,c:number){
 const discriminant=b*b-4*a*c;
 if(a===0)return {discriminant:null,roots:b===0?[]:[-c/b],kind:b===0?(c===0?"identity":"none"):"linear"};
 return {discriminant,roots:discriminant<0?[]:discriminant===0?[-b/(2*a)]:[(-b-Math.sqrt(discriminant))/(2*a),(-b+Math.sqrt(discriminant))/(2*a)],kind:discriminant<0?"complex":discriminant===0?"repeated":"real"};
}
export const RESPONSE_UI_POLICY=`Noata has verified native interactive components. When the learner explicitly requests an interactive graph, temperature/time-series line chart, flashcards, quiz, or timeline, append one valid fenced noata-ui JSON block after your readable explanation. The website renders the JSON as real controls. Do not claim these components are unavailable, merely describe nonexistent controls, or redirect to another website. For other requests, use a component only when it genuinely helps. Never use this for greetings, exact quotations, creative poems, code-only or JSON-only requests. All blocks require version:1, an id with letters/digits/underscores, title in the user's language, and a meaningful fallback explanation. Use only these shapes:
quadratic: {version:1,id,title,fallback,type:"quadratic",a:number,b:number,c:number} (coefficients between -20 and 20)
flashcards: {...base,type:"flashcards",cards:[{front,back}]} (max 20)
quiz: {...base,type:"quiz",questions:[{prompt,choices:[string,string,...],answer:zero_based_index,explanation}]} (max 10, 2-5 choices)
steps: {...base,type:"steps",steps:[{title,body}]} (max 12)
timeline: {...base,type:"timeline",events:[{date,title,body}]} (max 12)
comparison: {...base,type:"comparison",columns:[string,...],rows:[[string,...],...]} (max 5 columns, 12 rows)\nline_chart: {...base,type:"line_chart",xLabel:"Time",yLabel:"Temperature (°C)",points:[{label:"09:00",value:21},{label:"10:00",value:24}]} (2-30 actual numeric observations)
A complete quadratic example is: \n\`\`\`noata-ui\n{"version":1,"id":"quadratic_example","title":"Explore quadratic roots","fallback":"For x squared minus 1, the roots are -1 and 1. The discriminant is 4.","type":"quadratic","a":1,"b":0,"c":-1}\n\`\`\`\nDo not add unknown fields, HTML, executable code, URLs, actions, sources or invented evidence to these payloads. Use ordinary Markdown when no interaction helps or you cannot produce a valid payload. Never invent time-series observations or chart values: if actual numbers are absent, ask for the missing data. For time-series requests with valid numeric points, use line_chart, with concise prose and exactly one block. A line_chart has a real "Download PDF" action rendered by the application. If a user asks to make a PDF and the active conversation has a chart, provide the chart instead of telling them to find a button elsewhere. Do not claim a PDF has been generated until a verified file or actual download action exists. If an action is not available, say exactly what is missing. Practice quizzes are informal and never grant grades or rewards.`;
