/** A designed document is authored as a compact JSON front matter plus a real
 * Markdown body. Only allowlisted design tokens are accepted, so a model can
 * choose a visual direction without injecting CSS, HTML or remote assets.
 */
export const DOCUMENT_THEMES = ["midnight","ivory","forest","sand","cobalt","rose","graphite"] as const;
export const DOCUMENT_COVERS = ["bold","editorial","minimal","none"] as const;
export type DocumentTheme = typeof DOCUMENT_THEMES[number];
export type DocumentCover = typeof DOCUMENT_COVERS[number];
export type DocumentDesign = {
  version:1;
  title:string;
  subtitle?:string;
  kicker?:string;
  author?:string;
  date?:string;
  theme:DocumentTheme;
  cover:DocumentCover;
  toc:boolean;
  pageNumbers:boolean;
  lang?:"ar"|"en";
};
export type ParsedDesignDocument = { design:DocumentDesign; body:string; designed:boolean };
export const MAX_DESIGN_BODY = 90_000;

const marker=/^\uFEFF?---noata[ \t]*\r?\n([\s\S]{0,6000}?)\r?\n---[ \t]*(?:\r?\n|$)/i;
const clean=(value:unknown,max:number):string=>typeof value==="string"
 ?value.replace(/[\x00-\x08\x0b-\x1f\x7f]/g," ").replace(/\s+/g," ").trim().slice(0,max):"";
const oneOf=<T extends string>(value:unknown,allowed:readonly T[],fallback:T):T=>
 typeof value==="string"&&(allowed as readonly string[]).includes(value)?value as T:fallback;

export function documentThemeForStyle(style:unknown):DocumentTheme{
 return style==="forest"?"forest":style==="editorial"?"ivory":"midnight";
}
function titleFromBody(body:string,fallback:string):string{
 const heading=body.match(/^#{1,2}[ \t]+(.+)$/m)?.[1]??fallback;
 return clean(heading.replace(/[*_`#>]/g,""),120)||"Noata document";
}
const titleKey=(value:string):string=>value.normalize("NFKC")
 .replace(/[\u0640\u064b-\u065f\u0670]/g,"")
 .replace(/[^\p{L}\p{N}]+/gu,"").toLocaleLowerCase();
/** The cover already prints the title. Drop a leading repeated heading or bold
 * line so a model-authored body cannot duplicate it on the first content page. */
function withoutDuplicateTitle(body:string,title:string):string{
 const key=titleKey(title);if(!key)return body;
 const lines=body.split(/\r?\n/);let first=0;
 while(first<lines.length&&!lines[first].trim())first++;
 if(first>=lines.length)return body;
 const line=lines[first].trim();
 const heading=line.match(/^#{1,2}[ \t]+(.+?)[ \t]*#*$/)?.[1]??line.match(/^\*\*(.+?)\*\*$/)?.[1];
 if(!heading||titleKey(heading.replace(/[*_`#>]/g,""))!==key)return body;
 lines.splice(first,1);
 while(first<lines.length&&!lines[first].trim())lines.splice(first,1);
 return lines.join("\n");
}
function withoutChatPreamble(body:string):string{
 const lines=body.replace(/^\uFEFF/,"").split(/\r?\n/);let first=0;
 while(first<lines.length&&!lines[first].trim())first++;
 if(first>=lines.length)return body;
 const line=lines[first].trim();
 if(!/^(?:(?:بالتأكيد|بالطبع|تمام)[!،,.:\s]+(?:إليك|هذا|فيما يلي|أدناه)|(?:إليك|هذا هو|فيما يلي)[ \t]+(?:التقرير|المستند|الملف|النص)|(?:Sure|Of course|Certainly)[!,.:\s]+(?:here|below)|Here(?:'s| is)[ \t]+(?:the|your)[ \t]+(?:report|document|file))/i.test(line))return body;
 lines.splice(first,1);
 while(first<lines.length&&!lines[first].trim())lines.splice(first,1);
 return lines.join("\n");
}
export function designFromMarkdown(body:string,title?:string,style?:unknown,lang?:"ar"|"en"):DocumentDesign{
 const cleanBody=typeof body==="string"?body:"";
 return {
  version:1,title:titleFromBody(cleanBody,title?.trim()||"Noata document"),
  theme:documentThemeForStyle(style),cover:"editorial",toc:true,pageNumbers:true,...(lang?{lang}:{})
 };
}
function checkedDesign(value:Record<string,unknown>,body:string,fallbackTitle:string,lang?:"ar"|"en"):DocumentDesign{
 const fallback=designFromMarkdown(body,fallbackTitle,undefined,lang);
 const title=clean(value.title,120)||fallback.title;
 const subtitle=clean(value.subtitle,180),kicker=clean(value.kicker,60),
  author=clean(value.author,80),date=clean(value.date,40);
 const design:DocumentDesign={
  version:1,title,
  theme:oneOf(value.theme,DOCUMENT_THEMES,fallback.theme),
  cover:oneOf(value.cover,DOCUMENT_COVERS,"editorial"),
  toc:value.toc!==false,pageNumbers:value.pageNumbers!==false,
  lang:value.lang==="en"?"en":value.lang==="ar"?"ar":lang??(/[\u0600-\u06ff]/.test(body)?"ar":"en"),
  ...(subtitle?{subtitle}:{}),...(kicker?{kicker}:{}),...(author?{author}:{}),...(date?{date}:{})
 };
 return design;
}
/** Parse the author's output. A marker without valid JSON is still treated as a
 * designed document so raw metadata can never appear on a printed page. */
export function parseDesignDocument(source:string,fallbackTitle="Noata document",lang?:"ar"|"en"):ParsedDesignDocument{
 const text=typeof source==="string"?source:"";
 if(text.length>MAX_DESIGN_BODY+8_000)throw Error("document_too_large");
 // Accept a stray chat lead-in before the marker, but never print it.
 const start=text.search(/^---noata[ \t]*$/im);
 const normalized=start>=0?text.slice(start):text.replace(/^\uFEFF/,"");
 const match=normalized.match(marker);
 if(!match){
  if(start>=0){
   // An unclosed marker is still metadata. Drop it rather than print JSON.
   const close=normalized.indexOf("\n---",8);
   const rawBody=(close>=0?normalized.slice(close+4):normalized.replace(/^---noata[\s\S]*/i,"")).trim();
   const design=designFromMarkdown(rawBody,fallbackTitle,undefined,lang);
   return {design,body:withoutDuplicateTitle(withoutChatPreamble(rawBody),design.title).trim(),designed:true};
  }
  const fallbackDesign=designFromMarkdown(normalized,fallbackTitle,undefined,lang);
  return {design:fallbackDesign,body:withoutDuplicateTitle(withoutChatPreamble(normalized),fallbackDesign.title).trim(),designed:false};
 }
 const rawBody=normalized.slice(match[0].length).trim();
 let value:Record<string,unknown>={};
 try{const parsed=JSON.parse(match[1]);if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed))value=parsed as Record<string,unknown>;}catch{/* checkedDesign applies safe defaults */}
 const design=checkedDesign(value,rawBody,fallbackTitle,lang);
 return {design,body:withoutDuplicateTitle(withoutChatPreamble(rawBody),design.title).trim(),designed:true};
}
export function serializeDesignDocument(design:DocumentDesign,body:string):string{
 const checked=checkedDesign(design as unknown as Record<string,unknown>,body,design.title,design.lang);
 const meta=JSON.stringify({version:1,title:checked.title,...(checked.subtitle?{subtitle:checked.subtitle}:{}),
  ...(checked.kicker?{kicker:checked.kicker}:{}),...(checked.author?{author:checked.author}:{}),...(checked.date?{date:checked.date}:{}),
  theme:checked.theme,cover:checked.cover,toc:checked.toc,pageNumbers:checked.pageNumbers,...(checked.lang?{lang:checked.lang}:{})});
 const result="---noata\n"+meta+"\n---\n\n"+body.trim();
 if(result.length>MAX_DESIGN_BODY+8_000)throw Error("document_too_large");
 return result;
}
/** Body-only view for previews and safety checks. */
export function stripDesignFrontMatter(source:string):string{
 try{return parseDesignDocument(source).body;}
 catch{const match=source.match(marker);return (match?source.slice(match[0].length):source).trim();}
}
