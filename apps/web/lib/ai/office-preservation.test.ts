import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFile} from "node:fs/promises";
import {packageZip,createNoataDocx} from "./docx-export.ts";
import {createNoataPptx} from "./pptx-export.ts";
import {createNoataXlsx} from "./xlsx-export.ts";
import {officeTextTargets,reviseOfficeText,type OfficeFormat} from "./office-preservation.ts";
const content:Record<OfficeFormat,Uint8Array>={docx:createNoataDocx("# Original heading\nFirst paragraph\n# Section three\nPreserve this content"),pptx:createNoataPptx("# Original heading\n- First slide content\n\n---\n\n# Keep slide two\n- Unchanged content"),xlsx:createNoataXlsx("| Item | Value |\n| --- | --- |\n| A | 10 |\n| B | 20 |\n| Total | =SUM(B2:B3) |")};
// Python's independent ZIP implementation adds ordinary DEFLATE compression,
// binary media, package metadata and an archive comment, then reopens every result.
function fixture(format:OfficeFormat):Uint8Array{return execFileSync("python3",["-c",`
import io,sys,zipfile
source=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()))
out=io.BytesIO()
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for item in source.infolist(): z.writestr(item,source.read(item.filename),compress_type=zipfile.ZIP_DEFLATED)
 z.writestr('custom/opaque-media.bin',bytes(range(256))*8)
 z.writestr('custom/provenance.xml','<metadata><keep>unchanged</keep></metadata>')
 z.comment=b'preserve this archive comment'
sys.stdout.buffer.write(out.getvalue())
`],{input:content[format]});}
function compare(before:Uint8Array,after:Uint8Array,changed:string[]){
 const result=execFileSync("python3",["-c",`
import io,sys,json,zipfile,base64,xml.etree.ElementTree as ET
d=json.load(sys.stdin);a=base64.b64decode(d['before']);b=base64.b64decode(d['after'])
za=zipfile.ZipFile(io.BytesIO(a));zb=zipfile.ZipFile(io.BytesIO(b));assert za.namelist()==zb.namelist();assert za.comment==zb.comment
assert zb.testzip() is None
for name in za.namelist():
 data=zb.read(name)
 if name.endswith('.xml'): ET.fromstring(data)
 if name not in d['changed']:
  assert za.read(name)==data,name
  ia=za.getinfo(name);ib=zb.getinfo(name)
  def local(raw,z,info):
   ends=[i.header_offset for i in z.infolist() if i.header_offset>info.header_offset]
   return raw[info.header_offset:min(ends) if ends else z.start_dir]
  assert local(a,za,ia)==local(b,zb,ib),name+' compressed bytes changed'
print('validated ZIP CRC, XML, binary resources and unchanged compressed records')
`],{input:JSON.stringify({before:Buffer.from(before).toString("base64"),after:Buffer.from(after).toString("base64"),changed}),encoding:"utf8"});
 assert.match(result,/validated ZIP/);
}
for(const format of ["docx","pptx","xlsx"] as const)test(`${format}: targeted revision reopens and preserves all unaffected compressed records`,async()=>{
 const original=fixture(format),before=original.slice(),targets=await officeTextTargets(original,format);
 assert.ok(targets.length>1);const target=targets.find(t=>t.text=== (format==="xlsx"?"Item":"Original heading"))!;assert.ok(target);
 const result=await reviseOfficeText(original,format,[{...target,replacement:"عنوان جديد & revised <text>"}]);
 assert.deepEqual(original,before);assert.deepEqual(result.changedParts,[target.part]);compare(original,result.bytes,result.changedParts);
 const revised=await officeTextTargets(result.bytes,format);assert.equal(revised.find(t=>t.part===target.part&&t.index===target.index)?.text,"عنوان جديد & revised <text>");
 const second=await reviseOfficeText(result.bytes,format,[{...revised.find(t=>t.part===target.part&&t.index===target.index)!,replacement:"Final revision"}]);
 compare(result.bytes,second.bytes,second.changedParts);
});
test("numeric workbook edits preserve formula cells and unrelated sheets",async()=>{
 const original=fixture("xlsx"),targets=await officeTextTargets(original,"xlsx"),number=targets.find(t=>t.text==="10")!;
 assert.ok(number);assert.equal(targets.some(t=>t.text.includes("SUM(")),false);
 const result=await reviseOfficeText(original,"xlsx",[{...number,replacement:"42.5"}]);compare(original,result.bytes,result.changedParts);
 await assert.rejects(reviseOfficeText(original,"xlsx",[{...number,replacement:"=HYPERLINK(1)"}]),/office_number_invalid/);
});
test("stale, duplicated and out-of-scope edits cannot modify a package",async()=>{
 const original=fixture("docx"),target=(await officeTextTargets(original,"docx"))[0];
 await assert.rejects(reviseOfficeText(original,"docx",[{...target,text:"stale",replacement:"new"}]),/office_stale_target/);
 await assert.rejects(reviseOfficeText(original,"docx",[{...target,part:"custom/provenance.xml",replacement:"new"}]),/office_edit_scope/);
 await assert.rejects(reviseOfficeText(original,"docx",[{...target,replacement:"new"},{...target,replacement:"other"}]),/office_stale_target/);
 await assert.rejects(reviseOfficeText(original,"docx",[{...target,replacement:"new\u0000text"}]),/office_text_invalid/);
});
test("signed packages, external XML entities, encryption and duplicate paths fail closed",async()=>{
 const signed=packageZip({"[Content_Types].xml":"<Types/>","word/document.xml":"<w:document/>","_xmlsignatures/sig1.xml":"<signature/>"});
 await assert.rejects(officeTextTargets(signed,"docx"),/office_archive_unsupported/);
 const entity=packageZip({"[Content_Types].xml":"<Types/>","word/document.xml":'<!DOCTYPE x [<!ENTITY secret SYSTEM "file:///etc/passwd">]><w:p><w:t>&secret;</w:t></w:p>'});
 await assert.rejects(officeTextTargets(entity,"docx"),/office_xml_unsupported/);
 const encrypted=fixture("docx");encrypted[6]|=1;await assert.rejects(officeTextTargets(encrypted,"docx"),/office_archive/);
 const duplicate=execFileSync("python3",["-c",`import io,zipfile,sys; b=io.BytesIO();z=zipfile.ZipFile(b,'w');z.writestr('[Content_Types].xml','<Types/>');z.writestr('word/document.xml','<x/>');z.writestr('word/document.xml','<y/>');z.close();sys.stdout.buffer.write(b.getvalue())`],{stdio:["pipe","pipe","ignore"]});
 await assert.rejects(officeTextTargets(duplicate,"docx"),/office_archive_invalid/);
});
for(const [format,name] of [["docx","word-reference.docx"],["xlsx","workbook-reference.xlsx"],["pptx","slides-reference.pptx"]] as const)
 test(`${format}: independently authored reference retains media, themes, charts, notes and other sections`,async()=>{
  const bytes=await readFile(new URL("../../../../tests/fixtures/genesis/"+name,import.meta.url));
  const targets=await officeTextTargets(bytes,format),target=targets.find(t=>t.text==="Original heading")!;assert.ok(target);
  const result=await reviseOfficeText(bytes,format,[{...target,replacement:"Revised reference heading"}]);
  compare(bytes,result.bytes,result.changedParts);
  assert.ok((await officeTextTargets(result.bytes,format)).some(t=>t.text==="Revised reference heading"));
 });
