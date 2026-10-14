import test from "node:test";import assert from "node:assert/strict";
import {documentSections,scopedRevision,mergeScopedRevision} from "./scoped-revision.ts";
test("Editing one section retains the exact preceding and following content in a long document",()=>{
 const prefix="# Science guide\n"+"Introduction retained. ".repeat(1000)+"\n\n";
 const section="## Photosynthesis\nOriginal complete section with an equation.\n\n";
 const suffix="## Respiration\n"+"Other detailed content retained. ".repeat(1000);
 const original=prefix+section+suffix,chosen=documentSections(original).find(x=>x.label==="Photosynthesis")!;
 const scope=scopedRevision(original,chosen);
 const revised=mergeScopedRevision(scope,"## Photosynthesis\nCorrected explanation and a worked example.");
 assert.ok(revised.startsWith(prefix));assert.ok(revised.endsWith(suffix));assert.match(revised,/worked example/);
 assert.equal(original,prefix+section+suffix);assert.ok(original.length>14000);
});
test("Fenced code headings, stale scopes and hierarchy-changing replies cannot rewrite other sections",()=>{
 const source="# Workbook\n\n"+["~~~python","# not a section","~~~"].join("\n")+"\n## Chapter\nDetailed original chapter text.\n\n## Next\nRetained text.";
 const sections=documentSections(source);assert.deepEqual(sections.map(x=>x.label),["Workbook","Chapter","Next"]);
 const scope=scopedRevision(source,sections[1]);
 assert.throws(()=>mergeScopedRevision({...scope,before:"stale source"},"## Chapter\nA safe full replacement."));
 assert.throws(()=>mergeScopedRevision(scope,"# New entire document\nDestructive replacement."));
 assert.throws(()=>mergeScopedRevision(scope,"## Chapter\nNew text.\n# Unexpected global title\nMore text."));
});
test("Arabic slides and worksheet headings select independently without sending an oversized whole file",()=>{
 const source="# ورقة: الدرجات\n| الاسم | الدرجة |\n|---|---|\n| أ | 9 |\n\n# ورقة: الملخص\nالملخص الأصلي محفوظ.";
 const scope=scopedRevision(source,documentSections(source)[0]);
 assert.ok(mergeScopedRevision(scope,"# ورقة: الدرجات\n| الاسم | الدرجة |\n|---|---|\n| أ | 10 |").endsWith("# ورقة: الملخص\nالملخص الأصلي محفوظ."));
 assert.throws(()=>scopedRevision("## Long\n"+"word ".repeat(4000),{label:"Long",start:0,end:20008,level:2}));
});

test("A shorter fence or fence-like code text cannot expose code headings as editable document sections",()=>{
 const f=String.fromCharCode(96);
 const source=["# Guide",f.repeat(4)+"js",f.repeat(3)+"not-a-close","# inside code",f.repeat(3),"## still inside",f.repeat(4),"## Actual section","Actual content preserved."].join("\n");
 assert.deepEqual(documentSections(source).map(s=>s.label),["Guide","Actual section"]);
});
