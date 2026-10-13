import test from "node:test";
import assert from "node:assert/strict";
import {spreadsheetCell,workbookFormula} from "./spreadsheet-cell.ts";
import {createNoataMultiSheetXlsx} from "./xlsx-multisheet.ts";
test("Actual bold SUM source becomes a working numeric formula, with a correct cache",()=>{
 const sheets=[{name:"Photosynthesis Tracker",rows:[["Day","Minutes"],["Day 1","10"],["Day 2","20"],["Day 3","30"],["**Total**","**=SUM(B2:B4)**"]]},
 {name:"Summary",rows:[["Metric","Value"],["Average","**=AVERAGE(B2:B4)**"]]}];
 assert.equal(spreadsheetCell("**=SUM(B2:B4)**"),"=SUM(B2:B4)");
 assert.deepEqual(workbookFormula(sheets[0].rows[4][1],sheets,0,4,1),{formula:"SUM(B2:B4)",cached:60});
 assert.deepEqual(workbookFormula(sheets[1].rows[1][1],sheets,1,1,1),{formula:"AVERAGE('Photosynthesis Tracker'!B2:B4)",cached:20});
 const raw=new TextDecoder().decode(createNoataMultiSheetXlsx(sheets));
 assert.ok(raw.includes("<f>SUM(B2:B4)</f><v>60</v>"));
 assert.ok(!raw.includes("**=SUM"));
 assert.equal(workbookFormula("=HYPERLINK(unsafe)",sheets,0,4,1),null);
 assert.throws(()=>workbookFormula("=SUM('Unknown'!B2:B4)",sheets,0,4,1),/unknown worksheet/);
});
