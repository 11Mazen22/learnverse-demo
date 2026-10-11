import test from "node:test";
import assert from "node:assert/strict";
import {validateResponseUi,responseSegments,responseText,quadraticValues} from "../../../../supabase/functions/noata-ai/response-ui.ts";
const base={version:1,id:"quadratic-1",title:"Explore the roots",fallback:"Changing the discriminant changes the real roots."};
test("the component registry rejects unknown types, executable props and unbounded data",()=>{
 assert.ok(validateResponseUi({...base,type:"quadratic",a:1,b:0,c:-1}));
 for(const data of [{...base,type:"iframe",src:"https://evil.test"},{...base,type:"quadratic",a:1,b:0,c:0,onClick:"eval()"},{...base,type:"quadratic",a:Infinity,b:0,c:0},{...base,type:"quiz",questions:[{prompt:"Question",choices:["A","B"],answer:3,explanation:"Answer"}]}])assert.equal(validateResponseUi(data),null);
});
test("partial widgets stay buffered and malformed complete widgets fall back without execution",()=>{
 assert.deepEqual(responseSegments('Explanation\n```noata-ui\n{"version":1'),[{type:"markdown",text:"Explanation\n"},{type:"pending"}]);
 const segments=responseSegments('```noata-ui\n{"type":"script","fallback":"Readable explanation"}\n```');assert.equal(segments[0].type,"fallback");
 const valid=responseSegments('```noata-ui\n'+JSON.stringify({...base,type:"quadratic",a:1,b:0,c:-1})+'\n```');assert.equal(valid[0].type,"interactive");
 assert.equal(responseSegments('```javascript\nconsole.log("safe code preview")\n```')[0].type,"markdown");
});
test("quadratic calculations cover two roots, repeated roots, complex roots and linear degeneration",()=>{
 assert.deepEqual(quadraticValues(1,0,-1).roots,[-1,1]);assert.deepEqual(quadraticValues(1,2,1).roots,[-1]);assert.equal(quadraticValues(1,0,1).kind,"complex");assert.deepEqual(quadraticValues(0,2,-4).roots,[2]);assert.equal(quadraticValues(0,0,0).kind,"identity");
});

test("copy and exports replace native protocol while preserving ordinary code",()=>{
 const content="Explanation\n"+"\x60\x60\x60noata-ui\n"+JSON.stringify({...base,type:"quadratic",a:1,b:0,c:-1})+"\n\x60\x60\x60";
 assert.equal(responseText(content),"Explanation\n\n\n"+base.fallback);
 const code="\x60\x60\x60javascript\nconsole.log(1)\n\x60\x60\x60";assert.equal(responseText(code),code);
 assert.equal(responseText("Before\n\x60\x60\x60noata-ui\n{\"version\":1"),"Before");
});

test("ordinary Front/Back and Arabic Q/A lists become native cards without deleting surrounding text",()=>{
 const sample="Here are the cards:\\n\\n**Front:** What is 2 + 3?\\n**Back:** 5\\n\\n**Front:** What is 4 + 5?\\n**Back:** 9\\n\\nStudy again tomorrow.";
 const repaired=interactiveResponseSegments(sample);
 assert.deepEqual(repaired.map(x=>x.type),["markdown","interactive","markdown"]);
 assert.equal(repaired[1].type==="interactive"?repaired[1].data.type:"", "flashcards");
 const arabic="السؤال: ما ناتج ٢ + ٣؟\\nالإجابة: ٥\\nالسؤال: ما ناتج ٤ + ٥؟\\nالإجابة: ٩";
 assert.equal(interactiveResponseSegments(arabic)[0].type,"interactive");
 assert.equal(interactiveResponseSegments(sample,true)[0].type,"markdown");
 assert.equal(interactiveResponseSegments("Front: hello\\nBack: there")[0].type,"markdown");
 assert.equal(interactiveResponseSegments("```text\\nFront: x\\nBack: y\\n```")[0].type,"markdown");
});
test("Line charts reject fabricated structure, injection, invalid values, and massive payloads",()=>{
 const chart={version:1,id:"temps",type:"line_chart",title:"Temperature",fallback:"A temperature series chart",xLabel:"Hour",yLabel:"°C",points:[{label:"09:00",value:21},{label:"10:00",value:25}]};
 assert.equal(validateResponseUi(chart)?.type,"line_chart");
 for(const invalid of [
 {...chart,points:[{label:"9",value:1}]},
 {...chart,points:[{label:"9",value:NaN},{label:"10",value:5}]},
 {...chart,onclick:"alert(1)"},
 {...chart,points:Array.from({length:31},(_,i)=>({label:String(i),value:i}))}
 ])assert.equal(validateResponseUi(invalid),null);
});
