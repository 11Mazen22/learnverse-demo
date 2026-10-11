import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync,execFileSync} from "node:child_process";
import {mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {join} from "node:path";import {tmpdir} from "node:os";
import {parseNoataData,createNoataXlsx} from "./xlsx-export.ts";
test("XLSX preserves Arabic, escapes XML, avoids CSV formula injection",()=>{
 const grid=parseNoataData("| الموضوع | الدرجة |\n|---|---|\n| رياضيات | 90 |");
 assert.equal(grid.length,2);
 const bytes=createNoataXlsx("| الموضوع | الدرجة |\n|---|---|\n| رياضيات | 90 & <97> |");
 assert.equal(bytes[0],80);assert.equal(bytes[1],75);
 const raw=new TextDecoder().decode(bytes);
 assert.ok(raw.includes("xl/workbook.xml"));assert.ok(raw.includes("xl/worksheets/sheet1.xml"));
 assert.ok(raw.includes("90 &amp; &lt;97&gt;"));
 const unsafe=new TextDecoder().decode(createNoataXlsx("Name,Value\nA,=HYPERLINK(\"evil\")"));
 assert.ok(!unsafe.includes("<f>HYPERLINK"));
});
test("XLSX package unzips and has spreadsheet worksheet",()=>{
 if(spawnSync("which",["unzip"]).status!==0)return;
 const dir=mkdtempSync(join(tmpdir(),"noata-xlsx-"));
 try{const file=join(dir,"qa.xlsx");writeFileSync(file,createNoataXlsx("Name,Score\nMazen,89\nسارة,94"));
  execFileSync("unzip",["-t",file]);
  const doc=execFileSync("unzip",["-p",file,"xl/worksheets/sheet1.xml"],{encoding:"utf8"});
  assert.match(doc,/سارة/);assert.match(doc,/<v>94<\/v>/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
