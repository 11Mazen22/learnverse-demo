import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync,execFileSync} from "node:child_process";
import {mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {parseNoataData} from "./xlsx-export.ts";
import {parseNoataSheets,createNoataMultiSheetXlsx} from "./xlsx-multisheet.ts";
const text="## Sheet: Expenses\n| Item | Amount |\n|---|---|\n| Coffee | 20 |\n| Train | 35 |\n## Sheet: المصروفات\n| البند | الدرجة |\n|---|---|\n| علوم | 95 |";
test("Bilingual worksheet sections are actually parsed separately",()=>{
 const sheets=parseNoataSheets(text,parseNoataData);
 assert.equal(sheets?.length,2);
 assert.deepEqual(sheets?.map(s=>s.name),["Expenses","المصروفات"]);
 assert.deepEqual(sheets?.[0].rows[2],["Train","35"]);
 const duplicate=parseNoataSheets(text.replace("المصروفات","Expenses"),parseNoataData);
 assert.deepEqual(duplicate?.map(s=>s.name),["Expenses","Expenses (2)"]);
 assert.equal(parseNoataSheets("| A | B |\n|---|---|",parseNoataData),null);
 assert.throws(()=>parseNoataSheets("Some text\n"+text,parseNoataData),/begin with a sheet/);
});
test("Real editable XLSX contains two worksheets, frozen headers, styles, RTL and numeric cells",()=>{
 const sheets=parseNoataSheets(text,parseNoataData)!;
 const bytes=createNoataMultiSheetXlsx(sheets);
 assert.equal(bytes[0],80);assert.equal(bytes[1],75);
 if(spawnSync("which",["unzip"]).status!==0)return;
 const dir=mkdtempSync(join(tmpdir(),"noata-workbook-"));
 try{
  const path=join(dir,"multi.xlsx");writeFileSync(path,bytes);
  execFileSync("unzip",["-t",path]);
  const book=execFileSync("unzip",["-p",path,"xl/workbook.xml"],{encoding:"utf8"});
  const first=execFileSync("unzip",["-p",path,"xl/worksheets/sheet1.xml"],{encoding:"utf8"});
  const second=execFileSync("unzip",["-p",path,"xl/worksheets/sheet2.xml"],{encoding:"utf8"});
  const styles=execFileSync("unzip",["-p",path,"xl/styles.xml"],{encoding:"utf8"});
  assert.match(book,/name="Expenses"/);assert.match(book,/name="المصروفات"/);
  assert.match(first,/topLeftCell="A2"/);assert.match(first,/<v>35<\/v>/);
  assert.match(second,/rightToLeft="1"/);assert.match(second,/<v>95<\/v>/);
  assert.match(styles,/FF225A7A/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
