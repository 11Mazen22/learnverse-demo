import test from "node:test";
import assert from "node:assert/strict";
import {appendDocumentSources,extractDocumentBatch,validateDocumentBatch,MAX_DOCUMENT_CONTEXT_CHARS} from "./multi-document.ts";
import {createNoataDocx} from "./docx-export.ts";

function plain(name:string,body:string){
 return {name,type:"text/plain",size:new TextEncoder().encode(body).byteLength,text:async()=>body,arrayBuffer:async()=>new TextEncoder().encode(body).buffer};
}
test("real TXT and DOCX contents remain distinguishable and grounded",async()=>{
 const bytes=createNoataDocx("# اختبار المستند\nالناتج ٦");
 const docx={name:"درس.docx",type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",size:bytes.byteLength,text:async()=>"",arrayBuffer:async()=>Uint8Array.from(bytes).buffer};
 const sources=await extractDocumentBatch([plain("notes.txt","معادلة س = ٣"),docx]);
 assert.equal(sources.length,2);
 const prompt=appendDocumentSources("قارن",sources);
 assert.match(prompt,/notes.txt/);
 assert.match(prompt,/معادلة س = ٣/);
 assert.match(prompt,/درس.docx/);
 assert.match(prompt,/الناتج ٦/);
 assert.match(prompt,/\[FILE 2/);
});
test("multi-file quota rejects unsupported formats without inventing PDF analysis",()=>{
 assert.match(validateDocumentBatch(Array.from({length:5},(_,i)=>({name:i+".txt",type:"text/plain",size:2})))??"",/٤/);
 assert.equal(validateDocumentBatch([{name:"lecture.pdf",type:"application/pdf",size:200}]),null);
 assert.match(validateDocumentBatch([{name:"sheet.xlsx",type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",size:200}])??"",/TXT/);
});
test("source material is bounded, names sanitized and empty metadata ignored",async()=>{
 const files=Array.from({length:4},(_,i)=>plain("f"+i+".txt","س".repeat(10000)));
 const sources=await extractDocumentBatch(files);
 assert.ok(sources.reduce((n,x)=>n+x.excerpt.length,0)<=MAX_DOCUMENT_CONTEXT_CHARS);
 assert.equal(appendDocumentSources("سؤال",null),"سؤال");
 const prompt=appendDocumentSources("سؤال",[{name:"<unsafe>",format:"text",excerpt:"data",truncated:false}]);
 assert.ok(!prompt.includes("<unsafe>"));
});
