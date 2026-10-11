import test from "node:test";
import assert from "node:assert/strict";
import {answerExportFormats,hasSlideStructure,hasTableData,safeExportStem} from "./answer-export.ts";
test("Answer export availability reflects actual source structure",()=>{
 const plain=answerExportFormats("Just a simple paragraph of text.");
 assert.deepEqual(plain,["pdf","markdown","docx"]);
 const table=answerExportFormats("| Time | Temperature |\n|---|---|\n| 9 | 25 |");
 assert.ok(table.includes("xlsx"));assert.ok(table.includes("pdf"));
 assert.equal(hasTableData("Just text, including punctuation."),false);
 assert.ok(answerExportFormats("# Summary\n- Point one").includes("pptx"));
 assert.ok(!answerExportFormats("word ".repeat(22000)).includes("pdf"));
 assert.ok(!answerExportFormats("word ".repeat(22000)).includes("pptx"));
});
test("Export filenames cannot include unsafe filesystem characters",()=>{
 assert.equal(safeExportStem("../my:file?"),"myfile");
 assert.equal(safeExportStem("<>").length>0,true);
 assert.equal(hasSlideStructure("# Title\nPoint"),true);
});
