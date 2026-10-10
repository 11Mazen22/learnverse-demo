/** AI may SUGGEST colors, but it may never inject arbitrary CSS/JS/HTML.
 * Users preview structured, contrast-checked color tokens before committing.
 */
export type DesignTokens = { accent: string; deep: string; bright: string };
export type CustomDesign = {
 id: string; user_id: string; name: string; description: string;
 tokens: DesignTokens; visible: boolean;
};
const HEX = /^#[0-9a-fA-F]{6}$/;
export function relativeLuminance(hex:string):number {
 if(!HEX.test(hex)) throw Error("Invalid hexadecimal color");
 const channels = [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const [r,g,b]=channels.map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
 return .2126*r+.7152*g+.0722*b;
}
export function contrastRatio(a:string,b:string):number {
 const x=relativeLuminance(a),y=relativeLuminance(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
export function validateTokens(value:unknown):DesignTokens {
 if(!value||typeof value!=="object")throw Error("الاقتراح لا يحتوي على ألوان صحيحة.");
 const obj=value as Record<string,unknown>;
 const tokens:DesignTokens={accent:String(obj.accent??""),deep:String(obj.deep??""),bright:String(obj.bright??"")};
 for(const [key,color] of Object.entries(tokens)) {
   if(!HEX.test(color)) throw Error("لون "+key+" غير صالح؛ يجب أن يكون بصيغة HEX.");
 }
 if(contrastRatio(tokens.accent,"#ffffff")<4.5)
   throw Error("درجة اللون الرئيسي فاتحة أكثر من اللازم للنص والأزرار على الخلفية البيضاء. اطلب لونًا أغمق.");
 if(contrastRatio(tokens.deep,"#ffffff")<7)
   throw Error("لون الخلفية الداكنة لا يحقق تباينًا مناسبًا للنص. اطلب درجة أغمق.");
 return tokens;
}
export function parseDesignSuggestion(raw:string):{name:string;description:string;tokens:DesignTokens} {
 if(raw.length>16000)throw Error("رد الذكاء الاصطناعي أكبر من الحد المسموح.");
 // A model may wrap its answer in a code fence or add prose containing braces.
 // Read one balanced JSON object at a time rather than spanning the first and
 // last brace, which accidentally joined separate objects into invalid JSON.
 let obj:Record<string,unknown>|null=null;
 for(let start=raw.indexOf("{");start>=0;start=raw.indexOf("{",start+1)) {
  let depth=0,quoted=false,escaped=false;
  for(let i=start;i<raw.length;i++) {
   const char=raw[i];
   if(quoted){if(escaped)escaped=false;else if(char==="\\")escaped=true;else if(char==='"')quoted=false;continue;}
   if(char==='"'){quoted=true;continue;}
   if(char==="{")depth++;
   if(char==="}" && --depth===0){
    try{
     const candidate:unknown=JSON.parse(raw.slice(start,i+1));
     if(candidate && typeof candidate==="object" && !Array.isArray(candidate)) {
      const value=candidate as Record<string,unknown>;
      if("tokens" in value){obj=value;break;}
     }
    }catch{/* Continue searching for a complete design object. */}
    break;
   }
  }
  if(obj)break;
 }
 if(!obj)throw Error("رد Fanar ليس JSON صالحًا. جرّب مرة أخرى.");
 if(!obj||typeof obj!=="object")throw Error("صيغة التصميم غير صحيحة.");
 const name=typeof obj.name==="string"?obj.name.trim():"";
 const description=typeof obj.description==="string"?obj.description.trim():"";
 if(name.length<2||name.length>50||description.length>180)
   throw Error("عنوان أو وصف التصميم خارج الحدود المسموحة.");
 return {name,description,tokens:validateTokens(obj.tokens)};
}
export function applyCustomDesign(tokens:DesignTokens):void {
 const safe=validateTokens(tokens), root=document.documentElement;
 root.style.setProperty("--custom-accent",safe.accent);
 root.style.setProperty("--custom-deep",safe.deep);
 root.style.setProperty("--custom-bright",safe.bright);
 root.dataset.palette="custom";
}
export function clearCustomDesign():void {
 for(const key of ["--custom-accent","--custom-deep","--custom-bright"])document.documentElement.style.removeProperty(key);
}
export function isDesignRecord(value:unknown):value is CustomDesign {
 if(!value||typeof value!=="object")return false;
 const x=value as Record<string,unknown>;
 if(typeof x.id!=="string"||typeof x.user_id!=="string"||typeof x.name!=="string"||typeof x.visible!=="boolean")return false;
 try{validateTokens(x.tokens);return true;}catch{return false;}
}
export const DESIGN_STUDIO_INSTRUCTION = [
 "صمّم نظام ألوان أنيقًا ومريحًا للعين لتطبيق تعليمي اسمه Noata.",
 "لا تنشئ أكواد CSS أو HTML أو JavaScript أو أسماء ملفات أو صور.",
 "أرجع JSON واحدًا فقط بلا markdown وبالمفاتيح التالية:",
 '{"name":"اسم قصير بالعربية","description":"وصف عربي مختصر","tokens":{"accent":"#24508C","deep":"#132B4D","bright":"#5194CD"}}',
 "يجب أن تكون accent داكنة بما يكفي لتباين نص أبيض WCAG AA (4.5:1)، وأن تكون deep داكنة جدًا لتباين 7:1.",
 "اجعل bright درجة مساندة جميلة متناغمة مع accent وdeep؛ لا تخترع أسماء رمزية للألوان.",
 "لا تذكر معلومات شخصية. ألوان هذا التصميم تُعايَن قبل الموافقة والحفظ.",
].join("\n");
export const DESIGN_STUDIO_INSTRUCTION_EN = [
  "Suggest a refined, accessible color palette for an educational app called Noata.",
  "Do not produce CSS, HTML, JavaScript, file names, or images.",
  "Return exactly one JSON object with these keys, without markdown:",
  '{"name":"Short English name","description":"Brief English description","tokens":{"accent":"#24508C","deep":"#132B4D","bright":"#5194CD"}}',
  "The accent must contrast at least 4.5:1 with white text, and deep must contrast at least 7:1 with white text.",
  "Choose a harmonious supporting bright color. Use six-digit hexadecimal colors only.",
  "Do not include personal information. The user will preview and approve the colors before saving.",
].join("\n");
