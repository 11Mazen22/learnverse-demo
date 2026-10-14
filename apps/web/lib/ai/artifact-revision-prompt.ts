import type {ArtifactKind} from "./artifact-intent.ts";
/** User reviews the bounded revision request in the existing chat composer. */
export function artifactRevisionPrompt(format:ArtifactKind,source:string,locale:"en"|"ar"):string{
 const readable=source.replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g,"");
 const damaged=readable.length!==source.length;
 const bounded=readable.slice(0,14000);
 const partial=readable.length>bounded.length;
 const instruction=locale==="ar"
 ?"حسّن وضوح هذا المستند وترتيبه، مع الحفاظ على الحقائق الأصلية. أنشئ نسخة "+format.toUpperCase()+" قابلة للتنزيل. التعديل من النص المستخرج، وقد لا يحافظ على تنسيق الأصل."
 :"Improve this document's clarity and organization while preserving its original facts. Create a downloadable "+format.toUpperCase()+" revision. Work from the extracted text; original layout may not be preserved.";
 const notice=partial?(locale==="ar"?"\nالمصدر جزئي: أول ١٤٠٠٠ حرف فقط.":"\nPartial source: first 14,000 characters only."):"";
 const damagedNotice=damaged?(locale==="ar"?"\nلم تُقرأ بعض رموز المصدر. راجع الملف الأصلي قبل التعديل.":"\nSome source characters could not be read. Check the original file before revising."):"";
 return instruction+notice+damagedNotice+"\n\n"+(locale==="ar"?"المحتوى الأصلي للملف:":"Verified extracted original document content:")+"\n"+bounded;
}
