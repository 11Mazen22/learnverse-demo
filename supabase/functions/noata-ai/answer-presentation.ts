/** Presentation guidance is separate from facts and never runs arbitrary styles. */
export function answerPresentation(request:string):string{
 const human=request.split(/Verified extracted original document content:|المحتوى الأصلي للملف:|مصادر الملفات المرفقة/)[0];
 const detailed=/\b(long|detailed|comprehensive|in.depth|essay|report|talk\s+along)\b|بالتفصيل|شرح طويل|مطوّل|مطول|شامل|تقرير|تقرير كامل|مقال/i.test(human);
 return "Use readable Markdown: meaningful section headings for substantive topics, short paragraphs, selective bold for key concepts, and lists or comparison tables when helpful. Avoid a wall of text, repetitive openers, a report about your writing process, and unnecessary closing offers. Present claims and uncertainty honestly. Never invent facts to fill space."+
  (detailed?" The user asked for depth. Give a complete substantial explanation with about 5-7 useful sections and concrete examples. Aim for 600-1000 relevant words unless the user specifies another length; do not stop after one paragraph or replace the requested explanation with a follow-up question.":" Match depth to the question; a greeting or simple fact does not need headings.");
}
