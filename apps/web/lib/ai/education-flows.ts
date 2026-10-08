/**
 * Explicitly defined, validated education prompts. They are ordinary
 * Fanar chat requests, not fake dedicated provider endpoints.
 */
export const EDUCATION_FLOWS=[
  {id:"explain",title:"اشرح لي درسًا",description:"شرح متدرّج بأمثلة وسؤال تحقّق",icon:"book",outcome:"شرح مقسّم لخطوات، أمثلة محلولة، ثم سؤال واحد يتأكد من فهمك.",placeholder:"مثلًا: قانون جيب التمام، أو التمثيل الضوئي"},
  {id:"quiz",title:"اختبر فهمي",description:"أسئلة متنوعة وتصحيح بعد إجابتك",icon:"target",outcome:"أسئلة فقط في البداية، وبعد إجابتك تصحيح مفصّل وقائمة بما تحتاج مراجعته.",placeholder:"مثلًا: الحرب العالمية الأولى، الفصل الثالث"},
  {id:"flashcards",title:"بطاقات مراجعة",description:"سؤال وجواب لكل فكرة مهمة",icon:"review",outcome:"جدول بطاقات (سؤال | إجابة) جاهز للحفظ والمراجعة السريعة.",placeholder:"مثلًا: مصطلحات الخلية، أو مفردات الوحدة الثانية"},
  {id:"summary",title:"لخّص المحتوى",description:"الأفكار الأساسية والمصطلحات بدقة",icon:"edit",outcome:"فكرة أساسية، نقاط مهمة، ومصطلحات يجب حفظها دون إضافة معلومات غير مدعومة.",placeholder:"الصق الفقرة أو اكتب عنوان الدرس الذي تريد تلخيصه"},
  {id:"plan",title:"جدول مذاكرة",description:"خطة عملية واقعية قابلة للتنفيذ",icon:"clock",outcome:"أسئلة قصيرة عن وقتك المتاح، ثم جدول يومي بفترات راحة واقعية.",placeholder:"مثلًا: امتحان الفيزياء بعد أسبوعين، 3 ساعات يوميًا"},
  {id:"writing",title:"حسّن كتابتي",description:"تصحيح لغوي وأسلوبي مع حفظ المعنى",icon:"ai",outcome:"نسخة محرّرة من نصك وقائمة قصيرة تشرح أهم التصحيحات.",placeholder:"الصق النص الذي تريد مراجعته"},
] as const;
export type EducationFlowId=typeof EDUCATION_FLOWS[number]["id"];

export const EDUCATION_LEVELS=[
  {id:"primary",label:"ابتدائي",prompt:"طالب في المرحلة الابتدائية"},
  {id:"middle",label:"إعدادي",prompt:"طالب في المرحلة الإعدادية"},
  {id:"secondary",label:"ثانوي",prompt:"طالب في المرحلة الثانوية"},
  {id:"university",label:"جامعي",prompt:"طالب جامعي"},
] as const;
export type EducationLevelId=typeof EDUCATION_LEVELS[number]["id"];

export const EDUCATION_DEPTHS=[
  {id:"brief",label:"مختصر",prompt:"اجعل الرد مختصرًا ومركّزًا",count:5},
  {id:"balanced",label:"متوازن",prompt:"اجعل الرد متوازنًا في الطول",count:8},
  {id:"deep",label:"مفصّل",prompt:"قدّم ردًا مفصّلًا وعميقًا",count:12},
] as const;
export type EducationDepthId=typeof EDUCATION_DEPTHS[number]["id"];

export type EducationOptions={level?:EducationLevelId;depth?:EducationDepthId};

export function getEducationFlow(id:EducationFlowId){
 return EDUCATION_FLOWS.find(flow=>flow.id===id)??EDUCATION_FLOWS[0];
}

export function buildEducationPrompt(flow:EducationFlowId,topic:string,options:EducationOptions={}):string {
 const safe=topic.trim().replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g," ");
 if(safe.length<2||safe.length>1200)throw new Error("الموضوع يجب أن يكون بين حرفين و1200 حرف.");
 const level=EDUCATION_LEVELS.find(l=>l.id===(options.level??"secondary"))??EDUCATION_LEVELS[2];
 const depth=EDUCATION_DEPTHS.find(d=>d.id===(options.depth??"balanced"))??EDUCATION_DEPTHS[1];
 const header=`**ورشة المذاكرة · ${getEducationFlow(flow).title}** — المستوى: ${level.label} · العمق: ${depth.label}\n\n`;
 const common=`\n\nالجمهور: ${level.prompt}. ${depth.prompt}. استخدم العربية الفصحى الواضحة ونسّق الرد بعناوين وقوائم. اذكر أي معلومة غير مؤكدة. لا تختلق نصوصًا قرآنية أو مراجع. إذا أرفقتُ مستندًا فالتزم بما يدعمه.`;
 switch(flow){
  case "explain":return `${header}اشرح هذا الموضوع خطوة بخطوة مع أمثلة مناسبة، ثم اسألني سؤال تحقّق واحدًا: ${safe}${common}`;
  case "quiz":return `${header}صمّم اختبارًا من ${depth.count} أسئلة متنوعة (اختيار من متعدد، صح/خطأ، وإجابة قصيرة) عن: ${safe}. اعرض الأسئلة فقط أولًا وانتظر إجاباتي، ثم صحّحها بشرح موجز وسجّل المهارات التي تحتاج مراجعة.${common}`;
  case "flashcards":return `${header}أنشئ ${depth.count} بطاقات مراجعة عن: ${safe}. استخدم جدولًا من عمودين (سؤال | إجابة) بإجابات دقيقة ومختصرة.${common}`;
  case "summary":return `${header}اكتب ملخصًا مركّزًا عن: ${safe}. قسّمه إلى: الفكرة الأساسية، النقاط المهمة، والمصطلحات التي يجب حفظها. لا تضف حقائق لا يدعمها النص أو الموضوع.${common}`;
  case "plan":return `${header}ساعدني في إعداد خطة مذاكرة لهذا الهدف: ${safe}. اسألني أولًا عن الوقت المتاح والموعد النهائي إن لم أحددهما، ثم اكتب جدولًا قابلًا للتعديل مع فترات راحة واقعية.${common}`;
  case "writing":return `${header}راجع النص التالي لغويًا وأسلوبيًا مع الحفاظ على المعنى: ${safe}. قدّم نسخة محرّرة وقائمة قصيرة تشرح أهم التصحيحات.${common}`;
 }
}
