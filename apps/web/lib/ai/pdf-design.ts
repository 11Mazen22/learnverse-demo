import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import { parseDesignDocument, type DocumentDesign } from "../../../../supabase/functions/noata-ai/document-design.ts";
import { documentDirection } from "./document-direction.ts";
import { documentPalette, type DocumentPalette } from "./document-theme.ts";
import { escapeHtml } from "./pdf-export.ts";

export type DocumentFonts = { arabic:string; latin:string; symbols?:string; extra?:string };
export type DesignParts = {
  design: DocumentDesign;
  direction: "rtl"|"ltr";
  coverHtml: string | null;
  bodyHtml: string;
};

const esc = (value:string,max:number) => escapeHtml(value.replace(/[\x00-\x08\x0b-\x1f\x7f]/g," ").replace(/\s+/g," ").trim().slice(0,max));
const inlineClean = (value:string) => value.replace(/[*_`#>]/g,"").replace(/\s+/g," ").trim();

async function inlineMarkdown(value:string, direction:"rtl"|"ltr"):Promise<string>{
  const file=await unified().use(remarkParse).use(remarkGfm).use(remarkMath)
    .use(remarkRehype).use(rehypeKatex,{output:"mathml",strict:"ignore",trust:false,maxExpand:100,maxSize:20})
    .use(rehypeStringify).process(value);
  let html=String(file).trim();
  if(html.startsWith("<p>")&&html.endsWith("</p>"))html=html.slice(3,-4);
  return `<span dir="${direction}">${html}</span>`;
}
type Block = { html:string };
async function blocks(source:string,direction:"rtl"|"ltr"):Promise<{markdown:string;rendered:Block[]}>{
  const lines=source.replace(/\r\n?/g,"\n").split("\n"),out:string[]=[],rendered:Block[]=[];
  for(let index=0;index<lines.length;index++){
    const open=lines[index].match(/^:::[ \t]*([a-z-]+)[ \t]*(.*)$/i);
    if(!open){out.push(lines[index]);continue;}
    const kind=open[1].toLowerCase(),rest=open[2].trim();
    if(kind==="break"){out.push("",`NOATA_BLOCK_${rendered.length}`,"");rendered.push({html:'<div class="ornament" aria-hidden="true"><span></span><span></span><span></span></div>'});continue;}
    const inner:string[]=[];let closed=false;
    for(index++;index<lines.length;index++){
      if(/^:::[ \t]*$/.test(lines[index])){closed=true;break;}
      inner.push(lines[index]);
    }
    if(!closed||inner.join("\n").length>14000){out.push(...(closed?inner:[":::"+kind,...inner]));continue;}
    out.push("",`NOATA_BLOCK_${rendered.length}`,"");
    rendered.push({html:await renderBlock(kind,rest,inner.join("\n"),direction)});
  }
  return {markdown:out.join("\n"),rendered};
}
async function renderBlock(kind:string,rest:string,inner:string,direction:"rtl"|"ltr"):Promise<string>{
  const body=inner.trim();
  if(kind==="stats"){
    const items=body.split("\n").map(line=>line.replace(/^\s*[-*]\s*/,"").split("|").map(part=>part.trim())).filter(parts=>parts.length>=2&&parts[0]);
    if(items.length>=1){
      return '<div class="stats">'+items.slice(0,4).map(([value,label])=>
        `<div class="stat"><strong>${esc(value,24)}</strong><span>${esc(label||"",90)}</span></div>`).join("")+"</div>";
    }
  }
  if(kind==="timeline"){
    const items=body.split("\n").map(line=>line.replace(/^\s*[-*]\s*/,"").split("|").map(part=>part.trim())).filter(parts=>parts.length>=2&&parts[0]);
    if(items.length>=2){
      return '<ol class="timeline">'+items.slice(0,6).map(([date,title,description])=>
        `<li><span class="timeline-date">${esc(date,40)}</span><div><strong>${esc(title||"",90)}</strong>${description?`<p>${esc(description,220)}</p>`:""}</div></li>`).join("")+"</ol>";
    }
  }
  if(kind==="quote"){
    const rows=body.split("\n").filter(Boolean),authorLine=rows.at(-1)?.match(/^--\s*(.+)$/)?.[1];
    if(authorLine)rows.pop();
    const quote=await inlineMarkdown(rows.join("\n"),direction);
    return `<blockquote class="pullquote">${quote}${authorLine?`<cite>${esc(authorLine,90)}</cite>`:""}</blockquote>`;
  }
  if(kind==="checklist"){
    const items=body.split("\n").map(line=>line.match(/^\s*[-*]\s*\[([ xX])\]\s*(.+)$/)).filter(Boolean) as RegExpMatchArray[];
    if(items.length){
      return '<ul class="checklist">'+items.slice(0,10).map(item=>
        `<li class="${item[1].trim()?"done":""}"><span aria-hidden="true">${item[1].trim()?"✓":""}</span>${esc(item[2],160)}</li>`).join("")+"</ul>";
    }
  }
  if(kind==="callout"||kind==="endnote"||kind==="lead"){
    const rows=body.split("\n").filter(Boolean);
    const title=kind==="callout"||kind==="endnote"?(rest||rows.shift()||""):"";
    const content=await inlineMarkdown(rows.join("\n"),direction);
    const className=kind==="lead"?"lead":kind==="endnote"?"endnote":"callout";
    return `<aside class="${className}">${title?`<strong class="${className}-title">${esc(title,90)}</strong>`:""}<div>${content}</div></aside>`;
  }
  // Unknown directives stay visible as ordinary content rather than disappearing.
  return `<p>${esc(body,2000)}</p>`;
}
function headingList(body:string):string[]{
  return [...body.matchAll(/^##[ \t]+(.+)$/gm)].map(match=>inlineClean(match[1])).filter(Boolean).slice(0,14);
}
function fontFaces(fonts:DocumentFonts,textFont:string):string{
  return `@font-face{font-family:Noata;src:url(data:font/woff2;base64,${fonts.arabic}) format('woff2');font-weight:200 1000;unicode-range:U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF}
@font-face{font-family:Noata;src:url(data:font/woff2;base64,${fonts.latin}) format('woff2');font-weight:200 1000}
${fonts.symbols?`@font-face{font-family:NoataSymbols;src:url(data:font/woff;base64,${fonts.symbols}) format('woff');font-weight:400}`:""}
${fonts.extra?`@font-face{font-family:${textFont};src:url(data:font/ttf;base64,${fonts.extra}) format("truetype");font-weight:100 900;unicode-range:U+0000-024F,U+1E00-1EFF}`:""}`;
}
function shell(direction:"rtl"|"ltr",extraCss:string,fonts:DocumentFonts,textFont:string,content:string,title:string,firstMarginZero:boolean):string{
  return `<!doctype html><html lang="${direction==="rtl"?"ar":"en"}" dir="${direction}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:"><title>${escapeHtml(title)}</title><style>
${fontFaces(fonts,textFont)}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:A4;margin:19mm 17mm 21mm}${firstMarginZero?"@page:first{margin:0}":""}
*{box-sizing:border-box}body{margin:0}
${extraCss}
</style></head><body>${content}</body></html>`;
}
function coverMarkup(design:DocumentDesign,palette:DocumentPalette,direction:"rtl"|"ltr"):string{
  const kicker=esc(design.kicker||(direction==="rtl"?"مستند مصمم من Noata":"A Noata designed document"),60);
  // Keep the final two words together so a short title never leaves one
  // orphaned word on its own line. The cover still wraps normally above that pair.
  const coverTitle=esc(design.title,120).replace(/\s+(\S+)$/,"&nbsp;$1");
  const meta=[design.author?esc(design.author,80):"",design.date?esc(design.date,40):""].filter(Boolean);
  const art=design.cover==="bold"
    ?'<span class="orb orb-one"></span><span class="orb orb-two"></span><span class="orb orb-three"></span><span class="grid-lines"></span>'
    :design.cover==="editorial"
    ?'<span class="edition">01</span><span class="edition-rule"></span>'
    :'<span class="frame"></span><span class="dot"></span>';
  return `<section class="cover cover-${design.cover}">${art}<div class="cover-main">
    <p class="cover-kicker">${kicker}</p>
    <h1>${coverTitle}</h1>
    ${design.subtitle?`<p class="cover-subtitle">${esc(design.subtitle,180)}</p>`:""}
    ${meta.length?`<p class="cover-meta">${meta.map(value=>`<span>${value}</span>`).join('<i aria-hidden="true"></i>')}</p>`:""}
  </div><div class="cover-foot"><span>NOATA</span><span>${direction==="rtl"?"وثيقة مصممة":"DESIGNED DOCUMENT"}</span></div></section>`;
}
function tocMarkup(headings:string[],direction:"rtl"|"ltr",palette:DocumentPalette):string{
  return `<section class="toc-page"><div class="toc-head"><span>${direction==="rtl"?"فهرس المحتويات":"CONTENTS"}</span><i></i></div><ol class="toc">${headings.map((heading,index)=>`<li><span class="toc-number">${String(index+1).padStart(2,"0")}</span><span class="toc-title">${esc(heading,160)}</span></li>`).join("")}</ol></section>`;
}
function bodyStyles(palette:DocumentPalette,design:DocumentDesign,direction:"rtl"|"ltr",textFont:string):string{
  const rtl=direction==="rtl";
  return `
body{font-family:${textFont},Noata,NoataSymbols,sans-serif;color:${palette.ink};background:${palette.paper};font-size:10.8pt;line-height:${rtl?"2.02":"1.9"};font-feature-settings:"liga" 0,"clig" 0,"dlig" 0;overflow-wrap:anywhere}
.toc-page{min-height:245mm;padding:12mm 3mm;break-after:page;display:flex;flex-direction:column;justify-content:center}
.toc-head{display:flex;align-items:center;gap:10mm;color:${palette.accent};font-size:9pt;font-weight:800;letter-spacing:${rtl?"0":".18em"};text-transform:uppercase}
.toc-head i{height:1px;flex:1;background:${palette.line}}
.toc{list-style:none;padding:0;margin:12mm 0 0;border-top:1px solid ${palette.line}}
.toc li{display:flex;align-items:baseline;gap:6mm;padding:4.2mm 0;border-bottom:1px solid ${palette.line}}
.toc-number{font-size:9pt;color:${palette.accent};font-variant-numeric:tabular-nums;min-width:8mm}
.toc-title{font-size:14pt;font-weight:700;color:${palette.ink}}
.doc-body>h2{break-before:auto;break-after:avoid;break-inside:avoid;font-size:22pt;line-height:1.45;margin:13mm 0 5mm;padding-top:5mm;border-top:2.5pt solid ${palette.accent};color:${palette.ink}}
.doc-body>h2:first-of-type{break-before:avoid}
.doc-body{counter-reset:section}
.doc-body>h2{counter-increment:section}
.doc-body>h2::before{content:counter(section,decimal-leading-zero);display:block;font-size:9pt;color:${palette.accent};letter-spacing:.14em;margin-bottom:2mm;font-weight:800}
.doc-body h3{font-size:14pt;line-height:1.55;color:${palette.accent};margin:7mm 0 2.5mm;break-after:avoid}
.doc-body h4{font-size:11.5pt;line-height:1.6;color:${palette.ink};margin:5mm 0 2mm;break-after:avoid}
.doc-body p{margin:0 0 3.6mm;text-align:start;orphans:3;widows:3}
.doc-body a{color:${palette.accent};text-decoration:none}
.doc-body strong{font-weight:800}
.doc-body ul,.doc-body ol{padding-inline-start:6mm;margin:0 0 4mm}
.doc-body li{margin:0 0 1.6mm;break-inside:avoid}
.doc-body hr{border:0;border-top:1px solid ${palette.line};margin:8mm 0}
.doc-body blockquote{margin:6mm 0;padding:5mm 6mm;border-inline-start:3pt solid ${palette.accent};background:${palette.panel};color:${palette.panelInk};break-inside:avoid}
.doc-body blockquote p{margin:0}
.doc-body table{width:100%;border-collapse:collapse;margin:5mm 0 6mm;font-size:9.4pt;table-layout:fixed;break-inside:avoid}
.doc-body thead{display:table-header-group}
.doc-body th,.doc-body td{padding:2.8mm 3mm;border-bottom:1px solid ${palette.line};text-align:start;vertical-align:top}
.doc-body th{background:${palette.accentSoft};color:${palette.ink};font-weight:800}
.doc-body tr:nth-child(even) td{background:${palette.panel}}
.doc-body pre,.doc-body code{direction:ltr;unicode-bidi:isolate;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
.doc-body code{font-size:9pt;background:${palette.panel};padding:.4mm 1.2mm;border-radius:1mm}
.doc-body pre{white-space:pre-wrap;background:${palette.panel};padding:4mm;border-inline-start:2pt solid ${palette.accent};font-size:8.8pt;line-height:1.6}
.doc-body math{direction:ltr;font-family:NoataSymbols,Noata,sans-serif}
.doc-body math[display=block]{display:block;margin:5mm 0;overflow-wrap:normal}
.lead{font-size:13.5pt;line-height:1.9;color:${palette.muted};border-inline-start:3pt solid ${palette.accent};padding-inline-start:5mm;margin:0 0 6mm}
.callout{background:${palette.panel};border:1px solid ${palette.line};border-inline-start:4pt solid ${palette.accent};padding:5mm 5.5mm;margin:5mm 0 6mm;break-inside:avoid}
.callout-title{display:block;color:${palette.accent};font-size:10pt;margin-bottom:2mm}
.callout div p:last-child{margin:0}
.endnote{margin:7mm 0 0;padding:5mm 5.5mm;border-top:2.5pt solid ${palette.accent};background:${palette.panel};break-inside:avoid}
.endnote-title{display:block;font-size:10pt;color:${palette.accent};margin-bottom:2mm}
.pullquote{margin:7mm 0;padding:0 0 0 6mm;border:0;border-inline-start:3pt solid ${palette.accent};background:transparent;color:${palette.ink};font-size:15pt;line-height:1.75;break-inside:avoid}
.pullquote cite{display:block;margin-top:3mm;font-size:9pt;font-style:normal;color:${palette.muted};letter-spacing:0}
.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:3.5mm;margin:6mm 0;break-inside:avoid}
.stats:has(> :last-child:nth-child(3)){grid-template-columns:repeat(3,1fr)}
.stat{background:${palette.panel};border-top:3pt solid ${palette.accent};padding:4.5mm;break-inside:avoid}
.stat strong{display:block;font-size:24pt;line-height:1.15;color:${palette.accent};font-variant-numeric:tabular-nums}
.stat span{display:block;margin-top:1.5mm;font-size:9.4pt;color:${palette.muted};line-height:1.55}
.timeline{list-style:none;padding:0;margin:6mm 0;position:relative}
.timeline li{display:flex;gap:5mm;padding-block:0 5mm;padding-inline:6mm 0;border-inline-start:1px solid ${palette.line};margin-inline-start:2mm;position:relative;break-inside:avoid}
.timeline li::before{content:"";position:absolute;inset-inline-start:-1.6mm;top:1.5mm;width:3mm;height:3mm;border-radius:50%;background:${palette.accent}}
.timeline-date{min-width:18mm;color:${palette.accent};font-size:9pt;font-weight:800;font-variant-numeric:tabular-nums;padding-top:.5mm}
.timeline strong{display:block;font-size:10.5pt}
.timeline p{margin:1mm 0 0;color:${palette.muted};font-size:9.6pt;line-height:1.65}
.checklist{list-style:none;padding:0;margin:5mm 0;columns:2;column-gap:7mm}
.checklist li{display:flex;gap:2.5mm;align-items:flex-start;font-size:9.8pt;line-height:1.6;margin:0 0 2mm;break-inside:avoid}
.checklist li span{flex:0 0 4mm;height:4mm;border:1px solid ${palette.accent};display:flex;align-items:center;justify-content:center;font-size:8pt;color:${palette.accent};background:${palette.accentSoft}}
.checklist li.done{color:${palette.muted};text-decoration:line-through;text-decoration-color:${palette.line}}
.ornament{display:flex;gap:2.5mm;align-items:center;justify-content:center;margin:8mm 0;color:${palette.accent}}
.ornament span{display:block;height:1px;width:12mm;background:${palette.line}}
.ornament span:nth-child(2){height:2.2mm;width:2.2mm;border-radius:50%;background:${palette.accent}}
`;
}
function coverStyles(palette:DocumentPalette,design:DocumentDesign,direction:"rtl"|"ltr",textFont:string):string{
  const rtl=direction==="rtl";
  const base=`
.cover{width:210mm;height:297mm;break-after:page;position:relative;overflow:hidden;padding:24mm;background:${palette.coverBg};color:${palette.coverInk};font-family:${textFont},Noata,NoataSymbols,sans-serif}
.cover-main{position:relative;z-index:2;display:flex;flex-direction:column;justify-content:flex-end;height:100%;max-width:150mm}
.cover-kicker{font-size:9pt;font-weight:800;text-transform:uppercase;letter-spacing:${rtl?"0":".2em"};color:${palette.coverAccent};margin:0 0 6mm}
.cover h1{font-size:${rtl?"38pt":"40pt"};line-height:1.22;margin:0;font-weight:900;letter-spacing:${rtl?"0":"-.02em"};max-width:175mm;text-wrap:pretty}
.cover-subtitle{font-size:14pt;line-height:1.7;color:${palette.coverMuted};margin:7mm 0 0;max-width:130mm}
.cover-meta{display:flex;gap:4mm;align-items:center;margin:12mm 0 0;font-size:9pt;color:${palette.coverMuted};text-transform:uppercase;letter-spacing:${rtl?"0":".12em"}}
.cover-meta i{width:1.4mm;height:1.4mm;border-radius:50%;background:${palette.coverAccent};display:block}
.cover-foot{position:absolute;inset-inline:24mm;bottom:16mm;display:flex;justify-content:space-between;font-size:8pt;color:${palette.coverMuted};letter-spacing:${rtl?"0":".16em"};z-index:2}
.cover-foot span:last-child{color:${palette.coverAccent}}
`;
  if(design.cover==="bold")return base+`
.cover{background:radial-gradient(circle at 78% 18%,${palette.deep} 0%,${palette.coverBg} 48%,${palette.coverBg} 100%)}
.orb{position:absolute;border:1px solid ${palette.coverAccent};border-radius:50%;opacity:.34}
.orb-one{width:150mm;height:150mm;top:-45mm;inset-inline-end:-35mm}
.orb-two{width:92mm;height:92mm;top:38mm;inset-inline-end:20mm;opacity:.2}
.orb-three{width:34mm;height:34mm;top:26mm;inset-inline-end:118mm;background:${palette.coverAccent};border:0;opacity:.16}
.grid-lines{position:absolute;inset:0;background-image:linear-gradient(${palette.coverAccent} 1px,transparent 1px),linear-gradient(90deg,${palette.coverAccent} 1px,transparent 1px);background-size:18mm 18mm;opacity:.045}
.cover h1{font-size:${rtl?"40pt":"48pt"}}
`;
  if(design.cover==="editorial")return base+`
.cover{background:${palette.coverBg};color:${palette.coverInk};padding-inline-start:34mm}
.cover::before{content:"";position:absolute;inset-block:0;inset-inline-start:0;width:16mm;background:${palette.coverAccent}}
.cover-main{justify-content:center;max-width:142mm}
.cover h1{font-size:${rtl?"40pt":"46pt"};color:${palette.coverInk}}
.cover-kicker{color:${palette.coverAccent}}
.edition{position:absolute;inset-inline-end:18mm;top:14mm;font-size:120pt;line-height:1;font-weight:900;color:${palette.coverAccent};opacity:.12}
.edition-rule{position:absolute;inset-inline-end:24mm;top:56mm;width:34mm;height:2px;background:${palette.coverAccent};opacity:.55}
.cover-meta,.cover-subtitle{color:${palette.coverMuted}}
`;
  return base+`
.cover{background:${palette.paper};color:${palette.ink};padding:26mm}
.cover-main{justify-content:center;max-width:148mm;margin:0 auto;text-align:center;align-items:center}
.frame{position:absolute;inset:14mm;border:1px solid ${palette.line}}
.dot{position:absolute;width:4mm;height:4mm;border-radius:50%;background:${palette.accent};inset-inline-start:50%;top:22mm;transform:translateX(-50%)}
.cover-kicker{color:${palette.accent}}
.cover h1{color:${palette.ink};font-size:${rtl?"34pt":"40pt"}}
.cover-subtitle{color:${palette.muted};margin-inline:auto}
.cover-meta{justify-content:center;color:${palette.muted}}
.cover-foot{color:${palette.muted}}
`;
}
/** Build cover and body documents separately so the cover can be full-bleed and
 * the running header/footer only applies to content pages. */
export async function designedDocumentParts(source:string,title:string,fonts:DocumentFonts,font:"noata"|"editorial"|"mono"):Promise<DesignParts>{
  const parsed=parseDesignDocument(source,title);
  const design=parsed.design;
  const direction=design.lang==="en"?"ltr":design.lang==="ar"?"rtl":documentDirection(parsed.body);
  const palette=documentPalette(design.theme);
  const textFont=font==="editorial"?"NoataEditorial":font==="mono"?"NoataMono":"Noata";
  const prepared=await blocks(parsed.body,direction);
  const markdown=await unified().use(remarkParse).use(remarkGfm).use(remarkMath)
    .use(remarkRehype).use(rehypeKatex,{output:"mathml",strict:"ignore",trust:false,maxExpand:100,maxSize:20})
    .use(() => (tree:any) => {
      const visit=(node:any)=>{
        if(node.tagName==="img"){node.tagName="span";node.children=[{type:"text",value:String(node.properties?.alt??(direction==="rtl"?"صورة":"Image"))}];node.properties={};}
        if(node.tagName==="a"){const label=node.children?.map((child:any)=>child.value??"").join("")??"";node.tagName="span";node.properties={};if(label)node.children=[{type:"text",value:label}];}
        for(const child of node.children??[])visit(child);
        if(["p","strong","em","li","th","td","h1","h2","h3","h4","blockquote"].includes(node.tagName)){
          node.children=(node.children??[]).flatMap((child:any)=>{
            if(child.type!=="text")return [child];
            const value=String(child.value??""),pieces:any[]=[];let offset=0;
            for(const match of value.matchAll(/[→←≤≥∑√∞](?:[ \t]*[→←≤≥∑√∞])*/g)){
              const at=match.index??0;
              if(at>offset)pieces.push({type:"text",value:value.slice(offset,at)});
              pieces.push({type:"element",tagName:"bdi",properties:{dir:"ltr"},children:[{type:"text",value:match[0]}]});
              offset=at+match[0].length;
            }
            if(!pieces.length)return [child];
            if(offset<value.length)pieces.push({type:"text",value:value.slice(offset)});
            return pieces;
          });
        }
      };
      visit(tree);
    }).use(rehypeStringify).process(prepared.markdown);
  let bodyContent=String(markdown);
  prepared.rendered.forEach((block,index)=>{
    bodyContent=bodyContent.replace(new RegExp(`<p>\\s*NOATA_BLOCK_${index}\\s*</p>`),block.html);
  });
  const headings=headingList(parsed.body);
  const toc=headings.length>=3?tocMarkup(headings,direction,palette):"";
  const css=bodyStyles(palette,design,direction,textFont);
  const bodyHtml=shell(direction,css,fonts,textFont,`${toc}<main class="doc-body">${bodyContent}</main>`,design.title,false);
  const coverHtml=design.cover==="none"?null:shell(direction,coverStyles(palette,design,direction,textFont),fonts,textFont,coverMarkup(design,palette,direction),design.title,true);
  return {design,direction,coverHtml,bodyHtml};
}
