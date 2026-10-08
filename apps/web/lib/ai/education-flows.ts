/**
 * Explicitly defined, validated education prompts. They are ordinary
 * Fanar chat requests, not fake dedicated provider endpoints.
 */
export const EDUCATION_FLOWS=[
  {id:"explain",title:"اشرحلي درس",description:"شرح متدرج بأمثلة وأسئلة متابعة",icon:"book"},
  {id:"quiz",title:"اختبر فهمي",description:"اختبار من خمس أسئلة مع تصحيح بعد الإجابة",icon:"target"},
  {id:"flashcards",title:"بطاقات مراجعة",description:"سؤال وجواب لكل فكرة مهمة",icon:"review"},
  {id:"summary",title:"لخّص المحتوى",description:"أهم النقاط والمفاهيم مع الحفاظ على الدقة",icon:"edit"},
  {id:"plan",title:"جدول مذاكرة",description:"خطة عملية قابلة للتنفيذ",icon:"clock"},
  {id:"writing",title:"حسّن كتابتي",description:"مراجعة الأخطاء والصياغة دون تغيير المعنى",icon:"ai"},
] as const;
export type EducationFlowId=typeof EDUCATION_FLOWS[number]["id"];
export function buildEducationPrompt(flow:EducationFlowId,topic:string):string {
 const safe=topic.trim().replace(/[\u0000-\u001f\u007f]/g," ");
 if(safe.length<2||safe.length>1200)throw new Error("الموضوع لازم يكون بين حرفين و1200 حرف.");
 const common="استخدم العربية الواضحة، واذكر أي معلومة غير مؤكدة. لا تختلق نصوصًا قرآنية أو مراجع. إذا كان المستخدم أرفق مستندًا التزم بما يدعمه.";
 switch(flow){
  case "explain":return `اشرح هذا الموضوع خطوة بخطوة وبأمثلة مناسبة لطالب ثانوي، ثم اسألني سؤال تحقق واحدًا: ${safe}\n${common}`;
  case "quiz":return `صمّم اختبارًا من 5 أسئلة متنوعة عن: ${safe}. اعرض الأسئلة فقط أولًا، وانتظر إجاباتي ثم صحّحها بشرح موجز وسجلًا للمهارات التي تحتاج مراجعة.\n${common}`;
  case "flashcards":return `أنشئ 8 بطاقات مراجعة عن: ${safe}. استخدم جدولًا من عمودين (سؤال | إجابة) مع إجابات دقيقة ومختصرة.\n${common}`;
  case "summary":return `اكتب ملخصًا مركزًا عن: ${safe}. قسّمه إلى فكرة أساسية، نقاط مهمة، ومصطلحات يجب حفظها. لا تضف حقائق لا يدعمها النص أو الموضوع.\n${common}`;
  case "plan":return `ساعدني أعمل خطة مذاكرة لهذا الهدف: ${safe}. اسألني أولًا عن الوقت المتاح والموعد النهائي إذا لم أحددهما، ثم اكتب جدولًا قابلًا للتعديل وفترات راحة واقعية.\n${common}`;
  case "writing":return `راجع النص التالي لغويًا وأسلوبياً مع الحفاظ على المعنى: ${safe}. قدّم نسخة محررة وقائمة قصيرة تشرح أهم التصحيحات.\n${common}`;
 }
}
