import type {ArtifactKind} from "./artifact-intent.ts";
/** User reviews the bounded revision request in the existing chat composer. */
export function artifactRevisionPrompt(format:ArtifactKind,source:string,locale:"en"|"ar"):string{
 const bounded=source.slice(0,14000);
 const partial=source.length>bounded.length;
 const instruction=locale==="ar"
 ?"حسّن وضوح هذا المستند وترتيبه، مع الحفاظ على الحقائق الأصلية. أنشئ نسخة "+format.toUpperCase()+" قابلة للتنزيل. التعديل من النص المستخرج، وقد لا يحافظ على تنسيق الأصل."
 :"Improve this document's clarity and organization while preserving its original facts. Create a downloadable "+format.toUpperCase()+" revision. Work from the extracted text; original layout may not be preserved.";
 const notice=partial?(locale==="ar"?"\nالمصدر جزئي: أول ١٤٠٠٠ حرف فقط.":"\nPartial source: first 14,000 characters only."):"";
 return instruction+notice+"\n\n"+(locale==="ar"?"المحتوى الأصلي للملف:":"Verified extracted original document content:")+"\n"+bounded;
}
