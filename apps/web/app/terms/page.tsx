import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Terms of Use | شروط الاستخدام",
  description: "Understand Noata learning accounts, age expectations, AI limitations, achievements, virtual currency, content and safety rules.",
};

const sections: LegalSection[] = [
  {
    id: "agreement", titleAr: "قبول الشروط ونطاق الخدمة", titleEn: "Agreement and service scope",
    ar: [
      "تنظم هذه الشروط استخدام Noata كمنصة تعليمية للدروس والمراجعة والمهام والفصول والمكافآت والمساعد الذكي. باستخدام المنصة توافق على الالتزام بقواعد الحساب والمحتوى والأمان الواردة هنا وبسياسة الخصوصية.",
      "لا تزال بعض وظائف Noata قيد التطوير والاختبار، وقد تتغير أو تتوقف أثناء الصيانة. لا يُعد ظهور زر أو ميزة غير مفعّلة تعهدًا بإتاحتها فورًا.",
    ],
    en: [
      "These terms govern use of Noata as an educational service for lessons, revision, missions, classrooms, rewards and AI assistance. By using it, you agree to the account, content and safety requirements here and to the Privacy Policy.",
      "Some Noata capabilities remain in development or testing and may change or be unavailable during maintenance. A visible but inactive feature is not a promise of immediate availability.",
    ],
  },
  {
    id: "accounts", titleAr: "إنشاء الحساب وأمانه", titleEn: "Accounts and security",
    ar: [
      "قد تحتاج إلى حساب للوصول إلى السجل الشخصي والتقدّم والمكافآت والواجبات. قدم بيانات صحيحة تخصك، واستخدم بريدًا يمكنك الوصول إليه، واحتفظ بكلمة المرور وروابط التأكيد ورموز الاستعادة في سرية.",
      "يبدأ الحساب العادي بدور طالب. لا تمنح نفسك صلاحيات معلم أو مدير، ولا تحاول تجاوز ضوابط الوصول أو انتحال هوية شخص آخر. يمكن تقييد الحسابات المسيئة لحماية باقي المستخدمين.",
    ],
    en: [
      "You may need an account to access personal history, progress, rewards and assignments. Provide accurate information belonging to you, use an email address you control and keep passwords, confirmation links and recovery tokens private.",
      "Normal accounts start with the student role. Do not grant yourself teacher or administrator privileges, bypass access restrictions or impersonate others. Abusive accounts may be restricted to protect the service.",
    ],
  },
  {
    id: "minors", titleAr: "استخدام الطلاب القاصرين", titleEn: "Use by minors",
    ar: [
      "Noata موجهة للتعليم وقد تتضمن مستخدمين دون سن الرشد. ينبغي للطالب القاصر مراجعة الشروط مع ولي أمره واتباع متطلبات السن والموافقة السارية في بلده أو مدرسته.",
      "يجب على المشغل استكمال آليات الموافقات والعمر المناسبة قبل التوسع العام. لا تشارك معلومات أو صورًا حساسة لزملائك أو معلميك من دون ضرورة وإذن.",
    ],
    en: [
      "Noata supports education and may be used by people under the age of majority. Minor users should review these terms with a parent or guardian and follow applicable age and consent requirements in their country or school.",
      "The operator must complete appropriate consent and age controls before broad public launch. Do not share sensitive information or images of classmates or teachers without a legitimate reason and permission.",
    ],
  },
  {
    id: "learning", titleAr: "المناهج وجودة المحتوى", titleEn: "Learning content and accuracy",
    ar: [
      "هدف المحتوى دعم الدراسة، وليس استبدال المعلمين أو الجهات التعليمية الرسمية. قد يحتوي النظام على محتوى توضيحي أو تجريبي؛ يجب أن تظهر طبيعة هذا المحتوى وألا يُعرض على أنه منهج رسمي مُعتمد.",
      "قد تختلف التمارين وطريقة حساب الإتقان عن تقييمات المدرسة الفعلية. راجع المصادر الأصلية إذا كان السؤال يرتبط بدرجات رسمية أو قرارات ذات أثر مهم.",
    ],
    en: [
      "Content is intended to support studying, not replace teachers or official education authorities. The system may include illustrative or demo material, which should be clearly marked and not represented as an officially approved curriculum.",
      "Exercises and mastery calculations may differ from actual school assessments. Consult original authoritative sources for official grades or consequential decisions.",
    ],
  },
  {
    id: "ai", titleAr: "شروط استخدام Noata AI", titleEn: "Noata AI usage",
    ar: [
      "يساعد Noata AI في الشرح والمراجعة والكتابة وتنظيم المعرفة، لكنه قد ينتج أخطاء أو معلومات غير محدثة أو إجابات ناقصة. تحقق من المراجع المهمة ولا تستخدمه وحده لاتخاذ قرارات طبية أو قانونية أو مالية أو أمنية.",
      "لا ترفع مستندات لا تملك حق استخدامها أو بيانات شخصية حساسة تخص الآخرين. قد تُرسل مدخلات المهمة إلى مزود AI خارجي مثل Fanar لتنفيذ الطلب. تخضع حدود الاستهلاك والمزايا لتوافر المزود والبيئة المشغلة.",
      "لا تستخدم أدوات AI لانتحال الأشخاص أو تعريض الآخرين للضرر أو اختراق الأنظمة أو التحايل على الامتحانات عندما تمنع قواعد الجهة التعليمية ذلك.",
    ],
    en: [
      "Noata AI helps with explanation, revision, writing and organizing knowledge, but may produce mistakes, outdated statements or incomplete answers. Verify important sources and never rely on it alone for medical, legal, financial or safety-critical decisions.",
      "Do not upload documents you lack permission to use or sensitive personal data about others. Necessary task inputs may be sent to an external AI provider such as Fanar. Limits and capabilities depend on provider availability and environment configuration.",
      "Do not use AI tools to impersonate people, harm others, attack systems or cheat on assessments where school rules prohibit it.",
    ],
  },
  {
    id: "economy", titleAr: "الإنجازات وXP والعملات والهدايا", titleEn: "Achievements, XP, coins and rewards",
    ar: [
      "XP والعملات وصناديق المكافآت والمظاهر والشارات عناصر تعليمية رقمية داخل Noata، وليست نقودًا حقيقية أو عملة مشفرة أو استثمارًا أو وعدًا بجوائز مالية. أي Gems تُضاف لاحقًا ستكون عملة افتراضية داخلية ما لم تنص قواعد منشورة مختلفة على خلاف ذلك.",
      "تُمنح المكافآت بناءً على عمليات تعلم مؤهلة ومؤكدة من الخادم، مثل إكمال درس أو مهمة أو تحدٍّ لأول مرة وفق القواعد المعلنة. قد تختلف القيم بحسب نوع المهمة وصعوبتها، ولا تُمنح مكافآت مكررة لمحاولة استغلال إعادة تحميل الصفحة أو تكرار الطلب.",
      "يُمنع تزوير المحاولات أو استغلال الأخطاء أو استخدام حسابات وهمية لزيادة الرصيد. يمكن تصحيح أرصدة ناتجة عن أخطاء تقنية أو غش بعد المراجعة، مع الاحتفاظ بسجل معاملات قابل للتدقيق. لا يوجد وعد ثابت بأن كل تفاعل أو كل رسالة AI سيولّد عملات.",
    ],
    en: [
      "XP, coins, reward boxes, cosmetics and badges are educational digital items within Noata. They are not cash, cryptocurrency, investments or a promise of real-world prizes. Any future Gems are virtual in-platform currency unless separately published rules say otherwise.",
      "Rewards are granted for eligible server-confirmed learning work, such as first completion of a lesson, mission or challenge under the published rules. Values may vary by type and difficulty. Duplicate page refreshes or repeated requests do not earn duplicate rewards.",
      "Fabricating attempts, exploiting bugs or using fake accounts to inflate balances is prohibited. Balances caused by technical errors or abuse may be corrected after review with an auditable transaction record. Not every interaction or AI message necessarily earns currency.",
    ],
  },
  {
    id: "classrooms", titleAr: "الفصول والمعلمون والواجبات", titleEn: "Classrooms, teachers and assignments",
    ar: [
      "قد ينشئ المعلمون أو المدراء المحتوى والواجبات ويقيّمونها وفق صلاحياتهم. يجب على الطالب الالتزام بقواعد الفصل وعدم مشاركة بيانات الصف أو الواجبات الخاصة خارج النطاق المصرح به.",
      "لا يجوز للمعلم الاطلاع على صفوف لا يملك حق الوصول إليها أو كشف بيانات الطلاب دون غرض مشروع. يجب الإبلاغ عن أخطاء درجات الواجبات أو الوصول إلى البيانات عبر مسار الدعم المعلن.",
    ],
    en: [
      "Authorized teachers and administrators may create, assign and assess learning content. Students must follow classroom requirements and avoid sharing restricted classroom or assignment records outside permitted contexts.",
      "Teachers must not access classes they do not manage or disclose student information without a legitimate reason. Grading or access problems should be reported through published support channels.",
    ],
  },
  {
    id: "conduct", titleAr: "الاستخدام المسموح والمحظور", titleEn: "Acceptable and prohibited use",
    ar: [
      "استخدم المنصة للتعلّم والتواصل باحترام. يُحظر التحرش والإساءة والتحايل على الصلاحيات وجمع معلومات المستخدمين آليًا دون إذن ومحاولة تجاوز حدود الاستخدام أو العبث بنظام المكافآت.",
      "لا تُدخل برامج ضارة أو محتوى يهدد الآخرين، ولا تحاول الوصول إلى مفاتيح الإجابات السرية أو رموز الجلسات أو بيانات حسابات أخرى. يجوز تعليق وصولٍ ضار أثناء التحقيق في المخالفة.",
    ],
    en: [
      "Use the platform for learning and respectful interaction. Harassment, abuse, privilege escalation, unauthorized automated collection of user data, circumvention of limits and reward manipulation are prohibited.",
      "Do not upload malware or harmful content, seek hidden answer keys, session tokens or other accounts' data. Harmful access may be suspended while an incident is reviewed.",
    ],
  },
  {
    id: "intellectual-property", titleAr: "حقوق المحتوى والملفات", titleEn: "Content and intellectual property",
    ar: [
      "احتفظ بحقوقك في الملفات والأعمال الأصلية التي ترفعها، وتتحمل مسؤولية امتلاك الإذن اللازم لمشاركتها ومعالجتها. لا يمنحك الوصول للمنصة حق إعادة بيع محتواها أو نسخ مواد محمية خارج ما يسمح به القانون أو صاحب الحق.",
      "تُستخدم ملفاتك ومدخلاتك بالقدر اللازم لتقديم الخدمة والوظائف التي تطلبها وفق سياسة الخصوصية. يجب توضيح حقوق أي محتوى تابع لجهات ثالثة أو تلاوات أو مصادر تعليمية عند عرضه.",
    ],
    en: [
      "You retain rights to original material you upload and are responsible for having permission to submit and process it. Access to Noata does not authorize resale of its content or copying protected third-party materials beyond what their rights holders or the law allow.",
      "Your files and prompts are processed as necessary to deliver the features you request under the Privacy Policy. Third-party content, recitations and educational sources must have appropriate attribution and usage rights.",
    ],
  },
  {
    id: "availability", titleAr: "توفر الخدمة والتغييرات", titleEn: "Availability and updates",
    ar: [
      "قد تتوقف بعض الميزات مؤقتًا بسبب الصيانة أو أخطاء تقنية أو انقطاع خدمات خارجية، مثل البريد أو Supabase أو Fanar. سنعرض حالات الإخفاق بوضوح بدل الادعاء بإنجاز لم يُحفظ أو طلب AI لم يكتمل.",
      "قد يتم تطوير نظام المكافآت والقيم وقواعد المهام والمظهر أو تعديلها. يجب إعلان التغييرات الجوهرية المناسبة قبل سريانها، خصوصًا إذا مست أرصدة المستخدمين أو خصوصيتهم.",
    ],
    en: [
      "Features may temporarily fail due to maintenance, technical incidents or external-service outages such as email, Supabase or Fanar. The service should present failures clearly rather than claiming an unsaved achievement or unfinished AI request succeeded.",
      "Reward rules, values, missions and appearance may evolve. Material changes should be communicated appropriately before taking effect, especially those affecting balances or privacy.",
    ],
  },
  {
    id: "termination", titleAr: "الإيقاف والحذف والمسؤولية", titleEn: "Restrictions, deletion and responsibility",
    ar: [
      "قد يُقيّد وصول الحسابات التي تنتهك هذه الشروط أو تعرض الأمان للخطر، بعد تقييم مناسب. حذف الحساب والمحتوى المرتبط به يخضع لإجراءات الحذف والتخزين المبينة بسياسة الخصوصية، وقد لا يتوفر حذف ذاتي كامل بعد.",
      "تُقدَّم أدوات Noata التعليمية وفق الإمكانات المتاحة، ولا نضمن دقة كل محتوى أو استمرار الخدمات الخارجية بلا انقطاع. لا يحد أي بند من الحقوق التي يمنحها القانون الملزم للمستهلك أو الطالب.",
    ],
    en: [
      "Accounts that violate these terms or threaten security may be restricted following appropriate review. Account and related-content deletion follows the procedures described in the Privacy Policy; complete self-service deletion may not yet be available.",
      "Noata's educational tools are provided subject to available capabilities, without guaranteeing every answer's accuracy or uninterrupted external services. Nothing here removes mandatory consumer or learner rights under applicable law.",
    ],
  },
  {
    id: "updates", titleAr: "التواصل وتحديث الشروط", titleEn: "Contact and changes",
    ar: [
      "استخدم مركز المساعدة للاستفسارات العامة. قبل الإطلاق العام يجب توفير قناة دعم وخصوصية رسمية قابلة للوصول والتواصل بشأن الحسابات والبيانات. لا ترسل مفاتيح أو رموزًا حساسة عند تقديم طلب دعم.",
      "عند إجراء تعديل مؤثر على هذه الشروط، ينبغي تحديث تاريخها وإشعار المستخدمين بالطريقة المناسبة. واصل استخدام الخدمة بعد قراءة النسخة التي تنطبق على حسابك.",
    ],
    en: [
      "Use the Help Center for general questions. Before public release, the operator must provide an accessible official support/privacy contact channel for account and data requests. Never send sensitive keys or tokens in support requests.",
      "Material updates should change the document's revision date and be communicated appropriately. Review the version applicable to your use of the service.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      kind="terms"
      titleAr="قواعد واضحة لتعلّم أفضل"
      titleEn="Clear terms for better learning"
      summaryAr="حقوقك ومسؤولياتك في Noata، من الحساب والمحتوى إلى الذكاء الاصطناعي ونقاط XP والعملات والصناديق الرقمية."
      summaryEn="Your rights and responsibilities on Noata, covering accounts, content, AI, XP, virtual currency and reward boxes."
      sections={sections}
    />
  );
}
