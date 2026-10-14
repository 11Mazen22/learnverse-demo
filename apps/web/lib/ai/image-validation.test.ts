import test from "node:test";
import assert from "node:assert/strict";
import {validGeneratedPng} from "../../../../supabase/functions/noata-ai/image-validation.ts";
test("Image provider may only publish genuine bounded PNG bytes",()=>{
 assert.equal(validGeneratedPng(new Uint8Array(120)),false);
 const b=new Uint8Array(80);
 b.set([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82],0);
 b.set([0,0,1,0,0,0,1,0],16);
 assert.equal(validGeneratedPng(b),true);
 b[17]=32;assert.equal(validGeneratedPng(b),false);
});
