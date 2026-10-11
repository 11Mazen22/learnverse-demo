/** Genesis: conservative conversational routing to an actual image provider.
 * Do not send editing, multi-image, SVG or transparent-asset requests to a raster-only generator.
 */
export function imageGenerationIntent(prompt:string):"image"|null{
 const q=prompt.trim();
 if(!q||q.length>2800)return null;
 if(/^(?:how|why|what|explain|teach|tutorial)\b|^(?:ازاي|إزاي|كيف|اشرح)(?:\s|$)/i.test(q))return null;
 if(/\b(?:svg|vector|edit|modify|retouch|background removal|remove background|transparent|transparency)\b|(?:فيكتور|شفاف|شفافة|تعديل|عدّل|غير الخلفية|غيّر الخلفية)/i.test(q))return null;
 if(/\b(?:[2-9]|10|twenty|five|multiple|several)\s+(?:images|pictures|icons|logos|posters)\b|(?:صور|أيقونات|لوجوهات)\s+(?:متعددة|كثيرة)/i.test(q))return null;
 const verb=/\b(?:draw|create|generate|design|illustrate|render|paint|make)\b|(?:ارسم|اعمل|صمم|صمّم|انشئ|أنشئ|ولد|ولّد)/i;
 const subject=/\b(?:image|picture|illustration|artwork|poster|logo|icon|photo)\b|(?:صورة|صوره|رسم|بوستر|لوجو|أيقونة|ايقونة)/i;
 const directDraw=/\b(?:draw|illustrate|paint)\b|(?:ارسم|ارسملي)/i;
 if(!verb.test(q)||(!subject.test(q)&&!directDraw.test(q)))return null;
 return "image";
}
