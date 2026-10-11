/** Dependency-free, genuinely editable PPTX (Office Open XML) export for Noata. */
import {packageZip} from "./docx-export.ts";
import {documentDirection} from "./document-direction.ts";
const pkg='http://schemas.openxmlformats.org/package/2006/relationships';
const rel='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const p='http://schemas.openxmlformats.org/presentationml/2006/main';
const a='http://schemas.openxmlformats.org/drawingml/2006/main';
const header='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const escapeXml=(s:string)=>s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
export type NoataSlide={title:string;lines:string[]};
export function parseNoataSlides(source:string):NoataSlide[]{
 if(source.length>30000)throw Error("Presentation content exceeds 30,000 characters");
 const segments=source.replace(/\r\n?/g,"\n").split(/^\s*---\s*$/m).filter(v=>v.trim());
 const slides:NoataSlide[]=[];
 for(const segment of segments){
  const lines=segment.split("\n").map(x=>x.trim()).filter(Boolean);
  if(!lines.length)continue;
  const heading=/^#{1,3}\s+(.+)$/.exec(lines[0]);
  const title=(heading?heading[1]:"Noata AI").trim();
  const body=(heading?lines.slice(1):lines).map(x=>x.replace(/^(?:[-*+]\s+|\d+[.)]\s+)/,"").replace(/^#{2,4}\s+/,""));
  if(title.length>100||body.some(x=>x.length>210))throw Error("Text too long for readable slides");
  if(body.length===0)slides.push({title,lines:[]});
  else for(let offset=0;offset<body.length;offset+=6)
   slides.push({title:offset?title+" — continued":title,lines:body.slice(offset,offset+6)});
 }
 if(slides.length===0)slides.push({title:"Noata AI",lines:[]});
 if(slides.length>30)throw Error("This exporter supports up to 30 slides");
 return slides;
}
const grp='<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'+
 '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
function shape(id:number,name:string,value:string,coordinates:[number,number,number,number],size:number,bold=false):string{
 const [x,y,cx,cy]=coordinates,rtl=documentDirection(value)==="rtl",align=rtl?"r":"l";
 const paragraphs=value.split("\n").map(line=>
  '<a:p><a:pPr algn="'+align+'" rtl="'+(rtl?"1":"0")+'"/><a:r><a:rPr lang="'+(rtl?"ar-EG":"en-US")+
  '" sz="'+size+'" b="'+(bold?"1":"0")+'" dirty="0"/><a:t>'+escapeXml(line)+'</a:t></a:r>'+
  '<a:endParaRPr lang="'+(rtl?"ar-EG":"en-US")+'"/></a:p>').join("");
 return '<p:sp><p:nvSpPr><p:cNvPr id="'+id+'" name="'+escapeXml(name)+'"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'+
  '<p:spPr><a:xfrm><a:off x="'+x+'" y="'+y+'"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm>'+
  '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>'+
  '<p:txBody><a:bodyPr wrap="square" lIns="45720" tIns="45720" rIns="45720" bIns="45720"/>'+
  '<a:lstStyle/>'+paragraphs+'</p:txBody></p:sp>';
}
function slideXml(value:NoataSlide,i:number,total:number):string{
 const title=shape(2,"Title",value.title,[650000,490000,10800000,1300000],value.title.length>65?2650:3300,true);
 const body=shape(3,"Content",value.lines.map(x=>"• "+x).join("\n"),[770000,1920000,10500000,4200000],2100);
 const footer=shape(4,"Slide number",String(i+1)+" / "+String(total),[10200000,6260000,900000,340000],1100);
 return header+'<p:sld xmlns:p="'+p+'" xmlns:a="'+a+'" xmlns:r="'+rel+'"><p:cSld>'+
 '<p:bg><p:bgPr><a:solidFill><a:srgbClr val="FAFBFE"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>'+
 '<p:spTree>'+grp+title+body+footer+'</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>';
}
function relationships(rows:{id:number;type:string;target:string}[]):string{
 return header+'<Relationships xmlns="'+pkg+'">'+rows.map(r=>'<Relationship Id="rId'+r.id+'" Type="'+rel+'/'+r.type+'" Target="'+r.target+'"/>').join("")+'</Relationships>';
}
const rgb=(n:string,color:string)=>'<a:'+n+'><a:srgbClr val="'+color+'"/></a:'+n+'>';
function theme():string{
 const colors=rgb("dk1","172642")+rgb("lt1","FFFFFF")+rgb("dk2","19335C")+rgb("lt2","F4F7FC")+
  ["5666D9","558DC1","48A4A3","C7796E","A16BBE","6F8C5E"].map((c,i)=>rgb("accent"+(i+1),c)).join("")+
  rgb("hlink","5666D9")+rgb("folHlink","69518B");
 const font='<a:latin typeface="Aptos"/><a:ea typeface="Noto Sans Arabic"/><a:cs typeface="Noto Sans Arabic"/>';
 const fill='<a:solidFill><a:schemeClr val="accent1"/></a:solidFill>';
 const line='<a:ln w="6350"><a:solidFill><a:schemeClr val="accent1"/></a:solidFill></a:ln>';
 return header+'<a:theme xmlns:a="'+a+'" name="Noata"><a:themeElements>'+
  '<a:clrScheme name="Noata">'+colors+'</a:clrScheme>'+
  '<a:fontScheme name="Noata"><a:majorFont>'+font+'</a:majorFont><a:minorFont>'+font+'</a:minorFont></a:fontScheme>'+
  '<a:fmtScheme name="Noata"><a:fillStyleLst>'+fill.repeat(3)+'</a:fillStyleLst><a:lnStyleLst>'+line.repeat(3)+'</a:lnStyleLst>'+
  '<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>'+
  '<a:bgFillStyleLst>'+fill.repeat(3)+'</a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>';
}
function master():string{
 return header+'<p:sldMaster xmlns:p="'+p+'" xmlns:a="'+a+'" xmlns:r="'+rel+'"><p:cSld><p:spTree>'+grp+
 '</p:spTree></p:cSld><p:clrMap accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" bg1="lt1" bg2="lt2" tx1="dk1" tx2="dk2" hlink="hlink" folHlink="folHlink"/>'+
 '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>'+
 '<p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>';
}
function layout():string{
 return header+'<p:sldLayout xmlns:p="'+p+'" xmlns:a="'+a+'" xmlns:r="'+rel+'" type="blank" preserve="1"><p:cSld name="Blank">'+
 '<p:spTree>'+grp+'</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>';
}
export function createNoataPptx(source:string):Uint8Array{
 const slides=parseNoataSlides(source);
 const types=header+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'+
  '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'+
  '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'+
  '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'+
  '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'+
  slides.map((_,i)=>'<Override PartName="/ppt/slides/slide'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>').join("")+'</Types>';
 const ids=slides.map((_,i)=>'<p:sldId id="'+(256+i)+'" r:id="rId'+(2+i)+'"/>').join("");
 const presentation=header+'<p:presentation xmlns:p="'+p+'" xmlns:a="'+a+'" xmlns:r="'+rel+'">'+
  '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'+
  '<p:sldIdLst>'+ids+'</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>'+
  '<p:notesSz cx="6858000" cy="9144000"/></p:presentation>';
 const file:Record<string,string>={
  "[Content_Types].xml":types,
  "_rels/.rels":relationships([{id:1,type:"officeDocument",target:"ppt/presentation.xml"}]),
  "ppt/presentation.xml":presentation,
  "ppt/_rels/presentation.xml.rels":relationships([{id:1,type:"slideMaster",target:"slideMasters/slideMaster1.xml"},...slides.map((_,i)=>({id:i+2,type:"slide",target:"slides/slide"+(i+1)+".xml"}))]),
  "ppt/slideMasters/slideMaster1.xml":master(),
  "ppt/slideMasters/_rels/slideMaster1.xml.rels":relationships([{id:1,type:"slideLayout",target:"../slideLayouts/slideLayout1.xml"},{id:2,type:"theme",target:"../theme/theme1.xml"}]),
  "ppt/slideLayouts/slideLayout1.xml":layout(),
  "ppt/slideLayouts/_rels/slideLayout1.xml.rels":relationships([{id:1,type:"slideMaster",target:"../slideMasters/slideMaster1.xml"}]),
  "ppt/theme/theme1.xml":theme()
 };
 slides.forEach((s,i)=>{const name="slide"+(i+1)+".xml";file["ppt/slides/"+name]=slideXml(s,i,slides.length);
  file["ppt/slides/_rels/"+name+".rels"]=relationships([{id:1,type:"slideLayout",target:"../slideLayouts/slideLayout1.xml"}]);});
 return packageZip(file);
}
export function downloadNoataPptx(source:string,name="noata-presentation.pptx"){
 const data=createNoataPptx(source),url=URL.createObjectURL(new Blob([Uint8Array.from(data)],{type:"application/vnd.openxmlformats-officedocument.presentationml.presentation"}));
 const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);
}
