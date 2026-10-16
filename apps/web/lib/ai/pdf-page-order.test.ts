import test from "node:test";
import assert from "node:assert/strict";
import {isPdfPageOrderValid,parsePdfPageOrder} from "./pdf-page-order.ts";

test("a full PDF page permutation is accepted with ASCII digits and Arabic or ASCII comma separators",()=>{
 assert.equal(isPdfPageOrderValid("3, 1, 2",3),true);
 assert.deepEqual(parsePdfPageOrder("3، 1, 2",3),[3,1,2]);
 assert.deepEqual(parsePdfPageOrder("٣، ١، ٢",3),[3,1,2]);
 assert.deepEqual(parsePdfPageOrder("۳، ۱، ۲",3),[3,1,2]);
 assert.deepEqual(parsePdfPageOrder("1 2 3",3),[1,2,3]);
});

test("the page-order UI rejects omissions, duplicates, out-of-range and malformed tokens",()=>{
 for(const text of ["","1,2","1,1,3","1,2,4","1, foo, 3","-1,2,3","0,2,3","1,,3"]){
  assert.equal(isPdfPageOrderValid(text,3),false,text);
 }
 assert.throws(()=>parsePdfPageOrder("1,2",3),/pdf_page_order_invalid/);
});

test("page-order validation rejects unsafe sizes and impossible page counts",()=>{
 assert.equal(isPdfPageOrderValid(Array.from({length:201},(_,i)=>i+1).join(","),201),false);
 assert.equal(isPdfPageOrderValid("1,2",0),false);
 assert.equal(isPdfPageOrderValid("1,2",201),false);
 assert.equal(isPdfPageOrderValid("1,".repeat(700),3),false);
});
