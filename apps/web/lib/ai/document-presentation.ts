import type {DocumentStyle} from "./document-style.ts";
export type DocumentPresentation={style:DocumentStyle;font:"noata"|"editorial"|"mono"};
const marker="<!-- noata-document-presentation ";
export function checkedPresentation(value:unknown):DocumentPresentation{
 const v=value as Partial<DocumentPresentation>|null;
 return {style:v?.style==="forest"?"forest":v?.style==="editorial"?"editorial":"classic",font:v?.font==="mono"?"mono":v?.font==="editorial"?"editorial":"noata"};
}
export function readDocumentSource(value:string|null|undefined):{text:string;presentation:DocumentPresentation}{
 const text=typeof value==="string"?value:"";
 if(text.startsWith(marker)){
  const end=text.indexOf(" -->\n",marker.length);
  if(end>0&&end<220)try{
   const v=JSON.parse(text.slice(marker.length,end));
   if(v?.version===1&&["classic","forest","editorial"].includes(v.style)&&["noata","editorial","mono"].includes(v.font))
    return {text:text.slice(end+5).replace(/^\n/,""),presentation:checkedPresentation(v)};
  }catch{/* A malformed comment remains source text; never silently erase it. */}
 }
 return {text,presentation:checkedPresentation(null)};
}
export function storedDocumentSource(text:string,presentation:DocumentPresentation):string{
 const stored=marker+JSON.stringify({version:1,...checkedPresentation(presentation)})+" -->\n\n"+text;
 if(stored.length>160000)throw Error("source_content_limit");
 return stored;
}
export function requestedDocumentPresentation(request:string,inherited?:unknown):DocumentPresentation{
 const result=checkedPresentation(inherited);
 const leading=request.split(/Verified extracted original document content:|المحتوى الأصلي للملف:|مصادر الملفات المرفقة/)[0];
 if(/\b(?:roboto\s*mono|monospace|monospaced)\b|خط أحادي/i.test(leading))result.font="mono";
 else if(/\blora\b/i.test(leading))result.font="editorial";
 else if(/\bcairo\b|خط القاهرة/i.test(leading))result.font="noata";
 if(/\b(?:calm forest|forest palette|forest style|green theme)\b|غابة هادئة|ألوان خضراء/i.test(leading))result.style="forest";
 else if(/\b(?:warm editorial|editorial style|editorial palette)\b|تحريري دافئ/i.test(leading))result.style="editorial";
 else if(/\bclassic (?:style|palette)\b|مظهر كلاسيكي/i.test(leading))result.style="classic";
 return result;
}
