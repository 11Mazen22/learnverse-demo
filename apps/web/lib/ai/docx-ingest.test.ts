import test from "node:test";
import assert from "node:assert/strict";
import {createNoataDocx} from "./docx-export.ts";
import {extractDocxDocument,isDocxDocument,MAX_DOCX_INPUT} from "./docx-ingest.ts";
test("real generated Word documents can be read back as grounded editable text", async () => {
 const bytes=createNoataDocx("# مراجعة الوحدة\nأول درس: <الرياضيات> & العلوم\n## فكرة رئيسية\nس = ٣");
 const input={name:"study.docx",type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer};
 const out=await extractDocxDocument(input);
 assert.match(out.excerpt,/مراجعة الوحدة/);
 assert.match(out.excerpt,/أول درس: <الرياضيات> & العلوم/);
 assert.match(out.excerpt,/فكرة رئيسية/);
 assert.ok(out.paragraphs>=4);
});
test("reject invalid ZIP, unrelated MIME and oversized DOCX input",async()=>{
 const fake={name:"x.docx",type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",size:100,arrayBuffer:async()=>new Uint8Array(100).buffer};
 await assert.rejects(()=>extractDocxDocument(fake));
 await assert.rejects(()=>extractDocxDocument({...fake,name:"x.pdf"}));
 await assert.rejects(()=>extractDocxDocument({...fake,size:MAX_DOCX_INPUT+1}));
 assert.equal(isDocxDocument({name:"file.docx",type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}),true);
 assert.equal(isDocxDocument({name:"file.doc",type:"application/msword"}),false);
});
