import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync,execFileSync} from "node:child_process";
import {mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {join} from "node:path";import {tmpdir} from "node:os";
import {parseNoataSlides,createNoataPptx} from "./pptx-export.ts";
test("Noata slides keep Arabic headings and bounded readable bullets",()=>{
 const slides=parseNoataSlides("# عنوان عربي\n- أتعلم اليوم\n- موضوع آخر\n---\n# English\n- Hello");
 assert.equal(slides.length,2);assert.equal(slides[0].title,"عنوان عربي");
 assert.deepEqual(slides[0].lines,["أتعلم اليوم","موضوع آخر"]);
});
test("PPTX is a real Office Open XML ZIP with relationship targets",()=>{
 const bytes=createNoataPptx("# العلوم\n- المادة و الطاقة\n---\n# Mathematics\n- Graphs");
 assert.equal(bytes[0],80);assert.equal(bytes[1],75);
 const raw=new TextDecoder().decode(bytes);
 for(const name of ["ppt/presentation.xml","ppt/slides/slide1.xml","ppt/slides/slide2.xml","ppt/slideMasters/slideMaster1.xml","ppt/theme/theme1.xml"])
  assert.ok(raw.includes(name),name);
 assert.ok(raw.includes("المادة و الطاقة"));
 assert.ok(raw.includes('rtl="1"'));
});
test("PPTX archive validates with unzip and XML parser",()=>{
 if(spawnSync("which",["unzip"]).status!==0)return;
 const dir=mkdtempSync(join(tmpdir(),"noata-pptx-"));
 try{const file=join(dir,"qa.pptx");writeFileSync(file,createNoataPptx("# رياضيات\n- فهم الرسوم\n- تدريب عملي"));
  execFileSync("unzip",["-t",file],{stdio:"pipe"});
  const slide=execFileSync("unzip",["-p",file,"ppt/slides/slide1.xml"],{encoding:"utf8"});
  assert.match(slide,/رياضيات/);assert.match(slide,/<p:spTree>/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test("Distinct Markdown slide headings produce editable slides without requiring ---",()=>{
 const source="# Introduction\n- First concept\n# خاتمة\n- نتيجة مهمة";
 const slides=parseNoataSlides(source);
 assert.equal(slides.length,2);
 assert.deepEqual(slides.map(x=>x.title),["Introduction","خاتمة"]);
 const bytes=createNoataPptx(source);
 if(spawnSync("which",["unzip"]).status!==0)return;
 const dir=mkdtempSync(join(tmpdir(),"noata-pptx-layout-"));
 try{
  const path=join(dir,"style.pptx");writeFileSync(path,bytes);
  execFileSync("unzip",["-t",path]);
  const first=execFileSync("unzip",["-p",path,"ppt/slides/slide1.xml"],{encoding:"utf8"});
  const second=execFileSync("unzip",["-p",path,"ppt/slides/slide2.xml"],{encoding:"utf8"});
  assert.match(first,/Editable content panel/);
  assert.match(first,/Accent header rail/);
  assert.match(first,/225A7A/);
  assert.match(second,/335FA7/);
  assert.match(second,/rtl="1"/);
  assert.match(second,/خاتمة/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test("Actual provider bold slide labels preserve separate editable sections",()=>{
 const source="Here is the content for the PowerPoint presentation:\n\n---\n**Title Slide:** Photosynthesis\n\n**Slide 1: Introduction**\n- Plants convert light energy\n\n**Slide 2: Reactions**\n- Light reactions occur in thylakoids";
 const slides=parseNoataSlides(source);
 assert.deepEqual(slides.map(s=>s.title),["Photosynthesis","Introduction","Reactions"]);
 assert.ok(new TextDecoder().decode(createNoataPptx(source)).includes("Plants convert light energy"));
});
