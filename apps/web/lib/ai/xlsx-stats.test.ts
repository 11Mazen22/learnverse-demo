import test from "node:test";
import assert from "node:assert/strict";
import {workbookNumericStatistics} from "./xlsx-stats.ts";
test("Deterministic numeric statistics ignore formulas, text and blank cells",()=>{
 const result=workbookNumericStatistics([["Day","Temp","Computed"],["Mon","20","=SUM(B2:B3)"],["Tue","24","999"],["Wed","26","2"]]);
 assert.deepEqual(result.map(x=>x.label),["Temp","Computed"]);
 assert.deepEqual(result[0],{label:"Temp",count:3,minimum:20,maximum:26,sum:70,mean:23.3333});
 assert.equal(result[1].count,2);
 assert.equal(workbookNumericStatistics([["A"],["5"]]).length,0);
});
test("Reject scientific strings, overflow and model-authored expressions as numeric observations",()=>{
 const result=workbookNumericStatistics([["Item","Value"],["One","=1+2"],["Two","1e7"],["Three","42"],["Four","44"],["Five","Infinity"]]);
 assert.equal(result[0].count,2);
 assert.equal(result[0].mean,43);
});
