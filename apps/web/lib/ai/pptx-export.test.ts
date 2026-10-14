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

test("Actual Fanar presentation preserves six real slides without literal formatting or invented visuals",()=>{
 const source="## Photosynthesis Guide Presentation\n\n---\n\n# **Introduction**\n* Photosynthesis is the process plants use to convert light energy into chemical energy.\n* This presentation outlines the basics of photosynthesis and its importance.\n\n---\n\n# **Key Players & Process**\n* **Chloroplasts**: Organelles within plant cells where photosynthesis occurs.\n* **Pigments**: Chlorophyll absorbs sunlight, while carotenoids protect against excess light.\n* **Steps**: Light-dependent reactions capture energy, Calvin cycle converts CO₂ into glucose.\n\n---\n\n# **Light-Dependent Reactions**\n* Occurs in thylakoid membranes.\n* Water molecules split, releasing oxygen and electrons.\n* Electrons energize electron transport chain, producing ATP and NADPH.\n\n---\n\n# **Calvin Cycle**\n* Occurs in stroma.\n* Uses ATP and NADPH to fix carbon dioxide into glucose.\n* Requires six turns to produce one molecule of glucose.\n\n---\n\n# **Importance of Photosynthesis**\n* Oxygen production sustains life on Earth.\n* Glucose provides energy for growth and reproduction.\n* Basis of food chains supporting diverse ecosystems.\n\n---\n\n(Note: Actual PPTX file generation would include visual aids like diagrams, graphs, and formatted bullet points beyond plain markdown here.)";
 const slides=parseNoataSlides(source);
 assert.equal(slides.length,6);
 assert.equal(slides[1].title,"Introduction");
 assert.equal(slides[2].lines[0],"Chloroplasts: Organelles within plant cells where photosynthesis occurs.");
 assert.ok(slides.every(s=>!s.title.includes("**")&&s.lines.every(l=>!l.includes("**")&&!l.includes("Actual PPTX file generation"))));
 const raw=new TextDecoder().decode(createNoataPptx(source));
 assert.ok(raw.includes("Calvin Cycle"));
 assert.ok(!raw.includes("formatted bullet points beyond plain markdown"));
 assert.equal(parseNoataSlides("# Notes\n- An educational note about the carbon cycle.")[0].lines[0],"An educational note about the carbon cycle.");
});

test("Final app-delivery note variants do not create a generic extra slide",()=>{
 const content="# Photosynthesis\n- Plants use light energy.\n---\n# Light reactions\n- Water splitting releases oxygen.\n---\n";
 assert.equal(parseNoataSlides(content+"Note: This content generates a PowerPoint presentation. Actual file creation occurs within the application upon delivery completion.").length,2);
 assert.equal(parseNoataSlides(content+"Note: Temperature changes enzyme activity.").length,3);
});
