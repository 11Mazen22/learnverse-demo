import test from "node:test";
import assert from "node:assert/strict";
import {onlyOwnedRecords} from "./account-scope.ts";

const records=[
 {id:"a",user_id:"student-a",name:"private A"},
 {id:"b",user_id:"student-b",name:"private B"},
 {id:"c",user_id:"student-a",name:"private C"},
];
test("never displays account A themes to B or signed-out visitors",()=>{
 assert.deepEqual(onlyOwnedRecords(records,"student-a").map(x=>x.id),["a","c"]);
 assert.deepEqual(onlyOwnedRecords(records,"student-b").map(x=>x.id),["b"]);
 assert.deepEqual(onlyOwnedRecords(records,null),[]);
});
test("account-owned filtering does not mutate stored designs",()=>{
 assert.equal(records.length,3);
 assert.deepEqual(onlyOwnedRecords(records,"unknown"),[]);
});
