import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { createNoataDocx } from "./docx-export.ts";
test("Noata Word export is a real ZIP/OOXML package with Arabic RTL and escaped content", () => {
  const bytes=createNoataDocx("# إنجازاتي\nأنا أذاكر & أبرمج <كل يوم>");
  assert.equal(bytes[0],80);assert.equal(bytes[1],75);
  const raw=new TextDecoder().decode(bytes);
  assert.ok(raw.includes("[Content_Types].xml"));
  assert.ok(raw.includes("word/document.xml"));
  assert.ok(raw.includes("word/styles.xml"));
  assert.ok(raw.includes("w:bidi"));
  assert.ok(raw.includes("w:pStyle w:val=\"Heading1\""));
  assert.ok(raw.includes("أذاكر &amp; أبرمج &lt;كل يوم&gt;"));
  assert.ok(!raw.includes("<كل يوم>"));
});
test("empty Arabic document remains a valid DOCX archive",()=>{
  assert.ok(createNoataDocx("").length>900);
});

test("unzip -t validates the complete OOXML archive on supported CI hosts",()=>{
  if(spawnSync("which",["unzip"]).status!==0) return;
  const directory=mkdtempSync(join(tmpdir(),"noata-docx-"));
  try{
    const file=join(directory,"arabic.docx");
    writeFileSync(file,createNoataDocx("# ترويسة عربية\nهذا اختبار حقيقي."));
    execFileSync("unzip",["-t",file],{stdio:"pipe"});
    const part=execFileSync("unzip",["-p",file,"word/document.xml"],{encoding:"utf-8"});
    assert.match(part,/ترويسة عربية/);
    assert.match(part,/w:bidi/);
  }finally{rmSync(directory,{recursive:true,force:true});}
});
