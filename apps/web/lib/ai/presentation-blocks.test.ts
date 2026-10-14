import test from "node:test";
import assert from "node:assert/strict";
import {splitPresentationBlocks} from "./presentation-blocks.ts";
test("Arabic poem is separated into a stanza card without losing explanation",()=>{
 const s="## قصيدة\n\n:::poem\nيا قلبُ لا تهجرْ هواك\n\nفالحبُّ نورٌ في المدى\n:::\n\n**شرح:** هذا نص أصلي.";
 assert.deepEqual(splitPresentationBlocks(s),[
  {type:"markdown",text:"## قصيدة\n"},
  {type:"poem",text:"يا قلبُ لا تهجرْ هواك\n\nفالحبُّ نورٌ في المدى"},
  {type:"markdown",text:"\n**شرح:** هذا نص أصلي."}
 ]);
});
test("Do not interpret directives in fences or before stream completion",()=>{
 for(const s of [":::poem\nAn unfinished line","~~~md\n:::poem\nhello\n:::\n~~~"])assert.deepEqual(splitPresentationBlocks(s),[{type:"markdown",text:s}]);
});
test("Reusable note and example blocks work without rendering HTML",()=>{
 const s="Context\n:::insight\nDo **not** guess.\n:::\n:::example\n1 + 1 = 2\n:::";
 const blocks=splitPresentationBlocks(s);
 assert.deepEqual(blocks.map(x=>x.type),["markdown","insight","markdown","example"]);
 assert.equal(blocks[1].text,"Do **not** guess.");
});
