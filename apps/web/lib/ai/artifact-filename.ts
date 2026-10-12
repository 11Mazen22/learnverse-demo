/** Display names never determine private storage paths. No prompt/excerpt is copied wholesale. */
export type DownloadFormat="pdf"|"docx"|"xlsx"|"pptx"|"md"|"txt"|"csv"|"tsv"|"json"|"svg"|"png"|"jpeg"|"zip";
const labels:Record<string,[string,string]>={
 pdf:["Learning guide","دليل تعليمي"],docx:["Learning document","مستند تعليمي"],
 xlsx:["Learning workbook","جدول تعليمي"],pptx:["Learning presentation","عرض تعليمي"],
 md:["Study notes","ملاحظات دراسية"],txt:["Study notes","ملاحظات دراسية"]
};
function safeTitle(value:string):string{
 const normalized=value.normalize("NFKC").replace(/[\p{Cc}\p{Cf}]/gu,"").trim();
 // Never turn an address, token, path or private identifier into a download title.
 if(/[\\/]|https?:|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:bearer|api[_ -]?key|password|secret)\b|\b\d{9,}\b/i.test(normalized))return "";
 const clean=normalized.replace(/[<>:"|?*]/g,"").replace(/^[#.\s]+|[.\s]+$/g,"")
  .replace(/\.(?:pdf|docx|xlsx|pptx|md|txt|csv|tsv|json|svg|png|jpe?g|zip|exe)$/i,"")
  .replace(/\s+/g," ").trim();
 if(!clean||/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(clean)||
  /^(?:noata[- ]|document\d*$|untitled|output$|generated[- ]file)/i.test(clean))return "";
 return Array.from(clean).slice(0,78).join("").replace(/[.\s]+$/g,"");
}
export function artifactFilename(input:{format:DownloadFormat;title?:string;content?:string;locale?:"en"|"ar";revision?:boolean}):string{
 const heading=input.content?.match(/^(?:\*\*)?\\?#{1,3}\s+(.+?)(?:\*\*)?\s*$/m)?.[1]??"";
 const requestTitle=/^(?:create|make|generate|export|download|write|rewrite|improve|please|can you|أنشئ|انشئ|اصنع|اعمل|جهز|عدّل|اكتب)(?:\s|$)/i.test((input.title??"").trim());
 const candidate=safeTitle(heading)||(!requestTitle?safeTitle(input.title??""):"");
 const ar=input.locale==="ar"||(!input.locale&&/[\u0621-\u064a]/.test(candidate||input.content||input.title||""));
 const fallback=(labels[input.format]??["Learning resource","مورد تعليمي"])[ar?1:0];
 const title=candidate||fallback;
 const suffix=input.revision?(ar?" — نسخة معدلة":" — Revised"):"";
 const max=99-input.format.length-1-suffix.length;
 return title.slice(0,max).trim()+suffix+"."+input.format;
}
