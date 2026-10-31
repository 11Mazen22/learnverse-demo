export interface HelpArticle {
  slug: string;
  category: string;
  categoryAr: string;
  categoryEn: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  contentAr: string;
  contentEn: string;
  tags: string[];
}

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "curriculum-overview",
    category: "curriculum",
    categoryAr: "المنهج والمواد",
    categoryEn: "Curriculum & Subjects",
    titleAr: "هيكل المنهج الدراسي والمواد الستة المقررة",
    titleEn: "Curriculum Structure & The Six Core Subjects",
    summaryAr: "دليل شامل للمواد الستة المقررة في الصف الأول الثانوي — الترم الأول 2026–2027.",
    summaryEn: "A comprehensive guide to the six core subjects in First Secondary Term 1 (2026–2027).",
    tags: ["curriculum", "subjects", "term1", "مواد", "منهج"],
    contentAr: `
منصة نقطة تقدم منهج الصف الأول الثانوي — الترم الأول (العام الدراسي 2026–2027) منظمًا في ست عائلات دراسية رئيسية:

1. العلوم المتكاملة (Integrated Science): تركز على الغلاف المائي على الأرض، الخواص الكيميائية والفيزيائية للماء، المحاليل المائية، والأهمية الحيوية للماء.
2. الرياضيات (Mathematics): تشمل الأعداد المركبة، تحديد نوع جذري المعادلة التربيعية، العلاقة بين الجذرين والمعاملات، وإشارة الدوال والمتباينات التربيعية.
3. التاريخ (History): دراسة حضارة مصر والعالم القديم، مفهوم الحضارة والتاريخ، وانتقال المراكز الحضارية.
4. اللغة العربية (Arabic Language): النصوص القرائية والأدبية، النحو والصرف، وملخص دراسي لأجزاء قصة «أبو الفوارس: عنترة بن شداد».
5. اللغة الإنجليزية (English Language): خمس وحدات متكاملة تشمل التراث المصري، العمل التطوعي، الحقائق والأكاذيب، واستخدام التكنولوجيا.
6. الفلسفة والمنطق (Philosophy & Logic): مدخل إلى التفكير الفلسفي، التفكير المنطقي، التمييز بين الحجج الصحيحة والباطلة، والمغالطات الصورية وغير الصورية.

أمانة المحتوى: الدروس مبنية على دليل مذاكرة أصلي ومفصل لكل مادة يحدد الأهداف والمفاهيم دون حشو، مع حفظ مصدر كل فكرة وارتباطها بالمنهج الرسمي.
`,
    contentEn: `
Noäta covers the First Secondary Term 1 (2026–2027) curriculum structured into six primary subject families:

1. Integrated Science: Hydrosphere on Earth, physical & chemical water properties, aqueous solutions, and biological importance.
2. Mathematics: Complex numbers, quadratic root nature, relations between roots and coefficients, function signs, and inequalities.
3. History: Ancient Egyptian civilisation and ancient world history, civilisation shifts, and historic developments.
4. Arabic Language: Reading and literature texts, syntax, morphology, and the story of Antara ibn Shaddad.
5. English Language: Five units covering Egyptian heritage, community service, technology in schools, and reading skills.
6. Philosophy & Logic: The philosophical attitude, logical structure of arguments, and identifying formal and informal fallacies.

Content Provenance: All lessons are developed from an authentic detailed study pack with preserved source references, engineered to accompany official textbooks.
`,
  },
  {
    slug: "independent-tracks",
    category: "tracks",
    categoryAr: "المسارات اللغوية",
    categoryEn: "Language Tracks",
    titleAr: "المسارات المستقلة: العلوم والرياضيات (عربي / English)",
    titleEn: "Independent Language Tracks: Science & Mathematics (AR / EN)",
    summaryAr: "كيف تضمن المنصة استقلالية المسارين العربي والإنجليزي وعدم اختلاط التقدم.",
    summaryEn: "How independent language tracks ensure zero cross-contamination of student progress.",
    tags: ["tracks", "science", "math", "bilingual", "مسارات", "لغات"],
    contentAr: `
توفر منصة نقطة ثمانية مسارات تعليمية قابلة للاختيار، موزعة على المواد الستة:

- العلوم المتكاملة: مسار عربي (علوم متكاملة) ومسار إنجليزي (Integrated Science).
- الرياضيات: مسار عربي (الرياضيات) ومسار إنجليزي (Mathematics).
- التاريخ، اللغة العربية، اللغة الإنجليزية، الفلسفة والمنطق: مسار موحد لكل منها.

قواعد الفصل والاستقلالية:
1. عزل تام للمحتوى والأسئلة: لكل مسار لغوي معرف مسار خاص (Track ID) ووحدات ودروس وبنك أسئلة مستقل تمامًا.
2. عزل التقدم: إنجازك في المسار العربي لا يُحتسب تلقائيًا في المسار الإنجليزي؛ يمكنك دراسة أحدهما أو كليهما بحساب واحد مع تتبع منفصل لكل مسار.
3. استقلالية لغة الواجهة: تغيير لغة واجهة التطبيق بين العربية (RTL) والإنجليزية (LTR) هو خيار عرض، ولا يغير مسارك الدراسي المختار أو درجاتك.
`,
    contentEn: `
Noäta exposes eight selectable curriculum tracks across the six subject families:

- Integrated Science: Arabic-medium track and English-medium track.
- Mathematics: Arabic-medium track and English-medium track.
- History, Arabic Language, English, Philosophy & Logic: Single dedicated track each.

Isolation Guarantees:
1. Strict Content Isolation: Each language track has its own stable Track ID, units, lessons, and separate question banks.
2. Progress Isolation: Advancing in an Arabic track never counts toward the English track. Both can be studied independently on the same account.
3. UI Independence: Switching interface language (RTL / LTR) does not switch your enrolled curriculum track.
`,
  },
  {
    slug: "ai-companion-guide",
    category: "ai",
    categoryAr: "المساعد الذكي",
    categoryEn: "AI Companion",
    titleAr: "دليل استخدام مساعد Noäta AI في المذاكرة الفعالة",
    titleEn: "Noäta AI Study Companion: Features & Workflows",
    summaryAr: "تعرف على الأنماط الدراسية الأربعة: اشرح لي، اختبرني، بطاقات المراجعة، والتلخيص.",
    summaryEn: "Explore the four dedicated study modes: Explain, Quiz Me, Flashcards, and Summary.",
    tags: ["ai", "assistant", "flashcards", "quiz", "مساعد", "ذكاء"],
    contentAr: `
مساعد Noäta AI ليس مجرد روبوت محادثة؛ هو رفيق دراسي مقيد بالمنهج ومزود بأربعة أنماط عمل رئيسية:

1. نمط الشرح والتوضيح (Explain Step-by-Step):
اطلب شرح أي قانون أو مصطلح؛ سيقوم المساعد بتفكيك الفكرة إلى نقاط منطقية، مع توضيح العلاقة بين المتغيرات وضرب أمثلة عملية من واقع المنهج.

2. نمط الاختبار الفوري (Quiz Me):
يولد المساعد أسئلة اختيار من متعدد أو مقالية قصيرة تقيس فهمك للدرس المفتوح، مع تصحيح حتمي وتفسير فوري للأخطاء.

3. نمط بطاقات الاسترجاع (Flashcards Creator):
يمكنك تحويل أي إجابة أو مفهوم إلى بطاقة مراجعة تُضاف بضغطة زر إلى سطح بطاقات المراجعة في حسابك.

4. نمط التلخيص وملاحظات المراجعة (Summary & Notes):
يلخص المساعد الدروس الطويلة في جداول مقارنة ومخططات أفكار موجزة للمراجعة السريعة.
`,
    contentEn: `
Noäta AI is grounded in your active curriculum with four purpose-built study modes:

1. Step-by-Step Explanation Mode:
Breaks down difficult theorems and concepts into logical steps with syllabus-grounded examples.

2. Instant Quiz Generation:
Creates targeted objective drills with deterministic answer evaluation and immediate reasoning.

3. Flashcard Creation:
Turns any response into an active recall flashcard saved directly to your study decks.

4. High-Yield Summaries:
Condenses long chapters into comparison tables and cheat sheets for revision.
`,
  },
  {
    slug: "spaced-repetition-system",
    category: "lessons",
    categoryAr: "المراجعة والتكرار",
    categoryEn: "Spaced Repetition",
    titleAr: "كيف يعمل نظام المراجعة المجدولة والتكرار المتباعد؟",
    titleEn: "How Spaced Repetition (SM-2) Protects Your Memory",
    summaryAr: "شرح خوارزمية الجدولة الذكية للبطاقات والمفاهيم لضمان عدم نسيان ما درسته.",
    summaryEn: "How our SM-2 based interval algorithm schedules cards for permanent retention.",
    tags: ["spaced-repetition", "review", "memory", "sm2", "مراجعة", "تكرار"],
    contentAr: `
ينسى الإنسان معظم المعلومات التي يتعلمها خلال أيام ما لم يُراجعها في التوقيت المناسب (منحنى النسيان لإبنجهاوس).

كيف تُجدول نقطة مراجعاتك؟
- عند ممارسة أي تدريب أو دراسة بطاقة، تسجل المنصة مستوى استرجاعك (صعب / متوسط / سهل).
- المفاهيم التي تجد صعوبة فيها تُجدول للعودة بعد فترات قصيرة (ساعات أو اليوم التالي).
- المفاهيم الراسخة تتباعد فترات مراجعتها (بعد ٣ أيام، ثم أسبوع، ثم شهر).
- يعرض لك قسم «المراجعة» يوميًا عدد البطاقات المستحقة فقط، مما يوفر ساعات طويلة من إعادة قراءة الكتب بالكامل دون داعٍ.
`,
    contentEn: `
Without active recall, human memory decays rapidly over time.

Noäta Spaced Repetition Workflow:
- Each time you practise a card or question, your recall accuracy and speed update your mastery state.
- Difficult concepts return sooner (hours to 1 day).
- Solid concepts stretch outward (3 days, 1 week, 1 month).
- The Review center surfaces only what is due today, maximizing retention while saving study time.
`,
  },
  {
    slug: "account-and-privacy",
    category: "account",
    categoryAr: "الحساب والخصوصية",
    categoryEn: "Account & Privacy",
    titleAr: "إدارة الحساب، حفظ التقدم، وسياسة الخصوصية",
    titleEn: "Account Management, Progress Sync & Privacy Policy",
    summaryAr: "كل ما يتعلق ببيانات حسابك، تشفير الاتصال، وحماية خصوصية دراستك.",
    summaryEn: "Information on account security, cloud sync, and student privacy protection.",
    tags: ["account", "privacy", "security", "حساب", "خصوصية"],
    contentAr: `
في منصة نقطة، خصوصيتك وأمان بياناتك أساسيان:

- حفظ التقدم: كل درس تكمله أو اختبار تؤديه يُحفظ فوريًا في قاعدة بيانات آمنة، ويمكنك استئناف دراستك من أي جهاز.
- خصوصية المواد: المحادثات مع المساعد الذكي والبطاقات التي تنشئها خاصة بحسابك فقط ولا يراها أي مستخدم آخر بفضل سياسات أمان مستوى الصفوف (Row Level Security).
- تفضيلات العرض: يمكنك ضبط حجم الخطوط، والاتجاه، والمظهر، ومعدل الحركة في أي وقت من شاشة الإعدادات.
- استعادة الحساب: في حال نسيت كلمة المرور، يمكنك طلب رابط إعادة التعيين الآمن من صفحة الدخول.
`,
    contentEn: `
At Noäta, student privacy and security are paramount:

- Real-time Progress Sync: All completed lessons and quiz attempts sync safely to your account.
- Complete Data Isolation: AI conversations and custom cards are strictly protected by Row Level Security (RLS).
- Customization: Adjust font size, text direction, theme, and reduced-motion preferences in Settings.
- Account Recovery: Secure magic link and password reset flows are available from the login screen.
`,
  },
  {
    slug: "troubleshooting-support",
    category: "bug",
    categoryAr: "الدعم والمساعدة",
    categoryEn: "Support & Troubleshooting",
    titleAr: "استكشاف الأخطاء الشائعة وطرق التواصل مع الدعم",
    titleEn: "Troubleshooting Guide & Contacting Support",
    summaryAr: "خطوات حل المشكلات التقنية وكيفية إرسال تذكرة دعم فني لفريق المنصة.",
    summaryEn: "Troubleshooting steps and how to submit a support ticket to our team.",
    tags: ["support", "help", "troubleshooting", "tickets", "دعم", "مساعدة"],
    contentAr: `
إذا واجهتك أي مشكلة أثناء استخدام المنصة، اتبع الخطوات التالية:

١. تحديث الصفحة والتأكد من الاتصال بالإنترنت: تعمل المنصة بتقنيات متقدمة تتطلب اتصالاً مستقرًا لمزامنة التقدم.
٢. مسح الذاكرة المؤقتة (Cache): في حال لم تظهر التحديثات الأخيرة، جرب تحديث الصفحة بالضغط على Ctrl+F5 أو إفراغ الكاش.
٣. تقديم تذكرة دعم فني:
يمكنك ملء نموذج الدعم الفني أسفل مركز المساعدة. لا يظهر النجاح إلا بعد تأكيد حفظ التذكرة، ثم يحاول النظام إرسال إشعار إلى البريد المهيأ (mazenshazly011@gmail.com) ويعرض حالة الإرسال بصدق. تحصل التذكرة المحفوظة على كود مرجعي فريد للتتبع.
`,
    contentEn: `
If you encounter any difficulty while using Noäta:

1. Check Network Connectivity: Progress sync and AI operations require an active connection.
2. Hard Refresh: Use Ctrl+F5 or clear browser cache if a recently updated lesson appears unchanged.
3. Submit a Support Ticket:
Use our real support form below. A notification is immediately dispatched to our support inbox (mazenshazly011@gmail.com) and you will receive a unique ticket reference code (#NOATA-XXXXXX) for follow-up.
`,
  },
];
