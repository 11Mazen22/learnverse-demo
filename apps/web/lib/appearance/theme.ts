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
export function validateTokens(value:unknown,locale:"ar"|"en"="ar"):DesignTokens {
  if(!value||typeof value!=="object")throw Error(locale==="en"?"The suggestion does not contain valid colors.":"الاقتراح لا يحتوي على ألوان صحيحة.");
 const obj=value as Record<string,unknown>;
 const tokens:DesignTokens={accent:String(obj.accent??""),deep:String(obj.deep??""),bright:String(obj.bright??"")};
 for(const [key,color] of Object.entries(tokens)) {
    if(!HEX.test(color)) throw Error(locale==="en"?"Invalid "+key+" color; use a six-digit HEX value.":"لون "+key+" غير صالح؛ يجب أن يكون بصيغة HEX.");
 }
 if(contrastRatio(tokens.accent,"#ffffff")<4.5)
    throw Error(locale==="en"?"The primary color is too light for text and buttons on white. Ask for a darker color.":"درجة اللون الرئيسي فاتحة أكثر من اللازم للنص والأزرار على الخلفية البيضاء. اطلب لونًا أغمق.");
 if(contrastRatio(tokens.deep,"#ffffff")<7)
    throw Error(locale==="en"?"The dark background does not provide enough text contrast. Ask for a darker shade.":"لون الخلفية الداكنة لا يحقق تباينًا مناسبًا للنص. اطلب درجة أغمق.");
 return tokens;
}
/** Recover presentation-only annotations without evaluating model-written code.
 * Strings stay byte-for-byte intact; all recovered values still pass JSON.parse
 * and the same schema, HEX and contrast validation as strict JSON responses.
 */
function normalizeAnnotatedJson(raw:string):string {
 let result="",quoted=false,escaped=false;
 for(let i=0;i<raw.length;i++){
  const char=raw[i];
  if(quoted){result+=char;if(escaped)escaped=false;else if(char==="\\")escaped=true;else if(char==='"')quoted=false;continue;}
  if(char==='"'){quoted=true;result+=char;continue;}
  if(char==="#"||(char==="/"&&raw[i+1]==="/")){
   while(i<raw.length&&raw[i]!=="\n"&&raw[i]!=="\r")i++;
   result+="\n";continue;
  }
  if(char==="/"&&raw[i+1]==="*"){
   const end=raw.indexOf("*/",i+2);
   if(end<0)return raw; // An unterminated comment is not recoverable.
   i=end+1;result+=" ";continue;
  }
  result+=char==="،"?",":char;
 }
 // Remove only structural trailing commas, never commas inside quoted strings.
 let clean="";quoted=false;escaped=false;
 for(let i=0;i<result.length;i++){
  const char=result[i];
  if(quoted){clean+=char;if(escaped)escaped=false;else if(char==="\\")escaped=true;else if(char==='"')quoted=false;continue;}
  if(char==='"'){quoted=true;clean+=char;continue;}
  if(char===","){let next=i+1;while(/\s/.test(result[next]??"")&&next<result.length)next++;if(result[next]==="}"||result[next]==="]")continue;}
  clean+=char;
 }
 return clean;
}
export function parseDesignSuggestion(raw:string,locale:"ar"|"en"="ar"):{name:string;description:string;tokens:DesignTokens} {
  if(raw.length>16000)throw Error(locale==="en"?"The AI response exceeds the permitted size.":"رد الذكاء الاصطناعي أكبر من الحد المسموح.");
  raw=normalizeAnnotatedJson(raw);
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
  if(!obj)throw Error(locale==="en"?"Fanar did not return a valid design. Please try again.":"رد Fanar ليس JSON صالحًا. جرّب مرة أخرى.");
 const name=typeof obj.name==="string"?obj.name.trim():"";
 const description=typeof obj.description==="string"?obj.description.trim():"";
 if(name.length<2||name.length>50||description.length>180)
    throw Error(locale==="en"?"The design name or description is outside the permitted length.":"عنوان أو وصف التصميم خارج الحدود المسموحة.");
  return {name,description,tokens:validateTokens(obj.tokens,locale)};
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
  "لا تكتب أي تعليقات داخل JSON؛ لا تستخدم // أو # أو /* */. استخدم الفاصلة الإنجليزية , فقط بين الحقول.",
 '{"name":"اسم قصير بالعربية","description":"وصف عربي مختصر","tokens":{"accent":"#24508C","deep":"#132B4D","bright":"#5194CD"}}',
 "يجب أن تكون accent داكنة بما يكفي لتباين نص أبيض WCAG AA (4.5:1)، وأن تكون deep داكنة جدًا لتباين 7:1.",
 "اجعل bright درجة مساندة جميلة متناغمة مع accent وdeep؛ لا تخترع أسماء رمزية للألوان.",
 "لا تذكر معلومات شخصية. ألوان هذا التصميم تُعايَن قبل الموافقة والحفظ.",
].join("\n");
export const DESIGN_STUDIO_INSTRUCTION_EN = [
  "Suggest a refined, accessible color palette for an educational app called Noata.",
  "Do not produce CSS, HTML, JavaScript, file names, or images.",
  "Return exactly one JSON object with these keys, without markdown:",
  "Do not include comments using //, # or /* */. Use ASCII commas between fields.",
  '{"name":"Short English name","description":"Brief English description","tokens":{"accent":"#24508C","deep":"#132B4D","bright":"#5194CD"}}',
  "The accent must contrast at least 4.5:1 with white text, and deep must contrast at least 7:1 with white text.",
  "Choose a harmonious supporting bright color. Use six-digit hexadecimal colors only.",
  "Do not include personal information. The user will preview and approve the colors before saving.",
].join("\n");
